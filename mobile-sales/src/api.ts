// API client for the Eurostar Sales App (the customer-facing shop).
//
// Same back room as the website — a customer signs in with the mobile number
// the office already knows, and the token decides what comes back. Nothing here
// keeps its own copy of the catalogue or the prices.
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const PRODUCTION = 'https://eurostargems.com';
const CONFIGURED: string = (Constants.expoConfig?.extra as any)?.apiBaseUrl || PRODUCTION;

const isLocal = (url: string) => /^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?/i.test(url);

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

/**
 * `apiBaseUrl: http://localhost:4000` in app.json would ship an app pointing at
 * the phone itself — dead on every device that is not cabled to a dev machine.
 * Rather than edit app.json before each build and hope nobody forgets, a
 * localhost config is simply ignored outside dev. app.json stays set up for
 * development; a release can only ever be the real thing.
 */
export const BASE_URL: string =
  !__DEV__ && isLocal(CONFIGURED) ? PRODUCTION : resolveBaseUrl(CONFIGURED);
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

/**
 * The generated catalogue.
 *
 * `__catalog__` carries the Category → Grade → Colour flow the shop actually
 * offers; every other key is a category's price table, keyed
 * "grade|colour|shape|size". Categories that price uniformly across grade or
 * colour leave those parts empty ("||round|0.6mm"), so a lookup falls back from
 * the most specific key to the least.
 */
export type PriceRow = { rate: number; pcs?: number | null; size?: string };

export type PriceSnapshot = {
  __catalog__: Record<string, {
    name: string;
    grades: { id: string; name: string }[];
    coloursByGrade: Record<string, { id: string; name: string; hex?: string }[]>;
  }>;
} & Record<string, any>;

export type CartLine = {
  skuId?: string;
  name?: string;
  categoryKey?: string;
  grade?: string;
  colour?: string;
  shape?: string;
  size?: string;
  unit: string;
  qty: number;
  unitPrice: number;
};

/**
 * The size discount for Laser Engraved, copied from laserDiscount() in
 * docs/app/laser-data.jsx. The snapshot stores the NET rate — the discount is
 * already applied — so this only exists to show the customer the list price and
 * the saving beside it, exactly as the website does. If that rule changes, this
 * has to change with it.
 */
export function laserDiscount(shape: string, mm: number): number {
  if (shape !== 'round') return 0.21;  // all fancy shapes
  if (mm < 1.0) return 0.21;           // round 0.60–0.95 mm
  if (mm < 1.7) return 0.40;           // round 1.00–1.65 mm
  if (mm < 2.1) return 0.35;           // round 1.70–2.05 mm
  return 0.21;                         // round 2.10 mm and up
}

/** The first key that exists, most specific first — mirrors the shop's own lookup. */
export function priceFor(
  block: Record<string, PriceRow> | undefined,
  grade: string, colour: string, shape: string, size: string
): PriceRow | null {
  if (!block) return null;
  const tries = [
    `${grade}|${colour}|${shape}|${size}`,
    `${grade}||${shape}|${size}`,
    `|${colour}|${shape}|${size}`,
    `||${shape}|${size}`,
  ];
  for (const k of tries) if (block[k]) return block[k];
  return null;
}

// The customer's own master record — what "My account" edits.
export type Customer = {
  id: string;
  code?: string;
  name?: string;
  contact?: string;
  email?: string;
  phone?: string;
  city?: string;
  gstin?: string;
  terms?: string;
  shipAddress?: string;
  billAddress?: string;
};

// Only name and mobile are required by the server; the rest are optional there
// and default to "". The form asks for city too, as the website's does.
export type FranchiseApplication = {
  name: string; firm?: string; city?: string; mobile: string; invest?: string;
  exp?: string; geo?: string; area?: string; floor?: string; plans?: string;
};

// What the storefront's confirmation screen posts. The cart goes under "lines"
// — the server accepts "items" too, but only "lines" carries through to the
// office's order desk and the stock decrement.
export type NewOrder = {
  id: string;
  customerId?: string;
  customer?: { name?: string; phone?: string; code?: string; id?: string };
  code?: string;
  city?: string;
  value?: number;
  lines?: {
    name?: string; categoryKey?: string; grade?: string; colour?: string;
    shape?: string; size?: string; unit?: string; unitMode?: string;
    qty?: number; ct?: number; unitPrice?: number; lineTotal?: number;
  }[];
  isExport?: boolean;
  paid?: boolean;
  source?: string;
  dispatchBy?: string;
  ts?: number;
};

// The office's broadcast to the field. Staff signing into this app see this in
// place of the customer marketing pop-up — the same split the desktop makes
// between the CRM console and the storefront.
export type Announcement = {
  active?: boolean;
  image?: string | null;
  title?: string | null;
  message?: string | null;
  badge?: string | null;
  windowStart?: string | null;
  windowEnd?: string | null;
  updatedAt?: string | null;
};

export type Testimonial = { id: string; name: string; text: string; city?: string };

export type SiteContent = {
  heroTitle?: string;
  heroSub?: string;
  footerNote?: string;
  businessHours?: string;
  testimonials?: Testimonial[];
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

  me: () =>
    request<{ id: string; name: string; role: string; phone?: string | null; email?: string | null; gstin?: string | null }>(
      '/auth/me'
    ),

  catalog: () => request<{ categories: Category[] }>('/catalog'),
  products: () => request<{ products: Product[] }>('/catalog/products'),
  orders: () => request<Order[]>('/orders'),

  // The hero wording the office sets in Admin > Content. The web storefront
  // reads the same record, so the shop says one thing on both — hardcoding the
  // copy here would drift the moment somebody edited it.
  content: () => request<SiteContent>('/admin/content'),

  // The signed-in customer's master record, found by the phone they signed in
  // with — the same lookup the web account page does.
  // The customer book, for staff placing an order on somebody's behalf. The
  // server scopes it — a rep sees the customers mapped to them, the office sees
  // everyone — so there is nothing to filter here.
  customers: () => request<Customer[]>('/customers'),

  // A staff "New customer" is created in the real master before the order is
  // placed, so it lands in the CRM book with a proper code and rep mapping
  // rather than existing as free text on one order.
  createCustomer: (name: string, phone: string) =>
    request<Customer>('/customers', { method: 'POST', body: JSON.stringify({ name, phone }) }),

  customerByPhone: (phone: string) =>
    request<Customer>(`/customers/by-phone/${encodeURIComponent(phone)}`),
  saveCustomer: (id: string, patch: Partial<Customer>) =>
    request<Customer>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),

  /**
   * Put lines in the customer's cart.
   *
   * unitPrice is an integer on the server, so a packet is the unit: qty is the
   * number of packets and unitPrice the price of one packet. That is what the
   * website sends too (unitMode 'pkt'), which keeps a per-piece rate like ₹3.52
   * exact instead of rounding it to ₹4.
   */
  // The customer's own open carts, so the Orders page can show what is waiting
  // in the basket rather than a permanent zero.
  carts: (customerId?: string) =>
    request<any[]>(`/carts${customerId ? `?customer=${encodeURIComponent(customerId)}` : ''}`),

  // Closing a cart once its order is placed — the app's cart list only shows
  // the active ones, so this is what empties the basket.
  closeCart: (id: string) =>
    request<any>(`/carts/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'confirmed' }) }),

  // Editing what is in the basket. A PUT replaces the cart's lines outright, so
  // changing a quantity or dropping a line means sending back everything that
  // should remain.
  saveCartLines: (id: string, lines: CartLine[]) =>
    request<any>(`/carts/${id}`, { method: 'PUT', body: JSON.stringify({ lines }) }),

  // Removing the last line empties the cart rather than leaving an empty one
  // behind for the office to look at.
  deleteCart: (id: string) => request<{ ok: boolean }>(`/carts/${id}`, { method: 'DELETE' }),

  // Placing the order. The server recomputes the money from the lines, so what
  // it stores can never disagree with what was bought.
  createOrder: (body: NewOrder) =>
    request<{ id: string }>('/orders', { method: 'POST', body: JSON.stringify(body) }),

  createCart: (lines: CartLine[], customerId?: string) =>
    request<{ id: string }>('/carts', {
      method: 'POST',
      body: JSON.stringify({ status: 'active', customerId, lines }),
    }),

  // The catalogue itself — grades, colours (with their swatch hex), shapes,
  // sizes and rates. This is the file scripts/gen-price-snapshot.cjs generates
  // by loading the shop's own data and calling its pricing functions, so the
  // app browses exactly what the website browses rather than a second, drifting
  // copy of the price list.
  priceSnapshot: () => request<PriceSnapshot>('/price-snapshot.json', { timeoutMs: 60000 }),

  // Category artwork. An explicit thumbnail wins; otherwise the web falls back
  // to the first product photo uploaded under that category, keyed
  // "cat|colour|shape" — so the same picture appears on both.
  catThumbs: () => request<Record<string, string>>('/admin/thumbs/categories'),

  // The marketing pop-up the office uploads in Admin > Marketing. `active` is
  // the on/off switch — an image left in place with the switch off must not
  // show, so both are honoured.
  // Both of these carry the artwork inline as a data: URI, which runs to a few
  // megabytes — well past what the default 20s allows on a phone, so they get
  // the same long window the price snapshot uses.
  splash: () =>
    request<{ image: string | null; active: boolean }>('/admin/splash', { timeoutMs: 60000 }),

  // The rep-facing broadcast — what staff get instead of the marketing splash.
  announcement: () => request<Announcement>('/announcements', { timeoutMs: 60000 }),

  productImages: () => request<Record<string, string>>('/admin/product-images'),

  // A franchise application. Public on the server — anybody may apply — and it
  // lands in the CRM's Franchise Requests list, the same one the website feeds.
  applyFranchise: (body: FranchiseApplication) =>
    request<{ id: string; status: string }>('/franchise', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Mira, the shop's assistant. `app: 'sales'` is what puts her in the
  // customer-facing body of knowledge rather than the staff one.
  ask: (message: string, page: string, sessionId: string, who?: string) =>
    request<{ reply?: string }>('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ sessionId, message, app: 'sales', page, who, contact: who }),
      timeoutMs: 60000,
    }),
  logChat: (sessionId: string, who: string, q: string, a: string) =>
    request<{ ok: boolean }>('/assistant/chatlog', {
      method: 'POST',
      body: JSON.stringify({ app: 'sales', sessionId, who, contact: who, q, a }),
    }),
};
