import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { asyncHandler, ok, fail, failValidation } from '../util/http';
import { authenticate, type AuthedRequest } from '../auth/middleware';

// Sales leads. The CRM "Leads" screen owns the whole flow (upload → match →
// approve/assign → work the pipeline); this persists it. Staff only.
export const leadsRouter = Router();

function staffOnly(req: AuthedRequest, res: any): boolean {
  if (req.user?.role === 'customer') {
    fail(res, 403, 'Staff only');
    return false;
  }
  return true;
}

const leadSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  city: z.string().optional(),
  mobile: z.string().optional(),
  gst: z.string().optional(),
  rep: z.string().optional(),
  stage: z.number().int().optional(),
  followUp: z.string().optional(),
  assigned: z.boolean().optional(),
  note: z.string().optional(),
  flagged: z.boolean().optional(),
  flagName: z.string().optional(),
  flagBy: z.string().optional(),
});

function toData(d: z.infer<typeof leadSchema>) {
  return {
    name: d.name,
    city: d.city ?? '',
    mobile: d.mobile ?? '',
    gst: d.gst ?? '',
    rep: d.rep ?? '',
    stage: d.stage ?? 1,
    followUp: d.followUp ?? '',
    assigned: d.assigned ?? false,
    note: d.note ?? '',
    flagged: d.flagged ?? false,
    flagName: d.flagName ?? '',
    flagBy: d.flagBy ?? '',
  };
}

// GET /leads — the whole list, newest first.
leadsRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!staffOnly(req, res)) return;
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 2000 });
    return ok(res, leads);
  })
);

// POST /leads — create one lead or a batch (the Excel/CSV upload). Accepts a
// single object or an array; upserts by the client-supplied id so a re-sent
// upload does not duplicate.
leadsRouter.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!staffOnly(req, res)) return;
    const body = Array.isArray(req.body) ? req.body : [req.body];
    const parsed = z.array(leadSchema).safeParse(body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const rows = await prisma.$transaction(
      parsed.data.map((d) =>
        prisma.lead.upsert({ where: { id: d.id }, create: { id: d.id, ...toData(d) }, update: toData(d) })
      )
    );
    return ok(res, rows, 201);
  })
);

// PUT /leads/:id — update a lead (assign a rep, approve a flagged one, advance
// the stage, set a follow-up date).
const updateSchema = z.object({
  rep: z.string().optional(),
  stage: z.number().int().optional(),
  followUp: z.string().optional(),
  assigned: z.boolean().optional(),
  flagged: z.boolean().optional(),
  note: z.string().optional(),
});

leadsRouter.put(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!staffOnly(req, res)) return;
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const existing = await prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!existing) return fail(res, 404, 'Lead not found');
    const lead = await prisma.lead.update({ where: { id: existing.id }, data: parsed.data });
    return ok(res, lead);
  })
);

// DELETE /leads/:id — discard a lead so reps never re-prospect it.
leadsRouter.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!staffOnly(req, res)) return;
    await prisma.lead.deleteMany({ where: { id: req.params.id } });
    return ok(res, { ok: true });
  })
);
