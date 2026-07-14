// screen-catalog.jsx — Product catalog grid with filters

function CatalogScreen({ route, setRoute, persona, addToCart, wishlist, toggleWishlist }) {
  const initial = route.filter || {};
  const [filters, setFilters] = React.useState({
    cat: initial.cat || 'all',
    shape: initial.shape || 'all',
    tone: initial.tone || 'all',
    stock: 'all',
    search: '',
    sort: 'featured',
  });
  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false);

  React.useEffect(() => {
    if (route.filter) {
      setFilters(f => ({ ...f, ...route.filter }));
    }
  }, [route.filter]);

  const filtered = React.useMemo(() => {
    let list = PRODUCTS.slice();
    if (filters.cat   !== 'all') list = list.filter(p => p.cat === filters.cat);
    if (filters.shape !== 'all') list = list.filter(p => p.shape === filters.shape);
    if (filters.tone  !== 'all') list = list.filter(p => p.tone === filters.tone);
    if (filters.stock === 'in')  list = list.filter(p => p.stock !== 'out');
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (findTone(p.tone)?.name.toLowerCase().includes(q))
      );
    }
    if (filters.sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (filters.sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (filters.sort === 'newest') list = list.slice().reverse();
    return list;
  }, [filters]);

  const setF = (k, v) => setFilters(prev => ({ ...prev, [k]: v }));

  const catChip = filters.cat !== 'all' && findCategory(filters.cat);
  const shapeChip = filters.shape !== 'all' && findShape(filters.shape);
  const toneChip = filters.tone !== 'all' && findTone(filters.tone);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumb">Catalog</div>
          <h1>{catChip ? catChip.name : 'All products'}</h1>
          <p>{catChip ? catChip.blurb : 'Browse 28,000+ active SKUs across moissanite, lab-grown gems, color CZ, mother of pearl and pearls.'}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="search-wrap" style={{ maxWidth: 260 }}>
            <IconSearch size={16} />
            <input className="search-input"
                   placeholder="Search SKU, color, name…"
                   value={filters.search}
                   onChange={(e) => setF('search', e.target.value)} />
          </div>
          <button className="btn btn-secondary" onClick={() => setMobileFilterOpen(o => !o)}
                  style={{ display: 'none' }}>
            <IconFilter size={16} /> Filters
          </button>
        </div>
      </div>

      <div className="product-layout">
        <aside className={`filter-panel ${mobileFilterOpen ? 'open' : ''}`}>
          <FilterGroup label="Category" items={[{ id: 'all', name: 'All categories', count: PRODUCTS.length },
              ...CATEGORIES.map(c => ({ id: c.id, name: c.short, count: PRODUCTS.filter(p => p.cat === c.id).length }))]}
            value={filters.cat} onChange={(v) => setF('cat', v)} />
          <FilterGroup label="Shape" items={[{ id: 'all', name: 'Any shape' },
              ...SHAPES.filter(s => PRODUCTS.some(p => p.shape === s.id)).map(s => ({ id: s.id, name: s.name, count: PRODUCTS.filter(p => p.shape === s.id).length }))]}
            value={filters.shape} onChange={(v) => setF('shape', v)} />
          <FilterGroup label="Tone" items={[{ id: 'all', name: 'Any tone' },
              ...TONES.filter(t => PRODUCTS.some(p => p.tone === t.id)).map(t => ({ id: t.id, name: t.name, count: PRODUCTS.filter(p => p.tone === t.id).length, swatch: t.color }))]}
            value={filters.tone} onChange={(v) => setF('tone', v)} />
          <FilterGroup label="Stock" items={[
            { id: 'all', name: 'All' },
            { id: 'in', name: 'In stock only' },
          ]} value={filters.stock} onChange={(v) => setF('stock', v)} />

          {(catChip || shapeChip || toneChip || filters.stock !== 'all') && (
            <button className="btn btn-ghost btn-sm"
                    onClick={() => setFilters({ cat:'all', shape:'all', tone:'all', stock:'all', search:'', sort:'featured' })}
                    style={{ marginTop: 8 }}>
              <IconX size={14} /> Clear filters
            </button>
          )}
        </aside>

        <div>
          <div className="product-toolbar">
            <div className="count">
              Showing <strong>{filtered.length}</strong> of {PRODUCTS.length}
              {(catChip || shapeChip || toneChip) && <>
                {' · '}
                {catChip   && <span className="chip" style={{ marginLeft: 4 }}>{catChip.short}<IconX size={12} onClick={() => setF('cat', 'all')} style={{ cursor: 'pointer' }} /></span>}
                {shapeChip && <span className="chip" style={{ marginLeft: 4 }}>{shapeChip.name}<IconX size={12} onClick={() => setF('shape', 'all')} style={{ cursor: 'pointer' }} /></span>}
                {toneChip  && <span className="chip" style={{ marginLeft: 4 }}>{toneChip.name}<IconX size={12} onClick={() => setF('tone', 'all')} style={{ cursor: 'pointer' }} /></span>}
              </>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--fg-meta)' }}>Sort by</span>
              <select value={filters.sort} onChange={(e) => setF('sort', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--r-md)',
                        fontSize: 13, fontFamily: 'inherit', color: 'var(--fg)',
                        cursor: 'pointer',
                      }}>
                <option value="featured">Featured</option>
                <option value="price-asc">Price · low to high</option>
                <option value="price-desc">Price · high to low</option>
                <option value="newest">Newest first</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty">
              <IconSearch size={36} stroke="var(--ink-4)" />
              <h3>No products match these filters</h3>
              <p>Try widening your search or clearing some filters.</p>
            </div>
          ) : (
            <div className="product-grid">
              {filtered.map(p => (
                <ProductCard key={p.id} product={p}
                  onOpen={() => setRoute({ name: 'product', pid: p.id })}
                  isWishlisted={wishlist.has(p.id)}
                  onWishlist={(e) => { e.stopPropagation(); toggleWishlist(p.id); }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, items, value, onChange }) {
  return (
    <div className="filter-group">
      <h3>{label}</h3>
      <div className="filter-list">
        {items.map(it => (
          <div key={it.id}
               className={`filter-row ${value === it.id ? 'active' : ''}`}
               onClick={() => onChange(it.id)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              {it.swatch && <span style={{
                width: 14, height: 14, borderRadius: '50%', background: it.swatch,
                border: '1px solid rgba(0,0,0,0.12)', flex: '0 0 14px',
              }} />}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</span>
            </span>
            {it.count != null && <span className="count">{it.count}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product, onOpen, isWishlisted, onWishlist }) {
  const tone = findTone(product.tone);
  const stockLabel = product.stock === 'low' ? `Low · ${product.stockCount}`
                   : product.stock === 'out' ? 'Out of stock'
                   : `${product.stockCount.toLocaleString('en-IN')} in stock`;
  return (
    <div className="product-card" onClick={onOpen}>
      <div className="product-img" style={{ background: lightenTone(tone?.color || '#E5E0D5') }}>
        {product.badge && <span className="tag">{product.badge}</span>}
        <button className={`wishlist ${isWishlisted ? 'active' : ''}`} onClick={onWishlist}
                aria-label="Add to wishlist">
          {isWishlisted ? <IconHeartFill size={16} /> : <IconHeart size={16} />}
        </button>
        <div style={{
          width: '64%', height: '64%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: tone?.color || '#7A6F5C',
            width: '100%', height: '100%',
            borderRadius: '50%',
            boxShadow: 'inset -8px -8px 24px rgba(0,0,0,0.22), inset 6px 6px 18px rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0.95,
          }}>
            <ShapeIcon shape={product.shape} size={56} color="rgba(255,255,255,0.55)" />
          </div>
        </div>
      </div>
      <div className="product-body">
        <div className="product-name">{product.name}</div>
        <div className="product-meta">
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--fg-muted)' }}>
            {findShape(product.shape)?.name}
          </span>
          <span>{product.size}</span>
          <span>{product.clarity}</span>
        </div>
        <div className="product-price-row">
          <div>
            <span className="product-price">{formatINR(product.price)}</span>
            <span className="product-price-unit" style={{ marginLeft: 4 }}>{product.unit}</span>
          </div>
          <div className={`product-stock ${product.stock === 'low' ? 'low' : product.stock === 'out' ? 'out' : ''}`}>
            {stockLabel}
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--fg-meta)', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>
          MOQ {product.moq} · {product.id}
        </div>
      </div>
    </div>
  );
}

// helper: produce a desaturated tinted background for product cards
function lightenTone(hex) {
  // simple mix with paper
  const paper = [246, 241, 230];
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return '#EFE7D4';
  const c = m[1].match(/.{2}/g).map(h => parseInt(h, 16));
  const out = c.map((v, i) => Math.round(v * 0.18 + paper[i] * 0.82));
  return `rgb(${out.join(',')})`;
}

Object.assign(window, { CatalogScreen, ProductCard, lightenTone });
