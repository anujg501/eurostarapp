// API client for the Eurostar CRM app.
//
// Same back room as the web CRM — no separate mobile API. A rep signs in with
// the Rep ID and password the office issued on hire; office and admin sign in
// with their own usernames. The token decides what the server will hand back,
// so this app never has to police what a role may see.
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const CONFIGURED: string = (Constants.expoConfig?.extra as any)?.apiBaseUrl || 'https://eurostargems.com';

/**
 * On a real phone "localhost" is the phone itself, so a dev config pointing at
 * http://localhost:4000 only works while an `adb reverse` tunnel is up — and
 * that tunnel dies the moment the cable is unplugged. Metro already knows the
 * dev machine's address, so borrow its host and keep the configured port.
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
if (__DEV__) console.log(`[crm] back room: ${BASE_URL} (configured: ${CONFIGURED})`);

const TOKEN_KEY = 'eurostar-crm-token';
const ROLE_KEY = 'eurostar-crm-role';
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
export async function loadRole(): Promise<StaffRole | null> {
  return (await AsyncStorage.getItem(ROLE_KEY)) as StaffRole | null;
}
export async function setRole(r: StaffRole | null): Promise<void> {
  if (r) await AsyncStorage.setItem(ROLE_KEY, r);
  else await AsyncStorage.removeItem(ROLE_KEY);
}

export type StaffRole = 'rep' | 'admin' | 'office';

// Most calls are a database read and should give up quickly.
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
    // A dead tunnel, the wrong Wi-Fi or a stopped server all land here. Say so
    // plainly rather than leaving a spinner running.
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
    // Carry the status so a caller can tell "rejected" from "went wrong".
    throw Object.assign(new Error(message), { status: resp.status });
  }
  return data as T;
}

export type Customer = {
  id: string;
  code: string;
  name: string;
  phone?: string | null;
  city?: string | null;
  gstin?: string | null;
  terms?: string;
  rep?: string | null;
  createdAt?: string;
};

export type Order = {
  id: string;
  status: string;
  grand?: number;
  customerName?: string;
  customer?: string;
  custName?: string;
  createdAt?: string;
  date?: string;
};

export type Rfq = { id: string; status: string; value?: number; city?: string | null; createdAt?: string };

export const api = {
  // Staff sign-in. The role picked on the login screen is sent with it, exactly
  // as the web CRM does — the server issues a token for that role or refuses.
  login: (role: StaffRole, username: string, password: string, remember = true) =>
    request<{ accessToken: string; refreshToken?: string; user: { id: string; role: string; name: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ role, username, password, remember }) }
    ),

  me: () => request<{ id: string; role: string; name: string; repId?: string }>('/auth/me'),

  customers: () => request<Customer[]>('/customers'),
  orders: () => request<Order[]>('/orders'),
  rfqs: () => request<Rfq[]>('/rfq'),
};
