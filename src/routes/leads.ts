import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { asyncHandler, ok, fail, failValidation } from '../util/http';
import { authenticate, type AuthedRequest } from '../auth/middleware';
import { nextCustomerCode } from '../services/ids';

// Sales leads. The CRM "Leads" screen owns the whole flow (upload → match →
// approve/assign → work the pipeline); this persists it. Staff only.
export const leadsRouter = Router();

// The pipeline stage at which a lead becomes a real customer. Stage 2 is
// literally "Met & added customer" — reaching it means the rep has met the
// shop and it belongs in the customer master, not just the lead list.
const CUSTOMER_STAGE = 2;

function normGst(gstin?: string | null): string | null {
  if (!gstin) return null;
  const n = gstin.replace(/\s+/g, '').toUpperCase();
  return n.length ? n : null;
}

// Create (or find) the customer a lead graduates into once it reaches
// "Met & added customer". Returns the customer's code, or '' if it could not
// be created (e.g. the lead has no owning rep yet). Dedupes on GSTIN so a lead
// that matches an existing customer links to it instead of making a twin.
async function customerFromLead(lead: {
  name: string; contact?: string; city: string; mobile: string; gst: string; rep: string; note?: string;
}): Promise<string> {
  const rep = lead.rep
    ? await prisma.user.findFirst({ where: { role: 'rep', repId: lead.rep }, select: { id: true } })
    : null;

  const gstinNorm = normGst(lead.gst);
  if (gstinNorm) {
    const existing = await prisma.customer.findFirst({ where: { gstinNorm } });
    if (existing) return existing.code;
  }

  const code = await nextCustomerCode();
  const created = await prisma.customer.create({
    data: {
      code,
      name: lead.name,
      contact: lead.contact || null,
      notes: lead.note || null,
      phone: lead.mobile || null,
      city: lead.city || null,
      gstin: lead.gst || null,
      gstinNorm,
      terms: 'cash',
      repUserId: rep?.id ?? null,
    },
  });
  return created.code;
}

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
  contact: z.string().optional(),
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
    contact: d.contact ?? '',
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
    // A rep works their own book; office/admin see the whole pipeline. The CRM
    // filtered client-side, which meant every rep's browser still downloaded
    // every other rep's leads.
    let where = {};
    if (req.user?.role === 'rep') {
      const me = await prisma.user.findUnique({ where: { id: req.user.sub }, select: { repId: true } });
      where = { rep: me?.repId ?? '__no-rep__' };
    }
    const leads = await prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' }, take: 2000 });
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

    // A rep may work their own leads, but not touch — or reassign away — one
    // that belongs to somebody else.
    if (req.user?.role === 'rep') {
      const me = await prisma.user.findUnique({ where: { id: req.user.sub }, select: { repId: true } });
      if (!me?.repId || existing.rep !== me.repId) return fail(res, 403, 'That lead is not on your book');
      if (parsed.data.rep !== undefined && parsed.data.rep !== me.repId) {
        return fail(res, 403, 'Only the back office can reassign a lead');
      }
    }

    let lead = await prisma.lead.update({ where: { id: existing.id }, data: parsed.data });

    // Graduate the lead into the customer master the first time it reaches
    // "Met & added customer". Only once — customerCode records the link so
    // moving the stage around later doesn't spawn duplicate customers.
    let addedCustomer: string | null = null;
    if (lead.stage >= CUSTOMER_STAGE && !lead.customerCode && lead.rep) {
      try {
        const code = await customerFromLead(lead);
        if (code) {
          lead = await prisma.lead.update({ where: { id: lead.id }, data: { customerCode: code } });
          addedCustomer = code;
        }
      } catch (e) {
        // Never fail the stage change because the customer couldn't be made;
        // the pipeline move still stands and the office can add them by hand.
        // eslint-disable-next-line no-console
        console.warn(`[leads] could not create customer from lead ${lead.id}:`, (e as Error).message);
      }
    }

    return ok(res, { ...lead, addedCustomer });
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
