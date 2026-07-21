import { Router } from 'express';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import { asyncHandler, failValidation } from '../util/http';

export const proformaRouter = Router();

// Brand colour (matches the on-screen proforma / storefront).
const GREEN = '#0E5C4A';
const INK = '#15130f';
const MUTED = '#6a6253';
const HAIR = '#c9c0ad';
const ROW = '#ece6d8';

// Rupee amounts render as "Rs. 3,811" — the built-in PDF fonts have no ₹ glyph,
// so we use the ASCII-safe "Rs." prefix (standard on Indian invoices) with the
// same en-IN digit grouping the app uses elsewhere.
const money = (n: number) => 'Rs. ' + Math.round(n).toLocaleString('en-IN');

const rowSchema = z.object({
  product: z.string().max(200).default(''),
  shape: z.string().max(80).default(''),
  size: z.string().max(80).default(''),
  qty: z.number().nonnegative().default(0),
  rate: z.number().nonnegative().default(0),
  amount: z.number().nonnegative().default(0),
});

const bodySchema = z.object({
  proformaNo: z.string().max(60).default('PI-EUR'),
  date: z.string().max(40).default(''),
  billTo: z
    .object({
      company: z.string().max(160).default(''),
      account: z.string().max(60).default(''),
      location: z.string().max(160).default(''),
      gst: z.string().max(40).default(''),
    })
    .default({}),
  rows: z.array(rowSchema).min(1).max(200),
  totals: z.object({
    subtotal: z.number().nonnegative(),
    tax: z.number().nonnegative().default(0),
    shipping: z.number().nonnegative().default(0),
    grand: z.number().nonnegative(),
  }),
  terms: z.string().max(120).default('Cash'),
});

// POST /proforma — render the cart as a real PDF proforma invoice.
// Public (no auth): it only renders the data the client already holds; it reads
// nothing from the database. Kept in lock-step with the on-screen proforma in
// docs/app/screen-orders.jsx (proformaHTML).
proformaRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const { proformaNo, date, billTo, rows, totals, terms } = parsed.data;

    const doc = new PDFDocument({ size: 'A4', margin: 51 }); // 51pt ≈ 18mm
    const filename = `Proforma-${proformaNo}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    doc.pipe(res);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const width = right - left;

    // ---- Header ------------------------------------------------------------
    doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(24).text('eurostar', left, 48, { continued: false });
    doc.fillColor(MUTED).font('Helvetica').fontSize(9).text('GEMSTONES · Estd 1980', left, 76);

    const headTop = 50;
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(17).text('PROFORMA INVOICE', left, headTop, { width, align: 'right' });
    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(10)
      .text(`${proformaNo}${date ? '   ' + date : ''}`, left, headTop + 24, { width, align: 'right' });

    doc.moveTo(left, 96).lineTo(right, 96).lineWidth(2).strokeColor(GREEN).stroke();

    // ---- Bill to -----------------------------------------------------------
    let y = 112;
    const billLine1 = [billTo.company, billTo.account].filter(Boolean).join(' · ');
    const billLine2 = [billTo.location, billTo.gst ? 'GSTIN ' + billTo.gst : ''].filter(Boolean).join(' · ');
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(11).text('Bill to: ', left, y, { continued: true });
    doc.font('Helvetica').text(billLine1 || '—');
    if (billLine2) {
      doc.fillColor(MUTED).font('Helvetica').fontSize(10).text(billLine2, left, doc.y + 1);
    }

    // ---- Line items table --------------------------------------------------
    y = doc.y + 16;
    const cols = [
      { key: 'product', label: 'PRODUCT', x: left, w: width * 0.34, align: 'left' as const },
      { key: 'shape', label: 'SHAPE', x: left + width * 0.34, w: width * 0.14, align: 'left' as const },
      { key: 'size', label: 'SIZE', x: left + width * 0.48, w: width * 0.14, align: 'left' as const },
      { key: 'qty', label: 'QTY', x: left + width * 0.62, w: width * 0.12, align: 'right' as const },
      { key: 'rate', label: 'RATE', x: left + width * 0.74, w: width * 0.12, align: 'right' as const },
      { key: 'amount', label: 'AMOUNT', x: left + width * 0.86, w: width * 0.14, align: 'right' as const },
    ];

    doc.font('Helvetica-Bold').fontSize(8).fillColor(MUTED);
    for (const c of cols) doc.text(c.label, c.x, y, { width: c.w, align: c.align });
    y += 12;
    doc.moveTo(left, y).lineTo(right, y).lineWidth(1).strokeColor(HAIR).stroke();
    y += 6;

    doc.font('Helvetica').fontSize(10).fillColor(INK);
    for (const r of rows) {
      const cells: Record<string, string> = {
        product: r.product || '',
        shape: r.shape || '',
        size: r.size || '',
        qty: (r.qty || 0).toLocaleString('en-IN'),
        rate: money(r.rate || 0),
        amount: money(r.amount || 0),
      };
      // Height driven by the (wrapping) product cell.
      const h = doc.heightOfString(cells.product, { width: cols[0].w });
      if (y + h > doc.page.height - doc.page.margins.bottom - 120) {
        doc.addPage();
        y = doc.page.margins.top;
      }
      for (const c of cols) doc.text(cells[c.key], c.x, y, { width: c.w, align: c.align });
      y += Math.max(h, 14) + 6;
      doc.moveTo(left, y - 4).lineTo(right, y - 4).lineWidth(0.5).strokeColor(ROW).stroke();
    }

    // ---- Totals (right-aligned block) -------------------------------------
    y += 10;
    const tW = 240;
    const tX = right - tW;
    const totalRow = (label: string, value: string, opts: { bold?: boolean; big?: boolean } = {}) => {
      const size = opts.big ? 14 : 11;
      doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(size).fillColor(opts.big ? GREEN : INK);
      doc.text(label, tX, y, { width: tW * 0.55, align: 'left' });
      doc.text(value, tX + tW * 0.55, y, { width: tW * 0.45, align: 'right' });
      y += size + 8;
    };
    totalRow('Subtotal', money(totals.subtotal));
    if (totals.tax) totalRow('GST 3%', money(totals.tax));
    totalRow('Courier', totals.shipping === 0 ? 'Free' : money(totals.shipping));
    doc.moveTo(tX, y - 2).lineTo(right, y - 2).lineWidth(2).strokeColor(GREEN).stroke();
    y += 6;
    totalRow('Total payable', money(totals.grand), { bold: true, big: true });

    // ---- Terms footer ------------------------------------------------------
    y += 18;
    doc.moveTo(left, y).lineTo(right, y).lineWidth(0.5).strokeColor(ROW).stroke();
    y += 10;
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(MUTED)
      .text(
        `Payment terms: ${terms}. This is a proforma invoice, not a tax invoice. Prices valid 7 days. ` +
          `Dispatch 2–3 business days after confirmation.`,
        left,
        y,
        { width }
      );
    doc.text(
      'Eurostar Technologies Inc. · Authorised Distributor for Asia-Pacific: Ganesh Jewellery I Pvt Ltd · Mumbai, Jaipur',
      left,
      doc.y + 4,
      { width }
    );

    doc.end();
  })
);
