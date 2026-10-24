/* Meta (Facebook) Pixel — Eurostar storefront.
 *
 * Loads the pixel once and fires PageView on load. Included only on the
 * customer-facing pages (shop, login, landing), never the Admin/CRM, so staff
 * activity is not tracked.
 *
 * window.fbqTrack(event, params) is a safe wrapper the app uses to fire standard
 * events (ViewContent, AddToCart, InitiateCheckout, Purchase). It no-ops if the
 * pixel is blocked (ad-blocker) so it can never break the page.
 */
(function (f, b, e, v, n, t, s) {
  if (f.fbq) return;
  n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
  if (!f._fbq) f._fbq = n;
  n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
  t = b.createElement(e); t.async = !0; t.src = v;
  s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
}(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js'));

try {
  fbq('init', '1337850241639310');
  fbq('track', 'PageView');
} catch (e) { /* pixel blocked — ignore */ }

// Safe helper for the app to fire standard events without risking a crash.
window.fbqTrack = function (event, params) {
  try { if (window.fbq) window.fbq('track', event, params || {}); } catch (e) {}
};
