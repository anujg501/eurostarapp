import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { asyncHandler, fail, ok, failValidation } from '../util/http';
import { authenticate, requireRole } from '../auth/middleware';

export const catalogRouter = Router();

// GET /catalog — everything the ordering flow needs to render.
// Returns categories with their units, and nested grades/colours/shapes/sizes
// derived from the SKU list, plus the flat SKU list with prices.
catalogRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
    const skus = await prisma.sku.findMany({ where: { active: true } });

    const byCat = categories.map((c) => {
      const items = skus.filter((s) => s.categoryKey === c.key);
      const uniq = (vals: (string | null)[]) =>
        Array.from(new Set(vals.filter((v): v is string => !!v)));
      return {
        key: c.key,
        name: c.name,
        unit: c.unit,
        thumbUrl: c.thumbUrl,
        sortOrder: c.sortOrder,
        grades: uniq(items.map((i) => i.grade)),
        colours: uniq(items.map((i) => i.colour)),
        shapes: uniq(items.map((i) => i.shape)),
        sizes: uniq(items.map((i) => i.size)),
      };
    });

    return ok(res, {
      categories: byCat,
      skus: skus.map((s) => ({
        id: s.id,
        category: s.categoryKey,
        grade: s.grade,
        colour: s.colour,
        shape: s.shape,
        size: s.size,
        unit: s.unit,
        pricePerPiece: s.pricePerPiece,
        packetPcs: s.packetPcs,
        soldOut: s.soldOut,
        imageUrl: s.imageUrl,
      })),
    });
  })
);

// --- Admin: create/update SKUs and categories (office only) -----------------

const upsertCategorySchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  unit: z.enum(['pc', 'ct', 'pkt', 'strip']),
  sortOrder: z.number().int().optional(),
  thumbUrl: z.string().url().optional(),
  active: z.boolean().optional(),
});

catalogRouter.put(
  '/admin/categories',
  authenticate,
  requireRole('office'),
  asyncHandler(async (req, res) => {
    const parsed = upsertCategorySchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const { key, ...rest } = parsed.data;
    const cat = await prisma.category.upsert({
      where: { key },
      create: { key, ...rest },
      update: rest,
    });
    return ok(res, cat);
  })
);

const upsertSkuSchema = z.object({
  categoryKey: z.string().min(1),
  grade: z.string().optional(),
  colour: z.string().optional(),
  shape: z.string().optional(),
  size: z.string().min(1),
  unit: z.enum(['pc', 'ct', 'pkt', 'strip']),
  pricePerPiece: z.number().int().nonnegative(),
  packetPcs: z.number().int().positive().optional(),
  soldOut: z.boolean().optional(),
  imageUrl: z.string().url().optional(),
  active: z.boolean().optional(),
});

catalogRouter.put(
  '/admin/skus',
  authenticate,
  requireRole('office'),
  asyncHandler(async (req, res) => {
    const parsed = upsertSkuSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;

    const category = await prisma.category.findUnique({ where: { key: d.categoryKey } });
    if (!category) return fail(res, 404, 'Unknown category');

    // Nullable grade/colour/shape make Prisma's compound-unique upsert awkward,
    // so we match the exact variant ourselves then create or update it.
    const existing = await prisma.sku.findFirst({
      where: {
        categoryKey: d.categoryKey,
        grade: d.grade ?? null,
        colour: d.colour ?? null,
        shape: d.shape ?? null,
        size: d.size,
      },
    });

    const sku = existing
      ? await prisma.sku.update({ where: { id: existing.id }, data: d })
      : await prisma.sku.create({ data: d });
    return ok(res, sku);
  })
);
