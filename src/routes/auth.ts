import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { asyncHandler, fail, ok, failValidation } from '../util/http';
import { requestOtp, verifyOtp } from '../services/otp';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  refreshExpiryDate,
  checkPassword,
  hashPassword,
  Role,
} from '../auth/tokens';
import { AuthedRequest, authenticate } from '../auth/middleware';

export const authRouter = Router();

// Basic GSTIN shape check (15 chars: 2 state + 10 PAN + 3 more).
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

async function issueSession(user: { id: string; role: string; name: string; repId: string | null }, remember: boolean) {
  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role as Role,
    name: user.name,
    repId: user.repId ?? undefined,
  });

  let refreshToken: string | undefined;
  if (remember) {
    refreshToken = signRefreshToken(user.id);
    await prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt: refreshExpiryDate() },
    });
  }

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, role: user.role, name: user.name, repId: user.repId ?? undefined },
  };
}

// --- Customer OTP request ---------------------------------------------------
const otpRequestSchema = z.object({ phone: z.string().min(6) });

authRouter.post(
  '/otp/request',
  asyncHandler(async (req, res) => {
    const parsed = otpRequestSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const { devCode } = await requestOtp(parsed.data.phone);
    return ok(res, { sent: true, ...(devCode ? { devCode } : {}) });
  })
);

// --- Customer OTP verify (with first-time sign-up: name + gstin) ------------
const otpVerifySchema = z.object({
  phone: z.string().min(6),
  otp: z.string().min(3),
  name: z.string().min(1).optional(),
  gstin: z.string().optional(),
  remember: z.boolean().optional(),
});

authRouter.post(
  '/otp/verify',
  asyncHandler(async (req, res) => {
    const parsed = otpVerifySchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const { phone, otp, name, gstin, remember } = parsed.data;

    const valid = await verifyOtp(phone, otp);
    if (!valid) return fail(res, 401, 'Incorrect or expired code');

    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      // First-time sign-up: name + GSTIN are required.
      if (!name || !gstin) {
        return fail(res, 422, 'New customer: please provide your name and GSTIN', { signupRequired: true });
      }
      if (!GSTIN_RE.test(gstin.toUpperCase())) {
        return fail(res, 422, 'That GSTIN does not look valid');
      }
      user = await prisma.user.create({
        data: { role: 'customer', name, phone, gstin: gstin.toUpperCase() },
      });
    } else if (gstin && !user.gstin && GSTIN_RE.test(gstin.toUpperCase())) {
      user = await prisma.user.update({ where: { id: user.id }, data: { gstin: gstin.toUpperCase() } });
    }

    return ok(res, await issueSession(user, remember ?? false));
  })
);

// --- Staff password login (rep / office / admin) ----------------------------
// The login gates send { role, username, password }. "username" is the login id
// (stored as User.userId). "userId" is accepted too for backward compatibility.
const loginSchema = z
  .object({
    role: z.enum(['rep', 'office', 'admin']),
    username: z.string().min(1).optional(),
    userId: z.string().min(1).optional(),
    password: z.string().min(1),
    remember: z.boolean().optional(),
  })
  .refine((d) => !!(d.username || d.userId), { message: 'username is required' });

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const { role, password, remember } = parsed.data;
    const username = (parsed.data.username ?? parsed.data.userId)!;

    const user = await prisma.user.findFirst({ where: { userId: username, role, active: true } });
    if (!user || !user.passwordHash) return fail(res, 401, 'Wrong username or password');

    const good = await checkPassword(password, user.passwordHash);
    if (!good) return fail(res, 401, 'Wrong username or password');

    return ok(res, await issueSession(user, remember ?? false));
  })
);

// --- Change my own password (staff self-service) ----------------------------
const changePwSchema = z.object({ oldPassword: z.string().min(1), newPassword: z.string().min(4) });
authRouter.post(
  '/change-password',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = changePwSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !user.passwordHash) return fail(res, 400, 'This account has no password.');
    const good = await checkPassword(parsed.data.oldPassword, user.passwordHash);
    if (!good) return fail(res, 401, 'Your current password is incorrect.');
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.newPassword) } });
    return ok(res, { changed: true });
  })
);

// --- Refresh ("remember me") ------------------------------------------------
const refreshSchema = z.object({ refreshToken: z.string().min(10) });

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, 'Missing refresh token');
    const { refreshToken } = parsed.data;

    let payload: { sub: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return fail(res, 401, 'Please sign in again');
    }

    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(refreshToken) } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      return fail(res, 401, 'Please sign in again');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.active) return fail(res, 401, 'Please sign in again');

    const session = await issueSession(user, false);
    return ok(res, { accessToken: session.accessToken, user: session.user });
  })
);

// --- Logout (revoke a remember-me token) ------------------------------------
authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = (req.body?.refreshToken as string) || '';
    if (token) {
      await prisma.refreshToken.updateMany({ where: { tokenHash: hashToken(token) }, data: { revoked: true } });
    }
    return ok(res, { ok: true });
  })
);

// --- Who am I ---------------------------------------------------------------
authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) return fail(res, 404, 'User not found');
    return ok(res, {
      id: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone,
      gstin: user.gstin,
      repId: user.repId,
    });
  })
);
