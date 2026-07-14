import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { config } from '../config';

// Generates a numeric OTP of the configured length.
function generateCode(): string {
  const max = 10 ** config.otp.length;
  const n = Math.floor(Math.random() * max);
  return n.toString().padStart(config.otp.length, '0');
}

/**
 * Create and "send" an OTP for a phone number.
 *
 * In development (OTP_DEV_MODE=true) we do not send a real SMS — the code is
 * printed to the server log and returned so you can test the flow. In
 * production, plug a real SMS provider (Twilio, MSG91, etc.) into `sendSms`.
 */
export async function requestOtp(phone: string): Promise<{ devCode?: string }> {
  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + config.otp.ttlSeconds * 1000);

  // Invalidate previous unconsumed codes for this phone.
  await prisma.otpCode.updateMany({
    where: { phone, consumed: false },
    data: { consumed: true },
  });

  await prisma.otpCode.create({ data: { phone, codeHash, expiresAt } });

  if (config.otp.devMode) {
    // eslint-disable-next-line no-console
    console.log(`[OTP] ${phone} -> ${code} (dev mode, not sent by SMS)`);
    return { devCode: code };
  }

  await sendSms(phone, `Your Eurostar login code is ${code}. It expires in 5 minutes.`);
  return {};
}

/**
 * Verify a submitted OTP. Returns true if it matches an unexpired code.
 */
export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const record = await prisma.otpCode.findFirst({
    where: { phone, consumed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) return false;
  if (record.attempts >= 5) return false;

  const match = await bcrypt.compare(code, record.codeHash);
  await prisma.otpCode.update({
    where: { id: record.id },
    data: { attempts: { increment: 1 }, consumed: match ? true : undefined },
  });
  return match;
}

// --- Plug your SMS provider here -------------------------------------------
async function sendSms(phone: string, message: string): Promise<void> {
  // Example (MSG91 / Twilio) goes here. For now we throw so misconfiguration
  // is obvious rather than silently dropping login codes.
  throw new Error(
    `No SMS provider configured. Set OTP_DEV_MODE=true for testing, or implement sendSms() (phone=${phone}).`
  );
}
