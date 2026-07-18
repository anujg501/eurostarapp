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

  window.claude = {
    complete: function (opts) {
      var messages = (opts && opts.messages) || [];
      var message = messages.map(function (m) { return m && m.content ? m.content : ''; }).join('\n\n').trim();
      return fetch(API + '/assistant/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: window.__miraSession, message: message, app: app }),
      })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { return (d && d.reply) || "I couldn't reach the assistant just now. Please try again."; })
        .catch(function () { return "I couldn't reach the assistant just now. Please try again in a moment."; });
    },
  };
  // eslint-disable-next-line no-console
  console.log('[Eurostar] Mira chat wired to back room →', API, '(app: ' + app + ')');
})();
