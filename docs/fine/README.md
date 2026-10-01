# Eurostar Fine — gold jewellery storefront

Served at `/fine/` (static, no build step). Plain JS, hash routing.

| File | What it is |
|---|---|
| `designs.js` | Collections and the 36 launch designs: 14K weight, stones (trade-shop ids), story. **Edit here to add/change a design.** |
| `pricing.js` | Price engine + gem library (`GEMS`) + config (making ₹1,500/g, min ₹2,500, markup slabs 10×/6×/4×, GST 3%, purity). |
| `gold-rate.json` | Today's 24K ₹/g. Update this to move every price on the site. |
| `moiss-weights.json` | Carat weight per moissanite size (from `MOISS_CHART` in `docs/app/data.jsx`) — moissanite is priced per carat. |
| `art.js` | Drawn illustrations of each design (follow metal/gem choices). Replace with CAD renders/photos later. |
| `app.js`, `index.html`, `styles.css` | Storefront UI. |

Stone prices are read live from `/price-snapshot.json` (the trade shop's own mirror), so they never drift from eurostargems.com/shop.

**After any price-sheet change or design edit:**
```bash
node scripts/gen-price-snapshot.cjs   # (already required for sheet changes)
node scripts/check-fine-prices.cjs    # prices every design/option; fails if a stone lost its shop price
```
