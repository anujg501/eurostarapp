// lms-admin.jsx — Eurostar LMS admin (green desktop)
const { useState: aUseState } = React;

function LmsPageHead({ title, sub }) {
  return <div className="lms-pagehead"><h2>{title}</h2>{sub && <p>{sub}</p>}</div>;
}
function stageMeta(id) { return (window.LMS_STAGES || []).find(s => s.id === id) || { label: id, color: '#888' }; }
function StagePill({ id }) {
  const m = stageMeta(id);
  return <span className="lms-pill" style={{ background: m.color + '1A', color: m.color }}><span className="dot" style={{ background: m.color }} />{m.label}</span>;
}
function srcMeta(id) { return (window.LMS_SOURCES || []).find(s => s.id === id) || { label: id, icon: '•' }; }

// ---------- Dashboard ----------
function LmsDashboard({ go, cands, actions, openCand }) {
  const C = cands || window.LMS_CANDIDATES;
  const counts = {};
  window.LMS_STAGES.forEach(s => counts[s.id] = C.filter(c => c.stage === s.id).length);
  const total = C.length;
  const active = C.filter(c => !['hired','rejected'].includes(c.stage)).length;
  const hired = counts.hired;
  const pending = counts.recommended;
  const srcCounts = {}; C.forEach(c => srcCounts[c.source] = (srcCounts[c.source] || 0) + 1);
  const maxSrc = Math.max(1, ...Object.values(srcCounts));
  const stateCounts = {}; C.filter(c => c.stage === 'hired').forEach(c => stateCounts[c.state] = (stateCounts[c.state] || 0) + 1);
  const kpi = [
    { label: 'Total Applications', val: total, sub: '+0 this week', ic: '👥', c: '#15803D' },
    { label: 'Active in Pipeline', val: active, sub: 'Across all active stages', ic: '⚡', c: '#0891B2' },
    { label: 'Hired Reps', val: hired, sub: 'Total hired to date', ic: '✓', c: '#7C3AED' },
    { label: 'Pending Approval', val: pending, sub: 'Needs your review →', ic: '⏱', c: '#B7791F' },
  ];
  const funnel = window.LMS_STAGES;
  return (
    <div className="lms-body">
      <LmsPageHead title="Dashboard" sub="Welcome back, Anuj Gupta. Here's what's happening." />
      <div className="lms-kpis">
        {kpi.map(k => (
          <div key={k.label} className="lms-kpi">
            <div className="lms-kpi-top"><span className="lms-kpi-label">{k.label}</span><span className="lms-kpi-ic" style={{ background: k.c + '1A', color: k.c }}>{k.ic}</span></div>
            <div className="lms-kpi-val">{k.val}</div><div className="lms-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>
      <div className="lms-funnel">
        {funnel.map(s => (
          <div key={s.id} className="lms-fcell"><div className="v">{counts[s.id]}</div><div className="l">{s.label}</div><div className="bar" style={{ background: s.color }} /></div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, alignItems: 'start' }}>
        <div className="lms-card">
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--lms-divider)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><strong style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 17 }}>Recent Applications</strong><div className="lms-muted" style={{ fontSize: 12.5 }}>Latest applications across the system</div></div>
            <button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={() => go('candidates')}>View all</button>
          </div>
          <div className="lms-tablewrap"><table className="lms-table"><thead><tr><th>Candidate</th><th>Location</th><th>Stage</th></tr></thead>
            <tbody>{C.map(c => (
              <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => openCand && openCand(c.id)}><td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="lms-av" style={{ background: `hsl(${c.hue} 60% 45%)` }}>{c.avatar}</span><div><div style={{ fontWeight: 600 }}>{c.name}</div><div className="lms-muted" style={{ fontSize: 12 }}>{c.email}</div></div></div></td>
              <td className="lms-muted">{c.city}, {c.state}</td><td><StagePill id={window.lmsEffectiveStage(c)} /></td></tr>
            ))}</tbody></table></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="lms-card lms-card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><strong style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 16 }}>Approval Queue</strong><span style={{ color: '#B7791F', fontWeight: 600, fontSize: 13 }}>{pending} pending</span></div>
            {C.filter(c => c.stage === 'recommended').map(c => (
              <div key={c.id} style={{ border: '1px solid var(--lms-border)', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="lms-av" style={{ background: `hsl(${c.hue} 60% 45%)` }}>{c.avatar}</span><div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{c.name}</div><div className="lms-muted" style={{ fontSize: 12 }}>{c.city}, {c.state} · {c.exp} exp</div></div><span className="lms-pill" style={{ background: 'var(--lms-green-soft)', color: 'var(--lms-green-ink)' }}>{c.score}%</span></div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}><button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={() => go('approval')}>Approve</button><button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={() => openCand && openCand(c.id)}>View</button></div>
              </div>
            ))}
          </div>
          <div className="lms-card lms-card-pad">
            <strong style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 16, display: 'block', marginBottom: 14 }}>Application Source</strong>
            <div className="lms-bars">{Object.entries(srcCounts).map(([s, n]) => (
              <div key={s} className="lms-bar-row"><span>{srcMeta(s).icon} {srcMeta(s).label}</span><div className="lms-bar-track"><div className="lms-bar-fill" style={{ width: `${(n / maxSrc) * 100}%`, background: s === 'google' ? '#2563EB' : s === 'linkedin' ? '#15803D' : '#D97706' }} /></div><span style={{ textAlign: 'right', fontWeight: 600 }}>{n}</span></div>
            ))}</div>
          </div>
          <div className="lms-card lms-card-pad">
            <strong style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 16, display: 'block', marginBottom: 14 }}>Hired Reps by State</strong>
            <div className="lms-bars">{Object.entries(stateCounts).map(([s, n]) => (
              <div key={s} className="lms-bar-row"><span>{s}</span><div className="lms-bar-track"><div className="lms-bar-fill" style={{ width: '100%', background: '#2563EB' }} /></div><span style={{ textAlign: 'right', fontWeight: 600 }}>{n}</span></div>
            ))}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Candidates ----------
function LmsCandidates({ cands, actions, openCand }) {
  const [q, setQ] = aUseState('');
  const [stage, setStage] = aUseState('');
  const [state, setState] = aUseState('');
  const [src, setSrc] = aUseState('');
  let C = cands || window.LMS_CANDIDATES;
  C = C.filter(c =>
    (!q || (c.name + c.city + c.phone).toLowerCase().includes(q.toLowerCase())) &&
    (!stage || c.stage === stage) && (!state || c.state === state) && (!src || c.source === src));
  const clear = () => { setQ(''); setStage(''); setState(''); setSrc(''); };
  const winLabel = (w) => {
    if (w.state === 'hired') return <span className="lms-pill" style={{ background: 'var(--lms-green-soft)', color: 'var(--lms-green-ink)' }}>Hired</span>;
    if (w.state === 'open') return <span className="lms-pill" style={{ background: '#FBF1DA', color: '#9A6B12' }}>● {w.daysLeft}d left</span>;
    if (w.state === 'expired') return <span className="lms-pill" style={{ background: '#F3E6E6', color: '#A23B3B' }}>Expired</span>;
    return <span className="lms-pill" style={{ background: '#ECEAE3', color: '#6B6356' }}>🔒 Locked</span>;
  };
  const testLabel = (t) => {
    if (t.state === 'hired') return <span className="lms-pill" style={{ background: 'var(--lms-green-soft)', color: 'var(--lms-green-ink)' }}>Hired</span>;
    if (t.state === 'done') return <span className="lms-pill" style={{ background: 'var(--lms-green-soft)', color: 'var(--lms-green-ink)' }}>Taken</span>;
    if (t.state === 'open') return <span className="lms-pill" style={{ background: '#E1ECFB', color: '#1D4ED8' }}>● {t.daysLeft}d left</span>;
    if (t.state === 'expired') return <span className="lms-pill" style={{ background: '#F3E6E6', color: '#A23B3B' }}>Expired</span>;
    if (t.state === 'used') return <span className="lms-pill" style={{ background: '#F6E9D6', color: '#9A6B12' }}>Attempt used</span>;
    return <span className="lms-pill" style={{ background: '#ECEAE3', color: '#6B6356' }}>🔒 Locked</span>;
  };
  return (
    <div className="lms-body">
      <LmsPageHead title="Candidates" sub={`${C.length} total candidates`} />
      <div className="lms-card lms-card-pad" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start', background: '#F4F6F4', borderColor: '#DCE6DC' }}>
        <span style={{ fontSize: 16 }}>🔓</span>
        <div className="lms-muted" style={{ fontSize: 13 }}>
          <b>Training</b> and the <b>Test</b> are unlocked separately. Unlocking training opens a <b>{window.LMS_WINDOW_DAYS}-day</b> window (finish within {window.LMS_TRAIN_DAYS} days). Unlocking the test opens a <b>{window.LMS_TEST_DAYS}-day</b> window — the test is <b>one-shot</b> (it must be finished in a single sitting; leaving uses up the attempt). You can grant a <b>re-test</b> if needed. Pass mark <b>{window.LMS_PASS_PCT}%</b>.
        </div>
      </div>
      <div className="lms-card lms-card-pad" style={{ marginBottom: 16 }}>
        <div className="lms-filters">
          <div className="lms-field"><label>Search</label><input className="lms-input" placeholder="Name, city or phone…" value={q} onChange={e => setQ(e.target.value)} /></div>
          <div className="lms-field"><label>Stage</label><select className="lms-select" value={stage} onChange={e => setStage(e.target.value)}><option value="">All Stages</option>{window.LMS_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
          <div className="lms-field"><label>State</label><select className="lms-select" value={state} onChange={e => setState(e.target.value)}><option value="">All States</option>{window.LMS_STATES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div className="lms-field"><label>Source</label><select className="lms-select" value={src} onChange={e => setSrc(e.target.value)}><option value="">All Sources</option>{window.LMS_SOURCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
          <button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={clear} style={{ height: 38 }}>✕ Clear</button>
        </div>
      </div>
      <div className="lms-card lms-tablewrap">
        <table className="lms-table lms-table-wide">
          <thead><tr><th>#</th><th>Candidate</th><th>Location</th><th>Stage</th><th>Training Window</th><th>Test Window</th><th>Test Score</th><th>Rep ID</th><th>Actions</th></tr></thead>
          <tbody>{C.map(c => {
            const w = window.lmsWindow(c);
            const t = window.lmsTestWindow(c);
            return (
            <tr key={c.id}><td className="lms-muted">{c.n}</td>
              <td><div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => openCand && openCand(c.id)}><span className="lms-av" style={{ background: `hsl(${c.hue} 60% 45%)` }}>{c.avatar}</span><div><div style={{ fontWeight: 600, textDecoration: 'underline', textDecorationColor: 'var(--lms-border)' }}>{c.name}</div><div className="lms-muted" style={{ fontSize: 11.5, fontFamily: 'monospace' }}>{c.candId} · {c.phone}</div></div></div></td>
              <td className="lms-muted">{c.city}<div style={{ fontSize: 12 }}>{c.state}</div></td>
              <td><StagePill id={window.lmsEffectiveStage(c)} /></td>
              <td>{winLabel(w)}</td>
              <td>{testLabel(t)}</td>
              <td>{c.score != null ? <strong style={{ color: c.score >= window.LMS_PASS_PCT ? 'var(--lms-green-ink)' : '#A23B3B' }}>{c.score}%</strong> : <span className="lms-muted">—</span>}</td>
              <td className="lms-muted" style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: c.repId ? 700 : 400, color: c.repId ? 'var(--lms-ink)' : 'var(--lms-meta)' }}>{c.repId || '—'}</td>
              <td>
                {actions && c.stage !== 'hired' && <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 150 }}>
                  {(w.state === 'locked' || w.state === 'expired')
                    ? (window.lmsBaseStage(c) === 'registered'
                        ? <button className="lms-btn lms-btn-ghost lms-btn-sm" disabled
                            title="This candidate has only created an account — they have not submitted the Apply Now form yet."
                            style={{ opacity: .55, cursor: 'not-allowed' }}>🔒 Not applied yet</button>
                        : <button className="lms-btn lms-btn-pri lms-btn-sm" onClick={() => actions.unlockTraining(c.id)}>🔓 Unlock training</button>)
                    : <button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={() => actions.lockTraining(c.id)}>Lock training</button>}
                  {t.state === 'used'
                    ? <button className="lms-btn lms-btn-pri lms-btn-sm" style={{ background: '#1D4ED8' }} onClick={() => actions.allowRetest(c.id)}>↻ Allow re-test</button>
                    : (t.state === 'locked' || t.state === 'expired')
                      ? (window.lmsBaseStage(c) === 'registered'
                          ? <button className="lms-btn lms-btn-ghost lms-btn-sm" disabled
                              title="This candidate has only created an account — they have not submitted the Apply Now form yet."
                              style={{ opacity: .55, cursor: 'not-allowed' }}>🔒 Not applied yet</button>
                          : <button className="lms-btn lms-btn-pri lms-btn-sm" style={{ background: '#1D4ED8' }} onClick={() => actions.unlockTest(c.id)}>🔓 Unlock test</button>)
                      : t.state === 'open'
                        ? <button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={() => actions.lockTest(c.id)}>Lock test</button>
                        : <span className="lms-muted" style={{ fontSize: 12 }}>Test taken</span>}
                </div>}
                {c.stage === 'hired' && <span className="lms-muted" style={{ fontSize: 12 }}>—</span>}
              </td></tr>
          );})}</tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Screening Scheduler ----------
function LmsScreening({ cands, actions, settings }) {
  const [slot, setSlot] = aUseState('');
  const [outId, setOutId] = aUseState('');
  const [result, setResult] = aUseState('pass');
  const [rating, setRating] = aUseState(4);
  const [note, setNote] = aUseState('');
  // Scheduling side — was entirely dead: the candidate dropdown had no value/
  // onChange, and the "Schedule" button had no onClick at all.
  const todayISO = () => { try { return (window.LMS_TODAY || new Date()).toISOString().slice(0, 10); } catch (e) { return ''; } };
  const [schedId, setSchedId] = aUseState('');
  const [schedDate, setSchedDate] = aUseState(todayISO);
  const [schedLink, setSchedLink] = aUseState('');
  const [scheduling, setScheduling] = aUseState(false);
  const [schedMsg, setSchedMsg] = aUseState('');
  const zoom = (settings || window.LMS_SETTINGS).zoomConnected;
  const all = cands || window.LMS_CANDIDATES;
  const toScreen = all.filter(c => c.stage === 'applied' || c.stage === 'screening');
  const [savingOutcome, setSavingOutcome] = aUseState(false);
  const [outMsg, setOutMsg] = aUseState('');
  // Clearing the message on a timer meant a save that worked and a save that
  // was never attempted looked identical a few seconds later — the form also
  // reset the candidate dropdown to blank on success, so there was nothing
  // left on screen to show anything had happened at all. The message now
  // names who was saved and stays up until the next save starts.
  const pickOutId = (val) => { setOutId(val); setOutMsg(''); };
  const saveOutcome = () => {
    if (!outId || !actions || savingOutcome) return;
    const savedName = (toScreen.find(c => c.id === outId) || {}).name || 'Candidate';
    const savedResult = result;
    setSavingOutcome(true); setOutMsg('');
    Promise.resolve(actions.markScreen(outId, result, note, rating)).then((ok) => {
      setSavingOutcome(false);
      setOutMsg(ok
        ? `✓ Saved — ${savedName} marked ${savedResult === 'pass' ? 'Pass' : 'Fail'}.`
        : `✕ Could not save ${savedName}'s outcome — check your connection and try again.`);
      if (ok) { setOutId(''); setNote(''); setResult('pass'); setRating(4); }
    });
  };
  const canSchedule = schedId && schedDate && slot;
  const doSchedule = () => {
    if (!canSchedule || !actions) return;
    setScheduling(true); setSchedMsg('');
    Promise.resolve(actions.scheduleScreening(schedId, { date: schedDate, slot, link: schedLink })).then((ok) => {
      setScheduling(false);
      setSchedMsg(ok ? '✓ Screening scheduled.' : '✓ Scheduled — but the meeting link could not be saved. Add it from the candidate’s own record instead.');
      setSchedId(''); setSlot(''); setSchedLink('');
      setTimeout(() => setSchedMsg(''), 4000);
    });
  };
  const fieldStyle = { width: '100%', padding: '9px 12px', border: '1px solid var(--lms-border)', borderRadius: 'var(--r-md)', fontSize: 13.5, fontFamily: 'inherit', background: '#fff' };
  return (
    <div className="lms-body">
      <LmsPageHead title="Screening" sub="Schedule the interview, then record the outcome" />
      <div className="lms-card lms-card-pad" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start', background: zoom ? '#F0F7F1' : '#FBF7EE', borderColor: zoom ? '#CFE6D2' : '#EADFC4' }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: zoom ? 'var(--lms-green)' : '#D14343', marginTop: 5, flex: '0 0 auto' }} />
        <div><strong>{zoom ? 'Zoom connected' : 'Zoom not connected'}</strong><div className="lms-muted" style={{ fontSize: 13, marginTop: 3 }}>{zoom ? 'Interview links auto-generate when you schedule.' : 'Connect Zoom in Settings to auto-generate meeting links.'}</div></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <div className="lms-card lms-card-pad">
          <strong style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 18, display: 'block', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--lms-divider)' }}>Schedule New Screening</strong>
          <div className="lms-field" style={{ marginBottom: 14 }}><label>Select Candidate *</label>
            <select className="lms-select" value={schedId} onChange={e => setSchedId(e.target.value)}>
              <option value="">Choose a candidate…</option>
              {toScreen.map(c => <option key={c.id} value={c.id}>{c.name} · {c.city || 'no city on file'}</option>)}
            </select>
          </div>
          <div className="lms-field" style={{ marginBottom: 14 }}><label>Date *</label><input className="lms-input" type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} /></div>
          <div className="lms-field"><label>Time Slot * <span className="lms-muted" style={{ fontWeight: 400 }}>· 15–20 min · strikethrough = booked</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 4 }}>
              {window.LMS_SLOTS.map(s => {
                const booked = window.LMS_SLOTS_BOOKED.includes(s);
                return <button key={s} className={'lms-slot' + (booked ? ' booked' : slot === s ? ' on' : '')} onClick={() => !booked && setSlot(s)}>{s}</button>;
              })}
            </div>
          </div>
          {!zoom && (
            <div className="lms-field" style={{ marginTop: 14 }}><label>Meeting link <span className="lms-muted" style={{ fontWeight: 400 }}>· optional, paste one you already have</span></label>
              <input className="lms-input" placeholder="https://meet.google.com/…" value={schedLink} onChange={e => setSchedLink(e.target.value)} />
            </div>
          )}
          <div style={{ marginTop: 18 }}>
            <button className="lms-btn lms-btn-pri" style={{ width: '100%', justifyContent: 'center', background: '#4F46E5', opacity: canSchedule && !scheduling ? 1 : .55, cursor: canSchedule && !scheduling ? 'pointer' : 'not-allowed' }}
              disabled={!canSchedule || scheduling} onClick={doSchedule}>
              {scheduling ? 'Scheduling…' : (zoom ? 'Generate Zoom Link & Schedule' : 'Schedule (manual link)')}
            </button>
            {schedMsg && <div className="lms-muted" style={{ fontSize: 12.5, marginTop: 8 }}>{schedMsg}</div>}
          </div>
        </div>
        <div className="lms-card lms-card-pad">
          <strong style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 18, display: 'block', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--lms-divider)' }}>Record Screening Outcome</strong>
          <div className="lms-field" style={{ marginBottom: 14 }}><label>Candidate *</label>
            <select style={fieldStyle} value={outId} onChange={e => pickOutId(e.target.value)}><option value="">Choose a candidate…</option>{toScreen.map(c => <option key={c.id} value={c.id}>{c.name} · {c.city}</option>)}</select>
          </div>
          <div className="lms-field" style={{ marginBottom: 14 }}><label>Result *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={'lms-btn lms-btn-sm ' + (result === 'pass' ? 'lms-btn-pri' : 'lms-btn-ghost')} onClick={() => setResult('pass')}>✅ Pass — move to training</button>
              <button className={'lms-btn lms-btn-sm ' + (result === 'fail' ? 'lms-btn-danger' : 'lms-btn-ghost')} onClick={() => setResult('fail')}>❌ Fail — reject</button>
            </div>
          </div>
          {result === 'pass' && (
            <div className="lms-field" style={{ marginBottom: 14 }}><label>Rating</label>
              <div style={{ fontSize: 22, letterSpacing: 3, cursor: 'pointer' }}>
                {[1, 2, 3, 4, 5].map(n => <span key={n} onClick={() => setRating(n)} style={{ color: n <= rating ? '#E0A93C' : '#D8D2C4' }}>★</span>)}
              </div>
            </div>
          )}
          <div className="lms-field" style={{ marginBottom: 14 }}><label>Interview notes</label><textarea style={{ ...fieldStyle, minHeight: 70, resize: 'vertical' }} value={note} onChange={e => setNote(e.target.value)} placeholder="Communication, product knowledge, field experience…" /></div>
          <button className="lms-btn lms-btn-pri" style={{ width: '100%', justifyContent: 'center', opacity: outId && !savingOutcome ? 1 : .55, cursor: outId && !savingOutcome ? 'pointer' : 'not-allowed' }} disabled={!outId || savingOutcome} onClick={saveOutcome}>{savingOutcome ? 'Saving…' : 'Save outcome'}</button>
          {outMsg && (
            <div style={{
              marginTop: 10, padding: '9px 12px', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 600,
              background: outMsg.startsWith('✓') ? 'var(--lms-green-soft, #E7F5EA)' : '#FBEAEA',
              color: outMsg.startsWith('✓') ? 'var(--lms-green-ink, #1E7A3D)' : '#B3261E',
            }}>{outMsg}</div>
          )}
          <div className="lms-muted" style={{ fontSize: 12, marginTop: 10 }}>A <b>Pass</b> clears the candidate for training — go to <b>Candidates</b> and unlock their training window to actually start it. A <b>Fail</b> rejects them with a reason.</div>
        </div>
      </div>
    </div>
  );
}

// ---------- Approval Queue ----------
function LmsApproval({ cands, actions }) {
  const all = cands || window.LMS_CANDIDATES;
  const C = all.filter(c => c.stage === 'recommended');
  const justHired = all.filter(c => c.stage === 'hired' && c.repId).slice(-4);
  const [rejecting, setRejecting] = aUseState(null);
  const [reason, setReason] = aUseState('');
  return (
    <div className="lms-body">
      <LmsPageHead title="Approval Queue" />
      <div className="lms-card lms-card-pad" style={{ marginBottom: 16, background: '#F3F6F9', borderColor: '#DCE3EA' }}>
        <strong>{C.length} candidate{C.length === 1 ? '' : 's'} awaiting your decision</strong>
        <div className="lms-muted" style={{ fontSize: 13, marginTop: 4 }}>Only candidates who cleared the test (≥ {window.LMS_PASS_PCT}%) appear here. On <b>Approve &amp; Hire</b> the system locks in a permanent <b>Rep ID</b> — the same ID is used in the CRM and never changes.</div>
      </div>
      {C.length === 0 && <div className="lms-card lms-card-pad lms-muted" style={{ textAlign: 'center', padding: '30px 0' }}>No candidates awaiting approval right now.</div>}
      {C.map(c => (
        <div key={c.id} className="lms-card lms-card-pad" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span className="lms-av" style={{ background: `hsl(${c.hue} 60% 45%)`, width: 44, height: 44, fontSize: 14 }}>{c.avatar}</span>
          <div style={{ flex: 1, minWidth: 160 }}><div style={{ fontWeight: 700, fontSize: 16 }}>{c.name}</div><div className="lms-muted" style={{ fontSize: 13 }}>{c.city}, {c.state} · {c.exp}</div></div>
          <div style={{ textAlign: 'right' }}><div style={{ fontSize: 26, fontWeight: 700, color: 'var(--lms-green-ink)' }}>{c.score}%</div><div className="lms-muted" style={{ fontSize: 12 }}>passed (≥{window.LMS_PASS_PCT}%)</div></div>
          <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 6 }}>
            <button className="lms-btn lms-btn-pri" onClick={() => actions && actions.hire(c.id)}>✓ Approve &amp; Hire</button>
            <button className="lms-btn lms-btn-danger" onClick={() => { setRejecting(c.id); setReason(''); }}>Reject</button>
          </div>
          {rejecting === c.id && (
            <div style={{ width: '100%', marginTop: 4, background: '#FBF1F1', border: '1px solid #E6C9C9', borderRadius: 'var(--r-md)', padding: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#9A3B3B', display: 'block', marginBottom: 6 }}>Reason for rejection</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select value={reason} onChange={e => setReason(e.target.value)} style={{ flex: 1, minWidth: 180, padding: '8px 10px', border: '1px solid var(--lms-border)', borderRadius: 'var(--r-md)', fontSize: 13, background: '#fff' }}>
                  <option value="">Select a reason…</option>
                  <option>Insufficient product knowledge</option>
                  <option>Communication not adequate</option>
                  <option>Location not serviceable</option>
                  <option>Failed to meet expectations</option>
                  <option>Other</option>
                </select>
                <button className="lms-btn lms-btn-danger lms-btn-sm" disabled={!reason} style={!reason ? { opacity: .5 } : {}} onClick={() => { actions.reject(c.id, reason); setRejecting(null); }}>Confirm reject</button>
                <button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={() => setRejecting(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
      <div className="lms-card lms-card-pad" style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><strong style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 16 }}>Recently Hired — Rep IDs assigned</strong></div>
        {justHired.length === 0
          ? <div className="lms-muted" style={{ textAlign: 'center', padding: '20px 0', fontSize: 13.5 }}>No reps hired yet.</div>
          : justHired.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: '1px solid var(--lms-divider)' }}>
              <span className="lms-av" style={{ background: `hsl(${c.hue} 60% 45%)`, width: 32, height: 32, fontSize: 12 }}>{c.avatar}</span>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{c.name}</div><div className="lms-muted" style={{ fontSize: 12 }}>{c.city}, {c.state}{c.phone ? ' · 📞 ' + c.phone : ''}</div></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="lms-muted" style={{ fontSize: 11 }}>Rep ID</span><span className="lms-pill" style={{ background: 'var(--lms-green-soft)', color: 'var(--lms-green-ink)', fontFamily: 'monospace', fontWeight: 700 }}>{c.repId}</span></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="lms-muted" style={{ fontSize: 11 }}>Password</span><span className="lms-pill" style={{ background: '#E8F0FB', color: '#1D4ED8', fontFamily: 'monospace', fontWeight: 700 }}>{c.tempPassword || '—'}</span></span>
              </div>
            </div>
          ))}
        <div className="lms-muted" style={{ fontSize: 12, marginTop: 10 }}>On hire, this Rep ID is issued as the rep's <b>Sales App username</b> (with a temporary password) and is the same key used across the CRM (login, commission, customers) and Sales App. Generated once — it never changes. Rep orders in the Sales App are <b>cash-only</b>.</div>
      </div>
    </div>
  );
}

// ---------- Training Content Manager ----------
// Real backend client for the module editor. GET is public (candidates read
// it too); /all and every write require a staff token.
function modApi(path, opts) {
  let token = ''; try { token = localStorage.getItem('eurostar-admin-token') || ''; } catch (e) {}
  const headers = { accept: 'application/json' };
  if (token) headers.authorization = 'Bearer ' + token;
  if (opts && opts.body) headers['content-type'] = 'application/json';
  return fetch((window.EUROSTAR_API || location.origin) + '/modules' + path, { ...opts, headers })
    .then(r => r.text().then(t => { let d = null; try { d = t ? JSON.parse(t) : null; } catch (e) {} return { ok: r.ok, status: r.status, data: d }; }))
    .catch(() => ({ ok: false, status: 0, data: null }));
}

function LmsTraining() {
  const [mods, setMods] = aUseState(null); // null = still loading
  const [loadErr, setLoadErr] = aUseState('');
  const [compose, setCompose] = aUseState(null); // null | {kind:'module'} | {kind:'video', modId} | {kind:'notes', modId}
  const [mTitle, setMTitle] = aUseState('');
  const [vTitle, setVTitle] = aUseState('');
  const [vDur, setVDur] = aUseState('');
  const [vUrl, setVUrl] = aUseState('');
  const [vMod, setVMod] = aUseState('');
  const [vFile, setVFile] = aUseState(null);   // the picked/dropped video file
  const [upPct, setUpPct] = aUseState(-1);     // -1 = not uploading
  const [dragOver, setDragOver] = aUseState(false);
  const [nText, setNText] = aUseState('');
  const videoFileRef = React.useRef(null);
  const [busy, setBusy] = aUseState(false);
  const [composeErr, setComposeErr] = aUseState('');
  const [pendingId, setPendingId] = aUseState(''); // module id mid-toggle/remove

  const load = () => modApi('/all').then(res => {
    if (res.ok && Array.isArray(res.data)) { setMods(res.data); setLoadErr(''); }
    else setLoadErr('Could not load training modules — check your connection and reload.');
  });
  React.useEffect(() => { load(); }, []);

  const cancel = () => { setCompose(null); setComposeErr(''); };
  const openModule = () => { setMTitle(''); setComposeErr(''); setCompose({ kind: 'module' }); };
  const openVideo = (modId) => {
    const m = modId && mods && mods.find(x => x.id === modId);
    setVTitle((m && m.summary) || ''); setVDur((m && m.videoDuration) || ''); setVUrl((m && m.videoUrl) || '');
    setVMod(modId || (mods && mods[0] && mods[0].id) || ''); setComposeErr('');
    setVFile(null); setUpPct(-1); setDragOver(false);
    setCompose({ kind: 'video', modId });
  };
  const openNotes = (modId) => {
    const m = mods.find(x => x.id === modId);
    setNText((m.checklist || []).join('\n')); setComposeErr('');
    setCompose({ kind: 'notes', modId });
  };

  const saveModule = () => {
    const title = mTitle.trim(); if (!title || busy) return;
    setBusy(true); setComposeErr('');
    modApi('/', { method: 'PUT', body: JSON.stringify({ title, sortOrder: (mods || []).length + 1, mandatory: true, active: true }) }).then(res => {
      setBusy(false);
      if (!res.ok || !res.data) { setComposeErr('Could not save — try again.'); return; }
      setMods(ms => [...(ms || []), res.data]);
      setCompose(null);
    });
  };

  // Upload a video file to a module. XMLHttpRequest rather than fetch because
  // it reports upload progress — a 300MB file with no progress bar looks frozen.
  const uploadVideo = (modId, file) => new Promise((resolve) => {
    let token = ''; try { token = localStorage.getItem('eurostar-admin-token') || ''; } catch (e) {}
    const form = new FormData();
    form.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', (window.EUROSTAR_API || location.origin) + '/modules/' + modId + '/video');
    if (token) xhr.setRequestHeader('authorization', 'Bearer ' + token);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) setUpPct(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      let d = null; try { d = JSON.parse(xhr.responseText); } catch (e) {}
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, data: d });
    };
    xhr.onerror = () => resolve({ ok: false, data: null });
    xhr.send(form);
  });

  const saveVideo = () => {
    const title = vTitle.trim(); if (busy) return;
    const modId = compose.modId || vMod;
    const mod = mods.find(m => m.id === modId);
    if (!mod) return;
    // Either a file or a title is enough — the upload names the video from the
    // filename when no title was typed.
    if (!title && !vFile) { setComposeErr('Add a video title, or pick a file.'); return; }
    setBusy(true); setComposeErr('');

    // Save the text fields first, then upload the file (if any) — that way the
    // title/duration are stored even if a large upload later fails.
    modApi('/', { method: 'PUT', body: JSON.stringify({ id: modId, title: mod.title, summary: title || undefined, videoDuration: vDur.trim() || undefined, videoUrl: vUrl.trim() || undefined, checklist: mod.checklist }) }).then(res => {
      if (!res.ok || !res.data) { setBusy(false); setComposeErr('Could not save — try again.'); return null; }
      setMods(ms => ms.map(m => m.id === modId ? res.data : m));
      if (!vFile) return res;
      setUpPct(0);
      return uploadVideo(modId, vFile).then(up => {
        if (!up.ok || !up.data) {
          setComposeErr((up.data && up.data.error) || 'The details saved, but the video upload failed.');
          return null;
        }
        setMods(ms => ms.map(m => m.id === modId ? up.data : m));
        return up;
      });
    }).then(done => {
      setBusy(false); setUpPct(-1);
      if (done) { setVFile(null); setCompose(null); }
    });
  };

  const removeVideo = (modId) => {
    const mod = mods.find(m => m.id === modId); if (!mod) return;
    setPendingId(modId);
    modApi('/', { method: 'PUT', body: JSON.stringify({ id: modId, title: mod.title, summary: '', videoUrl: '', videoDuration: '', checklist: mod.checklist }) }).then(res => {
      setPendingId('');
      if (res.ok && res.data) setMods(ms => ms.map(m => m.id === modId ? res.data : m));
      else alert('Could not remove the video — try again.');
    });
  };

  const saveNotes = () => {
    if (busy) return;
    const { modId } = compose;
    const mod = mods.find(m => m.id === modId); if (!mod) return;
    const lines = nText.split('\n').map(s => s.trim()).filter(Boolean);
    setBusy(true); setComposeErr('');
    modApi('/', { method: 'PUT', body: JSON.stringify({ id: modId, title: mod.title, summary: mod.summary, videoUrl: mod.videoUrl, videoDuration: mod.videoDuration, checklist: lines }) }).then(res => {
      setBusy(false);
      if (!res.ok || !res.data) { setComposeErr('Could not save — try again.'); return; }
      setMods(ms => ms.map(m => m.id === modId ? res.data : m));
      setCompose(null);
    });
  };

  const toggleMandatory = (id) => {
    const mod = mods.find(m => m.id === id); if (!mod || pendingId) return;
    const next = !mod.mandatory;
    setMods(ms => ms.map(m => m.id === id ? { ...m, mandatory: next } : m)); // optimistic
    setPendingId(id);
    modApi('/', { method: 'PUT', body: JSON.stringify({ id, title: mod.title, summary: mod.summary, videoUrl: mod.videoUrl, videoDuration: mod.videoDuration, checklist: mod.checklist, mandatory: next }) }).then(res => {
      setPendingId('');
      if (!res.ok) { setMods(ms => ms.map(m => m.id === id ? { ...m, mandatory: !next } : m)); alert('Could not save — try again.'); } // revert
    });
  };

  const removeModule = (id, title) => {
    if (pendingId) return;
    if (!window.confirm('Remove "' + title + '"? This deletes the module, its video and its notes for good — candidates will no longer see it.')) return;
    setPendingId(id);
    modApi('/' + id, { method: 'DELETE' }).then(res => {
      setPendingId('');
      if (res.ok) setMods(ms => ms.filter(m => m.id !== id));
      else alert('Could not remove the module — try again.');
    });
  };

  const fieldStyle = { width: '100%', padding: '9px 12px', border: '1px solid var(--lms-border)', borderRadius: 'var(--r-md)', fontSize: 13.5, fontFamily: 'inherit', background: '#fff' };

  if (mods === null) {
    return <div className="lms-body"><LmsPageHead title="Training Content Manager" />
      {loadErr ? <div className="lms-card lms-card-pad" style={{ color: '#9A3B3B' }}>{loadErr}</div> : <div className="lms-muted">Loading…</div>}
    </div>;
  }

  return (
    <div className="lms-body">
      <LmsPageHead title="Training Content Manager" />
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <button className="lms-btn lms-btn-ghost" onClick={openModule}>+ Add Module</button>
        {mods.length > 0 && <button className="lms-btn lms-btn-pri" onClick={() => openVideo(null)}>+ Upload Video</button>}
      </div>

      {compose && compose.kind === 'module' && (
        <div className="lms-card lms-card-pad" style={{ marginBottom: 16, borderColor: 'var(--lms-green)' }}>
          <strong style={{ display: 'block', marginBottom: 10 }}>New module</strong>
          <input style={fieldStyle} placeholder="Module title — e.g. Objection Handling" value={mTitle} autoFocus onChange={e => setMTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveModule()} />
          {composeErr && <div style={{ marginTop: 10, color: '#9A3B3B', fontSize: 13 }}>{composeErr}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="lms-btn lms-btn-pri lms-btn-sm" onClick={saveModule} disabled={!mTitle.trim() || busy} style={!mTitle.trim() || busy ? { opacity: .5 } : {}}>{busy ? 'Adding…' : 'Add module'}</button>
            <button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={cancel}>Cancel</button>
          </div>
        </div>
      )}
      {compose && compose.kind === 'video' && (
        <div className="lms-card lms-card-pad" style={{ marginBottom: 16, borderColor: 'var(--lms-green)' }}>
          <strong style={{ display: 'block', marginBottom: 10 }}>{compose.modId ? 'Upload video for this module' : 'Upload video'}</strong>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
            <input style={fieldStyle} placeholder="Video title — e.g. Closing the Sale" value={vTitle} autoFocus onChange={e => setVTitle(e.target.value)} />
            <input style={fieldStyle} placeholder="Length mm:ss" value={vDur} onChange={e => setVDur(e.target.value)} />
          </div>
          {!compose.modId && (
            <select style={{ ...fieldStyle, marginTop: 10 }} value={vMod} onChange={e => { setVMod(e.target.value); const m = mods.find(x => x.id === e.target.value); setVTitle((m && m.summary) || ''); setVDur((m && m.videoDuration) || ''); setVUrl((m && m.videoUrl) || ''); }}>
              {mods.map((m, i) => <option key={m.id} value={m.id}>M{i + 1}: {m.title}</option>)}
            </select>
          )}
          {/* Real dropzone: click to browse, or drag a file onto it. */}
          <input
            ref={videoFileRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.webm,.mov,.m4v"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files && e.target.files[0]; if (f) { setVFile(f); setComposeErr(''); } e.target.value = ''; }}
          />
          <div
            onClick={() => !busy && videoFileRef.current && videoFileRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault(); setDragOver(false);
              const f = e.dataTransfer.files && e.dataTransfer.files[0];
              if (f) { setVFile(f); setComposeErr(''); }
            }}
            style={{
              marginTop: 10, padding: '18px 14px', borderRadius: 'var(--r-md)', textAlign: 'center',
              border: '1.5px dashed var(--lms-green)', cursor: busy ? 'default' : 'pointer',
              background: dragOver ? '#E7F3E9' : '#F4F6F4', color: 'var(--lms-green-ink)', fontSize: 13,
            }}
          >
            {vFile ? (
              <>
                <div style={{ fontWeight: 700 }}>🎬 {vFile.name}</div>
                <div className="lms-muted" style={{ fontSize: 12, marginTop: 4 }}>{(vFile.size / (1024 * 1024)).toFixed(1)} MB · click to choose a different file</div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 600 }}>⬆ Drag &amp; drop a video file here, or click to browse</div>
                <div className="lms-muted" style={{ fontSize: 12, marginTop: 4 }}>MP4 · WebM · MOV — up to 500MB</div>
              </>
            )}
          </div>
          {upPct >= 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ height: 8, background: '#EEEBE3', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: upPct + '%', background: 'var(--lms-green)', transition: 'width .2s' }} />
              </div>
              <div className="lms-muted" style={{ fontSize: 12, marginTop: 5 }}>{upPct < 100 ? `Uploading… ${upPct}%` : 'Processing…'}</div>
            </div>
          )}

          <div className="lms-muted" style={{ fontSize: 12, margin: '12px 0 6px' }}>…or paste a link instead, if the video is already hosted somewhere:</div>
          <input style={fieldStyle} placeholder="Video URL — YouTube (unlisted), Vimeo, or a direct link" value={vUrl} onChange={e => setVUrl(e.target.value)} />

          {composeErr && <div style={{ marginTop: 10, color: '#9A3B3B', fontSize: 13 }}>{composeErr}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="lms-btn lms-btn-pri lms-btn-sm" onClick={saveVideo} disabled={busy || (!vTitle.trim() && !vFile)} style={busy || (!vTitle.trim() && !vFile) ? { opacity: .5 } : {}}>{busy ? (upPct >= 0 ? 'Uploading…' : 'Saving…') : 'Save video'}</button>
            <button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={cancel} disabled={busy} style={busy ? { opacity: .5 } : {}}>Cancel</button>
          </div>
        </div>
      )}

      {compose && compose.kind === 'notes' && (() => {
        const mod = mods.find(m => m.id === compose.modId) || {};
        const idx = mods.findIndex(m => m.id === compose.modId);
        return (
        <div className="lms-card lms-card-pad" style={{ marginBottom: 16, borderColor: 'var(--lms-green)' }}>
          <strong style={{ display: 'block', marginBottom: 4 }}>Notes · M{idx + 1} {mod.title}</strong>
          <div className="lms-muted" style={{ fontSize: 12.5, marginBottom: 10 }}>English only for now · one point per line — this is exactly what the rep reads below the video.</div>
          <textarea style={{ ...fieldStyle, minHeight: 180, resize: 'vertical', lineHeight: 1.5 }} value={nText} autoFocus onChange={e => setNText(e.target.value)} placeholder={'Type one revision point per line...'} />
          {composeErr && <div style={{ marginTop: 10, color: '#9A3B3B', fontSize: 13 }}>{composeErr}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="lms-btn lms-btn-pri lms-btn-sm" onClick={saveNotes} disabled={busy} style={busy ? { opacity: .5 } : {}}>{busy ? 'Saving…' : 'Save notes'}</button>
            <button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={cancel}>Cancel</button>
          </div>
        </div>
      );})()}

      <div className="lms-muted" style={{ fontSize: 13, marginBottom: 18 }}>{mods.length} module{mods.length === 1 ? '' : 's'} · MP4 upload or link · English notes</div>
      {mods.length === 0 && <div className="lms-card lms-card-pad lms-muted" style={{ textAlign: 'center', padding: '30px 0' }}>No training modules yet — add one to get started.</div>}
      {mods.map((m, i) => {
        const notes = m.checklist || [];
        const hasVideo = !!(m.summary || m.videoUrl);
        return (
        <div key={m.id} className="lms-card" style={{ marginBottom: 18, overflow: 'hidden', opacity: m.active === false ? .6 : 1 }}>
          {/* Module header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', background: '#F4F6F4', flexWrap: 'wrap' }}>
            <span className="lms-tag lms-tag-mod">M{i + 1}</span>
            <strong style={{ fontSize: 15, flex: 1, minWidth: 120 }}>{m.title}</strong>
            {m.active === false && <span className="lms-tag" style={{ background: '#EEE', color: 'var(--lms-meta)' }}>Hidden from candidates</span>}
            <button className="lms-btn lms-btn-danger lms-btn-sm" disabled={pendingId === m.id} onClick={() => removeModule(m.id, m.title)}>{pendingId === m.id ? '…' : 'Remove'}</button>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--lms-meta)' }}>Mandatory <button className={'lms-toggle' + (m.mandatory ? ' on' : '')} disabled={pendingId === m.id} onClick={() => toggleMandatory(m.id)}><span className="knob" /></button></span>
          </div>

          {/* ---- Part 1 · video ---- */}
          <div style={{ padding: '13px 18px 4px' }}>
            <div className="lms-part-label"><span className="lms-part-num">1</span> Video</div>
          </div>
          {!hasVideo && <div className="lms-muted" style={{ padding: '4px 18px 12px', fontSize: 13 }}>No video set yet — add one below.</div>}
          {hasVideo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 18px', flexWrap: 'wrap' }}>
              <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--lms-green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>▶</span>
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ fontWeight: 600 }}>{m.summary || '(no title set)'}</div>
                <div className="lms-muted" style={{ fontSize: 12 }}>{m.videoDuration || '—'}{m.videoUrl ? '' : ' · no URL set yet'}</div>
              </div>
              <button className="lms-btn lms-btn-danger lms-btn-sm" disabled={pendingId === m.id} onClick={() => removeVideo(m.id)}>{pendingId === m.id ? '…' : 'Remove'}</button>
            </div>
          )}
          <div style={{ padding: '4px 18px 14px' }}><button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={() => openVideo(m.id)}>+ Add / replace video</button></div>

          {/* ---- Part 2 · Written notes ---- */}
          <div style={{ padding: '13px 18px 6px', borderTop: '1px solid var(--lms-divider)', background: '#FBFBF9' }}>
            <div className="lms-part-label"><span className="lms-part-num">2</span> Written notes <span className="lms-muted" style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— shown to the rep below the video</span></div>
          </div>
          <div style={{ padding: '4px 18px 16px', background: '#FBFBF9' }}>
            {notes.length === 0
              ? <div className="lms-muted" style={{ fontSize: 13, padding: '8px 0' }}>No notes for this module yet.</div>
              : <ul className="lms-note-list">{notes.map((n, ni) => <li key={ni}>{n}</li>)}</ul>}
            <button className="lms-btn lms-btn-ghost lms-btn-sm" style={{ marginTop: 10 }} onClick={() => openNotes(m.id)}>Edit notes</button>
          </div>
        </div>
      );})}
    </div>
  );
}

// ---------- Question Bank ----------
// Question-bank API client. Everything here is staff-only — the bank contains
// the correct answers, so none of it is candidate-readable.
function qApi(path, opts) {
  let token = ''; try { token = localStorage.getItem('eurostar-admin-token') || ''; } catch (e) {}
  const headers = { accept: 'application/json' };
  if (token) headers.authorization = 'Bearer ' + token;
  if (opts && opts.body) headers['content-type'] = 'application/json';
  return fetch((window.EUROSTAR_API || location.origin) + '/questions' + path, { ...opts, headers })
    .then(r => r.text().then(t => { let d = null; try { d = t ? JSON.parse(t) : null; } catch (e) {} return { ok: r.ok, status: r.status, data: d }; }))
    .catch(() => ({ ok: false, status: 0, data: null }));
}

function LmsQuestionBank() {
  const [QALL, setQALL] = aUseState(null);   // null = loading
  const [mods, setMods] = aUseState([]);
  const [cfg, setCfg] = aUseState(null);
  const [loadErr, setLoadErr] = aUseState('');
  const [mod, setMod] = aUseState('');
  const [limit, setLimit] = aUseState(10);
  const [editing, setEditing] = aUseState(null); // null | {…} (new or existing)
  const [showCfg, setShowCfg] = aUseState(false);
  const [busy, setBusy] = aUseState(false);
  const [msg, setMsg] = aUseState('');
  const [editErr, setEditErr] = aUseState('');

  const load = () => Promise.all([
    qApi(''),
    qApi('/config'),
    modApi('/all'),
  ]).then(([qr, cr, mr]) => {
    if (qr.ok && Array.isArray(qr.data)) setQALL(qr.data); else setLoadErr('Could not load the question bank — check your connection and reload.');
    if (cr.ok && cr.data) setCfg(cr.data);
    if (mr.ok && Array.isArray(mr.data)) setMods(mr.data);
  });
  React.useEffect(() => { load(); }, []);

  const modIndex = (id) => mods.findIndex(m => m.id === id);
  const modName = (id) => { const m = mods.find(x => x.id === id); return m ? m.title : '—'; };
  const modCode = (id) => { const i = modIndex(id); return i >= 0 ? 'M' + (i + 1) : '—'; };

  let Q = QALL || [];
  if (mod) Q = Q.filter(q => q.moduleId === mod);
  const shown = Q.slice(0, limit);

  const blank = () => ({ id: '', moduleId: (mods[0] || {}).id || null, type: 'MCQ', prompt: '', options: ['', '', '', ''], answer: 0 });
  const fieldStyle = { width: '100%', padding: '9px 12px', border: '1px solid var(--lms-border)', borderRadius: 'var(--r-md)', fontSize: 13.5, fontFamily: 'inherit', background: '#fff' };
  const fileRef = React.useRef(null);

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 5000); };

  const saveQuestion = () => {
    if (busy || !editing || !editing.prompt.trim()) return;
    setBusy(true); setEditErr('');
    const body = {
      ...(editing.id ? { id: editing.id } : {}),
      moduleId: editing.moduleId || null,
      type: editing.type,
      prompt: editing.prompt.trim(),
      options: editing.type === 'MCQ' ? editing.options : undefined,
      answer: editing.answer,
    };
    qApi('/', { method: 'PUT', body: JSON.stringify(body) }).then(res => {
      setBusy(false);
      if (!res.ok || !res.data) { setEditErr((res.data && res.data.error) || 'Could not save — try again.'); return; }
      setQALL(qs => editing.id ? qs.map(q => q.id === editing.id ? res.data : q) : [...qs, res.data]);
      setEditing(null);
      flash(editing.id ? '✓ Question updated.' : '✓ Question added.');
    });
  };

  const deleteQuestion = (id) => {
    if (!window.confirm('Delete this question? It will be removed from the bank and from future tests.')) return;
    qApi('/' + id, { method: 'DELETE' }).then(res => {
      if (res.ok) { setQALL(qs => qs.filter(q => q.id !== id)); flash('✓ Question deleted.'); }
      else alert('Could not delete — try again.');
    });
  };

  const saveCfg = (patch) => {
    const next = { ...cfg, ...patch };
    setCfg(next); // optimistic — the inputs must stay responsive while typing
    qApi('/config', { method: 'PUT', body: JSON.stringify(patch) }).then(res => {
      if (!res.ok) { flash('✕ Could not save the test settings.'); load(); }
    });
  };

  // Parse a CSV line respecting quotes.
  const parseCsvLine = (line) => {
    const out = []; let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) { const ch = line[i];
      if (inQ) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false; } else cur += ch; }
      else { if (ch === '"') inQ = true; else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch; } }
    out.push(cur); return out.map(s => s.trim());
  };
  // "M3" or the module's title — matched against the real modules loaded from
  // the server, not a hardcoded list.
  const modIdOf = (v) => {
    const s = String(v || '').trim().toUpperCase();
    const byCode = s.match(/^M(\d+)$/);
    if (byCode) { const m = mods[+byCode[1] - 1]; if (m) return m.id; }
    const byName = mods.find(m => m.title.toUpperCase() === s);
    return byName ? byName.id : ((mods[0] || {}).id || null);
  };
  const rowsToQuestions = (rows) => {
    const items = []; let skipped = 0;
    rows.forEach((r, i) => {
      if (!r || r.length < 3) return;
      if (i === 0 && /^(module|mod)$/i.test(String(r[0]).trim())) return; // header
      const moduleId = modIdOf(r[0]);
      const type = /true|false|tf/i.test(String(r[1])) ? 'True-False' : 'MCQ';
      const prompt = String(r[2] || '').trim(); if (!prompt) { skipped++; return; }
      if (type === 'MCQ') {
        const options = [r[3], r[4], r[5], r[6]].map(x => String(x || '').trim()).filter(Boolean);
        if (options.length < 2) { skipped++; return; }
        const ansRaw = String(r[7] || '').trim();
        let answer = 0;
        if (/^[A-D]$/i.test(ansRaw)) answer = ansRaw.toUpperCase().charCodeAt(0) - 65;
        else if (/^[1-4]$/.test(ansRaw)) answer = +ansRaw - 1;
        else { const idx = options.findIndex(o => o.toLowerCase() === ansRaw.toLowerCase()); answer = idx >= 0 ? idx : 0; }
        if (answer >= options.length) { skipped++; return; }
        items.push({ moduleId, type, prompt, options, answer });
      } else {
        // True stores as 0, False as 1 — same convention the server scores on.
        const isTrue = /^(t|true|yes|1)$/i.test(String(r[7] || r[3] || '').trim());
        items.push({ moduleId, type, prompt, answer: isTrue ? 0 : 1 });
      }
    });
    return { items, skipped };
  };
  const onFile = (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return; const ext = (f.name.split('.').pop() || '').toLowerCase();
    const handle = (rows) => {
      const { items, skipped } = rowsToQuestions(rows);
      if (!items.length) { alert('No valid questions found. Check the template format.'); return; }
      qApi('/bulk', { method: 'POST', body: JSON.stringify({ questions: items }) }).then(res => {
        if (!res.ok || !res.data) { alert('Upload failed — nothing was imported.'); return; }
        const d = res.data;
        // Reload rather than guessing what the server accepted — it applies the
        // same validity rules and may reject rows this parser let through.
        load().then(() => {
          alert(d.added + ' question(s) added' + (d.skipped ? ' · ' + d.skipped + ' row(s) skipped (invalid options or answer).' : '.') + (skipped ? '\n' + skipped + ' row(s) skipped before upload (missing question/options).' : ''));
        });
      });
    };
    const reader = new FileReader();
    if (ext === 'csv') { reader.onload = () => handle(reader.result.split(/\r?\n/).filter(l => l.trim()).map(parseCsvLine)); reader.readAsText(f); }
    else { const go = () => { reader.onload = () => { const wb = window.XLSX.read(new Uint8Array(reader.result), { type: 'array' }); const sh = wb.Sheets[wb.SheetNames[0]]; handle(window.XLSX.utils.sheet_to_json(sh, { header: 1 })); }; reader.readAsArrayBuffer(f); };
      if (!window.XLSX) { const s = document.createElement('script'); s.src = 'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js'; s.onload = go; document.head.appendChild(s); } else go(); }
    e.target.value = '';
  };
  const downloadTemplate = () => {
    const csv = [
      'Module,Type,Question,Option A,Option B,Option C,Option D,Answer',
      'M1,MCQ,What matters most for long-term customers?,Lowest price,Consistent quality & trust,Flashy ads,Big discounts,B',
      'M2,MCQ,Cubic Zirconia is usually ordered by?,Piece,Carat,Packet,Metre,C',
      'M3,True-False,A certificate can be issued for larger moissanite stones.,,,,,True'
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'eurostar-question-template.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (QALL === null) {
    return <div className="lms-body"><LmsPageHead title="Question Bank" />
      {loadErr ? <div className="lms-card lms-card-pad" style={{ color: '#9A3B3B' }}>{loadErr}</div> : <div className="lms-muted">Loading…</div>}
    </div>;
  }

  return (
    <div className="lms-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <LmsPageHead title="Question Bank" sub={`${QALL.length} question${QALL.length === 1 ? '' : 's'} · ${mods.length} module${mods.length === 1 ? '' : 's'} · MCQ & True/False`} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={onFile} style={{ display: 'none' }} />
          <button className="lms-btn lms-btn-ghost" onClick={downloadTemplate}>↓ Template</button>
          <button className="lms-btn lms-btn-ghost" onClick={() => fileRef.current && fileRef.current.click()}>⬆ Bulk upload</button>
          <button className="lms-btn lms-btn-ghost" onClick={() => setShowCfg(s => !s)}>⚙ Test config</button>
          <button className="lms-btn lms-btn-pri" onClick={() => { setEditErr(''); setEditing(blank()); }}>+ Add Question</button>
        </div>
      </div>

      {msg && <div style={{ marginBottom: 14, padding: '9px 12px', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 600, background: msg.startsWith('✓') ? 'var(--lms-green-soft, #E7F5EA)' : '#FBEAEA', color: msg.startsWith('✓') ? 'var(--lms-green-ink, #1E7A3D)' : '#B3261E' }}>{msg}</div>}

      {showCfg && cfg && (
        <div className="lms-card lms-card-pad" style={{ marginBottom: 16, borderColor: 'var(--lms-green)' }}>
          <strong style={{ display: 'block', marginBottom: 12 }}>Assessment settings</strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
            <div className="lms-field"><label>Questions per test</label><input style={fieldStyle} type="number" min="1" max={Math.max(1, QALL.length)} value={cfg.count} onChange={e => saveCfg({ count: Math.max(1, +e.target.value || 1) })} /></div>
            <div className="lms-field"><label>Pass mark (%)</label><input style={fieldStyle} type="number" min="1" max="100" value={cfg.passPct} onChange={e => saveCfg({ passPct: Math.min(100, Math.max(1, +e.target.value || 1)) })} /></div>
            <div className="lms-field"><label>Time limit (min)</label><input style={fieldStyle} type="number" min="1" value={cfg.durationMin} onChange={e => saveCfg({ durationMin: Math.max(1, +e.target.value || 1) })} /></div>
            <div className="lms-field"><label>Randomize order</label>
              <button className={'lms-toggle' + (cfg.randomize ? ' on' : '')} style={{ marginTop: 4 }} onClick={() => saveCfg({ randomize: !cfg.randomize })}><span className="knob" /></button>
            </div>
          </div>
          <div className="lms-muted" style={{ fontSize: 12, marginTop: 10 }}>The candidate's test draws <b>{cfg.count}</b> question{cfg.count === 1 ? '' : 's'} {cfg.randomize ? 'at random' : 'in order'} from this bank · pass ≥ <b>{cfg.passPct}%</b> · <b>{cfg.durationMin} min</b> limit.
            {cfg.count > QALL.length && <span style={{ color: '#B3261E' }}> · Only {QALL.length} question{QALL.length === 1 ? '' : 's'} exist, so the test will be that short.</span>}
          </div>
        </div>
      )}

      {editing && (
        <div className="lms-card lms-card-pad" style={{ marginBottom: 16, borderColor: 'var(--lms-green)' }}>
          <strong style={{ display: 'block', marginBottom: 12 }}>{editing.id ? 'Edit question' : 'New question'}</strong>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="lms-field"><label>Module</label><select style={fieldStyle} value={editing.moduleId || ''} onChange={e => setEditing({ ...editing, moduleId: e.target.value || null })}>
              <option value="">— no module —</option>
              {mods.map((m, i) => <option key={m.id} value={m.id}>M{i + 1}: {m.title}</option>)}
            </select></div>
            <div className="lms-field"><label>Type</label><select style={fieldStyle} value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value, answer: 0 })}><option>MCQ</option><option>True-False</option></select></div>
          </div>
          <div className="lms-field" style={{ marginBottom: 12 }}><label>Question</label><input style={fieldStyle} value={editing.prompt} autoFocus onChange={e => setEditing({ ...editing, prompt: e.target.value })} /></div>
          {editing.type === 'MCQ' ? (
            <div style={{ display: 'grid', gap: 8 }}>
              {editing.options.map((o, oi) => (
                <label key={oi} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="radio" name="ans" checked={editing.answer === oi} onChange={() => setEditing({ ...editing, answer: oi })} />
                  <input style={fieldStyle} placeholder={'Option ' + (oi + 1)} value={o} onChange={e => { const opts = editing.options.slice(); opts[oi] = e.target.value; setEditing({ ...editing, options: opts }); }} />
                </label>
              ))}
              <span className="lms-muted" style={{ fontSize: 12 }}>● Select the radio next to the correct answer. Blank options are ignored — at least two are needed.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              {['True', 'False'].map((o, oi) => (
                <button key={o} className={'lms-btn lms-btn-sm ' + (editing.answer === oi ? 'lms-btn-pri' : 'lms-btn-ghost')} onClick={() => setEditing({ ...editing, answer: oi })}>{o}</button>
              ))}
              <span className="lms-muted" style={{ fontSize: 12, alignSelf: 'center' }}>Pick the correct answer.</span>
            </div>
          )}
          {editErr && <div style={{ marginTop: 12, color: '#9A3B3B', fontSize: 13 }}>{editErr}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="lms-btn lms-btn-pri lms-btn-sm" disabled={!editing.prompt.trim() || busy} style={!editing.prompt.trim() || busy ? { opacity: .5 } : {}} onClick={saveQuestion}>{busy ? 'Saving…' : 'Save'}</button>
            <button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={() => { setEditing(null); setEditErr(''); }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '4px 0 18px' }}>
        <button className={'lms-btn lms-btn-sm ' + (mod === '' ? 'lms-btn-pri' : 'lms-btn-ghost')} onClick={() => { setMod(''); setLimit(10); }}>All Modules</button>
        {mods.map((m, i) => (
          <button key={m.id} className={'lms-btn lms-btn-sm ' + (mod === m.id ? 'lms-btn-pri' : 'lms-btn-ghost')} onClick={() => { setMod(m.id); setLimit(10); }}>M{i + 1}: {m.title}</button>
        ))}
      </div>
      {QALL.length === 0 && <div className="lms-card lms-card-pad lms-muted" style={{ textAlign: 'center', padding: '30px 0' }}>No questions yet — add one, or bulk-upload a CSV.</div>}
      {shown.map((q, qi) => (
        <div key={q.id} className="lms-card lms-card-pad" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <strong style={{ fontSize: 14, color: 'var(--lms-meta)', flex: '0 0 auto', width: 34 }}>Q{QALL.indexOf(q) + 1}</strong>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <span className="lms-tag lms-tag-mod">{modName(q.moduleId)}</span>
                <span className={'lms-tag ' + (q.type === 'MCQ' ? 'lms-tag-mcq' : 'lms-tag-tf')}>{q.type}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.4 }}>{q.prompt}</div>
              <div className="lms-muted" style={{ fontSize: 12.5, marginTop: 6 }}>
                Answer: <b>{q.type === 'MCQ' ? (q.options[q.answer] || '(not set)') : (q.answer === 0 ? 'True' : 'False')}</b>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flex: '0 0 auto' }}>
              <button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={() => { setEditErr(''); setEditing({ ...q, options: (q.options && q.options.length ? q.options.slice() : ['', '', '', '']) }); }}>Edit</button>
              <button className="lms-btn lms-btn-danger lms-btn-sm" onClick={() => deleteQuestion(q.id)}>Delete</button>
            </div>
          </div>
        </div>
      ))}
      {limit < Q.length && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <span className="lms-muted" style={{ fontSize: 13 }}>Showing <strong>{shown.length}</strong> of <strong>{Q.length}</strong> questions</span>
          <button className="lms-btn lms-btn-ghost" onClick={() => setLimit(l => l + 10)}>Load more</button>
        </div>
      )}
    </div>
  );
}

/* ===================== CRM ONBOARD MODAL ===================== */
function CrmOnboardModal({ cand, onClose, onConfirm }) {
  const leaders = (window.CRM_LEADERS_MIRROR || [{ id: 'L1', name: 'Mr Omkar Kanujia', role: 'asm' }, { id: 'L2', name: 'Anuj (Sales Head)', role: 'head' }]);
  const asms = leaders.filter(l => l.role === 'asm');
  const heads = leaders.filter(l => l.role === 'head');
  const [form, setForm] = aUseState({ city: cand.city || '', region: cand.state || '', asm: (asms[0] || {}).id || 'L1', head: (heads[0] || {}).id || 'L2', target: 50, rate: 4 });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const fs = { width: '100%', padding: '9px 12px', border: '1px solid var(--lms-border)', borderRadius: 'var(--r-md)', fontSize: 13.5, fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,25,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} className="lms-card" style={{ width: 460, maxWidth: '100%', padding: 0, overflow: 'hidden' }}>
        <div className="lms-card-pad" style={{ borderBottom: '1px solid var(--lms-divider)' }}>
          <strong style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 18, display: 'block' }}>Onboard {cand.name} to CRM</strong>
          <div className="lms-muted" style={{ fontSize: 13, marginTop: 4 }}>Rep ID <b>{cand.repId}</b> · this creates an active rep in the CRM with the details below.</div>
        </div>
        <div className="lms-card-pad" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="lms-field"><label>City (lead routing)</label><input style={fs} value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Rajkot" /></div>
          <div className="lms-field"><label>Region</label><input style={fs} value={form.region} onChange={e => set('region', e.target.value)} placeholder="e.g. Gujarat" /></div>
          <div className="lms-field"><label>Area Sales Manager</label><select style={fs} value={form.asm} onChange={e => set('asm', e.target.value)}>{asms.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
          <div className="lms-field"><label>Sales Head</label><select style={fs} value={form.head} onChange={e => set('head', e.target.value)}>{heads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
          <div className="lms-field"><label>Monthly new-customer target</label><input style={fs} type="number" value={form.target} onChange={e => set('target', e.target.value)} /></div>
          <div className="lms-field"><label>Commission rate (%)</label><input style={fs} type="number" step="0.5" value={form.rate} onChange={e => set('rate', e.target.value)} /></div>
        </div>
        <div className="lms-card-pad" style={{ borderTop: '1px solid var(--lms-divider)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="lms-btn lms-btn-sm" onClick={onClose}>Cancel</button>
          <button className="lms-btn lms-btn-pri lms-btn-sm" onClick={() => onConfirm(form)}>✓ Create rep in CRM</button>
        </div>
      </div>
    </div>
  );
}

/* ===================== CANDIDATE DETAIL DRAWER ===================== */
// Interview link (Google Meet, Zoom, etc.) the admin sets for a candidate.
// Stored in the back room (keyed by candidate id) so the candidate sees it too.
function MeetLinkField({ candId }) {
  const API = window.EUROSTAR_API || location.origin;
  const [link, setLink] = aUseState('');
  const [busy, setBusy] = aUseState(false);
  const [saved, setSaved] = aUseState(false);
  const [failed, setFailed] = aUseState(false);
  React.useEffect(() => {
    fetch(API + '/admin/lms/meeting-links').then(r => r.ok ? r.json() : {}).then(m => { if (m && m[candId]) setLink(m[candId]); }).catch(() => {});
  }, [candId]);
  const save = () => {
    setBusy(true);
    // Saving requires the staff session stored by the LMS login screen.
    const token = (() => { try { return localStorage.getItem('eurostar-admin-token') || ''; } catch (e) { return ''; } })();
    fetch(API + '/admin/lms/meeting-links').then(r => r.ok ? r.json() : {}).then(m => {
      m = m || {}; const v = link.trim(); if (v) m[candId] = v; else delete m[candId];
      return fetch(API + '/admin/lms/meeting-links', {
        method: 'PUT',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
        body: JSON.stringify(m)
      });
    }).then(r => {
      // fetch only rejects on network errors, so a 401/403 would otherwise show
      // "Saved!" while saving nothing. Report the truth instead.
      if (!r || !r.ok) { setFailed(true); setTimeout(() => setFailed(false), 2600); return; }
      setSaved(true); setTimeout(() => setSaved(false), 1600);
    }).catch(() => { setFailed(true); setTimeout(() => setFailed(false), 2600); })
      .finally(() => setBusy(false));
  };
  return (
    <div style={{ marginTop: 14, borderTop: '1px solid var(--lms-divider)', paddingTop: 12 }}>
      <div className="lms-muted" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', marginBottom: 6 }}>INTERVIEW / MEET LINK</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--lms-border)', borderRadius: 9, fontFamily: 'inherit', fontSize: 13.5, background: '#fff', color: 'var(--lms-ink)' }}
          placeholder="Paste a Meet link (meet.google.com/…)" value={link} onChange={e => setLink(e.target.value)} />
        <button className="lms-btn lms-btn-pri lms-btn-sm" onClick={save} disabled={busy}>{saved ? 'Saved ✓' : failed ? 'Not saved ✕' : busy ? '…' : 'Save'}</button>
      </div>
      {failed ? <div style={{ fontSize: 11.5, marginTop: 6, color: 'var(--ruby, #b3261e)' }}>Could not save — please sign in again.</div> : null}
      {link ? <a href={link} target="_blank" rel="noopener noreferrer" className="lms-muted" style={{ fontSize: 12, display: 'inline-block', marginTop: 6 }}>Open link →</a> : null}
      <div className="lms-muted" style={{ fontSize: 11.5, marginTop: 6 }}>The candidate sees a “Join interview” button on their status screen.</div>
    </div>
  );
}

function LmsCandidateDrawer({ cand, actions, onClose }) {
  if (!cand) return null;
  const w = window.lmsWindow(cand);
  const t = window.lmsTestWindow(cand);
  const ob = cand.onboarding || {};
  const [onboardOpen, setOnboardOpen] = aUseState(false);
  const [zoom, setZoom] = aUseState(null);
  const stars = (n) => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
  // Registration creates the pipeline row, but the person has only *applied*
  // once they submit the Apply Now form (city/state/experience). Don't tick
  // "Applied" for someone who has merely signed up.
  const hasApplied = !!(cand.city && cand.state && cand.exp);
  const timeline = [
    { label: 'Applied', val: hasApplied ? (cand.applied || 'Submitted') : 'Pending', done: hasApplied },
    { label: 'Screening', val: cand.screenResult ? (cand.screenResult === 'pass' ? 'Passed · ' + stars(cand.screenRating) : 'Failed') : 'Pending', done: !!cand.screenResult },
    { label: 'Training', val: w.state === 'open' ? w.daysLeft + 'd left' : w.state === 'expired' ? 'Expired' : w.state === 'hired' ? 'Done' : 'Locked', done: cand.watched && cand.watched.length > 0 },
    { label: 'Test', val: cand.score != null ? cand.score + '%' : t.state === 'open' ? t.daysLeft + 'd left' : 'Not taken', done: cand.score != null },
    { label: 'Decision', val: cand.stage === 'hired' ? 'Hired · ' + cand.repId : cand.stage === 'rejected' ? 'Rejected' : 'Pending', done: cand.stage === 'hired' || cand.stage === 'rejected' },
  ];
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,15,0.45)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ width: 460, maxWidth: '94vw', background: 'var(--lms-paper)', height: '100%', overflowY: 'auto', boxShadow: '-12px 0 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ background: '#fff', padding: '18px 22px', borderBottom: '1px solid var(--lms-border)', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 2 }}>
          <span className="lms-av" style={{ background: `hsl(${cand.hue} 60% 45%)`, width: 44, height: 44, fontSize: 15 }}>{cand.avatar}</span>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 17 }}>{cand.name}</div><div className="lms-muted" style={{ fontSize: 12.5, fontFamily: 'monospace' }}>{cand.candId}{cand.repId ? ' · ' + cand.repId : ''}</div></div>
          <button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: 22 }}>
          {/* contact + meta */}
          <div className="lms-card lms-card-pad" style={{ marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13.5 }}>
              <div><div className="lms-muted" style={{ fontSize: 11 }}>Phone</div>{cand.phone}</div>
              <div><div className="lms-muted" style={{ fontSize: 11 }}>Email</div>{cand.email}</div>
              <div><div className="lms-muted" style={{ fontSize: 11 }}>Location</div>{cand.city}, {cand.state}</div>
              <div><div className="lms-muted" style={{ fontSize: 11 }}>Experience</div>{cand.exp}</div>
              <div><div className="lms-muted" style={{ fontSize: 11 }}>Source</div>{(window.LMS_SOURCES.find(s => s.id === cand.source) || {}).label || cand.source}</div>
              <div><div className="lms-muted" style={{ fontSize: 11 }}>Stage</div><StagePill id={window.lmsEffectiveStage(cand)} /></div>
            </div>
            {cand.resume && <div style={{ marginTop: 12 }}><button className="lms-btn lms-btn-ghost lms-btn-sm">📄 {cand.resume}</button></div>}
          </div>
          {/* timeline */}
          <div className="lms-card lms-card-pad" style={{ marginBottom: 14 }}>
            <strong style={{ display: 'block', marginBottom: 12 }}>Timeline</strong>
            {timeline.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '7px 0' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, background: s.done ? 'var(--lms-green)' : '#E6E2D8', color: s.done ? '#fff' : 'var(--lms-meta)' }}>{s.done ? '✓' : i + 1}</span>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}><span style={{ fontWeight: 600 }}>{s.label}</span><span className="lms-muted">{s.val}</span></div>
              </div>
            ))}
          </div>
          {/* screening notes */}
          <div className="lms-card lms-card-pad" style={{ marginBottom: 14 }}>
            <strong style={{ display: 'block', marginBottom: 8 }}>Screening / Interview</strong>
            {cand.screenResult
              ? <><div style={{ fontSize: 13.5 }}>{cand.screenResult === 'pass' ? '✅ Passed' : '❌ Failed'} · Rating {stars(cand.screenRating)}</div><div className="lms-muted" style={{ fontSize: 13, marginTop: 6 }}>{cand.screenNote || 'No notes.'}</div></>
              : <div className="lms-muted" style={{ fontSize: 13 }}>Not screened yet — schedule and record the outcome from the Screening tab.</div>}
            <MeetLinkField candId={cand.candId} />
          </div>
          {/* attempts */}
          <div className="lms-card lms-card-pad" style={{ marginBottom: 14 }}>
            <strong style={{ display: 'block', marginBottom: 8 }}>Test attempts</strong>
            {cand.attempts && cand.attempts.length
              ? cand.attempts.map((a, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, padding: '5px 0', borderTop: i ? '1px solid var(--lms-divider)' : 'none' }}>
                  <span>Attempt {a.n} · {a.date}</span><span style={{ fontWeight: 700, color: a.passed ? 'var(--lms-green-ink)' : '#A23B3B' }}>{a.score}% {a.passed ? '· Pass' : '· Fail'}</span>
                </div>))
              : <div className="lms-muted" style={{ fontSize: 13 }}>No attempts yet.</div>}
          </div>
          {/* onboarding (hired only) */}
          {cand.stage === 'hired' && (
            <div className="lms-card lms-card-pad">
              <strong style={{ display: 'block', marginBottom: 10 }}>Onboarding · KYC &amp; bank</strong>
              {(() => {
                const bank = ob.bank || {};
                const kycDone = ob.confidentiality && ob.photo && ob.aadhaarImg && bank.acc;
                const thumb = (src, label) => (
                  <div style={{ textAlign: 'center' }}>
                    {src
                      ? <img src={src} alt={label} onClick={() => setZoom(src)} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--lms-border)', cursor: 'zoom-in', display: 'block' }} />
                      : <div style={{ width: 72, height: 72, borderRadius: 8, border: '1px dashed var(--lms-border)', background: '#F4F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--lms-meta)', fontSize: 11 }}>none</div>}
                    <div style={{ fontSize: 11, color: 'var(--lms-meta)', marginTop: 4 }}>{label}</div>
                  </div>
                );
                const row = (lbl, val) => (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderBottom: '1px solid var(--lms-divider)' }}>
                    <span style={{ color: 'var(--lms-meta)', fontSize: 12.5 }}>{lbl}</span>
                    <span style={{ fontWeight: 600, fontSize: 13, fontFamily: lbl === 'Account no.' || lbl === 'IFSC' ? 'monospace' : 'inherit' }}>{val || '—'}</span>
                  </div>
                );
                return (
                  <React.Fragment>
                    <div style={{ marginBottom: 10 }}>
                      <span className="lms-pill" style={{ background: kycDone ? 'var(--lms-green-soft)' : '#F6E9D6', color: kycDone ? 'var(--lms-green-ink)' : '#9A6B12', fontSize: 11, fontWeight: 700 }}>{kycDone ? 'KYC verified' : 'KYC pending'}</span>
                      <span style={{ marginLeft: 10, fontSize: 12.5 }}>{ob.confidentiality ? '✅' : '⬜'} Confidentiality signed</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                      {thumb(ob.photo, 'Photo')}{thumb(ob.aadhaarImg, 'Aadhaar')}{thumb(ob.panImg, 'PAN')}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--lms-meta)', margin: '4px 0 4px' }}>Bank account</div>
                    {row('Holder', bank.holder)}
                    {row('Account no.', bank.acc)}
                    {row('Bank', bank.bankName)}
                    {row('IFSC', bank.ifsc)}
                    <div style={{ marginTop: 10, fontSize: 12.5 }}>{ob.crmSynced ? '✅ Synced to CRM' : '⬜ Not yet in CRM'}</div>
                  </React.Fragment>
                );
              })()}
              {!ob.crmSynced && <button className="lms-btn lms-btn-pri lms-btn-sm" style={{ marginTop: 12 }} onClick={() => setOnboardOpen(true)}>Onboard to CRM as Rep →</button>}
              {ob.crmSynced && <div className="lms-muted" style={{ fontSize: 12, marginTop: 10 }}>Active in CRM · {cand.repId} · covers {ob.crmCity || cand.city} — leads for this city auto-forward to {cand.name.split(' ')[0]}.</div>}
            </div>
          )}
          {onboardOpen && <CrmOnboardModal cand={cand} onClose={() => setOnboardOpen(false)} onConfirm={(form) => { actions && actions.onboardToCrm(cand.id, form); setOnboardOpen(false); }} />}
          {zoom && <div onClick={() => setZoom(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,20,17,0.82)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}><img src={zoom} alt="document" style={{ maxWidth: '92%', maxHeight: '92%', borderRadius: 10, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} /></div>}
        </div>
      </div>
    </div>
  );
}

/* ===================== SETTINGS ===================== */
// Editable compensation & commission — the office changes salary, target and
// slab rates here; the M16 module notes rebuild instantly from these values.
function LmsCompensationCard({ fieldStyle }) {
  const [c, setC] = aUseState(() => JSON.parse(JSON.stringify(window.LMS_COMPENSATION)));
  const [saved, setSaved] = aUseState(false);
  const apply = (next) => { setC(next); setSaved(false); };
  const setTop = (k, v) => apply({ ...c, [k]: v });
  const setSlab = (i, k, v) => { const slabs = c.slabs.map((s, j) => j === i ? { ...s, [k]: v } : s); apply({ ...c, slabs }); };
  const addSlab = () => apply({ ...c, slabs: [...c.slabs, { from: 0, to: null, pct: 0 }] });
  const delSlab = (i) => apply({ ...c, slabs: c.slabs.filter((_, j) => j !== i) });
  const save = () => {
    window.LMS_COMPENSATION = JSON.parse(JSON.stringify(c));
    if (window.lmsBuildCommissionNotes) window.LMS_MODULE_NOTES.M16 = window.lmsBuildCommissionNotes();
    setSaved(true);
  };
  const numOrNull = (v) => v === '' || v == null ? null : +v;
  return (
    <div className="lms-card lms-card-pad" style={{ marginBottom: 16 }}>
      <strong style={{ display: 'block', marginBottom: 4 }}>Compensation &amp; commission</strong>
      <div className="lms-muted" style={{ fontSize: 12.5, marginBottom: 12 }}>These figures are taught to reps in Module 16. Editing here rewrites that module’s notes.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 14 }}>
        <div className="lms-field"><label>Fixed salary — low (₹)</label><input style={fieldStyle} type="number" value={c.salaryLow} onChange={e => setTop('salaryLow', +e.target.value || 0)} /></div>
        <div className="lms-field"><label>Fixed salary — high (₹)</label><input style={fieldStyle} type="number" value={c.salaryHigh} onChange={e => setTop('salaryHigh', +e.target.value || 0)} /></div>
        <div className="lms-field"><label>Min monthly target (₹)</label><input style={fieldStyle} type="number" value={c.targetMonth} onChange={e => setTop('targetMonth', +e.target.value || 0)} /></div>
        <div className="lms-field"><label>Target by month #</label><input style={fieldStyle} type="number" value={c.targetByMonth} onChange={e => setTop('targetByMonth', +e.target.value || 0)} /></div>
        <div className="lms-field"><label>Typical rep — low (₹)</label><input style={fieldStyle} type="number" value={c.avgLow} onChange={e => setTop('avgLow', +e.target.value || 0)} /></div>
        <div className="lms-field"><label>Typical rep — high (₹)</label><input style={fieldStyle} type="number" value={c.avgHigh} onChange={e => setTop('avgHigh', +e.target.value || 0)} /></div>
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8, color: 'var(--lms-green-ink)' }}>Commission slabs (monthly sales)</div>
      {c.slabs.map((s, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 34px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <input style={fieldStyle} type="number" placeholder="From ₹" value={s.from} onChange={e => setSlab(i, 'from', +e.target.value || 0)} />
          <input style={fieldStyle} type="number" placeholder="To ₹ (blank = upwards)" value={s.to == null ? '' : s.to} onChange={e => setSlab(i, 'to', numOrNull(e.target.value))} />
          <input style={fieldStyle} type="number" placeholder="%" value={s.pct} onChange={e => setSlab(i, 'pct', +e.target.value || 0)} />
          <button className="lms-btn lms-btn-danger lms-btn-sm" onClick={() => delSlab(i)} title="Remove slab">✕</button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
        <button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={addSlab}>+ Add slab</button>
        <button className="lms-btn lms-btn-pri lms-btn-sm" onClick={save}>Save compensation</button>
        {saved && <span className="lms-pill" style={{ background: 'var(--lms-green-soft)', color: 'var(--lms-green-ink)', fontSize: 11 }}>✓ Saved — Module 16 updated</span>}
      </div>
    </div>
  );
}

function LmsSettings({ settings, actions }) {
  const s = settings || window.LMS_SETTINGS;
  const fieldStyle = { width: '100%', padding: '9px 12px', border: '1px solid var(--lms-border)', borderRadius: 'var(--r-md)', fontSize: 13.5, fontFamily: 'inherit', background: '#fff' };
  const set = (patch) => actions && actions.saveSettings(patch);
  return (
    <div className="lms-body">
      <LmsPageHead title="Settings" sub="Recruitment rules, integrations & message templates" />
      <div className="lms-card lms-card-pad" style={{ marginBottom: 16 }}>
        <strong style={{ display: 'block', marginBottom: 12 }}>Lifecycle rules</strong>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
          <div className="lms-field"><label>Pass mark (%)</label><input style={fieldStyle} type="number" value={s.passPct} onChange={e => set({ passPct: +e.target.value || 0 })} /></div>
          <div className="lms-field"><label>Training window (days)</label><input style={fieldStyle} type="number" value={s.windowDays} onChange={e => set({ windowDays: +e.target.value || 0 })} /></div>
          <div className="lms-field"><label>Finish training within (days)</label><input style={fieldStyle} type="number" value={s.trainDays} onChange={e => set({ trainDays: +e.target.value || 0 })} /></div>
          <div className="lms-field"><label>Test window (days)</label><input style={fieldStyle} type="number" value={s.testDays} onChange={e => set({ testDays: +e.target.value || 0 })} /></div>
          <div className="lms-field"><label>New-customer target / rep / month</label><input style={fieldStyle} type="number" value={s.newCustomerTarget} onChange={e => set({ newCustomerTarget: +e.target.value || 0 })} /></div>
        </div>
        <div className="lms-muted" style={{ fontSize: 12, marginTop: 10 }}>Note: in this prototype these values are read live by the candidate flow where wired; Bright Code will persist them server-side.</div>
      </div>
      <LmsCompensationCard fieldStyle={fieldStyle} />
      <div className="lms-card lms-card-pad" style={{ marginBottom: 16 }}>
        <strong style={{ display: 'block', marginBottom: 12 }}>Integrations</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.zoomConnected ? 'var(--lms-green)' : '#D14343' }} />
          <div style={{ flex: 1 }}><strong>Zoom</strong><div className="lms-muted" style={{ fontSize: 12.5 }}>{s.zoomConnected ? 'Connected — interview links auto-generate.' : 'Not connected — add ZOOM_ACCOUNT_ID / CLIENT_ID / CLIENT_SECRET.'}</div></div>
          <button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={() => set({ zoomConnected: !s.zoomConnected })}>{s.zoomConnected ? 'Disconnect' : 'Connect'}</button>
        </div>
        <div className="lms-field"><label>Staff WhatsApp (hiring alerts)</label><input style={fieldStyle} value={s.staffWhatsApp} onChange={e => set({ staffWhatsApp: e.target.value })} /></div>
      </div>
      <div className="lms-card lms-card-pad">
        <strong style={{ display: 'block', marginBottom: 12 }}>Message templates</strong>
        {Object.entries(s.templates).map(([k, v]) => (
          <div className="lms-field" key={k} style={{ marginBottom: 12 }}>
            <label>{k === 'testUnlocked' ? 'Test unlocked' : k === 'hired' ? 'Hired' : 'Rejected'} · SMS/WhatsApp</label>
            <textarea style={{ ...fieldStyle, minHeight: 56, resize: 'vertical' }} value={v} onChange={e => set({ templates: { ...s.templates, [k]: e.target.value } })} />
          </div>
        ))}
        <div className="lms-muted" style={{ fontSize: 12 }}>Placeholders: {'{name} {repId} {pwd} {testDays}'}</div>
      </div>
    </div>
  );
}

/* ===================== REPORTS ===================== */
function LmsReports({ cands }) {
  const C = cands || window.LMS_CANDIDATES;
  // Count by the DERIVED stage (screening/window/score/hire), the same truth the
  // candidate list pills and the candidate app show — not the raw `stage` field,
  // which lags and would make the funnel disagree with the pipeline.
  const eff = (c) => (window.lmsEffectiveStage ? window.lmsEffectiveStage(c) : c.stage);
  const total = C.length;
  const hired = C.filter(c => eff(c) === 'hired').length;
  const rejected = C.filter(c => eff(c) === 'rejected').length;
  const tested = C.filter(c => c.score != null);
  const passed = tested.filter(c => c.score >= window.LMS_PASS_PCT).length;
  const passRate = tested.length ? Math.round((passed / tested.length) * 100) : 0;
  const avgScore = tested.length ? Math.round(tested.reduce((s, c) => s + c.score, 0) / tested.length) : 0;
  // source ROI
  const bySrc = {}; C.forEach(c => { const k = c.source; bySrc[k] = bySrc[k] || { n: 0, hired: 0 }; bySrc[k].n++; if (eff(c) === 'hired') bySrc[k].hired++; });
  // funnel
  const stages = ['registered', 'applied', 'screening', 'training', 'recommended', 'hired'];
  const stageCount = {}; window.LMS_STAGES.forEach(s => stageCount[s.id] = 0);
  C.forEach(c => { const s = eff(c); stageCount[s] = (stageCount[s] || 0) + 1; });
  // Real time-to-hire: average days from application to the passing test (falls
  // back to the test/training unlock date) across hired candidates. Shows "—"
  // when there isn't enough date data, instead of a made-up number.
  const parseD = (s) => { if (!s) return null; const d = new Date(String(s).split('·')[0].trim()); return isNaN(d.getTime()) ? null : d; };
  const hireSpans = C.filter(c => eff(c) === 'hired').map(c => {
    const a = parseD(c.applied) || parseD(c.createdAt);
    const pass = (c.attempts || []).filter(x => x.passed).slice(-1)[0];
    const h = parseD(pass && pass.date) || parseD(c.testUnlockedOn) || parseD(c.unlockedOn);
    if (!a || !h) return null;
    const days = Math.round((h - a) / 86400000);
    return days >= 0 ? days : null;
  }).filter(x => x != null);
  const avgHireDays = hireSpans.length ? Math.round(hireSpans.reduce((s, d) => s + d, 0) / hireSpans.length) : null;
  const kpi = [
    { label: 'Applications', val: total, c: '#15803D' },
    { label: 'Hired', val: hired, c: '#7C3AED' },
    { label: 'Test pass rate', val: passRate + '%', c: '#0891B2' },
    { label: 'Avg test score', val: avgScore + '%', c: '#B7791F' },
  ];
  const exportCsv = () => {
    const rows = [['Candidate ID', 'Name', 'City', 'State', 'Source', 'Stage', 'Score', 'Rep ID']].concat(
      C.map(c => [c.candId, c.name, c.city, c.state, c.source, c.stage, c.score == null ? '' : c.score, c.repId || '']));
    const csv = rows.map(r => r.map(x => '"' + String(x).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'eurostar-lms-candidates.csv'; a.click();
  };
  return (
    <div className="lms-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <LmsPageHead title="Reports" sub="Hiring funnel, source performance & assessment outcomes" />
        <button className="lms-btn lms-btn-ghost" onClick={exportCsv}>⬇ Export CSV</button>
      </div>
      <div className="lms-kpis">
        {kpi.map(k => (<div key={k.label} className="lms-kpi"><div className="lms-kpi-top"><span className="lms-kpi-label">{k.label}</span></div><div className="lms-kpi-val" style={{ color: k.c }}>{k.val}</div></div>))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <div className="lms-card lms-card-pad">
          <strong style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 16, display: 'block', marginBottom: 14 }}>Hiring funnel</strong>
          <div className="lms-bars">
            {stages.map(st => { const m = window.LMS_STAGES.find(x => x.id === st); const n = stageCount[st] || 0; return (
              <div key={st} className="lms-bar-row"><span>{m.label}</span><div className="lms-bar-track"><div className="lms-bar-fill" style={{ width: `${total ? (n / total) * 100 : 0}%`, background: m.color }} /></div><span style={{ textAlign: 'right', fontWeight: 600 }}>{n}</span></div>
            );})}
          </div>
        </div>
        <div className="lms-card lms-card-pad">
          <strong style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 16, display: 'block', marginBottom: 14 }}>Source performance (hired / applied)</strong>
          <div className="lms-bars">
            {Object.entries(bySrc).map(([k, v]) => (
              <div key={k} className="lms-bar-row"><span>{(window.LMS_SOURCES.find(s => s.id === k) || {}).label || k}</span><div className="lms-bar-track"><div className="lms-bar-fill" style={{ width: `${(v.hired / v.n) * 100}%`, background: '#15803D' }} /></div><span style={{ textAlign: 'right', fontWeight: 600 }}>{v.hired}/{v.n}</span></div>
            ))}
          </div>
        </div>
      </div>
      <div className="lms-muted" style={{ fontSize: 12.5, marginTop: 14 }}>Time-to-hire (avg): <b>{avgHireDays != null ? '~' + avgHireDays + ' day' + (avgHireDays === 1 ? '' : 's') : '—'}</b> from application to hire · {rejected} rejected.</div>
    </div>
  );
}

/* ===================== NOTIFICATIONS + AUDIT ===================== */
function LmsNotifications({ notifs, audit }) {
  const N = notifs || window.LMS_NOTIFICATIONS;
  const A = audit || window.LMS_AUDIT;
  return (
    <div className="lms-body">
      <LmsPageHead title="Notifications & Activity" sub="Triggered alerts and the admin action log" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <div className="lms-card">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--lms-divider)' }}><strong style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 16 }}>Notifications</strong></div>
          {N.map(n => (
            <div key={n.id} style={{ display: 'flex', gap: 12, padding: '13px 18px', borderTop: '1px solid var(--lms-divider)', background: n.read ? '#fff' : '#F4F6F4' }}>
              <span style={{ fontSize: 18 }}>{n.icon}</span>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>{n.who}</div><div className="lms-muted" style={{ fontSize: 12.5 }}>{n.text}</div></div>
              <span className="lms-muted" style={{ fontSize: 11.5, whiteSpace: 'nowrap' }}>{n.time}</span>
            </div>
          ))}
          <div className="lms-muted" style={{ fontSize: 12, padding: '12px 18px', borderTop: '1px solid var(--lms-divider)' }}>New application, test pass, hire & overdue events also fire a WhatsApp to staff ({(window.LMS_SETTINGS).staffWhatsApp}).</div>
        </div>
        <div className="lms-card">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--lms-divider)' }}><strong style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 16 }}>Audit log</strong></div>
          {A.map(a => (
            <div key={a.id} style={{ padding: '13px 18px', borderTop: '1px solid var(--lms-divider)' }}>
              <div style={{ fontSize: 13.5 }}><b>{a.actor}</b> — {a.action}</div>
              <div className="lms-muted" style={{ fontSize: 12 }}>{a.target} · {a.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LmsDashboard, LmsCandidates, LmsScreening, LmsApproval, LmsTraining, LmsQuestionBank, LmsCandidateDrawer, LmsSettings, LmsReports, LmsNotifications, StagePill, LmsPageHead });
