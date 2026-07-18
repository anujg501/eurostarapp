import { useEffect, useState } from 'react';
import { adminApi, type Category, type Product } from '../lib/api';
import { CSV_COLUMNS, downloadSampleCsv, parseProductsCsv } from './Products';

// The sidebar's "Bulk upload" page: the original panel's guided three-step
// import (template → upload & validate → commit). Same parsing, validation and
// commit path the Products screen's inline panel uses — only the framing is a
// dedicated page.
export function BulkUploadPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ created: number; updated: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [c, p] = await Promise.all([adminApi.categories(), adminApi.products()]);
        setCats(c);
        setProducts(p);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load the catalogue.');
      }
    })();
  }, []);

  const parse = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setResult(null);
    setFileName(file.name);
    try {
      const { rows: out, problems: errs } = parseProductsCsv(await file.text(), cats);
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
      setProducts(await adminApi.products());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed — nothing was saved.');
    } finally {
      setBusy(false);
    }
  };

  const downloadBlank = () => {
    const blob = new Blob(['﻿' + CSV_COLUMNS.join(',') + '\r\n'], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url;
    el.download = 'eurostar-products-blank.csv';
    el.click();
    URL.revokeObjectURL(url);
  };

  const downloadWorkbook = () => downloadCategoryWorkbook(cats, products);

  return (
    <div className="ad-body">
      <div className="ad-pagehead">
        <h2>Bulk upload products</h2>
        <p className="ad-muted">Add or update products in bulk via Excel / CSV</p>
      </div>

      <div className="bu-steps">
        <div className="bu-step on">
          <span className="n">1</span> Get template
        </div>
        <div className="bu-sep" />
        <div className="bu-step on">
          <span className="n">2</span> Upload &amp; validate
        </div>
        <div className="bu-sep" />
        <div className={`bu-step ${rows.length > 0 || result ? 'on' : ''}`}>
          <span className="n">3</span> Commit
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <section className="ad-card ad-card-pad">
          <h3 className="ad-sechead-h" style={{ margin: '0 0 6px' }}>1 · Download the template</h3>
          <p className="ad-muted" style={{ fontSize: 13, lineHeight: 1.65, margin: '0 0 12px', maxWidth: 680 }}>
            Fill one row per product. Required: <strong>id, name, cat, price</strong>. <code>cat</code> = the category
            name or its id (“Emerald Gemstones” or “emerald-gemstones” both work); <code>price</code> is ₹ per unit.
            Optional: <code>tone, shape, size, clarity, unit, moq, stock, stockCount</code>.
          </p>
          <div className="ad-row">
            <button className="ad-btn ad-btn-ghost" disabled={!cats.length} onClick={downloadWorkbook}>
              ↓ Workbook — one sheet per category (recommended)
            </button>
            <button className="ad-btn ad-btn-ghost" onClick={() => downloadSampleCsv(cats)}>
              ↓ Single sheet with sample rows
            </button>
            <button className="ad-btn ad-btn-ghost" onClick={downloadBlank}>
              ↓ Blank (headers only)
            </button>
          </div>
          <p className="ad-muted" style={{ fontSize: 12.5, margin: '10px 0 0' }}>
            The recommended workbook has a separate tab for each of the {cats.length} categories, pre-filled with its
            current SKUs. Edit a tab, save it as CSV, and upload it below.
          </p>
        </section>

        <section className="ad-card ad-card-pad">
          <h3 className="ad-sechead-h" style={{ margin: '0 0 12px' }}>2 · Upload your file</h3>
          <label
            className={`bu-drop ${dragOver ? 'over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void parse(e.dataTransfer.files?.[0]);
            }}
          >
            <b>Drop your CSV here</b>
            <span className="ad-muted">or click to browse — we'll validate every row before anything is saved</span>
            {fileName && <span className="bu-file">{fileName}</span>}
            <input type="file" accept=".csv,text/csv" hidden onChange={(e) => void parse(e.target.files?.[0])} />
          </label>
        </section>

        {error && <div className="ad-error" style={{ marginBottom: 0 }}>{error}</div>}

        {problems.length > 0 && (
          <div className="ad-error" style={{ marginBottom: 0 }}>
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
          <section className="ad-card ad-card-pad">
            <h3 className="ad-sechead-h" style={{ margin: '0 0 4px' }}>3 · Commit</h3>
            <p className="ad-muted" style={{ fontSize: 12.5, margin: '0 0 10px' }}>
              {rows.length} valid row(s) ready. Nothing is saved until you commit.
            </p>
            <div className="ad-row">
              <button className="ad-btn ad-btn-pri" onClick={commit} disabled={busy}>
                {busy ? 'Uploading…' : `Commit ${rows.length} products`}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/**
 * A real multi-sheet Excel workbook, one tab per category, each pre-filled
 * with that category's current SKUs (plus a starter row when it has none).
 * Written as SpreadsheetML 2003 — a single XML file Excel opens natively —
 * because a .xlsx would need a zip library the panel doesn't ship.
 */
function downloadCategoryWorkbook(cats: Category[], products: Product[]) {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // Excel tab names: max 31 chars, no \ / ? * [ ] : — and must be unique.
  const seen = new Set<string>();
  const tabName = (name: string) => {
    let t = name.replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 31) || 'Category';
    let n = 2;
    while (seen.has(t.toLowerCase())) t = `${t.slice(0, 28)} ${n++}`;
    seen.add(t.toLowerCase());
    return t;
  };

  const cell = (v: unknown) => {
    const num = typeof v === 'number' || (v !== '' && v !== null && !Array.isArray(v) && Number.isFinite(Number(v)));
    return `<Cell><Data ss:Type="${num ? 'Number' : 'String'}">${esc(String(v ?? ''))}</Data></Cell>`;
  };
  const row = (cells: unknown[]) => `<Row>${cells.map(cell).join('')}</Row>`;

  const sheets = cats
    .map((c) => {
      const mine = products.filter((p) => p.cat === c.key);
      const body = mine.length
        ? mine.map((p) => row(CSV_COLUMNS.map((col) => p[col] ?? ''))).join('')
        : row(CSV_COLUMNS.map((col) => (col === 'cat' ? c.key : col === 'unit' ? 'per pc' : '')));
      return `<Worksheet ss:Name="${esc(tabName(c.name))}"><Table>${row([...CSV_COLUMNS])}${body}</Table></Worksheet>`;
    })
    .join('');

  const xml =
    `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>` +
    `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ` +
    `xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${sheets}</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const el = document.createElement('a');
  el.href = url;
  el.download = 'eurostar-products-workbook.xls';
  el.click();
  URL.revokeObjectURL(url);
}
