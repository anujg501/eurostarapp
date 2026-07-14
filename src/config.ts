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

  company: {
    upiId: process.env.COMPANY_UPI_ID ?? 'eurostar@icici',
    upiName: process.env.COMPANY_UPI_NAME ?? 'Eurostar Gems',
  },

  assistant: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    model: process.env.ASSISTANT_MODEL ?? 'claude-opus-4-8',
  },

  // Business rules from the handoff README.
  rules: {
    gstRate: 0.03, // 3%
    courierFlat: 300, // ₹300
    courierFreeOver: 1000, // free over ₹1,000
    dispatchWorkingDays: 3,
    rfqMinValue: 10000, // ₹10,000 minimum order value for RFQ
  },
};
