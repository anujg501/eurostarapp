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
  ALLOWED_IMAGE_MIME,
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

// POST /candidates/me/watched — the candidate ticks off a training video.
//
// Training progress had no candidate-writable route at all, so the app kept the
// watched list in memory only. Sign in on a second phone (or just restart the
// app) and the list came back empty, which the test gate reads as "training not
// finished" — the candidate was locked out of the assessment on every device
// but the one they happened to watch on. Progress belongs to the candidate, not
// to the handset, so it is stored on their pipeline row where the office sees
// it too.
const watchedSchema = z.object({ videoId: z.string().min(1) });

candidatesRouter.post(
  '/me/watched',
  ...candidateOnly,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = watchedSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const { videoId } = parsed.data;

    const existing = await ownCandidate(req.user!.sub);
    if (!existing) return fail(res, 404, 'No application found for this account');

    let blob: Record<string, any> = {};
    if (existing.data) { try { blob = JSON.parse(existing.data); } catch { blob = {}; } }
    const watched: string[] = Array.isArray(blob.watched) ? blob.watched : [];
    if (!watched.includes(videoId)) watched.push(videoId);
    blob.watched = watched;

    // Watching a video is the moment someone stops being an applicant and
    // starts training. Never walk the pipeline backwards, though — a candidate
    // who has already sat the test and rewatches a module stays where they are.
    const stage = existing.stage === 'applied' ? 'training' : existing.stage;

    const c = await prisma.candidate.update({
      where: { id: existing.id },
      data: { stage, data: JSON.stringify(blob) },
    });
    return ok(res, serialise(c));
  })
);

// ---------------------------------------------------------------------------
// The test run — one attempt, owned by the candidate, not by a handset.
//
// The app used to hold the whole sitting in memory: which questions, which
// answers, how long was left. Sign in on a second phone and there was nothing
// to find, so the test could not be resumed (and, with progress equally
// invisible, often could not be started at all). The run now lives on the
// pipeline row: the same paper, the same answers and a deadline measured from
// when it actually started, so picking up the other phone continues the
// sitting instead of restarting it — and the clock cannot be reset by
// switching devices.
// ---------------------------------------------------------------------------
type TestRun = {
  qIds: string[];
  answers: Record<string, number>;
  index: number;
  startedAt: string;
  durationMin: number;
  submittedAt?: string;
  // The clock is time SPENT, not a wall-clock end time: the candidate may step
  // off the test screen, and the countdown holds while they are away. `spentMs`
  // is what has already been used up; `activeSince` is when the current stretch
  // began, or null while paused.
  spentMs?: number;
  activeSince?: string | null;
};

function readBlob(c: { data: string | null }): Record<string, any> {
  if (!c.data) return {};
  try { return JSON.parse(c.data) || {}; } catch { return {}; }
}

/**
 * The run as the app should see it, with the time left worked out here — the
 * server is the only honest clock, since a phone can sleep, be minimised, or
 * have its time changed.
 */
function runView(run: TestRun | null) {
  if (!run) return null;
  // Runs created before the pause/resume clock existed have neither field, and
  // were simply counting from startedAt — read them that way.
  const activeSince = run.activeSince === undefined ? run.startedAt : run.activeSince;
  const spentMs = (run.spentMs ?? 0) + (activeSince ? Date.now() - Date.parse(activeSince) : 0);
  const totalMs = run.durationMin * 60000;
  const secondsLeft = Math.max(0, Math.round((totalMs - spentMs) / 1000));
  return {
    ...run,
    running: !!activeSince && !run.submittedAt,
    secondsLeft,
    // Only meaningful while the clock is running; the app re-asks on resume.
    endsAt: new Date(Date.now() + secondsLeft * 1000).toISOString(),
    expired: !run.submittedAt && secondsLeft <= 0,
  };
}

/** Fold the running stretch into the total spent, leaving the run paused. */
function pauseRun(run: TestRun): TestRun {
  const activeSince = run.activeSince === undefined ? run.startedAt : run.activeSince;
  if (!activeSince) return run;
  return {
    ...run,
    spentMs: (run.spentMs ?? 0) + (Date.now() - Date.parse(activeSince)),
    activeSince: null,
  };
}

// GET /candidates/me/test-run — the sitting in progress, or null.
candidatesRouter.get(
  '/me/test-run',
  ...candidateOnly,
  asyncHandler(async (req: AuthedRequest, res) => {
    const c = await ownCandidate(req.user!.sub);
    if (!c) return fail(res, 404, 'No application found for this account');
    return ok(res, { run: runView((readBlob(c).testRun as TestRun) ?? null) });
  })
);

// POST /candidates/me/test-run — start the sitting, or hand back the one that
// is already open. Deliberately idempotent: the second device must join the
// attempt in progress, never begin a fresh one with a full clock.
const startRunSchema = z.object({
  qIds: z.array(z.string().min(1)).min(1),
  durationMin: z.number().int().min(1).max(600),
});

candidatesRouter.post(
  '/me/test-run',
  ...candidateOnly,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = startRunSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);

    const existing = await ownCandidate(req.user!.sub);
    if (!existing) return fail(res, 404, 'No application found for this account');
    const blob = readBlob(existing);
    const open = blob.testRun as TestRun | undefined;

    // Already sitting it (on either phone) — return that, untouched.
    if (open && !open.submittedAt) return ok(res, { run: runView(open), resumed: true });
    // Already finished it. The office has to grant a re-test; until then this
    // is the honest answer rather than a blank screen.
    if (blob.testConsumed) return fail(res, 409, 'You have already taken the assessment.');

    const run: TestRun = {
      qIds: parsed.data.qIds,
      answers: {},
      index: 0,
      startedAt: new Date().toISOString(),
      durationMin: parsed.data.durationMin,
      spentMs: 0,
      activeSince: new Date().toISOString(),
    };
    blob.testRun = run;
    const stage = existing.stage === 'training' || existing.stage === 'applied' ? 'testing' : existing.stage;
    const c = await prisma.candidate.update({
      where: { id: existing.id },
      data: { stage, data: JSON.stringify(blob) },
    });
    void c;
    return ok(res, { run: runView(run), resumed: false });
  })
);

// PATCH /candidates/me/test-run — save answers as they are chosen, so the other
// device sees the same paper at the same place.
const saveRunSchema = z.object({
  answers: z.record(z.number().int()).optional(),
  index: z.number().int().min(0).optional(),
});

candidatesRouter.patch(
  '/me/test-run',
  ...candidateOnly,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = saveRunSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);

    const existing = await ownCandidate(req.user!.sub);
    if (!existing) return fail(res, 404, 'No application found for this account');
    const blob = readBlob(existing);
    const run = blob.testRun as TestRun | undefined;
    if (!run || run.submittedAt) return fail(res, 409, 'There is no test in progress.');
    // The clock has run out: no more answers are taken, whatever the app thinks.
    if (runView(run)!.expired) return fail(res, 409, 'Time is up — this test has ended.');

    // Merge rather than replace: two devices answering different questions in
    // the same sitting must not wipe each other's work.
    run.answers = { ...(run.answers || {}), ...(parsed.data.answers || {}) };
    if (typeof parsed.data.index === 'number') run.index = parsed.data.index;
    blob.testRun = run;
    await prisma.candidate.update({ where: { id: existing.id }, data: { data: JSON.stringify(blob) } });
    return ok(res, { run: runView(run) });
  })
);

// POST /candidates/me/test-run/pause — the candidate left the test screen.
// POST /candidates/me/test-run/resume — and came back to it.
//
// The countdown holds while they are off the page and picks up from the same
// remaining time when they return. Both are recorded here rather than in the
// app so the pause survives a crash, a restart, or the other device: time spent
// is time spent, wherever it was counted.
for (const action of ['pause', 'resume'] as const) {
  candidatesRouter.post(
    `/me/test-run/${action}`,
    ...candidateOnly,
    asyncHandler(async (req: AuthedRequest, res) => {
      const existing = await ownCandidate(req.user!.sub);
      if (!existing) return fail(res, 404, 'No application found for this account');
      const blob = readBlob(existing);
      const run = blob.testRun as TestRun | undefined;
      if (!run || run.submittedAt) return fail(res, 409, 'There is no test in progress.');

      // Whichever way this goes, settle the stretch that has just ended first;
      // that also decides whether the time ran out while they were on the page.
      const settled = pauseRun(run);
      const view = runView(settled)!;
      if (view.expired) {
        blob.testRun = settled;
        await prisma.candidate.update({ where: { id: existing.id }, data: { data: JSON.stringify(blob) } });
        return ok(res, { run: runView(settled) });
      }

      blob.testRun = action === 'resume' ? { ...settled, activeSince: new Date().toISOString() } : settled;
      await prisma.candidate.update({ where: { id: existing.id }, data: { data: JSON.stringify(blob) } });
      return ok(res, { run: runView(blob.testRun as TestRun) });
    })
  );
}

// POST /candidates/me/test-run/submit — end the sitting and mark it, here.
//
// The countdown used to be a number the app decremented once a second, which
// stops dead when the phone sleeps or the app is backgrounded: come back an
// hour later and the clock carried on from where it paused, so minimising the
// app bought unlimited extra time. Nothing on the server enforced the limit
// either. The deadline now lives with the run, and the marking happens here
// against the answers already saved — so the time is up when the clock says so,
// whether the app is open, backgrounded or closed.
//
// Answers sent with the request are only accepted while the sitting is still
// live. Once the deadline has passed, what was saved during the test is what
// gets marked.
const submitRunSchema = z.object({
  answers: z.record(z.number().int()).optional(),
});

candidatesRouter.post(
  '/me/test-run/submit',
  ...candidateOnly,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = submitRunSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);

    const existing = await ownCandidate(req.user!.sub);
    if (!existing) return fail(res, 404, 'No application found for this account');
    const blob = readBlob(existing);
    const run = blob.testRun as TestRun | undefined;
    if (!run) return fail(res, 409, 'There is no test to submit.');

    const cfg = await getSetting(TEST_CONFIG_KEY, DEFAULT_TEST_CONFIG);

    // Already marked (the other device got there first, or this is a retry).
    if (run.submittedAt) {
      const done = existing.score ?? 0;
      return ok(res, {
        score: done,
        passPct: cfg.passPct,
        passed: done >= cfg.passPct,
        expired: false,
        alreadySubmitted: true,
      });
    }

    const view = runView(run)!;
    // Past the deadline, the answers in the request are ignored — only what was
    // saved while the clock was running counts.
    const answers = view.expired ? run.answers || {} : { ...(run.answers || {}), ...(parsed.data.answers || {}) };

    const asked = await prisma.testQuestion.findMany({ where: { id: { in: run.qIds } } });
    const key = new Map(asked.map((q) => [q.id, q.answer]));
    let correct = 0;
    for (const id of run.qIds) if (key.has(id) && answers[id] === key.get(id)) correct++;
    // Out of the whole paper, not just the questions they got round to —
    // otherwise answering two of fifteen correctly would read as 100%.
    const total = run.qIds.length || 1;
    const score = Math.round((correct / total) * 100);
    const passed = score >= cfg.passPct;

    run.answers = answers;
    run.submittedAt = new Date().toISOString();
    blob.testRun = run;
    const attempts = Array.isArray(blob.attempts) ? blob.attempts : [];
    attempts.push({
      n: attempts.length + 1,
      score,
      passed,
      date: new Date().toISOString().slice(0, 10),
      ...(view.expired ? { timedOut: true } : {}),
    });
    blob.attempts = attempts;
    blob.testConsumed = true;

    const stage = passed ? 'recommended' : existing.stage;
    await prisma.candidate.update({
      where: { id: existing.id },
      data: { score, stage, data: JSON.stringify(blob) },
    });

    return ok(res, { score, correct, total, passPct: cfg.passPct, passed, expired: view.expired });
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

    // A result only means something if there was a sitting behind it. Without
    // this, anything holding a candidate token could post a pass mark for a
    // test that was never started — which put a candidate with no application,
    // locked training and locked test straight into the Approval Queue.
    if (!blob.testRun) return fail(res, 409, 'No test was taken, so there is no result to record.');
    const attempts = Array.isArray(blob.attempts) ? blob.attempts : [];
    attempts.push({ n: attempts.length + 1, score, passed, date: new Date().toISOString().slice(0, 10) });
    blob.attempts = attempts;
    blob.testConsumed = true;
    // Close the sitting, so the other device stops offering to resume it and
    // shows the result instead.
    if (blob.testRun && !blob.testRun.submittedAt) blob.testRun.submittedAt = new Date().toISOString();

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

// ---------------------------------------------------------------------------
// Onboarding — what a hired candidate has to complete before their Sales App
// login goes live: the confidentiality undertaking, a photo, ID, and bank
// details for commission. The web candidate flow has had this screen from the
// start; the phone app had no way to reach any of it and no route to save it,
// so a candidate hired on the app was simply told nothing.
// ---------------------------------------------------------------------------
const onboardingSchema = z.object({
  confidentiality: z.literal(true).optional(),
  bank: z
    .object({
      holder: z.string().min(1),
      acc: z.string().min(8),
      bankName: z.string().min(1),
      // Indian IFSC: four letters, a zero, then six alphanumerics. Accepted in
      // any case — people type it as it appears on their passbook — and stored
      // upper-cased below.
      ifsc: z.string().regex(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/, 'Enter a valid IFSC code, e.g. HDFC0001234'),
    })
    .optional(),
});

// POST /candidates/me/onboarding — sign the undertaking, save bank details.
candidatesRouter.post(
  '/me/onboarding',
  ...candidateOnly,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = onboardingSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);

    const existing = await ownCandidate(req.user!.sub);
    if (!existing) return fail(res, 404, 'No application found for this account');
    // Onboarding only exists once there is a job to onboard into.
    if (existing.stage !== 'hired' && !existing.repId)
      return fail(res, 409, 'Onboarding opens once you have been hired.');

    const blob = readBlob(existing);
    const ob = (blob.onboarding as Record<string, unknown>) ?? {};
    if (parsed.data.confidentiality) ob.confidentiality = true;
    if (parsed.data.bank) ob.bank = { ...parsed.data.bank, ifsc: parsed.data.bank.ifsc.toUpperCase() };
    blob.onboarding = ob;

    const c = await prisma.candidate.update({
      where: { id: existing.id },
      data: { data: JSON.stringify(blob) },
    });
    return ok(res, serialise(c));
  })
);

// POST /candidates/me/onboarding-doc?kind=photo|aadhaar|pan — the KYC images.
// Stored in the same private area as CVs, never in the public web root: these
// are someone's identity documents.
const KYC_KINDS: Record<string, string> = { photo: 'photo', aadhaar: 'aadhaarImg', pan: 'panImg' };
const kycUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_DOC_BYTES, files: 1 } });

candidatesRouter.post(
  '/me/onboarding-doc',
  ...candidateOnly,
  (req, res, next) => {
    kycUpload.single('file')(req, res, (err: unknown) => {
      if (err) {
        const msg = (err as { code?: string }).code === 'LIMIT_FILE_SIZE'
          ? `That file is larger than ${Math.round(MAX_DOC_BYTES / (1024 * 1024))}MB`
          : 'Could not read the uploaded file';
        return fail(res, 400, msg);
      }
      return next();
    });
  },
  asyncHandler(async (req: AuthedRequest, res) => {
    const kindKey = typeof req.query.kind === 'string' ? req.query.kind : '';
    const field = KYC_KINDS[kindKey];
    if (!field) return fail(res, 400, 'Say which document this is: photo, aadhaar or pan');

    const file = (req as unknown as { file?: Express.Multer.File }).file;
    if (!file) return fail(res, 400, 'No file was uploaded');
    // Phone galleries report jpeg/png reliably; anything else is a wrong pick.
    if (!ALLOWED_IMAGE_MIME.includes(file.mimetype)) return fail(res, 400, 'Upload a photo (JPG or PNG)');

    const existing = await ownCandidate(req.user!.sub);
    if (!existing) return fail(res, 404, 'No application found for this account');
    if (existing.stage !== 'hired' && !existing.repId)
      return fail(res, 409, 'Onboarding opens once you have been hired.');

    const { key, bytes } = await putPrivateFile(file.buffer, file.mimetype, 'kyc');
    const blob = readBlob(existing);
    const ob = (blob.onboarding as Record<string, unknown>) ?? {};
    ob[field] = { key, mime: file.mimetype, size: bytes, at: new Date().toISOString() };
    blob.onboarding = ob;

    const c = await prisma.candidate.update({
      where: { id: existing.id },
      data: { data: JSON.stringify(blob) },
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
          ? `That file is larger than ${Math.round(MAX_DOC_BYTES / (1024 * 1024))}MB`
          : 'Could not read the uploaded file';
        return fail(res, 400, msg);
      }
      return next();
    });
  },
  asyncHandler(async (req: AuthedRequest, res) => {
    const file = (req as unknown as { file?: Express.Multer.File }).file;
    if (!file) return fail(res, 400, 'No file was uploaded');

    // Phones routinely report a CV as "application/octet-stream" (or send no
    // type at all) depending on which app the file came from, so the extension
    // is the dependable signal. Judging on the reported type alone bounced
    // genuine PDFs, and the applicant had no way to tell why.
    const EXT_MIME: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    // The mobile uploader streams from a cache copy, so the multipart filename
    // can be a temp name — it sends the real one as a `filename` field. Use
    // that for both the extension check and the stored name.
    const sentName = typeof (req.body as { filename?: unknown } | undefined)?.filename === 'string'
      ? ((req.body as { filename: string }).filename)
      : '';
    const ext = path.extname(sentName || file.originalname || '').toLowerCase();
    const mime = ALLOWED_DOC_MIME.includes(file.mimetype) ? file.mimetype : EXT_MIME[ext];
    if (!mime) {
      return fail(res, 400, 'Upload a PDF or Word document (.pdf, .doc, .docx)');
    }

    const existing = await ownCandidate(req.user!.sub);
    if (!existing) return fail(res, 404, 'No application found for this account');

    const { key, bytes } = await putPrivateFile(file.buffer, mime, 'resumes');

    let blob: Record<string, unknown> = {};
    if (existing.data) { try { blob = JSON.parse(existing.data); } catch { blob = {}; } }
    blob.resumeKey = key;
    blob.resumeName = (sentName || file.originalname || 'resume').slice(0, 120);
    blob.resumeMime = mime;
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
            ? 'Upload a video (MP4, WebM, MOV) or audio file (MP3, M4A, WAV, AAC)'
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

    // The player picks its decoder off this header, so an audio lesson served as
    // video/mp4 simply refuses to play. Map every format we accept on upload.
    const ext = path.extname(full).toLowerCase();
    const TYPE_BY_EXT: Record<string, string> = {
      '.webm': 'video/webm', '.mov': 'video/quicktime', '.m4v': 'video/x-m4v', '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.aac': 'audio/aac',
      '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.weba': 'audio/webm',
    };
    const type = TYPE_BY_EXT[ext] ?? 'video/mp4';
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
  asyncHandler(async (req, res) => {
    const cfg = await getSetting(TEST_CONFIG_KEY, DEFAULT_TEST_CONFIG);
    const all = await prisma.testQuestion.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    // ?ids=a,b,c — hand back exactly this paper, in this order. A sitting begun
    // on one phone has to look identical on the other, and with randomise on it
    // would otherwise be a different set of questions in a different order.
    const asked = typeof req.query.ids === 'string' ? req.query.ids.split(',').filter(Boolean) : [];
    if (asked.length) {
      const byId = new Map(all.map((q) => [q.id, q]));
      const same = asked
        .map((id) => byId.get(id))
        .filter((q): q is (typeof all)[number] => !!q)
        .map((q) => ({ id: q.id, type: q.type, prompt: q.prompt, options: safeList(q.options) as string[] }));
      return ok(res, { config: cfg, questions: same });
    }

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
