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

  function getJson(path) {
    var t = token();
    if (!t) return Promise.resolve(null); // not signed in yet — nothing to hydrate
    return fetch(API + path, {
      headers: { accept: 'application/json', authorization: 'Bearer ' + t }
    })
      .then(function (r) {
        if (r.status === 401 || r.status === 403) {
          // Session expired or revoked: drop it so the login screen comes back.
          try { localStorage.removeItem('eurostar-admin-token'); } catch (e) {}
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .catch(function () { return null; });
  }

  function put(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  function hydrate() {
    return Promise.all([
      getJson('/orders'),
      getJson('/payments'),
      getJson('/reps'),
      getJson('/customers'),
    ]).then(function (res) {
      var orders = res[0], payments = res[1], reps = res[2], customers = res[3];
      if (Array.isArray(orders)) put('eurostar-crm-incoming-orders', orders);
      if (Array.isArray(payments)) put('eurostar-crm-incoming-payments', payments);
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

    if (!sessionStorage.getItem('crm-hydrated')) {
      // First visit this session: load live data, then reload so the CRM renders it.
      hydrate().then(function () {
        sessionStorage.setItem('crm-hydrated', '1');
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
