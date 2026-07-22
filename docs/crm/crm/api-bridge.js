// Eurostar CRM API bridge (Phase 3)
// ---------------------------------------------------------------------------
// The CRM was built to read orders/payments/reps/customers from the browser
// (localStorage). This bridge HYDRATES those same keys from the live back room,
// so the CRM shows real data — e.g. orders placed in the Sales App appear in
// the CRM's "Incoming from Sales App" panel — with no change to the CRM's code.
//
// On first load this session it fetches, writes the keys, then reloads once so
// the CRM renders with live data. After that it refreshes in the background so
// new orders show up as you navigate.
(function () {
  var API = location.origin;
  window.EUROSTAR_API = API;

  // The back room now requires a staff session for these reads. The CRM login
  // screen stores the token under 'eurostar-admin-token'.
  function token() {
    try { return localStorage.getItem('eurostar-admin-token') || ''; } catch (e) { return ''; }
  }

  // Silently mint a fresh access token from the stored refresh token. Returns a
  // promise of true on success. Without this, a 15-min-expired token made every
  // hydrate 401 and fall back to the static seed (looked like "data went static").
  function refreshToken() {
    var rt = '';
    try { rt = localStorage.getItem('eurostar-admin-refresh') || ''; } catch (e) {}
    if (!rt) return Promise.resolve(false);
    return fetch(API + '/auth/refresh', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt })
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && d.accessToken) { try { localStorage.setItem('eurostar-admin-token', d.accessToken); } catch (e) {} return true; }
        return false;
      })
      .catch(function () { return false; });
  }

  function getJson(path) { return doGet(path, true); }

  function doGet(path, allowRefresh) {
    var t = token();
    if (!t) return Promise.resolve(null); // not signed in yet — nothing to hydrate
    return fetch(API + path, {
      headers: { accept: 'application/json', authorization: 'Bearer ' + t }
    })
      .then(function (r) {
        if (r.status === 401 || r.status === 403) {
          // Token expired — refresh once and retry before giving up (which would
          // wipe the token and drop the CRM back to seed data).
          if (allowRefresh) {
            return refreshToken().then(function (ok) { return ok ? doGet(path, false) : dropToken(); });
          }
          return dropToken();
        }
        return r.ok ? r.json() : null;
      })
      .catch(function () { return null; });
  }

  function dropToken() {
    try { localStorage.removeItem('eurostar-admin-token'); } catch (e) {}
    return null;
  }

  function put(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  // "2026-06-16T…" or an epoch ms → "2026-06-16", for the CRM's date fields.
  function dateOnly(x) {
    if (!x) return '';
    var d = typeof x === 'number' ? new Date(x) : new Date(String(x));
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }

  function hydrate() {
    return Promise.all([
      getJson('/orders'),
      getJson('/payments'),
      getJson('/reps'),
      getJson('/customers'),
      // Dashboard analytics, derived server-side from the real orders/payments.
      // These replace the hardcoded CRM_SALES_BY_* / summary / leaderboard the
      // console shipped with. Written to localStorage so they survive the reload
      // crm-data.jsx reads them back on (globals reset on reload; storage does not).
      getJson('/reports/sales-by-month'),
      getJson('/reports/sales-by-category'),
      getJson('/reports/leaderboard'),
      getJson('/reports/summary'),
      // Phase 2: the CRM's main tables (orders/customers/carts/queries/visits/
      // reps) render from static CRM_* globals. Fetch the live equivalents and
      // map them to those shapes so every table goes dynamic — see the pulls in
      // crm-data.jsx that lay these over the static seed on reload.
      getJson('/carts'),
      getJson('/rfq'),
      getJson('/reps/checkins'),
      getJson('/franchise'),
      getJson('/leads'),
    ]).then(function (res) {
      var orders = res[0], payments = res[1], reps = res[2], customers = res[3];
      if (Array.isArray(res[4])) put('eurostar-crm-sales-by-month', res[4]);
      if (Array.isArray(res[5])) put('eurostar-crm-sales-by-category', res[5]);
      if (Array.isArray(res[6])) put('eurostar-crm-leaderboard', res[6]);
      if (res[7] && typeof res[7] === 'object') put('eurostar-crm-summary', res[7]);
      var carts = res[8], rfqs = res[9], checkins = res[10], franchise = res[11], leads = res[12];

      // --- Live data mapped into the CRM's own shapes ---
      if (Array.isArray(customers)) {
        put('eurostar-crm-customers', customers.map(function (c) {
          return {
            id: c.code || c.id, name: c.name, city: c.city || '', gst: c.gstin || '',
            mobile: c.phone || '', rep: c.rep || '', terms: c.terms || 'cash',
            tier: '', since: '', credit: 0, cartViewsNoOrder: 0, active: true,
          };
        }));
      }
      if (Array.isArray(orders)) {
        // The CRM order flow starts at 'new' (needs office confirmation); the API
        // calls that same state 'pending'. Translate so a fresh order shows up in
        // the "new order to confirm" queue and the "awaiting review" KPI.
        var orderStatus = function (s) { return s === 'pending' ? 'new' : (s || 'new'); };
        put('eurostar-crm-orders', orders.map(function (o) {
          return {
            id: o.id, cust: o.code || o.customerId || '', date: dateOnly(o.ts || o.createdAt),
            status: orderStatus(o.status), value: o.grand || o.value || 0,
            items: Array.isArray(o.items) ? o.items.length : 0,
            courier: o.courier || '', track: o.track || '', discount: 0,
          };
        }));
      }
      // Reps: prefer the Rep table, but it is usually empty — the real reps are
      // Users (repId like REP-204) that only the leaderboard surfaces. Fall back
      // to the leaderboard so CRM_REPS carries the same ids that customers and
      // orders reference (otherwise sales-by-rep, commission and dues attribute
      // to nobody).
      var repRows = (Array.isArray(reps) && reps.length)
        ? reps.map(function (r) {
            return { id: r.repId || r.id, name: r.name, region: r.city || '', phone: r.phone || '', rate: 0.04, joined: '', target: 50, addedThisMonth: 0, asm: 'L1', head: 'L2' };
          })
        : (Array.isArray(res[6]) ? res[6].map(function (l) {
            return { id: l.repId, name: l.name, region: '', phone: '', rate: 0.04, joined: '', target: 50, addedThisMonth: 0, asm: 'L1', head: 'L2' };
          }) : []);
      if (repRows.length) put('eurostar-crm-reps', repRows);
      if (Array.isArray(carts)) {
        put('eurostar-crm-carts', carts.map(function (c) {
          return {
            id: c.id, cust: c.customerId || '', updated: dateOnly(c.updatedAt),
            status: c.status || 'active', value: (c.totals && c.totals.grand) || 0,
            items: Array.isArray(c.lines) ? c.lines.length : 0, age: '', note: '',
          };
        }));
      }
      if (Array.isArray(rfqs)) {
        put('eurostar-crm-queries', rfqs.map(function (r) {
          var it = Array.isArray(r.items) && r.items[0] ? r.items[0] : {};
          var d = r.detail || {};
          return {
            id: r.id, cust: r.custCode || r.customerId || '', custName: r.custName || d.contactName || '',
            status: r.status || 'open', channel: '',
            date: dateOnly(r.createdAt), assignedRep: r.assignedRep || '',
            product: d.product || it.name || it.shape || '',
            size: d.size || it.size || '', weight: d.weight || '',
            quality: d.quality || it.grade || '', qty: d.qty || (it.qty ? String(it.qty) : ''),
            city: r.city || d.city || '', contactName: d.contactName || '', contact: d.contact || '',
            special: d.special || it.note || '', image: d.image || '',
          };
        }));
      }
      if (Array.isArray(checkins)) {
        put('eurostar-crm-visits', checkins.map(function (c) {
          var isIn = c.type !== 'out';
          return {
            id: c.id, rep: c.repId || '', custId: '', day: dateOnly(c.at),
            checkIn: isIn ? c.at : '', checkOut: isIn ? '' : c.at,
            inLat: c.lat, inLng: c.lng, inAcc: c.accuracy, inSource: 'gps',
          };
        }));
      }
      if (Array.isArray(franchise)) {
        put('eurostar-crm-franchise', franchise.map(function (r) {
          return {
            id: r.id, name: r.name, firm: r.firm || '—', city: r.city || '',
            mobile: r.mobile || '', invest: r.invest || '', exp: r.exp || '',
            date: dateOnly(r.createdAt), status: r.status || 'new',
          };
        }));
      }
      // Leads already match the CRM lead shape (see the Lead model), so store
      // them straight through for the "Leads" screen.
      if (Array.isArray(leads)) put('eurostar-crm-leads', leads);
      if (Array.isArray(orders)) put('eurostar-crm-incoming-orders', orders);
      if (Array.isArray(payments)) put('eurostar-crm-incoming-payments', payments);
      // The Payment log renders CRM_SAMPLE_PAYMENTS. serialisePayment already
      // matches that shape; the only gap is the API's 'failed' vs the CRM's
      // 'rejected', so translate that one status.
      if (Array.isArray(payments)) {
        put('eurostar-crm-payments', payments.map(function (p) {
          return p.status === 'failed' ? Object.assign({}, p, { status: 'rejected' }) : p;
        }));
      }
      if (Array.isArray(reps)) {
        put('eurostar-crm-new-hires', reps.map(function (r) {
          return { id: r.id, name: r.name, city: r.city, state: r.state, source: r.source, repId: r.repId };
        }));
      }
      if (Array.isArray(customers)) {
        // Map to the CRM customer-master shape (gst / mobile).
        put('eurostar-customer-master-v1', customers.map(function (c) {
          return { name: c.name, gst: c.gstin || '', city: c.city || '', address: '', mobile: c.phone || '', source: 'API' };
        }));
      }
    });
  }

  function boot() {
    // Hydrating needs a staff session. Before sign-in there is nothing to fetch,
    // so wait for the login screen to store a token rather than marking this
    // session "hydrated" with empty data.
    if (!token()) { setTimeout(boot, 1000); return; }

    // Bump this key whenever the hydrate writes new localStorage keys, so a
    // session that already hydrated under an older bridge re-runs once and picks
    // up the new data (otherwise it skips the reload and keeps rendering seed).
    if (!sessionStorage.getItem('crm-hydrated-v12')) {
      // First visit this session: load live data, then reload so the CRM renders it.
      hydrate().then(function () {
        sessionStorage.setItem('crm-hydrated-v12', '1');
        location.reload();
      });
    } else {
      // Already hydrated once: keep data fresh for subsequent navigation.
      hydrate();
      setInterval(hydrate, 20000);
    }
  }
  boot();

  // eslint-disable-next-line no-console
  console.log('[Eurostar] CRM API bridge active →', API);
})();
