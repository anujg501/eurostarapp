// screen-product.jsx — Product Detail Page with COLUMNAR size order pad
// Customer picks shape + quality, then enters carat quantities against each size.

function ProductScreen({ route, setRoute, addToCart, wishlist, toggleWishlist }) {
  const product = findProduct(route.pid);
  if (!product) {
    return (
      <div className="page">
        <div className="empty">
          <h3>Product not found</h3>
          <button className="btn btn-secondary" onClick={() => setRoute({ name: 'catalog' })}>
            Back to catalog
          </button>
        </div>
      </div>
    );
  }

  const matrix = VARIANT_MATRIX[product.id];

  // ---------- Configurator state ----------
  const [shape, setShape] = React.useState(product.shape);
  const [quality, setQuality] = React.useState(matrix?.qualities?.[0] || product.clarity);
  const [activeThumb, setActiveThumb] = React.useState(0);

  // qtyBySize: { '1.00 mm': 3, '1.25 mm': 5, ... } — quantities in CARATS
  const [qtyBySize, setQtyBySize] = React.useState({});

  // MOQ in carats (3 ct minimum per size for melee, larger MOQ for bigger stones)
  const moqCt = 3;
  // Carat increment per click
  const stepCt = 1;

  const sizesForShape = matrix?.sizes?.[shape] || [product.size];
  const tone = findTone(product.tone);
  const shapeMeta = findShape(shape);

  // Reset cart when shape changes (sizes differ)
  React.useEffect(() => {
    setQtyBySize({});
  }, [shape, quality]);

  // Roll-up
  const lines = Object.entries(qtyBySize).filter(([, ct]) => ct > 0);
  const totalCt = lines.reduce((s, [, ct]) => s + ct, 0);
  const totalPcs = lines.reduce((s, [size, ct]) => s + Math.round(ct * pcsPerCt(size)), 0);
  const totalAmount = lines.reduce((s, [size, ct]) => s + ct * sizePerCtPrice(product, size), 0);

  const updateQty = (size, value) => {
    const v = Math.max(0, parseFloat(value) || 0);
    setQtyBySize(prev => ({ ...prev, [size]: v }));
  };
  const bumpQty = (size, delta) => {
    setQtyBySize(prev => {
      const current = prev[size] || 0;
      const next = Math.max(0, current + delta);
      // Auto-snap to MOQ when going from 0 → positive
      if (current === 0 && delta > 0) return { ...prev, [size]: Math.max(moqCt, next) };
      return { ...prev, [size]: next };
    });
  };

  const fillRow = (size) => bumpQty(size, moqCt);

  const onAddAll = () => {
    if (lines.length === 0) return;
    lines.forEach(([size, ct]) => {
      const pcs = Math.round(ct * pcsPerCt(size));
      addToCart({
        pid: product.id, name: product.name,
        shape, size, quality,
        qty: pcs,
        ct: ct,
        unitPrice: sizeUnitPrice(product, size),
        perCtPrice: sizePerCtPrice(product, size),
        lineTotal: ct * sizePerCtPrice(product, size),
        tone: product.tone,
      });
    });
    setQtyBySize({});
  };

  return (
    <div className="page">
      <button className="btn btn-ghost btn-sm" onClick={() => setRoute({ name: 'catalog' })}
              style={{ marginBottom: 16, marginLeft: -8 }}>
        <IconArrowLeft size={16} /> Back to catalog
      </button>

      <div className="pdp-layout">
        {/* ---------- LEFT: Gallery ---------- */}
        <div className="pdp-gallery">
          <PdpHero shape={shape} tone={tone} angle={activeThumb} badge={product.badge} />
          <div className="pdp-thumbs">
            {[0, 1, 2, 3].map(i => (
              <div key={i}
                   className={`pdp-thumb ${activeThumb === i ? 'active' : ''}`}
                   onClick={() => setActiveThumb(i)}
                   style={{ background: i === 3 ? 'var(--ink)' : 'var(--paper-2)' }}>
                {i === 3 ? (
                  <span style={{ color: 'var(--paper)', fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', textAlign: 'center' }}>
                    SPEC<br/>SHEET
                  </span>
                ) : (
                  <ShapeIcon shape={shape} size={36} color={tone?.color || 'var(--ink-3)'} />
                )}
              </div>
            ))}
          </div>

          <div className="card card-pad" style={{ marginTop: 8 }}>
            <h3 style={{
              fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--fg-meta)', fontWeight: 700, margin: '0 0 14px',
            }}>Specifications</h3>
            <dl className="spec-table" style={{ marginBottom: 0 }}>
              <dt>SKU family</dt><dd style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{product.id}</dd>
              <dt>Material</dt><dd>{findCategory(product.cat)?.name}</dd>
              <dt>Tone</dt>
              <dd style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%',
                               background: tone?.color, border: '1px solid rgba(0,0,0,0.12)' }} />
                {tone?.name}
              </dd>
              <dt>Origin</dt><dd>Mumbai, India</dd>
              <dt>Certification</dt>
              <dd style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                GRA per stone <IconShield size={14} stroke="var(--emerald)" />
              </dd>
              <dt>Lead time</dt><dd>5–7 business days</dd>
            </dl>
          </div>
        </div>

        {/* ---------- RIGHT: Configurator ---------- */}
        <div className="pdp-info">
          <div className="crumb">
            <span onClick={() => setRoute({ name: 'catalog' })} style={{ cursor: 'pointer' }}>Catalog</span>
            {' / '}
            <span onClick={() => setRoute({ name: 'catalog', filter: { cat: product.cat } })} style={{ cursor: 'pointer' }}>
              {findCategory(product.cat)?.short}
            </span>
          </div>
          <h1>{product.name}</h1>
          <div className="sub">
            Calibrated {shapeMeta?.name.toLowerCase()} {findCategory(product.cat)?.short.toLowerCase()},
            supplied loose. Enter carat quantity against any size — minimum {moqCt} ct per size.
          </div>

          {/* ---- SHAPE ---- */}
          <div className="option-group">
            <div className="label">
              <span>Shape</span>
              <span style={{ color: 'var(--fg)', textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>
                {shapeMeta?.name}
              </span>
            </div>
            <div className="option-row" style={{ gap: 6 }}>
              {(matrix?.shapes || [product.shape]).map(s => {
                const isSel = s === shape;
                return (
                  <button key={s}
                          className={`option-pill ${isSel ? 'selected' : ''}`}
                          onClick={() => setShape(s)}
                          style={{
                            padding: 8, width: 60, height: 60,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', gap: 2,
                          }}>
                    <ShapeIcon shape={s} size={28}
                               color={isSel ? 'var(--paper)' : 'var(--ink)'} />
                    <span style={{ fontSize: 9, letterSpacing: '0.02em' }}>
                      {findShape(s)?.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ---- QUALITY ---- */}
          <div className="option-group">
            <div className="label">
              <span>Quality grade</span>
              <a style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 500, color: 'var(--sapphire)', cursor: 'pointer', fontSize: 12 }}>
                Grading guide
              </a>
            </div>
            <div className="option-row">
              {(matrix?.qualities || [product.clarity]).map(q => (
                <button key={q}
                        className={`option-pill ${q === quality ? 'selected' : ''}`}
                        onClick={() => setQuality(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* ---- SIZE × QTY ORDER PAD ---- */}
          <div className="option-group">
            <div className="label">
              <span>Size & quantity</span>
              <span style={{ color: 'var(--fg-meta)', textTransform: 'none', letterSpacing: 0, fontWeight: 500, fontSize: 12 }}>
                Enter carats against any size · MOQ {moqCt} ct per size
              </span>
            </div>
            <div className="size-pad">
              <div className="size-pad-head">
                <span>Size</span>
                <span style={{ textAlign: 'center' }}>Pcs / ct</span>
                <span style={{ textAlign: 'right' }}>₹ / ct</span>
                <span style={{ textAlign: 'center' }}>Carats</span>
                <span style={{ textAlign: 'right' }}>Line total</span>
              </div>
              {sizesForShape.map(s => {
                const pricePerCt = sizePerCtPrice(product, s);
                const pcs = pcsPerCt(s);
                const ct = qtyBySize[s] || 0;
                const lineTotal = ct * pricePerCt;
                const linePcs = Math.round(ct * pcs);
                const isFilled = ct > 0;
                const belowMoq = ct > 0 && ct < moqCt;
                return (
                  <div key={s} className={`size-pad-row ${isFilled ? 'filled' : ''} ${belowMoq ? 'below' : ''}`}>
                    <div className="size-pad-size">
                      <div className="size-pad-mm">{s.replace(' mm', '')}</div>
                      <div className="size-pad-unit">mm</div>
                    </div>
                    <div className="size-pad-pcs">{pcs.toLocaleString('en-IN')}</div>
                    <div className="size-pad-price">{formatINR(pricePerCt)}</div>
                    <div className="size-pad-input-wrap">
                      <div className="size-pad-stepper">
                        <button onClick={() => bumpQty(s, -stepCt)}
                                disabled={ct <= 0}
                                aria-label="decrease">
                          <IconMinus size={12} />
                        </button>
                        <input type="number"
                               value={ct || ''}
                               placeholder="0"
                               min={0}
                               step={stepCt}
                               onChange={(e) => updateQty(s, e.target.value)}
                               onFocus={(e) => e.target.select()} />
                        <button onClick={() => bumpQty(s, stepCt)} aria-label="increase">
                          <IconPlus size={12} />
                        </button>
                      </div>
                      {ct === 0 && (
                        <button className="size-pad-add" onClick={() => fillRow(s)}>
                          + Add {moqCt} ct
                        </button>
                      )}
                      {isFilled && (
                        <div className="size-pad-pcs-note">
                          ≈ {linePcs.toLocaleString('en-IN')} pcs
                        </div>
                      )}
                    </div>
                    <div className="size-pad-total">
                      {isFilled ? formatINR(lineTotal) : <span style={{ color: 'var(--ink-4)' }}>—</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ---- ORDER SUMMARY ---- */}
          <div className="order-summary">
            <div className="order-summary-stats">
              <div>
                <div className="stat-label">Sizes selected</div>
                <div className="stat-value">{lines.length}</div>
              </div>
              <div>
                <div className="stat-label">Total carats</div>
                <div className="stat-value">{totalCt.toLocaleString('en-IN')} ct</div>
              </div>
              <div>
                <div className="stat-label">Approx pieces</div>
                <div className="stat-value">{totalPcs.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div className="stat-label">Order total</div>
                <div className="stat-value money">{formatINR(totalAmount)}</div>
              </div>
            </div>

            <div className="pdp-cta">
              <button className="btn btn-accent btn-lg btn-block"
                      onClick={onAddAll}
                      disabled={lines.length === 0}
                      style={{ opacity: lines.length === 0 ? 0.45 : 1, cursor: lines.length === 0 ? 'not-allowed' : 'pointer' }}>
                <IconBag size={18} />
                {lines.length === 0
                  ? 'Enter quantities to continue'
                  : `Add ${lines.length} size${lines.length > 1 ? 's' : ''} to order`}
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => toggleWishlist(product.id)}>
                {wishlist.has(product.id) ? <IconHeartFill size={18} /> : <IconHeart size={18} />}
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => setQtyBySize({})}
                      disabled={lines.length === 0}>
                Clear
              </button>
            </div>
          </div>

          {/* ---- Trust mini-row ---- */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
            <MiniTrust icon={<IconTruck size={16} />} title="Insured shipping" desc="BlueDart / DTDC / DHL" />
            <MiniTrust icon={<IconShield size={16} />} title="GRA verified" desc="Per-stone certificate" />
            <MiniTrust icon={<IconRefresh size={16} />} title="7-day returns" desc="On calibration mismatch" />
            <MiniTrust icon={<IconWhats size={16} />} title="Trade desk" desc="+91 77100 65480" />
          </div>
        </div>
      </div>

      {/* ---------- Related products ---------- */}
      <div style={{ marginTop: 64 }}>
        <div className="section-head">
          <h2>More from {findCategory(product.cat)?.short}</h2>
        </div>
        <div className="product-grid">
          {PRODUCTS.filter(p => p.cat === product.cat && p.id !== product.id).slice(0, 4).map(p => (
            <ProductCard key={p.id} product={p}
              onOpen={() => { setRoute({ name: 'product', pid: p.id }); window.scrollTo(0, 0); }}
              isWishlisted={wishlist.has(p.id)}
              onWishlist={(e) => { e.stopPropagation(); toggleWishlist(p.id); }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PdpHero({ shape, tone, angle, badge }) {
  const c = tone?.color || '#7A6F5C';
  const rotation = angle * 18;
  return (
    <div className="pdp-main-img" style={{
      background: `radial-gradient(circle at 30% 25%, ${lightenTone(c)}, var(--paper-2))`,
    }}>
      {badge && (
        <span style={{
          position: 'absolute', top: 18, left: 18,
          background: 'var(--ink)', color: 'var(--paper)',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          padding: '5px 10px', borderRadius: 4, textTransform: 'uppercase',
        }}>{badge}</span>
      )}
      <div style={{
        width: '58%', height: '58%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `rotate(${rotation}deg)`,
        transition: 'transform 320ms cubic-bezier(0.2, 0.7, 0.3, 1)',
      }}>
        <div style={{
          background: `radial-gradient(circle at 32% 28%, ${tintColor(c, 1.35)} 0%, ${c} 60%, ${tintColor(c, 0.55)} 100%)`,
          width: '100%', height: '100%',
          borderRadius: '50%',
          boxShadow: 'inset -16px -16px 50px rgba(0,0,0,0.32), inset 12px 12px 36px rgba(255,255,255,0.45), 0 18px 40px rgba(21,19,15,0.20)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ShapeIcon shape={shape} size={120} color="rgba(255,255,255,0.55)" />
        </div>
      </div>
      <div style={{
        position: 'absolute', bottom: 16, right: 18,
        fontFamily: 'var(--font-mono)', fontSize: 11,
        color: 'var(--fg-meta)', letterSpacing: '0.05em',
      }}>
        VIEW {String(angle + 1).padStart(2, '0')} / 04
      </div>
    </div>
  );
}

function MiniTrust({ icon, title, desc }) {
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      padding: '10px 12px',
      background: 'var(--paper-2)',
      borderRadius: 'var(--r-md)',
    }}>
      <div style={{ color: 'var(--emerald)', flex: '0 0 16px', paddingTop: 2 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--fg-meta)' }}>{desc}</div>
      </div>
    </div>
  );
}

function tintColor(hex, factor) {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return hex;
  const c = m[1].match(/.{2}/g).map(h => parseInt(h, 16));
  const out = c.map(v => Math.min(255, Math.max(0, Math.round(v * factor))));
  return `rgb(${out.join(',')})`;
}

Object.assign(window, { ProductScreen });
