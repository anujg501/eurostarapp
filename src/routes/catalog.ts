import { Router } from 'express';
import { asyncHandler, ok } from '../util/http';
import { CATEGORIES, SHAPES, TONES } from '../data/catalog';
import { PRODUCTS } from '../data/products';

export const catalogRouter = Router();

// GET /catalog — the real Eurostar catalogue structure (28 categories, shapes,
// tones and unit-of-sale). Prices and per-variant options are computed on the
// client from app/data.jsx; this endpoint gives the CRM/admin/API consumers the
// same category list the storefront uses.
catalogRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    return ok(res, {
      categories: CATEGORIES,
      shapes: SHAPES,
      tones: TONES,
    });
  })
);

// GET /catalog/products — the 18 real SKUs with fixed wholesale prices. Powers
// the mobile app's shop + ordering flow. Optional ?cat= filters by category.
catalogRouter.get(
  '/products',
  asyncHandler(async (req, res) => {
    const cat = typeof req.query.cat === 'string' ? req.query.cat : null;
    const items = cat ? PRODUCTS.filter((p) => p.cat === cat) : PRODUCTS;
    return ok(res, { products: items });
  })
);
