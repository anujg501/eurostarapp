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

// `overlay` is rendered as a sibling of the scroll area rather than inside it,
// so a drawer or sheet covers the handset without scrolling away with the
// content underneath it.
function CandShell({ children, overlay }) {
  return (
    <div className="cand-stage">
      <div className="cand-phone">
        <div className="cand-statusbar" />
        <div className="cand-scroll">{children}</div>
        {overlay}
      </div>
    </div>
  );
}

// ---- Real backend client for the candidate portal (mirrors mobile-lms/src/api.ts) ----
const CAND_TOKEN_KEY = 'eurostar-candidate-token';
const OTP_LEN = 6;

function candApi(method, path, body, isForm) {
  let token = '';
  try { token = localStorage.getItem(CAND_TOKEN_KEY) || ''; } catch (e) {}
  const headers = { accept: 'application/json' };
  if (token) headers.authorization = 'Bearer ' + token;
  const opts = { method, headers };
  if (body != null) {
    if (isForm) opts.body = body;
    else { headers['content-type'] = 'application/json'; opts.body = JSON.stringify(body); }
  }
  // Signing in and registering answer 401 for an ordinary wrong password or a
  // bad OTP, and changing a password answers 401 for the wrong current one.
  // None of those mean "your session died", so they are excluded below.
  const isAuthCall = path.indexOf('/auth/candidate/') === 0;

  return fetch((window.EUROSTAR_API || location.origin) + path, opts).then(r =>
    r.text().then(t => {
      let data = null;
      try { data = t ? JSON.parse(t) : null; } catch (e) { data = null; }
      // We sent a token and it was refused: the session is gone. Say so at once
      // instead of leaving a filled-in form on screen that cannot submit —
      // that is exactly how a whole application got typed out and then lost.
      if (token && !isAuthCall && (r.status === 401 || r.status === 403)) {
        try { window.dispatchEvent(new CustomEvent('cand-session-ended')); } catch (e) {}
      }
      return { ok: r.ok, status: r.status, data };
    })
  ).catch(() => ({ ok: false, status: 0, data: null }));
}

// ---- Create account / login (real OTP + email/password against the backend) ----
function CandAuth({ mode, setMode, onDone, notice }) {
  const reg = mode === 'register';
  const [firstName, setFirstName] = cUseState('');
  const [lastName, setLastName] = cUseState('');
  const [phone, setPhone] = cUseState('');
  const [otpStage, setOtpStage] = cUseState('idle'); // idle | sending | sent | verifying | verified
  const [otp, setOtp] = cUseState(Array(OTP_LEN).fill(''));
  const [devCode, setDevCode] = cUseState('');
  const [email, setEmail] = cUseState('');
  const [password, setPassword] = cUseState('');
  const [remember, setRemember] = cUseState(true);
  const [busy, setBusy] = cUseState(false);
  const [err, setErr] = cUseState('');

  const validPhone = /^[6-9]\d{9}$/.test(phone);
  const otpFull = otp.join('').length === OTP_LEN;
  const setDigit = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = otp.slice(); next[i] = v; setOtp(next);
    if (v && i < OTP_LEN - 1) { const el = document.getElementById('otp-' + (i + 1)); if (el) el.focus(); }
  };

  const sendOtp = () => {
    if (!validPhone || busy) return;
    setErr(''); setBusy(true); setOtpStage('sending');
    candApi('POST', '/auth/candidate/otp/request', { phone, mode: 'signup' }).then(res => {
      setBusy(false);
      if (!res.ok) {
        setOtpStage('idle');
        setErr((res.data && res.data.error) || 'Could not send the code — try again.');
        return;
      }
      setDevCode(res.data && res.data.devCode ? res.data.devCode : '');
      setOtpStage('sent');
      setOtp(Array(OTP_LEN).fill(''));
    });
  };

  const verifyOtpOnly = () => {
    if (!otpFull || busy) return;
    setErr(''); setBusy(true); setOtpStage('verifying');
    // /check only checks — it creates nothing and does not retire the code, so
    // the same code is still good for Register below. (Calling /verify here
    // instead silently completed the sign-up for any number that already had an
    // account, spending the code and leaving Register with "expired".)
    candApi('POST', '/auth/candidate/otp/check', { phone, otp: otp.join('') }).then(res => {
      setBusy(false);
      if (res.ok) { setOtpStage('verified'); return; }
      setOtpStage('sent');
      setErr((res.data && res.data.error) || 'Incorrect or expired code — try again.');
    });
  };

  const register = () => {
    if (busy) return;
    setErr('');
    if (!validPhone || otpStage !== 'verified') { setErr('Verify your mobile number first.'); return; }
    if (!firstName.trim() || !lastName.trim()) { setErr('Enter your first and last name.'); return; }
    if (password && password.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    setBusy(true);
    candApi('POST', '/auth/candidate/otp/verify', {
      phone,
      otp: otp.join(''),
      name: (firstName.trim() + ' ' + lastName.trim()).trim(),
      email: email.trim() || undefined,
      password: password || undefined,
      remember: true,
    }).then(res => {
      setBusy(false);
      if (!res.ok) {
        if (res.status === 401) setOtpStage('sent'); // code expired between verify and register — re-enter it
        setErr((res.data && res.data.error) || 'Could not register — try again.');
        return;
      }
      onDone(res.data.accessToken);
    });
  };

  const signIn = () => {
    if (busy) return;
    setErr('');
    if (!email.trim() || !password) { setErr('Enter your email and password.'); return; }
    setBusy(true);
    candApi('POST', '/auth/candidate/login', { email: email.trim(), password, remember }).then(res => {
      setBusy(false);
      if (!res.ok) {
        setErr((res.data && res.data.error) || 'Incorrect email or password');
        return;
      }
      onDone(res.data.accessToken);
    });
  };

  const canSubmit = reg
    ? (validPhone && otpStage === 'verified' && firstName.trim() && lastName.trim() && !busy)
    : (email.trim() && password && !busy);

  return (
    <div className="cand-pad">
      <div className="cand-logo"><img src={window.EUROSTAR_LOGO_PNG || 'assets/eurostar-logo.png'} alt="Eurostar" /></div>
      <div className="cand-h1">{reg ? 'Create Account' : 'Welcome Back!'}</div>
      <p className="cand-sub">{reg ? 'Register to continue' : 'Please login to your account'}</p>
      {notice && (
        <div style={{ background: '#FBF3DF', border: '1px solid #EAD9AE', color: '#8A6314', borderRadius: 12, padding: '11px 13px', fontSize: 13, marginBottom: 14 }}>
          {notice}
        </div>
      )}
      {reg && <>
        <div className="cand-label">First Name</div>
        <div className="cand-ipt-wrap"><span className="ic"><CandIcon name="user" /></span><input className="cand-ipt" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
        <div className="cand-label">Last Name</div>
        <div className="cand-ipt-wrap"><span className="ic"><CandIcon name="user" /></span><input className="cand-ipt" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} /></div>
        <div className="cand-label">Mobile Number</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <div className="cand-ipt-wrap" style={{ flex: 1 }}>
            <span className="ic"><CandIcon name="phone" /></span>
            <input className={'cand-ipt' + (otpStage === 'verified' ? ' locked' : '')} inputMode="numeric" maxLength={10} placeholder="10-digit mobile" value={phone}
              onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setOtpStage('idle'); setOtp(Array(OTP_LEN).fill('')); setDevCode(''); }}
              readOnly={otpStage === 'verified'} />
            {otpStage === 'verified' && <span className="lock" style={{ color: 'var(--lms-green)' }}>✓</span>}
          </div>
          {otpStage !== 'verified' &&
            <button type="button" className="cand-btn" style={{ width: 'auto', padding: '0 16px', fontSize: 13.5, opacity: validPhone && !busy ? 1 : .5 }}
              onClick={sendOtp} disabled={!validPhone || busy}>
              {otpStage === 'sending' ? 'Sending…' : otpStage === 'sent' ? 'Resend' : 'Send OTP'}
            </button>}
        </div>
        {(otpStage === 'sent' || otpStage === 'verifying') && <>
          <div style={{ background: 'var(--lms-purple-soft)', border: '1px solid #DDD0F5', borderRadius: 12, padding: '12px 14px', marginTop: 12, fontSize: 13, color: 'var(--lms-purple-ink)' }}>
            OTP sent to <b>+91 {phone}</b>.{devCode ? <> Dev code: <b>{devCode}</b></> : null}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
            {otp.map((d, i) => (
              <input key={i} id={'otp-' + i} className="cand-ipt" style={{ width: 40, textAlign: 'center', fontSize: 18, fontWeight: 700, padding: '12px 0' }}
                inputMode="numeric" maxLength={1} value={d} onChange={e => setDigit(i, e.target.value)} />
            ))}
          </div>
          <button type="button" className="cand-btn green" style={{ marginTop: 14, opacity: otpFull ? 1 : .5 }} disabled={!otpFull || busy} onClick={verifyOtpOnly}>Verify OTP</button>
        </>}
        {otpStage === 'verified' &&
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, color: 'var(--lms-green-ink)', fontSize: 13.5, fontWeight: 600 }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--lms-green)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✓</span>
            Mobile number verified
          </div>}
      </>}
      <div className="cand-label">Email Address</div>
      <div className="cand-ipt-wrap"><span className="ic"><CandIcon name="mail" /></span><input className="cand-ipt" type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
      <div className="cand-label">Password</div>
      <div className="cand-ipt-wrap"><span className="ic"><CandIcon name="lock" /></span><input className="cand-ipt" type="password" placeholder={reg ? 'Choose a password' : 'Your password'} value={password} onChange={e => setPassword(e.target.value)} /></div>
      {!reg && <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, margin: '14px 2px 0' }}><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> Remember me</label>}
      {err && <div style={{ marginTop: 12, color: '#9A3B3B', fontSize: 13, background: '#F6E7E7', border: '1px solid #E6C9C9', borderRadius: 10, padding: '10px 12px' }}>{err}</div>}
      <div style={{ marginTop: 20 }}>
        <button className="cand-btn" onClick={reg ? register : signIn} disabled={!canSubmit} style={!canSubmit ? { opacity: .5 } : {}}>
          {busy ? (reg ? 'Registering…' : 'Signing in…') : (reg ? 'Register' : 'Sign In')}
        </button>
      </div>
      {reg && otpStage !== 'verified' && <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--lms-meta)', marginTop: 10 }}>Verify your mobile number to register.</p>}
      <div className="cand-link">
        {reg ? <>Already have an account? <b onClick={() => { setMode('login'); setErr(''); }}>Login</b></>
             : <>New here? <b onClick={() => { setMode('register'); setErr(''); }}>Create account</b></>}
      </div>
    </div>
  );
}

// ---- Candidate dashboard (5 tiles) ----
// Bell in the candidate app bar — shows an unread count and opens the full
// Notifications page (a separate screen, not a dropdown).
function CandBell({ candId, go }) {
  const [count, setCount] = cUseState(0);
  const readKey = 'eurostar-lms-cand-notif-read-' + (candId || 'x');
  React.useEffect(() => {
    if (!candId) return;
    const API = window.EUROSTAR_API || location.origin;
    const pull = () => fetch(API + '/admin/lms/notifs').then(r => (r.ok ? r.json() : {})).then(m => {
      const items = (m && m[candId]) || [];
      let read = []; try { read = JSON.parse(localStorage.getItem(readKey) || '[]'); } catch (e) {}
      setCount(items.filter(n => !read.includes(n.id)).length);
    }).catch(() => {});
    pull();
    const iv = setInterval(pull, 12000);
    return () => clearInterval(iv);
  }, [candId]);
  return (
    <button className="menu" onClick={() => go && go('notifications')} aria-label="Notifications" style={{ position: 'relative', fontSize: 18 }}>🔔
      {count > 0 && <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999, background: 'var(--lms-purple)', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{count}</span>}
    </button>
  );
}

// Full-page notifications list — updates the office pushed to this candidate.
function CandNotifications({ candId, go }) {
  const [items, setItems] = cUseState(null);
  const readKey = 'eurostar-lms-cand-notif-read-' + (candId || 'x');
  React.useEffect(() => {
    if (!candId) { setItems([]); return; }
    const API = window.EUROSTAR_API || location.origin;
    fetch(API + '/admin/lms/notifs').then(r => (r.ok ? r.json() : {})).then(m => {
      const its = (m && m[candId]) || [];
      setItems(its);
      try { localStorage.setItem(readKey, JSON.stringify(its.map(n => n.id))); } catch (e) {}
    }).catch(() => setItems([]));
  }, [candId]);
  return (
    <>
      <div className="cand-appbar"><button className="menu" onClick={() => go('home')}><CandIcon name="back" /></button><div><h3>Notifications</h3><small>Updates from the hiring team</small></div></div>
      <div className="cand-pad">
        {items === null ? <div style={{ textAlign: 'center', color: 'var(--lms-meta)', padding: '30px 0' }}>…</div>
          : items.length === 0 ? <div style={{ textAlign: 'center', padding: '50px 20px' }}><div style={{ fontSize: 36 }}>🔔</div><div style={{ fontWeight: 700, color: 'var(--lms-ink)', marginTop: 12, fontSize: 16 }}>No notifications yet</div><div style={{ fontSize: 13.5, color: 'var(--lms-meta)', marginTop: 8, lineHeight: '20px' }}>You'll see updates here when the office schedules your screening, unlocks training, or shares a decision.</div></div>
            : items.map(n => (
              <div key={n.id} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--lms-divider)' }}>
                <span style={{ fontSize: 18 }}>{n.icon || '🔔'}</span>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, color: 'var(--lms-ink-2)', lineHeight: '19px' }}>{n.text}</div>{n.time && <div style={{ fontSize: 11, color: 'var(--lms-meta)', marginTop: 3 }}>{n.time}</div>}</div>
              </div>
            ))}
      </div>
    </>
  );
}

function CandDashboard({ cand, go, onMenu }) {
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
        <button className="menu" onClick={onMenu}><CandIcon name="menu" /></button>
        <div style={{ flex: 1 }}><h3>Dashboard</h3><small>Hey {(cand.name || '').split(' ')[0]} 👋 · <b style={{ fontFamily: 'monospace', color: 'var(--lms-purple-ink)' }}>{cand.candId}</b></small></div>
        <CandBell candId={cand.candId} go={go} />
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

// ---- Apply Now form (real: POST /candidates/me/apply + /candidates/me/resume) ----
function CandApply({ go, cand, onSaved }) {
  const [city, setCity] = cUseState(cand.city || '');
  const [state, setStateV] = cUseState(cand.state || '');
  const [exp, setExp] = cUseState(cand.exp || '');
  const [source, setSource] = cUseState(cand.source || '');
  const [file, setFile] = cUseState(null);
  const [resumeName, setResumeName] = cUseState(cand.resumeName || '');
  const [busy, setBusy] = cUseState(false);
  const [err, setErr] = cUseState('');
  const fileRef = React.useRef(null);

  const pickFile = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setErr('That file is larger than 5MB.'); return; }
    setFile(f); setResumeName(f.name); setErr('');
  };

  const submit = () => {
    if (busy) return;
    setErr('');
    if (!city.trim() || !state || !exp || !source) { setErr('Please fill all required fields.'); return; }
    setBusy(true);
    candApi('POST', '/candidates/me/apply', { city: city.trim(), state, exp, source }).then(res => {
      if (!res.ok) { setBusy(false); setErr((res.data && res.data.error) || 'Could not submit — try again.'); return; }
      if (!file) { setBusy(false); onSaved(res.data); go('home'); return; }
      const form = new FormData();
      form.append('file', file);
      candApi('POST', '/candidates/me/resume', form, true).then(r2 => {
        setBusy(false);
        onSaved(r2.ok ? r2.data : res.data);
        if (!r2.ok) setErr((r2.data && r2.data.error) || 'Application saved, but the resume upload failed.');
        else go('home');
      });
    });
  };

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
        <div className="cand-ipt-wrap"><span className="ic"><CandIcon name="user" /></span><input className="cand-ipt locked" value={cand.name || ''} readOnly /><span className="lock"><CandIcon name="lock" /></span></div>
        <div className="cand-label">Mobile Number *</div>
        <div className="cand-ipt-wrap"><span className="ic"><CandIcon name="phone" /></span><input className="cand-ipt locked" value={cand.phone || ''} readOnly /><span className="lock"><CandIcon name="lock" /></span></div>
        <div className="cand-label">Email Address *</div>
        <div className="cand-ipt-wrap"><span className="ic"><CandIcon name="mail" /></span><input className="cand-ipt locked" value={cand.email || ''} readOnly /><span className="lock"><CandIcon name="lock" /></span></div>
        <div className="cand-label">City *</div>
        <div className="cand-ipt-wrap"><span className="ic"><CandIcon name="city" /></span><input className="cand-ipt" placeholder="e.g. Mumbai" value={city} onChange={e => setCity(e.target.value)} /></div>
        <div className="cand-label">State *</div>
        <select className="cand-ipt" style={{ paddingLeft: 14 }} value={state} onChange={e => setStateV(e.target.value)}><option value="">Select State</option>{window.LMS_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select>

        <div className="cand-sec">Experience &amp; Documents</div>
        <div className="cand-label">Years of Experience *</div>
        <select className="cand-ipt" style={{ paddingLeft: 14 }} value={exp} onChange={e => setExp(e.target.value)}><option value="">Select</option>{window.LMS_EXP.map(s => <option key={s} value={s}>{s}</option>)}</select>
        <div className="cand-label">Resume / CV *</div>
        <div onClick={() => fileRef.current && fileRef.current.click()} style={{ cursor: 'pointer', border: '1.5px dashed var(--lms-purple)', background: 'var(--lms-purple-soft)', borderRadius: 14, padding: '26px 14px', textAlign: 'center', color: 'var(--lms-purple-ink)' }}>
          <div style={{ fontSize: 24 }}><CandIcon name="doc" /></div>
          <div style={{ fontWeight: 600, marginTop: 6 }}>{resumeName || 'Click to upload or drag & drop'}</div>
          <div style={{ fontSize: 12, color: 'var(--lms-meta)' }}>{resumeName ? 'Tap to replace' : 'PDF or Word · Max 5MB'}</div>
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style={{ display: 'none' }} onChange={pickFile} />
        <div className="cand-label">How did you know about this *</div>
        <select className="cand-ipt" style={{ paddingLeft: 14 }} value={source} onChange={e => setSource(e.target.value)}><option value="">Select Source</option>{window.LMS_SOURCES.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}</select>
        {err && <div style={{ marginTop: 14, color: '#9A3B3B', fontSize: 13, background: '#F6E7E7', border: '1px solid #E6C9C9', borderRadius: 10, padding: '10px 12px' }}>{err}</div>}
        <div style={{ marginTop: 20 }}><button className="cand-btn" onClick={submit} disabled={busy} style={busy ? { opacity: .6 } : {}}>{busy ? 'Submitting…' : 'Submit Application'}</button></div>
        <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--lms-meta)', marginTop: 12 }}>Your data is confidential and used only for hiring purposes.</p>
      </div>
    </>
  );
}

// ---- My Status (stage tracker) ----
function CandStatus({ go, stage, cand }) {
  const steps = window.LMS_STAGES.filter(s => s.id !== 'rejected');
  const c = cand || {};
  // Use the derived current stage (screening result, training/test windows,
  // score, hire) — the same truth the office sees — instead of the raw `stage`
  // field, which lags. Otherwise the candidate sits at "screening" while the
  // office has already moved them into training.
  const effStage = window.lmsEffectiveStage ? window.lmsEffectiveStage(c) : stage;
  const idx = steps.findIndex(s => s.id === effStage);
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
    registered:  { date: 'Not submitted', next: 'Fill in the Apply Now form to submit your application — we cannot review you until you do.' },
    applied:     { date: c.applied || '—', next: 'Our team will review your application and call to schedule a short screening.' },
    screening:   { date: c.screenResult ? 'Screened' : 'Scheduled', next: c.screenResult === 'pass' ? 'You cleared screening — training will be unlocked shortly.' : 'Attend your screening call. Be ready to talk about your experience.' },
    training:    { date: w.state === 'open' ? w.daysLeft + ' days left' : w.state === 'expired' ? 'Window expired' : 'Locked', next: 'Watch all training videos, then your test will be unlocked.' },
    testing:     { date: c.score != null ? c.score + '%' : (t.state === 'open' ? t.daysLeft + ' days left' : 'Not taken'), next: 'Clear the test with ≥ ' + window.LMS_PASS_PCT + '% to be recommended for hiring.' },
    recommended: { date: c.score != null ? 'Scored ' + c.score + '%' : '—', next: 'Awaiting the office\u2019s final hiring decision.' },
    hired:       { date: c.repId || '—', next: 'You\u2019re hired! Use your Rep ID to log in to the Eurostar Sales App.' },
  };
  const m = meta[effStage] || {};
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

// A video we uploaded ourselves can be played inline. A YouTube/Vimeo page URL
// cannot — a <video> tag needs the media file itself, not a watch page.
function isPlayable(url) {
  if (!url) return false;
  if (url.indexOf('/media/training-video/') !== -1) return true;
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}

function CandTraining({ go, cand, actions, lang }) {
  const L = lang || 'en';
  // The curriculum comes from the office's Training Content Manager, not a
  // hardcoded list — otherwise nothing an admin adds or edits ever reaches a
  // candidate. Practice simulations still come from the built-in definitions,
  // matched by position, since the database has no model for them.
  const [mods, setMods] = cUseState(null);
  const [loadErr, setLoadErr] = cUseState('');
  React.useEffect(() => {
    candApi('GET', '/modules').then(res => {
      if (res.ok && Array.isArray(res.data)) setMods(res.data);
      else setLoadErr('Could not load your training modules. Check your connection and try again.');
    });
  }, []);

  const watched = (cand && cand.watched) || [];
  const allVids = (mods || []).filter(m => m.summary || m.videoUrl).map(m => m.id);
  const allDone = allVids.length > 0 && allVids.every(id => watched.includes(id));
  const watch = (vid) => actions && actions.markWatched(cand.id, vid);
  const watchedCount = allVids.filter(id => watched.includes(id)).length;

  return (
    <>
      <div className="cand-appbar"><button className="menu" onClick={() => go('home')}><CandIcon name="back" /></button><div><h3>Training</h3><small>{mods ? `${watchedCount}/${allVids.length} watched` : '…'}</small></div></div>
      <div className="cand-pad">
        <div style={{ marginBottom: 16, border: '1px solid #E6C9C9', background: '#FBF1F1', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flex: '0 0 auto' }}>⚠️</span>
          <div style={{ fontSize: 12, color: '#9A3B3B', lineHeight: 1.5 }}>
            <b>Confidential training material.</b> Do not record, screenshot, download or share these videos or any company data with anyone outside Eurostar. Violation will lead to <b>termination and legal action</b>.
          </div>
        </div>

        {mods === null && !loadErr && <div style={{ textAlign: 'center', color: 'var(--lms-meta)', padding: '30px 0' }}>Loading…</div>}
        {loadErr && <div style={{ background: '#FBEAEA', color: '#B3261E', borderRadius: 12, padding: '12px 14px', fontSize: 13 }}>{loadErr}</div>}
        {mods && mods.length === 0 && <div style={{ textAlign: 'center', color: 'var(--lms-meta)', padding: '30px 0', fontSize: 13.5 }}>No training modules have been published yet. Please check back soon.</div>}

        {(mods || []).map((m, i) => {
          const done = watched.includes(m.id);
          const notes = m.checklist || [];
          const hasVideo = !!(m.summary || m.videoUrl);
          const practice = (window.LMS_MODULES[i] || {}).practice;
          return (
            <div key={m.id} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="lms-tag lms-tag-mod">M{i + 1}</span>
                <strong style={{ fontSize: 15 }}>{m.title}</strong>
              </div>
              {hasVideo && (
                <div className="cand-vid">
                  {/* Greyed out when there is nothing to play. A green play
                      button with no video behind it reads as a broken player,
                      not as "the office hasn't uploaded this one yet". */}
                  <span className="play" style={!m.videoUrl ? { background: '#C9C6BD' } : (done ? { background: '#9A6B12' } : {})}><CandIcon name="play" /></span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{m.summary || m.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--lms-meta)' }}>
                      {m.videoDuration ? m.videoDuration + ' · ' : ''}{m.mandatory ? 'Mandatory' : 'Optional'}
                      {!m.videoUrl && ' · not uploaded yet'}
                    </div>
                  </div>
                  {m.videoUrl && !isPlayable(m.videoUrl) && <a href={m.videoUrl} target="_blank" rel="noopener noreferrer" className="lms-btn lms-btn-ghost lms-btn-sm" style={{ textDecoration: 'none' }}>Watch</a>}
                  {done
                    ? <span className="lms-pill" style={{ background: 'var(--lms-green-soft)', color: 'var(--lms-green-ink)', fontSize: 11 }}>✓ Watched</span>
                    : <button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={() => watch(m.id)}>Mark watched</button>}
                </div>
              )}
              {hasVideo && !m.videoUrl && (
                <div style={{ fontSize: 12.5, color: 'var(--lms-meta)', background: '#F4F2EC', borderRadius: 10, padding: '9px 12px', marginTop: 8 }}>
                  🎬 The video for this module hasn’t been uploaded yet — read the notes below in the meantime.
                </div>
              )}
              {/* An uploaded file plays inline; an external link (YouTube etc.)
                  cannot be put in a <video> tag, so that keeps the Watch link. */}
              {m.videoUrl && isPlayable(m.videoUrl) && (
                <video
                  controls
                  preload="metadata"
                  controlsList="nodownload"
                  onContextMenu={e => e.preventDefault()}
                  onEnded={() => !done && watch(m.id)}
                  style={{ width: '100%', borderRadius: 12, marginTop: 8, background: '#000', display: 'block' }}
                  src={(window.EUROSTAR_API || '') + m.videoUrl}
                />
              )}
              {notes.length > 0 && (
                <div className="cand-notes">
                  <div className="cand-notes-head"><span>📝</span> Module notes</div>
                  <ul>{notes.map((n, ni) => <li key={ni}>{n}</li>)}</ul>
                </div>
              )}
              {practice && <CandPractice practice={practice} candId={cand ? cand.id : 'demo'} />}
            </div>
          );
        })}

        {mods && allVids.length > 0 && (
          <>
            <div style={{ height: 8, background: '#EEEBE3', borderRadius: 8, margin: '6px 0 14px', overflow: 'hidden' }}><div style={{ height: '100%', width: `${(watchedCount / allVids.length) * 100}%`, background: 'var(--lms-green)' }} /></div>
            {allDone
              ? <button className="cand-btn green" onClick={() => go('home')}>✓ Training complete — back to dashboard</button>
              : <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--lms-meta)' }}>Watch all videos to complete training. The test unlocks separately when the office opens it.</div>}
          </>
        )}
      </div>
    </>
  );
}

// ---- Take Test ----
function CandTest({ go, onSubmit, onAbort, cand }) {
  // The paper comes from the server WITHOUT the answer key, and the server
  // marks it. Previously the whole bank — correct answers included — was handed
  // to the browser and scored there, so the answers were readable in the page
  // source before the test even started.
  const [paper, setPaper] = cUseState(null); // null = loading
  const [cfg, setCfg] = cUseState(null);
  const [loadErr, setLoadErr] = cUseState('');
  const [started, setStarted] = cUseState(false);
  const [i, setI] = cUseState(0);
  const [ans, setAns] = cUseState({});
  const [secs, setSecs] = cUseState(0);
  const [submitting, setSubmitting] = cUseState(false);
  const submittedRef = React.useRef(false);

  React.useEffect(() => {
    candApi('GET', '/questions/paper').then(res => {
      if (res.ok && res.data && Array.isArray(res.data.questions)) {
        setPaper(res.data.questions);
        setCfg(res.data.config);
        setSecs((res.data.config.durationMin || 15) * 60);
      } else {
        setLoadErr('Could not load the test. Check your connection and try again.');
      }
    });
  }, []);

  const qs = paper || [];
  const q = qs[i];
  const last = i === qs.length - 1;
  const pick = (oi) => q && setAns(a => ({ ...a, [q.id]: oi }));

  const submit = React.useCallback(() => {
    // Guarded: the timer hitting zero and a tap on Submit can both fire.
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    candApi('POST', '/questions/score', { answers: ans }).then(res => {
      setSubmitting(false);
      if (!res.ok || !res.data) {
        submittedRef.current = false;
        alert('Could not submit your test — check your connection and try again.');
        return;
      }
      if (onSubmit) onSubmit(res.data); else go('result');
    });
  }, [ans, onSubmit, go]);

  // countdown timer while the test is running
  React.useEffect(() => {
    if (!started || submittedRef.current) return;
    if (secs <= 0) { submit(); return; }
    const t = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [started, secs, submit]);
  const mmss = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

  // training-completion gate — watched ids are module ids, matching Training.
  const watched = (cand && cand.watched) || [];
  const [modIds, setModIds] = cUseState(null);
  React.useEffect(() => {
    candApi('GET', '/modules').then(res => {
      if (res.ok && Array.isArray(res.data)) setModIds(res.data.filter(m => m.summary || m.videoUrl).map(m => m.id));
      else setModIds([]);
    });
  }, []);
  const trainingDone = modIds !== null && modIds.length > 0 && modIds.every(id => watched.includes(id));

  if (paper === null || modIds === null) {
    return (
      <>
        <div className="cand-appbar"><button className="menu" onClick={() => go('home')}><CandIcon name="back" /></button><div><h3>Take Test</h3></div></div>
        <div className="cand-pad" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--lms-meta)' }}>{loadErr || 'Loading…'}</div>
      </>
    );
  }

  if (qs.length === 0) {
    return (
      <>
        <div className="cand-appbar"><button className="menu" onClick={() => go('home')}><CandIcon name="back" /></button><div><h3>Take Test</h3></div></div>
        <div className="cand-pad" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 34 }}>📝</div>
          <p className="cand-sub" style={{ marginTop: 12 }}>No assessment has been published yet. Please check back once the office has set it up.</p>
          <button className="cand-btn" onClick={() => go('home')}>Back to dashboard</button>
        </div>
      </>
    );
  }

  // Start gate — one-shot warning before the test begins.
  if (!started) {
    return (
      <>
        <div className="cand-appbar"><button className="menu" onClick={() => go('home')}><CandIcon name="back" /></button><div><h3>Take Test</h3></div></div>
        <div className="cand-pad" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginTop: 16 }}>⚠️</div>
          <div style={{ fontSize: 19, fontWeight: 700, marginTop: 8 }}>One attempt — finish in one sitting</div>
          <p className="cand-sub" style={{ textAlign: 'left', marginTop: 14 }}>
            • {qs.length} questions{cfg && cfg.randomize ? ' (random order)' : ''} · pass mark <b>{cfg ? cfg.passPct : 70}%</b><br/>
            • Time limit: <b>{cfg ? cfg.durationMin : 15} minutes</b> — the test auto-submits when time runs out.<br/>
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
  const opts = q.type === 'True-False' ? ['True', 'False'] : q.options;
  return (
    <>
      <div className="cand-appbar"><button className="menu" onClick={abandon}><CandIcon name="back" /></button><div style={{ flex: 1 }}><h3>Take Test</h3><small>Question {i + 1} of {qs.length} · ⚠️ one attempt</small></div>
        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, padding: '4px 10px', borderRadius: 8, background: lowTime ? '#F6E7E7' : '#EDE7FB', color: lowTime ? '#B91C1C' : 'var(--lms-purple-ink)' }}>⏱ {mmss}</span>
      </div>
      <div className="cand-pad">
        <div style={{ height: 6, background: '#EEEBE3', borderRadius: 6, marginBottom: 20 }}><div style={{ height: '100%', width: `${((i + 1) / qs.length) * 100}%`, background: 'var(--lms-purple)', borderRadius: 6 }} /></div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}><span className={'lms-tag ' + (q.type === 'MCQ' ? 'lms-tag-mcq' : 'lms-tag-tf')}>{q.type}</span></div>
        <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.4, marginBottom: 20 }}>{q.prompt}</div>
        {opts.map((o, oi) => (
          <div key={oi} className={'cand-qopt' + (ans[q.id] === oi ? ' sel' : '')} onClick={() => pick(oi)}><span className="rd" />{o}</div>
        ))}
        <div style={{ marginTop: 18 }}>
          {last
            ? <button className="cand-btn green" disabled={ans[q.id] === undefined || submitting} style={ans[q.id] === undefined || submitting ? { opacity: .5 } : {}} onClick={submit}>{submitting ? 'Submitting…' : 'Submit Test'}</button>
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
    <div className="cand-overlay cand-overlay-bottom">
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

// ---- Account menu (hamburger): change password / sign out ----
function CandMenu({ cand, onClose, onSignOut }) {
  const [changing, setChanging] = cUseState(false);
  const [cur, setCur] = cUseState('');
  const [nw, setNw] = cUseState('');
  const [nw2, setNw2] = cUseState('');
  const [busy, setBusy] = cUseState(false);
  const [err, setErr] = cUseState('');
  const [done, setDone] = cUseState(false);

  const initials = (cand.name || '?').trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();

  const savePassword = () => {
    setErr('');
    if (nw.length < 6) { setErr('Use at least 6 characters.'); return; }
    if (nw !== nw2) { setErr('New passwords do not match.'); return; }
    setBusy(true);
    candApi('POST', '/auth/candidate/password', { currentPassword: cur || undefined, newPassword: nw }).then(res => {
      setBusy(false);
      if (!res.ok) { setErr((res.data && res.data.error) || 'Could not change your password.'); return; }
      setDone(true); setCur(''); setNw(''); setNw2('');
    });
  };

  return (
    <div className="cand-overlay" style={{ zIndex: 70 }} onClick={onClose}>
      <div className="cand-drawer" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--lms-purple)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>{initials}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{cand.name}</div>
            <div style={{ fontSize: 12, color: 'var(--lms-meta)', fontFamily: 'monospace' }}>{cand.candId}</div>
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--lms-meta)', lineHeight: 1.7, marginBottom: 18 }}>
          {cand.email && <div>✉️ {cand.email}</div>}
          {cand.phone && <div>📱 {cand.phone}</div>}
        </div>

        {!changing && (
          <button className="cand-btn cand-btn-ghost" style={{ marginBottom: 10 }} onClick={() => { setChanging(true); setDone(false); }}>Change password</button>
        )}
        {changing && (
          <div style={{ border: '1px solid var(--lms-border)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
            {done ? (
              <div style={{ color: 'var(--lms-green-ink)', fontSize: 13.5, fontWeight: 600 }}>✓ Password changed.</div>
            ) : (
              <>
                <div className="cand-label" style={{ marginTop: 0 }}>Current password</div>
                <div className="cand-ipt-wrap"><span className="ic"><CandIcon name="lock" /></span><input className="cand-ipt" type="password" placeholder="Enter current password" value={cur} onChange={e => setCur(e.target.value)} /></div>
                <div className="cand-label">New password</div>
                <div className="cand-ipt-wrap"><span className="ic"><CandIcon name="lock" /></span><input className="cand-ipt" type="password" placeholder="Enter new password" value={nw} onChange={e => setNw(e.target.value)} /></div>
                <div className="cand-label">Confirm new password</div>
                <div className="cand-ipt-wrap"><span className="ic"><CandIcon name="lock" /></span><input className="cand-ipt" type="password" placeholder="Re-enter new password" value={nw2} onChange={e => setNw2(e.target.value)} /></div>
                <div style={{ fontSize: 11.5, color: 'var(--lms-meta)', marginTop: 4 }}>Use at least 6 characters.</div>
                {err && <div style={{ marginTop: 10, color: '#9A3B3B', fontSize: 12.5 }}>{err}</div>}
                <button className="cand-btn" style={{ marginTop: 12 }} onClick={savePassword} disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
              </>
            )}
          </div>
        )}

        <button className="cand-btn" style={{ marginTop: 18, background: '#F6E7E7', color: '#9A3B3B' }}
          onClick={() => { if (window.confirm('Sign out of your Eurostar Academy account?')) onSignOut(); }}>
          Sign out
        </button>
      </div>
    </div>
  );
}

function CandidateApp({ questions, testCfg }) {
  const [authed, setAuthed] = cUseState(false);
  const [checking, setChecking] = cUseState(true);
  const [mode, setMode] = cUseState('register');
  const [screen, setScreen] = cUseState('home');
  const [lang, setLang] = cUseState(null); // null until chosen on first dashboard arrival
  const [cand, setCand] = cUseState(null);
  const [menuOpen, setMenuOpen] = cUseState(false);
  const [notice, setNotice] = cUseState('');

  const loadCand = () => candApi('GET', '/candidates/me').then(res => {
    if (res.ok && res.data) { setCand(res.data); setAuthed(true); return true; }
    if (res.status === 401 || res.status === 403) { try { localStorage.removeItem(CAND_TOKEN_KEY); } catch (e) {} }
    setAuthed(false);
    return false;
  });

  React.useEffect(() => {
    let token = '';
    try { token = localStorage.getItem(CAND_TOKEN_KEY) || ''; } catch (e) {}
    if (!token) { setChecking(false); return; }
    loadCand().then(() => setChecking(false));
  }, []);

  // Any call refused with 401/403 means this session is over. Drop straight to
  // the sign-in screen with a reason, rather than leaving a screen that looks
  // signed in but fails on every action.
  React.useEffect(() => {
    const onEnded = () => {
      try { localStorage.removeItem(CAND_TOKEN_KEY); } catch (e) {}
      setAuthed(false); setCand(null); setMenuOpen(false);
      setNotice('Your session has ended. Please sign in again to submit your application.');
    };
    window.addEventListener('cand-session-ended', onEnded);
    return () => window.removeEventListener('cand-session-ended', onEnded);
  }, []);

  const onSignedIn = (token) => {
    try { localStorage.setItem(CAND_TOKEN_KEY, token); } catch (e) {}
    setNotice('');
    setChecking(true);
    loadCand().then(() => setChecking(false));
  };
  const signOut = () => {
    try { localStorage.removeItem(CAND_TOKEN_KEY); } catch (e) {}
    setAuthed(false); setCand(null); setScreen('home'); setMenuOpen(false); setLang(null);
  };

  if (checking) return <CandShell><div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--lms-meta)' }}>Loading…</div></CandShell>;
  if (!authed || !cand) return <CandShell><CandAuth mode={mode} setMode={setMode} onDone={onSignedIn} notice={notice} /></CandShell>;

  const go = (s) => setScreen(s);
  // These mutate the candidate's OWN record only, without an office/admin token —
  // watched-videos and test attempts have no self-service endpoint yet, so they
  // update the local view but (unlike Apply/Resume, which are real) don't persist.
  const localActions = {
    markWatched: (id, vid) => setCand(c => c ? { ...c, watched: (c.watched || []).includes(vid) ? c.watched : [...(c.watched || []), vid] } : c),
    consumeTest: () => setCand(c => c ? { ...c, testConsumed: true } : c),
    setOnboarding: (id, patch) => setCand(c => c ? { ...c, onboarding: { ...(c.onboarding || {}), ...patch } } : c),
    signConfidentiality: () => setCand(c => c ? { ...c, onboarding: { ...(c.onboarding || {}), confidentiality: true } } : c),
  };
  // `result` is the server's marking ({score, passed, passPct}) — the pass mark
  // is whatever the office set in Test config, not a hardcoded 70.
  const submitTest = (result) => {
    const score = typeof result === 'number' ? result : result.score;
    const passed = typeof result === 'number' ? score >= (window.LMS_PASS_PCT || 70) : !!result.passed;
    setCand(c => {
      if (!c) return c;
      const n = (c.attempts || []).length + 1;
      const attempts = [...(c.attempts || []), { n, score, date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), passed }];
      const next = { ...c, score, attempts, testConsumed: true, stage: passed ? 'recommended' : c.stage, passPct: typeof result === 'number' ? c.passPct : result.passPct };
      // The office needs to see the result — it decides who reaches the
      // approval queue. Without this the score only ever lived in the browser.
      candApi('POST', '/candidates/me/test-result', { score, passed });
      return next;
    });
    setScreen('result');
  };

  let view;
  if (screen === 'home') view = <CandDashboard cand={cand} go={go} onMenu={() => setMenuOpen(true)} />;
  else if (screen === 'apply') view = <CandApply go={go} cand={cand} onSaved={setCand} />;
  else if (screen === 'status') view = <CandStatus go={go} stage={cand.stage} cand={cand} />;
  else if (screen === 'notifications') view = <CandNotifications candId={cand.candId} go={go} />;
  else if (screen === 'training') view = <CandTraining go={go} cand={cand} actions={localActions} lang={lang || 'en'} />;
  else if (screen === 'test') view = <CandTest go={go} onSubmit={submitTest} onAbort={() => { localActions.consumeTest(); setScreen('home'); }} cand={cand} />;
  else if (screen === 'result') view = <CandResult go={go} cand={cand} />;
  else if (screen === 'onboarding') view = <CandOnboarding go={go} cand={cand} actions={localActions} />;
  else view = <CandDashboard cand={cand} go={go} onMenu={() => setMenuOpen(true)} />;
  return (
    <CandShell
      overlay={
        <>
          {screen === 'home' && lang === null && <CandLangSheet onPick={setLang} />}
          {menuOpen && <CandMenu cand={cand} onClose={() => setMenuOpen(false)} onSignOut={signOut} />}
        </>
      }
    >
      {view}
    </CandShell>
  );
}

Object.assign(window, { CandidateApp });
