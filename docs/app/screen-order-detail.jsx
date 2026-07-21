// screen-order-detail.jsx — Single order view with timeline + line items + invoice summary

function OrderDetailScreen({ route, setRoute, persona, addToCart }) {
  // Look the order up on the server first — the demo ORDERS book belongs to the
  // sample personas, so reading it here showed a stranger's order to whoever was
  // signed in. Local copies still cover an order placed moments ago or offline.
  const [remote, setRemote] = React.useState(null);
  React.useEffect(() => {
    var token;
    try { token = localStorage.getItem('eurostar_token'); } catch (e) {}
    if (!token) { setRemote([]); return; }
    fetch((window.EUROSTAR_API || location.origin) + '/orders', {
      headers: { authorization: 'Bearer ' + token },
    })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) { setRemote(Array.isArray(rows) ? rows : []); })
      .catch(function () { setRemote([]); });
  }, [route.oid]);

  const local = window.loadMyOrders ? loadMyOrders(persona) : [];
  const order = [...(remote || []), ...local].find(o => o.id === route.oid);

  // Still loading the server copy — don't flash "not found" at a real order.
  if (!order && remote === null) {
    return <div className="page"><div className="empty"><h3>Loading…</h3></div></div>;
  }
  if (!order) {
    return (
      <div className="page">
        <div className="empty">
          <h3>Order not found</h3>
          <button className="btn btn-secondary" onClick={() => setRoute({ name: 'orders' })}>
            Back to orders
          </button>
        </div>
      </div>
    );
  }

  const status = STATUS_META[order.status];
  // Placed orders carry the total they were actually charged.
  const total = typeof order.placedTotal === 'number' ? order.placedTotal : orderTotal(order);
  const itemCount = orderQty(order);
  const tax = Math.round(total * 0.03); // IGST 3% for export, GST varies; using rough 3% for prototype
  const shipping = order.ship.includes('DHL') ? 8500 : 1200;
  const grand = total + tax + shipping;

  return (
    <div className="page">
      <button className="btn btn-ghost btn-sm" onClick={() => setRoute({ name: 'orders' })}
              style={{ marginBottom: 16, marginLeft: -8 }}>
        <IconArrowLeft size={16} /> All orders
      </button>

      <div className="page-head">
        <div>
          <div className="crumb" style={{ fontFamily: 'var(--font-mono)', textTransform: 'none', letterSpacing: '0.04em' }}>
            {order.id}
          </div>
          <h1>Order on {formatDate(order.date)}</h1>
          <p>
            <span className={`chip chip-${status.tone} chip-dot`}>{status.label}</span>
            {' '}· Expected by {formatDate(order.expected)} · {order.ship}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary"><IconDownload size={16} /> Invoice PDF</button>
          <button className="btn btn-secondary"><IconWhats size={16} /> Message trade desk</button>
        </div>
      </div>

      <div className="od-layout">
        {/* LEFT: Line items + timeline */}
        <div>
          <div className="card card-pad" style={{ padding: '8px 22px' }}>
            <h3 style={{
              fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--fg-meta)', fontWeight: 700,
              margin: '14px 0', paddingBottom: 10, borderBottom: '1px solid var(--divider)',
            }}>
              Line items · {order.lines.length} SKU{order.lines.length > 1 ? 's' : ''} · {itemCount.toLocaleString('en-IN')} pcs
            </h3>
            {order.lines.map((l, i) => {
              const p = findProduct(l.pid);
              if (!p) return null;
              const tone = findTone(p.tone);
              return (
                <div key={i} className="line-item">
                  <div className="line-item-art" style={{ background: lightenTone(tone?.color || '#E5E0D5') }}>
                    <ShapeIcon shape={p.shape} size={36} color={tone?.color || 'var(--ink)'} />
                  </div>
                  <div>
                    <div className="line-item-name"
                         onClick={() => setRoute({ name: 'product', pid: p.id })}
                         style={{ cursor: 'pointer' }}>
                      {p.name}
                    </div>
                    <div className="line-item-meta">
                      <span>{findShape(p.shape)?.name}</span>
                      <span>{p.size}</span>
                      <span>{p.clarity}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--fg-meta)', marginTop: 4,
                                  fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>
                      {p.id}
                    </div>
                  </div>
                  <div className="line-item-amt">
                    <div className="qty">{l.qty.toLocaleString('en-IN')} × {formatINR(p.price)}</div>
                    <div className="total">{formatINR(p.price * l.qty)}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline */}
          <div className="card card-pad" style={{ marginTop: 16 }}>
            <h3 style={{
              fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--fg-meta)', fontWeight: 700, margin: '0 0 18px',
            }}>Tracking</h3>
            <OrderTimeline order={order} />
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="card card-pad" style={{ marginTop: 16 }}>
              <h3 style={{
                fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--fg-meta)', fontWeight: 700, margin: '0 0 8px',
              }}>Notes from you</h3>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                "{order.notes}"
              </p>
            </div>
          )}
        </div>

        {/* RIGHT: Summary + Address */}
        <div>
          <div className="card card-pad">
            <h3 style={{
              fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--fg-meta)', fontWeight: 700, margin: '0 0 14px',
            }}>Invoice summary</h3>
            <div className="summary-row">
              <span style={{ color: 'var(--fg-muted)' }}>Subtotal · {itemCount.toLocaleString('en-IN')} pcs</span>
              <span>{formatINR(total)}</span>
            </div>
            <div className="summary-row">
              <span style={{ color: 'var(--fg-muted)' }}>{order.ship.includes('DHL') ? 'IGST · export' : 'GST · 3%'}</span>
              <span>{formatINR(tax)}</span>
            </div>
            <div className="summary-row">
              <span style={{ color: 'var(--fg-muted)' }}>Shipping & insurance</span>
              <span>{formatINR(shipping)}</span>
            </div>
            <div className="summary-row total">
              <span>Total payable</span>
              <span>{formatINR(grand)}</span>
            </div>
            <div style={{
              marginTop: 14, padding: '10px 12px',
              background: 'var(--paper-2)', borderRadius: 'var(--r-md)',
              fontSize: 12, color: 'var(--fg-muted)',
            }}>
              <strong style={{ color: 'var(--fg)' }}>{order.paymentTerm}</strong> · invoice due {formatDate(order.expected)}
            </div>
          </div>

          <div className="card card-pad" style={{ marginTop: 16 }}>
            <h3 style={{
              fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--fg-meta)', fontWeight: 700, margin: '0 0 14px',
            }}>Shipping to</h3>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
              {persona.company}
            </div>
            <div style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
              c/o {persona.contact}<br/>
              {persona.location}<br/>
              {persona.phone}
            </div>
            <div style={{
              marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--divider)',
              fontSize: 12, color: 'var(--fg-meta)',
            }}>
              <div style={{ marginBottom: 4 }}><strong style={{ color: 'var(--fg)' }}>Carrier</strong></div>
              {order.ship}
            </div>
          </div>

          <div className="card card-pad" style={{ marginTop: 16 }}>
            <h3 style={{
              fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--fg-meta)', fontWeight: 700, margin: '0 0 14px',
            }}>Need something?</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-secondary btn-block" style={{ justifyContent: 'flex-start' }} onClick={() => {
                let n = 0;
                order.lines.forEach((l) => {
                  const p = findProduct(l.pid);
                  if (!p) return;
                  const tone = findTone(p.tone);
                  addToCart && addToCart({
                    pid: p.id, name: p.name, shape: p.shape, size: p.size,
                    quality: p.clarity || p.quality || '', color: tone ? tone.name : '', toneHex: tone ? tone.color : '',
                    unitMode: 'pc', ct: l.qty, qty: l.qty, perCtPrice: p.price, unitPrice: p.price,
                    lineTotal: p.price * l.qty,
                  });
                  n++;
                });
                if (n) setRoute({ name: 'orders', tab: 'cart' });
              }}>
                <IconRefresh size={16} /> Reorder same items
              </button>
              <button className="btn btn-secondary btn-block" style={{ justifyContent: 'flex-start' }}>
                <IconDoc size={16} /> Download packing list
              </button>
              <button className="btn btn-ghost btn-block" style={{ justifyContent: 'flex-start', color: 'var(--ruby)' }}>
                <IconX size={16} /> Request cancellation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderTimeline({ order }) {
  const stages = [
    { id: 'placed',    label: 'Order placed',  meta: formatDate(order.date) },
    { id: 'confirmed', label: 'Confirmed by Eurostar',  meta: 'Within 24h' },
    { id: 'packed',    label: 'Packed & sealed', meta: 'Mumbai warehouse' },
    { id: 'shipped',   label: 'In transit',     meta: order.ship },
    { id: 'delivered', label: 'Delivered',      meta: order.status === 'delivered' ? formatDate(order.expected) : `Expected ${formatDate(order.expected)}` },
  ];
  const order_idx = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];
  const currentIdx = order_idx.indexOf(order.status);
  return (
    <div className="timeline">
      {stages.map((s, i) => {
        const done = i < currentIdx + (order.status === 'pending' ? 1 : 0)
                  || (order.status === 'delivered' && i <= currentIdx + 1);
        const isDone = i <= currentIdx;
        const isCurrent = i === currentIdx + (order.status === 'pending' ? 1 : 0) - 1
                       && order.status !== 'delivered';
        const cls = i < currentIdx ? 'done'
                  : i === currentIdx ? (order.status === 'delivered' ? 'done' : 'current')
                  : '';
        return (
          <div key={s.id} className={`tl-step ${cls}`}>
            <div className="tl-title">{s.label}</div>
            <div className="tl-meta">{s.meta}</div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { OrderDetailScreen });
