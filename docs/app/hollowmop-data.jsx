// hollowmop-data.jsx — Hollow Shapes MOP & Black Onyx.
// Price = f(shape, size, colour). Colour chosen via grade (White MOP / Black Onyx).
// Sold by packet; PACKING = pieces per packet (per size); priced per piece.

// rows: { s: size label, pk: pcs/packet, w: white ₹/pc, b: black ₹/pc }
const HOLLOWMOP_PRICES = {
  round: [
    { s:'6×2 mm', pk:25, w:39, b:36 }, { s:'8×2 mm', pk:25, w:45, b:42 },
    { s:'10×2 mm', pk:25, w:54, b:48 }, { s:'12×2 mm', pk:25, w:60, b:54 },
    { s:'14×2 mm', pk:15, w:75, b:66 }, { s:'16×2 mm', pk:15, w:96, b:72 },
    { s:'20×2 mm', pk:15, w:126, b:84 },
  ],
  square: [
    { s:'8×2 mm', pk:25, w:36, b:36 }, { s:'10×2 mm', pk:25, w:45, b:42 },
    { s:'12×2 mm', pk:25, w:54, b:48 }, { s:'14×2 mm', pk:25, w:75, b:54 },
    { s:'16×2 mm', pk:15, w:96, b:66 }, { s:'20×2 mm', pk:15, w:126, b:72 },
  ],
  oval: [
    { s:'10×7 mm', pk:25, w:54, b:48 }, { s:'10×8 mm', pk:25, w:54, b:51 },
    { s:'12×8 mm', pk:15, w:63, b:54 }, { s:'12×9 mm', pk:15, w:63, b:60 },
    { s:'14×9 mm', pk:15, w:81, b:66 }, { s:'14×10 mm', pk:15, w:81, b:69 },
    { s:'16×12 mm', pk:15, w:96, b:75 }, { s:'20×14 mm', pk:15, w:150, b:84 },
  ],
  baguette: [
    { s:'8×6 mm', pk:25, w:54, b:42 }, { s:'10×8 mm', pk:25, w:54, b:48 },
    { s:'12×8 mm', pk:25, w:75, b:54 }, { s:'14×10 mm', pk:15, w:81, b:66 },
    { s:'16×10 mm', pk:15, w:96, b:75 }, { s:'20×14 mm', pk:15, w:150, b:84 },
  ],
  pear: [
    { s:'10×7 mm', pk:25, w:54, b:48 }, { s:'10×8 mm', pk:25, w:57, b:51 },
    { s:'12×8 mm', pk:25, w:57, b:54 }, { s:'12×9 mm', pk:25, w:66, b:60 },
    { s:'14×9 mm', pk:15, w:75, b:66 }, { s:'14×10 mm', pk:15, w:96, b:69 },
    { s:'16×12 mm', pk:15, w:96, b:75 }, { s:'20×14 mm', pk:15, w:150, b:84 },
  ],
  heart: [
    { s:'8 mm', pk:25, w:51, b:42 }, { s:'10 mm', pk:25, w:54, b:48 },
    { s:'12 mm', pk:25, w:66, b:54 }, { s:'14 mm', pk:15, w:75, b:66 },
    { s:'16 mm', pk:15, w:96, b:75 }, { s:'18 mm', pk:15, w:135, b:78 },
    { s:'20 mm', pk:15, w:150, b:84 },
  ],
  clover: [
    { s:'8 mm', pk:25, w:54, b:42 }, { s:'10 mm', pk:25, w:60, b:48 },
    { s:'12 mm', pk:25, w:66, b:54 }, { s:'14 mm', pk:25, w:75, b:66 },
    { s:'16 mm', pk:15, w:96, b:75 }, { s:'18 mm', pk:15, w:105, b:81 },
    { s:'20 mm', pk:15, w:126, b:90 },
  ],
  hexagon: [
    { s:'8 mm', pk:25, w:54, b:42 }, { s:'10 mm', pk:25, w:60, b:48 },
    { s:'12 mm', pk:25, w:66, b:54 }, { s:'14 mm', pk:15, w:75, b:66 },
    { s:'16 mm', pk:15, w:120, b:72 }, { s:'18 mm', pk:15, w:150, b:78 },
    { s:'20 mm', pk:15, w:180, b:84 },
  ],
};
const hollowmopRows = (shape) => HOLLOWMOP_PRICES[shape] || [];

function HollowMopOrderPad({ grade, shape, category, qtyBySize, setQtyBySize, onBack, addToCart, setRoute }) {
  const fmt = (n) => (window.formatINR ? window.formatINR(n) : '₹' + Number(n).toLocaleString('en-IN'));
  const shapeMeta = (window.findShape && window.findShape(shape)) || { name: shape };
  const col = grade.id === 'onyx' ? 'b' : 'w';
  const hex = grade.id === 'onyx' ? '#2A2A28' : '#EFE9DD';
  const tint = window.lightenTone ? window.lightenTone(hex) : 'var(--paper-2)';
  const rows = hollowmopRows(shape);

  const setQty = (s, v) => setQtyBySize((p) => ({ ...p, [s]: Math.max(0, parseInt(v, 10) || 0) }));
  const bump = (s, d) => setQtyBySize((p) => ({ ...p, [s]: Math.max(0, (p[s] || 0) + d) }));

  const lines = Object.entries(qtyBySize).filter(([, q]) => q > 0);
  const rowBySize = (s) => rows.find((r) => r.s === s);
  const totalPkts = lines.reduce((a, [, q]) => a + q, 0);
  const totalPcs = lines.reduce((a, [s, q]) => { const r = rowBySize(s); return a + q * (r ? r.pk : 0); }, 0);
  const totalAmt = lines.reduce((a, [s, q]) => { const r = rowBySize(s); return a + q * (r ? r.pk * r[col] : 0); }, 0);

  const onAddAll = () => {
    if (lines.length === 0) return;
    lines.forEach(([s, q]) => {
      const r = rowBySize(s); if (!r) return; const pieces = q * r.pk; const price = r[col];
      addToCart({
        pid: 'hollowmop-' + grade.id + '-' + shape + '-' + s.replace(/\s/g, ''),
        name: grade.name + ' Hollow ' + shapeMeta.name,
        shape, size: s, quality: grade.name,
        color: grade.name, colorHex: hex,
        // ct = packets actually selected; perCtPrice = price per packet, so
        // the cart's ct * perCtPrice recomputation stays correct on edit.
        qty: pieces, ct: q, unitMode: 'pkt', pcsPerUnit: r.pk,
        unitPrice: price, perCtPrice: price * r.pk, certFee: 0,
        lineTotal: pieces * price, tone: 'def-white', toneHex: hex,
      });
    });
    setQtyBySize({});
  };

  return (
    <div className="browse-step">
      <div className="pad-header">
        <div className="pad-header-art" style={{ background: tint, width: 132, height: 132, flex: '0 0 132px' }}>
          {window.ShapeIcon ? <window.ShapeIcon shape={shape} size={48} color={hex} /> : null}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="crumb">{category.short} · {grade.name} · {shapeMeta.name}</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 32,
            letterSpacing: '-0.02em', margin: '4px 0 6px', lineHeight: 1.05 }}>
            {grade.name} Hollow {shapeMeta.name}
          </h1>
          <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: 14 }}>
            Hollow {shapeMeta.name.toLowerCase()} shapes · ordered by the packet · priced per piece.
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
          const q = qtyBySize[r.s] || 0; const pieces = q * r.pk; const price = r[col];
          return (
            <div key={r.s} className={`size-pad-row ${q > 0 ? 'filled' : ''}`}
              style={{ gridTemplateColumns: '1fr 110px 100px 1fr 130px' }}>
              <div className="size-pad-size"><div className="size-pad-mm" style={{ fontSize: 15 }}>{r.s}</div></div>
              <div className="size-pad-pcs">{r.pk}</div>
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
                {q > 0 && <div className="size-pad-pcs-note">= {pieces.toLocaleString('en-IN')} pcs</div>}
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
          <div><div className="stat-label">Approx pieces</div><div className="stat-value">{totalPcs.toLocaleString('en-IN')}</div></div>
          <div><div className="stat-label">Order total</div><div className="stat-value money">{fmt(totalAmt)}</div></div>
        </div>
        <button className="btn btn-accent btn-lg" disabled={lines.length === 0} onClick={onAddAll}>Add to cart</button>
      </div>
    </div>
  );
}

Object.assign(window, { HOLLOWMOP_PRICES, hollowmopRows, HollowMopOrderPad });
