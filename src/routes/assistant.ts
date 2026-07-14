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

// GET /assistant/config — the Mira setup (instructions, rules, knowledge…).
assistantRouter.get(
  '/config',
  asyncHandler(async (_req, res) => {
    const c = await getConfig();
    return ok(res, {
      enabled: c.enabled,
      instructions: c.instructions,
      rules: c.rules,
      knowledge: c.knowledge,
      examples: c.examples,
    });
  })
);

// PUT /assistant/config — office/admin edits Mira's brain.
const cfgSchema = z.object({
  enabled: z.boolean().optional(),
  instructions: z.string().optional(),
  rules: z.string().optional(),
  knowledge: z.string().optional(),
  examples: z.string().optional(),
});

assistantRouter.put(
  '/config',
  authenticate,
  requireRole('office'),
  asyncHandler(async (req, res) => {
    const parsed = cfgSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const c = await prisma.assistantConfig.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...parsed.data },
      update: parsed.data,
    });
    return ok(res, {
      enabled: c.enabled,
      instructions: c.instructions,
      rules: c.rules,
      knowledge: c.knowledge,
      examples: c.examples,
    });
  })
);

// POST /assistant/chat — send a message, get Mira's reply.
const chatSchema = z.object({ sessionId: z.string().min(1), message: z.string().min(1) });

assistantRouter.post(
  '/chat',
  optionalAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const { sessionId, message } = parsed.data;

    const cfg = await getConfig();
    await prisma.chatLog.create({ data: { sessionId, role: 'user', message } });

    const reply = await generateReply(message, cfg);

    await prisma.chatLog.create({ data: { sessionId, role: 'assistant', message: reply } });
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

  const systemPrompt = [
    cfg.instructions && `Instructions:\n${cfg.instructions}`,
    cfg.rules && `Rules:\n${cfg.rules}`,
    cfg.knowledge && `Knowledge:\n${cfg.knowledge}`,
    cfg.examples && `Examples:\n${cfg.examples}`,
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
