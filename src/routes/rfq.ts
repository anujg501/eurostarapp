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
  city: z.string().optional(),
  // The CRM's rich fields (product/size/qty/weight/quality/contact/special/image)
  // that don't fit the line schema. Stored as JSON so the Enquiries screen shows
  // exactly what the customer typed.
  detail: z.record(z.any()).optional(),
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

    // Attribute to the signed-in customer. Customers are User rows; the master
    // record is a separate Customer keyed by phone, so resolve it by phone the
    // same way checkout does (me.sub is a User id, not a Customer id).
    let customerId: string | null = d.customerId ?? null;
    if (req.user?.role === 'customer') {
      const u = await prisma.user.findUnique({ where: { id: req.user.sub } });
      if (u?.phone) {
        const c = await prisma.customer.findFirst({ where: { phone: u.phone } });
        if (c) customerId = c.id;
      }
    }
    if (customerId) {
      const exists = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!exists) customerId = null;
    }

    const rfq = await prisma.rfq.create({
      data: {
        id: 'RFQ-' + Date.now().toString().slice(-6),
        customerId,
        value: d.value,
        lines: JSON.stringify(d.items),
        city: d.city ?? null,
        detail: d.detail ? JSON.stringify(d.detail) : null,
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
    // A customer sees only their own enquiries. RFQ.customerId is a Customer id,
    // but me.sub is the User id — resolve the master record by phone the same way
    // POST /rfq and checkout do, otherwise the customer's list comes back empty.
    let where = {};
    if (me.role === 'customer') {
      const u = await prisma.user.findUnique({ where: { id: me.sub } });
      const c = u?.phone ? await prisma.customer.findFirst({ where: { phone: u.phone } }) : null;
      // A customer with no resolvable master record has no RFQs to show; scope to
      // a non-existent id rather than returning everyone's.
      where = { customerId: c?.id ?? '__none__' };
    }
    const rfqs = await prisma.rfq.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { customer: { select: { code: true, name: true, city: true } } },
    });
    return ok(
      res,
      rfqs.map((r) => ({
        id: r.id,
        customerId: r.customerId,
        custCode: r.customer?.code ?? '',
        custName: r.customer?.name ?? '',
        value: r.value,
        status: r.status,
        items: safeParse(r.lines),
        assignedRep: r.assignedRep ?? '',
        city: r.city ?? r.customer?.city ?? '',
        detail: safeParse(r.detail ?? '{}'),
        quoteAmount: r.quoteAmount ?? null,
        quoteNote: r.quoteNote ?? '',
        quotedAt: r.quotedAt ?? null,
        createdAt: r.createdAt,
      }))
    );
  })
);

// PUT /rfq/:id — the CRM routes an enquiry to a rep (assignedRep) and marks it
// answered/closed. Staff only.
rfqRouter.put(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (req.user!.role === 'customer') return fail(res, 403, 'Staff only');
    const parsed = z
      .object({
        status: z.string().optional(),
        assignedRep: z.string().optional(),
        quoteAmount: z.number().int().positive().optional(),
        quoteNote: z.string().optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const existing = await prisma.rfq.findUnique({ where: { id: req.params.id } });
    if (!existing) return fail(res, 404, 'RFQ not found');
    const d = parsed.data;

    // Sending a quote is a distinct action: it records the price/note, stamps
    // who quoted and when, and moves the enquiry to "quoted" unless the caller
    // set a status explicitly.
    const quoting = d.quoteAmount !== undefined;
    const rfq = await prisma.rfq.update({
      where: { id: existing.id },
      data: {
        ...(d.status !== undefined ? { status: d.status } : quoting ? { status: 'quoted' } : {}),
        ...(d.assignedRep !== undefined ? { assignedRep: d.assignedRep } : {}),
        ...(quoting
          ? { quoteAmount: d.quoteAmount, quoteNote: d.quoteNote ?? '', quotedAt: new Date(), quotedById: req.user!.sub }
          : {}),
      },
    });
    return ok(res, {
      id: rfq.id,
      status: rfq.status,
      assignedRep: rfq.assignedRep ?? '',
      quoteAmount: rfq.quoteAmount ?? null,
      quoteNote: rfq.quoteNote ?? '',
      quotedAt: rfq.quotedAt ?? null,
    });
  })
);
