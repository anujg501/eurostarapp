import { Router, urlencoded } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { config } from '../config';
import { asyncHandler, ok, fail, failValidation } from '../util/http';
import { getSetting, KEYS } from '../services/settings';
import { AuthedRequest, authenticate, requireRole, requireInternal, optionalAuth } from '../auth/middleware';
import { focusFor, imageIndex, siteDigest, siteKnowledgeStats } from '../services/siteKnowledge';

export const assistantRouter = Router();

// GET /assistant/media?key=laser|white|round — the product photo behind a
// catalogue key, served as a real image.
//
// The office uploads these as data URLs in a settings row, which is fine for
// the shop (it renders them inline) but useless to Mira: she can only hand a
// customer a link. This turns the stored image into a URL that works in a chat
// bubble, an email or WhatsApp. Public, like the shop's own product photos.
assistantRouter.get(
  '/media',
  asyncHandler(async (req, res) => {
    const key = typeof req.query.key === 'string' ? req.query.key.trim() : '';
    if (!key) return fail(res, 400, 'Which image? Pass ?key=category|colour|shape');

    // Resolved against every image the office has uploaded — product photos,
    // colour photos and swatches, category and shape thumbnails, and Mira's own
    // media library — not just the two maps this route started with.
    const { byKey } = await imageIndex();
    let dataUrl = byKey.get(key);

    // Be forgiving about how the key arrives: case, spacing, and falling back
    // from "category|colour|shape" to the colour, then the category. A customer
    // asking for a shape we have no photo of should still see the colour.
    if (!dataUrl) {
      const lower = key.toLowerCase();
      for (const [k, v] of byKey) {
        if (k.toLowerCase() === lower) { dataUrl = v; break; }
      }
    }
    if (!dataUrl && key.includes('|')) {
      const parts = key.split('|');
      while (parts.length > 1 && !dataUrl) {
        parts.pop();
        dataUrl = byKey.get(parts.join('|'));
      }
    }
    if (!dataUrl) return fail(res, 404, 'No image for that key');

    const m = /^data:([^;,]+);base64,(.+)$/i.exec(dataUrl);
    if (!m) return fail(res, 415, 'That image is not stored in a form we can serve');
    const buf = Buffer.from(m[2], 'base64');
    res.setHeader('Content-Type', m[1]);
    // Keyed by content the office replaces in place, so revalidate rather than
    // letting a stale photo live in a customer's cache for a week.
    res.setHeader('Cache-Control', 'public, max-age=60, must-revalidate');
    return res.end(buf);
  })
);

// GET /assistant/knowledge — what Mira currently knows about the shop, and when
// she read it. Staff-only: it is a diagnostic for "why did she say that?", not
// something to expose to customers.
assistantRouter.get(
  '/knowledge',
  authenticate,
  requireInternal,
  asyncHandler(async (_req, res) => ok(res, { ...(await siteKnowledgeStats()), digest: await siteDigest() }))
);

async function getConfig() {
  return prisma.assistantConfig.upsert({
    where: { id: 'default' },
    create: { id: 'default' },
    update: {},
  });
}

// rules/knowledge/examples are stored as JSON strings but exposed as the lists
// the client uses (rules: string[]; knowledge: {title,text}[]; examples: {q,a}[]).
function parseList(text: string): unknown[] {
  try {
    const v = JSON.parse(text);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function serialiseConfig(c: any) {
  return {
    enabled: c.enabled,
    instructions: c.instructions,
    rules: parseList(c.rules),
    knowledge: parseList(c.knowledge),
    examples: parseList(c.examples),
  };
}

// GET /assistant/config — the Mira setup (instructions, rules, knowledge…).
assistantRouter.get(
  '/config',
  asyncHandler(async (_req, res) => {
    return ok(res, serialiseConfig(await getConfig()));
  })
);

// PUT /assistant/config — office/admin edits Mira's brain.
const cfgSchema = z.object({
  enabled: z.boolean().optional(),
  instructions: z.string().optional(),
  rules: z.array(z.string()).optional(),
  knowledge: z.array(z.object({ title: z.string(), text: z.string() })).optional(),
  examples: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
});

assistantRouter.put(
  '/config',
  authenticate,
  // This rewrites the instructions/rules/knowledge Mira answers customers with.
  // Left open, a stranger could put words in the assistant's mouth. Staff only.
  requireInternal,
  asyncHandler(async (req, res) => {
    const parsed = cfgSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;
    const data = {
      ...(d.enabled != null ? { enabled: d.enabled } : {}),
      ...(d.instructions != null ? { instructions: d.instructions } : {}),
      ...(d.rules != null ? { rules: JSON.stringify(d.rules) } : {}),
      ...(d.knowledge != null ? { knowledge: JSON.stringify(d.knowledge) } : {}),
      ...(d.examples != null ? { examples: JSON.stringify(d.examples) } : {}),
    };
    const c = await prisma.assistantConfig.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...data },
      update: data,
    });
    return ok(res, serialiseConfig(c));
  })
);

// POST /assistant/chat — send a message, get Mira's reply.
const chatSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1),
  app: z.enum(['sales', 'crm', 'lms']).optional(),
  who: z.string().optional(),
  contact: z.string().optional(),
  cust: z.string().optional(),
  // Facts only the calling app knows — who is signed in, their order history,
  // the sales framing for that surface. Capped: this is context, not a second
  // set of instructions, and the office's own configuration still wins.
  context: z.string().max(20000).optional(),
});

assistantRouter.post(
  '/chat',
  optionalAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const { sessionId, message, app = 'sales', who, contact, cust, context } = parsed.data;

    const cfg = await getConfig();
    await prisma.chatLog.create({ data: { sessionId, app, role: 'user', message, who, contact, cust } });

    const reply = await generateReply(message, cfg, context);

    await prisma.chatLog.create({ data: { sessionId, app, role: 'assistant', message: reply, who, contact, cust } });
    return ok(res, { reply });
  })
);

// POST /assistant/chatlog — the apps push a CLEAN question/answer turn here so
// staff can review real conversations in Mira Admin from any device (localStorage
// chat logs only ever lived on the device the chat happened on). Stored as two
// rows with roles 'q'/'a', kept separate from the raw /chat rows above.
const chatLogSchema = z.object({
  app: z.enum(['sales', 'crm', 'lms']).default('sales'),
  sessionId: z.string().min(1),
  who: z.string().optional(),
  contact: z.string().optional(),
  cust: z.string().optional(),
  q: z.string().min(1),
  a: z.string().min(1),
});

assistantRouter.post(
  '/chatlog',
  optionalAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = chatLogSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const { app, sessionId, who, contact, cust, q, a } = parsed.data;
    await prisma.chatLog.create({ data: { sessionId, app, role: 'q', message: q, who, contact, cust } });
    await prisma.chatLog.create({ data: { sessionId, app, role: 'a', message: a, who, contact, cust } });
    return ok(res, { ok: true });
  })
);

// GET /assistant/chatlog?app=sales|crm|lms — clean turns for the Mira Admin
// review screens, paired back into {q, a} and grouped-ready. Internal staff only.
assistantRouter.get(
  '/chatlog',
  authenticate,
  requireInternal,
  asyncHandler(async (req, res) => {
    const app = typeof req.query.app === 'string' ? req.query.app : undefined;
    const rows = await prisma.chatLog.findMany({
      where: { role: { in: ['q', 'a'] }, ...(app ? { app } : {}) },
      orderBy: { createdAt: 'asc' },
      take: 2000,
    });
    const pendingQ: Record<string, any> = {};
    const turns: any[] = [];
    for (const r of rows) {
      if (r.role === 'q') {
        pendingQ[r.sessionId] = r;
      } else if (r.role === 'a') {
        const qr = pendingQ[r.sessionId];
        if (qr) {
          const who = qr.who || r.who || 'Customer';
          turns.push({
            sessionId: r.sessionId,
            app: r.app,
            who,
            // Staff role for the CRM/LMS review filters ("Sales Rep (CRM)" -> "Sales Rep").
            role: who.replace(/ \((CRM|LMS)\)$/, ''),
            cust: qr.cust || r.cust || '',
            contact: qr.contact || r.contact || '',
            q: qr.message,
            a: r.message,
            ts: new Date(qr.createdAt).getTime(),
          });
          delete pendingQ[r.sessionId];
        }
      }
    }
    return ok(res, turns);
  })
);

// POST /assistant/whatsapp — Twilio inbound WhatsApp webhook. A customer messages
// your WhatsApp number; Mira replies with the same brain as the website chat.
// Twilio sends form-encoded fields (From, Body) and expects a TwiML response.
assistantRouter.post(
  '/whatsapp',
  urlencoded({ extended: false }),
  asyncHandler(async (req, res) => {
    const from = String((req.body && req.body.From) || ''); // "whatsapp:+91..."
    const body = String((req.body && req.body.Body) || '').trim();
    const contact = from.replace(/^whatsapp:/, '');
    const sessionId = 'wa-' + (contact || 'unknown');

    let reply = "Hi! I'm Mira from Eurostar. How can I help you today?";
    if (body) {
      const cfg = await getConfig();
      await prisma.chatLog.create({ data: { sessionId, app: 'sales', role: 'user', message: body, who: 'WhatsApp', contact } });
      reply = await generateReply(body, cfg);
      await prisma.chatLog.create({ data: { sessionId, app: 'sales', role: 'assistant', message: reply, who: 'WhatsApp', contact } });
    }

    const escaped = reply.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    res.set('content-type', 'text/xml');
    return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`);
  })
);

// GET /assistant/chat/:sessionId — chat history.
assistantRouter.get(
  '/chat/:sessionId',
  asyncHandler(async (req, res) => {
    const logs = await prisma.chatLog.findMany({
      where: { sessionId: req.params.sessionId },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });
    return ok(res, logs.map((l) => ({ role: l.role, message: l.message, ts: l.createdAt })));
  })
);

// --- Reply generation -------------------------------------------------------
// If an ANTHROPIC_API_KEY is configured we call the real Claude model with the
// admin-managed Mira instructions. Otherwise we fall back to a safe canned reply
// so the feature still works during development.
const NOT_CONNECTED =
  "Hi, I'm Mira. The assistant isn't fully connected yet, but a team member will help you shortly. Meanwhile you can browse the catalogue and place your order.";
const REPLY_ERROR = "I'm having trouble replying right now. Please try again in a moment.";
const DEFAULT_SYSTEM = 'You are Mira, a helpful assistant for Eurostar gemstone wholesale customers.';

// The office's own words come first — they are the policy. The live shop data
// follows as fact, and the two are labelled so the model can tell an
// instruction from a catalogue entry.
function buildSystemPrompt(
  cfg: { instructions: string; rules: string; knowledge: string; examples: string },
  live?: string
): string {
  const rules = parseList(cfg.rules) as string[];
  const knowledge = parseList(cfg.knowledge) as { title: string; text: string }[];
  const examples = parseList(cfg.examples) as { q: string; a: string }[];

  return [
    cfg.instructions && `Instructions:\n${cfg.instructions}`,
    rules.length && `Rules:\n${rules.map((r) => `- ${r}`).join('\n')}`,
    knowledge.length && `Knowledge:\n${knowledge.map((k) => `${k.title}: ${k.text}`).join('\n')}`,
    examples.length && `Examples:\n${examples.map((e) => `Q: ${e.q}\nA: ${e.a}`).join('\n\n')}`,
    live,
  ]
    .filter(Boolean)
    .join('\n\n');
}

async function generateReply(
  message: string,
  cfg: { instructions: string; rules: string; knowledge: string; examples: string },
  context?: string
): Promise<string> {
  // Read the shop as it stands right now — categories, colours, shapes, the
  // published prices, what is sold out — plus the exact priced rows for
  // whatever was just asked. Without this Mira only knew what somebody had
  // typed into her Knowledge box, so every catalogue change had to be copied
  // over by hand and she answered on stale facts in between.
  let live = '';
  try {
    live = `${await siteDigest()}${await focusFor(message)}`;
  } catch {
    // A catalogue read failing must not take the assistant down with it; she
    // falls back to the office's own knowledge.
  }
  const fromApp = context ? `Context from the app the customer is using:\n${context}` : '';
  const systemPrompt = buildSystemPrompt(cfg, [fromApp, live].filter(Boolean).join('\n\n')) || DEFAULT_SYSTEM;
  return config.assistant.provider === 'gemini'
    ? replyWithGemini(message, systemPrompt)
    : replyWithAnthropic(message, systemPrompt);
}

// Anthropic (Claude) — used when ANTHROPIC_API_KEY is set and provider is anthropic.
async function replyWithAnthropic(message: string, systemPrompt: string): Promise<string> {
  if (!config.assistant.apiKey) return NOT_CONNECTED;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': config.assistant.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.assistant.model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    }),
  });

  if (!resp.ok) {
    // The visitor gets a calm apology, but the reason has to reach the server
    // log — swallowing it left "having trouble replying" as the only clue for
    // an expired key, a bad model name or an exhausted quota alike.
    console.error(`[mira] Anthropic ${resp.status}: ${(await resp.text().catch(() => '')).slice(0, 400)}`);
    return REPLY_ERROR;
  }
  const data: any = await resp.json();
  return data?.content?.[0]?.text ?? "I didn't catch that — could you rephrase?";
}

// Google Gemini — used when GEMINI_API_KEY is set (provider auto-switches to gemini).
async function replyWithGemini(message: string, systemPrompt: string): Promise<string> {
  if (!config.assistant.geminiKey) return NOT_CONNECTED;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.assistant.geminiModel}:generateContent`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': config.assistant.geminiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: message }] }],
      generationConfig: { maxOutputTokens: 1024 },
    }),
  });

  if (!resp.ok) {
    // Same reasoning as the Anthropic branch: log why, answer politely.
    console.error(`[mira] Gemini ${resp.status}: ${(await resp.text().catch(() => '')).slice(0, 400)}`);
    return REPLY_ERROR;
  }
  const data: any = await resp.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts) ? parts.map((p: any) => p?.text ?? '').join('').trim() : '';
  return text || "I didn't catch that — could you rephrase?";
}

// GET /assistant/chatlogs?app=sales|crm|lms — transcripts per app (Mira Admin).
assistantRouter.get(
  '/chatlogs',
  authenticate,
  requireRole('office'),
  asyncHandler(async (req, res) => {
    const app = typeof req.query.app === 'string' ? req.query.app : undefined;
    const logs = await prisma.chatLog.findMany({
      where: { ...(app ? { app } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return ok(res, logs.map((l) => ({
      sessionId: l.sessionId,
      app: l.app,
      role: l.role,
      message: l.message,
      who: l.who,
      contact: l.contact,
      cust: l.cust,
      ts: l.createdAt,
    })));
  })
);
