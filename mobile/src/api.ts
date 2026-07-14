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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };
  const token = await loadToken();
  if (token) headers.authorization = `Bearer ${token}`;

  const resp = await fetch(BASE_URL + path, { ...options, headers });
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
    request<{ accessToken: string; user: any }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, name, gstin, remember: true }),
    }),

  me: () => request<any>('/auth/me'),

  catalog: () =>
    request<{ categories: any[]; shapes: any[]; tones: any[] }>('/catalog'),

  products: (cat?: string) =>
    request<{ products: Product[] }>(`/catalog/products${cat ? `?cat=${encodeURIComponent(cat)}` : ''}`),

  myOrders: () => request<any[]>('/orders'),

  placeOrder: (order: any) =>
    request<any>('/orders', { method: 'POST', body: JSON.stringify(order) }),
};
