import { useEffect, useState } from 'react';
import { api, adminApi, type Category, type GradesByCat, type Product } from '../lib/api';

type Rfq = { id: string; status?: string };

// The old dashboard's numbers were computed from the static data file, so they
// never moved. These are counted from the database. Anything we cannot count
// honestly is left out rather than invented.
export function Dashboard({ onGo }: { onGo: (s: 'catalog' | 'products' | 'marketing') => void }) {
  const [cats, setCats] = useState<Category[] | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [grades, setGrades] = useState<GradesByCat>({});
  const [rfqs, setRfqs] = useState<Rfq[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [c, p, g] = await Promise.all([adminApi.categories(), adminApi.products(), adminApi.grades()]);
        setCats(c);
        setProducts(p);
        setGrades(g ?? {});
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load the dashboard.');
      }
      // RFQs are a separate concern: if this one call fails the rest of the
      // dashboard should still render.
      try {
        setRfqs(await api.get<Rfq[]>('/rfq'));
      } catch {
        setRfqs(null);
      }
    })();
  }, []);

  const hidden = (cats ?? []).filter((c) => c.hidden).length;
  const gradeCount = Object.values(grades).reduce((a, g) => a + (g?.length ?? 0), 0);
  const outOfStock = (products ?? []).filter((p) => p.stock === 'out').length;
  const lowStock = (products ?? []).filter((p) => p.stock === 'low').length;

  return (
    <div className="ad-body">
      <div className="ad-pagehead">
        <h2>Dashboard</h2>
        <p className="ad-muted">Catalog &amp; store overview</p>
      </div>

      {error && <div className="ad-error">{error}</div>}

      <div className="ad-kpis">
        <Kpi label="Live categories" value={cats ? cats.length - hidden : null} sub={cats ? `${hidden} hidden` : ''} />
        <Kpi label="Products" value={products ? products.length : null} sub="SKUs in the catalogue" />
        {/* Deliberately NOT called "Grades": the ~61 built-in grades live in the
            storefront's data.jsx, which the server cannot see. This counts only
            the ones added here, so it must not claim to be the total. */}
        <Kpi label="Custom grades added" value={cats ? gradeCount : null} sub="on top of the app’s built-in grades" />
        <Kpi
          label="Open RFQ enquiries"
          value={rfqs ? rfqs.length : null}
          sub={rfqs ? 'need a quote' : 'unavailable'}
        />
      </div>

      {products && (outOfStock > 0 || lowStock > 0) && (
        <section className="ad-card ad-card-pad">
          <h3 className="ad-sechead-h">Stock needing attention</h3>
          <p className="ad-muted">
            {outOfStock} sold out · {lowStock} running low. Customers cannot order sold-out sizes.
          </p>
          <div className="ad-actions">
            <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={() => onGo('products')}>
              Open products →
            </button>
          </div>
        </section>
      )}

      <section className="ad-card ad-card-pad">
        <h3 className="ad-sechead-h">Quick actions</h3>
        <div className="ad-row" style={{ marginTop: 10 }}>
          <button className="ad-btn ad-btn-pri" onClick={() => onGo('catalog')}>
            Manage catalog
          </button>
          <button className="ad-btn ad-btn-ghost" onClick={() => onGo('products')}>
            Bulk upload products
          </button>
          <button className="ad-btn ad-btn-ghost" onClick={() => onGo('marketing')}>
            Marketing
          </button>
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: number | null; sub: string }) {
  return (
    <div className="ad-kpi">
      <div className="lbl">{label}</div>
      <div className="val">{value === null ? '—' : value}</div>
      <div className="sub">{sub}</div>
    </div>
  );
}
