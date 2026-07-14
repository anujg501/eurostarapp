import { Router } from 'express';
import { asyncHandler, ok } from '../util/http';
import { CATEGORIES, SHAPES, TONES } from '../data/catalog';

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
