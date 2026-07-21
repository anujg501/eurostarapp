import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { asyncHandler, ok, failValidation } from '../util/http';
import { AuthedRequest, authenticate, requireStaff, requireInternal, optionalAuth } from '../auth/middleware';
import { nextCustomerCode } from '../services/ids';

export const customersRouter = Router();

// Normalise a GSTIN for dedupe (uppercase, strip spaces). The CRM keys its
// customer master on this so the same GST number never creates two records.
function normGst(gstin?: string | null): string | null {
  if (!gstin) return null;
  const n = gstin.replace(/\s+/g, '').toUpperCase();
  return n.length ? n : null;
}

// GET /customers?rep=<id> — customers mapped to a rep.
// Reps see their own customers; office can pass ?rep= or see all.
customersRouter.get(
  '/',
  authenticate,
  requireInternal, // customer master = names, phones, GSTINs, credit terms — staff only
  asyncHandler(async (req: AuthedRequest, res) => {
    const me = req.user;
    let repUserId: string | undefined;

    if (me?.role === 'rep') {
      repUserId = me.sub; // reps are always scoped to themselves
    } else if (typeof req.query.rep === 'string') {
      // office may filter by a rep's public repId or user id
      const rep = await prisma.user.findFirst({
        where: { role: 'rep', OR: [{ repId: req.query.rep }, { id: req.query.rep }] },
      });
      repUserId = rep?.id;
    }

    const customers = await prisma.customer.findMany({
      where: { ...(repUserId ? { repUserId } : {}) },
      include: { rep: true },
      orderBy: { createdAt: 'desc' },
    });

    return ok(
      res,
      customers.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        phone: c.phone,
        city: c.city,
        gstin: c.gstin,
        terms: c.terms,
        rep: c.rep?.repId ?? null, // the checkout customer picker keys on this
      }))
    );
  })
);

// POST /customers — quick-create (name + phone). Rep/office only.
// A rep-created customer is automatically mapped to that rep.
const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(6),
  city: z.string().optional(),
  gstin: z.string().optional(),
  terms: z.enum(['cash', '15', '30', '45', '60']).optional(),
  repId: z.string().optional(), // office may assign to a specific rep
});

customersRouter.post(
  '/',
  authenticate,
  requireStaff,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;
    const me = req.user!;

    let repUserId: string | null = null;
    if (me.role === 'rep') {
      repUserId = me.sub;
    } else if (d.repId) {
      const rep = await prisma.user.findFirst({ where: { role: 'rep', repId: d.repId } });
      repUserId = rep?.id ?? null;
    }

    // Dedupe on normalised GSTIN — if this GST already exists, return that
    // customer (the master record) instead of creating a duplicate.
    const gstinNorm = normGst(d.gstin);
    if (gstinNorm) {
      const existing = await prisma.customer.findFirst({ where: { gstinNorm } });
      if (existing) {
        return ok(res, {
          id: existing.id,
          code: existing.code,
          name: existing.name,
          phone: existing.phone,
          city: existing.city,
          gstin: existing.gstin,
          terms: existing.terms,
          deduped: true,
        });
      }
    }

    const code = await nextCustomerCode();
    const customer = await prisma.customer.create({
      data: {
        code,
        name: d.name,
        phone: d.phone,
        city: d.city,
        gstin: d.gstin,
        gstinNorm,
        terms: d.terms ?? 'cash',
        repUserId,
      },
    });

    return ok(res, {
      id: customer.id,
      code: customer.code,
      name: customer.name,
      phone: customer.phone,
      city: customer.city,
      gstin: customer.gstin,
      terms: customer.terms,
    }, 201);
  })
);

// --- "My account" (storefront profile page) --------------------------------

// Phones arrive in every format ("+91 93145 88201", "9314588201") — compare
// on the last 10 digits.
const phoneDigits = (s?: string | null) => (s || '').replace(/\D+/g, '').slice(-10);

// A customer may read/write their own master record; staff may touch any.
async function actorMayTouch(me: { sub: string; role: string }, customerPhone: string | null): Promise<boolean> {
  if (['rep', 'office', 'admin'].includes(me.role)) return true;
  if (me.role !== 'customer') return false;
  const self = await prisma.user.findUnique({ where: { id: me.sub } });
  return !!self?.phone && !!customerPhone && phoneDigits(self.phone) === phoneDigits(customerPhone);
}

// GET /customers/by-phone/:phone — resolve the master record behind the
// profile page. Staff can look up anyone; a customer only themselves.
customersRouter.get(
  '/by-phone/:phone',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    const wanted = phoneDigits(req.params.phone);
    if (wanted.length < 6) return res.status(400).json({ error: 'Not a phone number' });

    const candidates = await prisma.customer.findMany({ where: { phone: { not: null } } });
    const c = candidates.find((x) => phoneDigits(x.phone) === wanted);
    if (!c) return res.status(404).json({ error: 'Customer not found' });
    if (!(await actorMayTouch(req.user!, c.phone))) return res.status(403).json({ error: 'Not your account' });

    return ok(res, {
      id: c.id, code: c.code, name: c.name, contact: c.contact, email: c.email,
      phone: c.phone, city: c.city, gstin: c.gstin, terms: c.terms,
      shipAddress: c.shipAddress, billAddress: c.billAddress,
    });
  })
);

// PUT /customers/:id — update the master record (the profile page's save).
const updateSchema = z.object({
  name: z.string().min(1).optional(),
  contact: z.string().optional(),
  email: z.string().email().or(z.literal('')).optional(),
  phone: z.string().min(6).optional(),
  city: z.string().optional(),
  gstin: z.string().optional(),
  shipAddress: z.string().optional(),
  billAddress: z.string().nullable().optional(), // null = same as shipping
});

customersRouter.put(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    const c = await prisma.customer.findFirst({ where: { OR: [{ id: req.params.id }, { code: req.params.id }] } });
    if (!c) return res.status(404).json({ error: 'Customer not found' });
    if (!(await actorMayTouch(req.user!, c.phone))) return res.status(403).json({ error: 'Not your account' });

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;

    // The CRM keys its customer master on the GSTIN — refuse an edit that
    // would collide with another record rather than silently making a twin.
    const gstinNorm = d.gstin !== undefined ? normGst(d.gstin) : undefined;
    if (gstinNorm) {
      const clash = await prisma.customer.findFirst({ where: { gstinNorm, NOT: { id: c.id } } });
      if (clash) return res.status(409).json({ error: `That GSTIN already belongs to ${clash.name} (${clash.code})` });
    }

    const updated = await prisma.customer.update({
      where: { id: c.id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.contact !== undefined ? { contact: d.contact } : {}),
        ...(d.email !== undefined ? { email: d.email || null } : {}),
        ...(d.phone !== undefined ? { phone: d.phone } : {}),
        ...(d.city !== undefined ? { city: d.city } : {}),
        ...(d.gstin !== undefined ? { gstin: d.gstin, gstinNorm } : {}),
        ...(d.shipAddress !== undefined ? { shipAddress: d.shipAddress } : {}),
        ...(d.billAddress !== undefined ? { billAddress: d.billAddress } : {}),
      },
    });

    return ok(res, {
      id: updated.id, code: updated.code, name: updated.name, contact: updated.contact,
      email: updated.email, phone: updated.phone, city: updated.city, gstin: updated.gstin,
      terms: updated.terms, shipAddress: updated.shipAddress, billAddress: updated.billAddress,
    });
  })
);

// GET /customers/:id — a single customer (master record).
customersRouter.get(
  '/:id',
  authenticate,
  requireStaff,
  asyncHandler(async (req, res) => {
    const c = await prisma.customer.findFirst({
      where: { OR: [{ id: req.params.id }, { code: req.params.id }] },
      include: { rep: true },
    });
    if (!c) return res.status(404).json({ error: 'Customer not found' });
    return ok(res, {
      id: c.id,
      code: c.code,
      name: c.name,
      phone: c.phone,
      city: c.city,
      gstin: c.gstin,
      terms: c.terms,
      rep: c.rep?.repId ?? null,
    });
  })
);
