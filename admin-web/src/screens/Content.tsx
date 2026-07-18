import { useEffect, useState } from 'react';
import { adminApi, type SiteContent } from '../lib/api';

// Hero copy, footer and testimonials. In the prototype "Save hero", "Save
// footer" and "Manage testimonials" had no click handlers at all.
export function Content() {
  const [c, setC] = useState<SiteContent | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

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

  return (
    <div className="ad-body">
      <div className="ad-pagehead">
        <h2>Content</h2>
        <p className="ad-muted">Hero, footer and testimonials shown on the storefront.</p>
      </div>

      {error && <div className="ad-error">{error}</div>}

      <div className="ad-card ad-card-pad">
        <label className="ad-label">
          Hero title
          <input className="ad-input" value={c?.heroTitle ?? ''} onChange={(e) => set('heroTitle', e.target.value)} placeholder="Makes true beauty, by the lot." />
        </label>

        <label className="ad-label">
          Hero subtitle
          <textarea className="ad-input" rows={2} value={c?.heroSub ?? ''} onChange={(e) => set('heroSub', e.target.value)} placeholder="40 years sourcing moissanite…" />
        </label>

        <label className="ad-label">
          Footer note
          <input className="ad-input" value={c?.footerNote ?? ''} onChange={(e) => set('footerNote', e.target.value)} placeholder="Eurostar Technologies Inc. · Estd 1980" />
        </label>

        <div className="ad-label">
          Testimonials
          {testimonials.length === 0 && <span className="ad-hint">None yet.</span>}
          {testimonials.map((t) => (
            <div className="ad-row" key={t.id}>
              <input className="ad-input" value={t.name} onChange={(e) => editTestimonial(t.id, { name: e.target.value })} placeholder="Customer name" />
              <input className="ad-input" value={t.city ?? ''} onChange={(e) => editTestimonial(t.id, { city: e.target.value })} placeholder="City" />
              <input className="ad-input" value={t.text} onChange={(e) => editTestimonial(t.id, { text: e.target.value })} placeholder="What they said" />
              <button className="ad-btn ad-btn-ghost ad-btn-sm ad-danger" onClick={() => removeTestimonial(t.id)}>
                Remove
              </button>
            </div>
          ))}
          <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={addTestimonial}>
            ＋ Add testimonial
          </button>
        </div>

        <div className="ad-actions">
          <button className="ad-btn ad-btn-pri" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : saved ? 'Saved ✓' : 'Save content'}
          </button>
        </div>
      </div>
    </div>
  );
}
