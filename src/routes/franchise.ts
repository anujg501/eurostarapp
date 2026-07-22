import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { asyncHandler, ok, fail, failValidation } from '../util/http';
import { authenticate, type AuthedRequest } from '../auth/middleware';

// Franchise enquiries. The Sales App "Join Franchise" form POSTs here (any
// visitor may apply, so create is unauthenticated); the CRM "Franchise
// Requests" screen lists and updates them (staff only).
export const franchiseRouter = Router();

const createSchema = z.object({
  name: z.string().min(1),
  firm: z.string().optional(),
  city: z.string().optional(),
  mobile: z.string().min(1),
  invest: z.string().optional(),
  exp: z.string().optional(),
  geo: z.string().optional(),
  area: z.string().optional(),
  floor: z.string().optional(),
  plans: z.string().optional(),
});

// POST /franchise — a new application from the storefront. Public.
franchiseRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;
    const row = await prisma.franchise.create({
      data: {
        name: d.name,
        firm: d.firm ?? '',
        city: d.city ?? '',
        mobile: d.mobile,
        invest: d.invest ?? '',
        exp: d.exp ?? '',
        geo: d.geo ?? '',
        area: d.area ?? '',
        floor: d.floor ?? '',
        plans: d.plans ?? '',
      },
    });
    return ok(res, { id: row.id, status: row.status }, 201);
  })
);

// GET /franchise — the CRM list. Staff only.
franchiseRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (req.user?.role === 'customer') return fail(res, 403, 'Staff only');
    const rows = await prisma.franchise.findMany({ orderBy: { createdAt: 'desc' }, take: 500 });
    return ok(res, rows);
  })
);

// PUT /franchise/:id — update the pipeline status (new → contacted → closed).
franchiseRouter.put(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (req.user?.role === 'customer') return fail(res, 403, 'Staff only');
    const parsed = z.object({ status: z.enum(['new', 'contacted', 'closed']) }).safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const existing = await prisma.franchise.findUnique({ where: { id: req.params.id } });
    if (!existing) return fail(res, 404, 'Not found');
    const row = await prisma.franchise.update({ where: { id: req.params.id }, data: { status: parsed.data.status } });
    return ok(res, row);
  })
);
