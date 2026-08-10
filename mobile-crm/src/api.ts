// API client for the Eurostar CRM app.
//
// Same back room as the web CRM — no separate mobile API. A rep signs in with
// the Rep ID and password the office issued on hire; office and admin sign in
// with their own usernames. The token decides what the server will hand back,
// so this app never has to police what a role may see.
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const PRODUCTION = 'https://eurostargems.com';
const CONFIGURED: string = (Constants.expoConfig?.extra as any)?.apiBaseUrl || PRODUCTION;

const isLocal = (url: string) => /^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?/i.test(url);

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

/**
 * A release build has no Metro to borrow a host from, so a leftover
 * `apiBaseUrl: http://localhost:4000` in app.json would ship an app pointing at
 * the phone itself — dead on every device that is not cabled to a dev machine.
 * Rather than edit app.json before each build and hope nobody forgets, a
 * localhost config is simply ignored outside dev. app.json stays set up for
 * development; production can only ever be the real thing.
 */
export const BASE_URL: string =
  !__DEV__ && isLocal(CONFIGURED) ? PRODUCTION : resolveBaseUrl(CONFIGURED);
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
  customerId?: string | null;
  rep?: string;
  repId?: string;
  courier?: string | null;
  track?: string | null;
  paid?: boolean;
  createdAt?: string;
  date?: string;
};

export type OrderStatus =
  | 'pending' | 'confirmed' | 'packed' | 'shipped' | 'dispatched'
  | 'out-for-delivery' | 'delivered' | 'cancelled' | 'rejected' | 'returned' | 'refunded';

/**
 * The order pipeline, in the order the office walks it. The desktop's FLOW
 * starts at 'new'; this database calls that same state 'pending'.
 */
export const ORDER_FLOW: OrderStatus[] = [
  'pending', 'confirmed', 'packed', 'shipped', 'out-for-delivery', 'delivered',
];

export const ORDER_LABEL: Record<string, string> = {
  pending: 'New', confirmed: 'Confirmed', packed: 'Packed', shipped: 'Shipped',
  dispatched: 'Dispatched', 'out-for-delivery': 'Out for delivery', delivered: 'Delivered',
  cancelled: 'Cancelled', rejected: 'Rejected', returned: 'Returned', refunded: 'Refunded',
};

/** The next state, or null when the order has reached the end of the line. */
export function nextStatus(s: string): OrderStatus | null {
  const i = ORDER_FLOW.indexOf(s as OrderStatus);
  return i >= 0 && i < ORDER_FLOW.length - 1 ? ORDER_FLOW[i + 1] : null;
}

// An enquiry off the storefront. The server hands back the customer it belongs
// to already joined, plus whichever rep the office routed it to.
export type Rfq = {
  id: string;
  status: string; // open | answered | quoted | closed
  value?: number;
  custCode?: string;
  custName?: string;
  city?: string | null;
  assignedRep?: string;
  items?: any;
  detail?: Record<string, any>;
  quoteAmount?: number | null;
  quoteNote?: string;
  createdAt?: string;
};

// A lead is one relationship being worked up the pipeline. Same six stages as
// the web CRM's Relation-Pipeline board.
export type Lead = {
  id: string;
  name: string;
  contact?: string;
  city?: string;
  mobile?: string;
  rep?: string;
  stage: number;
  followUp?: string;
  note?: string;
  createdAt?: string;
};

export type Payment = {
  id: string;
  orderId?: string | null;
  customerId?: string | null;
  amount?: number;
  status: string;
  method?: string | null;
  loggedAt?: string;
};

export type Escalation = { id: string; name: string; role: 'asm' | 'head' | string; phone: string };

// A rep's own record. commissionPct and monthlyTarget are what the office set
// for them, so nothing here has to invent a rate or a target.
export type Rep = {
  id: string;
  repId: string;
  name: string;
  region?: string | null;
  city?: string | null;
  phone?: string; // phoneNote on the user record
  commissionPct?: number;
  monthlyTarget?: number;
  active?: boolean;
};

export type Cart = {
  id: string;
  customerId?: string | null;
  status: string; // active | abandoned | quote-requested
  totals?: { grand?: number };
  updatedAt?: string;
};

export type Franchise = { id: string; name?: string; city?: string; status: string; createdAt?: string };

// The office's broadcast to the field — shown once a day, and again whenever
// the office re-pushes it.
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

// Field names follow serialiseVisit() on the server: `checkIn`/`checkOut`, not
// the column names checkInAt/checkOutAt. Reading the wrong pair makes every
// visit look open, so keep these exactly as the API sends them.
export type Visit = {
  id: string;
  rep?: string;
  repName?: string;
  custId?: string;
  custName?: string;
  custCity?: string;
  custMobile?: string;
  day?: string;
  checkIn?: string;
  checkOut?: string | null;
  inLat?: number | null;
  inLng?: number | null;
  inAcc?: number | null;
  inSource?: string | null;
};

export type Attendance = { id: string; repId: string; date: string; status: string; time?: string | null; hasPhoto?: boolean };

export type NewPayment = {
  orderId?: string;
  custId?: string;
  custName?: string;
  mode: 'upi' | 'card' | 'netbanking' | 'neft' | 'qr' | 'cash' | 'cheque';
  amount: number;
  utr?: string;
};

/**
 * Slab-based commission, copied from CRM_COMMISSION_SLABS in the web console.
 * Marginal — each band pays its own rate on the sales that fall inside it, so
 * the blended rate rises with the month rather than jumping.
 */
export const COMMISSION_SLABS: { from: number; to: number | null; pct: number }[] = [
  { from: 0, to: 500000, pct: 2 },
  { from: 500001, to: 1000000, pct: 3 },
  { from: 1000001, to: null, pct: 4 },
];

export function slabCommission(sales: number) {
  let total = 0;
  const breakdown = COMMISSION_SLABS.map((s) => {
    const lower = s.from === 0 ? 0 : s.from - 1;
    const upper = s.to == null ? Infinity : s.to;
    const amount = Math.max(0, Math.min(sales, upper) - lower);
    const comm = Math.round((amount * s.pct) / 100);
    total += comm;
    return { ...s, amount, comm };
  });
  return { total, effectiveRate: sales > 0 ? total / sales : 0, breakdown };
}

/**
 * Every dashboard headline, computed by the server from real queries rather
 * than counted off a page of rows. The web console reads the same endpoint,
 * which is why the two agree.
 */
export type Summary = {
  orders: number;
  pendingOrders: number;
  ordersMonth: number;
  mtdSales: number;
  customers: number;
  activeCustomers: number;
  reps: number;
  openRfq: number;
  openCarts: number;
  openCartsValue: number;
  revenue: number;
};

// The six stages a relationship moves through, mirroring CRM_STAGES in the web
// CRM so a rep reads the same words on both.
export const STAGES: { id: number; label: string; short: string }[] = [
  { id: 1, label: 'Call to fix meeting', short: 'Call' },
  { id: 2, label: 'Met & added customer', short: 'Met' },
  { id: 3, label: 'Sample order given', short: 'Sample' },
  { id: 4, label: 'Feedback meeting', short: 'Feedback' },
  { id: 5, label: 'Satisfied — will order', short: 'Will order' },
  { id: 6, label: 'Active buyer', short: 'Active' },
];

export type NewCustomer = {
  name: string;
  contact?: string;
  phone: string;
  city?: string;
  pincode?: string;
  gstin?: string;
  shipAddress?: string;
  notes?: string;
  terms?: 'cash' | '15' | '30' | '45' | '60';
  // Field capture from the rep's phone: a photo of the shop and where it is.
  shopPhoto?: string; // data URL; the server caps it at 3 MB
  geo?: string;
};

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

  // The server scopes /leads to the caller's own repId, so a rep downloads
  // their own book and nobody else's.
  leads: () => request<Lead[]>('/leads'),
  payments: () => request<Payment[]>('/payments'),
  escalation: () => request<Escalation[]>('/reps/escalation'),

  // Rep/office/admin may all add a customer; a rep's new account is mapped to
  // them automatically by the server.
  addCustomer: (c: NewCustomer) =>
    request<Customer>('/customers', { method: 'POST', body: JSON.stringify(c), timeoutMs: 60000 }),

  // Claim an unowned account onto your book. The server refuses if it already
  // belongs to another rep — a rep can only take what nobody holds.
  claimCustomer: (id: string, repId: string) =>
    request<Customer>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify({ repId }) }),

  // Move a lead along the pipeline / set the next follow-up date.
  updateLead: (id: string, patch: Partial<Lead>) =>
    request<Lead>(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),

  // The office dashboard's sources, the same ones the web console reads.
  summary: () => request<Summary>('/reports/summary'),
  reps: () => request<Rep[]>('/reps'),
  carts: () => request<Cart[]>('/carts'),
  franchise: () => request<Franchise[]>('/franchise'),

  // --- Attendance -----------------------------------------------------------
  // A rep marks the day with a selfie, exactly as on the desktop: no photo, no
  // attendance. The server upserts on (repId, date), so marking twice is safe.
  attendance: (month?: string) =>
    request<Attendance[]>(`/reps/attendance${month ? `?month=${month}` : ''}`),
  markAttendance: (photo: string, status: 'present' | 'leave' = 'present') =>
    request<Attendance>('/reps/attendance', {
      method: 'POST',
      body: JSON.stringify({
        status,
        photo,
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toTimeString().slice(0, 5),
      }),
      // A photo is a big body over a phone connection — give it longer.
      timeoutMs: 60000,
    }),

  // --- Field visits ---------------------------------------------------------
  visits: (day?: string) => request<Visit[]>(`/reps/visits${day ? `?day=${day}` : ''}`),
  visitIn: (v: { custId: string; custName?: string; custCity?: string; custMobile?: string; lat?: number; lng?: number; acc?: number }) =>
    request<Visit>('/reps/visits', { method: 'POST', body: JSON.stringify({ ...v, source: 'crm-app' }) }),
  visitOut: (id: string, geo?: { lat?: number; lng?: number }) =>
    request<Visit>(`/reps/visits/${id}/checkout`, { method: 'PUT', body: JSON.stringify(geo || {}) }),

  // --- Money ----------------------------------------------------------------
  logPayment: (p: NewPayment) =>
    request<any>('/payments', { method: 'POST', body: JSON.stringify({ ...p, source: 'crm-app' }) }),

  // The office's broadcast to the field.
  announcement: () => request<Announcement>('/announcements'),
  saveAnnouncement: (a: Partial<Announcement>) =>
    request<Announcement>('/announcements', { method: 'PUT', body: JSON.stringify(a), timeoutMs: 60000 }),

  // --- Admin actions --------------------------------------------------------
  // Verify or reject a payment a rep logged. Confirming marks the order paid,
  // which is what stops the customer's reminders.
  setPaymentStatus: (id: string, status: 'confirmed' | 'failed', reason?: string) =>
    request<Payment>(`/payments/${id}`, { method: 'PUT', body: JSON.stringify({ status, reason }) }),

  // Route a lead to a rep, or drop it so nobody re-prospects it.
  assignLead: (id: string, rep: string) =>
    request<Lead>(`/leads/${id}`, { method: 'PUT', body: JSON.stringify({ rep, assigned: true }) }),
  deleteLead: (id: string) => request<{ ok: boolean }>(`/leads/${id}`, { method: 'DELETE' }),

  // Move a franchise enquiry along its pipeline.
  setFranchiseStatus: (id: string, status: 'new' | 'contacted' | 'closed') =>
    request<Franchise>(`/franchise/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // The office sets a rep's commission rate and monthly target.
  saveRep: (repId: string, patch: { commissionPct?: number; monthlyTarget?: number; region?: string }) =>
    request<Rep>(`/reps/${repId}`, { method: 'PUT', body: JSON.stringify(patch) }),

  // Move an order along the pipeline, or attach the courier once it ships.
  updateOrder: (id: string, patch: { status?: OrderStatus; courier?: string; track?: string }) =>
    request<Order>(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),

  // Mira. `page` tells her which screen the question came from, so "what should
  // I do today" is answered about this rep's desk rather than in general.
  ask: (message: string, page: string, sessionId: string) =>
    request<{ reply?: string; message?: string }>('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ sessionId, message, app: 'crm', page }),
      timeoutMs: 60000,
    }),
};
