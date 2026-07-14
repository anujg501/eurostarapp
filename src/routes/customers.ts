import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { asyncHandler, ok, failValidation } from '../util/http';
import { AuthedRequest, authenticate, requireStaff } from '../auth/middleware';
import { nextCustomerCode } from '../services/ids';

export const customersRouter = Router();

// GET /customers?rep=<id> — customers mapped to a rep.
// Reps see their own customers; office can pass ?rep= or see all.
customersRouter.get(
  '/',
  authenticate,
  requireStaff,
  asyncHandler(async (req: AuthedRequest, res) => {
    const me = req.user!;
    let repUserId: string | undefined;

    if (me.role === 'rep') {
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

    const code = await nextCustomerCode();
    const customer = await prisma.customer.create({
      data: {
        code,
        name: d.name,
        phone: d.phone,
        city: d.city,
        gstin: d.gstin,
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
