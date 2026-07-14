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
          <div style={{ overflowX: 'auto' }}><table className="lms-table"><thead><tr><th>Candidate</th><th>Location</th><th>Stage</th></tr></thead>
            <tbody>{C.map(c => (
              <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => openCand && openCand(c.id)}><td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="lms-av" style={{ background: `hsl(${c.hue} 60% 45%)` }}>{c.avatar}</span><div><div style={{ fontWeight: 600 }}>{c.name}</div><div className="lms-muted" style={{ fontSize: 12 }}>{c.email}</div></div></div></td>
              <td className="lms-muted">{c.city}, {c.state}</td><td><StagePill id={c.stage} /></td></tr>
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
      <div className="lms-card" style={{ overflowX: 'auto' }}>
        <table className="lms-table" style={{ minWidth: 1240 }}>
          <thead><tr><th>#</th><th>Candidate</th><th>Location</th><th>Stage</th><th>Training Window</th><th>Test Window</th><th>Test Score</th><th>Rep ID</th><th>Actions</th></tr></thead>
          <tbody>{C.map(c => {
            const w = window.lmsWindow(c);
            const t = window.lmsTestWindow(c);
            return (
            <tr key={c.id}><td className="lms-muted">{c.n}</td>
              <td><div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => openCand && openCand(c.id)}><span className="lms-av" style={{ background: `hsl(${c.hue} 60% 45%)` }}>{c.avatar}</span><div><div style={{ fontWeight: 600, textDecoration: 'underline', textDecorationColor: 'var(--lms-border)' }}>{c.name}</div><div className="lms-muted" style={{ fontSize: 11.5, fontFamily: 'monospace' }}>{c.candId} · {c.phone}</div></div></div></td>
              <td className="lms-muted">{c.city}<div style={{ fontSize: 12 }}>{c.state}</div></td>
              <td><StagePill id={c.stage} /></td>
              <td>{winLabel(w)}</td>
              <td>{testLabel(t)}</td>
              <td>{c.score != null ? <strong style={{ color: c.score >= window.LMS_PASS_PCT ? 'var(--lms-green-ink)' : '#A23B3B' }}>{c.score}%</strong> : <span className="lms-muted">—</span>}</td>
              <td className="lms-muted" style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: c.repId ? 700 : 400, color: c.repId ? 'var(--lms-ink)' : 'var(--lms-meta)' }}>{c.repId || '—'}</td>
              <td>
                {actions && c.stage !== 'hired' && <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 150 }}>
                  {(w.state === 'locked' || w.state === 'expired')
                    ? <button className="lms-btn lms-btn-pri lms-btn-sm" onClick={() => actions.unlockTraining(c.id)}>🔓 Unlock training</button>
                    : <button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={() => actions.lockTraining(c.id)}>Lock training</button>}
                  {t.state === 'used'
                    ? <button className="lms-btn lms-btn-pri lms-btn-sm" style={{ background: '#1D4ED8' }} onClick={() => actions.allowRetest(c.id)}>↻ Allow re-test</button>
                    : (t.state === 'locked' || t.state === 'expired')
                      ? <button className="lms-btn lms-btn-pri lms-btn-sm" style={{ background: '#1D4ED8' }} onClick={() => actions.unlockTest(c.id)}>🔓 Unlock test</button>
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
  const zoom = (settings || window.LMS_SETTINGS).zoomConnected;
  const all = cands || window.LMS_CANDIDATES;
  const toScreen = all.filter(c => c.stage === 'applied' || c.stage === 'screening');
  const saveOutcome = () => {
    if (!outId || !actions) return;
    actions.markScreen(outId, result, note, rating);
    setOutId(''); setNote(''); setResult('pass'); setRating(4);
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
          <div className="lms-field" style={{ marginBottom: 14 }}><label>Select Candidate *</label><select className="lms-select"><option>Choose a candidate…</option>{toScreen.map(c => <option key={c.id}>{c.name} · {c.city}</option>)}</select></div>
          <div className="lms-field" style={{ marginBottom: 14 }}><label>Date *</label><input className="lms-input" type="date" defaultValue="2026-06-22" /></div>
          <div className="lms-field"><label>Time Slot * <span className="lms-muted" style={{ fontWeight: 400 }}>· 15–20 min · strikethrough = booked</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 4 }}>
              {window.LMS_SLOTS.map(s => {
                const booked = window.LMS_SLOTS_BOOKED.includes(s);
                return <button key={s} className={'lms-slot' + (booked ? ' booked' : slot === s ? ' on' : '')} onClick={() => !booked && setSlot(s)}>{s}</button>;
              })}
            </div>
          </div>
          <div style={{ marginTop: 18 }}><button className="lms-btn lms-btn-pri" style={{ width: '100%', justifyContent: 'center', background: '#4F46E5' }}>{zoom ? 'Generate Zoom Link & Schedule' : 'Schedule (manual link)'}</button></div>
        </div>
        <div className="lms-card lms-card-pad">
          <strong style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 18, display: 'block', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--lms-divider)' }}>Record Screening Outcome</strong>
          <div className="lms-field" style={{ marginBottom: 14 }}><label>Candidate *</label>
            <select style={fieldStyle} value={outId} onChange={e => setOutId(e.target.value)}><option value="">Choose a candidate…</option>{toScreen.map(c => <option key={c.id} value={c.id}>{c.name} · {c.city}</option>)}</select>
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
          <button className="lms-btn lms-btn-pri" style={{ width: '100%', justifyContent: 'center' }} disabled={!outId} onClick={saveOutcome}>Save outcome</button>
          <div className="lms-muted" style={{ fontSize: 12, marginTop: 10 }}>A <b>Pass</b> moves the candidate to In-Training (then unlock their training window from Candidates). A <b>Fail</b> rejects them with a reason.</div>
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
function LmsTraining() {
  const [mods, setMods] = aUseState(window.LMS_MODULES.map(m => ({ ...m, on: m.mandatory })));
  const [compose, setCompose] = aUseState(null); // null | {kind:'module'} | {kind:'video', modId}
  const [mTitle, setMTitle] = aUseState('');
  const [vTitle, setVTitle] = aUseState('');
  const [vDur, setVDur] = aUseState('');
  const [vMod, setVMod] = aUseState('');
  const [nText, setNText] = aUseState('');
  // Which language's notes are shown per module (default English).
  const [notesLang, setNotesLang] = aUseState({});
  const LANGS = window.LMS_LANGS || [{ id: 'en', label: 'English', native: 'English' }];
  const langOf = (modId) => notesLang[modId] || 'en';
  const setLangOf = (modId, lang) => setNotesLang(s => ({ ...s, [modId]: lang }));
  const notesFor = (modId, lang) => (window.lmsNotesFor ? window.lmsNotesFor(modId, lang) : []);
  // A language "has its own" notes only if that language key exists in the i18n table.
  const langFilled = (lang) => !!(window.LMS_NOTES_I18N && window.LMS_NOTES_I18N[lang]);
  const toggle = (id) => setMods(ms => ms.map(m => m.id === id ? { ...m, on: !m.on } : m));
  const today = () => new Date(window.LMS_TODAY).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const openModule = () => { setMTitle(''); setCompose({ kind: 'module' }); };
  const openVideo = (modId) => { setVTitle(''); setVDur(''); setVMod(modId || (mods[0] && mods[0].id) || ''); setCompose({ kind: 'video', modId }); };
  const openNotes = (modId, lang) => { setNText(notesFor(modId, lang).join('\n')); setCompose({ kind: 'notes', modId, lang }); };
  const cancel = () => setCompose(null);

  const saveModule = () => {
    const title = mTitle.trim(); if (!title) return;
    const code = 'M' + (mods.length + 1);
    setMods(ms => [...ms, { id: code, code, title, mandatory: true, on: true, videos: [] }]);
    setCompose(null);
  };
  const saveVideo = () => {
    const title = vTitle.trim(); if (!title) return;
    const modId = compose.modId || vMod;
    const dur = vDur.trim() || '00:00';
    const vid = { id: 'v' + Date.now(), title, dur, added: today(), mandatory: true };
    setMods(ms => ms.map(m => m.id === modId ? { ...m, videos: [...m.videos, vid] } : m));
    setCompose(null);
  };
  const removeModule = (id) => setMods(ms => ms.filter(m => m.id !== id));
  const removeVideo = (modId, vid) => setMods(ms => ms.map(m => m.id === modId ? { ...m, videos: m.videos.filter(v => v.id !== vid) } : m));

  // Save edited notes into the in-memory i18n table (demo — persists for the session;
  // Bright Code wires this to the backend so notes save per module + language).
  const saveNotes = () => {
    const { modId, lang } = compose;
    const lines = nText.split('\n').map(s => s.trim()).filter(Boolean);
    if (!window.LMS_NOTES_I18N) window.LMS_NOTES_I18N = { en: {} };
    if (!window.LMS_NOTES_I18N[lang]) window.LMS_NOTES_I18N[lang] = {};
    window.LMS_NOTES_I18N[lang][modId] = lines;
    setCompose(null);
    // nudge a re-render by touching module state
    setMods(ms => ms.slice());
  };

  const fieldStyle = { width: '100%', padding: '9px 12px', border: '1px solid var(--lms-border)', borderRadius: 'var(--r-md)', fontSize: 13.5, fontFamily: 'inherit', background: '#fff' };

  return (
    <div className="lms-body">
      <LmsPageHead title="Training Content Manager" />
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <button className="lms-btn lms-btn-ghost" onClick={openModule}>+ Add Module</button>
        <button className="lms-btn lms-btn-pri" onClick={() => openVideo(null)}>+ Upload Video</button>
      </div>

      {compose && compose.kind === 'module' && (
        <div className="lms-card lms-card-pad" style={{ marginBottom: 16, borderColor: 'var(--lms-green)' }}>
          <strong style={{ display: 'block', marginBottom: 10 }}>New module</strong>
          <input style={fieldStyle} placeholder="Module title — e.g. Objection Handling" value={mTitle} autoFocus onChange={e => setMTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveModule()} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="lms-btn lms-btn-pri lms-btn-sm" onClick={saveModule} disabled={!mTitle.trim()} style={!mTitle.trim() ? { opacity: .5 } : {}}>Add module</button>
            <button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={cancel}>Cancel</button>
          </div>
        </div>
      )}
      {compose && compose.kind === 'video' && (
        <div className="lms-card lms-card-pad" style={{ marginBottom: 16, borderColor: 'var(--lms-green)' }}>
          <strong style={{ display: 'block', marginBottom: 10 }}>{compose.modId ? 'Add video to module' : 'Upload video'}</strong>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
            <input style={fieldStyle} placeholder="Video title — e.g. Closing the Sale" value={vTitle} autoFocus onChange={e => setVTitle(e.target.value)} />
            <input style={fieldStyle} placeholder="Length mm:ss" value={vDur} onChange={e => setVDur(e.target.value)} />
          </div>
          {!compose.modId && (
            <select style={{ ...fieldStyle, marginTop: 10 }} value={vMod} onChange={e => setVMod(e.target.value)}>
              {mods.map(m => <option key={m.id} value={m.id}>{m.code}: {m.title}</option>)}
            </select>
          )}
          <div style={{ marginTop: 10, padding: '14px', border: '1.5px dashed var(--lms-green)', borderRadius: 'var(--r-md)', background: '#F4F6F4', textAlign: 'center', color: 'var(--lms-green-ink)', fontSize: 13 }}>
            ⬆ Drag &amp; drop a video file here, or click to browse — MP4 · streamed via S3 + CloudFront
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="lms-btn lms-btn-pri lms-btn-sm" onClick={saveVideo} disabled={!vTitle.trim()} style={!vTitle.trim() ? { opacity: .5 } : {}}>Save video</button>
            <button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={cancel}>Cancel</button>
          </div>
        </div>
      )}

      {compose && compose.kind === 'notes' && (() => {
        const L = (window.LMS_LANGS || []).find(l => l.id === compose.lang) || { native: 'English' };
        const mod = mods.find(m => m.id === compose.modId) || {};
        return (
        <div className="lms-card lms-card-pad" style={{ marginBottom: 16, borderColor: 'var(--lms-green)' }}>
          <strong style={{ display: 'block', marginBottom: 4 }}>Notes · {mod.code} {mod.title}</strong>
          <div className="lms-muted" style={{ fontSize: 12.5, marginBottom: 10 }}>Language: <b>{L.native}</b> · one point per line — this is exactly what the rep reads below the video.</div>
          <textarea style={{ ...fieldStyle, minHeight: 180, resize: 'vertical', lineHeight: 1.5 }} value={nText} autoFocus onChange={e => setNText(e.target.value)} placeholder={'Type one revision point per line...'} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="lms-btn lms-btn-pri lms-btn-sm" onClick={saveNotes}>Save notes</button>
            <button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={cancel}>Cancel</button>
          </div>
        </div>
      );})()}

      <div className="lms-muted" style={{ fontSize: 13, marginBottom: 18 }}>{mods.length} modules · each with a Mira video + written notes in every rep language · video streamed via AWS S3 + CloudFront (signed URLs)</div>
      {mods.map(m => {
        const lang = langOf(m.id);
        const notes = notesFor(m.id, lang);
        const filled = langFilled(lang);
        return (
        <div key={m.id} className="lms-card" style={{ marginBottom: 18, overflow: 'hidden' }}>
          {/* Module header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', background: '#F4F6F4', flexWrap: 'wrap' }}>
            <span className="lms-tag lms-tag-mod">{m.code}</span>
            <strong style={{ fontSize: 15, flex: 1, minWidth: 120 }}>{m.title}</strong>
            <button className="lms-btn lms-btn-danger lms-btn-sm" onClick={() => removeModule(m.id)}>Remove</button>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--lms-meta)' }}>Mandatory <button className={'lms-toggle' + (m.on ? ' on' : '')} onClick={() => toggle(m.id)}><span className="knob" /></button></span>
          </div>

          {/* ---- Part 1 · Mira video ---- */}
          <div style={{ padding: '13px 18px 4px' }}>
            <div className="lms-part-label"><span className="lms-part-num">1</span> Mira video</div>
          </div>
          {m.videos.length === 0 && <div className="lms-muted" style={{ padding: '4px 18px 12px', fontSize: 13 }}>No Mira video yet — add one below.</div>}
          {m.videos.map(v => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 18px', flexWrap: 'wrap' }}>
              <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--lms-green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>▶</span>
              <div style={{ flex: 1, minWidth: 120 }}><div style={{ fontWeight: 600 }}>{v.title}</div><div className="lms-muted" style={{ fontSize: 12 }}>{v.dur} · Added {v.added}{v.srcByLang ? ' · localised' : ''}</div></div>
              <span className="lms-tag lms-tag-mod">Mandatory</span>
              <button className="lms-btn lms-btn-danger lms-btn-sm" onClick={() => removeVideo(m.id, v.id)}>Remove</button>
            </div>
          ))}
          <div style={{ padding: '4px 18px 14px' }}><button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={() => openVideo(m.id)}>+ Add / replace Mira video</button></div>

          {/* ---- Part 2 · Written notes ---- */}
          <div style={{ padding: '13px 18px 6px', borderTop: '1px solid var(--lms-divider)', background: '#FBFBF9' }}>
            <div className="lms-part-label"><span className="lms-part-num">2</span> Written notes <span className="lms-muted" style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— shown to the rep below the video (in the language they picked at login)</span></div>
          </div>
          <div style={{ padding: '4px 18px 16px', background: '#FBFBF9' }}>
            {notes.length === 0
              ? <div className="lms-muted" style={{ fontSize: 13, padding: '8px 0' }}>No notes for this module yet.</div>
              : <ul className="lms-note-list">{notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
            <button className="lms-btn lms-btn-ghost lms-btn-sm" style={{ marginTop: 10 }} onClick={() => openNotes(m.id, 'en')}>Edit notes</button>
          </div>

          {/* ---- Part 3 · Hands-on practice (clickable app simulation) ---- */}
          {m.practice && (
            <div style={{ padding: '13px 18px 16px', borderTop: '1px solid var(--lms-divider)' }}>
              <div className="lms-part-label"><span className="lms-part-num">3</span> Hands-on practice <span className="lms-muted" style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— a clickable {m.practice.app === 'crm' ? 'CRM' : 'Sales App'} simulation the rep uses right here</span></div>
              <div className="lms-practice-admin">
                <div className="lms-practice-admin-head">
                  <span className="lms-tag lms-tag-mod">{m.practice.app === 'crm' ? 'Rep CRM' : 'Sales App'}</span>
                  <strong style={{ fontSize: 13.5 }}>{m.practice.label}</strong>
                  <span className="lms-muted" style={{ fontSize: 12, marginLeft: 'auto' }}>{m.practice.tasks.length} tasks</span>
                </div>
                <div className="lms-practice-admin-intro">{m.practice.intro}</div>
                <ol className="lms-practice-admin-tasks">
                  {m.practice.tasks.map((t, i) => <li key={i}>{t}</li>)}
                </ol>
                <div className="lms-muted" style={{ fontSize: 11.5, marginTop: 8 }}>Dummy data · resets each session — nothing the rep does here reaches the office.</div>
              </div>
            </div>
          )}
        </div>
      );})}
    </div>
  );
}

// ---------- Question Bank ----------
function LmsQuestionBank({ questions, testCfg, actions }) {
  const QALL = questions || window.LMS_QUESTIONS;
  const cfg = testCfg || window.LMS_TEST_CONFIG;
  const [mod, setMod] = aUseState('');
  const [limit, setLimit] = aUseState(10);
  const [editing, setEditing] = aUseState(null); // null | {q...} (new or existing)
  const [showCfg, setShowCfg] = aUseState(false);
  const modName = (id) => (window.LMS_MODULES.find(m => m.id === id) || {}).title || id;
  let Q = QALL;
  if (mod) Q = Q.filter(q => q.mod === mod);
  const shown = Q.slice(0, limit);

  const blank = () => ({ id: '', mod: window.LMS_MODULES[0].id, type: 'MCQ', q: '', options: ['', '', '', ''], answer: 0 });
  const fieldStyle = { width: '100%', padding: '9px 12px', border: '1px solid var(--lms-border)', borderRadius: 'var(--r-md)', fontSize: 13.5, fontFamily: 'inherit', background: '#fff' };
  const fileRef = React.useRef(null);

  // Parse a CSV line respecting quotes.
  const parseCsvLine = (line) => {
    const out = []; let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) { const ch = line[i];
      if (inQ) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false; } else cur += ch; }
      else { if (ch === '"') inQ = true; else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch; } }
    out.push(cur); return out.map(s => s.trim());
  };
  const modIdOf = (v) => { const s = String(v || '').trim().toUpperCase();
    const byId = window.LMS_MODULES.find(m => m.id.toUpperCase() === s);
    const byName = window.LMS_MODULES.find(m => m.title.toUpperCase() === s);
    return (byId || byName || window.LMS_MODULES[0]).id; };
  const rowsToQuestions = (rows) => {
    const items = []; let skipped = 0;
    rows.forEach((r, i) => {
      if (!r || r.length < 3) return;
      if (i === 0 && /^(module|mod)$/i.test(String(r[0]).trim())) return; // header
      const mod = modIdOf(r[0]);
      const type = /true|false|tf/i.test(String(r[1])) ? 'True-False' : 'MCQ';
      const q = String(r[2] || '').trim(); if (!q) { skipped++; return; }
      if (type === 'MCQ') {
        const options = [r[3], r[4], r[5], r[6]].map(x => String(x || '').trim());
        if (options.filter(Boolean).length < 2) { skipped++; return; }
        const ansRaw = String(r[7] || '').trim();
        let answer = 0;
        if (/^[A-D]$/i.test(ansRaw)) answer = ansRaw.toUpperCase().charCodeAt(0) - 65;
        else if (/^[1-4]$/.test(ansRaw)) answer = +ansRaw - 1;
        else { const idx = options.findIndex(o => o.toLowerCase() === ansRaw.toLowerCase()); answer = idx >= 0 ? idx : 0; }
        items.push({ mod, type, q, options, answer });
      } else {
        const answer = /^t|true|yes|1$/i.test(String(r[7] || r[3] || '').trim());
        items.push({ mod, type, q, answer });
      }
    });
    return { items, skipped };
  };
  const onFile = (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return; const ext = (f.name.split('.').pop() || '').toLowerCase();
    const handle = (rows) => { const { items, skipped } = rowsToQuestions(rows);
      if (!items.length) { alert('No valid questions found. Check the template format.'); return; }
      actions && actions.bulkAddQuestions(items);
      alert(items.length + ' question(s) added to the bank' + (skipped ? ' · ' + skipped + ' row(s) skipped (missing question/options).' : '.')); };
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

  return (
    <div className="lms-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <LmsPageHead title="Question Bank" sub={`${QALL.length} questions · ${window.LMS_MODULES.length} modules · MCQ & True/False`} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={onFile} style={{ display: 'none' }} />
          <button className="lms-btn lms-btn-ghost" onClick={downloadTemplate}>↓ Template</button>
          <button className="lms-btn lms-btn-ghost" onClick={() => fileRef.current && fileRef.current.click()}>⬆ Bulk upload</button>
          <button className="lms-btn lms-btn-ghost" onClick={() => setShowCfg(s => !s)}>⚙ Test config</button>
          <button className="lms-btn lms-btn-pri" onClick={() => setEditing(blank())}>+ Add Question</button>
        </div>
      </div>

      {showCfg && (
        <div className="lms-card lms-card-pad" style={{ marginBottom: 16, borderColor: 'var(--lms-green)' }}>
          <strong style={{ display: 'block', marginBottom: 12 }}>Assessment settings</strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
            <div className="lms-field"><label>Questions per test</label><input style={fieldStyle} type="number" min="1" max={QALL.length} value={cfg.count} onChange={e => actions && actions.saveTestConfig({ count: Math.max(1, +e.target.value || 1) })} /></div>
            <div className="lms-field"><label>Pass mark (%)</label><input style={fieldStyle} type="number" min="1" max="100" value={cfg.passPct} onChange={e => actions && actions.saveTestConfig({ passPct: Math.min(100, Math.max(1, +e.target.value || 1)) })} /></div>
            <div className="lms-field"><label>Time limit (min)</label><input style={fieldStyle} type="number" min="1" value={cfg.durationMin} onChange={e => actions && actions.saveTestConfig({ durationMin: Math.max(1, +e.target.value || 1) })} /></div>
            <div className="lms-field"><label>Randomize order</label>
              <button className={'lms-toggle' + (cfg.randomize ? ' on' : '')} style={{ marginTop: 4 }} onClick={() => actions && actions.saveTestConfig({ randomize: !cfg.randomize })}><span className="knob" /></button>
            </div>
          </div>
          <div className="lms-muted" style={{ fontSize: 12, marginTop: 10 }}>The candidate's test draws <b>{cfg.count}</b> question{cfg.count === 1 ? '' : 's'} {cfg.randomize ? 'at random' : 'in order'} from this bank · pass ≥ <b>{cfg.passPct}%</b> · <b>{cfg.durationMin} min</b> limit.</div>
        </div>
      )}

      {editing && (
        <div className="lms-card lms-card-pad" style={{ marginBottom: 16, borderColor: 'var(--lms-green)' }}>
          <strong style={{ display: 'block', marginBottom: 12 }}>{editing.id ? 'Edit question ' + editing.id : 'New question'}</strong>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="lms-field"><label>Module</label><select style={fieldStyle} value={editing.mod} onChange={e => setEditing({ ...editing, mod: e.target.value })}>{window.LMS_MODULES.map(m => <option key={m.id} value={m.id}>{m.code}: {m.title}</option>)}</select></div>
            <div className="lms-field"><label>Type</label><select style={fieldStyle} value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value, answer: 0 })}><option>MCQ</option><option>True-False</option></select></div>
          </div>
          <div className="lms-field" style={{ marginBottom: 12 }}><label>Question</label><input style={fieldStyle} value={editing.q} autoFocus onChange={e => setEditing({ ...editing, q: e.target.value })} /></div>
          {editing.type === 'MCQ' ? (
            <div style={{ display: 'grid', gap: 8 }}>
              {editing.options.map((o, oi) => (
                <label key={oi} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="radio" name="ans" checked={editing.answer === oi} onChange={() => setEditing({ ...editing, answer: oi })} />
                  <input style={fieldStyle} placeholder={'Option ' + (oi + 1)} value={o} onChange={e => { const opts = editing.options.slice(); opts[oi] = e.target.value; setEditing({ ...editing, options: opts }); }} />
                </label>
              ))}
              <span className="lms-muted" style={{ fontSize: 12 }}>● Select the radio next to the correct answer.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              {['True', 'False'].map((o, oi) => (
                <button key={o} className={'lms-btn lms-btn-sm ' + ((editing.answer === true && oi === 0) || (editing.answer === false && oi === 1) ? 'lms-btn-pri' : 'lms-btn-ghost')} onClick={() => setEditing({ ...editing, answer: oi === 0 })}>{o}</button>
              ))}
              <span className="lms-muted" style={{ fontSize: 12, alignSelf: 'center' }}>Pick the correct answer.</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="lms-btn lms-btn-pri lms-btn-sm" disabled={!editing.q.trim()} style={!editing.q.trim() ? { opacity: .5 } : {}} onClick={() => { actions && actions.saveQuestion(editing); setEditing(null); }}>Save</button>
            <button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '4px 0 18px' }}>
        <button className={'lms-btn lms-btn-sm ' + (mod === '' ? 'lms-btn-pri' : 'lms-btn-ghost')} onClick={() => { setMod(''); setLimit(10); }}>All Modules</button>
        {window.LMS_MODULES.map(m => (
          <button key={m.id} className={'lms-btn lms-btn-sm ' + (mod === m.id ? 'lms-btn-pri' : 'lms-btn-ghost')} onClick={() => { setMod(m.id); setLimit(10); }}>{m.code}: {m.title}</button>
        ))}
      </div>
      {shown.map(q => (
        <div key={q.id} className="lms-card lms-card-pad" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <strong style={{ fontSize: 14, color: 'var(--lms-meta)', flex: '0 0 auto', width: 34 }}>{q.id}</strong>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <span className="lms-tag lms-tag-mod">{modName(q.mod)}</span>
                <span className={'lms-tag ' + (q.type === 'MCQ' ? 'lms-tag-mcq' : 'lms-tag-tf')}>{q.type}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.4 }}>{q.q}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flex: '0 0 auto' }}>
              <button className="lms-btn lms-btn-ghost lms-btn-sm" onClick={() => setEditing({ ...q, options: q.options ? q.options.slice() : ['', '', '', ''] })}>Edit</button>
              <button className="lms-btn lms-btn-danger lms-btn-sm" onClick={() => actions && actions.deleteQuestion(q.id)}>Delete</button>
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
function LmsCandidateDrawer({ cand, actions, onClose }) {
  if (!cand) return null;
  const w = window.lmsWindow(cand);
  const t = window.lmsTestWindow(cand);
  const ob = cand.onboarding || {};
  const [onboardOpen, setOnboardOpen] = aUseState(false);
  const [zoom, setZoom] = aUseState(null);
  const stars = (n) => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
  const timeline = [
    { label: 'Applied', val: cand.applied, done: true },
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
              <div><div className="lms-muted" style={{ fontSize: 11 }}>Stage</div><StagePill id={cand.stage} /></div>
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
  const total = C.length;
  const hired = C.filter(c => c.stage === 'hired').length;
  const rejected = C.filter(c => c.stage === 'rejected').length;
  const tested = C.filter(c => c.score != null);
  const passed = tested.filter(c => c.score >= window.LMS_PASS_PCT).length;
  const passRate = tested.length ? Math.round((passed / tested.length) * 100) : 0;
  const avgScore = tested.length ? Math.round(tested.reduce((s, c) => s + c.score, 0) / tested.length) : 0;
  // source ROI
  const bySrc = {}; C.forEach(c => { const k = c.source; bySrc[k] = bySrc[k] || { n: 0, hired: 0 }; bySrc[k].n++; if (c.stage === 'hired') bySrc[k].hired++; });
  // funnel
  const stages = ['applied', 'screening', 'training', 'recommended', 'hired'];
  const stageCount = {}; window.LMS_STAGES.forEach(s => stageCount[s.id] = 0);
  C.forEach(c => { stageCount[c.stage] = (stageCount[c.stage] || 0) + 1; });
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
      <div className="lms-muted" style={{ fontSize: 12.5, marginTop: 14 }}>Time-to-hire (avg, last 30d): <b>~6 days</b> from application to hire · {rejected} rejected.</div>
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
