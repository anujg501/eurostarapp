// labdiamond-data.jsx — Lab Grown Diamonds (CVD · EF · VVS).
// Round is priced per CARAT by mm-size (with its sieve + pcs/ct). Every other
// shape is "price on request" for now. Customer orders Round by the carat; the
// sheet's pcs/ct turns carats into an approximate piece count.

// ROUND price table. Each row: display mm size `s`, `sieve` ('' = none),
// pieces per carat `pcs`, ₹ per carat `rate`, and `cert` = 1 when the stone is
// 1 ct+ and an optional IGI certificate (+₹2,000/pc) applies.
// Source: customer's Lab Grown Diamonds sheet (Kiran Jewellers design, 07-10-26).
const LABDIAMOND_ROUND = [
  { s: '0.90-1.00', sieve: '000-00', pcs: 250, rate: 12200 },
  { s: '1.00-1.10', sieve: '00-0',   pcs: 200, rate: 12200 },
  { s: '1.10-1.15', sieve: '0-1',    pcs: 167, rate: 12200 },
  { s: '1.15-1.20', sieve: '1-1.5',  pcs: 143, rate: 12200 },
  { s: '1.20-1.25', sieve: '1.5-2',  pcs: 125, rate: 12200 },
  { s: '1.25-1.30', sieve: '2-2.50', pcs: 111, rate: 7500 },
  { s: '1.30-1.35', sieve: '2.50-3', pcs: 100, rate: 7500 },
  { s: '1.35-1.40', sieve: '3-3.5',  pcs: 91,  rate: 7500 },
  { s: '1.40-1.45', sieve: '3.5-4',  pcs: 83,  rate: 7500 },
  { s: '1.45-1.50', sieve: '4-4.5',  pcs: 77,  rate: 7500 },
  { s: '1.50-1.55', sieve: '4.5-5',  pcs: 71,  rate: 7500 },
  { s: '1.55-1.60', sieve: '5-5.50', pcs: 63,  rate: 7500 },
  { s: '1.60-1.70', sieve: '5.50-6', pcs: 56,  rate: 7500 },
  { s: '1.70-1.80', sieve: '6-6.5',  pcs: 48,  rate: 7500 },
  { s: '1.80-1.90', sieve: '6.5-7',  pcs: 40,  rate: 6500 },
  { s: '1.90-2.00', sieve: '7-7.50', pcs: 34,  rate: 6500 },
  { s: '2.00-2.10', sieve: '7.50-8', pcs: 29,  rate: 6500 },
  { s: '2.10-2.20', sieve: '8-8.5',  pcs: 26,  rate: 6500 },
  { s: '2.20-2.30', sieve: '8.5-9',  pcs: 23,  rate: 6500 },
  { s: '2.30-2.40', sieve: '9-9.5',  pcs: 19,  rate: 6500 },
  { s: '2.40-2.50', sieve: '9.5-10', pcs: 17,  rate: 6500 },
  { s: '2.50-2.60', sieve: '10-10.5',pcs: 14,  rate: 6500 },
  { s: '2.60-2.70', sieve: '10.5-11',pcs: 14,  rate: 6500 },
  { s: '2.70-2.80', sieve: '11-11.5',pcs: 13,  rate: 6500 },
  { s: '2.80-2.90', sieve: '11.50-12',pcs: 12, rate: 6500 },
  { s: '2.90-3.00', sieve: '12-12.5',pcs: 11,  rate: 6500 },
  { s: '3.00-3.10', sieve: '12.50-13',pcs: 9,  rate: 6500 },
  { s: '3.10-3.20', sieve: '13-13.5',pcs: 9,   rate: 6500 },
  { s: '3.20-3.30', sieve: '13.5-14',pcs: 8,   rate: 6500 },
  { s: '3.30-3.40', sieve: '14-14.5',pcs: 7,   rate: 6500 },
  { s: '3.40-3.50', sieve: '14.5-15',pcs: 7,   rate: 6500 },
  { s: '3.50-3.60', sieve: '15-15.5',pcs: 6,   rate: 6500 },
  { s: '3.60-3.70', sieve: '15.5-16',pcs: 6,   rate: 6500 },
  { s: '3.60-3.80', sieve: '',       pcs: 5,   rate: 6500 },
  { s: '3.80-4.20', sieve: '',       pcs: 4,   rate: 7500 },
  { s: '4.20-4.40', sieve: '',       pcs: 3,   rate: 7500 },
  { s: '4.60-5.00', sieve: '',       pcs: 3,   rate: 7500 },
  { s: '5.00-5.30', sieve: '',       pcs: 2,   rate: 7500 },
  { s: '5.30-5.60', sieve: '',       pcs: 2,   rate: 7500 },
  { s: '5.60-5.90', sieve: '',       pcs: 1,   rate: 7500 },
  { s: '5.90-6.10', sieve: '',       pcs: 1,   rate: 7500 },
  { s: '6.10-6.30', sieve: '',       pcs: 1,   rate: 7500 },
  { s: '6.40-6.50', sieve: '',       pcs: 1,   rate: 8500, cert: 1 },
  { s: '1.25 ct',   sieve: '',       pcs: 1,   rate: 8500, cert: 1 },
  { s: '1.50 ct',   sieve: '',       pcs: 1,   rate: 9000, cert: 1 },
  { s: '2.00 ct',   sieve: '',       pcs: 1,   rate: 9500, cert: 1 },
];

const labdiamondRoundRows = () => LABDIAMOND_ROUND;
// Grid: Size | Sieve | Pcs/ct | Rate | Order qty | Line total
const LABDIAMOND_GRID = '1fr 96px 92px 128px 168px 120px';
const LABDIAMOND_CERT_FEE = 2000; // ₹ per piece, optional IGI certificate on 1 ct+ stones

function LabDiamondOrderPad({ grade, color, shape, category, qtyBySize, setQtyBySize, onBack, onChangeColor, addToCart }) {
  const fmt = (n) => (window.formatINR ? window.formatINR(n) : '₹' + Number(n).toLocaleString('en-IN'));
  const shapeMeta = (window.findShape && window.findShape(shape)) || { name: shape };
  const hex = (color && color.hex) || '#F2EFE8';
  const tint = window.lightenTone ? window.lightenTone(hex) : 'var(--paper-2)';
  const heroImg = window.productImageFor ? window.productImageFor(category.id, color && color.id, shape) : null;

  const headerArt = (
    <div className="pad-header-art" style={{ background: tint, width: 132, height: 132, flex: '0 0 132px',
      overflow: 'hidden', padding: heroImg ? 0 : undefined }}>
      {heroImg
        ? <img src={heroImg} alt={`${color.name} ${shape}`} loading="lazy"
               onError={(e) => { e.currentTarget.style.display = 'none'; }}
               style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : window.ShapeIcon ? <window.ShapeIcon shape={shape} size={48} color={hex} /> : null}
    </div>
  );
  const changeButtons = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
      <button className="btn btn-ghost btn-sm" onClick={onBack}>
        {window.IconArrowLeft ? <window.IconArrowLeft size={14} /> : null} Change shape
      </button>
      {onChangeColor && <button className="btn btn-ghost btn-sm" onClick={onChangeColor}
        style={{ border: 'none', background: 'none', color: 'var(--fg-muted)', padding: '0 4px' }}>Change colour</button>}
    </div>
  );

  // ---- Non-Round shapes: price on request (no pad). ----
  if (shape !== 'round') {
    return (
      <div className="browse-step">
        <div className="pad-header">
          {headerArt}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="crumb">{category.short} · {grade.name} · {color.name} · {shapeMeta.name}</div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 32,
              letterSpacing: '-0.02em', margin: '4px 0 6px', lineHeight: 1.05 }}>
              {color.name} {shapeMeta.name} Lab Grown Diamonds
            </h1>
            <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: 14 }}>CVD · EF colour · VVS clarity · EX cutting.</p>
          </div>
          {changeButtons}
        </div>
        <div style={{ marginTop: 20, padding: '28px 24px', border: '1px solid var(--line, #e6e2d6)',
          borderRadius: 14, background: 'var(--paper-2, #faf8f2)', textAlign: 'center' }}>
          <div style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase',
            color: 'var(--fg-meta, #8a8578)', fontWeight: 700, marginBottom: 8 }}>Price on request</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 22 }}>{shapeMeta.name} lab grown diamonds — available on request</h3>
          <p style={{ margin: '0 auto', maxWidth: 560, color: 'var(--fg-meta, #6b675d)', fontSize: 14.5, lineHeight: 1.6 }}>
            Round is priced online below. For <strong>{shapeMeta.name}</strong> and other fancy shapes, pricing is quoted
            to order. Contact our trade desk with your sizes and quantities and we'll send a quote.
          </p>
          <p style={{ margin: '14px 0 0', fontSize: 15, fontWeight: 600 }}>
            📞 +91 98765 43210 &nbsp;·&nbsp; ✉ info@eurostar.com
          </p>
        </div>
      </div>
    );
  }

  // ---- Round: per-carat size table. ----
  const rows = labdiamondRoundRows();
  const setCt = (size, v) => setQtyBySize((p) => ({ ...p, [size]: Math.max(0, parseInt(v, 10) || 0) }));
  const bump = (size, d) => setQtyBySize((p) => ({ ...p, [size]: Math.max(0, (p[size] || 0) + d) }));

  const rowBySize = (size) => rows.find((r) => r.s === size);
  const lines = Object.entries(qtyBySize).filter(([size, q]) => q > 0 && rowBySize(size));
  const totalPieces = lines.reduce((s, [size, q]) => { const r = rowBySize(size); return s + q * (r.pcs || 1); }, 0);
  const totalAmt = lines.reduce((s, [size, q]) => { const r = rowBySize(size); return s + q * r.rate; }, 0);

  const onAddAll = () => {
    if (lines.length === 0) return;
    lines.forEach(([size, q]) => {
      const r = rowBySize(size); if (!r) return; const pieces = q * (r.pcs || 1);
      addToCart({
        pid: 'labdiamond-white-round-' + size.replace(/\s/g, ''),
        name: color.name + ' Round Lab Grown Diamonds ' + r.s,
        imageUrl: heroImg || null,
        shape: 'round', size: r.s, quality: 'Lab Grown Diamonds · EF VVS',
        color: color.name, colorHex: hex,
        // ct = carats ordered; perCtPrice = ₹/ct, so cart's ct × perCtPrice stays exact.
        qty: pieces, ct: q, unitMode: 'ct', pcsPerUnit: r.pcs || 1,
        unitPrice: r.rate, perCtPrice: r.rate, certFee: 0,
        lineTotal: q * r.rate, tone: 'def-white', toneHex: hex,
      });
    });
    setQtyBySize({});
  };

  return (
    <div className="browse-step">
      <div className="pad-header">
        {headerArt}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="crumb">{category.short} · {grade.name} · {color.name} · {shapeMeta.name}</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 32,
            letterSpacing: '-0.02em', margin: '4px 0 6px', lineHeight: 1.05 }}>
            {color.name} {shapeMeta.name} Lab Grown Diamonds
          </h1>
          <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: 14 }}>
            Enter carat quantities against any size below · MOQ 1 ct per size · ±0.05 mm tolerance ·
            1 ct+ stones: optional IGI certificate ₹2,000 each
          </p>
        </div>
        {changeButtons}
      </div>

      <div className="size-pad" style={{ marginTop: 16 }}>
        <div className="size-pad-head" style={{ gridTemplateColumns: LABDIAMOND_GRID }}>
          <span>Size (mm)</span>
          <span>Sieve</span>
          <span style={{ textAlign: 'right' }}>Pcs / ct</span>
          <span style={{ textAlign: 'right' }}>Rate</span>
          <span style={{ textAlign: 'center' }}>Order qty</span>
          <span style={{ textAlign: 'right' }}>Line total</span>
        </div>
        {rows.map((r) => {
          const q = qtyBySize[r.s] || 0;
          const pieces = q * (r.pcs || 1);
          return (
            <div key={r.s} className={`size-pad-row ${q > 0 ? 'filled' : ''}`}
              style={{ gridTemplateColumns: LABDIAMOND_GRID }}>
              <div className="size-pad-size"><div className="size-pad-mm" style={{ fontSize: 15 }}>{r.s}</div></div>
              <div className="size-pad-pcs" style={{ textAlign: 'left', color: 'var(--fg-muted)' }}>
                {r.sieve || <span style={{ color: 'var(--ink-4)' }}>—</span>}
              </div>
              <div className="size-pad-pcs" style={{ textAlign: 'right' }}>{r.pcs} /ct</div>
              <div className="size-pad-price">{fmt(r.rate)}<span style={{ color: 'var(--fg-muted)', fontSize: 12 }}> /ct</span></div>
              <div className="size-pad-input-wrap">
                <div className="size-pad-stepper">
                  <button onClick={() => bump(r.s, -1)} disabled={q <= 0} aria-label="decrease">
                    {window.IconMinus ? <window.IconMinus size={12} /> : '−'}
                  </button>
                  <input type="number" value={q || ''} placeholder="0" min={0}
                    onChange={(e) => setCt(r.s, e.target.value)} onFocus={(e) => e.target.select()} />
                  <button onClick={() => bump(r.s, 1)} aria-label="increase">
                    {window.IconPlus ? <window.IconPlus size={12} /> : '+'}
                  </button>
                </div>
                <button className="ld-addct" onClick={() => bump(r.s, 1)}>+ Add 1 ct</button>
                {q > 0 && <div className="size-pad-pcs-note">≈ {pieces.toLocaleString('en-IN')} pcs</div>}
                {r.cert && <div className="ld-cert-note">Optional IGI certificate · +₹2,000/pc</div>}
              </div>
              <div className="size-pad-total">
                {q > 0 ? fmt(q * r.rate) : <span style={{ color: 'var(--ink-4)' }}>—</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="order-summary">
        <div className="order-summary-stats">
          <div><div className="stat-label">Sizes selected</div><div className="stat-value">{lines.length}</div></div>
          <div><div className="stat-label">Approx pieces</div><div className="stat-value">{totalPieces.toLocaleString('en-IN')}</div></div>
          <div><div className="stat-label">Order total</div><div className="stat-value money">{fmt(totalAmt)}</div></div>
        </div>
        <button className="btn btn-accent btn-lg" disabled={lines.length === 0} onClick={onAddAll}>
          Add to cart
        </button>
      </div>
    </div>
  );
}

Object.assign(window, {
  LABDIAMOND_ROUND, labdiamondRoundRows, LABDIAMOND_CERT_FEE, LabDiamondOrderPad,
});
