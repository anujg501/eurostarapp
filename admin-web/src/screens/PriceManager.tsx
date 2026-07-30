import { useEffect, useState } from 'react';
import { adminApi, type Category } from '../lib/api';
import { PricingMatrixEditor } from './PricingMatrix';

// A top-level home for editing prices, sizes and pieces-per-packet. The same
// editor also lives inside each category's detail page; this gives staff one
// obvious sidebar entry so they don't have to dig through Catalog to find it.
export function PriceManager() {
  const [cats, setCats] = useState<Category[]>([]);
  const [catKey, setCatKey] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const c = await adminApi.categories();
        setCats(c);
        setCatKey(c[0]?.key ?? '');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load categories.');
      }
    })();
  }, []);

  const cat = cats.find((c) => c.key === catKey);

  return (
    <div className="ad-body">
      <div className="ad-pagehead">
        <h2>Update price / size / MOQ</h2>
        <p className="ad-muted">
          Pick a category and shape, then edit the price and pieces-per-packet for each size. Changes save to the live
          catalogue.
        </p>
      </div>

      {error && <div className="ad-error">{error}</div>}

      <section className="ad-card ad-card-pad" style={{ marginBottom: 16 }}>
        <div className="ad-field-v" style={{ marginBottom: 0, maxWidth: 320 }}>
          <span className="ad-label">Category</span>
          <select
            className="ad-input"
            style={{ width: '100%' }}
            value={catKey}
            onChange={(e) => setCatKey(e.target.value)}
          >
            {cats.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {cat ? (
        <PricingMatrixEditor cat={cat} />
      ) : (
        !error && <section className="ad-card ad-card-pad ad-muted">Loading…</section>
      )}
    </div>
  );
}
