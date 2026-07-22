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

## Product images (per-grade)
- Photos are stored via the backend (`PUT /admin/product-images`), keyed `cat|colour|shape`, or `cat|grade|colour|shape` for grade-scoped categories.
- Grade-scoped categories (grade is the real visual variant, or colours repeat across grades): `mop, multisapphire, opaque, labgrown, navratna, hollowmop, bracelet`. Keep `PIMG_GRADE_SCOPED` (storefront `docs/app/product-images.jsx`) and `GRADE_SCOPED` (`admin-web/src/lib/api.ts`) in sync.
