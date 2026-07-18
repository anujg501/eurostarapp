import { useEffect, useState } from 'react';
import { adminApi, type Category, type NewCategory, type Unit } from '../lib/api';
import { CategoryDetail } from './CategoryDetail';

const UNITS: { id: Unit; label: string }[] = [
  { id: 'pc', label: 'by piece' },
  { id: 'ct', label: 'by carat' },
  { id: 'pkt', label: 'by packet' },
  { id: 'strip', label: 'by strip' },
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

      {adding && (
        <CreateCategory
          onCancel={() => setAdding(false)}
          onCreated={(c) => {
            setCats((xs) => [...(xs ?? []), c]);
            setAdding(false);
          }}
        />
      )}

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
  const [f, setF] = useState<NewCategory>({ name: '', short: '', blurb: '', unit: 'pc' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof NewCategory>(k: K, v: NewCategory[K]) => setF((x) => ({ ...x, [k]: v }));

  const submit = async () => {
    if (!f.name.trim()) {
      setError('Category name is required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      // The prototype showed a success tick here and threw the form away. This
      // waits for the server and only reports success if it actually saved.
      // Fields the client dropped (origin, SKU count, skipGrade) are omitted;
      // the API defaults them and they stay editable via the API if needed.
      const created = await adminApi.createCategory({ ...f, name: f.name.trim() });
      onCreated(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the category.');
    } finally {
      setBusy(false);
    }
  };

  // Escape closes, matching normal dialog behaviour.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onCancel]);

  return (
    <div className="ad-modal-backdrop" onClick={() => !busy && onCancel()}>
      <div className="ad-modal" role="dialog" aria-modal="true" aria-label="Create new category" onClick={(e) => e.stopPropagation()}>
        <div className="ad-modal-head">
          <h2>Create new category</h2>
        </div>

        <div className="ad-modal-body">
          <div className="ad-field-v">
            <label className="ad-label" htmlFor="cc-name">Category name *</label>
            <input
              id="cc-name"
              className="ad-input"
              value={f.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Lab Grown Diamonds"
              autoFocus
            />
          </div>

          <div className="ad-field-v">
            <label className="ad-label" htmlFor="cc-short">Short name</label>
            <input
              id="cc-short"
              className="ad-input"
              value={f.short}
              onChange={(e) => set('short', e.target.value)}
              placeholder="e.g. Lab Diamonds"
            />
          </div>

          <div className="ad-field-v">
            <label className="ad-label" htmlFor="cc-unit">Unit of sale</label>
            <select id="cc-unit" className="ad-input" value={f.unit} onChange={(e) => set('unit', e.target.value as Unit)}>
              {UNITS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.id.toUpperCase()} — {u.label}
                </option>
              ))}
            </select>
          </div>

          <div className="ad-field-v">
            <label className="ad-label" htmlFor="cc-blurb">Short description</label>
            <textarea
              id="cc-blurb"
              className="ad-input"
              rows={3}
              value={f.blurb}
              onChange={(e) => set('blurb', e.target.value)}
              placeholder="Shown on the category card"
            />
          </div>

          {error && <div className="ad-error" style={{ marginBottom: 0 }}>{error}</div>}
        </div>

        <div className="ad-modal-foot">
          <button className="ad-btn ad-btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="ad-btn ad-btn-danger" onClick={submit} disabled={busy}>
            {busy ? 'Creating…' : 'Create category'}
          </button>
        </div>
      </div>
    </div>
  );
}
