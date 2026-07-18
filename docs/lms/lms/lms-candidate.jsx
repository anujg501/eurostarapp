// lms-candidate.jsx — Eurostar LMS candidate app (purple mobile)
const { useState: cUseState } = React;

function CandIcon({ name }) {
  const p = { width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'user') return <svg {...p} viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>;
  if (name === 'mail') return <svg {...p} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>;
  if (name === 'lock') return <svg {...p} viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>;
  if (name === 'phone') return <svg {...p} viewBox="0 0 24 24"><path d="M5 4h4l2 5-3 2a14 14 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>;
  if (name === 'city') return <svg {...p} viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h.01M15 16h.01"/></svg>;
  if (name === 'menu') return <svg {...p} viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
  if (name === 'play') return <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>;
  if (name === 'back') return <svg {...p} viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>;
  if (name === 'doc') return <svg {...p} viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>;
  return null;
}

function CandShell({ children, onMenu }) {
  return (
    <div className="cand-stage">
      <div className="cand-phone">
        <div className="cand-statusbar" />
        <div className="cand-scroll">{children}</div>
      </div>
    </div>
  );
}

// ---- Create account / login ----
function CandAuth({ mode, setMode, onDone }) {
  const reg = mode === 'register';
  // DEMO ONLY: pre-filled + mobile pre-verified so Register works in one click.
  // Bright Code: start phone empty and otpStage 'idle' for the real app.
  const [phone, setPhone] = cUseState('7710065480');
  const [otpStage, setOtpStage] = cUseState('verified');
  const [otp, setOtp] = cUseState(['1', '2', '3', '4']);
  const validPhone = /^[6-9]\d{9}$/.test(phone);
  const otpFull = otp.join('').length === 4;
  const setDigit = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = otp.slice(); next[i] = v; setOtp(next);
    if (v && i < 3) { const el = document.getElementById('otp-' + (i + 1)); if (el) el.focus(); }
  };
  const canSubmit = reg ? (validPhone && otpStage === 'verified') : true;
  return (
    <div className="cand-pad">
      <div className="cand-logo"><img src={window.EUROSTAR_LOGO_PNG || 'assets/eurostar-logo.png'} alt="Eurostar" /></div>
      <div className="cand-h1">{reg ? 'Create Account' : 'Welcome Back!'}</div>
      <p className="cand-sub">{reg ? 'Register to continue' : 'Please login to your account'}</p>
      {reg && <>
        <div className="cand-label">First Name</div>
        <div className="cand-ipt-wrap"><span className="ic"><CandIcon name="user" /></span><input className="cand-ipt" defaultValue="Anuj" /></div>
        <div className="cand-label">Last Name</div>
        <div className="cand-ipt-wrap"><span className="ic"><CandIcon name="user" /></span><input className="cand-ipt" placeholder="Last name" defaultValue="Gupta" /></div>
        <div className="cand-label">Mobile Number</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <div className="cand-ipt-wrap" style={{ flex: 1 }}>
            <span className="ic"><CandIcon name="phone" /></span>
            <input className={'cand-ipt' + (otpStage === 'verified' ? ' locked' : '')} inputMode="numeric" maxLength={10} placeholder="10-digit mobile" value={phone}
              onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setOtpStage('idle'); setOtp(['', '', '', '']); }}
              readOnly={otpStage === 'verified'} />
            {otpStage === 'verified' && <span className="lock" style={{ color: 'var(--lms-green)' }}>✓</span>}
          </div>
          {otpStage !== 'verified' &&
            <button type="button" className="cand-btn" style={{ width: 'auto', padding: '0 16px', fontSize: 13.5, opacity: validPhone ? 1 : .5 }}
              onClick={() => validPhone && setOtpStage('sent')} disabled={!validPhone}>
              {otpStage === 'sent' ? 'Resend' : 'Send OTP'}
            </button>}
        </div>
        {otpStage === 'sent' && <>
          <div style={{ background: 'var(--lms-purple-soft)', border: '1px solid #DDD0F5', borderRadius: 12, padding: '12px 14px', marginTop: 12, fontSize: 13, color: 'var(--lms-purple-ink)' }}>
            OTP sent to <b>+91 {phone}</b>. For this demo, enter any 4 digits.
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'center' }}>
            {otp.map((d, i) => (
              <input key={i} id={'otp-' + i} className="cand-ipt" style={{ width: 54, textAlign: 'center', fontSize: 20, fontWeight: 700, padding: '12px 0' }}
                inputMode="numeric" maxLength={1} value={d} onChange={e => setDigit(i, e.target.value)} />
            ))}
          </div>
          <button type="button" className="cand-btn green" style={{ marginTop: 14, opacity: otpFull ? 1 : .5 }} disabled={!otpFull} onClick={() => setOtpStage('verified')}>Verify OTP</button>
        </>}
        {otpStage === 'verified' &&
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, color: 'var(--lms-green-ink)', fontSize: 13.5, fontWeight: 600 }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--lms-green)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✓</span>
            Mobile number verified
          </div>}
      </>}
      <div className="cand-label">Email Address</div>
      <div className="cand-ipt-wrap"><span className="ic"><CandIcon name="mail" /></span><input className="cand-ipt" placeholder="you@email.com" defaultValue="anujg501@gmail.com" /></div>
      <div className="cand-label">Password</div>
      <div className="cand-ipt-wrap"><span className="ic"><CandIcon name="lock" /></span><input className="cand-ipt" type="password" defaultValue="•••••" /></div>
      {!reg && <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, margin: '14px 2px 0' }}><input type="checkbox" defaultChecked /> Remember me</label>}
      <div style={{ marginTop: 20 }}><button className="cand-btn" onClick={() => canSubmit && onDone()} disabled={!canSubmit} style={!canSubmit ? { opacity: .5 } : {}}>{reg ? 'Register' : 'Sign In'}</button></div>
      {reg && !canSubmit && <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--lms-meta)', marginTop: 10 }}>Verify your mobile number to register.</p>}
      <div className="cand-link">
        {reg ? <>Already have an account? <b onClick={() => setMode('login')}>Login</b></>
             : <>New here? <b onClick={() => setMode('register')}>Create account</b></>}
      </div>
    </div>
  );
}

// ---- Candidate dashboard (5 tiles) ----
function CandDashboard({ cand, go }) {
  const J = window.LMS_JOURNEY;
  const w = window.lmsWindow(cand);
  const t = window.lmsTestWindow(cand);
  const trainOpen = w.state === 'open' || cand.stage === 'hired';
  const testOpen = t.state === 'open';
  // gate each tile
  const isLocked = (id) => {
    if (id === 'apply' || id === 'status') return false;
    if (id === 'training') return !trainOpen;
    if (id === 'test') return !testOpen;
    if (id === 'result') return cand.score == null;
    return false;
  };
  const hired = cand.stage === 'hired';
  return (
    <>
      <div className="cand-appbar">
        <button className="menu"><CandIcon name="menu" /></button>
        <div><h3>Dashboard</h3><small>Hey {cand.name.split(' ')[0]} 👋 · <b style={{ fontFamily: 'monospace', color: 'var(--lms-purple-ink)' }}>{cand.candId}</b></small></div>
      </div>
      <div className="cand-pad">
        {hired && (
          <div style={{ background: 'linear-gradient(135deg,#15803D,#0F5C2C)', color: '#fff', borderRadius: 16, padding: '16px 18px', marginBottom: 16 }}>
            <div style={{ fontSize: 12.5, opacity: .85 }}>🎉 You're hired! Your permanent Rep ID</div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '.04em', fontFamily: 'monospace', marginTop: 4 }}>{cand.repId}</div>
            <div style={{ fontSize: 12, opacity: .85, marginTop: 4 }}>Use this ID to log in to the CRM &amp; Sales App. It never changes.</div>
            <button className="cand-btn" style={{ marginTop: 12, background: '#fff', color: 'var(--lms-green-ink)' }} onClick={() => go('onboarding')}>{(cand.onboarding && cand.onboarding.confidentiality && cand.onboarding.docs && window.LMS_ONBOARD_DOCS.every(d => cand.onboarding.docs[d.id])) ? '✓ Onboarding complete — view' : 'Complete onboarding →'}</button>
          </div>
        )}
        {!hired && (
          <div style={{ borderRadius: 14, padding: '13px 15px', marginBottom: 12, fontSize: 13,
            background: w.state === 'open' ? '#FBF3DF' : w.state === 'expired' ? '#F6E7E7' : '#EEF0F3',
            border: '1px solid ' + (w.state === 'open' ? '#EAD9AE' : w.state === 'expired' ? '#E6C9C9' : '#DDE0E5'),
            color: w.state === 'open' ? '#8A6314' : w.state === 'expired' ? '#9A3B3B' : '#566' }}>
            {w.state === 'open' && <><b>Training unlocked · {w.daysLeft} day{w.daysLeft === 1 ? '' : 's'} left.</b> Finish your training before the window closes.</>}
            {w.state === 'expired' && <><b>Your training window has expired.</b> Please contact the Eurostar office to re-open access.</>}
            {w.state === 'locked' && <><b>Training is locked.</b> The office will unlock your {window.LMS_WINDOW_DAYS}-day training window once your screening is done.</>}
          </div>
        )}
        {!hired && cand.score == null && (
          <div style={{ borderRadius: 14, padding: '13px 15px', marginBottom: 16, fontSize: 13,
            background: testOpen ? '#E8F0FB' : t.state === 'used' ? '#F6E9D6' : t.state === 'expired' ? '#F6E7E7' : '#EEF0F3',
            border: '1px solid ' + (testOpen ? '#C6D8F2' : t.state === 'used' ? '#E6CFA6' : t.state === 'expired' ? '#E6C9C9' : '#DDE0E5'),
            color: testOpen ? '#1D4ED8' : t.state === 'used' ? '#9A6B12' : t.state === 'expired' ? '#9A3B3B' : '#566' }}>
            {testOpen && <><b>Test unlocked · {t.daysLeft} day{t.daysLeft === 1 ? '' : 's'} left.</b> ⚠️ One attempt only — once you start, finish in a single sitting.</>}
            {t.state === 'used' && <><b>Test attempt used.</b> You left the test before finishing. Contact the office to request a re-test.</>}
            {t.state === 'expired' && <><b>Test window expired.</b> Contact the office to re-open it.</>}
            {t.state === 'locked' && <><b>Test is locked.</b> The office unlocks it separately — you'll get {window.LMS_TEST_DAYS} days to take it.</>}
          </div>
        )}
        <div className="cand-tiles">
          {J.map((t2) => {
            const locked = isLocked(t2.id);
            return (
              <button key={t2.id} className={'cand-tile' + (locked ? ' locked' : '')} onClick={() => !locked && go(t2.id)}>
                {locked && <span className="lock"><CandIcon name="lock" /></span>}
                {!locked && t2.id === 'training' && w.state === 'open' && <span className="lock" style={{ background: '#FCEBC8', color: '#8A6314', width: 'auto', padding: '0 7px', fontSize: 11, fontWeight: 700 }}>{w.daysLeft}d</span>}
                {!locked && t2.id === 'test' && testOpen && <span className="lock" style={{ background: '#D6E4FB', color: '#1D4ED8', width: 'auto', padding: '0 7px', fontSize: 11, fontWeight: 700 }}>{t.daysLeft}d</span>}
                <span className="tic" style={{ background: `hsl(${t2.hue} 70% 94%)`, color: `hsl(${t2.hue} 60% 42%)` }}>{t2.icon}</span>
                <span className="tname">{t2.label}</span>
                <span style={{ fontSize: 12, color: 'var(--lms-meta)' }}>{t2.desc}</span>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 18, border: '1px solid #E6C9C9', background: '#FBF1F1', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flex: '0 0 auto' }}>⚠️</span>
          <div style={{ fontSize: 12, color: '#9A3B3B', lineHeight: 1.5 }}>
            <b>Confidential.</b> All prices, product data, training material and customer information shown here are the property of Eurostar. Sharing, copying, screenshotting or forwarding any of it to outsiders is strictly prohibited and will lead to <b>termination and legal action</b>.
          </div>
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--lms-meta)', textAlign: 'center', marginTop: 16 }}>🔒 Training &amp; Test unlock separately when the office opens them. Toggle to <b>Admin → Candidates</b> to unlock and watch these update live.</p>
      </div>
    </>
  );
}

// ---- Apply Now form ----
function CandApply({ go }) {
  return (
    <>
      <div className="cand-appbar">
        <button className="menu" onClick={() => go('home')}><CandIcon name="back" /></button>
        <div><h3>Apply Now</h3></div>
      </div>
      <div className="cand-pad">
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Apply — Field Sales Representative</div>
          <div className="cand-sub" style={{ marginBottom: 0 }}>Eurostar Gemstones · Pan-India Openings</div>
        </div>
        <div className="cand-sec" style={{ marginTop: 0 }}>Personal Information</div>
        <div className="cand-label">Full Name *</div>
        <div className="cand-ipt-wrap"><span className="ic"><CandIcon name="user" /></span><input className="cand-ipt locked" defaultValue="anuj gupta" readOnly /><span className="lock"><CandIcon name="lock" /></span></div>
        <div className="cand-label">Mobile Number *</div>
        <div className="cand-ipt-wrap"><span className="ic"><CandIcon name="phone" /></span><input className="cand-ipt" placeholder="Enter mobile number" /></div>
        <div className="cand-label">Email Address *</div>
        <div className="cand-ipt-wrap"><span className="ic"><CandIcon name="mail" /></span><input className="cand-ipt locked" defaultValue="anujg501@gmail.com" readOnly /><span className="lock"><CandIcon name="lock" /></span></div>
        <div className="cand-label">City *</div>
        <div className="cand-ipt-wrap"><span className="ic"><CandIcon name="city" /></span><input className="cand-ipt" placeholder="e.g. Mumbai" /></div>
        <div className="cand-label">State *</div>
        <select className="cand-ipt" style={{ paddingLeft: 14 }}><option>Select State</option>{window.LMS_STATES.map(s => <option key={s}>{s}</option>)}</select>

        <div className="cand-sec">Experience &amp; Documents</div>
        <div className="cand-label">Years of Experience *</div>
        <select className="cand-ipt" style={{ paddingLeft: 14 }}><option>Select</option>{window.LMS_EXP.map(s => <option key={s}>{s}</option>)}</select>
        <div className="cand-label">Resume / CV *</div>
        <div style={{ border: '1.5px dashed var(--lms-purple)', background: 'var(--lms-purple-soft)', borderRadius: 14, padding: '26px 14px', textAlign: 'center', color: 'var(--lms-purple-ink)' }}>
          <div style={{ fontSize: 24 }}><CandIcon name="doc" /></div>
          <div style={{ fontWeight: 600, marginTop: 6 }}>Click to upload or drag &amp; drop</div>
          <div style={{ fontSize: 12, color: 'var(--lms-meta)' }}>PDF or Word · Max 5MB</div>
        </div>
        <div className="cand-label">How did you know about this *</div>
        <select className="cand-ipt" style={{ paddingLeft: 14 }}><option>Select Source</option>{window.LMS_SOURCES.map(s => <option key={s.id}>{s.label}</option>)}</select>
        <div style={{ marginTop: 20 }}><button className="cand-btn" onClick={() => go('home')}>Submit Application</button></div>
        <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--lms-meta)', marginTop: 12 }}>Your data is confidential and used only for hiring purposes.</p>
      </div>
    </>
  );
}

// ---- My Status (stage tracker) ----
function CandStatus({ go, stage, cand }) {
  const steps = window.LMS_STAGES.filter(s => s.id !== 'rejected');
  const idx = steps.findIndex(s => s.id === stage);
  const c = cand || {};
  const [meetLink, setMeetLink] = cUseState('');
  React.useEffect(() => {
    if (!c.candId) return;
    const API = window.EUROSTAR_API || location.origin;
    fetch(API + '/admin/lms/meeting-links').then(r => r.ok ? r.json() : {}).then(mp => { if (mp && mp[c.candId]) setMeetLink(mp[c.candId]); }).catch(() => {});
  }, [c.candId]);
  const w = window.lmsWindow(c);
  const t = window.lmsTestWindow(c);
  // per-stage date + next-action hints
  const meta = {
    applied:     { date: c.applied || '—', next: 'Our team will review your application and call to schedule a short screening.' },
    screening:   { date: c.screenResult ? 'Screened' : 'Scheduled', next: c.screenResult === 'pass' ? 'You cleared screening — training will be unlocked shortly.' : 'Attend your screening call. Be ready to talk about your experience.' },
    training:    { date: w.state === 'open' ? w.daysLeft + ' days left' : w.state === 'expired' ? 'Window expired' : 'Locked', next: 'Watch all training videos, then your test will be unlocked.' },
    testing:     { date: c.score != null ? c.score + '%' : (t.state === 'open' ? t.daysLeft + ' days left' : 'Not taken'), next: 'Clear the test with ≥ ' + window.LMS_PASS_PCT + '% to be recommended for hiring.' },
    recommended: { date: c.score != null ? 'Scored ' + c.score + '%' : '—', next: 'Awaiting the office\u2019s final hiring decision.' },
    hired:       { date: c.repId || '—', next: 'You\u2019re hired! Use your Rep ID to log in to the Eurostar Sales App.' },
  };
  const m = meta[stage] || {};
  return (
    <>
      <div className="cand-appbar"><button className="menu" onClick={() => go('home')}><CandIcon name="back" /></button><div><h3>My Status</h3><small>{c.candId}</small></div></div>
      <div className="cand-pad">
        <div className="cand-sub" style={{ textAlign: 'left' }}>Track where you are in the Eurostar hiring journey.</div>
        {steps.map((s, i) => {
          const done = i < idx, current = i === idx;
          const dm = meta[s.id] || {};
          return (
            <div key={s.id} className="cand-step">
              <span className="num" style={{ background: done ? 'var(--lms-green)' : current ? s.color : '#EEEBE3', color: done || current ? '#fff' : 'var(--lms-meta)' }}>{done ? '✓' : i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: current ? 700 : 500 }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--lms-meta)', whiteSpace: 'nowrap' }}>{done ? 'Completed' : current ? (dm.date || 'In progress') : ''}</div>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--lms-meta)' }}>{current ? 'You are here' : done ? 'Done' : 'Pending'}</div>
              </div>
            </div>
          );
        })}
        {m.next && (
          <div style={{ marginTop: 16, background: 'var(--lms-purple-soft)', border: '1px solid #DDD0F5', borderRadius: 12, padding: '13px 15px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--lms-purple-ink)', textTransform: 'uppercase', letterSpacing: '.05em' }}>What's next</div>
            <div style={{ fontSize: 13.5, color: 'var(--lms-ink-2)', marginTop: 4 }}>{m.next}</div>
          </div>
        )}
        {meetLink && (
          <a href={meetLink} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 12, background: 'var(--lms-green)', color: '#fff', textAlign: 'center', padding: '14px', borderRadius: 12, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
            📹 Join your interview
          </a>
        )}
        <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--lms-meta)', textAlign: 'center' }}>
          Need help? Call the Eurostar hiring desk: <b style={{ color: 'var(--lms-ink)' }}>+91 77100 65480</b>
        </div>
      </div>
    </>
  );
}

// ---- Training ----
// ---- Embedded practice app (dummy Sales App / CRM inside a module) ----
function CandPractice({ practice, candId }) {
  const [open, setOpen] = cUseState(false);
  const [full, setFull] = cUseState(false);
  const storeKey = 'lms-practice-' + candId + '-' + practice.app;
  const [ticks, setTicks] = cUseState(() => {
    try { return JSON.parse(localStorage.getItem(storeKey) || '[]'); } catch (e) { return []; }
  });
  const toggle = (i) => {
    const next = ticks.includes(i) ? ticks.filter(x => x !== i) : [...ticks, i];
    setTicks(next);
    try { localStorage.setItem(storeKey, JSON.stringify(next)); } catch (e) {}
  };
  const doneCount = ticks.length;
  const total = practice.tasks.length;

  const frame = (tall) => (
    <div className="cand-practice-frame" style={{ height: tall ? '100%' : 460 }}>
      <div className="cand-practice-banner">🧪 Practice mode · dummy data — nothing is sent to the office</div>
      <iframe title={practice.label} src={practice.src} className="cand-practice-iframe" />
    </div>
  );

  return (
    <div className="cand-practice">
      <button className="cand-practice-open" onClick={() => setOpen(o => !o)}>
        <span className="cpi">▶</span>
        <span style={{ flex: 1, textAlign: 'left' }}>{practice.label}</span>
        <span className="cand-practice-count">{doneCount}/{total}</span>
        <span style={{ fontSize: 12, opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="cand-practice-body">
          <p className="cand-practice-intro">{practice.intro}</p>
          {frame(false)}
          <button className="cand-practice-full" onClick={() => setFull(true)}>⤢ Open full screen</button>

          <div className="cand-practice-tasks">
            <div className="cand-practice-tasks-head">Try it now — tick each as you go</div>
            {practice.tasks.map((t, i) => (
              <button key={i} className={'cand-task' + (ticks.includes(i) ? ' done' : '')} onClick={() => toggle(i)}>
                <span className="cand-task-box">{ticks.includes(i) ? '✓' : ''}</span>
                <span>{t}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {full && (
        <div className="cand-practice-overlay" onClick={() => setFull(false)}>
          <div className="cand-practice-overlay-inner" onClick={e => e.stopPropagation()}>
            <div className="cand-practice-overlay-bar">
              <strong>{practice.label}</strong>
              <button onClick={() => setFull(false)}>✕ Close</button>
            </div>
            {frame(true)}
          </div>
        </div>
      )}
    </div>
  );
}

function CandTraining({ go, cand, actions, lang }) {
  const L = lang || 'en';
  const watched = (cand && cand.watched) || [];
  const allVids = window.LMS_MODULES.flatMap(m => m.videos.map(v => v.id));
  const allDone = allVids.every(id => watched.includes(id));
  const watch = (vid) => actions && actions.markWatched(cand.id, vid);
  return (
    <>
      <div className="cand-appbar"><button className="menu" onClick={() => go('home')}><CandIcon name="back" /></button><div><h3>Training</h3><small>{watched.length}/{allVids.length} watched</small></div></div>
      <div className="cand-pad">
        <div style={{ marginBottom: 16, border: '1px solid #E6C9C9', background: '#FBF1F1', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flex: '0 0 auto' }}>⚠️</span>
          <div style={{ fontSize: 12, color: '#9A3B3B', lineHeight: 1.5 }}>
            <b>Confidential training material.</b> Do not record, screenshot, download or share these videos or any company data with anyone outside Eurostar. Violation will lead to <b>termination and legal action</b>.
          </div>
        </div>
        {window.LMS_MODULES.map(m => (
          <div key={m.id} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="lms-tag lms-tag-mod">{m.code}</span>
              <strong style={{ fontSize: 15 }}>{m.title}</strong>
            </div>
            {m.videos.map(v => {
              const done = watched.includes(v.id);
              return (
                <div key={v.id} className="cand-vid">
                  <span className="play" style={done ? { background: '#9A6B12' } : {}}><CandIcon name="play" /></span>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>{v.title}</div><div style={{ fontSize: 12, color: 'var(--lms-meta)' }}>{v.dur} · Mandatory{L !== 'en' ? ' · ' + window.lmsLangLabel(L) : ''}</div></div>
                  {done
                    ? <span className="lms-pill" style={{ background: 'var(--lms-green-soft)', color: 'var(--lms-green-ink)', fontSize: 11 }}>✓ Watched</span>
                    : <button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={() => watch(v.id)}>Mark watched</button>}
                </div>
              );
            })}
            {(() => { const notes = window.lmsNotesFor ? window.lmsNotesFor(m.id, L) : []; return notes.length ? (
              <div className="cand-notes">
                <div className="cand-notes-head"><span>📝</span> Module notes</div>
                <ul>
                  {notes.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </div>
            ) : null; })()}
            {m.practice && <CandPractice practice={m.practice} candId={cand ? cand.id : 'demo'} />}
          </div>
        ))}
        <div style={{ height: 8, background: '#EEEBE3', borderRadius: 8, margin: '6px 0 14px', overflow: 'hidden' }}><div style={{ height: '100%', width: `${(watched.length / allVids.length) * 100}%`, background: 'var(--lms-green)' }} /></div>
        {allDone
          ? <button className="cand-btn green" onClick={() => go('home')}>✓ Training complete — back to dashboard</button>
          : <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--lms-meta)' }}>Watch all videos to complete training. The test unlocks separately when the office opens it.</div>}
      </div>
    </>
  );
}

// ---- Take Test ----
function CandTest({ go, onSubmit, onAbort, questions, testCfg, cand }) {
  const cfg = testCfg || window.LMS_TEST_CONFIG;
  const bank = questions || window.LMS_QUESTIONS;
  // Build the question set once (count + optional randomize).
  const [qs] = cUseState(() => {
    let pool = bank.slice();
    if (cfg.randomize) { for (let k = pool.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [pool[k], pool[j]] = [pool[j], pool[k]]; } }
    return pool.slice(0, Math.min(cfg.count, pool.length));
  });
  const [started, setStarted] = cUseState(false);
  const [i, setI] = cUseState(0);
  const [ans, setAns] = cUseState({});
  const [secs, setSecs] = cUseState(cfg.durationMin * 60);
  const q = qs[i];
  const opts = q.type === 'True-False' ? ['True', 'False'] : q.options;
  const pick = (oi) => setAns(a => ({ ...a, [q.id]: oi }));
  const last = i === qs.length - 1;
  const score = () => {
    let correct = 0;
    qs.forEach(qq => { const a = ans[qq.id]; const right = qq.type === 'True-False' ? (a === 0) === (qq.answer === true) : a === qq.answer; if (right) correct++; });
    return Math.round((correct / qs.length) * 100);
  };
  const submit = () => (onSubmit ? onSubmit(score()) : go('result'));
  // countdown timer while the test is running
  React.useEffect(() => {
    if (!started) return;
    if (secs <= 0) { submit(); return; }
    const t = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [started, secs]);
  const mmss = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

  // training-completion gate
  const watched = (cand && cand.watched) || [];
  const allVids = window.LMS_MODULES.flatMap(m => m.videos.map(v => v.id));
  const trainingDone = allVids.every(id => watched.includes(id));

  // Start gate — one-shot warning before the test begins.
  if (!started) {
    return (
      <>
        <div className="cand-appbar"><button className="menu" onClick={() => go('home')}><CandIcon name="back" /></button><div><h3>Take Test</h3></div></div>
        <div className="cand-pad" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginTop: 16 }}>⚠️</div>
          <div style={{ fontSize: 19, fontWeight: 700, marginTop: 8 }}>One attempt — finish in one sitting</div>
          <p className="cand-sub" style={{ textAlign: 'left', marginTop: 14 }}>
            • {qs.length} questions{cfg.randomize ? ' (random order)' : ''} · pass mark <b>{cfg.passPct}%</b><br/>
            • Time limit: <b>{cfg.durationMin} minutes</b> — the test auto-submits when time runs out.<br/>
            • Once you tap <b>Start</b>, finish in a <b>single sitting</b>. Leaving uses up your attempt.<br/>
            • You can only retake it if the office grants a <b>re-test</b>.
          </p>
          {!trainingDone && (
            <div style={{ background: '#F6E7E7', border: '1px solid #E6C9C9', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#9A3B3B', marginBottom: 12 }}>
              Please finish all training videos before starting the test.
            </div>
          )}
          <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="cand-btn green" disabled={!trainingDone} style={!trainingDone ? { opacity: .5 } : {}} onClick={() => setStarted(true)}>I understand — Start Test</button>
            {!trainingDone && <button className="cand-btn" onClick={() => go('training')}>Go to training</button>}
            <button className="cand-btn" style={{ background: '#ECEAE3', color: 'var(--lms-ink)' }} onClick={() => go('home')}>Not now</button>
          </div>
        </div>
      </>
    );
  }
  const abandon = () => { if (onAbort) onAbort(); else go('home'); };
  const lowTime = secs <= 30;
  return (
    <>
      <div className="cand-appbar"><button className="menu" onClick={abandon}><CandIcon name="back" /></button><div style={{ flex: 1 }}><h3>Take Test</h3><small>Question {i + 1} of {qs.length} · ⚠️ one attempt</small></div>
        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, padding: '4px 10px', borderRadius: 8, background: lowTime ? '#F6E7E7' : '#EDE7FB', color: lowTime ? '#B91C1C' : 'var(--lms-purple-ink)' }}>⏱ {mmss}</span>
      </div>
      <div className="cand-pad">
        <div style={{ height: 6, background: '#EEEBE3', borderRadius: 6, marginBottom: 20 }}><div style={{ height: '100%', width: `${((i + 1) / qs.length) * 100}%`, background: 'var(--lms-purple)', borderRadius: 6 }} /></div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}><span className={'lms-tag ' + (q.type === 'MCQ' ? 'lms-tag-mcq' : 'lms-tag-tf')}>{q.type}</span></div>
        <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.4, marginBottom: 20 }}>{q.q}</div>
        {opts.map((o, oi) => (
          <div key={oi} className={'cand-qopt' + (ans[q.id] === oi ? ' sel' : '')} onClick={() => pick(oi)}><span className="rd" />{o}</div>
        ))}
        <div style={{ marginTop: 18 }}>
          {last
            ? <button className="cand-btn green" disabled={ans[q.id] === undefined} style={ans[q.id] === undefined ? { opacity: .5 } : {}} onClick={submit}>Submit Test</button>
            : <button className="cand-btn" onClick={() => setI(i + 1)} disabled={ans[q.id] === undefined} style={ans[q.id] === undefined ? { opacity: .5 } : {}}>Next</button>}
        </div>
      </div>
    </>
  );
}

// ---- My Result ----
function CandResult({ go, cand }) {
  const score = cand && cand.score != null ? cand.score : 90;
  const passed = score >= window.LMS_PASS_PCT;
  const correct = Math.round((score / 100) * 5);
  const ringColor = passed ? 'var(--lms-green)' : '#B91C1C';
  const [showCert, setShowCert] = cUseState(false);
  const repName = (cand && (cand.name || cand.fullName)) || 'Sales Representative';
  if (showCert) return <CandCertificate name={repName} score={score} onBack={() => setShowCert(false)} />;
  return (
    <>
      <div className="cand-appbar"><button className="menu" onClick={() => go('home')}><CandIcon name="back" /></button><div><h3>My Result</h3></div></div>
      <div className="cand-pad" style={{ textAlign: 'center' }}>
        <div style={{ width: 130, height: 130, borderRadius: '50%', margin: '20px auto 18px', background: `conic-gradient(${ringColor} 0 ${score}%, #EEEBE3 ${score}% 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 104, height: 104, borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 30, fontWeight: 700 }}>{score}%</div><div style={{ fontSize: 12, color: 'var(--lms-meta)' }}>Score</div>
          </div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{passed ? 'Congratulations! 🎉' : 'Not cleared this time'}</div>
        <p className="cand-sub">{passed
          ? 'You cleared the assessment. Your application moves to the approval queue — the office will review and confirm hiring shortly.'
          : `You need at least ${window.LMS_PASS_PCT}% to pass. Please revise the training and try again within your window.`}</p>
        <div className="lms-card lms-card-pad" style={{ textAlign: 'left', marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><span className="lms-muted">Questions</span><strong>5</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><span className="lms-muted">Correct</span><strong>{correct} / 5</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><span className="lms-muted">Pass mark</span><strong>{window.LMS_PASS_PCT}%</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><span className="lms-muted">Status</span><span className="lms-pill" style={{ background: passed ? 'var(--lms-green-soft)' : '#F6E7E7', color: passed ? 'var(--lms-green-ink)' : '#9A3B3B' }}>{passed ? 'Passed' : 'Failed'}</span></div>
        </div>
        {passed && <div style={{ marginTop: 16 }}><button className="cand-btn" onClick={() => setShowCert(true)}>🏆 View completion certificate</button></div>}
        {passed && <p className="lms-muted" style={{ fontSize: 12, marginTop: 12 }}>Toggle to <b>Admin → Approval Queue</b> to approve &amp; hire — a permanent Rep ID is issued on hire.</p>}
        <div style={{ marginTop: 14 }}><button className="cand-btn cand-btn-ghost" onClick={() => go('home')}>Back to Dashboard</button></div>
      </div>
    </>
  );
}

// ---- Completion certificate (shown to reps who pass; prints cleanly) ----
function CandCertificate({ name, score, onBack }) {
  const today = new Date(window.LMS_TODAY || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const certId = 'ES-' + String(Math.abs((name || 'REP').split('').reduce((a, c) => a + c.charCodeAt(0), 0)) * 7 + Math.round(score)).padStart(6, '0');
  return (
    <>
      <div className="cand-appbar"><button className="menu" onClick={onBack}><CandIcon name="back" /></button><div><h3>Certificate</h3></div></div>
      <div className="cand-pad">
        <div className="es-cert" id="es-cert">
          <div className="es-cert-inner">
            <div className="es-cert-seal">E</div>
            <div className="es-cert-brand">EUROSTAR GEMSTONES</div>
            <div className="es-cert-estd">Estd 1980 · Sales Academy</div>
            <div className="es-cert-title">Certificate of Completion</div>
            <div className="es-cert-lead">This is to certify that</div>
            <div className="es-cert-name">{name}</div>
            <div className="es-cert-body">has successfully completed the Eurostar Sales Representative Training Programme and passed the final assessment with a score of</div>
            <div className="es-cert-score">{score}%</div>
            <div className="es-cert-foot">
              <div><div className="es-cert-fval">{today}</div><div className="es-cert-flabel">Date</div></div>
              <div><div className="es-cert-fval">{certId}</div><div className="es-cert-flabel">Certificate ID</div></div>
              <div><div className="es-cert-fval" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>Eurostar</div><div className="es-cert-flabel">Authorised</div></div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="cand-btn" style={{ flex: 1 }} onClick={() => window.print()}>⬇ Download / Print</button>
          <button className="cand-btn cand-btn-ghost" style={{ flex: 1 }} onClick={onBack}>Back</button>
        </div>
      </div>
    </>
  );
}

function CandLangSheet({ onPick }) {
  const langs = [
    { id: 'en', label: 'English', native: 'English' },
    { id: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { id: 'mr', label: 'Marathi', native: 'मराठी' },
    { id: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
    { id: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { id: 'te', label: 'Telugu', native: 'తెలుగు' },
    { id: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  ];
  const [sel, setSel] = cUseState('en');
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,16,40,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 60 }}>
      <div style={{ background: '#fff', width: '100%', borderRadius: '22px 22px 0 0', padding: '22px 20px 26px', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ width: 40, height: 4, borderRadius: 4, background: '#E0DCD2', margin: '0 auto 16px' }} />
        <div style={{ textAlign: 'center', marginBottom: 4 }}><span style={{ fontSize: 26 }}>🌐</span></div>
        <div style={{ fontSize: 19, fontWeight: 700, textAlign: 'center' }}>Choose your language</div>
        <p style={{ textAlign: 'center', color: 'var(--lms-meta)', fontSize: 13.5, margin: '4px 0 18px' }}>आप अपनी भाषा चुन सकते हैं · You can change this later in Settings</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {langs.map(l => (
            <button key={l.id} onClick={() => setSel(l.id)} style={{
              display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start', padding: '13px 14px', borderRadius: 13,
              border: '1.5px solid ' + (sel === l.id ? 'var(--lms-purple)' : 'var(--lms-border)'),
              background: sel === l.id ? 'var(--lms-purple-soft)' : '#fff', textAlign: 'left'
            }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>{l.native}</span>
              <span style={{ fontSize: 12, color: 'var(--lms-meta)' }}>{l.label}</span>
            </button>
          ))}
        </div>
        <button className="cand-btn cand-lang-continue" style={{ marginTop: 18 }} onClick={() => onPick(sel)}>Continue</button>
      </div>
    </div>
  );
}

function kycCompress(file, cb) {
  const r = new FileReader();
  r.onload = () => { const im = new Image(); im.onload = () => {
    let w = im.width, h = im.height; const max = 900;
    if (w > max || h > max) { const s = max / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(im, 0, 0, w, h); cb(c.toDataURL('image/jpeg', 0.82));
  }; im.src = r.result; }; r.readAsDataURL(file);
}

function KycUpload({ label, hint, value, optional, onPick }) {
  const ref = React.useRef(null);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--lms-divider)' }}>
      <div onClick={() => ref.current && ref.current.click()} style={{ width: 54, height: 54, borderRadius: 10, flex: '0 0 54px', border: '1px solid var(--lms-border)', background: '#F4F2EC', backgroundImage: value ? `url(${value})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
        {!value && <span style={{ fontSize: 22, color: 'var(--lms-meta)' }}>＋</span>}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{label}{optional && <span style={{ color: 'var(--lms-meta)', fontWeight: 400, fontSize: 12 }}> · if available</span>}</div>
        <div style={{ fontSize: 12, color: 'var(--lms-meta)' }}>{value ? 'Uploaded — tap to replace' : (hint || 'Tap to upload a photo')}</div>
      </div>
      {value && <span className="lms-pill" style={{ background: 'var(--lms-green-soft)', color: 'var(--lms-green-ink)', fontSize: 11 }}>✓</span>}
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) kycCompress(f, onPick); e.target.value = ''; }} />
    </div>
  );
}

function CandOnboarding({ go, cand, actions }) {
  const ob = (cand && cand.onboarding) || {};
  const [bank, setBank] = cUseState(ob.bank || { acc: '', accConfirm: '', holder: (cand && cand.name) || '', bankName: '', ifsc: '' });
  const setB = (k, v) => setBank(b => ({ ...b, [k]: v }));
  const ifscOk = /^[A-Z]{4}0[A-Z0-9]{6}$/.test((bank.ifsc || '').toUpperCase());
  const accOk = (bank.acc || '').length >= 8 && bank.acc === bank.accConfirm;
  const bankSaved = !!(ob.bank && ob.bank.acc);
  const pick = (key) => (data) => actions && actions.setOnboarding(cand.id, { [key]: data });
  const saveBank = () => {
    if (!bank.holder || !bank.bankName) { alert('Enter the account-holder name and bank name.'); return; }
    if (!accOk) { alert('Account numbers must match and be at least 8 digits.'); return; }
    if (!ifscOk) { alert('Enter a valid IFSC code, e.g. HDFC0001234.'); return; }
    actions.setOnboarding(cand.id, { bank: { acc: bank.acc, holder: bank.holder, bankName: bank.bankName, ifsc: bank.ifsc.toUpperCase() } });
  };
  const complete = ob.confidentiality && ob.photo && ob.aadhaarImg && bankSaved;
  return (
    <>
      <div className="cand-appbar"><button className="menu" onClick={() => go('home')}><CandIcon name="back" /></button><div><h3>Onboarding</h3><small>{cand.repId}</small></div></div>
      <div className="cand-pad">
        <p className="cand-sub" style={{ textAlign: 'left', marginTop: 0 }}>Complete these steps to activate your Sales App account.</p>

        {/* 1. confidentiality */}
        <div className="cand-sec" style={{ marginTop: 0 }}>1 · Confidentiality agreement</div>
        <div style={{ border: '1px solid var(--lms-border)', borderRadius: 12, padding: 14, fontSize: 12.5, color: 'var(--lms-ink-2)', lineHeight: 1.6, background: '#fff' }}>
          I agree that all prices, product data, training material and customer information are the property of Eurostar, and that sharing, copying or forwarding any of it to outsiders is strictly prohibited and will lead to termination and legal action.
        </div>
        {ob.confidentiality
          ? <div style={{ marginTop: 10, color: 'var(--lms-green-ink)', fontWeight: 600, fontSize: 13.5 }}>✓ Signed &amp; recorded</div>
          : <button className="cand-btn green" style={{ marginTop: 12 }} onClick={() => actions && actions.signConfidentiality(cand.id)}>I agree &amp; sign</button>}

        {/* 2. photograph */}
        <div className="cand-sec">2 · Your photograph</div>
        <KycUpload label="Passport photo" hint="A clear front-facing photo" value={ob.photo} onPick={pick('photo')} />

        {/* 3. identity documents */}
        <div className="cand-sec">3 · Identity documents</div>
        <KycUpload label="Aadhaar card" hint="Photo of your Aadhaar card" value={ob.aadhaarImg} onPick={pick('aadhaarImg')} />
        <KycUpload label="PAN card" optional hint="Photo of your PAN card" value={ob.panImg} onPick={pick('panImg')} />

        {/* 4. bank account */}
        <div className="cand-sec">4 · Bank account</div>
        <div className="cand-label">Account holder name *</div>
        <input className="cand-ipt" style={{ paddingLeft: 14 }} value={bank.holder} onChange={e => setB('holder', e.target.value)} placeholder="As printed in your bank records" />
        <div className="cand-label">Account number *</div>
        <input className="cand-ipt" inputMode="numeric" style={{ paddingLeft: 14 }} value={bank.acc} onChange={e => setB('acc', e.target.value.replace(/\s/g, ''))} placeholder="Bank account number" />
        <div className="cand-label">Confirm account number *</div>
        <input className="cand-ipt" inputMode="numeric" style={{ paddingLeft: 14 }} value={bank.accConfirm} onChange={e => setB('accConfirm', e.target.value.replace(/\s/g, ''))} placeholder="Re-enter account number" />
        {bank.accConfirm && bank.acc !== bank.accConfirm && <div style={{ color: '#9A3B3B', fontSize: 12, marginTop: 4 }}>Account numbers don’t match.</div>}
        <div className="cand-label">Bank name *</div>
        <input className="cand-ipt" style={{ paddingLeft: 14 }} value={bank.bankName} onChange={e => setB('bankName', e.target.value)} placeholder="e.g. HDFC Bank" />
        <div className="cand-label">IFSC code *</div>
        <input className="cand-ipt" style={{ paddingLeft: 14, textTransform: 'uppercase' }} value={bank.ifsc} onChange={e => setB('ifsc', e.target.value.toUpperCase())} placeholder="e.g. HDFC0001234" />
        {bankSaved
          ? <div style={{ marginTop: 12, color: 'var(--lms-green-ink)', fontWeight: 600, fontSize: 13.5 }}>✓ Bank details saved</div>
          : <button className="cand-btn green" style={{ marginTop: 12 }} onClick={saveBank}>Save bank details</button>}

        {/* 5. done */}
        <div className="cand-sec">5 · Offer &amp; activation</div>
        <div style={{ background: complete ? 'var(--lms-green-soft)' : '#EEF0F3', border: '1px solid ' + (complete ? '#CFE6D2' : '#DDE0E5'), borderRadius: 12, padding: '14px 16px', fontSize: 13.5, color: complete ? 'var(--lms-green-ink)' : 'var(--lms-meta)' }}>
          {complete
            ? '✓ All details submitted. Your offer letter has been issued and your Sales App login is active — sign in with your Rep ID.'
            : 'Sign the agreement, add your photo, Aadhaar and bank details to receive your offer letter and activate your Sales App login.'}
        </div>
        <button className="cand-btn" style={{ marginTop: 16 }} onClick={() => go('home')}>Back to Dashboard</button>
      </div>
    </>
  );
}

function CandidateApp({ cands, actions, questions, testCfg }) {
  const [authed, setAuthed] = cUseState(false);
  const [mode, setMode] = cUseState('register');
  const [screen, setScreen] = cUseState('home');
  const [lang, setLang] = cUseState(null); // null until chosen on first dashboard arrival
  // The logged-in rep — prefer a hired rep (post-hire onboarding flow), else the C1 prospect.
  const cand = (cands || window.LMS_CANDIDATES).find(c => c.stage === 'hired') || (cands || window.LMS_CANDIDATES).find(c => c.id === 'C1') || (cands || window.LMS_CANDIDATES)[0];
  if (!authed) return <CandShell><CandAuth mode={mode} setMode={setMode} onDone={() => setAuthed(true)} /></CandShell>;
  const go = (s) => setScreen(s);
  const submitTest = (score) => { if (actions) actions.setScore(cand.id, score); setScreen('result'); };
  let view;
  if (screen === 'home') view = <CandDashboard cand={cand} go={go} />;
  else if (screen === 'apply') view = <CandApply go={go} />;
  else if (screen === 'status') view = <CandStatus go={go} stage={cand.stage} cand={cand} />;
  else if (screen === 'training') view = <CandTraining go={go} cand={cand} actions={actions} lang={lang || 'en'} />;
  else if (screen === 'test') view = <CandTest go={go} onSubmit={submitTest} onAbort={() => { if (actions) actions.consumeTest(cand.id); setScreen('home'); }} questions={questions} testCfg={testCfg} cand={cand} />;
  else if (screen === 'result') view = <CandResult go={go} cand={cand} />;
  else if (screen === 'onboarding') view = <CandOnboarding go={go} cand={cand} actions={actions} />;
  else view = <CandDashboard cand={cand} go={go} />;
  return <CandShell>{view}{screen === 'home' && lang === null && <CandLangSheet onPick={setLang} />}</CandShell>;
}

Object.assign(window, { CandidateApp });
