// catalog-sync.jsx — makes the storefront read the real catalogue.
//
// data.jsx ships a hardcoded CATEGORIES / PRODUCTS / GRADES_BY_CATEGORY baked
// into the page. That was the whole catalogue before the Admin panel could save
// anything, and it is why a category created in Admin never appeared in the
// shop: the shop was reading a frozen copy and never asked the server.
//
// This runs after data.jsx and before app.jsx, pulls the live catalogue, and
// replaces the contents of those arrays IN PLACE — every screen already holds a
// reference to them, so mutating rather than reassigning keeps those references
// valid. app.jsx waits on window.EUROSTAR_CATALOG_READY before it renders.
//
// If the API is unreachable we keep the built-in data: a slightly stale shop
// beats an empty one.
(function () {
  var API = window.EUROSTAR_API || location.origin;

  function getJson(path) {
    return fetch(API + path, { headers: { accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  // Server categories use `key`; every screen here expects `id`.
  function toClientCategory(c) {
    return {
      id: c.key,
      name: c.name,
      short: c.short || c.name,
      blurb: c.blurb || '',
      skipGrade: !!c.skipGrade,
      count: c.count || 0,
      unit: c.unit,
      origin: c.origin,
    };
  }

  window.EUROSTAR_CATALOG_READY = Promise.all([
    getJson('/catalog'),
    getJson('/catalog/products'),
    getJson('/admin/catalog/grades'),
  ])
    .then(function (res) {
      var cat = res[0];
      var prod = res[1];
      var extraGrades = res[2];

      if (cat && Array.isArray(cat.categories) && cat.categories.length) {
        var mapped = cat.categories.map(toClientCategory);
        Array.prototype.splice.apply(CATEGORIES, [0, CATEGORIES.length].concat(mapped));
      }

      if (prod && Array.isArray(prod.products) && prod.products.length) {
        Array.prototype.splice.apply(PRODUCTS, [0, PRODUCTS.length].concat(prod.products));
      }

      // Custom grades added in Admin sit on top of the built-in ones.
      if (extraGrades && typeof extraGrades === 'object') {
        Object.keys(extraGrades).forEach(function (key) {
          var extra = extraGrades[key];
          if (!Array.isArray(extra) || !extra.length) return;
          var existing = GRADES_BY_CATEGORY[key] || [];
          var seen = {};
          existing.forEach(function (g) { seen[g.id] = true; });
          GRADES_BY_CATEGORY[key] = existing.concat(extra.filter(function (g) { return g && g.id && !seen[g.id]; }));
        });
      }

      // eslint-disable-next-line no-console
      console.log('[Eurostar] catalogue synced —', CATEGORIES.length, 'categories,', PRODUCTS.length, 'products');
    })
    .catch(function (e) {
      // eslint-disable-next-line no-console
      console.warn('[Eurostar] catalogue sync failed, using built-in data', e);
    });
})();
