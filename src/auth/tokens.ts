import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { config } from '../config';

// "candidate" is an LMS applicant (Eurostar Academy). They sign in with phone +
// OTP like a customer, but have no GSTIN and no access to any staff endpoint.
export type Role = 'customer' | 'rep' | 'office' | 'admin' | 'candidate';

export interface AccessClaims {
  sub: string; // user id
  role: Role;
  name: string;
  repId?: string;
}

// --- Access tokens (short-lived, sent on every request) ---

export function signAccessToken(claims: AccessClaims): string {
  return jwt.sign(claims, config.jwt.accessSecret, { expiresIn: config.jwt.accessTtl } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessClaims {
  return jwt.verify(token, config.jwt.accessSecret) as AccessClaims;
}

// --- Refresh tokens ("remember me", long-lived, stored hashed in the DB) ---

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'refresh' }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshTtl,
  } as jwt.SignOptions);
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, config.jwt.refreshSecret) as { sub: string };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshExpiryDate(): Date {
  // Mirror JWT_REFRESH_TTL roughly for the DB record (default 30 days).
  const ttl = config.jwt.refreshTtl;
  const days = /(\d+)d/.exec(ttl)?.[1];
  const ms = days ? parseInt(days, 10) * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ms);
}

// --- Passwords ---

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function checkPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
