// API client for the Eurostar back room (LMS candidate app).
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const CONFIGURED: string =
  (Constants.expoConfig?.extra as any)?.apiBaseUrl || 'https://eurostar-api.onrender.com';

// How long to wait before giving up on a request. Without this a phone that
// cannot reach the back room simply spins forever — fetch has no default
// timeout, so the Register button stayed in its loading state indefinitely.
const TIMEOUT_MS = 20000;

/**
 * On a real phone "localhost" is the phone itself, so a dev config pointing at
 * http://localhost:4000 only works while an `adb reverse` tunnel is up — and
 * that tunnel dies the moment the USB cable is unplugged. Metro already knows
 * the dev machine's address, so borrow its host and keep the configured port.
 */
function resolveBaseUrl(url: string): string {
  const m = /^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?(.*)$/i.exec(url);
  if (!m) return url;

  // e.g. "192.168.1.19:8081" — the packager the app was loaded from.
  const hostUri: string | undefined =
    (Constants.expoConfig as any)?.hostUri ||
    (Constants as any).expoGoConfig?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  const host = hostUri?.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return url;

  return `${m[1]}${host}${m[3] ?? ''}${m[4] ?? ''}`;
}

const BASE_URL: string = resolveBaseUrl(CONFIGURED);

// Which address the app actually settled on is the first thing worth knowing
// when requests fail on a device, so say it once at start-up.
// eslint-disable-next-line no-console
if (__DEV__) console.log(`[api] back room: ${BASE_URL} (configured: ${CONFIGURED})`);

let accessToken: string | null = null;

export async function loadToken(): Promise<string | null> {
  if (accessToken) return accessToken;
  accessToken = await AsyncStorage.getItem('eurostar_lms_token');
  return accessToken;
}

export async function setToken(token: string | null): Promise<void> {
  accessToken = token;
  if (token) await AsyncStorage.setItem('eurostar_lms_token', token);
  else await AsyncStorage.removeItem('eurostar_lms_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };
  const token = await loadToken();
  if (token) headers.authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let resp: Response;
  try {
    resp = await fetch(BASE_URL + path, { ...options, headers, signal: controller.signal });
  } catch (e: any) {
    // A dead tunnel, the wrong Wi-Fi or a stopped server all land here. Say so
    // plainly instead of leaving the caller's spinner running.
    const timedOut = e?.name === 'AbortError';
    throw new Error(
      timedOut
        ? `The back room did not respond (${BASE_URL}). Check it is running and reachable from this phone.`
        : `Cannot reach the back room at ${BASE_URL}. Check your network.`
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await resp.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!resp.ok) {
    const message = (data && data.error) || `Request failed (${resp.status})`;
    throw new Error(message);
  }
  return data as T;
}

export type TrainingModule = {
  id: string;
  title: string;
  summary?: string | null;
  videoUrl?: string | null;
  checklist: string[];
  sortOrder?: number;
};

export const api = {
  baseUrl: BASE_URL,

  // Candidate sign-in / register uses mobile number + OTP (test mode returns the
  // code so it can be shown on screen).
  //
  // These are the *candidate* routes, not the customer ones: a customer sign-up
  // demands a GSTIN, which an applicant for a sales job does not have.
  requestOtp: (phone: string, mode: 'login' | 'signup' = 'signup') =>
    request<{ sent: boolean; devCode?: string; registered?: boolean }>('/auth/candidate/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone, mode }),
    }),

  verifyOtp: (phone: string, otp: string, name?: string, email?: string) =>
    request<{ accessToken: string; user: any }>('/auth/candidate/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, name, email, remember: true }),
    }),

  me: () => request<{ id: string; role: string; name: string }>('/auth/me'),

  // Training modules the candidate must watch before the test.
  modules: () => request<TrainingModule[]>('/modules'),

  // Mira — the in-app assistant. Same brain as the web chat bubble.
  chat: (sessionId: string, message: string, who?: string) =>
    request<{ reply: string }>('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ sessionId, message, app: 'lms', who }),
    }),
};
