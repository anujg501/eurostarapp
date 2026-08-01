import { useEffect, useRef, useState } from 'react';
import {
  adminApi,
  type Category,
  type Grade,
  type Colour,
  type PricingMatrix,
  type CategoryPricingOverride,
  type PricingOverrides,
  type PriceSnapshot,
  type SnapshotRow,
} from '../lib/api';

// Pricing section (Sales App + Admin). Flow: Category → Grade (multi-grade only)
// → Colour → size × price editor. The editor writes per-category overrides
// (adminApi.pricingOverrides) that the Sales App reads live. The "auto" rates it
// shows come from the shop's real published prices (adminApi.priceSnapshot),
// falling back to the /admin/pricing matrix estimate where a sheet has no entry.

type Step = 'cats' | 'grades' | 'subgrades' | 'colours' | 'editor';
const ALL = '__all__';

// Categories sold as one flat price per packet/set (not ₹ per piece × pcs).
// The rate IS the whole-packet price and the pcs count is fixed, so the editor
// labels it accordingly and hides the editable pieces-per-packet column.
const FLAT_SET_LABEL: Record<string, string> = { navratna: '₹ per set (9 pieces)', bracelet: '₹ per bracelet' };
// The CSV "Rate ₹" suffix for flat-priced categories.
const FLAT_SET_SUFFIX: Record<string, string> = { navratna: '/set', bracelet: '/bracelet' };

// Categories priced by the carat or the strip — never per-piece × packet, so
// they must never show the editable pieces-per-packet column.
const CARAT_STRIP = new Set(['moissanite', 'labgrown', 'beads', 'multisapphire']);

// The "Rate ₹" unit for a category (and grade, where it varies by grade).
// Opaque is split by grade: Natural-look is carat-lot priced, Opal is packet.
const opaqueCarat = (catKey: string, gradeId: string) => catKey === 'opaque' && gradeId !== 'opal';

function rateUnitLabel(catKey: string, gradeId: string, unit?: string): string {
  if (FLAT_SET_LABEL[catKey]) return FLAT_SET_LABEL[catKey];
  if (catKey === 'multisapphire') return gradeId === 'aaa' ? '₹ per carat' : '₹ per strip';
  if (catKey === 'labgrown') return gradeId === 'created' ? '₹ per carat' : '₹ per piece';
  if (catKey === 'opaque') return opaqueCarat(catKey, gradeId) ? '₹ per carat (100 ct lot)' : '₹ per piece · packet sold';
  return unit === 'ct' ? '₹ per carat' : unit === 'pkt' ? '₹ per piece · packet sold' : `₹ per ${unit}`;
}
// Short suffix for the CSV "Rate ₹" header.
function rateCsvSuffix(catKey: string, gradeId: string, unit?: string): string {
  if (FLAT_SET_SUFFIX[catKey]) return FLAT_SET_SUFFIX[catKey];
  if (catKey === 'multisapphire') return gradeId === 'aaa' ? '/ct' : '/strip';
  if (catKey === 'labgrown') return gradeId === 'created' ? '/ct' : '/pc';
  if (catKey === 'opaque') return opaqueCarat(catKey, gradeId) ? '/ct' : '/pc';
  return unit === 'ct' ? '/ct' : '/pc';
}

// "9.00" → "9.00 mm"; "10x8" / "10*8" → "10×8 mm"; leaves an existing "mm" alone.
// Used only for the "add size" input.
function normSize(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  if (/mm\s*$/i.test(s)) return s.replace(/\s*mm\s*$/i, ' mm');
  return s.replace(/\s*[x×*]\s*/i, '×') + ' mm';
}

// Match a size to the snapshot / override key space: lower-case, ×→x, no spaces,
// trailing zeros stripped ("7.50 mm" = "7.5" = "7.5mm"). Mirrors the storefront
// and the /admin/pricing route, so an edit lands on the row it was made against.
function snapNorm(s: string): string {
  const t = String(s ?? '').trim().toLowerCase().replace(/×/g, 'x').replace(/\s+/g, '');
  return t.replace(/(\d+(?:\.\d*?[1-9])?)\.?0*(?=\D|$)/g, '$1');
}

// Override price keys, most→least specific — the single source of truth shared
// by the editor and the Excel export so both resolve a rate identically.
function priceKeys(multiGrade: boolean, gradeId: string, colourId: string, shape: string, sizeNorm: string): string[] {
  const sh = shape.toLowerCase();
  const k: string[] = [];
  const colSpecific = colourId !== ALL;
  if (multiGrade) {
    if (colSpecific) k.push(`${gradeId}@${colourId}|${sh}|${sizeNorm}`);
    k.push(`${gradeId}@${sh}|${sizeNorm}`);
  }
  if (colSpecific) k.push(`${colourId}|${sh}|${sizeNorm}`);
  k.push(`${sh}|${sizeNorm}`);
  return k;
}

// The shop's real price for (grade, colour, shape, size). The snapshot keys a
// row on whichever of grade/colour its sheet is scoped by, so we try the
// specific pair first and fall back to the colour- or grade-agnostic entry.
function snapLook(
  catSnap: Record<string, SnapshotRow> | undefined,
  gradeId: string,
  colourId: string,
  shape: string,
  sizeNorm: string
): SnapshotRow | null {
  if (!catSnap) return null;
  const cid = colourId === ALL ? '' : colourId;
  const sh = shape.toLowerCase();
  const cands = [
    [gradeId, cid, sh, sizeNorm],
    ['', cid, sh, sizeNorm],
    [gradeId, '', sh, sizeNorm],
    ['', '', sh, sizeNorm],
  ];
  for (const a of cands) {
    const v = catSnap[a.join('|')];
    if (v) return v;
  }
  return null;
}

function csvCell(s: string): string {
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function downloadCsv(filename: string, rows: string[][]): void {
  const text = rows.map((r) => r.map((c) => csvCell(String(c))).join(',')).join('\r\n');
  // BOM so Excel opens ₹ and × correctly.
  const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Build a colour's whole price list across every shape × size, using the same
// override-aware rate the editor shows. Sourced from the snapshot (real prices)
// plus any admin add/remove-size edits.
function exportColourCsv(
  cat: Category,
  multiGrade: boolean,
  gradeId: string,
  gradeName: string,
  colourId: string,
  colourName: string,
  catSnap: Record<string, SnapshotRow> | undefined,
  ovr: CategoryPricingOverride
): void {
  const unit = cat.unit || 'pc';
  const packet = !FLAT_SET_LABEL[cat.key] && !CARAT_STRIP.has(cat.key) && !opaqueCarat(cat.key, gradeId) && unit === 'pkt';
  const cid = colourId === ALL ? '' : colourId;

  // Every (shape, size) the snapshot has for this grade/colour scope.
  type Cell = { shape: string; sizeNorm: string; sizeLabel: string };
  const cells: Cell[] = [];
  const seen = new Set<string>();
  Object.keys(catSnap ?? {}).forEach((key) => {
    const [kg, kc, kshape, ksize] = key.split('|');
    if (kg !== gradeId && kg !== '') return;
    if (colourId === ALL ? kc !== '' : kc !== cid && kc !== '') return;
    const row = catSnap![key];
    const id = `${kshape}|${ksize}`;
    if (seen.has(id)) return;
    seen.add(id);
    cells.push({ shape: kshape, sizeNorm: ksize, sizeLabel: row.size || ksize });
  });
  // Admin-added sizes that aren't in the snapshot.
  Object.entries(ovr.addSizes ?? {}).forEach(([shape, sizes]) => {
    (sizes || []).forEach((s) => {
      const sn = snapNorm(s);
      const id = `${shape}|${sn}`;
      if (!seen.has(id)) {
        seen.add(id);
        cells.push({ shape, sizeNorm: sn, sizeLabel: s });
      }
    });
  });
  // Drop admin-removed sizes.
  const del = new Set<string>();
  Object.entries(ovr.delSizes ?? {}).forEach(([shape, sizes]) => {
    (sizes || []).forEach((s) => del.add(`${shape}|${snapNorm(s)}`));
  });

  const resolveRate = (shape: string, sizeNorm: string, auto: number): number => {
    for (const k of priceKeys(multiGrade, gradeId, colourId, shape, sizeNorm)) {
      const v = ovr.price?.[k];
      if (v != null) return v;
    }
    return auto;
  };
  const resolvePcs = (sizeNorm: string, auto: number): number => {
    const v = ovr.pcs?.[sizeNorm];
    return v != null ? v : auto;
  };

  const header = ['Shape', 'Size', `Rate ₹ ${rateCsvSuffix(cat.key, gradeId, unit)}`];
  if (packet) header.push('Pcs per packet');
  const rows: string[][] = [header];

  cells
    .filter((c) => !del.has(`${c.shape}|${c.sizeNorm}`))
    .sort((a, b) => (a.shape === b.shape ? a.sizeLabel.localeCompare(b.sizeLabel, undefined, { numeric: true }) : a.shape.localeCompare(b.shape)))
    .forEach((c) => {
      const snap = snapLook(catSnap, gradeId, colourId, c.shape, c.sizeNorm);
      const rate = resolveRate(c.shape, c.sizeNorm, snap?.rate ?? 0);
      const line = [c.shape, c.sizeLabel, String(rate)];
      if (packet) line.push(String(resolvePcs(c.sizeNorm, snap?.pcs ?? 0)));
      rows.push(line);
    });

  const gradePart = multiGrade && gradeId ? `-${gradeId}` : '';
  const colourPart = colourId === ALL ? 'all-colours' : colourId;
  downloadCsv(`${cat.key}${gradePart}-${colourPart}-pricing.csv`, rows);
  void gradeName;
  void colourName;
}

// ---- Bulk upload: the ⬇ Excel file, edited and sent back --------------------
// Round-trips the export above. An operator downloads a colour's price list,
// edits the Rate / Pcs columns in Excel, and uploads it here; every changed cell
// becomes the same override the size × price editor would have written, so both
// routes end up in one place and "Save changes" publishes them together.

// RFC4180-ish reader: quoted cells, embedded commas and newlines, CRLF, BOM.
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch !== '"') { cell += ch; continue; }
      if (src[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      continue;
    }
    if (ch === '"') { quoted = true; continue; }
    if (ch === ',') { row.push(cell); cell = ''; continue; }
    if (ch === '\r') continue;
    if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; continue; }
    cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

// "₹ 1,234.50" → 1234.5. Excel writes thousands separators and currency marks
// back into the cell, so strip anything that isn't part of the number.
function csvNum(raw: string): number | null {
  const t = String(raw ?? '').replace(/[^0-9.-]/g, '');
  if (!t || t === '-' || t === '.') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

interface ImportReport {
  rows: number;
  priced: number;
  pcs: number;
  cleared: number;
  added: number;
  skipped: number;
  unknownShapes: string[];
}

export function importColourCsv(
  text: string,
  multiGrade: boolean,
  gradeId: string,
  colourId: string,
  catSnap: Record<string, SnapshotRow> | undefined,
  ovr: CategoryPricingOverride
): { next: CategoryPricingOverride; report: ImportReport } | { error: string } {
  const table = parseCsv(text);
  if (table.length < 2) return { error: 'That file has no price rows in it.' };

  const head = table[0].map((h) => h.trim().toLowerCase());
  const iShape = head.findIndex((h) => h.includes('shape'));
  const iSize = head.findIndex((h) => h.includes('size'));
  const iRate = head.findIndex((h) => h.startsWith('rate'));
  const iPcs = head.findIndex((h) => h.includes('pcs'));
  if (iShape < 0 || iSize < 0 || iRate < 0)
    return { error: 'Needs the Shape, Size and Rate ₹ columns. Download ⬇ Excel first and upload that same file back.' };

  // Shapes the published price list knows about — anything else is reported so a
  // typo in the Shape column doesn't quietly land nowhere.
  const known = new Set<string>();
  Object.keys(catSnap ?? {}).forEach((k) => known.add(k.split('|')[2]));

  const price = { ...(ovr.price ?? {}) };
  const pcs = { ...(ovr.pcs ?? {}) };
  const addSizes: Record<string, string[]> = {};
  Object.entries(ovr.addSizes ?? {}).forEach(([k, v]) => { addSizes[k] = [...(v ?? [])]; });
  const delSizes: Record<string, string[]> = {};
  Object.entries(ovr.delSizes ?? {}).forEach(([k, v]) => { delSizes[k] = [...(v ?? [])]; });

  const rep: ImportReport = { rows: 0, priced: 0, pcs: 0, cleared: 0, added: 0, skipped: 0, unknownShapes: [] };
  const unknown = new Set<string>();

  for (let i = 1; i < table.length; i++) {
    const r = table[i];
    const shape = (r[iShape] ?? '').trim().toLowerCase();
    const sizeLabel = (r[iSize] ?? '').trim();
    const rate = csvNum(r[iRate] ?? '');
    if (!shape || !sizeLabel || rate == null) { rep.skipped++; continue; }
    rep.rows++;
    if (!known.has(shape)) unknown.add(shape);

    const sizeNorm = snapNorm(sizeLabel);
    const snapRow = snapLook(catSnap, gradeId, colourId, shape, sizeNorm);
    const key = priceKeys(multiGrade, gradeId, colourId, shape, sizeNorm)[0];

    // Back at the sheet price = no override, exactly as typing the auto value
    // into the editor does. Keeps the saved overrides to real differences.
    if (snapRow && rate === snapRow.rate) {
      if (price[key] != null) { delete price[key]; rep.cleared++; }
    } else if (price[key] !== rate) {
      price[key] = rate;
      rep.priced++;
    }

    if (iPcs >= 0) {
      const p = csvNum(r[iPcs] ?? '');
      if (p != null && p > 0) {
        if (snapRow && p === snapRow.pcs) {
          if (pcs[sizeNorm] != null) { delete pcs[sizeNorm]; rep.cleared++; }
        } else if (pcs[sizeNorm] !== p) {
          pcs[sizeNorm] = p;
          rep.pcs++;
        }
      }
    }

    // A size the sheet never had — carry it as an added size so it shows in the
    // editor and reaches the Sales App, same as "＋ Add size" does.
    if (!snapRow) {
      const list = addSizes[shape] ?? [];
      if (!list.some((s) => snapNorm(s) === sizeNorm)) {
        list.push(sizeLabel);
        addSizes[shape] = list;
        rep.added++;
      }
    }
    // Listing a row un-deletes it; the export never contains removed sizes, so
    // one being here means the operator typed it back in on purpose.
    if (delSizes[shape]) delSizes[shape] = delSizes[shape].filter((s) => snapNorm(s) !== sizeNorm);
  }

  rep.unknownShapes = [...unknown];
  return { next: { ...ovr, price, pcs, addSizes, delSizes }, report: rep };
}

// The shop's own Category → Grade → Colour flow, published in the snapshot as
// `__catalog__` (see scripts/gen-price-snapshot.cjs). The Admin flow is driven
// from this so it matches the storefront exactly, not the drifted backend
// catalog: e.g. Corundum → EXCEL AAA / DECCAN AA, each with its own colours.
interface SubItem { id: string; name: string; hex?: string }
interface CatalogEntry {
  name: string;
  grades: { id: string; name: string; subGrades?: SubItem[] }[];
  coloursByGrade: Record<string, { id: string; name: string; hex: string; subShades?: SubItem[] }[]>;
}
type CatalogStruct = Record<string, CatalogEntry>;

export function Pricing() {
  const [cats, setCats] = useState<Category[]>([]);
  const [grades, setGrades] = useState<Record<string, Grade[]>>({});
  const [colours, setColours] = useState<Record<string, Colour[]>>({});
  const [catalog, setCatalog] = useState<CatalogStruct>({});
  const [swatches, setSwatches] = useState<Record<string, string>>({});
  const [ovr, setOvr] = useState<PricingOverrides>({});
  const [snap, setSnap] = useState<PriceSnapshot>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  // Edits buffer locally until "Save changes" pushes them live.
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [step, setStep] = useState<Step>('cats');
  const [catKey, setCatKey] = useState('');
  // A grade may have sub-grades that change price (White CZ Elements → Thin/…).
  // baseGradeId picks the colour list; the effective grade used for pricing is
  // baseGradeId + '-' + subGradeId when a sub-grade is chosen.
  const [baseGradeId, setBaseGradeId] = useState('');
  const [subGradeId, setSubGradeId] = useState('');
  const gradeId = subGradeId ? `${baseGradeId}-${subGradeId}` : baseGradeId;
  const [colourId, setColourId] = useState<string>(ALL);

  useEffect(() => {
    (async () => {
      try {
        const [c, g, cl, sw, ov, sp] = await Promise.all([
          adminApi.categories(),
          adminApi.grades(),
          adminApi.colours(),
          adminApi.colourSwatches(),
          adminApi.pricingOverrides(),
          adminApi.priceSnapshot().catch(() => ({}) as PriceSnapshot),
        ]);
        setCats(c);
        setGrades(g ?? {});
        setColours(cl ?? {});
        setSwatches(sw ?? {});
        setOvr(ov ?? {});
        // Split the shop navigation structure out of the price rows.
        const { __catalog__, ...rows } = (sp ?? {}) as Record<string, unknown>;
        setSnap(rows as PriceSnapshot);
        setCatalog((__catalog__ as CatalogStruct) ?? {});
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load pricing.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cat = cats.find((c) => c.key === catKey);
  const catEntry = catalog[catKey];
  const backendGrades = grades[catKey] ?? [];
  // Grades come from the shop structure; merge any extra display fields (tier,
  // origin, base price) from the backend grade of the same id when present.
  const catGrades = (catEntry?.grades ?? backendGrades).map((g) => ({
    ...backendGrades.find((b) => b.id === g.id),
    ...g,
  })) as (Grade & { subGrades?: SubItem[] })[];
  // Sub-graded categories always write grade-scoped keys.
  const multiGrade = catGrades.length > 1 || catGrades.some((g) => (g.subGrades?.length ?? 0) > 0);
  const allCatColours = colours[catKey] ?? [];
  const baseGrade = catGrades.find((g) => g.id === baseGradeId);
  const subGrade = baseGrade?.subGrades?.find((s) => s.id === subGradeId);
  // The effective grade used for the editor's title + pricing (base + sub-grade).
  const grade = baseGrade
    ? ({ ...baseGrade, id: gradeId, name: subGrade ? `${baseGrade.name} · ${subGrade.name}` : baseGrade.name } as Grade)
    : undefined;

  // A grade only sells some of the category's colours (e.g. corundum EXCEL AAA
  // sells Ruby 5, not Ruby 2). The backend colour list isn't grade-filtered, so
  // without this the editor showed phantom grade×colour rows at ₹0 for products
  // the shop doesn't sell. Restrict to colours that actually have priced rows
  // for the chosen grade in the mirror; fall back to all when the category is
  // colour-agnostic (no colour in its keys) or has no mirror yet.
  const catColoursFor = (gid: string) => {
    const s = snap[catKey] || {};
    const keys = Object.keys(s);
    if (!keys.length) return allCatColours;
    // Only the rows that belong to this grade (or are grade-agnostic).
    const gradeKeys = keys.filter((k) => {
      const g = k.split('|')[0];
      return g === gid || g === '';
    });
    // If this grade's rows carry no colour, it's colour-agnostic → show all.
    if (!gradeKeys.some((k) => k.split('|')[1] !== '')) return allCatColours;
    const offered = new Set<string>();
    for (const k of gradeKeys) {
      const c = k.split('|')[1];
      if (c) offered.add(c);
    }
    return allCatColours.filter((col) => offered.has(col.id));
  };
  // Colours for the chosen grade come straight from the shop structure (which
  // includes base-priced colours like Blue 34 / White); fall back to the
  // mirror-derived list, then the raw backend list.
  // Colours are keyed by the BASE grade id (the shop resolves colours by base
  // grade, then the sub-grade is chosen). Falls back to the mirror-derived list.
  const catColours: Colour[] = (catEntry?.coloursByGrade?.[baseGradeId] as Colour[] | undefined) ?? catColoursFor(gradeId);

  // Enter a base grade: go to the sub-grade step if it has sub-grades, else colours.
  const enterGrade = (g: { id: string; subGrades?: SubItem[] }) => {
    setBaseGradeId(g.id);
    setSubGradeId('');
    setColourId(ALL);
    setStep(g.subGrades?.length ? 'subgrades' : 'colours');
  };

  const openCategory = (c: Category) => {
    setCatKey(c.key);
    setColourId(ALL);
    setSubGradeId('');
    const g = catalog[c.key]?.grades ?? (grades[c.key] ?? []);
    if (g.length > 1) {
      setBaseGradeId('');
      setStep('grades');
    } else if (g[0]) {
      enterGrade(g[0]);
    }
  };

  // Stage an editor change locally (buffered until "Save changes").
  const persist = (next: PricingOverrides) => {
    setOvr(next);
    setDirty(true);
    setSaveState('idle');
  };

  // Push all buffered changes to the server → live in the Sales App.
  const commitSave = async () => {
    setSaveState('saving');
    setError('');
    try {
      await adminApi.savePricingOverrides(ovr);
      setDirty(false);
      setSaveState('saved');
      window.setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
      setSaveState('idle');
    }
  };

  // Warn before leaving/refreshing with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const exportCsv = (colId: string) =>
    cat &&
    exportColourCsv(
      cat,
      multiGrade,
      gradeId,
      grade?.name || '',
      colId,
      colId === ALL ? 'All colours' : catColours.find((c) => c.id === colId)?.name || colId,
      snap[cat.key],
      ovr[cat.key] ?? {}
    );

  // ⬆ Upload — one hidden input reused by every card; importFor remembers which
  // colour's list the chosen file belongs to.
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [importFor, setImportFor] = useState<string>(ALL);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const pickCsv = (colId: string) => {
    setImportFor(colId);
    setImportMsg(null);
    if (fileRef.current) {
      fileRef.current.value = ''; // so re-picking the same file still fires
      fileRef.current.click();
    }
  };

  const onCsvChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !cat) return;
    if (/\.xlsx?$/i.test(file.name)) {
      setImportMsg({
        ok: false,
        text: `“${file.name}” is an Excel workbook. Open it in Excel, choose File → Save As → CSV UTF-8, then upload that file.`,
      });
      return;
    }
    let text = '';
    try {
      text = await file.text();
    } catch {
      setImportMsg({ ok: false, text: 'Could not read that file.' });
      return;
    }
    const res = importColourCsv(text, multiGrade, gradeId, importFor, snap[cat.key], ovr[cat.key] ?? {});
    if ('error' in res) {
      setImportMsg({ ok: false, text: res.error });
      return;
    }
    persist({ ...ovr, [cat.key]: res.next });
    const r = res.report;
    const who = importFor === ALL ? 'All colours' : catColours.find((c) => c.id === importFor)?.name || importFor;
    const bits: string[] = [];
    if (r.priced) bits.push(`${r.priced} price${r.priced === 1 ? '' : 's'} changed`);
    if (r.pcs) bits.push(`${r.pcs} pcs-per-packet changed`);
    if (r.added) bits.push(`${r.added} new size${r.added === 1 ? '' : 's'}`);
    if (r.cleared) bits.push(`${r.cleared} back to the sheet price`);
    if (r.skipped) bits.push(`${r.skipped} row${r.skipped === 1 ? '' : 's'} skipped (no shape, size or rate)`);
    const summary = bits.length ? bits.join(' · ') : 'nothing differed from what is already set';
    const warn = r.unknownShapes.length
      ? ` Shapes not in this price list: ${r.unknownShapes.join(', ')} — check the spelling if those rows were meant to change something.`
      : '';
    setImportMsg({
      ok: true,
      text: `${who}: read ${r.rows} row${r.rows === 1 ? '' : 's'} — ${summary}. Nothing is live until you click Save changes.${warn}`,
    });
  };

  if (loading)
    return (
      <div className="ad-body">
        <section className="ad-card ad-card-pad ad-muted">Loading…</section>
      </div>
    );

  return (
    <div className="ad-body">
      <div className={`pr-savebar ${dirty || saveState !== 'idle' ? 'on' : ''}`}>
        <span className="pr-savebar-msg">
          {saveState === 'saving'
            ? 'Saving…'
            : saveState === 'saved'
              ? '✓ Saved — live on the website'
              : dirty
                ? '● You have unsaved changes'
                : 'All changes saved'}
        </span>
        <button
          className="ad-btn ad-btn-pri"
          disabled={!dirty || saveState === 'saving'}
          onClick={() => void commitSave()}
        >
          {saveState === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <div className="ad-pagehead">
        <h2>Pricing</h2>
        <p className="ad-muted">Edit rates, pieces-per-packet and sizes, then click <b>Save changes</b> to publish them to the Sales App.</p>
      </div>
      {error && <div className="ad-error">{error}</div>}

      {/* One input for every ⬆ Upload button on the page. */}
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv,application/vnd.ms-excel"
        style={{ display: 'none' }}
        onChange={(e) => void onCsvChosen(e)}
      />
      {importMsg && (
        <div className={importMsg.ok ? 'pr-import' : 'ad-error'}>
          <span>{importMsg.text}</span>
          <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={() => setImportMsg(null)}>Dismiss</button>
        </div>
      )}

      {step === 'cats' && (
        <div className="pr-grid">
          {cats.map((c) => {
            const cg = catalog[c.key];
            const nCol = cg
              ? new Set(Object.values(cg.coloursByGrade).flat().map((x) => x.id)).size
              : (colours[c.key] ?? []).length;
            const nGr = cg?.grades.length ?? (grades[c.key] ?? []).length;
            return (
              <button key={c.key} className="pr-cat-card" onClick={() => openCategory(c)}>
                <div className="pr-cat-name">{c.name}</div>
                <div className="pr-cat-meta">
                  {nGr > 1 ? `${nGr} grades · ` : ''}{nCol} colour{nCol === 1 ? '' : 's'} · {c.unit?.toUpperCase?.() || ''}
                </div>
                <span className="pr-cat-go">Open ›</span>
              </button>
            );
          })}
        </div>
      )}

      {step === 'grades' && cat && (
        <>
          <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={() => setStep('cats')}>← Categories</button>
          <h3 className="pr-h3">{cat.name} — choose a grade</h3>
          <div className="pr-grid">
            {catGrades.map((g) => (
              <button
                key={g.id}
                className="pr-grade-card"
                onClick={() => enterGrade(g)}
              >
                {g.tier && <span className="pr-badge">{g.tier.toUpperCase()}</span>}
                {g.origin && <span className="pr-pill">{g.origin}</span>}
                <div className="pr-grade-name">{g.name}</div>
                {g.desc && <div className="pr-grade-desc">{g.desc}</div>}
                {g.subGrades?.length ? <div className="pr-grade-desc">{g.subGrades.length} types</div> : null}
                {g.basePrice ? <div className="pr-grade-from">from ₹{g.basePrice}/{g.unit || cat.unit}</div> : null}
                <span className="pr-cat-go">{g.subGrades?.length ? 'Choose type ›' : 'Select ›'}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 'subgrades' && cat && baseGrade && (
        <>
          <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={() => setStep(multiGrade ? 'grades' : 'cats')}>
            ← {multiGrade ? `${cat.name} grades` : 'Categories'}
          </button>
          <h3 className="pr-h3">{cat.name} · {baseGrade.name} — choose a type</h3>
          <div className="pr-grid">
            {baseGrade.subGrades?.map((sg) => (
              <button
                key={sg.id}
                className="pr-grade-card"
                onClick={() => { setSubGradeId(sg.id); setColourId(ALL); setStep('colours'); }}
              >
                <div className="pr-grade-name">{sg.name}</div>
                <span className="pr-cat-go">Select ›</span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 'colours' && cat && (
        <>
          <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={() => setStep(subGrade ? 'subgrades' : multiGrade ? 'grades' : 'cats')}>
            ← {subGrade ? `${baseGrade?.name} types` : multiGrade ? `${cat.name} grades` : 'Categories'}
          </button>
          <h3 className="pr-h3">
            {cat.name}{grade ? ` · ${grade.name}` : ''} — choose a colour
          </h3>
          <p className="ad-muted" style={{ marginTop: -6 }}>
            Edit one colour's pricing, or the base rates every colour inherits. Use ⬇ Excel to download a colour's whole
            price list — change the Rate ₹ (and Pcs) column in Excel, save it as CSV, then ⬆ Upload to bring every edit
            back in one go.
          </p>
          <div className="pr-grid">
            <div className="pr-colour-card">
              <div className="pr-swatch pr-swatch-all" />
              <div className="pr-colour-name">All colours</div>
              <div className="pr-colour-sub">Base rates — used by every colour without its own override.</div>
              <div className="pr-card-actions">
                <button className="ad-btn ad-btn-pri ad-btn-sm" onClick={() => { setColourId(ALL); setStep('editor'); }}>Edit pricing</button>
                <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={() => exportCsv(ALL)}>⬇ Excel</button>
                <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={() => pickCsv(ALL)} title="Upload an edited price list">⬆ Upload</button>
              </div>
            </div>
            {catColours.map((col) => {
              const photo = swatches[`${cat.key}|${col.id}`];
              return (
                <div key={col.id} className="pr-colour-card">
                  {photo ? (
                    <div className="pr-swatch" style={{ backgroundImage: `url(${photo})`, backgroundSize: 'cover' }} />
                  ) : (
                    <div className="pr-swatch"><span className="pr-ball" style={{ background: col.hex || '#ccc' }} /></div>
                  )}
                  <div className="pr-colour-name">{col.name}</div>
                  <div className="pr-card-actions">
                    <button className="ad-btn ad-btn-pri ad-btn-sm" onClick={() => { setColourId(col.id); setStep('editor'); }}>Edit pricing</button>
                    <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={() => exportCsv(col.id)}>⬇ Excel</button>
                    <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={() => pickCsv(col.id)} title="Upload an edited price list">⬆ Upload</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {step === 'editor' && cat && (
        <PriceEditor
          cat={cat}
          multiGrade={multiGrade}
          gradeId={gradeId}
          gradeName={grade?.name || ''}
          colourId={colourId}
          colourName={colourId === ALL ? 'All colours' : (catColours.find((c) => c.id === colourId)?.name || colourId)}
          ovr={ovr[cat.key] ?? {}}
          snap={snap[cat.key]}
          onBack={() => setStep('colours')}
          onChange={(next) => persist({ ...ovr, [cat.key]: next })}
          onExport={() => exportCsv(colourId)}
          onImport={() => pickCsv(colourId)}
        />
      )}
    </div>
  );
}

// ---- The size × price editor ------------------------------------------------
function PriceEditor({
  cat,
  multiGrade,
  gradeId,
  gradeName,
  colourId,
  colourName,
  ovr,
  snap,
  onBack,
  onChange,
  onExport,
  onImport,
}: {
  cat: Category;
  multiGrade: boolean;
  gradeId: string;
  gradeName: string;
  colourId: string;
  colourName: string;
  ovr: CategoryPricingOverride;
  snap: Record<string, SnapshotRow> | undefined;
  onBack: () => void;
  onChange: (next: CategoryPricingOverride) => void;
  onExport: () => void;
  onImport: () => void;
}) {
  const [matrix, setMatrix] = useState<PricingMatrix | null>(null);
  const [shape, setShape] = useState('');
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(false);
  const [newSize, setNewSize] = useState('');

  // Shapes the shop actually sells for this grade + colour, in sheet order, from
  // the mirror — so the chips match the storefront rather than the backend's
  // full shape list. Falls back to the backend matrix's shapes.
  const snapShapeList = (): string[] => {
    const cid = colourId === ALL ? '' : colourId;
    const out: string[] = [];
    const seen = new Set<string>();
    for (const k of Object.keys(snap || {})) {
      const [g, c, sh] = k.split('|');
      const gOk = g === gradeId || g === '';
      const cOk = colourId === ALL ? true : c === cid || c === '';
      if (gOk && cOk && !seen.has(sh)) { seen.add(sh); out.push(sh); }
    }
    return out;
  };
  const shapes = snapShapeList();
  const shapeChips = shapes.length ? shapes : matrix?.shapes ?? [];

  useEffect(() => {
    let stale = false;
    (async () => {
      try {
        const d = await adminApi.pricing(cat.key, shape || undefined);
        if (stale) return;
        setMatrix(d);
        if (!shape) setShape(shapes[0] || d.shape || '');
      } catch (e) {
        if (!stale) setError(e instanceof Error ? e.message : 'Could not load prices.');
      }
    })();
    return () => { stale = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat.key, shape]);

  const activeShape = shape && shapeChips.includes(shape) ? shape : shapeChips[0] || matrix?.shape || '';
  const unit = matrix?.unit || cat.unit || 'pc';
  const colSpecific = colourId !== ALL;

  const flashSaved = () => { setFlash(true); window.setTimeout(() => setFlash(false), 1400); };

  // The shop's real price/pcs for a row (falls back to the matrix estimate).
  const snapFor = (size: string): SnapshotRow | null => snapLook(snap, gradeId, colourId, activeShape, snapNorm(size));
  const autoRate = (size: string): number => {
    const s = snapFor(size);
    if (s) return s.rate;
    return matrix?.rows.find((r) => r.size === size)?.rate ?? 0;
  };
  const autoPcsOf = (size: string): number => {
    const s = snapFor(size);
    if (s && s.pcs > 0) return s.pcs;
    return matrix?.rows.find((r) => r.size === size)?.pcsPerPacket ?? 0;
  };

  // Flat-set (Navratna) and carat/strip categories price by the whole set / by
  // the carat or strip — none of them has an editable pieces-per-packet column.
  const flatSet = !!FLAT_SET_LABEL[cat.key];
  const noPacket = flatSet || CARAT_STRIP.has(cat.key) || opaqueCarat(cat.key, gradeId);
  // Whether the category is packet-sold — decides the Pcs column. Driven by the
  // unit/matrix only: the snapshot carries pcsPerPacket 1 for per-piece sheets
  // (e.g. Corundum), which must NOT turn on a packet column.
  const packet = !noPacket && (unit === 'pkt' || (matrix?.rows.some((r) => r.pcsPerPacket > 0) ?? false));

  const keysFor = (size: string) => priceKeys(multiGrade, gradeId, colourId, activeShape, snapNorm(size));
  const writeKey = (size: string) => keysFor(size)[0];

  const resolve = (size: string, auto: number): { rate: number; source: 'own' | 'inherit' | 'auto' } => {
    const keys = keysFor(size);
    const own = keys[0];
    for (const key of keys) {
      const v = ovr.price?.[key];
      if (v != null) return { rate: v, source: key === own ? 'own' : 'inherit' };
    }
    return { rate: auto, source: 'auto' };
  };

  const setPrice = (size: string, raw: string) => {
    const key = writeKey(size);
    const price = { ...(ovr.price ?? {}) };
    const n = parseFloat(raw);
    const auto = autoRate(size);
    if (raw.trim() === '' || Number.isNaN(n) || n === auto) delete price[key];
    else price[key] = n;
    onChange({ ...ovr, price });
    flashSaved();
  };

  const setPcs = (size: string, raw: string) => {
    const sn = snapNorm(size);
    const pcs = { ...(ovr.pcs ?? {}) };
    const n = parseInt(raw, 10);
    const auto = autoPcsOf(size);
    if (raw.trim() === '' || Number.isNaN(n) || n === auto) delete pcs[sn];
    else pcs[sn] = n;
    onChange({ ...ovr, pcs });
    flashSaved();
  };

  const addSize = () => {
    const s = normSize(newSize);
    if (!s) return;
    const add = { ...(ovr.addSizes ?? {}) };
    const list = new Set([...(add[activeShape] ?? []), s]);
    add[activeShape] = [...list];
    const del = { ...(ovr.delSizes ?? {}) };
    if (del[activeShape]) del[activeShape] = del[activeShape].filter((x) => x !== s);
    onChange({ ...ovr, addSizes: add, delSizes: del });
    setNewSize('');
    flashSaved();
  };

  const removeSize = (size: string, isAdded: boolean) => {
    if (isAdded) {
      const add = { ...(ovr.addSizes ?? {}) };
      add[activeShape] = (add[activeShape] ?? []).filter((x) => x !== size);
      onChange({ ...ovr, addSizes: add });
    } else {
      const del = { ...(ovr.delSizes ?? {}) };
      del[activeShape] = [...new Set([...(del[activeShape] ?? []), size])];
      onChange({ ...ovr, delSizes: del });
    }
    flashSaved();
  };

  const restoreSize = (size: string) => {
    const del = { ...(ovr.delSizes ?? {}) };
    del[activeShape] = (del[activeShape] ?? []).filter((x) => x !== size);
    onChange({ ...ovr, delSizes: del });
    flashSaved();
  };

  if (!matrix) return <section className="ad-card ad-card-pad ad-muted">Loading prices…</section>;

  const delList = ovr.delSizes?.[activeShape] ?? [];
  const addList = ovr.addSizes?.[activeShape] ?? [];
  // Sizes from the matrix and the snapshot, minus removed, plus admin-added.
  const activeShapeLc = activeShape.toLowerCase();
  const snapSizesForShape = Object.entries(snap ?? {})
    .filter(([key]) => {
      const [kg, kc, ksh] = key.split('|');
      const cid = colourId === ALL ? '' : colourId;
      return ksh === activeShapeLc && (kg === gradeId || kg === '') && (colourId === ALL ? kc === '' : kc === cid || kc === '');
    })
    .map(([, r]) => r.size);
  // The published sheet decides which sizes exist; the /admin/pricing chart is
  // only a fallback for a shape the snapshot doesn't cover. This is what stops a
  // sheet-priced category (e.g. Laser 0.60 mm+) from showing the generic chart.
  const sizeSource = snapSizesForShape.length ? snapSizesForShape : matrix.rows.map((r) => r.size);
  const baseSizes: string[] = [];
  const seenNorm = new Set<string>();
  sizeSource.forEach((s) => {
    const n = snapNorm(s);
    if (!seenNorm.has(n)) { seenNorm.add(n); baseSizes.push(s); }
  });
  const autoSizes = baseSizes.filter((s) => !delList.includes(s));
  const rows = [
    ...autoSizes.map((s) => ({ size: s, added: false })),
    ...addList.filter((s) => !autoSizes.some((a) => snapNorm(a) === snapNorm(s))).map((s) => ({ size: s, added: true })),
  ];

  const unitLabel = rateUnitLabel(cat.key, gradeId, unit);

  return (
    <section className="ad-card ad-card-pad">
      <div className="pr-editor-top">
        <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={onBack}>← {cat.name} colours</button>
        <span className="ad-muted" style={{ fontSize: 13 }}>
          {cat.name}{multiGrade && gradeName ? ` · ${gradeName}` : ''} · <b>{colourName}</b>
        </span>
        <span className="pr-editor-spacer" />
        {flash && <span className="pr-flash">● Change staged — click Save changes</span>}
        <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={onExport}>⬇ Excel — {colourName}</button>
        <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={onImport} title="Upload an edited price list">⬆ Upload</button>
      </div>

      <div className="pr-chips">
        <span className="ad-label" style={{ marginRight: 6 }}>SHAPE</span>
        {shapeChips.map((s) => (
          <button key={s} className={`pr-chip ${s === activeShape ? 'on' : ''}`} onClick={() => setShape(s)}>{s}</button>
        ))}
      </div>

      <div className="th-head" style={{ marginTop: 8 }}>
        <h3 className="ad-sechead-h">Size × price ({activeShape} · {colourName})</h3>
        <span className="th-count">{unitLabel} · edits are staged until you Save changes</span>
      </div>

      {error && <div className="ad-error">{error}</div>}

      <div className="pi-scroll">
        <table className="pi-table">
          <thead>
            <tr>
              <th>Size</th>
              <th>Rate ₹</th>
              {packet && <th>Pcs / packet</th>}
              <th>Note</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ size, added }) => {
              const auto = autoRate(size);
              const autoPcs = autoPcsOf(size);
              const r = resolve(size, auto);
              const pcsVal = ovr.pcs?.[snapNorm(size)] ?? autoPcs;
              const pcsCustom = ovr.pcs?.[snapNorm(size)] != null;
              const snapRow = snapFor(size);
              const note =
                r.source === 'own'
                  ? colSpecific ? `custom for ${colourName}` : 'custom · overrides auto'
                  : r.source === 'inherit'
                    ? 'from All-colours rate'
                    : snapRow?.base
                      ? 'base rate (no sheet yet)'
                      : snapRow ? 'live Sales App price' : 'auto from base × size multiplier';
              return (
                <tr key={size}>
                  <td>{size}{added && <span className="pr-added"> · added</span>}</td>
                  <td>
                    <input
                      className={`ad-input pr-num ${r.source === 'own' ? 'pr-custom' : ''}`}
                      type="number"
                      defaultValue={r.rate}
                      key={`${size}-${activeShape}-${colourId}-rate-${r.rate}`}
                      onBlur={(e) => setPrice(size, e.target.value)}
                    />
                  </td>
                  {packet && (
                    <td>
                      <input
                        className={`ad-input pr-num ${pcsCustom ? 'pr-custom' : ''}`}
                        type="number"
                        defaultValue={pcsVal}
                        key={`${size}-pcs-${pcsVal}`}
                        onBlur={(e) => setPcs(size, e.target.value)}
                      />
                    </td>
                  )}
                  <td className="ad-muted" style={{ fontSize: 12.5 }}>{note}</td>
                  <td>
                    <button className="ad-btn ad-btn-ghost ad-btn-sm ad-danger" onClick={() => removeSize(size, added)}>Remove</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pr-addrow">
        <input
          className="ad-input"
          placeholder="＋ Add size (e.g. 9.00 or 10x8)"
          value={newSize}
          onChange={(e) => setNewSize(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addSize(); }}
          style={{ maxWidth: 240 }}
        />
        <button className="ad-btn ad-btn-pri ad-btn-sm" onClick={addSize}>Add size</button>
      </div>

      {delList.length > 0 && (
        <div className="pr-removed">
          <span className="ad-muted">Removed sizes:</span>
          {delList.map((s) => (
            <button key={s} className="ad-btn ad-btn-ghost ad-btn-sm" onClick={() => restoreSize(s)}>{s} — restore</button>
          ))}
        </div>
      )}
    </section>
  );
}
