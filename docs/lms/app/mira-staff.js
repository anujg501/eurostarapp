// mira-staff.js — Mira as an internal helpdesk widget for the CRM and LMS (vanilla JS, no React).
// Knows the Eurostar systems, respects the Mira Admin training, and logs each chat into the
// CRM/LMS review lists so the office can coach her. Visibility is controlled per-surface by toggles
// set in Mira Admin (localStorage 'eurostar-mira-enabled').
(function () {
  if (window.MiraStaff) return;

  var KNOWLEDGE = "EUROSTAR INTERNAL SYSTEMS GUIDE (for staff only — never share these operational details with customers).\n\n=== SALES APP (customer-facing ordering app reps show customers) ===\n- Ordering flow: Category → Grade → Colour → Shape → Size list → quantity → cart → checkout.\n- Units vary: per piece (pc), per carat (ct), per packet (pkt), per strip. Beads sell by carat, 100 ct minimum, in multiples of 100 ct. Moissanite polki has a +Rs.25/piece foiling charge.\n- Minimum order Rs.1,000 (flat Rs.300 courier at Rs.1,000; free above). Everyone starts on CASH (pay then ship). RFQ Enquiry is for custom items (Rs.10,000 min).\n- Reorder: open any past order then 'Reorder same items'. Offline: orders save offline and auto-sync when back online.\n\n=== CRM (roles: Admin, Back Office, Sales Rep) ===\nSALES REP DESK: Quick Actions bar for one-tap daily tasks.\n- CHECK-IN / CHECK-OUT: check in at a customer — the app captures live GPS location and time. To check out, request check-out then an OTP is sent to the CUSTOMER's phone; the customer gives the rep the OTP to validate it (proof of visit). If not validated by 11:59 pm it shows 'Check-out failed'.\n- LOG PAYMENT (rep side): UPI/bank needs amount + UTR/reference. CASH needs 'Transferred to Head office by', contact, date, amount, and a receipt image. The office then verifies it.\nBACK OFFICE: Order desk shows orders 'Incoming from Sales App' (with which rep/customer). Also ASSIGN leads.\nADMIN: Dashboard; Customers & Payment Terms; Reps; Reports (Outstanding shows Billed / Received / Balance — a confirmed payment reduces the balance automatically); Customer Pipeline (filter by rep for weekly follow-ups); Rep Broadcast; Check leads (Customer Database); ASSIGN leads; Field Visits (rep GPS check-in/out log with customer name + phone).\nLEADS WORKFLOW (Admin/Back Office then 'ASSIGN leads', 3 steps): 1) Upload purchased leads (Excel/CSV). 2) App checks each lead's GST against the Customer Database (falls back to name + city/mobile if no GST); matches are FLAGGED as existing customers and held for approval so reps don't re-visit negotiated accounts. 3) Clean leads are assigned by city (auto-forward) or to an individual rep; flagged leads need admin approval, and 'Approve & assign to…' releases and assigns in one step.\n- REP BROADCAST: Admin then Rep Broadcast — compose a banner (headline, message, badge, optional image) with start and end dates; reps see it once a day.\n\n=== LMS (recruitment + training; roles: Admin and Candidate/Rep) ===\nCANDIDATE/REP FLOW: register, sign confidentiality, choose language, watch training videos, take the MCQ test, see result. Pass mark 70%.\nHIRING HANDOFF: when a candidate passes and is hired, the LMS issues a permanent Rep ID (ES-REP-XX-0001) and 'Onboard to CRM' creates them as an active rep in the CRM (city, ASM/Sales-Head, target, commission), tagged 'FROM LMS'.\nPOST-HIRE KYC (rep does this in the LMS): upload photograph, Aadhaar, PAN (if available), and bank details (account number, bank name, IFSC). Admin views it in the candidate drawer.\nQUESTION BANK (Admin): add questions one by one, or BULK UPLOAD MCQs via CSV/Excel — use the 'Template' button for the columns, fill it, then 'Bulk upload'. Supports MCQ (answer by letter or number) and True/False.\n\nAlways give clear, step-by-step answers and name the exact role/tab/button. If something is outside these systems, say so honestly.";

  var LS = {
    inst: 'eurostar-mira-instructions', rules: 'eurostar-mira-rules',
    know: 'eurostar-mira-knowledge', ex: 'eurostar-mira-examples',
    enabled: 'eurostar-mira-enabled',
    logCrm: 'eurostar-mira-chatlog-crm', logLms: 'eurostar-mira-chatlog-lms'
  };
  function getJSON(k, d) { try { return JSON.parse(localStorage.getItem(k) || d); } catch (e) { return JSON.parse(d); } }
  function setJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  // surface keys: crmRep, crmOffice, crmAdmin, lmsAdmin, lmsRep — default all enabled
  // Server flags win over local defaults, so a toggle in Mira Admin turns the
  // widget on/off for every staff device — not just the one that set it.
  var serverEnabled = null;
  function enabledMap() { return Object.assign({ crmRep: true, crmOffice: true, crmAdmin: true, lmsAdmin: true, lmsRep: true }, getJSON(LS.enabled, '{}'), serverEnabled || {}); }
  function pullEnabled() {
    var API = window.EUROSTAR_API || location.origin;
    fetch(API + '/admin/mira/enabled').then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && typeof d === 'object') { serverEnabled = d; if (els.panel) render(); } }).catch(function () {});
  }
  function surfaceKey(app, role) {
    if (app === 'crm') return role === 'rep' ? 'crmRep' : role === 'office' ? 'crmOffice' : 'crmAdmin';
    return role === 'candidate' || role === 'rep' ? 'lmsRep' : 'lmsAdmin';
  }

  function trainingFacts() {
    var s = '';
    try {
      var inst = localStorage.getItem(LS.inst);
      if (inst && inst.trim()) s += '\n\nADMIN INSTRUCTIONS (highest priority):\n' + inst.trim();
      var rules = getJSON(LS.rules, '[]'); if (rules.length) s += '\n\nCORRECTION RULES (always follow):\n- ' + rules.join('\n- ');
      var know = getJSON(LS.know, '[]'); if (know.length) s += '\n\nKNOWLEDGE BASE:\n' + know.map(function (k) { return '- ' + k.title + ': ' + k.text; }).join('\n');
      var ex = getJSON(LS.ex, '[]'); if (ex.length) s += '\n\nEXAMPLE ANSWERS (match this phrasing):\nQ: ' + ex.map(function (e) { return e.q + '\nA: ' + e.a; }).join('\nQ: ');
    } catch (e) {}
    return s;
  }

  var state = { app: 'crm', role: 'admin', open: false, busy: false, msgs: [], session: 'ST-' + Date.now().toString(36) };
  var els = {};

  function build() {
    var btn = document.createElement('button');
    btn.id = 'mira-staff-btn';
    btn.setAttribute('aria-label', 'Ask Mira');
    btn.innerHTML = '<span style="font-size:20px;line-height:1">\uD83D\uDCAC</span> Ask Mira';
    style(btn, { position: 'fixed', bottom: '22px', right: '22px', zIndex: 9000, height: '52px', paddingLeft: '16px', paddingRight: '20px', borderRadius: '999px', border: 'none', cursor: 'pointer', background: '#0E5C4A', color: '#FDFAF2', display: 'flex', alignItems: 'center', gap: '9px', boxShadow: '0 6px 24px rgba(14,92,74,0.4)', fontFamily: 'inherit', fontWeight: '600', fontSize: '15px' });
    btn.onclick = function () { state.open = true; render(); };

    var panel = document.createElement('div');
    panel.id = 'mira-staff-panel';
    style(panel, { position: 'fixed', bottom: '22px', right: '22px', zIndex: 9001, width: 'min(380px, calc(100vw - 28px))', height: 'min(580px, calc(100vh - 44px))', background: '#FBF8F1', borderRadius: '18px', boxShadow: '0 16px 50px rgba(21,19,15,0.3)', display: 'none', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e4ddcd', fontFamily: 'inherit' });
    panel.innerHTML =
      '<div style="background:#0E5C4A;color:#FDFAF2;padding:13px 15px;display:flex;align-items:center;gap:11px">' +
        '<div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:center;font-size:18px">\uD83D\uDC8E</div>' +
        '<div style="flex:1"><div style="font-weight:700;font-size:15px">Mira \u00b7 Staff Helpdesk</div><div id="mira-staff-sub" style="font-size:11.5px;color:rgba(253,250,242,0.8)">Ask me about this app</div></div>' +
        '<button id="mira-staff-close" aria-label="Close" style="background:transparent;border:none;color:#FDFAF2;cursor:pointer;font-size:20px;padding:4px">\u00d7</button>' +
      '</div>' +
      '<div id="mira-staff-msgs" style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px"></div>' +
      '<div style="padding:11px;border-top:1px solid #ece6da;display:flex;gap:8px;align-items:center;background:#FBF8F1">' +
        '<input id="mira-staff-input" placeholder="Ask about this app\u2026" style="flex:1;min-width:0;padding:10px 13px;border-radius:999px;border:1px solid #d8d2c4;font-family:inherit;font-size:14px;background:#fff;color:#2a2620;outline:none">' +
        '<button id="mira-staff-send" aria-label="Send" style="width:42px;height:42px;border-radius:50%;border:none;cursor:pointer;background:#0E5C4A;color:#fff;font-size:17px;flex:0 0 42px">\u27a4</button>' +
      '</div>';
    document.body.appendChild(btn);
    document.body.appendChild(panel);
    els.btn = btn; els.panel = panel;
    els.msgs = panel.querySelector('#mira-staff-msgs');
    els.input = panel.querySelector('#mira-staff-input');
    els.sub = panel.querySelector('#mira-staff-sub');
    panel.querySelector('#mira-staff-close').onclick = function () { state.open = false; render(); };
    panel.querySelector('#mira-staff-send').onclick = send;
    els.input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });
    if (!state.msgs.length) state.msgs.push({ role: 'assistant', text: 'Hi \uD83D\uDC4B I\u2019m Mira. Ask me how to do anything in this app \u2014 leads, payments, check-in/out, onboarding, the question bank, and more.' });
  }

  function style(el, o) { for (var k in o) el.style[k] = o[k]; }

  function render() {
    if (!els.panel) return;
    var on = enabledMap()[surfaceKey(state.app, state.role)] !== false;
    if (!on) { els.btn.style.display = 'none'; els.panel.style.display = 'none'; return; }
    els.btn.style.display = state.open ? 'none' : 'flex';
    els.panel.style.display = state.open ? 'flex' : 'none';
    if (els.sub) els.sub.textContent = (state.app === 'crm' ? 'CRM' : 'LMS') + ' \u00b7 ' + roleLabel();
    renderMsgs();
  }
  function roleLabel() {
    if (state.app === 'crm') return state.role === 'rep' ? 'Sales Rep' : state.role === 'office' ? 'Back Office' : 'Admin';
    return state.role === 'candidate' || state.role === 'rep' ? 'Rep' : 'Admin';
  }
  function renderMsgs() {
    if (!els.msgs) return;
    els.msgs.innerHTML = state.msgs.map(function (m) {
      var mine = m.role === 'user';
      return '<div style="align-self:' + (mine ? 'flex-end' : 'flex-start') + ';max-width:82%;background:' + (mine ? '#0E5C4A' : '#fff') + ';color:' + (mine ? '#FDFAF2' : '#2a2620') + ';border:' + (mine ? 'none' : '1px solid #e6ddcb') + ';border-radius:14px;padding:9px 13px;font-size:13.7px;line-height:1.5;white-space:pre-wrap">' + esc(m.text) + '</div>';
    }).join('') + (state.busy ? '<div style="align-self:flex-start;background:#fff;border:1px solid #e6ddcb;border-radius:14px;padding:9px 14px;color:#8a8372;font-size:14px">\u2022\u2022\u2022</div>' : '');
    els.msgs.scrollTop = els.msgs.scrollHeight;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }

  function prompt() {
    return 'You are "Mira", Eurostar Technologies\u2019 internal assistant for STAFF \u2014 NOT a customer. The person talking to you is using the ' +
      (state.app === 'crm' ? 'CRM' : 'LMS') + ' as ' + roleLabel() + '. Answer their how-to and policy questions clearly and step by step, naming the exact role, tab and button. Be concise and practical.\n\n' +
      KNOWLEDGE + trainingFacts() + '\n\nReply as Mira to the staff member\u2019s question.';
  }

  function send() {
    var q = (els.input.value || '').trim();
    if (!q || state.busy) return;
    state.msgs.push({ role: 'user', text: q }); els.input.value = ''; state.busy = true; renderMsgs();
    var history = state.msgs.slice(-12).map(function (m) { return (m.role === 'user' ? 'Staff' : 'Mira') + ': ' + m.text; }).join('\n');
    var doReply = function (reply) {
      var clean = (reply || '').replace(/<<[\s\S]*?<<END>>/g, '').trim() || '(no reply)';
      state.msgs.push({ role: 'assistant', text: clean });
      var key = state.app === 'lms' ? LS.logLms : LS.logCrm;
      var lg = getJSON(key, '[]');
      lg.push({ sessionId: state.session, role: roleLabel(), who: roleLabel() + ' (' + (state.app === 'crm' ? 'CRM' : 'LMS') + ')', contact: roleLabel(), q: q, a: clean, ts: Date.now() });
      setJSON(key, lg.slice(-300));
      state.busy = false; renderMsgs();
    };
    if (!(window.claude && window.claude.complete)) { setTimeout(function () { doReply('\u26a0 The AI isn\u2019t connected in this preview. Once the app is wired to your Claude account, I\u2019ll answer here live.'); }, 200); return; }
    window.claude.complete({ messages: [{ role: 'user', content: prompt() + '\n\nConversation so far:\n' + history + '\n\nReply as Mira to the last message. Do NOT output any <<ACTION>> markers.' }] })
      .then(doReply).catch(function () { doReply('\u26a0 I couldn\u2019t reach the assistant just now. Please try again.'); });
  }

  window.MiraStaff = {
    setContext: function (app, role) {
      if (!els.panel) build();
      if (app !== state.app || role !== state.role) { state.app = app; state.role = role; }
      else { state.app = app; state.role = role; }
      render();
    }
  };

  function init() { build(); render(); pullEnabled(); setInterval(pullEnabled, 15000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else { init(); }
})();
