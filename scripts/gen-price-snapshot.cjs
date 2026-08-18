#!/usr/bin/env node
/*
 * gen-price-snapshot.cjs — publish the shop's REAL prices for the Admin panel.
 *
 * The storefront (docs/app/data.jsx) carries the hand-entered price sheets that
 * customers actually see (Corundum, Colour CZ, Alpanite, Pearls, …). Those live
 * in code, so the Admin > Pricing editor — which reads the database — showed ₹0
 * for them. This script loads data.jsx exactly as the browser does, walks every
 * category with the SHOP'S OWN size/sku functions and ids, and writes the
 * resolved price + pieces-per-packet to docs/price-snapshot.json. The editor
 * reads that file so it shows the true numbers as the starting point.
 *
 * It never invents a price: every number comes straight from calling the same
 * function the shop calls. A combination that isn't priced is simply omitted
 * (the editor then falls back to its estimate, as before) — never guessed.
 *
 * Re-run whenever a price sheet in data.jsx changes:
 *     node scripts/gen-price-snapshot.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const Babel = require(path.join(ROOT, 'docs', 'vendor', 'babel.min.js'));

// Minimal browser shims — these files only need window/localStorage while they
// define their tables and functions; their React components are never rendered.
const win = {};
const shimLocal = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const shimReact = { createElement: () => null, Fragment: 'Fragment', useState: () => [null, () => {}], useEffect: () => {} };
const shimDoc = { createElement: () => ({ style: {} }), getElementById: () => null };

// Load one storefront .jsx into `win`. `prefix` neutralises a harmless
// in-browser quirk (a bare identifier that only survives because top-level
// function declarations become globals) so the file evaluates under Node.
function loadInto(relPath, prefix = '') {
  const code = Babel.transform(fs.readFileSync(path.join(ROOT, relPath), 'utf8'), { presets: ['react'] }).code;
  try {
    // eslint-disable-next-line no-new-func
    const run = new Function('window', 'localStorage', 'React', 'document', 'navigator', prefix + code + '\n;return window;');
    Object.assign(win, run(win, shimLocal, shimReact, shimDoc, { language: 'en' }));
  } catch (e) {
    console.error(`Failed to evaluate ${relPath}:`, e.message);
    process.exit(1);
  }
}

loadInto('docs/app/data.jsx');
// laser-data.jsx references an undefined LASER_ROUND on its last line (only the
// browser tolerates it); declare it so the file loads cleanly here too.
loadInto('docs/app/laser-data.jsx', 'var LASER_ROUND;\n');
loadInto('docs/app/mop-data.jsx');
loadInto('docs/app/icecut-data.jsx');

const COLORS = win.COLORS_BY_CATEGORY || {};
const GRADES = win.GRADES_BY_CATEGORY || {};
const SHAPES = win.SHAPES_BY_CATEGORY || {};

// Same size normalisation the storefront and the /admin/pricing route use, so a
// snapshot key matches the size string the editor looks it up with.
function normSize(s) {
  const t = String(s == null ? '' : s).trim().toLowerCase().replace(/×/g, 'x').replace(/\s+/g, '');
  return t.replace(/(\d+(?:\.\d*?[1-9])?)\.?0*(?=\D|$)/g, '$1');
}

// Per-category descriptors. `scope` says which ids the sheet keys on; the two
// callbacks defer to the shop's own functions so ids and mappings stay correct.
// sizesOf(gid, cid, shape) -> [size,…]; skuOf(gid, cid, shape, size) -> {price, pcsPerPacket}|null.
const g = (n) => win[n];
const DESCS = [
  // grade + colour
  { cat: 'corundum', scope: 'gc', sizesOf: (gid, cid, sh) => call('corSizes', gid, cid, sh), skuOf: (gid, cid, sh, sz) => call('corSku', gid, cid, sh, sz) },
  { cat: 'cz', scope: 'gc', sizesOf: (gid, cid, sh) => call('colorCzSizes', gid, cid, sh), skuOf: (gid, cid, sh, sz) => call('colorCzSku', gid, cid, sh, sz) },
  { cat: 'labopal', scope: 'gc', sizesOf: (gid, cid, sh) => call('labopalSizes', gid, cid, sh), skuOf: (gid, cid, sh, sz) => call('labopalSku', gid, cid, sh, sz) },
  { cat: 'cabochon', scope: 'gc', sizesOf: (gid, cid, sh) => call('cabSizes', gid, cid, sh), skuOf: (gid, cid, sh, sz) => call('cabSku', gid, cid, sh, sz) },
  { cat: 'pearls', scope: 'gc', sizesOf: (gid, cid, sh) => call('pearlSheetSizes', gid, cid, sh), skuOf: (gid, cid, sh, sz) => call('pearlSheetSku', gid, cid, sh, sz) },
  { cat: 'rajkot', scope: 'gc', sizesOf: (gid, cid, sh) => call('rajkotSizes', gid, cid, sh), skuOf: (gid, cid, sh, sz) => call('rajkotSku', gid, cid, sh, sz) },
  // grade only
  { cat: 'highdensity', scope: 'g', sizesOf: (gid, cid, sh) => call('hdSizes', gid, sh), skuOf: (gid, cid, sh, sz) => call('hdSku', gid, sh, sz) },
  { cat: 'whitefancy', scope: 'g', sizesOf: (gid, cid, sh) => call('wfSizes', gid, sh), skuOf: (gid, cid, sh, sz) => call('wfSku', gid, sh, sz) },
  { cat: 'whitecz', scope: 'g', sizesOf: (gid, cid, sh) => call('czSizes', gid, sh), skuOf: (gid, cid, sh, sz) => call('czSku', gid, sh, sz) },
  { cat: 'opaque', scope: 'g', sizesOf: (gid, cid, sh) => call('opaqueSizes', gid, sh), skuOf: (gid, cid, sh, sz) => call('opaqueSku', gid, sh, sz) },
  { cat: 'polki', scope: 'g', sizesOf: (gid, cid, sh) => call('polkiSizes', gid, sh), skuOf: (gid, cid, sh, sz) => call('polkiSku', gid, sh, sz) },
  { cat: 'hollowmop', scope: 'g', sizesOf: (gid, cid, sh) => call('hollowmopSizes', gid, sh), skuOf: (gid, cid, sh, sz) => call('hollowmopSku', gid, sh, sz) },
  { cat: 'coral', scope: 'g', sizesOf: (gid, cid, sh) => call('coralSizes', gid, sh), skuOf: (gid, cid, sh, sz) => call('coralSku', gid, sh, sz) },
  // no grade / no colour
  { cat: 'alex', scope: 'n', sizesOf: (gid, cid, sh) => call('alexSizes', sh), skuOf: (gid, cid, sh, sz) => call('alexSku', sh, sz) },
  { cat: 'labwhitecorundum', scope: 'n', sizesOf: (gid, cid, sh) => call('lwcSizes', sh), skuOf: (gid, cid, sh, sz) => call('lwcSku', sh, sz) },
  { cat: 'evileye', scope: 'n', sizesOf: (gid, cid, sh) => call('evileyeSizes', sh), skuOf: (gid, cid, sh, sz) => call('evileyeSku', sh, sz) },
  // alpanite: green/blue have dedicated sheets, other colours share alpSheet*
  { cat: 'alpanite', scope: 'c', sizesOf: (gid, cid, sh) => alpSizes(cid, sh), skuOf: (gid, cid, sh, sz) => alpSku(cid, sh, sz) },
  // ourosa: per-colour sheet (OUROSA_SHEETS); sizes are the shared PP-size list,
  // ourosaSku returns null for any the colour/shape doesn't carry.
  { cat: 'ourosa', scope: 'c', sizesOf: () => (win.OUROSA_SIZES || []).map((x) => x[0]), skuOf: (gid, cid, sh, sz) => call('ourosaSku', cid, sh, sz) },
];

function call(name, ...args) {
  const fn = g(name);
  if (typeof fn !== 'function') return null;
  try { return fn(...args); } catch { return null; }
}
function alpSizes(cid, sh) {
  if (cid === 'green') return call('alpGreenSizes', sh);
  if (cid === 'blue') return call('alpBlueSizes', sh);
  return call('alpSheetSizes', cid, sh);
}
function alpSku(cid, sh, sz) {
  if (cid === 'green') return call('alpGreenSku', sh, sz);
  if (cid === 'blue') return call('alpBlueSku', sh, sz);
  return call('alpSheetSku', cid, sh, sz);
}

// Sub-levels (screen-browse.jsx): a grade may have sub-grades (White CZ Elements
// → Thin/Normal/H/HEA) that price by the COMBINED id (elements-thin); a colour
// may have sub-shades (CZ Aqua → #37/#38/#39) which are cosmetic and price the
// SAME as the base colour. So we expand grades for pricing, keep colours at base.
const COLOUR_BY_GRADE = {
  opaque: win.OPAQUE_COLORS_BY_GRADE, pearls: win.PEARL_COLORS_BY_GRADE, corundum: win.CORUNDUM_COLORS_BY_GRADE,
  labgrown: win.LABGROWN_COLORS_BY_GRADE, cz: win.CZ_COLORS_BY_GRADE, rajkot: win.RAJKOT_COLORS_BY_GRADE,
};
function effGrades(cat) {
  const out = [];
  for (const g of GRADES[cat] || []) {
    // Spread the base grade so basePrice/mult carry to the sub-grade; override id/name.
    if (g.subGrades && g.subGrades.length) for (const s of g.subGrades) out.push({ ...g, id: g.id + '-' + s.id, name: s.name, base: g.id, subGrades: undefined });
    else out.push({ ...g, base: g.id });
  }
  return out.length ? out : [{ id: '', name: '', base: '' }];
}
// Base colours the shop shows for a category + base grade (no sub-shade expansion).
function baseColours(cat, baseGradeId) {
  const m = COLOUR_BY_GRADE[cat];
  return (m && baseGradeId && m[baseGradeId]) ? m[baseGradeId] : (COLORS[cat] || []);
}

// Several categories decide their shapes per GRADE, not per category: White
// Fancy sells Round in Au Desus, Polki's shapes differ by series, and so on.
// Mirroring only SHAPES_BY_CATEGORY left those grade-only shapes out of the
// snapshot entirely — the shop priced and sold them, while the Pricing editor
// could not see them to edit. Resolve shapes the same way the browse screen
// does, falling back to the category list when a grade has no table.
const SHAPES_BY_GRADE = {
  whitefancy: win.WHITEFANCY_SHAPES_BY_GRADE,
  polki: win.POLKI_SHAPES_BY_GRADE,
  pearls: win.PEARL_SHAPES_BY_GRADE,
  navratna: win.NAVRATNA_SHAPES_BY_GRADE,
};
function shapesFor(cat, gradeId) {
  const perGrade = SHAPES_BY_GRADE[cat];
  const list = perGrade && gradeId ? perGrade[gradeId] : null;
  return Array.isArray(list) && list.length ? list : (SHAPES[cat] || []);
}

const snapshot = {};
let rows = 0;
for (const d of DESCS) {
  const useGrade = d.scope === 'gc' || d.scope === 'g';
  const useColour = d.scope === 'gc' || d.scope === 'c';
  const grades = useGrade ? effGrades(d.cat) : [{ id: '', base: '' }];
  const catOut = {};
  for (const gr of grades) {
    const shapes = shapesFor(d.cat, gr.id || gr.base);
    const colours = useColour ? (baseColours(d.cat, gr.base).length ? baseColours(d.cat, gr.base) : [{ id: '' }]) : [{ id: '' }];
    for (const co of colours) {
      for (const sh of shapes) {
        const sizes = d.sizesOf(gr.id, co.id, sh) || [];
        if (!Array.isArray(sizes)) continue;
        for (const size of sizes) {
          const sku = d.skuOf(gr.id, co.id, sh, size);
          if (!sku || typeof sku.price !== 'number' || !(sku.price > 0)) continue;
          const key = [useGrade ? gr.id || '' : '', useColour ? co.id || '' : '', String(sh).toLowerCase(), normSize(size)].join('|');
          catOut[key] = { rate: sku.price, pcs: Number(sku.pcsPerPacket) > 0 ? Number(sku.pcsPerPacket) : 0, size: String(size) };
          rows++;
        }
      }
    }
  }
  if (Object.keys(catOut).length) snapshot[d.cat] = catOut;
}

// Laser Engraved — its own pad (laser-data.jsx): a per-size LIST price and a
// size-tiered discount. We publish the NET price (list × (1 − discount)), which
// is exactly what the customer pays and what the Sales App shows as "Net ₹/pc".
// The price is the same for every colour, so it's stored colour/grade-agnostic.
if (typeof win.laserRows === 'function' && typeof win.laserDiscount === 'function') {
  const tables = win.LASER_TABLES || {};
  const laserOut = {};
  let n = 0;
  for (const sh of Object.keys(tables)) {
    for (const r of win.laserRows(sh) || []) {
      if (r.price == null) continue;
      const net = Math.round(r.price * (1 - win.laserDiscount(sh, r.mm, false)) * 100) / 100;
      laserOut[['', '', String(sh).toLowerCase(), normSize(r.s)].join('|')] = {
        rate: net,
        pcs: Number(r.pk) > 0 ? Number(r.pk) : 0,
        size: r.s,
      };
      n++;
    }
  }
  if (n) { snapshot.laser = laserOut; rows += n; }
  const lr = snapshot.laser || {};
  const ls = Object.keys(lr).filter((k) => k.split('|')[2] === 'round').slice(0, 5);
  console.log(`Laser: ${n} net rows. round sample:`, ls.map((k) => `${lr[k].size}=₹${lr[k].rate}`).join(', '));
}

// MOP — its own pad (mop-data.jsx): per-piece price by White/Black grade, keyed
// on shape+size, with pcs-per-packet on the row. Grade-scoped (colour agnostic).
if (typeof win.mopRows === 'function' && typeof win.mopPrice === 'function') {
  const grades = GRADES.mop || [];
  const shapes = SHAPES.mop || [];
  const mopOut = {};
  let n = 0;
  for (const gr of grades) {
    for (const sh of shapes) {
      for (const r of win.mopRows(sh) || []) {
        const price = win.mopPrice(sh, gr.id, r.s);
        if (price == null || !(price > 0)) continue;
        mopOut[[gr.id, '', String(sh).toLowerCase(), normSize(r.s)].join('|')] = {
          rate: price,
          pcs: Number(r.ppp) > 0 ? Number(r.ppp) : 0,
          size: r.s,
        };
        n++;
      }
    }
  }
  if (n) { snapshot.mop = mopOut; rows += n; }
  console.log(`MOP: ${n} rows.`);
}

// Ice Cut — its own pad (icecut-data.jsx): per-piece price by colour TIER
// (white/normal/special1/special2/paribas) × shape-group, pcs by size (MOQ).
if (typeof win.icecutRows === 'function' && win.TIER_COL && typeof win.ICECUT_MOQ === 'function') {
  const colours = COLORS.icecut || [];
  const shapes = SHAPES.icecut || [];
  const iceOut = {};
  let n = 0;
  for (const co of colours) {
    const col = win.TIER_COL[co.id];
    if (!col) continue;
    for (const sh of shapes) {
      for (const r of win.icecutRows(sh) || []) {
        const price = r[col];
        if (price == null || !(price > 0)) continue;
        iceOut[['', co.id, String(sh).toLowerCase(), normSize(r.s)].join('|')] = {
          rate: price,
          pcs: win.ICECUT_MOQ(r.s),
          size: r.s,
        };
        n++;
      }
    }
  }
  if (n) { snapshot.icecut = iceOut; rows += n; }
  console.log(`Ice Cut: ${n} rows.`);
}

// Moissanite — per CARAT (unit 'ct'). MOISS_PRICE[shape][size] = [def ₹/ct,
// gh ₹/ct]; colour-agnostic, so grade-scoped. No packet (pcs 0).
if (win.MOISS_PRICE && typeof win.moissRate === 'function') {
  const grades = GRADES.moissanite || [];
  const moissOut = {};
  let n = 0;
  for (const gr of grades) {
    for (const sh of Object.keys(win.MOISS_PRICE)) {
      for (const size of Object.keys(win.MOISS_PRICE[sh])) {
        const rate = win.moissRate(sh, size, gr.id);
        if (rate == null || !(rate > 0)) continue;
        moissOut[[gr.id, '', String(sh).toLowerCase(), normSize(size)].join('|')] = { rate, pcs: win.moissPcsPerCt(sh, size), size };
        n++;
      }
    }
  }
  if (n) { snapshot.moissanite = moissOut; rows += n; }
  const mr = snapshot.moissanite || {};
  const ms = Object.keys(mr).filter((k) => k.startsWith('def|') && k.includes('|round|')).slice(0, 4);
  console.log(`Moissanite: ${n} carat rows. def round sample:`, ms.map((k) => `${mr[k].size}=₹${mr[k].rate}/ct`).join(', '));
}

// Navratna — one flat ₹ per SET (1 set = 9 stones = 1 packet). navPrice returns
// the set price; grade-scoped (natural/created), colour-agnostic. pcs 9 (fixed).
if (typeof win.navPrice === 'function' && typeof win.navSizes === 'function') {
  const grades = GRADES.navratna || [];
  const shapes = SHAPES.navratna || [];
  const navOut = {};
  let n = 0;
  for (const gr of grades) {
    for (const sh of shapes) {
      for (const size of win.navSizes(gr.id, sh) || []) {
        const price = win.navPrice(gr.id, sh, size);
        if (price == null || !(price > 0)) continue;
        navOut[[gr.id, '', String(sh).toLowerCase(), normSize(size)].join('|')] = { rate: price, pcs: 9, size };
        n++;
      }
    }
  }
  if (n) { snapshot.navratna = navOut; rows += n; }
  console.log(`Navratna: ${n} set rows.`);
}

// Multi-Sapphire — msRate is ₹/carat for Natural (aaa) and ₹/strip for the
// other grades; grade-scoped, colour-agnostic. No packet column (pcs 0).
if (typeof win.msRate === 'function' && typeof win.msSizes === 'function' && typeof win.msShapes === 'function') {
  const grades = GRADES.multisapphire || [];
  const msOut = {};
  let n = 0;
  for (const gr of grades) {
    for (const sh of win.msShapes(gr.id) || []) {
      for (const size of win.msSizes(gr.id, sh) || []) {
        const rate = win.msRate(gr.id, sh, size);
        if (rate == null || !(rate > 0)) continue;
        msOut[[gr.id, '', String(sh).toLowerCase(), normSize(size)].join('|')] = { rate, pcs: win.pcsPerCt(size), size };
        n++;
      }
    }
  }
  if (n) { snapshot.multisapphire = msOut; rows += n; }
  console.log(`Multi-Sapphire: ${n} rows (carat + strip).`);
}

// Lab Grown — three grades, three models:
//  · created     → ₹/carat  (lgCreatedCt), colour-agnostic
//  · labcorundum → ₹/piece  (lgCorPrice),  colour-agnostic
//  · labgrown    → ₹/piece  (lgPricePc),   per colour (Beryl)
{
  const shapes = SHAPES.labgrown || [];
  const colours = COLORS.labgrown || [];
  const lgOut = {};
  let n = 0;
  if (typeof win.lgCreatedCt === 'function' && typeof win.lgCreatedSizes === 'function') {
    for (const sh of shapes) for (const size of win.lgCreatedSizes(sh) || []) {
      const rate = win.lgCreatedCt(sh, size);
      if (rate == null || !(rate > 0)) continue;
      lgOut[['created', '', String(sh).toLowerCase(), normSize(size)].join('|')] = { rate, pcs: win.pcsPerCt(size), size };
      n++;
    }
  }
  if (typeof win.lgCorPrice === 'function' && typeof win.lgCorSizes === 'function') {
    for (const sh of shapes) for (const size of win.lgCorSizes(sh) || []) {
      const rate = win.lgCorPrice(sh, size);
      if (rate == null || !(rate > 0)) continue;
      lgOut[['labcorundum', '', String(sh).toLowerCase(), normSize(size)].join('|')] = { rate, pcs: 0, size };
      n++;
    }
  }
  if (typeof win.lgPricePc === 'function' && typeof win.lgSizes === 'function') {
    for (const co of colours) for (const sh of shapes) for (const size of win.lgSizes(co.id, sh) || []) {
      const rate = win.lgPricePc(co.id, sh, size);
      if (rate == null || !(rate > 0)) continue;
      lgOut[['labgrown', co.id, String(sh).toLowerCase(), normSize(size)].join('|')] = { rate, pcs: 0, size };
      n++;
    }
  }
  if (n) { snapshot.labgrown = lgOut; rows += n; }
  console.log(`Lab Grown: ${n} rows (created ₹/ct, corundum + beryl ₹/pc).`);
}

// Polki · White & Moissanite series — design-based. Each series (B/C/X/Z/PCJ/GJ)
// is a SUB-GRADE (white-b, samosa-gj) whose designs each have their own ₹/pc +
// pcs. Keyed by the effective sub-grade, shape 'uneven', design name as size.
// (Regular + Kundan Foil are standard polkiSku sheets, mirrored via DESCS.)
{
  const SETS = { white: win.POLKI_SERIES_DESIGNS, samosa: win.POLKI_SAMOSA_DESIGNS };
  const out = snapshot.polki || {};
  let n = 0;
  for (const baseId of Object.keys(SETS)) {
    const set = SETS[baseId];
    if (!set) continue;
    for (const series of Object.keys(set)) {
      const effGrade = baseId + '-' + String(series).toLowerCase();
      for (const d of set[series] || []) {
        if (d.price == null || !(d.price > 0)) continue;
        out[[effGrade, 'default', 'uneven', normSize(d.name)].join('|')] = {
          rate: d.price,
          pcs: Number(d.pcsPerPacket) > 0 ? Number(d.pcsPerPacket) : 0,
          size: d.name,
        };
        n++;
      }
    }
  }
  if (n) snapshot.polki = out;
  console.log(`Polki series designs: ${n} rows.`);
}

// Opaque · Natural-look — per grade+colour ₹/carat sheet (opaqueNatRate), sold
// as a 100 ct lot. Separate from the Opal sheet (opaqueSku, already mirrored).
if (typeof win.opaqueNatSizes === 'function' && typeof win.opaqueNatRate === 'function') {
  const CBG = win.OPAQUE_COLORS_BY_GRADE || {};
  const out = snapshot.opaque || {};
  let n = 0;
  for (const g of GRADES.opaque || []) {
    for (const co of CBG[g.id] || COLORS.opaque || []) {
      const shapes = co.shapes && co.shapes.length ? co.shapes : SHAPES.opaque || [];
      for (const sh of shapes) {
        for (const size of win.opaqueNatSizes(g.id, co.id, sh) || []) {
          const rate = win.opaqueNatRate(g.id, co.id, sh, size);
          if (rate == null || !(rate > 0)) continue;
          out[[g.id, co.id, String(sh).toLowerCase(), normSize(size)].join('|')] = { rate, pcs: 0, size };
          n++;
        }
      }
    }
  }
  if (n) snapshot.opaque = out;
  console.log(`Opaque natural (₹/ct): ${n} rows.`);
}

// ---- Base-priced colours ---------------------------------------------------
// Some colours a grade sells have no dedicated sheet (e.g. Corundum EXCEL AAA ·
// Blue 34, all Beads). The shop prices those off grade.basePrice × colour.mult
// × size via unitRate(). We reproduce that with the shop's OWN helpers so the
// numbers are identical. Restricted to categories that use the standard size
// pad with no special pricing mode — carat-lot (opaque), string/lot (pearls),
// design series (polki) and the grid-less Bracelet are left alone on purpose.
const BASE_OK = new Set(['corundum', 'cz', 'whitecz', 'clover', 'beads', 'rajkot', 'pearls', 'polki']);
{
  const CATS = win.CATEGORIES || [];
  const CBG = {
    corundum: win.CORUNDUM_COLORS_BY_GRADE,
    cz: win.CZ_COLORS_BY_GRADE,
    rajkot: win.RAJKOT_COLORS_BY_GRADE,
    pearls: win.PEARL_COLORS_BY_GRADE,
  };
  const SIZES_CAT = win.SIZES_BY_CATEGORY || {};
  const FULL = win.FULL_SIZES || {};
  let n = 0;
  for (const c of CATS) {
    const cat = c.id;
    if (!BASE_OK.has(cat)) continue;
    const unit = win.catUnit ? win.catUnit(cat) : 'pc';
    for (const g of effGrades(cat)) {
      const colours = baseColours(cat, g.base);
      for (const col of colours) {
        // Skip a colour already served by a REAL row for this (effective) grade —
        // including a colour-agnostic sheet (kc==='') so a base row never shadows
        // a real one (e.g. White CZ elements-thin is priced colour-agnostically).
        const rowsCat = snapshot[cat] || {};
        if (Object.keys(rowsCat).some((k) => { const [kg, kc] = k.split('|'); return (kg === g.id || kg === '') && (kc === col.id || kc === '') && !rowsCat[k].base; })) continue;
        const shapes = col.shapes && col.shapes.length ? col.shapes : SHAPES[cat] || [];
        for (const sh of shapes) {
          const product = win.makeBrowseProduct(cat, g, col, sh);
          let sizes = SIZES_CAT[cat] && SIZES_CAT[cat].length ? SIZES_CAT[cat] : FULL[sh] || ['4.00 mm'];
          if (col.sizeMax) sizes = sizes.filter((s) => (parseFloat(s) || 0) <= col.sizeMax + 0.001);
          if (col.sizeMin) sizes = sizes.filter((s) => /x/i.test(s) || (parseFloat(s) || 0) >= col.sizeMin - 0.001);
          for (const size of sizes) {
            const key = [g.id, col.id, String(sh).toLowerCase(), normSize(size)].join('|');
            if (rows[key]) continue;
            const rate = unit === 'ct' ? win.sizePerCtPrice(product, size) : unit === 'strip' ? product.price : win.sizeUnitPrice(product, size);
            if (rate == null || !(rate > 0)) continue;
            (snapshot[cat] = snapshot[cat] || {})[key] = { rate, pcs: unit === 'pkt' ? win.packetPcs(cat, size) : 0, size, base: true };
            n++;
          }
        }
      }
    }
  }
  console.log(`Base-priced rows: ${n}`);
}

// Bracelet — one flat price per style (grade.basePrice), no sizes/colours vary.
// Publish a single synthetic row per grade so the flat price is editable in the
// same panel; the storefront BraceletOrderPad reads the override.
if ((GRADES.bracelet || []).length) {
  const out = {};
  let n = 0;
  for (const g of GRADES.bracelet) {
    if (!(g.basePrice > 0)) continue;
    out[[g.id, '', 'bracelet', normSize('Per bracelet')].join('|')] = { rate: g.basePrice, pcs: 0, size: 'Per bracelet' };
    n++;
  }
  if (n) snapshot.bracelet = out;
  console.log(`Bracelet: ${n} flat style rows.`);
}

// ---- Navigation structure -------------------------------------------------
// Publish the shop's EXACT Category → Grade → Colour flow so the Admin Pricing
// screen matches the storefront (grade bifurcation, per-grade colours), instead
// of the drifted backend catalog. This mirrors screen-browse.jsx's own logic:
// grades = GRADES_BY_CATEGORY[cat]; colours per grade come from the category's
// *_COLORS_BY_GRADE map where one exists, else COLORS_BY_CATEGORY[cat].
{
  const CATS = win.CATEGORIES || [];
  // A colour keeps its sub-shades (cosmetic variants) for the flow; a grade keeps
  // its sub-grades (which change price). coloursByGrade is keyed by the BASE grade
  // id — the shop resolves colours by the base grade, then the sub-grade is chosen.
  const slimColour = (x) => ({
    id: x.id, name: x.name, hex: x.hex || '#CCCCCC',
    subShades: x.subShades && x.subShades.length ? x.subShades.map((s) => ({ id: s.id, name: s.name, hex: s.hex || x.hex || '#CCCCCC' })) : undefined,
  });
  const catalog = {};
  for (const c of CATS) {
    const cat = c.id;
    const grades = (GRADES[cat] || []).map((g) => ({
      id: g.id, name: g.name,
      subGrades: g.subGrades && g.subGrades.length ? g.subGrades.map((s) => ({ id: s.id, name: s.name })) : undefined,
    }));
    const coloursByGrade = {};
    const source = (GRADES[cat] || []).length ? GRADES[cat] : [{ id: '' }];
    for (const g of source) {
      coloursByGrade[g.id] = baseColours(cat, g.id).map(slimColour);
    }
    // The shop's own shape order, per grade. Key insertion order in the
    // price tables is NOT this order — moissanite alone ships baguette and
    // tapered the other way round — so the apps had nothing authoritative to
    // sort their shape grid by.
    const shapesByGrade = {};
    for (const g of source) shapesByGrade[g.id] = shapesFor(cat, g.id);
    catalog[cat] = { name: c.name, unit: win.catUnit(cat), grades, coloursByGrade, shapesByGrade };
  }
  snapshot.__catalog__ = catalog;
  console.log(`Catalog: ${Object.keys(catalog).length} categories with grade/colour flow.`);
}

const outPath = path.join(ROOT, 'docs', 'price-snapshot.json');
fs.writeFileSync(outPath, JSON.stringify(snapshot));
console.log(`Wrote ${outPath}: ${Object.keys(snapshot).length} categories, ${rows} priced rows.`);
// Spot-check a few known Corundum oval values so a silent mapping break is loud.
const cor = snapshot.corundum || {};
const sample = Object.keys(cor).filter((k) => k.includes('|oval|')).slice(0, 6);
console.log('Corundum oval sample:', sample.map((k) => `${k} => ₹${cor[k].rate}`).join('  |  ') || '(none)');
