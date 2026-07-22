import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { asyncHandler, fail, ok, failValidation } from '../util/http';
import { AuthedRequest, authenticate, optionalAuth } from '../auth/middleware';
import { computeTotals, dispatchInfo, isExportCity } from '../services/totals';
import { getStoreRules } from '../services/settings';
import { nextOrderId } from '../services/ids';
import { sendWhatsApp } from '../services/otp';
import { config } from '../config';

export const ordersRouter = Router();

// A cart/order line. Flexible to accept the client's cart-line fields
// (pid, ct, perCtPrice, lineTotal, unitMode…) as well as plainer names.
const lineSchema = z.object({
  pid: z.string().optional(),
  name: z.string().optional(),
  cat: z.string().optional(),
  categoryKey: z.string().optional(),
  grade: z.string().optional(),
  quality: z.string().optional(),
  color: z.string().optional(),
  colour: z.string().optional(),
  shape: z.string().optional(),
  size: z.string().optional(),
  unit: z.string().optional(),
  unitMode: z.string().optional(),
  ct: z.number().optional(), // quantity in the chosen unit (carats/packets/pieces)
  qty: z.number().optional(), // total pieces (derived)
  unitPrice: z.number().optional(),
  perCtPrice: z.number().optional(), // ₹ per unit — drives lineTotal
  lineTotal: z.number().optional(),
  priceOverride: z.number().int().nonnegative().optional(), // office only
  basePrice: z.number().optional(),
  priceEdited: z.boolean().optional(),
});
type LineIn = z.infer<typeof lineSchema>;

const createOrderSchema = z.object({
  id: z.string().optional(), // client-generated id (e.g. "SO-24987")
  customerId: z.string().optional(),
  // "customer" may be an object (rich checkout payload) or a plain name string
  // (the minimal object the app mirrors to eurostar-crm-incoming-orders).
  customer: z
    .union([
      z.string(),
      z
        .object({
          name: z.string().optional(),
          phone: z.string().optional(),
          code: z.string().optional(),
          id: z.string().optional(),
          isNew: z.boolean().optional(),
        })
        .partial(),
    ])
    .optional(),
  code: z.string().optional(),
  city: z.string().optional(),
  rep: z.string().optional(), // rep name (from the client CRM order object)
  repId: z.string().optional(),
  value: z.number().optional(), // grand total (the client CRM object's "value")
  items: z.array(lineSchema).optional(),
  // The storefront's confirmation screen sends the cart under "lines". Accepting
  // both is what makes a placed order arrive with its contents — without this
  // every real order reached the office as a bare total with no products on it.
  lines: z.array(lineSchema).optional(),
  subtotal: z.number().optional(), // client-computed (recomputed server-side when items present)
  isExport: z.boolean().optional(),
  paid: z.boolean().optional(),
  status: z.enum(['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled']).optional(),
  source: z.string().optional(),
  dispatchBy: z.string().optional(), // client label, e.g. "Wed, 17 Jul"
  queuedOffline: z.boolean().optional(),
  clientTs: z.number().optional(),
  ts: z.number().optional(), // the client CRM object uses "ts"
});

// Per-line unit rate (per ct/pkt/pc) and quantity, tolerant of field naming.
function lineRate(l: LineIn): number {
  return l.perCtPrice ?? l.unitPrice ?? 0;
}
function lineUnits(l: LineIn): number {
  return l.ct ?? l.qty ?? 0;
}
// Pieces a line takes out of inventory. stockCount is a piece count, so only a
// line that reports pieces can be subtracted from it — one measured in carats
// or packets is left alone rather than decremented in the wrong unit.
function linePieces(l: LineIn): number {
  const unit = String(l.unitMode ?? l.unit ?? '');
  const pieces = l.qty ?? (/pc/i.test(unit) ? l.ct : undefined);
  return typeof pieces === 'number' && pieces > 0 ? Math.floor(pieces) : 0;
}

// Total pieces wanted per SKU across an order's lines (the same SKU can appear
// on more than one line).
function piecesBySku(items: LineIn[]): Map<string, number> {
  const want = new Map<string, number>();
  for (const l of items) {
    if (!l.pid) continue;
    const n = linePieces(l);
    if (n > 0) want.set(l.pid, (want.get(l.pid) ?? 0) + n);
  }
  return want;
}

class OutOfStock extends Error {
  constructor(readonly sku: string, readonly available: number, readonly wanted: number) {
    super(`Only ${available} left of ${sku} — ${wanted} requested`);
  }
}

function effectiveLineTotal(l: LineIn, canOverride: boolean): number {
  if (canOverride && l.priceOverride != null) return lineUnits(l) * l.priceOverride;
  return l.lineTotal ?? lineRate(l) * lineUnits(l);
}

function serialiseOrder(o: any) {
  return {
    id: o.id,
    customer: o.customerName,
    customerId: o.customerId,
    code: o.customerCode,
    city: o.city,
    rep: o.repName,
    repId: o.repId,
    subtotal: o.subtotal,
    tax: o.tax,
    shipping: o.shipping,
    insurance: o.insurance,
    value: o.grand, // the client order object calls the grand total "value"
    grand: o.grand,
    isExport: o.isExport,
    paid: o.paid,
    dispatchBy: o.dispatchByLabel, // client stores the label string
    dispatchDate: o.dispatchBy,
    status: o.status,
    source: o.source,
    queuedOffline: o.queuedOffline,
    ts: o.clientTs ? Number(o.clientTs) : o.createdAt?.getTime?.(),
    createdAt: o.createdAt,
    items: (o.lines ?? []).map((l: any) => ({
      pid: l.skuId,
      categoryKey: l.categoryKey,
      grade: l.grade,
      colour: l.colour,
      shape: l.shape,
      size: l.size,
      unit: l.unit,
      qty: l.qty,
      unitPrice: l.unitPrice,
      priceOverride: l.priceOverride,
      lineTotal: l.lineTotal,
    })),
  };
}

// POST /orders — create (or upsert, for offline flush) the real order.
// This is the stream the CRM/back-office consumes (was eurostar-crm-incoming-orders).
ordersRouter.post(
  '/',
  optionalAuth, // a logged-in session is used when present; otherwise the app
  asyncHandler(async (req: AuthedRequest, res) => {
    // supplies customer/rep details in the payload (real user auth lands in Phase 6).
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;
    const me = req.user; // may be undefined
    const staff = !!me && me.role !== 'customer';
    const canOverride = me?.role === 'office'; // only back office may override price

    const customer = d.customerId
      ? await prisma.customer.findUnique({ where: { id: d.customerId } })
      : null;

    // "customer" can be a name string or an object.
    const customerObj = typeof d.customer === 'object' ? d.customer : undefined;
    const customerNameFromPayload = typeof d.customer === 'string' ? d.customer : customerObj?.name;

    const city = customer?.city ?? d.city ?? null;
    const isExport = d.isExport ?? isExportCity(city);
    const rules = await getStoreRules(); // Admin Settings overrides, not the defaults

    // Build lines and the authoritative subtotal (when line items are provided).
    const items = d.items ?? d.lines ?? [];

    // Price from the catalogue, not from the request. The storefront sends only
    // {pid, qty}, so without this lookup every line lands at ₹0 — and a price
    // supplied by the caller is not something to bill on regardless. Only the
    // back office may override, via priceOverride below.
    const skuIds = [...new Set(items.map((l) => l.pid).filter((x): x is string => !!x))];
    const catalogue = new Map(
      skuIds.length
        ? (await prisma.product.findMany({ where: { id: { in: skuIds } } })).map((p) => [p.id, p] as const)
        : []
    );

    const lines = items.map((l) => {
      const sku = l.pid ? catalogue.get(l.pid) : undefined;
      // Fall back to the catalogue rate when the caller sent no price.
      const priced = sku && lineRate(l) === 0 ? { ...l, unitPrice: sku.price } : l;

      const total = effectiveLineTotal(priced, canOverride);
      const override = canOverride ? l.priceOverride ?? null : null;
      return {
        skuId: l.pid,
        categoryKey: l.cat ?? l.categoryKey ?? sku?.cat,
        grade: l.grade ?? l.quality,
        colour: l.colour ?? l.color ?? sku?.tone,
        shape: l.shape ?? sku?.shape,
        size: l.size ?? sku?.size,
        unit: l.unitMode ?? l.unit ?? sku?.unit ?? 'pc',
        qty: lineUnits(priced),
        unitPrice: lineRate(priced),
        priceOverride: override,
        overrideBy: override != null ? me?.sub ?? 'app' : null,
        lineTotal: total,
      };
    });

    // With items: compute totals from the rules. Without items (the mirrored CRM
    // object): trust the client-provided grand "value".
    let subtotal: number, tax: number, shipping: number, insurance: number, grand: number;
    if (items.length) {
      subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
      const totals = computeTotals([{ unitPrice: subtotal, qty: 1 }], isExport, rules);
      tax = totals.tax;
      shipping = totals.shipping;
      insurance = totals.insurance;
      grand = totals.grand;
    } else {
      grand = d.value ?? d.subtotal ?? 0;
      subtotal = d.subtotal ?? grand;
      tax = 0;
      shipping = 0;
      insurance = 0;
    }

    const dispatch = dispatchInfo(isExport, new Date(), rules);
    const dispatchLabel = d.dispatchBy ?? dispatch.label;

    const id = d.id ?? (await nextOrderId());
    const paid = d.paid ?? false;
    const status = d.status ?? (paid ? 'confirmed' : 'pending');

    const data = {
      customerId: customer?.id,
      repUserId: staff ? me!.sub : null,
      customerName: customer?.name ?? customerNameFromPayload ?? me?.name,
      customerCode: customer?.code ?? customerObj?.code ?? d.code,
      city,
      repName: d.rep ?? (staff ? me!.name : null),
      repId: d.repId ?? (staff ? me!.repId ?? null : null),
      subtotal,
      tax,
      shipping,
      insurance,
      grand,
      isExport,
      paid,
      dispatchBy: dispatch.date,
      dispatchByLabel: dispatchLabel,
      status,
      source: d.source ?? 'Sales App',
      queuedOffline: d.queuedOffline ?? false,
      clientTs: d.clientTs != null ? String(d.clientTs) : d.ts != null ? String(d.ts) : null,
    };

    // Stock comes off at placement, and only for an order id that is new. The
    // client re-posts eurostar-crm-incoming-orders on every page load, so
    // decrementing on each POST would drain inventory for one real order.
    const alreadyPlaced = !!(await prisma.order.findUnique({ where: { id }, select: { id: true } }));

    let order;
    try {
      // Upsert by id so an offline order flushed twice does not duplicate
      // (the client dedups eurostar-crm-incoming-orders by id).
      order = await prisma.$transaction(async (tx) => {
        if (!alreadyPlaced) {
          for (const [pid, wanted] of piecesBySku(items)) {
            const sku = catalogue.get(pid);
            if (!sku) continue;

            // stockCount 0 is the schema default and means "not tracked". A SKU
            // that really has none left is flagged stock === 'out', which is
            // refused below; otherwise an untracked SKU would be unsellable.
            if (sku.stock === 'out') throw new OutOfStock(pid, 0, wanted);
            if (sku.stockCount <= 0) continue;

            // The gte guard makes the check and the write a single atomic step.
            // Reading the count and then writing it would let two orders for the
            // same last pieces both pass their check and oversell.
            const taken = await tx.product.updateMany({
              where: { id: pid, stockCount: { gte: wanted } },
              data: { stockCount: { decrement: wanted } },
            });
            if (taken.count !== 1) {
              const now = await tx.product.findUnique({ where: { id: pid }, select: { stockCount: true } });
              throw new OutOfStock(pid, now?.stockCount ?? 0, wanted);
            }

            // Exhausted now: mark it so the storefront stops offering it.
            await tx.product.updateMany({ where: { id: pid, stockCount: { lte: 0 } }, data: { stock: 'out' } });
          }
        }

        return tx.order.upsert({
          where: { id },
          create: { id, ...data, lines: { create: lines } },
          update: {
            ...data,
            lines: items.length ? { deleteMany: {}, create: lines } : undefined,
          },
          include: { lines: true },
        });
      });
    } catch (e) {
      // The transaction rolled back, so no stock was taken and no order written.
      if (e instanceof OutOfStock) {
        return fail(res, 409, e.message, { sku: e.sku, available: e.available, wanted: e.wanted });
      }
      throw e;
    }

    return ok(res, serialiseOrder(order), 201);
  })
);

// GET /orders?scope=…&status=…
ordersRouter.get(
  '/',
  // Any signed-in user; the handler below scopes the result to what they may
  // see (customers -> their own orders, reps -> their own unless scope=all).
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    const me = req.user;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const scope = typeof req.query.scope === 'string' ? req.query.scope : undefined;

    const where: any = { ...(status ? { status } : {}) };
    if (me?.role === 'customer') {
      where.OR = [{ customerId: me.sub }, { repUserId: null, customerName: me.name }];
    } else if (me?.role === 'rep' && scope !== 'all') {
      where.repUserId = me.sub;
    }
    // office, no session (CRM), and rep scope=all see everything.

    const orders = await prisma.order.findMany({
      where,
      include: { lines: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return ok(res, orders.map(serialiseOrder));
  })
);

// GET /orders/:id
ordersRouter.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { lines: true } });
    if (!order) return fail(res, 404, 'Order not found');
    return ok(res, serialiseOrder(order));
  })
);

// POST /orders/:id/confirm — cash received / credit confirmed.
ordersRouter.post(
  '/:id/confirm',
  authenticate,
  asyncHandler(async (req, res) => {
    const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!existing) return fail(res, 404, 'Order not found');

    const dispatch = existing.dispatchBy ? null : dispatchInfo(existing.isExport);
    const order = await prisma.order.update({
      where: { id: existing.id },
      data: {
        status: 'confirmed',
        paid: true,
        ...(dispatch ? { dispatchBy: dispatch.date, dispatchByLabel: dispatch.label } : {}),
      },
      include: { lines: true },
    });
    return ok(res, serialiseOrder(order));
  })
);

// PUT /orders/:id — CRM pipeline update: courier, tracking, and status
// (new → confirmed → packed → shipped → delivered). Marking it shipped/dispatched
// writes a Mira shipment notification for the customer.
const pipelineSchema = z.object({
  status: z
    .enum([
      'pending', 'confirmed', 'packed', 'shipped', 'dispatched', 'out-for-delivery',
      'delivered', 'cancelled', 'rejected', 'returned', 'refunded',
    ])
    .optional(),
  courier: z.string().optional(),
  track: z.string().optional(),
});

ordersRouter.put(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (req.user!.role === 'customer') return fail(res, 403, 'Staff only');
    const parsed = pipelineSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;

    const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!existing) return fail(res, 404, 'Order not found');

    // Normalise "dispatched" (CRM term) to "shipped".
    const status = d.status === 'dispatched' ? 'shipped' : d.status;
    const order = await prisma.order.update({
      where: { id: existing.id },
      data: {
        ...(status ? { status } : {}),
        ...(d.courier !== undefined ? { courier: d.courier } : {}),
        ...(d.track !== undefined ? { track: d.track } : {}),
      },
      include: { lines: true },
    });

    // Cancelling releases the pieces the order took at placement. Guarded on
    // the previous status so cancelling an already-cancelled order cannot
    // credit the same stock twice.
    if (status === 'cancelled' && existing.status !== 'cancelled') {
      // Stored lines key the SKU as skuId; piecesBySku reads the payload's pid.
      const stored = order.lines.map((l) => ({ pid: l.skuId ?? undefined, qty: l.qty, unit: l.unit }));
      for (const [pid, pieces] of piecesBySku(stored as LineIn[])) {
        // Give back only to a SKU that was tracked when the order was placed:
        // either it still holds a count, or it was flagged out when it hit zero.
        // A SKU left untracked (count 0, not flagged out) was never decremented,
        // so crediting it here would invent stock that never existed.
        await prisma.product.updateMany({
          where: { id: pid, OR: [{ stockCount: { gt: 0 } }, { stock: 'out' }] },
          data: { stockCount: { increment: pieces } },
        });
        // It was flagged sold out on reaching zero; there is stock again now.
        await prisma.product.updateMany({
          where: { id: pid, stock: 'out', stockCount: { gt: 0 } },
          data: { stock: 'in' },
        });
      }
    }

    // On dispatch, notify the customer (the Mira shipment bus).
    const nowShipped = status === 'shipped' && existing.status !== 'shipped';
    if (nowShipped) {
      await prisma.notification.create({
        data: {
          customerId: order.customerId,
          kind: 'shipment',
          orderId: order.id,
          courier: order.courier,
          track: order.track,
          title: 'Your order has been dispatched',
          body: `Order ${order.id} is on its way${order.courier ? ` via ${order.courier}` : ''}${order.track ? ` (${order.track})` : ''}.`,
        },
      });

      // Also send a WhatsApp update, if a WhatsApp sender is configured and we
      // have the customer's phone. Never let a message failure break dispatch.
      if (config.twilio.whatsappFrom && order.customerId) {
        try {
          const cust = await prisma.customer.findUnique({ where: { id: order.customerId } });
          if (cust?.phone) {
            await sendWhatsApp(
              cust.phone,
              `📦 Eurostar: Order ${order.id} has been dispatched${order.courier ? ` via ${order.courier}` : ''}${order.track ? `. Tracking: ${order.track}` : ''}. Thank you for your business!`
            );
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('WhatsApp dispatch notification failed:', e);
        }
      }
    }

    return ok(res, serialiseOrder(order));
  })
);
