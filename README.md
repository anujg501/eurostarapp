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
npm run dev               # starts the server on http://localhost:4000
```

Test accounts created by `npm run setup`:

- **Office** — id `office`, password `office123`
- **Rep** — id `REP001`, password `rep123`

(Change these in `.env` before going live.)

Check it's alive: open <http://localhost:4000/health> — you should see `{"ok":true}`.

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
prisma/
  schema.prisma   # the database design (the "filing cabinet")
  seed.ts         # sample accounts + catalogue for testing
src/
  index.ts        # starts the server, wires everything together
  config.ts       # settings + business rules
  db.ts           # database connection
  auth/           # logins, passwords, tokens, permissions
  services/       # OTP, totals maths, id generation
  routes/         # each API area (auth, catalog, orders, payments, ...)
  util/           # small shared helpers
```

## Important notes

1. **The catalogue is placeholder data for now.** The real prices live in the
   website's `app/data.jsx` file. Once that file is added to this repo, we swap
   the sample catalogue for the exact one so prices match the website perfectly.
2. **SMS is in test mode.** Login codes are printed to the server log instead of
   being texted. To send real texts, add an SMS provider in `src/services/otp.ts`.
3. **Database is a simple file now** (`prisma/dev.db`). To move to a bigger
   production database (Postgres), change two lines in `.env` and `schema.prisma`.
