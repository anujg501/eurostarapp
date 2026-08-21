/*
 * Google Analytics 4 — Eurostar storefront.
 *
 * ONE place to manage tracking: paste your GA4 Measurement ID below (it looks
 * like "G-XXXXXXXXXX", from Google Analytics → Admin → Data streams → your web
 * stream). Until a real ID is set here, this file does nothing — no network
 * calls, no cookies — so it is safe to ship dormant.
 *
 * This loads the standard gtag.js tag on whichever pages include
 * <script src="ga4.js"></script> (path adjusted per folder). GA4's built-in
 * "Enhanced measurement" then records page views, scrolls, outbound clicks,
 * site search and file downloads automatically.
 *
 * These apps are single-page (React), so navigating between screens does not
 * reload the page. eurostarTrackPage(path, title) below lets the app report
 * those in-app screen changes as page views; call it on screen change if you
 * want per-screen traffic. window.eurostarTrack(name, params) sends any custom
 * event (e.g. add_to_cart, begin_checkout) for later e-commerce reporting.
 */
(function () {
  // ▼▼▼ PASTE YOUR GA4 MEASUREMENT ID HERE ▼▼▼
  var GA4_ID = 'G-BXWLN26K62';
  // ▲▲▲ e.g. 'G-ABCD123456' — leave the placeholder to keep analytics off ▲▲▲

  // Guard: stay completely inert until a real ID is set (placeholder still has X's).
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
  // send_page_view stays on (default) so the first load is counted automatically.
  gtag('config', GA4_ID);

  var tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_ID);
  (document.head || document.documentElement).appendChild(tag);

  // Report an in-app screen change as a page view (single-page apps only).
  window.eurostarTrackPage = function (path, title) {
    try {
      gtag('event', 'page_view', {
        page_path: path || (location.pathname + location.hash),
        page_title: title || document.title,
        page_location: location.href,
      });
    } catch (e) {}
  };

  // Fire a custom event, e.g. eurostarTrack('add_to_cart', { value: 41600, currency: 'INR' }).
  window.eurostarTrack = function (name, params) {
    try { gtag('event', name, params || {}); } catch (e) {}
  };
})();
