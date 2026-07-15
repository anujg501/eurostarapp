import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

export const config = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev-access-secret'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
  },

  otp: {
    devMode: (process.env.OTP_DEV_MODE ?? 'true') === 'true',
    ttlSeconds: parseInt(process.env.OTP_TTL_SECONDS ?? '300', 10),
    length: parseInt(process.env.OTP_LENGTH ?? '6', 10),
  },

  // Twilio SMS (real OTP delivery). Set these in Render to send real codes.
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
    authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
    from: process.env.TWILIO_FROM ?? '', // your Twilio phone number, e.g. +1... or a Messaging Service SID
    defaultCountryCode: process.env.SMS_DEFAULT_COUNTRY_CODE ?? '+91', // India by default
  },

  company: {
    upiId: process.env.COMPANY_UPI_ID ?? 'eurostar@okhdfcbank',
    upiName: process.env.COMPANY_UPI_NAME ?? 'Eurostar Technologies Inc.',
  },

  // Razorpay online payments. Set these in Render to take real payments.
  // The Key ID is public (used by the checkout box in the browser); the Key
  // Secret is private (used only on the server to create orders and verify
  // payment signatures). Until both are set, the app falls back to its
  // simulated "mark as paid" flow so nothing breaks.
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID ?? '',
    keySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
    get configured() {
      return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
    },
  },

  assistant: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    model: process.env.ASSISTANT_MODEL ?? 'claude-opus-4-8',
  },

  // Business rules — verified against the frontend (screen-checkout.jsx / screen-orders.jsx).
  rules: {
    gstRate: 0.03, // 3% GST (waived on export orders)
    courierFlat: 300, // ₹300 courier
    courierFreeOver: 1000, // courier free over ₹1,000
    minOrderValue: 1000, // cart minimum before checkout is allowed
    dispatchWorkingDays: 3, // domestic dispatch: today + 3 days
    exportDispatchDays: 5, // export dispatch: today + 5 days
    rfqMinValue: 10000, // ₹10,000 minimum order value for RFQ
  },
};
