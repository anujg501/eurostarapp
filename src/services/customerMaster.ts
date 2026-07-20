import { prisma } from '../db';
import { nextCustomerCode } from './ids';

// The CRM customer master is the single record behind a customer's identity —
// the storefront's profile page, checkout and payments all resolve it by
// phone. Sign-up must keep it in step with the login user: a first-time OTP
// registration creates one, and a phone the CRM already knows signs in from
// the existing record instead of being asked to register again.

/** Phones arrive in every format ("+91 93145 88201", "9314588201") — compare
 *  on the last 10 digits. */
export const phoneDigits = (s?: string | null): string => (s || '').replace(/\D+/g, '').slice(-10);

/** Normalise a GSTIN for dedupe (uppercase, strip spaces). */
export function normGst(gstin?: string | null): string | null {
  if (!gstin) return null;
  const n = gstin.replace(/\s+/g, '').toUpperCase();
  return n.length ? n : null;
}

/** The master record for this phone, if the CRM already has one. */
export async function customerMasterForPhone(phone: string) {
  const wanted = phoneDigits(phone);
  if (wanted.length < 6) return null;
  const candidates = await prisma.customer.findMany({ where: { phone: { not: null } } });
  return candidates.find((c) => phoneDigits(c.phone) === wanted) ?? null;
}

/** Create (or dedupe onto) the master record for a first-time sign-up. The
 *  CRM keys firms on GSTIN, so a matching GSTIN reuses that master rather
 *  than minting a twin. */
export async function createCustomerMaster(name: string, phone: string, gstin: string) {
  const gstinNorm = normGst(gstin);
  if (gstinNorm) {
    const byGst = await prisma.customer.findFirst({ where: { gstinNorm } });
    if (byGst) {
      // Same firm signing in with a new number — attach the phone if the
      // master has none; otherwise keep the record as the CRM curated it.
      if (!byGst.phone) return prisma.customer.update({ where: { id: byGst.id }, data: { phone } });
      return byGst;
    }
  }
  const code = await nextCustomerCode();
  return prisma.customer.create({
    data: { code, name, phone, gstin: gstin.toUpperCase(), gstinNorm, terms: 'cash' },
  });
}
