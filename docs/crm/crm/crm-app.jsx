// crm-app.jsx — Eurostar CRM: Admin · Sales Rep · Back Office (full multi-screen navigation)
const { useState } = React;
const H = window.CRM_HELPERS;
// Bump with every deploy. Logged on boot so "which build is this browser
// running?" is answerable in one glance instead of guessed at.
const CRM_BUILD = 'v28';
try { console.log('[Eurostar CRM] build ' + CRM_BUILD + ' — orders load live from /orders'); } catch (e) {}

const FLOW = ['new', 'confirmed', 'packed', 'shipped', 'out-for-delivery', 'delivered'];
// Terminal states outside the forward pipeline.
const ORDER_TERMINAL = ['cancelled', 'rejected', 'returned', 'refunded'];

/* ===== Ingest reps onboarded from the LMS (shared localStorage bus) =====
   The LMS writes a rep record to 'eurostar-crm-new-hires' on "Onboard to CRM".
   Merge them into the globals BEFORE any component reads them, so the new rep
   shows up in Reps & commission, the role switcher, and city-based lead routing. */
(function ingestLmsHires() {
  try {
    const hires = JSON.parse(localStorage.getItem('eurostar-crm-new-hires') || '[]') || [];
    if (!hires.length) return;
    window.CRM_REPS = window.CRM_REPS || [];
    window.CRM_CITY_REP = window.CRM_CITY_REP || {};
    hires.forEach((h) => {
      if (!window.CRM_REPS.some((r) => r.id === h.id)) window.CRM_REPS.push({ ...h });
      if (h.city && !window.CRM_CITY_REP[h.city]) window.CRM_CITY_REP[h.city] = h.id;
    });
  } catch (e) {}
})();

/* ===== Customer Master — protected list of existing customers (GST-keyed) =====
   Persisted in localStorage so it survives reloads and is the source of truth for
   duplicate detection when importing purchased leads. */
const MASTER_KEY = 'eurostar-customer-master-v1';
const normGst = (g) => String(g || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
function loadMaster() {try {return JSON.parse(localStorage.getItem(MASTER_KEY) || 'null');} catch (e) {return null;}}
function saveMaster(rows) {try {localStorage.setItem(MASTER_KEY, JSON.stringify(rows));} catch (e) {}}
// Seed once from the CRM's existing customers that already carry a GST.
function seedMasterIfEmpty() {
  if (loadMaster()) return loadMaster();
  const seed = (window.CRM_CUSTOMERS || []).filter((c) => c.gst && normGst(c.gst).length >= 6).
  map((c) => ({ name: c.name, gst: normGst(c.gst), city: c.city || '', address: c.address || '', mobile: c.mobile || '', source: 'CRM' }));
  saveMaster(seed);return seed;
}
function masterGstSet() {return new Set((loadMaster() || []).map((r) => normGst(r.gst)).filter(Boolean));}
const normName = (n) => String(n || '').toLowerCase().replace(/\b(jewel+ers?|jewell?ery|gold|cast(ing)?|ornaments?|palace|works?|co|company|pvt|ltd|llp|the|and|&)\b/g, '').replace(/[^a-z0-9]/g, '');
const normMobile = (m) => String(m || '').replace(/\D/g, '').slice(-10);
// Match an incoming lead against the master. Strong key = GST; fallback = name + (city or mobile).
function masterMatch(gst, name, city, mobile) {
  const list = loadMaster() || [];const g = normGst(gst);
  if (g) {const hit = list.find((r) => normGst(r.gst) === g);if (hit) return { ...hit, _by: 'GST' };}
  const nn = normName(name);const mm = normMobile(mobile);const cc = String(city || '').toLowerCase().trim();
  if (nn && nn.length >= 3) {const hit = list.find((r) => normName(r.name) === nn && (cc && String(r.city || '').toLowerCase().trim() === cc || mm && normMobile(r.mobile) === mm));if (hit) return { ...hit, _by: 'name + ' + (cc && String(hit.city || '').toLowerCase().trim() === cc ? 'city' : 'mobile') };}
  if (mm) {const hit = list.find((r) => normMobile(r.mobile) === mm);if (hit) return { ...hit, _by: 'mobile' };}
  return null;
}

function Pill({ s, label }) {
  const cls = (s || '').replace(/-/g, '');
  return <span className={`pill ${cls}`}>{label || s}</span>;
}
function statusLabel(s) {
  return { 'new': 'New', 'awaiting-payment': 'Awaiting payment', 'confirmed': 'Confirmed', 'packed': 'Packed', 'shipped': 'Dispatched', 'dispatched': 'Dispatched',
    'out-for-delivery': 'Out for delivery', 'delivered': 'Delivered',
    'cancelled': 'Cancelled', 'rejected': 'Rejected', 'returned': 'Returned', 'refunded': 'Refunded',
    'active': 'Open cart', 'abandoned': 'Abandoned', 'quote-requested': 'Quote requested', 'open': 'Open', 'answered': 'Answered' }[s] || s;
}
function SecHead({ title, meta }) {
  return <div className="crm-sec-head" style={{ padding: '16px 16px 0' }}><h2>{title}</h2>{meta && <span className="meta">{meta}</span>}</div>;
}
function PageHead({ title, sub }) {
  return <div style={{ marginBottom: 18 }}>
    <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 26, margin: '0 0 4px', letterSpacing: '-0.01em' }}>{title}</h2>
    {sub && <div className="crm-muted" style={{ fontSize: 13.5 }}>{sub}</div>}
  </div>;
}

/* ===================== ADMIN SCREENS ===================== */
function AdminDashboard({ st }) {
  const { customers, byRep, maxSales } = st;
  // Every headline number comes from the server-computed summary (real DB
  // queries); the local arrays are only a fallback for first paint / offline.
  const S = st.summary || {};
  const num = (v, fb) => (v == null ? fb : v);
  const openCarts = st.carts.filter((c) => c.status !== 'abandoned');
  const abandoned = st.carts.filter((c) => c.status === 'abandoned');
  const totalSales = num(S.mtdSales, CRM_ORDERS.reduce((a, o) => a + o.value, 0));
  const ordersCount = num(S.orders, st.orders.length);
  const pendingCount = num(S.pendingOrders, st.orders.filter((o) => o.status === 'new').length);
  const openCartsCount = num(S.openCarts, openCarts.length);
  const openCartsValue = num(S.openCartsValue, openCarts.reduce((a, c) => a + c.value, 0));
  const activeCustCount = num(S.activeCustomers, customers.filter((c) => c.active).length);
  // Real month-over-month from the hydrated series (oldest-first). Was a
  // hardcoded "▲ 12%".
  const mom = (() => {
    const s = CRM_SALES_BY_MONTH;
    if (!s || s.length < 2) return null;
    const cur = s[s.length - 1].revenue, prev = s[s.length - 2].revenue;
    if (!prev) return null;
    return Math.round(((cur - prev) / prev) * 100);
  })();
  return (
    <div className="crm-body">
      <AdminCoachDigest st={st} />
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">{CT('kpi_total_sales','Total sales (MTD)')}</div><div className="kpi-value">{H.inr(totalSales)}</div><div className="kpi-sub">{mom === null ? <span className="crm-muted">—</span> : <span className={mom >= 0 ? 'up' : 'down'}>{mom >= 0 ? '▲' : '▼'} {Math.abs(mom)}%</span>} {CT('kpi_vs_last','vs last month')}</div></div>
        <div className="kpi"><div className="kpi-label">{CT('kpi_orders','Orders')}</div><div className="kpi-value">{ordersCount}</div><div className="kpi-sub">{pendingCount} {CT('kpi_awaiting','awaiting review')}</div></div>
        <div className="kpi"><div className="kpi-label">{CT('kpi_open_carts','Open carts')}</div><div className="kpi-value">{openCartsCount}</div><div className="kpi-sub">{H.inr(openCartsValue)} {CT('kpi_in_play','in play')}</div></div>
        <div className="kpi"><div className="kpi-label">{CT('kpi_abandoned','Abandoned value')}</div><div className="kpi-value">{H.inr(abandoned.reduce((a, c) => a + c.value, 0))}</div><div className="kpi-sub"><span className="down">{CT('kpi_carts_recover', abandoned.length + ' carts to recover', { n: abandoned.length })}</span></div></div>
        <div className="kpi"><div className="kpi-label">{CT('kpi_active_cust','Active customers')}</div><div className="kpi-value">{activeCustCount}</div><div className="kpi-sub">{CT('kpi_across_reps', 'across ' + CRM_REPS.length + ' reps', { n: CRM_REPS.length })}</div></div>
      </div>
      <div className="crm-cols">
        <div className="crm-card">
          <SecHead title={CT('sec_recent_orders','Recent orders')} meta={CT('sec_all_reps','All reps')} />
          <table className="crm-table">
            <thead><tr><th>{TH("Order")}</th><th>{TH("Customer")}</th><th>{TH("Rep")}</th><th>{TH("Status")}</th><th style={{ textAlign: 'right' }}>{TH("Value")}</th></tr></thead>
            <tbody>{st.orders.slice(0, 6).map((o) => {const c = H.cust(o.cust);
              const name = (c.name && c.name !== o.cust) ? c.name : (o.custName || o.cust || '—');
              const sub = o.cust && o.cust !== name ? o.cust : (c.city || o.custCity || '');
              const repName = H.rep(c.rep).name && c.rep ? H.rep(c.rep).name : (o.repName || '');
              return (
                  <tr key={o.id}><td className="crm-id">{o.id}</td><td>{name}<div className="crm-muted" style={{ fontSize: 11 }}>{sub}</div></td>
              <td className="crm-muted">{repName}</td><td><Pill s={o.status} label={statusLabel(o.status)} /></td>
              <td className="crm-amt" style={{ textAlign: 'right' }}>{H.inr(o.value)}</td></tr>);})}</tbody>
          </table>
        </div>
        <div className="crm-card" style={{ padding: 18 }}>
          <div className="crm-sec-head"><h2>{CT('sec_sales_by_rep','Sales by rep')}</h2><span className="meta">MTD</span></div>
          <div className="barchart">
            {byRep.map((r) =>
            <div key={r.id} className="bar-row">
                <span>{r.name}<div className="crm-muted" style={{ fontSize: 11 }}>{r.region}</div></span>
                <div className="bar-track"><div className="bar-fill" style={{ width: r.sales / maxSales * 100 + '%' }} /></div>
                <span className="bar-val">{H.inr(r.sales)}</span>
              </div>
            )}
          </div>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--divider)', fontSize: 12.5, color: 'var(--fg-muted)' }}>
            {CT('commission_payable','Commission payable')}: <strong style={{ color: 'var(--fg)' }}>{H.inr(byRep.reduce((a, r) => a + r.comm, 0))}</strong>
          </div>
        </div>
      </div>
    </div>);

}

function AdminCustomers({ st }) {
  const { customers, setTerms, toggleSuspend } = st;
  const [cityF, setCityF] = useState('');
  const [adding, setAdding] = useState(false);
  const [nf, setNf] = useState({ name: '', city: '', mobile: '', gst: '', rep: '' });
  const setv = (k, v) => setNf((p) => ({ ...p, [k]: v }));
  const ninp = { padding: '9px 11px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 13, fontFamily: 'inherit', color: 'var(--fg)' };
  const saveCust = () => {if (!nf.name || !nf.mobile) {alert('Name and mobile are required.');return;}st.addCustomer(nf.rep, { name: nf.name, city: nf.city, mobile: nf.mobile, gst: nf.gst || '—' });setNf({ name: '', city: '', mobile: '', gst: '', rep: '' });setAdding(false);};
  const cities = [...new Set(customers.map((c) => c.city))].sort();
  const list = cityF ? customers.filter((c) => c.city === cityF) : customers;
  const MISUSE = 10;
  const flagged = customers.filter((c) => c.active && (c.cartViewsNoOrder || 0) >= MISUSE);
  return (
    <div className="crm-body">
      <PageHead title="Customers" sub={`${customers.filter((c) => c.active).length} active · ${customers.filter((c) => !c.active).length} suspended`} />
      <div style={{ display: 'flex', marginBottom: 14 }}>
        <button className="cbtn cbtn-accent" style={{ fontSize: 16, padding: '14px 26px', fontWeight: 700, boxShadow: '0 8px 24px rgba(14,92,74,0.18)' }} onClick={() => setAdding((s) => !s)}>
          <span style={{ fontSize: 22, marginRight: 8 }}>＋</span> Add new customer
        </button>
      </div>
      {adding &&
      <div className="crm-card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>New customer</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
          <input style={ninp} placeholder="Customer name *" value={nf.name} onChange={(e) => setv('name', e.target.value)} />
          <input style={ninp} placeholder="City" value={nf.city} onChange={(e) => setv('city', e.target.value)} />
          <input style={ninp} placeholder="Mobile *" value={nf.mobile} onChange={(e) => setv('mobile', e.target.value)} />
          <input style={ninp} placeholder="GST / PAN" value={nf.gst} onChange={(e) => setv('gst', e.target.value)} />
          <select style={ninp} value={nf.rep} onChange={(e) => setv('rep', e.target.value)}>
            <option value="">Assign rep (optional)</option>
            {CRM_REPS.map((r) => <option key={r.id} value={r.id}>{r.name} · {r.region}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
          <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => setAdding(false)}>Cancel</button>
          <button className="cbtn cbtn-accent cbtn-sm" onClick={saveCust}>Add customer</button>
        </div>
      </div>}
      {flagged.length > 0 &&
      <div className="crm-card" style={{ borderColor: '#E6B8BE', background: 'var(--ruby-soft)', marginBottom: 16 }}>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontWeight: 700, color: 'var(--ruby)', fontSize: 14, marginBottom: 6 }}>⚠ {flagged.length} customer{flagged.length > 1 ? 's' : ''} flagged for possible misuse — viewing cart without ordering</div>
          {flagged.map((c) =>
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderTop: '1px solid #E6B8BE', fontSize: 13 }}>
              <div style={{ flex: 1 }}><strong>{c.name}</strong> <span className="crm-id crm-muted">· {c.id} · {c.city}</span>
                <div className="crm-muted" style={{ fontSize: 12 }}>Viewed cart <strong style={{ color: 'var(--ruby)' }}>{c.cartViewsNoOrder} times</strong> without placing an order</div></div>
              <button className="cbtn cbtn-ghost cbtn-sm" style={{ color: 'var(--ruby)' }} onClick={() => {if (confirm('Suspend ' + c.name + '? They must contact you to reactivate.')) toggleSuspend(c.id);}}>Suspend login</button>
            </div>
          )}
        </div>
      </div>}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
        <span className="crm-muted" style={{ fontSize: 13 }}>Filter by city</span>
        <select className="disc-input" style={{ width: 160, textAlign: 'left' }} value={cityF} onChange={(e) => setCityF(e.target.value)}>
          <option value="">All cities ({customers.length})</option>
          {cities.map((c) => <option key={c} value={c}>{c} ({customers.filter((x) => x.city === c).length})</option>)}
        </select>
        {cityF && <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => setCityF('')}>Clear</button>}
      </div>
      <div className="crm-card">
        <table className="crm-table">
          <thead><tr><th>{TH("Code")}</th><th>{TH("Customer")}</th><th>{TH("City")}</th><th>{TH("GST")}</th><th>{TH("Mobile")}</th><th>{TH("Rep")}</th><th style={{ textAlign: 'center' }}>{TH("Cart views")}<br />{TH("(no order)")}</th><th>{TH("Payment terms")}</th><th>{TH("Login")}</th><th></th></tr></thead>
          <tbody>{list.map((c) => {const flag = (c.cartViewsNoOrder || 0) >= MISUSE;return (
                <tr key={c.id} style={{ opacity: c.active ? 1 : 0.6 }}><td className="crm-id">{c.id}</td><td>{c.name}</td><td className="crm-muted">{c.city}</td>
            <td className="crm-id crm-muted">{c.gst}</td><td className="crm-muted" style={{ fontSize: 12 }}>{c.mobile}</td><td className="crm-muted">{H.rep(c.rep).name}</td>
            <td style={{ textAlign: 'center' }}><span style={{ fontWeight: 700, color: flag ? 'var(--ruby)' : 'var(--fg-muted)' }}>{c.cartViewsNoOrder || 0}</span>{flag && <div style={{ fontSize: 10, color: 'var(--ruby)', fontWeight: 700 }}>⚠ flag</div>}</td>
            <td><select className="disc-input" style={{ width: 92, textAlign: 'left' }} value={c.terms} onChange={(e) => setTerms(c.id, e.target.value)}>
              <option value="cash">Cash</option><option value="15">15 days</option><option value="30">30 days</option><option value="45">45 days</option><option value="60">60 days</option></select></td>
            <td>{c.active ? <Pill s="active" label="Active" /> : <Pill s="abandoned" label="Suspended" />}</td>
            <td style={{ textAlign: 'right' }}>{c.active ?
                    <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => toggleSuspend(c.id)}>Suspend</button> :
                    <button className="cbtn cbtn-primary cbtn-sm" onClick={() => toggleSuspend(c.id)}>Reactivate</button>}</td></tr>);
            })}</tbody>
        </table>
      </div>
    </div>);

}

function CourierCell({ o, setCourier }) {
  const [open, setOpen] = useState(false);
  const [courier, setC] = useState(o.courier || '');
  const [track, setT] = useState(o.track || '');
  const [notified, setNotified] = useState(false);
  const fileRef = React.useRef(null);
  const onSlip = (e) => {const f = e.target.files && e.target.files[0];if (!f) return;const r = new FileReader();r.onload = () => setCourier(o.id, { courier, track, slip: r.result });r.readAsDataURL(f);};
  if (!open) {
    return <div style={{ fontSize: 12 }}>
      {o.courier || o.slip ? <span className="crm-muted">{o.courier || '—'} {o.track || ''}{o.slip && <span title="Slip image attached"> 📎</span>}</span> : <span className="crm-muted">—</span>}
      <button className="cbtn cbtn-ghost cbtn-sm" style={{ marginLeft: 8 }} onClick={() => setOpen(true)}>{o.courier ? 'Edit' : 'Add courier'}</button>
      {(o.courier || o.track) && <div style={{ fontSize: 11, color: 'var(--emerald-ink)', marginTop: 3 }}>💬 Mira notified the customer</div>}
    </div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
      <input value={courier} onChange={(e) => setC(e.target.value)} placeholder="Courier (e.g. Bluedart)" style={{ padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 12, fontFamily: 'inherit' }} />
      <input value={track} onChange={(e) => setT(e.target.value)} placeholder="Tracking no. (optional)" style={{ padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 12, fontFamily: 'var(--font-mono)' }} />
      <input ref={fileRef} type="file" accept="image/*" onChange={onSlip} style={{ display: 'none' }} />
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => fileRef.current && fileRef.current.click()}>📎 {o.slip ? 'Replace slip' : 'Upload slip'}</button>
        {o.slip && <img src={o.slip} alt="slip" style={{ width: 26, height: 26, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border)' }} />}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="cbtn cbtn-accent cbtn-sm" onClick={() => {setCourier(o.id, { courier, track });setNotified(true);setOpen(false);}}>Save &amp; notify customer</button>
        <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => setOpen(false)}>Close</button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--crm-muted, #8a8372)' }}>💬 On save, Mira sends the courier &amp; tracking to the customer in the Sales App.</div>
    </div>);

}

function OrdersTable({ orders, advance, showRep, setCourier }) {
  return (
    <div className="crm-card">
      <table className="crm-table">
        <thead><tr><th>{TH("Order")}</th><th>{TH("Customer")}</th>{showRep && <th>{TH("Rep")}</th>}<th>{TH("Date")}</th><th>{TH("Items")}</th><th>{TH("Status")}</th><th>{TH("Courier / Tracking")}</th><th style={{ textAlign: 'right' }}>{TH("Value")}</th>{advance && <th></th>}</tr></thead>
        <tbody>{orders.map((o) => {const c = H.cust(o.cust);const next = FLOW[FLOW.indexOf(o.status) + 1];return (
              <tr key={o.id}><td className="crm-id">{o.id}</td><td>{c.name}<div className="crm-muted" style={{ fontSize: 11 }}>{c.city}</div></td>
          {showRep && <td className="crm-muted">{H.rep(c.rep).name}</td>}<td className="crm-muted" style={{ fontSize: 12 }}>{o.date}</td>
          <td className="crm-muted">{o.items}</td><td><Pill s={o.status} label={statusLabel(o.status)} /></td>
          <td>{setCourier ? <CourierCell o={o} setCourier={setCourier} /> : <span className="crm-muted" style={{ fontSize: 12 }}>{o.courier ? `${o.courier} ${o.track || ''}` : '—'}</span>}</td>
          <td className="crm-amt" style={{ textAlign: 'right' }}>{H.inr(o.value)}{o.discount ? <div style={{ fontSize: 11, color: 'var(--emerald-ink)' }}>{o.discount}% off</div> : null}</td>
          {advance && <td style={{ textAlign: 'right' }}>{next ? <button className="cbtn cbtn-primary cbtn-sm" onClick={() => advance(o.id)}>Mark {statusLabel(next)} →</button> : <span className="crm-muted" style={{ fontSize: 12 }}>Done</span>}</td>}</tr>);})}</tbody>
      </table>
    </div>);

}

function AdminOrders({ st }) {
  return (
    <div className="crm-body">
      <PageHead title={CT('page_orders', 'Orders')} sub={`${st.orders.length} ${CT('orders_across_reps', 'orders across all reps')}`} />
      <div className="crm-card">
        <table className="crm-table">
          <thead><tr><th>{TH("Order")}</th><th>{TH("Customer")}</th><th>{TH("Rep")}</th><th>{TH("Date")}</th><th>{TH("Items")}</th><th style={{ textAlign: 'right' }}>{TH("Value")}</th></tr></thead>
          <tbody>{st.orders.map((o) => {const c = H.cust(o.cust);
            // Business name first, customer code underneath. H.cust falls back to
            // returning the id as the name when the customer isn't in the master
            // list, so prefer the name the order itself carries.
            const name = (c.name && c.name !== o.cust) ? c.name : (o.custName || o.cust || '—');
            const sub = o.cust && o.cust !== name ? o.cust : (c.city || o.custCity || '');
            const repName = H.rep(c.rep).name && c.rep ? H.rep(c.rep).name : (o.repName || '');
            return (
                <tr key={o.id}><td className="crm-id">{o.id}</td><td>{name}<div className="crm-muted" style={{ fontSize: 11 }}>{sub}</div></td>
            <td className="crm-muted">{repName}</td><td className="crm-muted" style={{ fontSize: 12 }}>{o.date}</td>
            <td className="crm-muted">{o.items}</td>
            <td className="crm-amt" style={{ textAlign: 'right' }}>{H.inr(o.value)}{o.discount ? <div style={{ fontSize: 11, color: 'var(--emerald-ink)' }}>{o.discount}% off</div> : null}</td></tr>);})}</tbody>
        </table>
      </div>
    </div>);

}

function AdminReports({ st }) {
  const [tab, setTab] = React.useState('category');
  const [period, setPeriod] = React.useState('month');
  const byCat = window.CRM_SALES_BY_CATEGORY || [];
  const byMonth = window.CRM_SALES_BY_MONTH || [];
  const creditCusts = st.customers.filter((c) => ['15', '30', '45', '60'].includes(String(c.terms)));
  // outstanding: billed (from orders) minus confirmed payments = live balance
  const outstanding = creditCusts.map((c) => {const os = st.orders.filter((o) => o.cust === c.id);
    const billed = os.reduce((a, o) => a + o.value, 0);const paid = st.paidByCust(c.id);const due = Math.max(0, billed - paid);const days = [12, 28, 41, 55][(c.id.charCodeAt(6) || 0) % 4];
    return { ...c, billed, paid, due, days, overdue: due > 0 && days > parseInt(c.terms, 10) };}).filter((c) => c.billed > 0);
  const maxCat = Math.max(...byCat.map((x) => x.revenue), 1);
  const maxMonth = Math.max(...byMonth.map((x) => x.revenue), 1);
  const totalReceivable = outstanding.reduce((a, c) => a + c.due, 0);

  const csv = (rows, filename) => {
    const txt = rows.map((r) => r.map((v) => {const s = String(v);return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;}).join(',')).join('\n');
    const blob = new Blob([txt], { type: 'text/csv' });const url = URL.createObjectURL(blob);
    const a = document.createElement('a');a.href = url;a.download = filename;a.click();URL.revokeObjectURL(url);
  };
  const exportCurrent = () => {
    if (tab === 'category') csv([['Category', 'Revenue', 'Orders'], ...byCat.map((x) => [x.cat, x.revenue, x.orders])], 'sales-by-category.csv');else
    if (tab === 'month') csv([['Month', 'Revenue', 'Orders'], ...byMonth.map((x) => [x.m, x.revenue, x.orders])], 'sales-by-month.csv');else
    csv([['Code', 'Customer', 'City', 'Terms', 'Billed', 'Received', 'Balance', 'Days outstanding', 'Status'], ...outstanding.map((c) => [c.id, c.name, c.city, c.terms + ' days', c.billed, c.paid, c.due, c.days, c.due === 0 ? 'CLEARED' : c.overdue ? 'OVERDUE' : 'on time'])], 'outstanding-payments.csv');
  };

  return (
    <div className="crm-body">
      <PageHead title="Reports" sub="Sales analytics & receivables · export to Excel" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['category', 'Sales by category'], ['month', 'Sales by month'], ['outstanding', 'Outstanding payments']].map(([id, t]) =>
        <button key={id} className={`cbtn cbtn-sm ${tab === id ? 'cbtn-primary' : 'cbtn-ghost'}`} onClick={() => setTab(id)}>{t}</button>
        )}
        <select className="disc-input" style={{ width: 130, textAlign: 'left', marginLeft: 'auto' }} value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="month">This month</option><option value="last">Last month</option><option value="quarter">This quarter</option><option value="ytd">Year to date</option>
        </select>
        <button className="cbtn cbtn-accent cbtn-sm" onClick={exportCurrent}>⬇ Export CSV</button>
      </div>

      {tab === 'category' &&
      <div className="crm-card" style={{ padding: 18 }}>
        <div className="barchart">
          {byCat.slice().sort((a, b) => b.revenue - a.revenue).map((x) =>
          <div key={x.cat} className="bar-row" style={{ gridTemplateColumns: '180px 1fr 110px' }}>
              <span>{x.cat}<div className="crm-muted" style={{ fontSize: 11 }}>{x.orders} orders</div></span>
              <div className="bar-track"><div className="bar-fill" style={{ width: x.revenue / maxCat * 100 + '%' }} /></div>
              <span className="bar-val">{H.inr(x.revenue)}</span>
            </div>
          )}
        </div>
      </div>}

      {tab === 'month' &&
      <div className="crm-card" style={{ padding: 18 }}>
        <div className="barchart">
          {byMonth.map((x) =>
          <div key={x.m} className="bar-row" style={{ gridTemplateColumns: '110px 1fr 110px' }}>
              <span>{x.m}<div className="crm-muted" style={{ fontSize: 11 }}>{x.orders} orders</div></span>
              <div className="bar-track"><div className="bar-fill" style={{ width: x.revenue / maxMonth * 100 + '%' }} /></div>
              <span className="bar-val">{H.inr(x.revenue)}</span>
            </div>
          )}
        </div>
      </div>}

      {tab === 'outstanding' &&
      <div>
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          <div className="kpi"><div className="kpi-label">Total receivable</div><div className="kpi-value">{H.inr(totalReceivable)}</div><div className="kpi-sub">{H.inr(outstanding.reduce((a, c) => a + c.paid, 0))} received</div></div>
          <div className="kpi"><div className="kpi-label">Credit customers</div><div className="kpi-value">{outstanding.filter((c) => c.due > 0).length}</div><div className="kpi-sub">{outstanding.filter((c) => c.due === 0).length} cleared</div></div>
          <div className="kpi"><div className="kpi-label">Overdue</div><div className="kpi-value" style={{ color: 'var(--ruby)' }}>{outstanding.filter((c) => c.overdue).length}</div></div>
        </div>
        <div className="crm-card">
          <table className="crm-table">
            <thead><tr><th>{TH("Code")}</th><th>{TH("Customer")}</th><th>{TH("City")}</th><th>{TH("Terms")}</th><th style={{ textAlign: 'right' }}>{TH("Billed")}</th><th style={{ textAlign: 'right' }}>{TH("Received")}</th><th style={{ textAlign: 'right' }}>{TH("Balance")}</th><th style={{ textAlign: 'center' }}>{TH("Days")}</th><th>{TH("Status")}</th></tr></thead>
            <tbody>{outstanding.map((c) =>
              <tr key={c.id}><td className="crm-id">{c.id}</td><td>{c.name}</td><td className="crm-muted">{c.city}</td><td className="crm-muted">{c.terms} days</td>
              <td className="crm-muted" style={{ textAlign: 'right' }}>{H.inr(c.billed)}</td>
              <td style={{ textAlign: 'right', color: c.paid > 0 ? 'var(--emerald-ink)' : 'var(--fg-meta)' }}>{c.paid > 0 ? H.inr(c.paid) : '—'}</td>
              <td className="crm-amt" style={{ textAlign: 'right', fontWeight: 700 }}>{H.inr(c.due)}</td><td style={{ textAlign: 'center' }}>{c.due === 0 ? '—' : c.days}</td>
              <td>{c.due === 0 ? <Pill s="active" label="Cleared" /> : c.overdue ? <Pill s="abandoned" label="Overdue" /> : <Pill s="active" label="On time" />}</td></tr>
              )}
            {outstanding.length === 0 && <tr><td colSpan="9" className="crm-muted" style={{ padding: '14px 16px' }}>No credit customers with dues.</td></tr>}</tbody>
          </table>
        </div>
      </div>}
    </div>);

}

function AdminAttendance({ st }) {
  // Full month: June 2026 (30 days). Today = the 16th (rest of month still upcoming).
  const TODAY = 16,DIM = 30;
  const days = [];for (let d = 1; d <= DIM; d++) {const wd = new Date(2026, 5, d).getDay();days.push({ d, sunday: wd === 0 });}
  const workingTotal = days.filter((x) => !x.sunday).length;
  return (
    <div className="crm-body">
      <PageHead title="Attendance" sub="June 2026 · full month · daily check-ins" />
      <div className="crm-card">
        <table className="crm-table" style={{ minWidth: 1100 }}>
          <thead><tr><th style={{ position: 'sticky', left: 0, background: 'var(--paper-2)', zIndex: 1 }}>{TH("Rep")}</th>
            {days.map((x) => <th key={x.d} style={{ textAlign: 'center', padding: '10px 5px', color: x.sunday ? 'var(--ink-4)' : 'var(--fg-meta)' }}>{x.d}</th>)}
            <th style={{ textAlign: 'right' }}>{TH("Worked")}</th></tr></thead>
          <tbody>{CRM_REPS.map((r) => {const a = (window.CRM_ATTENDANCE || {})[r.id] || { present: [], leave: [], absent: [] };
              const isCheckedToday = st.checkin && st.checkin[r.id];const present = [...a.present];if (isCheckedToday && !present.includes(TODAY)) present.push(TODAY);
              const worked = present.length;
              return (
                <tr key={r.id}><td style={{ position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 1 }}>{r.name}<div className="crm-id crm-muted" style={{ fontSize: 11 }}>{r.id}</div></td>
            {days.map((x) => {let bg = 'transparent',mark = '',col = 'var(--ink-4)';
                    if (x.sunday) {bg = 'var(--paper-2)';mark = '·';} else
                    if (present.includes(x.d)) {bg = 'var(--emerald-soft)';mark = 'P';col = 'var(--emerald-ink)';} else
                    if (a.leave.includes(x.d)) {bg = 'var(--amber-soft)';mark = 'L';col = '#7A5214';} else
                    if (a.absent.includes(x.d)) {bg = 'var(--ruby-soft)';mark = 'A';col = 'var(--ruby)';} else
                    if (x.d > TODAY) {mark = '';} // upcoming days
                    else {bg = 'var(--ruby-soft)';mark = 'A';col = 'var(--ruby)';} // past working day, no check-in = absent
                    return <td key={x.d} style={{ textAlign: 'center', padding: '8px 3px' }}><span style={{ display: 'inline-flex', width: 20, height: 20, borderRadius: 5, background: bg, color: col, fontSize: 10.5, fontWeight: 700, alignItems: 'center', justifyContent: 'center' }}>{mark}</span></td>;})}
            <td className="crm-amt" style={{ textAlign: 'right' }}>{worked}<span className="crm-muted" style={{ fontWeight: 400 }}> / {workingTotal}</span></td></tr>);})}</tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 12.5, color: 'var(--fg-muted)', padding: '0 4px', flexWrap: 'wrap' }}>
        <span><b style={{ color: 'var(--emerald-ink)' }}>P</b> Present</span>
        <span><b style={{ color: '#7A5214' }}>L</b> Leave</span>
        <span><b style={{ color: 'var(--ruby)' }}>A</b> Absent (no check-in)</span>
        <span><b style={{ color: 'var(--ink-4)' }}>·</b> Sunday</span>
        <span>blank = upcoming day</span>
      </div>
    </div>);

}

function RepDetail({ st, repId, onBack }) {
  const rep = H.rep(repId);
  const myCust = st.customers.filter((c) => c.rep === repId);
  const ids = myCust.map((c) => c.id);
  const myOrders = st.orders.filter((o) => ids.includes(o.cust));
  const rate = st.repRates[repId] != null ? st.repRates[repId] : rep.rate;
  const sales = myOrders.reduce((a, o) => a + o.value, 0);
  const comm = Math.round(sales * rate);
  // month-by-month sales
  const months = {};
  myOrders.forEach((o) => {const m = (o.date || '').slice(0, 7);if (!m) return;months[m] = months[m] || { rev: 0, n: 0 };months[m].rev += o.value;months[m].n++;});
  const monthRows = Object.entries(months).sort((a, b) => a[0] < b[0] ? 1 : -1);
  const maxM = Math.max(...monthRows.map((m) => m[1].rev), 1);
  const mName = (m) => {const [y, mo] = m.split('-');return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(mo, 10) - 1] + ' ' + y;};
  return (
    <div className="crm-body">
      <button className="cbtn cbtn-ghost cbtn-sm" style={{ marginBottom: 14 }} onClick={onBack}>← Back to all reps</button>
      <PageHead title={rep.name} sub={`${repId} · ${rep.region || ''} · ${rep.phone || ''}`} />
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Linked customers</div><div className="kpi-value">{myCust.length}</div></div>
        <div className="kpi"><div className="kpi-label">Total sales</div><div className="kpi-value">{H.inr(sales)}</div></div>
        <div className="kpi"><div className="kpi-label">Commission rate</div><div className="kpi-value">{(rate * 100).toFixed(1)}%</div></div>
        <div className="kpi"><div className="kpi-label">Commission earned</div><div className="kpi-value" style={{ color: 'var(--emerald-ink)' }}>{H.inr(comm)}</div></div>
      </div>

      <div className="crm-cols">
        <div className="crm-card">
          <SecHead title="Linked customers" meta="De-link to free a customer for any rep" />
          <table className="crm-table">
            <thead><tr><th>{TH("Code")}</th><th>{TH("Customer")}</th><th>{TH("City")}</th><th>{TH("Mobile")}</th><th></th></tr></thead>
            <tbody>{myCust.map((c) =>
              <tr key={c.id}><td className="crm-id">{c.id}</td><td>{c.name}</td><td className="crm-muted">{c.city}</td>
              <td className="crm-muted" style={{ fontSize: 12 }}>{c.mobile}</td>
              <td style={{ textAlign: 'right' }}><button className="cbtn cbtn-ghost cbtn-sm" style={{ color: 'var(--ruby)' }} onClick={() => {if (confirm('De-link ' + c.name + ' from ' + rep.name + '? They become open for any rep to claim.')) st.delinkCustomer(c.id);}}>De-link</button></td></tr>
              )}
            {myCust.length === 0 && <tr><td colSpan="5" className="crm-muted" style={{ padding: '14px 16px' }}>No linked customers.</td></tr>}</tbody>
          </table>
        </div>
        <div className="crm-card" style={{ padding: 18 }}>
          <div className="crm-sec-head"><h2>Sales month by month</h2></div>
          <div className="barchart">
            {monthRows.map(([m, v]) =>
            <div key={m} className="bar-row" style={{ gridTemplateColumns: '90px 1fr 96px' }}>
                <span>{mName(m)}<div className="crm-muted" style={{ fontSize: 11 }}>{v.n} orders</div></span>
                <div className="bar-track"><div className="bar-fill" style={{ width: v.rev / maxM * 100 + '%' }} /></div>
                <span className="bar-val">{H.inr(v.rev)}</span>
              </div>
            )}
            {monthRows.length === 0 && <div className="crm-muted">No sales yet.</div>}
          </div>
        </div>
      </div>

      <div className="crm-card">
        <SecHead title="Orders & commission" meta={`${(rate * 100).toFixed(1)}% per order`} />
        <table className="crm-table">
          <thead><tr><th>{TH("Order")}</th><th>{TH("Customer")}</th><th>{TH("Date")}</th><th>{TH("Status")}</th><th style={{ textAlign: 'right' }}>{TH("Value")}</th><th style={{ textAlign: 'right' }}>{TH("Commission")}</th></tr></thead>
          <tbody>{myOrders.map((o) => {const c = H.cust(o.cust);return (
                <tr key={o.id}><td className="crm-id">{o.id}</td><td>{c.name}</td><td className="crm-muted" style={{ fontSize: 12 }}>{o.date}</td><td><Pill s={o.status} label={statusLabel(o.status)} /></td>
            <td className="crm-amt" style={{ textAlign: 'right' }}>{H.inr(o.value)}</td>
            <td className="crm-amt" style={{ textAlign: 'right', color: 'var(--emerald-ink)' }}>{H.inr(Math.round(o.value * rate))}</td></tr>);})}</tbody>
          <tfoot><tr><td colSpan="4" style={{ padding: '12px 16px', fontWeight: 600 }}>Total</td>
            <td className="crm-amt" style={{ textAlign: 'right', padding: '12px 16px' }}>{H.inr(sales)}</td>
            <td className="crm-amt" style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--emerald-ink)', fontWeight: 700 }}>{H.inr(comm)}</td></tr></tfoot>
        </table>
      </div>
    </div>);

}

function AdminReps({ st }) {
  const { byRep, setRate } = st;
  const blocked = st.repBlocked || {};
  const [adding, setAdding] = useState(false);
  const [viewRep, setViewRep] = useState(null);
  const [f, setF] = useState({ name: '', region: '', phone: '', rate: 4 });
  if (viewRep) return <RepDetail st={st} repId={viewRep} onBack={() => setViewRep(null)} />;
  const setv = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const inp = { padding: '9px 11px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 13, fontFamily: 'inherit', color: 'var(--fg)' };
  const save = () => {if (!f.name) {alert('Rep name is required.');return;}st.addRep(f);setF({ name: '', region: '', phone: '', rate: 4 });setAdding(false);};
  return (
    <div className="crm-body">
      <PageHead title="Reps & commission" sub="Set commission, targets, and offboard departing reps" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <button className="cbtn cbtn-accent" onClick={() => setAdding((s) => !s)}>＋ Add new rep</button>
        <button className="cbtn cbtn-ghost" onClick={() => {const el = document.getElementById('leadersPanel');if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });}}>Assign ASM / Sales Head ↓</button>
      </div>
      {adding &&
      <div className="crm-card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>New sales rep</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
          <input style={inp} placeholder="Rep name *" value={f.name} onChange={(e) => setv('name', e.target.value)} />
          <input style={inp} placeholder="Region (e.g. Gujarat)" value={f.region} onChange={(e) => setv('region', e.target.value)} />
          <input style={inp} placeholder="Phone" value={f.phone} onChange={(e) => setv('phone', e.target.value)} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><input style={{ ...inp, width: 64 }} type="number" min="0" step="0.5" value={f.rate} onChange={(e) => setv('rate', e.target.value)} /><span style={{ fontSize: 13, color: 'var(--fg-meta)' }}>% commission</span></span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
          <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => setAdding(false)}>Cancel</button>
          <button className="cbtn cbtn-accent cbtn-sm" onClick={save}>Add rep</button>
        </div>
      </div>}
      <div className="crm-card">
        <table className="crm-table">
          <thead><tr><th>{TH("Rep")}</th><th>{TH("ID")}</th><th>{TH("Region")}</th><th>{TH("Customers")}</th><th>{TH("ASM")}</th><th>{TH("Sales Head")}</th><th>{TH("New adds (min 50 / month)")}</th><th style={{ textAlign: 'right' }}>{TH("Sales (MTD)")}</th><th>{TH("Commission %")}</th><th style={{ textAlign: 'right' }}>{TH("Payable")}</th><th>{TH("Access")}</th><th></th></tr></thead>
          <tbody>{byRep.map((r) => {const nc = st.customers.filter((c) => c.rep === r.id).length;
              const target = Math.max(50, st.repTargets[r.id] != null ? st.repTargets[r.id] : r.target || 50);const added = st.newAdds[r.id] || 0;const pending = Math.max(0, target - added);
              const asms = (st.leaders || []).filter((l) => l.role === 'asm');const heads = (st.leaders || []).filter((l) => l.role === 'head');
              const isBlocked = blocked[r.id];return (
                <tr key={r.id} style={{ opacity: isBlocked ? 0.55 : 1 }}><td><button className="cbtn cbtn-ghost cbtn-sm" style={{ padding: '2px 8px', fontWeight: 600 }} onClick={() => setViewRep(r.id)}>{r.name} ↗</button>{r.fromLms && <div style={{ marginTop: 2 }}><span className="crm-id" style={{ fontSize: 9.5, background: 'var(--emerald-soft,#e6f1ec)', color: 'var(--emerald-ink,#0a3f33)', padding: '1px 6px', borderRadius: 99, fontWeight: 700 }}>FROM LMS{r.hiredOn ? ' · ' + r.hiredOn : ''}</span></div>}</td><td className="crm-id">{r.id}</td><td className="crm-muted">{r.region}</td><td className="crm-muted">{nc}</td>
            <td><select className="disc-input" style={{ width: 120, textAlign: 'left' }} value={r.asm || ''} onChange={(e) => st.setRepLeader(r.id, 'asm', e.target.value)}>
              <option value="">— none —</option>{asms.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></td>
            <td><select className="disc-input" style={{ width: 120, textAlign: 'left' }} value={r.head || ''} onChange={(e) => st.setRepLeader(r.id, 'head', e.target.value)}>
              <option value="">— none —</option>{heads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></td>
            <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 600, color: pending > 0 ? 'var(--ruby)' : 'var(--emerald-ink)' }}>{added}</span><span className="crm-muted">/</span>
              <input className="disc-input" style={{ width: 46 }} type="number" min="50" value={target} onChange={(e) => st.setTarget(r.id, e.target.value)} />
              {pending > 0 ? <span className="crm-muted" style={{ fontSize: 11 }}>({pending} left)</span> : <span style={{ fontSize: 11, color: 'var(--emerald-ink)' }}>✓</span>}
            </span></td>
            <td className="crm-amt" style={{ textAlign: 'right' }}>{H.inr(r.sales)}</td>
            <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><input className="disc-input" style={{ width: 52 }} type="number" min="0" step="0.5" value={r.rate * 100} onChange={(e) => setRate(r.id, e.target.value)} />%</span></td>
            <td className="crm-amt" style={{ textAlign: 'right', color: 'var(--emerald-ink)' }}>{H.inr(r.comm)}</td>
            <td>{isBlocked ? <Pill s="abandoned" label="Blocked" /> : <Pill s="active" label="Active" />}</td>
            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{isBlocked ?
                    <button className="cbtn cbtn-primary cbtn-sm" onClick={() => st.restoreRep(r.id)}>Restore</button> :
                    <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => st.offboardRep(r.id, r.name)}>Block &amp; de-link customers</button>}</td></tr>);})}</tbody>
          <tfoot><tr><td colSpan="9" style={{ padding: '12px 16px', fontWeight: 600 }}>Total payable</td>
            <td className="crm-amt" style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--emerald-ink)', fontWeight: 700 }}>{H.inr(byRep.reduce((a, r) => a + r.comm, 0))}</td><td colSpan="2"></td></tr></tfoot>
        </table>
      </div>
      {Object.keys(blocked).some((k) => blocked[k]) &&
      <div className="crm-card" style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 13, color: 'var(--fg-muted)' }}>
          <strong style={{ color: 'var(--fg)' }}>Unassigned customers:</strong> {st.customers.filter((c) => !c.rep).length} customer(s) have been de-linked and are now open for any rep to solicit. They appear with no rep in the Customers list.
        </div>
      </div>}

      <LeadersPanel st={st} />
    </div>);

}

function LeadersPanel({ st }) {
  const leaders = st.leaders || [];
  const [f, setF] = useState({ name: '', role: 'asm', phone: '' });
  const add = () => {if (!f.name.trim() || !f.phone.trim()) {alert('Enter name and phone.');return;}st.addLeader({ name: f.name.trim(), role: f.role, phone: f.phone.trim() });setF({ name: '', role: 'asm', phone: '' });};
  return (
    <div className="crm-card" id="leadersPanel" style={{ padding: 18, marginTop: 8 }}>
      <div className="crm-sec-head"><h2>Escalation contacts — ASM &amp; Sales Head</h2><span className="meta">Shown to reps in their escalation list</span></div>
      <table className="crm-table" style={{ minWidth: 0, marginBottom: 14 }}>
        <thead><tr><th>{TH("Name")}</th><th>{TH("Role")}</th><th>{TH("Phone")}</th><th></th></tr></thead>
        <tbody>{leaders.map((l) =>
          <tr key={l.id}><td>{l.name}</td><td><Pill s={l.role === 'head' ? 'active' : 'confirmed'} label={l.role === 'head' ? 'Sales Head' : 'Area Sales Manager'} /></td>
          <td className="crm-muted">{l.phone}</td>
          <td style={{ textAlign: 'right' }}><button className="cbtn cbtn-ghost cbtn-sm" style={{ color: 'var(--ruby)' }} onClick={() => {if (confirm('Remove ' + l.name + '?')) st.removeLeader(l.id);}}>Remove</button></td></tr>
          )}
        {leaders.length === 0 && <tr><td colSpan="4" className="crm-muted" style={{ padding: '12px 16px' }}>No escalation contacts yet.</td></tr>}</tbody>
      </table>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="disc-input" style={{ width: 200, textAlign: 'left' }} placeholder="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <select className="disc-input" style={{ width: 170, textAlign: 'left' }} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
          <option value="asm">Area Sales Manager</option>
          <option value="head">Sales Head</option>
        </select>
        <input className="disc-input" style={{ width: 150, textAlign: 'left' }} placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <button className="cbtn cbtn-accent cbtn-sm" onClick={add}>＋ Add contact</button>
      </div>
    </div>);

}

function CartsView({ carts, orders, editItems, removeCart, setDisc, editOrder, removeOrder, title, sub }) {
  const completed = orders || [];
  const abandoned = carts.filter((c) => c.status === 'abandoned');
  const openCarts = carts.filter((c) => c.status !== 'abandoned');
  const Row = ({ c, kind }) => {const cu = H.cust(c.cust);const d = c.appliedDisc || 0;const net = Math.round(c.value * (1 - d / 100));return (
      <tr><td className="crm-id">{c.id}</td>
      <td>{cu.name}{c.note && <div className="lrow-note" style={{ marginTop: 4 }}>“{c.note}”</div>}</td>
      <td className="crm-muted">{cu.city}</td>
      <td className="crm-muted" style={{ fontSize: 12 }}>{cu.mobile}</td>
      <td className="crm-muted">{H.rep(cu.rep).name}</td>
      <td><Pill s={c.status} label={statusLabel(c.status)} /></td>
      <td className="crm-muted">{c.items}</td>
      <td className="crm-amt" style={{ textAlign: 'right' }}>{H.inr(net)}{d > 0 && <div className="crm-muted" style={{ fontSize: 11, textDecoration: 'line-through' }}>{H.inr(c.value)}</div>}</td>
      {kind !== 'order' && <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
        {setDisc && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginRight: 6 }}><input className="disc-input" style={{ width: 42 }} type="number" min="0" max="100" value={d || ''} placeholder="0%" onChange={(e) => setDisc(c.id, e.target.value)} />%</span>}
        <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => editItems(c.id)}>Edit</button>{' '}
        <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => removeCart(c.id)}>Remove</button></td>}
      {kind === 'order' && <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
        <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => editOrder && editOrder(c.id)}>Edit</button>{' '}
        <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => removeOrder && removeOrder(c.id)}>Remove</button></td>}
    </tr>);};
  const Head = () => <thead><tr><th>{TH("Ref")}</th><th>{TH("Customer")}</th><th>{TH("City")}</th><th>{TH("Mobile")}</th><th>{TH("Rep")}</th><th>{TH("Status")}</th><th>{TH("Items")}</th><th style={{ textAlign: 'right' }}>{TH("Value")}</th><th></th></tr></thead>;
  return (
    <div className="crm-body">
      <PageHead title={title} sub={sub} />

      <div className="crm-sec-head" style={{ margin: '4px 0 10px' }}><h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 18, margin: 0 }}>✓ Completed orders</h2><span className="crm-muted" style={{ fontSize: 12.5 }}>{completed.length} placed · {H.inr(completed.reduce((a, o) => a + o.value, 0))}</span></div>
      <div className="crm-card">
        <table className="crm-table" style={{ minWidth: 860 }}><Head />
          <tbody>{completed.map((o) => <Row key={o.id} c={o} kind="order" />)}
            {completed.length === 0 && <tr><td colSpan="9" className="crm-muted" style={{ padding: '14px 16px' }}>No completed orders.</td></tr>}</tbody>
        </table>
      </div>

      <div className="crm-sec-head" style={{ margin: '4px 0 10px' }}><h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 18, margin: 0 }}>● Open carts</h2><span className="crm-muted" style={{ fontSize: 12.5 }}>{openCarts.length} in play · {H.inr(openCarts.reduce((a, c) => a + c.value, 0))}</span></div>
      <div className="crm-card">
        <table className="crm-table" style={{ minWidth: 860 }}><Head />
          <tbody>{openCarts.map((c) => <Row key={c.id} c={c} />)}
            {openCarts.length === 0 && <tr><td colSpan="9" className="crm-muted" style={{ padding: '14px 16px' }}>No open carts.</td></tr>}</tbody>
        </table>
      </div>

      <div className="crm-sec-head" style={{ margin: '4px 0 10px' }}><h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 18, margin: 0, color: 'var(--ruby)' }}>✕ Abandoned carts</h2><span className="crm-muted" style={{ fontSize: 12.5 }}>{abandoned.length} · {H.inr(abandoned.reduce((a, c) => a + c.value, 0))} to recover</span></div>
      <div className="crm-card">
        <table className="crm-table" style={{ minWidth: 860 }}><Head />
          <tbody>{abandoned.map((c) => <Row key={c.id} c={c} />)}
            {abandoned.length === 0 && <tr><td colSpan="9" className="crm-muted" style={{ padding: '14px 16px' }}>No abandoned carts.</td></tr>}</tbody>
        </table>
      </div>
    </div>);

}

/* ===================== BACK OFFICE SCREENS ===================== */
function OfficeOrders({ st }) {
  const queue = st.orders.filter((o) => o.status !== 'delivered');
  const incoming = (() => { try { return JSON.parse(localStorage.getItem('eurostar-crm-incoming-orders') || '[]') || []; } catch (e) { return []; } })();
  const fmtTs = (ts) => { try { return new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
  return (
    <div className="crm-body">
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">To review / dispatch</div><div className="kpi-value">{queue.length}</div><div className="kpi-sub">{st.orders.filter((o) => o.status === 'new').length} new today</div></div>
        <div className="kpi"><div className="kpi-label">Quote requests</div><div className="kpi-value">{st.carts.filter((c) => c.status === 'quote-requested').length}</div><div className="kpi-sub">awaiting price approval</div></div>
        <div className="kpi"><div className="kpi-label">Abandoned carts</div><div className="kpi-value">{st.carts.filter((c) => c.status === 'abandoned').length}</div><div className="kpi-sub">to recover</div></div>
        <div className="kpi"><div className="kpi-label">Open RFQ enquiries</div><div className="kpi-value">{st.queries.filter((q) => q.status === 'open').length}</div><div className="kpi-sub">custom-quote requests</div></div>
      </div>

      <div className="crm-card" style={{ padding: 0, marginBottom: 18, border: '1px solid var(--emerald,#0E5C4A)' }}>
        <div style={{ padding: '12px 16px', background: 'var(--emerald-soft,#e6f1ec)', borderBottom: '1px solid var(--emerald,#0E5C4A)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, color: 'var(--emerald-ink,#0a3f33)' }}>📲 Incoming from Sales App ({incoming.length})</div>
          <span className="crm-muted" style={{ fontSize: 12 }}>Orders placed by reps in the field — live</span>
        </div>
        {incoming.length === 0 ?
        <div className="crm-muted" style={{ padding: '18px 16px', fontSize: 13 }}>No app orders yet. When a rep places an order in the Sales App, it appears here instantly with the rep &amp; customer trail.</div> :
        <table className="crm-table">
          <thead><tr><th>{TH("Order")}</th><th>{TH("Customer")}</th><th>{TH("Placed by")}</th><th>{TH("When")}</th><th style={{ textAlign: 'right' }}>{TH("Value")}</th><th></th></tr></thead>
          <tbody>{incoming.map((o) => (
            <tr key={o.id}>
              <td className="crm-id">{o.id}{o.paid ? <div><span className="crm-id" style={{ fontSize: 9.5, background: 'var(--emerald-soft,#e6f1ec)', color: 'var(--emerald-ink)', padding: '1px 6px', borderRadius: 99, fontWeight: 700 }}>PAID</span></div> : ''}</td>
              <td>{o.customer}<div className="crm-muted" style={{ fontSize: 11 }}>{o.code}{o.city ? ' · ' + o.city : ''}</div></td>
              <td>{o.rep}<div className="crm-muted" style={{ fontSize: 11 }}>{o.repId}</div></td>
              <td className="crm-muted" style={{ fontSize: 12 }}>{fmtTs(o.ts)}</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{H.inr(o.value || 0)}</td>
              <td style={{ textAlign: 'right' }}><span className="crm-id" style={{ fontSize: 9.5, background: 'var(--surface-2,#f0ece2)', color: 'var(--fg-meta,#777)', padding: '2px 7px', borderRadius: 99, fontWeight: 700 }}>via SALES APP</span></td>
            </tr>))}
          </tbody>
        </table>}
      </div>

      <SecHeadBare title="Order queue — review & dispatch" meta="New → Confirmed → Packed → Shipped → Delivered" />
      <OrdersTable orders={queue} advance={st.advance} showRep setCourier={st.setCourier} />
    </div>);

}
function SecHeadBare({ title, meta }) {
  return <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '4px 0 14px' }}>
    <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 22, margin: 0 }}>{title}</h2>
    {meta && <span className="crm-muted" style={{ fontSize: 12.5 }}>{meta}</span>}</div>;
}

function OfficeQuotes({ st }) {
  const quoteCarts = st.carts.filter((c) => c.status === 'quote-requested');
  return (
    <div className="crm-body">
      <PageHead title="Quote requests" sub="Big-order negotiation — apply a discount and approve" />
      <div className="crm-card">
        {quoteCarts.map((c) => {const cu = H.cust(c.cust);const d = c.appliedDisc || 0;const net = Math.round(c.value * (1 - d / 100));return (
            <div key={c.id} className="lrow" style={{ flexWrap: 'wrap' }}>
            <div className="lrow-main">
              <div className="lrow-title">{cu.name} <span className="crm-id crm-muted">· {c.id}</span></div>
              <div className="lrow-sub">{c.items} items · {c.age} · rep {H.rep(cu.rep).name}</div>
              {c.note && <div className="lrow-note">“{c.note}”</div>}
            </div>
            <div style={{ textAlign: 'right' }}><div className="crm-amt">{H.inr(net)}</div>{d > 0 && <div className="crm-muted" style={{ fontSize: 11, textDecoration: 'line-through' }}>{H.inr(c.value)}</div>}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', marginTop: 10, justifyContent: 'flex-end' }}>
              <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => st.editItems(c.id)}>Edit</button>
              <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => st.removeCart(c.id)}>Remove</button>
              <span style={{ fontSize: 12, color: 'var(--fg-meta)' }}>Discount</span>
              <input className="disc-input" type="number" min="0" max="100" value={d || ''} placeholder="0" onChange={(e) => st.setDisc(c.id, e.target.value)} /><span style={{ fontSize: 13 }}>%</span>
              <button className="cbtn cbtn-accent cbtn-sm">Approve &amp; notify customer</button>
            </div>
          </div>);})}
        {quoteCarts.length === 0 && <div className="lrow crm-muted">No open quote requests.</div>}
      </div>
    </div>);

}

function OfficeAbandoned({ st }) {
  const abandoned = st.carts.filter((c) => c.status === 'abandoned');
  return (
    <div className="crm-body">
      <PageHead title="Abandoned carts" sub={`${abandoned.length} carts · ${H.inr(abandoned.reduce((a, c) => a + c.value, 0))} to recover`} />
      <div className="crm-card">
        {abandoned.map((c) => {const cu = H.cust(c.cust);return (
            <div key={c.id} className="lrow">
            <div className="lrow-main"><div className="lrow-title">{cu.name} <span className="crm-id crm-muted">· {c.id}</span></div>
              <div className="lrow-sub">{c.items} items · {c.age} · rep {H.rep(cu.rep).name}</div></div>
            <div className="lrow-amt"><div className="crm-amt">{H.inr(c.value)}</div></div>
            <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => st.editItems(c.id)}>Edit</button>
            <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => st.removeCart(c.id)}>Remove</button>
            <button className="cbtn cbtn-accent cbtn-sm">Call / WhatsApp</button>
          </div>);})}
        {abandoned.length === 0 && <div className="lrow crm-muted">No abandoned carts.</div>}
      </div>
    </div>);

}

function OfficeQueries({ st }) {
  const [openId, setOpenId] = useState(null);
  return (
    <div className="crm-body">
      <PageHead title="RFQ Enquiries" sub={`${st.queries.filter((q) => q.status === 'open').length} open · custom-quote requests from customers (₹10,000 min order)`} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="cbtn cbtn-primary cbtn-sm" onClick={() => st.autoAssignRfq()}>⚡ Auto-assign by city</button>
        <span className="crm-muted" style={{ fontSize: 12.5 }}>Routes each enquiry to the rep for that city, or pick a rep manually below.</span>
      </div>
      <div className="crm-card">
        <table className="crm-table" style={{ minWidth: 900 }}>
          <thead><tr><th>{TH("Ref")}</th><th>{TH("Customer")}</th><th>{TH("Product")}</th><th>{TH("Size")}</th><th>{TH("Qty")}</th><th>{TH("City")}</th><th>{TH("Assigned rep")}</th><th>{TH("Status")}</th><th></th></tr></thead>
          <tbody>{st.queries.map((q) => {const cu = H.cust(q.cust);return (
                <React.Fragment key={q.id}>
            <tr><td className="crm-id">{q.id}</td><td>{cu.name || q.custName || '—'}</td><td>{q.product}</td><td className="crm-muted">{q.size}</td>
            <td className="crm-muted">{q.qty}</td><td className="crm-muted">{q.city}</td>
            <td><select className="disc-input" style={{ width: 130, textAlign: 'left' }} value={q.assignedRep || ''} onChange={(e) => st.assignRfq(q.id, e.target.value)}>
              <option value="">— Unassigned —</option>
              {CRM_REPS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select></td>
            <td><Pill s={q.status} label={statusLabel(q.status)} /></td>
            <td style={{ textAlign: 'right' }}><button className="cbtn cbtn-ghost cbtn-sm" onClick={() => setOpenId(openId === q.id ? null : q.id)}>{openId === q.id ? 'Hide' : 'View'}</button></td></tr>
            {openId === q.id &&
                  <tr><td colSpan="9" style={{ background: 'var(--paper-2)', padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
                <div><div className="kpi-label">Product name</div><div style={{ fontWeight: 600 }}>{q.product}</div></div>
                <div><div className="kpi-label">Size</div><div style={{ fontWeight: 600 }}>{q.size}</div></div>
                <div><div className="kpi-label">Weight (grams)</div><div style={{ fontWeight: 600 }}>{q.weight}</div></div>
                <div><div className="kpi-label">Quality</div><div style={{ fontWeight: 600 }}>{q.quality}</div></div>
                <div><div className="kpi-label">Quantity required</div><div style={{ fontWeight: 600 }}>{q.qty}</div></div>
                <div><div className="kpi-label">City</div><div style={{ fontWeight: 600 }}>{q.city}</div></div>
                <div><div className="kpi-label">Name & contact</div><div style={{ fontWeight: 600 }}>{q.contactName}<div className="crm-muted" style={{ fontSize: 12, fontWeight: 400 }}>{q.contact}</div></div></div>
                <div style={{ gridColumn: '1 / -1' }}><div className="kpi-label">Special request</div><div>{q.special || '—'}</div></div>
                <div style={{ gridColumn: '1 / -1' }}><div className="kpi-label">Reference image</div>
                  {q.image ? <img src={q.image} alt="RFQ ref" style={{ height: 80, borderRadius: 6, border: '1px solid var(--border)' }} /> : <span className="crm-muted">No image attached</span>}</div>
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                <button className="cbtn cbtn-accent cbtn-sm">Send quote</button>
                {q.status === 'open' && <button className="cbtn cbtn-primary cbtn-sm" onClick={() => st.answer(q.id)}>Mark answered</button>}
              </div>
            </td></tr>}
            </React.Fragment>);})}</tbody>
        </table>
      </div>
    </div>);

}

/* ===================== SALES REP SCREENS ===================== */
// Slab-based commission — mirrors the LMS "Your Salary & Commission" module.
// Marginal slabs on monthly sales. Edit to match Admin → Settings → Compensation.
const CRM_COMMISSION_SLABS = [
  { from: 0,       to: 500000,   pct: 2 },
  { from: 500001,  to: 1000000,  pct: 3 },
  { from: 1000001, to: null,     pct: 4 },
];
// Returns { total, effectiveRate, breakdown:[{from,to,pct,amount,comm}] }
function slabCommission(sales) {
  let total = 0;
  const breakdown = CRM_COMMISSION_SLABS.map((s) => {
    const lower = s.from === 0 ? 0 : s.from - 1;       // band's true lower threshold
    const upper = s.to == null ? Infinity : s.to;       // band's upper threshold
    const amount = Math.max(0, Math.min(sales, upper) - lower); // sales falling in this band
    const comm = Math.round(amount * s.pct / 100);
    total += comm;
    return { from: s.from, to: s.to, pct: s.pct, amount, comm };
  });
  return { total, effectiveRate: sales > 0 ? total / sales : 0, breakdown };
}

function repData(st, repId) {
  const rep = H.rep(repId);
  const myCust = st.customers.filter((c) => c.rep === repId);
  const ids = myCust.map((c) => c.id);
  const myOrders = st.orders.filter((o) => ids.includes(o.cust));
  const myCarts = st.carts.filter((c) => ids.includes(c.cust));
  const sales = myOrders.reduce((a, o) => a + o.value, 0);
  const commCalc = slabCommission(sales);
  const rate = commCalc.effectiveRate;          // blended rate across slabs
  const comm = commCalc.total;
  const commBreakdown = commCalc.breakdown;
  const today = new Date();const dueAlerts = [];
  myOrders.forEach((o) => {const c = H.cust(o.cust);const t = c.terms;if (!t || t === 'cash') return;
    if (st.paidByOrder(o.id) >= o.value) return; // payment confirmed by office — stop reminding
    const due = new Date(o.date);due.setDate(due.getDate() + parseInt(t, 10));const od = Math.floor((today - due) / 86400000);
    if (od > 0) dueAlerts.push({ order: o, cust: c, overdueDays: od });});
  dueAlerts.sort((a, b) => b.overdueDays - a.overdueDays);
  const target = st.repTargets[repId] != null ? st.repTargets[repId] : rep.target || 0;
  const minTarget = 50;
  const effTarget = Math.max(target, minTarget);
  const added = st.newAdds[repId] || 0;
  const pending = Math.max(0, effTarget - added);
  return { rep, myCust, myOrders, myCarts, sales, rate, comm, commBreakdown, dueAlerts, target: effTarget, added, pending };
}

const COACH_TODAY = new Date().toISOString().slice(0, 10);
function coachInsights(st, repId) {
  const d = repData(st, repId);
  const myLeads = (st.leads || []).filter((l) => l.rep === repId);
  const overdue = myLeads.filter((l) => l.stage >= 1 && l.stage < 6 && l.followUp <= COACH_TODAY);
  const hot = myLeads.filter((l) => l.stage === 5);
  const samples = myLeads.filter((l) => l.stage === 3 || l.stage === 4);
  const duesTotal = d.dueAlerts.reduce((a, x) => a + x.order.value, 0);
  const daysLeft = 30 - 17;
  const out = [];
  if (hot.length) out.push({ icon: '🔥', tone: 'win', title: `${hot.length} customer${hot.length > 1 ? 's' : ''} ready to order`, detail: `${hot.slice(0, 3).map((l) => l.name).join(', ')}${hot.length > 3 ? '…' : ''} said they'll buy. Call today and place the order while it's warm.`, cta: 'pipeline' });
  if (d.dueAlerts.length) out.push({ icon: '💰', tone: 'urgent', title: `${d.dueAlerts.length} payment${d.dueAlerts.length > 1 ? 's' : ''} overdue · ${H.inr(duesTotal)}`, detail: `Collect or log a payment so settled accounts drop off your reminders automatically.`, cta: 'pay' });
  if (overdue.length) out.push({ icon: '⏰', tone: 'warn', title: `${overdue.length} follow-up${overdue.length > 1 ? 's' : ''} overdue`, detail: `${overdue.slice(0, 3).map((l) => l.name).join(', ')} are waiting on you — a quick call keeps them moving down the pipeline.`, cta: 'pipeline' });
  if (samples.length) out.push({ icon: '🧪', tone: 'info', title: `${samples.length} sample${samples.length > 1 ? 's' : ''} in play`, detail: `Chase feedback on these trials before they cool off — that's where white-round volume begins.`, cta: 'pipeline' });
  if (d.pending > 0) out.push({ icon: '🎯', tone: 'warn', title: `${d.pending} new customer${d.pending > 1 ? 's' : ''} to hit target`, detail: `${d.added}/${d.target} added · ${daysLeft} days left in June. Aim for ~${Math.max(1, Math.ceil(d.pending / Math.max(1, Math.ceil(daysLeft / 7))))} a week to stay on track.`, cta: 'add' });
  if (!out.length) out.push({ icon: '✅', tone: 'win', title: 'You\'re on top of everything', detail: 'No overdue follow-ups, dues, or target gap. Keep nurturing relationships and bridging customers to white round.', cta: null });
  return { d, insights: out.slice(0, 4), counts: { hot: hot.length, overdue: overdue.length, samples: samples.length, dues: d.dueAlerts.length, duesTotal, pending: d.pending } };
}

function RepCoachCard({ st, repId, onQuickPay }) {
  const { d, insights, counts } = coachInsights(st, repId);
  const [tip, setTip] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const toneBg = { win: 'var(--emerald-soft)', urgent: 'var(--ruby-soft)', warn: 'var(--amber-soft)', info: 'var(--paper-2)' };
  const toneFg = { win: 'var(--emerald-ink)', urgent: 'var(--ruby)', warn: '#7A5214', info: 'var(--fg)' };
  const doCta = (cta) => { if (cta === 'pipeline') st.goPipeline && st.goPipeline(); else if (cta === 'add') st.goAddCustomer && st.goAddCustomer(); else if (cta === 'pay') onQuickPay && onQuickPay(); };
  const ctaLabel = { pipeline: 'Open pipeline', add: 'Add customer', pay: 'Log payment' };
  const askMira = () => {
    setBusy(true); setTip('');
    const summary = `Rep ${d.rep.name} (${d.rep.region}). This month: ${d.added}/${d.target} new customers added (${counts.pending} short), sales ${H.inr(d.sales)}. Pipeline: ${counts.hot} ready-to-order, ${counts.samples} samples/feedback in motion, ${counts.overdue} overdue follow-ups. Payments: ${counts.dues} overdue worth ${H.inr(counts.duesTotal)}.`;
    const prompt = `You are "Mira", Eurostar's friendly sales coach speaking directly to a field sales rep. Using the Eurostar method (relationship first, bridge to white round, never undercut on price, push small trials), give a short, motivating game plan for TODAY in 3 crisp bullet points (max ~18 words each), most important first. Be specific to the numbers. No preamble.\n\n${summary}`;
    if (!(window.claude && window.claude.complete)) { setTimeout(() => { setTip('• Call your ready-to-order customers first — close while warm.\n• Clear overdue follow-ups with a quick check-in call.\n• Log any collected payments so reminders stay accurate.'); setBusy(false); }, 300); return; }
    window.claude.complete({ messages: [{ role: 'user', content: prompt }] }).then((r) => { setTip((r || '').trim()); setBusy(false); }).catch(() => { setTip('• Call your ready-to-order customers first.\n• Clear overdue follow-ups today.\n• Log collected payments.'); setBusy(false); });
  };
  return (
    <div className="crm-card" style={{ marginBottom: 20, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 16px', background: 'var(--emerald)', color: '#FDFAF2' }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flex: '0 0 34px' }}>💎</div>
        <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14.5 }}>Mira Coach · Today's focus</div><div style={{ fontSize: 11.5, color: 'rgba(253,250,242,0.82)' }}>Your priorities, ranked</div></div>
        <button className="cbtn cbtn-sm" onClick={askMira} disabled={busy} style={{ background: 'rgba(255,255,255,0.16)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>{busy ? 'Thinking…' : '💬 Game plan'}</button>
      </div>
      <div style={{ padding: '6px 16px 14px' }}>
        {insights.map((it, i) =>
          <div key={i} className="coach-insight" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 0', borderTop: i ? '1px solid var(--divider)' : 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: toneBg[it.tone], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flex: '0 0 30px' }}>{it.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: toneFg[it.tone] }}>{it.title}</div>
              <div className="crm-muted" style={{ fontSize: 12.5, marginTop: 1, lineHeight: 1.45 }}>{it.detail}</div>
            </div>
            {it.cta && <button className="cbtn cbtn-ghost cbtn-sm" style={{ flex: '0 0 auto' }} onClick={() => doCta(it.cta)}>{ctaLabel[it.cta]} →</button>}
          </div>)}
        {tip &&
        <div style={{ marginTop: 12, padding: '11px 13px', background: 'var(--emerald-soft)', borderRadius: 10, fontSize: 13, lineHeight: 1.55, color: 'var(--emerald-ink)', whiteSpace: 'pre-wrap' }}>
          <strong style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Mira's game plan</strong>{tip}
        </div>}
      </div>
    </div>
  );
}

// Everything across the business that needs the owner's attention today,
// ranked most-urgent first. Each item can jump to the relevant admin tab.
// Interface copy follows the language picker; trade terms stay English.
function crmLang() { return window.currentLang ? window.currentLang() : 'en'; }
function CT(key, fb, vars) {
  const l = crmLang();
  if (window.tf) { const s = window.tf(key, l, vars || {}); if (s && s !== key) return s; }
  if (vars) { let s = fb; Object.keys(vars).forEach((k) => { s = s.split('{' + k + '}').join(vars[k]); }); return s; }
  return fb;
}

// Table column header, keyed by its English label (see TH_I18N in i18n-strings).
function TH(label) { return window.th ? window.th(label, crmLang()) : label; }

function adminAttention(st) {
  const T = COACH_TODAY;
  const A = [];
  // Every core widget ALWAYS renders — values are live (the CRM direct-fetches
  // the DB); an empty queue shows "0 …" instead of hiding the card, so the
  // dashboard keeps the same structure regardless of data.
  const pays = (st.payments || []).filter((p) => p.status === 'pending');
  { const v = pays.reduce((a, p) => a + (p.amount || 0), 0); const n = pays.length;
    A.push({ w: 1, icon: '💳', tone: n ? 'urgent' : 'info', title: CT('w_pay_verify', `${n} payments to verify`, { n }) + (n ? ' · ' + H.inr(v) : ''), detail: n ? CT('w_pay_verify_sub', 'Reps logged these — verify so customer balances update and reminders stop.') : CT('w_pay_clear', 'No payments waiting for verification — all clear.'), page: 'payments', cta: CT('cta_verify_pay', 'Verify payments') }); }
  const newOrders = (st.orders || []).filter((o) => o.status === 'new');
  { const v = newOrders.reduce((a, o) => a + o.value, 0); const n = newOrders.length;
    A.push({ w: 2, icon: '📦', tone: n ? 'urgent' : 'info', title: CT('w_new_orders', `${n} new orders to confirm`, { n }) + (n ? ' · ' + H.inr(v) : ''), detail: n ? CT('w_new_orders_sub', 'Confirm and assign a courier so they move to packing.') : CT('w_new_orders_none', 'No orders waiting for confirmation.'), page: 'orders', cta: CT('cta_open_orders', 'Open orders') }); }
  const openVisits = (st.visits || []).filter((v) => !v.checkOut);
  if (openVisits.length) A.push({ w: 3, icon: '📍', tone: 'warn', title: `${openVisits.length} field visit${openVisits.length > 1 ? 's' : ''} not checked out`, detail: 'Check-out needs the customer OTP. Unvalidated by 11:59pm = failed visit — follow up with the rep.', page: 'visits', cta: 'View field visits' });
  const flagged = (st.leads || []).filter((l) => l.flagged);
  const unassigned = (st.leads || []).filter((l) => !l.flagged && !l.rep);
  const toAssign = flagged.length + unassigned.length;
  A.push({ w: 4, icon: '🧲', tone: toAssign ? 'warn' : 'info', title: CT('w_leads', `${toAssign} leads to assign`, { n: toAssign }), detail: toAssign ? `${flagged.length ? flagged.length + ' flagged as existing · ' : ''}${unassigned.length} waiting for a rep. Assign by city so nobody sits idle.` : CT('w_leads_none', 'No unassigned leads right now.'), page: 'leads', cta: CT('cta_assign_leads', 'Assign leads') });
  const overdueLeads = (st.leads || []).filter((l) => l.rep && l.stage >= 1 && l.stage < 6 && l.followUp <= T);
  A.push({ w: 5, icon: '⏰', tone: overdueLeads.length ? 'warn' : 'info', title: CT('w_followups', `${overdueLeads.length} follow-ups overdue across reps`, { n: overdueLeads.length }), detail: overdueLeads.length ? CT('w_followups_sub', 'Customers waiting on a rep call. Check the pipeline and nudge the owners.') : CT('w_followups_none', 'No overdue follow-ups — the pipeline is on schedule.'), page: 'pipeline', cta: CT('cta_open_pipeline', 'Open pipeline') });
  const openRfq = (st.queries || []).filter((q) => q.status === 'open');
  A.push({ w: 6, icon: '📝', tone: 'info', title: CT('w_rfq', `${openRfq.length} RFQ enquiries open`, { n: openRfq.length }), detail: openRfq.length ? CT('w_rfq_sub', 'Custom-item requests waiting for a quote. Slow replies lose the deal.') : CT('w_rfq_none', 'No open RFQ enquiries.'), page: 'rfq', cta: CT('cta_open_rfq', 'Open RFQs') });
  const quotes = (st.carts || []).filter((c) => c.status === 'quote-requested');
  { const v = quotes.reduce((a, c) => a + c.value, 0); const n = quotes.length;
    A.push({ w: 7, icon: '💬', tone: 'info', title: CT('w_quotes', `${n} quote requests`, { n }) + (n ? ' · ' + H.inr(v) : ''), detail: n ? CT('w_quotes_sub', 'Customers asked for pricing on their cart — respond before it cools.') : CT('w_quotes_none', 'No carts waiting on a quote.'), page: 'carts', cta: CT('cta_view_carts', 'View carts') }); }
  const bigAband = (st.carts || []).filter((c) => c.status === 'abandoned' && c.value >= 100000);
  { const v = bigAband.reduce((a, c) => a + c.value, 0); const n = bigAband.length;
    A.push({ w: 8, icon: '🛒', tone: 'info', title: CT('w_abandoned', `${n} big carts abandoned`, { n }) + (n ? ' · ' + H.inr(v) : ''), detail: n ? CT('w_abandoned_sub', 'High-value carts left unpaid. Have the rep call and recover them.') : CT('w_abandoned_none', 'No high-value abandoned carts.'), page: 'carts', cta: CT('cta_view_carts', 'View carts') }); }
  const fr = (window.CRM_FRANCHISE || []).filter((r) => r.status === 'new');
  A.push({ w: 9, icon: '🤝', tone: 'info', title: CT('w_franchise', `${fr.length} franchise requests`, { n: fr.length }), detail: fr.length ? CT('w_franchise_sub', 'New partnership enquiries from the Sales App — respond while interest is high.') : CT('w_franchise_none', 'No new franchise enquiries.'), page: 'franchise', cta: CT('cta_view_requests', 'View requests') });
  A.sort((a, b) => a.w - b.w);
  return A;
}

function teamCoachInsights(st) {
  const reps = (window.CRM_REPS || []);
  const rows = reps.map((r) => {
    const ci = coachInsights(st, r.id);
    const pct = ci.d.target ? Math.round((ci.d.added / ci.d.target) * 100) : 0;
    return { rep: r, d: ci.d, pct, dues: ci.counts.dues, duesTotal: ci.counts.duesTotal, overdue: ci.counts.overdue, hot: ci.counts.hot };
  });
  const behind = rows.filter((x) => x.pct < 60).sort((a, b) => a.pct - b.pct);
  const topDue = rows.slice().sort((a, b) => b.duesTotal - a.duesTotal).filter((x) => x.dues > 0);
  const top = rows.slice().sort((a, b) => b.d.sales - a.d.sales)[0];
  return { rows, behind, topDue, top };
}

function AdminCoachDigest({ st }) {
  const { rows, behind, topDue, top } = teamCoachInsights(st);
  const attention = adminAttention(st);
  const [tip, setTip] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const toneBg = { urgent: 'var(--ruby-soft)', warn: 'var(--amber-soft)', info: 'var(--paper-2)', win: 'var(--emerald-soft)' };
  const toneFg = { urgent: 'var(--ruby)', warn: '#7A5214', info: 'var(--fg)', win: 'var(--emerald-ink)' };
  const askMira = () => {
    setBusy(true); setTip('');
    const inbox = attention.length ? attention.map((a) => '- ' + a.title.replace(/·/g, '-')).join('\n') : '- Nothing outstanding in the queues.';
    const team = rows.map((x) => `${x.rep.name}: ${x.pct}% of target, sales ${H.inr(x.d.sales)}, ${x.overdue} overdue follow-ups, ${x.dues} overdue payments (${H.inr(x.duesTotal)}), ${x.hot} ready-to-order.`).join('\n');
    const prompt = `You are "Mira", Eurostar's operations & sales coach briefing the business owner. Two things need covering: (1) what to action in the business today, (2) which reps to focus on to keep control of the team. Write a short brief: one headline line, then 4-5 bullets most-urgent first (max ~20 words each), naming specific items/reps. Be direct and practical. No preamble.\n\nNEEDS ACTION TODAY:\n${inbox}\n\nTEAM:\n${team}`;
    if (!(window.claude && window.claude.complete)) { setTimeout(() => { setTip('Today: clear payments to verify and new orders first, chase un-checked-out visits, then call reps below target.'); setBusy(false); }, 300); return; }
    window.claude.complete({ messages: [{ role: 'user', content: prompt }] }).then((r) => { setTip((r || '').trim()); setBusy(false); }).catch(() => { setTip('Verify pending payments, confirm new orders, follow up open visits, then call reps below 60% of target.'); setBusy(false); });
  };
  const go = (p) => st.goPage && st.goPage(p);
  return (
    <div className="crm-card" style={{ marginBottom: 20, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 16px', background: 'var(--emerald)', color: '#FDFAF2' }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flex: '0 0 34px' }}>💎</div>
        <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14.5 }}>{CT('coach_title','Mira Coach · What needs your attention')}</div><div style={{ fontSize: 11.5, color: 'rgba(253,250,242,0.82)' }}>{CT('coach_sub','Business to action today + reps to control')}</div></div>
        <button className="cbtn cbtn-sm" onClick={askMira} disabled={busy} style={{ background: 'rgba(255,255,255,0.16)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>{busy ? 'Thinking…' : '💬 ' + CT('coach_brief','Brief me')}</button>
      </div>
      <div style={{ padding: '6px 16px 14px' }}>
        {attention.length === 0 &&
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 0' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: toneBg.win, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flex: '0 0 30px' }}>✅</div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13.5, color: toneFg.win }}>Inbox clear</div>
            <div className="crm-muted" style={{ fontSize: 12.5, marginTop: 1 }}>No payments, orders, visits or leads waiting. Focus on the team below.</div></div>
        </div>}
        {attention.map((it, i) =>
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 0', borderTop: i ? '1px solid var(--divider)' : 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: toneBg[it.tone], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flex: '0 0 30px' }}>{it.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: toneFg[it.tone] }}>{it.title}</div>
              <div className="crm-muted" style={{ fontSize: 12.5, marginTop: 1, lineHeight: 1.45 }}>{it.detail}</div>
            </div>
            <button className="cbtn cbtn-ghost cbtn-sm" style={{ flex: '0 0 auto' }} onClick={() => go(it.page)}>{it.cta} →</button>
          </div>)}

        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '2px solid var(--divider)' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-meta)', fontWeight: 700, marginBottom: 4 }}>{CT('coach_yourreps','Your reps')}</div>
          {behind.length > 0 &&
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: toneBg.warn, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flex: '0 0 30px' }}>🎯</div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13.5, color: toneFg.warn }}>{CT('w_behind', behind.length + ' rep behind target', { n: behind.length })}</div>
              <div className="crm-muted" style={{ fontSize: 12.5, marginTop: 1 }}>{CT('w_behind_sub', '{names} — prioritise in your calls.', { names: behind.slice(0, 4).map((x) => `${x.rep.name} (${x.pct}%)`).join(', ') })}</div></div>
            <button className="cbtn cbtn-ghost cbtn-sm" style={{ flex: '0 0 auto' }} onClick={() => go('reps')}>{CT('cta_open_reps','Open reps')} →</button>
          </div>}
          {/* Always visible — a clear queue shows ₹0 instead of hiding the card. */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderTop: behind.length ? '1px solid var(--divider)' : 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: topDue.length ? toneBg.urgent : toneBg.info, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flex: '0 0 30px' }}>💰</div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13.5, color: topDue.length ? toneFg.urgent : toneFg.info }}>{CT('w_collections','Collections to push')}</div>
              <div className="crm-muted" style={{ fontSize: 12.5, marginTop: 1 }}>{topDue.length ? topDue.slice(0, 3).map((x) => `${x.rep.name} · ${H.inr(x.duesTotal)} (${x.dues})`).join(' · ') : CT('w_collections_none','₹0 outstanding — no overdue customer balances right now.')}</div></div>
            <button className="cbtn cbtn-ghost cbtn-sm" style={{ flex: '0 0 auto' }} onClick={() => go('reports')}>{CT('cta_outstanding','Outstanding')} →</button>
          </div>
          {top &&
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderTop: '1px solid var(--divider)' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: toneBg.win, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flex: '0 0 30px' }}>🏆</div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13.5, color: toneFg.win }}>{CT('w_top','Top performer')} · {top.rep.name}</div>
              <div className="crm-muted" style={{ fontSize: 12.5, marginTop: 1 }}>{CT('w_top_sub', H.inr(top.d.sales) + ' MTD. Recognise the win and ask what’s working.', { amt: H.inr(top.d.sales) })}</div></div>
          </div>}
        </div>

        {tip &&
        <div style={{ marginTop: 12, padding: '11px 13px', background: 'var(--emerald-soft)', borderRadius: 10, fontSize: 13, lineHeight: 1.55, color: 'var(--emerald-ink)', whiteSpace: 'pre-wrap' }}>
          <strong style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Mira's brief</strong>{tip}
        </div>}
      </div>
    </div>
  );
}

function RepCheckIn({ st, repId }) {
  const done = st.checkin && st.checkin[repId];
  const fileRef = React.useRef(null);
  const onPhoto = (e) => {const f = e.target.files && e.target.files[0];if (!f) return;const r = new FileReader();r.onload = () => st.doCheckin(repId, r.result);r.readAsDataURL(f);};
  const now = new Date();
  if (done) {
    return (
      <div className="crm-card" style={{ borderColor: '#B8D4C6', background: 'var(--emerald-soft)', marginBottom: 20 }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src={done.photo} alt="check-in" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--emerald-ink)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--emerald-ink)', fontSize: 14 }}>✓ Checked in — present today</div>
            <div className="crm-muted" style={{ fontSize: 12 }}>{done.time} · marked present for {now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          </div>
        </div>
      </div>);

  }
  return (
    <div className="crm-card" style={{ borderColor: '#E6B8BE', background: 'var(--ruby-soft)', marginBottom: 20 }}>
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 700, color: 'var(--ruby)', fontSize: 14 }}>📸 Morning check-in required</div>
          <div className="crm-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Take a photo to mark attendance before heading to the field. No check-in = marked <strong>absent</strong> for today. You must be dressed as per dressing norms mentioned to you in the LMS training platform.</div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="user" onChange={onPhoto} style={{ display: 'none' }} />
        <button className="cbtn cbtn-primary" style={{ padding: '11px 20px', fontSize: 14 }} onClick={() => fileRef.current && fileRef.current.click()}>Check in with photo</button>
      </div>
    </div>);

}

function CustomerMaster({ st }) {
  const [rows, setRows] = useState(() => seedMasterIfEmpty() || []);
  const [q, setQ] = useState('');
  const [nf, setNf] = useState({ name: '', gst: '', city: '', address: '', mobile: '' });
  const fileRef = React.useRef(null);
  const persist = (next) => {setRows(next);saveMaster(next);};
  const setv = (k, v) => setNf((p) => ({ ...p, [k]: v }));
  const addRow = () => {if (!nf.name.trim() || !normGst(nf.gst)) {alert('Customer name and a valid GST number are required.');return;}
    if (masterMatch(nf.gst)) {alert('That GST number is already in your customer master.');return;}
    persist([{ name: nf.name.trim(), gst: normGst(nf.gst), city: nf.city.trim(), address: nf.address.trim(), mobile: nf.mobile.trim(), source: 'Manual' }, ...rows]);
    setNf({ name: '', gst: '', city: '', address: '', mobile: '' });};
  const removeRow = (gst) => {if (!confirm('Remove this customer from your protected master list?')) return;persist(rows.filter((r) => normGst(r.gst) !== normGst(gst)));};
  const onFile = (e) => {const f = e.target.files && e.target.files[0];if (!f) return;const ext = (f.name.split('.').pop() || '').toLowerCase();
    const load = (arr) => {let added = 0,updated = 0;const map = new Map(rows.map((r) => [normGst(r.gst), r]));
      arr.forEach((r, i) => {if (i === 0 && /name/i.test(String(r[0] || ''))) return; // skip header row
        const name = String(r[0] || '').trim(),gst = normGst(r[1]),city = String(r[2] || '').trim(),address = String(r[3] || '').trim(),mobile = String(r[4] || '').trim();
        if (!name || gst.length < 6) return;const rec = { name, gst, city, address, mobile, source: 'Upload' };
        if (map.has(gst)) {map.set(gst, { ...map.get(gst), ...rec });updated++;} else {map.set(gst, rec);added++;}});
      const next = [...map.values()];persist(next);alert(`Master updated — ${added} added, ${updated} updated. Total ${next.length} protected customers.`);};
    const reader = new FileReader();
    if (ext === 'csv') {reader.onload = () => load(reader.result.split(/\r?\n/).map((ln) => ln.split(',')));reader.readAsText(f);} else
    {const go = () => {reader.onload = () => {const wb = window.XLSX.read(new Uint8Array(reader.result), { type: 'array' });const sh = wb.Sheets[wb.SheetNames[wb.SheetNames.length - 1]];load(window.XLSX.utils.sheet_to_json(sh, { header: 1 }));};reader.readAsArrayBuffer(f);};
      if (!window.XLSX) {const s = document.createElement('script');s.src = 'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js';s.onload = go;document.head.appendChild(s);} else go();}
    e.target.value = '';};
  const filtered = q ? rows.filter((r) => (r.name + ' ' + r.gst + ' ' + r.city).toLowerCase().includes(q.toLowerCase())) : rows;
  const ninp = { padding: '9px 11px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 13, fontFamily: 'inherit', color: 'var(--fg)' };
  return (
    <div className="crm-body">
      <div className="crm-sec-head" style={{ marginBottom: 6 }}><h2>Customer Database</h2><span className="meta">Your existing customers — protected from rep prospecting & used to flag duplicate leads</span></div>
      <div className="crm-card" style={{ padding: 16, marginBottom: 16, background: 'var(--emerald-soft, #eaf3ef)', border: '1px solid var(--emerald, #0E5C4A)' }}>
        <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>
          <strong>🛡 {rows.length} protected customers.</strong> When you import purchased leads (single or bulk), any lead that matches this list — by <strong>GST number</strong>, or by <strong>name + city/mobile</strong> when GST is missing — is automatically <strong>flagged</strong> and held for your approval, so reps never re-prospect a customer you already have priced.
        </div>
      </div>

      <div className="crm-card" style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Add / update a customer</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 12 }}>
          <input style={ninp} placeholder="Business name *" value={nf.name} onChange={(e) => setv('name', e.target.value)} />
          <input style={ninp} placeholder="GST number *" value={nf.gst} onChange={(e) => setv('gst', e.target.value)} />
          <input style={ninp} placeholder="City" value={nf.city} onChange={(e) => setv('city', e.target.value)} />
          <input style={ninp} placeholder="Mobile" value={nf.mobile} onChange={(e) => setv('mobile', e.target.value)} />
          <input style={{ ...ninp, gridColumn: '1 / -1' }} placeholder="Address" value={nf.address} onChange={(e) => setv('address', e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="cbtn cbtn-primary cbtn-sm" onClick={addRow}>Save customer</button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={onFile} style={{ display: 'none' }} />
          <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => fileRef.current && fileRef.current.click()}>⬆ Bulk upload (CSV / Excel)</button>
          <span className="crm-muted" style={{ fontSize: 12 }}>Columns: Name · GST · City · Address · Mobile</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 10, flexWrap: 'wrap' }}>
        <input style={{ ...ninp, minWidth: 240 }} placeholder="Search name, GST or city…" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="crm-muted" style={{ fontSize: 12.5 }}>{filtered.length} of {rows.length}</span>
      </div>
      <div className="crm-card">
        <table className="crm-table">
          <thead><tr><th>{TH("Business")}</th><th>{TH("GST")}</th><th>{TH("City")}</th><th>{TH("Address")}</th><th>{TH("Mobile")}</th><th>{TH("Source")}</th><th></th></tr></thead>
          <tbody>{filtered.map((r) =>
            <tr key={r.gst}><td>{r.name}</td><td className="crm-id crm-muted">{r.gst}</td><td className="crm-muted">{r.city || '—'}</td>
            <td className="crm-muted" style={{ fontSize: 12, maxWidth: 220 }}>{r.address || '—'}</td><td className="crm-muted" style={{ fontSize: 12 }}>{r.mobile || '—'}</td>
            <td><Pill s={r.source === 'Manual' ? 'confirmed' : 'delivered'} label={r.source || '—'} /></td>
            <td style={{ textAlign: 'right' }}><button className="cbtn cbtn-ghost cbtn-sm" style={{ color: 'var(--ruby)' }} onClick={() => removeRow(r.gst)}>Remove</button></td></tr>
            )}
          {filtered.length === 0 && <tr><td colSpan="7" className="crm-muted" style={{ padding: '14px 16px' }}>No customers{q ? ' match your search' : ' yet — add or upload your existing customer list above'}.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>);

}

function RepBroadcastAdmin() {
  const read = (k) => {try {return localStorage.getItem(k) || '';} catch (e) {return '';}};
  const set = (k, v) => {try {localStorage.setItem(k, v);} catch (e) {}};
  const [img, setImg] = useState(() => read('eurostar-rep-announce-image'));
  const [active, setActive] = useState(() => read('eurostar-rep-announce-active') === '1');
  const [title, setTitle] = useState(() => read('eurostar-rep-announce-title'));
  const [msg, setMsg] = useState(() => read('eurostar-rep-announce-msg'));
  const [badge, setBadge] = useState(() => read('eurostar-rep-announce-badge'));
  const [start, setStart] = useState(() => read('eurostar-rep-announce-start'));
  const [end, setEnd] = useState(() => read('eurostar-rep-announce-end'));
  const [updated, setUpdated] = useState(() => read('eurostar-rep-announce-updated'));
  const fileRef = React.useRef(null);
  const stamp = () => {const t = String(Date.now());setUpdated(t);set('eurostar-rep-announce-updated', t);};
  const compress = (file) => new Promise((res, rej) => {const r = new FileReader();r.onload = () => {const im = new Image();im.onload = () => {let w = im.width,h = im.height;const max = 1100;if (w > max || h > max) {const s = max / Math.max(w, h);w = Math.round(w * s);h = Math.round(h * s);}const c = document.createElement('canvas');c.width = w;c.height = h;c.getContext('2d').drawImage(im, 0, 0, w, h);res(c.toDataURL('image/jpeg', 0.85));};im.onerror = rej;im.src = r.result;};r.onerror = rej;r.readAsDataURL(file);});
  const onFile = async (e) => {const f = e.target.files && e.target.files[0];if (!f) return;
    try {const data = await compress(f);setImg(data);set('eurostar-rep-announce-image', data);stamp();}
    catch (err) {alert('Could not read that image — try a smaller file.');}};
  const removeImg = () => {setImg('');set('eurostar-rep-announce-image', '');};
  const toggle = () => {const v = !active;setActive(v);set('eurostar-rep-announce-active', v ? '1' : '0');if (v) stamp();};
  const saveText = () => {set('eurostar-rep-announce-title', title);set('eurostar-rep-announce-msg', msg);set('eurostar-rep-announce-badge', badge);set('eurostar-rep-announce-start', start);set('eurostar-rep-announce-end', end);if (!active) {setActive(true);set('eurostar-rep-announce-active', '1');}stamp();alert('Saved & pushed. Reps will see this once a day between the start and end dates.');};
  const saveSchedule = () => {set('eurostar-rep-announce-start', start);set('eurostar-rep-announce-end', end);stamp();alert('Schedule saved.');};
  const today = new Date().toISOString().slice(0, 10);
  const scheduleNote = (() => {if (start && today < start) return 'Scheduled — starts ' + start;if (end && today > end) return 'Ended ' + end;if (start || end) return 'Running' + (end ? ' until ' + end : '');return 'Runs daily until you turn it off';})();
  const pushAgain = () => {stamp();alert('Pushed. Reps will see the broadcast again today.');};
  const fmt = (t) => {if (!t) return '—';try {return new Date(Number(t)).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });} catch (e) {return '—';}};
  const inp = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border,#d8d2c4)', fontFamily: 'inherit', fontSize: 14, background: 'var(--surface,#fff)', color: 'inherit', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-meta,#8a8372)', marginBottom: 6 };
  const hasContent = !!img || !!title || !!msg || !!badge;
  return (
    <div className="crm-body">
      <div className="crm-sec-head" style={{ marginBottom: 6 }}><h2>Rep Broadcast</h2><span className="meta">A once-a-day pop-up shown to every sales rep when they open the CRM</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 20, alignItems: 'start' }}>

        <div className="crm-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid var(--divider,#eee)' }}>
            <button onClick={toggle} aria-label="toggle" style={{ width: 46, height: 26, borderRadius: 99, border: 'none', cursor: 'pointer', background: active ? 'var(--emerald,#0E5C4A)' : '#cfc8b8', position: 'relative', transition: 'background .15s' }}>
              <span style={{ position: 'absolute', top: 3, left: active ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{active ? 'Broadcast is ON — reps will see it' : 'Broadcast is OFF'}</span>
          </div>

          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Message to reps</div>
          <div style={{ marginBottom: 14 }}><span style={lbl}>Headline</span>
            <input style={inp} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New Laser Engraved products added" /></div>
          <div style={{ marginBottom: 14 }}><span style={lbl}>Message</span>
            <textarea style={{ ...inp, minHeight: 80, resize: 'vertical', lineHeight: 1.5 }} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Please offer these to your customers this month." /></div>
          <div style={{ marginBottom: 16 }}><span style={lbl}>Highlight badge (optional)</span>
            <input style={inp} value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="Special extra 2% commission this month" /></div>
          <button className="cbtn cbtn-primary" onClick={saveText}>Save &amp; push message</button>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--divider,#eee)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Schedule</div>
            <p className="crm-muted" style={{ fontSize: 12.5, margin: '0 0 14px' }}>Shown once a day to each rep, between these dates. Leave blank to start today / run until you turn it off.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 130 }}><span style={lbl}>Start date</span>
                <input type="date" style={inp} value={start} onChange={(e) => setStart(e.target.value)} /></div>
              <div style={{ flex: 1, minWidth: 130 }}><span style={lbl}>End date</span>
                <input type="date" style={inp} value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
              <button className="cbtn cbtn-ghost cbtn-sm" onClick={saveSchedule}>Save schedule</button>
              <span className="crm-muted" style={{ fontSize: 12.5 }}>{scheduleNote}</span>
            </div>
          </div>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--divider,#eee)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Image (optional)</div>
            <p className="crm-muted" style={{ fontSize: 12.5, margin: '0 0 14px' }}>Add a product flyer or photo shown above the message.</p>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
            {img ?
            <div>
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border,#ddd)', marginBottom: 12, maxWidth: 280 }}>
                <img src={img} alt="Broadcast" style={{ width: '100%', display: 'block' }} /></div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => fileRef.current && fileRef.current.click()}>Replace image</button>
                <button className="cbtn cbtn-ghost cbtn-sm" style={{ color: 'var(--ruby,#8B1E2E)' }} onClick={removeImg}>Remove image</button>
              </div>
            </div> :
            <button onClick={() => fileRef.current && fileRef.current.click()} style={{ width: '100%', maxWidth: 280, padding: '30px 16px', background: 'var(--surface-2,#f6f3ec)', border: '1.5px dashed var(--border-strong,#cdc6b4)', borderRadius: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--fg-muted,#888)', fontFamily: 'inherit' }}>
              <span style={{ fontSize: 26 }}>⬆</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg,#222)' }}>Upload image</span>
              <span style={{ fontSize: 12 }}>PNG or JPG</span>
            </button>}
          </div>

          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--divider,#eee)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="cbtn cbtn-accent cbtn-sm" onClick={pushAgain}>Push again today</button>
            <span className="crm-muted" style={{ fontSize: 12.5 }}>Last pushed: <strong>{fmt(updated)}</strong></span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-meta,#8a8372)', marginBottom: 10 }}>Live preview — what reps see</div>
          <div style={{ borderRadius: 18, overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.16)', border: '1px solid var(--border,#e4ddcd)', background: '#fff' }}>
            {img && <img src={img} alt="" style={{ width: '100%', display: 'block', maxHeight: 240, objectFit: 'cover' }} />}
            {hasContent ?
            <div style={{ background: 'linear-gradient(155deg,#0E5C4A,#0A3F33)', color: '#FDFAF2', padding: '26px 26px 22px' }}>
              <div style={{ fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(245,231,196,0.9)', fontWeight: 700, marginBottom: 10 }}>📣 For the team</div>
              {title && <div style={{ fontFamily: 'var(--font-serif,Georgia,serif)', fontSize: 22, lineHeight: 1.18, marginBottom: msg ? 10 : 0 }}>{title}</div>}
              {msg && <p style={{ fontSize: 14, lineHeight: 1.55, color: 'rgba(253,250,242,0.9)', margin: 0, whiteSpace: 'pre-line' }}>{msg}</p>}
              {badge && <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,231,196,0.14)', border: '1px solid rgba(245,231,196,0.4)', borderRadius: 11, padding: '10px 13px' }}><span style={{ fontSize: 22 }}>🎉</span><span style={{ fontSize: 13.5, fontWeight: 700, color: '#F5E7C4' }}>{badge}</span></div>}
            </div> :
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--fg-meta,#999)', fontSize: 13 }}>Write a message or upload an image to see the preview.</div>}
            {hasContent && <div style={{ padding: '12px', textAlign: 'center' }}><span className="cbtn cbtn-primary cbtn-sm" style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>Got it</span></div>}
          </div>
        </div>

      </div>
    </div>);

}

function RepBroadcastPopup() {
  const read = (k) => {try {return localStorage.getItem(k) || '';} catch (e) {return '';}};
  const todayKey = () => new Date().toISOString().slice(0, 10);
  const active = read('eurostar-rep-announce-active') === '1';
  const img = read('eurostar-rep-announce-image');
  const title = read('eurostar-rep-announce-title');
  const msg = read('eurostar-rep-announce-msg');
  const badge = read('eurostar-rep-announce-badge');
  const updated = read('eurostar-rep-announce-updated');
  const start = read('eurostar-rep-announce-start');
  const end = read('eurostar-rep-announce-end');
  const today = todayKey();
  const inWindow = (!start || today >= start) && (!end || today <= end);
  const token = today + '|' + updated; // changes daily, and whenever admin re-pushes
  const hasContent = !!img || !!msg || !!title;
  const [show, setShow] = useState(() => active && inWindow && hasContent && read('eurostar-rep-announce-seen') !== token);
  if (!show) return null;
  const dismiss = () => {try {localStorage.setItem('eurostar-rep-announce-seen', token);} catch (e) {}setShow(false);};
  return (
    <div onClick={dismiss} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(21,19,15,0.74)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: 'min(420px,92vw)', maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface,#fff)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        <button onClick={dismiss} aria-label="Close" style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(21,19,15,0.55)', color: '#fff', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        {img && <img src={img} alt="Announcement" style={{ width: '100%', display: 'block', maxHeight: '52vh', objectFit: 'cover', background: '#15130F' }} />}
        {(title || msg || badge) &&
        <div style={{ background: 'linear-gradient(155deg,#0E5C4A,#0A3F33)', color: '#FDFAF2', padding: '30px 30px 26px' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(245,231,196,0.9)', fontWeight: 700, marginBottom: 12 }}>📣 For the team</div>
          {title && <div style={{ fontFamily: 'var(--font-serif,Georgia,serif)', fontSize: 25, lineHeight: 1.18, letterSpacing: '-0.01em', marginBottom: msg ? 12 : 0 }}>{title}</div>}
          {msg && <p style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(253,250,242,0.9)', margin: 0, whiteSpace: 'pre-line' }}>{msg}</p>}
          {badge &&
          <div style={{ marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(245,231,196,0.14)', border: '1px solid rgba(245,231,196,0.4)', borderRadius: 12, padding: '12px 16px' }}>
            <span style={{ fontSize: 26, lineHeight: 1 }}>🎉</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#F5E7C4' }}>{badge}</span>
          </div>}
        </div>}
        <div style={{ padding: '14px 16px', textAlign: 'center', background: 'var(--surface,#fff)' }}>
          <button onClick={dismiss} className="cbtn cbtn-primary" style={{ padding: '11px 30px', fontSize: 14, whiteSpace: 'nowrap' }}>Got it</button>
        </div>
      </div>
    </div>);

}

function RepDesk({ st, repId }) {
  const d = repData(st, repId);
  const [logPayTarget, setLogPayTarget] = useState(null);
  const myPays = (st.payments || []).filter((p) => {const c = H.cust(p.custId);return c.rep === repId;});
  const payForOrder = (ordId) => myPays.find((p) => p.orderId === ordId);
  const asm = (st.leaders || []).find((l) => {const rep = (st.reps || []).find((r) => r.id === repId) || {};return l.id === rep.asm;});
  const quickPay = () => {const t = d.dueAlerts[0] ? { order: d.dueAlerts[0].order, cust: d.dueAlerts[0].cust } : d.myOrders[0] ? { order: d.myOrders[0], cust: H.cust(d.myOrders[0].cust) } : null;if (t) setLogPayTarget(t);else alert('No orders to log a payment against yet.');};
  return (
    <div className="crm-body">
      <RepCheckIn st={st} repId={repId} />
      <div className="rep-quick-actions">
        <a className="rep-qa rep-qa-primary" href="Eurostar Sales website.html">
          <span className="rep-qa-icon">🛒</span>
          <span className="rep-qa-label">Take an order</span>
          <span className="rep-qa-sub">Open Sales App</span>
        </a>
        <button className="rep-qa" onClick={() => st.goAddCustomer && st.goAddCustomer()}>
          <span className="rep-qa-icon">＋</span>
          <span className="rep-qa-label">Add customer</span>
          <span className="rep-qa-sub">New account</span>
        </button>
        <button className="rep-qa" onClick={quickPay}>
          <span className="rep-qa-icon">💰</span>
          <span className="rep-qa-label">Log payment</span>
          <span className="rep-qa-sub">Record collection</span>
        </button>
        {asm ?
        <a className="rep-qa" href={'tel:+91' + asm.phone}>
              <span className="rep-qa-icon">📞</span>
              <span className="rep-qa-label">Call manager</span>
              <span className="rep-qa-sub">{asm.name}</span>
            </a> :
        <a className="rep-qa" href="Eurostar Sales website.html">
              <span className="rep-qa-icon">📑</span>
              <span className="rep-qa-label">Browse catalog</span>
              <span className="rep-qa-sub">Prices &amp; sizes</span>
            </a>}
      </div>
      <RepVisits st={st} repId={repId} />
      <RepCoachCard st={st} repId={repId} onQuickPay={quickPay} />
      {d.dueAlerts.length > 0 &&
      <div className="crm-card" style={{ borderColor: '#E6B8BE', background: 'var(--ruby-soft)', marginBottom: 20 }}>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontWeight: 700, color: 'var(--ruby)', fontSize: 14, marginBottom: 4 }}>⚠ {d.dueAlerts.length} payment{d.dueAlerts.length > 1 ? 's' : ''} overdue — follow up</div>
          {d.dueAlerts.map(({ order, cust, overdueDays }) =>
          <div key={order.id} className="due-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderTop: '1px solid #E6B8BE', fontSize: 13 }}>
              <div style={{ flex: 1 }}><strong>{cust.name}</strong> <span className="crm-id crm-muted">· {order.id}</span>
                <div className="crm-muted" style={{ fontSize: 12 }}>{cust.terms}-day terms · <span style={{ color: 'var(--ruby)', fontWeight: 600 }}>{overdueDays} day{overdueDays > 1 ? 's' : ''} overdue</span></div></div>
              <div className="crm-amt">{H.inr(order.value)}</div>
              {(() => {const pay = payForOrder(order.id);
              if (pay && pay.status === 'confirmed') return <Pill s="delivered" label="✓ Payment confirmed" />;
              if (pay && pay.status === 'pending') return <Pill s="confirmed" label="Pending verification" />;
              return <React.Fragment><button className="cbtn cbtn-ghost cbtn-sm">Remind</button><button className="cbtn cbtn-primary cbtn-sm" style={{ marginLeft: 6 }} onClick={() => setLogPayTarget({ order, cust })}>Log payment</button></React.Fragment>;
            })()}
              </div>)}
        </div>
      </div>}
      {d.pending > 0 &&
      <div className="crm-card" style={{ borderColor: '#E6CC7F', background: 'var(--amber-soft)', marginBottom: 20 }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, color: '#7A5214', fontSize: 14, flex: 1 }}>
            🎯 {d.pending} new customer{d.pending > 1 ? 's' : ''} still to add this month
            <div style={{ fontWeight: 500, fontSize: 12.5, marginTop: 2 }}>Target {d.target} · added {d.added} · June 2026</div>
          </div>
        </div>
      </div>}
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">My customers</div><div className="kpi-value">{d.myCust.length}</div><div className="kpi-sub">{d.rep.region}</div></div>
        <div className="kpi"><div className="kpi-label">New adds (June)</div><div className="kpi-value">{d.added}<span style={{ fontSize: 16, color: 'var(--fg-meta)' }}> / {d.target}</span></div><div className="kpi-sub">{d.pending > 0 ? <span className="down">{d.pending} pending</span> : <span className="up">target met ✓</span>}</div></div>
        <div className="kpi"><div className="kpi-label">My sales (MTD)</div><div className="kpi-value">{H.inr(d.sales)}</div><div className="kpi-sub">{d.myOrders.length} orders</div></div>
        <div className="kpi"><div className="kpi-label">My commission</div><div className="kpi-value">{H.inr(d.comm)}</div><div className="kpi-sub">blended {(d.rate * 100).toFixed(1)}%</div></div>
      </div>
      <div className="crm-card" style={{ marginTop: 20, padding: '14px 18px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--fg-meta)', marginBottom: 10 }}>Escalation — for any field problem, contact in this order</div>
        {(() => {const ldrs = st.leaders || [];const rep = (st.reps || []).find((r) => r.id === repId) || {};
          const asm = ldrs.find((l) => l.id === rep.asm);const head = ldrs.find((l) => l.id === rep.head);
          const list = [
          ...(asm ? [{ ini: '1', name: asm.name, role: 'Step 1 · Area Sales Manager', phone: asm.phone }] : []),
          ...(head ? [{ ini: '2', name: head.name, role: 'Step 2 · if not resolved by ASM', phone: head.phone }] : [])];

          if (list.length === 0) return <div className="crm-muted" style={{ fontSize: 13 }}>No escalation contacts assigned. Admin can assign your ASM / Sales Head from Reps &amp; commission.</div>;
          return list.map((p, i) =>
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '9px 0', borderTop: i ? '1px solid var(--divider)' : 'none' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--emerald-soft)', color: 'var(--emerald-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: 'var(--font-serif)', flex: '0 0 38px' }}>{p.ini}</div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-meta)' }}>{p.role}</div>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>{p.name}</div>
            </div>
            <a className="cbtn cbtn-primary cbtn-sm" href={'tel:+91' + p.phone}>📞 {p.phone}</a>
            <a className="cbtn cbtn-ghost cbtn-sm" href={'https://wa.me/91' + p.phone} target="_blank">WhatsApp</a>
          </div>
          );})()}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '26px 0 12px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 20, margin: 0 }}>My open carts</h2>
      </div>
      <div className="crm-card">
        {d.myCarts.length === 0 && <div className="lrow crm-muted">No open carts.</div>}
        {d.myCarts.map((c) => {const cu = H.cust(c.cust);return (
            <div key={c.id} className="lrow">
            <div className="lrow-main"><div className="lrow-title">{cu.name}</div><div className="lrow-sub">{c.items} items · {c.age} · {statusLabel(c.status)}</div></div>
            <div className="lrow-amt"><div className="crm-amt">{H.inr(c.value)}</div></div>
            <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => st.editItems(c.id)}>Edit</button>
            <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => st.removeCart(c.id)}>Remove</button>
          </div>);})}
      </div>

      {(() => {const stages = window.CRM_STAGES || [];const myLeads = (st.leads || []).filter((l) => l.rep === repId);
        const today = '2026-06-17';const dueLeads = myLeads.filter((l) => l.stage < 6 && l.followUp <= today).sort((a, b) => a.followUp.localeCompare(b.followUp));
        const stageMeta = (id) => stages.find((s) => s.id === id) || { label: '?' };
        if (myLeads.length === 0) return null;
        return (
          <React.Fragment>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '26px 0 12px' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 20, margin: 0 }}>My pipeline</h2>
            <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => st.goPipeline && st.goPipeline()}>Open pipeline →</button>
          </div>
          <div className="kpi-grid" style={{ gridTemplateColumns: `repeat(${stages.length},1fr)` }}>
            {stages.map((s) => {const n = myLeads.filter((l) => l.stage === s.id).length;return (
                  <div key={s.id} className="kpi" style={{ padding: '12px 12px' }}>
                <div className="kpi-label" style={{ fontSize: 10.5 }}>{s.id}. {s.short}</div>
                <div className="kpi-value" style={{ fontSize: 24 }}>{n}</div>
              </div>);})}
          </div>
          <div className="crm-card" style={{ marginTop: 4 }}>
            <SecHead title="Follow-ups due" meta={`${dueLeads.length} need action`} />
            {dueLeads.map((l) => {const overdue = l.followUp < today;return (
                  <div key={l.id} className="lrow">
                <div className="lrow-main"><div className="lrow-title">{l.name} {l.assigned && <Pill s="confirmed" label="Admin-assigned" />}</div>
                  <div className="lrow-sub">{l.city} · stage {l.stage}: {stageMeta(l.stage).label}</div></div>
                <div style={{ textAlign: 'right' }}><div className="crm-muted" style={{ fontSize: 12 }}>Follow-up</div>
                  <div style={{ fontWeight: 600, color: overdue ? 'var(--ruby)' : 'var(--fg)', fontSize: 13 }}>{l.followUp}{overdue ? ' · overdue' : ''}</div></div>
                <button className="cbtn cbtn-primary cbtn-sm" onClick={() => st.setStage(l.id, Math.min(6, l.stage + 1))}>Advance →</button>
              </div>);})}
            {dueLeads.length === 0 && <div className="lrow crm-muted">No follow-ups due — you're all caught up.</div>}
          </div>
        </React.Fragment>);})()}
      {logPayTarget && <LogPaymentModal order={logPayTarget.order} cust={logPayTarget.cust} onLog={st.logPayment} onClose={() => setLogPayTarget(null)} />}
    </div>);

}
function OrdersTableInner({ orders, rate }) {
  return (
    <table className="crm-table">
      <thead><tr><th>{TH("Order")}</th><th>{TH("Customer")}</th><th>{TH("City")}</th><th>{TH("Status")}</th><th style={{ textAlign: 'right' }}>{TH("Value")}</th><th style={{ textAlign: 'right' }}>{TH("Commission")}</th></tr></thead>
      <tbody>{orders.map((o) => {const c = H.cust(o.cust);return (
            <tr key={o.id}><td className="crm-id">{o.id}</td><td>{c.name}</td><td className="crm-muted">{c.city}</td><td><Pill s={o.status} label={statusLabel(o.status)} /></td>
        <td className="crm-amt" style={{ textAlign: 'right' }}>{H.inr(o.value)}</td>
        <td className="crm-amt" style={{ textAlign: 'right', color: 'var(--emerald-ink)' }}>{H.inr(Math.round(o.value * rate))}</td></tr>);})}</tbody>
    </table>);

}

function LogPaymentModal({ order, cust, onLog, onClose }) {
  const [mode, setMode] = useState('upi');
  const [amount, setAmount] = useState(String(order.value));
  const [utr, setUtr] = useState('');
  const [date, setDate] = useState('2026-06-26');
  const [by, setBy] = useState('');
  const [contact, setContact] = useState('');
  const [img, setImg] = useState(null);
  const fileRef = React.useRef(null);
  const isCash = mode === 'cash';
  const inp = { width: '100%', padding: '9px 11px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 13, fontFamily: 'inherit', color: 'var(--fg)', boxSizing: 'border-box' };
  const lbl = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-meta)', display: 'block', marginBottom: 5 };
  const onFile = (e) => {const f = e.target.files && e.target.files[0];if (!f) return;const r = new FileReader();r.onload = () => setImg(r.result);r.readAsDataURL(f);};
  const submit = () => {
    if (!amount || parseFloat(amount) <= 0) {alert('Enter a valid amount.');return;}
    if (isCash && !by) {alert('Please enter who transferred the cash to Head Office.');return;}
    if (!isCash && !utr) {alert('Please enter the UTR / reference number.');return;}
    onLog({ orderId: order.id, custId: order.cust, custName: (cust && cust.name) || '', mode, amount: parseFloat(amount), utr: isCash ? '' : utr, date, by: isCash ? by : '', contact: isCash ? contact : '', img, status: 'pending', loggedAt: new Date().toISOString() });
    onClose();
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(21,19,15,0.52)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', width: 'min(480px,96vw)', maxHeight: '90vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 19 }}>Log payment received</div>
            <div className="crm-muted" style={{ fontSize: 12.5 }}>{order.id} · {cust.name} · {H.inr(order.value)}</div>
          </div>
          <button className="cbtn cbtn-ghost cbtn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={lbl}>Payment mode</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[['upi', 'UPI'], ['neft', 'NEFT / Bank Transfer'], ['cash', 'Cash'], ['cheque', 'Cheque']].map(([v, l]) =>
              <button key={v} className={`cbtn cbtn-sm ${mode === v ? 'cbtn-primary' : 'cbtn-ghost'}`} onClick={() => setMode(v)}>{l}</button>
              )}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Amount (₹) *</label>
              <input style={inp} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
            </div>
            <div>
              <label style={lbl}>Date *</label>
              <input style={inp} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          {!isCash &&
          <div>
            <label style={lbl}>UTR / Reference number *</label>
            <input style={inp} placeholder="e.g. 326789012345 or TXNID001234" value={utr} onChange={(e) => setUtr(e.target.value)} />
          </div>}
          {isCash &&
          <React.Fragment>
            <div>
              <label style={lbl}>Transferred to Head Office by *</label>
              <input style={inp} placeholder="Name of person who brought the cash" value={by} onChange={(e) => setBy(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Contact information</label>
              <input style={inp} placeholder="Phone number of the person above" value={contact} onChange={(e) => setContact(e.target.value)} />
            </div>
          </React.Fragment>}
          <div>
            <label style={lbl}>Receipt / screenshot {isCash ? '(required)' : '(optional)'}</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
            {img ?
            <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={img} alt="receipt" style={{ maxWidth: 180, maxHeight: 120, borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }} />
                  <button onClick={() => setImg(null)} style={{ position: 'absolute', top: 4, right: 4, background: 'var(--ruby)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 11, cursor: 'pointer' }}>✕</button>
                </div> :
            <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => fileRef.current && fileRef.current.click()}>📎 Attach receipt image</button>}
          </div>
        </div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--divider)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="cbtn cbtn-ghost" onClick={onClose}>Cancel</button>
          <button className="cbtn cbtn-accent" onClick={submit}>Submit payment log</button>
        </div>
      </div>
    </div>);

}

function AdminPayments({ st }) {
  const [filter, setFilter] = useState('pending');
  const allPays = st.payments || [];
  const pays = (filter === 'all' ? allPays : allPays.filter((p) => p.status === filter)).slice().reverse();
  const modeLabel = { upi: 'UPI', neft: 'NEFT / Bank Transfer', cash: 'Cash', cheque: 'Cheque' };
  const pendingCount = allPays.filter((p) => p.status === 'pending').length;
  return (
    <div className="crm-body">
      <PageHead title="Payment log" sub="Payments reported by reps — verify against your bank records" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['pending', 'Pending verification'], ['confirmed', 'Confirmed'], ['rejected', 'Rejected'], ['all', 'All']].map(([v, l]) =>
        <button key={v} className={`cbtn cbtn-sm ${filter === v ? 'cbtn-primary' : 'cbtn-ghost'}`} onClick={() => setFilter(v)}>
            {l}{v === 'pending' && pendingCount > 0 ? <span style={{ marginLeft: 6, background: 'var(--ruby)', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10.5 }}>{pendingCount}</span> : null}
          </button>
        )}
      </div>
      {pays.length === 0 &&
      <div className="crm-card" style={{ padding: '28px 20px', textAlign: 'center' }}>
          <div className="crm-muted">{filter === 'pending' ? 'No payments pending verification — all clear.' : 'No payments in this category yet.'}</div>
        </div>}
      {pays.map((p) => {const cu = H.cust(p.custId) || {};const custName = cu.name || p.custName || '—';const o = (st.orders || []).find((x) => x.id === p.orderId) || {};const rep = H.rep(cu.rep);const fromApp = p.source === 'Sales App';return (
          <div key={p.id} className="crm-card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>{custName} <span className="crm-id crm-muted">· {p.orderId}</span>{fromApp && <span className="crm-id" style={{ marginLeft: 8, fontSize: 9.5, background: 'var(--surface-2,#f0ece2)', color: 'var(--fg-meta,#777)', padding: '2px 7px', borderRadius: 99, fontWeight: 700 }}>via SALES APP · auto-verified</span>}</div>
              <div className="crm-muted" style={{ fontSize: 12 }}>{fromApp ? 'Paid online by customer' + (p.custCode ? ' · ' + p.custCode : '') : (cu.city || '') + ' · Rep: ' + (rep.name || '—')} · Order value: {H.inr(o.value || p.amount || 0)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--emerald-ink)' }}>{H.inr(p.amount)}</div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                  color: p.status === 'confirmed' ? 'var(--emerald-ink)' : p.status === 'rejected' ? 'var(--ruby)' : 'var(--amber)' }}>{p.status}</div>
            </div>
          </div>
          <div style={{ padding: '14px 18px', display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 5, columnGap: 14, fontSize: 13 }}>
                <span className="crm-muted">Mode</span><strong>{modeLabel[p.mode] || p.mode}</strong>
                <span className="crm-muted">Date</span><span>{p.date}</span>
                {p.utr ? <React.Fragment><span className="crm-muted">UTR / Ref</span><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.utr}</span></React.Fragment> : null}
                {p.by ? <React.Fragment><span className="crm-muted">Cash brought by</span><span>{p.by}</span></React.Fragment> : null}
                {p.contact ? <React.Fragment><span className="crm-muted">Contact</span><span>{p.contact}</span></React.Fragment> : null}
                <span className="crm-muted">Logged</span><span className="crm-muted" style={{ fontSize: 11 }}>{new Date(p.loggedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            {p.img ? <img src={p.img} alt="receipt" style={{ maxWidth: 140, maxHeight: 100, borderRadius: 'var(--r-md)', border: '1px solid var(--border)', objectFit: 'cover', flexShrink: 0 }} /> : null}
            {p.status === 'pending' &&
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <button className="cbtn cbtn-ghost cbtn-sm" style={{ color: 'var(--ruby)' }} onClick={() => st.rejectPayment(p.id)}>✗ Reject</button>
                <button className="cbtn cbtn-accent cbtn-sm" onClick={() => st.verifyPayment(p.id)}>✓ Confirm payment</button>
              </div>}
            {p.status === 'confirmed' && <div style={{ marginLeft: 'auto', color: 'var(--emerald-ink)', fontWeight: 600, fontSize: 13 }}>✓ Confirmed</div>}
            {p.status === 'rejected' && <div style={{ marginLeft: 'auto', color: 'var(--ruby)', fontWeight: 600, fontSize: 13 }}>✗ Rejected</div>}
          </div>
        </div>);
      })}
    </div>);

}

function AddLeadForm({ st, onDone, noAssign }) {
  const [f, setF] = useState({ name: '', city: '', mobile: '', gst: '', rep: '', note: '' });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const submit = () => {if (!f.name || !f.city || !f.mobile) {alert('Name, city and mobile are required.');return;}
    st.addLead(noAssign ? { ...f, rep: '' } : f);onDone();};
  const inp = { width: '100%', padding: '9px 11px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 13, fontFamily: 'inherit', color: 'var(--fg)' };
  return (
    <div className="crm-card" style={{ padding: 18, marginBottom: 16 }}>
      <div style={{ fontWeight: 600, marginBottom: 12 }}>Add a single lead{noAssign && <span className="crm-muted" style={{ fontWeight: 400, fontSize: 12 }}> · admin will assign to a rep</span>}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
        <input style={inp} placeholder="Lead name *" value={f.name} onChange={(e) => set('name', e.target.value)} />
        <input style={inp} placeholder="City *" value={f.city} onChange={(e) => set('city', e.target.value)} />
        <input style={inp} placeholder="Mobile *" value={f.mobile} onChange={(e) => set('mobile', e.target.value)} />
        <input style={inp} placeholder="GST / PAN (optional)" value={f.gst} onChange={(e) => set('gst', e.target.value)} />
        {!noAssign &&
        <select style={inp} value={f.rep} onChange={(e) => set('rep', e.target.value)}>
          <option value="">Assign to rep… (or auto by city)</option>
          {CRM_REPS.map((r) => <option key={r.id} value={r.id}>{r.name} · {r.region}</option>)}
        </select>}
        <input style={inp} placeholder="Notes" value={f.note} onChange={(e) => set('note', e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
        <button className="cbtn cbtn-ghost cbtn-sm" onClick={onDone}>Cancel</button>
        <button className="cbtn cbtn-accent cbtn-sm" onClick={submit}>Add lead</button>
      </div>
    </div>);

}

function StepHead({ n, title, desc, badge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
      <div style={{ flex: '0 0 28px', width: 28, height: 28, borderRadius: '50%', background: 'var(--emerald,#0E5C4A)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>{n}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
          {badge}
        </div>
        {desc && <div className="crm-muted" style={{ fontSize: 12.5, marginTop: 3, lineHeight: 1.5 }}>{desc}</div>}
      </div>
    </div>);

}

function CountPill({ n, tone }) {
  const c = tone === 'ruby' ? { bg: 'var(--ruby-soft,#F2DEDE)', fg: 'var(--ruby,#8B1E2E)' } : tone === 'emerald' ? { bg: 'var(--emerald-soft,#e6f1ec)', fg: 'var(--emerald,#0E5C4A)' } : { bg: 'var(--surface-2,#eee)', fg: 'var(--fg-meta,#777)' };
  return <span style={{ background: c.bg, color: c.fg, fontWeight: 700, fontSize: 12, padding: '3px 10px', borderRadius: 99 }}>{n}</span>;
}

function OfficeLeads({ st }) {
  const fileRef = React.useRef(null);
  const reps = window.CRM_REPS || [];
  const [showAdd, setShowAdd] = useState(false);
  const flagged = (st.leads || []).filter((l) => l.flagged);
  const clean = (st.leads || []).filter((l) => !l.flagged && !l.rep);
  const summary = st.importSummary;
  const onBulk = (e) => {const f = e.target.files && e.target.files[0];if (!f) return;st.bulkLeads(f, true);e.target.value = '';};
  const cityRepOf = (city) => reps.find((r) => r.id === (window.CRM_CITY_REP || {})[city]);
  return (
    <div className="crm-body">
      <PageHead title="Leads" sub="Upload purchased data → review existing-customer matches → assign the rest" />

      {/* STEP 1 — Upload */}
      <div className="crm-card" style={{ padding: 18, marginBottom: 14 }}>
        <StepHead n="1" title="Upload purchased leads" desc="Every lead is checked automatically against your Customer Database — by GST number, or by name + city / mobile when GST is missing." />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={onBulk} style={{ display: 'none' }} />
          <button className="cbtn cbtn-primary" onClick={() => fileRef.current && fileRef.current.click()}>⬆ Upload Excel / CSV</button>
          <a className="cbtn cbtn-ghost cbtn-sm" href="templates/Eurostar Lead Upload Template.xlsx" download>↓ Template</a>
          <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => setShowAdd((s) => !s)}>＋ Add a single lead</button>
        </div>
        {summary &&
        <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'var(--surface-2,#f6f3ec)', border: '1px solid var(--divider,#e6e0d2)', fontSize: 13 }}>
          Last import: <strong>{summary.total}</strong> lead{summary.total === 1 ? '' : 's'} · <strong style={{ color: 'var(--emerald)' }}>{summary.clean} clean</strong> · <strong style={{ color: 'var(--ruby)' }}>{summary.flagged} flagged</strong> as existing customers.
        </div>}
        {showAdd && <div style={{ marginTop: 14 }}><AddLeadForm st={st} noAssign onDone={() => setShowAdd(false)} /></div>}
      </div>

      {/* STEP 2 — Flagged: existing customers */}
      <div className="crm-card" style={{ padding: 0, marginBottom: 14, border: '1px solid ' + (flagged.length ? 'var(--ruby,#8B1E2E)' : 'var(--border,#d8d2c4)') }}>
        <div style={{ padding: '16px 18px 2px' }}>
          <StepHead n="2" title="Existing customers — your decision"
            badge={<CountPill n={flagged.length} tone={flagged.length ? 'ruby' : 'grey'} />}
            desc="These leads matched a customer you already have. Approve only the ones worth pursuing (you can assign at the same time); discard the rest so reps never re-prospect them." />
        </div>
        {flagged.length === 0 ?
        <div className="crm-muted" style={{ padding: '4px 18px 20px', fontSize: 13 }}>✓ Nothing to review — no leads matched your existing customers.</div> :
        <table className="crm-table">
          <thead><tr><th>{TH("Lead")}</th><th>{TH("City")}</th><th>{TH("GST")}</th><th>{TH("Matches existing")}</th><th style={{ textAlign: 'right' }}>{TH("Decision")}</th></tr></thead>
          <tbody>{flagged.map((l) => {const cr = cityRepOf(l.city);return (
            <tr key={l.id}><td>{l.name}<div className="crm-muted" style={{ fontSize: 11 }}>{l.mobile}</div></td>
              <td className="crm-muted">{l.city}</td><td className="crm-id crm-muted">{l.gst || '—'}</td>
              <td><Pill s="danger" label={l.flagName || 'existing customer'} />{l.flagBy && <div className="crm-muted" style={{ fontSize: 10.5, marginTop: 3 }}>matched by {l.flagBy}</div>}</td>
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <select className="cbtn cbtn-accent cbtn-sm" style={{ appearance: 'auto', cursor: 'pointer', maxWidth: 200 }} value=""
                  onChange={(e) => {const v = e.target.value;e.target.value = '';if (!v) return;
                    if (v === '__city') {if (confirm('Approve “' + l.name + '” and auto-forward to ' + (cr ? cr.name : 'the city rep') + '?')) st.approveFlaggedLead(l.id, '__city');} else
                    if (v === '__pool') {if (confirm('Approve “' + l.name + '” to the unassigned pool (assign later in Step 3)?')) st.approveFlaggedLead(l.id, '');} else
                    {const rp = reps.find((r) => r.id === v);if (confirm('Approve “' + l.name + '” and assign to ' + (rp ? rp.name : 'this rep') + '?')) st.approveFlaggedLead(l.id, v);}}}>
                  <option value="">Approve &amp; assign…</option>
                  <option value="__city">⚡ Auto-forward by city{cr ? ' → ' + cr.name : ''}</option>
                  <optgroup label="Assign to a rep">{reps.map((r) => <option key={r.id} value={r.id}>{r.name}{r.region ? ' · ' + r.region : ''}</option>)}</optgroup>
                  <option value="__pool">Approve to pool (assign in Step 3)</option>
                </select>{' '}
                <button className="cbtn cbtn-ghost cbtn-sm" style={{ color: 'var(--ruby)' }} onClick={() => {if (confirm('Discard this duplicate lead permanently?')) st.discardFlaggedLead(l.id);}}>Discard</button>
              </td></tr>);})}
          </tbody>
        </table>}
      </div>

      {/* STEP 3 — Assign clean leads */}
      <div className="crm-card" style={{ padding: 0, marginBottom: 14 }}>
        <div style={{ padding: '16px 18px 2px' }}>
          <StepHead n="3" title="Assign clean leads"
            badge={<CountPill n={clean.length} tone={clean.length ? 'emerald' : 'grey'} />}
            desc="New leads with no match. Send them all to their city reps in one click, or pick a rep per lead." />
          {clean.length > 0 &&
          <div style={{ marginBottom: 8 }}><button className="cbtn cbtn-accent cbtn-sm" onClick={() => {if (confirm('Auto-forward all ' + clean.length + ' clean lead(s) to their city reps?')) st.autoForwardLeads();}}>⚡ Auto-forward all by city</button></div>}
        </div>
        <table className="crm-table">
          <thead><tr><th>{TH("Lead")}</th><th>{TH("City")}</th><th>{TH("Mobile")}</th><th style={{ textAlign: 'right' }}>{TH("Assign to")}</th></tr></thead>
          <tbody>{clean.map((l) => {const cr = cityRepOf(l.city);return (
            <tr key={l.id}><td>{l.name}</td><td className="crm-muted">{l.city}</td><td className="crm-muted" style={{ fontSize: 12 }}>{l.mobile}</td>
              <td style={{ textAlign: 'right' }}>
                <select className="disc-input" style={{ width: 200, textAlign: 'left' }} value=""
                  onChange={(e) => {const v = e.target.value;e.target.value = '';if (!v) return;st.reassignLead(l.id, v === '__city' ? cr ? cr.id : '' : v);}}>
                  <option value="">Assign to…</option>
                  <option value="__city">⚡ By city{cr ? ' → ' + cr.name : ''}</option>
                  <optgroup label="Pick a rep">{reps.map((r) => <option key={r.id} value={r.id}>{r.name}{r.region ? ' · ' + r.region : ''}</option>)}</optgroup>
                </select>
              </td></tr>);})}
            {clean.length === 0 && <tr><td colSpan="4" className="crm-muted" style={{ padding: '14px 18px' }}>No clean leads waiting. Upload a file in Step 1, or approve leads in Step 2.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>);

}

function Pipeline({ st, repId }) {
  const stages = window.CRM_STAGES || [];
  const [repFilter, setRepFilter] = useState('');
  const leads = (st.leads || []).filter((l) => (!repId || l.rep === repId) && !l.flagged && (repId || !repFilter || l.rep === repFilter)).slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const stageMeta = (id) => stages.find((s) => s.id === id) || { label: '?', short: '?' };
  const today = '2026-06-17';
  const [showAdd, setShowAdd] = useState(false);
  const fileRef = React.useRef(null);
  const onBulk = (e) => {const f = e.target.files && e.target.files[0];if (!f) return;
    st.bulkLeads(f);e.target.value = '';};
  return (
    <div className="crm-body">
      <PageHead title={repId ? 'My pipeline & follow-ups' : 'Customer pipeline'} sub={repId ? 'Track each lead through the lifecycle' : 'All reps · lifecycle stage of every lead'} />

      {!repId &&
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center', padding: '12px 14px', background: 'var(--surface-2,#f6f3ec)', border: '1px solid var(--divider,#e6e0d2)', borderRadius: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>View pipeline for:</span>
        <select className="disc-input" style={{ width: 220, textAlign: 'left' }} value={repFilter} onChange={(e) => setRepFilter(e.target.value)}>
          <option value="">All reps</option>
          {(window.CRM_REPS || []).map((r) => <option key={r.id} value={r.id}>{r.name}{r.region ? ' · ' + r.region : ''}</option>)}
        </select>
        {repFilter && <span className="crm-muted" style={{ fontSize: 12.5 }}>{leads.length} customer{leads.length === 1 ? '' : 's'} · {leads.filter((l) => l.stage < 6 && l.stage > 0 && l.followUp < today).length} follow-up(s) due — ready for your weekly call.</span>}
      </div>}

      {!repId &&
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="cbtn" style={{ background: 'var(--emerald)', color: 'var(--paper)', fontSize: 15, padding: '13px 24px', fontWeight: 700, boxShadow: '0 8px 24px rgba(14,92,74,0.18)' }} onClick={() => setShowAdd((s) => !s)}>
          <span style={{ fontSize: 20, marginRight: 6 }}>＋</span> Add single lead
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={onBulk} style={{ display: 'none' }} />
        <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => fileRef.current && fileRef.current.click()}>⬆ Bulk upload (Excel)</button>
        <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => st.autoForwardLeads()}>⚡ Auto-forward by city</button>
        <a className="cbtn cbtn-ghost cbtn-sm" href="templates/Eurostar Lead Upload Template.xlsx" download>↓ Template</a>
      </div>}

      {!repId && showAdd &&
      <AddLeadForm st={st} onDone={() => setShowAdd(false)} />}

      {/* stage funnel summary */}
      <div className="kpi-grid" style={{ gridTemplateColumns: `repeat(${stages.length},1fr)` }}>
        {stages.map((s) => {const n = leads.filter((l) => l.stage === s.id).length;return (
            <div key={s.id} className="kpi" style={{ padding: '14px 14px' }}>
            <div className="kpi-label" style={{ fontSize: 11 }}>{s.id}. {s.short}</div>
            <div className="kpi-value" style={{ fontSize: 26 }}>{n}</div>
          </div>);})}
      </div>

      <div className="crm-card">
        <table className="crm-table" style={{ minWidth: 920 }}>
          <thead><tr><th>{TH("Lead")}</th><th>{TH("City")}</th>{!repId && <th>{TH("Rep")}</th>}<th>{TH("Source")}</th><th style={{ minWidth: 230 }}>{TH("Stage")}</th><th>{TH("Next follow-up")}</th><th></th></tr></thead>
          <tbody>{leads.map((l) => {const overdue = l.stage < 6 && l.stage > 0 && l.followUp < today;const closed = l.stage === 0;return (
                <tr key={l.id} style={{ opacity: closed ? 0.55 : 1 }}>
              <td>{l.name}<div className="crm-muted" style={{ fontSize: 11 }}>{l.mobile}</div></td>
              <td className="crm-muted">{l.city}</td>
              {!repId && <td>
                <select className="disc-input" style={{ width: 118, textAlign: 'left' }} value={l.rep || ''} onChange={(e) => st.reassignLead(l.id, e.target.value)}>
                  <option value="">— Unassigned —</option>
                  {CRM_REPS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </td>}
              <td>{l.assigned ? <Pill s="confirmed" label="Admin-assigned" /> : <span className="crm-muted" style={{ fontSize: 12 }}>Rep-sourced</span>}</td>
              <td>
                {closed ?
                    <Pill s="abandoned" label="Not interested — closed" /> :
                    <React.Fragment>
                    <select className="disc-input" style={{ width: '100%', textAlign: 'left', maxWidth: 200 }} value={l.stage} onChange={(e) => st.setStage(l.id, parseInt(e.target.value, 10))}>
                      {stages.map((s) => <option key={s.id} value={s.id}>{s.id}. {s.label}</option>)}
                    </select>
                    <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
                      {stages.map((s) => <span key={s.id} style={{ flex: 1, height: 5, borderRadius: 3, background: s.id <= l.stage ? 'var(--emerald)' : 'var(--paper-2)' }} />)}
                    </div>
                  </React.Fragment>}
              </td>
              <td>
                {!closed && <React.Fragment>
                  <input className="disc-input" style={{ width: 120, textAlign: 'left' }} type="date" value={l.followUp} onChange={(e) => st.setFollowUp(l.id, e.target.value)} />
                  {overdue && <div style={{ fontSize: 11, color: 'var(--ruby)', fontWeight: 600, marginTop: 3 }}>Overdue</div>}
                </React.Fragment>}
              </td>
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                {closed ?
                    <button className="cbtn cbtn-ghost cbtn-sm" onClick={() => st.setStage(l.id, 1)}>Reopen</button> :
                    <React.Fragment>
                    {l.stage < 6 && <button className="cbtn cbtn-primary cbtn-sm" onClick={() => st.setStage(l.id, Math.min(6, l.stage + 1))}>Advance →</button>}
                    {l.stage === 6 && <Pill s="active" label="Active buyer" />}
                    <button className="cbtn cbtn-ghost cbtn-sm" style={{ marginLeft: 6, color: 'var(--ruby)' }} onClick={() => {if (confirm('Mark ' + l.name + ' as Not interested and close this lead?')) st.setStage(l.id, 0);}}>Not interested</button>
                  </React.Fragment>}
              </td>
            </tr>);})}
            {leads.length === 0 && <tr><td colSpan={repId ? 6 : 7} className="crm-muted" style={{ padding: '14px 16px' }}>No leads in the pipeline.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="crm-muted" style={{ fontSize: 12.5, padding: '0 4px' }}>Change a stage from the dropdown or tap <strong>Advance →</strong>. Admin-assigned leads are flagged so the rep knows to follow up.</div>
    </div>);

}

function RepRfq({ st, repId }) {
  const mine = st.queries.filter((q) => q.assignedRep === repId);
  return (
    <div className="crm-body">
      <PageHead title="My RFQs" sub={`${mine.filter((q) => q.status === 'open').length} open · enquiries assigned to you`} />
      <div className="crm-card">
        <table className="crm-table" style={{ minWidth: 820 }}>
          <thead><tr><th>{TH("Ref")}</th><th>{TH("Customer")}</th><th>{TH("Product")}</th><th>{TH("Size")}</th><th>{TH("Qty")}</th><th>{TH("City")}</th><th>{TH("Contact")}</th><th>{TH("Status")}</th></tr></thead>
          <tbody>{mine.map((q) => {const cu = H.cust(q.cust);return (
                <tr key={q.id}><td className="crm-id" data-label="Ref">{q.id}</td><td data-label="Customer">{cu.name}</td><td data-label="Product">{q.product}<div className="crm-muted" style={{ fontSize: 11 }}>{q.special}</div></td>
            <td className="crm-muted" data-label="Size">{q.size}</td><td className="crm-muted" data-label="Qty">{q.qty}</td><td className="crm-muted" data-label="City">{q.city}</td>
            <td className="crm-muted" data-label="Contact" style={{ fontSize: 12 }}>{q.contactName}<div>{q.contact}</div></td><td data-label="Status"><Pill s={q.status} label={statusLabel(q.status)} /></td></tr>);})}
            {mine.length === 0 && <tr><td colSpan="8" className="crm-muted" style={{ padding: '14px 16px' }}>No RFQs assigned to you yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>);

}

function RepCustomers({ st, repId }) {
  const d = repData(st, repId);
  const [adding, setAdding] = useState(!!st.addCustOpen);
  const [form, setForm] = useState({ name: '', mobile: '', city: '', pincode: '', gst: '', photo: '', geo: '' });
  const fileRef = React.useRef(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const onPhoto = (e) => {const file = e.target.files && e.target.files[0];if (!file) return;const r = new FileReader();r.onload = () => set('photo', r.result);r.readAsDataURL(file);};
  const tagGeo = () => {if (!navigator.geolocation) {set('geo', 'Geo not supported');return;}
    set('geo', 'Locating…');navigator.geolocation.getCurrentPosition(
      (p) => set('geo', p.coords.latitude.toFixed(5) + ', ' + p.coords.longitude.toFixed(5)),
      () => set('geo', '18.5204, 73.8567 (sample)'));};
  const save = () => {if (!form.name || !form.mobile) {alert('Name and contact number are required.');return;}
    st.addCustomer(repId, { name: form.name, city: form.city, mobile: form.mobile, gst: form.gst || '—', pincode: form.pincode, photo: form.photo, geo: form.geo });
    setForm({ name: '', mobile: '', city: '', pincode: '', gst: '', photo: '', geo: '' });setAdding(false);};

  return (
    <div className="crm-body">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <PageHead title="My customers" sub={`${d.myCust.length} accounts · ${d.rep.region} · ${d.added}/${d.target} new added this month`} />
        <button className="cbtn cbtn-primary" onClick={() => setAdding((a) => !a)}>{adding ? 'Cancel' : '+ Add new customer'}</button>
      </div>

      {adding &&
      <div className="crm-card" style={{ padding: 20, marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 19, margin: '0 0 14px' }}>New customer — field capture</h2>
        <div className="crm-capture" style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 20 }}>
          <div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onPhoto} style={{ display: 'none' }} />
            <div className="crm-capture-photo" onClick={() => fileRef.current && fileRef.current.click()} style={{ aspectRatio: '1/1', borderRadius: 'var(--r-md)', border: '1.5px dashed var(--border-strong)', background: 'var(--paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', textAlign: 'center', fontSize: 12, color: 'var(--fg-meta)', padding: 8 }}>
              {form.photo ? <img src={form.photo} alt="Shop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>📷 Tap to photograph<br />the customer's shop</span>}
            </div>
            <button className="cbtn cbtn-ghost cbtn-sm" style={{ width: '100%', marginTop: 8, justifyContent: 'center' }} onClick={tagGeo}>📍 Tag location</button>
            {form.geo && <div className="crm-id crm-muted" style={{ fontSize: 11, marginTop: 6, textAlign: 'center' }}>{form.geo}</div>}
          </div>
          <div className="crm-capture-fields" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[['name', 'Name *', 'text'], ['mobile', 'Contact number *', 'tel'], ['city', 'City', 'text'], ['pincode', 'Pincode', 'text'], ['gst', 'GST number', 'text']].map(([k, lbl, t]) =>
            <label key={k} style={{ gridColumn: k === 'gst' ? '1 / -1' : 'auto' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-meta)', marginBottom: 6 }}>{lbl}</div>
                <input type={t} value={form[k]} onChange={(e) => set(k, e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', fontSize: 14, fontFamily: 'inherit' }} />
              </label>
            )}
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button className="cbtn cbtn-ghost" onClick={() => setAdding(false)}>Cancel</button>
              <button className="cbtn cbtn-accent" onClick={save}>Save customer</button>
            </div>
          </div>
        </div>
      </div>}

      <div className="crm-card">
        <table className="crm-table">
          <thead><tr><th>{TH("Customer")}</th><th>{TH("City")}</th><th>{TH("Pincode")}</th><th>{TH("GST")}</th><th>{TH("Mobile")}</th><th>{TH("Payment")}</th><th style={{ textAlign: 'right' }}>{TH("Since")}</th></tr></thead>
          <tbody>{d.myCust.map((c) => {const t = c.terms || 'cash';return (
                <tr key={c.id}><td data-label="Customer">{c.name}<div className="crm-muted" style={{ fontSize: 11 }}>{c.id}</div></td><td className="crm-muted" data-label="City">{c.city}</td>
            <td className="crm-muted" data-label="Pincode">{c.pincode || '—'}</td><td className="crm-id crm-muted" data-label="GST">{c.gst}</td><td className="crm-muted" data-label="Mobile" style={{ fontSize: 12 }}>{c.mobile}</td>
            <td data-label="Payment">{t === 'cash' ? <Pill s="delivered" label="Cash" /> : <Pill s="confirmed" label={t + ' days'} />}</td>
            <td className="crm-muted" data-label="Since" style={{ textAlign: 'right' }}>{(c.since || '').includes('/') ? c.since : '01/' + (c.since || '')}</td></tr>);})}</tbody>
        </table>
      </div>
      <PageHead title="My recent orders" sub="latest orders from your customers" />
      <div className="crm-card">
        {d.myOrders.length === 0 && <div className="lrow crm-muted">No orders yet.</div>}
        {d.myOrders.slice(0, 8).map((o) => {const cu = H.cust(o.cust);const pay = (st.payments || []).find((p) => p.orderId === o.id);return (
            <div key={o.id} className="lrow">
            <div className="lrow-main">
              <div className="lrow-title">{cu.name} <span className="crm-id crm-muted">· {o.id}</span></div>
              <div className="lrow-sub">{o.date} · {statusLabel(o.status)}</div>
            </div>
            <div className="lrow-amt"><div className="crm-amt">{H.inr(o.value)}</div></div>
            {pay && pay.status === 'confirmed' && <Pill s="delivered" label="✓ Paid" />}
            {pay && pay.status === 'pending' && <Pill s="confirmed" label="Pending verification" />}
          </div>);})}
      </div>

      {st.customers.filter((c) => !c.rep).length > 0 &&
      <React.Fragment>
        <PageHead title="Unassigned customers" sub="De-linked accounts — claim one to add it to your book" />
        <div className="crm-card">
          <table className="crm-table">
            <thead><tr><th>{TH("Customer")}</th><th>{TH("City")}</th><th>{TH("GST")}</th><th>{TH("Mobile")}</th><th></th></tr></thead>
            <tbody>{st.customers.filter((c) => !c.rep).map((c) =>
              <tr key={c.id}><td>{c.name}<div className="crm-muted" style={{ fontSize: 11 }}>{c.id}</div></td><td className="crm-muted">{c.city}</td>
              <td className="crm-id crm-muted">{c.gst}</td><td className="crm-muted" style={{ fontSize: 12 }}>{c.mobile}</td>
              <td style={{ textAlign: 'right' }}><button className="cbtn cbtn-accent cbtn-sm" onClick={() => st.claimCustomer(c.id, repId)}>Claim customer</button></td></tr>
              )}</tbody>
          </table>
        </div>
      </React.Fragment>}
    </div>);

}

function RepCommission({ st, repId }) {
  const d = repData(st, repId);
  const dispatched = d.myOrders.filter((o) => o.courier || o.slip || o.track);
  const bd = d.commBreakdown || [];
  return (
    <div className="crm-body">
      <PageHead title="My commission" sub="slab-based on your monthly sales" />
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Sales (MTD)</div><div className="kpi-value">{H.inr(d.sales)}</div></div>
        <div className="kpi"><div className="kpi-label">Blended rate</div><div className="kpi-value">{(d.rate * 100).toFixed(2)}%</div></div>
        <div className="kpi"><div className="kpi-label">Earned (MTD)</div><div className="kpi-value" style={{ color: 'var(--emerald-ink)' }}>{H.inr(d.comm)}</div></div>
      </div>

      <div className="crm-card">
        <SecHead title="How your commission is worked out" meta="higher slabs pay more" />
        <table className="crm-table">
          <thead><tr><th>{TH("Monthly sales slab")}</th><th style={{ textAlign: 'right' }}>{TH("Rate")}</th><th style={{ textAlign: 'right' }}>{TH("Your sales in slab")}</th><th style={{ textAlign: 'right' }}>{TH("Commission")}</th></tr></thead>
          <tbody>{bd.map((s, i) => (
            <tr key={i}>
              <td data-label="Slab">{s.to == null ? `${H.inr(s.from)} and above` : `${H.inr(s.from)} – ${H.inr(s.to)}`}</td>
              <td className="crm-amt" data-label="Rate" style={{ textAlign: 'right' }}>{s.pct}%</td>
              <td className="crm-amt" data-label="Sales in slab" style={{ textAlign: 'right' }}>{H.inr(s.amount)}</td>
              <td className="crm-amt" data-label="Commission" style={{ textAlign: 'right', color: s.comm > 0 ? 'var(--emerald-ink)' : 'var(--fg-muted)' }}>{H.inr(s.comm)}</td>
            </tr>
          ))}</tbody>
          <tfoot><tr><td colSpan="3" style={{ padding: '12px 16px', fontWeight: 600 }}>Total commission (MTD)</td>
            <td className="crm-amt" data-label="Total commission" style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--emerald-ink)', fontWeight: 700 }}>{H.inr(d.comm)}</td></tr></tfoot>
        </table>
        <div className="crm-muted" style={{ fontSize: 12.5, padding: '10px 16px 0' }}>Only confirmed, paid orders count. Log every payment so your sales are counted here.</div>
      </div>

      <div className="crm-card">
        <SecHead title="All orders" meta="Full order history" />
        <table className="crm-table">
          <thead><tr><th>{TH("Order")}</th><th>{TH("Customer")}</th><th>{TH("Date")}</th><th>{TH("Status")}</th><th style={{ textAlign: 'right' }}>{TH("Value")}</th></tr></thead>
          <tbody>{d.myOrders.map((o) => {const c = H.cust(o.cust);return (
                <tr key={o.id}><td className="crm-id" data-label="Order">{o.id}</td><td data-label="Customer">{c.name}</td><td className="crm-muted" data-label="Date" style={{ fontSize: 12 }}>{o.date}</td><td data-label="Status"><Pill s={o.status} label={statusLabel(o.status)} /></td>
            <td className="crm-amt" data-label="Value" style={{ textAlign: 'right' }}>{H.inr(o.value)}</td></tr>);})}</tbody>
          <tfoot><tr><td colSpan="4" style={{ padding: '12px 16px', fontWeight: 600 }}>Total sales</td>
            <td className="crm-amt" data-label="Total value" style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 700 }}>{H.inr(d.sales)}</td></tr></tfoot>
        </table>
      </div>

      <PageHead title="Dispatch & courier slips" sub="Your customers' shipments only" />
      <div className="crm-card">
        <table className="crm-table">
          <thead><tr><th>{TH("Order")}</th><th>{TH("Customer")}</th><th>{TH("Status")}</th><th>{TH("Courier / Tracking")}</th><th>{TH("Slip")}</th></tr></thead>
          <tbody>{dispatched.map((o) => {const c = H.cust(o.cust);return (
                <tr key={o.id}><td className="crm-id" data-label="Order">{o.id}</td><td data-label="Customer">{c.name}</td><td data-label="Status"><Pill s={o.status} label={statusLabel(o.status)} /></td>
            <td className="crm-muted" data-label="Courier / Tracking" style={{ fontSize: 12 }}>{o.courier || '—'} {o.track || ''}</td>
            <td data-label="Slip">{o.slip ? <img src={o.slip} alt="courier slip" style={{ height: 38, borderRadius: 4, border: '1px solid var(--border)' }} /> : <span className="crm-muted" style={{ fontSize: 12 }}>No image</span>}</td></tr>);})}
            {dispatched.length === 0 && <tr><td colSpan="5" className="crm-muted" style={{ padding: '14px 16px' }}>No dispatched orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>);

}

/* ===================== SHELL ===================== */
function FranchiseRequests({ st }) {
  const [list, setList] = useState(window.CRM_FRANCHISE || []);
  const setStatus = (id, status) => setList((L) => L.map((r) => r.id === id ? { ...r, status } : r));
  return (
    <div className="crm-body">
      <PageHead title="Franchise Requests" sub={`${list.filter((r) => r.status === 'new').length} new · from the app "Join Franchise" form`} />
      <div className="crm-card">
        <table className="crm-table" style={{ minWidth: 840 }}>
          <thead><tr><th>{TH("Ref")}</th><th>{TH("Name")}</th><th>{TH("Firm")}</th><th>{TH("City")}</th><th>{TH("Mobile")}</th><th>{TH("Investment")}</th><th>{TH("Experience")}</th><th>{TH("Date")}</th><th>{TH("Status")}</th></tr></thead>
          <tbody>{list.map((r) =>
            <tr key={r.id}><td className="crm-id">{r.id}</td><td>{r.name}</td><td className="crm-muted">{r.firm}</td><td className="crm-muted">{r.city}</td>
            <td className="crm-muted" style={{ fontSize: 12 }}>{r.mobile}</td><td className="crm-muted">{r.invest}</td><td className="crm-muted" style={{ fontSize: 12 }}>{r.exp}</td>
            <td className="crm-muted" style={{ fontSize: 12 }}>{r.date}</td>
            <td>
              <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} className={'crm-status-sel ' + (r.status === 'new' ? 'is-new' : 'is-contacted')}>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
              </select>
            </td></tr>
            )}</tbody>
        </table>
      </div>
    </div>);

}

// ===== Field visit tracking (check-in / check-out with live location) =====
function captureGeo(fallbackCity) {
  return new Promise((resolve) => {
    const fb = () => {const c = H.cityCoord && H.cityCoord(fallbackCity) || { lat: 19.0760, lng: 72.8777 };
      resolve({ lat: +(c.lat + (Math.random() - 0.5) * 0.004).toFixed(5), lng: +(c.lng + (Math.random() - 0.5) * 0.004).toFixed(5), acc: 0, source: 'approx' });};
    if (!navigator.geolocation) {fb();return;}
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5), acc: Math.round(p.coords.accuracy || 0), source: 'gps' }),
      () => fb(), { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 });
  });
}
function useTick(active, ms) {
  const [, setT] = useState(0);
  React.useEffect(() => {if (!active) return;const h = setInterval(() => setT((x) => x + 1), ms);return () => clearInterval(h);}, [active, ms]);
}
function visitDur(ms) {if (ms < 0) ms = 0;const m = Math.floor(ms / 60000);const h = Math.floor(m / 60);const mm = m % 60;return h > 0 ? `${h}h ${mm}m` : `${mm}m`;}
function visitDurLive(ms) {if (ms < 0) ms = 0;const s = Math.floor(ms / 1000);const h = Math.floor(s / 3600);const m = Math.floor(s % 3600 / 60);const ss = s % 60;const p = (n) => String(n).padStart(2, '0');return h > 0 ? `${h}:${p(m)}:${p(ss)}` : `${m}:${p(ss)}`;}
const visitTime = (iso) => iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
const visitMap = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;
// A visit with no check-out whose day has ended (past 23:59) is "failed"
const visitFailed = (v) => !v.checkOut && (() => {const d = new Date(v.day + 'T23:59:59');return Date.now() > d.getTime();})();

function RepVisits({ st, repId }) {
  const visits = st.visits || [];
  const open = visits.find((v) => v.rep === repId && !v.checkOut);
  useTick(!!open, 1000);
  const myCust = (st.customers || []).filter((c) => c.rep === repId && c.active !== false);
  const [selCust, setSelCust] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingOtp, setPendingOtp] = useState(null); // { otp, geo }
  const [otpInput, setOtpInput] = useState('');
  const [otpErr, setOtpErr] = useState(false);
  const today = '2026-06-16';
  const todays = visits.filter((v) => v.rep === repId && v.day === today).sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));
  const doCheckIn = async () => {
    const cid = selCust || myCust[0] && myCust[0].id;if (!cid) {alert('No customer to check into.');return;}
    setBusy(true);const cu = H.cust(cid);const geo = await captureGeo(cu.city);setBusy(false);
    st.checkInVisit(repId, cid, geo);setSelCust('');
  };
  const doRequestCheckout = async () => {
    const cu = H.cust(open.custId);setBusy(true);const geo = await captureGeo(cu.city);setBusy(false);
    const otp = String(Math.floor(1000 + Math.random() * 9000)); // 4-digit OTP
    setPendingOtp({ otp, geo });
    setOtpInput('');setOtpErr(false);
  };
  const doConfirmCheckout = () => {
    if (otpInput.trim() !== pendingOtp.otp) {setOtpErr(true);return;}
    st.checkOutVisit(open.id, pendingOtp.geo);
    setPendingOtp(null);setOtpInput('');setOtpErr(false);
  };
  const doCancelOtp = () => {setPendingOtp(null);setOtpInput('');setOtpErr(false);};
  return (
    <div className="crm-card" style={{ marginTop: 20, padding: '16px 18px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--fg-meta)', marginBottom: 12 }}>Customer visits · check in on arrival</div>
      {open ? (() => {const cu = H.cust(open.custId);const elapsed = Date.now() - new Date(open.checkIn).getTime();return (
          <React.Fragment>
          {pendingOtp ?
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#EAF5EE', border: '1px solid #B8D4C6', borderRadius: 'var(--r-md)', padding: '12px 16px' }}>
              <div style={{ fontWeight: 700, color: 'var(--emerald-ink)', fontSize: 13, marginBottom: 4 }}>OTP sent to customer</div>
              <div className="crm-muted" style={{ fontSize: 12.5 }}>An OTP has been sent to <strong>{H.cust(open.custId).mobile || 'customer\'s number'}</strong>. Ask the customer for the code and enter it below to complete check-out.</div>
              {/* Demo only — in production OTP is sent via SMS */}
              <div style={{ marginTop: 8, padding: '8px 12px', background: '#FFF9E6', border: '1px dashed #E2B43A', borderRadius: 6, fontSize: 12, color: '#8B6A00' }}>
                <strong>Demo mode:</strong> OTP is <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15 }}>{pendingOtp.otp}</span> (in production this goes via SMS only)
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                  type="text" inputMode="numeric" maxLength={4}
                  placeholder="Enter 4-digit OTP"
                  value={otpInput} onChange={(e) => {setOtpInput(e.target.value.replace(/\D/g, ''));setOtpErr(false);}}
                  style={{ width: 140, padding: '9px 14px', fontSize: 18, fontFamily: 'monospace', fontWeight: 700, border: `2px solid ${otpErr ? 'var(--ruby)' : 'var(--border)'}`, borderRadius: 'var(--r-md)', textAlign: 'center', letterSpacing: '0.2em' }} />
              <button className="cbtn cbtn-accent" disabled={otpInput.length < 4} onClick={doConfirmCheckout}>Confirm check-out</button>
              <button className="cbtn cbtn-ghost" onClick={doCancelOtp}>Cancel</button>
            </div>
            {otpErr && <div style={{ color: 'var(--ruby)', fontSize: 13, fontWeight: 600 }}>❌ Incorrect OTP — ask the customer to check their SMS and try again.</div>}
          </div> :

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--emerald-soft)', border: '1px solid #B8D4C6' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 700, color: 'var(--emerald-ink)', fontSize: 14 }}>● Currently visiting {cu.name}</div>
              <div className="crm-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Checked in {visitTime(open.checkIn)} · {cu.city} · location captured ({open.inSource === 'gps' ? `GPS ±${open.inAcc}m` : 'approx.'})</div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 22, color: 'var(--emerald-ink)' }}>{visitDurLive(elapsed)}</div>
            <button className="cbtn cbtn-primary" disabled={busy} onClick={doRequestCheckout}>{busy ? 'Capturing…' : 'Request check-out'}</button>
          </div>}
        </React.Fragment>);})() :
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select className="disc-input" style={{ minWidth: 220, textAlign: 'left' }} value={selCust} onChange={(e) => setSelCust(e.target.value)}>
            <option value="">Select customer to visit…</option>
            {myCust.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.city}</option>)}
          </select>
          <button className="cbtn cbtn-accent" disabled={busy || myCust.length === 0} onClick={doCheckIn}>{busy ? 'Capturing location…' : '📍 Check in here'}</button>
          <span className="crm-muted" style={{ fontSize: 12 }}>Your location is recorded at check-in &amp; check-out.</span>
        </div>
      }
      {todays.length > 0 &&
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-meta)', marginBottom: 6 }}>Today’s visits</div>
        {todays.map((v) => {const cu = H.cust(v.custId);const dur = v.checkOut ? new Date(v.checkOut) - new Date(v.checkIn) : 0;return (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid var(--divider)', fontSize: 13 }}>
            <div style={{ flex: 1 }}><strong>{cu.name}</strong> <span className="crm-muted">· {cu.city}</span>
              <div className="crm-muted" style={{ fontSize: 12 }}>{visitTime(v.checkIn)} → {v.checkOut ? visitTime(v.checkOut) : visitFailed(v) ? <span style={{ color: 'var(--ruby)', fontWeight: 600 }}>Check out failed</span> : <span style={{ color: 'var(--emerald-ink)', fontWeight: 600 }}>in progress</span>}</div>
            </div>
            {v.checkOut && <span className="crm-amt">{visitDur(dur)}</span>}
            <a className="cbtn cbtn-ghost cbtn-sm" href={visitMap(v.inLat, v.inLng)} target="_blank">Map</a>
          </div>);})}
      </div>}
    </div>);

}

function AdminVisits({ st }) {
  const visits = st.visits || [];
  const anyOpen = visits.some((v) => !v.checkOut);
  useTick(anyOpen, 1000);
  const days = [...new Set(visits.map((v) => v.day))].sort().reverse();
  const [day, setDay] = useState(days[0] || '2026-06-16');
  const [repF, setRepF] = useState('');
  const reps = st.reps || [];
  const shown = visits.filter((v) => v.day === day && (!repF || v.rep === repF)).sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));
  const summary = reps.map((r) => {const vs = visits.filter((v) => v.rep === r.id && v.day === day);
    const total = vs.reduce((s, v) => s + ((v.checkOut ? new Date(v.checkOut) : new Date()) - new Date(v.checkIn)), 0);
    const live = vs.some((v) => !v.checkOut);
    return { rep: r, count: vs.length, total, live };}).filter((x) => x.count > 0);
  return (
    <div className="crm-body">
      <PageHead title="Field Visits" sub="Where each rep went, when, and how long they met the customer — live location at check-in / check-out" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="disc-input" style={{ width: 170, textAlign: 'left' }} value={day} onChange={(e) => setDay(e.target.value)}>
          {days.map((d) => <option key={d} value={d}>{new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</option>)}
        </select>
        <select className="disc-input" style={{ width: 170, textAlign: 'left' }} value={repF} onChange={(e) => setRepF(e.target.value)}>
          <option value="">All reps</option>
          {reps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        {anyOpen && <span style={{ marginLeft: 'auto', color: 'var(--emerald-ink)', fontWeight: 700, fontSize: 13 }}>● {visits.filter((v) => !v.checkOut).length} rep in field now</span>}
      </div>
      {summary.length > 0 &&
      <div className="kpi-grid" style={{ marginBottom: 18 }}>
        {summary.map((s) =>
        <div key={s.rep.id} className="kpi">
            <div className="kpi-label">{s.rep.name}{s.live && <span style={{ color: 'var(--emerald-ink)', marginLeft: 6 }}>● live</span>}</div>
            <div className="kpi-value">{s.count}</div>
            <div className="kpi-sub">{visitDur(s.total)} in field · {s.count} visit{s.count > 1 ? 's' : ''}</div>
          </div>
        )}
      </div>}
      <div className="crm-card">
        <table className="crm-table">
          <thead><tr><th>{TH("Rep")}</th><th>{TH("Customer")}</th><th>{TH("City")}</th><th>{TH("Check-in")}</th><th>{TH("Check-out")}</th><th>{TH("Duration")}</th><th>{TH("Location")}</th></tr></thead>
          <tbody>
            {shown.map((v) => {const cu = H.cust(v.custId);const rep = H.rep(v.rep);
              const dur = (v.checkOut ? new Date(v.checkOut) : new Date()) - new Date(v.checkIn);return (
                <tr key={v.id}>
                <td>{rep.name}</td>
                <td>{cu.name}<div className="crm-muted" style={{ fontSize: 12 }}>{cu.mobile || ''}</div></td>
                <td className="crm-muted">{cu.city}</td>
                <td>{visitTime(v.checkIn)}</td>
                <td>{v.checkOut ? visitTime(v.checkOut) : visitFailed(v) ? <Pill s="danger" label="⚠️ Check out failed" /> : <Pill s="confirmed" label="● In progress" />}</td>
                <td className="crm-amt">{v.checkOut ? visitDur(dur) : visitFailed(v) ? <span style={{ color: 'var(--ruby)' }}>—</span> : visitDurLive(dur)}</td>
                <td><a className="cbtn cbtn-ghost cbtn-sm" href={visitMap(v.inLat, v.inLng)} target="_blank">📍 {v.inSource === 'gps' ? `GPS ±${v.inAcc}m` : 'View map'}</a></td>
              </tr>);})}
            {shown.length === 0 && <tr><td colSpan="7" className="crm-muted" style={{ padding: '14px 16px' }}>No visits recorded for this day.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>);

}

const NAV = {
  // k = i18n key; the label is the English fallback when a translation is absent.
  admin: [
  { id: 'dashboard', label: 'Dashboard', k: 'crm_dashboard' }, { id: 'customers', label: 'Customers & Payment Terms', k: 'crm_customers' },
  { id: 'reps', label: 'Reps & commission', k: 'crm_reps' }, { id: 'pipeline', label: 'Relation-Pipeline', k: 'crm_pipeline' }, { id: 'rfq', label: 'RFQ Enquiries', k: 'crm_rfq' }, { id: 'franchise', label: 'Franchise Requests', k: 'crm_franchise' }, { id: 'reports', label: 'Reports', k: 'crm_reports' }, { id: 'attendance', label: 'Attendance', k: 'crm_attendance' }, { id: 'visits', label: 'Field Visits', k: 'crm_visits' }, { id: 'leads', label: 'Leads', k: 'crm_leads' }, { id: 'master', label: 'Customer Database', k: 'crm_custdb' }, { id: 'broadcast', label: 'Rep Broadcast', k: 'crm_broadcast' }, { id: 'carts', label: 'All carts', k: 'crm_carts' }, { id: 'payments', label: 'Payments', k: 'crm_payments' }],

  office: [
  { id: 'orders', label: 'Order desk', k: 'crm_orderdesk' }, { id: 'leads', label: 'Leads', k: 'crm_leads' }, { id: 'pipeline', label: 'Relation-Pipeline', k: 'crm_pipeline' },
  { id: 'abandoned', label: 'Abandoned carts' }, { id: 'queries', label: 'RFQ Enquiries', k: 'crm_rfq' }],

  rep: [
  { id: 'desk', label: 'My desk' }, { id: 'pipeline', label: 'Pipeline & follow-ups' }, { id: 'rfq', label: 'My RFQs' }, { id: 'customers', label: 'My customers' }, { id: 'commission', label: 'My commission' }]

};
const ROLE_TITLE = { admin: 'Administration', office: 'Back Office', rep: 'Sales Rep' };
const ROLE_TITLE_KEY = { admin: 'crm_title_admin', office: 'crm_role_office', rep: 'crm_role_rep' };
function roleTitle(role) { return CT(ROLE_TITLE_KEY[role], ROLE_TITLE[role]); }
const DEFAULT_PAGE = { admin: 'dashboard', office: 'orders', rep: 'desk' };
const REP_ID = 'REP-204';

// 7-language globe switcher (matches the Sales App).
// Admin notifications bell — new orders, RFQs, overdue payments, abandoned carts.
function CrmNotifications({ st }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {const f = (e) => {if (ref.current && !ref.current.contains(e.target)) setOpen(false);};document.addEventListener('click', f);return () => document.removeEventListener('click', f);}, []);
  const items = [];
  // New orders: cash → "payment settled", credit → "order keyed in"
  st.orders.slice(0, 3).forEach((o) => {const c = H.cust(o.cust);const credit = ['15', '30', '45', '60'].includes(String(c.terms));
    items.push({ icon: '🟢', title: 'New order ' + o.id + ' · ' + c.name,
      sub: (credit ? 'Credit order keyed in — prepare goods' : 'Payment settled — prepare goods') + ' · ' + H.inr(o.value), kind: 'order' });});
  st.queries.filter((q) => q.status === 'open').forEach((q) => {const c = H.cust(q.cust);items.push({ icon: '📩', title: 'RFQ ' + q.id + ' · ' + c.name, sub: q.product + ' · ' + q.qty, kind: 'rfq' });});
  st.carts.filter((c) => c.status === 'abandoned').forEach((c) => {const cu = H.cust(c.cust);items.push({ icon: '🛒', title: 'Abandoned cart · ' + cu.name, sub: c.items + ' items · ' + H.inr(c.value), kind: 'cart' });});
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="cbtn cbtn-ghost" onClick={() => setOpen((o) => !o)} style={{ position: 'relative', padding: '8px 11px' }} aria-label="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" /><path d="M10 21a2 2 0 0 0 4 0" /></svg>
        {items.length > 0 && <span style={{ position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999, background: 'var(--ruby)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{items.length}</span>}
      </button>
      {open &&
      <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 320, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-lg)', zIndex: 60, maxHeight: 380, overflowY: 'auto' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--divider)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: 13 }}>Notifications</strong>
          <span className="crm-muted" style={{ fontSize: 11 }}>{items.length} new</span>
        </div>
        {items.map((it, i) =>
        <div key={i} style={{ display: 'flex', gap: 10, padding: '11px 14px', borderBottom: '1px solid var(--divider)' }}>
            <span style={{ fontSize: 16 }}>{it.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{it.title}</div><div className="crm-muted" style={{ fontSize: 11.5, marginTop: 1 }}>{it.sub}</div></div>
          </div>
        )}
        {items.length === 0 && <div className="crm-muted" style={{ padding: '16px 14px', fontSize: 12.5 }}>No new notifications.</div>}
        <div className="crm-muted" style={{ padding: '10px 14px', fontSize: 10.5, borderTop: '1px solid var(--divider)' }}>New orders also trigger a WhatsApp to the staff prep line.</div>
      </div>}
    </div>);

}

function CrmLangSwitcher() {
  const LANGS = [
  { id: 'en', native: 'English', en: 'English' }, { id: 'hi', native: 'हिन्दी', en: 'Hindi' },
  { id: 'mr', native: 'मराठी', en: 'Marathi' }, { id: 'gu', native: 'ગુજરાતી', en: 'Gujarati' },
  { id: 'ta', native: 'தமிழ்', en: 'Tamil' }, { id: 'te', native: 'తెలుగు', en: 'Telugu' }, { id: 'kn', native: 'ಕನ್ನಡ', en: 'Kannada' }];

  const FONT = { en: 'var(--font-sans)', hi: "'Noto Sans Devanagari',sans-serif", mr: "'Noto Sans Devanagari',sans-serif",
    gu: "'Noto Sans Gujarati',sans-serif", ta: "'Noto Sans Tamil',sans-serif", te: "'Noto Sans Telugu',sans-serif", kn: "'Noto Sans Kannada',sans-serif" };
  const [lang, setLang] = useState(() => {try {return localStorage.getItem('eurostar-lang') || 'en';} catch (e) {return 'en';}});
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {const f = (e) => {if (ref.current && !ref.current.contains(e.target)) setOpen(false);};document.addEventListener('click', f);return () => document.removeEventListener('click', f);}, []);
  const cur = LANGS.find((l) => l.id === lang) || LANGS[0];
  // Broadcast the change so the whole console re-renders in the new language —
  // previously this only wrote to localStorage and nothing was listening.
  const pick = (id) => {setLang(id);setOpen(false);try {localStorage.setItem('eurostar-lang', id);} catch (e) {}
    try { window.dispatchEvent(new Event('eurostar-lang')); } catch (e) {}};
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="cbtn cbtn-ghost" onClick={() => setOpen((o) => !o)} style={{ gap: 7 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" /></svg>
        <span style={{ fontFamily: FONT[cur.id] }}>{cur.native}</span>
      </button>
      {open &&
      <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 210, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-lg)', zIndex: 60, padding: 5 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--fg-meta)', padding: '8px 10px 6px' }}>Choose language</div>
        {LANGS.map((l) =>
        <button key={l.id} onClick={() => pick(l.id)} style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '9px 11px', border: 'none', background: l.id === lang ? 'var(--emerald-soft)' : 'transparent', borderRadius: 'var(--r-sm)', cursor: 'pointer', color: l.id === lang ? 'var(--emerald-ink)' : 'var(--fg)' }}>
            <span><span style={{ fontSize: 15, fontWeight: 600, fontFamily: FONT[l.id] }}>{l.native}</span> <span style={{ fontSize: 11, color: 'var(--fg-meta)' }}>{l.en}</span></span>
            {l.id === lang && <span>✓</span>}
          </button>
        )}
        <div style={{ fontSize: 10.5, color: 'var(--fg-meta)', padding: '8px 11px 4px', borderTop: '1px solid var(--divider)', marginTop: 4 }}>Full translation rolling out · preview</div>
      </div>}
    </div>);

}

// Build editable line items for a cart/order (mock data only stores a count + value).
const SAMPLE_PRODUCTS = ['Moissanite DEF Round', 'Color CZ Oval', 'Lab Sapphire Cushion', 'MOP White Square', 'Pearl String', 'Alpanite Green Pear', 'Hotfix Crystal Round', 'Cabochon Red Oval'];
const SAMPLE_SIZES = ['2.00 mm', '3.00 mm', '4.00 mm', '5.00 mm', '6×4 mm', '7×5 mm', '8.00 mm'];
function buildLines(entity) {
  if (entity.lines) return entity.lines;
  const n = Math.max(1, entity.items || 1);
  const per = Math.round((entity.value || 0) / n) || 100;
  const lines = [];
  for (let i = 0; i < n; i++) {
    const qty = [10, 20, 50, 100][i % 4];
    lines.push({ name: SAMPLE_PRODUCTS[i % SAMPLE_PRODUCTS.length], size: SAMPLE_SIZES[i % SAMPLE_SIZES.length], qty, rate: Math.max(1, Math.round(per / qty)) });
  }
  return lines;
}

function CartEditor({ kind, entity, onSave, onClose }) {
  const cu = H.cust(entity.cust);
  const [lines, setLines] = useState(() => buildLines(entity).map((l) => ({ ...l })));
  const setL = (i, k, v) => setLines((ls) => ls.map((l, j) => j === i ? { ...l, [k]: k === 'name' || k === 'size' ? v : Math.max(0, parseInt(v, 10) || 0) } : l));
  const removeL = (i) => setLines((ls) => ls.filter((_, j) => j !== i));
  const addL = () => setLines((ls) => [...ls, { name: SAMPLE_PRODUCTS[0], size: SAMPLE_SIZES[0], qty: 10, rate: 100 }]);
  const total = lines.reduce((a, l) => a + l.qty * l.rate * (1 - (l.disc || 0) / 100), 0);
  const gross = lines.reduce((a, l) => a + l.qty * l.rate, 0);
  const totalPcs = lines.reduce((a, l) => a + l.qty, 0);
  const save = () => {onSave({ lines, items: lines.length, value: Math.round(total) });onClose();};
  return (
    <div onClick={onClose} className="crm-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(21,19,15,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="crm-modal" style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', width: 'min(720px,96vw)', maxHeight: '90vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div><div style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 20 }}>Edit {kind === 'order' ? 'order' : 'cart'} · {entity.id}</div>
            <div className="crm-muted" style={{ fontSize: 12.5 }}>{cu.name} · {cu.city} · {cu.mobile}</div></div>
          <button className="cbtn cbtn-ghost cbtn-sm" onClick={onClose}>✕ Close</button>
        </div>
        <div style={{ padding: '14px 22px' }}>
          <table className="crm-table" style={{ minWidth: 560 }}>
            <thead><tr><th>{TH("Product")}</th><th>{TH("Size")}</th><th style={{ width: 70 }}>{TH("Qty")}</th><th style={{ width: 80 }}>{TH("Rate ₹")}</th><th style={{ width: 70 }}>{TH("Disc %")}</th><th style={{ textAlign: 'right' }}>{TH("Amount")}</th><th></th></tr></thead>
            <tbody>{lines.map((l, i) => {const amt = l.qty * l.rate * (1 - (l.disc || 0) / 100);return (
                  <tr key={i}>
                <td data-label="Product"><input className="disc-input" style={{ width: '100%', minWidth: 150, textAlign: 'left' }} value={l.name} onChange={(e) => setL(i, 'name', e.target.value)} /></td>
                <td data-label="Size"><input className="disc-input" style={{ width: 84, textAlign: 'left' }} value={l.size} onChange={(e) => setL(i, 'size', e.target.value)} /></td>
                <td data-label="Qty (pcs)"><input className="disc-input" style={{ width: 58 }} type="number" min="0" value={l.qty} onChange={(e) => setL(i, 'qty', e.target.value)} /></td>
                <td data-label="Rate ₹"><input className="disc-input" style={{ width: 68 }} type="number" min="0" value={l.rate} onChange={(e) => setL(i, 'rate', e.target.value)} /></td>
                <td data-label="Discount %"><input className="disc-input" style={{ width: 64 }} type="number" inputMode="numeric" min="0" max="100" step="1" value={l.disc || ''} placeholder="0%" onChange={(e) => setL(i, 'disc', e.target.value)} /></td>
                <td className="crm-amt" data-label="Amount" style={{ textAlign: 'right' }}>{H.inr(Math.round(amt))}{l.disc > 0 && <div className="crm-muted" style={{ fontSize: 10, textDecoration: 'line-through' }}>{H.inr(l.qty * l.rate)}</div>}</td>
                <td style={{ textAlign: 'right' }}><button className="cbtn cbtn-ghost cbtn-sm" style={{ color: 'var(--ruby)' }} onClick={() => removeL(i)}>Remove</button></td>
              </tr>);})}</tbody>
          </table>
          <button className="cbtn cbtn-ghost cbtn-sm" style={{ marginTop: 10 }} onClick={addL}>＋ Add line</button>
        </div>
        <div style={{ padding: '16px 22px', borderTop: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="crm-muted" style={{ fontSize: 13 }}>{lines.length} lines · {totalPcs.toLocaleString('en-IN')} pcs · {gross > total && <span style={{ textDecoration: 'line-through', marginRight: 6 }}>{H.inr(Math.round(gross))}</span>}<strong style={{ color: 'var(--fg)' }}>{H.inr(Math.round(total))}</strong>{gross > total && <span style={{ color: 'var(--emerald-ink)', marginLeft: 6, fontWeight: 600 }}>− {H.inr(Math.round(gross - total))} off</span>}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="cbtn cbtn-ghost cbtn-sm" onClick={onClose}>Cancel</button>
            <button className="cbtn cbtn-accent cbtn-sm" onClick={save}>Save changes</button>
          </div>
        </div>
      </div>
    </div>);

}

function CRM() {
  // Re-render the console whenever the language picker fires.
  const [, setLangTick] = React.useState(0);
  React.useEffect(() => {
    const f = () => setLangTick((n) => n + 1);
    window.addEventListener('eurostar-lang', f);
    return () => window.removeEventListener('eurostar-lang', f);
  }, []);
  const CRM_INIT_ROLE = (() => { try { const r = new URLSearchParams(location.search).get('role'); return ['admin', 'office', 'rep'].includes(r) ? r : 'admin'; } catch (e) { return 'admin'; } })();
  const [role, setRole] = useState(CRM_INIT_ROLE);
  const [page, setPage] = useState(DEFAULT_PAGE[CRM_INIT_ROLE]);
  const [editTarget, setEditTarget] = useState(null);
  const [addCustOpen, setAddCustOpen] = useState(false);
  const [checkin, setCheckin] = useState({});
  const [leads, setLeads] = useState((window.CRM_LEADS || []).map((l) => ({ ...l })));
  const [leaders, setLeaders] = useState((window.CRM_LEADERS || []).map((l) => ({ ...l })));
  // Dashboard headline metrics, computed server-side from real orders/carts.
  const [summary, setSummary] = useState(() => ({ ...(window.CRM_SUMMARY || {}) }));
  // True when the CRM could not load data because the session is dead. Without
  // this every widget renders 0/empty, which reads as "no data" when it really
  // means "not signed in" — exactly how a confirmed order looked like it
  // vanished from Orders.
  const [authDead, setAuthDead] = useState(false);

  // shared state across all screens
  const [customers, setCustomers] = useState(CRM_CUSTOMERS.map((c) => ({ ...c, active: c.active !== false, terms: c.terms || 'cash' })));
  const [orders, setOrders] = useState(CRM_ORDERS.map((o) => ({ ...o })));
  const [carts, setCarts] = useState(CRM_CARTS.map((c) => ({ ...c })));
  const [queries, setQueries] = useState(CRM_QUERIES.map((q) => ({ ...q })));
  const [repRates, setRepRates] = useState(() => {const m = {};CRM_REPS.forEach((r) => m[r.id] = r.rate);return m;});
  const [repBlocked, setRepBlocked] = useState({});
  const [importSummary, setImportSummary] = useState(null);
  const [reps, setReps] = useState(CRM_REPS.map((r) => ({ ...r })));
  const [repTargets, setRepTargets] = useState(() => {const m = {};CRM_REPS.forEach((r) => m[r.id] = Math.max(50, r.target || 0));return m;});
  const [newAdds, setNewAdds] = useState(() => {const m = {};CRM_REPS.forEach((r) => m[r.id] = r.addedThisMonth || 0);return m;});
  const [payments, setPayments] = useState(() => {
    // CRM_SAMPLE_PAYMENTS is hydrated with the live /payments (or the seed as a
    // fallback) by crm-data.jsx, so it is already the source of truth.
    return (window.CRM_SAMPLE_PAYMENTS || []).map((p) => ({ ...p }));
  });
  const [visits, setVisits] = useState((window.CRM_VISITS || []).map((v) => ({ ...v })));

  // Sign out: revoke the refresh token server-side (so it cannot be reused),
  // clear the local session, then reload — the login gate takes over.
  const signOut = () => {
    if (!confirm('Sign out of the CRM?')) return;
    const API = window.EUROSTAR_API || location.origin;
    let rt = '';
    try { rt = localStorage.getItem('eurostar-admin-refresh') || ''; } catch (e) {}
    const done = () => {
      try {
        localStorage.removeItem('eurostar-admin-token');
        localStorage.removeItem('eurostar-admin-refresh');
        sessionStorage.clear();
      } catch (e) {}
      location.reload();
    };
    if (!rt) return done();
    fetch(API + '/auth/logout', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    }).catch(() => {}).then(done);
  };

  // Persist a staff action to the server (fire-and-forget; local state already
  // updated optimistically). Without this, verifying a payment or confirming an
  // order only changed the screen and reverted on the next reload.
  const crmApi = (method, path, body) => {
    try {
      const API = window.EUROSTAR_API || location.origin;
      const tok = localStorage.getItem('eurostar-admin-token') || '';
      const opts = { method, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + tok } };
      if (body !== undefined && body !== null) opts.body = JSON.stringify(body);
      fetch(API + path, opts).catch(() => {});
    } catch (e) {}
  };

  // Load orders straight from the database on mount, independent of the
  // localStorage/bridge hydration. This guarantees the dashboard, Recent Orders
  // and Orders screen show real orders whenever the API is reachable — the seed
  // arrays are only ever a first-paint/offline fallback, never what persists.
  React.useEffect(() => {
    const API = window.EUROSTAR_API || location.origin;
    const getTok = () => { try { return localStorage.getItem('eurostar-admin-token') || ''; } catch (e) { return ''; } };
    const dateOnly = (x) => { if (!x) return ''; const d = typeof x === 'number' ? new Date(x) : new Date(String(x)); return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10); };

    // Mint a fresh access token from the stored refresh token. Without this, a
    // tab opened after the access token expired (e.g. next morning) had every
    // direct fetch 401 silently and the screens sat on the seed fallback.
    let refreshing = null;
    const refreshTok = () => {
      if (refreshing) return refreshing;
      let rt = '';
      try { rt = localStorage.getItem('eurostar-admin-refresh') || ''; } catch (e) {}
      if (!rt) return Promise.resolve(false);
      refreshing = fetch(API + '/auth/refresh', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          refreshing = null;
          if (d && d.accessToken) { try { localStorage.setItem('eurostar-admin-token', d.accessToken); } catch (e) {} return true; }
          return false;
        })
        .catch(() => { refreshing = null; return false; });
      return refreshing;
    };
    const authedGet = (path, retry) => {
      const tok = getTok();
      if (!tok) { setAuthDead(true); return Promise.resolve(null); }
      return fetch(API + path, { headers: { authorization: 'Bearer ' + tok } })
        .then((r) => {
          if (r.status === 401 || r.status === 403) {
            if (retry !== false) {
              return refreshTok().then((ok2) => {
                if (ok2) return authedGet(path, false);
                setAuthDead(true); // refresh failed — the session is genuinely dead
                return null;
              });
            }
            setAuthDead(true);
            return null;
          }
          if (r.ok) { setAuthDead(false); return r.json(); }
          return null;
        })
        .catch(() => null);
    };

    const loadAll = () => {
      authedGet('/orders').then((rows) => {
        if (!Array.isArray(rows) || !rows.length) return; // keep fallback if empty/unreachable
        const mapped = rows.map((o) => ({
          id: o.id, cust: o.code || o.customerId || '', date: dateOnly(o.ts || o.createdAt),
          // Keep the business name and city the API already returns. Without
          // these the CRM could only show the raw customer code.
          custName: o.customer || o.customerName || '', custCity: o.city || '',
          repName: o.rep || o.repName || '',
          status: o.status === 'pending' ? 'new' : (o.status || 'new'),
          value: o.grand || o.value || 0, items: Array.isArray(o.items) ? o.items.length : 0,
          courier: o.courier || '', track: o.track || '', discount: 0,
        }));
        setOrders(mapped);
        // Some dashboard cards (Total sales, Sales-by-rep) read the CRM_ORDERS
        // global directly, so replace its contents in place too.
        try { if (Array.isArray(window.CRM_ORDERS)) { window.CRM_ORDERS.length = 0; mapped.forEach((o) => window.CRM_ORDERS.push(o)); } } catch (e) {}
      });
      // Dashboard headline metrics — every card computed from the database.
      authedGet('/reports/summary').then((s) => {
        if (!s || typeof s !== 'object') return;
        setSummary(s);
        try { if (window.CRM_SUMMARY) Object.assign(window.CRM_SUMMARY, s); } catch (e) {}
      });
      // Customers + carts, straight from the DB, so their counts/tables are live.
      authedGet('/customers').then((rows) => {
        if (!Array.isArray(rows) || !rows.length) return;
        setCustomers(rows.map((c) => ({ id: c.code || c.id, name: c.name, city: c.city || '', gst: c.gstin || '', mobile: c.phone || '', rep: c.rep || '', terms: c.terms || 'cash', tier: '', since: '', credit: 0, cartViewsNoOrder: 0, active: true })));
      });
      authedGet('/carts').then((rows) => {
        if (!Array.isArray(rows)) return;
        setCarts(rows.map((c) => ({ id: c.id, cust: c.customerId || '', updated: dateOnly(c.updatedAt), status: c.status || 'active', value: (c.totals && c.totals.grand) || 0, items: Array.isArray(c.lines) ? c.lines.length : 0, age: '', note: '' })));
      });
      // Payment log — straight from the Payments table. 'failed' is the API term
      // for the CRM's 'rejected' tab.
      authedGet('/payments').then((rows) => {
        if (!Array.isArray(rows) || !rows.length) return;
        setPayments(rows.map((p) => (p.status === 'failed' ? { ...p, status: 'rejected' } : p)));
      });
    };

    loadAll();
    // Keep the CRM in sync while it sits open: a customer order placed in the
    // Sales App shows up here within half a minute, no manual reload.
    const timer = setInterval(loadAll, 30000);
    return () => clearInterval(timer);
  }, []);

  const st = {
    customers, orders, carts, queries, repRates, repTargets, newAdds, reps, leaders, payments, visits, summary,
    setTerms: (id, v) => setCustomers((cs) => cs.map((c) => c.id === id ? { ...c, terms: v } : c)),
    toggleSuspend: (id) => setCustomers((cs) => cs.map((c) => c.id === id ? { ...c, active: !c.active } : c)),
    setRate: (id, v) => setRepRates((m) => ({ ...m, [id]: Math.max(0, parseFloat(v) || 0) / 100 })),
    setTarget: (id, v) => setRepTargets((m) => ({ ...m, [id]: Math.max(50, parseInt(v, 10) || 50) })),
    addCustomer: (rep, c) => {setCustomers((cs) => [{ ...c, id: 'EUR-' + (10800 + cs.length), rep, active: true, terms: 'cash', since: '06/2026', credit: 100000 }, ...cs]);if (rep) setNewAdds((m) => ({ ...m, [rep]: (m[rep] || 0) + 1 }));},
    addRep: (f) => {const id = 'REP-' + (300 + reps.length);setReps((rs) => [...rs, { id, name: f.name, region: f.region || '—', phone: f.phone || '', rate: (parseFloat(f.rate) || 4) / 100, target: 50 }]);
      setRepRates((m) => ({ ...m, [id]: (parseFloat(f.rate) || 4) / 100 }));setRepTargets((m) => ({ ...m, [id]: 50 }));setNewAdds((m) => ({ ...m, [id]: 0 }));},
    claimCustomer: (id, rep) => {setCustomers((cs) => cs.map((c) => c.id === id ? { ...c, rep } : c));setNewAdds((m) => ({ ...m, [rep]: (m[rep] || 0) + 1 }));},
    advance: (id) => {
      const o = (orders || []).find((x) => x.id === id);
      if (!o) return;
      const i = FLOW.indexOf(o.status);
      if (i < 0 || i >= FLOW.length - 1) return;
      const next = FLOW[i + 1];
      setOrders((os) => os.map((x) => x.id === id ? { ...x, status: next } : x));
      // FLOW 'new' maps to the API's 'pending'; every later step matches the API.
      crmApi('PUT', '/orders/' + id, { status: next === 'new' ? 'pending' : next });
    },
    setDisc: (id, v) => setCarts((cs) => cs.map((c) => c.id === id ? { ...c, appliedDisc: Math.max(0, Math.min(100, parseInt(v, 10) || 0)) } : c)),
    editItems: (id) => setEditTarget({ kind: 'cart', id }),
    removeCart: (id) => {if (confirm('Remove this cart? This cannot be undone.')) setCarts((cs) => cs.filter((c) => c.id !== id));},
    editOrder: (id) => setEditTarget({ kind: 'order', id }),
    removeOrder: (id) => {if (confirm('Remove this completed order? This cannot be undone.')) setOrders((os) => os.filter((o) => o.id !== id));},
    answer: (id) => { setQueries((qs) => qs.map((q) => q.id === id ? { ...q, status: 'answered' } : q)); crmApi('PUT', '/rfq/' + id, { status: 'answered' }); },
    assignRfq: (id, rep) => { setQueries((qs) => qs.map((q) => q.id === id ? { ...q, assignedRep: rep } : q)); crmApi('PUT', '/rfq/' + id, { assignedRep: rep }); },
    autoAssignRfq: () => setQueries((qs) => qs.map((q) => {const cu = H.cust(q.cust);const byCity = (window.CRM_CITY_REP || {})[q.city || cu.city];if (byCity) crmApi('PUT', '/rfq/' + q.id, { assignedRep: byCity });return byCity ? { ...q, assignedRep: byCity } : q;})),
    checkin,
    doCheckin: (id, photo) => setCheckin((m) => ({ ...m, [id]: { photo, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) } })),
    leads,
    importSummary,
    setStage: (id, stage) => { setLeads((ls) => ls.map((l) => l.id === id ? { ...l, stage } : l)); crmApi('PUT', '/leads/' + id, { stage }); },
    setFollowUp: (id, followUp) => { setLeads((ls) => ls.map((l) => l.id === id ? { ...l, followUp } : l)); crmApi('PUT', '/leads/' + id, { followUp }); },
    addLead: (f) => {const flagMatch = masterMatch(f.gst, f.name, f.city, f.mobile);
      const newId = 'LD-' + Date.now();
      if (flagMatch) {const lead = { id: newId, name: f.name, city: f.city, mobile: f.mobile, gst: f.gst || '', rep: '', stage: 1, followUp: '2026-06-18', assigned: false, note: f.note || '', flagged: true, flagName: flagMatch.name, flagBy: flagMatch._by };
        setLeads((ls) => [lead, ...ls]); crmApi('POST', '/leads', lead);
        alert('⚠ This lead matches your existing customer “' + flagMatch.name + '” (by ' + flagMatch._by + '). It has been held in the Flagged queue (Customer Master) for your approval — it was NOT assigned to a rep.');return;}
      const rep = f.rep || (window.CRM_CITY_REP || {})[f.city] || '';const nf = '2026-06-18';
      const lead = { id: newId, name: f.name, city: f.city, mobile: f.mobile, gst: f.gst || '', rep, stage: 1, followUp: nf, assigned: !!f.rep, note: f.note || '', flagged: false, flagName: '', flagBy: '' };
      setLeads((ls) => [lead, ...ls]); crmApi('POST', '/leads', lead);},
    bulkLeads: (file, noAssign) => {const ext = (file.name.split('.').pop() || '').toLowerCase();
      const load = (rows) => {const created = [];let flaggedN = 0;const base = Date.now();rows.forEach((r, i) => {if (i === 0) return;const name = r[0],city = r[1],mobile = r[2];if (!name || !city) return;
          const gst = String(r[3] || '').trim();const fm = masterMatch(gst, name, city, mobile);
          if (fm) {flaggedN++;created.push({ id: 'LD-' + (base + i), name: String(name).trim(), city: String(city).trim(), mobile: String(mobile || '').trim(), gst, rep: '', stage: 1, followUp: '2026-06-18', assigned: false, note: String(r[6] || '').trim(), flagged: true, flagName: fm.name, flagBy: fm._by });return;}
          const repId = noAssign ? '' : (r[5] || '').trim();const rep = repId || (noAssign ? '' : (window.CRM_CITY_REP || {})[String(city).trim()] || '');
          created.push({ id: 'LD-' + (base + i), name: String(name).trim(), city: String(city).trim(), mobile: String(mobile || '').trim(), gst, rep, stage: 1, followUp: '2026-06-18', assigned: !!repId, note: String(r[6] || '').trim() });});
        if (created.length === 0) {alert('No valid rows found.');return;}
        setLeads((ls) => [...created, ...ls]);
        crmApi('POST', '/leads', created); // persist the whole batch
        const clean = created.length - flaggedN;
        setImportSummary({ total: created.length, clean, flagged: flaggedN, ts: Date.now() });
        alert(clean + ' lead(s) imported' + (flaggedN ? ' · ⚠ ' + flaggedN + ' flagged as existing customers (held for your approval in Customer Master → Flagged queue)' : ' and forwarded by city.'));};
      const reader = new FileReader();
      if (ext === 'csv') {reader.onload = () => {const rows = reader.result.split(/\r?\n/).map((ln) => ln.split(','));load(rows);};reader.readAsText(file);} else
      {if (!window.XLSX) {const s = document.createElement('script');s.src = 'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js';s.onload = () => readX();document.head.appendChild(s);} else readX();
        function readX() {reader.onload = () => {const wb = window.XLSX.read(new Uint8Array(reader.result), { type: 'array' });const sh = wb.Sheets[wb.SheetNames[wb.SheetNames.length - 1]];const rows = window.XLSX.utils.sheet_to_json(sh, { header: 1 });load(rows);};reader.readAsArrayBuffer(file);}}},
    autoForwardLeads: () => setLeads((ls) => ls.map((l) => {
      if (l.rep || l.flagged) return l;
      const rep = (window.CRM_CITY_REP || {})[l.city] || '';
      if (rep) crmApi('PUT', '/leads/' + l.id, { rep, assigned: false });
      return { ...l, rep };
    })),
    approveFlaggedLead: (id, repId) => setLeads((ls) => ls.map((l) => {if (l.id !== id) return l;
      const rep = repId === '__city' ? (window.CRM_CITY_REP || {})[l.city] || '' : repId || '';
      crmApi('PUT', '/leads/' + id, { flagged: false, rep, assigned: !!rep });
      return { ...l, flagged: false, rep, assigned: !!rep };})),
    discardFlaggedLead: (id) => { setLeads((ls) => ls.filter((l) => l.id !== id)); crmApi('DELETE', '/leads/' + id); },
    addCustOpen,
    goAddCustomer: () => {setAddCustOpen(true);setPage('customers');},
    goPipeline: () => setPage('pipeline'),
    goPage: (p) => setPage(p),
    setCourier: (id, info) => setOrders((os) => os.map((o) => {
      if (o.id !== id) return o;
      const merged = { ...o, ...info };
      // When a courier/tracking is marked, queue a shipment notification Mira delivers to the customer in the Sales App.
      if ((info.courier || info.track) && (merged.courier || merged.track)) {
        try {
          const cust = H.cust(o.cust) || {};
          const key = 'eurostar-mira-notifications';
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          const idx = list.findIndex((n) => n.orderId === o.id);
          const rec = { id: 'NTF-' + o.id, orderId: o.id, cust: o.cust, custName: cust.name || '', custCompany: cust.name || '', courier: merged.courier || '', track: merged.track || '', value: o.value, ts: Date.now(), read: false };
          if (idx >= 0) list[idx] = { ...list[idx], ...rec }; else list.push(rec);
          localStorage.setItem(key, JSON.stringify(list.slice(-100)));
        } catch (e) {}
      }
      return merged;
    })),
    logPayment: (p) => {
      // Show it immediately for the rep, and persist to the server so the Back
      // Office sees it in the pending-verification queue (a real DB row, not
      // just local state that vanishes on reload).
      setPayments((ps) => [...ps, { ...p, id: 'PAY-' + (ps.length + 101), source: 'Rep collection' }]);
      try {
        const API = window.EUROSTAR_API || location.origin;
        const tok = localStorage.getItem('eurostar-admin-token') || '';
        fetch(API + '/payments', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: 'Bearer ' + tok },
          body: JSON.stringify({
            orderId: p.orderId, custId: p.custId, custName: p.custName || '',
            mode: p.mode, amount: Math.round(p.amount || 0), utr: p.utr || '',
            date: p.date, by: p.by || '', contact: p.contact || '', img: p.img || null,
            status: 'pending', source: 'Rep collection',
          }),
        }).catch(() => {});
      } catch (e) {}
    },
    checkInVisit: (rep, custId, geo) => setVisits((vs) => [...vs, { id: 'VST-' + (300 + vs.length), rep, custId, day: '2026-06-16', checkIn: new Date().toISOString(), inLat: geo.lat, inLng: geo.lng, inAcc: geo.acc, inSource: geo.source, checkOut: null, outLat: null, outLng: null }]),
    checkOutVisit: (id, geo) => setVisits((vs) => vs.map((v) => v.id === id ? { ...v, checkOut: new Date().toISOString(), outLat: geo.lat, outLng: geo.lng } : v)),
    verifyPayment: (id) => { setPayments((ps) => ps.map((p) => p.id === id ? { ...p, status: 'confirmed' } : p)); crmApi('PUT', '/payments/' + id, { status: 'confirmed' }); },
    rejectPayment: (id) => {
      const reason = prompt('Reason for rejecting this payment? (the customer and rep are notified)');
      if (reason === null) return; // cancelled the reject
      setPayments((ps) => ps.map((p) => p.id === id ? { ...p, status: 'rejected', rejectReason: reason } : p));
      crmApi('PUT', '/payments/' + id, { status: 'failed', reason: reason || '' });
    },
    paidByCust: (custId) => payments.filter((p) => p.custId === custId && p.status === 'confirmed').reduce((a, p) => a + (p.amount || 0), 0),
    paidByOrder: (orderId) => payments.filter((p) => p.orderId === orderId && p.status === 'confirmed').reduce((a, p) => a + (p.amount || 0), 0),
    repBlocked,
    offboardRep: (id, name) => {if (!confirm('Block ' + name + '\u2019s login and de-link all their customers? Their customers become open for any rep to solicit.')) return;
      setRepBlocked((m) => ({ ...m, [id]: true }));setCustomers((cs) => cs.map((c) => c.rep === id ? { ...c, rep: '' } : c));},
    restoreRep: (id) => setRepBlocked((m) => ({ ...m, [id]: false })),
    delinkCustomer: (id) => setCustomers((cs) => cs.map((c) => c.id === id ? { ...c, rep: '' } : c)),
    reassignLead: (id, rep) => { setLeads((ls) => ls.map((l) => l.id === id ? { ...l, rep, assigned: !!rep } : l)); crmApi('PUT', '/leads/' + id, { rep, assigned: !!rep }); },
    leaders,
    addLeader: (lr) => setLeaders((ls) => [...ls, { ...lr, id: 'L' + (ls.length + 1 + Date.now() % 1000) }]),
    removeLeader: (id) => setLeaders((ls) => ls.filter((l) => l.id !== id)),
    setRepLeader: (repId, which, leaderId) => setReps((rs) => rs.map((r) => r.id === repId ? { ...r, [which]: leaderId } : r))
  };
  const byRep = reps.map((r) => {const ids = customers.filter((c) => c.rep === r.id).map((c) => c.id);
    const sales = orders.filter((o) => ids.includes(o.cust)).reduce((a, o) => a + o.value, 0);
    const rate = repRates[r.id] != null ? repRates[r.id] : r.rate;return { ...r, sales, rate, comm: Math.round(sales * rate) };}).sort((a, b) => b.sales - a.sales);
  st.byRep = byRep;st.maxSales = Math.max(...byRep.map((r) => r.sales), 1);

  const switchRole = (r) => {setRole(r);setPage(DEFAULT_PAGE[r]);};

  React.useEffect(() => { if (window.MiraStaff) window.MiraStaff.setContext('crm', role); }, [role]);

  // badge counts
  const counts = {
    quotes: carts.filter((c) => c.status === 'quote-requested').length,
    abandoned: carts.filter((c) => c.status === 'abandoned').length,
    queries: queries.filter((q) => q.status === 'open').length
  };
  const navBadge = (id) => ({ quotes: counts.quotes, abandoned: counts.abandoned, queries: counts.queries,
    franchise: (window.CRM_FRANCHISE || []).filter((r) => r.status === 'new').length,
    carts: orders.filter((o) => o.status === 'new' || o.status === 'confirmed').length,
    payments: payments.filter((p) => p.status === 'pending').length,
    visits: visits.filter((v) => !v.checkOut).length })[id];

  let screen = null;
  if (role === 'admin') screen = { dashboard: <AdminDashboard st={st} />, customers: <AdminCustomers st={st} />, orders: <AdminOrders st={st} />, reps: <AdminReps st={st} />, reports: <AdminReports st={st} />, attendance: <AdminAttendance st={st} />, visits: <AdminVisits st={st} />,
    carts: <CartsView carts={carts} orders={orders} editItems={st.editItems} removeCart={st.removeCart} setDisc={st.setDisc} editOrder={st.editOrder} removeOrder={st.removeOrder} title="All carts" sub="Open carts above, completed orders below" />, pipeline: <Pipeline st={st} />, rfq: <OfficeQueries st={st} />, franchise: <FranchiseRequests st={st} />, master: <CustomerMaster st={st} />, leads: <OfficeLeads st={st} />, broadcast: <RepBroadcastAdmin />, payments: <AdminPayments st={st} /> }[page];else
  if (role === 'office') screen = { orders: <OfficeOrders st={st} />, leads: <OfficeLeads st={st} />, pipeline: <Pipeline st={st} />, abandoned: <OfficeAbandoned st={st} />, queries: <OfficeQueries st={st} /> }[page];else
  screen = { desk: <RepDesk st={st} repId={REP_ID} />, pipeline: <Pipeline st={st} repId={REP_ID} />, rfq: <RepRfq st={st} repId={REP_ID} />, customers: <RepCustomers key={addCustOpen ? 'add' : 'list'} st={st} repId={REP_ID} />, commission: <RepCommission st={st} repId={REP_ID} /> }[page];

  const curNav = NAV[role].find((n) => n.id === page) || {};
  const curLabel = curNav.k ? CT(curNav.k, curNav.label) : curNav.label;

  return (
    <div className="crm-shell">
      {role === 'rep' && <RepBroadcastPopup />}
      <aside className="crm-side">
        <div className="crm-brand">
          <img src={window.EUROSTAR_LOGO || 'assets/eurostar-logo.jpeg'} alt="Eurostar" />
          <div><b>Eurostar</b><small>CRM</small></div>
        </div>
        <nav className="crm-nav">
          <div className="crm-nav-label">{roleTitle(role)}</div>
          {NAV[role].map((n) => {const b = navBadge(n.id);return (
              <button key={n.id} className={`crm-nav-item ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
              {CT(n.k || '', n.label)}{b ? <span className="badge">{b}</span> : null}
            </button>);})}
        </nav>
        <div className="crm-side-foot">
          <a className="crm-applink" href="Eurostar Sales website.html">↗ {CT('open_sales_app','Open Sales App')}</a>
          <button className="crm-applink crm-signout" onClick={signOut}>↩ {CT('sign_out','Sign out')}</button>
        </div>
      </aside>

      <main className="crm-main">
        <div className="crm-mobnav">
          {NAV[role].map((n) => {const b = navBadge(n.id);return (
              <button key={n.id} className={`crm-mobnav-item ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
              {n.label}{b ? <span className="badge">{b}</span> : null}
            </button>);})}
        </div>
        <header className="crm-top">
          {role === 'rep' ?
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div><h1 style={{ margin: 0 }}>{H.rep(REP_ID).name}</h1><div className="crm-id crm-muted" style={{ fontSize: 13, marginTop: 2 }}>Sales Rep · {REP_ID} · {curLabel}</div></div>
                <button className="cbtn cbtn-accent" onClick={() => st.goAddCustomer()}>+ Add customer</button>
              </div> :
          <h1>{roleTitle(role)} <span className="crm-muted" style={{ fontWeight: 400, fontSize: 15 }}>· {curLabel}</span></h1>}
          <div className="crm-role">
            <button className={role === 'admin' ? 'active' : ''} onClick={() => switchRole('admin')}>{CT('crm_role_admin','Admin')}</button>
            <button className={role === 'office' ? 'active' : ''} onClick={() => switchRole('office')}>{CT('crm_role_office','Back Office')}</button>
            <button className={role === 'rep' ? 'active' : ''} onClick={() => switchRole('rep')}>{CT('crm_role_rep','Sales Rep')}</button>
          </div>
          {role === 'admin' && <CrmNotifications st={st} />}
          <CrmLangSwitcher />
        </header>
        {authDead &&
        <div style={{ margin: '14px 20px 0', padding: '12px 16px', background: 'var(--ruby-soft)', border: '1px solid var(--ruby)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div style={{ flex: 1, fontSize: 13.5, color: 'var(--ruby)' }}>
            <strong>Your session has expired — the figures below are not live.</strong>
            <div style={{ fontSize: 12.5, marginTop: 2 }}>Counts show 0 because the CRM cannot reach the database, not because there is no data. Sign in again to reload.</div>
          </div>
          <button className="cbtn cbtn-accent cbtn-sm" style={{ flex: '0 0 auto' }}
            onClick={() => { try { localStorage.removeItem('eurostar-admin-token'); localStorage.removeItem('eurostar-admin-refresh'); } catch (e) {} location.reload(); }}>
            Sign in again
          </button>
        </div>}
        {screen}
      </main>
      {editTarget && (() => {const entity = editTarget.kind === 'order' ? orders.find((o) => o.id === editTarget.id) : carts.find((c) => c.id === editTarget.id);
        if (!entity) return null;
        const onSave = (patch) => {if (editTarget.kind === 'order') setOrders((os) => os.map((o) => o.id === editTarget.id ? { ...o, ...patch } : o));else setCarts((cs) => cs.map((c) => c.id === editTarget.id ? { ...c, ...patch } : c));};
        return <CartEditor kind={editTarget.kind} entity={entity} onSave={onSave} onClose={() => setEditTarget(null)} />;})()}
      <CrmTweaks />
    </div>);

}

/* ===================== TWEAKS PANEL ===================== */
function CrmTweaks() {
  const read = (k, d) => {try {return localStorage.getItem('crm-tweak-' + k) || d;} catch (e) {return d;}};
  const [open, setOpen] = useState(false);
  const [skin, setSkin] = useState(() => read('skin', 'indigo'));
  const [accent, setAccent] = useState(() => read('accent', 'sapphire'));
  const [density, setDensity] = useState(() => read('density', 'compact'));
  React.useEffect(() => {
    const r = document.documentElement;
    r.setAttribute('data-skin', skin);r.setAttribute('data-accent', accent);r.setAttribute('data-density', density);
    try {localStorage.setItem('crm-tweak-skin', skin);localStorage.setItem('crm-tweak-accent', accent);localStorage.setItem('crm-tweak-density', density);} catch (e) {}
  }, [skin, accent, density]);
  const Seg = ({ val, set, opts }) =>
  <div className="tk-seg">{opts.map(([v, l]) =>
    <button key={v} className={`tk-opt ${val === v ? 'on' : ''}`} onClick={() => set(v)}>{l}</button>
    )}</div>;

  const accents = [['emerald', '#0E5C4A'], ['sapphire', '#1E3A8A'], ['ruby', '#8B1E2E'], ['amber', '#B7791F'], ['plum', '#6D2D6B']];
  return (
    <React.Fragment>
      <button className="crm-tweak-fab" title="Tweaks" onClick={() => setOpen((o) => !o)}>{open ? '✕' : '✦'}</button>
      {open &&
      <div className="crm-tweak-panel">
        <h4>Tweaks</h4>
        <p className="tk-sub">Give this app its own colour scheme.</p>
        <div className="tk-group"><div className="tk-glabel">Chrome skin</div>
          <Seg val={skin} set={setSkin} opts={[['midnight', 'Midnight'], ['emerald', 'Emerald'], ['indigo', 'Indigo'], ['parchment', 'Parchment']]} /></div>
        <div className="tk-group"><div className="tk-glabel">Accent palette</div>
          <div className="tk-swatches">{accents.map(([id, hex]) =>
            <button key={id} className={`tk-sw ${accent === id ? 'on' : ''}`} style={{ background: hex }} title={id} onClick={() => setAccent(id)} />
            )}</div></div>
        <div className="tk-group" style={{ marginBottom: 0 }}><div className="tk-glabel">Density</div>
          <Seg val={density} set={setDensity} opts={[['comfortable', 'Comfortable'], ['compact', 'Compact']]} /></div>
      </div>}
    </React.Fragment>);

}

ReactDOM.createRoot(document.getElementById('root')).render(<CRM />);