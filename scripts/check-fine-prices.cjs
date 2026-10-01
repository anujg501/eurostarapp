#!/usr/bin/env node
/*
 * check-fine-prices.cjs — price every Eurostar Fine design, every option, both
 * karats, from the trade shop's real price mirror. Fails (exit 1) if any stone
 * a design uses has no shop price, so a sheet change can't silently break the
 * jewellery site. Run after `node scripts/gen-price-snapshot.cjs`.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
require(path.join(ROOT, 'docs/fine/pricing.js'));
require(path.join(ROOT, 'docs/fine/designs.js'));
const P = globalThis.FinePricing, { DESIGNS } = globalThis.FineDesigns;
P.init({
  snapshot: JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/price-snapshot.json'), 'utf8')),
  weights: JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/fine/moiss-weights.json'), 'utf8')),
  goldRate: JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/fine/gold-rate.json'), 'utf8')),
});
console.log(`24K rate ₹${P.gold24}/g (as of ${P.rateAsOf})\n`);
let bad = 0;
for (const d of DESIGNS) {
  const slot = d.stones.find((s) => s.choose);
  const gems = slot ? slot.choose : [null];
  for (const gem of gems) {
    const q14 = P.quote(d, { karat: 14, gem }), q18 = P.quote(d, { karat: 18, gem });
    const stones = q14.lines.map((l) => `${l.qty}×${l.gem} ${l.shape} ${l.size} @${l.cost == null ? 'MISSING' : '₹' + l.cost.toFixed(2)}`).join('; ');
    console.log(`${d.id.padEnd(24)} ${String(gem || '').padEnd(13)} 14K ${P.inr(q14.total).padStart(9)}  18K ${P.inr(q18.total).padStart(9)}  | ${stones}`);
    if (q14.missing.length) { bad++; console.log('   !! no shop price for', q14.missing.map((l) => `${l.gem} ${l.shape} ${l.size}`).join(', ')); }
  }
}
console.log(`\n${DESIGNS.length} designs. ${bad ? bad + ' option(s) with missing stone prices' : 'All stones priced from the shop.'}`);
process.exit(bad ? 1 : 0);
