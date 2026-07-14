# Eurostar — Backend

This is the **back room** for the Eurostar wholesale gemstone website. The website
(buttons, screens, colours) is built separately; this project is the part that
actually remembers customers, saves orders, takes payments and checks logins.

> New here? Read **[GETTING-STARTED.md](./GETTING-STARTED.md)** first — it explains
> everything in plain, non-technical language.

---

## What it does

- **Logins** for three kinds of people:
  - **Customers** — sign in with their mobile number and a one-time code (OTP). First time, they add name + GSTIN.
  - **Sales reps** — sign in with a rep id + password.
  - **Back office** — sign in with a staff id + password, and can override prices.
- **Catalogue** — the list of products, grades, colours, shapes, sizes and prices.
- **Carts** — saved draft/active baskets.
- **Orders** — the real order stream (subtotal, 3% GST, courier, dispatch date).
- **Payments** — record payments, show a company UPI QR, confirm receipt.
- **RFQ** — "request for quote" with a ₹10,000 minimum.
- **Mira assistant** — the AI helper's settings, chat, and customer notifications.

## Business rules (built in)

| Rule | Value |
|---|---|
| GST | 3% |
| Courier | Free over ₹1,000, otherwise ₹300 |
| Dispatch | 3 working days |
| RFQ minimum | ₹10,000 |

## Run it locally

```bash
npm install
cp .env.example .env      # then open .env and change the secrets
npm run setup             # creates the database + sample data
npm run dev               # starts everything on http://localhost:4000
```

Then open **<http://localhost:4000>** — the full website runs there (the backend
serves it). The React storefront and Babel are bundled locally (`web/vendor`), so
it works with no internet/CDN.

- Website (login): <http://localhost:4000/>
- Storefront directly: <http://localhost:4000/site>
- Health check: <http://localhost:4000/health> → `{"ok":true}`

Test accounts created by `npm run setup`:

- **Office** — id `office`, password `office123`
- **Rep** — id `REP-204`, password `rep123`

(Change these in `.env` before going live.)

## The API (endpoints)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/otp/request`, `POST /auth/otp/verify`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Catalogue | `GET /catalog`, `PUT /catalog/admin/categories`, `PUT /catalog/admin/skus` |
| Inventory | `GET /inventory`, `PUT /inventory/admin` |
| Customers | `GET /customers`, `POST /customers` |
| Carts | `GET/POST /carts`, `PUT /carts/:id`, `DELETE /carts/:id` |
| Orders | `POST /orders`, `GET /orders`, `GET /orders/:id`, `POST /orders/:id/confirm` |
| Payments | `POST /payments`, `GET /payments`, `GET /payments/qr`, `POST /payments/webhook` |
| RFQ | `POST /rfq`, `GET /rfq` |
| Assistant | `GET/PUT /assistant/config`, `POST /assistant/chat`, `GET /assistant/chat/:sessionId` |
| Notifications | `GET /notifications`, `POST /notifications`, `POST /notifications/:id/read` |

## Folders

```
web/              # the React website (storefront + login), served by the backend
  vendor/         # React + Babel bundled locally (no CDN needed)
prisma/
  schema.prisma   # the database design (the "filing cabinet")
  seed.ts         # sample accounts + catalogue for testing
src/
  index.ts        # starts the server, wires everything together
  config.ts       # settings + business rules
  db.ts           # database connection
  data/           # real catalogue (28 categories) generated from app/data.jsx
  auth/           # logins, passwords, tokens, permissions
  services/       # OTP, totals maths, id generation
  routes/         # each API area (auth, catalog, orders, payments, ...)
  util/           # small shared helpers
```

## Important notes

1. **Catalogue & prices live on the client.** The website (`app/data.jsx`) has a
   live price calculator (grades, colours, size charts, packet/carat conversions,
   volume tiers). The backend does **not** duplicate that — it records what was
   ordered and for how much. `GET /catalog` serves the real 28-category structure
   (from `src/data/catalog.ts`, generated from `data.jsx`); the backend owns only
   the *stateful* catalogue bit — per-variant sold-out flags, keyed exactly like
   the client (`cat|grade|color|shape|size`).
2. **Data shapes match the frontend.** Orders, payments, carts and customers use
   the same field names the app already writes to `localStorage`
   (`eurostar-crm-incoming-orders`, `-payments`, `eurostar-drafts-*`, etc.), so
   the UI can swap its browser-storage calls for API calls with no reshaping.
   Totals follow the app exactly: GST 3% (0 on export/Dubai), courier free over
   ₹1,000 else ₹300, dispatch +3 days (+5 export), cart min ₹1,000, RFQ min ₹10,000.
3. **SMS is in test mode.** Login codes are printed to the server log instead of
   being texted. To send real texts, add an SMS provider in `src/services/otp.ts`.
4. **Database is a simple file now** (`prisma/dev.db`). To move to a bigger
   production database (Postgres), change two lines in `.env` and `schema.prisma`.
