// Eurostar admin login gate
// ---------------------------------------------------------------------------
// The CRM and LMS are staff/admin tools. This gate puts a sign-in wall in
// front of them: until an admin logs in (office account, via the back room's
// /auth/login), the app stays covered by a full-screen login card. No public
// registration — admin accounts are created by you (SEED_OFFICE_USER /
// SEED_OFFICE_PASSWORD in the back room), never self-served.
(function () {
  var API =
    window.EUROSTAR_API ||
    (/^(localhost|127\.|0\.0\.0\.0)/.test(location.hostname) ? location.origin : 'https://eurostar-api.onrender.com');

  // Which admin tool is this?
  var app = 'Admin';
  if (/\/crm\//.test(location.pathname)) app = 'CRM';
  else if (/\/lms\//.test(location.pathname)) app = 'LMS';
  var TOKEN_KEY = 'eurostar-admin-token';

  function token() { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } }
  function setToken(t) { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch (e) {} }

  // ---- styles ----
  var css =
    '#eg-gate{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:20px;' +
    'background:radial-gradient(1200px 800px at 70% -10%,#0f5c4a 0%,#0a3f33 55%,#08322a 100%);font-family:Georgia,"Times New Roman",serif;}' +
    '#eg-gate *{box-sizing:border-box;}' +
    '#eg-card{width:100%;max-width:400px;background:#FDFAF2;border:1px solid #D7CCB1;border-radius:18px;padding:32px 28px;' +
    'box-shadow:0 30px 80px rgba(0,0,0,.45);animation:egup .4s ease;}' +
    '@keyframes egup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}' +
    '#eg-brand{font-size:26px;font-weight:700;letter-spacing:.5px;color:#0E5C4A;margin:0 0 2px;}' +
    '#eg-sub{color:#7A6F5C;font-size:13.5px;margin:0 0 22px;}' +
    '.eg-tag{display:inline-block;background:#D9E8E0;color:#0A3F33;font-size:11px;font-weight:700;text-transform:uppercase;' +
    'letter-spacing:.6px;padding:3px 9px;border-radius:99px;margin-bottom:14px;font-family:Arial,sans-serif;}' +
    '.eg-label{display:block;color:#7A6F5C;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;' +
    'margin:14px 0 6px;font-family:Arial,sans-serif;}' +
    '.eg-input{width:100%;background:#F6F1E6;border:1px solid #D7CCB1;border-radius:9px;padding:12px 13px;font-size:15px;' +
    'color:#15130F;font-family:Arial,sans-serif;outline:none;}' +
    '.eg-input:focus{border-color:#0E5C4A;box-shadow:0 0 0 3px rgba(14,92,74,.12);}' +
    '#eg-btn{width:100%;margin-top:22px;background:#0E5C4A;color:#F6F1E6;border:none;border-radius:99px;padding:13px;' +
    'font-size:15px;font-weight:700;font-family:Arial,sans-serif;cursor:pointer;transition:background .15s;}' +
    '#eg-btn:hover{background:#0A3F33;}#eg-btn:disabled{opacity:.6;cursor:default;}' +
    '#eg-err{color:#8B1E2E;font-size:13px;margin-top:12px;min-height:16px;font-family:Arial,sans-serif;}' +
    '#eg-note{color:#9A8E78;font-size:11.5px;margin-top:18px;text-align:center;font-family:Arial,sans-serif;line-height:1.5;}';

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }

  function mount() {
    var style = el('style'); style.textContent = css; document.head.appendChild(style);

    var gate = el('div', { id: 'eg-gate' });
    gate.innerHTML =
      '<div id="eg-card" role="dialog" aria-modal="true">' +
      '<span class="eg-tag">' + app + ' &middot; Staff area</span>' +
      '<h1 id="eg-brand">eurostar</h1>' +
      '<p id="eg-sub">Sign in to open the ' + app + '.</p>' +
      '<form id="eg-form">' +
      '<label class="eg-label" for="eg-user">Username</label>' +
      '<input class="eg-input" id="eg-user" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="e.g. office" />' +
      '<label class="eg-label" for="eg-pass">Password</label>' +
      '<input class="eg-input" id="eg-pass" type="password" autocomplete="current-password" placeholder="Your password" />' +
      '<button id="eg-btn" type="submit">Sign in</button>' +
      '<div id="eg-err"></div>' +
      '</form>' +
      '<p id="eg-note">Staff access only. No public sign-up &mdash; ask your administrator for an account.</p>' +
      '</div>';
    document.body.appendChild(gate);
    document.body.style.overflow = 'hidden';

    var form = gate.querySelector('#eg-form');
    var userI = gate.querySelector('#eg-user');
    var passI = gate.querySelector('#eg-pass');
    var btn = gate.querySelector('#eg-btn');
    var err = gate.querySelector('#eg-err');
    setTimeout(function () { userI.focus(); }, 60);

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      err.textContent = '';
      var userId = (userI.value || '').trim();
      var password = passI.value || '';
      if (!userId || !password) { err.textContent = 'Enter your username and password.'; return; }
      btn.disabled = true; btn.textContent = 'Signing in…';
      fetch(API + '/auth/login', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role: 'office', userId: userId, password: password, remember: true }),
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (!res.ok || !res.d || !res.d.accessToken) { throw new Error((res.d && res.d.error) || 'Wrong username or password'); }
          setToken(res.d.accessToken);
          reveal();
        })
        .catch(function (e) {
          btn.disabled = false; btn.textContent = 'Sign in';
          err.textContent = e.message || 'Could not sign in. Please try again.';
        });
    });
  }

  function reveal() {
    var g = document.getElementById('eg-gate');
    if (g) g.parentNode.removeChild(g);
    document.body.style.overflow = '';
    window.__eurostarAdmin = true;
  }

  // Boot: if we already have a valid staff session, skip the gate; else show it.
  function boot() {
    var t = token();
    if (!t) { mount(); return; }
    fetch(API + '/auth/me', { headers: { authorization: 'Bearer ' + t } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (u) {
        if (u && (u.role === 'office' || u.role === 'rep')) { window.__eurostarAdmin = true; return; }
        setToken(null); mount();
      })
      .catch(function () { mount(); }); // offline: show the gate to be safe
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
