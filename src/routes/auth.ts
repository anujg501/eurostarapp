import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { asyncHandler, fail, ok, failValidation } from '../util/http';
import { requestOtp, verifyOtp, consumeOtp } from '../services/otp';
import { customerMasterForPhone, createCustomerMaster, normGst, phoneDigits } from '../services/customerMaster';
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
    // Upsert, not create: two sign-ins in the same second mint an identical
    // JWT (same claims, same iat), and a duplicate tokenHash crashed the
    // second one — e.g. a double-click on "Verify & enter".
    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.upsert({
      where: { tokenHash },
      create: { userId: user.id, tokenHash, expiresAt: refreshExpiryDate() },
      update: { expiresAt: refreshExpiryDate(), revoked: false },
    });
  }

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, role: user.role, name: user.name, repId: user.repId ?? undefined },
  };
}

// --- Customer OTP request ---------------------------------------------------
const otpRequestSchema = z.object({
  phone: z.string().min(6),
  // 'login' = sign-in pane (registered numbers only), 'signup' = the create-
  // account flow (new numbers only). Omitted = legacy behaviour, no gate.
  mode: z.enum(['login', 'signup']).optional(),
});

authRouter.post(
  '/otp/request',
  asyncHandler(async (req, res) => {
    const parsed = otpRequestSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const { phone, mode } = parsed.data;

    // The sign-in pane is for registered numbers only; account creation is
    // its own explicit flow. Gate before any SMS is sent:
    //  - login: unknown number → no code, point them at "Create your account"
    //  - signup: number already registered → no code, point them at sign-in
    // "Registered" includes customers the CRM created who never logged in.
    if (mode === 'login' || mode === 'signup') {
      const user = await prisma.user.findUnique({ where: { phone } });
      const registered = !!user || !!(await customerMasterForPhone(phone));
      if (mode === 'login' && !registered) {
        return fail(res, 404, 'No account with this number yet — please create your account first.', { signupRequired: true });
      }
      if (mode === 'signup' && registered) {
        return fail(res, 409, 'This number is already registered — just sign in.', { alreadyRegistered: true });
      }
    }

    const { devCode } = await requestOtp(phone);
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

    // Check the code without spending it. A first-time sign-up is answered with
    // a 422 asking for name + GSTIN, and the customer resubmits with the SAME
    // code — consuming it here left them unable to sign up at all, because the
    // second attempt came back "incorrect or expired".
    const valid = await verifyOtp(phone, otp, { consume: false });
    if (!valid) return fail(res, 401, 'Incorrect or expired code');

    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      // "Already registered" includes customers the CRM created (a rep added
      // them, they just never logged in): if the customer master knows this
      // phone, sign them in from that record — asking them to register again
      // would be wrong and would fork their identity.
      const master = await customerMasterForPhone(phone);
      if (master) {
        user = await prisma.user.create({
          data: { role: 'customer', name: master.name, phone, gstin: master.gstin },
        });
      } else {
        // Genuinely new customer: name + GSTIN are required. The code stays
        // valid so the details can be supplied without a fresh SMS.
        if (!name || !gstin) {
          return fail(res, 422, 'New customer: please provide your name and GSTIN', { signupRequired: true });
        }
        if (!GSTIN_RE.test(gstin.toUpperCase())) {
          return fail(res, 422, 'That GSTIN does not look valid');
        }
        // A GSTIN identifies one firm — it must not register twice. If the
        // customer master already holds this GSTIN under a *different* phone,
        // that firm has an account; refuse rather than fork it. (A record the
        // CRM pre-created for this same firm has no phone yet, so it is not a
        // conflict — createCustomerMaster claims it below.)
        const gnorm = normGst(gstin);
        if (gnorm) {
          const owner = await prisma.customer.findFirst({ where: { gstinNorm: gnorm } });
          if (owner && owner.phone && phoneDigits(owner.phone) !== phoneDigits(phone)) {
            return fail(res, 409, 'This GSTIN is already registered to another account.', { gstinTaken: true });
          }
        }
        user = await prisma.user.create({
          data: { role: 'customer', name, phone, gstin: gstin.toUpperCase() },
        });
        // …and their master record, so the profile page, checkout and
        // payments resolve this customer immediately — previously only the
        // login user was created and the rest of the app found nobody.
        await createCustomerMaster(name, phone, gstin.toUpperCase());
      }
    } else if (gstin && !user.gstin && GSTIN_RE.test(gstin.toUpperCase())) {
      user = await prisma.user.update({ where: { id: user.id }, data: { gstin: gstin.toUpperCase() } });
    }

    // Sign-in is now certain to succeed, so retire the code — one login each.
    await consumeOtp(phone);

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
