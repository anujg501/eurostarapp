import { config } from '../config';

export interface LineInput {
  unitPrice: number;
  priceOverride?: number | null;
  qty: number;
}

export interface Totals {
  subtotal: number;
  tax: number; // GST 3% (0 for export)
  shipping: number; // courier
  insurance: number;
  grand: number;
}

// Effective price for a line: an office override wins over the list price.
export function effectiveUnitPrice(line: LineInput): number {
  return line.priceOverride != null ? line.priceOverride : line.unitPrice;
}

export function lineTotal(line: LineInput): number {
  return effectiveUnitPrice(line) * line.qty;
}

/**
 * Compute order totals. Mirrors the frontend `cartTotals` exactly
 * (screen-checkout.jsx / screen-orders.jsx):
 *   subtotal  = Σ lineTotal
 *   tax       = isExport ? 0 : round(subtotal * 0.03)   // GST 3%
 *   shipping  = subtotal > 1000 ? 0 : 300               // courier
 *   insurance = 0
 *   grand     = subtotal + tax + shipping + insurance
 */
// `rules` comes from getStoreRules() so the Admin Settings screen actually
// applies. Defaults to config.rules for callers that have none to hand.
export function computeTotals(
  lines: LineInput[],
  isExport = false,
  rules: typeof config.rules = config.rules
): Totals {
  const subtotal = lines.reduce((sum, l) => sum + lineTotal(l), 0);
  const tax = isExport ? 0 : Math.round(subtotal * rules.gstRate);
  const shipping = subtotal > rules.courierFreeOver ? 0 : rules.courierFlat;
  const insurance = 0;
  const grand = subtotal + tax + shipping + insurance;
  return { subtotal, tax, shipping, insurance, grand };
}

// A city string counts as export when it mentions Dubai (matches the client's
// `location.includes('dubai')` heuristic). Callers may also pass isExport directly.
export function isExportCity(city?: string | null): boolean {
  return !!city && city.toLowerCase().includes('dubai');
}

/**
 * Dispatch date = today + N calendar days (domestic 3, export 5), matching the
 * client (`today + (isExport ? 5 : 3)`). Returns both a Date and the short label
 * the client shows, e.g. "Wed, 17 Jul".
 */
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function dispatchInfo(
  isExport = false,
  from: Date = new Date(),
  rules: typeof config.rules = config.rules
): { date: Date; label: string } {
  const days = isExport ? rules.exportDispatchDays : rules.dispatchWorkingDays;
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  // Format like the client: "Wed, 17 Jul".
  const label = `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return { date, label };
}
