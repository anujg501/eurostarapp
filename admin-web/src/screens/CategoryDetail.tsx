import { useEffect, useState } from 'react';
import {
  adminApi,
  GRADE_SCOPED,
  GRADE_SCOPED_GRADES,
  GRADE_SCOPED_COLOURS,
  type Category,
  type Colour,
  type Grade,
  type Product,
} from '../lib/api';

// Grades, colours and shapes for one category. In the prototype "＋ Add grade",
// "Remove" and "Save grades" had no onClick at all, and the colour/shape chips
// wrote to localStorage. These write to the overlay endpoints the storefront
// already reads. Laid out as the client's reference: header with the unit /
// grades / colours / shapes meta, pill tabs, and one card per tab — including
// Pricing and Availability, which edit this category's SKUs in place.

const UNIT_LONG: Record<string, string> = { pc: 'per piece', ct: 'per carat', pkt: 'per packet', strip: 'per strip' };

type Tab = 'grades' | 'colours' | 'shapes' | 'availability';

// onDeleted: the catalogue cards no longer carry a Delete button (they match
// the original panel's toggle-only cards), so deletion lives here instead.
export function CategoryDetail({ cat, onBack, onDeleted }: { cat: Category; onBack: () => void; onDeleted?: () => void }) {
  const [grades, setGrades] = useState<Grade[] | null>(null);
  const [colours, setColours] = useState<Colour[]>([]);
  const [shapes, setShapes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState('');
  const [tab, setTab] = useState<Tab>(cat.skipGrade ? 'colours' : 'grades');
  // Bumped by the header's "＋ Add grade"; the grades editor appends a row.
  const [addSignal, setAddSignal] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [g, c, s] = await Promise.all([adminApi.grades(), adminApi.colours(), adminApi.shapes()]);
        setGrades(g[cat.key] ?? []);
        setColours(c[cat.key] ?? []);
        setShapes(s[cat.key] ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load this category.');
      }
    })();
  }, [cat.key]);

  const flash = (what: string) => {
    setSaved(what);
    setTimeout(() => setSaved(''), 1800);
  };

  // Each overlay is a whole map keyed by category, so read-modify-write the one
  // key rather than clobbering the other categories.
  const saveGrades = async (next: Grade[]) => {
    setBusy(true);
    setError('');
    try {
      const all = await adminApi.grades();
      await adminApi.saveGrades({ ...all, [cat.key]: next });
      setGrades(next);
      flash('grades');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the grades.');
    } finally {
      setBusy(false);
    }
  };

  const saveColours = async (next: Colour[]) => {
    setBusy(true);
    setError('');
    try {
      const all = await adminApi.colours();
      await adminApi.saveColours({ ...all, [cat.key]: next });
      setColours(next);
      flash('colours');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the colours.');
    } finally {
      setBusy(false);
    }
  };

  const saveShapes = async (next: string[]) => {
    setBusy(true);
    setError('');
    try {
      const all = await adminApi.shapes();
      await adminApi.saveShapes({ ...all, [cat.key]: next });
      setShapes(next);
      flash('shapes');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the shapes.');
    } finally {
      setBusy(false);
    }
  };

  const TABS: [Tab, string][] = [
    ['grades', 'Grades'],
    ['colours', 'Colours'],
    ['shapes', 'Shapes'],
    ['availability', 'Availability'],
  ];

  // Grade-scoped categories (Lab Grown, etc.) have their grades and a DIFFERENT
  // colour set per grade defined in the shop code — not the flat overlay. Show
  // those so the colours are separated by sub-category instead of clubbed.
  const scoped = !!GRADE_SCOPED[cat.key];
  const scopedGrades = GRADE_SCOPED_GRADES[cat.key] ?? [];
  const coloursForGrade = (gid: string): Colour[] => GRADE_SCOPED_COLOURS[cat.key]?.[gid] ?? colours;
  const gradeCount = scoped ? scopedGrades.length : grades?.length ?? 0;
  const colourCount = scoped ? scopedGrades.reduce((n, g) => n + coloursForGrade(g.id).length, 0) : colours.length;

  return (
    <div className="ad-body">
      <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={onBack} style={{ marginBottom: 12 }}>
        ← Back to catalog
      </button>

      <div className="ad-pagehead ad-head-row" style={{ marginBottom: 12 }}>
        <div>
          <h2>{cat.name}</h2>
          <p className="ad-muted">
            Unit of sale: {cat.unit.toUpperCase()} ({UNIT_LONG[cat.unit] ?? cat.unit}) · {gradeCount} grades ·{' '}
            {colourCount} colours · {shapes.length} shapes
          </p>
        </div>
        <div className="ad-row">
          <button
            className="ad-btn ad-btn-ghost ad-danger"
            disabled={busy}
            onClick={async () => {
              if (!confirm(`Delete "${cat.name}"? This removes it from the catalogue for everyone.`)) return;
              setBusy(true);
              setError('');
              try {
                await adminApi.deleteCategory(cat.key);
                onDeleted?.();
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Could not delete the category.');
              } finally {
                setBusy(false);
              }
            }}
          >
            Delete category
          </button>
          {!cat.skipGrade && !scoped && (
            <button
              className="ad-btn ad-btn-acc"
              onClick={() => {
                setTab('grades');
                setAddSignal((n) => n + 1);
              }}
            >
              ＋ Add grade
            </button>
          )}
        </div>
      </div>

      <div className="cd-tabs">
        {TABS.map(([id, label]) => (
          <button key={id} className={`cd-tab ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {error && <div className="ad-error">{error}</div>}

      {tab === 'grades' &&
        (cat.skipGrade ? (
          <div className="ad-card ad-card-pad ad-muted">This category is marked “no grades”, so grades are not used here.</div>
        ) : scoped ? (
          <GradesReadOnly grades={scopedGrades} coloursForGrade={coloursForGrade} />
        ) : (
          <Grades grades={grades} defaultUnit={cat.unit} busy={busy} saved={saved === 'grades'} onSave={saveGrades} addSignal={addSignal} />
        ))}
      {tab === 'colours' &&
        (scoped ? (
          <ColoursByGrade grades={scopedGrades} coloursForGrade={coloursForGrade} />
        ) : (
          <Colours colours={colours} busy={busy} saved={saved === 'colours'} onSave={saveColours} />
        ))}
      {tab === 'shapes' && <Shapes shapes={shapes} busy={busy} saved={saved === 'shapes'} onSave={saveShapes} />}
      {tab === 'availability' && <ProductEditor cat={cat} mode="availability" />}
    </div>
  );
}

function Grades({
  grades,
  defaultUnit,
  busy,
  saved,
  onSave,
  addSignal,
}: {
  grades: Grade[] | null;
  defaultUnit: string;
  busy: boolean;
  saved: boolean;
  onSave: (g: Grade[]) => void;
  addSignal: number;
}) {
  const [draft, setDraft] = useState<Grade[]>([]);
  useEffect(() => setDraft(grades ?? []), [grades]);

  const set = (i: number, patch: Partial<Grade>) =>
    setDraft((xs) => xs.map((g, j) => (j === i ? { ...g, ...patch } : g)));

  const add = () =>
    setDraft((xs) => [...xs, { id: `g${Date.now()}`, name: '', tier: '', desc: '', basePrice: 0, unit: defaultUnit }]);

  // Header's "＋ Add grade" — append once per bump, skip the initial mount.
  useEffect(() => {
    if (addSignal > 0) add();
  }, [addSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  const remove = (i: number) => setDraft((xs) => xs.filter((_, j) => j !== i));

  if (!grades) return <section className="ad-card ad-card-pad ad-muted">Loading grades…</section>;

  return (
    <section className="ad-card">
      <div className="cd-scroll">
        <table className="ad-table cd-table">
          <thead>
            <tr>
              <th>Grade / sub-category</th>
              <th>Tier</th>
              <th>Description</th>
              <th style={{ textAlign: 'right' }}>Base ₹</th>
              <th>Unit</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {draft.length === 0 && (
              <tr>
                <td colSpan={6} className="ad-muted" style={{ textAlign: 'center', padding: '22px 16px' }}>
                  No grades yet — use “＋ Add grade”.
                </td>
              </tr>
            )}
            {draft.map((g, i) => (
              <tr key={g.id}>
                <td style={{ minWidth: 160 }}>
                  <input className="ad-input" style={{ width: '100%' }} value={g.name} onChange={(e) => set(i, { name: e.target.value })} placeholder="e.g. DEF White" />
                </td>
                <td style={{ minWidth: 120 }}>
                  <input className="ad-input" style={{ width: '100%' }} value={g.tier ?? ''} onChange={(e) => set(i, { tier: e.target.value })} placeholder="e.g. High quality" />
                </td>
                <td style={{ minWidth: 220 }}>
                  <input className="ad-input" style={{ width: '100%' }} value={g.desc ?? ''} onChange={(e) => set(i, { desc: e.target.value })} placeholder="Shown under the grade in the app" />
                </td>
                <td style={{ minWidth: 90 }}>
                  <input
                    className="ad-input ad-num"
                    style={{ width: '100%', textAlign: 'right' }}
                    type="number"
                    min={0}
                    value={g.basePrice ?? 0}
                    onChange={(e) => set(i, { basePrice: Number(e.target.value) || 0 })}
                  />
                </td>
                <td>
                  <span className="ad-tag">{(g.unit || defaultUnit).toUpperCase()}</span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="ad-btn ad-btn-ghost ad-btn-sm ad-danger" onClick={() => remove(i)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ad-row" style={{ padding: '12px 16px', borderTop: '1px solid var(--divider)' }}>
        <button className="ad-btn ad-btn-acc ad-btn-sm" disabled={busy} onClick={() => onSave(draft)}>
          {busy ? 'Saving…' : 'Save grades'}
        </button>
        {saved && <span className="ad-ok">Saved ✓</span>}
      </div>
    </section>
  );
}

function Colours({
  colours,
  busy,
  saved,
  onSave,
}: {
  colours: Colour[];
  busy: boolean;
  saved: boolean;
  onSave: (c: Colour[]) => void;
}) {
  const [name, setName] = useState('');
  const [hex, setHex] = useState('#cccccc');

  const add = () => {
    const n = name.trim();
    if (!n) return;
    const id = n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (colours.some((c) => c.id === id)) return;
    onSave([...colours, { id, name: n, hex }]);
    setName('');
  };

  return (
    <section className="ad-card ad-card-pad">
      <h3 className="ad-sechead-h">Colours</h3>
      <p className="ad-muted">Extra colours offered in this category, on top of the built-in tones.</p>

      <div className="ad-chips" style={{ marginTop: 10 }}>
        {colours.length === 0 && <span className="ad-hint">None added.</span>}
        {colours.map((c) => (
          <span className="ad-chip cd-chip" key={c.id}>
            <i className="ad-sw" style={{ background: c.hex || '#ccc' }} />
            {c.name}
            <button
              className="cd-chip-x"
              disabled={busy}
              onClick={() => onSave(colours.filter((x) => x.id !== c.id))}
              aria-label={`Remove ${c.name}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="ad-row" style={{ marginTop: 14 }}>
        <input className="ad-input" style={{ flex: 1, minWidth: 150 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Colour name" onKeyDown={(e) => e.key === 'Enter' && add()} />
        <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} style={{ width: 42, height: 34, border: 'none', background: 'none', cursor: 'pointer' }} aria-label="Colour swatch" />
        <button className="ad-btn ad-btn-ghost ad-btn-sm" disabled={busy || !name.trim()} onClick={add}>
          ＋ Add colour
        </button>
        {saved && <span className="ad-ok">Saved ✓</span>}
      </div>
    </section>
  );
}

// Grade-scoped categories: the sub-categories (grades) come from the shop, not
// the editable overlay, so show them read-only with each one's colour count.
function GradesReadOnly({
  grades,
  coloursForGrade,
}: {
  grades: { id: string; name: string }[];
  coloursForGrade: (gid: string) => Colour[];
}) {
  return (
    <section className="ad-card ad-card-pad">
      <h3 className="ad-sechead-h">Sub-categories (grades)</h3>
      <p className="ad-muted">
        This category has {grades.length} sub-categories, each with its own colours & pricing. These come from the
        shop and are managed in code — edit prices under Pricing.
      </p>
      <div className="ad-chips" style={{ marginTop: 12 }}>
        {grades.map((g) => (
          <span className="ad-chip cd-chip" key={g.id}>
            {g.name}
            <span className="ad-tag" style={{ marginLeft: 8 }}>{coloursForGrade(g.id).length} colours</span>
          </span>
        ))}
      </div>
    </section>
  );
}

// Colours shown separated under each grade (sub-category), so Lab Grown's
// Beryl / Created / Corundum colours are never clubbed into one flat list.
function ColoursByGrade({
  grades,
  coloursForGrade,
}: {
  grades: { id: string; name: string }[];
  coloursForGrade: (gid: string) => Colour[];
}) {
  return (
    <section className="ad-card ad-card-pad">
      <h3 className="ad-sechead-h">Colours by sub-category</h3>
      <p className="ad-muted">
        Each sub-category (grade) offers its own colours — shown separately below, exactly as on the shop.
      </p>
      {grades.map((g) => {
        const cols = coloursForGrade(g.id);
        return (
          <div key={g.id} style={{ marginTop: 18 }}>
            <div className="th-head">
              <h4 className="ad-sechead-h" style={{ fontSize: 15 }}>{g.name}</h4>
              <span className="th-count">{cols.length} colours</span>
            </div>
            <div className="ad-chips" style={{ marginTop: 8 }}>
              {cols.length === 0 && <span className="ad-hint">No colours listed.</span>}
              {cols.map((c) => (
                <span className="ad-chip cd-chip" key={c.id}>
                  <i className="ad-sw" style={{ background: c.hex || '#ccc' }} />
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function Shapes({
  shapes,
  busy,
  saved,
  onSave,
}: {
  shapes: string[];
  busy: boolean;
  saved: boolean;
  onSave: (s: string[]) => void;
}) {
  const [name, setName] = useState('');

  const add = () => {
    const n = name.trim();
    if (!n || shapes.includes(n)) return;
    onSave([...shapes, n]);
    setName('');
  };

  return (
    <section className="ad-card ad-card-pad">
      <h3 className="ad-sechead-h">Shapes</h3>
      <p className="ad-muted">Extra shapes offered in this category.</p>

      <div className="ad-chips" style={{ marginTop: 10 }}>
        {shapes.length === 0 && <span className="ad-hint">None added.</span>}
        {shapes.map((s) => (
          <span className="ad-chip cd-chip" key={s}>
            {s}
            <button className="cd-chip-x" disabled={busy} onClick={() => onSave(shapes.filter((x) => x !== s))} aria-label={`Remove ${s}`}>
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="ad-row" style={{ marginTop: 14 }}>
        <input className="ad-input" style={{ flex: 1, minWidth: 150 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Shape name, e.g. cushion" onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button className="ad-btn ad-btn-ghost ad-btn-sm" disabled={busy || !name.trim()} onClick={add}>
          ＋ Add shape
        </button>
        {saved && <span className="ad-ok">Saved ✓</span>}
      </div>
    </section>
  );
}

/** Pricing / Availability tabs: this category's SKUs, edited row by row via the
 *  existing product update endpoint. */
function ProductEditor({ cat, mode }: { cat: Category; mode: 'pricing' | 'availability' }) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [savedId, setSavedId] = useState('');
  const [draft, setDraft] = useState<Record<string, Partial<Product>>>({});

  useEffect(() => {
    (async () => {
      try {
        setProducts(await adminApi.products(cat.key));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load this category’s products.');
      }
    })();
  }, [cat.key]);

  const val = <K extends keyof Product>(p: Product, k: K): Product[K] =>
    (draft[p.id]?.[k] as Product[K]) ?? p[k];

  const edit = (id: string, patch: Partial<Product>) =>
    setDraft((d) => ({ ...d, [id]: { ...d[id], ...patch } }));

  const save = async (p: Product) => {
    const patch = draft[p.id];
    if (!patch) return;
    setBusyId(p.id);
    setError('');
    try {
      const updated = await adminApi.updateProduct(p.id, patch);
      setProducts((xs) => (xs ?? []).map((x) => (x.id === p.id ? updated : x)));
      setDraft((d) => {
        const { [p.id]: _gone, ...rest } = d;
        return rest;
      });
      setSavedId(p.id);
      setTimeout(() => setSavedId(''), 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusyId('');
    }
  };

  if (!products) return <section className="ad-card ad-card-pad ad-muted">Loading products…</section>;
  if (products.length === 0)
    return (
      <section className="ad-card ad-card-pad ad-muted">
        No SKUs in this category yet — add them from the Bulk upload page.
      </section>
    );

  return (
    <section className="ad-card">
      {error && <div className="ad-error" style={{ margin: 16 }}>{error}</div>}
      <div className="cd-scroll">
        <table className="ad-table cd-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Size</th>
              {mode === 'pricing' ? (
                <th style={{ textAlign: 'right' }}>Price ₹</th>
              ) : (
                <>
                  <th>Stock</th>
                  <th style={{ textAlign: 'right' }}>Count</th>
                </>
              )}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div className="ad-hint" style={{ marginTop: 0 }}>{p.id}</div>
                </td>
                <td className="ad-muted">{p.size || '—'}</td>
                {mode === 'pricing' ? (
                  <td style={{ minWidth: 110 }}>
                    <input
                      className="ad-input ad-num"
                      style={{ width: '100%', textAlign: 'right' }}
                      type="number"
                      min={0}
                      value={Number(val(p, 'price')) || 0}
                      onChange={(e) => edit(p.id, { price: Number(e.target.value) || 0 })}
                    />
                  </td>
                ) : (
                  <>
                    <td style={{ minWidth: 110 }}>
                      <select
                        className="ad-input"
                        value={String(val(p, 'stock') ?? 'in')}
                        onChange={(e) => edit(p.id, { stock: e.target.value as Product['stock'] })}
                      >
                        <option value="in">In stock</option>
                        <option value="low">Low</option>
                        <option value="out">Sold out</option>
                      </select>
                    </td>
                    <td style={{ minWidth: 90 }}>
                      <input
                        className="ad-input ad-num"
                        style={{ width: '100%', textAlign: 'right' }}
                        type="number"
                        min={0}
                        value={Number(val(p, 'stockCount')) || 0}
                        onChange={(e) => edit(p.id, { stockCount: Number(e.target.value) || 0 })}
                      />
                    </td>
                  </>
                )}
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {savedId === p.id && <span className="ad-ok" style={{ marginRight: 8 }}>Saved ✓</span>}
                  <button
                    className="ad-btn ad-btn-ghost ad-btn-sm"
                    disabled={busyId === p.id || !draft[p.id]}
                    onClick={() => save(p)}
                  >
                    {busyId === p.id ? 'Saving…' : 'Save'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
