import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { asyncHandler, fail, ok, failValidation } from '../util/http';
import { authenticate, requireStaff } from '../auth/middleware';

export const candidatesRouter = Router();

const STAGES = ['applied', 'screening', 'training', 'test', 'recommended', 'hired', 'rejected'] as const;

function serialise(c: any) {
  let data: any = {};
  if (c.data) { try { data = JSON.parse(c.data); } catch { data = {}; } }
  return {
    id: c.id,
    candId: c.candId,
    name: c.name,
    email: c.email,
    phone: c.phone,
    city: c.city,
    state: c.state,
    source: c.source,
    stage: c.stage,
    score: c.score,
    exp: c.exp,
    repId: c.repId,
    // The rich state (screening, attempts, watched, onboarding…) spread back
    // so the UI sees a flat candidate exactly like its seed shape.
    ...data,
    createdAt: c.createdAt,
  };
}

// Split an incoming candidate into the real columns and the JSON blob for
// everything else (the LMS UI sends the whole flat object).
const CANDIDATE_COLUMNS = ['name', 'email', 'phone', 'city', 'state', 'source', 'stage', 'score', 'exp', 'repId', 'candId'];
function splitCandidate(body: any) {
  const cols: any = {};
  const rest: any = {};
  for (const k of Object.keys(body || {})) {
    if (k === 'id' || k === 'createdAt' || k === 'updatedAt' || k === 'data') continue;
    if (CANDIDATE_COLUMNS.includes(k)) cols[k] = body[k];
    else rest[k] = body[k];
  }
  return { cols, data: JSON.stringify(rest) };
}

// GET /candidates?stage=… — the LMS recruitment pipeline.
candidatesRouter.get(
  '/',
  authenticate,
  requireStaff,
  asyncHandler(async (req, res) => {
    const stage = typeof req.query.stage === 'string' ? req.query.stage : undefined;
    const candidates = await prisma.candidate.findMany({
      where: { ...(stage ? { stage } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return ok(res, candidates.map(serialise));
  })
);

// GET /candidates/:id
candidatesRouter.get(
  '/:id',
  authenticate,
  requireStaff,
  asyncHandler(async (req, res) => {
    const c = await prisma.candidate.findUnique({ where: { id: req.params.id } });
    if (!c) return fail(res, 404, 'Candidate not found');
    return ok(res, serialise(c));
  })
);

candidatesRouter.post(
  '/',
  authenticate,
  requireStaff,
  asyncHandler(async (req, res) => {
    if (!req.body || typeof req.body.name !== 'string' || !req.body.name.trim()) {
      return fail(res, 400, 'Candidate name is required');
    }
    const { cols, data } = splitCandidate(req.body);
    // A client-supplied candId lets the LMS seed keep its "EC-1001" ids; dedupe
    // on it so re-seeding the same list doesn't create twins.
    if (cols.candId) {
      const dup = await prisma.candidate.findUnique({ where: { candId: cols.candId } });
      if (dup) return ok(res, serialise(dup), 200);
    }
    const c = await prisma.candidate.create({ data: { ...cols, data } });
    return ok(res, serialise(c), 201);
  })
);

// PUT /candidates/:id — persist any change (stage, score, screening, onboarding…).
candidatesRouter.put(
  '/:id',
  authenticate,
  requireStaff,
  asyncHandler(async (req, res) => {
    // A candidate may be addressed by its DB id or its display candId.
    const existing = await prisma.candidate.findFirst({
      where: { OR: [{ id: req.params.id }, { candId: req.params.id }] },
    });
    if (!existing) return fail(res, 404, 'Candidate not found');
    const { cols, data } = splitCandidate(req.body);
    const c = await prisma.candidate.update({ where: { id: existing.id }, data: { ...cols, data } });
    return ok(res, serialise(c));
  })
);

// GET/PUT /candidates/:id/practice?app=… — per-candidate practice checklist state.
candidatesRouter.get(
  '/:id/practice',
  authenticate,
  asyncHandler(async (req, res) => {
    const app = typeof req.query.app === 'string' ? req.query.app : 'default';
    const row = await prisma.practice.findUnique({
      where: { candidateId_app: { candidateId: req.params.id, app } },
    });
    let data: unknown = {};
    if (row) {
      try {
        data = JSON.parse(row.data);
      } catch {
        data = {};
      }
    }
    return ok(res, { candidateId: req.params.id, app, data });
  })
);

const practiceSchema = z.object({ app: z.string().default('default'), data: z.any() });

candidatesRouter.put(
  '/:id/practice',
  authenticate,
  asyncHandler(async (req, res) => {
    const parsed = practiceSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const { app, data } = parsed.data;
    const row = await prisma.practice.upsert({
      where: { candidateId_app: { candidateId: req.params.id, app } },
      create: { candidateId: req.params.id, app, data: JSON.stringify(data ?? {}) },
      update: { data: JSON.stringify(data ?? {}) },
    });
    return ok(res, { candidateId: req.params.id, app, data: JSON.parse(row.data) });
  })
);

// --- Training modules -------------------------------------------------------
export const modulesRouter = Router();

// GET /modules — training modules (with video links + checklists).
modulesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const modules = await prisma.trainingModule.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
    return ok(
      res,
      modules.map((m) => ({
        id: m.id,
        title: m.title,
        summary: m.summary,
        videoUrl: m.videoUrl,
        checklist: safeList(m.checklist),
        sortOrder: m.sortOrder,
      }))
    );
  })
);

// PUT /modules — office/admin upsert a training module.
const moduleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  summary: z.string().optional(),
  videoUrl: z.string().optional(),
  checklist: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

modulesRouter.put(
  '/',
  authenticate,
  requireStaff,
  asyncHandler(async (req, res) => {
    const parsed = moduleSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;
    const data = {
      title: d.title,
      summary: d.summary,
      videoUrl: d.videoUrl,
      ...(d.checklist ? { checklist: JSON.stringify(d.checklist) } : {}),
      ...(d.sortOrder != null ? { sortOrder: d.sortOrder } : {}),
      ...(d.active != null ? { active: d.active } : {}),
    };
    const m = d.id
      ? await prisma.trainingModule.update({ where: { id: d.id }, data })
      : await prisma.trainingModule.create({ data });
    return ok(res, { id: m.id, title: m.title, videoUrl: m.videoUrl, checklist: safeList(m.checklist) }, d.id ? 200 : 201);
  })
);

function safeList(text: string): unknown[] {
  try {
    const v = JSON.parse(text);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
