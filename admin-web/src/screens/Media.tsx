import { useEffect, useState } from 'react';
import {
  adminApi,
  uploadImage,
  productImageKey,
  resolveProductImage,
  GRADE_SCOPED,
  GRADE_SCOPED_GRADES,
  GRADE_SCOPED_COLOURS,
  GRADE_SCOPED_SHAPES,
  type Category,
  type Colour,
  type ProductImages,
} from '../lib/api';
import { useImageCropper } from './ImageCropper';

// Shared "Save changes" UX for the image screens. Uploads still push the file
// to storage on pick, but the key→url map (what the Sales App actually reads)
// is staged locally and only written when the operator clicks Save changes —
// so nothing goes live until they say so, matching the Pricing screen.
type SaveState = 'idle' | 'saving' | 'saved';

function useSaveBar() {
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  return { dirty, setDirty, saveState, setSaveState };
}

function SaveBar({
  dirty,
  saveState,
  onSave,
}: {
  dirty: boolean;
  saveState: SaveState;
  onSave: () => void;
}) {
  return (
    <div className={`pr-savebar ${dirty || saveState !== 'idle' ? 'on' : ''}`}>
      <span className="pr-savebar-msg">
        {saveState === 'saving'
          ? 'Saving…'
          : saveState === 'saved'
            ? '✓ Saved — live on the website'
            : dirty
              ? '● You have unsaved changes'
              : 'All changes saved'}
      </span>
      <button
        className="ad-btn ad-btn-pri"
        disabled={!dirty || saveState === 'saving'}
        onClick={onSave}
      >
        {saveState === 'saving' ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}

// Home thumbnails and product photos. The prototype's thumbnail cells were
// wired (via a synced localStorage key); its product-image "＋ Upload" buttons
// had no onClick and no file input at all.
// initialTab lets the sidebar's "Product images" and "Home thumbnails" entries
// land directly on the right tab, like the original panel's separate pages.
// Both sidebar entries are their own pages, like the original panel — no tab
// pills, page-level headings, the content below.
export function Media({ initialTab = 'thumbs' }: { initialTab?: 'thumbs' | 'products' | 'colours' } = {}) {
  if (initialTab === 'products') {
    return (
      <div className="ad-body">
        <div className="ad-pagehead">
          <h2>Product images</h2>
          <p className="ad-muted">Upload a photo per colour + shape — and per grade wherever a Grade selector appears</p>
        </div>
        <ProductPhotos standalone />
      </div>
    );
  }

  if (initialTab === 'colours') {
    return (
      <div className="ad-body">
        <div className="ad-pagehead">
          <h2>Colour images</h2>
          <p className="ad-muted">
            Upload a real photo for each colour — it replaces the plain colour ball on the Sales App's ‘Choose a
            colour’ step. Square close-ups work best.
          </p>
        </div>
        <ColourImages />
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
  swatch,
}: {
  label: string;
  img?: string;
  busy: boolean;
  onPick: (file: File | undefined) => void;
  onRemove: () => void;
  swatch?: string;
}) {
  return (
    <div className="ad-thumb-cell">
      <div className="ad-thumb-art">
        {img ? (
          <img src={img} alt={label} />
        ) : swatch ? (
          <span className="ad-thumb-empty" style={{ background: swatch }} />
        ) : (
          <span className="ad-thumb-empty" />
        )}
      </div>
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
  const { dirty, setDirty, saveState, setSaveState } = useSaveBar();
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

  // Stage only — nothing reaches the website until Save changes (commitSave).
  const stageCat = (key: string, dataUrl: string | null) => {
    setMap((m) => {
      const next = { ...m };
      if (dataUrl) next[key] = dataUrl;
      else delete next[key];
      return next;
    });
    setDirty(true);
    setSaveState('idle');
  };

  const stageShape = (key: string, dataUrl: string | null) => {
    setShapeMap((m) => {
      const next = { ...m };
      if (dataUrl) next[key] = dataUrl;
      else delete next[key];
      return next;
    });
    setDirty(true);
    setSaveState('idle');
  };

  const commitSave = async () => {
    setSaveState('saving');
    setError('');
    try {
      await Promise.all([adminApi.saveCatThumbs(map), adminApi.saveShapeThumbs(shapeMap)]);
      setDirty(false);
      setSaveState('saved');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your changes.');
      setSaveState('idle');
    }
  };

  const pick = async (file: File | undefined, stage: (dataUrl: string) => void, busy: string) => {
    if (!file) return;
    const cropped = await requestCrop(file);
    if (!cropped) return; // operator cancelled the crop
    setBusyKey(busy);
    setError('');
    try {
      stage(await uploadImage(cropped, 'thumbs'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that image.');
    } finally {
      setBusyKey('');
    }
  };

  if (!cats) return <section className="ad-card ad-card-pad ad-muted">Loading…</section>;

  return (
    <>
      {cropNode}
      <SaveBar dirty={dirty} saveState={saveState} onSave={() => void commitSave()} />
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
              onPick={(f) => void pick(f, (d) => stageCat(c.key, d), c.key)}
              onRemove={() => stageCat(c.key, null)}
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
                onPick={(f) => void pick(f, (d) => stageShape(s, d), 'shape:' + s)}
                onRemove={() => stageShape(s, null)}
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
  const [grade, setGrade] = useState('');
  const [colours, setColours] = useState<Colour[]>([]);
  const [shapes, setShapes] = useState<string[]>([]);
  const [images, setImages] = useState<ProductImages>({});
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState('');
  const [loading, setLoading] = useState(true);
  const { dirty, setDirty, saveState, setSaveState } = useSaveBar();
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
    // Grade-scoped categories (MOP, Multi Sapphire, Opaque) show a grade picker;
    // default to the first grade so uploads target one grade, not all at once.
    setGrade(GRADE_SCOPED[cat] ? (GRADE_SCOPED_GRADES[cat]?.[0]?.id ?? '') : '');
  }, [cat]);

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

  const scoped = !!GRADE_SCOPED[cat];
  const gradeChoices = GRADE_SCOPED_GRADES[cat] ?? [];
  // Grades that carry their own colour set (Lab Grown "Created"/"Corundum",
  // Opaque "Opal", each Bracelet style) show those; others fall back to the
  // category's lifted base colours. Same idea for shapes (Opaque cut vs opal).
  const effColours = (scoped && GRADE_SCOPED_COLOURS[cat]?.[grade]) || colours;
  const effShapes = (scoped && GRADE_SCOPED_SHAPES[cat]?.[grade]) || shapes;

  // Stage only — nothing reaches the website until Save changes (commitSave).
  const stage = (key: string, dataUrl: string | null) => {
    setImages((imgs) => {
      const next = { ...imgs };
      if (dataUrl) next[key] = dataUrl;
      else delete next[key];
      return next;
    });
    setDirty(true);
    setSaveState('idle');
  };

  const commitSave = async () => {
    setSaveState('saving');
    setError('');
    try {
      await adminApi.saveProductImages(images);
      setDirty(false);
      setSaveState('saved');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your changes.');
      setSaveState('idle');
    }
  };

  // Every stored photo belonging to the selected category — matched by the
  // "cat|…" key prefix, so it also catches OLD/orphaned keys (e.g. a previous
  // key format) that never line up with a grid cell and so have no ✕ button.
  const catName = cats.find((c) => c.key === cat)?.name ?? cat;
  const catImageKeys = Object.keys(images).filter((k) => k === cat || k.startsWith(cat + '|'));

  // Wipe them all for this category only. Staged like any other edit — nothing
  // is removed on the website until the operator clicks Save changes.
  const clearCategory = () => {
    if (!catImageKeys.length) return;
    if (
      !confirm(
        `Remove ALL ${catImageKeys.length} product photo(s) for “${catName}”, including any old stuck ones? ` +
          `Only this category is affected. Nothing is deleted on the website until you click Save changes.`,
      )
    )
      return;
    setImages((imgs) => {
      const next: ProductImages = {};
      for (const [k, v] of Object.entries(imgs)) if (!(k === cat || k.startsWith(cat + '|'))) next[k] = v;
      return next;
    });
    setDirty(true);
    setSaveState('idle');
  };

  const pick = async (key: string, file: File | undefined) => {
    if (!file) return;
    const cropped = await requestCrop(file);
    if (!cropped) return; // operator cancelled the crop
    setBusyKey(key);
    setError('');
    try {
      stage(key, await uploadImage(cropped, 'product-images'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that image.');
    } finally {
      setBusyKey('');
    }
  };

  if (loading) return <section className="ad-card ad-card-pad ad-muted">Loading…</section>;

  return (
    <section className="ad-card ad-card-pad">
      {cropNode}
      <SaveBar dirty={dirty} saveState={saveState} onSave={() => void commitSave()} />
      {!standalone && (
        <>
          <h3 className="ad-sechead-h">Product images</h3>
          <p className="ad-muted">One photo per colour × shape. Customers see it when browsing that combination.</p>
        </>
      )}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginTop: standalone ? 0 : 12 }}>
        <div className="ad-field-v" style={{ marginBottom: 0, flex: '1 1 240px', maxWidth: 280 }}>
          <span className="ad-label">Category</span>
          <select className="ad-input" style={{ width: '100%' }} value={cat} onChange={(e) => setCat(e.target.value)}>
            {cats.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {scoped && (
          <div className="ad-field-v" style={{ marginBottom: 0, flex: '1 1 240px', maxWidth: 280 }}>
            <span className="ad-label">Grade</span>
            <select className="ad-input" style={{ width: '100%' }} value={grade} onChange={(e) => setGrade(e.target.value)}>
              {gradeChoices.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <button
            className="ad-btn ad-btn-ghost ad-danger"
            disabled={catImageKeys.length === 0}
            title="Removes every photo for this category, including old stuck ones. Only this category."
            onClick={clearCategory}
          >
            🗑 Clear all photos in this category{catImageKeys.length ? ` (${catImageKeys.length})` : ''}
          </button>
        </div>
      </div>
      {scoped && (
        <p className="ad-muted" style={{ marginTop: 10, marginBottom: 0, fontSize: 12.5 }}>
          Each grade has its own photos — switch the grade above to give{' '}
          {gradeChoices.map((g) => g.name).join(' / ')} different images.
        </p>
      )}

      {error && <div className="ad-error" style={{ marginTop: 12 }}>{error}</div>}

      {effColours.length === 0 || effShapes.length === 0 ? (
        <p className="ad-hint" style={{ marginTop: 14 }}>
          This category has no {effColours.length === 0 ? 'colours' : 'shapes'} yet — add them under Catalog → {cats.find((c) => c.key === cat)?.name} first,
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
                  {effShapes.map((sh) => (
                    <th key={sh}>{sh}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {effColours.map((col) => (
                  <tr key={col.id}>
                    <td className="pi-colour">
                      <i className="ad-sw" style={{ background: col.hex || '#ccc' }} />
                      {col.name}
                    </td>
                    {effShapes.map((sh) => {
                      const key = productImageKey(cat, col.id, sh, scoped ? grade : undefined);
                      const img = resolveProductImage(images, cat, col.id, sh, scoped ? grade : undefined);
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
                                onClick={() => stage(key, null)}
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
            Tip: square JPG/PNG photos look best.{' '}
            {scoped
              ? 'This photo shows for the selected grade, across all its sizes.'
              : 'The same photo shows across all grades & sizes of that colour + shape.'}
          </p>
        </>
      )}
    </section>
  );
}

// One photo per colour (keyed "cat|colour") — replaces the plain colour swatch
// on the storefront's "Choose a colour" step. Category picker + a grid of
// colour cards, reusing the same upload cell as the thumbnails.
function ColourImages() {
  const [cats, setCats] = useState<Category[]>([]);
  const [cat, setCat] = useState('');
  const [grade, setGrade] = useState('');
  const [colours, setColours] = useState<Colour[]>([]);
  const [map, setMap] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState('');
  const [loading, setLoading] = useState(true);
  const { dirty, setDirty, saveState, setSaveState } = useSaveBar();
  const { cropNode, requestCrop } = useImageCropper();

  useEffect(() => {
    (async () => {
      try {
        const [c, m] = await Promise.all([adminApi.categories(), adminApi.colourThumbs()]);
        setCats(c);
        setMap(m ?? {});
        setCat(c[0]?.key ?? '');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load colour images.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    // Grade-scoped categories (Lab Grown, etc.) offer a different colour set per
    // sub-category — default to the first so the list isn't all colours clubbed.
    setGrade(GRADE_SCOPED[cat] ? (GRADE_SCOPED_GRADES[cat]?.[0]?.id ?? '') : '');
  }, [cat]);

  useEffect(() => {
    if (!cat) return;
    (async () => {
      try {
        const cl = await adminApi.colours();
        setColours(cl[cat] ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load this category.');
      }
    })();
  }, [cat]);

  const scoped = !!GRADE_SCOPED[cat];
  const gradeChoices = GRADE_SCOPED_GRADES[cat] ?? [];
  // Show only the colours the selected grade offers (its own set, or the
  // category's base colours when that grade shares them).
  const effColours = (scoped && GRADE_SCOPED_COLOURS[cat]?.[grade]) || colours;

  // Stage only — nothing reaches the website until Save changes (commitSave).
  const stage = (key: string, dataUrl: string | null) => {
    setMap((m) => {
      const next = { ...m };
      if (dataUrl) next[key] = dataUrl;
      else delete next[key];
      return next;
    });
    setDirty(true);
    setSaveState('idle');
  };

  const commitSave = async () => {
    setSaveState('saving');
    setError('');
    try {
      await adminApi.saveColourThumbs(map);
      setDirty(false);
      setSaveState('saved');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your changes.');
      setSaveState('idle');
    }
  };

  const pick = async (key: string, file: File | undefined) => {
    if (!file) return;
    const cropped = await requestCrop(file);
    if (!cropped) return; // operator cancelled the crop
    setBusyKey(key);
    setError('');
    try {
      stage(key, await uploadImage(cropped, 'thumbs'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that image.');
    } finally {
      setBusyKey('');
    }
  };

  if (loading) return <section className="ad-card ad-card-pad ad-muted">Loading…</section>;

  return (
    <section className="ad-card ad-card-pad">
      {cropNode}
      <SaveBar dirty={dirty} saveState={saveState} onSave={() => void commitSave()} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="ad-field-v" style={{ marginBottom: 0, flex: '1 1 240px', maxWidth: 280 }}>
          <span className="ad-label">Category</span>
          <select className="ad-input" style={{ width: '100%' }} value={cat} onChange={(e) => setCat(e.target.value)}>
            {cats.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {scoped && (
          <div className="ad-field-v" style={{ marginBottom: 0, flex: '1 1 240px', maxWidth: 280 }}>
            <span className="ad-label">Sub-category (grade)</span>
            <select className="ad-input" style={{ width: '100%' }} value={grade} onChange={(e) => setGrade(e.target.value)}>
              {gradeChoices.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {scoped && (
        <p className="ad-muted" style={{ marginTop: 10, marginBottom: 0, fontSize: 12.5 }}>
          Lab Grown has separate colours per sub-category — switch the grade above to upload each set’s colours.
        </p>
      )}

      {error && (
        <div className="ad-error" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}

      {effColours.length === 0 ? (
        <p className="ad-hint" style={{ marginTop: 14 }}>
          This category has no colours yet — add them under Catalog → {cats.find((c) => c.key === cat)?.name} first.
        </p>
      ) : (
        <div className="ad-thumb-grid" style={{ marginTop: 16 }}>
          {effColours.map((col) => {
            const key = `${cat}|${col.id}`;
            return (
              <ThumbCell
                key={col.id}
                label={col.name}
                img={map[key]}
                busy={busyKey === key}
                onPick={(f) => void pick(key, f)}
                onRemove={() => stage(key, null)}
                swatch={col.hex || '#ccc'}
              />
            );
          })}
        </div>
      )}

      <p className="ad-hint" style={{ marginTop: 10 }}>
        Colours without an uploaded photo keep showing the plain colour swatch.
      </p>
    </section>
  );
}
