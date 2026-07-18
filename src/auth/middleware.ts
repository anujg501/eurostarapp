import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AccessClaims, Role } from './tokens';
import { fail } from '../util/http';

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

// Everyone who works for Eurostar. Use this to gate the CRM's back-office reads
// (order stream, payments, customer master, rep list) — the CRM signs staff in
// as rep, office OR admin, so admin must be included or admins get locked out.
export const requireInternal = requireRole('rep', 'office', 'admin');
