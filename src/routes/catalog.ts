import { Router } from 'express';
import { prisma } from '../db';
import { asyncHandler, ok } from '../util/http';
import { CATEGORIES, SHAPES, TONES } from '../data/catalog';
import { PRODUCTS } from '../data/products';

export const catalogRouter = Router();

// GET /catalog — the real Eurostar catalogue structure (categories, shapes,
// tones and unit-of-sale). Categories now come from the Category table, so one
// created in the Admin app shows up here — and therefore in the storefront.
// Hidden categories are withheld from the shop but kept for staff (?all=1).
catalogRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const includeHidden = req.query.all === '1';
    const rows = await prisma.category.findMany({
      where: includeHidden ? {} : { hidden: false },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    // Before the table is seeded an empty catalogue would blank the storefront;
    // fall back to the file the table was seeded from rather than show nothing.
    const categories = rows.length
      ? rows.map(({ createdAt, updatedAt, hidden, ...c }) => (includeHidden ? { ...c, hidden } : c))
      : CATEGORIES;

    return ok(res, { categories, shapes: SHAPES, tones: TONES });
  })
);

// GET /catalog/products — the 18 real SKUs with fixed wholesale prices. Powers
// the mobile app's shop + ordering flow. Optional ?cat= filters by category.
catalogRouter.get(
  '/products',
  asyncHandler(async (req, res) => {
    const cat = typeof req.query.cat === 'string' ? req.query.cat : null;
    const rows = await prisma.product.findMany({
      where: { hidden: false, ...(cat ? { cat } : {}) },
      orderBy: [{ cat: 'asc' }, { name: 'asc' }],
    });

    // Same fallback as the categories above: an unseeded table must not empty
    // the shop.
    if (!rows.length) {
      const items = cat ? PRODUCTS.filter((p) => p.cat === cat) : PRODUCTS;
      return ok(res, { products: items });
    }

    return ok(
      res,
      {
        products: rows.map(({ createdAt, updatedAt, hidden, ...p }) => p),
      }
    );
  })
);
