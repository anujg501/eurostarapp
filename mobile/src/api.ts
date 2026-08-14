// API client for the Eurostar back room.
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BASE_URL: string =
  (Constants.expoConfig?.extra as any)?.apiBaseUrl || 'https://eurostar-api.onrender.com';

export type Product = {
  id: string;
  name: string;
  cat: string;
  tone: string;
  shape: string;
  size: string;
  clarity: string;
  price: number;
  unit: string;
  moq: number;
  stock: 'in' | 'low' | 'out';
  stockCount: number;
  badge?: string;
  desc?: string;
};

let accessToken: string | null = null;
let refreshToken: string | null = null;

export async function loadToken(): Promise<string | null> {
  if (accessToken) return accessToken;
  accessToken = await AsyncStorage.getItem('eurostar_token');
  return accessToken;
}

export async function setToken(token: string | null): Promise<void> {
  accessToken = token;
  if (token) await AsyncStorage.setItem('eurostar_token', token);
  else await AsyncStorage.removeItem('eurostar_token');
}

// The "keep me signed in" (remember) refresh token. The access token lives ~12h;
// the refresh token lives 30 days and is what actually keeps a phone signed in.
// The app used to throw it away and store only the access token, so a day later
// the session was dead and the app demanded a fresh login — this is the fix.
async function loadRefreshToken(): Promise<string | null> {
  if (refreshToken) return refreshToken;
  refreshToken = await AsyncStorage.getItem('eurostar_refresh');
  return refreshToken;
}

export async function setRefreshToken(token: string | null): Promise<void> {
  refreshToken = token;
  if (token) await AsyncStorage.setItem('eurostar_refresh', token);
  else await AsyncStorage.removeItem('eurostar_refresh');
}

// Store both tokens returned by a login ("remember"). Call this from the login
// screen instead of setToken() so the refresh token is kept.
export async function saveSession(res: { accessToken: string; refreshToken?: string }): Promise<void> {
  await setToken(res.accessToken);
  if (res.refreshToken) await setRefreshToken(res.refreshToken);
}

// Sign out: drop both tokens.
export async function clearSession(): Promise<void> {
  await setToken(null);
  await setRefreshToken(null);
}

// Exchange the 30-day refresh token for a fresh access token. Returns true when
// the session lives on, false when the phone really must sign in again.
async function renewAccessToken(): Promise<boolean> {
  const rt = await loadRefreshToken();
  if (!rt) return false;
  try {
    const resp = await fetch(BASE_URL + '/auth/refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!resp.ok) {
      if (resp.status === 401 || resp.status === 403) await setRefreshToken(null); // truly dead
      return false;
    }
    const data = await resp.json();
    if (!data?.accessToken) return false;
    await setToken(data.accessToken);
    return true;
  } catch {
    return false; // offline: keep the refresh token and try again later
  }
}

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };
  const token = await loadToken();
  if (token) headers.authorization = `Bearer ${token}`;

  const resp = await fetch(BASE_URL + path, { ...options, headers });

  // An expired (or missing) access token is not the end of the session — renew
  // it once with the refresh token and replay the request. Only a refresh that
  // fails means the phone really has to sign in again.
  if (resp.status === 401 && !isRetry) {
    if (await renewAccessToken()) return request<T>(path, options, true);
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

// --- Auth ---
export const api = {
  baseUrl: BASE_URL,

  requestOtp: (phone: string) =>
    request<{ sent: boolean; devCode?: string }>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  verifyOtp: (phone: string, otp: string, name?: string, gstin?: string) =>
    request<{ accessToken: string; refreshToken?: string; user: any }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, name, gstin, remember: true }),
    }),

  // Staff (rep / office / admin) sign in with username + password.
  staffLogin: (role: string, username: string, password: string) =>
    request<{ accessToken: string; refreshToken?: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ role, username, password, remember: true }),
    }),

  me: () => request<{ id: string; role: string; name: string; repId?: string }>('/auth/me'),

  // Field check-in / out with the phone's GPS.
  checkin: (data: { type: 'in' | 'out'; lat: number; lng: number; accuracy?: number; address?: string }) =>
    request<any>('/reps/checkin', { method: 'POST', body: JSON.stringify(data) }),

  myCheckins: () => request<any[]>('/reps/checkins'),

  catalog: () =>
    request<{ categories: any[]; shapes: any[]; tones: any[] }>('/catalog'),

  products: (cat?: string) =>
    request<{ products: Product[] }>(`/catalog/products${cat ? `?cat=${encodeURIComponent(cat)}` : ''}`),

  myOrders: () => request<any[]>('/orders'),

  placeOrder: (order: any) =>
    request<any>('/orders', { method: 'POST', body: JSON.stringify(order) }),

  // --- CRM (rep side) ---
  // Reps get their own customers; office/admin get all (optionally ?rep=).
  customers: (rep?: string) =>
    request<Customer[]>(`/customers${rep ? `?rep=${encodeURIComponent(rep)}` : ''}`),

  createCustomer: (data: {
    name: string;
    phone: string;
    city?: string;
    gstin?: string;
    terms?: 'cash' | '15' | '30' | '45' | '60';
  }) => request<Customer>('/customers', { method: 'POST', body: JSON.stringify(data) }),

  // --- LMS (rep side) ---
  // Recruitment pipeline (candidates the rep referred / is screening).
  candidates: (stage?: string) =>
    request<Candidate[]>(`/candidates${stage ? `?stage=${encodeURIComponent(stage)}` : ''}`),

  // Training modules — product/sales learning with video links + checklists.
  modules: () => request<TrainingModule[]>('/modules'),
};

export type Customer = {
  id: string;
  code: string;
  name: string;
  phone: string;
  city?: string | null;
  gstin?: string | null;
  terms?: string | null;
  rep?: string | null;
};

export type Candidate = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  source?: string | null;
  stage: string;
  score?: number | null;
  exp?: string | null;
  repId?: string | null;
  createdAt: string;
};

export type TrainingModule = {
  id: string;
  title: string;
  summary?: string | null;
  videoUrl?: string | null;
  checklist: string[];
  sortOrder?: number;
};
