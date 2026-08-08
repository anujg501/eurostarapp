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

function serialiseVisit(v: any) {
  return {
    id: v.id,
    rep: v.repId,
    repName: v.repName,
    custId: v.custId,
    custName: v.custName,
    custCity: v.custCity,
    custMobile: v.custMobile,
    day: v.day,
    checkIn: v.checkInAt,
    checkOut: v.checkOutAt,
    inLat: v.inLat,
    inLng: v.inLng,
    inAcc: v.inAcc,
    inSource: v.inSource,
    outLat: v.outLat,
    outLng: v.outLng,
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

// GET /reps — the assignable rep directory.
//
// Two sources exist and both matter: the Rep table (LMS-onboarded hires) and
// the User table (accounts that can actually log in). A lead can only usefully
// be assigned to a rep who can sign in and see it, so the login accounts are
// authoritative — a Rep-table row with no matching login used to make the CRM
// offer a rep who could never open the app. They are merged by repId, with the
// login account winning on name and marking hasLogin.
repsRouter.get(
  '/',
  authenticate,
  requireInternal, // staff directory — not public
  asyncHandler(async (_req, res) => {
    const [hires, users] = await Promise.all([
      prisma.rep.findMany({ orderBy: { createdAt: 'desc' }, take: 500 }),
      // Include inactive reps here — the CRM shows them as "Blocked" and can
      // restore them; filtering them out would hide a rep the office just blocked.
      prisma.user.findMany({ where: { role: 'rep' }, orderBy: { createdAt: 'asc' } }),
    ]);

    const byRepId = new Map<string, any>();
    for (const r of hires) {
      if (!r.repId) continue;
      byRepId.set(r.repId, { ...serialiseRep(r), id: r.repId, hasLogin: false });
    }
    for (const u of users) {
      const key: string = u.repId || u.userId || u.id; // every rep login carries its repId
      const prev = byRepId.get(key) || {};
      byRepId.set(key, {
        ...prev,
        id: key, // the CRM assigns leads by this repId
        repId: key,
        userId: u.id, // real user row id — needed to block/restore the login
        name: u.name, // the login name is the real one
        city: prev.city ?? null,
        region: u.region ?? prev.region ?? prev.state ?? null,
        phone: u.phoneNote ?? '',
        commissionPct: u.commissionPct ?? 4,
        monthlyTarget: u.monthlyTarget ?? 50,
        asmId: u.asmId ?? '',
        headId: u.headId ?? '',
        active: u.active,
        hasLogin: true,
      });
    }
    return ok(res, [...byRepId.values()]);
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

// --- Escalation contacts (ASM / Sales Head) ---------------------------------
// The reps table's ASM/Sales-Head dropdowns and a rep's escalation list read
// these. Staff only.

repsRouter.get(
  '/escalation',
  authenticate,
  requireInternal,
  asyncHandler(async (_req, res) => {
    const rows = await prisma.escalationContact.findMany({ orderBy: { createdAt: 'asc' } });
    return ok(res, rows);
  })
);

repsRouter.post(
  '/escalation',
  authenticate,
  requireInternal,
  asyncHandler(async (req, res) => {
    const parsed = z
      .object({ name: z.string().min(1), role: z.enum(['asm', 'head']), phone: z.string().min(4) })
      .safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const row = await prisma.escalationContact.create({ data: parsed.data });
    return ok(res, row, 201);
  })
);

repsRouter.delete(
  '/escalation/:id',
  authenticate,
  requireInternal,
  asyncHandler(async (req, res) => {
    await prisma.escalationContact.deleteMany({ where: { id: req.params.id } });
    // Any rep pointing at this contact loses the dangling reference.
    await prisma.user.updateMany({ where: { asmId: req.params.id }, data: { asmId: null } });
    await prisma.user.updateMany({ where: { headId: req.params.id }, data: { headId: null } });
    return ok(res, { ok: true });
  })
);

// PUT /reps/:repId — the CRM's "Reps & commission" screen: commission %, target,
// region, escalation assignment. Keyed by the public repId. Staff only.
repsRouter.put(
  '/:repId',
  authenticate,
  requireInternal,
  asyncHandler(async (req, res) => {
    const parsed = z
      .object({
        commissionPct: z.number().min(0).max(100).optional(),
        monthlyTarget: z.number().int().min(50).optional(),
        region: z.string().optional(),
        phoneNote: z.string().optional(),
        asmId: z.string().nullable().optional(),
        headId: z.string().nullable().optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;

    const user = await prisma.user.findFirst({ where: { role: 'rep', repId: req.params.repId } });
    if (!user) return fail(res, 404, 'No rep with that id');

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(d.commissionPct !== undefined ? { commissionPct: d.commissionPct } : {}),
        ...(d.monthlyTarget !== undefined ? { monthlyTarget: d.monthlyTarget } : {}),
        ...(d.region !== undefined ? { region: d.region } : {}),
        ...(d.phoneNote !== undefined ? { phoneNote: d.phoneNote } : {}),
        ...(d.asmId !== undefined ? { asmId: d.asmId || null } : {}),
        ...(d.headId !== undefined ? { headId: d.headId || null } : {}),
      },
    });
    return ok(res, {
      id: updated.repId,
      commissionPct: updated.commissionPct ?? 4,
      monthlyTarget: updated.monthlyTarget ?? 50,
      region: updated.region ?? '',
      asmId: updated.asmId ?? '',
      headId: updated.headId ?? '',
    });
  })
);

// --- Morning attendance (photo check-in) ------------------------------------
// A rep marks themselves present for a day; office/admin see the month grid.

// POST /reps/attendance — the signed-in rep marks today present. Idempotent per
// day (upsert), so a double tap doesn't create two rows.
repsRouter.post(
  '/attendance',
  authenticate,
  asyncHandler(async (req: any, res) => {
    const parsed = z
      .object({ date: z.string().optional(), status: z.enum(['present', 'leave']).optional(), photo: z.string().max(3_000_000).optional(), time: z.string().optional() })
      .safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const me = req.user;
    if (me.role !== 'rep' && me.role !== 'office' && me.role !== 'admin') return fail(res, 403, 'Staff only');
    const repId = me.repId || me.userId || me.sub;
    // Date defaults to today in the server's timezone; the client sends its own
    // local date so the mark lands on the right day for the rep.
    const date = parsed.data.date || new Date().toISOString().slice(0, 10);
    const data = {
      userId: me.sub,
      repId,
      repName: me.name ?? null,
      date,
      status: parsed.data.status ?? 'present',
      photo: parsed.data.photo ?? null,
      time: parsed.data.time ?? null,
    };
    const row = await prisma.attendance.upsert({
      where: { repId_date: { repId, date } },
      create: data,
      update: { status: data.status, photo: data.photo, time: data.time },
    });
    return ok(res, { id: row.id, repId: row.repId, date: row.date, status: row.status, time: row.time, hasPhoto: !!row.photo }, 201);
  })
);

// GET /reps/attendance?month=YYYY-MM — the month's records. Staff see everyone;
// a rep sees only their own. The photo is omitted from the list (heavy).
repsRouter.get(
  '/attendance',
  authenticate,
  requireInternal,
  asyncHandler(async (req: any, res) => {
    const me = req.user;
    const month = typeof req.query.month === 'string' ? req.query.month : new Date().toISOString().slice(0, 7);
    const where: any = { date: { startsWith: month } };
    if (me.role === 'rep') where.repId = me.repId || me.userId || me.sub;
    const rows = await prisma.attendance.findMany({ where, orderBy: { date: 'asc' } });
    return ok(res, rows.map((r) => ({ id: r.id, repId: r.repId, repName: r.repName, date: r.date, status: r.status, time: r.time, hasPhoto: !!r.photo })));
  })
);

// --- Field visits (customer visit check-in / check-out with GPS) ------------

// POST /reps/visits — the signed-in rep checks in at a customer, opening a visit.
repsRouter.post(
  '/visits',
  authenticate,
  asyncHandler(async (req: any, res) => {
    const parsed = z
      .object({
        custId: z.string().min(1),
        custName: z.string().optional(),
        custCity: z.string().optional(),
        custMobile: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        acc: z.number().optional(),
        source: z.string().optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const me = req.user;
    if (me.role !== 'rep' && me.role !== 'office' && me.role !== 'admin') return fail(res, 403, 'Staff only');
    const d = parsed.data;
    const now = new Date();
    const visit = await prisma.fieldVisit.create({
      data: {
        userId: me.sub,
        repId: me.repId || me.userId || me.sub,
        repName: me.name ?? null,
        custId: d.custId,
        custName: d.custName ?? null,
        custCity: d.custCity ?? null,
        custMobile: d.custMobile ?? null,
        day: now.toISOString().slice(0, 10),
        checkInAt: now,
        inLat: d.lat ?? null,
        inLng: d.lng ?? null,
        inAcc: d.acc ?? null,
        inSource: d.source ?? null,
      },
    });
    return ok(res, serialiseVisit(visit), 201);
  })
);

// PUT /reps/visits/:id/checkout — close an open visit with the check-out GPS.
repsRouter.put(
  '/visits/:id/checkout',
  authenticate,
  asyncHandler(async (req: any, res) => {
    const parsed = z.object({ lat: z.number().optional(), lng: z.number().optional() }).safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const me = req.user;
    const existing = await prisma.fieldVisit.findUnique({ where: { id: req.params.id } });
    if (!existing) return fail(res, 404, 'Visit not found');
    // A rep may only close their own visit.
    if (me.role === 'rep' && existing.userId !== me.sub) return fail(res, 403, 'Not your visit');
    const visit = await prisma.fieldVisit.update({
      where: { id: existing.id },
      data: { checkOutAt: new Date(), outLat: parsed.data.lat ?? null, outLng: parsed.data.lng ?? null },
    });
    return ok(res, serialiseVisit(visit));
  })
);

// GET /reps/visits?day=YYYY-MM-DD — visits. Staff see everyone; a rep only own.
repsRouter.get(
  '/visits',
  authenticate,
  requireInternal,
  asyncHandler(async (req: any, res) => {
    const me = req.user;
    const where: any = {};
    if (typeof req.query.day === 'string') where.day = req.query.day;
    if (me.role === 'rep') where.repId = me.repId || me.userId || me.sub;
    const rows = await prisma.fieldVisit.findMany({ where, orderBy: { checkInAt: 'desc' }, take: 500 });
    return ok(res, rows.map(serialiseVisit));
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
  // Reps & commission is an Administration screen, and the console signs in as
  // role 'admin' — which requireStaff (rep|office) excludes.
  requireInternal,
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
