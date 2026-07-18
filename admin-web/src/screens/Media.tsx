import { useEffect, useState } from 'react';
import {
  adminApi,
  fileToDataUrl,
  productImageKey,
  type Category,
  type Colour,
  type ProductImages,
} from '../lib/api';

// Home thumbnails and product photos. The prototype's thumbnail cells were
// wired (via a synced localStorage key); its product-image "＋ Upload" buttons
// had no onClick and no file input at all.
export function Media() {
  const [tab, setTab] = useState<'thumbs' | 'products'>('thumbs');

  return (
    <div className="ad-body">
      <div className="ad-pagehead">
        <h2>Images</h2>
        <p className="ad-muted">Category thumbnails on the home screen, and product photos in the browser.</p>
      </div>

      <div className="ad-chips" style={{ marginBottom: 16 }}>
        <button type="button" className={`ad-chip ${tab === 'thumbs' ? 'sel' : ''}`} onClick={() => setTab('thumbs')}>
          Home thumbnails
        </button>
        <button type="button" className={`ad-chip ${tab === 'products' ? 'sel' : ''}`} onClick={() => setTab('products')}>
          Product images
        </button>
      </div>

      {tab === 'thumbs' ? <Thumbs /> : <ProductPhotos />}
    </div>
  );
}

function Thumbs() {
  const [cats, setCats] = useState<Category[] | null>(null);
  const [map, setMap] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [c, m] = await Promise.all([adminApi.categories(), adminApi.catThumbs()]);
        setCats(c);
        setMap(m ?? {});
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load thumbnails.');
      }
    })();
  }, []);

  const save = async (key: string, dataUrl: string | null) => {
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

  const pick = async (key: string, file: File | undefined) => {
    if (!file) return;
    try {
      await save(key, await fileToDataUrl(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that image.');
    }
  };

  if (!cats) return <section className="ad-card ad-card-pad ad-muted">Loading…</section>;

  return (
    <section className="ad-card ad-card-pad">
      <h3 className="ad-sechead-h">Category thumbnails</h3>
      <p className="ad-muted">One image per category, shown on the Sales App home screen.</p>
      {error && <div className="ad-error" style={{ marginTop: 12 }}>{error}</div>}

      <div className="ad-thumb-grid">
        {cats.map((c) => (
          <div className="ad-thumb-cell" key={c.key}>
            <div className="ad-thumb-art">
              {map[c.key] ? <img src={map[c.key]} alt={c.name} /> : <span className="ad-thumb-empty" />}
            </div>
            <div className="ad-thumb-label">{c.short || c.name}</div>
            <div className="ad-row">
              <label className="ad-btn ad-btn-ghost ad-btn-sm">
                {map[c.key] ? 'Change' : '＋ Upload'}
                <input type="file" accept="image/*" hidden onChange={(e) => pick(c.key, e.target.files?.[0])} />
              </label>
              {map[c.key] && (
                <button className="ad-btn ad-btn-ghost ad-btn-sm ad-danger" disabled={busyKey === c.key} onClick={() => save(c.key, null)}>
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductPhotos() {
  const [cats, setCats] = useState<Category[]>([]);
  const [cat, setCat] = useState('');
  const [colours, setColours] = useState<Colour[]>([]);
  const [shapes, setShapes] = useState<string[]>([]);
  const [images, setImages] = useState<ProductImages>({});
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState('');
  const [loading, setLoading] = useState(true);

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
    try {
      await save(key, await fileToDataUrl(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that image.');
    }
  };

  if (loading) return <section className="ad-card ad-card-pad ad-muted">Loading…</section>;

  return (
    <section className="ad-card ad-card-pad">
      <h3 className="ad-sechead-h">Product images</h3>
      <p className="ad-muted">One photo per colour × shape. Customers see it when browsing that combination.</p>

      <div className="ad-row" style={{ marginTop: 12 }}>
        <select className="ad-input" style={{ maxWidth: 280 }} value={cat} onChange={(e) => setCat(e.target.value)}>
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
        <div className="ad-thumb-grid">
          {colours.flatMap((col) =>
            shapes.map((sh) => {
              const key = productImageKey(cat, col.id, sh);
              return (
                <div className="ad-thumb-cell" key={key}>
                  <div className="ad-thumb-art">
                    {images[key] ? <img src={images[key]} alt={`${col.name} ${sh}`} /> : <span className="ad-thumb-empty" />}
                  </div>
                  <div className="ad-thumb-label">
                    <i className="ad-sw" style={{ background: col.hex || '#ccc', marginRight: 6 }} />
                    {col.name} · {sh}
                  </div>
                  <div className="ad-row">
                    <label className="ad-btn ad-btn-ghost ad-btn-sm">
                      {images[key] ? 'Change' : '＋ Upload'}
                      <input type="file" accept="image/*" hidden onChange={(e) => pick(key, e.target.files?.[0])} />
                    </label>
                    {images[key] && (
                      <button className="ad-btn ad-btn-ghost ad-btn-sm ad-danger" disabled={busyKey === key} onClick={() => save(key, null)}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}
