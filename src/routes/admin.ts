import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok, failValidation } from '../util/http';
import { authenticate, requireRole } from '../auth/middleware';
import { getSetting, setSetting, KEYS } from '../services/settings';

// Admin (Sales App Admin) content endpoints. These are the producer side of the
// catalog overlays, thumbnails, splash and rep-broadcast art the Sales app reads.
export const adminRouter = Router();

const officeOnly = [authenticate, requireRole('office')];

// Helper: a GET (public read) + PUT (office write) pair backed by a setting key.
function kv(router: Router, path: string, key: string, schema: z.ZodTypeAny, fallback: unknown) {
  router.get(
    path,
    asyncHandler(async (_req, res) => ok(res, await getSetting(key, fallback)))
  );
  router.put(
    path,
    ...officeOnly,
    asyncHandler(async (req, res) => {
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return failValidation(res, parsed.error);
      await setSetting(key, parsed.data);
      return ok(res, parsed.data);
    })
  );
}

// Catalog overlays — extra colours/shapes per category (XCOL / XSHP).
kv(
  adminRouter,
  '/catalog/colours',
  KEYS.extraColours,
  z.record(z.array(z.object({ id: z.string(), name: z.string(), hex: z.string().optional() }))),
  {}
);
kv(adminRouter, '/catalog/shapes', KEYS.extraShapes, z.record(z.array(z.string())), {});
kv(adminRouter, '/catalog/grades', KEYS.gradeOverrides, z.record(z.any()), {});

// Media — product images + category/shape thumbnails (dataURL maps).
kv(adminRouter, '/product-images', KEYS.productImages, z.record(z.string()), {});
kv(adminRouter, '/thumbs/categories', KEYS.catThumbs, z.record(z.string()), {});
kv(adminRouter, '/thumbs/shapes', KEYS.shapeThumbs, z.record(z.string()), {});

// Category display order.
kv(adminRouter, '/catorder', KEYS.catOrder, z.array(z.string()), []);

// Marketing splash pop-up shown in the Sales app.
adminRouter.get(
  '/splash',
  asyncHandler(async (_req, res) => {
    const image = await getSetting<string | null>(KEYS.splashImage, null);
    const active = await getSetting<boolean>(KEYS.splashActive, false);
    return ok(res, { image, active });
  })
);
adminRouter.put(
  '/splash',
  ...officeOnly,
  asyncHandler(async (req, res) => {
    const schema = z.object({ image: z.string().nullable().optional(), active: z.boolean().optional() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    if (parsed.data.image !== undefined) await setSetting(KEYS.splashImage, parsed.data.image);
    if (parsed.data.active !== undefined) await setSetting(KEYS.splashActive, parsed.data.active);
    return ok(res, {
      image: await getSetting<string | null>(KEYS.splashImage, null),
      active: await getSetting<boolean>(KEYS.splashActive, false),
    });
  })
);

// Mira reference images + master enabled flags (managed from Mira Admin).
kv(
  adminRouter,
  '/mira/images',
  KEYS.miraImages,
  z.array(z.object({ id: z.string(), name: z.string(), desc: z.string().optional(), data: z.string() })),
  []
);
kv(adminRouter, '/mira/enabled', KEYS.miraEnabled, z.record(z.boolean()), { salesApp: true });
