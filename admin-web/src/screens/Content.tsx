import { useEffect, useState } from 'react';
import { adminApi, type SiteContent } from '../lib/api';

// Hero copy, footer and testimonials. In the prototype "Save hero", "Save
// footer" and "Manage testimonials" had no click handlers at all.
export function Content() {
  const [c, setC] = useState<SiteContent | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [managing, setManaging] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setC(await adminApi.content());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load content.');
      }
    })();
  }, []);

  const set = <K extends keyof SiteContent>(k: K, v: SiteContent[K]) => setC((x) => ({ ...(x ?? {}), [k]: v }));

  const testimonials = c?.testimonials ?? [];

  const addTestimonial = () =>
    set('testimonials', [...testimonials, { id: `t${Date.now()}`, name: '', text: '', city: '' }]);

  const editTestimonial = (id: string, patch: Partial<{ name: string; text: string; city: string }>) =>
    set(
      'testimonials',
      testimonials.map((t) => (t.id === id ? { ...t, ...patch } : t))
    );

  const removeTestimonial = (id: string) =>
    set('testimonials', testimonials.filter((t) => t.id !== id));

  const save = async () => {
    if (!c) return;
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      await adminApi.saveContent({
        ...c,
        testimonials: testimonials.filter((t) => t.name.trim() || t.text.trim()),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  if (!c && !error) return <div className="ad-body ad-muted">Loading content…</div>;

  // "6 testimonials live (A, B, C, + 3 independents)." — built from real data.
  const liveNames = testimonials.filter((t) => t.name.trim());
  const summary =
    liveNames.length === 0
      ? 'No testimonials yet.'
      : `${liveNames.length} testimonial${liveNames.length === 1 ? '' : 's'} live (${liveNames
          .slice(0, 3)
          .map((t) => t.name)
          .join(', ')}${liveNames.length > 3 ? `, + ${liveNames.length - 3} more` : ''}).`;

  return (
    <div className="ad-body">
      <div className="ad-pagehead">
        <h2>Content</h2>
        <p className="ad-muted">Home hero, testimonials, franchise page &amp; footer</p>
      </div>

      {error && <div className="ad-error">{error}</div>}

      <div style={{ display: 'grid', gap: 16 }}>
        <section className="ad-card ad-card-pad">
          <h3 className="ad-sechead-h" style={{ margin: '0 0 12px' }}>Home hero</h3>
          <div className="ad-grid2">
            <label>
              <span className="ad-label">Headline</span>
              <input
                className="ad-input"
                style={{ width: '100%' }}
                value={c?.heroTitle ?? ''}
                onChange={(e) => set('heroTitle', e.target.value)}
                placeholder="Makes true beauty, by the lot."
              />
            </label>
            <label>
              <span className="ad-label">Sub-text</span>
              <input
                className="ad-input"
                style={{ width: '100%' }}
                value={c?.heroSub ?? ''}
                onChange={(e) => set('heroSub', e.target.value)}
                placeholder="Moissanite, lab-grown gems, cubic zirconia & more."
              />
            </label>
          </div>
          <div className="ad-row" style={{ marginTop: 14 }}>
            <button className="ad-btn ad-btn-acc" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Save hero'}
            </button>
            {saved && <span className="ad-hint">Saved ✓</span>}
          </div>
        </section>

        <section className="ad-card ad-card-pad">
          <h3 className="ad-sechead-h" style={{ margin: '0 0 6px' }}>Testimonials</h3>
          <p className="ad-muted" style={{ margin: '0 0 12px' }}>{summary}</p>
          <button className="ad-btn ad-btn-ghost" onClick={() => setManaging((m) => !m)}>
            {managing ? 'Close testimonials' : 'Manage testimonials'}
          </button>

          {managing && (
            <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
              {testimonials.length === 0 && <span className="ad-hint">None yet — add the first one.</span>}
              {testimonials.map((t) => (
                <div className="ad-row" key={t.id}>
                  <input className="ad-input" value={t.name} onChange={(e) => editTestimonial(t.id, { name: e.target.value })} placeholder="Customer name" />
                  <input className="ad-input" value={t.city ?? ''} onChange={(e) => editTestimonial(t.id, { city: e.target.value })} placeholder="City" />
                  <input className="ad-input" style={{ flex: 1, minWidth: 220 }} value={t.text} onChange={(e) => editTestimonial(t.id, { text: e.target.value })} placeholder="What they said" />
                  <button className="ad-btn ad-btn-ghost ad-btn-sm ad-danger" onClick={() => removeTestimonial(t.id)}>
                    Remove
                  </button>
                </div>
              ))}
              <div className="ad-row">
                <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={addTestimonial}>
                  ＋ Add testimonial
                </button>
                <button className="ad-btn ad-btn-acc ad-btn-sm" onClick={save} disabled={busy}>
                  {busy ? 'Saving…' : 'Save testimonials'}
                </button>
                {saved && <span className="ad-hint">Saved ✓</span>}
              </div>
            </div>
          )}
        </section>

        <section className="ad-card ad-card-pad">
          <h3 className="ad-sechead-h" style={{ margin: '0 0 12px' }}>Footer</h3>
          <div className="ad-field-v">
            <label className="ad-label" htmlFor="ct-footer">Footer line</label>
            <input
              id="ct-footer"
              className="ad-input"
              value={c?.footerNote ?? ''}
              onChange={(e) => set('footerNote', e.target.value)}
              placeholder="Eurostar Technologies Inc. · Estd 1980 · Mumbai, Jaipur"
            />
          </div>
          <div className="ad-field-v">
            <label className="ad-label" htmlFor="ct-hours">Business hours</label>
            <input
              id="ct-hours"
              className="ad-input"
              style={{ maxWidth: 280, width: '100%' }}
              value={c?.businessHours ?? ''}
              onChange={(e) => set('businessHours', e.target.value)}
              placeholder="Mon–Sat 10:00–20:00 IST"
            />
          </div>
          <div className="ad-row" style={{ marginTop: 4 }}>
            <button className="ad-btn ad-btn-acc" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Save footer'}
            </button>
            {saved && <span className="ad-hint">Saved ✓</span>}
          </div>
        </section>
      </div>
    </div>
  );
}
