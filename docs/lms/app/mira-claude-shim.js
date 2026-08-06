// Mira ↔ back room shim
// ---------------------------------------------------------------------------
// The apps' Mira chat calls window.claude.complete({messages}). In the Claude
// design preview that was provided for you; on the live site it isn't, so Mira
// would go "offline". This shim provides window.claude.complete backed by the
// back room's /assistant/chat endpoint (which uses your Claude API key and the
// instructions you set in Mira Admin). No change to the apps' chat code.
(function () {
  if (window.claude && typeof window.claude.complete === 'function') return; // preview already provides it

  var API = location.origin;

  // Which app is this (for per-app chat logs)?
  var app = 'sales';
  if (/\/crm\//.test(location.pathname)) app = 'crm';
  else if (/\/lms\//.test(location.pathname)) app = 'lms';

  if (!window.__miraSession) {
    window.__miraSession = 'mira-' + Math.random().toString(36).slice(2) + '-' + (window.performance ? Math.round(performance.now()) : 0);
  }

  // Which screen the staff member is on, so "why is this blocked?" answers
  // about the record in front of them instead of asking which one.
  //
  // An app can set window.__miraPage itself for the precise answer; failing
  // that, the page heading and the highlighted nav item say enough, and cost
  // these apps no changes at all.
  function wherePage() {
    try {
      if (typeof window.__miraPage === 'string' && window.__miraPage.trim()) return window.__miraPage.trim().slice(0, 600);
      var bits = [];
      var head = document.querySelector('.crm-body h2, .lms-body h2, h1');
      if (head && head.textContent.trim()) bits.push(head.textContent.trim());
      var active = document.querySelector('.nav-item.active, .crm-nav .active, .lms-nav .active, nav .active');
      if (active && active.textContent.trim() && bits.indexOf(active.textContent.trim()) === -1) {
        bits.push('nav: ' + active.textContent.trim());
      }
      // A record open in a drawer or dialog is usually what the question is about.
      var open = document.querySelector('.lms-drawer h3, .crm-drawer h3, [role="dialog"] h3');
      if (open && open.textContent.trim()) bits.push('open: ' + open.textContent.trim());
      if (!bits.length) return '';
      return (app === 'crm' ? 'Eurostar CRM — ' : app === 'lms' ? 'Eurostar LMS admin — ' : 'Eurostar — ') + bits.join(' · ');
    } catch (e) { return ''; }
  }

  function authHeaders() {
    var h = { 'content-type': 'application/json' };
    try {
      var t = localStorage.getItem('eurostar-admin-token');
      if (t) h.authorization = 'Bearer ' + t;
    } catch (e) {}
    return h;
  }

  window.claude = {
    complete: function (opts) {
      var messages = (opts && opts.messages) || [];
      var message = messages.map(function (m) { return m && m.content ? m.content : ''; }).join('\n\n').trim();
      return fetch(API + '/assistant/chat', {
        method: 'POST',
        // Signed in as staff, so say so. The back room decides what Mira may
        // know from this token — a chat with no token is treated as a customer
        // and never sees back-office figures.
        headers: authHeaders(),
        body: JSON.stringify({ sessionId: window.__miraSession, message: message, app: app, page: wherePage() }),
      })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { return (d && d.reply) || "I couldn't reach the assistant just now. Please try again."; })
        .catch(function () { return "I couldn't reach the assistant just now. Please try again in a moment."; });
    },
  };
  // eslint-disable-next-line no-console
  console.log('[Eurostar] Mira chat wired to back room →', API, '(app: ' + app + ')');
})();
