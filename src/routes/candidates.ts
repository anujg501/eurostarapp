import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { prisma } from '../db';
import { asyncHandler, fail, ok, failValidation } from '../util/http';
import { AuthedRequest, authenticate, requireCandidate, requireInternal, requireRole } from '../auth/middleware';
import {
  ALLOWED_DOC_MIME,
  ALLOWED_VIDEO_MIME,
  MAX_DOC_BYTES,
  MAX_VIDEO_BYTES,
  getPrivateFile,
  localVideoPath,
  putPrivateFile,
  putVideoFile,
  videoExtFor,
  videoUploadDir,
} from '../services/storage';
import { getSetting, setSetting } from '../services/settings';

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

// POST /candidates/me/test-result — record the candidate's own test result.
// The score itself is computed server-side (POST /questions/score); this writes
// it onto their pipeline row so the office actually sees it. Without this the
// result only ever existed in the candidate's browser.
const testResultSchema = z.object({
  score: z.number().int().min(0).max(100),
  passed: z.boolean(),
});

candidatesRouter.post(
  '/me/test-result',
  ...candidateOnly,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = testResultSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const { score, passed } = parsed.data;

    const existing = await ownCandidate(req.user!.sub);
    if (!existing) return fail(res, 404, 'No application found for this account');

    let blob: Record<string, any> = {};
    if (existing.data) { try { blob = JSON.parse(existing.data); } catch { blob = {}; } }
    const attempts = Array.isArray(blob.attempts) ? blob.attempts : [];
    attempts.push({ n: attempts.length + 1, score, passed, date: new Date().toISOString().slice(0, 10) });
    blob.attempts = attempts;
    blob.testConsumed = true;

    // Passing moves them into the approval queue. Failing never walks the
    // stage backwards — the office decides what happens next.
    const stage = passed ? 'recommended' : existing.stage;

    const c = await prisma.candidate.update({
      where: { id: existing.id },
      data: { score, stage, data: JSON.stringify(blob) },
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

// POST /modules/:id/video — upload the module's video file.
//
// Streamed straight to disk by multer: a training video is hundreds of MB, and
// the memory storage used for CVs would hold all of it in RAM per upload.
const videoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      try { cb(null, videoUploadDir()); } catch (e) { cb(e as Error, ''); }
    },
    // The name is generated here, never taken from the upload — a
    // caller-supplied filename is a path-traversal risk and would let one
    // upload silently overwrite another.
    filename: (_req, file, cb) =>
      cb(null, `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${videoExtFor(file.mimetype)}`),
  }),
  limits: { fileSize: MAX_VIDEO_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_VIDEO_MIME.includes(file.mimetype)) {
      return cb(new Error('UNSUPPORTED_TYPE'));
    }
    return cb(null, true);
  },
});

modulesRouter.post(
  '/:id/video',
  authenticate,
  requireInternal,
  (req, res, next) => {
    videoUpload.single('file')(req, res, (err: unknown) => {
      if (err) {
        const e = err as { code?: string; message?: string };
        const msg = e.code === 'LIMIT_FILE_SIZE'
          ? `That video is larger than ${Math.round(MAX_VIDEO_BYTES / (1024 * 1024))}MB`
          : e.message === 'UNSUPPORTED_TYPE'
            ? 'Upload an MP4, WebM or MOV video'
            : 'Could not read the uploaded video';
        return fail(res, 400, msg);
      }
      return next();
    });
  },
  asyncHandler(async (req, res) => {
    const file = (req as unknown as { file?: Express.Multer.File }).file;
    if (!file) return fail(res, 400, 'No video was uploaded');

    const existing = await prisma.trainingModule.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      await fs.promises.unlink(file.path).catch(() => {});
      return fail(res, 404, 'Module not found');
    }

    const { url, bytes } = await putVideoFile(file.path, file.mimetype);
    const m = await prisma.trainingModule.update({
      where: { id: existing.id },
      data: {
        videoUrl: url,
        // Give the video a title if it has none, so the row is never blank.
        summary: existing.summary || file.originalname.replace(/\.[^.]+$/, '').slice(0, 120),
      },
    });
    return ok(res, { ...serialiseModule(m), bytes });
  })
);

// GET /media/training-video/:name — stream a locally stored video.
//
// Range requests are handled properly: without a 206 response the browser
// cannot seek, and the whole file has to download before playback starts.
export const mediaRouter = Router();

mediaRouter.get(
  '/training-video/:name',
  asyncHandler(async (req, res) => {
    let full: string;
    try {
      full = localVideoPath(req.params.name);
    } catch {
      return fail(res, 400, 'Invalid video');
    }
    let stat: import('fs').Stats;
    try {
      stat = await fs.promises.stat(full);
    } catch {
      return fail(res, 404, 'Video not found');
    }

    const ext = path.extname(full).toLowerCase();
    const type = ext === '.webm' ? 'video/webm' : ext === '.mov' ? 'video/quicktime' : 'video/mp4';
    res.setHeader('Content-Type', type);
    res.setHeader('Accept-Ranges', 'bytes');

    const range = req.headers.range;
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      const start = m && m[1] ? parseInt(m[1], 10) : 0;
      const end = m && m[2] ? parseInt(m[2], 10) : stat.size - 1;
      if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= stat.size) {
        res.setHeader('Content-Range', `bytes */${stat.size}`);
        return res.status(416).end();
      }
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
      res.setHeader('Content-Length', end - start + 1);
      return fs.createReadStream(full, { start, end }).pipe(res);
    }

    res.setHeader('Content-Length', stat.size);
    return fs.createReadStream(full).pipe(res);
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

// --- Assessment: question bank + test config --------------------------------
export const questionsRouter = Router();

// The paper's shape (how many questions, pass mark, duration, shuffle) lives in
// the shared settings store rather than its own table — it is a single small
// object, exactly what that store is for.
const TEST_CONFIG_KEY = 'eurostar-lms-test-config-v1';
const DEFAULT_TEST_CONFIG = { count: 15, passPct: 70, durationMin: 15, randomize: true };

function serialiseQuestion(q: {
  id: string;
  moduleId: string | null;
  type: string;
  prompt: string;
  options: string;
  answer: number;
  sortOrder: number;
  active: boolean;
}) {
  return {
    id: q.id,
    moduleId: q.moduleId,
    type: q.type,
    prompt: q.prompt,
    options: safeList(q.options) as string[],
    answer: q.answer,
    sortOrder: q.sortOrder,
    active: q.active,
  };
}

// GET /questions — the full bank, staff only. This includes the correct
// answers, so it must never be candidate-readable: the paper is served
// separately, without them.
questionsRouter.get(
  '/',
  authenticate,
  requireInternal,
  asyncHandler(async (req, res) => {
    const moduleId = typeof req.query.moduleId === 'string' ? req.query.moduleId : undefined;
    const questions = await prisma.testQuestion.findMany({
      where: { ...(moduleId ? { moduleId } : {}) },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return ok(res, questions.map(serialiseQuestion));
  })
);

// GET /questions/config + PUT /questions/config — the test settings.
questionsRouter.get(
  '/config',
  asyncHandler(async (_req, res) => ok(res, await getSetting(TEST_CONFIG_KEY, DEFAULT_TEST_CONFIG)))
);

const testConfigSchema = z.object({
  count: z.number().int().min(1).max(200).optional(),
  passPct: z.number().int().min(1).max(100).optional(),
  durationMin: z.number().int().min(1).max(300).optional(),
  randomize: z.boolean().optional(),
});

questionsRouter.put(
  '/config',
  authenticate,
  requireInternal,
  asyncHandler(async (req, res) => {
    const parsed = testConfigSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const current = await getSetting(TEST_CONFIG_KEY, DEFAULT_TEST_CONFIG);
    const next = { ...current, ...parsed.data };
    await setSetting(TEST_CONFIG_KEY, next);
    return ok(res, next);
  })
);

// GET /questions/paper — what a candidate actually sits.
//
// Deliberately strips `answer` before sending. The old screen was handed the
// whole bank, correct answers included, and marked the paper in the browser —
// anyone could read the answers out of the page source before starting.
// Scoring now happens on the server (POST /questions/score).
questionsRouter.get(
  '/paper',
  ...[authenticate, requireCandidate],
  asyncHandler(async (_req, res) => {
    const cfg = await getSetting(TEST_CONFIG_KEY, DEFAULT_TEST_CONFIG);
    const all = await prisma.testQuestion.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    let pool = all;
    if (cfg.randomize) {
      pool = all.slice();
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
    }
    const paper = pool.slice(0, Math.min(cfg.count, pool.length)).map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      options: safeList(q.options) as string[],
    }));
    return ok(res, { config: cfg, questions: paper });
  })
);

// POST /questions/score — mark a submitted paper server-side.
const scoreSchema = z.object({
  answers: z.record(z.number().int()),
});

questionsRouter.post(
  '/score',
  ...[authenticate, requireCandidate],
  asyncHandler(async (req, res) => {
    const parsed = scoreSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const submitted = parsed.data.answers;
    const ids = Object.keys(submitted);
    if (!ids.length) return fail(res, 400, 'No answers were submitted');

    const cfg = await getSetting(TEST_CONFIG_KEY, DEFAULT_TEST_CONFIG);
    const questions = await prisma.testQuestion.findMany({ where: { id: { in: ids } } });
    let correct = 0;
    for (const q of questions) {
      if (submitted[q.id] === q.answer) correct++;
    }
    const total = questions.length || 1;
    const score = Math.round((correct / total) * 100);
    return ok(res, { score, correct, total: questions.length, passPct: cfg.passPct, passed: score >= cfg.passPct });
  })
);

// PUT /questions — office/admin create or update one question.
const questionSchema = z.object({
  id: z.string().optional(),
  moduleId: z.string().nullable().optional(),
  type: z.enum(['MCQ', 'True-False']),
  prompt: z.string().min(1),
  options: z.array(z.string()).optional(),
  answer: z.number().int().min(0),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

questionsRouter.put(
  '/',
  authenticate,
  requireInternal,
  asyncHandler(async (req, res) => {
    const parsed = questionSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;
    // An MCQ needs at least two options, and the answer must point at one of
    // them — otherwise the question is unanswerable and would mark everyone
    // wrong once it reached a real paper.
    const options = d.type === 'MCQ' ? (d.options ?? []).map((o) => o.trim()).filter(Boolean) : [];
    if (d.type === 'MCQ') {
      if (options.length < 2) return fail(res, 400, 'An MCQ needs at least two options');
      if (d.answer >= options.length) return fail(res, 400, 'The correct answer must be one of the options');
    } else if (d.answer > 1) {
      return fail(res, 400, 'A True/False answer must be True (0) or False (1)');
    }

    const data = {
      moduleId: d.moduleId ?? null,
      type: d.type,
      prompt: d.prompt,
      options: JSON.stringify(options),
      answer: d.answer,
      ...(d.sortOrder != null ? { sortOrder: d.sortOrder } : {}),
      ...(d.active != null ? { active: d.active } : {}),
    };
    const q = d.id
      ? await prisma.testQuestion.update({ where: { id: d.id }, data })
      : await prisma.testQuestion.create({ data });
    return ok(res, serialiseQuestion(q), d.id ? 200 : 201);
  })
);

// POST /questions/bulk — the CSV / spreadsheet import.
const bulkSchema = z.object({
  questions: z.array(
    z.object({
      moduleId: z.string().nullable().optional(),
      type: z.enum(['MCQ', 'True-False']),
      prompt: z.string().min(1),
      options: z.array(z.string()).optional(),
      answer: z.number().int().min(0),
    })
  ).min(1),
});

questionsRouter.post(
  '/bulk',
  authenticate,
  requireInternal,
  asyncHandler(async (req, res) => {
    const parsed = bulkSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);

    const base = await prisma.testQuestion.count();
    const rows: { moduleId: string | null; type: string; prompt: string; options: string; answer: number; sortOrder: number }[] = [];
    const skipped: string[] = [];

    parsed.data.questions.forEach((q, i) => {
      const options = q.type === 'MCQ' ? (q.options ?? []).map((o) => o.trim()).filter(Boolean) : [];
      // Same validity rules as a single save — a bad row is reported, never
      // imported as an unanswerable question.
      if (q.type === 'MCQ' && (options.length < 2 || q.answer >= options.length)) {
        skipped.push(q.prompt.slice(0, 60));
        return;
      }
      if (q.type === 'True-False' && q.answer > 1) {
        skipped.push(q.prompt.slice(0, 60));
        return;
      }
      rows.push({
        moduleId: q.moduleId ?? null,
        type: q.type,
        prompt: q.prompt,
        options: JSON.stringify(options),
        answer: q.answer,
        sortOrder: base + i + 1,
      });
    });

    if (rows.length) await prisma.testQuestion.createMany({ data: rows });
    return ok(res, { added: rows.length, skipped: skipped.length, skippedPrompts: skipped.slice(0, 10) }, 201);
  })
);

// DELETE /questions/:id
questionsRouter.delete(
  '/:id',
  authenticate,
  requireInternal,
  asyncHandler(async (req, res) => {
    const existing = await prisma.testQuestion.findUnique({ where: { id: req.params.id } });
    if (!existing) return fail(res, 404, 'Question not found');
    await prisma.testQuestion.delete({ where: { id: req.params.id } });
    return ok(res, { deleted: true });
  })
);
