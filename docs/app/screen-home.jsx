// screen-home.jsx — Catalog landing page

const CAT_ORDER_KEY = 'eurostar.catOrder.v1';
const CAT_THUMB_KEY = 'eurostar-cat-thumbs-v1';
const SHAPE_THUMB_KEY = 'eurostar-shape-thumbs-v1';
function loadThumbStore(key) {
  try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e) { return {}; }
}
function loadCatOrder() {
  try { const v = JSON.parse(localStorage.getItem(CAT_ORDER_KEY)); return Array.isArray(v) ? v : null; }
  catch (e) { return null; }
}
function saveCatOrder(ids) {
  try { localStorage.setItem(CAT_ORDER_KEY, JSON.stringify(ids)); } catch (e) {}
}
// Reconcile a saved id order against the live CATEGORIES list:
// keep saved order, drop ids that no longer exist, append any new categories at the end.
function reconcileCatOrder(ids) {
  const byId = {};
  CATEGORIES.forEach((c) => { byId[c.id] = c; });
  const seen = {};
  const out = [];
  (ids || []).forEach((id) => { if (byId[id] && !seen[id]) { out.push(id); seen[id] = 1; } });
  CATEGORIES.forEach((c) => { if (!seen[c.id]) out.push(c.id); });
  return out;
}

function HomeScreen({ persona, setRoute }) {
  // Real count for the signed-in customer. This used to read
  // persona.deliveredCount + persona.pendingCount — numbers hardcoded on the
  // demo personas — so a brand-new account was greeted with "22 lifetime
  // orders" it had never placed.
  const [myOrderCount, setMyOrderCount] = React.useState(null);
  React.useEffect(() => {
    var token;
    try { token = localStorage.getItem('eurostar_token'); } catch (e) {}
    if (!token) { setMyOrderCount(0); return; }
    fetch((window.EUROSTAR_API || location.origin) + '/orders', {
      headers: { authorization: 'Bearer ' + token },
    })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) { setMyOrderCount(Array.isArray(rows) ? rows.length : 0); })
      .catch(function () { setMyOrderCount(0); });
  }, []);

  const [order, setOrder] = React.useState(() => reconcileCatOrder(loadCatOrder()));
  const [arrange, setArrange] = React.useState(false);
  const [dragId, setDragId] = React.useState(null);
  const catById = React.useMemo(() => {
    const m = {}; CATEGORIES.forEach((c) => { m[c.id] = c; }); return m;
  }, []);
  const cats = order.map((id) => catById[id]).filter(Boolean);
  const catThumbs = loadThumbStore(CAT_THUMB_KEY);
  const shapeThumbs = loadThumbStore(SHAPE_THUMB_KEY);

  const onDragStart = (e, id) => { setDragId(id); e.dataTransfer.effectAllowed = 'move'; };
  const onDragOver = (e, overId) => {
    e.preventDefault();
    if (dragId == null || dragId === overId) return;
    setOrder((prev) => {
      const a = prev.slice();
      const from = a.indexOf(dragId), to = a.indexOf(overId);
      if (from < 0 || to < 0) return prev;
      a.splice(from, 1); a.splice(to, 0, dragId);
      return a;
    });
  };
  const onDrop = () => { saveCatOrder(order); setDragId(null); };
  const onDragEnd = () => { saveCatOrder(order); setDragId(null); };
  const resetOrder = () => { const d = CATEGORIES.map((c) => c.id); setOrder(d); saveCatOrder(d); };

  return (
    <div className="page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-eyebrow">WHOLESALE PORTAL · MUMBAI & JAIPUR</div>
        <h1>Makes <em>true</em> beauty,<br />by the lot.</h1>
        <p>40 years sourcing moissanite, lab-grown gems, Color Cubic Zirconia, mother of pearl and pearls — calibrated, certified, delivered. Order from our trade catalog.
        </p>
        <div className="hero-cta-row">
          <button className="btn btn-accent btn-lg" onClick={() => setRoute({ name: 'orders' })}>
            View your orders <IconChev size={16} />
          </button>
        </div>
        <div className="hero-stats">
          <div><strong>40</strong>Years in operation</div>
          <div><strong>28,000+</strong>Active SKUs</div>
          <div><strong>12,400</strong>Trade buyers globally</div>
          <div><strong>{myOrderCount === null ? '—' : myOrderCount}</strong>Your lifetime orders</div>
        </div>
      </section>

      {/* Categories */}
      <div className="section-head">
        <h2>Shop by category</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {arrange &&
          <button className="btn btn-ghost" style={{ padding: '6px 12px' }} onClick={resetOrder}>
            Reset order
          </button>}
          <button className={arrange ? 'btn btn-accent' : 'btn btn-ghost'} style={{ padding: '6px 14px' }}
            onClick={() => { if (arrange) saveCatOrder(order); setArrange(!arrange); }}>
            {arrange ? 'Done arranging' : 'Arrange categories'}
          </button>
          {!arrange && <span className="meta">{CATEGORIES.length} product families</span>}
        </div>
      </div>
      {arrange &&
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 16px',
        padding: '10px 14px', background: 'var(--emerald-soft)', color: 'var(--emerald-ink)',
        borderRadius: 'var(--r-md)', fontSize: 13.5, fontWeight: 500
      }}>
        <IconDrag size={16} /> Drag the cards to set the order customers see. Your arrangement saves automatically.
      </div>}
      <div className="cat-grid">
        {cats.map((c) =>
        <div key={c.id} className="cat-card"
        draggable={arrange}
        onDragStart={arrange ? (e) => onDragStart(e, c.id) : undefined}
        onDragOver={arrange ? (e) => onDragOver(e, c.id) : undefined}
        onDrop={arrange ? onDrop : undefined}
        onDragEnd={arrange ? onDragEnd : undefined}
        onClick={arrange ? undefined : () => setRoute({ name: 'browse', cat: c.id })}
        style={arrange ? {
          cursor: 'grab',
          opacity: dragId === c.id ? 0.4 : 1,
          outline: '1.5px dashed var(--border-strong)', outlineOffset: -2,
          position: 'relative'
        } : undefined}>
            {arrange &&
            <div style={{
              position: 'absolute', top: 10, right: 10, color: 'var(--fg-meta)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}><IconDrag size={18} /></div>}
            {(() => {
              // Explicit category thumbnail wins; otherwise auto-use the first
              // real product photo uploaded for this category; else the vector art.
              const thumb = catThumbs[c.id] || (window.firstProductImageForCat && window.firstProductImageForCat(c.id));
              // Whole image, never cropped (contain); white backing so the
              // white-background product photos blend in with no visible bars.
              return (
                <div className="cat-card-art" style={thumb ? { background: '#fff' } : undefined}>
                  {thumb
                    ? <img src={thumb} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }} />
                    : <CategoryArt cat={c.id} />}
                </div>
              );
            })()}
            <div>
              <div className="cat-card-name">{c.name}</div>
            </div>
          </div>
        )}
      </div>

      {/* Shapes */}
      <div className="section-head" style={{ marginTop: 36 }}>
        <h2>Shapes of excellence</h2>
        <span className="meta">15 calibrated cuts</span>
      </div>
      <div className="shape-grid" style={{ marginBottom: 56 }}>
        {SHAPES.map((s) =>
        <div key={s.id} className="shape-card"
        onClick={() => setRoute({ name: 'catalog', filter: { shape: s.id } })}>
            {shapeThumbs[s.id]
              ? <img src={shapeThumbs[s.id]} alt={s.name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 'var(--r-sm)' }} />
              : <ShapeIcon shape={s.id} size={44} />}
            <div className="name">{s.name}</div>
          </div>
        )}
      </div>

      {/* Testimonials */}
      <div className="section-head">
        <h2>Trusted by the trade</h2>
        <span className="meta">Manufacturers &amp; ateliers across India</span>
      </div>
      <div className="testi-grid">
        {[
          { quote: 'We\u2019ve moved our entire melee moissanite line to Eurostar. The calibration is dead-on \u2014 our casting reject rate dropped noticeably and matched pairs actually match.',
            name: 'Procurement Head', org: 'Tanvi Gold Cast', initials: 'TG', tag: 'Bulk · Moissanite & CZ', big: true },
          { quote: 'Consistency at volume is what matters to us. Lot after lot, the colour grades hold. Their GRA-marked stones clear our QC without back-and-forth.',
            name: 'Sourcing Team', org: 'Malabar Gold & Diamonds', initials: 'MG', tag: 'Enterprise · Lab-grown', big: true },
          { quote: 'For studded collections we need reliable supply and certificates we can stand behind. Eurostar has been a dependable partner on both.',
            name: 'Merchandising', org: 'Tanishq (vendor network)', initials: 'TQ', tag: 'Certified · Lab-grown', big: true },
          { quote: 'I run a small unit in Rajkot \u2014 they still treat my 200-piece orders seriously. Sizes are always in stock and shipped same week.',
            name: 'Jignesh P.', org: 'Shree Ganesh Jewellers, Rajkot', initials: 'JP', tag: 'Independent buyer' },
          { quote: 'The packet system makes reordering simple. I know exactly how many pieces I\u2019m getting per size, and pricing is transparent.',
            name: 'Farida K.', org: 'Crescent Ornaments, Hyderabad', initials: 'FK', tag: 'Independent buyer' },
          { quote: 'Started with one tray of Color CZ, now I order across six categories. The strips and pearl strings are a real time-saver for my karigars.',
            name: 'Anil M.', org: 'Mehta Jewel Works, Surat', initials: 'AM', tag: 'Independent buyer' },
        ].map((t, i) => (
          <figure key={i} className={`testi-card ${t.big ? 'big' : ''}`}>
            <div className="testi-quote-mark">&ldquo;</div>
            <blockquote>{t.quote}</blockquote>
            <figcaption>
              <div className="testi-avatar">{t.initials}</div>
              <div>
                <div className="testi-org">{t.org}</div>
                <div className="testi-name">{t.name} · {t.tag}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* Trust strip */}
      <div className="card card-pad" style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24,
        padding: 28
      }}>
        <TrustItem icon={<IconShield size={22} />} title="GRA-verified Moissanite"
        desc="Every loose stone laser-marked, verifiable on gra-gems.com" />
        <TrustItem icon={<IconBox size={22} />} title="Calibrated to spec"
        desc="Tighter than ±0.05mm tolerance across paired sets" />
        <TrustItem icon={<IconTruck size={22} />} title="Trade-only shipping"
        desc="Insured & sealed parcels via BlueDart, DTDC, DHL Export" />
        <TrustItem icon={<IconRefresh size={22} />} title="Easy returns"
        desc="7-day return on defects, exchange on calibration mismatch" />
      </div>
    </div>);

}

function TrustItem({ icon, title, desc }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--r-md)',
        background: 'var(--emerald-soft)', color: 'var(--emerald-ink)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flex: '0 0 40px'
      }}>{icon}</div>
      <div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 500, marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.45 }}>{desc}</div>
      </div>
    </div>);

}

function CategoryArt({ cat }) {
  // Inline arrangements of gem silhouettes — placeholder art for each category
  const map = {
    moissanite: ['round', 'round', 'oval'],
    cz: ['round', 'cushion', 'marquise'],
    labgrown: ['oval', 'pear', 'cushion'],
    fancycut: ['trillion', 'baguette', 'pear'],
    mop: ['round', 'round'],
    pearls: ['round', 'round', 'round'],
    navratna: ['cushion', 'round', 'oval'],
    beads: ['round', 'round', 'round', 'round']
  };
  const tones = {
    moissanite: ['#F2EFE8', '#F2EFE8', '#F2EFE8'],
    cz: ['#E6A4B4', '#5B7BC4', '#3E8E4F'],
    labgrown: ['#1E3A8A', '#E6A4B4', '#8B1E2E'],
    fancycut: ['#F2EFE8', '#F2EFE8', '#F2EFE8'],
    mop: ['#F2EFE8', '#E5E0D5'],
    pearls: ['#F2EFE8', '#E5E0D5', '#F2EFE8'],
    navratna: ['#8B1E2E', '#E2B43A', '#1E3A8A'],
    beads: ['#9C7DC2', '#3E8E4F', '#E2B43A', '#8B1E2E']
  };
  const shapes = map[cat] || ['round'];
  const colors = tones[cat] || ['#7A6F5C'];
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      {shapes.map((s, i) =>
      <div key={i} style={{
        background: colors[i],
        width: 48, height: 48,
        borderRadius: 'var(--r-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.12)'
      }}>
          <ShapeIcon shape={s} size={32} color="rgba(255,255,255,0.7)" />
        </div>
      )}
    </div>);

}

Object.assign(window, { HomeScreen });