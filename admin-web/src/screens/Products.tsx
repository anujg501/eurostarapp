import { useEffect, useMemo, useState } from 'react';
import { adminApi, type Category, type Product } from '../lib/api';

const STOCK: Product['stock'][] = ['in', 'low', 'out'];
const stockLabel = { in: 'In stock', low: 'Low', out: 'Sold out' } as const;

export function Products() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setError('');
    try {
      const [p, c] = await Promise.all([adminApi.products(), adminApi.categories()]);
      setProducts(p);
      setCats(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load products.');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const shown = useMemo(
    () => (products ?? []).filter((p) => !filter || p.cat === filter),
    [products, filter]
  );

  const patch = (id: string, next: Product) =>
    setProducts((xs) => (xs ?? []).map((x) => (x.id === id ? next : x)));

  return (
    <div className="ad-body">
      <div className="ad-pagehead ad-head-row">
        <div>
          <h2>Products &amp; pricing</h2>
          <p className="ad-muted">
            {products ? `${products.length} SKUs · prices go straight to the storefront` : 'Loading…'}
          </p>
        </div>
        <div className="ad-row">
          <button className="ad-btn ad-btn-ghost" onClick={() => { setShowBulk((s) => !s); setAdding(false); }}>
            {showBulk ? 'Close bulk upload' : 'Bulk upload'}
          </button>
          <button className="ad-btn ad-btn-pri" onClick={() => { setAdding((s) => !s); setShowBulk(false); }}>
            {adding ? 'Cancel' : '＋ Add product'}
          </button>
        </div>
      </div>

      {error && <div className="ad-error">{error}</div>}

      {adding && (
        <AddProduct
          cats={cats}
          defaultCat={filter}
          onCancel={() => setAdding(false)}
          onCreated={(p) => {
            setProducts((xs) => [...(xs ?? []), p]);
            setAdding(false);
          }}
        />
      )}

      {showBulk && <BulkUpload cats={cats} products={products ?? []} onDone={load} />}

      <div className="ad-row" style={{ marginBottom: 14 }}>
        <select className="ad-input" style={{ maxWidth: 260 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All categories</option>
          {cats.map((c) => (
            <option key={c.key} value={c.key}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {!products ? (
        <div className="ad-muted">Loading products…</div>
      ) : shown.length === 0 ? (
        <div className="ad-muted">No SKUs in this category yet. Use bulk upload to add them.</div>
      ) : (
        <div className="ad-card">
          {shown.map((p) => (
            <ProductRow
              key={p.id}
              p={p}
              onSaved={(next) => patch(p.id, next)}
              onDeleted={() => setProducts((xs) => (xs ?? []).filter((x) => x.id !== p.id))}
              onError={setError}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductRow({
  p,
  onSaved,
  onDeleted,
  onError,
}: {
  p: Product;
  onSaved: (next: Product) => void;
  onDeleted: () => void;
  onError: (m: string) => void;
}) {
  const [price, setPrice] = useState(String(p.price));
  const [stockCount, setStockCount] = useState(String(p.stockCount));
  const [stock, setStock] = useState<Product['stock']>(p.stock);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const dirty = Number(price) !== p.price || Number(stockCount) !== p.stockCount || stock !== p.stock;

  const save = async () => {
    setBusy(true);
    onError('');
    try {
      const next = await adminApi.updateProduct(p.id, {
        price: Number(price) || 0,
        stockCount: Number(stockCount) || 0,
        stock,
      });
      onSaved(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not save that SKU.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete ${p.name} (${p.id})? Customers will no longer see it.`)) return;
    setBusy(true);
    onError('');
    try {
      await adminApi.deleteProduct(p.id);
      onDeleted();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not delete that SKU.');
      setBusy(false);
    }
  };

  return (
    <div className="ad-listrow">
      <div className="ad-listrow-main" style={{ minWidth: 220 }}>
        <div className="nm">{p.name}</div>
        <div className="ad-hint">
          {p.id} · {p.cat}
          {p.size ? ` · ${p.size}` : ''}
          {p.shape ? ` · ${p.shape}` : ''}
        </div>
      </div>

      <div className="ad-row" style={{ marginTop: 0 }}>
        <label className="ad-inline">
          <span className="ad-hint">Price ₹</span>
          <input className="ad-input ad-input-sm" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <label className="ad-inline">
          <span className="ad-hint">Stock</span>
          <input className="ad-input ad-input-sm" type="number" min={0} value={stockCount} onChange={(e) => setStockCount(e.target.value)} />
        </label>
        <select className="ad-input ad-input-sm" value={stock} onChange={(e) => setStock(e.target.value as Product['stock'])}>
          {STOCK.map((s) => (
            <option key={s} value={s}>
              {stockLabel[s]}
            </option>
          ))}
        </select>
        <button className="ad-btn ad-btn-pri ad-btn-sm" disabled={busy || !dirty} onClick={save}>
          {busy ? '…' : saved ? 'Saved ✓' : 'Save'}
        </button>
        <button className="ad-btn ad-btn-ghost ad-btn-sm ad-danger" disabled={busy} onClick={remove}>
          Delete
        </button>
      </div>
    </div>
  );
}

// Add one SKU by hand — bulk upload is overkill for a single product.
function AddProduct({
  cats,
  defaultCat,
  onCancel,
  onCreated,
}: {
  cats: Category[];
  defaultCat?: string;
  onCancel: () => void;
  onCreated: (p: Product) => void;
}) {
  const [f, setF] = useState({
    id: '',
    name: '',
    cat: defaultCat || cats[0]?.key || '',
    price: '',
    tone: '',
    shape: '',
    size: '',
    clarity: '',
    unit: 'per pc',
    moq: '1',
    stock: 'in' as Product['stock'],
    stockCount: '0',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  // Suggest an id in the house style (EUR-MOI-0107) so the operator does not
  // have to invent one — still editable, since they may have their own scheme.
  const suggestId = () => {
    const c = cats.find((x) => x.key === f.cat);
    const tag = (c?.short || c?.key || 'GEN').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
    const n = String(Math.floor(1000 + Math.random() * 8999));
    set('id', `EUR-${tag}-${n}`);
  };

  const submit = async () => {
    const price = Number(f.price);
    if (!f.id.trim() || !f.name.trim() || !f.cat) {
      setError('SKU code, name and category are all required.');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError('Enter a price in whole rupees.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const created = await adminApi.createProduct({
        id: f.id.trim(),
        name: f.name.trim(),
        cat: f.cat,
        price: Math.round(price),
        tone: f.tone.trim(),
        shape: f.shape.trim(),
        size: f.size.trim(),
        clarity: f.clarity.trim(),
        unit: f.unit.trim() || 'per pc',
        moq: Math.max(1, Number(f.moq) || 1),
        stock: f.stock,
        stockCount: Math.max(0, Number(f.stockCount) || 0),
      });
      onCreated(created);
    } catch (e) {
      // A duplicate SKU comes back from the server as a 409 with a clear message.
      setError(e instanceof Error ? e.message : 'Could not add the product.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="ad-card ad-card-pad">
      <h3 className="ad-sechead-h">Add a product</h3>
      <p className="ad-muted">It goes live in the storefront as soon as you save.</p>

      <div className="ad-grid2" style={{ marginTop: 12 }}>
        <div className="ad-field-v">
          <label className="ad-label">SKU code</label>
          <div className="ad-row">
            <input className="ad-input" style={{ flex: 1 }} value={f.id} onChange={(e) => set('id', e.target.value)} placeholder="e.g. EUR-MOI-0107" />
            <button className="ad-btn ad-btn-ghost ad-btn-sm" type="button" onClick={suggestId}>
              Suggest
            </button>
          </div>
          <span className="ad-hint">Must be unique. This is how bulk upload matches it later.</span>
        </div>

        <div className="ad-field-v">
          <label className="ad-label">Category</label>
          <select className="ad-input" value={f.cat} onChange={(e) => set('cat', e.target.value)}>
            {cats.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ad-field-v">
        <label className="ad-label">Product name</label>
        <input className="ad-input" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Moissanite DEF White" />
      </div>

      <div className="ad-grid2">
        <div className="ad-field-v">
          <label className="ad-label">Price ₹ (per unit of sale)</label>
          <input className="ad-input" type="number" min={0} value={f.price} onChange={(e) => set('price', e.target.value)} placeholder="1850" />
        </div>
        <div className="ad-field-v">
          <label className="ad-label">Unit</label>
          <input className="ad-input" value={f.unit} onChange={(e) => set('unit', e.target.value)} placeholder="per pc / per ct / per strip" />
        </div>
      </div>

      <div className="ad-grid2">
        <div className="ad-field-v">
          <label className="ad-label">Shape</label>
          <input className="ad-input" value={f.shape} onChange={(e) => set('shape', e.target.value)} placeholder="round / oval / emerald…" />
        </div>
        <div className="ad-field-v">
          <label className="ad-label">Size</label>
          <input className="ad-input" value={f.size} onChange={(e) => set('size', e.target.value)} placeholder="6.5 mm / 7×5 mm" />
        </div>
      </div>

      <div className="ad-grid2">
        <div className="ad-field-v">
          <label className="ad-label">Colour / tone</label>
          <input className="ad-input" value={f.tone} onChange={(e) => set('tone', e.target.value)} placeholder="def-white / royal-blue" />
        </div>
        <div className="ad-field-v">
          <label className="ad-label">Clarity</label>
          <input className="ad-input" value={f.clarity} onChange={(e) => set('clarity', e.target.value)} placeholder="VVS / AAA" />
        </div>
      </div>

      <div className="ad-grid2">
        <div className="ad-field-v">
          <label className="ad-label">Minimum order qty</label>
          <input className="ad-input" type="number" min={1} value={f.moq} onChange={(e) => set('moq', e.target.value)} />
        </div>
        <div className="ad-field-v">
          <label className="ad-label">Stock</label>
          <div className="ad-row">
            <input className="ad-input" style={{ flex: 1 }} type="number" min={0} value={f.stockCount} onChange={(e) => set('stockCount', e.target.value)} />
            <select className="ad-input" value={f.stock} onChange={(e) => set('stock', e.target.value)}>
              <option value="in">In stock</option>
              <option value="low">Low</option>
              <option value="out">Sold out</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="ad-error">{error}</div>}

      <div className="ad-actions">
        <button className="ad-btn ad-btn-ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button className="ad-btn ad-btn-pri" onClick={submit} disabled={busy}>
          {busy ? 'Adding…' : 'Add product'}
        </button>
      </div>
    </section>
  );
}

const CSV_COLUMNS = [
  'id',
  'name',
  'cat',
  'price',
  'tone',
  'shape',
  'size',
  'clarity',
  'unit',
  'moq',
  'stock',
  'stockCount',
] as const;

/** Quote a CSV cell so commas and quotes inside a value survive the round trip. */
function csvCell(v: unknown): string {
  const s = String(v ?? '');
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Split one CSV line, honouring quoted fields — a gemstone name like
 * "Moissanite, Round" is legal CSV and must not split into two columns.
 */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'; // escaped quote
          i++;
        } else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function downloadSampleCsv(cats: Category[]) {
  // Use the operator's real category keys so the example rows import as-is.
  const a = cats[0]?.key ?? 'moissanite';
  const b = cats[1]?.key ?? a;
  const rows = [
    CSV_COLUMNS.join(','),
    ['EUR-SAMPLE-01', 'Sample Round Stone', a, '1850', 'def-white', 'round', '6.5 mm', 'VVS', 'per pc', '10', 'in', '120']
      .map(csvCell)
      .join(','),
    ['EUR-SAMPLE-02', 'Sample Oval Stone, larger', b, '2140', 'def-white', 'oval', '7×5 mm', 'VVS', 'per pc', '6', 'low', '18']
      .map(csvCell)
      .join(','),
  ];
  // Excel opens UTF-8 correctly only with a BOM — without it "7×5 mm" arrives mangled.
  const blob = new Blob(['﻿' + rows.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const el = document.createElement('a');
  el.href = url;
  el.download = 'eurostar-products-sample.csv';
  el.click();
  URL.revokeObjectURL(url);
}

/** Export every current SKU, so bulk editing starts from real data. */
function downloadCurrentCsv(products: Product[]) {
  const rows = [
    CSV_COLUMNS.join(','),
    ...products.map((p) => CSV_COLUMNS.map((c) => csvCell(p[c])).join(',')),
  ];
  const blob = new Blob(['﻿' + rows.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const el = document.createElement('a');
  el.href = url;
  el.download = 'eurostar-products-current.csv';
  el.click();
  URL.revokeObjectURL(url);
}

// Bulk upload. The prototype counted CSV rows, said "N products committed to
// the catalogue" and discarded them; this posts them and reports what the
// server actually did.
function BulkUpload({ cats, products, onDone }: { cats: Category[]; products: Product[]; onDone: () => void }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ created: number; updated: number } | null>(null);

  const parse = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setResult(null);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) throw new Error('That file has no rows under the header.');

      // Strip the UTF-8 BOM Excel writes, or the first column reads as "﻿id".
      const head = splitCsvLine(lines[0].replace(/^﻿/, ''));
      const required = ['id', 'name', 'cat', 'price'];
      const missing = required.filter((r) => !head.includes(r));
      if (missing.length) throw new Error(`Missing column(s): ${missing.join(', ')}`);

      // Nobody knows the internal key ("emerald-gemstones") — they know the name
      // they typed ("Emerald Gemstones"). Accept the name, the short name or the
      // key, any casing, and resolve it to the key the API expects.
      const lookup = new Map<string, string>();
      for (const c of cats) {
        for (const alias of [c.key, c.name, c.short]) {
          if (alias) lookup.set(alias.trim().toLowerCase(), c.key);
        }
        // also the slug of the name, which is how the key was generated
        lookup.set(
          c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
          c.key
        );
      }

      const out: Record<string, unknown>[] = [];
      const errs: string[] = [];

      lines.slice(1).forEach((line, i) => {
        const cells = splitCsvLine(line);
        const row: Record<string, string> = {};
        head.forEach((h, j) => (row[h] = cells[j] ?? ''));

        if (!row.id || !row.name || !row.cat) {
          errs.push(`Row ${i + 2}: id, name and cat are required`);
          return;
        }
        const catKey = lookup.get(row.cat.trim().toLowerCase());
        if (!catKey) {
          errs.push(
            `Row ${i + 2}: no category called "${row.cat}". Use one of the names listed above, or create it first under Catalog.`
          );
          return;
        }
        const price = Number(row.price);
        if (!Number.isFinite(price) || price < 0) {
          errs.push(`Row ${i + 2}: price "${row.price}" is not a number`);
          return;
        }
        out.push({
          id: row.id,
          name: row.name,
          cat: catKey, // resolved from whatever alias the file used
          price: Math.round(price),
          tone: row.tone || '',
          shape: row.shape || '',
          size: row.size || '',
          clarity: row.clarity || '',
          unit: row.unit || 'per pc',
          moq: Number(row.moq) > 0 ? Number(row.moq) : 1,
          stockCount: Number(row.stockCount) >= 0 ? Number(row.stockCount) : 0,
          stock: ['in', 'low', 'out'].includes(row.stock) ? row.stock : 'in',
        });
      });

      setRows(out);
      setProblems(errs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file.');
      setRows([]);
      setProblems([]);
    }
  };

  const commit = async () => {
    if (!rows.length) return;
    setBusy(true);
    setError('');
    try {
      const r = await adminApi.bulkProducts(rows);
      setResult({ created: r.created, updated: r.updated });
      setRows([]);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed — nothing was saved.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="ad-card ad-card-pad">
      <h2 className="ad-sechead-h">Bulk upload</h2>
      <p className="ad-muted">
        CSV with a header row. Required columns: <code>id, name, cat, price</code>. Optional:{' '}
        <code>tone, shape, size, clarity, unit, moq, stock, stockCount</code>.
      </p>

      <div className="ad-row" style={{ marginTop: 0 }}>
        <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={() => downloadSampleCsv(cats)}>
          ↓ Download sample CSV
        </button>
        <button className="ad-btn ad-btn-ghost ad-btn-sm" disabled={!products.length} onClick={() => downloadCurrentCsv(products)}>
          ↓ Download current {products.length} SKUs
        </button>
      </div>
      <span className="ad-hint">
        Start from the sample for new stock, or export the current SKUs to edit prices in Excel and upload the file back.
      </span>

      <details>
        <summary style={{ cursor: 'pointer', fontSize: 12.5, fontWeight: 600 }}>
          Categories you can put in the <code>cat</code> column ({cats.length})
        </summary>
        <div className="ad-chips" style={{ marginTop: 8 }}>
          {cats.map((c) => (
            <span className="ad-chip" key={c.key} title={`id: ${c.key}`}>
              {c.name}
            </span>
          ))}
        </div>
        <span className="ad-hint">The category name or its id both work — “Emerald Gemstones” or “emerald-gemstones”.</span>
      </details>

      <label className="ad-btn ad-btn-pri ad-btn-sm" style={{ justifySelf: 'start' }}>
        Choose CSV file
        <input type="file" accept=".csv,text/csv" hidden onChange={(e) => parse(e.target.files?.[0])} />
      </label>

      {error && <div className="ad-error">{error}</div>}

      {problems.length > 0 && (
        <div className="ad-error">
          <strong>{problems.length} row(s) will be skipped:</strong>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {problems.slice(0, 6).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          {problems.length > 6 && <div className="ad-hint">…and {problems.length - 6} more.</div>}
        </div>
      )}

      {result && (
        <div className="ad-reveal">
          <strong>
            {result.created} created · {result.updated} updated
          </strong>
          <span className="ad-hint">Saved to the catalogue and live in the storefront.</span>
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="ad-hint">{rows.length} valid row(s) ready. Nothing is saved until you commit.</div>
          <div className="ad-actions">
            <button className="ad-btn ad-btn-pri" onClick={commit} disabled={busy}>
              {busy ? 'Uploading…' : `Commit ${rows.length} products`}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
