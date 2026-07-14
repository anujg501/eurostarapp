import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { config } from '../config';
import { asyncHandler, fail, ok, failValidation } from '../util/http';
import { AuthedRequest, authenticate } from '../auth/middleware';
import { dispatchDate } from '../services/totals';

export const paymentsRouter = Router();

function serialisePayment(p: any) {
  return {
    id: p.id,
    orderId: p.orderId,
    custId: p.customerId,
    custCode: p.custCode,
    custName: p.custName,
    mode: p.mode,
    amount: p.amount,
    utr: p.utr,
    status: p.status,
    ts: p.ts,
  };
}

// POST /payments — record a payment against an order.
const createSchema = z.object({
  orderId: z.string().optional(),
  custId: z.string().optional(),
  custCode: z.string().optional(),
  custName: z.string().optional(),
  mode: z.enum(['upi', 'card', 'netbanking', 'neft', 'qr']),
  amount: z.number().int().positive(),
  utr: z.string().optional(),
});

paymentsRouter.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;
    const me = req.user!;

    const payment = await prisma.payment.create({
      data: {
        orderId: d.orderId,
        customerId: d.custId,
        custCode: d.custCode,
        custName: d.custName,
        mode: d.mode,
        amount: d.amount,
        utr: d.utr,
        status: 'received',
        receivedById: me.sub,
      },
    });

    // A confirmed payment flips its order to "confirmed".
    if (d.orderId) {
      await prisma.order
        .update({
          where: { id: d.orderId },
          data: { status: 'confirmed', dispatchBy: dispatchDate() },
        })
        .catch(() => null);
    }

    return ok(res, serialisePayment(payment), 201);
  })
);

// GET /payments?orderId=…&customer=…
paymentsRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { orderId, customer } = req.query;
    const payments = await prisma.payment.findMany({
      where: {
        ...(typeof orderId === 'string' ? { orderId } : {}),
        ...(typeof customer === 'string' ? { customerId: customer } : {}),
      },
      orderBy: { ts: 'desc' },
      take: 200,
    });
    return ok(res, payments.map(serialisePayment));
  })
);

// GET /payments/qr?orderId=…&amount=… — company UPI QR / intent string.
paymentsRouter.get(
  '/qr',
  authenticate,
  asyncHandler(async (req, res) => {
    const orderId = typeof req.query.orderId === 'string' ? req.query.orderId : undefined;
    let amount = typeof req.query.amount === 'string' ? parseInt(req.query.amount, 10) : undefined;

    if (orderId && !amount) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      amount = order?.grandTotal;
    }

    // Standard UPI deep-link the frontend can render as a QR image.
    const params = new URLSearchParams({
      pa: config.company.upiId,
      pn: config.company.upiName,
      cu: 'INR',
    });
    if (amount) params.set('am', String(amount));
    if (orderId) params.set('tn', `Order ${orderId}`);
    const upiIntent = `upi://pay?${params.toString()}`;

    return ok(res, {
      upiId: config.company.upiId,
      payeeName: config.company.upiName,
      amount,
      orderId,
      upiIntent,
    });
  })
);

// POST /payments/webhook — a PSP confirms receipt and we flip the order.
// NOTE: in production, verify the provider's signature before trusting this.
const webhookSchema = z.object({
  orderId: z.string(),
  utr: z.string().optional(),
  amount: z.number().int().positive().optional(),
  status: z.enum(['received', 'failed']).default('received'),
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

    await prisma.payment.create({
      data: {
        orderId: order.id,
        customerId: order.customerId,
        custCode: order.customerCode,
        custName: order.customerName,
        mode: d.mode,
        amount: d.amount ?? order.grandTotal,
        utr: d.utr,
        status: d.status,
      },
    });

    if (d.status === 'received') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'confirmed', dispatchBy: order.dispatchBy ?? dispatchDate() },
      });
    }

    return ok(res, { ok: true });
  })
);
