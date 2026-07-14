import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { asyncHandler, fail, ok, failValidation } from '../util/http';
import { authenticate, requireStaff, optionalAuth } from '../auth/middleware';

export const repsRouter = Router();

function serialiseRep(r: any) {
  return {
    id: r.id,
    repId: r.repId,
    name: r.name,
    city: r.city,
    state: r.state,
    source: r.source,
    tier: r.tier,
    commissionRate: r.commissionRate,
    hiredAt: r.hiredAt,
  };
}

// GET /reps — the CRM's rep list (ingested from LMS hires).
repsRouter.get(
  '/',
  optionalAuth, // CRM reads this without a session for now (locked down in Phase 6)
  asyncHandler(async (_req, res) => {
    const reps = await prisma.rep.findMany({ orderBy: { createdAt: 'desc' }, take: 500 });
    return ok(res, reps.map(serialiseRep));
  })
);

// POST /reps — create a rep (LMS "Onboard to CRM" writes here).
// Was the eurostar-crm-new-hires bus key.
const createSchema = z.object({
  repId: z.string().optional(),
  name: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  source: z.string().optional(),
  tier: z.string().optional(),
  commissionRate: z.number().min(0).max(1).optional(),
});

repsRouter.post(
  '/',
  authenticate,
  requireStaff,
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;

    // Dedupe by repId when provided.
    const rep = d.repId
      ? await prisma.rep.upsert({
          where: { repId: d.repId },
          create: { ...d, commissionRate: d.commissionRate ?? 0 },
          update: { name: d.name, city: d.city, state: d.state, source: d.source, tier: d.tier },
        })
      : await prisma.rep.create({ data: { ...d, commissionRate: d.commissionRate ?? 0 } });

    return ok(res, serialiseRep(rep), 201);
  })
);

// GET /reps/:id/commission — commission earned from confirmed orders taken by this rep.
repsRouter.get(
  '/:id/commission',
  authenticate,
  requireStaff,
  asyncHandler(async (req, res) => {
    const rep = await prisma.rep.findFirst({
      where: { OR: [{ id: req.params.id }, { repId: req.params.id }] },
    });
    if (!rep) return fail(res, 404, 'Rep not found');

    // Sum confirmed order value attributed to this rep's public id.
    const orders = await prisma.order.findMany({
      where: { repId: rep.repId ?? undefined, status: { in: ['confirmed', 'packed', 'shipped', 'delivered'] } },
      select: { grand: true },
    });
    const salesValue = orders.reduce((s, o) => s + o.grand, 0);
    const commission = Math.round(salesValue * rep.commissionRate);

    return ok(res, {
      repId: rep.repId,
      name: rep.name,
      commissionRate: rep.commissionRate,
      orders: orders.length,
      salesValue,
      commission,
    });
  })
);
