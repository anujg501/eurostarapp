import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { asyncHandler, fail, ok, failValidation } from '../util/http';
import { authenticate, requireRole } from '../auth/middleware';

export const inventoryRouter = Router();

// GET /inventory — list of sold-out SKU ids (and full flags map).
inventoryRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const categoryKey = typeof req.query.category === 'string' ? req.query.category : undefined;
    const skus = await prisma.sku.findMany({
      where: { ...(categoryKey ? { categoryKey } : {}) },
      select: { id: true, soldOut: true, categoryKey: true },
    });
    return ok(res, {
      soldOut: skus.filter((s) => s.soldOut).map((s) => s.id),
      flags: Object.fromEntries(skus.map((s) => [s.id, s.soldOut])),
    });
  })
);

// PUT /admin/inventory — set a SKU's sold-out flag (office only).
const setSchema = z.object({ skuId: z.string().min(1), soldOut: z.boolean() });

inventoryRouter.put(
  '/admin',
  authenticate,
  requireRole('office'),
  asyncHandler(async (req, res) => {
    const parsed = setSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const sku = await prisma.sku
      .update({ where: { id: parsed.data.skuId }, data: { soldOut: parsed.data.soldOut } })
      .catch(() => null);
    if (!sku) return fail(res, 404, 'SKU not found');
    return ok(res, { id: sku.id, soldOut: sku.soldOut });
  })
);
