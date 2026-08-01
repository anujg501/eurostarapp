// Eurostar Mira Admin API bridge (Phase 5)
// ---------------------------------------------------------------------------
// The Mira Admin edits the assistant's brain (localStorage:
// eurostar-mira-instructions/-rules/-knowledge/-examples/-enabled/-images).
// This bridge SAVES those to the back room and LOADS them back, so Mira's
// configuration is stored server-side and used by the /assistant/chat API.
//
// It POLLS the keys for changes (the app re-defines setItem, so wrapping is not
// reliable) and pushes the full config whenever something changes.
(function () {
  var API = location.origin;
  window.EUROSTAR_API = API;

  var K = {
    inst: 'eurostar-mira-instructions',
    rules: 'eurostar-mira-rules',
    know: 'eurostar-mira-knowledge',
    ex: 'eurostar-mira-examples',
    enabled: 'eurostar-mira-enabled',
    images: 'eurostar-mira-images',
  };
  var WATCH = [K.inst, K.rules, K.know, K.ex, K.enabled, K.images];

  function parse(key, fb) { try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fb : v; } catch (e) { return fb; } }
  // Saving Mira settings requires a staff session (token stored by the login screen).
  function token() {
    try { return localStorage.getItem('eurostar-admin-token') || ''; } catch (e) { return ''; }
  }

  function put(path, body) {
    var t = token();
    if (!t) return Promise.resolve(); // not signed in — nothing to save yet
    try { return fetch(API + path, { method: 'PUT', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + t }, body: JSON.stringify(body), keepalive: true }).catch(function () {}); }
    catch (e) { return Promise.resolve(); }
  }
  function getJson(path) { return fetch(API + path, { headers: { accept: 'application/json' } }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function set(key, val) { try { localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val)); } catch (e) {} }

  // Has this browser ever held a value for that key? A key that is simply
  // absent means "this device does not know", which is NOT the same as "the
  // office deleted everything" — and the difference matters, because what gets
  // pushed here overwrites the server.
  function known(key) { try { return localStorage.getItem(key) !== null; } catch (e) { return false; } }

  function pushConfig() {
    var enabledObj = parse(K.enabled, null);
    var body = { enabled: enabledObj ? enabledObj.salesApp !== false : undefined };
    if (known(K.inst)) body.instructions = localStorage.getItem(K.inst) || '';
    if (known(K.rules)) body.rules = parse(K.rules, []);
    if (known(K.know)) body.knowledge = parse(K.know, []);
    if (known(K.ex)) body.examples = parse(K.ex, []);
    put('/assistant/config', body);

    // The image library is the one that hurt. This page used to send
    // `parse(K.images, [])` unconditionally, so opening Mira Admin on a machine
    // that had never stored it — a second computer, a cleared cache, a fresh
    // profile — pushed an empty list and deleted every uploaded photo from the
    // server. Mira then told customers the office had not provided a picture
    // that the office had definitely provided.
    //
    // Only send this list when this browser actually has one. Emptying the
    // library on purpose still works: deleting the last image writes an empty
    // array to localStorage, so the key exists and the push goes through.
    if (known(K.images)) put('/admin/mira/images', parse(K.images, []));
    if (enabledObj) put('/admin/mira/enabled', enabledObj);
  }

  var last = {};
  function poll() {
    var changed = false;
    WATCH.forEach(function (k) { var cur = localStorage.getItem(k); if (cur !== last[k]) { last[k] = cur; changed = true; } });
    if (changed) pushConfig();
  }

  function hydrate() {
    return Promise.all([getJson('/assistant/config'), getJson('/admin/mira/enabled'), getJson('/admin/mira/images')]).then(function (r) {
      var cfg = r[0], enabled = r[1], images = r[2];
      if (cfg) {
        if (typeof cfg.instructions === 'string') set(K.inst, cfg.instructions);
        if (Array.isArray(cfg.rules)) set(K.rules, cfg.rules);
        if (Array.isArray(cfg.knowledge)) set(K.know, cfg.knowledge);
        if (Array.isArray(cfg.examples)) set(K.ex, cfg.examples);
      }
      if (enabled && typeof enabled === 'object') set(K.enabled, enabled);
      if (Array.isArray(images)) set(K.images, images);
      // Did we actually hear from the back room? Nothing at all means no.
      return !!(cfg || enabled || images);
    });
  }

  function startPolling() {
    WATCH.forEach(function (k) { last[k] = localStorage.getItem(k); });
    setInterval(poll, 1500);
  }

  if (!sessionStorage.getItem('mira-hydrated')) {
    // Only mark the session hydrated once the server has actually answered. A
    // failed pull used to count as "done", leaving the page with no local copy
    // of the settings and free to push its emptiness back over them.
    hydrate().then(function (ok) {
      if (ok) sessionStorage.setItem('mira-hydrated', '1');
      location.reload();
    });
  } else {
    startPolling();
  }
  // eslint-disable-next-line no-console
  console.log('[Eurostar] Mira Admin API bridge active →', API);
})();
