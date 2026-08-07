import { useEffect, useMemo, useState } from 'react';
import { adminApi, uploadImage, type ProductImages } from '../lib/api';
import { POLKI_DESIGNS, polkiCanon, type PolkiDesign } from '../lib/polkiDesigns';

// Bulk upload of White-Polki DESIGN photos. Each of the 180 designs (B/C/X/Z/
// PCJ/GJ series) has its own photo slot on the storefront, keyed
// polki|<colorId>|uneven — but the normal Product-images grid can't reach them
// (polki designs are "sizes", not colours). This screen takes the files named
// by design number (GJ1.jpg, B4-RIGHT.jpg, …), matches each to its design, and
// uploads it to the right slot in one go.
type Match = { file: File; url: string; design: PolkiDesign | null };

const keyOf = (colorId: string) => `polki|${colorId}|uneven`;
const SERIES = ['B', 'C', 'X', 'Z', 'PCJ', 'GJ'];

export function PolkiPhotos() {
  const [images, setImages] = useState<ProductImages>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState('');

  const byCanon = useMemo(() => {
    const m = new Map<string, PolkiDesign>();
    for (const d of POLKI_DESIGNS) m.set(d.canon, d);
    return m;
  }, []);

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
    // Revoke object URLs on unmount to avoid leaks.
    return () => matches.forEach((m) => URL.revokeObjectURL(m.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPick = (files: FileList | null) => {
    if (!files) return;
    matches.forEach((m) => URL.revokeObjectURL(m.url));
    setDone('');
    setError('');
    const next: Match[] = Array.from(files)
      .filter((f) => /^image\//.test(f.type) || /\.(png|jpe?g|webp)$/i.test(f.name))
      .map((f) => ({ file: f, url: URL.createObjectURL(f), design: byCanon.get(polkiCanon(f.name)) ?? null }));
    // Matched first, then by series + name; unmatched last.
    next.sort((a, b) => {
      if (!!a.design !== !!b.design) return a.design ? -1 : 1;
      if (a.design && b.design)
        return SERIES.indexOf(a.design.series) - SERIES.indexOf(b.design.series) || a.design.name.localeCompare(b.design.name);
      return a.file.name.localeCompare(b.file.name);
    });
    setMatches(next);
  };

  const matched = matches.filter((m) => m.design);
  const unmatched = matches.filter((m) => !m.design);
  const perSeries = SERIES.map((s) => ({
    s,
    picked: matched.filter((m) => m.design!.series === s).length,
    total: POLKI_DESIGNS.filter((d) => d.series === s).length,
  }));

  const uploadAll = async () => {
    if (!matched.length || busy) return;
    if (!confirm(`Upload ${matched.length} polki design photo(s) to the website now? Existing photos for the same designs are replaced.`)) return;
    setBusy(true);
    setError('');
    setProgress(0);
    try {
      const map: ProductImages = { ...images };
      let n = 0;
      for (const m of matched) {
        const url = await uploadImage(m.file, 'product-images');
        map[keyOf(m.design!.colorId)] = url;
        n += 1;
        setProgress(n);
      }
      await adminApi.saveProductImages(map);
      setImages(map);
      matches.forEach((mm) => URL.revokeObjectURL(mm.url));
      setMatches([]);
      setDone(`✓ Uploaded ${n} photo(s) — live on the website now.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed — some photos may not have saved. Try again.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="ad-body"><section className="ad-card ad-card-pad ad-muted">Loading…</section></div>;

  return (
    <div className="ad-body">
      <div className="ad-pagehead">
        <h2>Polki design photos</h2>
        <p className="ad-muted">
          Upload a photo for each White-Polki design. Name each file by its design number (e.g. <code>GJ1.jpg</code>,{' '}
          <code>B4-RIGHT.jpg</code>, <code>C2.png</code>) — we match it to the right design automatically. There are{' '}
          {POLKI_DESIGNS.length} designs across {SERIES.join(' / ')}.
        </p>
      </div>

      {error && <div className="ad-error">{error}</div>}
      {done && <div className="ad-ok" style={{ marginBottom: 12 }}>{done}</div>}

      <section className="ad-card ad-card-pad" style={{ marginBottom: 16 }}>
        <label className="ad-btn ad-btn-pri" style={{ display: 'inline-flex' }}>
          ＋ Choose design photos…
          <input type="file" accept="image/*" multiple hidden onChange={(e) => onPick(e.target.files)} />
        </label>
        <span className="ad-muted" style={{ marginLeft: 12, fontSize: 13 }}>
          You can pick a whole folder of files at once (unzip a series ZIP first, then select all).
        </span>

        {matches.length > 0 && (
          <>
            <div className="ad-row" style={{ gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
              <strong>{matched.length}</strong> <span className="ad-muted">matched</span>
              {unmatched.length > 0 && (
                <span className="ad-danger"><strong>{unmatched.length}</strong> not recognised</span>
              )}
              <span className="ad-muted" style={{ marginLeft: 8 }}>
                {perSeries.filter((p) => p.picked).map((p) => `${p.s} ${p.picked}/${p.total}`).join(' · ')}
              </span>
            </div>

            <div className="ad-row" style={{ marginTop: 14 }}>
              <button className="ad-btn ad-btn-pri" disabled={busy || matched.length === 0} onClick={() => void uploadAll()}>
                {busy ? `Uploading… ${progress}/${matched.length}` : `Upload ${matched.length} photo(s)`}
              </button>
              <button className="ad-btn ad-btn-ghost" disabled={busy} onClick={() => { matches.forEach((m) => URL.revokeObjectURL(m.url)); setMatches([]); }}>
                Clear
              </button>
            </div>

            {unmatched.length > 0 && (
              <p className="ad-hint" style={{ marginTop: 12 }}>
                Not recognised (skipped): {unmatched.map((m) => m.file.name).join(', ')}. Rename these to the exact design
                number and pick again.
              </p>
            )}
          </>
        )}
      </section>

      {matches.length > 0 && (
        <section className="ad-card">
          <div className="cd-scroll">
            <table className="ad-table cd-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Photo</th>
                  <th>File</th>
                  <th>Matched design</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m, i) => {
                  const already = m.design ? !!images[keyOf(m.design.colorId)] : false;
                  return (
                    <tr key={i} style={m.design ? undefined : { background: 'rgba(180,60,60,.06)' }}>
                      <td><img src={m.url} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }} /></td>
                      <td className="ad-muted">{m.file.name}</td>
                      <td>{m.design ? <strong>{m.design.name}</strong> : <span className="ad-danger">— no match —</span>}</td>
                      <td className="ad-muted">
                        {!m.design ? 'skipped' : already ? 'replaces existing' : 'new'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
