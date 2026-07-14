import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { asyncHandler, fail, ok, failValidation } from '../util/http';
import { AuthedRequest, authenticate } from '../auth/middleware';
import { computeTotals } from '../services/totals';

export const cartsRouter = Router();

const lineSchema = z.object({
  skuId: z.string().optional(),
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
  lines: z.array(lineSchema).default([]),
});

function serialiseCart(cart: any) {
  const lines = cart.lines.map((l: any) => ({
    id: l.id,
    skuId: l.skuId,
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
  const totals = computeTotals(lines.map((l: any) => ({ unitPrice: l.unitPrice, qty: l.qty })));
  return {
    id: cart.id,
    customerId: cart.customerId,
    personaId: cart.personaId,
    status: cart.status,
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
    return ok(res, carts.map(serialiseCart));
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
        lines: {
          create: d.lines.map((l) => ({
            skuId: l.skuId,
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
    return ok(res, serialiseCart(cart), 201);
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
          ...(d.lines
            ? {
                lines: {
                  create: d.lines.map((l) => ({
                    skuId: l.skuId,
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

    return ok(res, serialiseCart(cart));
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
