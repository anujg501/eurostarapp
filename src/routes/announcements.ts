import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { asyncHandler, ok, failValidation } from '../util/http';
import { authenticate, requireInternal } from '../auth/middleware';

export const announcementsRouter = Router();

function serialise(a: any) {
  return {
    active: a.active,
    image: a.image,
    title: a.title,
    message: a.message,
    badge: a.badge,
    windowStart: a.windowStart,
    windowEnd: a.windowEnd,
    updatedAt: a.updatedAt,
  };
}

async function getAnnouncement() {
  return prisma.announcement.upsert({ where: { id: 'default' }, create: { id: 'default' }, update: {} });
}

// GET /announcements — the current rep-broadcast banner (read by Sales/CRM).
announcementsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    return ok(res, serialise(await getAnnouncement()));
  })
);

// PUT /announcements — set the banner (CRM RepBroadcast / Admin). Staff only.
const putSchema = z.object({
  active: z.boolean().optional(),
  image: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  badge: z.string().nullable().optional(),
  windowStart: z.string().datetime().nullable().optional(),
  windowEnd: z.string().datetime().nullable().optional(),
});

announcementsRouter.put(
  '/',
  authenticate,
  // The Admin app is the producer of rep broadcasts and signs in as role 'admin',
  // which requireStaff (rep|office) excludes — so admins got a 403 here.
  requireInternal,
  asyncHandler(async (req, res) => {
    const parsed = putSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;
    const data: any = { ...d };
    if (d.windowStart !== undefined) data.windowStart = d.windowStart ? new Date(d.windowStart) : null;
    if (d.windowEnd !== undefined) data.windowEnd = d.windowEnd ? new Date(d.windowEnd) : null;

    const a = await prisma.announcement.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...data },
      update: data,
    });
    return ok(res, serialise(a));
  })
);
