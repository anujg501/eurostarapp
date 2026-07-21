// Single door to the back room.
//
// The prototype this replaces had two failure modes we must never repeat:
//   1. it forgot the auth token, so writes 401'd, and
//   2. it used `.then(() => setSaved(true))`, which fires on a 401 too, because
//      fetch only rejects on network errors — so the UI said "Saved ✓" while
//      saving nothing.
// Every response is therefore checked here, and anything non-2xx throws. A
// screen cannot report success unless the server actually accepted the write.

const TOKEN_KEY = 'eurostar-admin-token';
const REFRESH_KEY = 'eurostar-admin-refresh';

export function getToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setToken(token: string): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage disabled — session lasts for this page only */
  }
}

// The access token lives ~15 minutes. The server already issues a long-lived
// refresh token at login ("remember"), but this app used to throw it away — so
// the first request after 15 minutes (a refresh of the page, most often) 401'd
// and dumped the operator back at the login gate mid-task. Keep it and renew.
export function getRefreshToken(): string {
  try {
    return localStorage.getItem(REFRESH_KEY) || '';
  } catch {
    return '';
  }
}

export function setRefreshToken(token: string): void {
  try {
    if (token) localStorage.setItem(REFRESH_KEY, token);
    else localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* storage disabled */
  }
}

/** Exchange the refresh token for a fresh access token. Returns false when the
 *  session is genuinely over and the operator must sign in again. */
async function renewAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const resp = await fetch('/auth/refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!resp.ok) return false;
    const data = (await resp.json()) as { accessToken?: string };
    if (!data.accessToken) return false;
    setToken(data.accessToken);
    return true;
  } catch {
    return false; // offline: keep the session and let the caller surface the error
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** True when the session is gone and the user must sign in again. */
export function isAuthError(e: unknown): boolean {
  return e instanceof ApiError && (e.status === 401 || e.status === 403);
}

async function request<T>(method: string, path: string, body?: unknown, isRetry = false): Promise<T> {
  const headers: Record<string, string> = { accept: 'application/json' };
  const token = getToken();
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers['content-type'] = 'application/json';

  let resp: Response;
  try {
    resp = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection.', 0);
  }

  // An expired access token is not the end of the session: renew it once with
  // the refresh token and replay the request. Only a refresh that fails means
  // the operator really has to sign in again.
  if (resp.status === 401 && !isRetry && getRefreshToken()) {
    if (await renewAccessToken()) return request<T>(method, path, body, true);
  }

  const text = await resp.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!resp.ok) {
    if (resp.status === 401 || resp.status === 403) {
      // Stale session: drop both tokens and let the shell show the login gate.
      setToken('');
      setRefreshToken('');
      window.dispatchEvent(new Event('eurostar-auth-lost'));
    }
    const msg =
      (data && typeof data === 'object' && data.error) ||
      (resp.status === 401 ? 'Your session expired — please sign in again.' : `Request failed (${resp.status})`);
    throw new ApiError(String(msg), resp.status);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {}),
  del: <T>(path: string) => request<T>('DELETE', path),
};

// --- Types shared across screens -------------------------------------------

export type Unit = 'pc' | 'ct' | 'pkt' | 'strip';

export interface Category {
  key: string;
  name: string;
  short: string;
  blurb: string;
  unit: Unit;
  origin: string;
  skipGrade: boolean;
  count: number;
  sortOrder: number;
  hidden: boolean;
}

export interface NewCategory {
  name: string;
  short?: string;
  blurb?: string;
  unit: Unit;
  origin?: string;
  skipGrade?: boolean;
  count?: number;
}

export type StaffRole = 'rep' | 'office' | 'admin';

export interface StaffUser {
  id: string;
  role: StaffRole;
  name: string;
  username: string;
  phone: string;
  active: boolean;
  isOwner: boolean;
  createdAt: string;
}

export interface NewStaffUser {
  role: StaffRole;
  name: string;
  username: string;
  password?: string; // generated by the server when omitted
  phone?: string;
}

export interface StoreRules {
  gstRate?: number;
  courierFlat?: number;
  courierFreeOver?: number;
  minOrderValue?: number;
  dispatchWorkingDays?: number;
  exportDispatchDays?: number;
  rfqMinValue?: number;
  defaultPayment?: string;
  languages?: string[];
  inviteOnly?: boolean;
  watermarkPriceSheets?: boolean;
  noindex?: boolean;
}

export interface SiteContent {
  heroTitle?: string;
  heroSub?: string;
  footerNote?: string;
  businessHours?: string;
  testimonials?: { id: string; name: string; text: string; city?: string }[];
}

export interface Product {
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
  badge: string | null;
  desc: string | null;
  hidden: boolean;
}

export interface BulkResult {
  received: number;
  created: number;
  updated: number;
}

// Catalogue overlays, all keyed by Category.key.
// Shapes match what the storefront already reads — see docs/app/data.jsx
// (GRADES_BY_CATEGORY) and docs/app/product-images.jsx.
export interface Grade {
  id: string;
  name: string;
  tier?: string;
  origin?: string;
  desc?: string;
  tone?: string;
  basePrice?: number;
  unit?: string;
}
export type GradesByCat = Record<string, Grade[]>;

export interface Colour {
  id: string;
  name: string;
  hex?: string;
}
export type ColoursByCat = Record<string, Colour[]>;
export type ShapesByCat = Record<string, string[]>;

/** Product photo map. Key format is fixed by the storefront: `cat|colour|shape`. */
export type ProductImages = Record<string, string>;
export const productImageKey = (cat: string, colour: string, shape: string) => `${cat}|${colour}|${shape}`;

export interface Announcement {
  active: boolean;
  image: string | null;
  title: string | null;
  message: string | null;
  badge: string | null;
}

export const adminApi = {
  login: (username: string, password: string, remember: boolean) =>
    api.post<{ accessToken: string; refreshToken?: string; name?: string }>('/auth/login', {
      role: 'admin',
      username,
      password,
      remember,
    }),

  categories: () => api.get<Category[]>('/admin/catalog/categories'),
  createCategory: (c: NewCategory) => api.post<Category>('/admin/catalog/categories', c),
  updateCategory: (key: string, patch: Partial<Category>) =>
    api.put<Category>(`/admin/catalog/categories/${encodeURIComponent(key)}`, patch),
  deleteCategory: (key: string) => api.del<{ deleted: string }>(`/admin/catalog/categories/${encodeURIComponent(key)}`),

  rules: () => api.get<StoreRules>('/admin/settings/rules'),
  saveRules: (r: StoreRules) => api.put<StoreRules>('/admin/settings/rules', r),

  content: () => api.get<SiteContent>('/admin/content'),
  saveContent: (c: SiteContent) => api.put<SiteContent>('/admin/content', c),

  splash: () => api.get<{ image: string | null; active: boolean }>('/admin/splash'),
  saveSplash: (s: { image?: string | null; active?: boolean }) => api.put('/admin/splash', s),

  catThumbs: () => api.get<Record<string, string>>('/admin/thumbs/categories'),
  saveCatThumbs: (m: Record<string, string>) => api.put('/admin/thumbs/categories', m),
  shapeThumbs: () => api.get<Record<string, string>>('/admin/thumbs/shapes'),
  saveShapeThumbs: (m: Record<string, string>) => api.put('/admin/thumbs/shapes', m),

  productImages: () => api.get<ProductImages>('/admin/product-images'),
  saveProductImages: (m: ProductImages) => api.put('/admin/product-images', m),

  grades: () => api.get<GradesByCat>('/admin/catalog/grades'),
  saveGrades: (m: GradesByCat) => api.put<GradesByCat>('/admin/catalog/grades', m),
  colours: () => api.get<ColoursByCat>('/admin/catalog/colours'),
  saveColours: (m: ColoursByCat) => api.put<ColoursByCat>('/admin/catalog/colours', m),
  shapes: () => api.get<ShapesByCat>('/admin/catalog/shapes'),
  saveShapes: (m: ShapesByCat) => api.put<ShapesByCat>('/admin/catalog/shapes', m),

  setSoldOut: (key: string, soldOut: boolean) => api.put('/inventory/admin', { key, soldOut }),

  // Staff accounts. Create/reset return the plaintext password exactly once —
  // it is never readable again, so the screen must show it there and then.
  users: () => api.get<StaffUser[]>('/users'),
  createUser: (u: NewStaffUser) => api.post<StaffUser & { password?: string }>('/users', u),
  updateUser: (id: string, patch: Partial<Pick<StaffUser, 'name' | 'phone' | 'role' | 'active'>>) =>
    api.put<StaffUser>(`/users/${encodeURIComponent(id)}`, patch),
  resetPassword: (id: string) =>
    api.post<{ id: string; username: string; password: string }>(`/users/${encodeURIComponent(id)}/reset-password`),
  deleteUser: (id: string) => api.del<{ deleted?: string }>(`/users/${encodeURIComponent(id)}`),

  products: (cat?: string) => api.get<Product[]>(`/admin/products${cat ? `?cat=${encodeURIComponent(cat)}` : ''}`),
  updateProduct: (id: string, patch: Partial<Product>) =>
    api.put<Product>(`/admin/products/${encodeURIComponent(id)}`, patch),
  createProduct: (p: Partial<Product> & { id: string; name: string; cat: string; price: number }) =>
    api.post<Product>('/admin/products', p),
  deleteProduct: (id: string) => api.del<{ deleted: string }>(`/admin/products/${encodeURIComponent(id)}`),
  bulkProducts: (products: unknown[]) => api.post<BulkResult>('/admin/products/bulk', { products }),

  announcement: () => api.get<Announcement>('/announcements'),
  saveAnnouncement: (a: Partial<Announcement>) => api.put<Announcement>('/announcements', a),
};

/** Read a picked file as a data URL, which is how images are stored. */
/**
 * Store an image and return the string to save.
 *
 * Uploads to object storage and returns its URL, so the image bytes never enter
 * the database or the catalogue payload. Falls back to an inline data URL when
 * storage is not configured, which is exactly what this app did before — so
 * uploads keep working before the bucket exists, and existing data URLs already
 * saved keep rendering either way.
 */
/**
 * Shrink an oversized photo before it is uploaded. A phone photo is often
 * 3–8 MB at 4000 px, while these images are displayed at ~1080 px at most —
 * and when object storage is not configured the bytes travel as a base64 data
 * URL, which inflates them by a third and blew past the request size limit.
 * Resizing keeps the stored copy (and the storefront payload) small.
 *
 * PNGs are re-encoded as PNG so transparency survives; anything else becomes
 * JPEG. SVG and GIF are passed through untouched (vector / animation).
 */
const NO_RECOMPRESS = ['image/svg+xml', 'image/gif'];

async function shrinkImage(file: File, maxDim = 1600, quality = 0.85): Promise<File> {
  if (NO_RECOMPRESS.includes(file.type) || !file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    // Already small in both dimensions and bytes — leave it alone.
    if (scale === 1 && file.size <= 1_000_000) {
      bitmap.close?.();
      return file;
    }
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close?.();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, outType, outType === 'image/jpeg' ? quality : undefined)
    );
    // Never make it bigger than it started.
    if (!blob || blob.size >= file.size) return file;
    const ext = outType === 'image/png' ? '.png' : '.jpg';
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + ext, { type: outType });
  } catch {
    return file; // any failure: upload the original rather than blocking the user
  }
}

export async function uploadImage(file: File, folder = 'misc'): Promise<string> {
  const source = await shrinkImage(file);
  const form = new FormData();
  form.append('file', source);

  const token = getToken();
  try {
    const resp = await fetch(`/admin/upload?folder=${encodeURIComponent(folder)}`, {
      method: 'POST',
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body: form, // no content-type header — the browser sets the multipart boundary
    });

    if (resp.ok) {
      const data = (await resp.json()) as { url?: string };
      if (data.url) return data.url;
    }

    // 503 means the bucket is not set up yet: fall back rather than fail.
    if (resp.status !== 503) {
      const msg = await resp.text();
      let parsed = '';
      try {
        parsed = (JSON.parse(msg) as { error?: string }).error ?? '';
      } catch {
        /* not json */
      }
      throw new ApiError(parsed || `Upload failed (${resp.status})`, resp.status);
    }
  } catch (e) {
    if (e instanceof ApiError) throw e; // a real rejection (too large, wrong type)
    // network error — fall through to the inline copy
  }

  return fileToDataUrl(source);
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not read that file.'));
    r.readAsDataURL(file);
  });
}
