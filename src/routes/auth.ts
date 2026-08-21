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
import { AuthedRequest, authenticate, requireCandidate } from '../auth/middleware';

export const authRouter = Router();

// Basic GSTIN shape check (15 chars: 2 state + 10 PAN + 3 more).
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
// PAN shape check (10 chars: 5 letters + 4 digits + 1 letter). Not every trade
// customer is GST-registered, so a PAN is accepted as their tax identifier too.
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
// A customer's tax id is a valid GSTIN OR a valid PAN.
const isTaxId = (v: string): boolean => {
  const u = (v || '').toUpperCase();
  return GSTIN_RE.test(u) || PAN_RE.test(u);
};

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
          return fail(res, 422, 'New customer: please provide your name and GST / PAN number', { signupRequired: true });
        }
        if (!isTaxId(gstin)) {
          return fail(res, 422, 'That GST / PAN number does not look valid');
        }
        // A GSTIN or PAN identifies one firm — it must not register twice. If
        // the customer master already holds this id under a *different* phone,
        // that firm has an account; refuse rather than fork it. (A record the
        // CRM pre-created for this same firm has no phone yet, so it is not a
        // conflict — createCustomerMaster claims it below.)
        const gnorm = normGst(gstin);
        if (gnorm) {
          const owner = await prisma.customer.findFirst({ where: { gstinNorm: gnorm } });
          if (owner && owner.phone && phoneDigits(owner.phone) !== phoneDigits(phone)) {
            return fail(res, 409, 'This GST / PAN number is already registered to another account.', { gstinTaken: true });
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
    } else if (gstin && !user.gstin && isTaxId(gstin)) {
      user = await prisma.user.update({ where: { id: user.id }, data: { gstin: gstin.toUpperCase() } });
    }

    // Sign-in is now certain to succeed, so retire the code — one login each.
    await consumeOtp(phone);

    return ok(res, await issueSession(user, remember ?? false));
  })
);

// --- Candidate OTP (Eurostar Academy / LMS) ---------------------------------
// Candidates are job applicants, not buyers: they have no GSTIN, so they cannot
// use the customer routes above (those answer 422 "please provide your name and
// GSTIN" for every new number). Same OTP service, different sign-up rules.

// Staff accounts are never "candidates" for the purposes of the LMS app, even
// if someone put them in the pipeline: their token carries real back-office
// power, so the applicant routes must not become a second way to mint one.
const STAFF_ROLES = ['rep', 'office', 'admin'];

/**
 * Who this phone number is, as far as the Academy is concerned.
 *
 * `canLogIn` — they have an application (or a candidate login), so the app is
 * theirs to enter. Note this deliberately accepts a `customer` account that
 * also has a pipeline row: someone who buys from Eurostar and later applies for
 * a job is one person with one phone number, and User.phone is unique, so there
 * is no second row to give them. Their role stays `customer` — see the
 * `candidateAccess` guard, which authorises on having an application rather
 * than on the role string.
 *
 * `signupBlocked` — they can ALREADY sign in with a password, so sending them
 * through account creation again would be wrong. A bare pipeline row is not
 * enough: the office adds applicants by hand, and those people have no login
 * yet — blocking them here left them permanently unable to create one.
 */
async function candidateStatus(phone: string) {
  const user = await prisma.user.findUnique({ where: { phone } });
  const cand = await prisma.candidate.findFirst({ where: { phone } });
  const isStaff = !!user && STAFF_ROLES.includes(user.role);
  const canLogIn = !isStaff && (!!cand || user?.role === 'candidate');
  return { user, cand, canLogIn, signupBlocked: canLogIn && !!user?.passwordHash };
}

const candOtpRequestSchema = z.object({
  phone: z.string().min(6),
  mode: z.enum(['login', 'signup']).optional(),
});

authRouter.post(
  '/candidate/otp/request',
  asyncHandler(async (req, res) => {
    const parsed = candOtpRequestSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const { phone, mode } = parsed.data;

    if (mode === 'login' || mode === 'signup') {
      const status = await candidateStatus(phone);
      if (mode === 'login' && !status.canLogIn) {
        return fail(res, 404, 'No application with this number yet — please register first.', { signupRequired: true });
      }
      if (mode === 'signup' && status.signupBlocked) {
        return fail(res, 409, 'This number has already applied — just log in.', { alreadyRegistered: true });
      }
    }

    const { devCode } = await requestOtp(phone);
    return ok(res, { sent: true, ...(devCode ? { devCode } : {}) });
  })
);

// --- Candidate OTP check (does NOT sign in, does NOT create anything) -------
// The sign-up form verifies the code on its own step, before it has collected a
// name, email and password. Doing that by calling /verify was a mistake: for a
// number that already had a User row, /verify completed the whole sign-up and
// retired the code, so the real Register that followed came back "Incorrect or
// expired code". This checks the code and nothing else. It still counts against
// the attempt limit, so it cannot be used to brute-force one.
const candOtpCheckSchema = z.object({ phone: z.string().min(6), otp: z.string().min(3) });

authRouter.post(
  '/candidate/otp/check',
  asyncHandler(async (req, res) => {
    const parsed = candOtpCheckSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const { phone, otp } = parsed.data;

    const valid = await verifyOtp(phone, otp, { consume: false });
    if (!valid) return fail(res, 401, 'Incorrect or expired code');
    return ok(res, { valid: true });
  })
);

// Display id for the recruitment pipeline: EC-1001, EC-1002, …
async function nextCandId(): Promise<string> {
  const rows = await prisma.candidate.findMany({
    where: { candId: { startsWith: 'EC-' } },
    select: { candId: true },
  });
  const highest = rows.reduce((max, r) => {
    const n = parseInt((r.candId ?? '').slice(3), 10);
    return Number.isFinite(n) && n > max ? n : max;
  }, 1000);
  return `EC-${highest + 1}`;
}

const candOtpVerifySchema = z.object({
  phone: z.string().min(6),
  otp: z.string().min(3),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  // Set at sign-up so the candidate can come back with email + password
  // instead of waiting for an SMS every time.
  password: z.string().min(4).optional(),
  city: z.string().optional(),
  remember: z.boolean().optional(),
});

const normEmail = (e?: string) => (e ? e.trim().toLowerCase() : undefined);

authRouter.post(
  '/candidate/otp/verify',
  asyncHandler(async (req, res) => {
    const parsed = candOtpVerifySchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const { phone, otp, name, city, remember } = parsed.data;
    const email = normEmail(parsed.data.email);
    const password = parsed.data.password;

    // Checked without spending it, exactly as the customer flow does: a missing
    // name comes back as 422 and the same code is presented again.
    const valid = await verifyOtp(phone, otp, { consume: false });
    if (!valid) return fail(res, 401, 'Incorrect or expired code');

    let user = await prisma.user.findUnique({ where: { phone } });

    // The email is the candidate's login id, so it cannot be shared with
    // another account. Checked before writing so the answer is a clear 409
    // rather than a unique-constraint crash.
    if (email) {
      const taken = await prisma.user.findFirst({
        where: { email, ...(user ? { NOT: { id: user.id } } : {}) },
        select: { id: true },
      });
      if (taken) {
        return fail(res, 409, 'That email is already registered — please log in instead.', { emailTaken: true });
      }
    }

    if (!user) {
      // A first-time applicant only has to give a name. No GSTIN — that is a
      // business registration number and means nothing for a job application.
      if (!name) {
        return fail(res, 422, 'New applicant: please provide your name', { signupRequired: true });
      }
      user = await prisma.user.create({
        data: {
          role: 'candidate',
          name,
          phone,
          email: email ?? null,
          passwordHash: password ? await hashPassword(password) : null,
        },
      });
    } else {
      // Returning through sign-up: fill in an email or password they did not
      // have before, without touching one they already set.
      const patch: { email?: string; passwordHash?: string } = {};
      if (email && !user.email) patch.email = email;
      if (password && !user.passwordHash) patch.passwordHash = await hashPassword(password);
      if (Object.keys(patch).length) user = await prisma.user.update({ where: { id: user.id }, data: patch });
    }
    // If the number already belongs to a customer or staff account, their role
    // is left alone — this signs them in as who they already are rather than
    // rewriting an existing account, and User.phone is unique so there cannot
    // be a second row for the same number.

    // Mirror them into the recruitment pipeline so the office sees the
    // application the moment they register.
    const existing = await prisma.candidate.findFirst({ where: { phone } });
    if (!existing) {
      await prisma.candidate.create({
        data: {
          name: name ?? user.name,
          phone,
          email: email ?? null,
          city: city ?? null,
          source: 'Mobile app',
          // Registering only creates the account. They become 'applied' when
          // they actually submit the Apply Now form (POST /candidates/me/apply)
          // — starting them at 'applied' made every new sign-up look like a
          // finished application with no city, experience or CV behind it.
          stage: 'registered',
          candId: await nextCandId(),
        },
      });
    } else {
      // The pipeline row may pre-date this sign-up — the office added them by
      // hand, or they already had a customer account under this number, in
      // which case the row carries their *trading* name ("Tejas Gold") rather
      // than the applicant's. What they type on their own application wins.
      const patch: { email?: string; name?: string } = {};
      if (email && !existing.email) patch.email = email;
      if (name && name.trim() && name.trim() !== existing.name) patch.name = name.trim();
      if (Object.keys(patch).length) {
        await prisma.candidate.update({ where: { id: existing.id }, data: patch });
      }
    }

    await consumeOtp(phone);
    return ok(res, await issueSession(user, remember ?? false));
  })
);

// --- Candidate email + password login ---------------------------------------
// Registering sets an email and password, so coming back does not need another
// SMS. Wrong email and wrong password give the same answer on purpose — telling
// them apart would confirm which addresses have accounts.
const candLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  remember: z.boolean().optional(),
});

authRouter.post(
  '/candidate/login',
  asyncHandler(async (req, res) => {
    const parsed = candLoginSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const { password, remember } = parsed.data;
    const email = normEmail(parsed.data.email)!;

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user?.passwordHash) return fail(res, 401, 'Incorrect email or password');
    if (!user.active) return fail(res, 403, 'This account has been disabled. Please contact the office.');

    // Staff sign in through /auth/login with their own username; letting this
    // route hand out a token for them would turn the applicant form into a
    // second, weaker way into the back office. Everyone else needs a real
    // application to their name — a plain customer cannot walk in here.
    if (STAFF_ROLES.includes(user.role)) return fail(res, 401, 'Incorrect email or password');
    if (user.role !== 'candidate') {
      const cand = user.phone ? await prisma.candidate.findFirst({ where: { phone: user.phone } }) : null;
      if (!cand) return fail(res, 403, 'This account has not applied for a role yet.');
    }

    const match = await checkPassword(password, user.passwordHash);
    if (!match) return fail(res, 401, 'Incorrect email or password');

    return ok(res, await issueSession(user, remember ?? false));
  })
);

// --- Candidate: change (or first-time set) their password -------------------
// Candidates who signed up before passwords were stored have no hash yet, so
// they are allowed to set one without proving an old one — they have already
// proved who they are with a valid session token. Anyone who does have a
// password must present it.
const candPasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Use at least 6 characters'),
});

authRouter.post(
  '/candidate/password',
  authenticate,
  requireCandidate,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = candPasswordSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) return fail(res, 404, 'User not found');

    if (user.passwordHash) {
      if (!currentPassword) return fail(res, 400, 'Enter your current password');
      if (!(await checkPassword(currentPassword, user.passwordHash))) {
        return fail(res, 401, 'Your current password is not correct');
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });

    // Every other device holding a refresh token for this account is cut off —
    // changing a password is how someone locks out whoever they think has it.
    await prisma.refreshToken.updateMany({ where: { userId: user.id }, data: { revoked: true } });

    return ok(res, { changed: true });
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

    // A candidate's display id (EC-1008) lives on their pipeline row, not the
    // login. The LMS app shows it next to their name, so hand it over here
    // rather than making the app guess or fetch a staff-only endpoint.
    // Looked up for anyone non-staff who has one, not just role 'candidate':
    // an applicant who is also a customer keeps the customer role, and the app
    // still has to show them their EC-#### id.
    let candId: string | null = null;
    if (user.phone && !['rep', 'office', 'admin'].includes(user.role)) {
      const cand = await prisma.candidate.findFirst({
        where: { phone: user.phone },
        select: { candId: true },
      });
      candId = cand?.candId ?? null;
    }

    return ok(res, {
      id: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone,
      email: user.email,
      // Lets the app ask for the current password only when there is one to
      // ask for, instead of showing a field with a "leave blank" caveat.
      hasPassword: !!user.passwordHash,
      gstin: user.gstin,
      repId: user.repId,
      ...(candId ? { candId } : {}),
    });
  })
);
