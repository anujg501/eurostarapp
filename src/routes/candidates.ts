import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { prisma } from '../db';
import { asyncHandler, fail, ok, failValidation } from '../util/http';
import { AuthedRequest, authenticate, requireCandidate, requireInternal, requireRole } from '../auth/middleware';
import { ALLOWED_DOC_MIME, MAX_DOC_BYTES, getPrivateFile, putPrivateFile } from '../services/storage';

export const candidatesRouter = Router();

// 'registered' = account created, Apply Now form not submitted yet.
const STAGES = ['registered', 'applied', 'screening', 'training', 'test', 'recommended', 'hired', 'rejected'] as const;

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
  requireInternal,
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

// --- The candidate's own record --------------------------------------------
// Everything above is staff-only. These two let an applicant read and submit
// their OWN application from the mobile app, resolved from the signed-in user
// rather than an id in the URL, so one candidate can never touch another's.
// Declared before "/:id" or Express would match "me" as an id.

async function ownCandidate(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.phone) return null;
  return prisma.candidate.findFirst({ where: { phone: user.phone } });
}

// Not requireRole('candidate'): an applicant who already had a customer account
// keeps role 'customer', and every handler below resolves the record from the
// signed-in user's own phone, so ownership — not the role string — is what
// actually scopes these routes.
const candidateOnly = [authenticate, requireCandidate];

// GET /candidates/me — used by the dashboard to show the real stage.
candidatesRouter.get(
  '/me',
  ...candidateOnly,
  asyncHandler(async (req: AuthedRequest, res) => {
    const c = await ownCandidate(req.user!.sub);
    if (!c) return fail(res, 404, 'No application found for this account');
    return ok(res, serialise(c));
  })
);

// POST /candidates/me/apply — submit the Apply Now form.
const applySchema = z.object({
  city: z.string().min(1),
  state: z.string().min(1),
  exp: z.string().min(1),
  source: z.string().min(1),
});

candidatesRouter.post(
  '/me/apply',
  ...candidateOnly,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = applySchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const { city, state, exp, source } = parsed.data;

    const existing = await ownCandidate(req.user!.sub);
    if (!existing) return fail(res, 404, 'No application found for this account');

    // Submitting the form is what turns a registration into an application.
    // Never walk the pipeline backwards, though: someone already in training
    // who edits their city must not be dropped back to "applied".
    const beforeApplied = !existing.stage || existing.stage === 'registered' || existing.stage === 'applied';
    const stage = beforeApplied ? 'applied' : existing.stage;

    let blob: Record<string, unknown> = {};
    if (existing.data) { try { blob = JSON.parse(existing.data); } catch { blob = {}; } }
    blob.applied = blob.applied || new Date().toISOString().slice(0, 10);

    const c = await prisma.candidate.update({
      where: { id: existing.id },
      data: { city, state, exp, source, stage, data: JSON.stringify(blob) },
    });
    return ok(res, serialise(c));
  })
);

// POST /candidates/me/resume — the applicant attaches their CV.
const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOC_BYTES, files: 1 },
});

candidatesRouter.post(
  '/me/resume',
  ...candidateOnly,
  (req, res, next) => {
    resumeUpload.single('file')(req, res, (err: unknown) => {
      // Multer's own errors (too large, too many files) arrive here and would
      // otherwise surface as an unhandled 500.
      if (err) {
        const msg = (err as { code?: string }).code === 'LIMIT_FILE_SIZE'
          ? 'That file is larger than 5MB'
          : 'Could not read the uploaded file';
        return fail(res, 400, msg);
      }
      return next();
    });
  },
  asyncHandler(async (req: AuthedRequest, res) => {
    const file = (req as unknown as { file?: Express.Multer.File }).file;
    if (!file) return fail(res, 400, 'No file was uploaded');
    if (!ALLOWED_DOC_MIME.includes(file.mimetype)) {
      return fail(res, 400, 'Upload a PDF or Word document');
    }

    const existing = await ownCandidate(req.user!.sub);
    if (!existing) return fail(res, 404, 'No application found for this account');

    const { key, bytes } = await putPrivateFile(file.buffer, file.mimetype, 'resumes');

    let blob: Record<string, unknown> = {};
    if (existing.data) { try { blob = JSON.parse(existing.data); } catch { blob = {}; } }
    blob.resumeKey = key;
    blob.resumeName = file.originalname?.slice(0, 120) || 'resume';
    blob.resumeMime = file.mimetype;
    blob.resumeSize = bytes;
    blob.resumeAt = new Date().toISOString();

    const c = await prisma.candidate.update({
      where: { id: existing.id },
      data: { data: JSON.stringify(blob) },
    });
    return ok(res, serialise(c));
  })
);

// GET /candidates/:id/resume — the office downloads the CV. Never a public URL:
// the stored key is private and only ever read back through this check.
// Deliberately office/admin rather than requireStaff — a CV is personal data
// belonging to an applicant, and field reps have no reason to read one.
candidatesRouter.get(
  '/:id/resume',
  authenticate,
  requireRole('office', 'admin'),
  asyncHandler(async (req, res) => {
    const c = await prisma.candidate.findFirst({
      where: { OR: [{ id: req.params.id }, { candId: req.params.id }] },
    });
    if (!c) return fail(res, 404, 'Candidate not found');

    let blob: Record<string, any> = {};
    if (c.data) { try { blob = JSON.parse(c.data); } catch { blob = {}; } }
    if (!blob.resumeKey) return fail(res, 404, 'This candidate has not attached a CV');

    const buf = await getPrivateFile(blob.resumeKey);
    res.setHeader('Content-Type', blob.resumeMime || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${String(blob.resumeName || 'resume').replace(/["\r\n]/g, '')}"`
    );
    return res.send(buf);
  })
);

// GET /candidates/:id
candidatesRouter.get(
  '/:id',
  authenticate,
  requireInternal,
  asyncHandler(async (req, res) => {
    const c = await prisma.candidate.findUnique({ where: { id: req.params.id } });
    if (!c) return fail(res, 404, 'Candidate not found');
    return ok(res, serialise(c));
  })
);

candidatesRouter.post(
  '/',
  authenticate,
  requireInternal,
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
  requireInternal,
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

function serialiseModule(m: {
  id: string;
  title: string;
  summary: string | null;
  videoUrl: string | null;
  videoDuration: string | null;
  checklist: string;
  mandatory: boolean;
  sortOrder: number;
  active: boolean;
}) {
  return {
    id: m.id,
    title: m.title,
    summary: m.summary,
    videoUrl: m.videoUrl,
    videoDuration: m.videoDuration,
    checklist: safeList(m.checklist),
    mandatory: m.mandatory,
    sortOrder: m.sortOrder,
    active: m.active,
  };
}

// GET /modules — training modules candidates actually see (active only, no
// auth). Used by both the web and mobile Training screens.
modulesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const modules = await prisma.trainingModule.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
    return ok(res, modules.map(serialiseModule));
  })
);

// GET /modules/all — office/admin management view: everything, including
// modules an admin has switched off, so a hidden module doesn't just vanish
// from the editor with no way to find and re-enable it.
modulesRouter.get(
  '/all',
  authenticate,
  requireInternal,
  asyncHandler(async (_req, res) => {
    const modules = await prisma.trainingModule.findMany({ orderBy: { sortOrder: 'asc' } });
    return ok(res, modules.map(serialiseModule));
  })
);

// PUT /modules — office/admin upsert a training module.
const moduleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  summary: z.string().optional(),
  videoUrl: z.string().optional(),
  videoDuration: z.string().optional(),
  checklist: z.array(z.string()).optional(),
  mandatory: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

modulesRouter.put(
  '/',
  authenticate,
  requireInternal,
  asyncHandler(async (req, res) => {
    const parsed = moduleSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;
    const data = {
      title: d.title,
      summary: d.summary,
      videoUrl: d.videoUrl,
      videoDuration: d.videoDuration,
      ...(d.checklist ? { checklist: JSON.stringify(d.checklist) } : {}),
      ...(d.mandatory != null ? { mandatory: d.mandatory } : {}),
      ...(d.sortOrder != null ? { sortOrder: d.sortOrder } : {}),
      ...(d.active != null ? { active: d.active } : {}),
    };
    const m = d.id
      ? await prisma.trainingModule.update({ where: { id: d.id }, data })
      : await prisma.trainingModule.create({ data });
    return ok(res, serialiseModule(m), d.id ? 200 : 201);
  })
);

// DELETE /modules/:id — office/admin removes a module for good (not just a
// soft "active: false" hide — Remove in the editor means gone).
modulesRouter.delete(
  '/:id',
  authenticate,
  requireInternal,
  asyncHandler(async (req, res) => {
    const existing = await prisma.trainingModule.findUnique({ where: { id: req.params.id } });
    if (!existing) return fail(res, 404, 'Module not found');
    await prisma.trainingModule.delete({ where: { id: req.params.id } });
    return ok(res, { deleted: true });
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
