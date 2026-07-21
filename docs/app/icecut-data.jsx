// icecut-data.jsx — Ice Cut (Crushed Ice Cutting) CZ.
// Price = f(shape-group, size, colour-tier). Sold by packet, priced per piece.
// Colour tiers (price columns): White · Normal · Special 1 · Special 2 · Paribas.

const ICECUT_TIERS = [
  { id: 'white',    name: 'White',     col: 'w',  hex: '#F2EFE8', eg: 'White D (G-40)' },
  { id: 'normal',   name: 'Normal',    col: 'n',  hex: '#E2B43A', eg: 'Champagne, Yellows, Pinks…' },
  { id: 'special1', name: 'Special 1', col: 's1', hex: '#C0432E', eg: 'Reds, Oranges, Violets…' },
  { id: 'special2', name: 'Special 2', col: 's2', hex: '#2A6FDB', eg: 'Greens, Blues, Sapphire…' },
  { id: 'paribas',  name: 'Paribas',   col: 'pb', hex: '#1FA89A', eg: 'Paraiba & Mint tones' },
];

// Shape → price group. g1 = Oval/Pear/Oblong-Cushion/Radiant; g2 = Square/Round/Cushion; g3 = Marquise.
const ICECUT_SHAPE_GROUP = {
  oval: 'g1', pear: 'g1', oblong: 'g1', radiant: 'g1',
  square: 'g2', round: 'g2', cushion: 'g2',
  marquise: 'g3',
};

// Rows: { s, w, n, s1, s2, pb } — ₹ per piece.
const ICECUT_PRICES = {
  g1: [
    { s: '4×3 mm', w: 21, n: 24, s1: 28, s2: 45, pb: 113 },
    { s: '5×3 mm', w: 23, n: 25, s1: 30, s2: 50, pb: 125 },
    { s: '6×4 mm', w: 29, n: 33, s1: 40, s2: 68, pb: 175 },
    { s: '7×5 mm', w: 35, n: 40, s1: 55, s2: 100, pb: 250 },
    { s: '8×6 mm', w: 43, n: 50, s1: 70, s2: 138, pb: 350 },
    { s: '9×7 mm', w: 55, n: 65, s1: 88, s2: 188, pb: 450 },
    { s: '10×8 mm', w: 70, n: 85, s1: 113, s2: 238, pb: 575 },
    { s: '11×9 mm', w: 105, n: 125, s1: 150, s2: 350, pb: 750 },
    { s: '12×10 mm', w: 150, n: 175, s1: 213, s2: 475, pb: 1025 },
    { s: '14×10 mm', w: 213, n: 250, s1: 300, s2: 650, pb: 1325 },
  ],
  g2: [
    { s: '3×3 mm', w: 20, n: 23, s1: 25, s2: 40, pb: 95 },
    { s: '4×4 mm', w: 23, n: 25, s1: 30, s2: 50, pb: 125 },
    { s: '5×5 mm', w: 29, n: 33, s1: 40, s2: 68, pb: 175 },
    { s: '6×6 mm', w: 35, n: 40, s1: 55, s2: 100, pb: 250 },
    { s: '7×7 mm', w: 43, n: 50, s1: 70, s2: 138, pb: 350 },
    { s: '8×8 mm', w: 55, n: 65, s1: 88, s2: 188, pb: 450 },
    { s: '9×9 mm', w: 70, n: 85, s1: 113, s2: 238, pb: 575 },
    { s: '10×10 mm', w: 105, n: 125, s1: 150, s2: 350, pb: 750 },
    { s: '11×11 mm', w: 150, n: 175, s1: 213, s2: 475, pb: 1025 },
    { s: '12×12 mm', w: 213, n: 250, s1: 300, s2: 650, pb: 1325 },
  ],
  g3: [
    { s: '3×1.5 mm', w: 20, n: 23, s1: 25, s2: 40, pb: 95 },
    { s: '4×2 mm', w: 21, n: 24, s1: 28, s2: 45, pb: 108 },
    { s: '5×2.5 mm', w: 23, n: 25, s1: 30, s2: 50, pb: 125 },
    { s: '6×3 mm', w: 30, n: 33, s1: 40, s2: 68, pb: 163 },
    { s: '7×3.5 mm', w: 33, n: 38, s1: 50, s2: 88, pb: 225 },
    { s: '8×4 mm', w: 35, n: 45, s1: 63, s2: 113, pb: 275 },
    { s: '10×5 mm', w: 55, n: 65, s1: 88, s2: 188, pb: 425 },
    { s: '12×6 mm', w: 90, n: 113, s1: 138, s2: 275, pb: 650 },
  ],
};

const icecutRows = (shape) => ICECUT_PRICES[ICECUT_SHAPE_GROUP[shape] || 'g2'] || [];
const TIER_COL = { white: 'w', normal: 'n', special1: 's1', special2: 's2', paribas: 'pb' };

function IceCutOrderPad({ grade, color, shape, category, qtyBySize, setQtyBySize, onBack, onChangeColor, addToCart, setRoute }) {
  const fmt = (n) => (window.formatINR ? window.formatINR(n) : '₹' + Number(n).toLocaleString('en-IN'));
  const shapeMeta = (window.findShape && window.findShape(shape)) || { name: shape };
  const col = TIER_COL[color.id] || 'w';
  const hex = color.hex || '#EFE9DD';
  const tint = window.lightenTone ? window.lightenTone(hex) : 'var(--paper-2)';
  // Same resolver the shape cards use — see laser-data.jsx.
  const heroImg = window.productImageFor ? window.productImageFor(category.id, color.id, shape) : null;
  const rows = icecutRows(shape);
  const ppp = (r) => (r && r.ppp ? r.ppp : 1);

  const setQty = (size, v) => setQtyBySize((p) => ({ ...p, [size]: Math.max(0, parseInt(v, 10) || 0) }));
  const bump = (size, d) => setQtyBySize((p) => ({ ...p, [size]: Math.max(0, (p[size] || 0) + d) }));

  const lines = Object.entries(qtyBySize).filter(([, q]) => q > 0);
  const rowBySize = (size) => rows.find((r) => r.s === size);
  const totalPkts = lines.reduce((s, [, q]) => s + q, 0);
  const totalAmt = lines.reduce((s, [size, q]) => {
    const r = rowBySize(size); return s + q * ppp(r) * ((r && r[col]) || 0);
  }, 0);

  const onAddAll = () => {
    if (lines.length === 0) return;
    lines.forEach(([size, q]) => {
      const r = rowBySize(size); const price = (r && r[col]) || 0; const pieces = q * ppp(r);
      addToCart({
        pid: 'icecut-' + color.id + '-' + shape + '-' + size.replace(/\s/g, ''),
        name: color.name + ' Ice Cut ' + shapeMeta.name,
        // See laser-data.jsx — later screens cannot resolve the image alone.
        imageUrl: heroImg || null,
        shape, size, quality: 'Ice Cut · ' + color.name,
        color: color.name, colorHex: hex,
        // ct = packets actually selected; perCtPrice = price per packet, so
        // the cart's ct * perCtPrice recomputation stays correct on edit.
        qty: pieces, ct: q, unitMode: 'pkt', pcsPerUnit: ppp(r),
        unitPrice: price, perCtPrice: price * ppp(r), certFee: 0,
        lineTotal: pieces * price, tone: 'def-white', toneHex: hex,
      });
    });
    setQtyBySize({});
  };

  return (
    <div className="browse-step">
      <div className="pad-header">
        {/* See laser-data.jsx: this slot showed only the drawn icon, never the
            uploaded image, so the picture appeared to vanish after choosing a
            shape. */}
        <div className="pad-header-art" style={{ background: tint, width: 132, height: 132, flex: '0 0 132px',
          overflow: 'hidden', padding: heroImg ? 0 : undefined }}>
          {heroImg
            ? <img src={heroImg} alt={`${color.name} ${shape}`} loading="lazy"
                   onError={(e) => { e.currentTarget.style.display = 'none'; }}
                   style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : window.ShapeIcon ? <window.ShapeIcon shape={shape} size={48} color={hex} /> : null}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="crumb">Ice Cut · {color.name} · {shapeMeta.name}</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 32,
            letterSpacing: '-0.02em', margin: '4px 0 6px', lineHeight: 1.05 }}>
            {color.name} Ice Cut {shapeMeta.name}
          </h1>
          <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: 14 }}>
            Crushed ice-cut CZ · ordered by the packet · priced per piece · pieces-per-packet set on bulk upload.
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          {window.IconArrowLeft ? <window.IconArrowLeft size={14} /> : null} Change shape
        </button>
      </div>

      <div className="size-pad pkt-pad" style={{ marginTop: 16 }}>
        <div className="size-pad-head" style={{ gridTemplateColumns: '1fr 110px 100px 1fr 130px' }}>
          <span>Size</span>
          <span style={{ textAlign: 'center' }}>Pcs / packet</span>
          <span style={{ textAlign: 'right' }}>₹ / pc</span>
          <span style={{ textAlign: 'center' }}>Packets</span>
          <span style={{ textAlign: 'right' }}>Line total</span>
        </div>
        {rows.map((r) => {
          const price = r[col];
          const q = qtyBySize[r.s] || 0;
          const pieces = q * ppp(r);
          return (
            <div key={r.s} className={`size-pad-row ${q > 0 ? 'filled' : ''}`}
              style={{ gridTemplateColumns: '1fr 110px 100px 1fr 130px' }}>
              <div className="size-pad-size"><div className="size-pad-mm" style={{ fontSize: 15 }}>{r.s}</div></div>
              <div className="size-pad-pcs">{r.ppp ? r.ppp : '—'}</div>
              <div className="size-pad-price">{fmt(price)}</div>
              <div className="size-pad-input-wrap">
                <div className="size-pad-stepper">
                  <button onClick={() => bump(r.s, -1)} disabled={q <= 0} aria-label="decrease">
                    {window.IconMinus ? <window.IconMinus size={12} /> : '−'}
                  </button>
                  <input type="number" value={q || ''} placeholder="0" min={0}
                    onChange={(e) => setQty(r.s, e.target.value)} onFocus={(e) => e.target.select()} />
                  <button onClick={() => bump(r.s, 1)} aria-label="increase">
                    {window.IconPlus ? <window.IconPlus size={12} /> : '+'}
                  </button>
                </div>
                {q > 0 && r.ppp && <div className="size-pad-pcs-note">= {pieces.toLocaleString('en-IN')} pcs</div>}
              </div>
              <div className="size-pad-total">
                {q > 0 ? fmt(pieces * price) : <span style={{ color: 'var(--ink-4)' }}>—</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="order-summary">
        <div className="order-summary-stats">
          <div><div className="stat-label">Sizes selected</div><div className="stat-value">{lines.length}</div></div>
          <div><div className="stat-label">Total packets</div><div className="stat-value">{totalPkts.toLocaleString('en-IN')}</div></div>
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
  ICECUT_TIERS, ICECUT_SHAPE_GROUP, ICECUT_PRICES, icecutRows, IceCutOrderPad,
});
