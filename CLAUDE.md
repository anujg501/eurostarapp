# Eurostar — working notes

## Deployment (read first)
- **The live site auto-deploys from the `sunny-branch` branch** (a server cron pulls it every ~60s; see `DEPLOY.md`). Not `main`, not `claude/*`. Push there to go live.
- The **admin panel is a Vite React app in `admin-web/`**; its built output is **committed** to `docs/admin-react/` and served as-is. After changing anything under `admin-web/`, rebuild and commit the bundle:
  ```bash
  cd admin-web && npm ci && npx vite build   # writes ../docs/admin-react
  ```
  Forgetting the rebuild means the source changed but the deployed panel did not.
- The **storefront** is plain `docs/app/*.jsx` (in-browser Babel), served directly — no build step.

## Price-sheet uploads (Excel → storefront pricing)
When the user uploads a price-list spreadsheet for a colour/grade:
- **Always use the `RIVEN` sheet** if the workbook has one (it carries pieces-per-box + final ₹/piece).
- **Keep exactly the shapes and sizes present in the file** — nothing added, nothing invented. Restrict that colour's shapes to only those in the sheet (set `shapes: [...]` on the colour in `COLORS_BY_CATEGORY`).
- Mirror the existing **Alpanite Green/Blue** pattern in `docs/app/data.jsx`:
  - Add a per-colour table `ALP_<COLOUR> = { shape: [[size, pcsPerBox, ₹/piece], ...] }`.
  - Add `alp<Colour>Sizes(shape)` and `alp<Colour>Sku(shape, size)` (returns `{ price, pcsPerPacket, moq, ... }`), exported on `window`.
  - Wire `docs/app/screen-browse.jsx` `SizeOrderPad`: gate `sizes` and `skuFor(size)` to that `color.id`, alongside the green/blue branches.
- Never fabricate prices. Parse the sheet programmatically and spot-check a few values before committing.
- **Autonomy: when the user gives an Excel price file, just do it — parse (RIVEN), spot-check, commit and deploy to `sunny-branch` without asking permission.** Don't ask routine confirmations (which sheet when the rule already answers it, whether to deploy, minor shape/size trimming that follows "keep exactly what's in the file"). Report what was deployed afterwards.
  - **Only pause to ask on a genuine anomaly**, e.g.: data that won't parse or is internally contradictory; prices that look mis-read/implausible (esp. from a *screenshot* — non-monotonic, out-of-sequence); two price sources that materially disagree with no rule to pick between them; or a change that would clearly misprice/mislead if the guess is wrong. Screenshots (not files) still get a quick "show me before deploy".
- **Default MOQ / pieces-per-box standard (authoritative — from `moq_standard.xlsx`)** — use whenever a sheet gives price but no pcs-per-box. Pick the block by shape, then the size. Sizes are mm; `a*b`/`a x b` = length×width. Only fill this in when the file has no other packing info; if a size falls outside a block and isn't in the file, use the nearest larger listed size (or ask on a real anomaly).
  - **ROUND** (by diameter): 0.80–2.00 → **1000**; 2.10–3.00 → **500**; 3.25–4.00 → **200**; 4.25–5.00 → **100**; 5.25–8.00 → **50**.
  - **SQR PRIN** (square princess): 1.5–3.5 → **200**; 4.0–4.5 → **100**; 5.0–7.5 → **50**; 8–9 → **25**; 10–14 → **15**.
  - **OCTO PRIN** (octagon princess): 4*3,5*3 → **200**; 5*4,6*4 → **100**; 7*5,8*6 → **50**; 9*7,10*8 → **25**; 11*9,12*10,16*12 → **15**.
  - **OS / PS** (oval/pear step): 3*2,3*2.5,3.5*2.5 → **200**; 4*3,5*3,5*4,6*4 → **100**; 7*5,8*6,9*7 → **50**; 10*8,11*9 → **25**; 12*10,14*10 → **15**.
  - **MAQ** (marquise): 3*1.5,4*2,5*2.5,6*3 → **200**; 7*3.5,8*4 → **100**; 10*5 → **50**; 12*6,14*7 → **15**.
  - **BAGUETTE**: 3*1.5,4*2,5*2.5 → **200**; 6*3 → **100**; 7*3.5,8*4 → **50**.
  - **TRIANGLE**: 3x3 → **200**; 4x4 → **100**; 5x5 → **50**; 6x6,7x7,8x8 → **25**.
  - **TRILLION / SQ RADIANT / CUSHION**: 3x3,4x4 → **200**; 5x5 → **100**; 6x6,7x7,8x8 → **50**; 9x9 → **25**; 10x10,11x11 → **15**.
  - **ASSCHER**: 3x3,4x4 → **200**; 5x5,6x6 → **100**; 7x7,8x8 → **50**; 9x9,10x10 → **25**.
  - **HEART**: 3x3 → **200**; 4x4,5x5,6x6,7x7 → **100**; 8x8 → **50**; 9x9,10x10 → **25**.

## Product images (per-grade)
- Photos are stored via the backend (`PUT /admin/product-images`), keyed `cat|colour|shape`, or `cat|grade|colour|shape` for grade-scoped categories.
- Grade-scoped categories (grade is the real visual variant, or colours repeat across grades): `mop, multisapphire, opaque, labgrown, navratna, hollowmop, bracelet`. Keep `PIMG_GRADE_SCOPED` (storefront `docs/app/product-images.jsx`) and `GRADE_SCOPED` (`admin-web/src/lib/api.ts`) in sync.
