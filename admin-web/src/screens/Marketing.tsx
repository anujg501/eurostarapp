import { useEffect, useState } from 'react';
import { adminApi, uploadImage, type Announcement } from '../lib/api';

// Two things the storefront shows: the pop-up customers see on entering the
// Sales app, and the banner reps see. Both had working endpoints already — the
// prototype simply wrote to localStorage and told the operator it had "pushed".
// `only` renders a single section as its own page — the original panel had
// "Pop-up window" and "Rep broadcast" as separate sidebar entries.
export function Marketing({ only }: { only?: 'splash' | 'broadcast' } = {}) {
  const head =
    only === 'splash'
      ? { h: 'Pop-up window', sub: 'Upload the splash image shown once after a customer signs in — new categories, offers & discounts' }
      : only === 'broadcast'
        ? { h: 'Rep broadcast', sub: 'Upload a single image shown once a day to every sales rep in their CRM — new products, push items & announcements' }
        : { h: 'Marketing', sub: 'The pop-up customers see, and the banner reps see.' };

  return (
    <div className="ad-body">
      <div className="ad-pagehead">
        <h2>{head.h}</h2>
        <p className="ad-muted">{head.sub}</p>
      </div>
      {only !== 'broadcast' && <Splash />}
      {only !== 'splash' && <Broadcast />}
    </div>
  );
}

function Splash() {
  const [image, setImage] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);

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
      await save({ image: await uploadImage(file, 'marketing') });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that image.');
    }
  };

  return (
    <section className="ad-card ad-card-pad" style={{ maxWidth: 560 }}>
      {error && <div className="ad-error">{error}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <button
          type="button"
          className={`ad-toggle ${active ? 'on' : ''}`}
          disabled={busy}
          aria-label="Pop-up on/off"
          onClick={() => save({ active: !active })}
        />
        <b style={{ fontSize: 14 }}>{active ? 'Pop-up is ON — shown to customers' : 'Pop-up is OFF'}</b>
        {saved && <span className="ad-hint">Saved ✓</span>}
      </div>

      {/* The dashed zone is the upload control — click it to pick (or replace)
          the image. Same pick/save path as before. */}
      <label className="sp-drop">
        {image ? (
          <img src={image} alt="Pop-up" />
        ) : (
          <>
            <span className="sp-arrow" aria-hidden="true">↑</span>
            <b>Upload pop-up image</b>
            <span className="ad-muted">Portrait (4:5) works best · PNG or JPG</span>
          </>
        )}
        <input type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
      </label>

      <p className="ad-muted" style={{ fontSize: 12.5, lineHeight: 1.6, margin: '12px 0 12px', maxWidth: 480 }}>
        Shown once per session, centred, and must be dismissed before the customer can browse. Recommended size 1080 ×
        1350 px.
      </p>

      <div className="ad-row">
        <button className="ad-btn ad-btn-pri ad-btn-sm" disabled={!image} onClick={() => setPreview(true)}>
          👁 Preview pop-up
        </button>
        {image && (
          <button className="ad-btn ad-btn-ghost ad-btn-sm ad-danger" disabled={busy} onClick={() => save({ image: null })}>
            Remove image
          </button>
        )}
      </div>

      {preview && image && (
        <div className="ad-modal-backdrop" onClick={() => setPreview(false)}>
          <img
            src={image}
            alt="Pop-up preview"
            style={{ maxWidth: 'min(92vw, 480px)', maxHeight: '82vh', borderRadius: 12, boxShadow: 'var(--shadow-lg)' }}
          />
        </div>
      )}
    </section>
  );
}

function Broadcast() {
  const [a, setA] = useState<Announcement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);

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
      await save({ image: await uploadImage(file, 'marketing') });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that image.');
    }
  };

  if (!a && !error) return <section className="ad-card ad-card-pad ad-muted">Loading broadcast…</section>;

  const hasContent = !!(a?.image || a?.title || a?.message || a?.badge);

  return (
    <>
      <section className="ad-card ad-card-pad" style={{ maxWidth: 560, marginBottom: 16 }}>
        {error && <div className="ad-error">{error}</div>}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <button
            type="button"
            className={`ad-toggle ${a?.active ? 'on' : ''}`}
            disabled={busy}
            aria-label="Broadcast on/off"
            onClick={() => save({ active: !a?.active })}
          />
          <b style={{ fontSize: 14 }}>{a?.active ? 'Broadcast is ON — reps see it' : 'Broadcast is OFF'}</b>
        </div>

        {/* The dashed zone is the upload control — click to pick or replace. */}
        <label className="sp-drop">
          {a?.image ? (
            <img src={a.image} alt="Broadcast" />
          ) : (
            <>
              <span className="sp-arrow" aria-hidden="true">↑</span>
              <b>Upload broadcast image</b>
              <span className="ad-muted">New product flyer, offer or notice · PNG or JPG</span>
            </>
          )}
          <input type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
        </label>

        <p className="ad-muted" style={{ fontSize: 12.5, lineHeight: 1.6, margin: '12px 0 12px', maxWidth: 500 }}>
          Each rep sees this <strong>once a day</strong> when they open their CRM — they can dismiss it and carry on.
          Use <strong>Save &amp; push message</strong> below after changing it to send it out. Last pushed: —.
        </p>

        <div className="ad-row">
          <button className="ad-btn ad-btn-pri ad-btn-sm" disabled={!hasContent} onClick={() => setPreview(true)}>
            👁 Preview what reps see
          </button>
          {a?.image && (
            <button className="ad-btn ad-btn-ghost ad-btn-sm ad-danger" disabled={busy} onClick={() => save({ image: null })}>
              Remove image
            </button>
          )}
        </div>
      </section>

      <section className="ad-card ad-card-pad" style={{ maxWidth: 560 }}>
        <h3 className="ad-sechead-h">Message to reps</h3>
        <p className="ad-muted" style={{ fontSize: 12.5, margin: '2px 0 14px', maxWidth: 500 }}>
          Shown as a styled card in the rep pop-up. Use this on its own, or together with an image above.
        </p>

        <div className="ad-field-v">
          <label className="ad-label" htmlFor="rb-headline">Headline</label>
          <input
            id="rb-headline"
            className="ad-input"
            value={a?.title ?? ''}
            onChange={(e) => set('title', e.target.value)}
            placeholder="New Laser Engraved products added"
          />
        </div>
        <div className="ad-field-v">
          <label className="ad-label" htmlFor="rb-message">Message</label>
          <textarea
            id="rb-message"
            className="ad-input"
            rows={3}
            value={a?.message ?? ''}
            onChange={(e) => set('message', e.target.value)}
            placeholder="Please offer these to your customers this month."
          />
        </div>
        <div className="ad-field-v">
          <label className="ad-label" htmlFor="rb-badge">Highlight badge (optional)</label>
          <input
            id="rb-badge"
            className="ad-input"
            value={a?.badge ?? ''}
            onChange={(e) => set('badge', e.target.value)}
            placeholder="Special extra 2% commission this month"
          />
        </div>

        <div className="ad-row" style={{ marginTop: 4 }}>
          <button className="ad-btn ad-btn-acc" disabled={busy} onClick={() => save()}>
            {busy ? 'Saving…' : 'Save & push message'}
          </button>
          {saved && <span className="ad-hint">Saved ✓</span>}
        </div>
      </section>

      {preview && (
        <div className="ad-modal-backdrop" onClick={() => setPreview(false)}>
          <div className="rb-preview" onClick={(e) => e.stopPropagation()}>
            {a?.image && <img src={a.image} alt="Broadcast" />}
            {(a?.title || a?.message || a?.badge) && (
              <div className="rb-card">
                {a?.badge && <span className="rb-badge">{a.badge}</span>}
                {a?.title && <h3>{a.title}</h3>}
                {a?.message && <p>{a.message}</p>}
              </div>
            )}
            <button className="ad-btn ad-btn-ghost ad-btn-sm" style={{ margin: '0 20px 16px' }} onClick={() => setPreview(false)}>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
}
