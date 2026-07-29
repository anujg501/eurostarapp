import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok, failValidation } from '../util/http';
import { authenticate, requireRole, optionalAuth } from '../auth/middleware';
import { getSetting, setSetting, deleteSetting, listSettingKeys, KEYS } from '../services/settings';

// Admin (Sales App Admin) content endpoints. These are the producer side of the
// catalog overlays, thumbnails, splash and rep-broadcast art the Sales app reads.
export const adminRouter = Router();

// Preview: the Admin app writes without a session for now (locked down in Phase 6).
const officeOnly = [optionalAuth];

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

// Per-image product photo store. Each photo is its own setting row
// (`pimg:<catId|colorId|shape>`), so the catalogue can hold thousands of photos
// server-side without the single-blob size cap — and the storefront reads them
// from here so uploads show for every visitor, on every device.
const PIMG_PREFIX = 'pimg:';

// Manifest: which photo keys exist (small — keys only, no image data).
adminRouter.get(
  '/product-images/manifest',
  asyncHandler(async (_req, res) => {
    const keys = await listSettingKeys(PIMG_PREFIX);
    return ok(res, { keys: keys.map((k) => k.slice(PIMG_PREFIX.length)) });
  })
);

// Serve one photo as an image (decodes the stored data URL to bytes).
adminRouter.get(
  '/product-images/item',
  asyncHandler(async (req, res) => {
    const key = String(req.query.key || '');
    if (!key) return res.status(400).json({ error: 'key required' });
    const url = await getSetting<string | null>(PIMG_PREFIX + key, null);
    if (!url) return res.status(404).json({ error: 'not found' });
    const m = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(url);
    if (!m) {
      res.setHeader('content-type', 'text/plain');
      return res.send(url);
    }
    const mime = m[1] || 'application/octet-stream';
    const body = m[2] ? Buffer.from(m[3], 'base64') : Buffer.from(decodeURIComponent(m[3]));
    res.setHeader('content-type', mime);
    res.setHeader('cache-control', 'public, max-age=60');
    return res.send(body);
  })
);

// Upsert one photo. Body: { key, url } where url is a data: URL.
adminRouter.put(
  '/product-images/item',
  ...officeOnly,
  asyncHandler(async (req, res) => {
    const parsed = z.object({ key: z.string().min(1), url: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    await setSetting(PIMG_PREFIX + parsed.data.key, parsed.data.url);
    return ok(res, { ok: true });
  })
);

// Remove one photo (also accepts ?key= for keepalive DELETE without a body).
adminRouter.delete(
  '/product-images/item',
  ...officeOnly,
  asyncHandler(async (req, res) => {
    const key = String((req.body && req.body.key) || req.query.key || '');
    if (!key) return res.status(400).json({ error: 'key required' });
    await deleteSetting(PIMG_PREFIX + key);
    return ok(res, { ok: true });
  })
);
kv(adminRouter, '/thumbs/categories', KEYS.catThumbs, z.record(z.string()), {});
kv(adminRouter, '/thumbs/shapes', KEYS.shapeThumbs, z.record(z.string()), {});

// LMS interview links: a map of candidate id -> Google Meet (or any) link. The
// LMS admin sets it; the candidate sees a "Join interview" button.
kv(adminRouter, '/lms/meeting-links', KEYS.lmsMeetingLinks, z.record(z.string()), {});

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
