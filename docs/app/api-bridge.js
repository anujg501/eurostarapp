// Eurostar API bridge (Phase 2)
// ---------------------------------------------------------------------------
// The Sales app was built to store orders & payments in the browser
// (localStorage keys eurostar-crm-incoming-orders / -payments). This small
// bridge MIRRORS those writes to the live back room so the data is saved
// server-side too — with zero change to how the app looks or behaves.
//
// It wraps localStorage.setItem: whenever the app saves the orders/payments
// arrays, any new items (by id) are POSTed to the API. Failures are ignored so
// the app never breaks if the server is briefly unreachable.
//
// Real user login/OTP is wired later (Phase 6); until then the app supplies the
// customer/rep details in each record, which the API accepts.
(function () {
  var API = location.origin;
  window.EUROSTAR_API = API;

  var ORDERS_KEY = 'eurostar-crm-incoming-orders';
  var PAYMENTS_KEY = 'eurostar-crm-incoming-payments';
  var syncedOrders = {};
  var syncedPayments = {};

  function post(path, body) {
    try {
      return fetch(API + path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(function () {});
    } catch (e) {
      return Promise.resolve();
    }
  }

  function syncArray(raw, seen, path) {
    var arr;
    try {
      arr = JSON.parse(raw || '[]');
    } catch (e) {
      return;
    }
    if (!Array.isArray(arr)) return;
    arr.forEach(function (item) {
      if (item && item.id && !seen[item.id]) {
        seen[item.id] = true;
        post(path, item);
      }
    });
  }

  var origSet = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (key, value) {
    origSet(key, value);
    if (key === ORDERS_KEY) syncArray(value, syncedOrders, '/orders');
    else if (key === PAYMENTS_KEY) syncArray(value, syncedPayments, '/payments');
  };

  // Also push anything already stored from before the bridge loaded.
  try {
    syncArray(localStorage.getItem(ORDERS_KEY), syncedOrders, '/orders');
    syncArray(localStorage.getItem(PAYMENTS_KEY), syncedPayments, '/payments');
  } catch (e) {}

  // eslint-disable-next-line no-console
  console.log('[Eurostar] API bridge active →', API);
})();
