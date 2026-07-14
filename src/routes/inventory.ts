import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { asyncHandler, ok, failValidation } from '../util/http';
import { authenticate, requireRole } from '../auth/middleware';

export const inventoryRouter = Router();

// GET /inventory — sold-out flags, matching the client's eurostar-soldout-v1
// object: { "cat|grade|color|shape|size": true, ... }.
inventoryRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const rows = await prisma.soldOut.findMany({ where: { soldOut: true } });
    const filtered = category ? rows.filter((r) => r.key.startsWith(category + '|')) : rows;
    return ok(res, {
      flags: Object.fromEntries(filtered.map((r) => [r.key, true])),
      soldOut: filtered.map((r) => r.key),
    });
  })
);

// PUT /inventory/admin — set/clear a sold-out flag (office only).
// The key is the client's composite: "cat|grade|color|shape|size".
const setSchema = z.object({ key: z.string().min(1), soldOut: z.boolean() });

inventoryRouter.put(
  '/admin',
  authenticate,
  requireRole('office'),
  asyncHandler(async (req, res) => {
    const parsed = setSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const { key, soldOut } = parsed.data;

    if (soldOut) {
      await prisma.soldOut.upsert({ where: { key }, create: { key, soldOut: true }, update: { soldOut: true } });
    } else {
      await prisma.soldOut.deleteMany({ where: { key } });
    }
    return ok(res, { key, soldOut });
  })
);
