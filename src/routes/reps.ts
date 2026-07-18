import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { asyncHandler, fail, ok, failValidation } from '../util/http';
import { authenticate, requireStaff, requireInternal, optionalAuth } from '../auth/middleware';
import { config } from '../config';

export const repsRouter = Router();

function serialiseCheckIn(c: any) {
  return {
    id: c.id,
    userId: c.userId,
    repId: c.repId,
    repName: c.repName,
    type: c.type,
    lat: c.lat,
    lng: c.lng,
    accuracy: c.accuracy,
    address: c.address,
    at: c.createdAt,
  };
}

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
  authenticate,
  requireInternal, // staff directory — not public
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
  requireInternal, // LMS "Onboard to CRM" writes here — staff only, or anyone could inject reps
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

// --- Field check-in / check-out (Google Maps) -------------------------------

// GET /reps/maps-key — the PUBLIC Google Maps key so the CRM can draw the map.
repsRouter.get(
  '/maps-key',
  asyncHandler(async (_req, res) => ok(res, { key: config.maps.apiKey || null }))
);

// POST /reps/checkin — the logged-in rep records a check-in or check-out with
// their phone's GPS. Staff (office/admin) may post on a rep's behalf via repId.
const checkinSchema = z.object({
  type: z.enum(['in', 'out']),
  lat: z.number(),
  lng: z.number(),
  accuracy: z.number().optional(),
  address: z.string().optional(),
  repId: z.string().optional(),
  repName: z.string().optional(),
});
repsRouter.post(
  '/checkin',
  authenticate,
  asyncHandler(async (req: any, res) => {
    const parsed = checkinSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;
    const me = req.user;
    const checkin = await prisma.checkIn.create({
      data: {
        userId: me.sub,
        repId: d.repId ?? me.repId ?? null,
        repName: d.repName ?? me.name ?? null,
        type: d.type,
        lat: d.lat,
        lng: d.lng,
        accuracy: d.accuracy ?? null,
        address: d.address ?? null,
      },
    });
    return ok(res, serialiseCheckIn(checkin), 201);
  })
);

// GET /reps/checkins — recent check-ins. Staff see everyone; a rep sees only
// their own. Optional ?userId= / ?repId= filters (staff only).
repsRouter.get(
  '/checkins',
  authenticate,
  asyncHandler(async (req: any, res) => {
    const me = req.user;
    const staff = me.role === 'office' || me.role === 'admin';
    const where: any = {};
    if (!staff) where.userId = me.sub;
    else {
      if (typeof req.query.userId === 'string') where.userId = req.query.userId;
      if (typeof req.query.repId === 'string') where.repId = req.query.repId;
    }
    const items = await prisma.checkIn.findMany({ where, orderBy: { createdAt: 'desc' }, take: 300 });
    return ok(res, items.map(serialiseCheckIn));
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
