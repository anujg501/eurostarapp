import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { asyncHandler, ok, failValidation } from '../util/http';
import { AuthedRequest, authenticate, requireStaff, optionalAuth } from '../auth/middleware';
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
  optionalAuth, // CRM reads the full master without a session for now (locked in Phase 6)
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
