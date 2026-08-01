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

  // Silently mint a fresh access token from the stored refresh token, so a
  // short-lived access token that lapses mid-session — or after the admin has
  // been idle — is renewed in the background instead of bouncing them to the
  // login gate with "Session expired". Deduped: many 401s at once share one
  // in-flight refresh. Returns a promise of true on success. The LMS login
  // screen must have stored 'eurostar-admin-refresh' (remember me) for this to
  // have anything to work with; without it, this resolves false and the caller
  // falls back to the old sign-in-again behaviour.
  var refreshing = null;
  window.eurostarRefreshAccess = function () {
    if (refreshing) return refreshing;
    var rt = '';
    try { rt = localStorage.getItem('eurostar-admin-refresh') || ''; } catch (e) {}
    if (!rt) return Promise.resolve(false);
    refreshing = fetch(API + '/auth/refresh', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && d.accessToken) { try { origSet('eurostar-admin-token', d.accessToken); } catch (e) {} return true; }
        // The refresh token itself is dead (expired/revoked). Drop it so we
        // stop retrying and the next 401 signs out cleanly.
        try { localStorage.removeItem('eurostar-admin-refresh'); } catch (e) {}
        return false;
      })
      .catch(function () { return false; })
      .then(function (ok) { refreshing = null; return ok; });
    return refreshing;
  };

  // eslint-disable-next-line no-console
  console.log('[Eurostar] LMS API bridge active →', API);
})();
