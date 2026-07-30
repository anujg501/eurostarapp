import { useEffect, useState } from 'react';
import {
  adminApi,
  type Category,
  type Grade,
  type Colour,
  type PricingMatrix,
  type CategoryPricingOverride,
  type PricingOverrides,
} from '../lib/api';

// Pricing section (Sales App + Admin). Flow: Category → Grade (multi-grade only)
// → Colour → size × price editor. The editor writes per-category overrides
// (adminApi.pricingOverrides) that the Sales App reads live; auto rates come
// from the existing /admin/pricing matrix (base × size multiplier).

type Step = 'cats' | 'grades' | 'colours' | 'editor';
const ALL = '__all__';

// "9.00" → "9.00 mm"; "10x8" / "10*8" → "10×8 mm"; leaves an existing "mm" alone.
function normSize(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  if (/mm\s*$/i.test(s)) return s.replace(/\s*mm\s*$/i, ' mm');
  return s.replace(/\s*[x×*]\s*/i, '×') + ' mm';
}

export function Pricing() {
  const [cats, setCats] = useState<Category[]>([]);
  const [grades, setGrades] = useState<Record<string, Grade[]>>({});
  const [colours, setColours] = useState<Record<string, Colour[]>>({});
  const [swatches, setSwatches] = useState<Record<string, string>>({});
  const [ovr, setOvr] = useState<PricingOverrides>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<Step>('cats');
  const [catKey, setCatKey] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [colourId, setColourId] = useState<string>(ALL);

  useEffect(() => {
    (async () => {
      try {
        const [c, g, cl, sw, ov] = await Promise.all([
          adminApi.categories(),
          adminApi.grades(),
          adminApi.colours(),
          adminApi.colourSwatches(),
          adminApi.pricingOverrides(),
        ]);
        setCats(c);
        setGrades(g ?? {});
        setColours(cl ?? {});
        setSwatches(sw ?? {});
        setOvr(ov ?? {});
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load pricing.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cat = cats.find((c) => c.key === catKey);
  const catGrades = grades[catKey] ?? [];
  const multiGrade = catGrades.length > 1;
  const catColours = colours[catKey] ?? [];
  const grade = catGrades.find((g) => g.id === gradeId);

  const openCategory = (c: Category) => {
    setCatKey(c.key);
    setColourId(ALL);
    const g = grades[c.key] ?? [];
    if (g.length > 1) {
      setGradeId('');
      setStep('grades');
    } else {
      setGradeId(g[0]?.id ?? '');
      setStep('colours');
    }
  };

  // Persist the whole override map after any editor change.
  const persist = async (next: PricingOverrides) => {
    setOvr(next);
    try {
      await adminApi.savePricingOverrides(next);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
      return false;
    }
  };

  if (loading) return <div className="ad-body"><section className="ad-card ad-card-pad ad-muted">Loading…</section></div>;

  return (
    <div className="ad-body">
      <div className="ad-pagehead">
        <h2>Pricing</h2>
        <p className="ad-muted">Edit rates, pieces-per-packet and sizes. Changes save automatically and go live in the Sales App.</p>
      </div>
      {error && <div className="ad-error">{error}</div>}

      {step === 'cats' && (
        <div className="pr-grid">
          {cats.map((c) => {
            const nCol = (colours[c.key] ?? []).length;
            return (
              <button key={c.key} className="pr-cat-card" onClick={() => openCategory(c)}>
                <div className="pr-cat-name">{c.name}</div>
                <div className="pr-cat-meta">
                  {nCol} colour{nCol === 1 ? '' : 's'} · {c.unit?.toUpperCase?.() || ''}
                </div>
                <span className="pr-cat-go">Open ›</span>
              </button>
            );
          })}
        </div>
      )}

      {step === 'grades' && cat && (
        <>
          <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={() => setStep('cats')}>← Categories</button>
          <h3 className="pr-h3">{cat.name} — choose a grade</h3>
          <div className="pr-grid">
            {catGrades.map((g) => (
              <button
                key={g.id}
                className="pr-grade-card"
                onClick={() => { setGradeId(g.id); setColourId(ALL); setStep('colours'); }}
              >
                {g.tier && <span className="pr-badge">{g.tier.toUpperCase()}</span>}
                {g.origin && <span className="pr-pill">{g.origin}</span>}
                <div className="pr-grade-name">{g.name}</div>
                {g.desc && <div className="pr-grade-desc">{g.desc}</div>}
                {g.basePrice ? <div className="pr-grade-from">from ₹{g.basePrice}/{g.unit || cat.unit}</div> : null}
                <span className="pr-cat-go">Select ›</span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 'colours' && cat && (
        <>
          <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={() => setStep(multiGrade ? 'grades' : 'cats')}>
            ← {multiGrade ? `${cat.name} grades` : 'Categories'}
          </button>
          <h3 className="pr-h3">
            {cat.name}{grade ? ` · ${grade.name}` : ''} — choose a colour
          </h3>
          <p className="ad-muted" style={{ marginTop: -6 }}>Edit one colour's pricing, or the base rates every colour inherits.</p>
          <div className="pr-grid">
            <button className="pr-colour-card" onClick={() => { setColourId(ALL); setStep('editor'); }}>
              <div className="pr-swatch pr-swatch-all" />
              <div className="pr-colour-name">All colours</div>
              <div className="pr-colour-sub">Base rates — used by every colour without its own override.</div>
              <span className="pr-cat-go">Edit pricing ›</span>
            </button>
            {catColours.map((col) => {
              const photo = swatches[`${cat.key}|${col.id}`];
              return (
                <button key={col.id} className="pr-colour-card" onClick={() => { setColourId(col.id); setStep('editor'); }}>
                  {photo ? (
                    <div className="pr-swatch" style={{ backgroundImage: `url(${photo})`, backgroundSize: 'cover' }} />
                  ) : (
                    <div className="pr-swatch"><span className="pr-ball" style={{ background: col.hex || '#ccc' }} /></div>
                  )}
                  <div className="pr-colour-name">{col.name}</div>
                  <span className="pr-cat-go">Edit pricing ›</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {step === 'editor' && cat && (
        <PriceEditor
          cat={cat}
          multiGrade={multiGrade}
          gradeId={gradeId}
          gradeName={grade?.name || ''}
          colourId={colourId}
          colourName={colourId === ALL ? 'All colours' : (catColours.find((c) => c.id === colourId)?.name || colourId)}
          ovr={ovr[cat.key] ?? {}}
          onBack={() => setStep('colours')}
          onChange={(next) => persist({ ...ovr, [cat.key]: next })}
        />
      )}
    </div>
  );
}

// ---- The size × price editor ------------------------------------------------
function PriceEditor({
  cat,
  multiGrade,
  gradeId,
  gradeName,
  colourId,
  colourName,
  ovr,
  onBack,
  onChange,
}: {
  cat: Category;
  multiGrade: boolean;
  gradeId: string;
  gradeName: string;
  colourId: string;
  colourName: string;
  ovr: CategoryPricingOverride;
  onBack: () => void;
  onChange: (next: CategoryPricingOverride) => void;
}) {
  const [matrix, setMatrix] = useState<PricingMatrix | null>(null);
  const [shape, setShape] = useState('');
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(false);
  const [newSize, setNewSize] = useState('');

  useEffect(() => {
    let stale = false;
    (async () => {
      try {
        const d = await adminApi.pricing(cat.key, shape || undefined);
        if (stale) return;
        setMatrix(d);
        if (!shape && d.shape) setShape(d.shape);
      } catch (e) {
        if (!stale) setError(e instanceof Error ? e.message : 'Could not load prices.');
      }
    })();
    return () => { stale = true; };
  }, [cat.key, shape]);

  const activeShape = shape || matrix?.shape || '';
  const unit = matrix?.unit || cat.unit || 'pc';
  const packet = unit === 'pkt' || matrix?.rows.some((r) => r.pcsPerPacket > 0) || false;
  const colSpecific = colourId !== ALL;

  const flashSaved = () => { setFlash(true); window.setTimeout(() => setFlash(false), 1400); };

  // Price keys, most→least specific. First match wins at read time.
  const priceKeys = (size: string) => {
    const k: string[] = [];
    if (multiGrade) {
      if (colSpecific) k.push(`${gradeId}@${colourId}|${activeShape}|${size}`);
      k.push(`${gradeId}@${activeShape}|${size}`);
    }
    if (colSpecific) k.push(`${colourId}|${activeShape}|${size}`);
    k.push(`${activeShape}|${size}`);
    return k;
  };
  const writeKey = (size: string) => priceKeys(size)[0];

  const resolve = (size: string, auto: number): { rate: number; source: 'own' | 'inherit' | 'auto' } => {
    const keys = priceKeys(size);
    const own = writeKey(size);
    for (const key of keys) {
      const v = ovr.price?.[key];
      if (v != null) return { rate: v, source: key === own ? 'own' : 'inherit' };
    }
    return { rate: auto, source: 'auto' };
  };

  const setPrice = (size: string, raw: string) => {
    const key = writeKey(size);
    const price = { ...(ovr.price ?? {}) };
    const n = parseFloat(raw);
    const auto = matrix?.rows.find((r) => r.size === size)?.rate ?? 0;
    if (raw.trim() === '' || Number.isNaN(n) || n === auto) delete price[key];
    else price[key] = n;
    onChange({ ...ovr, price });
    flashSaved();
  };

  const setPcs = (size: string, raw: string) => {
    const pcs = { ...(ovr.pcs ?? {}) };
    const n = parseInt(raw, 10);
    const auto = matrix?.rows.find((r) => r.size === size)?.pcsPerPacket ?? 0;
    if (raw.trim() === '' || Number.isNaN(n) || n === auto) delete pcs[size];
    else pcs[size] = n;
    onChange({ ...ovr, pcs });
    flashSaved();
  };

  const addSize = () => {
    const s = normSize(newSize);
    if (!s) return;
    const add = { ...(ovr.addSizes ?? {}) };
    const list = new Set([...(add[activeShape] ?? []), s]);
    add[activeShape] = [...list];
    // If it was previously removed, un-remove it.
    const del = { ...(ovr.delSizes ?? {}) };
    if (del[activeShape]) del[activeShape] = del[activeShape].filter((x) => x !== s);
    onChange({ ...ovr, addSizes: add, delSizes: del });
    setNewSize('');
    flashSaved();
  };

  const removeSize = (size: string, isAdded: boolean) => {
    if (isAdded) {
      const add = { ...(ovr.addSizes ?? {}) };
      add[activeShape] = (add[activeShape] ?? []).filter((x) => x !== size);
      onChange({ ...ovr, addSizes: add });
    } else {
      const del = { ...(ovr.delSizes ?? {}) };
      del[activeShape] = [...new Set([...(del[activeShape] ?? []), size])];
      onChange({ ...ovr, delSizes: del });
    }
    flashSaved();
  };

  const restoreSize = (size: string) => {
    const del = { ...(ovr.delSizes ?? {}) };
    del[activeShape] = (del[activeShape] ?? []).filter((x) => x !== size);
    onChange({ ...ovr, delSizes: del });
    flashSaved();
  };

  if (!matrix) return <section className="ad-card ad-card-pad ad-muted">Loading prices…</section>;

  const delList = ovr.delSizes?.[activeShape] ?? [];
  const addList = ovr.addSizes?.[activeShape] ?? [];
  // Auto sizes from the matrix, minus removed, plus admin-added.
  const autoSizes = matrix.rows.map((r) => r.size).filter((s) => !delList.includes(s));
  const rows = [
    ...autoSizes.map((s) => ({ size: s, added: false })),
    ...addList.filter((s) => !autoSizes.includes(s)).map((s) => ({ size: s, added: true })),
  ];

  const unitLabel = unit === 'ct' ? '₹ per carat' : unit === 'pkt' ? '₹ per piece · packet sold' : `₹ per ${unit}`;

  return (
    <section className="ad-card ad-card-pad">
      <div className="pr-editor-top">
        <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={onBack}>← {cat.name} colours</button>
        <span className="ad-muted" style={{ fontSize: 13 }}>
          {cat.name}{multiGrade && gradeName ? ` · ${gradeName}` : ''} · <b>{colourName}</b>
        </span>
        {flash && <span className="pr-flash">✓ Saved — live in the Sales App</span>}
      </div>

      <div className="pr-chips">
        <span className="ad-label" style={{ marginRight: 6 }}>SHAPE</span>
        {matrix.shapes.map((s) => (
          <button key={s} className={`pr-chip ${s === activeShape ? 'on' : ''}`} onClick={() => setShape(s)}>{s}</button>
        ))}
      </div>

      <div className="th-head" style={{ marginTop: 8 }}>
        <h3 className="ad-sechead-h">Size × price ({activeShape} · {colourName})</h3>
        <span className="th-count">{unitLabel} · changes save automatically</span>
      </div>

      {error && <div className="ad-error">{error}</div>}

      <div className="pi-scroll">
        <table className="pi-table">
          <thead>
            <tr>
              <th>Size</th>
              <th>Rate ₹</th>
              {packet && <th>Pcs / packet</th>}
              <th>Note</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ size, added }) => {
              const autoRow = matrix.rows.find((r) => r.size === size);
              const auto = autoRow?.rate ?? 0;
              const autoPcs = autoRow?.pcsPerPacket ?? 0;
              const r = resolve(size, auto);
              const pcsVal = ovr.pcs?.[size] ?? autoPcs;
              const pcsCustom = ovr.pcs?.[size] != null;
              const note =
                r.source === 'own'
                  ? colSpecific ? `custom for ${colourName}` : 'custom · overrides auto'
                  : r.source === 'inherit'
                    ? 'from All-colours rate'
                    : 'auto from base × size multiplier';
              return (
                <tr key={size}>
                  <td>{size}{added && <span className="pr-added"> · added</span>}</td>
                  <td>
                    <input
                      className={`ad-input pr-num ${r.source === 'own' ? 'pr-custom' : ''}`}
                      type="number"
                      defaultValue={r.rate}
                      key={`${size}-${activeShape}-${colourId}-rate-${r.rate}`}
                      onBlur={(e) => setPrice(size, e.target.value)}
                    />
                  </td>
                  {packet && (
                    <td>
                      <input
                        className={`ad-input pr-num ${pcsCustom ? 'pr-custom' : ''}`}
                        type="number"
                        defaultValue={pcsVal}
                        key={`${size}-pcs-${pcsVal}`}
                        onBlur={(e) => setPcs(size, e.target.value)}
                      />
                    </td>
                  )}
                  <td className="ad-muted" style={{ fontSize: 12.5 }}>{note}</td>
                  <td>
                    <button className="ad-btn ad-btn-ghost ad-btn-sm ad-danger" onClick={() => removeSize(size, added)}>Remove</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pr-addrow">
        <input
          className="ad-input"
          placeholder="＋ Add size (e.g. 9.00 or 10x8)"
          value={newSize}
          onChange={(e) => setNewSize(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addSize(); }}
          style={{ maxWidth: 240 }}
        />
        <button className="ad-btn ad-btn-pri ad-btn-sm" onClick={addSize}>Add size</button>
      </div>

      {delList.length > 0 && (
        <div className="pr-removed">
          <span className="ad-muted">Removed sizes:</span>
          {delList.map((s) => (
            <button key={s} className="ad-btn ad-btn-ghost ad-btn-sm" onClick={() => restoreSize(s)}>{s} — restore</button>
          ))}
        </div>
      )}
    </section>
  );
}
