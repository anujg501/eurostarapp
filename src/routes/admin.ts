import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { prisma } from '../db';
import { config } from '../config';
import { ALLOWED_IMAGE_MIME, putImage } from '../services/storage';
import { asyncHandler, ok, fail, failValidation } from '../util/http';
import { authenticate, requireRole } from '../auth/middleware';
import { getSetting, setSetting, invalidateStoreRules, KEYS } from '../services/settings';
import { sizesFor, suggestedRate, chartPacketPcs, unitFor } from '../services/sizeCharts';

// Admin (Sales App Admin) content endpoints. These are the producer side of the
// catalog overlays, thumbnails, splash and rep-broadcast art the Sales app reads.
export const adminRouter = Router();

// Writes here change what every customer sees in the Sales app — catalog overlays,
// product images, the splash banner. Reads stay public (the storefront needs them
// to render); writes require a signed-in staff user. The Admin app signs in as
// role 'admin', so that role must be allowed alongside office.
const officeOnly = [authenticate, requireRole('office', 'admin')];

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
      // Trading rules are cached for pricing; drop the cache so a change in the
      // Settings screen applies to the very next order rather than up to 15s later.
      if (key === KEYS.storeRules) invalidateStoreRules();
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
// Colour images: one photo per colour, keyed "cat|colour" — replaces the plain
// colour swatch on the storefront's "Choose a colour" step.
kv(adminRouter, '/thumbs/colours', KEYS.colourThumbs, z.record(z.string()), {});
// Colour swatch photos (spec key), keyed "category|colour" — the canonical store
// the Sales App "Choose a colour" step and the Pricing colour cards both read.
kv(adminRouter, '/colour-swatches', KEYS.colourSwatches, z.record(z.string()), {});

// Pricing overrides the Pricing editor writes and the Sales App reads live.
// Per category: { price:{<key>:n}, pcs:{<size>:n}, addSizes:{<shape>:[]}, delSizes:{<shape>:[]} }.
const priceOvrSchema = z.record(
  z.object({
    price: z.record(z.number()).optional(),
    pcs: z.record(z.number()).optional(),
    addSizes: z.record(z.array(z.string())).optional(),
    delSizes: z.record(z.array(z.string())).optional(),
  })
);
kv(adminRouter, '/pricing-overrides', KEYS.pricingOverrides, priceOvrSchema, {});

// LMS interview links: a map of candidate id -> Google Meet (or any) link. The
// LMS admin sets it; the candidate sees a "Join interview" button.
kv(adminRouter, '/lms/meeting-links', KEYS.lmsMeetingLinks, z.record(z.string()), {});
// Candidate-facing notifications, keyed by candId → newest-first list. The admin
// (staff) writes; the candidate app reads its own via the public GET.
kv(
  adminRouter,
  '/lms/notifs',
  KEYS.lmsCandNotifs,
  // `link` carries a join URL (e.g. the screening meeting) so the candidate can
  // act on the alert where they read it, instead of being told to go hunting for
  // it on another screen.
  z.record(
    z.array(
      z.object({
        id: z.string(),
        icon: z.string().optional(),
        text: z.string(),
        time: z.string().optional(),
        link: z.string().optional(),
        linkLabel: z.string().optional(),
        // ISO timestamp after which the link is dead (a screening slot that has
        // already passed) — the candidate app greys the button out from then on.
        linkExpiresAt: z.string().optional(),
      })
    )
  ),
  {}
);

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

// ---------------------------------------------------------------------------
// Categories — the real create/edit/delete behind the Admin app's wizard.
// Backed by the Category table, so a category created here appears in GET
// /catalog and therefore in the storefront. (Before this existed the wizard had
// nowhere to save and silently discarded everything the user typed.)
// ---------------------------------------------------------------------------

// Slugify a display name into a url-safe key: "Sunny Cate" -> "sunny-cate".
function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

const categoryCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  short: z.string().optional(),
  blurb: z.string().optional(),
  unit: z.enum(['pc', 'ct', 'pkt', 'strip']).default('pc'),
  origin: z.string().optional(),
  skipGrade: z.boolean().optional(),
  count: z.number().int().min(0).optional(),
  sortOrder: z.number().int().optional(),
  hidden: z.boolean().optional(),
});

// GET /admin/catalog/categories — full list including hidden ones (staff view).
adminRouter.get(
  '/catalog/categories',
  ...officeOnly,
  asyncHandler(async (_req, res) =>
    ok(
      res,
      await prisma.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] })
    )
  )
);

// POST /admin/catalog/categories — create.
adminRouter.post(
  '/catalog/categories',
  ...officeOnly,
  asyncHandler(async (req, res) => {
    const parsed = categoryCreateSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;

    const key = slugify(d.name);
    if (!key) return fail(res, 400, 'Please give the category a name using letters or numbers');

    const clash = await prisma.category.findUnique({ where: { key } });
    if (clash) return fail(res, 409, `A category called "${clash.name}" already exists`);

    // New categories go last unless told otherwise.
    const last = await prisma.category.findFirst({ orderBy: { sortOrder: 'desc' } });
    const created = await prisma.category.create({
      data: {
        key,
        name: d.name.trim(),
        short: (d.short || d.name).trim(),
        blurb: d.blurb ?? '',
        unit: d.unit,
        origin: d.origin ?? '',
        skipGrade: d.skipGrade ?? false,
        count: d.count ?? 0,
        sortOrder: d.sortOrder ?? (last ? last.sortOrder + 1 : 1),
        hidden: d.hidden ?? false,
      },
    });
    return res.status(201).json(created);
  })
);

// PUT /admin/catalog/categories/:key — edit, incl. the show/hide toggle.
adminRouter.put(
  '/catalog/categories/:key',
  ...officeOnly,
  asyncHandler(async (req, res) => {
    const parsed = categoryCreateSchema.partial().safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);

    const existing = await prisma.category.findUnique({ where: { key: req.params.key } });
    if (!existing) return fail(res, 404, 'No such category');

    const d = parsed.data;
    const updated = await prisma.category.update({
      where: { key: req.params.key },
      data: {
        ...(d.name !== undefined ? { name: d.name.trim() } : {}),
        ...(d.short !== undefined ? { short: d.short } : {}),
        ...(d.blurb !== undefined ? { blurb: d.blurb } : {}),
        ...(d.unit !== undefined ? { unit: d.unit } : {}),
        ...(d.origin !== undefined ? { origin: d.origin } : {}),
        ...(d.skipGrade !== undefined ? { skipGrade: d.skipGrade } : {}),
        ...(d.count !== undefined ? { count: d.count } : {}),
        ...(d.sortOrder !== undefined ? { sortOrder: d.sortOrder } : {}),
        ...(d.hidden !== undefined ? { hidden: d.hidden } : {}),
      },
    });
    return ok(res, updated);
  })
);

// DELETE /admin/catalog/categories/:key
adminRouter.delete(
  '/catalog/categories/:key',
  ...officeOnly,
  asyncHandler(async (req, res) => {
    const existing = await prisma.category.findUnique({ where: { key: req.params.key } });
    if (!existing) return fail(res, 404, 'No such category');
    await prisma.category.delete({ where: { key: req.params.key } });
    return ok(res, { deleted: req.params.key });
  })
);

// ---------------------------------------------------------------------------
// Store rules — the Admin "Settings" screen. Its inputs previously saved
// nowhere; these are the real trading rules the storefront applies. Reads are
// public because the Sales app needs them to price a cart.
// ---------------------------------------------------------------------------
kv(
  adminRouter,
  '/settings/rules',
  KEYS.storeRules,
  z.object({
    gstRate: z.number().min(0).max(1).optional(),
    courierFlat: z.number().int().min(0).optional(),
    courierFreeOver: z.number().int().min(0).optional(),
    minOrderValue: z.number().int().min(0).optional(),
    dispatchWorkingDays: z.number().int().min(0).max(60).optional(),
    exportDispatchDays: z.number().int().min(0).max(60).optional(),
    rfqMinValue: z.number().int().min(0).optional(),
    defaultPayment: z.string().optional(),
    languages: z.array(z.string()).optional(),
    inviteOnly: z.boolean().optional(),
    watermarkPriceSheets: z.boolean().optional(),
    noindex: z.boolean().optional(),
  }),
  {}
);

// Site content — the Admin "Content" screen (hero, footer, testimonials).
kv(
  adminRouter,
  '/content',
  KEYS.siteContent,
  z.object({
    heroTitle: z.string().optional(),
    heroSub: z.string().optional(),
    footerNote: z.string().optional(),
    businessHours: z.string().optional(),
    testimonials: z
      .array(z.object({ id: z.string(), name: z.string(), text: z.string(), city: z.string().optional() }))
      .optional(),
  }),
  {}
);

// ---------------------------------------------------------------------------
// Products — the real save behind "Save pricing", the product grid and bulk
// upload. Backed by the Product table. Reads are public (the storefront and
// mobile app price carts from them); writes are staff-only.
// ---------------------------------------------------------------------------

const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  cat: z.string().min(1),
  tone: z.string().optional(),
  shape: z.string().optional(),
  size: z.string().optional(),
  clarity: z.string().optional(),
  price: z.number().int().min(0),
  unit: z.string().optional(),
  moq: z.number().int().min(1).optional(),
  stock: z.enum(['in', 'low', 'out']).optional(),
  stockCount: z.number().int().min(0).optional(),
  pcsPerPacket: z.number().int().min(1).nullable().optional(),
  badge: z.string().nullable().optional(),
  desc: z.string().nullable().optional(),
  hidden: z.boolean().optional(),
});

// GET /admin/products?cat= — staff list, including hidden SKUs.
adminRouter.get(
  '/products',
  ...officeOnly,
  asyncHandler(async (req, res) => {
    const cat = typeof req.query.cat === 'string' ? req.query.cat : undefined;
    return ok(
      res,
      await prisma.product.findMany({
        where: cat ? { cat } : {},
        orderBy: [{ cat: 'asc' }, { name: 'asc' }],
      })
    );
  })
);

// ---------------------------------------------------------------------------
// Pricing matrix — the Admin "Pricing" tab.
//
// One row per size in a shape's calibrated chart. A size that already has a SKU
// shows that SKU's real rate and packet count; a size that does not yet shows
// the storefront's own "base × size multiplier" suggestion and materialises
// into a real SKU the first time it is saved. The chart itself is lifted from
// docs/app/data.jsx so the Admin and the storefront cannot drift apart.

// A stable, readable SKU id for a row created from the matrix. Deterministic so
// saving the same row twice updates rather than duplicates.
function matrixSkuId(categoryKey: string, shape: string, size: string): string {
  const slug = (s: string) => String(s).trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `EUR-${slug(categoryKey)}-${slug(shape)}-${slug(size)}`;
}

// GET /admin/pricing?cat=&shape= — the rows behind the pricing table.
adminRouter.get(
  '/pricing',
  ...officeOnly,
  asyncHandler(async (req, res) => {
    const cat = String(req.query.cat ?? '');
    const shape = String(req.query.shape ?? '');
    if (!cat) return fail(res, 400, 'cat is required');

    const unit = unitFor(cat);
    const products = await prisma.product.findMany({ where: { cat }, orderBy: { name: 'asc' } });

    // The category's configured shapes come first — a category can be priced
    // before it has a single SKU, and deriving the list from existing SKUs
    // alone left a fresh category with no shape to price against. SKU shapes
    // are unioned in so a bulk-uploaded shape is never missing from the tab.
    const configured = (await getSetting<Record<string, string[]>>(KEYS.extraShapes, {})) ?? {};
    const shapes = [
      ...new Set([...(configured[cat] ?? []), ...products.map((p) => p.shape).filter(Boolean)]),
    ];
    const active = shape || shapes[0] || '';
    if (!active) return ok(res, { cat, shape: '', shapes: [], unit, rows: [] });

    // The base rate the suggestion scales from: the cheapest real SKU on this
    // shape, falling back to the category, so a fresh shape still shows sane
    // numbers instead of zeros.
    const onShape = products.filter((p) => p.shape === active);
    const basePool = onShape.length ? onShape : products;
    const basePrice = basePool.length ? Math.min(...basePool.map((p) => p.price)) : 0;

    // Same precedence the storefront uses (see screen-browse.jsx): the sizes a
    // category actually has win over the built-in chart. Showing the chart on
    // top of them buried three real sizes under a full generic list, and listed
    // "7.50 mm" from the chart beside the SKU's own "7.5 mm" — the same size
    // twice, where editing the chart row would have created a duplicate SKU.
    // The chart is only a starting point for a shape with nothing priced yet.
    const norm = (s: string) => {
      const t = String(s).trim().toLowerCase().replace(/×/g, 'x').replace(/\s+/g, '');
      // 7.50 and 7.5 are one size; compare on the numbers, not the text.
      return t.replace(/(\d+(?:\.\d*?[1-9])?)\.?0*(?=\D|$)/g, '$1');
    };
    const own = onShape.map((p) => String(p.size)).filter(Boolean);
    const seen = new Set(own.map(norm));
    const sizes = own.length
      ? own
      : sizesFor(cat, active).filter((s) => !seen.has(norm(s)));
    const bySize = new Map(onShape.map((p) => [norm(String(p.size)), p] as const));

    const rows = sizes.map((size) => {
      const sku = bySize.get(norm(size));
      return {
        size,
        skuId: sku?.id ?? null,
        name: sku?.name ?? null,
        rate: sku ? sku.price : suggestedRate(basePrice, size),
        pcsPerPacket: sku?.pcsPerPacket ?? chartPacketPcs(cat, size),
        // false = these numbers are the chart's suggestion, not saved data.
        saved: !!sku,
      };
    });

    return ok(res, { cat, shape: active, shapes, unit, rows });
  })
);

// PUT /admin/pricing/row — save one row, creating the SKU if this size has none.
const pricingRowSchema = z.object({
  cat: z.string().min(1),
  shape: z.string().min(1),
  size: z.string().min(1),
  rate: z.number().int().min(0),
  pcsPerPacket: z.number().int().min(1).nullable().optional(),
});

adminRouter.put(
  '/pricing/row',
  ...officeOnly,
  asyncHandler(async (req, res) => {
    const parsed = pricingRowSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const { cat, shape, size, rate, pcsPerPacket } = parsed.data;

    // Prefer the SKU already on this category+shape+size over the generated id,
    // so editing a bulk-uploaded row updates it instead of creating a twin.
    const existing =
      (await prisma.product.findFirst({ where: { cat, shape, size } })) ??
      (await prisma.product.findUnique({ where: { id: matrixSkuId(cat, shape, size) } }));

    if (existing) {
      const updated = await prisma.product.update({
        where: { id: existing.id },
        data: { price: rate, ...(pcsPerPacket !== undefined ? { pcsPerPacket } : {}) },
      });
      return ok(res, { row: updated, created: false });
    }

    const category = await prisma.category.findUnique({ where: { key: cat } });
    const created = await prisma.product.create({
      data: {
        id: matrixSkuId(cat, shape, size),
        name: `${category?.name ?? cat} ${shape} ${size}`.trim(),
        cat,
        shape,
        size,
        price: rate,
        unit: `per ${unitFor(cat)}`,
        ...(pcsPerPacket !== undefined ? { pcsPerPacket } : {}),
      },
    });
    return ok(res, { row: created, created: true }, 201);
  })
);

adminRouter.post(
  '/products',
  ...officeOnly,
  asyncHandler(async (req, res) => {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;
    if (await prisma.product.findUnique({ where: { id: d.id } })) {
      return fail(res, 409, `SKU ${d.id} already exists`);
    }
    const created = await prisma.product.create({ data: { ...d, badge: d.badge ?? null, desc: d.desc ?? null } });
    return res.status(201).json(created);
  })
);

adminRouter.put(
  '/products/:id',
  ...officeOnly,
  asyncHandler(async (req, res) => {
    const parsed = productSchema.partial().omit({ id: true }).safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const current = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!current) return fail(res, 404, 'No such SKU');

    // Keep the count and the in/low/out flag consistent with each other.
    //
    // They are separate columns, and the Admin form only sends the fields that
    // were actually edited — so restocking by typing a new count left an older
    // "out" flag in place. The SKU then held stock but the storefront, which
    // reads the flag, still refused it: a restock that looked like it did
    // nothing. Orders also mark a SKU "out" automatically on reaching zero,
    // which is exactly how that stale flag arises.
    //
    // A count of 0 with an "in" flag is worse than cosmetic: the order path
    // reads 0 as "not tracked" and would let it be bought without limit.
    const data = { ...parsed.data };
    if (data.stockCount !== undefined) {
      const explicitStock = data.stock !== undefined;
      if (data.stockCount === 0) {
        data.stock = 'out'; // nothing on hand is never purchasable
      } else if (!explicitStock && current.stock === 'out') {
        data.stock = 'in'; // restocked, so clear the flag the customer sees
      }
    }

    return ok(res, await prisma.product.update({ where: { id: req.params.id }, data }));
  })
);

adminRouter.delete(
  '/products/:id',
  ...officeOnly,
  asyncHandler(async (req, res) => {
    if (!(await prisma.product.findUnique({ where: { id: req.params.id } }))) {
      return fail(res, 404, 'No such SKU');
    }
    await prisma.product.delete({ where: { id: req.params.id } });
    return ok(res, { deleted: req.params.id });
  })
);

// POST /admin/products/bulk — the real "Commit N products".
// The prototype counted the rows, said "N products committed to the catalogue"
// and discarded them. This upserts every row in one transaction: either the
// whole file lands or none of it does, so a half-imported catalogue is not a
// state the operator can end up in.
adminRouter.post(
  '/products/bulk',
  ...officeOnly,
  asyncHandler(async (req, res) => {
    const parsed = z.object({ products: z.array(productSchema).min(1).max(5000) }).safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const rows = parsed.data.products;

    // Reject unknown categories up front — a typo'd category would otherwise
    // create SKUs that never appear anywhere.
    const known = new Set((await prisma.category.findMany({ select: { key: true } })).map((c) => c.key));
    const bad = [...new Set(rows.filter((r) => !known.has(r.cat)).map((r) => r.cat))];
    if (bad.length) {
      return fail(res, 400, `Unknown categor${bad.length > 1 ? 'ies' : 'y'}: ${bad.join(', ')}`);
    }

    const before = await prisma.product.count();
    await prisma.$transaction(
      rows.map((d) =>
        prisma.product.upsert({
          where: { id: d.id },
          create: { ...d, badge: d.badge ?? null, desc: d.desc ?? null },
          update: { ...d, badge: d.badge ?? null, desc: d.desc ?? null },
        })
      )
    );
    const after = await prisma.product.count();
    return ok(res, { received: rows.length, created: after - before, updated: rows.length - (after - before) });
  })
);

// ---------------------------------------------------------------------------
// Image upload -> object storage.
//
// The Admin app posts the file here and stores only the returned URL, so image
// bytes never sit in the database or travel through the catalogue API.
// ---------------------------------------------------------------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIME.includes(file.mimetype)) return cb(null, true);
    cb(new Error(`Unsupported image type "${file.mimetype}". Use JPG, PNG, WebP, GIF, SVG or AVIF.`));
  },
});

adminRouter.post(
  '/upload',
  ...officeOnly,
  (req, res, next) =>
    upload.single('file')(req, res, (err: unknown) => {
      // Multer rejects on size/type; answer with the reason instead of a 500.
      if (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        return fail(res, 400, msg.includes('File too large') ? 'That image is larger than 8 MB.' : msg);
      }
      next();
    }),
  asyncHandler(async (req, res) => {
    if (!config.spaces.configured) {
      return fail(res, 503, 'Object storage is not configured yet — set SPACES_KEY / SPACES_SECRET / SPACES_BUCKET.');
    }
    const file = (req as typeof req & { file?: Express.Multer.File }).file;
    if (!file) return fail(res, 400, 'No file was uploaded.');

    const folder = typeof req.query.folder === 'string' ? req.query.folder : 'misc';
    const out = await putImage(file.buffer, file.mimetype, folder);
    return ok(res, out);
  })
);

// Lets the Admin app know whether to upload or fall back to inline data URLs.
adminRouter.get(
  '/upload/status',
  ...officeOnly,
  asyncHandler(async (_req, res) => ok(res, { configured: config.spaces.configured }))
);
