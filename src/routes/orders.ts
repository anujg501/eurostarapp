import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { asyncHandler, fail, ok, failValidation } from '../util/http';
import { AuthedRequest, authenticate } from '../auth/middleware';
import { computeTotals, dispatchDate, effectiveUnitPrice } from '../services/totals';
import { nextOrderId } from '../services/ids';

export const ordersRouter = Router();

const lineSchema = z.object({
  skuId: z.string().optional(),
  categoryKey: z.string().optional(),
  grade: z.string().optional(),
  colour: z.string().optional(),
  shape: z.string().optional(),
  size: z.string().optional(),
  unit: z.string().min(1),
  qty: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative(),
  priceOverride: z.number().int().nonnegative().optional(), // office only
});

const createOrderSchema = z.object({
  customerId: z.string().optional(),
  // A quick inline customer (rep/office adding a walk-in at checkout).
  customer: z
    .object({ name: z.string().optional(), phone: z.string().optional(), city: z.string().optional() })
    .optional(),
  code: z.string().optional(),
  city: z.string().optional(),
  items: z.array(lineSchema).min(1),
  source: z.enum(['app', 'rep', 'office', 'offline']).optional(),
  status: z.enum(['active', 'confirmed']).optional(),
  // Client may send its own reference id (e.g. an offline-generated ESO-…);
  // we keep it for idempotency but the server id is authoritative.
  clientRef: z.string().optional(),
});

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
    gst: o.gst,
    courier: o.courier,
    value: o.grandTotal,
    grandTotal: o.grandTotal,
    dispatchBy: o.dispatchBy,
    status: o.status,
    source: o.source,
    createdAt: o.createdAt,
    items: (o.lines ?? []).map((l: any) => ({
      skuId: l.skuId,
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

// POST /orders — create the real order (the CRM/back-office stream).
ordersRouter.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;
    const me = req.user!;

    // Only office can override prices. Silently ignore overrides from others.
    const canOverride = me.role === 'office';

    // Resolve the customer (existing, or the customer's own account).
    let customer = d.customerId
      ? await prisma.customer.findUnique({ where: { id: d.customerId } })
      : null;

    // Figure out the rep on the order.
    let repName: string | null = null;
    let repId: string | null = null;
    if (me.role === 'rep' || me.role === 'office') {
      repName = me.name;
      repId = me.repId ?? null;
    }

    const lines = d.items.map((l) => {
      const override = canOverride ? l.priceOverride ?? null : null;
      return {
        ...l,
        priceOverride: override,
        overrideBy: override != null ? me.sub : null,
        lineTotal: effectiveUnitPrice({ unitPrice: l.unitPrice, priceOverride: override, qty: l.qty }) * l.qty,
      };
    });

    const totals = computeTotals(
      lines.map((l) => ({ unitPrice: l.unitPrice, priceOverride: l.priceOverride, qty: l.qty }))
    );

    const status = d.status ?? (me.role === 'customer' ? 'active' : 'active');
    const id = await nextOrderId();

    const order = await prisma.order.create({
      data: {
        id,
        customerId: customer?.id,
        repUserId: me.role !== 'customer' ? me.sub : null,
        customerName: customer?.name ?? d.customer?.name ?? me.name,
        customerCode: customer?.code ?? d.code,
        city: customer?.city ?? d.customer?.city ?? d.city,
        repName,
        repId,
        subtotal: totals.subtotal,
        gst: totals.gst,
        courier: totals.courier,
        grandTotal: totals.grandTotal,
        dispatchBy: status === 'confirmed' ? dispatchDate() : null,
        status,
        source: d.source ?? (me.role === 'customer' ? 'app' : me.role),
        lines: {
          create: lines.map((l) => ({
            skuId: l.skuId,
            categoryKey: l.categoryKey,
            grade: l.grade,
            colour: l.colour,
            shape: l.shape,
            size: l.size,
            unit: l.unit,
            qty: l.qty,
            unitPrice: l.unitPrice,
            priceOverride: l.priceOverride,
            overrideBy: l.overrideBy,
            lineTotal: l.lineTotal,
          })),
        },
      },
      include: { lines: true },
    });

    return ok(res, serialiseOrder(order), 201);
  })
);

// GET /orders?scope=…&status=active|confirmed
ordersRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    const me = req.user!;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const scope = typeof req.query.scope === 'string' ? req.query.scope : undefined;

    // Customers only ever see their own orders.
    const where: any = { ...(status ? { status } : {}) };
    if (me.role === 'customer') {
      // Match by the customer's linked account or their phone-based name.
      where.OR = [{ customerId: me.sub }, { repUserId: null, customerName: me.name }];
    } else if (me.role === 'rep' && scope !== 'all') {
      where.repUserId = me.sub;
    }
    // office (and rep scope=all) see everything.

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

    const order = await prisma.order.update({
      where: { id: existing.id },
      data: {
        status: 'confirmed',
        dispatchBy: existing.dispatchBy ?? dispatchDate(),
      },
      include: { lines: true },
    });
    return ok(res, serialiseOrder(order));
  })
);
