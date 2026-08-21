/*
 * Google Analytics 4 — Eurostar storefront.
 *
 * ONE place to manage tracking: the GA4 Measurement ID below (it looks like
 * "G-XXXXXXXXXX", from Google Analytics → Admin → Data streams → your web
 * stream). Until a real ID is set here, gtag does NOT load — no network calls,
 * no cookies — but the eurostar* helpers below always exist as safe no-ops so
 * the app can call them unconditionally.
 *
 * This loads the standard gtag.js tag on whichever pages include
 * <script src="ga4.js"></script>. GA4's built-in "Enhanced measurement" then
 * records page views, scrolls, outbound clicks, site search and downloads
 * automatically. The storefront also reports the e-commerce funnel:
 *   add_to_cart  → begin_checkout → purchase
 * so Google Analytics can show browse → cart → checkout → order (and, with the
 * CRM's abandoned-cart list, where customers drop off).
 */
(function () {
  // ▼▼▼ GA4 MEASUREMENT ID ▼▼▼
  var GA4_ID = 'G-BXWLN26K62';
  // ▲▲▲ e.g. 'G-ABCD123456' — leave a placeholder with X's to keep analytics off ▲▲▲

  // --- Cart → GA4 e-commerce helpers (always defined, active or not) ----------
  function lineValue(l) {
    if (!l) return 0;
    if (l.lineTotal != null) return l.lineTotal || 0;
    return ((l.unitPrice || l.price || 0) * (l.qty || 1)) || 0;
  }
  function itemOf(l) {
    l = l || {};
    var variant = [l.quality, l.color, l.shape, l.size].filter(Boolean).join(' · ');
    var it = {
      item_name: l.name || 'Item',
      quantity: l.qty || 1,
      price: l.unitPrice || l.price || 0,
    };
    if (variant) it.item_variant = variant;
    if (l.cat || l.category) it.item_category = l.cat || l.category;
    return it;
  }
  window.eurostarCartValue = function (cart) {
    return (cart || []).reduce(function (s, l) { return s + lineValue(l); }, 0);
  };
  window.eurostarCartItems = function (cart) {
    return (cart || []).map(itemOf);
  };
  window.eurostarLineValue = lineValue;
  window.eurostarLineItem = itemOf;

  // Guard: stay inert (helpers are no-ops) until a real ID is set.
  if (!GA4_ID || GA4_ID.indexOf('G-') !== 0 || /X{3,}/i.test(GA4_ID)) {
    window.eurostarTrack = function () {};
    window.eurostarTrackPage = function () {};
    return;
  }

  // Standard gtag.js bootstrap.
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA4_ID); // send_page_view stays on → first load counted automatically

  var tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_ID);
  (document.head || document.documentElement).appendChild(tag);

  // Report an in-app screen change as a page view (single-page apps).
  window.eurostarTrackPage = function (path, title) {
    try {
      gtag('event', 'page_view', {
        page_path: path || (location.pathname + location.hash),
        page_title: title || document.title,
        page_location: location.href,
      });
    } catch (e) {}
  };

  // Fire a custom / e-commerce event, e.g.
  //   eurostarTrack('add_to_cart', { currency:'INR', value: 41600, items:[...] })
  window.eurostarTrack = function (name, params) {
    try { gtag('event', name, params || {}); } catch (e) {}
  };
})();
