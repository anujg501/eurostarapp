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

  // Server-saved admin content is mirrored into the exact localStorage keys
  // the screens already read — the Admin panel stopped writing localStorage
  // when it moved to the API, so without this mirror an uploaded thumbnail
  // (or colour, or product photo) never reached the storefront.
  function mirrorToLocal(key, value) {
    if (!value || typeof value !== 'object') return;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* quota — keep the cached copy */ }
  }

  // Re-pull just the SKUs. The catalogue is synced once at boot, so stock shown
  // after an order was whatever it had been at page load — a SKU bought down to
  // zero still looked available until a manual refresh. Called after an order is
  // placed so the pads and listings reflect what is actually left.
  window.refreshCatalogProducts = function () {
    return getJson('/catalog/products')
      .then(function (prod) {
        if (prod && Array.isArray(prod.products) && prod.products.length) {
          Array.prototype.splice.apply(PRODUCTS, [0, PRODUCTS.length].concat(prod.products));
          try { window.dispatchEvent(new CustomEvent('eurostar-catalog-refreshed')); } catch (e) {}
        }
        return prod;
      })
      .catch(function () { /* offline — keep the cached SKUs */ });
  };

  window.EUROSTAR_CATALOG_READY = Promise.all([
    getJson('/catalog'),
    getJson('/catalog/products'),
    getJson('/admin/catalog/grades'),
    getJson('/admin/thumbs/categories'),
    getJson('/admin/thumbs/shapes'),
    getJson('/admin/product-images'),
    getJson('/admin/catalog/colours'),
    getJson('/admin/catalog/shapes'),
    getJson('/admin/splash'),
    getJson('/admin/pricing-overrides'),
  ])
    .then(function (res) {
      var cat = res[0];
      var prod = res[1];
      var extraGrades = res[2];
      var catThumbs = res[3];
      var shapeThumbs = res[4];
      var productImages = res[5];
      var extraColours = res[6];
      var extraShapes = res[7];
      var splash = res[8];
      var pricingOvr = res[9];

      // Prices, pieces-per-packet and add/remove-size edits made in
      // Admin > Pricing. Loaded before the pads render so a saved edit is live.
      if (pricingOvr && typeof pricingOvr === 'object' && window.setPricingOverrides) {
        window.setPricingOverrides(pricingOvr);
      }

      mirrorToLocal('eurostar-cat-thumbs-v1', catThumbs);
      mirrorToLocal('eurostar-shape-thumbs-v1', shapeThumbs);
      mirrorToLocal('eurostar-product-images-v1', productImages);
      mirrorToLocal('eurostar-extra-colors-v1', extraColours);
      mirrorToLocal('eurostar-extra-shapes-v1', extraShapes);

      // The pop-up is stored as two plain strings (not JSON like the maps
      // above), so it is mirrored separately. Without this the image an
      // operator uploads in Admin never reached a customer's browser: the
      // splash only ever read localStorage, which the server never wrote.
      if (splash && typeof splash === 'object') {
        try {
          if (splash.image) localStorage.setItem('eurostar-splash-image', splash.image);
          else localStorage.removeItem('eurostar-splash-image');
          localStorage.setItem('eurostar-splash-active', splash.active ? '1' : '0');
        } catch (e) { /* quota — keep whatever is cached */ }
      }

      // data.jsx merged the colour/shape overlays from localStorage before this
      // sync ran, so merge the server copies into the live tables here too.
      if (extraColours && typeof extraColours === 'object') {
        Object.keys(extraColours).forEach(function (key) {
          if (!COLORS_BY_CATEGORY[key]) COLORS_BY_CATEGORY[key] = [];
          (extraColours[key] || []).forEach(function (col) {
            if (col && col.id && !COLORS_BY_CATEGORY[key].some(function (c) { return c.id === col.id; }))
              COLORS_BY_CATEGORY[key].push({ id: col.id, name: col.name, hex: col.hex || '#CCCCCC' });
          });
        });
      }
      // Shapes retired from a category. The backend catalog overlay is add-only
      // and still holds these from an earlier seeding, so filter them out here
      // (and strip any that already leaked into the built-in list).
      var DEPRECATED_SHAPES = { laser: ['invisible-square', 'leaf'] };
      Object.keys(DEPRECATED_SHAPES).forEach(function (key) {
        if (!SHAPES_BY_CATEGORY[key]) return;
        DEPRECATED_SHAPES[key].forEach(function (sid) {
          var i = SHAPES_BY_CATEGORY[key].indexOf(sid);
          if (i !== -1) SHAPES_BY_CATEGORY[key].splice(i, 1);
        });
      });
      // The overlay is the operator's WHOLE list for a category, not a list of
      // extras on top of the built-ins: Admin loads it, edits it, and writes the
      // full array back. Merging it in additively meant a shape removed in Admin
      // silently stayed on the storefront — every built-in survived no matter
      // what the operator did. So the overlay replaces the list outright.
      //
      // Safe because the server lifts the built-in union into this overlay on
      // boot (services/catalogOverlays.ts), so the stored array is a superset of
      // what data.jsx ships. A category with no overlay entry is left alone.
      if (extraShapes && typeof extraShapes === 'object') {
        Object.keys(extraShapes).forEach(function (key) {
          var list = extraShapes[key];
          if (!Array.isArray(list)) return;
          var blocked = DEPRECATED_SHAPES[key] || [];
          var next = [];
          list.forEach(function (sid) {
            if (sid && blocked.indexOf(sid) === -1 && next.indexOf(sid) === -1) next.push(sid);
          });
          SHAPES_BY_CATEGORY[key] = next;
        });
      }

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
