// lms-app.jsx — Eurostar LMS shell (role toggle: Admin / Candidate)
const { useState: sUseState } = React;

function LmsIcon({ name }) {
  const p = { width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const map = {
    dashboard: <><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></>,
    candidates: <><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><path d="M16 8a3 3 0 0 1 0 6"/></>,
    screening: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>,
    approval: <><path d="M9 11l3 3 7-7"/><path d="M21 12a9 9 0 1 1-6-8.5"/></>,
    training: <><path d="M3 5h18v12H3z"/><path d="M10 9l5 3-5 3z"/></>,
    bank: <><path d="M12 3 3 8l9 5 9-5z"/><path d="M3 8v5l9 5 9-5V8"/></>,
    reports: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    notifications: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></>,
  };
  return <svg {...p} viewBox="0 0 24 24">{map[name]}</svg>;
}

const LMS_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'candidates', label: 'Candidates', icon: 'candidates' },
  { id: 'screening', label: 'Screening', icon: 'screening' },
  { id: 'approval', label: 'Approval Queue', icon: 'approval', badgeKey: 'pending' },
  { id: 'training', label: 'Training Content', icon: 'training' },
  { id: 'bank', label: 'Question Bank', icon: 'bank' },
  { id: 'reports', label: 'Reports', icon: 'reports' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications', badgeKey: 'notif' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

function AdminRoot({ cands, actions, questions, testCfg, settings, notifs, audit }) {
  const [page, setPage] = sUseState('dashboard');
  const [drawer, setDrawer] = sUseState(null); // candidate id
  const go = (p) => setPage(p);
  const pending = cands.filter(c => c.stage === 'recommended').length;
  const unread = (notifs || []).filter(n => !n.read).length;
  const openCand = (id) => setDrawer(id);
  const logout = () => {
    if (!window.confirm('Log out of the LMS?')) return;
    try { localStorage.removeItem('eurostar-admin-token'); } catch (e) {}
    location.reload();
  };
  const drawerCand = drawer ? cands.find(c => c.id === drawer) : null;
  let screen;
  if (page === 'dashboard') screen = <LmsDashboard go={go} cands={cands} actions={actions} openCand={openCand} />;
  else if (page === 'candidates') screen = <LmsCandidates cands={cands} actions={actions} openCand={openCand} />;
  else if (page === 'screening') screen = <LmsScreening cands={cands} actions={actions} settings={settings} />;
  else if (page === 'approval') screen = <LmsApproval cands={cands} actions={actions} />;
  else if (page === 'training') screen = <LmsTraining />;
  else if (page === 'bank') screen = <LmsQuestionBank questions={questions} testCfg={testCfg} actions={actions} />;
  else if (page === 'reports') screen = <LmsReports cands={cands} />;
  else if (page === 'notifications') screen = <LmsNotifications notifs={notifs} audit={audit} />;
  else if (page === 'settings') screen = <LmsSettings settings={settings} actions={actions} />;
  const badgeVal = (n) => n.badgeKey === 'pending' ? pending : n.badgeKey === 'notif' ? unread : 0;
  return (
    <>
      <aside className="lms-side">
        <div className="lms-brand"><img src={window.EUROSTAR_LOGO || 'assets/eurostar-logo.jpeg'} alt="Eurostar" /><div><strong style={{ fontSize: 14 }}>LMS Admin</strong><small>Recruitment &amp; Training</small></div></div>
        <nav className="lms-nav">
          <div className="lms-nav-label">Hiring</div>
          {LMS_NAV.map(n => (
            <button key={n.id} className={'lms-nav-item' + (page === n.id ? ' active' : '')} onClick={() => setPage(n.id)}>
              <LmsIcon name={n.icon} />{n.label}
              {n.badgeKey && badgeVal(n) > 0 && <span className="badge">{badgeVal(n)}</span>}
            </button>
          ))}
        </nav>
        <div className="lms-side-foot">
          <button className="lms-nav-item lms-logout" onClick={logout}>
            <LmsIcon name="logout" />Log out
          </button>
        </div>
      </aside>
      <div className="lms-main">
        <div className="lms-mobnav">
          {LMS_NAV.map(n => (
            <button key={n.id} className={'lms-mobnav-item' + (page === n.id ? ' active' : '')} onClick={() => setPage(n.id)}>
              {n.label}{n.badgeKey && badgeVal(n) > 0 && <span className="badge">{badgeVal(n)}</span>}
            </button>
          ))}
          <button className="lms-mobnav-item lms-logout" onClick={logout}>Log out</button>
        </div>
        {screen}
      </div>
      {drawerCand && <LmsCandidateDrawer cand={drawerCand} actions={actions} onClose={() => setDrawer(null)} />}
    </>
  );
}

function LMS() {
  const LMS_INIT_ROLE = (() => { try { const r = new URLSearchParams(location.search).get('role'); return (r === 'candidate' || r === 'rep') ? 'candidate' : 'admin'; } catch (e) { return 'admin'; } })();
  const [role, setRole] = sUseState(LMS_INIT_ROLE);
  const [cands, setCands] = sUseState(() => window.LMS_CANDIDATES.map(c => ({ ...c })));
  const [questions, setQuestions] = sUseState(() => window.LMS_QUESTIONS.map(q => ({ ...q })));
  const [testCfg, setTestCfg] = sUseState(() => ({ ...window.LMS_TEST_CONFIG }));
  const [settings, setSettings] = sUseState(() => ({ ...window.LMS_SETTINGS }));
  const [notifs, setNotifs] = sUseState(() => window.LMS_NOTIFICATIONS.map(n => ({ ...n })));
  const [audit, setAudit] = sUseState(() => window.LMS_AUDIT.map(a => ({ ...a })));
  React.useEffect(() => { if (window.MiraStaff) window.MiraStaff.setContext('lms', role); }, [role]);
  // --- server persistence ---------------------------------------------------
  // The LMS was entirely local state; now every candidate change is saved to
  // the database so the pipeline survives a reload and is shared across devices.
  const lmsApi = (method, path, body) => {
    try {
      const t = localStorage.getItem('eurostar-admin-token') || '';
      const opts = { method, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + t } };
      if (body != null) opts.body = JSON.stringify(body);
      return fetch((window.EUROSTAR_API || location.origin) + path, opts).then(r => r.json().then(d => ({ ok: r.ok, data: d })).catch(() => ({ ok: r.ok, data: null })));
    } catch (e) { return Promise.resolve({ ok: false, data: null }); }
  };
  const persistCand = (cand) => { if (cand && (cand.candId || cand.id)) lmsApi('PUT', '/candidates/' + (cand.candId || cand.id), cand); };
  // Mutate one candidate AND persist the result. All actions route through this.
  const mutate = (id, fn) => setCands(cs => cs.map(c => { if (c.id !== id) return c; const next = fn(c); persistCand(next); return next; }));
  const update = (id, patch) => mutate(id, c => ({ ...c, ...patch }));

  // Load the pipeline from the database on mount. If the database is empty
  // (first run), seed it from the built-in list once, so there is data to work
  // with; afterwards the database is the source of truth.
  React.useEffect(() => {
    lmsApi('GET', '/candidates').then((res) => {
      if (!res.ok || !Array.isArray(res.data)) return;
      if (res.data.length > 0) { setCands(res.data.map(c => ({ ...c }))); return; }
      // Empty DB → bootstrap from the seed, then use the server rows.
      const seed = (window.LMS_CANDIDATES || []);
      Promise.all(seed.map(c => lmsApi('POST', '/candidates', c).then(r => (r.ok && r.data ? r.data : c)))).
        then(rows => setCands(rows.map(c => ({ ...c }))));
    });
  }, []);

  const now = () => new Date(window.LMS_TODAY).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' · now';
  const logAudit = (action, target) => setAudit(a => [{ id: 'A' + Date.now(), actor: 'Admin (Office)', action, target, time: now() }, ...a]);
  const notify = (icon, who, text) => setNotifs(n => [{ id: 'N' + Date.now(), icon, who, text, time: now(), read: false }, ...n]);
  const today = () => window.LMS_TODAY.toISOString().slice(0, 10);

  const actions = {
    unlockTraining: (id) => { update(id, { unlockedOn: today(), stage: 'training' }); const c = cands.find(x => x.id === id); logAudit('Unlocked training', c && c.name); },
    lockTraining: (id) => update(id, { unlockedOn: null }),
    unlockTest: (id) => { update(id, { testUnlockedOn: today(), testConsumed: false }); const c = cands.find(x => x.id === id); notify('🔔', c && c.name, 'Test unlocked — 2-day window started'); logAudit('Unlocked test', c && c.name); },
    lockTest: (id) => update(id, { testUnlockedOn: null }),
    allowRetest: (id) => { update(id, { testUnlockedOn: today(), testConsumed: false, score: null, stage: 'training' }); const c = cands.find(x => x.id === id); logAudit('Granted re-test', c && c.name); },
    consumeTest: (id) => update(id, { testConsumed: true }),
    markWatched: (id, vid) => mutate(id, c => ({ ...c, watched: (c.watched || []).includes(vid) ? c.watched : [...(c.watched || []), vid] })),
    // Screening outcome
    markScreen: (id, result, note, rating) => mutate(id, c => ({ ...c, screenResult: result, screenNote: note, screenRating: rating, stage: result === 'fail' ? 'rejected' : (c.stage === 'applied' ? 'screening' : c.stage), rejectReason: result === 'fail' ? 'Did not clear screening interview' : c.rejectReason })),
    setScore: (id, score) => mutate(id, c => {
      const n = (c.attempts || []).length + 1;
      const passed = score >= testCfg.passPct;
      const attempts = [...(c.attempts || []), { n, score, date: new Date(window.LMS_TODAY).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), passed }];
      if (passed) notify('✅', c.name, `Cleared the assessment with ${score}% — awaiting approval`);
      return { ...c, score, attempts, testConsumed: true, stage: passed ? 'recommended' : c.stage };
    }),
    hire: (id) => {
      const c = cands.find(x => x.id === id);
      if (!c) return;
      const rid = window.lmsNextRepId(cands, c);
      const pwd = c.tempPassword || window.lmsGenPassword();
      notify('🎉', c.name, `Hired · Rep ID ${rid} issued — WhatsApp sent to staff (${settings.staffWhatsApp})`);
      logAudit('Hired & issued Rep ID ' + rid, c.name);
      mutate(id, x => ({ ...x, stage: 'hired', repId: rid, tempPassword: pwd, onboarding: { ...(x.onboarding || {}), confidentiality: x.onboarding && x.onboarding.confidentiality } }));
    },
    reject: (id, reason) => { update(id, { stage: 'rejected', rejectReason: reason || 'Not a fit' }); const c = cands.find(x => x.id === id); logAudit('Rejected — ' + (reason || 'Not a fit'), c && c.name); },
    onboardToCrm: (id, form) => {
      const cand = cands.find(x => x.id === id);
      const rec = cand ? { id: cand.repId, name: cand.name, region: form.region || cand.state || '', city: form.city || cand.city || '',
        phone: cand.phone || '', rate: (parseFloat(form.rate) || 4) / 100, joined: String(new Date().getFullYear()),
        target: parseInt(form.target, 10) || 50, addedThisMonth: 0, asm: form.asm || 'L1', head: form.head || 'L2',
        fromLms: true, hiredOn: window.LMS_TODAY || new Date().toISOString().slice(0, 10) } : null;
      mutate(id, c => ({ ...c, onboarding: { ...(c.onboarding || {}), crmSynced: true, crmCity: form.city || c.city, crmRegion: form.region || c.state } }));
      // Create the rep's real CRM record AND a login account, so the hire can
      // actually sign into the CRM. The api-bridge already mirrors this key to
      // POST /reps; the extra call here creates the User login the bridge never did.
      if (rec && rec.id) {
        // Login first, then its rep settings (the settings write finds the user
        // by repId, so it must exist). A 409 (already created) is harmless.
        lmsApi('POST', '/users', { role: 'rep', name: rec.name, username: rec.id, password: (cand && cand.tempPassword) || undefined }).
          then(() => lmsApi('PUT', '/reps/' + rec.id, { commissionPct: (rec.rate || 0.04) * 100, region: rec.region || '', phoneNote: rec.phone || '' }));
      }
      try {
        const k = 'eurostar-crm-new-hires';
        const arr = JSON.parse(localStorage.getItem(k) || '[]');
        if (rec && !arr.some(r => r.id === rec.id)) { arr.push(rec); localStorage.setItem(k, JSON.stringify(arr)); }
      } catch (e) {}
      const c = cands.find(x => x.id === id);
      logAudit('Onboarded to CRM as active rep ' + (c && c.repId), c && c.name);
      notify('🔗', c && c.name, 'Onboarded to CRM — now an active rep (auto-forwarding leads in ' + (form.city || (c && c.city)) + ')');
    },
    syncCrm: (id) => { mutate(id, c => ({ ...c, onboarding: { ...(c.onboarding || {}), crmSynced: true } })); const c = cands.find(x => x.id === id); logAudit('Synced rep to CRM', c && c.name); },
    setOnboarding: (id, patch) => mutate(id, c => ({ ...c, onboarding: { ...(c.onboarding || {}), ...patch } })),
    signConfidentiality: (id) => mutate(id, c => ({ ...c, onboarding: { ...(c.onboarding || {}), confidentiality: true } })),
    // question bank
    saveQuestion: (q) => setQuestions(qs => {
      if (q.id) return qs.map(x => x.id === q.id ? { ...q } : x);
      const num = qs.reduce((m, x) => Math.max(m, +(/Q(\d+)/.exec(x.id) || [])[1] || 0), 0) + 1;
      return [...qs, { ...q, id: 'Q' + num }];
    }),
    deleteQuestion: (id) => setQuestions(qs => qs.filter(x => x.id !== id)),
    bulkAddQuestions: (items) => setQuestions(qs => {
      let num = qs.reduce((m, x) => Math.max(m, +(/Q(\d+)/.exec(x.id) || [])[1] || 0), 0);
      const add = items.map(it => { num++; return { ...it, id: 'Q' + num }; });
      logAudit('Bulk-added ' + add.length + ' question(s) to the bank', 'Question Bank');
      return [...qs, ...add];
    }),
    saveTestConfig: (patch) => setTestCfg(c => ({ ...c, ...patch })),
    saveSettings: (patch) => setSettings(s => ({ ...s, ...patch })),
  };
  return (
    <div>
      <div className="lms-role-fab" style={{ position: 'fixed', top: 14, right: 16, zIndex: 100 }}>
        <div className="lms-role" style={{ boxShadow: 'var(--shadow-md)' }}>
          <button className={role === 'admin' ? 'active' : ''} onClick={() => setRole('admin')}>Admin (Office)</button>
          <button className={role === 'candidate' ? 'active' : ''} onClick={() => setRole('candidate')}>Candidate (Rep)</button>
        </div>
      </div>
      {role === 'admin'
        ? <div className="lms-shell"><AdminRoot cands={cands} actions={actions} questions={questions} testCfg={testCfg} settings={settings} notifs={notifs} audit={audit} /></div>
        : <CandidateApp cands={cands} actions={actions} questions={questions} testCfg={testCfg} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<LMS />);
