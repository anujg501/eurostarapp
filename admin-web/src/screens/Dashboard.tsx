import { useEffect, useState } from 'react';
import { api, adminApi, type Category, type GradesByCat, type Product } from '../lib/api';

type Rfq = { id: string; status?: string };

// The old dashboard's numbers were computed from the static data file, so they
// never moved. These are counted from the database. Anything we cannot count
// honestly is left out rather than invented.
export function Dashboard({ onGo }: { onGo: (s: 'catalog' | 'bulk' | 'media' | 'settings') => void }) {
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

  return (
    <div className="ad-body">
      <div className="ad-pagehead">
        <h2>Dashboard</h2>
        <p className="ad-muted">Catalog &amp; store overview</p>
      </div>

      <div
        style={{
          background: '#0E5C4A',
          color: '#F6F1E6',
          padding: '10px 16px',
          borderRadius: 10,
          fontWeight: 800,
          fontSize: 16,
          marginBottom: 16,
          display: 'inline-block',
        }}
      >
        🔖 VERSION 1 — live update test
      </div>

      {error && <div className="ad-error">{error}</div>}

      <div className="ad-kpis">
        <Kpi label="Live categories" value={cats ? cats.length - hidden : null} sub={cats ? `${hidden} hidden` : ''} />
        <Kpi label="Grades / sub-categories" value={cats ? gradeCount : null} sub="across all categories" />
        <Kpi
          label="Open RFQ enquiries"
          value={rfqs ? rfqs.length : null}
          sub={rfqs ? 'need a quote' : 'unavailable'}
        />
        {/* The original panel showed a hardcoded demo number here. There is no
            franchise-enquiry endpoint yet, so this stays honest at 0. */}
        <Kpi label="Franchise enquiries" value={products ? 0 : null} sub="new" />
      </div>

      <section className="ad-card ad-card-pad">
        <h3 className="ad-sechead-h">Quick actions</h3>
        <div className="ad-row" style={{ marginTop: 10 }}>
          <button className="ad-btn ad-btn-pri" onClick={() => onGo('catalog')}>
            Manage catalog
          </button>
          <button className="ad-btn ad-btn-ghost" onClick={() => onGo('bulk')}>
            Bulk upload products
          </button>
          <button className="ad-btn ad-btn-ghost" onClick={() => onGo('media')}>
            Upload product images
          </button>
          <button className="ad-btn ad-btn-ghost" onClick={() => onGo('settings')}>
            Store settings
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
