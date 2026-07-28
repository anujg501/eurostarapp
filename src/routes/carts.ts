import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { asyncHandler, fail, ok, failValidation } from '../util/http';
import { AuthedRequest, authenticate } from '../auth/middleware';
import { computeTotals } from '../services/totals';
import { getStoreRules, type StoreRules } from '../services/settings';

export const cartsRouter = Router();

// An active cart with no update for this many days shows as "abandoned" in the CRM.
const ABANDON_DAYS = 3;

const lineSchema = z.object({
  skuId: z.string().optional(),
  name: z.string().optional(),
  categoryKey: z.string().optional(),
  grade: z.string().optional(),
  colour: z.string().optional(),
  shape: z.string().optional(),
  size: z.string().optional(),
  unit: z.string().min(1),
  qty: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative(),
});

const cartSchema = z.object({
  customerId: z.string().optional(),
  personaId: z.string().optional(), // maps to client "eurostar-drafts-<personaId>"
  status: z.enum(['active', 'confirmed']).optional(),
  discount: z.number().int().min(0).max(100).optional(),
  lines: z.array(lineSchema).default([]),
});

function serialiseCart(cart: any, rules: StoreRules) {
  const lines = cart.lines.map((l: any) => ({
    id: l.id,
    skuId: l.skuId,
    name: l.name,
    categoryKey: l.categoryKey,
    grade: l.grade,
    colour: l.colour,
    shape: l.shape,
    size: l.size,
    unit: l.unit,
    qty: l.qty,
    unitPrice: l.unitPrice,
    lineTotal: l.lineTotal,
  }));
  const subtotal = lines.reduce((s: number, l: any) => s + (l.lineTotal ?? 0), 0);
  const totals = computeTotals([{ unitPrice: subtotal, qty: 1 }], false, rules);
  return {
    id: cart.id,
    customerId: cart.customerId,
    personaId: cart.personaId,
    status: cart.status,
    discount: cart.discount,
    lines,
    totals,
    updatedAt: cart.updatedAt,
  };
}

// GET /carts?customer=<id>&persona=<id>&status=active
cartsRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { customer, persona, status } = req.query;
    const carts = await prisma.cart.findMany({
      where: {
        ...(typeof customer === 'string' ? { customerId: customer } : {}),
        ...(typeof persona === 'string' ? { personaId: persona } : {}),
        ...(typeof status === 'string' ? { status } : {}),
      },
      include: { lines: true },
      orderBy: { updatedAt: 'desc' },
    });
    // Load the rules once for the whole list rather than per cart.
    const rules = await getStoreRules();
    // An open ("active") cart left untouched for a while is treated as
    // abandoned so the back office can chase it. Computed at read time — no
    // cron, no stored 'abandoned' status; a fresh save flips it back to active.
    const now = Date.now();
    const ABANDON_MS = ABANDON_DAYS * 24 * 60 * 60 * 1000;
    return ok(
      res,
      carts.map((c) => {
        const s = serialiseCart(c, rules);
        if (s.status === 'active' && now - new Date(c.updatedAt).getTime() > ABANDON_MS) {
          s.status = 'abandoned';
        }
        return s;
      })
    );
  })
);

// POST /carts — create a new draft/active cart.
cartsRouter.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = cartSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;

    const cart = await prisma.cart.create({
      data: {
        customerId: d.customerId,
        personaId: d.personaId,
        repUserId: req.user!.role !== 'customer' ? req.user!.sub : null,
        status: d.status ?? 'active',
        discount: d.discount ?? 0,
        lines: {
          create: d.lines.map((l) => ({
            skuId: l.skuId,
            name: l.name,
            categoryKey: l.categoryKey,
            grade: l.grade,
            colour: l.colour,
            shape: l.shape,
            size: l.size,
            unit: l.unit,
            qty: l.qty,
            unitPrice: l.unitPrice,
            lineTotal: l.unitPrice * l.qty,
          })),
        },
      },
      include: { lines: true },
    });
    return ok(res, serialiseCart(cart, await getStoreRules()), 201);
  })
);

// PUT /carts/:id — replace a cart's lines/status (full save).
cartsRouter.put(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = cartSchema.partial().safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;

    const existing = await prisma.cart.findUnique({ where: { id: req.params.id } });
    if (!existing) return fail(res, 404, 'Cart not found');

    const cart = await prisma.$transaction(async (tx) => {
      if (d.lines) {
        await tx.cartLine.deleteMany({ where: { cartId: existing.id } });
      }
      return tx.cart.update({
        where: { id: existing.id },
        data: {
          customerId: d.customerId ?? existing.customerId,
          personaId: d.personaId ?? existing.personaId,
          status: d.status ?? existing.status,
          discount: d.discount ?? existing.discount,
          ...(d.lines
            ? {
                lines: {
                  create: d.lines.map((l) => ({
                    skuId: l.skuId,
                    name: l.name,
                    categoryKey: l.categoryKey,
                    grade: l.grade,
                    colour: l.colour,
                    shape: l.shape,
                    size: l.size,
                    unit: l.unit,
                    qty: l.qty,
                    unitPrice: l.unitPrice,
                    lineTotal: l.unitPrice * l.qty,
                  })),
                },
              }
            : {}),
        },
        include: { lines: true },
      });
    });

    return ok(res, serialiseCart(cart, await getStoreRules()));
  })
);

// DELETE /carts/:id
cartsRouter.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    await prisma.cart.delete({ where: { id: req.params.id } }).catch(() => null);
    return ok(res, { ok: true });
  })
);
