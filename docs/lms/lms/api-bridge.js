// Eurostar LMS API bridge (Phase 4)
// ---------------------------------------------------------------------------
// When the LMS onboards a hired candidate ("Onboard to CRM as Rep"), it appends
// a rep record to localStorage key eurostar-crm-new-hires. This bridge MIRRORS
// those writes to the live back room (POST /reps) so the new rep shows up in the
// CRM's "Reps & commission" — LMS → CRM, live — with no change to the LMS UI.
(function () {
  var API = location.origin;
  window.EUROSTAR_API = API;

  var HIRES_KEY = 'eurostar-crm-new-hires';
  var synced = {};

  // Onboarding a hire into the CRM requires a staff session (token stored by the
  // LMS login screen).
  function token() {
    try { return localStorage.getItem('eurostar-admin-token') || ''; } catch (e) { return ''; }
  }

  function post(path, body) {
    var t = token();
    if (!t) return Promise.resolve(); // not signed in — nothing to push yet
    try {
      return fetch(API + path, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + t },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(function () {});
    } catch (e) {
      return Promise.resolve();
    }
  }

  function syncHires(raw) {
    var arr;
    try { arr = JSON.parse(raw || '[]'); } catch (e) { return; }
    if (!Array.isArray(arr)) return;
    arr.forEach(function (rec) {
      if (rec && rec.id && !synced[rec.id]) {
        synced[rec.id] = true;
        post('/reps', {
          repId: rec.id,
          name: rec.name,
          city: rec.city || undefined,
          state: rec.region || undefined,
          source: 'LMS',
          commissionRate: typeof rec.rate === 'number' ? rec.rate : undefined,
        });
      }
    });
  }

  var origSet = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (key, value) {
    origSet(key, value);
    if (key === HIRES_KEY) syncHires(value);
  };

  try { syncHires(localStorage.getItem(HIRES_KEY)); } catch (e) {}

  // eslint-disable-next-line no-console
  console.log('[Eurostar] LMS API bridge active →', API);
})();
