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
  // A fixed demo code still travels the normal path: hashed, stored, expiring,
  // attempt-limited. Only its value is predictable — verifyOtp is unchanged.
  const code = config.otp.fixedCode || generateCode();
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

  if (config.otp.fixedCode) {
    // Demo mode: no SMS to send, and we deliberately do NOT return the code —
    // the caller is expected to already know it.
    // eslint-disable-next-line no-console
    console.log(`[OTP] ${phone} -> fixed demo code issued (no SMS provider connected yet)`);
    return {};
  }

  const message = `Your Eurostar login code is ${code}. It expires in 5 minutes.`;
  // Prefer WhatsApp when configured (best delivery in India); otherwise SMS.
  if (config.twilio.whatsappFrom) await sendWhatsApp(phone, message);
  else await sendSms(phone, message);
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

// --- SMS delivery via Twilio -----------------------------------------------
// Ensure the number is E.164 (e.g. +919876543210). Bare 10-digit Indian numbers
// get the default country code prepended.
function toE164(phone: string): string {
  const trimmed = phone.replace(/[\s-()]/g, '');
  if (trimmed.startsWith('+')) return trimmed;
  if (/^\d{10}$/.test(trimmed)) return config.twilio.defaultCountryCode + trimmed;
  return '+' + trimmed;
}

// Low-level Twilio Messages API call, shared by SMS and WhatsApp.
async function twilioSend(params: URLSearchParams, channel: string): Promise<void> {
  const { accountSid, authToken } = config.twilio;
  const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
    },
    body: params.toString(),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Twilio ${channel} failed (${resp.status}): ${text.slice(0, 300)}`);
  }
}

async function sendSms(phone: string, message: string): Promise<void> {
  const { accountSid, authToken, from } = config.twilio;
  if (!accountSid || !authToken || !from) {
    throw new Error(
      'No SMS provider configured. Set OTP_DEV_MODE=true for testing, or set TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM.'
    );
  }

  const body = new URLSearchParams({ To: toE164(phone), Body: message });
  // "From" may be a phone number (+...) or a Messaging Service SID (starts with MG).
  if (from.startsWith('MG')) body.set('MessagingServiceSid', from);
  else body.set('From', from);

  await twilioSend(body, 'SMS');
}

// Send via WhatsApp. Both numbers are prefixed "whatsapp:" per Twilio's API.
export async function sendWhatsApp(phone: string, message: string): Promise<void> {
  const { accountSid, authToken, whatsappFrom } = config.twilio;
  if (!accountSid || !authToken || !whatsappFrom) {
    throw new Error(
      'No WhatsApp sender configured. Set TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM.'
    );
  }
  // whatsappFrom may already include the "whatsapp:" prefix; normalise either way.
  const fromAddr = whatsappFrom.startsWith('whatsapp:') ? whatsappFrom : `whatsapp:${whatsappFrom}`;
  const body = new URLSearchParams({
    To: `whatsapp:${toE164(phone)}`,
    From: fromAddr,
    Body: message,
  });
  await twilioSend(body, 'WhatsApp');
}
