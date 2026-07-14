import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { asyncHandler, ok, failValidation } from '../util/http';
import { AuthedRequest, authenticate, requireStaff } from '../auth/middleware';

export const notificationsRouter = Router();

// GET /notifications — the signed-in customer's notifications (or by ?customer=).
notificationsRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    const me = req.user!;
    const customerId =
      me.role === 'customer' ? me.sub : typeof req.query.customer === 'string' ? req.query.customer : undefined;

    const items = await prisma.notification.findMany({
      where: { ...(customerId ? { customerId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return ok(res, items);
  })
);

// POST /notifications — staff push a shipment/info notification to a customer.
// Shipment notices mirror the client's eurostar-mira-notifications shape
// ({ orderId, courier, track, read }); "info" notices use title/body.
const createSchema = z
  .object({
    customerId: z.string().optional(),
    kind: z.enum(['shipment', 'info']).optional(),
    orderId: z.string().optional(),
    courier: z.string().optional(),
    track: z.string().optional(),
    title: z.string().optional(),
    body: z.string().optional(),
  })
  .refine((d) => d.orderId || d.title || d.body, { message: 'Provide an orderId (shipment) or title/body (info)' });

notificationsRouter.post(
  '/',
  authenticate,
  requireStaff,
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;
    const n = await prisma.notification.create({
      data: {
        customerId: d.customerId,
        kind: d.kind ?? (d.orderId ? 'shipment' : 'info'),
        orderId: d.orderId,
        courier: d.courier,
        track: d.track,
        title: d.title,
        body: d.body,
      },
    });
    return ok(res, n, 201);
  })
);

// POST /notifications/:id/read — mark as read.
notificationsRouter.post(
  '/:id/read',
  authenticate,
  asyncHandler(async (req, res) => {
    await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } }).catch(() => null);
    return ok(res, { ok: true });
  })
);
