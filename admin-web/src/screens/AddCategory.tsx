import { useState } from 'react';
import { adminApi, type Unit } from '../lib/api';

// The original panel's full-page "＋ Add category" questionnaire, restored.
// Only name / short / blurb / unit are persisted — the same fields the create
// API accepts. The other questions (price unit, image placement, layout,
// weight column) existed in the original as guidance for the operator and are
// kept for parity; they are not sent anywhere, exactly like before.
type Form = {
  name: string;
  short: string;
  blurb: string;
  sellUnit: Unit;
  priceUnit: 'pc' | 'ct' | 'pkt' | 'strip' | 'gram';
  imgColour: boolean;
  imgSizePad: boolean;
  imgHero: boolean;
  layout: 'standard' | 'custom';
  layoutNote: string;
  weightCol: boolean;
};

const unitLong: Record<string, string> = { pc: 'piece', ct: 'carat', pkt: 'packet', strip: 'strip', gram: 'gram' };

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return <button type="button" className={`ad-toggle ${on ? 'on' : ''}`} onClick={onClick} aria-label="toggle" />;
}

export function AddCategory({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState<Form>({
    name: '',
    short: '',
    blurb: '',
    sellUnit: 'pc',
    priceUnit: 'pc',
    imgColour: true,
    imgSizePad: true,
    imgHero: false,
    layout: 'standard',
    layoutNote: '',
    weightCol: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  const submit = async () => {
    if (!f.name.trim()) {
      setError('Category name is required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await adminApi.createCategory({ name: f.name.trim(), short: f.short, blurb: f.blurb, unit: f.sellUnit });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the category.');
    } finally {
      setBusy(false);
    }
  };

  const Radio = <K extends 'sellUnit' | 'priceUnit' | 'layout'>({ k, opts }: { k: K; opts: [Form[K], string][] }) => (
    <div className="ad-chips">
      {opts.map(([val, lab]) => (
        <button
          key={String(val)}
          type="button"
          className={`ad-chip ${f[k] === val ? 'soft-sel' : ''}`}
          onClick={() => set(k, val)}
        >
          {lab}
        </button>
      ))}
    </div>
  );

  const Check = ({ k, label }: { k: 'imgColour' | 'imgSizePad' | 'imgHero' | 'weightCol'; label: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <Toggle on={f[k]} onClick={() => set(k, !f[k])} />
      <span style={{ fontSize: 13.5 }}>{label}</span>
    </div>
  );

  if (done) {
    return (
      <div className="ad-body">
        <div className="ad-card ad-card-pad" style={{ textAlign: 'center', padding: 40, maxWidth: 560, margin: '0 auto' }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'var(--emerald)',
              color: 'var(--paper)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              fontSize: 28,
            }}
          >
            ✓
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 24, margin: '0 0 8px' }}>
            “{f.name}” created
          </h2>
          <p className="ad-muted" style={{ fontSize: 14, margin: '0 0 20px' }}>
            Sold {unitLabelLong(f.sellUnit)} · priced per {unitLong[f.priceUnit]} ·{' '}
            {f.layout === 'standard' ? 'standard layout' : 'custom layout'}. Now add its grades, colours, shapes &
            pricing from the Catalog.
          </p>
          <button className="ad-btn ad-btn-acc" onClick={onDone}>
            Go to Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ad-body">
      <div className="ad-pagehead">
        <h2>Create a new category</h2>
        <p className="ad-muted">Answer a few questions — this defines how the category behaves in the app</p>
      </div>

      <div style={{ maxWidth: 680, display: 'grid', gap: 14 }}>
        <div className="ad-card ad-card-pad">
          <h3 className="ad-sechead-h" style={{ margin: '0 0 12px' }}>1 · Basics</h3>
          <div className="ad-grid2">
            <label>
              <span className="ad-label">Category name *</span>
              <input
                className="ad-input"
                style={{ width: '100%' }}
                value={f.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Lab Grown Diamonds"
                autoFocus
              />
            </label>
            <label>
              <span className="ad-label">Short name</span>
              <input
                className="ad-input"
                style={{ width: '100%' }}
                value={f.short}
                onChange={(e) => set('short', e.target.value)}
                placeholder="e.g. Lab Diamonds"
              />
            </label>
          </div>
          <label style={{ display: 'block', marginTop: 12 }}>
            <span className="ad-label">Short description</span>
            <textarea
              className="ad-input"
              style={{ width: '100%' }}
              rows={2}
              value={f.blurb}
              onChange={(e) => set('blurb', e.target.value)}
              placeholder="Shown on the category card"
            />
          </label>
        </div>

        <div className="ad-card ad-card-pad">
          <h3 className="ad-sechead-h" style={{ margin: '0 0 4px' }}>2 · How is it sold?</h3>
          <p className="ad-muted" style={{ fontSize: 12.5, margin: '0 0 10px' }}>The unit the customer orders in.</p>
          <Radio
            k="sellUnit"
            opts={[
              ['pc', 'By pieces'],
              ['ct', 'By carat'],
              ['pkt', 'By packet'],
              ['strip', 'By strip'],
            ]}
          />
        </div>

        <div className="ad-card ad-card-pad">
          <h3 className="ad-sechead-h" style={{ margin: '0 0 4px' }}>3 · How is it priced?</h3>
          <p className="ad-muted" style={{ fontSize: 12.5, margin: '0 0 10px' }}>
            The unit the price is quoted in (can differ from how it's sold — e.g. sold by packet, priced per piece).
          </p>
          <Radio
            k="priceUnit"
            opts={[
              ['pc', 'Per piece'],
              ['ct', 'Per carat'],
              ['pkt', 'Per packet'],
              ['strip', 'Per strip'],
              ['gram', 'Per gram'],
            ]}
          />
        </div>

        <div className="ad-card ad-card-pad">
          <h3 className="ad-sechead-h" style={{ margin: '0 0 4px' }}>4 · Where do images appear?</h3>
          <p className="ad-muted" style={{ fontSize: 12.5, margin: '0 0 12px' }}>
            Choose where you'll add product photos for this category.
          </p>
          <Check k="imgColour" label="On the colour cards (one photo per colour + shape)" />
          <Check k="imgSizePad" label="As the product hero on the sizes/order screen" />
          <Check k="imgHero" label="A category hero / colour-chart image (like Ice Cut, Bracelets)" />
        </div>

        <div className="ad-card ad-card-pad">
          <h3 className="ad-sechead-h" style={{ margin: '0 0 4px' }}>5 · Layout</h3>
          <p className="ad-muted" style={{ fontSize: 12.5, margin: '0 0 10px' }}>
            Standard is Category → Grade → Colour → Shape → Sizes. Choose custom if this product needs a special flow.
          </p>
          <Radio
            k="layout"
            opts={[
              ['standard', 'Standard drill-down'],
              ['custom', 'Custom layout'],
            ]}
          />
          {f.layout === 'custom' && (
            <label style={{ display: 'block', marginTop: 12 }}>
              <span className="ad-label">Describe the custom layout you need</span>
              <textarea
                className="ad-input"
                style={{ width: '100%' }}
                rows={3}
                value={f.layoutNote}
                onChange={(e) => set('layoutNote', e.target.value)}
                placeholder="e.g. skip grade, single colour, corner-to-corner sizes with a measurement diagram, colour-tier pricing…"
              />
            </label>
          )}
          <div style={{ marginTop: 12 }}>
            <Check k="weightCol" label="Show a weight column (e.g. wt per 1000 pcs / per piece)" />
          </div>
        </div>

        {error && <div className="ad-error" style={{ marginBottom: 0 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="ad-btn ad-btn-ghost" onClick={onDone} disabled={busy}>
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

// "By pieces" reads oddly after "Sold" — the original said "Sold by pieces".
function unitLabelLong(u: Unit): string {
  return { pc: 'by pieces', ct: 'by carat', pkt: 'by packet', strip: 'by strip' }[u];
}
