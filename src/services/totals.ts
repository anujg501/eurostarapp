import { config } from '../config';

export interface LineInput {
  unitPrice: number;
  priceOverride?: number | null;
  qty: number;
}

export interface Totals {
  subtotal: number;
  gst: number;
  courier: number;
  grandTotal: number;
}

// Effective price for a line: an office override wins over the list price.
export function effectiveUnitPrice(line: LineInput): number {
  return line.priceOverride != null ? line.priceOverride : line.unitPrice;
}

export function lineTotal(line: LineInput): number {
  return effectiveUnitPrice(line) * line.qty;
}

/**
 * Compute order totals using the handoff rules:
 *  - GST 3%
 *  - courier free over ₹1,000, otherwise ₹300
 */
export function computeTotals(lines: LineInput[]): Totals {
  const subtotal = lines.reduce((sum, l) => sum + lineTotal(l), 0);
  const gst = Math.round(subtotal * config.rules.gstRate);
  const courier = subtotal > config.rules.courierFreeOver ? 0 : config.rules.courierFlat;
  const grandTotal = subtotal + gst + courier;
  return { subtotal, gst, courier, grandTotal };
}

/**
 * Dispatch date = N working days (Mon–Fri) from a start date.
 * Default N = 3 (from the README).
 */
export function dispatchDate(from: Date = new Date(), workingDays = config.rules.dispatchWorkingDays): Date {
  const d = new Date(from);
  let added = 0;
  while (added < workingDays) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay(); // 0 = Sun, 6 = Sat
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}
