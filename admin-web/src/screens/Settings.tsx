import { useEffect, useState } from 'react';
import { adminApi, type StoreRules } from '../lib/api';

// The trading rules the storefront applies. In the prototype every input here
// was `defaultValue` and the Save button had no handler, so nothing typed on
// this screen ever left the browser.

// The storefront's language set, matching the original panel's chips.
const LANGS = ['English', 'हिन्दी', 'मराठी', 'ગુજરાતી', 'தமிழ்', 'తెలుగు', 'ಕನ್ನಡ'];

const PAYMENTS: [string, string][] = [
  ['cash', 'Cash (until CRM sets terms)'],
  ['upi', 'UPI'],
  ['bank', 'Bank transfer'],
];

const ACCESS: { key: 'inviteOnly' | 'watermarkPriceSheets' | 'noindex'; label: string }[] = [
  { key: 'inviteOnly', label: 'Invite-only — catalog hidden until login' },
  { key: 'watermarkPriceSheets', label: 'Watermark price sheets with customer code' },
  { key: 'noindex', label: 'Hidden from search engines (noindex)' },
];

function Toggle({ on, disabled, onClick }: { on: boolean; disabled?: boolean; onClick: () => void }) {
  return <button type="button" className={`ad-toggle ${on ? 'on' : ''}`} disabled={disabled} onClick={onClick} aria-label="toggle" />;
}

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

  const setNum = (k: keyof StoreRules, v: string) =>
    setRules((r) => ({ ...(r ?? {}), [k]: v === '' ? undefined : Number(v) }));

  const save = async (patch?: Partial<StoreRules>) => {
    if (!rules && !patch) return;
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const merged = { ...(rules ?? {}), ...(patch ?? {}) };
      // Strip anything that is not a finite number / real value so the API
      // never receives NaN from a half-typed field.
      const clean: StoreRules = {};
      for (const [k, v] of Object.entries(merged) as [keyof StoreRules, unknown][]) {
        if (typeof v === 'number' && !Number.isFinite(v)) continue;
        if (v === undefined || v === null || v === '') continue;
        (clean as Record<string, unknown>)[k] = v;
      }
      const next = await adminApi.saveRules(clean);
      setRules(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  if (!rules && !error) return <div className="ad-body ad-muted">Loading settings…</div>;

  // Reference-value defaults for the decorative state: all languages on, all
  // access switches on — until the operator saves their own choice.
  const langs = rules?.languages ?? LANGS;
  const accessOn = (k: (typeof ACCESS)[number]['key']) => rules?.[k] ?? true;

  const toggleLang = (l: string) => {
    const next = langs.includes(l) ? langs.filter((x) => x !== l) : [...langs, l];
    void save({ languages: next });
  };

  const NumField = ({ k, label }: { k: keyof StoreRules; label: string }) => (
    <label>
      <span className="ad-label">{label}</span>
      <input
        className="ad-input"
        style={{ width: '100%', maxWidth: 200 }}
        type="number"
        value={(rules?.[k] as number | undefined) ?? ''}
        onChange={(e) => setNum(k, e.target.value)}
        placeholder="Built-in default"
      />
    </label>
  );

  return (
    <div className="ad-body">
      <div className="ad-pagehead">
        <h2>Store settings</h2>
        <p className="ad-muted">Commerce rules, taxes, languages &amp; access</p>
      </div>

      {error && <div className="ad-error">{error}</div>}

      <div style={{ display: 'grid', gap: 16 }}>
        <section className="ad-card ad-card-pad">
          <h3 className="ad-sechead-h" style={{ margin: '0 0 14px' }}>Commerce rules</h3>
          <div className="ad-grid2" style={{ rowGap: 14 }}>
            <NumField k="minOrderValue" label="Minimum order value (₹)" />
            <NumField k="courierFlat" label="Courier charge below min-free (₹)" />
            <NumField k="courierFreeOver" label="Free courier above (₹)" />
            <NumField k="rfqMinValue" label="RFQ minimum (₹)" />
            <label>
              <span className="ad-label">GST %</span>
              <input
                className="ad-input"
                style={{ width: '100%', maxWidth: 200 }}
                type="number"
                step={0.5}
                value={rules?.gstRate !== undefined ? Math.round(rules.gstRate * 1000) / 10 : ''}
                onChange={(e) =>
                  setRules((r) => ({
                    ...(r ?? {}),
                    gstRate: e.target.value === '' ? undefined : Number(e.target.value) / 100,
                  }))
                }
                placeholder="Built-in default"
              />
            </label>
            <label>
              <span className="ad-label">Default payment</span>
              <select
                className="ad-input"
                style={{ width: '100%', maxWidth: 220 }}
                value={rules?.defaultPayment ?? 'cash'}
                onChange={(e) => setRules((r) => ({ ...(r ?? {}), defaultPayment: e.target.value }))}
              >
                {PAYMENTS.map(([id, lbl]) => (
                  <option key={id} value={id}>
                    {lbl}
                  </option>
                ))}
              </select>
            </label>
            <NumField k="dispatchWorkingDays" label="Dispatch days (domestic)" />
            <NumField k="exportDispatchDays" label="Dispatch days (export)" />
          </div>
          <div className="ad-row" style={{ marginTop: 16 }}>
            <button className="ad-btn ad-btn-acc" onClick={() => void save()} disabled={busy}>
              {busy ? 'Saving…' : 'Save rules'}
            </button>
            {saved && <span className="ad-hint">Saved ✓</span>}
          </div>
        </section>

        <section className="ad-card ad-card-pad">
          <h3 className="ad-sechead-h" style={{ margin: '0 0 12px' }}>Languages</h3>
          <div className="ad-chips">
            {LANGS.map((l) => (
              <button
                key={l}
                type="button"
                className={`ad-chip ${langs.includes(l) ? 'soft-sel' : ''}`}
                disabled={busy}
                onClick={() => toggleLang(l)}
              >
                {l}
              </button>
            ))}
          </div>
        </section>

        <section className="ad-card ad-card-pad">
          <h3 className="ad-sechead-h" style={{ margin: '0 0 12px' }}>Access &amp; security</h3>
          {ACCESS.map((a) => (
            <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Toggle on={accessOn(a.key)} disabled={busy} onClick={() => void save({ [a.key]: !accessOn(a.key) })} />
              <span style={{ fontSize: 13.5 }}>{a.label}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
