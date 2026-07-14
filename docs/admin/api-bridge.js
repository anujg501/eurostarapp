// Eurostar Admin API bridge (Phase 5)
// ---------------------------------------------------------------------------
// The Sales App Admin edits catalog overlays, thumbnails, the marketing splash
// and the rep-broadcast banner (localStorage). This bridge SAVES those to the
// back room and LOADS them back, so admin content is stored server-side and can
// be read by the Sales app.
//
// It POLLS the relevant keys for changes (rather than wrapping setItem, which
// the app itself re-defines) and pushes any change to the API.
(function () {
  var isLocal = /^(localhost|127\.|0\.0\.0\.0)/.test(location.hostname);
  var API = isLocal ? location.origin : 'https://eurostar-api.onrender.com';
  window.EUROSTAR_API = API;

  function parse(key, fb) { try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fb : v; } catch (e) { return fb; } }
  function put(path, body) {
    try { return fetch(API + path, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), keepalive: true }).catch(function () {}); }
    catch (e) { return Promise.resolve(); }
  }
  function getJson(path) { return fetch(API + path, { headers: { accept: 'application/json' } }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function set(key, val) { try { localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val)); } catch (e) {} }

  // Which keys to watch, and how to push each change.
  function pushSplash() {
    put('/admin/splash', {
      image: localStorage.getItem('eurostar-splash-image'),
      active: localStorage.getItem('eurostar-splash-active') === '1',
    });
  }
  function pushAnnounce() {
    put('/announcements', {
      active: localStorage.getItem('eurostar-rep-announce-active') === '1',
      image: localStorage.getItem('eurostar-rep-announce-image') || null,
      title: localStorage.getItem('eurostar-rep-announce-title') || null,
      message: localStorage.getItem('eurostar-rep-announce-msg') || null,
      badge: localStorage.getItem('eurostar-rep-announce-badge') || null,
    });
  }
  var HANDLERS = {
    'eurostar-extra-colors-v1': function () { put('/admin/catalog/colours', parse('eurostar-extra-colors-v1', {})); },
    'eurostar-extra-shapes-v1': function () { put('/admin/catalog/shapes', parse('eurostar-extra-shapes-v1', {})); },
    'eurostar-cat-thumbs-v1': function () { put('/admin/thumbs/categories', parse('eurostar-cat-thumbs-v1', {})); },
    'eurostar-shape-thumbs-v1': function () { put('/admin/thumbs/shapes', parse('eurostar-shape-thumbs-v1', {})); },
    'eurostar-splash-image': pushSplash,
    'eurostar-splash-active': pushSplash,
  };
  ['active', 'image', 'title', 'msg', 'badge'].forEach(function (s) { HANDLERS['eurostar-rep-announce-' + s] = pushAnnounce; });
  var WATCH = Object.keys(HANDLERS);

  var last = {};
  function poll() {
    WATCH.forEach(function (k) {
      var cur = localStorage.getItem(k);
      if (cur !== last[k]) { last[k] = cur; HANDLERS[k](); }
    });
  }

  function hydrate() {
    return Promise.all([
      getJson('/admin/catalog/colours'), getJson('/admin/catalog/shapes'),
      getJson('/admin/thumbs/categories'), getJson('/admin/thumbs/shapes'),
      getJson('/admin/splash'), getJson('/announcements'),
    ]).then(function (r) {
      if (r[0]) set('eurostar-extra-colors-v1', r[0]);
      if (r[1]) set('eurostar-extra-shapes-v1', r[1]);
      if (r[2]) set('eurostar-cat-thumbs-v1', r[2]);
      if (r[3]) set('eurostar-shape-thumbs-v1', r[3]);
      if (r[4]) { if (r[4].image != null) set('eurostar-splash-image', r[4].image); set('eurostar-splash-active', r[4].active ? '1' : '0'); }
      var a = r[5];
      if (a) {
        set('eurostar-rep-announce-active', a.active ? '1' : '0');
        if (a.image != null) set('eurostar-rep-announce-image', a.image || '');
        if (a.title != null) set('eurostar-rep-announce-title', a.title || '');
        if (a.message != null) set('eurostar-rep-announce-msg', a.message || '');
        if (a.badge != null) set('eurostar-rep-announce-badge', a.badge || '');
      }
    });
  }

  function startPolling() {
    // Seed "last" with current values so we only push real edits, not the hydrated state.
    WATCH.forEach(function (k) { last[k] = localStorage.getItem(k); });
    setInterval(poll, 1500);
  }

  // Load current content from the back room (best-effort), then start watching
  // for edits and pushing them. No page reload (this app doesn't re-run scripts
  // reliably after reload), so edits are what flow to the server.
  hydrate().then(startPolling, startPolling);
  // eslint-disable-next-line no-console
  console.log('[Eurostar] Admin API bridge active →', API);
})();
