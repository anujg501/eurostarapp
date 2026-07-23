// screen-checkout.jsx — Checkout review + order confirmation
// Shares the same totals math as the cart so figures are consistent.

// Who is placing this order? Reps and back-office staff order ON BEHALF OF a
// customer, so they get a customer picker at checkout. Plain customers don't.
function checkoutLoginMode() {
  try { return localStorage.getItem('eurostar_login_mode') || 'customer'; } catch (e) { return 'customer'; }
}
function isStaffOrder() {
  const m = checkoutLoginMode();
  return m === 'rep-cash' || m === 'office';
}

// The customer book comes from the API: reps see only customers mapped to
// them, office sees all (the server enforces that scoping). The old hardcoded
// demo book is gone — staff pick from the real customer master.
function checkoutAuthHeaders() {
  var h = { 'content-type': 'application/json' };
  try { var t = localStorage.getItem('eurostar_token'); if (t) h.authorization = 'Bearer ' + t; } catch (e) {}
  return h;
}
function checkoutLoggedInUser() {
  try { return JSON.parse(localStorage.getItem('eurostar_user') || 'null'); } catch (e) { return null; }
}

function cartTotals(cart, persona) {
  const subtotal = cart.reduce((s, l) => s + (l.lineTotal || 0), 0);
  const isExport = (persona.location || '').toLowerCase().includes('dubai');
  const tax = isExport ? 0 : Math.round(subtotal * 0.03);
  const shipping = subtotal > 1000 ? 0 : 300; // ₹300 courier up to ₹1,000, free above
  const insurance = 0;
  const grand = subtotal + tax + shipping + insurance;
  return { subtotal, isExport, tax, shipping, insurance, grand };
}

function CheckoutScreen({ cart, persona, onBack, onPlace, isOnline }) {
  const t = cartTotals(cart, persona);
  const [addr, setAddr] = React.useState(persona.location || '');
  const addrTouched = React.useRef(false); // don't overwrite what the operator typed
  const [contact, setContact] = React.useState(persona.contact || '');
  const [phone, setPhone] = React.useState(persona.phone || '');
  const [notes, setNotes] = React.useState('');
  // Staff-only: who is this order for?
  const staff = isStaffOrder();
  const [bookCustomers, setBookCustomers] = React.useState([]);
  const [bookLoading, setBookLoading] = React.useState(staff);
  const [custMode, setCustMode] = React.useState('existing'); // 'existing' | 'new'
  const [custId, setCustId] = React.useState('');
  const [newName, setNewName] = React.useState('');
  const [newPhone, setNewPhone] = React.useState('');
  const [placing, setPlacing] = React.useState(false);
  const [stockError, setStockError] = React.useState('');

  // Staff: load the real customer book (server scopes rep vs office).
  React.useEffect(() => {
    if (!staff) return;
    fetch((window.EUROSTAR_API || location.origin) + '/customers', { headers: checkoutAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((list) => {
        if (Array.isArray(list)) {
          const mapped = list.map((c) => ({ id: c.id, code: c.code, name: c.name, city: c.city || '', phone: c.phone || '' }));
          setBookCustomers(mapped);
          setCustId((prev) => (mapped.some((m) => m.id === prev) ? prev : (mapped[0] ? mapped[0].id : '')));
        }
        setBookLoading(false);
      })
      .catch(function () { setBookLoading(false); });
  }, []);

  // Customer login: the order belongs to whoever actually signed in — resolve
  // their master record so the order/payment carry the real customer id.
  const who = checkoutLoggedInUser();
  const [selfCust, setSelfCust] = React.useState(null);
  React.useEffect(() => {
    if (staff) return;
    const ph = (who && who.phone) || persona.phone || '';
    if (!ph) return;
    fetch((window.EUROSTAR_API || location.origin) + '/customers/by-phone/' + encodeURIComponent(ph), { headers: checkoutAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (!c || !c.id) return;
        setSelfCust(c);
        // Default Ship-to to the customer's saved delivery address (Addresses
        // tab), falling back to their city — instead of always the city.
        if (!addrTouched.current) setAddr(c.shipAddress || c.city || persona.location || '');
      })
      .catch(function () {});
  }, []);

  const selectedCust = bookCustomers.find((c) => c.id === custId) || null;
  // The customer attached to this order (for the summary + order payload).
  const orderCustomer = !staff
    ? {
        name: (selfCust && selfCust.name) || (who && who.role === 'customer' && who.name) || persona.company,
        phone: (selfCust && selfCust.phone) || (who && who.phone) || persona.phone,
        code: (selfCust && selfCust.code) || persona.code || '',
        id: (selfCust && selfCust.id) || '',
      }
    : custMode === 'new' ? { name: newName.trim(), phone: newPhone.trim(), code: '', id: '', isNew: true }
    : { name: selectedCust ? selectedCust.name : '', phone: selectedCust ? selectedCust.phone : '', code: selectedCust ? selectedCust.code : '', id: selectedCust ? selectedCust.id : '' };
  const staffCustReady = !staff || (custMode === 'existing' ? !!selectedCust : newName.trim().length >= 2 && newPhone.trim().length >= 6);

  // A staff "New customer" is created in the real customer master before the
  // order is placed, so it lands in the CRM book with a proper code and the
  // rep mapping — instead of existing only as free text on one order.
  const placeOrder = async () => {
    if (placing) return;

    // Last check before the order leaves the app: another customer may have
    // taken the stock while this one was filling in the form. Offline, this
    // returns nothing and the order goes to the queue as before — the server's
    // atomic decrement is still what actually decides.
    if (isOnline !== false) {
      setPlacing(true);
      const short = stockShortfalls(await checkStock(cart));
      setPlacing(false);
      if (short.length) {
        setStockError(short.map(stockMessage).join(' '));
        return; // stay on checkout so the quantities can be adjusted
      }
      setStockError('');
    }

    let customer = orderCustomer;
    if (staff && custMode === 'new') {
      setPlacing(true);
      try {
        const r = await fetch((window.EUROSTAR_API || location.origin) + '/customers', {
          method: 'POST', headers: checkoutAuthHeaders(),
          body: JSON.stringify({ name: newName.trim(), phone: newPhone.trim() }),
        });
        const d = await r.json();
        if (r.ok && d && d.id) customer = { name: d.name, phone: d.phone || newPhone.trim(), code: d.code || '', id: d.id, isNew: true };
      } catch (e) { /* offline — place with the typed details */ }
      setPlacing(false);
    }
    onPlace({ addr, contact, phone, notes, dispatchBy, customer, ...t });
  };
  const totalPcs = cart.reduce((s, l) => s + (l.qty || 0), 0);
  const dispatchBy = (() => { const d = new Date(); d.setDate(d.getDate() + (t.isExport ? 5 : 3)); return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }); })();

  const lbl = (txt) => <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--fg-meta)', marginBottom: 6 }}>{txt}</div>;
  const inp = { width: '100%', padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 14, fontFamily: 'inherit', color: 'var(--fg)', outline: 'none' };

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div className="page-head">
        <div>
          <div className="crumb">Checkout</div>
          <h1>Review &amp; confirm</h1>
          <p>{staff ? (orderCustomer.name ? orderCustomer.name + (orderCustomer.code ? ' · ' + orderCustomer.code : '') : 'Select the customer below') : persona.company + ' · Account ' + persona.code}</p>
        </div>
        <button className="btn btn-ghost" onClick={onBack}><IconArrowLeft size={16} /> Back to cart</button>
      </div>

      <div className="od-layout">
        {/* LEFT: details */}
        <div>
          {staff && (
          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <h3 className="od-section" style={{ marginTop: 0 }}>Customer</h3>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: -4, marginBottom: 12 }}>
              {checkoutLoginMode() === 'office' ? 'Back office · ordering on behalf of a customer.' : 'Sales rep · ordering on behalf of a customer (billed as cash customer).'}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[['existing', 'Choose customer'], ['new', 'New customer']].map(([id, label]) => (
                <button key={id} type="button" onClick={() => setCustMode(id)}
                  style={{ flex: 1, padding: '9px 12px', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                    borderRadius: 'var(--r-md)', border: '1px solid ' + (custMode === id ? 'var(--ink)' : 'var(--border)'),
                    background: custMode === id ? 'var(--paper-2)' : 'var(--surface-2)', color: 'var(--fg)' }}>
                  {label}
                </button>
              ))}
            </div>
            {custMode === 'existing' ? (
              <label style={{ display: 'block' }}>{lbl('Select a customer')}
                <select style={{ ...inp, cursor: 'pointer' }} value={custId} onChange={(e) => setCustId(e.target.value)}>
                  {bookLoading && <option value="">Loading customers…</option>}
                  {!bookLoading && bookCustomers.length === 0 && <option value="">No customers yet — use “New customer”</option>}
                  {bookCustomers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.city ? ' · ' + c.city : ''} ({c.code})</option>)}
                </select>
                {selectedCust && <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 8 }}>{selectedCust.phone}</div>}
              </label>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <label>{lbl('Customer name')}<input style={inp} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Firm / person" /></label>
                <label>{lbl('Phone number')}<input style={inp} value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="10-digit mobile" inputMode="tel" /></label>
              </div>
            )}
          </div>
          )}
          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <h3 className="od-section" style={{ marginTop: 0 }}>Delivery address</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <label style={{ gridColumn: '1 / -1' }}>{lbl('Ship to')}<textarea rows="2" style={{ ...inp, resize: 'vertical' }} value={addr} onChange={(e) => { addrTouched.current = true; setAddr(e.target.value); }} /></label>
              <label>{lbl('Contact person')}<input style={inp} value={contact} onChange={(e) => setContact(e.target.value)} /></label>
              <label>{lbl('Phone')}<input style={inp} value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
            </div>
          </div>

          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <h3 className="od-section" style={{ marginTop: 0 }}>Delivery</h3>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{t.isExport ? 'International insured courier' : 'Insured domestic courier'}</div>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 4 }}>Dispatch by {dispatchBy} · tracking shared on WhatsApp</div>
          </div>

          <div className="card card-pad">
            <h3 className="od-section" style={{ marginTop: 0 }}>Order notes (optional)</h3>
            <textarea rows="3" style={{ ...inp, resize: 'vertical' }} placeholder="Packing instructions, certificate requests, delivery preferences…" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        {/* RIGHT: summary */}
        <div>
          <div className="card card-pad" style={{ position: 'sticky', top: 92 }}>
            <h3 className="od-section" style={{ marginTop: 0 }}>Order summary</h3>
            <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 12 }}>
              {cart.map((l, i) => (
                <div key={i} className="summary-row" style={{ alignItems: 'flex-start' }}>
                  <span style={{ flex: 1, paddingRight: 8 }}>{l.name}{l.color ? ' · ' + l.color : ''} <span style={{ color: 'var(--fg-meta)' }}>{l.size} × {(l.qty || 0).toLocaleString('en-IN')}</span></span>
                  <strong>{formatINR(l.lineTotal || 0)}</strong>
                </div>
              ))}
            </div>
            <div className="summary-row label"><span>Subtotal</span><span>{formatINR(t.subtotal)}</span></div>
            {t.tax > 0 && <div className="summary-row label"><span>GST 3%</span><span>{formatINR(t.tax)}</span></div>}
            <div className="summary-row label"><span>Courier {t.shipping === 0 ? '· free over ₹1,000' : ''}</span><span>{t.shipping === 0 ? 'Free' : formatINR(t.shipping)}</span></div>
            <div className="summary-row total"><span>Total payable</span><span>{formatINR(t.grand)}</span></div>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', margin: '6px 0 16px', textAlign: 'right' }}>
              {cart.length} lines · {totalPcs.toLocaleString('en-IN')} pcs · {t.isExport ? 'LC at sight' : (['15','30','45','60'].includes(String(persona.terms)) ? 'NET ' + persona.terms + ' days' : 'Cash · pay then ship')}
            </div>
            {staff && (
              <div className="summary-row label"><span>Customer</span><span style={{ fontWeight: 600, color: 'var(--fg)' }}>{orderCustomer.name || '—'}</span></div>
            )}
            {stockError &&
            <div style={{ background: 'var(--amber-soft)', border: '1px solid #E6CC7F', borderRadius: 8,
                          padding: '10px 12px', marginBottom: 12, fontSize: 13, color: '#7A5214' }}>
              {stockError} <strong>Go back to the cart to adjust the quantity.</strong>
            </div>}
            <button className="btn btn-accent btn-lg btn-block" disabled={!staffCustReady || placing} onClick={placeOrder}>
              <IconCheck size={16} /> {placing ? 'Checking stock…' : (isOnline === false ? 'Save order offline' : (['15','30','45','60'].includes(String(persona.terms)) ? 'Place order' : 'Proceed to payment'))} — {formatINR(t.grand)}
            </button>
            {staff && !staffCustReady && <div style={{ fontSize: 12, color: 'var(--ruby, #8B1E2E)', textAlign: 'center', marginTop: 8, fontWeight: 600 }}>{custMode === 'new' ? 'Enter customer name and phone to continue.' : 'Select a customer to continue.'}</div>}
            {isOnline === false && <div style={{ fontSize: 12, color: 'var(--amber-ink, #8a6d1f)', textAlign: 'center', marginTop: 8, fontWeight: 600 }}>You're offline — this order will be saved and sent automatically when you reconnect.</div>}
            <div style={{ fontSize: 11, color: 'var(--fg-meta)', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
              By placing this order you agree to Eurostar's trade terms. Prices are confidential to your account.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentScreen({ order, persona, onPaid, onBack }) {
  const [method, setMethod] = React.useState('upi');
  const [processing, setProcessing] = React.useState(false);
  const API = window.EUROSTAR_API || location.origin;

  // Fallback used when online payment isn't live yet (Razorpay keys not set) or
  // the gateway can't load — the previous simulated confirmation. Keeps the app
  // fully working before/without Razorpay.
  const simulatedPay = () => { setProcessing(true);
    const payload = {
      id: 'PAY-APP-' + order.id, orderId: order.id,
      custId: (order.customer && order.customer.id) || '',
      custCode: (order.customer && order.customer.code) || persona.code || '',
      custName: (order.customer && order.customer.name) || persona.company || '',
      mode: method, amount: order.grand || 0, utr: 'ONLINE-' + Date.now().toString().slice(-8),
      date: new Date().toISOString().slice(0, 10), by: '', contact: '', img: null,
      // Every placed order's payment enters the back office as Pending
      // Verification — the finance team confirms it, which then marks the order
      // paid + confirmed. (No live gateway here to auto-verify.)
      status: 'pending', source: 'Sales App', loggedAt: new Date().toISOString(),
    };
    // Keep the localStorage copy for the CRM's "incoming" panel …
    try {
      const k = 'eurostar-crm-incoming-payments';
      const arr = JSON.parse(localStorage.getItem(k) || '[]') || [];
      if (!arr.some((p) => p.orderId === order.id)) { arr.unshift(payload); localStorage.setItem(k, JSON.stringify(arr)); }
    } catch (e) {}
    // … and persist it to the server so the payment shows in the CRM Payment log
    // (previously it lived only in this browser's localStorage, so a website
    // order left no payment record for the back office).
    ensureOrder()
      .then(function () { return fetch(API + '/payments', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }).catch(function () {}); })
      .catch(function () {})
      .then(function () { setProcessing(false); onPaid(); });
  };

  // Make sure the order exists in the back room so the verified payment can be
  // attached to it (the confirmation screen also pushes it; upsert dedups by id).
  const ensureOrder = () => fetch(API + '/orders', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      id: order.id, customer: persona.company, code: persona.code || '',
      city: (persona.location || '').split(',')[0].trim(),
      rep: localStorage.getItem('eurostar-rep-name') || 'Rohit Shah',
      repId: localStorage.getItem('eurostar-rep-id') || 'REP-204',
      value: order.grand || 0, dispatchBy: order.dispatchBy || '',
      isExport: !!order.isExport, paid: false, ts: Date.now(), source: 'Sales App',
    }),
  }).catch(function () {});

  // Only ever reachable when the back room has NO payment keys — see payFailed.
  const payUnavailable = (why) => {
    setProcessing(false);
    alert(
      'We could not open the payment window' + (why ? ' (' + why + ')' : '') +
      '.\n\nYour order has been saved but is NOT paid. Please try again, or ' +
      'contact us to pay another way. Nothing has been charged.'
    );
  };

  const pay = async () => {
    setProcessing(true);
    // Whether real payments are switched on. This decides what a failure means:
    // with keys configured a failure must NEVER mark the order paid — the
    // simulated flow is a no-keys demo convenience, and reaching it here would
    // hand a free order to anyone whose browser blocks the gateway script.
    let live = false;
    try {
      const keyInfo = await fetch(API + '/payments/razorpay/key').then((r) => r.json()).catch(() => null);
      live = !!(keyInfo && keyInfo.configured);

      if (!live) { setProcessing(false); return simulatedPay(); }
      if (!window.Razorpay) return payUnavailable('the payment gateway did not load — an ad blocker may be blocking it');

      await ensureOrder();
      const rp = await fetch(API + '/payments/razorpay/order', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      }).then((r) => r.json()).catch(() => null);
      if (!rp || !rp.configured || !rp.razorpayOrderId) return payUnavailable('the payment could not be started');

      const rzp = new window.Razorpay({
        key: rp.keyId, order_id: rp.razorpayOrderId, amount: rp.amount, currency: rp.currency || 'INR',
        name: rp.name || 'Eurostar', description: 'Order ' + order.id,
        prefill: { name: persona.company || '', contact: persona.phone || '' },
        theme: { color: '#0E5C4A' },
        handler: function (resp) {
          fetch(API + '/payments/razorpay/verify', {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              orderId: order.id,
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            }),
          }).then((r) => r.json()).then(function (v) {
            setProcessing(false);
            if (v && v.verified) onPaid();
            else alert('We could not confirm your payment. If any money was deducted it will be refunded. Please try again.');
          }).catch(function () { setProcessing(false); alert('Payment confirmation failed. Please try again.'); });
        },
        modal: { ondismiss: function () { setProcessing(false); } },
      });
      rzp.on('payment.failed', function () { setProcessing(false); });
      rzp.open();
    } catch (e) {
      // Same rule in the catch-all: only the no-keys demo path may mark paid.
      if (live) return payUnavailable('unexpected error');
      setProcessing(false);
      simulatedPay();
    }
  };
  const methods = [
    ['upi', 'UPI', 'GPay · PhonePe · Paytm'],
    ['card', 'Credit / Debit card', 'Visa · Mastercard · RuPay'],
    ['netbanking', 'Net banking', 'All major banks'],
    ['neft', 'NEFT / RTGS', 'Bank transfer'],
  ];
  return (
    <div className="page" style={{ maxWidth: 520 }}>
      <div className="page-head">
        <div>
          <div className="crumb">Secure payment</div>
          <h1>Pay {formatINR(order.grand)}</h1>
          <p>Order {order.id} · {persona.company}</p>
        </div>
        <button className="btn btn-ghost" onClick={onBack}><IconArrowLeft size={16} /> Back</button>
      </div>
      <div className="card card-pad">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--emerald-ink)', fontWeight: 600, marginBottom: 16 }}>
          <IconShield size={15} /> 256-bit encrypted · Eurostar Secure Checkout
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {methods.map(([id, title, sub]) => (
            <label key={id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 13, border: '1px solid ' + (method === id ? 'var(--ink)' : 'var(--border)'), borderRadius: 'var(--r-md)', cursor: 'pointer', background: method === id ? 'var(--paper-2)' : 'transparent' }}>
              <input type="radio" name="pm" checked={method === id} onChange={() => setMethod(id)} style={{ accentColor: 'var(--emerald)' }} />
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div><div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{sub}</div></div>
            </label>
          ))}
        </div>
        <button className="btn btn-accent btn-lg btn-block" disabled={processing} onClick={pay}>
          {processing ? 'Processing…' : <React.Fragment><IconShield size={16} /> Pay {formatINR(order.grand)}</React.Fragment>}
        </button>
        <div style={{ fontSize: 11, color: 'var(--fg-meta)', textAlign: 'center', marginTop: 12 }}>
          You'll return to Eurostar once payment is confirmed.
        </div>
      </div>
    </div>
  );
}

function ConfirmationScreen({ order, persona, setRoute }) {
  // Record the order in this account's "Your orders" list — the static demo
  // orders never grew when a real order was placed. Runs for offline orders
  // too: the customer placed it either way.
  React.useEffect(() => {
    try {
      // Same key the orders screen reads — the signed-in identity, not the
      // demo persona (see myOrdersKey in screen-orders.jsx).
      const mk = window.myOrdersKey ? myOrdersKey(persona) : 'eurostar-my-orders-' + (persona.id || persona.code || 'guest');
      const mine = JSON.parse(localStorage.getItem(mk) || '[]') || [];
      if (!mine.some((o) => o.id === order.id)) {
        const isCredit = ['15', '30', '45', '60'].includes(String(persona.terms));
        mine.unshift({
          id: order.id,
          date: new Date().toISOString().slice(0, 10),
          status: 'pending',
          lines: order.lines || [],
          placedTotal: order.grand || 0,
          paymentTerm: order.paid ? 'Paid' : isCredit ? 'NET ' + persona.terms : 'Cash',
          notes: order.notes || '',
          ship: '', expected: order.dispatchBy || '',
          custName: (order.customer && order.customer.name) || '',
          custPhone: (order.customer && order.customer.phone) || '',
        });
        localStorage.setItem(mk, JSON.stringify(mine));
      }
    } catch (e) {}
  }, []);
  // Push this order onto the shared CRM bus so the office sees it on the Order desk.
  // Skip when queued offline — it syncs from the offline queue when the connection returns.
  React.useEffect(() => {
    if (order.queuedOffline) return;
    try {
      const k = 'eurostar-crm-incoming-orders';
      const arr = JSON.parse(localStorage.getItem(k) || '[]') || [];
      if (!arr.some((o) => o.id === order.id)) {
        arr.unshift({
          id: order.id,
          customer: persona.company,
          code: persona.code || '',
          city: (persona.location || '').split(',')[0].trim(),
          rep: localStorage.getItem('eurostar-rep-name') || 'Rohit Shah',
          repId: localStorage.getItem('eurostar-rep-id') || 'REP-204',
          value: order.grand || 0,
          dispatchBy: order.dispatchBy || '',
          isExport: !!order.isExport,
          paid: !!order.paid,
          ts: Date.now(),
          source: 'Sales App',
          // What was actually bought. Without this the office (and the server's
          // stock accounting) receive a bare total with no products on it, so
          // nothing can be taken off inventory.
          lines: Array.isArray(order.lines) ? order.lines : []
        });
        localStorage.setItem(k, JSON.stringify(arr));
      }
    } catch (e) {}
    // The SKUs just lost stock to this order. Re-pull them so the pads and
    // listings show what is actually left instead of the counts this page was
    // loaded with — a SKU bought down to zero must now read as sold out.
    // Deferred so the order POST (fired by the storage write above) lands first.
    if (window.refreshCatalogProducts) setTimeout(function () { window.refreshCatalogProducts(); }, 600);
  }, []);
  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <div className="card card-pad" style={{ padding: 40, textAlign: 'center', marginBottom: 20 }}>
        <div style={{ width: 68, height: 68, borderRadius: '50%', margin: '0 auto 20px', background: order.queuedOffline ? '#3A2E12' : 'var(--emerald)', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconCheck size={34} strokeWidth={2.5} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 32, letterSpacing: '-0.02em', margin: '0 0 8px' }}>{order.queuedOffline ? 'Saved offline' : 'Order placed'}</h1>
        <p style={{ color: 'var(--fg-muted)', fontSize: 15, margin: '0 0 4px' }}>{order.queuedOffline ? `Thank you, ${persona.company}. This order is saved on your device and will sync to the office automatically when you're back online.` : `Thank you, ${persona.company}. Your order is confirmed and with our team.`}</p>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: '14px 0' }}>{order.id}</div>
        <div style={{ display: 'inline-flex', gap: 24, padding: '14px 24px', background: 'var(--paper-2)', borderRadius: 'var(--r-md)', margin: '4px 0 8px' }}>
          <div><div style={{ fontSize: 11, color: 'var(--fg-meta)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</div><div style={{ fontFamily: 'var(--font-serif)', fontSize: 19, fontWeight: 600 }}>{formatINR(order.grand)}</div></div>
          <div><div style={{ fontSize: 11, color: 'var(--fg-meta)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dispatch by</div><div style={{ fontFamily: 'var(--font-serif)', fontSize: 19, fontWeight: 600 }}>{order.dispatchBy}</div></div>
          <div><div style={{ fontSize: 11, color: 'var(--fg-meta)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Terms</div><div style={{ fontFamily: 'var(--font-serif)', fontSize: 19, fontWeight: 600 }}>{order.isExport ? 'LC' : (['15','30','45','60'].includes(String(persona.terms)) ? 'NET ' + persona.terms : 'Cash')}</div></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button className="btn btn-secondary" onClick={() => setRoute({ name: 'home' })}>Continue browsing</button>
      </div>
    </div>
  );
}

Object.assign(window, { cartTotals, CheckoutScreen, ConfirmationScreen, PaymentScreen });
