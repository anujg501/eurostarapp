import { useEffect, useState } from 'react';
import { adminApi, type Category, type NewCategory, type Unit } from '../lib/api';
import { CategoryDetail } from './CategoryDetail';

const UNITS: { id: Unit; label: string }[] = [
  { id: 'pc', label: 'Piece' },
  { id: 'ct', label: 'Carat' },
  { id: 'pkt', label: 'Packet' },
  { id: 'strip', label: 'Strip' },
];

const unitLabel = (u: string) => UNITS.find((x) => x.id === u)?.label ?? u;

export function Catalog() {
  const [cats, setCats] = useState<Category[] | null>(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<Category | null>(null);
  const [busyKey, setBusyKey] = useState('');

  const load = async () => {
    setError('');
    try {
      setCats(await adminApi.categories());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the catalogue.');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggleHidden = async (c: Category) => {
    setBusyKey(c.key);
    setError('');
    try {
      const updated = await adminApi.updateCategory(c.key, { hidden: !c.hidden });
      setCats((xs) => (xs ?? []).map((x) => (x.key === c.key ? updated : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the category.');
    } finally {
      setBusyKey('');
    }
  };

  const remove = async (c: Category) => {
    if (!confirm(`Delete "${c.name}"? This removes it from the catalogue for everyone.`)) return;
    setBusyKey(c.key);
    setError('');
    try {
      await adminApi.deleteCategory(c.key);
      setCats((xs) => (xs ?? []).filter((x) => x.key !== c.key));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete the category.');
    } finally {
      setBusyKey('');
    }
  };

  if (adding) {
    return (
      <CreateCategory
        onCancel={() => setAdding(false)}
        onCreated={(c) => {
          setCats((xs) => [...(xs ?? []), c]);
          setAdding(false);
        }}
      />
    );
  }

  if (open) {
    return <CategoryDetail cat={open} onBack={() => setOpen(null)} />;
  }

  return (
    <div className="ad-body">
      <div className="ad-pagehead ad-head-row">
        <div>
          <h2>Catalog</h2>
          <p className="ad-muted">
            {cats ? `${cats.length} categories · live in the storefront` : 'Loading…'}
          </p>
        </div>
        <button className="ad-btn ad-btn-pri" onClick={() => setAdding(true)}>
          ＋ Create new category
        </button>
      </div>

      {error && <div className="ad-error">{error}</div>}

      {!cats ? (
        <div className="ad-muted">Loading the catalogue…</div>
      ) : cats.length === 0 ? (
        <div className="ad-muted">No categories yet. Create the first one.</div>
      ) : (
        <div className="ad-cats">
          {cats.map((c) => (
            <div key={c.key} className="ad-cat" style={{ opacity: c.hidden ? 0.55 : 1 }} onClick={() => setOpen(c)}>
              <div className="nm">{c.name}</div>
              <div className="bl">{c.blurb || 'No description yet.'}</div>
              <div className="ft">
                <span className="ad-tag">{c.unit.toUpperCase()} · {unitLabel(c.unit)}</span>
                <span className="ct">{c.count} SKUs</span>
              </div>
              <div className="ad-cat-actions" onClick={(e) => e.stopPropagation()}>
                <button className="ad-btn ad-btn-ghost ad-btn-sm" disabled={busyKey === c.key} onClick={() => toggleHidden(c)}>
                  {c.hidden ? 'Hidden from app' : 'Live on app'}
                </button>
                <button className="ad-btn ad-btn-ghost ad-btn-sm ad-danger" disabled={busyKey === c.key} onClick={() => remove(c)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateCategory({ onCancel, onCreated }: { onCancel: () => void; onCreated: (c: Category) => void }) {
  const [f, setF] = useState<NewCategory>({
    name: '',
    short: '',
    blurb: '',
    unit: 'pc',
    origin: '',
    skipGrade: false,
    count: 0,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof NewCategory>(k: K, v: NewCategory[K]) => setF((x) => ({ ...x, [k]: v }));

  const submit = async () => {
    if (!f.name.trim()) {
      setError('Give the category a name.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      // The old wizard showed a success tick here and threw the form away.
      // This waits for the server and only reports success if it saved.
      const created = await adminApi.createCategory({ ...f, name: f.name.trim() });
      onCreated(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the category.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ad-body">
      <div className="ad-pagehead">
        <h2>Create a new category</h2>
        <p className="ad-muted">This defines how the category behaves in the Sales App.</p>
      </div>

      <div className="ad-card ad-card-pad">
        <label className="ad-label">
          Name
          <input className="ad-input" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Moissanite Diamonds" />
        </label>

        <label className="ad-label">
          Short name
          <input className="ad-input" value={f.short} onChange={(e) => set('short', e.target.value)} placeholder="Shown on the category card" />
        </label>

        <label className="ad-label">
          Short description
          <textarea className="ad-input" rows={3} value={f.blurb} onChange={(e) => set('blurb', e.target.value)} placeholder="One line customers read under the name" />
        </label>

        <div className="ad-label">
          Sold by
          <div className="ad-chips">
            {UNITS.map((u) => (
              <button
                key={u.id}
                type="button"
                className={`ad-chip ${f.unit === u.id ? 'sel' : ''}`}
                onClick={() => set('unit', u.id)}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <label className="ad-label">
          Origin
          <input className="ad-input" value={f.origin} onChange={(e) => set('origin', e.target.value)} placeholder="e.g. Synthetic / Natural" />
        </label>

        <label className="ad-label">
          SKU count shown on the card
          <input
            className="ad-input"
            type="number"
            min={0}
            value={f.count ?? 0}
            onChange={(e) => set('count', Number(e.target.value) || 0)}
          />
        </label>

        <label className="ad-check">
          <input type="checkbox" checked={!!f.skipGrade} onChange={(e) => set('skipGrade', e.target.checked)} />
          <span>This category has no grades</span>
        </label>

        {error && <div className="ad-error">{error}</div>}

        <div className="ad-actions">
          <button className="ad-btn ad-btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="ad-btn ad-btn-pri" onClick={submit} disabled={busy}>
            {busy ? 'Creating…' : 'Create category'}
          </button>
        </div>
      </div>
    </div>
  );
}
