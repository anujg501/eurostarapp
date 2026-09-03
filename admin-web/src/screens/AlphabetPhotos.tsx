import { useEffect, useState } from 'react';
import { adminApi, uploadImage, type ProductImages } from '../lib/api';

// Per-letter photos for Moissanite DEF White · Alphabet. Each letter has its own
// slot on the storefront, keyed  moissanite | white | alphabet-<L>  (moissanite
// is not grade-scoped, so the grade is not part of the key). The normal Product-
// images grid can't reach these (the letters are "sizes", not shapes/colours),
// so this screen gives each letter its own upload slot. Pick the photo for a
// letter and it uploads and goes live immediately.

// The 20 letters offered — keep in sync with MOISS_ALPHABET in docs/app/data.jsx.
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'I', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'U', 'V', 'Y'];
const keyOf = (letter: string) => `moissanite|white|alphabet-${letter}`;

export function AlphabetPhotos() {
  const [images, setImages] = useState<ProductImages>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busyLetter, setBusyLetter] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setImages((await adminApi.productImages()) ?? {});
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load current photos.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onPick = async (letter: string, file: File | null) => {
    if (!file || busyLetter) return;
    setBusyLetter(letter);
    setError('');
    setDone('');
    try {
      const url = await uploadImage(file, 'product-images');
      const map: ProductImages = { ...images, [keyOf(letter)]: url };
      await adminApi.saveProductImages(map);
      setImages(map);
      setDone(`✓ Letter ${letter} photo saved — live on the website now.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : `Could not save the ${letter} photo — try again.`);
    } finally {
      setBusyLetter(null);
    }
  };

  const onRemove = async (letter: string) => {
    if (busyLetter) return;
    if (!confirm(`Remove the photo for letter ${letter}? The letter tile will show the plain letter until you upload a new one.`)) return;
    setBusyLetter(letter);
    setError('');
    setDone('');
    try {
      const map: ProductImages = { ...images };
      delete map[keyOf(letter)];
      await adminApi.saveProductImages(map);
      setImages(map);
      setDone(`✓ Letter ${letter} photo removed.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : `Could not remove the ${letter} photo — try again.`);
    } finally {
      setBusyLetter(null);
    }
  };

  if (loading) return <div className="ad-body"><section className="ad-card ad-card-pad ad-muted">Loading…</section></div>;

  const have = LETTERS.filter((l) => images[keyOf(l)]).length;

  return (
    <div className="ad-body">
      <div className="ad-pagehead">
        <h2>Alphabet letter photos</h2>
        <p className="ad-muted">
          Photos for <strong>Moissanite · DEF White · Alphabet</strong>. Upload the picture for each letter — it appears on
          that letter's tile in the shop straight away. {have} of {LETTERS.length} letters have a photo.
        </p>
      </div>

      {error && <div className="ad-error">{error}</div>}
      {done && <div className="ad-ok" style={{ marginBottom: 12 }}>{done}</div>}

      <section className="ad-card ad-card-pad">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
          {LETTERS.map((letter) => {
            const img = images[keyOf(letter)];
            const busy = busyLetter === letter;
            return (
              <div key={letter} style={{ border: '1px solid var(--ad-border, #E3DAC6)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                <div style={{ position: 'relative', height: 130, background: '#0d0d0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {img
                    ? <img src={img} alt={`Letter ${letter}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontFamily: 'Georgia, serif', fontSize: 54, color: 'rgba(245,231,196,0.9)' }}>{letter}</span>}
                  {busy && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                      Saving…
                    </div>
                  )}
                </div>
                <div style={{ padding: '9px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <strong style={{ fontFamily: 'Georgia, serif', fontSize: 18 }}>{letter}</strong>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <label className="ad-btn ad-btn-ghost" style={{ display: 'inline-flex', cursor: busy ? 'default' : 'pointer', fontSize: 12, padding: '4px 8px' }}>
                      {img ? 'Replace' : 'Upload'}
                      <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => void onPick(letter, e.target.files?.[0] ?? null)} />
                    </label>
                    {img && (
                      <button className="ad-btn ad-btn-ghost" style={{ fontSize: 12, padding: '4px 8px' }} disabled={busy} onClick={() => void onRemove(letter)} title="Remove photo">×</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
