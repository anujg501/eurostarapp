// API client for the Eurostar back room (LMS candidate app).
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BASE_URL: string =
  (Constants.expoConfig?.extra as any)?.apiBaseUrl || 'https://eurostar-api.onrender.com';

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
  requestOtp: (phone: string, mode: 'login' | 'signup' = 'signup') =>
    request<{ sent: boolean; devCode?: string; registered?: boolean }>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone, mode }),
    }),

  verifyOtp: (phone: string, otp: string, name?: string, email?: string) =>
    request<{ accessToken: string; user: any }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, name, email, remember: true }),
    }),

  me: () => request<{ id: string; role: string; name: string }>('/auth/me'),

  // Training modules the candidate must watch before the test.
  modules: () => request<TrainingModule[]>('/modules'),
};
