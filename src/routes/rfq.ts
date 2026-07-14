import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { config } from '../config';
import { asyncHandler, fail, ok, failValidation } from '../util/http';
import { AuthedRequest, authenticate } from '../auth/middleware';

export const rfqRouter = Router();

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

const lineSchema = z.object({
  categoryKey: z.string().optional(),
  grade: z.string().optional(),
  colour: z.string().optional(),
  shape: z.string().optional(),
  size: z.string().optional(),
  qty: z.number().int().positive().optional(),
  note: z.string().optional(),
});

// POST /rfq — request for quote, minimum ₹10,000 order value.
const createSchema = z.object({
  customerId: z.string().optional(),
  value: z.number().int().nonnegative(),
  items: z.array(lineSchema).min(1),
});

rfqRouter.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;

    if (d.value < config.rules.rfqMinValue) {
      return fail(res, 422, `RFQ needs a minimum order value of ₹${config.rules.rfqMinValue.toLocaleString('en-IN')}`);
    }

    const rfq = await prisma.rfq.create({
      data: {
        customerId: d.customerId,
        value: d.value,
        lines: JSON.stringify(d.items),
        status: 'open',
      },
    });

    return ok(res, { id: rfq.id, value: rfq.value, status: rfq.status, items: d.items }, 201);
  })
);

// GET /rfq — list RFQs (customer sees own; staff see all).
rfqRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    const me = req.user!;
    const rfqs = await prisma.rfq.findMany({
      where: me.role === 'customer' ? { customerId: me.sub } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return ok(
      res,
      rfqs.map((r) => ({
        id: r.id,
        customerId: r.customerId,
        value: r.value,
        status: r.status,
        items: safeParse(r.lines),
        createdAt: r.createdAt,
      }))
    );
  })
);
