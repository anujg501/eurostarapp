import { useEffect, useState } from 'react';
import {
  adminApi,
  type Category,
  type Grade,
  type Colour,
  type PricingMatrix,
  type CategoryPricingOverride,
  type PricingOverrides,
  type PriceSnapshot,
  type SnapshotRow,
} from '../lib/api';

// Pricing section (Sales App + Admin). Flow: Category → Grade (multi-grade only)
// → Colour → size × price editor. The editor writes per-category overrides
// (adminApi.pricingOverrides) that the Sales App reads live. The "auto" rates it
// shows come from the shop's real published prices (adminApi.priceSnapshot),
// falling back to the /admin/pricing matrix estimate where a sheet has no entry.

type Step = 'cats' | 'grades' | 'colours' | 'editor';
const ALL = '__all__';

// "9.00" → "9.00 mm"; "10x8" / "10*8" → "10×8 mm"; leaves an existing "mm" alone.
// Used only for the "add size" input.
function normSize(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  if (/mm\s*$/i.test(s)) return s.replace(/\s*mm\s*$/i, ' mm');
  return s.replace(/\s*[x×*]\s*/i, '×') + ' mm';
}

// Match a size to the snapshot / override key space: lower-case, ×→x, no spaces,
// trailing zeros stripped ("7.50 mm" = "7.5" = "7.5mm"). Mirrors the storefront
// and the /admin/pricing route, so an edit lands on the row it was made against.
function snapNorm(s: string): string {
  const t = String(s ?? '').trim().toLowerCase().replace(/×/g, 'x').replace(/\s+/g, '');
  return t.replace(/(\d+(?:\.\d*?[1-9])?)\.?0*(?=\D|$)/g, '$1');
}

// Override price keys, most→least specific — the single source of truth shared
// by the editor and the Excel export so both resolve a rate identically.
function priceKeys(multiGrade: boolean, gradeId: string, colourId: string, shape: string, sizeNorm: string): string[] {
  const k: string[] = [];
  const colSpecific = colourId !== ALL;
  if (multiGrade) {
    if (colSpecific) k.push(`${gradeId}@${colourId}|${shape}|${sizeNorm}`);
    k.push(`${gradeId}@${shape}|${sizeNorm}`);
  }
  if (colSpecific) k.push(`${colourId}|${shape}|${sizeNorm}`);
  k.push(`${shape}|${sizeNorm}`);
  return k;
}

// The shop's real price for (grade, colour, shape, size). The snapshot keys a
// row on whichever of grade/colour its sheet is scoped by, so we try the
// specific pair first and fall back to the colour- or grade-agnostic entry.
function snapLook(
  catSnap: Record<string, SnapshotRow> | undefined,
  gradeId: string,
  colourId: string,
  shape: string,
  sizeNorm: string
): SnapshotRow | null {
  if (!catSnap) return null;
  const cid = colourId === ALL ? '' : colourId;
  const cands = [
    [gradeId, cid, shape, sizeNorm],
    ['', cid, shape, sizeNorm],
    [gradeId, '', shape, sizeNorm],
    ['', '', shape, sizeNorm],
  ];
  for (const a of cands) {
    const v = catSnap[a.join('|')];
    if (v) return v;
  }
  return null;
}

const rateUnitSuffix = (unit?: string) => (unit === 'ct' ? '/ct' : '/pc');

function csvCell(s: string): string {
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function downloadCsv(filename: string, rows: string[][]): void {
  const text = rows.map((r) => r.map((c) => csvCell(String(c))).join(',')).join('\r\n');
  // BOM so Excel opens ₹ and × correctly.
  const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Build a colour's whole price list across every shape × size, using the same
// override-aware rate the editor shows. Sourced from the snapshot (real prices)
// plus any admin add/remove-size edits.
function exportColourCsv(
  cat: Category,
  multiGrade: boolean,
  gradeId: string,
  gradeName: string,
  colourId: string,
  colourName: string,
  catSnap: Record<string, SnapshotRow> | undefined,
  ovr: CategoryPricingOverride
): void {
  const unit = cat.unit || 'pc';
  const packet = unit === 'pkt';
  const cid = colourId === ALL ? '' : colourId;

  // Every (shape, size) the snapshot has for this grade/colour scope.
  type Cell = { shape: string; sizeNorm: string; sizeLabel: string };
  const cells: Cell[] = [];
  const seen = new Set<string>();
  Object.keys(catSnap ?? {}).forEach((key) => {
    const [kg, kc, kshape, ksize] = key.split('|');
    if (kg !== gradeId && kg !== '') return;
    if (colourId === ALL ? kc !== '' : kc !== cid && kc !== '') return;
    const row = catSnap![key];
    const id = `${kshape}|${ksize}`;
    if (seen.has(id)) return;
    seen.add(id);
    cells.push({ shape: kshape, sizeNorm: ksize, sizeLabel: row.size || ksize });
  });
  // Admin-added sizes that aren't in the snapshot.
  Object.entries(ovr.addSizes ?? {}).forEach(([shape, sizes]) => {
    (sizes || []).forEach((s) => {
      const sn = snapNorm(s);
      const id = `${shape}|${sn}`;
      if (!seen.has(id)) {
        seen.add(id);
        cells.push({ shape, sizeNorm: sn, sizeLabel: s });
      }
    });
  });
  // Drop admin-removed sizes.
  const del = new Set<string>();
  Object.entries(ovr.delSizes ?? {}).forEach(([shape, sizes]) => {
    (sizes || []).forEach((s) => del.add(`${shape}|${snapNorm(s)}`));
  });

  const resolveRate = (shape: string, sizeNorm: string, auto: number): number => {
    for (const k of priceKeys(multiGrade, gradeId, colourId, shape, sizeNorm)) {
      const v = ovr.price?.[k];
      if (v != null) return v;
    }
    return auto;
  };
  const resolvePcs = (sizeNorm: string, auto: number): number => {
    const v = ovr.pcs?.[sizeNorm];
    return v != null ? v : auto;
  };

  const header = ['Shape', 'Size', `Rate ₹ ${rateUnitSuffix(unit)}`];
  if (packet) header.push('Pcs per packet');
  const rows: string[][] = [header];

  cells
    .filter((c) => !del.has(`${c.shape}|${c.sizeNorm}`))
    .sort((a, b) => (a.shape === b.shape ? a.sizeLabel.localeCompare(b.sizeLabel, undefined, { numeric: true }) : a.shape.localeCompare(b.shape)))
    .forEach((c) => {
      const snap = snapLook(catSnap, gradeId, colourId, c.shape, c.sizeNorm);
      const rate = resolveRate(c.shape, c.sizeNorm, snap?.rate ?? 0);
      const line = [c.shape, c.sizeLabel, String(rate)];
      if (packet) line.push(String(resolvePcs(c.sizeNorm, snap?.pcs ?? 0)));
      rows.push(line);
    });

  const gradePart = multiGrade && gradeId ? `-${gradeId}` : '';
  const colourPart = colourId === ALL ? 'all-colours' : colourId;
  downloadCsv(`${cat.key}${gradePart}-${colourPart}-pricing.csv`, rows);
  void gradeName;
  void colourName;
}

export function Pricing() {
  const [cats, setCats] = useState<Category[]>([]);
  const [grades, setGrades] = useState<Record<string, Grade[]>>({});
  const [colours, setColours] = useState<Record<string, Colour[]>>({});
  const [swatches, setSwatches] = useState<Record<string, string>>({});
  const [ovr, setOvr] = useState<PricingOverrides>({});
  const [snap, setSnap] = useState<PriceSnapshot>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<Step>('cats');
  const [catKey, setCatKey] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [colourId, setColourId] = useState<string>(ALL);

  useEffect(() => {
    (async () => {
      try {
        const [c, g, cl, sw, ov, sp] = await Promise.all([
          adminApi.categories(),
          adminApi.grades(),
          adminApi.colours(),
          adminApi.colourSwatches(),
          adminApi.pricingOverrides(),
          adminApi.priceSnapshot().catch(() => ({}) as PriceSnapshot),
        ]);
        setCats(c);
        setGrades(g ?? {});
        setColours(cl ?? {});
        setSwatches(sw ?? {});
        setOvr(ov ?? {});
        setSnap(sp ?? {});
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

  const exportCsv = (colId: string) =>
    cat &&
    exportColourCsv(
      cat,
      multiGrade,
      gradeId,
      grade?.name || '',
      colId,
      colId === ALL ? 'All colours' : catColours.find((c) => c.id === colId)?.name || colId,
      snap[cat.key],
      ovr[cat.key] ?? {}
    );

  if (loading)
    return (
      <div className="ad-body">
        <section className="ad-card ad-card-pad ad-muted">Loading…</section>
      </div>
    );

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
          <p className="ad-muted" style={{ marginTop: -6 }}>Edit one colour's pricing, or the base rates every colour inherits. Use ⬇ Excel to download a colour's whole price list.</p>
          <div className="pr-grid">
            <div className="pr-colour-card">
              <div className="pr-swatch pr-swatch-all" />
              <div className="pr-colour-name">All colours</div>
              <div className="pr-colour-sub">Base rates — used by every colour without its own override.</div>
              <div className="pr-card-actions">
                <button className="ad-btn ad-btn-pri ad-btn-sm" onClick={() => { setColourId(ALL); setStep('editor'); }}>Edit pricing</button>
                <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={() => exportCsv(ALL)}>⬇ Excel</button>
              </div>
            </div>
            {catColours.map((col) => {
              const photo = swatches[`${cat.key}|${col.id}`];
              return (
                <div key={col.id} className="pr-colour-card">
                  {photo ? (
                    <div className="pr-swatch" style={{ backgroundImage: `url(${photo})`, backgroundSize: 'cover' }} />
                  ) : (
                    <div className="pr-swatch"><span className="pr-ball" style={{ background: col.hex || '#ccc' }} /></div>
                  )}
                  <div className="pr-colour-name">{col.name}</div>
                  <div className="pr-card-actions">
                    <button className="ad-btn ad-btn-pri ad-btn-sm" onClick={() => { setColourId(col.id); setStep('editor'); }}>Edit pricing</button>
                    <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={() => exportCsv(col.id)}>⬇ Excel</button>
                  </div>
                </div>
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
          snap={snap[cat.key]}
          onBack={() => setStep('colours')}
          onChange={(next) => persist({ ...ovr, [cat.key]: next })}
          onExport={() => exportCsv(colourId)}
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
  snap,
  onBack,
  onChange,
  onExport,
}: {
  cat: Category;
  multiGrade: boolean;
  gradeId: string;
  gradeName: string;
  colourId: string;
  colourName: string;
  ovr: CategoryPricingOverride;
  snap: Record<string, SnapshotRow> | undefined;
  onBack: () => void;
  onChange: (next: CategoryPricingOverride) => void;
  onExport: () => void;
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
  const colSpecific = colourId !== ALL;

  const flashSaved = () => { setFlash(true); window.setTimeout(() => setFlash(false), 1400); };

  // The shop's real price/pcs for a row (falls back to the matrix estimate).
  const snapFor = (size: string): SnapshotRow | null => snapLook(snap, gradeId, colourId, activeShape, snapNorm(size));
  const autoRate = (size: string): number => {
    const s = snapFor(size);
    if (s) return s.rate;
    return matrix?.rows.find((r) => r.size === size)?.rate ?? 0;
  };
  const autoPcsOf = (size: string): number => {
    const s = snapFor(size);
    if (s && s.pcs > 0) return s.pcs;
    return matrix?.rows.find((r) => r.size === size)?.pcsPerPacket ?? 0;
  };

  // Whether the category is packet-sold — decides the Pcs column. Driven by the
  // unit/matrix only: the snapshot carries pcsPerPacket 1 for per-piece sheets
  // (e.g. Corundum), which must NOT turn on a packet column.
  const packet = unit === 'pkt' || (matrix?.rows.some((r) => r.pcsPerPacket > 0) ?? false);

  const keysFor = (size: string) => priceKeys(multiGrade, gradeId, colourId, activeShape, snapNorm(size));
  const writeKey = (size: string) => keysFor(size)[0];

  const resolve = (size: string, auto: number): { rate: number; source: 'own' | 'inherit' | 'auto' } => {
    const keys = keysFor(size);
    const own = keys[0];
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
    const auto = autoRate(size);
    if (raw.trim() === '' || Number.isNaN(n) || n === auto) delete price[key];
    else price[key] = n;
    onChange({ ...ovr, price });
    flashSaved();
  };

  const setPcs = (size: string, raw: string) => {
    const sn = snapNorm(size);
    const pcs = { ...(ovr.pcs ?? {}) };
    const n = parseInt(raw, 10);
    const auto = autoPcsOf(size);
    if (raw.trim() === '' || Number.isNaN(n) || n === auto) delete pcs[sn];
    else pcs[sn] = n;
    onChange({ ...ovr, pcs });
    flashSaved();
  };

  const addSize = () => {
    const s = normSize(newSize);
    if (!s) return;
    const add = { ...(ovr.addSizes ?? {}) };
    const list = new Set([...(add[activeShape] ?? []), s]);
    add[activeShape] = [...list];
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
  // Sizes from the matrix and the snapshot, minus removed, plus admin-added.
  const snapSizesForShape = Object.entries(snap ?? {})
    .filter(([key]) => {
      const [kg, kc, ksh] = key.split('|');
      const cid = colourId === ALL ? '' : colourId;
      return ksh === activeShape && (kg === gradeId || kg === '') && (colourId === ALL ? kc === '' : kc === cid || kc === '');
    })
    .map(([, r]) => r.size);
  const baseSizes: string[] = [];
  const seenNorm = new Set<string>();
  [...matrix.rows.map((r) => r.size), ...snapSizesForShape].forEach((s) => {
    const n = snapNorm(s);
    if (!seenNorm.has(n)) { seenNorm.add(n); baseSizes.push(s); }
  });
  const autoSizes = baseSizes.filter((s) => !delList.includes(s));
  const rows = [
    ...autoSizes.map((s) => ({ size: s, added: false })),
    ...addList.filter((s) => !autoSizes.some((a) => snapNorm(a) === snapNorm(s))).map((s) => ({ size: s, added: true })),
  ];

  const unitLabel = unit === 'ct' ? '₹ per carat' : unit === 'pkt' ? '₹ per piece · packet sold' : `₹ per ${unit}`;

  return (
    <section className="ad-card ad-card-pad">
      <div className="pr-editor-top">
        <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={onBack}>← {cat.name} colours</button>
        <span className="ad-muted" style={{ fontSize: 13 }}>
          {cat.name}{multiGrade && gradeName ? ` · ${gradeName}` : ''} · <b>{colourName}</b>
        </span>
        <span className="pr-editor-spacer" />
        {flash && <span className="pr-flash">✓ Saved — live in the Sales App</span>}
        <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={onExport}>⬇ Excel — {colourName}</button>
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
              const auto = autoRate(size);
              const autoPcs = autoPcsOf(size);
              const r = resolve(size, auto);
              const pcsVal = ovr.pcs?.[snapNorm(size)] ?? autoPcs;
              const pcsCustom = ovr.pcs?.[snapNorm(size)] != null;
              const note =
                r.source === 'own'
                  ? colSpecific ? `custom for ${colourName}` : 'custom · overrides auto'
                  : r.source === 'inherit'
                    ? 'from All-colours rate'
                    : snapFor(size) ? 'live Sales App price' : 'auto from base × size multiplier';
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
