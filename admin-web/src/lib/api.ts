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
  /** Packet-sold categories: pieces in one packet of this size. Null = use the
   *  category's chart default. */
  pcsPerPacket: number | null;
  badge: string | null;
  desc: string | null;
  hidden: boolean;
}

export interface PricingRow {
  size: string;
  /** Null until this size has been saved and materialised into a real SKU. */
  skuId: string | null;
  name: string | null;
  rate: number;
  pcsPerPacket: number;
  /** false = the chart's "base × size multiplier" suggestion, not stored data. */
  saved: boolean;
}

export interface PricingMatrix {
  cat: string;
  shape: string;
  shapes: string[];
  unit: string;
  rows: PricingRow[];
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

/** Product photo map. Key format is fixed by the storefront (see
 *  docs/app/product-images.jsx): `cat|colour|shape`, or `cat|grade|colour|shape`
 *  for grade-scoped categories. */
export type ProductImages = Record<string, string>;

// Categories whose photo depends on the GRADE, not just colour + shape. In these,
// the cards shown as "colours" are actually grades sharing one colour id (Mother
// of Pearl → 'mop'; Multi Sapphires → 'multi'; Opaque → natural/opal). Keep in
// sync with docs/app/product-images.jsx (PIMG_GRADE_SCOPED).
export const GRADE_SCOPED: Record<string, boolean> = {
  mop: true,
  multisapphire: true,
  opaque: true,
  labgrown: true,
  navratna: true,
  hollowmop: true,
  bracelet: true,
  beads: true,
};

// The grade list to offer per grade-scoped category (id must match the
// storefront's grade ids in docs/app/data.jsx → GRADES_BY_CATEGORY). Grades are
// not lifted into the admin overlays, so they are defined here.
export const GRADE_SCOPED_GRADES: Record<string, { id: string; name: string }[]> = {
  mop: [
    { id: 'white', name: 'White MOP' },
    { id: 'malachite', name: 'Malachite' },
    { id: 'black', name: 'Black MOP' },
  ],
  multisapphire: [
    { id: 'aaa', name: 'Natural Multi Sapphires' },
    { id: 'aa', name: 'Synthetic Multi Sapphires' },
    { id: 'icecut', name: 'Ice Cut Multi Sapphires' },
  ],
  opaque: [
    { id: 'natural', name: 'Natural look Opaque Stones' },
    { id: 'opal', name: 'Opal look Opaque Stones' },
  ],
  labgrown: [
    { id: 'labgrown', name: 'Lab Grown Beryl' },
    { id: 'created', name: 'Created Coloured Gemstones' },
    { id: 'labcorundum', name: 'Lab Grown Corundum' },
  ],
  navratna: [
    { id: 'natural', name: 'Natural Navratna' },
    { id: 'created', name: 'Created Navratna' },
  ],
  hollowmop: [
    { id: 'white', name: 'White MOP' },
    { id: 'onyx', name: 'Black Onyx' },
  ],
  bracelet: [
    { id: 'rolex', name: 'Rolex Style' },
    { id: 'cartier', name: 'Cartier Style' },
  ],
  beads: [
    { id: 'ruby5', name: 'Ruby 5 Beads' },
    { id: 'rubyopaque', name: 'Ruby Opaque Beads' },
    { id: 'greenopaque', name: 'Green Opaque Beads' },
    { id: 'greenhydro', name: 'Green Hydro Beads' },
  ],
};

// Some grade-scoped categories have DIFFERENT colours per grade (mirrors the
// storefront's LABGROWN_COLORS_BY_GRADE / OPAQUE_COLORS_BY_GRADE in data.jsx).
// When a (category, grade) has an entry here, the admin shows these colours
// instead of the category's lifted base colours. Grades not listed fall back to
// the lifted colours (e.g. Lab Grown Beryl uses the base labgrown colours).
export const GRADE_SCOPED_COLOURS: Record<string, Record<string, Colour[]>> = {
  labgrown: {
    created: [
      { id: 'z8483', name: 'Z-8483 Pink Tourmaline', hex: '#E0567E' },
      { id: 'z22', name: 'Z-22 Zambia Emerald', hex: '#0E5C4A' },
      { id: 'z5912', name: 'Z-5912 Columbia Emerald', hex: '#1E7A52' },
      { id: 'z597', name: 'Z-597 Tanzanite', hex: '#5B5BC4' },
    ],
    labcorundum: [
      { id: 'peach', name: 'Peach', hex: '#F2B89C' },
      { id: 'padp55', name: 'Padparadscha 55', hex: '#F08E6A' },
      { id: 'purple65', name: 'Purple 65', hex: '#8E5FB0' },
      { id: 'alex45', name: 'Alex 45', hex: '#4E7E6E' },
      { id: 'alex46', name: 'Alex 46', hex: '#6E7EA0' },
      { id: 'violet60', name: 'Violet 60', hex: '#7A4FB0' },
      { id: 'kunzite61', name: 'Kunzite 61', hex: '#E5A8C8' },
      { id: 'spinel105', name: 'Spinel 105', hex: '#C0324E' },
      { id: 'spinel106', name: 'Spinel 106', hex: '#B0445E' },
      { id: 'spinel108', name: 'Spinel 108', hex: '#9C2C44' },
      { id: 'white', name: 'White', hex: '#F2EFE8' },
      { id: 'green', name: 'Green', hex: '#2E8C5C' },
      { id: 'sunrise', name: 'Sunrise', hex: '#F2925A' },
      { id: 'yellow', name: 'Yellow', hex: '#E2B43A' },
      { id: 'yellow20', name: 'Yellow 20', hex: '#EAC24E' },
    ],
  },
  opaque: {
    natural: [
      { id: 'red', name: 'Red', hex: '#C0432E' },
      { id: 'green', name: 'Green', hex: '#2E8C5C' },
    ],
    opal: [
      { id: 'op290', name: 'Color #290/4', hex: '#C98AA0' },
      { id: 'op210', name: 'Color #210/2', hex: '#7FB4C9' },
      { id: 'op283', name: 'Color #283', hex: '#9C7DC2' },
      { id: 'op240', name: 'Color #240', hex: '#E2B43A' },
      { id: 'op223', name: 'Color #223/2', hex: '#5BB89A' },
      { id: 'op216', name: 'Color #216', hex: '#5B7BC4' },
      { id: 'op209', name: 'Color #209/3', hex: '#4F86B8' },
      { id: 'op288', name: 'Color #288/1', hex: '#D08A5B' },
    ],
  },
  bracelet: {
    // Cartier and Rolex share colour names (Silver, Gold, Rose Gold, Black), so
    // grade-scoping keeps their photos separate.
    cartier: [
      { id: 'silver', name: 'Silver', hex: '#C0C2C4' },
      { id: 'lavender', name: 'Lavender', hex: '#9B7BBF' },
      { id: 'wine', name: 'Wine', hex: '#6E1A2A' },
      { id: 'royal', name: 'Royal Blue', hex: '#1E3A8A' },
      { id: 'white', name: 'White', hex: '#F2EFE8' },
      { id: 'brown', name: 'Brown', hex: '#5A3A28' },
      { id: 'nightgrey', name: 'Night Grey', hex: '#4A4A48' },
      { id: 'gold', name: 'Gold', hex: '#C9A227' },
      { id: 'skyblue', name: 'Sky Blue', hex: '#4FA6D8' },
      { id: 'rosegold', name: 'Rose Gold', hex: '#C98A6E' },
      { id: 'orange', name: 'Orange', hex: '#D2691E' },
      { id: 'navy', name: 'Navy Blue', hex: '#1B2A4A' },
      { id: 'pink', name: 'Pink', hex: '#E6A4B4' },
      { id: 'green', name: 'Green', hex: '#2E6B3E' },
      { id: 'mocha', name: 'Mocha', hex: '#6B4A32' },
      { id: 'teal', name: 'Teal Blue', hex: '#1F7A8C' },
      { id: 'champagne', name: 'Champagne', hex: '#D8C9A8' },
      { id: 'red', name: 'Red', hex: '#C0202E' },
      { id: 'black', name: 'Black', hex: '#2A2A28' },
      { id: 'magenta', name: 'Magenta', hex: '#C81E7A' },
      { id: 'greenapple', name: 'Green Apple', hex: '#4FA02E' },
    ],
    rolex: [
      { id: 'silver', name: 'Silver', hex: '#C0C2C4' },
      { id: 'mauve', name: 'Mauve', hex: '#9E6E7A' },
      { id: 'rosegold', name: 'Rose Gold', hex: '#C98A6E' },
      { id: 'gold', name: 'Gold', hex: '#C9A227' },
      { id: 'blue', name: 'Blue', hex: '#1F5FA8' },
      { id: 'black', name: 'Black', hex: '#2A2A28' },
    ],
  },
};

// A few grade-scoped categories also vary their SHAPES per grade (Opaque:
// natural stones are cut/maniya/tyre/ball-hole; opal stones are round/oval/
// cushion). Mirrors the per-colour `shapes` in OPAQUE_COLORS_BY_GRADE. Grades
// not listed fall back to the category's lifted shapes.
export const GRADE_SCOPED_SHAPES: Record<string, Record<string, string[]>> = {
  opaque: {
    natural: ['cutstones', 'maniya', 'tyre-plain', 'tyre-fac', 'ballhole-plain', 'ballhole-fac'],
    opal: ['round', 'oval', 'cushion'],
  },
  // Bracelets have no shape axis; the storefront keys the photo under 'round'.
  bracelet: {
    rolex: ['round'],
    cartier: ['round'],
  },
};

export const productImageKey = (cat: string, colour: string, shape: string, grade?: string) =>
  grade && GRADE_SCOPED[cat] ? `${cat}|${grade}|${colour}|${shape}` : `${cat}|${colour}|${shape}`;

/** Resolve a photo for a cell: a grade-specific upload wins, else the legacy
 *  shared colour+shape photo (so pre-per-grade uploads still show). */
export const resolveProductImage = (
  images: ProductImages,
  cat: string,
  colour: string,
  shape: string,
  grade?: string,
): string | undefined =>
  images[productImageKey(cat, colour, shape, grade)] ??
  (grade && GRADE_SCOPED[cat] ? images[productImageKey(cat, colour, shape)] : undefined);

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

  // Pricing matrix: one row per size in the shape's calibrated chart. Rows with
  // saved: false are the chart's suggestion and become real SKUs when saved.
  pricing: (cat: string, shape?: string) =>
    api.get<PricingMatrix>(
      `/admin/pricing?cat=${encodeURIComponent(cat)}${shape ? `&shape=${encodeURIComponent(shape)}` : ''}`
    ),
  savePricingRow: (row: { cat: string; shape: string; size: string; rate: number; pcsPerPacket?: number | null }) =>
    api.put<{ row: Product; created: boolean }>('/admin/pricing/row', row),
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
