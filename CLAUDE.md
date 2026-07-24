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
- **Default MOQ / pieces-per-box standard (authoritative — from `moq.xlsx` Deccan packing list; supersedes the older `moq_standard.xlsx`)** — use whenever a sheet gives price but no pcs-per-box. Pick the block by shape, then the size (mm; `a*b` = length×width, `a*b*c` = tapered/3-dim). If a size falls outside a block and isn't in the file, use the nearest larger listed size (or ask on a real anomaly).
  - **Round**: 0.8–2→1000; 2.1–3→500; 3.1–4.75→200; 5–7.5→100; 8–10→50; 11–15→25; 16–20→15.
  - **Square**: 1–2→1000; 2.25–3→500; 3.5–4.5→200; 5–7.5→100; 8–9→50; 10–12→25.
  - **Oval / Pear**: 3*2–4.5*3.5→500; 5*3–6*4→200; 7*5–8*6→100; 9*7–11*9→50; 12*8–16*12→25; 18*13→15; 11*7→50.
  - **Special Sizes Os / Ps**: 2*1–4.5*3→500; 4.75*3.75–6.5*4.5→200; 6.75*4.75–8*7→100; 8.5*6.5→50.
  - **Marquise**: 3*1.5–4*2→500; 5*2.5–7*3.5→200; 8*4–9*4.5→100; 10*5→50; 14*7–16*8→25.
  - **Special Sizes Maq**: 2*1–4.5*2.5→500; 4.75*2.5–5.73*3→200.
  - **Octo Prince**: 4*3→500; 5*3–6*4→200; 7*5–8*6→100; 9*7–10*8→50; 11*9–14*12→25; 16*12–18*12→15.
  - **Octo Step**: 4*3–4.5*3→500; 5*3–5*4→200; 7*5–8*6→100; 9*7–11*9→50; 12*9–14*10→25.
  - **Tapper**: 0.8*1*1.1–3*2*1.5→1000; 3.25*1.5*1–4.5*2.5*1.5→500; 5*3*1–6*3*2→200.
  - **St Baguette Step**: 0.8*1.1–2.5*3→1000; 3.25*1.5–4.5*3→500; 5*2.5–2.75*1.75→200.
  - **Cushion / Trillion**: 3–4→200; 5–6→100; 7–9→50; 10→25.
  - **Asscher**: 3–4→200; 5–6→100; 7–9→50; 10→25.
  - **Heart**: 2→500; 3–4→200; 5–7→100; 8–9→50; 9.5–15→25.
  - **Triangle**: 2–3.5→500; 4→200; 5–6→100; 7–9→50; 10–12→25.
  - **Star Shape**: 3–4→200; 5–6→100; 7–9→50; 10→25.
  - **Lily**: 3–6→200; 7–8→100.
  - **Bridge Cut**: 5*2.5→500; 9*4→100; 9*6→50; 12*8–14*9→25.
  - **Plum**: 3→500.

## Product images (per-grade)
- Photos are stored via the backend (`PUT /admin/product-images`), keyed `cat|colour|shape`, or `cat|grade|colour|shape` for grade-scoped categories.
- Grade-scoped categories (grade is the real visual variant, or colours repeat across grades): `mop, multisapphire, opaque, labgrown, navratna, hollowmop, bracelet`. Keep `PIMG_GRADE_SCOPED` (storefront `docs/app/product-images.jsx`) and `GRADE_SCOPED` (`admin-web/src/lib/api.ts`) in sync.
