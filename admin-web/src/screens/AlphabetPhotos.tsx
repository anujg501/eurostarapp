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

// Guess the letter a filename points at. Two cues, in order:
//  1) an ISOLATED single A–Z character ("A.jpg", "letter-B.png", "white-d.jpeg");
//  2) an ISOLATED number used as a position ("1.jpg" → 1st letter, "12.png" → 12th).
// Returns the letter within `letters`, or null when the name gives no cue.
function letterFromName(name: string, letters: string[]): string | null {
  const base = name.replace(/\.[^.]+$/, '');
  const alpha = base.match(/(?:^|[^a-z])([a-z])(?:[^a-z]|$)/i);
  if (alpha) {
    const L = alpha[1].toUpperCase();
    if (letters.includes(L)) return L;
  }
  const num = base.match(/(?:^|[^0-9])([0-9]{1,2})(?:[^0-9]|$)/);
  if (num) {
    const i = parseInt(num[1], 10) - 1;
    if (i >= 0 && i < letters.length) return letters[i];
  }
  return null;
}

// Natural sort so "img2" < "img10" and "2" < "10".
const byName = (a: File, b: File) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });

type Pending = { file: File; url: string; letter: string };

export function AlphabetPhotos() {
  const [catId, setCatId] = useState<string>(CATS[0].id);
  const [images, setImages] = useState<ProductImages>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busyLetter, setBusyLetter] = useState<string | null>(null);
  const [bulkMsg, setBulkMsg] = useState('');
  const [review, setReview] = useState<Pending[] | null>(null);
  const bulkInput = useRef<HTMLInputElement>(null);

  const cat = CATS.find((c) => c.id === catId) ?? CATS[0];
  const bulkBusy = bulkMsg !== '';
  const locked = bulkBusy || busyLetter !== null;

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

  // Free the object URLs a review panel created when it goes away / unmounts.
  useEffect(() => () => { (review ?? []).forEach((p) => URL.revokeObjectURL(p.url)); }, [review]);

  const onPick = async (letter: string, file: File | null) => {
    if (!file || locked) return;
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
    if (locked) return;
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

  // Pick a whole set at once. If every file names its letter, upload straight
  // away. Otherwise open a review panel that lays the photos out A→Z in order
  // so the operator can glance, fix any, and upload — no renaming needed.
  const onBulk = (files: FileList | null) => {
    const list = Array.from(files ?? []).sort(byName);
    if (bulkInput.current) bulkInput.current.value = '';
    if (!list.length || locked) return;
    setError('');
    setDone('');

    // First, honour any letters the filenames do give us.
    const named = new Map<File, string>();
    const taken = new Set<string>();
    for (const f of list) {
      const L = letterFromName(f.name, cat.letters);
      if (L && !taken.has(L)) { named.set(f, L); taken.add(L); }
    }

    // Every file matched a distinct letter → straight upload, no review.
    if (named.size === list.length) {
      void runUpload(list.map((f) => ({ file: f, letter: named.get(f)! })));
      return;
    }

    // Otherwise lay them out in order: named files keep their letter, the rest
    // fill the remaining letters top-to-bottom. Operator confirms/fixes.
    const free = cat.letters.filter((L) => !taken.has(L));
    let fi = 0;
    const pending: Pending[] = list.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
      letter: named.get(f) ?? (fi < free.length ? free[fi++] : ''),
    }));
    setReview(pending);
  };

  const closeReview = () => setReview(null); // effect revokes the object URLs

  // Shared uploader: takes {file, letter} rows, uploads each and saves once.
  const runUpload = async (rows: { file: File; letter: string }[]) => {
    const jobs = rows.filter((r) => r.letter);
    if (!jobs.length) { setError('No photos were assigned to a letter.'); return; }
    setBulkMsg(`Uploading 0 of ${jobs.length}…`);
    setError('');
    setDone('');
    try {
      const map: ProductImages = { ...images };
      let n = 0;
      for (const r of jobs) {
        n += 1;
        setBulkMsg(`Uploading ${n} of ${jobs.length} — letter ${r.letter}…`);
        map[keyOf(cat.id, cat.colour, r.letter)] = await uploadImage(r.file, 'product-images');
      }
      await adminApi.saveProductImages(map);
      setImages(map);
      setReview(null);
      setDone(`✓ ${jobs.length} letter photo${jobs.length > 1 ? 's' : ''} uploaded and live.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Some photos could not be uploaded — try again.');
    } finally {
      setBulkMsg('');
    }
  };

  const confirmReview = () => {
    if (!review) return;
    const chosen = review.filter((p) => p.letter);
    if (!chosen.length) { setError('Give at least one photo a letter, or press Cancel.'); return; }
    const dup = new Set<string>();
    for (const p of chosen) {
      if (dup.has(p.letter)) { setError(`Two photos are both set to letter ${p.letter}. Each letter can have only one photo — fix the duplicates first.`); return; }
      dup.add(p.letter);
    }
    void runUpload(chosen.map((p) => ({ file: p.file, letter: p.letter })));
  };

  if (loading) return <div className="ad-body"><section className="ad-card ad-card-pad ad-muted">Loading…</section></div>;

  const have = cat.letters.filter((l) => images[keyOf(cat.id, cat.colour, l)]).length;

  return (
    <div className="ad-body">
      <div className="ad-pagehead">
        <h2>Alphabet letter photos</h2>
        <p className="ad-muted">
          Upload the picture for each letter — it appears on that letter's tile in the shop straight away, and customers
          can tap it to see it full-screen. Pick all your photos at once below (any filenames are fine — you confirm the
          order), or set letters one at a time.
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
              disabled={locked || review !== null}
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
              style={{ display: 'inline-flex', cursor: locked || review ? 'default' : 'pointer', opacity: locked || review ? 0.6 : 1 }}
            >
              {bulkBusy ? 'Uploading…' : '⬆ Upload all letters at once'}
              <input
                ref={bulkInput}
                type="file"
                accept="image/*"
                multiple
                hidden
                disabled={locked || review !== null}
                onChange={(e) => onBulk(e.target.files)}
              />
            </label>
            <div className="ad-muted" style={{ fontSize: 12.5, marginTop: 6, maxWidth: 340 }}>
              {bulkBusy ? bulkMsg : 'Select every photo together — then line them up A→Z and confirm. No need to rename anything.'}
            </div>
          </div>
        </div>
      </section>

      {review && (
        <section className="ad-card ad-card-pad" style={{ marginBottom: 16, borderColor: 'var(--emerald, #0e3a2e)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <strong>Line up your photos A → Z</strong>
              <div className="ad-muted" style={{ fontSize: 12.5, marginTop: 3 }}>
                I've put them in the order you picked them. Change the letter under any photo that's out of place, then upload.
                Set a photo to “— skip —” to leave it out.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="ad-btn ad-btn-ghost" disabled={bulkBusy} onClick={closeReview}>Cancel</button>
              <button className="ad-btn ad-btn-pri" disabled={bulkBusy} onClick={confirmReview}>
                {bulkBusy ? bulkMsg : `Upload ${review.filter((p) => p.letter).length} letters`}
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
            {review.map((p, i) => (
              <div key={i} style={{ border: '1px solid var(--ad-border, #E3DAC6)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                <div style={{ height: 104, background: '#0d0d0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={p.url} alt={p.file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '7px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="ad-muted" style={{ fontSize: 11 }}>Letter</span>
                  <select
                    className="ad-input"
                    value={p.letter}
                    disabled={bulkBusy}
                    style={{ flex: 1, padding: '3px 6px', fontSize: 14 }}
                    onChange={(e) => setReview((prev) => prev && prev.map((q, j) => j === i ? { ...q, letter: e.target.value } : q))}
                  >
                    <option value="">— skip —</option>
                    {cat.letters.map((L) => <option key={L} value={L}>{L}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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
                    <label className="ad-btn ad-btn-ghost" style={{ display: 'inline-flex', cursor: locked ? 'default' : 'pointer', fontSize: 12, padding: '4px 8px' }}>
                      {img ? 'Replace' : 'Upload'}
                      <input type="file" accept="image/*" hidden disabled={locked} onChange={(e) => void onPick(letter, e.target.files?.[0] ?? null)} />
                    </label>
                    {img && (
                      <button className="ad-btn ad-btn-ghost" style={{ fontSize: 12, padding: '4px 8px' }} disabled={locked} onClick={() => void onRemove(letter)} title="Remove photo">×</button>
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
