import { useEffect, useState } from 'react';
import {
  adminApi,
  uploadImage,
  productImageKey,
  type Category,
  type Colour,
  type ProductImages,
} from '../lib/api';
import { useImageCropper } from './ImageCropper';

// Home thumbnails and product photos. The prototype's thumbnail cells were
// wired (via a synced localStorage key); its product-image "＋ Upload" buttons
// had no onClick and no file input at all.
// initialTab lets the sidebar's "Product images" and "Home thumbnails" entries
// land directly on the right tab, like the original panel's separate pages.
// Both sidebar entries are their own pages, like the original panel — no tab
// pills, page-level headings, the content below.
export function Media({ initialTab = 'thumbs' }: { initialTab?: 'thumbs' | 'products' } = {}) {
  if (initialTab === 'products') {
    return (
      <div className="ad-body">
        <div className="ad-pagehead">
          <h2>Product images</h2>
          <p className="ad-muted">Upload one photo per colour + shape — shows across all grades &amp; sizes</p>
        </div>
        <ProductPhotos standalone />
      </div>
    );
  }

  return (
    <div className="ad-body">
      <div className="ad-pagehead">
        <h2>Home thumbnails</h2>
        <p className="ad-muted">
          Set the images customers see on the Sales App home page — one photo per category and one per shape.
        </p>
      </div>
      <Thumbs />
    </div>
  );
}

/** One thumbnail card: square preview, name, helper line, upload controls. */
function ThumbCell({
  label,
  img,
  busy,
  onPick,
  onRemove,
}: {
  label: string;
  img?: string;
  busy: boolean;
  onPick: (file: File | undefined) => void;
  onRemove: () => void;
}) {
  return (
    <div className="ad-thumb-cell">
      <div className="ad-thumb-art">{img ? <img src={img} alt={label} /> : <span className="ad-thumb-empty" />}</div>
      <div className="ad-thumb-label">{label}</div>
      <div className="ad-thumb-hint">Square image works best</div>
      <div className="ad-row">
        <label className="ad-btn ad-btn-ghost ad-btn-sm">
          {img ? 'Change' : '＋ Upload'}
          <input type="file" accept="image/*" hidden onChange={(e) => onPick(e.target.files?.[0])} />
        </label>
        {img && (
          <button className="ad-btn ad-btn-ghost ad-btn-sm ad-danger" disabled={busy} onClick={onRemove}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

const titleCase = (s: string) => s.replace(/\b[a-z]/g, (c) => c.toUpperCase());

function Thumbs() {
  const [cats, setCats] = useState<Category[] | null>(null);
  const [map, setMap] = useState<Record<string, string>>({});
  const [shapeList, setShapeList] = useState<string[]>([]);
  const [shapeMap, setShapeMap] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState('');
  const { cropNode, requestCrop } = useImageCropper();

  useEffect(() => {
    (async () => {
      try {
        const [c, m, sh, sm] = await Promise.all([
          adminApi.categories(),
          adminApi.catThumbs(),
          adminApi.shapes(),
          adminApi.shapeThumbs(),
        ]);
        setCats(c);
        setMap(m ?? {});
        setShapeMap(sm ?? {});
        // The shape list is whatever the categories use, plus any shape that
        // already has a thumbnail — deduplicated, in a stable order.
        const all = [...Object.values(sh ?? {}).flat(), ...Object.keys(sm ?? {})];
        setShapeList([...new Set(all.map((s) => s.trim().toLowerCase()).filter(Boolean))]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load thumbnails.');
      }
    })();
  }, []);

  const saveCat = async (key: string, dataUrl: string | null) => {
    setBusyKey(key);
    setError('');
    try {
      const next = { ...map };
      if (dataUrl) next[key] = dataUrl;
      else delete next[key];
      await adminApi.saveCatThumbs(next);
      setMap(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save that image.');
    } finally {
      setBusyKey('');
    }
  };

  const saveShape = async (key: string, dataUrl: string | null) => {
    setBusyKey('shape:' + key);
    setError('');
    try {
      const next = { ...shapeMap };
      if (dataUrl) next[key] = dataUrl;
      else delete next[key];
      await adminApi.saveShapeThumbs(next);
      setShapeMap(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save that image.');
    } finally {
      setBusyKey('');
    }
  };

  const pick = async (file: File | undefined, save: (dataUrl: string) => Promise<void>) => {
    if (!file) return;
    const cropped = await requestCrop(file);
    if (!cropped) return; // operator cancelled the crop
    try {
      await save(await uploadImage(cropped, 'thumbs'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that image.');
    }
  };

  if (!cats) return <section className="ad-card ad-card-pad ad-muted">Loading…</section>;

  return (
    <>
      {cropNode}
      {error && <div className="ad-error">{error}</div>}

      <section className="ad-card ad-card-pad" style={{ marginBottom: 16 }}>
        <div className="th-head">
          <h3 className="ad-sechead-h">Category thumbnails</h3>
          <span className="th-count">{cats.length} categories</span>
        </div>
        <div className="ad-thumb-grid">
          {cats.map((c) => (
            <ThumbCell
              key={c.key}
              label={c.name}
              img={map[c.key]}
              busy={busyKey === c.key}
              onPick={(f) => void pick(f, (d) => saveCat(c.key, d))}
              onRemove={() => void saveCat(c.key, null)}
            />
          ))}
        </div>
      </section>

      <section className="ad-card ad-card-pad">
        <div className="th-head">
          <h3 className="ad-sechead-h">Shape thumbnails</h3>
          <span className="th-count">{shapeList.length} shapes</span>
        </div>
        {shapeList.length === 0 ? (
          <p className="ad-hint">No shapes yet — add shapes to categories under Catalog first, then each shape gets a thumbnail slot here.</p>
        ) : (
          <div className="ad-thumb-grid">
            {shapeList.map((s) => (
              <ThumbCell
                key={s}
                label={titleCase(s)}
                img={shapeMap[s]}
                busy={busyKey === 'shape:' + s}
                onPick={(f) => void pick(f, (d) => saveShape(s, d))}
                onRemove={() => void saveShape(s, null)}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

// standalone: rendered as its own page (heading handled by the page), so the
// card starts straight at the category picker like the original panel.
function ProductPhotos({ standalone = false }: { standalone?: boolean } = {}) {
  const [cats, setCats] = useState<Category[]>([]);
  const [cat, setCat] = useState('');
  const [colours, setColours] = useState<Colour[]>([]);
  const [shapes, setShapes] = useState<string[]>([]);
  const [images, setImages] = useState<ProductImages>({});
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState('');
  const [loading, setLoading] = useState(true);
  const { cropNode, requestCrop } = useImageCropper();

  useEffect(() => {
    (async () => {
      try {
        const [c, imgs] = await Promise.all([adminApi.categories(), adminApi.productImages()]);
        setCats(c);
        setImages(imgs ?? {});
        setCat(c[0]?.key ?? '');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load product images.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!cat) return;
    (async () => {
      try {
        const [cl, sh] = await Promise.all([adminApi.colours(), adminApi.shapes()]);
        setColours(cl[cat] ?? []);
        setShapes(sh[cat] ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load this category.');
      }
    })();
  }, [cat]);

  const save = async (key: string, dataUrl: string | null) => {
    setBusyKey(key);
    setError('');
    try {
      const next = { ...images };
      if (dataUrl) next[key] = dataUrl;
      else delete next[key];
      await adminApi.saveProductImages(next);
      setImages(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save that image.');
    } finally {
      setBusyKey('');
    }
  };

  const pick = async (key: string, file: File | undefined) => {
    if (!file) return;
    const cropped = await requestCrop(file);
    if (!cropped) return; // operator cancelled the crop
    try {
      await save(key, await uploadImage(cropped, 'product-images'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that image.');
    }
  };

  if (loading) return <section className="ad-card ad-card-pad ad-muted">Loading…</section>;

  return (
    <section className="ad-card ad-card-pad">
      {cropNode}
      {!standalone && (
        <>
          <h3 className="ad-sechead-h">Product images</h3>
          <p className="ad-muted">One photo per colour × shape. Customers see it when browsing that combination.</p>
        </>
      )}

      <div className="ad-field-v" style={{ marginTop: standalone ? 0 : 12, marginBottom: 0 }}>
        <span className="ad-label">Category</span>
        <select className="ad-input" style={{ maxWidth: 280, width: '100%' }} value={cat} onChange={(e) => setCat(e.target.value)}>
          {cats.map((c) => (
            <option key={c.key} value={c.key}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="ad-error" style={{ marginTop: 12 }}>{error}</div>}

      {colours.length === 0 || shapes.length === 0 ? (
        <p className="ad-hint" style={{ marginTop: 14 }}>
          This category has no {colours.length === 0 ? 'colours' : 'shapes'} yet — add them under Catalog → {cats.find((c) => c.key === cat)?.name} first,
          then each colour × shape gets a photo slot here.
        </p>
      ) : (
        <>
          {/* The original panel's matrix: one row per colour, one column per
              shape, an upload slot in every cell. */}
          <div className="pi-scroll">
            <table className="pi-table">
              <thead>
                <tr>
                  <th>Colour</th>
                  {shapes.map((sh) => (
                    <th key={sh}>{sh}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {colours.map((col) => (
                  <tr key={col.id}>
                    <td className="pi-colour">
                      <i className="ad-sw" style={{ background: col.hex || '#ccc' }} />
                      {col.name}
                    </td>
                    {shapes.map((sh) => {
                      const key = productImageKey(cat, col.id, sh);
                      const img = images[key];
                      return (
                        <td key={sh}>
                          <div className="pi-cell">
                            <label className="ad-btn ad-btn-ghost ad-btn-sm">
                              {img && <img className="pi-thumb" src={img} alt={`${col.name} ${sh}`} />}
                              {img ? 'Change' : '＋ Upload'}
                              <input type="file" accept="image/*" hidden onChange={(e) => pick(key, e.target.files?.[0])} />
                            </label>
                            {img && (
                              <button
                                className="ad-btn ad-btn-ghost ad-btn-sm ad-danger"
                                title="Remove"
                                disabled={busyKey === key}
                                onClick={() => save(key, null)}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="ad-hint" style={{ marginTop: 10 }}>
            Tip: square JPG/PNG photos look best — the same photo shows across all grades &amp; sizes of that colour + shape.
          </p>
        </>
      )}
    </section>
  );
}
