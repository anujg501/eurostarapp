// API client for the Eurostar Sales App (the customer-facing shop).
//
// Same back room as the website — a customer signs in with the mobile number
// the office already knows, and the token decides what comes back. Nothing here
// keeps its own copy of the catalogue or the prices.
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const CONFIGURED: string = (Constants.expoConfig?.extra as any)?.apiBaseUrl || 'https://eurostargems.com';

/**
 * On a real phone "localhost" is the phone itself, so a dev config pointing at
 * http://localhost:4000 only works while an `adb reverse` tunnel is up — and
 * that tunnel dies when the cable is unplugged. Metro knows the dev machine's
 * address, so borrow its host and keep the configured port.
 */
function resolveBaseUrl(url: string): string {
  const m = /^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?(.*)$/i.exec(url);
  if (!m) return url;
  const hostUri: string | undefined =
    (Constants.expoConfig as any)?.hostUri ||
    (Constants as any).expoGoConfig?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  const host = hostUri?.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return url;
  return `${m[1]}${host}${m[3] ?? ''}${m[4] ?? ''}`;
}

export const BASE_URL: string = resolveBaseUrl(CONFIGURED);
// eslint-disable-next-line no-console
if (__DEV__) console.log(`[sales] back room: ${BASE_URL} (configured: ${CONFIGURED})`);

const TOKEN_KEY = 'eurostar-sales-token';
let accessToken: string | null = null;

export async function loadToken(): Promise<string | null> {
  if (accessToken) return accessToken;
  accessToken = await AsyncStorage.getItem(TOKEN_KEY);
  return accessToken;
}
export async function setToken(t: string | null): Promise<void> {
  accessToken = t;
  if (t) await AsyncStorage.setItem(TOKEN_KEY, t);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

const TIMEOUT_MS = 20000;

async function request<T>(path: string, options: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };
  const token = await loadToken();
  if (token) headers.authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? TIMEOUT_MS);
  let resp: Response;
  try {
    resp = await fetch(BASE_URL + path, { ...options, headers, signal: controller.signal });
  } catch (e: any) {
    const timedOut = e?.name === 'AbortError';
    throw new Error(
      timedOut
        ? `The back room did not respond (${BASE_URL}). Check it is running and reachable from this phone.`
        : `Could not reach the back room (${BASE_URL}).`
    );
  } finally {
    clearTimeout(timer);
  }

  let data: any = null;
  try { data = await resp.json(); } catch { /* empty body */ }
  if (!resp.ok) {
    const message = (data && data.error) || `Request failed (${resp.status})`;
    throw Object.assign(new Error(message), { status: resp.status, data });
  }
  return data as T;
}

export type Category = {
  key: string;
  name: string;
  short?: string;
  blurb?: string;
  unit?: string;
  count?: number;
};

export type Product = {
  id: string;
  name: string;
  cat: string;
  tone?: string;
  shape?: string;
  size?: string;
  price: number;
  unit?: string;
  moq?: number;
  stock?: string;
};

export type Order = {
  id: string;
  status: string;
  grand?: number;
  createdAt?: string;
  date?: string;
};

export const api = {
  // Customers sign in with the number the office already holds. `mode` tells
  // the server whether this is a sign-in or a first-time sign-up, so an unknown
  // number is answered with "create your account" rather than a silent SMS.
  requestOtp: (phone: string, mode: 'login' | 'signup' = 'login') =>
    request<{ ok?: boolean; devCode?: string }>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone, mode }),
    }),

  verifyOtp: (phone: string, otp: string, remember = true, name?: string, gstin?: string) =>
    request<{ accessToken: string; user: { id: string; name: string; role: string } }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, remember, name, gstin }),
    }),

  // Staff use the same app to look at the shop as a customer would.
  login: (role: 'rep' | 'office', username: string, password: string) =>
    request<{ accessToken: string; user: { id: string; name: string; role: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ role, username, password, remember: true }),
    }),

  me: () => request<{ id: string; name: string; role: string }>('/auth/me'),

  catalog: () => request<{ categories: Category[] }>('/catalog'),
  products: () => request<{ products: Product[] }>('/catalog/products'),
  orders: () => request<Order[]>('/orders'),
};
