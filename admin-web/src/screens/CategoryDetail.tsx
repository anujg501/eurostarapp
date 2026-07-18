import { useEffect, useState } from 'react';
import { adminApi, type Category, type Colour, type Grade } from '../lib/api';

// Grades, colours and shapes for one category. In the prototype "＋ Add grade",
// "Remove" and "Save grades" had no onClick at all, and the colour/shape chips
// wrote to localStorage. These write to the overlay endpoints the storefront
// already reads.
export function CategoryDetail({ cat, onBack }: { cat: Category; onBack: () => void }) {
  const [grades, setGrades] = useState<Grade[] | null>(null);
  const [colours, setColours] = useState<Colour[]>([]);
  const [shapes, setShapes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState('');

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

  return (
    <div className="ad-body">
      <div className="ad-pagehead ad-head-row">
        <div>
          <h2>{cat.name}</h2>
          <p className="ad-muted">
            Grades, colours and shapes · {cat.unit.toUpperCase()} · {cat.count} SKUs
          </p>
        </div>
        <button className="ad-btn ad-btn-ghost" onClick={onBack}>
          ← Back to catalog
        </button>
      </div>

      {error && <div className="ad-error">{error}</div>}

      {cat.skipGrade ? (
        <div className="ad-card ad-card-pad ad-muted">This category is marked “no grades”, so grades are not used here.</div>
      ) : (
        <Grades grades={grades} busy={busy} saved={saved === 'grades'} onSave={saveGrades} />
      )}

      <Colours colours={colours} busy={busy} saved={saved === 'colours'} onSave={saveColours} />
      <Shapes shapes={shapes} busy={busy} saved={saved === 'shapes'} onSave={saveShapes} />
    </div>
  );
}

function Grades({
  grades,
  busy,
  saved,
  onSave,
}: {
  grades: Grade[] | null;
  busy: boolean;
  saved: boolean;
  onSave: (g: Grade[]) => void;
}) {
  const [draft, setDraft] = useState<Grade[]>([]);
  useEffect(() => setDraft(grades ?? []), [grades]);

  const set = (i: number, patch: Partial<Grade>) =>
    setDraft((xs) => xs.map((g, j) => (j === i ? { ...g, ...patch } : g)));

  const add = () =>
    setDraft((xs) => [...xs, { id: `g${Date.now()}`, name: '', tier: '', basePrice: 0, unit: '' }]);

  const remove = (i: number) => setDraft((xs) => xs.filter((_, j) => j !== i));

  if (!grades) return <section className="ad-card ad-card-pad ad-muted">Loading grades…</section>;

  return (
    <section className="ad-card ad-card-pad">
      <h3 className="ad-sechead-h">Custom grades</h3>
      <p className="ad-muted">
        Grades added here appear <em>in addition to</em> this category’s built-in grades. The built-in ones still live in
        the Sales App’s own data file, so they are not listed or editable here yet.
      </p>

      {draft.length === 0 && <p className="ad-hint">No custom grades added.</p>}

      {draft.map((g, i) => (
        <div className="ad-row" key={g.id} style={{ marginTop: 10 }}>
          <input
            className="ad-input"
            style={{ flex: 2, minWidth: 140 }}
            value={g.name}
            onChange={(e) => set(i, { name: e.target.value })}
            placeholder="Grade name, e.g. DEF White"
          />
          <input
            className="ad-input"
            style={{ flex: 1, minWidth: 110 }}
            value={g.tier ?? ''}
            onChange={(e) => set(i, { tier: e.target.value })}
            placeholder="Tier"
          />
          <input
            className="ad-input ad-num"
            type="number"
            min={0}
            value={g.basePrice ?? 0}
            onChange={(e) => set(i, { basePrice: Number(e.target.value) || 0 })}
            placeholder="Base ₹"
          />
          <button className="ad-btn ad-btn-ghost ad-btn-sm ad-danger" onClick={() => remove(i)}>
            Remove
          </button>
        </div>
      ))}

      <div className="ad-actions">
        <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={add}>
          ＋ Add grade
        </button>
        {saved && <span className="ad-ok">Saved ✓</span>}
        <button className="ad-btn ad-btn-pri ad-btn-sm" disabled={busy} onClick={() => onSave(draft)}>
          {busy ? 'Saving…' : 'Save grades'}
        </button>
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

      <div className="ad-chips" style={{ marginTop: 8 }}>
        {colours.length === 0 && <span className="ad-hint">None added.</span>}
        {colours.map((c) => (
          <span className="ad-chip" key={c.id}>
            <i className="ad-sw" style={{ background: c.hex || '#ccc' }} />
            {c.name}
            <button
              className="ad-btn ad-btn-ghost ad-btn-sm"
              style={{ padding: '0 4px', border: 'none' }}
              disabled={busy}
              onClick={() => onSave(colours.filter((x) => x.id !== c.id))}
              aria-label={`Remove ${c.name}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="ad-row" style={{ marginTop: 12 }}>
        <input className="ad-input" style={{ flex: 1, minWidth: 150 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Colour name" />
        <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} style={{ width: 42, height: 34, border: 'none', background: 'none' }} />
        <button className="ad-btn ad-btn-ghost ad-btn-sm" disabled={busy || !name.trim()} onClick={add}>
          ＋ Add colour
        </button>
        {saved && <span className="ad-ok">Saved ✓</span>}
      </div>
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

      <div className="ad-chips" style={{ marginTop: 8 }}>
        {shapes.length === 0 && <span className="ad-hint">None added.</span>}
        {shapes.map((s) => (
          <span className="ad-chip" key={s}>
            {s}
            <button
              className="ad-btn ad-btn-ghost ad-btn-sm"
              style={{ padding: '0 4px', border: 'none' }}
              disabled={busy}
              onClick={() => onSave(shapes.filter((x) => x !== s))}
              aria-label={`Remove ${s}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="ad-row" style={{ marginTop: 12 }}>
        <input className="ad-input" style={{ flex: 1, minWidth: 150 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Shape name, e.g. cushion" />
        <button className="ad-btn ad-btn-ghost ad-btn-sm" disabled={busy || !name.trim()} onClick={add}>
          ＋ Add shape
        </button>
        {saved && <span className="ad-ok">Saved ✓</span>}
      </div>
    </section>
  );
}
