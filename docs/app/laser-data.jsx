// laser-data.jsx — Eurostar Laser Engraved pricing.
// Round = exact list from the white price list (size · pcs/packet · list ₹/pc).
// Net price after discount. White = tiered by size; Colour = flat 20%.
// Ordered by the packet, priced per piece.

// Round: [size mm, pcs/packet, list ₹/pc]
const LASER_ROUND = [
  [0.60,1000,4.85],[0.70,1000,2.85],[0.75,1000,2.85],[0.80,1000,2.38],[0.85,1000,2.38],
  [0.90,1000,2.38],[0.95,1000,2.38],[1.00,1000,2.38],[1.05,1000,2.38],[1.10,1000,2.38],
  [1.15,1000,2.38],[1.20,1000,2.38],[1.25,1000,2.38],[1.30,1000,2.38],[1.35,1000,2.38],
  [1.40,1000,2.38],[1.45,1000,2.38],[1.50,1000,2.38],[1.55,1000,2.38],[1.60,1000,2.38],
  [1.65,1000,2.38],[1.70,1000,2.52],[1.75,1000,2.52],[1.80,1000,2.52],[1.85,1000,2.52],
  [1.90,1000,2.72],[1.95,1000,2.72],[2.00,1000,2.72],[2.05,500,2.72],[2.10,500,2.72],
  [2.15,500,2.72],[2.20,500,2.78],[2.25,500,2.78],[2.30,500,3.00],[2.35,500,3.00],
  [2.40,500,3.11],[2.50,500,3.89],[2.60,500,4.11],[2.65,200,4.11],[2.70,200,4.89],
  [2.75,200,4.89],[2.80,200,5.11],[2.85,200,5.11],[2.90,200,5.11],[2.95,200,5.13],
  [3.00,200,5.13],[3.10,200,6.22],[3.20,140,6.89],[3.25,140,7.33],[3.30,140,7.33],
  [3.40,140,7.56],[3.50,140,7.78],[3.60,140,8.22],[3.70,140,8.89],[3.75,140,8.89],
  [3.80,140,9.33],[3.90,80,9.33],[4.00,80,9.33],[4.25,80,11.56],[4.50,80,12.67],
  [4.75,80,15.11],[5.00,80,16.89],[5.25,60,21.11],[5.50,60,22.89],[5.75,60,24.00],
  [6.00,60,26.22],[6.25,60,27.78],[6.50,60,28.44],[6.75,35,28.89],[7.00,35,33.33],
  [7.25,35,40.00],[7.50,35,40.00],[7.75,35,40.00],[8.00,35,44.00],[8.25,15,51.11],
  [8.50,15,51.11],[8.75,15,57.78],[9.00,15,56.67],[9.50,15,60.00],[10.00,15,73.33],
  [11.00,15,151.11],[12.00,15,204.44],
].map(([mm, pk, price]) => ({ s: mm.toFixed(2) + ' mm', mm, pk, price }));

const laserRows = (shape) => {
  if (shape === 'round') return LASER_ROUND;
  // Fancy shapes: list prices are placeholders until clean fancy data is loaded.
  const sizes = (window.FULL_SIZES && window.FULL_SIZES[shape]) || ['4.00 mm'];
  return sizes.map((s) => ({ s, mm: parseFloat(s) || 0, pk: window.packetPcs ? window.packetPcs('laser', s) : 100, price: null }));
};

// Discount fraction. White = tiered by round size (fancy 18%); Colour = flat 20%.
// VGI colors (whiteDisc: true) use the same tiered structure as white.
function laserDiscount(shape, mm, isWhite) {
  if (!isWhite) return 0.20;            // colour: flat 20%
  if (shape !== 'round') return 0.18;   // all fancy shapes: 18%
  if (mm < 1.00) return 0.21;           // 0.60–0.95 mm
  if (mm < 1.70) return 0.40;           // 1.00–1.65 mm
  if (mm < 2.10) return 0.30;           // 1.70–2.05 mm
  return 0.18;                          // 2.10 mm and up
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
