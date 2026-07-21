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

// POST /catalog/stock-check — what is actually available right now for a set of
// SKUs, so the cart and checkout can revalidate against live inventory instead
// of the counts they were rendered with. Read-only: this reserves nothing, and
// the atomic decrement on order creation is still the authority. Between this
// call and that one another customer may take the last pieces, which is why
// checkout treats a pass here as advisory, not a guarantee.
catalogRouter.post(
  '/stock-check',
  asyncHandler(async (req, res) => {
    const raw = Array.isArray(req.body?.lines) ? req.body.lines : [];

    // Same aggregation the order path uses: one SKU may sit on several lines.
    const wanted = new Map<string, number>();
    for (const l of raw) {
      const pid = typeof l?.pid === 'string' ? l.pid : null;
      const n = Number(l?.qty);
      if (!pid || !isFinite(n) || n <= 0) continue;
      wanted.set(pid, (wanted.get(pid) ?? 0) + Math.floor(n));
    }
    if (!wanted.size) return ok(res, { items: [] });

    const rows = await prisma.product.findMany({
      where: { id: { in: [...wanted.keys()] } },
      select: { id: true, name: true, stock: true, stockCount: true, unit: true },
    });

    const items = rows.map((p) => {
      // stockCount 0 is the schema default and means "not tracked" — only a SKU
      // flagged out is genuinely unavailable. Mirrors the order path exactly, so
      // the two cannot disagree about what is sellable.
      const tracked = p.stock === 'out' || p.stockCount > 0;
      const available = p.stock === 'out' ? 0 : p.stockCount;
      const want = wanted.get(p.id) ?? 0;
      return {
        pid: p.id,
        name: p.name,
        unit: p.unit,
        tracked,
        available,
        wanted: want,
        ok: !tracked || want <= available,
      };
    });

    return ok(res, { items });
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
