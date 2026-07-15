import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../db';
import { config } from '../config';
import { asyncHandler, fail, ok, failValidation } from '../util/http';
import { AuthedRequest, authenticate, optionalAuth } from '../auth/middleware';
import { dispatchInfo } from '../services/totals';

export const paymentsRouter = Router();

function serialisePayment(p: any) {
  return {
    id: p.id,
    orderId: p.orderId,
    custId: p.custId ?? p.customerId,
    custCode: p.custCode,
    custName: p.custName,
    mode: p.mode,
    amount: p.amount,
    utr: p.utr,
    date: p.date,
    by: p.by,
    contact: p.contact,
    img: p.img,
    status: p.status,
    source: p.source,
    loggedAt: p.loggedAt,
  };
}

async function markOrderPaid(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  const dispatch = order.dispatchBy ? null : dispatchInfo(order.isExport);
  await prisma.order.update({
    where: { id: orderId },
    data: {
      paid: true,
      status: 'confirmed',
      ...(dispatch ? { dispatchBy: dispatch.date, dispatchByLabel: dispatch.label } : {}),
    },
  });
}

// POST /payments — record a payment (was eurostar-crm-incoming-payments).
const createSchema = z.object({
  id: z.string().optional(),
  orderId: z.string().optional(),
  custId: z.string().optional(),
  custCode: z.string().optional(),
  custName: z.string().optional(),
  mode: z.enum(['upi', 'card', 'netbanking', 'neft', 'qr']),
  amount: z.number().int().positive(),
  utr: z.string().optional(),
  date: z.string().optional(),
  by: z.string().optional(),
  contact: z.string().optional(),
  img: z.string().nullable().optional(),
  status: z.enum(['pending', 'confirmed', 'failed']).optional(),
  source: z.string().optional(),
});

paymentsRouter.post(
  '/',
  optionalAuth, // session used when present; otherwise the app supplies the details
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;
    const me = req.user; // may be undefined

    const id = d.id ?? (d.orderId ? `PAY-APP-${d.orderId}` : `PAY-${Date.now()}`);
    const status = d.status ?? 'confirmed';
    const data = {
      orderId: d.orderId,
      customerId: d.custId,
      custId: d.custId,
      custCode: d.custCode,
      custName: d.custName,
      mode: d.mode,
      amount: d.amount,
      utr: d.utr,
      date: d.date ?? new Date().toISOString().slice(0, 10),
      by: d.by ?? me?.name,
      contact: d.contact,
      img: d.img ?? null,
      status,
      source: d.source ?? 'Sales App',
      receivedById: me?.sub ?? null,
    };

    // Upsert by id so a re-sent payment does not duplicate (client dedups by orderId).
    const payment = await prisma.payment.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });

    if (status === 'confirmed' && d.orderId) await markOrderPaid(d.orderId);

    return ok(res, serialisePayment(payment), 201);
  })
);

// GET /payments?orderId=…&customer=…
paymentsRouter.get(
  '/',
  optionalAuth, // CRM reads this without a session for now (locked down in Phase 6)
  asyncHandler(async (req, res) => {
    const { orderId, customer } = req.query;
    const payments = await prisma.payment.findMany({
      where: {
        ...(typeof orderId === 'string' ? { orderId } : {}),
        ...(typeof customer === 'string' ? { customerId: customer } : {}),
      },
      orderBy: { loggedAt: 'desc' },
      take: 200,
    });
    return ok(res, payments.map(serialisePayment));
  })
);

// GET /payments/qr?orderId=…&amount=… — company UPI QR / intent.
paymentsRouter.get(
  '/qr',
  authenticate,
  asyncHandler(async (req, res) => {
    const orderId = typeof req.query.orderId === 'string' ? req.query.orderId : undefined;
    let amount = typeof req.query.amount === 'string' ? parseInt(req.query.amount, 10) : undefined;

    if (orderId && !amount) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      amount = order?.grand;
    }

    const params = new URLSearchParams({ pa: config.company.upiId, pn: config.company.upiName, cu: 'INR' });
    if (amount) params.set('am', String(amount));
    if (orderId) params.set('tn', `Order ${orderId}`);

    return ok(res, {
      upiId: config.company.upiId,
      payeeName: config.company.upiName,
      amount,
      orderId,
      upiIntent: `upi://pay?${params.toString()}`,
      qrAsset: 'assets/eurostar-upi-qr.svg',
    });
  })
);

// POST /payments/webhook — a PSP confirms receipt and we flip the order.
// NOTE: in production, verify the provider's signature before trusting this.
const webhookSchema = z.object({
  orderId: z.string(),
  utr: z.string().optional(),
  amount: z.number().int().positive().optional(),
  status: z.enum(['confirmed', 'failed']).default('confirmed'),
  mode: z.enum(['upi', 'card', 'netbanking', 'neft', 'qr']).default('upi'),
});

paymentsRouter.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const parsed = webhookSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;

    const order = await prisma.order.findUnique({ where: { id: d.orderId } });
    if (!order) return fail(res, 404, 'Unknown order');

    const id = `PAY-PSP-${d.orderId}`;
    await prisma.payment.upsert({
      where: { id },
      create: {
        id,
        orderId: order.id,
        customerId: order.customerId,
        custCode: order.customerCode,
        custName: order.customerName,
        mode: d.mode,
        amount: d.amount ?? order.grand,
        utr: d.utr,
        date: new Date().toISOString().slice(0, 10),
        status: d.status,
        source: 'PSP Webhook',
      },
      update: { status: d.status, utr: d.utr },
    });

    if (d.status === 'confirmed') await markOrderPaid(order.id);

    return ok(res, { ok: true });
  })
);

// ---------------------------------------------------------------------------
// Razorpay online payments
// ---------------------------------------------------------------------------

// GET /payments/razorpay/key — tell the browser whether online payment is live
// and hand it the PUBLIC key id to open the checkout box. Never exposes the
// secret. When not configured, the app falls back to its simulated flow.
paymentsRouter.get(
  '/razorpay/key',
  asyncHandler(async (_req, res) =>
    ok(res, { configured: config.razorpay.configured, keyId: config.razorpay.keyId || null })
  )
);

// POST /payments/razorpay/order — create a Razorpay order for one of our orders
// (or a raw rupee amount). The browser uses the returned razorpayOrderId to open
// the checkout box. Returns { configured:false } when keys aren't set yet.
const rpOrderSchema = z.object({
  orderId: z.string().optional(),
  amount: z.number().positive().optional(), // rupees; converted to paise below
});
paymentsRouter.post(
  '/razorpay/order',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const parsed = rpOrderSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const { orderId } = parsed.data;
    let amountRupees = parsed.data.amount;

    if (orderId && amountRupees == null) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return fail(res, 404, 'Unknown order');
      amountRupees = order.grand;
    }
    if (!amountRupees || amountRupees <= 0) {
      return fail(res, 400, 'A positive amount or a valid orderId is required');
    }

    if (!config.razorpay.configured) return ok(res, { configured: false });

    const auth = Buffer.from(`${config.razorpay.keyId}:${config.razorpay.keySecret}`).toString('base64');
    const resp = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount: Math.round(amountRupees * 100), // paise
        currency: 'INR',
        receipt: orderId ?? `rcpt_${Date.now()}`,
        notes: orderId ? { orderId } : {},
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      return fail(res, 502, 'Could not start the payment. Please try again.', { provider: text.slice(0, 300) });
    }
    const rp: any = await resp.json();
    return ok(res, {
      configured: true,
      keyId: config.razorpay.keyId,
      razorpayOrderId: rp.id,
      amount: rp.amount, // paise
      currency: rp.currency,
      orderId: orderId ?? null,
      name: config.company.upiName,
    });
  })
);

// POST /payments/razorpay/verify — verify the payment signature (proves the
// payment is genuine and came from Razorpay), then record it and mark the order
// paid. This signature check is the ONLY thing that marks an online order paid.
const rpVerifySchema = z.object({
  orderId: z.string(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});
paymentsRouter.post(
  '/razorpay/verify',
  optionalAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = rpVerifySchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;
    if (!config.razorpay.configured) return fail(res, 400, 'Payments are not configured');

    const expected = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(`${d.razorpayOrderId}|${d.razorpayPaymentId}`)
      .digest('hex');

    // Constant-time comparison so we don't leak the signature via timing.
    const a = Buffer.from(expected);
    const b = Buffer.from(d.razorpaySignature);
    const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!valid) return fail(res, 400, 'Payment could not be verified');

    const order = await prisma.order.findUnique({ where: { id: d.orderId } });
    if (!order) return fail(res, 404, 'Unknown order');

    const me = req.user;
    const id = `PAY-RZP-${d.razorpayPaymentId}`;
    await prisma.payment.upsert({
      where: { id },
      create: {
        id,
        orderId: order.id,
        customerId: order.customerId,
        custCode: order.customerCode,
        custName: order.customerName,
        mode: 'card', // Razorpay aggregates UPI/card/netbanking; logged as the online bucket
        amount: order.grand,
        utr: d.razorpayPaymentId,
        date: new Date().toISOString().slice(0, 10),
        by: me?.name,
        status: 'confirmed',
        source: 'Razorpay',
        receivedById: me?.sub ?? null,
      },
      update: { status: 'confirmed', utr: d.razorpayPaymentId },
    });

    await markOrderPaid(order.id);
    return ok(res, { verified: true, orderId: order.id });
  })
);
