import { useEffect, useMemo, useRef, useState } from 'react';
import { adminApi, uploadImage, type ProductImages } from '../lib/api';

// Photos for the Pre Drilled Zirconia Stones category. Each of the 39 stones has
// its own slot on the storefront, keyed  predrilled | white | pd-<imgNo>  (the
// category has a single grade and colour). Keep this list in sync with
// PREDRILLED_STONES in docs/app/data.jsx.
const STONES: { id: string; shape: string; size: string }[] = [
  { id: '01', shape: 'Heart', size: '8 × 7' },
  { id: '02', shape: 'Octagon', size: '8 × 8' },
  { id: '03', shape: 'Rhombus', size: '3 × 6' },
  { id: '04', shape: 'Rhombus', size: '7.5 × 3.5' },
  { id: '05', shape: 'Pentagon', size: '6 × 6' },
  { id: '06', shape: 'Long Octagon', size: '10 × 5' },
  { id: '07', shape: 'Hexagon', size: '6.0' },
  { id: '08', shape: 'Fan', size: '7.5 × 6' },
  { id: '09', shape: 'Clover', size: '6 × 6' },
  { id: '10', shape: 'Pentagon', size: '4.5 × 3' },
  { id: '11', shape: 'Baguette', size: '4 × 8' },
  { id: '12', shape: 'Long Hexagon', size: '7 × 3.5' },
  { id: '13', shape: 'Half Moon', size: '5.7 × 5.9' },
  { id: '14', shape: 'Flower', size: '5.0' },
  { id: '15', shape: 'Half Moon', size: '5.0' },
  { id: '16', shape: 'Pear', size: '4.5 × 8' },
  { id: '17', shape: 'Long Hexagon', size: '5 × 2.5' },
  { id: '18', shape: 'Marquise', size: '6 × 4' },
  { id: '19', shape: 'Kite', size: '4 × 6' },
  { id: '20', shape: 'Rhombus', size: '7.5 × 4' },
  { id: '21', shape: 'Rhombus', size: '3 × 6' },
  { id: '22', shape: 'Long Hexagon', size: '7 × 4' },
  { id: '23', shape: 'Heart', size: '5 × 4' },
  { id: '24', shape: 'Hexagon', size: '4.0' },
  { id: '25', shape: 'Pentagon', size: '5 × 5' },
  { id: '26', shape: 'Baguette', size: '5 × 2.5' },
  { id: '27', shape: 'Marquise', size: '8.5 × 3.5' },
  { id: '28', shape: 'Kite', size: '6.5 × 4' },
  { id: '29', shape: 'Baguette', size: '6 × 3' },
  { id: '30', shape: 'Marquise', size: '3 × 6' },
  { id: '31', shape: 'Marquise', size: '5 × 2.5' },
  { id: '32', shape: 'Long Hexagon', size: '7 × 3' },
  { id: '33', shape: 'Heart', size: '4 × 3.5' },
  { id: '34', shape: 'Half Moon', size: '3 × 6' },
  { id: '35', shape: 'Long Hexagon', size: '5 × 3' },
  { id: '36', shape: 'Pear', size: '4.5 × 3' },
  { id: '37', shape: 'Long Hexagon', size: '5 × 2' },
  { id: '38', shape: 'Kite', size: '5 × 4' },
  { id: '39', shape: 'Rhombus', size: '5 × 2.5' },
];
const keyOf = (id: string) => `predrilled|white|pd-${id}`;
// Two-digit imgNo (01..39) from a filename number, if it maps to a real stone.
const idFromName = (name: string): string | null => {
  const m = name.match(/\d{1,2}/);
  if (!m) return null;
  const n = parseInt(m[0], 10);
  if (n < 1 || n > STONES.length) return null;
  return String(n).padStart(2, '0');
};

export function PredrilledImages() {
  const [images, setImages] = useState<ProductImages>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkProg, setBulkProg] = useState(0);
  const bulkRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      try { setImages((await adminApi.productImages()) ?? {}); }
      catch (e) { setError(e instanceof Error ? e.message : 'Could not load current photos.'); }
      finally { setLoading(false); }
    })();
  }, []);

  const have = useMemo(() => STONES.filter((s) => images[keyOf(s.id)]).length, [images]);

  const onOne = async (id: string, file: File | null) => {
    if (!file || busyId || bulkBusy) return;
    setBusyId(id); setError(''); setDone('');
    try {
      const url = await uploadImage(file, 'product-images');
      const map: ProductImages = { ...images, [keyOf(id)]: url };
      await adminApi.saveProductImages(map);
      setImages(map);
      setDone(`✓ Stone #${id} photo saved — live on the website now.`);
    } catch (e) { setError(e instanceof Error ? e.message : `Could not save the #${id} photo — try again.`); }
    finally { setBusyId(null); }
  };

  const onRemove = async (id: string) => {
    if (busyId || bulkBusy) return;
    if (!confirm(`Remove the photo for stone #${id}? Its card will show the shape & size until you upload a new one.`)) return;
    setBusyId(id); setError(''); setDone('');
    try {
      const map: ProductImages = { ...images };
      delete map[keyOf(id)];
      await adminApi.saveProductImages(map);
      setImages(map);
      setDone(`✓ Stone #${id} photo removed.`);
    } catch (e) { setError(e instanceof Error ? e.message : `Could not remove the #${id} photo — try again.`); }
    finally { setBusyId(null); }
  };

  // Bulk: match each file to a stone by the number in its filename; unmatched
  // files fill the remaining empty slots in pick order.
  const onBulk = async (files: FileList | null) => {
    if (!files || bulkBusy || busyId) return;
    const list = Array.from(files).filter((f) => /^image\//.test(f.type) || /\.(png|jpe?g|webp)$/i.test(f.name));
    if (!list.length) return;
    setBulkBusy(true); setError(''); setDone(''); setBulkProg(0);
    try {
      const map: ProductImages = { ...images };
      const used = new Set<string>();
      const byName: { file: File; id: string | null }[] = list.map((f) => ({ file: f, id: idFromName(f.name) }));
      // First pass: filename-numbered files claim their slot.
      byName.forEach((x) => { if (x.id) used.add(x.id); });
      // Slots left empty, for unnumbered files to fill in order.
      const freeSlots = STONES.map((s) => s.id).filter((id) => !used.has(id) && !map[keyOf(id)]);
      let free = 0, n = 0, assigned = 0;
      for (const x of byName) {
        const id = x.id || freeSlots[free++];
        if (!id) { n += 1; setBulkProg(n); continue; } // no slot left
        const url = await uploadImage(x.file, 'product-images');
        map[keyOf(id)] = url;
        assigned += 1; n += 1; setBulkProg(n);
      }
      await adminApi.saveProductImages(map);
      setImages(map);
      setDone(`✓ ${assigned} of ${list.length} image(s) assigned — live on the website now.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Bulk upload failed — some photos may not have saved. Try again.'); }
    finally { setBulkBusy(false); if (bulkRef.current) bulkRef.current.value = ''; }
  };

  if (loading) return <div className="ad-body"><section className="ad-card ad-card-pad ad-muted">Loading…</section></div>;

  return (
    <div className="ad-body">
      <div className="ad-pagehead">
        <h2>Pre Drilled images</h2>
        <p className="ad-muted">
          Photos for the <strong>Pre Drilled Zirconia Stones</strong> category. Upload each stone's picture — it appears on
          that stone's card in the shop straight away. {have} of {STONES.length} stones have a photo.
        </p>
      </div>

      {error && <div className="ad-error">{error}</div>}
      {done && <div className="ad-ok" style={{ marginBottom: 12 }}>{done}</div>}

      <section className="ad-card ad-card-pad" style={{ marginBottom: 16 }}>
        <label className="ad-btn ad-btn-pri" style={{ display: 'inline-flex', cursor: bulkBusy ? 'default' : 'pointer' }}>
          {bulkBusy ? `Uploading… ${bulkProg}` : '＋ Bulk upload photos…'}
          <input ref={bulkRef} type="file" accept="image/*" multiple hidden disabled={bulkBusy} onChange={(e) => void onBulk(e.target.files)} />
        </label>
        <span className="ad-muted" style={{ marginLeft: 12, fontSize: 13 }}>
          Files whose name contains the stone number (e.g. <code>01 - Heart.jpeg</code>) go to that stone; any others fill the empty slots in order.
        </span>
      </section>

      <section className="ad-card ad-card-pad">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
          {STONES.map((s) => {
            const img = images[keyOf(s.id)];
            const busy = busyId === s.id;
            return (
              <div key={s.id} style={{ border: '1px solid var(--ad-border, #E3DAC6)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                <div style={{ position: 'relative', height: 130, background: '#0d0d0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {img
                    ? <img src={img} alt={`${s.shape} ${s.size}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: 'rgba(245,231,196,0.8)', textAlign: 'center', padding: '0 8px' }}>{s.shape}<br />{s.size} mm</span>}
                  {busy && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>Saving…</div>}
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
                    <strong style={{ fontSize: 13 }}>#{s.id} · {s.shape}</strong>
                  </div>
                  <div className="ad-muted" style={{ fontSize: 12, marginBottom: 6 }}>{s.size} mm</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <label className="ad-btn ad-btn-ghost" style={{ display: 'inline-flex', cursor: busy ? 'default' : 'pointer', fontSize: 12, padding: '4px 8px' }}>
                      {img ? 'Replace' : 'Upload'}
                      <input type="file" accept="image/*" hidden disabled={busy || bulkBusy} onChange={(e) => void onOne(s.id, e.target.files?.[0] ?? null)} />
                    </label>
                    {img && <button className="ad-btn ad-btn-ghost" style={{ fontSize: 12, padding: '4px 8px' }} disabled={busy || bulkBusy} onClick={() => void onRemove(s.id)} title="Remove photo">×</button>}
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
