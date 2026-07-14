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
  var isLocal = /^(localhost|127\.|0\.0\.0\.0)/.test(location.hostname);
  var API = isLocal ? location.origin : 'https://eurostar-api.onrender.com';
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
  function put(path, body) {
    try { return fetch(API + path, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), keepalive: true }).catch(function () {}); }
    catch (e) { return Promise.resolve(); }
  }
  function getJson(path) { return fetch(API + path, { headers: { accept: 'application/json' } }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function set(key, val) { try { localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val)); } catch (e) {} }

  function pushConfig() {
    var enabledObj = parse(K.enabled, null);
    put('/assistant/config', {
      instructions: localStorage.getItem(K.inst) || '',
      rules: parse(K.rules, []),
      knowledge: parse(K.know, []),
      examples: parse(K.ex, []),
      enabled: enabledObj ? enabledObj.salesApp !== false : undefined,
    });
    put('/admin/mira/images', parse(K.images, []));
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
    });
  }

  function startPolling() {
    WATCH.forEach(function (k) { last[k] = localStorage.getItem(k); });
    setInterval(poll, 1500);
  }

  if (!sessionStorage.getItem('mira-hydrated')) {
    hydrate().then(function () { sessionStorage.setItem('mira-hydrated', '1'); location.reload(); });
  } else {
    startPolling();
  }
  // eslint-disable-next-line no-console
  console.log('[Eurostar] Mira Admin API bridge active →', API);
})();
