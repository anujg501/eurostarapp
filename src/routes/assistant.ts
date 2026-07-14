import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { config } from '../config';
import { asyncHandler, ok, failValidation } from '../util/http';
import { AuthedRequest, authenticate, requireRole, optionalAuth } from '../auth/middleware';

export const assistantRouter = Router();

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
  requireRole('office'),
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
});

assistantRouter.post(
  '/chat',
  optionalAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const { sessionId, message, app = 'sales', who, contact, cust } = parsed.data;

    const cfg = await getConfig();
    await prisma.chatLog.create({ data: { sessionId, app, role: 'user', message, who, contact, cust } });

    const reply = await generateReply(message, cfg);

    await prisma.chatLog.create({ data: { sessionId, app, role: 'assistant', message: reply, who, contact, cust } });
    return ok(res, { reply });
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
async function generateReply(message: string, cfg: { instructions: string; rules: string; knowledge: string; examples: string }): Promise<string> {
  if (!config.assistant.apiKey) {
    return "Hi, I'm Mira. The assistant isn't fully connected yet, but a team member will help you shortly. Meanwhile you can browse the catalogue and place your order.";
  }

  const rules = parseList(cfg.rules) as string[];
  const knowledge = parseList(cfg.knowledge) as { title: string; text: string }[];
  const examples = parseList(cfg.examples) as { q: string; a: string }[];

  const systemPrompt = [
    cfg.instructions && `Instructions:\n${cfg.instructions}`,
    rules.length && `Rules:\n${rules.map((r) => `- ${r}`).join('\n')}`,
    knowledge.length && `Knowledge:\n${knowledge.map((k) => `${k.title}: ${k.text}`).join('\n')}`,
    examples.length && `Examples:\n${examples.map((e) => `Q: ${e.q}\nA: ${e.a}`).join('\n\n')}`,
  ]
    .filter(Boolean)
    .join('\n\n');

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
      system: systemPrompt || 'You are Mira, a helpful assistant for Eurostar gemstone wholesale customers.',
      messages: [{ role: 'user', content: message }],
    }),
  });

  if (!resp.ok) {
    return "I'm having trouble replying right now. Please try again in a moment.";
  }
  const data: any = await resp.json();
  return data?.content?.[0]?.text ?? "I didn't catch that — could you rephrase?";
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
