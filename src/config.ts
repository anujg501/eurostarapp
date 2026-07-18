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
    // Demo stand-in until the SMS provider is connected: when set, every login
    // accepts this one code instead of a texted random one. Unlike OTP_DEV_MODE
    // the code is NOT returned by the API — you have to already know it.
    // Anyone who learns it can sign in as any customer, so this must be cleared
    // the moment real SMS credentials exist.
    fixedCode: process.env.OTP_FIXED_CODE ?? '',
  },

  // Generic Indian HTTP SMS gateway (Text2 / TEXTOO and the many clones of it).
  // Tried before Twilio when configured.
  //
  // Indian SMS is DLT-regulated: the delivered text must match the template
  // registered against `templateId`, word for word, or the operator drops it.
  // So the wording lives here as config rather than in code — {otp} is the only
  // substitution, and the default matches the template the client registered.
  smsHttp: {
    url: process.env.SMS_HTTP_URL ?? '',
    key: process.env.SMS_HTTP_KEY ?? '',
    senderId: process.env.SMS_SENDER_ID ?? '',
    route: process.env.SMS_ROUTE ?? '1',
    templateId: process.env.SMS_TEMPLATE_ID ?? '',
    template: process.env.SMS_TEMPLATE ?? 'Dear Customer Your Login otp is {otp} Text2',
    get configured() {
      return !!(process.env.SMS_HTTP_URL && process.env.SMS_HTTP_KEY && process.env.SMS_SENDER_ID);
    },
  },

  // Twilio SMS + WhatsApp (real OTP delivery). Set these in Render to send real codes.
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
    authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
    from: process.env.TWILIO_FROM ?? '', // your Twilio phone number, e.g. +1... or a Messaging Service SID
    // WhatsApp sender, e.g. "whatsapp:+14155238886" (Twilio sandbox) or your
    // approved WhatsApp Business number. When set, codes go via WhatsApp — best
    // for India delivery. Leave blank to use SMS.
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM ?? '',
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
    // Set in the Razorpay dashboard when you add the webhook. Without it the
    // webhook cannot be trusted, so /payments/webhook refuses every request.
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? '',
    get configured() {
      return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
    },
  },

  assistant: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    model: process.env.ASSISTANT_MODEL ?? 'claude-opus-4-8',
  },

  // Google Maps — public browser key used only to draw the rep check-in map in
  // the CRM. Check-ins themselves use the phone's GPS and need no key.
  maps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
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

// ---------------------------------------------------------------------------
// Production safety net
// ---------------------------------------------------------------------------
// Several defaults above are deliberately permissive so `npm run dev` works with
// no setup. Those same defaults are dangerous once the server is reachable from
// the internet: the dev JWT secret is published in this repo, and OTP dev mode
// hands the login code back in the API response. A missing env var on the server
// would otherwise fail *open* and silently. Refuse to boot instead.
if (process.env.NODE_ENV === 'production') {
  const problems: string[] = [];

  if (config.otp.devMode) {
    problems.push('OTP_DEV_MODE must be "false" — otherwise the login code is returned by the API and anyone can sign in as any customer.');
  }
  if (config.jwt.accessSecret === 'dev-access-secret') {
    problems.push('JWT_ACCESS_SECRET must be set to a long random string — the fallback is public in this repo, so anyone could forge a login.');
  }
  if (config.jwt.refreshSecret === 'dev-refresh-secret') {
    problems.push('JWT_REFRESH_SECRET must be set to a long random string — same reason.');
  }
  if (config.corsOrigins.some((o) => o.startsWith('http://localhost'))) {
    problems.push('CORS_ORIGINS still allows localhost — set it to your real site origin(s).');
  }

  if (problems.length) {
    throw new Error(
      'Refusing to start in production with an unsafe configuration:\n  - ' + problems.join('\n  - ')
    );
  }

  if (config.otp.fixedCode) {
    // Deliberate, but it must never be forgotten: say so on every boot.
    // eslint-disable-next-line no-console
    console.warn(
      '\n*** OTP_FIXED_CODE is set — every customer login accepts one fixed code. ***\n' +
        '*** This is a demo stand-in. Clear it and set the SMS provider before real customers use this. ***\n'
    );
  }
}
