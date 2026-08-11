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
      .then(function (rows) { setRemote(Array.isArray(rows) ? rows.map(normaliseOrder) : []); })
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

  // Invoice PDF.
  //
  // This button had no click handler at all — it looked like a feature and did
  // nothing. Built the same way the cart's proforma is: lay the invoice out as
  // a print stylesheet and hand it to the browser's own PDF writer, which every
  // phone and desktop already has. No library, no server round trip, and the
  // customer gets a real file they can forward to their accountant.
  const invoiceHTML = () => {
    const rows = order.lines.map((l) => {
      const p = findProduct(l.pid) || {};
      const shape = (findShape(p.shape) || {}).name || p.shape || '';
      // Some orders store the money on the order and leave the line at zero.
      // Printing "₹0" next to 2,000 pieces states a price that is not true, so
      // those cells show a dash and the totals below carry the real figures.
      const rate = l.unitPrice || p.price || 0;
      const amount = l.lineTotal || (rate ? rate * (l.qty || 0) : 0);
      return `<tr>
        <td>${(p.name || l.pid || '')}${p.tone ? ' · ' + ((findTone(p.tone) || {}).name || p.tone) : ''}</td>
        <td>${shape}</td>
        <td>${p.size || ''}</td>
        <td style="text-align:right">${(l.qty || 0).toLocaleString('en-IN')}</td>
        <td style="text-align:right">${rate ? formatINR(rate) : '—'}</td>
        <td style="text-align:right">${amount ? formatINR(amount) : '—'}</td></tr>`;
    }).join('');

    const shipTo = [
      persona.company || '',
      persona.contact ? 'c/o ' + persona.contact : '',
      persona.location || '',
      persona.phone || '',
    ].filter(Boolean).join('<br>');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${order.id}</title>
      <style>
        @page { margin: 18mm; }
        body { font-family: Georgia, 'Times New Roman', serif; color: #15130f; font-size: 13px; }
        .head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #0E5C4A; padding-bottom:14px; }
        .brand { font-size:26px; font-weight:700; color:#0E5C4A; letter-spacing:-0.01em; }
        .brand small { display:block; font-size:11px; color:#6a6253; font-weight:400; letter-spacing:0.04em; }
        h1 { font-size:20px; margin:0; }
        .meta { font-size:12px; color:#555; }
        .bill { margin:16px 0; font-size:12px; line-height:1.6; }
        table { width:100%; border-collapse:collapse; margin-top:10px; }
        th { text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:0.06em; color:#6a6253; border-bottom:1px solid #c9c0ad; padding:8px 6px; }
        td { padding:9px 6px; border-bottom:1px solid #ece6d8; font-size:12.5px; }
        .totals { margin-top:14px; margin-left:auto; width:280px; font-size:13px; }
        .totals div { display:flex; justify-content:space-between; padding:4px 0; }
        .totals .grand { border-top:2px solid #0E5C4A; margin-top:6px; padding-top:8px; font-size:16px; font-weight:700; color:#0E5C4A; }
        .terms { margin-top:24px; font-size:11px; color:#6a6253; border-top:1px solid #ece6d8; padding-top:12px; line-height:1.6; }
      </style></head><body>
      <div class="head">
        <div><div class="brand">eurostar<small>GEMSTONES · Estd 1980</small></div></div>
        <div style="text-align:right"><h1>INVOICE</h1>
          <div class="meta">${order.id}<br>${formatDate(order.date)}</div></div>
      </div>
      <div class="bill"><strong>Bill to</strong><br>${shipTo}${persona.gst ? '<br>GSTIN ' + persona.gst : ''}</div>
      <table><thead><tr><th>Product</th><th>Shape</th><th>Size</th><th style="text-align:right">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead>
        <tbody>${rows}</tbody></table>
      <div class="totals">
        <div><span>Subtotal · ${itemCount.toLocaleString('en-IN')} pcs</span><span>${formatINR(total)}</span></div>
        <div><span>GST 3%</span><span>${formatINR(tax)}</span></div>
        <div><span>Shipping &amp; insurance</span><span>${formatINR(shipping)}</span></div>
        <div class="grand"><span>Total payable</span><span>${formatINR(grand)}</span></div>
      </div>
      <div class="terms">Status: ${status.label}${order.ship ? ' · ' + order.ship : ''}.<br>
        Eurostar Technologies Inc. · Authorised Distributor for Asia-Pacific: Ganesh Jewellery I Pvt Ltd · Mumbai, Jaipur</div>
      </body></html>`;
  };

  // Packing list — what is in the box, for the warehouse and for the customer
  // checking a delivery in. Deliberately carries no prices: it travels with the
  // goods, and a courier or a shop assistant has no business reading the rates.
  const packingHTML = () => {
    const rows = order.lines.map((l, i) => {
      const p = findProduct(l.pid) || {};
      const shape = (findShape(p.shape) || {}).name || p.shape || l.shape || '';
      return `<tr>
        <td style="text-align:right">${i + 1}</td>
        <td>${(p.name || l.name || l.pid || '')}${p.tone ? ' · ' + ((findTone(p.tone) || {}).name || p.tone) : ''}</td>
        <td>${shape}</td>
        <td>${p.size || l.size || ''}</td>
        <td style="text-align:right">${(l.qty || 0).toLocaleString('en-IN')}</td>
        <td style="width:70px"></td></tr>`;
    }).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Packing list ${order.id}</title>
      <style>
        @page { margin: 18mm; }
        body { font-family: Georgia, 'Times New Roman', serif; color: #15130f; font-size: 13px; }
        .head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #0E5C4A; padding-bottom:14px; }
        .brand { font-size:26px; font-weight:700; color:#0E5C4A; }
        .brand small { display:block; font-size:11px; color:#6a6253; font-weight:400; letter-spacing:0.04em; }
        h1 { font-size:20px; margin:0; }
        .meta { font-size:12px; color:#555; }
        .bill { margin:16px 0; font-size:12px; line-height:1.6; }
        table { width:100%; border-collapse:collapse; margin-top:10px; }
        th { text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:0.06em; color:#6a6253; border-bottom:1px solid #c9c0ad; padding:8px 6px; }
        td { padding:10px 6px; border-bottom:1px solid #ece6d8; font-size:12.5px; }
        .sign { margin-top:34px; display:flex; justify-content:space-between; font-size:11px; color:#6a6253; }
        .sign div { border-top:1px solid #c9c0ad; padding-top:6px; width:200px; }
        .terms { margin-top:20px; font-size:11px; color:#6a6253; border-top:1px solid #ece6d8; padding-top:12px; line-height:1.6; }
      </style></head><body>
      <div class="head">
        <div><div class="brand">eurostar<small>GEMSTONES · Estd 1980</small></div></div>
        <div style="text-align:right"><h1>PACKING LIST</h1>
          <div class="meta">${order.id}<br>${formatDate(order.date)}</div></div>
      </div>
      <div class="bill"><strong>Ship to</strong><br>${persona.company || ''}${persona.contact ? '<br>c/o ' + persona.contact : ''}${persona.location ? '<br>' + persona.location : ''}${persona.phone ? '<br>' + persona.phone : ''}</div>
      <table><thead><tr><th style="text-align:right">#</th><th>Product</th><th>Shape</th><th>Size</th><th style="text-align:right">Qty (pcs)</th><th>Checked</th></tr></thead>
        <tbody>${rows}</tbody></table>
      <div class="bill" style="margin-top:14px"><strong>Total pieces: ${itemCount.toLocaleString('en-IN')}</strong> across ${order.lines.length} SKU${order.lines.length > 1 ? 's' : ''}</div>
      <div class="sign"><div>Packed by</div><div>Received by</div></div>
      <div class="terms">No prices are shown on a packing list. Check the goods against this list on delivery and report any shortfall within 48 hours.<br>
        Eurostar Technologies Inc. · Mumbai, Jaipur</div>
      </body></html>`;
  };

  const printDoc = (html, what) => {
    const w = window.open('', '_blank');
    if (!w) { alert(`Please allow pop-ups for this site to download the ${what}.`); return; }
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 350);
  };

  // Request cancellation. There is no self-service cancel API — an order that
  // is already packed or shipped cannot simply vanish — so this raises it with
  // the trade desk on WhatsApp, which is how the rest of the app escalates.
  const requestCancellation = () => {
    if (['shipped', 'delivered'].includes(order.status)) {
      alert(
        `This order is already ${order.status}, so it cannot be cancelled here. ` +
        'Message the trade desk and they will advise on a return.'
      );
      return;
    }
    if (!window.confirm(`Request cancellation of ${order.id}?\n\nThe trade desk will confirm before anything is cancelled.`)) return;
    const text =
      `Cancellation request — ${order.id}\n` +
      `${persona.company || ''}${(persona.code || persona.account) ? ' · ' + (persona.code || persona.account) : ''}\n` +
      `Placed ${formatDate(order.date)} · ${itemCount.toLocaleString('en-IN')} pcs · ${formatINR(grand)}\n\n` +
      'Please confirm whether this order can still be cancelled.';
    window.open('https://wa.me/917710065480?text=' + encodeURIComponent(text), '_blank');
  };

  // A blocked pop-up is the usual reason nothing happens, and printDoc says so
  // rather than leaving the customer tapping a button that appears dead.
  const downloadInvoice = () => printDoc(invoiceHTML(), 'invoice');

  // Opens WhatsApp with the order already quoted, so the customer does not have
  // to type out which order they are calling about.
  const messageTradeDesk = () => {
    const text =
      `Hello Eurostar — about order ${order.id}\n` +
      `${persona.company || ''}${(persona.code || persona.account) ? ' · ' + (persona.code || persona.account) : ''}\n` +
      `Placed ${formatDate(order.date)} · ${itemCount.toLocaleString('en-IN')} pcs · ${formatINR(grand)}\n\n`;
    window.open('https://wa.me/917710065480?text=' + encodeURIComponent(text), '_blank');
  };

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
            {formatDate(order.expected) ? ` · Expected by ${formatDate(order.expected)}` : ''}
            {order.ship ? ` · ${order.ship}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={downloadInvoice}><IconDownload size={16} /> Invoice PDF</button>
          <button className="btn btn-secondary" onClick={messageTradeDesk}><IconWhats size={16} /> Message trade desk</button>
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
              // The picture this line was ordered with. Server-fetched orders
              // carry no imageUrl (line items store no picture), so fall back to
              // resolving it from the SKU's own category/colour/shape.
              const lineImg = l.imageUrl ||
                (typeof productImageFor === 'function' ? productImageFor(p.cat, p.tone, p.shape) : null);
              return (
                <div key={i} className="line-item">
                  {/* The drawn shape icon used to be the only thing here, so an
                      order never showed the product image the customer had been
                      looking at when they bought it. */}
                  <div className="line-item-art" style={{ background: lightenTone(tone?.color || '#E5E0D5'),
                                                          overflow: 'hidden', padding: lineImg ? 0 : undefined }}>
                    {lineImg
                      ? <img src={lineImg} alt={p.name} loading="lazy"
                             onError={(e) => { e.currentTarget.style.display = 'none'; }}
                             style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <ShapeIcon shape={p.shape} size={36} color={tone?.color || 'var(--ink)'} />}
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
              <strong style={{ color: 'var(--fg)' }}>{order.paymentTerm}</strong>
              {formatDate(order.expected) ? ` · invoice due ${formatDate(order.expected)}` : ''}
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
                let skipped = 0;
                order.lines.forEach((l) => {
                  const p = findProduct(l.pid);
                  // A line whose SKU is no longer in the catalogue used to be
                  // skipped in silence, so on an order placed against retired
                  // SKUs the button appeared to do nothing at all. Reorder what
                  // the line itself recorded instead, and count what could not
                  // be priced so the customer is told.
                  if (p) {
                    const tone = findTone(p.tone);
                    addToCart && addToCart({
                      pid: p.id, name: p.name, shape: p.shape, size: p.size,
                      quality: p.clarity || p.quality || '', color: tone ? tone.name : '', toneHex: tone ? tone.color : '',
                      unitMode: 'pc', ct: l.qty, qty: l.qty, perCtPrice: p.price, unitPrice: p.price,
                      lineTotal: p.price * l.qty,
                    });
                    n++;
                    return;
                  }
                  const rate = l.unitPrice || 0;
                  if (!l.name && !rate) { skipped++; return; }
                  addToCart && addToCart({
                    pid: l.pid || l.skuId || ('OLD-' + (l.name || 'item')),
                    name: l.name || 'Previously ordered item',
                    shape: l.shape || '', size: l.size || '',
                    quality: l.quality || '', color: l.colour || l.color || '', toneHex: '#9a8',
                    unitMode: 'pc', ct: l.qty, qty: l.qty,
                    perCtPrice: rate, unitPrice: rate,
                    lineTotal: l.lineTotal || rate * (l.qty || 0),
                  });
                  n++;
                });
                if (n) setRoute({ name: 'orders', tab: 'cart' });
                else alert(
                  skipped
                    ? 'These items are no longer in the catalogue, so they cannot be reordered automatically. Message the trade desk and they will sort it out.'
                    : 'Nothing on this order could be added to the cart.'
                );
              }}>
                <IconRefresh size={16} /> Reorder same items
              </button>
              <button className="btn btn-secondary btn-block" style={{ justifyContent: 'flex-start' }}
                      onClick={() => printDoc(packingHTML(), 'packing list')}>
                <IconDoc size={16} /> Download packing list
              </button>
              <button className="btn btn-ghost btn-block" style={{ justifyContent: 'flex-start', color: 'var(--ruby)' }}
                      onClick={requestCancellation}>
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
    { id: 'delivered', label: 'Delivered',
      meta: formatDate(order.expected)
        ? (order.status === 'delivered' ? formatDate(order.expected) : `Expected ${formatDate(order.expected)}`)
        : '' },
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
