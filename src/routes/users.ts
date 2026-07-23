import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { asyncHandler, fail, ok, failValidation } from '../util/http';
import { AuthedRequest, authenticate } from '../auth/middleware';
import { hashPassword } from '../auth/tokens';

export const usersRouter = Router();

// The owner/admin account (from the seed) is protected: it can't be deleted or
// disabled, so you can never lock yourself out.
const OWNER_USERNAME = process.env.SEED_ADMIN_USER ?? 'admin';

// Only admins (and back office) may manage internal logins.
function requireStaffAdmin(req: AuthedRequest, res: any): boolean {
  const role = req.user?.role;
  if (role !== 'admin' && role !== 'office') {
    fail(res, 403, 'Only an administrator can manage users.');
    return false;
  }
  return true;
}

// Public shape for the Users & access screen. Never returns the password hash;
// a plaintext password is only ever returned once, at create/reset time.
function serialiseUser(u: any) {
  return {
    id: u.id,
    role: u.role,
    name: u.name,
    username: u.userId,
    phone: u.phone ?? '',
    active: u.active,
    isOwner: u.userId === OWNER_USERNAME,
    createdAt: u.createdAt,
  };
}

// A readable random password, e.g. "euro-7F3K9Q".
function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return 'euro-' + s;
}

// GET /users?role=rep|office|admin — internal logins (not customers).
usersRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!requireStaffAdmin(req, res)) return;
    const role = typeof req.query.role === 'string' ? req.query.role : undefined;
    const where: any = { role: { in: ['rep', 'office', 'admin'] } };
    if (role && ['rep', 'office', 'admin'].includes(role)) where.role = role;
    const users = await prisma.user.findMany({ where, orderBy: { createdAt: 'asc' } });
    return ok(res, users.map(serialiseUser));
  })
);

// POST /users — create a staff login. Returns the plaintext password once so the
// admin can pass it to the new user.
const createSchema = z.object({
  role: z.enum(['rep', 'office', 'admin']),
  name: z.string().min(1),
  username: z.string().min(3).regex(/^[A-Za-z0-9._-]+$/, 'letters, numbers, . _ - only'),
  password: z.string().min(4).optional(), // generated if omitted
  phone: z.string().optional(),
  active: z.boolean().optional(),
});
usersRouter.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!requireStaffAdmin(req, res)) return;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const d = parsed.data;

    const existing = await prisma.user.findUnique({ where: { userId: d.username } });
    if (existing) return fail(res, 409, 'That username is already taken.');

    // phone is unique across ALL users, including customers (who sign in with
    // phone + OTP). Reusing one used to surface as a generic 500 — say so plainly.
    const phone = d.phone?.trim() || null;
    if (phone) {
      const phoneOwner = await prisma.user.findUnique({ where: { phone } });
      if (phoneOwner) {
        return fail(
          res,
          409,
          phoneOwner.role === 'customer'
            ? `That phone number already belongs to the customer account "${phoneOwner.name}". Use a different number.`
            : `That phone number is already used by ${phoneOwner.name} (${phoneOwner.userId}).`
        );
      }
    }

    const plain = d.password || generatePassword();
    try {
      const user = await prisma.user.create({
        data: {
          role: d.role,
          name: d.name,
          userId: d.username,
          phone,
          active: d.active ?? true,
          passwordHash: await hashPassword(plain),
          ...(d.role === 'rep' ? { repId: d.username } : {}),
        },
      });
      return ok(res, { ...serialiseUser(user), password: plain }, 201);
    } catch (e: any) {
      // Lost a race on a unique field — report which one instead of a 500.
      if (e?.code === 'P2002') {
        const field = Array.isArray(e?.meta?.target) ? e.meta.target[0] : e?.meta?.target;
        return fail(res, 409, field === 'phone' ? 'That phone number is already registered.' : 'That username is already taken.');
      }
      throw e;
    }
  })
);

// PUT /users/:id — edit name/phone/role/active.
const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.enum(['rep', 'office', 'admin']).optional(),
  active: z.boolean().optional(),
});
usersRouter.put(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!requireStaffAdmin(req, res)) return;
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return fail(res, 404, 'User not found');
    // The owner can't be disabled or demoted.
    if (target.userId === OWNER_USERNAME && (parsed.data.active === false || (parsed.data.role && parsed.data.role !== 'admin'))) {
      return fail(res, 400, 'The owner account cannot be disabled or changed.');
    }
    // Same unique-phone rule as create: report the clash rather than 500.
    const newPhone = parsed.data.phone?.trim();
    if (newPhone && newPhone !== target.phone) {
      const phoneOwner = await prisma.user.findUnique({ where: { phone: newPhone } });
      if (phoneOwner && phoneOwner.id !== target.id) {
        return fail(res, 409, `That phone number is already used by ${phoneOwner.name}${phoneOwner.role === 'customer' ? ' (customer account)' : ''}.`);
      }
    }
    try {
      const user = await prisma.user.update({
        where: { id: target.id },
        data: { ...parsed.data, ...(newPhone !== undefined ? { phone: newPhone || null } : {}) },
      });
      return ok(res, serialiseUser(user));
    } catch (e: any) {
      if (e?.code === 'P2002') return fail(res, 409, 'That phone number is already registered.');
      throw e;
    }
  })
);

// POST /users/:id/reset-password — generate a new password, returned once.
usersRouter.post(
  '/:id/reset-password',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!requireStaffAdmin(req, res)) return;
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return fail(res, 404, 'User not found');
    const plain = generatePassword();
    await prisma.user.update({ where: { id: target.id }, data: { passwordHash: await hashPassword(plain) } });
    return ok(res, { id: target.id, username: target.userId, password: plain });
  })
);

// DELETE /users/:id — remove a login (never the owner).
usersRouter.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!requireStaffAdmin(req, res)) return;
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return fail(res, 404, 'User not found');
    if (target.userId === OWNER_USERNAME) return fail(res, 400, 'The owner account cannot be removed.');
    await prisma.user.delete({ where: { id: target.id } });
    return ok(res, { deleted: true });
  })
);
