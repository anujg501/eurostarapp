import { useEffect, useState } from 'react';
import { adminApi, type StoreRules } from '../lib/api';

// The trading rules the storefront applies. In the prototype every input here
// was `defaultValue` and the Save button had no handler, so nothing typed on
// this screen ever left the browser.
const FIELDS: { key: keyof StoreRules; label: string; hint: string; step?: number }[] = [
  { key: 'minOrderValue', label: 'Minimum order value (₹)', hint: 'Cart cannot check out below this' },
  { key: 'gstRate', label: 'GST rate', hint: 'As a fraction — 0.03 means 3%. Waived on export orders', step: 0.01 },
  { key: 'courierFlat', label: 'Courier charge (₹)', hint: 'Flat courier fee' },
  { key: 'courierFreeOver', label: 'Free courier over (₹)', hint: 'Courier is free above this order value' },
  { key: 'dispatchWorkingDays', label: 'Dispatch days (domestic)', hint: 'Working days from today' },
  { key: 'exportDispatchDays', label: 'Dispatch days (export)', hint: 'Working days from today' },
  { key: 'rfqMinValue', label: 'RFQ minimum (₹)', hint: 'Minimum order value for a quote request' },
];

export function Settings() {
  const [rules, setRules] = useState<StoreRules | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setRules(await adminApi.rules());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load settings.');
      }
    })();
  }, []);

  const set = (k: keyof StoreRules, v: string) =>
    setRules((r) => ({ ...(r ?? {}), [k]: v === '' ? undefined : Number(v) }));

  const save = async () => {
    if (!rules) return;
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const clean: StoreRules = {};
      for (const { key } of FIELDS) {
        const v = rules[key];
        if (typeof v === 'number' && Number.isFinite(v)) clean[key] = v as never;
      }
      await adminApi.saveRules(clean);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  if (!rules && !error) return <div className="ad-body ad-muted">Loading settings…</div>;

  return (
    <div className="ad-body">
      <div className="ad-pagehead">
        <h2>Settings</h2>
        <p className="ad-muted">Trading rules the storefront applies to every cart.</p>
      </div>

      {error && <div className="ad-error">{error}</div>}

      <div className="ad-card ad-card-pad">
        {FIELDS.map((f) => (
          <label className="ad-label" key={String(f.key)}>
            {f.label}
            <input
              className="ad-input"
              type="number"
              step={f.step ?? 1}
              value={rules?.[f.key] ?? ''}
              onChange={(e) => set(f.key, e.target.value)}
              placeholder="Using the built-in default"
            />
            <span className="ad-hint">{f.hint}</span>
          </label>
        ))}

        <div className="ad-actions">
          <button className="ad-btn ad-btn-pri" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : saved ? 'Saved ✓' : 'Save rules'}
          </button>
        </div>
      </div>
    </div>
  );
}
