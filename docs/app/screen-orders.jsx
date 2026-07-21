// screen-orders.jsx — Order list + cart with grouped multi-size lines

// Staff (rep / back office) order on behalf of customers, so their order list
// shows WHO each order is for. Plain customers never see this column.
function ordersLoginMode() {
  try { return localStorage.getItem('eurostar_login_mode') || 'customer'; } catch (e) { return 'customer'; }
}
function ordersIsStaff() {
  const m = ordersLoginMode();
  return m === 'rep-cash' || m === 'office';
}
// Demo customer book (mirrors the CRM). In production this comes from the API.
const ORDERS_CUSTOMERS = [
  { name: 'Tanvi Gold Cast',        phone: '+91 98240 10482' },
  { name: 'Mehta Jewel Works',      phone: '+91 98250 10663' },
  { name: 'Shree Ganesh Jewellers', phone: '+91 98240 10744' },
  { name: 'Crescent Ornaments',     phone: '+91 98660 10701' },
  { name: 'Pearl Palace',           phone: '+91 98200 10788' },
  { name: 'Royal Casting Co.',      phone: '+91 98220 10812' },
];
// Deterministically attach a customer to an order id (demo only).
function customerForOrder(id) {
  let h = 0; const s = String(id);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff;
  return ORDERS_CUSTOMERS[h % ORDERS_CUSTOMERS.length];
}

function OrdersScreen({ persona, setRoute, cart, setCart, initialTab, editCart, editCustomer }) {
  const staff = ordersIsStaff();
  const [tab, setTab] = React.useState(initialTab || (cart.length ? 'cart' : 'active'));
  React.useEffect(() => { if (initialTab) setTab(initialTab); }, [initialTab]);

  // Real orders for the signed-in customer. This screen used to show
  // ORDERS[persona.id] — sample orders hardcoded in data.jsx for the demo
  // personas — so a brand-new account opened onto someone else's order history.
  // The API already scopes /orders to the caller, so ask it.
  const [serverOrders, setServerOrders] = React.useState(null);
  React.useEffect(() => {
    var token;
    try { token = localStorage.getItem('eurostar_token'); } catch (e) {}
    if (!token) { setServerOrders([]); return; }
    fetch((window.EUROSTAR_API || location.origin) + '/orders', {
      headers: { authorization: 'Bearer ' + token },
    })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) { setServerOrders(Array.isArray(rows) ? rows.map(normaliseOrder) : []); })
      .catch(function () { setServerOrders([]); }); // offline: fall back to local only
  }, []);

  // Local copies cover the moment between placing an order and the server
  // round-trip, and anything queued offline. Dedupe by id so nothing shows twice.
  const localOrders = loadMyOrders(persona);
  const seen = {};
  const orders = [];
  (serverOrders || []).concat(localOrders).forEach(function (o) {
    if (!o || !o.id || seen[o.id]) return;
    seen[o.id] = true;
    orders.push(o);
  });
  const groups = {
    active:    orders.filter(o => ['pending', 'confirmed', 'packed', 'shipped'].includes(o.status)),
    delivered: orders.filter(o => o.status === 'delivered'),
  };
  const visible = tab === 'cart' ? null : groups[tab];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumb">Orders</div>
          <h1>{tab === 'cart' ? 'Your cart' : 'Your orders'}</h1>
          <p>{persona.company} · Account {persona.code} · {persona.tier}</p>
        </div>
      </div>

      {editCart &&
      <div className="card" style={{ background: 'var(--amber-soft)', borderColor: '#E6CC7F', padding: '12px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>✏️</span>
        <div style={{ fontSize: 13.5, color: '#7A5214' }}>
          <strong>Editing cart {editCart}{editCustomer ? ' · ' + editCustomer : ''}</strong> — opened from the CRM. Adjust quantities, add or remove items, then save.
        </div>
      </div>}

      {/* KPI strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12, marginBottom: 28,
      }}>
        <KpiCard label="Active orders" value={groups.active.length} tone="accent" />
        <KpiCard label="In cart" value={`${cart.length} lines`}
                 sub={cart.length ? `${formatCt(cartCt(cart))} ct` : '—'} />
        {/* Count what this customer actually has. persona.deliveredCount +
            pendingCount are hardcoded on the demo personas, so every account
            was shown "22" regardless of its real history. */}
        <KpiCard label="Lifetime orders" value={serverOrders === null ? '—' : orders.length} />
      </div>

      {/* Tabs */}
      <div className="tabs-row">
        <button className={`tab-btn ${tab === 'cart' ? 'active' : ''}`}
                onClick={() => setTab('cart')}>
          <IconBag size={14} /> Cart <span className="count">{cart.length}</span>
        </button>
        <button className={`tab-btn ${tab === 'active' ? 'active' : ''}`}
                onClick={() => setTab('active')}>
          Active <span className="count">{groups.active.length}</span>
        </button>
        <button className={`tab-btn ${tab === 'delivered' ? 'active' : ''}`}
                onClick={() => setTab('delivered')}>
          Delivered <span className="count">{groups.delivered.length}</span>
        </button>
      </div>

      {tab === 'cart' ? (
        <CartView cart={cart} setCart={setCart} persona={persona} setRoute={setRoute} />
      ) : visible.length === 0 ? (
        <div className="empty card">
          <IconBox size={36} stroke="var(--ink-4)" />
          <h3>No {tab} orders yet</h3>
          <p>{tab === 'active'
            ? 'Orders you place will show here while they\u2019re being processed and shipped.'
            : 'Your completed, delivered orders will be listed here.'}</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }}
                  onClick={() => setRoute({ name: 'home' })}>
            Browse categories
          </button>
        </div>
      ) : (
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order</th>
              {staff && <th>Customer</th>}
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map(o => {
              const items = orderQty(o);
              // Placed orders carry the total they were actually charged;
              // recomputing from list prices would drift from negotiated rates.
              const total = typeof o.placedTotal === 'number' ? o.placedTotal : orderTotal(o);
              const status = STATUS_META[o.status];
              const cust = staff ? (o.custName ? { name: o.custName, phone: o.custPhone || '' } : customerForOrder(o.id)) : null;
              return (
                <tr key={o.id} onClick={() => setRoute({ name: 'order-detail', oid: o.id })}>
                  <td data-label="Order"><span className="order-id">{o.id}</span></td>
                  {staff &&
                  <td data-label="Customer">
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg)' }}>{cust.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--fg-meta)', fontVariantNumeric: 'tabular-nums' }}>{cust.phone}</div>
                  </td>}
                  <td data-label="Date"><span className="order-date">{formatDate(o.date)}</span></td>
                  <td data-label="Items">
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {items.toLocaleString('en-IN')} pcs · {o.lines.length} SKU{o.lines.length > 1 ? 's' : ''}
                    </span>
                  </td>
                  <td data-label="Total"><span className="order-total">{formatINR(total)}</span></td>
                  <td data-label="Payment">
                    <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>{o.paymentTerm}</span>
                  </td>
                  <td data-label=""><IconChev size={16} stroke="var(--fg-meta)" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function KpiCard({ label, value, sub, tone = 'neutral' }) {
  const accentColor = tone === 'accent' ? 'var(--emerald)' : 'var(--fg)';
  return (
    <div className="card card-pad" style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: 'var(--fg-meta)' }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 500,
        marginTop: 6, lineHeight: 1.1, color: accentColor,
        fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em',
      }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--fg-meta)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ---------- The CART view ----------
// Orders placed from this app, stored per account by the confirmation screen.
// Shown ahead of the built-in demo orders. Keyed by the signed-in identity
// (phone for customers, username for staff) so two people sharing a browser
// never see each other's history; the demo persona id is only the fallback.
function myOrdersKey(persona) {
  try {
    var who = JSON.parse(localStorage.getItem('eurostar_user') || 'null');
    if (who && (who.phone || who.username)) return 'eurostar-my-orders-' + (who.phone || who.username);
  } catch (e) {}
  return 'eurostar-my-orders-' + (persona.id || persona.code || 'guest');
}
function loadMyOrders(persona) { try { return JSON.parse(localStorage.getItem(myOrdersKey(persona)) || '[]') || []; } catch (e) { return []; } }
Object.assign(window, { myOrdersKey, loadMyOrders });

function draftsKey(persona) { return 'eurostar-drafts-' + (persona.id || persona.code || 'guest'); }
function loadDrafts(persona) { try { return JSON.parse(localStorage.getItem(draftsKey(persona)) || '[]'); } catch (e) { return []; } }
function saveDrafts(persona, list) { try { localStorage.setItem(draftsKey(persona), JSON.stringify(list)); } catch (e) {} }

function DraftList({ drafts, onRestore, onDelete }) {
  return (
    <div className="card card-pad" style={{ marginTop: 16 }}>
      <h3 className="od-section" style={{ marginTop: 0 }}>Saved drafts</h3>
      {drafts.map((d) => (
        <div key={d.id} className="line-item" style={{ gridTemplateColumns: '1fr auto auto' }}>
          <div>
            <div className="line-item-name">{d.name}</div>
            <div className="line-item-meta">{d.date} · {d.count} lines · {formatINR(d.value)}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onRestore(d)}>Open</button>
          <button className="btn btn-ghost btn-sm" onClick={() => onDelete(d.id)}><IconX size={14} /></button>
        </div>
      ))}
    </div>
  );
}

function CartView({ cart, setCart, persona, setRoute }) {
  const [drafts, setDrafts] = React.useState(() => loadDrafts(persona));
  const saveDraft = () => {
    if (cart.length === 0) return;
    const name = prompt('Name this draft (e.g. "June reorder"):', new Date().toLocaleDateString('en-IN'));
    if (name === null) return;
    const d = { id: 'D' + Date.now(), name: name || 'Draft', date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), lines: cart, count: cart.length, value: cart.reduce((s, l) => s + (l.lineTotal || 0), 0) };
    const next = [d, ...drafts]; setDrafts(next); saveDrafts(persona, next);
    // A draft is the cart set aside for later — moving it out of the cart, not
    // copying it. Restoring the draft brings the lines back.
    setCart([]);
    alert('Saved to drafts. Your cart is now empty — open the draft to bring it back.');
  };
  const restoreDraft = (d) => {
    if (cart.length && !confirm('Replace your current cart with this draft?')) return;
    setCart(d.lines);
    // The lines are back in the cart, so the draft has been "used up" —
    // keeping it too would show the same order in both places.
    const next = drafts.filter((x) => x.id !== d.id);
    setDrafts(next); saveDrafts(persona, next);
  };
  const deleteDraft = (id) => { const next = drafts.filter((x) => x.id !== id); setDrafts(next); saveDrafts(persona, next); };

  if (cart.length === 0) {
    return (
      <div>
      <div className="empty card">
        <IconBag size={36} stroke="var(--ink-4)" />
        <h3>Your cart is empty</h3>
        <p>Pick a category, choose a grade, colour and shape, then add quantities against any size.</p>
        <button className="btn btn-primary" style={{ marginTop: 16 }}
                onClick={() => setRoute({ name: 'home' })}>
          Browse categories
        </button>
      </div>
      {drafts.length > 0 && <DraftList drafts={drafts} onRestore={restoreDraft} onDelete={deleteDraft} />}
      </div>
    );
  }

  // Group lines by product + quality + shape (one SKU bundle = multiple sizes)
  const groupedMap = new Map();
  cart.forEach(line => {
    const key = `${line.pid}::${line.quality}::${line.shape}`;
    if (!groupedMap.has(key)) groupedMap.set(key, {
      key, pid: line.pid, quality: line.quality, shape: line.shape,
      name: line.name, colorName: line.color, colorHex: line.toneHex,
      lines: [],
    });
    groupedMap.get(key).lines.push(line);
  });
  const groups = [...groupedMap.values()];

  // Totals
  const subtotal = cart.reduce((s, l) => s + l.lineTotal, 0);
  const isExport = persona.location.toLowerCase().includes('dubai');
  const isCredit = ['15','30','45','60'].includes(String(persona.terms));
  const termsShort = isExport ? 'LC at sight' : (isCredit ? 'NET ' + persona.terms + ' days' : 'Cash');
  const termsLong = isExport
    ? 'Letter of credit confirmed at dispatch'
    : (isCredit ? 'Invoice payable within ' + persona.terms + ' days of dispatch' : 'Pay before dispatch — order ships once payment is received');
  const taxRate = isExport ? 0 : 0.03; // GST 3% on gold/gem in India
  const tax = Math.round(subtotal * taxRate);
  const MIN_ORDER = 1000;
  const shipping = subtotal > 1000 ? 0 : 300; // ₹300 courier up to ₹1,000, free above
  const insurance = 0;
  const grand = subtotal + tax + shipping + insurance;
  const belowMin = subtotal < MIN_ORDER;

  const totalCt   = cart.reduce((s, l) => s + l.ct, 0);
  const totalPcs  = cart.reduce((s, l) => s + l.qty, 0);
  const skuCount  = groups.length;

  const removeLine = (line) => setCart(c => c.filter(x => x.addedAt !== line.addedAt));
  const removeGroup = (g) => setCart(c => c.filter(l => !g.lines.includes(l)));
  const updateCt = (line, newCt) => setCart(c => c.map(l => {
    if (l.addedAt !== line.addedAt) return l;
    const u = l.unitMode || 'ct';
    const min = u === 'ct' ? 0.1 : 1;
    const ct = Math.max(min, newCt);
    return {
      ...l,
      ct,
      // Lines added from an order pad carry their own pieces-per-unit (a
      // packet size can differ from the generic table), so trust that when
      // present and only fall back to the shared lookup.
      qty: l.pcsPerUnit ? Math.round(ct * l.pcsPerUnit) : unitToPcs(u, l.size, ct),
      lineTotal: ct * l.perCtPrice,
    };
  }));

  // Back office only: charge a walk-in customer a custom (usually higher) rate.
  // Stores the override so it survives re-renders and flows into the proforma.
  const officeCanEditPrice = ordersLoginMode() === 'office';
  const updatePrice = (line, newPrice) => setCart(c => c.map(l => {
    if (l.addedAt !== line.addedAt) return l;
    const perCtPrice = Math.max(0, newPrice);
    return {
      ...l,
      perCtPrice,
      basePrice: l.basePrice != null ? l.basePrice : line.perCtPrice, // remember catalog rate
      priceEdited: true,
      lineTotal: l.ct * perCtPrice,
    };
  }));

  const proformaNo = 'PI-' + (persona.account || 'EUR') + '-' + String(Date.now()).slice(-5);
  const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const proformaHTML = () => {
    const rows = cart.map((l) => `<tr>
      <td>${l.name || ''}${l.color ? ' · ' + l.color : ''}${l.quality ? ' · ' + l.quality : ''}</td>
      <td>${(findShape(l.shape) || {}).name || l.shape || ''}</td>
      <td>${l.size || ''}</td>
      <td style="text-align:right">${(l.qty || 0).toLocaleString('en-IN')}</td>
      <td style="text-align:right">${formatINR(l.perCtPrice || l.unitPrice || 0)}</td>
      <td style="text-align:right">${formatINR(l.lineTotal || 0)}</td></tr>`).join('');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Proforma ${proformaNo}</title>
      <style>
        @page { margin: 18mm; }
        body { font-family: Georgia, 'Times New Roman', serif; color: #15130f; font-size: 13px; }
        .head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #0E5C4A; padding-bottom:14px; }
        .brand { font-size:26px; font-weight:700; color:#0E5C4A; letter-spacing:-0.01em; }
        .brand small { display:block; font-size:11px; color:#6a6253; font-weight:400; letter-spacing:0.04em; }
        h1 { font-size:20px; margin:18px 0 2px; }
        .meta { font-size:12px; color:#555; }
        .bill { margin:16px 0; font-size:12px; }
        .bill strong { font-size:13px; }
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
        <div style="text-align:right"><h1 style="margin:0">PROFORMA INVOICE</h1>
          <div class="meta">${proformaNo}<br>${todayStr}</div></div>
      </div>
      <div class="bill"><strong>Bill to:</strong> ${persona.company || ''}${persona.account ? ' · ' + persona.account : ''}<br>
        ${persona.location || ''}${persona.gst ? ' · GSTIN ' + persona.gst : ''}</div>
      <table><thead><tr><th>Product</th><th>Shape</th><th>Size</th><th style="text-align:right">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead>
        <tbody>${rows}</tbody></table>
      <div class="totals">
        <div><span>Subtotal</span><span>${formatINR(subtotal)}</span></div>
        ${tax ? `<div><span>GST 3%</span><span>${formatINR(tax)}</span></div>` : ''}
        <div><span>Courier</span><span>${shipping === 0 ? 'Free' : formatINR(shipping)}</span></div>
        <div class="grand"><span>Total payable</span><span>${formatINR(grand)}</span></div>
      </div>
      <div class="terms">Payment terms: ${termsShort}. This is a proforma invoice, not a tax invoice. Prices valid 7 days. Dispatch 2–3 business days after confirmation.<br>
        Eurostar Technologies Inc. · Authorised Distributor for Asia-Pacific: Ganesh Jewellery I Pvt Ltd · Mumbai, Jaipur</div>
      </body></html>`;
  };

  const getProforma = () => {
    const w = window.open('', '_blank');
    if (!w) { alert('Please allow pop-ups to download the proforma.'); return; }
    w.document.write(proformaHTML());
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 350);
  };

  // Build the caption used both as the WhatsApp text and as the share sheet body.
  const whatsAppCaption = () => {
    const lines = cart.map((l) => `• ${l.name}${l.color ? ' ('+l.color+')' : ''} ${l.size || ''} × ${(l.qty||0).toLocaleString('en-IN')} = ${formatINR(l.lineTotal||0)}`).join('\n');
    return `*Eurostar — Proforma ${proformaNo}*\n${persona.company || ''}${persona.account ? ' · '+persona.account : ''}\n\n${lines}\n\n*Total payable: ${formatINR(grand)}*\n(${termsShort})`;
  };

  // Text-only fallback (unchanged old behaviour) — used when we can't produce or
  // share a real file (e.g. desktop, blocked pop-up, or the PDF request fails).
  const shareWhatsAppText = () => {
    const msg = whatsAppCaption() + `\n\nGenerate the PDF proforma from the Eurostar portal to attach it here.`;
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
  };

  // Ask the backend to render the cart as a real PDF and return it as a File.
  const buildProformaFile = async () => {
    const payload = {
      proformaNo,
      date: todayStr,
      billTo: {
        company: persona.company || '',
        account: persona.account || '',
        location: persona.location || '',
        gst: persona.gst || '',
      },
      rows: cart.map((l) => ({
        product: `${l.name || ''}${l.color ? ' · ' + l.color : ''}${l.quality ? ' · ' + l.quality : ''}`,
        shape: (findShape(l.shape) || {}).name || l.shape || '',
        size: l.size || '',
        qty: l.qty || 0,
        rate: l.perCtPrice || l.unitPrice || 0,
        amount: l.lineTotal || 0,
      })),
      totals: { subtotal, tax, shipping, grand },
      terms: termsShort,
    };
    const base = window.EUROSTAR_API || location.origin;
    const res = await fetch(base + '/proforma', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('proforma ' + res.status);
    const blob = await res.blob();
    return new File([blob], `Proforma-${proformaNo}.pdf`, { type: 'application/pdf' });
  };

  const shareWhatsApp = async () => {
    let file;
    try {
      file = await buildProformaFile();
    } catch (e) {
      // Couldn't make the PDF — fall back to the old text-only share.
      shareWhatsAppText();
      return;
    }
    // Best path (mobile): native share sheet attaches the actual PDF file, so the
    // user can pick WhatsApp and the proforma rides along as a document.
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: `Proforma ${proformaNo}`, text: whatsAppCaption() });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return; // user dismissed the sheet
        // otherwise fall through to the desktop fallback below
      }
    }
    // Desktop / unsupported: download the PDF so it's ready to attach, then open
    // the WhatsApp chat with the summary text for the user to drop the file into.
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    window.open('https://wa.me/?text=' + encodeURIComponent(whatsAppCaption() + `\n\n(PDF proforma downloaded — attach it here.)`), '_blank');
  };

  return (
    <div className="cart-layout">
      {/* LEFT: line items grouped by SKU */}
      <div>
        <div className="cart-banner">
          {ordersIsStaff() ? (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                          textTransform: 'uppercase', color: 'var(--fg-meta)' }}>
              Customer
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>
              Selected at checkout
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>
              You'll choose the customer on the Review &amp; confirm step.
            </div>
          </div>
          ) : (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                          textTransform: 'uppercase', color: 'var(--fg-meta)' }}>
              Ship to
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>
              {persona.company} · {persona.location}
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>
              c/o {persona.contact} · {persona.phone}
            </div>
          </div>
          )}
          {!ordersIsStaff() &&
          <button className="btn btn-ghost btn-sm">
            Edit address
          </button>}
        </div>

        {groups.map(g => {
          const product = findProduct(g.pid);
          const name = g.name || product?.name || 'Item';
          const colorHex = g.colorHex || findTone(product?.tone)?.color || '#E5E0D5';
          const colorName = g.colorName || findTone(product?.tone)?.name || '';
          const gUnit = g.lines[0]?.unitMode || 'ct';
          const groupCt   = g.lines.reduce((s, l) => s + l.ct, 0);
          const groupPcs  = g.lines.reduce((s, l) => s + l.qty, 0);
          const groupAmt  = g.lines.reduce((s, l) => s + l.lineTotal, 0);
          return (
            <div key={g.key} className="cart-group">
              <div className="cart-group-head">
                <div className="cart-group-art" style={{ background: lightenTone(colorHex), overflow: 'hidden', padding: 0 }}>
                  {(typeof productPhoto === 'function' && productPhoto(g.lines[0]?.tone))
                    ? <img src={productPhoto(g.lines[0].tone)} alt={name}
                           style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <ShapeIcon shape={g.shape} size={36} color={colorHex} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 19,
                                letterSpacing: '-0.005em' }}>
                    {name}
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4,
                                fontSize: 12, color: 'var(--fg-meta)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{g.pid}</span>
                    <span>·</span>
                    <span>{findShape(g.shape)?.name}</span>
                    <span>·</span>
                    <span>{g.quality}</span>
                    {colorName && <>
                      <span>·</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%',
                                       background: colorHex, border: '1px solid rgba(0,0,0,0.12)' }} />
                        {colorName}
                      </span>
                    </>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
                  <div style={{ fontSize: 11, color: 'var(--fg-meta)', textTransform: 'uppercase',
                                letterSpacing: '0.06em', fontWeight: 600 }}>
                    {g.lines.length} size{g.lines.length > 1 ? 's' : ''}
                  </div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 500,
                                marginTop: 4, letterSpacing: '-0.01em' }}>
                    {formatINR(groupAmt)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-meta)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCt(groupCt)} {unitLabel(gUnit)} · {groupPcs.toLocaleString('en-IN')} pcs
                  </div>
                </div>
              </div>

              <div className="cart-lines">
                <div className="cart-line-head">
                  <span>Size</span>
                  <span style={{ textAlign: 'center' }}>
                    {gUnit === 'ct' ? 'Carats' : gUnit === 'pkt' ? 'Packets' : 'Pieces'}
                  </span>
                  <span style={{ textAlign: 'center' }}>Pieces</span>
                  <span style={{ textAlign: 'right' }}>₹ / {unitLabel(gUnit)}</span>
                  <span style={{ textAlign: 'right' }}>Line total</span>
                  <span></span>
                </div>
                {g.lines.map(l => (
                  <div key={l.addedAt} className="cart-line">
                    <div className="cart-line-size">
                      <span className="cart-line-mm">{l.size.replace(' mm', '')}</span>
                      <span className="cart-line-unit">mm</span>
                    </div>
                    <div className="cart-line-ct">
                      <button onClick={() => updateCt(l, l.ct - 1)} disabled={l.ct <= 1}>
                        <IconMinus size={11} />
                      </button>
                      <input type="number"
                             value={l.ct}
                             step={1}
                             min={0.1}
                             onChange={(e) => updateCt(l, parseFloat(e.target.value) || 0.1)} />
                      <button onClick={() => updateCt(l, l.ct + 1)}>
                        <IconPlus size={11} />
                      </button>
                    </div>
                    <div className="cart-line-pcs">{l.qty.toLocaleString('en-IN')}</div>
                    {officeCanEditPrice ? (
                    <div className="cart-line-price cart-line-price-edit" title={l.basePrice != null ? 'Catalog rate ' + formatINR(l.basePrice) : 'Editable rate'}>
                      <span className="rupee">₹</span>
                      <input type="number" step={1} min={0}
                             value={Math.round(l.perCtPrice)}
                             onChange={(e) => updatePrice(l, parseFloat(e.target.value) || 0)} />
                      {l.priceEdited && l.basePrice != null && Math.round(l.perCtPrice) !== Math.round(l.basePrice) &&
                        <span className="price-flag">{l.perCtPrice > l.basePrice ? '↑' : '↓'}</span>}
                    </div>
                    ) : (
                    <div className="cart-line-price">{formatINR(l.perCtPrice)}</div>
                    )}
                    <div className="cart-line-total">{formatINR(l.lineTotal)}</div>
                    <button className="cart-line-remove" onClick={() => removeLine(l)}
                            aria-label="Remove line">
                      <IconX size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-group-actions">
                <button className="btn btn-ghost btn-sm"
                        onClick={() => setRoute({ name: 'product', pid: g.pid })}>
                  <IconPlus size={14} /> Add more sizes
                </button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--ruby)' }}
                        onClick={() => removeGroup(g)}>
                  <IconX size={14} /> Remove product
                </button>
              </div>
            </div>
          );
        })}

        {/* Notes box */}
        <div className="card card-pad" style={{ marginTop: 16, padding: 18 }}>
          <h3 style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
                       color: 'var(--fg-meta)', fontWeight: 700, margin: '0 0 10px' }}>
            Order notes <span style={{ color: 'var(--ink-4)', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
          </h3>
          <textarea rows="2" placeholder="Matched pairs, certificate requirements, packing preferences…"
            style={{
              width: '100%', padding: '10px 12px',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)', fontSize: 14, fontFamily: 'inherit', resize: 'vertical',
            }} />
        </div>
      </div>

      {/* RIGHT: invoice summary (sticky) */}
      <div className="cart-summary-col">
        <div className="card card-pad" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
                       color: 'var(--fg-meta)', fontWeight: 700, margin: '0 0 16px' }}>
            Order summary
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16,
                        paddingBottom: 16, borderBottom: '1px solid var(--divider)' }}>
            <SummaryMini label="Products" value={skuCount} />
            <SummaryMini label="Line items" value={cart.length} />
            <SummaryMini label="Total carats" value={`${formatCt(totalCt)} ct`} />
            <SummaryMini label="Total pieces" value={totalPcs.toLocaleString('en-IN')} />
          </div>

          <div className="summary-row">
            <span style={{ color: 'var(--fg-muted)' }}>Subtotal</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span style={{ color: 'var(--fg-muted)' }}>
              {isExport ? 'Export · zero rated' : 'GST · 3%'}
            </span>
            <span>{tax === 0 ? '—' : formatINR(tax)}</span>
          </div>
          <div className="summary-row">
            <span style={{ color: 'var(--fg-muted)' }}>
              Courier {shipping === 0 ? '· free over ₹1,000' : '· flat'}
            </span>
            <span>{shipping === 0 ? 'Free' : formatINR(shipping)}</span>
          </div>
          <div className="summary-row total">
            <span>Total payable</span>
            <span>{formatINR(grand)}</span>
          </div>

          <div style={{
            marginTop: 16, padding: '12px 14px',
            background: 'var(--paper-2)', borderRadius: 'var(--r-md)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.08em', color: 'var(--fg-meta)', marginBottom: 6 }}>
              Payment terms
            </div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              {termsShort}
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 4 }}>
              {termsLong}
            </div>
          </div>

          {belowMin &&
          <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--amber-soft)', border: '1px solid #E6CC7F', borderRadius: 'var(--r-md)', fontSize: 12.5, color: '#7A5214' }}>
            <strong>Minimum order ₹1,000.</strong> Add {formatINR(1000 - subtotal)} more to check out.
          </div>}

          <button className="btn btn-accent btn-lg btn-block" style={{ marginTop: 20 }}
                  disabled={belowMin}
                  onClick={() => !belowMin && setRoute({ name: 'checkout' })}>
            <IconCheck size={16} /> Proceed to checkout — {formatINR(grand)}
          </button>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={saveDraft}>
              <IconDoc size={14} /> Save as draft
            </button>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={getProforma}>
              <IconDownload size={14} /> Get proforma
            </button>
          </div>
          <button className="btn btn-sm" style={{ width: '100%', marginTop: 8, background: '#25D366', color: '#fff', borderColor: '#1da851' }} onClick={shareWhatsApp}>
            <IconWhats size={15} /> Share cart on WhatsApp
          </button>

          <details className="qr-pay">
            <summary>
              <span className="qr-pay-label"><IconQr size={15} /> Show QR code to pay</span>
              <IconChevron size={15} />
            </summary>
            <div className="qr-pay-body">
              <div className="qr-frame" data-om-raster>
                <img src="assets/eurostar-upi-qr.svg" alt="Eurostar company UPI QR code" width="180" height="180" />
              </div>
              <div className="qr-pay-meta">
                <div className="qr-pay-pay">Eurostar Technologies Inc.</div>
                <div className="qr-pay-upi">UPI · eurostar@okhdfcbank</div>
                <div className="qr-pay-amt">Amount payable <b>{formatINR(grand)}</b></div>
                <div className="qr-pay-note">Scan with any UPI app (GPay · PhonePe · Paytm). Order ships once payment is received.</div>
              </div>
            </div>
          </details>

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--divider)',
                        fontSize: 11, color: 'var(--fg-meta)', lineHeight: 1.5 }}>
            By placing this order you accept Eurostar's trade terms.
            Dispatch begins after confirmation, typically within 2–3 business days.
            Insurance covers parcel value to {formatINR(grand)} until delivery.
          </div>
        </div>

        <div className="card card-pad" style={{ marginTop: 14, padding: 18 }}>
          <h3 style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
                       color: 'var(--fg-meta)', fontWeight: 700, margin: '0 0 12px' }}>
            Need help?
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
              <IconWhats size={14} /> WhatsApp trade desk
            </button>
            <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
              <IconPhone size={14} /> +91 98765 43210
            </button>
          </div>
        </div>
      </div>
      {drafts.length > 0 && <DraftList drafts={drafts} onRestore={restoreDraft} onDelete={deleteDraft} />}
    </div>
  );
}

function SummaryMini({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: 'var(--fg-meta)', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 500,
        fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em',
      }}>{value}</div>
    </div>
  );
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCt(n) {
  return Number.isInteger(n) ? n.toString() : n.toFixed(1);
}

function cartCt(cart) {
  return cart.reduce((s, l) => s + l.ct, 0);
}

Object.assign(window, { OrdersScreen, formatDate, KpiCard, formatCt });
