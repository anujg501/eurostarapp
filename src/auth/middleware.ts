import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AccessClaims, Role } from './tokens';
import { fail } from '../util/http';
import { prisma } from '../db';

// Attach the logged-in user to the request, if a valid token is present.
export interface AuthedRequest extends Request {
  user?: AccessClaims;
}

export function authenticate(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return fail(res, 401, 'Not signed in');
  }
  const token = header.slice('Bearer '.length);
  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return fail(res, 401, 'Session expired or invalid, please sign in again');
  }
}

// Optional auth: attach user if present, but don't block if missing.
export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = verifyAccessToken(header.slice('Bearer '.length));
    } catch {
      /* ignore — treated as anonymous */
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
