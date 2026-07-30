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
const src = fs.readFileSync(path.join(ROOT, 'docs', 'app', 'data.jsx'), 'utf8');
const code = Babel.transform(src, { presets: ['react'] }).code;

// Minimal browser shims — data.jsx only needs window/localStorage while it
// defines its tables and functions; its React components are never rendered.
const win = {};
const shimLocal = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const shimReact = { createElement: () => null, Fragment: 'Fragment', useState: () => [null, () => {}], useEffect: () => {} };
const shimDoc = { createElement: () => ({ style: {} }), getElementById: () => null };
try {
  // eslint-disable-next-line no-new-func
  const run = new Function('window', 'localStorage', 'React', 'document', 'navigator', code + '\n;return window;');
  Object.assign(win, run(win, shimLocal, shimReact, shimDoc, { language: 'en' }));
} catch (e) {
  console.error('Failed to evaluate data.jsx:', e.message);
  process.exit(1);
}

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

const snapshot = {};
let rows = 0;
for (const d of DESCS) {
  const grades = d.scope === 'gc' || d.scope === 'g' ? (GRADES[d.cat] || [{ id: '' }]) : [{ id: '' }];
  const colours = d.scope === 'gc' || d.scope === 'c' ? (COLORS[d.cat] || [{ id: '' }]) : [{ id: '' }];
  const shapes = SHAPES[d.cat] || [];
  const catOut = {};
  for (const gr of grades) {
    for (const co of colours) {
      for (const sh of shapes) {
        const sizes = d.sizesOf(gr.id, co.id, sh) || [];
        if (!Array.isArray(sizes)) continue;
        for (const size of sizes) {
          const sku = d.skuOf(gr.id, co.id, sh, size);
          if (!sku || typeof sku.price !== 'number' || !(sku.price > 0)) continue;
          const key = [d.scope === 'gc' || d.scope === 'g' ? gr.id || '' : '', d.scope === 'gc' || d.scope === 'c' ? co.id || '' : '', sh, normSize(size)].join('|');
          catOut[key] = { rate: sku.price, pcs: Number(sku.pcsPerPacket) > 0 ? Number(sku.pcsPerPacket) : 0, size: String(size) };
          rows++;
        }
      }
    }
  }
  if (Object.keys(catOut).length) snapshot[d.cat] = catOut;
}

const outPath = path.join(ROOT, 'docs', 'price-snapshot.json');
fs.writeFileSync(outPath, JSON.stringify(snapshot));
console.log(`Wrote ${outPath}: ${Object.keys(snapshot).length} categories, ${rows} priced rows.`);
// Spot-check a few known Corundum oval values so a silent mapping break is loud.
const cor = snapshot.corundum || {};
const sample = Object.keys(cor).filter((k) => k.includes('|oval|')).slice(0, 6);
console.log('Corundum oval sample:', sample.map((k) => `${k} => ₹${cor[k].rate}`).join('  |  ') || '(none)');
