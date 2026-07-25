// mop-data.jsx — Mother of Pearl: colour-led flow (Colour → Shape → Size chart).
// Prices are per piece, sizes shown CORNER-TO-CORNER. Per-line items omitted by request.
// Draft figures transcribed from the Eurostar MOP price list — verify before publishing.

// Colour grades (the first choice). Prices vary by colour: w=White, m=Malachite, b=Black.
const MOP_COLORS = [
  { id: 'white', name: 'White MOP', tier: 'Natural', desc: 'Classic white mother of pearl', hex: '#F2EFE8' },
  { id: 'black', name: 'Black MOP', tier: 'Natural', desc: 'Deep black mother of pearl',    hex: '#2A2A28' },
];
const MOP_COLOR_KEY = { white: 'w', black: 'b' };

// Shapes offered (all per piece). note = short descriptor for the shape card.
const MOP_SHAPES = [
  { id: 'round',         name: 'Round',               note: 'Disc · by diameter' },
  { id: 'pearoval',      name: 'Pear / Oval',         note: 'L × W' },
  { id: 'square',        name: 'Square',              note: 'By side-to-side' },
  { id: 'heart',         name: 'Heart',               note: 'L × W' },
  { id: 'marquise',      name: 'Marquise',            note: 'L × W' },
  { id: 'triangle',      name: 'Triangle',            note: 'By side' },
  { id: 'baguette',      name: 'Baguette',            note: 'Rectangular L × W' },
  { id: 'bellflower',    name: 'Bell Flower',         note: 'Floral motif' },
  { id: 'bulgari',       name: 'Bulgari Motif',       note: 'Signature motif' },
  { id: 'butterfly',     name: 'Butterfly',           note: 'Carved butterfly' },
  { id: 'natrivershell', name: 'Natural River Shell', note: 'Large flat shell · white only' },
];

// Price tables: per shape, rows of { s: size label, w: White, b: Black, ppp: pcs/packet (MOQ) }.
// null price = not available in that colour. Sizes and MOQ per the MOP Flat Fancy Shapes sheet;
// MOQ follows Round's size-tiering (<=4mm 50, <=15mm 25, <=19mm 15, >=20mm 10) by largest face dim.
const MOP_PRICES = {
  round: [
    { s: '3×2 mm', w: 14, b: 14, ppp: 50 },
    { s: '3.5×2 mm', w: 14, b: 14, ppp: 50 },
    { s: '4×2 mm', w: 14, b: 14, ppp: 50 },
    { s: '4.5×2 mm', w: 14, b: 14, ppp: 25 },
    { s: '5×2 mm', w: 14, b: 14, ppp: 25 },
    { s: '5.5×2 mm', w: 14, b: 16, ppp: 25 },
    { s: '6×2 mm', w: 16, b: 18, ppp: 25 },
    { s: '6.5×2 mm', w: 18, b: 20, ppp: 25 },
    { s: '7×2 mm', w: 20, b: 20, ppp: 25 },
    { s: '7.5×2 mm', w: 22, b: 22, ppp: 25 },
    { s: '8×2 mm', w: 24, b: 24, ppp: 25 },
    { s: '9×2 mm', w: 26, b: 26, ppp: 25 },
    { s: '10×2 mm', w: 26, b: 26, ppp: 25 },
    { s: '11×2 mm', w: 32, b: 32, ppp: 25 },
    { s: '12×2 mm', w: 36, b: 40, ppp: 25 },
    { s: '13×2 mm', w: 44, b: 44, ppp: 25 },
    { s: '14×2 mm', w: 46, b: 46, ppp: 25 },
    { s: '15×2 mm', w: 50, b: 50, ppp: 25 },
    { s: '16×2 mm', w: 56, b: 56, ppp: 15 },
    { s: '17×2 mm', w: 90, b: 64, ppp: 15 },
    { s: '18×2 mm', w: 96, b: 70, ppp: 15 },
    { s: '19×2 mm', w: 100, b: 76, ppp: 15 },
    { s: '20×2 mm', w: 110, b: 80, ppp: 10 },
  ],
  pearoval: [
    { s: '5×3×2 mm', w: 20, b: 20, ppp: 25 },
    { s: '6×4×2 mm', w: 20, b: 20, ppp: 25 },
    { s: '7×5×2 mm', w: 20, b: 20, ppp: 25 },
    { s: '8×6×2 mm', w: 22, b: 22, ppp: 25 },
    { s: '9×7×2 mm', w: 24, b: 24, ppp: 25 },
    { s: '10×7×2 mm', w: 26, b: 26, ppp: 25 },
    { s: '10×8×2 mm', w: 26, b: 26, ppp: 25 },
    { s: '11×9×2 mm', w: 32, b: 32, ppp: 25 },
    { s: '12×9×2 mm', w: 36, b: 36, ppp: 25 },
    { s: '13×8×2 mm', w: 40, b: 40, ppp: 25 },
    { s: '13×9×2 mm', w: 40, b: 40, ppp: 25 },
    { s: '14×8×2 mm', w: 44, b: 44, ppp: 25 },
    { s: '14×9×2 mm', w: 44, b: 44, ppp: 25 },
    { s: '14×10×2 mm', w: 44, b: 44, ppp: 25 },
    { s: '15×8×2 mm', w: 60, b: 60, ppp: 25 },
    { s: '15×9×2 mm', w: 64, b: 60, ppp: 25 },
    { s: '15×10×2 mm', w: 68, b: 64, ppp: 25 },
  ],
  square: [
    { s: '3×3×2 mm', w: 14, b: 24, ppp: 50 },
    { s: '4×4×2 mm', w: 14, b: 24, ppp: 50 },
    { s: '5×5×2 mm', w: 14, b: 24, ppp: 25 },
    { s: '5.5×5.5×2 mm', w: 16, b: 28, ppp: 25 },
    { s: '6×6×2 mm', w: 16, b: 28, ppp: 25 },
    { s: '6.5×6.5×2 mm', w: 20, b: 32, ppp: 25 },
    { s: '7×7×2 mm', w: 20, b: 32, ppp: 25 },
    { s: '8×8×2 mm', w: 20, b: 32, ppp: 25 },
    { s: '8.5×8.5×2 mm', w: 22, b: 36, ppp: 25 },
    { s: '9×9×2 mm', w: 22, b: 36, ppp: 25 },
    { s: '10×10×2 mm', w: 22, b: 36, ppp: 25 },
    { s: '10.5×10.5×2 mm', w: 30, b: 40, ppp: 25 },
    { s: '11×11×2 mm', w: 30, b: 40, ppp: 25 },
    { s: '12×12×2 mm', w: 30, b: 40, ppp: 25 },
    { s: '13×13×2 mm', w: 40, b: 50, ppp: 25 },
    { s: '14×14×2 mm', w: 40, b: 50, ppp: 25 },
    { s: '15×15×2 mm', w: 50, b: 56, ppp: 25 },
    { s: '16×16×2 mm', w: 50, b: 56, ppp: 15 },
    { s: '17×17×2 mm', w: 80, b: 70, ppp: 15 },
    { s: '18×18×2 mm', w: 80, b: 70, ppp: 15 },
    { s: '19×19×2 mm', w: 110, b: 90, ppp: 15 },
    { s: '20×20×2 mm', w: 110, b: 90, ppp: 10 },
    { s: '22×22×2 mm', w: 130, b: 100, ppp: 10 },
    { s: '24×24×2 mm', w: 160, b: 110, ppp: 10 },
    { s: '25×25×2 mm', w: 180, b: 110, ppp: 10 },
    { s: '30×30×2 mm', w: 400, b: 130, ppp: 10 },
    { s: '35×35×2 mm', w: 800, b: 170, ppp: 10 },
  ],
  heart: [
    { s: '3×2 mm', w: 20, b: null, ppp: 50 },
    { s: '4×2 mm', w: 20, b: null, ppp: 50 },
    { s: '5×2 mm', w: 20, b: 20, ppp: 25 },
    { s: '6×2 mm', w: 20, b: 20, ppp: 25 },
    { s: '7×2 mm', w: 20, b: 20, ppp: 25 },
    { s: '8×2 mm', w: 22, b: 22, ppp: 25 },
    { s: '9×2 mm', w: 28, b: 28, ppp: 25 },
    { s: '10×2 mm', w: 32, b: 32, ppp: 25 },
    { s: '11×2 mm', w: 36, b: 36, ppp: 25 },
    { s: '12×2 mm', w: 36, b: 36, ppp: 25 },
    { s: '13×2 mm', w: 48, b: 48, ppp: 25 },
    { s: '14×2 mm', w: 50, b: 50, ppp: 25 },
    { s: '15×2 mm', w: 54, b: 54, ppp: 25 },
    { s: '16×2 mm', w: 56, b: 56, ppp: 15 },
    { s: '17×2 mm', w: 84, b: 64, ppp: 15 },
    { s: '18×2 mm', w: 90, b: 70, ppp: 15 },
    { s: '19×2 mm', w: 110, b: 80, ppp: 15 },
    { s: '20×2 mm', w: 130, b: 90, ppp: 10 },
  ],
  marquise: [
    { s: '6×3 mm', w: 22, b: 20, ppp: 25 },
    { s: '8×4 mm', w: 26, b: 20, ppp: 25 },
    { s: '10×5 mm', w: 30, b: 20, ppp: 25 },
    { s: '12×6 mm', w: 36, b: 30, ppp: 25 },
    { s: '14×7 mm', w: 44, b: 30, ppp: 25 },
    { s: '18×9 mm', w: 54, b: 40, ppp: 15 },
    { s: '20×10 mm', w: 64, b: 40, ppp: 10 },
  ],
  triangle: [
    { s: '3×3×3×2 mm', w: 18, b: 18, ppp: 50 },
    { s: '4×4×4×2 mm', w: 18, b: 18, ppp: 50 },
    { s: '5×5×5×2 mm', w: 18, b: 18, ppp: 25 },
    { s: '6×6×6×2 mm', w: 24, b: 24, ppp: 25 },
    { s: '7×7×7×2 mm', w: 26, b: 26, ppp: 25 },
    { s: '8×8×8×2 mm', w: 26, b: 26, ppp: 25 },
    { s: '9×9×9×2 mm', w: 30, b: 30, ppp: 25 },
    { s: '10×10×10×2 mm', w: 32, b: 32, ppp: 25 },
    { s: '11×11×11×2 mm', w: 32, b: 32, ppp: 25 },
    { s: '12×12×12×2 mm', w: 36, b: 36, ppp: 25 },
    { s: '13×13×13×2 mm', w: 40, b: 40, ppp: 25 },
    { s: '14×14×14×2 mm', w: 44, b: 44, ppp: 25 },
    { s: '15×15×15×2 mm', w: 60, b: 60, ppp: 25 },
    { s: '16×16×16×2 mm', w: 70, b: 70, ppp: 15 },
    { s: '17×17×17×2 mm', w: 90, b: 90, ppp: 15 },
    { s: '18×18×18×2 mm', w: 90, b: 90, ppp: 15 },
    { s: '19×19×19×2 mm', w: 110, b: 110, ppp: 15 },
  ],
  baguette: [
    { s: '6×4 mm', w: 24, b: 26, ppp: 25 },
    { s: '7×5 mm', w: 26, b: 30, ppp: 25 },
    { s: '8×6 mm', w: 30, b: 34, ppp: 25 },
    { s: '9×7 mm', w: 32, b: 36, ppp: 25 },
    { s: '10×8 mm', w: 34, b: 40, ppp: 25 },
  ],
  bellflower: [
    { s: '8×2 mm', w: 26, b: 26, ppp: 25 },
    { s: '10×2 mm', w: 30, b: 30, ppp: 25 },
    { s: '12×2 mm', w: 34, b: 34, ppp: 25 },
    { s: '14×2 mm', w: 40, b: 40, ppp: 25 },
  ],
  bulgari: [
    { s: '4.5×7.5×2 mm', w: 30, b: 56, ppp: 25 },
    { s: '5.5×7×2 mm', w: 30, b: 56, ppp: 25 },
    { s: '6.5×8×2 mm', w: 30, b: 56, ppp: 25 },
    { s: '8.5×10×2 mm', w: 30, b: 64, ppp: 25 },
    { s: '10.5×12.5×2 mm', w: 32, b: 70, ppp: 25 },
  ],
  butterfly: [
    { s: '4×5×2 mm', w: 24, b: 56, ppp: 25 },
    { s: '5×6×2 mm', w: 30, b: 60, ppp: 25 },
    { s: '8×6×2 mm', w: 32, b: 64, ppp: 25 },
    { s: '8×10×2 mm', w: 36, b: 70, ppp: 25 },
    { s: '10×12×2 mm', w: 44, b: 76, ppp: 25 },
    { s: '12×15×2 mm', w: 70, b: 80, ppp: 25 },
    { s: '18×11×2 mm', w: 110, b: 90, ppp: 15 },
  ],
  natrivershell: [
    { s: '40×40×1.5 mm', w: 260, b: null, ppp: 10 },
    { s: '50×50×1.5 mm', w: 360, b: null, ppp: 10 },
    { s: '60×60×1.5 mm', w: 900, b: null, ppp: 10 },
    { s: '70×70×1.5 mm', w: 1100, b: null, ppp: 10 },
  ],
};
const mopRows = (shape) => MOP_PRICES[shape] || [];
const mopPrice = (shape, colorId, sizeLabel) => {
  const row = mopRows(shape).find((r) => r.s === sizeLabel);
  if (!row) return null;
  return row[MOP_COLOR_KEY[colorId] || 'w'];
};

// Measurement diagram — adapts to the shape (diameter / corner-to-corner / length×width).
const MOP_MEASURE_TYPE = {
  round: 'dia', bellflower: 'dia', bulgari: 'dia', butterfly: 'dia',
  square: 's2s', natrivershell: 's2s',
  pearoval: 'lw', marquise: 'lw', triangle: 'lw', heart: 'lw', baguette: 'lw',
};
function MopMeasureDiagram({ shape }) {
  const type = MOP_MEASURE_TYPE[shape] || 'c2c';
  const ar = (x1, y1, x2, y2) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--emerald)" strokeWidth="1.6"
      strokeDasharray="4 3" markerStart="url(#mopArrowS)" markerEnd="url(#mopArrowE)" />
  );
  let art, title, sub;
  if (type === 'dia') {
    art = (<g>
      <circle cx="46" cy="46" r="28" fill="var(--paper-2)" stroke="var(--border-strong)" strokeWidth="1.5" />
      {ar(18, 46, 74, 46)}
    </g>);
    title = 'How to measure — Diameter';
    sub = 'Measure straight across the widest point. All sizes on this page are the diameter.';
  } else if (type === 'lw') {
    art = (<g>
      <ellipse cx="46" cy="46" rx="30" ry="20" fill="var(--paper-2)" stroke="var(--border-strong)" strokeWidth="1.5" />
      {ar(16, 46, 76, 46)}
      {ar(46, 26, 46, 66)}
    </g>);
    title = 'How to measure — Length × Width';
    sub = 'Measure the full length, then the full width across the widest points.';
  } else if (type === 's2s') {
    art = (<g>
      <rect x="22" y="22" width="48" height="48" rx="3" fill="var(--paper-2)" stroke="var(--border-strong)" strokeWidth="1.5" />
      {ar(22, 46, 70, 46)}
    </g>);
    title = 'How to measure — Side to Side (S2S)';
    sub = 'Measure flat side to flat side. All sizes on this page are side-to-side.';
  } else {
    art = (<g>
      <rect x="20" y="20" width="52" height="52" rx="3" fill="var(--paper-2)" stroke="var(--border-strong)" strokeWidth="1.5" />
      {ar(20, 72, 72, 20)}
    </g>);
    title = 'How to measure — Corner to Corner (C2C)';
    sub = 'Measure the full diagonal, tip to opposite tip. All sizes on this page are corner-to-corner.';
  }
  return (
    <div className="mop-measure">
      <svg width="92" height="92" viewBox="0 0 92 92" fill="none">
        <defs>
          <marker id="mopArrowE" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
            <path d="M0 0 L6 3 L0 6 Z" fill="var(--emerald)" />
          </marker>
          <marker id="mopArrowS" markerWidth="7" markerHeight="7" refX="1" refY="3" orient="auto">
            <path d="M6 0 L0 3 L6 6 Z" fill="var(--emerald)" />
          </marker>
        </defs>
        {art}
      </svg>
      <div>
        <div className="mop-measure-title">{title}</div>
        <div className="mop-measure-sub">{sub}</div>
      </div>
    </div>
  );
}

// Self-contained MOP order pad: header + diagram + per-piece size chart.
function MopOrderPad({ grade, shape, category, qtyBySize, setQtyBySize, onBack, onChangeGrade, addToCart, setRoute }) {
  const fmt = (n) => (window.formatINR ? window.formatINR(n) : '₹' + Number(n).toLocaleString('en-IN'));
  const shapeMeta = (window.findShape && window.findShape(shape)) || { name: shape };
  const colorId = grade.id;
  const hex = (MOP_COLORS.find((c) => c.id === colorId) || {}).hex || '#EFE9DD';
  const tint = window.lightenTone ? window.lightenTone(hex) : 'var(--paper-2)';
  // Same resolver + key the shape cards and the admin use: MOP shares one colour
  // ('mop') across grades, so the photo is keyed by GRADE (grade.id = colorId here)
  // with that shared colour — each of White/Malachite/Black gets its own image.
  const mopColourId = (window.COLORS_BY_CATEGORY && window.COLORS_BY_CATEGORY.mop && window.COLORS_BY_CATEGORY.mop[0] && window.COLORS_BY_CATEGORY.mop[0].id) || 'mop';
  const heroImg = window.productImageFor ? window.productImageFor(category.id, mopColourId, shape, colorId) : null;
  const rows = mopRows(shape);

  const setQty = (size, v) => setQtyBySize((p) => ({ ...p, [size]: Math.max(0, parseInt(v, 10) || 0) }));
  const bump = (size, d) => setQtyBySize((p) => ({ ...p, [size]: Math.max(0, (p[size] || 0) + d) }));

  const lines = Object.entries(qtyBySize).filter(([, q]) => q > 0);
  const ppp = (r) => r && r.ppp ? r.ppp : 1; // pieces per packet (set via bulk upload)
  const rowBySize = (size) => rows.find((r) => r.s === size);
  const totalPkts = lines.reduce((s, [, q]) => s + q, 0);
  const totalPcs = lines.reduce((s, [size, q]) => s + q * ppp(rowBySize(size)), 0);
  const totalAmt = lines.reduce((s, [size, q]) => {
    const r = rowBySize(size); const price = (r && r[MOP_COLOR_KEY[colorId] || 'w']) || 0;
    return s + q * ppp(r) * price;
  }, 0);

  const onAddAll = () => {
    if (lines.length === 0) return;
    lines.forEach(([size, q]) => {
      const r = rowBySize(size);
      const price = (r && r[MOP_COLOR_KEY[colorId] || 'w']) || 0;
      const pieces = q * ppp(r);
      addToCart({
        pid: 'mop-' + colorId + '-' + shape + '-' + size.replace(/\s/g, ''),
        name: grade.name + ' ' + shapeMeta.name,
        shape, size, quality: grade.name,
        color: grade.name, colorHex: hex,
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
        <div className="pad-header-art" style={{ background: tint, width: 132, height: 132, flex: '0 0 132px',
          overflow: 'hidden', padding: heroImg ? 0 : undefined }}>
          {heroImg
            ? <img src={heroImg} alt={`${shapeMeta.name}`} loading="lazy"
                   onError={(e) => { e.currentTarget.style.display = 'none'; }}
                   style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : window.ShapeIcon ? <window.ShapeIcon shape={shape} size={48} color={hex} /> : null}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="crumb">{category.short} · {grade.name} · {shapeMeta.name}</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 32,
            letterSpacing: '-0.02em', margin: '4px 0 6px', lineHeight: 1.05 }}>
            {grade.name} {shapeMeta.name}
          </h1>
          <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: 14 }}>
            Ordered by the packet · priced per piece · pieces-per-packet set on bulk upload · sizes shown corner-to-corner.
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          {window.IconArrowLeft ? <window.IconArrowLeft size={14} /> : null} Change shape
        </button>
      </div>

      <MopMeasureDiagram shape={shape} />

      <div className="size-pad pkt-pad" style={{ marginTop: 16 }}>
        <div className="size-pad-head" style={{ gridTemplateColumns: '1fr 110px 100px 1fr 130px' }}>
          <span>Size{MOP_MEASURE_TYPE[shape] === 'dia' ? ' (diameter)' : MOP_MEASURE_TYPE[shape] === 'lw' ? ' (length × width)' : MOP_MEASURE_TYPE[shape] === 's2s' ? ' (side to side)' : ' (corner-to-corner)'}</span>
          <span style={{ textAlign: 'center' }}>Pcs / packet</span>
          <span style={{ textAlign: 'right' }}>₹ / pc</span>
          <span style={{ textAlign: 'center' }}>Packets</span>
          <span style={{ textAlign: 'right' }}>Line total</span>
        </div>
        {rows.map((r) => {
          const price = r[MOP_COLOR_KEY[colorId] || 'w'];
          const q = qtyBySize[r.s] || 0;
          const avail = price != null;
          const pieces = q * ppp(r);
          return (
            <div key={r.s} className={`size-pad-row ${q > 0 ? 'filled' : ''}`}
              style={{ gridTemplateColumns: '1fr 110px 100px 1fr 130px', opacity: avail ? 1 : 0.45 }}>
              <div className="size-pad-size"><div className="size-pad-mm" style={{ fontSize: 15 }}>{r.s}</div></div>
              <div className="size-pad-pcs">{r.ppp ? r.ppp : '—'}</div>
              <div className="size-pad-price">{avail ? fmt(price) : '—'}</div>
              <div className="size-pad-input-wrap">
                {avail ? (
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
                ) : <span style={{ fontSize: 12, color: 'var(--fg-meta)' }}>Not available</span>}
                {q > 0 && r.ppp &&
                  <div className="size-pad-pcs-note">= {pieces.toLocaleString('en-IN')} pcs</div>}
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

// A shape is available in a colour only if at least one size has a price there
// (e.g. Natural River Shell is White-only, so it is hidden on the Black grade).
const mopShapeAvailable = (shape, colorId) => {
  const k = MOP_COLOR_KEY[colorId] || 'w';
  return (MOP_PRICES[shape] || []).some((r) => r[k] != null);
};

Object.assign(window, {
  MOP_COLORS, MOP_SHAPES, MOP_PRICES, MOP_COLOR_KEY, mopRows, mopPrice, MopOrderPad, mopShapeAvailable,
});
