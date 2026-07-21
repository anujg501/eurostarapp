// laser-data.jsx — Eurostar Laser Engraved pricing.
// Round = exact list from the white price list (size · pcs/packet · list ₹/pc).
// Net price after discount. White = tiered by size; Colour = flat 20%.
// Ordered by the packet, priced per piece.

// Per-shape laser price tables. Each row: [size label, pcs per box, list ₹/pc].
// The ₹/pc is the LIST price from the EURO LM white price list; the customer
// pays list × (1 − laserDiscount), the SAME for all 6 colours.
const mk = (rows) => rows.map(([s, pk, price]) => ({ s, mm: parseFloat(s) || 0, pk, price }));

const LASER_TABLES = {
  round: mk([
    ['0.60 mm',1000,4.45],['0.70 mm',1000,2.85],['0.75 mm',1000,2.85],['0.80 mm',1000,2.38],['0.85 mm',1000,2.38],
    ['0.90 mm',1000,2.38],['0.95 mm',1000,2.38],['1.00 mm',1000,2.38],['1.05 mm',1000,2.38],['1.10 mm',1000,2.38],
    ['1.15 mm',1000,2.38],['1.20 mm',1000,2.38],['1.25 mm',1000,2.38],['1.30 mm',1000,2.38],['1.35 mm',1000,2.38],
    ['1.40 mm',1000,2.38],['1.45 mm',1000,2.38],['1.50 mm',1000,2.38],['1.55 mm',1000,2.38],['1.60 mm',1000,2.38],
    ['1.65 mm',1000,2.38],['1.70 mm',1000,2.52],['1.75 mm',1000,2.52],['1.80 mm',1000,2.52],['1.85 mm',1000,2.52],
    ['1.90 mm',1000,2.72],['1.95 mm',1000,2.72],['2.00 mm',1000,2.72],['2.05 mm',1000,2.72],['2.10 mm',500,2.72],
    ['2.15 mm',500,2.72],['2.20 mm',500,2.78],['2.25 mm',500,2.78],['2.30 mm',500,3.00],['2.35 mm',500,3.00],
    ['2.40 mm',500,3.11],['2.50 mm',500,3.89],['2.60 mm',500,4.11],['2.65 mm',200,4.11],['2.70 mm',200,4.89],
    ['2.75 mm',200,4.89],['2.80 mm',200,5.11],['2.85 mm',200,5.11],['2.90 mm',200,5.11],['2.95 mm',200,5.13],
    ['3.00 mm',200,5.13],['3.10 mm',200,6.22],['3.20 mm',140,6.89],['3.25 mm',140,7.33],['3.30 mm',140,7.33],
    ['3.40 mm',140,7.56],['3.50 mm',140,7.78],['3.60 mm',140,8.22],['3.70 mm',140,8.89],['3.75 mm',140,8.89],
    ['3.80 mm',140,9.33],['3.90 mm',80,9.33],['4.00 mm',80,9.33],['4.25 mm',80,11.56],['4.50 mm',80,12.67],
    ['4.75 mm',80,15.11],['5.00 mm',80,16.89],['5.25 mm',60,21.11],['5.50 mm',60,22.89],['5.75 mm',60,24.00],
    ['6.00 mm',60,26.22],['6.25 mm',60,27.78],['6.50 mm',60,28.44],['6.75 mm',35,28.89],['7.00 mm',35,33.33],
    ['7.25 mm',35,40.00],['7.50 mm',35,40.00],['7.75 mm',35,40.00],['8.00 mm',35,44.44],['8.25 mm',15,51.11],
    ['8.50 mm',15,51.11],['8.75 mm',15,57.78],['9.00 mm',15,56.67],['9.50 mm',15,60.00],['10.00 mm',15,73.33],
    ['11.00 mm',15,151.11],['12.00 mm',15,204.44],
  ]),
  marquise: mk([
    ['3×1.5 mm',100,12.60],['3×2 mm',100,14.62],['4×2 mm',100,16.93],['4.5×2.5 mm',100,28.68],['5×2.5 mm',100,23.93],
    ['6×3 mm',70,27.72],['7×3.5 mm',60,42.84],['8×4 mm',60,88.60],['9×4.5 mm',60,79.53],['10×5 mm',15,88.11],
    ['12×6 mm',15,132.31],
  ]),
  oval: mk([
    ['3×2 mm',100,19.71],['3×2.5 mm',100,19.90],['3.5×2.5 mm',100,19.90],['4×2 mm',100,18.90],['4×3 mm',100,19.90],
    ['4.5×3.5 mm',100,30.49],['5×3 mm',80,29.78],['5×4 mm',80,35.28],['6×4 mm',70,39.20],['7×5 mm',40,52.92],
    ['8×5 mm',40,71.52],['8×6 mm',40,89.74],['9×6 mm',15,92.31],['9×7 mm',15,106.72],['10×7 mm',15,126.13],
    ['10×8 mm',15,141.37],['12×8 mm',15,184.34],
  ]),
  pear: mk([
    ['3×2 mm',100,17.92],['3×2.5 mm',100,18.90],['3.5×2.5 mm',100,18.90],['4×2 mm',100,18.90],['4×3 mm',100,18.90],
    ['4.5×3.5 mm',100,27.72],['5×3 mm',80,23.68],['5×4 mm',80,35.28],['6×4 mm',70,38.90],['7×5 mm',40,53.92],
    ['8×5 mm',40,72.62],['8×6 mm',40,83.56],['9×6 mm',15,92.31],['9×7 mm',15,106.72],['10×7 mm',15,126.13],
    ['10×8 mm',15,141.37],['12×8 mm',15,171.06],
  ]),
  square: mk([
    ['1.50 mm',200,9.50],['1.75 mm',200,9.80],['2.00 mm',200,12.60],['2.25 mm',200,14.40],['2.50 mm',200,14.99],
    ['2.75 mm',100,16.88],['3.00 mm',100,18.90],['3.50 mm',140,22.68],['4.00 mm',80,27.72],['4.50 mm',80,34.78],
    ['5.00 mm',60,39.06],['5.50 mm',60,51.66],['6.00 mm',60,56.70],['7.00 mm',35,85.68],['8.00 mm',35,107.10],
    ['8.50 mm',15,141.37],['9.00 mm',15,155.23],['9.50 mm',15,184.34],['10.00 mm',15,198.20],
  ]),
  'invisible-square': mk([
    ['2.00 mm',200,18.02],['3.00 mm',100,27.72],['4.00 mm',80,40.19],['5.00 mm',60,52.81],['6.00 mm',60,79.00],
  ]),
  heart: mk([
    ['2.00 mm',200,17.20],['3.00 mm',100,28.80],['4.00 mm',80,41.40],['5.00 mm',80,63.60],['6.00 mm',60,78.60],
    ['7.00 mm',35,88.36],['8.00 mm',35,99.54],['9.00 mm',15,138.60],['10.00 mm',15,160.02],['11.00 mm',15,224.10],
    ['12.00 mm',15,269.64],
  ]),
  'curved-trillion': mk([
    ['4.00 mm',80,37.42],['5.00 mm',60,49.90],['6.00 mm',60,70.69],['7.00 mm',35,99.79],['8.00 mm',35,123.35],
    ['9.00 mm',15,158.00],['10.00 mm',15,195.43],
  ]),
  cushion: mk([
    ['2.00 mm',100,19.20],['3.00 mm',100,29.60],['4.00 mm',80,40.64],['5×5 mm',60,74.58],['6×6 mm',35,88.05],
    ['7×7 mm',35,88.70],['8×8 mm',35,112.27],['9×9 mm',15,138.60],['10×10 mm',15,181.57],
  ]),
  'oblong-cushion': mk([
    ['5×3 mm',80,30.49],['6×4 mm',70,47.12],['7×5 mm',40,65.14],['8×6 mm',40,91.48],['9×7 mm',15,115.04],
    ['10×8 mm',15,141.37],
  ]),
  asscher: mk([
    ['3.00 mm',100,27.72],['3.50 mm',140,31.88],['4.00 mm',80,37.42],['5.00 mm',60,49.90],['6.00 mm',35,65.14],
    ['7.00 mm',35,108.11],['8.00 mm',35,151.07],['9.00 mm',15,180.18],['10.00 mm',15,237.01],
  ]),
  radiant: mk([
    ['5×3 mm',80,29.11],['6×4 mm',70,45.74],['7×5 mm',40,79.00],['8×6 mm',40,105.34],['9×7 mm',15,131.67],
    ['10×8 mm',15,163.55],
  ]),
  'baguette-prince': mk([
    ['3×2 mm',200,15.12],['3.5×2 mm',200,18.85],['3.75×2 mm',200,18.85],['4×2 mm',100,17.64],['5×2.5 mm',100,22.68],
    ['6×3 mm',70,34.48],['7×3.5 mm',60,42.44],['8×4 mm',60,43.10],
  ]),
  'baguette-step': mk([
    ['3×2 mm',200,13.86],['3.5×2 mm',200,18.85],['3.75×2 mm',200,18.85],['4×2 mm',100,16.38],['5×2.5 mm',100,21.42],
    ['6×3 mm',70,30.24],['7×3.5 mm',60,42.68],['8×4 mm',60,43.10],
  ]),
  'tapered-baguette': mk([
    ['2×1.5×1 mm',200,16.64],['2.5×1.5×1 mm',200,16.64],['2.5×2×1.5 mm',200,16.90],['3×2×1 mm',200,18.90],['3×2.5×1.5 mm',200,18.90],
    ['3.5×1.5×1 mm',200,18.90],['3.5×2.5×1.5 mm',100,18.90],['4×2×1.5 mm',100,20.64],
  ]),
  triangle: mk([
    ['2.00 mm',200,12.90],['3.00 mm',100,22.59],['3.50 mm',140,31.88],['4.00 mm',80,35.28],['5.00 mm',80,53.62],
    ['6.00 mm',60,96.57],['7.00 mm',35,117.81],['8.00 mm',35,152.46],['9.00 mm',15,181.57],['10.00 mm',15,238.39],
  ]),
  octagon: mk([
    ['3×2 mm',100,15.25],['4×2 mm',100,28.98],['4×3 mm',100,20.16],['5×3 mm',80,45.60],['6×4 mm',70,53.30],
    ['7×5 mm',40,56.70],['8×6 mm',40,114.10],['9×7 mm',35,116.90],['10×8 mm',15,141.37],['11×9 mm',15,184.34],
    ['12×10 mm',15,255.02],
  ]),
  leaf: mk([
    ['3.00 mm',100,26.05],['4.00 mm',80,32.99],['5.00 mm',80,43.40],['6.00 mm',60,73.51],
  ]),
};

const laserRows = (shape) => LASER_TABLES[shape] || [];

// Discount fraction off the list ₹/pc. The SAME for every colour (isWhite is
// ignored) so all 6 colours price identically.
//   Round 1.00–1.65 mm → 40% · Round 1.70–2.05 mm → 35%
//   Everything else (round <1.00 or ≥2.10 mm, and all fancy shapes) → 21%
function laserDiscount(shape, mm, isWhite) {
  if (shape !== 'round') return 0.21;   // all fancy shapes: 21%
  if (mm < 1.00) return 0.21;           // round 0.60–0.95 mm: 21%
  if (mm < 1.70) return 0.40;           // round 1.00–1.65 mm: 40%
  if (mm < 2.10) return 0.35;           // round 1.70–2.05 mm: 35%
  return 0.21;                          // round 2.10 mm and up: 21%
}

function LaserOrderPad({ grade, color, shape, category, qtyBySize, setQtyBySize, onBack, onChangeColor, addToCart, setRoute }) {
  const fmt = (n) => (window.formatINR ? window.formatINR(n) : '₹' + Number(n).toLocaleString('en-IN'));
  const shapeMeta = (window.findShape && window.findShape(shape)) || { name: shape };
  const isWhite = color.id === 'white' || !!color.whiteDisc;
  const hex = color.hex || '#F2EFE8';
  const tint = window.lightenTone ? window.lightenTone(hex) : 'var(--paper-2)';
  const rows = laserRows(shape);

  const setQty = (s, v) => setQtyBySize((p) => ({ ...p, [s]: Math.max(0, parseInt(v, 10) || 0) }));
  const bump = (s, d) => setQtyBySize((p) => ({ ...p, [s]: Math.max(0, (p[s] || 0) + d) }));

  const net = (r) => r.price == null ? null : Math.round(r.price * (1 - laserDiscount(shape, r.mm, isWhite)) * 100) / 100;
  const lines = Object.entries(qtyBySize).filter(([, q]) => q > 0);
  const rowBySize = (s) => rows.find((r) => r.s === s);
  const totalPkts = lines.reduce((a, [, q]) => a + q, 0);
  const totalPcs = lines.reduce((a, [s, q]) => { const r = rowBySize(s); return a + q * (r ? r.pk : 0); }, 0);
  const totalAmt = lines.reduce((a, [s, q]) => { const r = rowBySize(s); const n = r ? net(r) : 0; return a + q * (r ? r.pk : 0) * (n || 0); }, 0);

  const onAddAll = () => {
    if (lines.length === 0) return;
    lines.forEach(([s, q]) => {
      const r = rowBySize(s); if (!r) return; const n = net(r) || 0; const pieces = q * r.pk;
      addToCart({
        pid: 'laser-' + color.id + '-' + shape + '-' + s.replace(/\s/g, ''),
        name: color.name + ' Laser ' + shapeMeta.name,
        shape, size: s, quality: 'Laser · ' + color.name,
        color: color.name, colorHex: hex,
        // ct carries the quantity in this line's own unit — packets here, so
        // the cart shows the packets that were actually selected. perCtPrice
        // must be the price for ONE of those units (per packet), because the
        // cart recomputes lineTotal as ct * perCtPrice when the quantity is
        // edited. pcsPerUnit lets it convert back to pieces exactly.
        qty: pieces, ct: q, unitMode: 'pkt', pcsPerUnit: r.pk,
        unitPrice: n, perCtPrice: n * r.pk, certFee: 0,
        lineTotal: pieces * n, tone: 'def-white', toneHex: hex,
      });
    });
    setQtyBySize({});
  };

  const discLabel = isWhite
    ? (shape === 'round' ? 'White · tiered discount by size' : 'White · 18% (fancy shapes)')
    : 'Colour · flat 20% discount';

  return (
    <div className="browse-step">
      <div className="pad-header">
        <div className="pad-header-art" style={{ background: tint, width: 132, height: 132, flex: '0 0 132px' }}>
          {window.ShapeIcon ? <window.ShapeIcon shape={shape} size={48} color={hex} /> : null}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="crumb">Eurostar Laser · {color.name} · {shapeMeta.name}</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 32,
            letterSpacing: '-0.02em', margin: '4px 0 6px', lineHeight: 1.05 }}>
            {color.name} Laser {shapeMeta.name}
          </h1>
          <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: 14 }}>
            Ordered by the packet · priced per piece · <strong style={{ color: 'var(--emerald-ink)' }}>{discLabel}</strong>.
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onChangeColor}>
          {window.IconArrowLeft ? <window.IconArrowLeft size={14} /> : null} Change colour
        </button>
      </div>

      <div className="size-pad laser-pad" style={{ marginTop: 16 }}>
        <div className="size-pad-head">
          <span>Size</span>
          <span style={{ textAlign: 'center' }}>Pcs / pkt</span>
          <span style={{ textAlign: 'right' }}>List ₹/pc</span>
          <span style={{ textAlign: 'center' }}>Disc</span>
          <span style={{ textAlign: 'right' }}>Net ₹/pc</span>
          <span style={{ textAlign: 'center' }}>Packets</span>
          <span style={{ textAlign: 'right' }}>Line total</span>
        </div>
        {rows.map((r) => {
          const q = qtyBySize[r.s] || 0; const pieces = q * r.pk;
          const dsc = laserDiscount(shape, r.mm, isWhite); const n = net(r);
          return (
            <div key={r.s} className={`size-pad-row ${q > 0 ? 'filled' : ''}`}>
              <div className="size-pad-size"><div className="size-pad-mm">{r.s.replace(' mm', '')}</div></div>
              <div className="size-pad-pcs">{r.pk}</div>
              <div className="size-pad-price size-pad-list" style={{ textDecoration: r.price != null ? 'line-through' : 'none', color: 'var(--fg-meta)' }}>{r.price != null ? fmt(r.price) : '—'}</div>
              <div className="size-pad-disc">{Math.round(dsc * 100)}%</div>
              <div className="size-pad-price size-pad-net" style={{ fontWeight: 600 }}>{n != null ? fmt(n) : '—'}</div>
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
                {q > 0 && <div className="size-pad-pcs-note">= {pieces.toLocaleString('en-IN')} pcs</div>}
              </div>
              <div className="size-pad-total">
                {q > 0 && n != null ? fmt(pieces * n) : <span style={{ color: 'var(--ink-4)' }}>—</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="order-summary">
        <div className="order-summary-stats">
          <div><div className="stat-label">Sizes selected</div><div className="stat-value">{lines.length}</div></div>
          <div><div className="stat-label">Total packets</div><div className="stat-value">{totalPkts.toLocaleString('en-IN')}</div></div>
          <div><div className="stat-label">Approx pieces</div><div className="stat-value">{totalPcs.toLocaleString('en-IN')}</div></div>
          <div><div className="stat-label">Order total (net)</div><div className="stat-value money">{fmt(totalAmt)}</div></div>
        </div>
        <button className="btn btn-accent btn-lg" disabled={lines.length === 0} onClick={onAddAll}>Add to cart</button>
      </div>
    </div>
  );
}

Object.assign(window, { LASER_ROUND, laserRows, laserDiscount, LaserOrderPad });
