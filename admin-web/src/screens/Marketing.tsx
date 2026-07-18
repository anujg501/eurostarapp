import { useEffect, useState } from 'react';
import { adminApi, fileToDataUrl, type Announcement } from '../lib/api';

// Two things the storefront shows: the pop-up customers see on entering the
// Sales app, and the banner reps see. Both had working endpoints already — the
// prototype simply wrote to localStorage and told the operator it had "pushed".
export function Marketing() {
  return (
    <div className="ad-body">
      <div className="ad-pagehead">
        <h2>Marketing</h2>
        <p className="ad-muted">The pop-up customers see, and the banner reps see.</p>
      </div>
      <Splash />
      <Broadcast />
    </div>
  );
}

function Splash() {
  const [image, setImage] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await adminApi.splash();
        setImage(s.image);
        setActive(s.active);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load the pop-up.');
      }
    })();
  }, []);

  const save = async (next: { image?: string | null; active?: boolean }) => {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      await adminApi.saveSplash(next);
      if (next.image !== undefined) setImage(next.image);
      if (next.active !== undefined) setActive(next.active);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    try {
      await save({ image: await fileToDataUrl(file) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that image.');
    }
  };

  return (
    <section className="ad-card ad-card-pad">
      <h2 className="ad-sechead-h">Pop-up window</h2>
      <p className="ad-muted">Shown once to customers when they enter the Sales App.</p>

      {error && <div className="ad-error">{error}</div>}

      {image && <img className="ad-preview" src={image} alt="Pop-up" />}

      <div className="ad-row">
        <label className="ad-btn ad-btn-ghost ad-btn-sm">
          {image ? 'Change image' : '＋ Upload image'}
          <input type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        {image && (
          <button className="ad-btn ad-btn-ghost ad-btn-sm ad-danger" disabled={busy} onClick={() => save({ image: null })}>
            Remove
          </button>
        )}
        <button className={`ad-btn ad-btn-sm ${active ? 'ad-btn-pri' : 'ad-btn-ghost'}`} disabled={busy} onClick={() => save({ active: !active })}>
          {active ? 'ON — customers see it' : 'OFF'}
        </button>
        {saved && <span className="ad-hint">Saved ✓</span>}
      </div>
    </section>
  );
}

function Broadcast() {
  const [a, setA] = useState<Announcement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setA(await adminApi.announcement());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load the broadcast.');
      }
    })();
  }, []);

  const set = <K extends keyof Announcement>(k: K, v: Announcement[K]) =>
    setA((x) => ({ ...(x ?? { active: false, image: null, title: null, message: null, badge: null }), [k]: v }));

  const save = async (patch?: Partial<Announcement>) => {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const body = { ...(a ?? {}), ...(patch ?? {}) };
      const next = await adminApi.saveAnnouncement(body);
      setA(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    try {
      await save({ image: await fileToDataUrl(file) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that image.');
    }
  };

  if (!a && !error) return <section className="ad-card ad-card-pad ad-muted">Loading broadcast…</section>;

  return (
    <section className="ad-card ad-card-pad">
      <h2 className="ad-sechead-h">Rep broadcast</h2>
      <p className="ad-muted">A banner every sales rep sees once a day.</p>

      {error && <div className="ad-error">{error}</div>}

      {a?.image && <img className="ad-preview" src={a.image} alt="Broadcast" />}

      <label className="ad-label">
        Title
        <input className="ad-input" value={a?.title ?? ''} onChange={(e) => set('title', e.target.value)} placeholder="e.g. New arrivals this week" />
      </label>
      <label className="ad-label">
        Message
        <textarea className="ad-input" rows={2} value={a?.message ?? ''} onChange={(e) => set('message', e.target.value)} placeholder="What reps should know" />
      </label>
      <label className="ad-label">
        Badge
        <input className="ad-input" value={a?.badge ?? ''} onChange={(e) => set('badge', e.target.value)} placeholder="e.g. NEW" />
      </label>

      <div className="ad-row">
        <label className="ad-btn ad-btn-ghost ad-btn-sm">
          {a?.image ? 'Change image' : '＋ Upload image'}
          <input type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        {a?.image && (
          <button className="ad-btn ad-btn-ghost ad-btn-sm ad-danger" disabled={busy} onClick={() => save({ image: null })}>
            Remove image
          </button>
        )}
        <button className={`ad-btn ad-btn-sm ${a?.active ? 'ad-btn-pri' : 'ad-btn-ghost'}`} disabled={busy} onClick={() => save({ active: !a?.active })}>
          {a?.active ? 'ON — reps see it' : 'OFF'}
        </button>
      </div>

      <div className="ad-actions">
        {saved && <span className="ad-hint" style={{ alignSelf: 'center' }}>Saved ✓</span>}
        <button className="ad-btn ad-btn-pri" disabled={busy} onClick={() => save()}>
          {busy ? 'Saving…' : 'Save & push message'}
        </button>
      </div>
    </section>
  );
}
