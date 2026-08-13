import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AccessClaims, Role } from './tokens';
import { fail } from '../util/http';
import { prisma } from '../db';

// Attach the logged-in user to the request, if a valid token is present.
export interface AuthedRequest extends Request {
  user?: AccessClaims;
}

/**
 * Is the account behind this token still allowed in?
 *
 * A signed token proves who was signed in when it was issued, not that the
 * account still exists. Deleting or blocking a rep in the CRM left their open
 * session working for the rest of the access token's life — every screen, every
 * write — because nothing here ever looked at the database. Their refresh token
 * dies with the row (it cascades), so the session could not be renewed, but up
 * to fifteen minutes of full access is not "logged out".
 *
 * One primary-key lookup per authenticated request, deliberately uncached: the
 * point is that revoking access takes effect on the very next request.
 */
async function accountUsable(sub: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: sub }, select: { active: true } });
  return !!user && user.active;
}

export async function authenticate(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return fail(res, 401, 'Not signed in');
  }
  const token = header.slice('Bearer '.length);
  let claims: AccessClaims;
  try {
    claims = verifyAccessToken(token);
  } catch {
    return fail(res, 401, 'Session expired or invalid, please sign in again');
  }
  let usable: boolean;
  try {
    usable = await accountUsable(claims.sub);
  } catch {
    // The database is unreachable, which says nothing about this account. 503,
    // not 401: the sign-in gates sign a user out on 401, and a database blip is
    // not a reason to throw every signed-in person back to the login screen.
    return fail(res, 503, 'Service temporarily unavailable, please try again');
  }
  if (!usable) {
    // 401, not 403: the session is over, not the permission. The apps' sign-in
    // gates treat 401 as "clear this session and go to the login screen", which
    // is exactly what should happen to a deleted or blocked account.
    return fail(res, 401, 'This account is no longer active. Please sign in again.');
  }
  req.user = claims;
  return next();
}

// Optional auth: attach user if present, but don't block if missing.
export async function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const claims = verifyAccessToken(header.slice('Bearer '.length));
      // A deleted/blocked account is treated as anonymous rather than rejected —
      // these routes serve signed-out callers too.
      if (await accountUsable(claims.sub)) req.user = claims;
    } catch {
      /* bad token, or the lookup failed — treated as anonymous */
    }
  }
  return next();
}

// Only allow certain roles through (e.g. office-only endpoints).
export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return fail(res, 401, 'Not signed in');
    if (!roles.includes(req.user.role)) {
      return fail(res, 403, 'You do not have permission to do this');
    }
    return next();
  };
}

// Staff = rep or office (they share the "pick a customer at checkout" flow).
export const requireStaff = requireRole('rep', 'office');

/**
 * The signed-in user is an applicant, i.e. they have a row in the recruitment
 * pipeline. Use this instead of requireRole('candidate') on the Academy's
 * self-service routes.
 *
 * Why not the role: one phone number is one person and User.phone is unique, so
 * a customer who later applies for a sales job keeps role 'customer' — turning
 * them into a 'candidate' would take away the storefront account they already
 * had. Gating on the role locked those applicants out of the app entirely.
 * Staff are excluded outright; being in the pipeline is not a reason to hand a
 * rep or admin an applicant's view, and they have their own sign-in.
 */
export async function requireCandidate(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) return fail(res, 401, 'Not signed in');
  if (req.user.role === 'candidate') return next();
  if (['rep', 'office', 'admin'].includes(req.user.role)) {
    return fail(res, 403, 'You do not have permission to do this');
  }
  const user = await prisma.user.findUnique({ where: { id: req.user.sub }, select: { phone: true } });
  const cand = user?.phone ? await prisma.candidate.findFirst({ where: { phone: user.phone }, select: { id: true } }) : null;
  if (!cand) return fail(res, 403, 'You do not have permission to do this');
  return next();
}

// Everyone who works for Eurostar. Use this to gate the CRM's back-office reads
// (order stream, payments, customer master, rep list) — the CRM signs staff in
// as rep, office OR admin, so admin must be included or admins get locked out.
export const requireInternal = requireRole('rep', 'office', 'admin');
