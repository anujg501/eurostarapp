import { useEffect, useRef, useState } from 'react';
import { adminApi, uploadImage, type ProductImages } from '../lib/api';

// Per-letter photos for the Alphabet shape. Each letter has its own tile on the
// storefront, keyed  <category> | white | alphabet-<L>  (neither Moissanite nor
// White Fancy is grade-scoped, so the grade is not part of the key). The normal
// Product-images grid can't reach these (the letters are "sizes", not shapes),
// so this screen gives each letter its own slot — plus a one-pick bulk upload
// that drops a whole folder of A–Z photos into the right letters at once.

type AlphaCat = { id: string; label: string; colour: string; letters: string[] };

const CATS: AlphaCat[] = [
  {
    id: 'whitefancy',
    label: 'White Fancy · Au Desus · Alphabet',
    colour: 'white',
    letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), // full A–Z
  },
  {
    id: 'moissanite',
    label: 'Moissanite · DEF White · Alphabet',
    colour: 'white',
    // keep in sync with MOISS_ALPHABET in docs/app/data.jsx
    letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'I', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'U', 'V', 'Y'],
  },
];

const keyOf = (catId: string, colour: string, letter: string) => `${catId}|${colour}|alphabet-${letter}`;

// Guess the letter a filename belongs to: an ISOLATED single A–Z character
// (bounded by non-letters or the ends). "A.jpg", "letter-B.png", "01_C.jpg" and
// "white-d.jpeg" all resolve; "white.jpg" (no lone letter) does not.
function letterFromName(name: string): string | null {
  const base = name.replace(/\.[^.]+$/, '');
  const m = base.match(/(?:^|[^a-z])([a-z])(?:[^a-z]|$)/i);
  return m ? m[1].toUpperCase() : null;
}

export function AlphabetPhotos() {
  const [catId, setCatId] = useState<string>(CATS[0].id);
  const [images, setImages] = useState<ProductImages>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busyLetter, setBusyLetter] = useState<string | null>(null);
  const [bulkMsg, setBulkMsg] = useState('');
  const bulkInput = useRef<HTMLInputElement>(null);

  const cat = CATS.find((c) => c.id === catId) ?? CATS[0];
  const bulkBusy = bulkMsg !== '';

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
    if (!file || busyLetter || bulkBusy) return;
    setBusyLetter(letter);
    setError('');
    setDone('');
    try {
      const url = await uploadImage(file, 'product-images');
      const map: ProductImages = { ...images, [keyOf(cat.id, cat.colour, letter)]: url };
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
    if (busyLetter || bulkBusy) return;
    if (!confirm(`Remove the photo for letter ${letter}? The letter tile will show the plain letter until you upload a new one.`)) return;
    setBusyLetter(letter);
    setError('');
    setDone('');
    try {
      const map: ProductImages = { ...images };
      delete map[keyOf(cat.id, cat.colour, letter)];
      await adminApi.saveProductImages(map);
      setImages(map);
      setDone(`✓ Letter ${letter} photo removed.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : `Could not remove the ${letter} photo — try again.`);
    } finally {
      setBusyLetter(null);
    }
  };

  // Pick a whole set at once: each file is matched to its letter by filename,
  // uploaded, and the merged map is saved in one go.
  const onBulk = async (files: FileList | null) => {
    const list = Array.from(files ?? []);
    if (bulkInput.current) bulkInput.current.value = '';
    if (!list.length || busyLetter || bulkBusy) return;
    setError('');
    setDone('');

    const allowed = new Set(cat.letters);
    const matched: Record<string, File> = {};
    const unmatched: string[] = [];
    for (const f of list) {
      const L = letterFromName(f.name);
      if (L && allowed.has(L)) matched[L] = f; // last file for a letter wins
      else unmatched.push(f.name);
    }
    const letters = Object.keys(matched).sort();
    if (!letters.length) {
      setError('Couldn’t tell which letter any of those photos belong to. Rename them like A.jpg, B.jpg … Z.jpg, or use the Upload button on each letter below.');
      return;
    }

    setBulkMsg(`Uploading 0 of ${letters.length}…`);
    try {
      const map: ProductImages = { ...images };
      let n = 0;
      for (const L of letters) {
        n += 1;
        setBulkMsg(`Uploading ${n} of ${letters.length} — letter ${L}…`);
        map[keyOf(cat.id, cat.colour, L)] = await uploadImage(matched[L], 'product-images');
      }
      await adminApi.saveProductImages(map);
      setImages(map);
      setDone(
        `✓ ${letters.length} letter photo${letters.length > 1 ? 's' : ''} uploaded and live.` +
          (unmatched.length ? ` Couldn’t match ${unmatched.length} file${unmatched.length > 1 ? 's' : ''} (${unmatched.join(', ')}) — add those with the per-letter Upload buttons.` : '')
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Some photos could not be uploaded — try again.');
    } finally {
      setBulkMsg('');
    }
  };

  if (loading) return <div className="ad-body"><section className="ad-card ad-card-pad ad-muted">Loading…</section></div>;

  const have = cat.letters.filter((l) => images[keyOf(cat.id, cat.colour, l)]).length;

  return (
    <div className="ad-body">
      <div className="ad-pagehead">
        <h2>Alphabet letter photos</h2>
        <p className="ad-muted">
          Upload the picture for each letter — it appears on that letter's tile in the shop straight away, and customers
          can tap it to see it full-screen. Pick a whole A–Z folder at once below, or set letters one at a time.
        </p>
      </div>

      {error && <div className="ad-error" style={{ marginBottom: 12 }}>{error}</div>}
      {done && <div className="ad-ok" style={{ marginBottom: 12 }}>{done}</div>}

      <section className="ad-card ad-card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <label className="ad-label" style={{ display: 'block', marginBottom: 6 }}>Which alphabet</label>
            <select
              className="ad-input"
              value={catId}
              disabled={bulkBusy || busyLetter !== null}
              onChange={(e) => { setCatId(e.target.value); setError(''); setDone(''); }}
              style={{ minWidth: 280 }}
            >
              {CATS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <div className="ad-muted" style={{ fontSize: 12.5, marginTop: 6 }}>
              {have} of {cat.letters.length} letters have a photo.
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <label
              className="ad-btn ad-btn-pri"
              style={{ display: 'inline-flex', cursor: bulkBusy ? 'default' : 'pointer', opacity: bulkBusy ? 0.6 : 1 }}
            >
              {bulkBusy ? 'Uploading…' : '⬆ Upload all letters at once'}
              <input
                ref={bulkInput}
                type="file"
                accept="image/*"
                multiple
                hidden
                disabled={bulkBusy || busyLetter !== null}
                onChange={(e) => void onBulk(e.target.files)}
              />
            </label>
            <div className="ad-muted" style={{ fontSize: 12.5, marginTop: 6, maxWidth: 320 }}>
              {bulkBusy ? bulkMsg : 'Select every photo together. Name them A.jpg, B.jpg … so each lands on its letter automatically.'}
            </div>
          </div>
        </div>
      </section>

      <section className="ad-card ad-card-pad">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
          {cat.letters.map((letter) => {
            const img = images[keyOf(cat.id, cat.colour, letter)];
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
                    <label className="ad-btn ad-btn-ghost" style={{ display: 'inline-flex', cursor: busy || bulkBusy ? 'default' : 'pointer', fontSize: 12, padding: '4px 8px' }}>
                      {img ? 'Replace' : 'Upload'}
                      <input type="file" accept="image/*" hidden disabled={busy || bulkBusy} onChange={(e) => void onPick(letter, e.target.files?.[0] ?? null)} />
                    </label>
                    {img && (
                      <button className="ad-btn ad-btn-ghost" style={{ fontSize: 12, padding: '4px 8px' }} disabled={busy || bulkBusy} onClick={() => void onRemove(letter)} title="Remove photo">×</button>
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
