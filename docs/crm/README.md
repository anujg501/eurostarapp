# Handoff: Eurostar CRM — Backend for the existing React app

## Overview
The Eurostar **CRM** is the internal back-office console for the wholesale gemstone business:
customers, orders pipeline, payments, reps & commission, lead routing, rep broadcasts, and the
Mira shipment-notification bus. **The React frontend is already built and fully interactive.**
It currently has **no backend** — all dynamic state is faked in the browser with `localStorage`.

**Your task: add a backend** (API + database + auth) and replace the `localStorage` mocks with
real API calls. You are **not** rebuilding the UI. The React source is the source of truth for
data shapes and the storage keys that must become endpoints.

## Files & how to run
- `Eurostar CRM.html` — entry (React 18 + Babel-in-browser, no build step today).
- `crm/crm-app.jsx` — all screens & components (~2,500 lines).
- `crm/crm-data.jsx` — seed data + globals (`CRM_REPS`, `CRM_SAMPLE_PAYMENTS`, customers, orders).
- `crm/crm.css`, `styles/tokens.css` — styling. `assets/` — logos. `app/mira-staff.js` — Mira bus.
- Open the HTML in a browser to see the running app.

A reasonable modernization: move to bundled React (Vite/Next) keeping the same components. Optional; must not change the UI.

## This CRM shares data with the other Eurostar apps
The CRM is one of several apps (Sales, LMS, Admin, Mira) that today communicate through shared
`localStorage` keys acting as a message bus. **These keys are the integration contract** — in the
backend they all become shared API resources:

| Key | Written by | Read by | Becomes |
|---|---|---|---|
| `eurostar-crm-incoming-orders` | Sales app checkout | CRM (Office Orders) | `POST/GET /orders` |
| `eurostar-crm-incoming-payments` | Sales app payment | CRM (Payments) | `POST/GET /payments` |
| `eurostar-crm-new-hires` | LMS (Onboard to CRM) | CRM (Reps ingest) | `POST/GET /reps` |
| `eurostar-customer-master-v1` | CRM | CRM/Sales (GST dedupe) | `GET/PUT /customers` (master, keyed by normalised GSTIN) |
| `eurostar-mira-notifications` | CRM (dispatch) | Mira / Sales | `POST/GET /notifications` |
| `eurostar-rep-announce-image/-active/-window/-seen` | CRM (RepBroadcastAdmin) | Sales/CRM rep popup | `GET/PUT /announcements` |
| `eurostar-lang` | all | all | user profile pref |
| `crm-tweak-*` | CRM tweaks panel | CRM | pure client UI state — keep local |

## Core modules (in crm-app.jsx) & the endpoints they need
- **Customers** — master list keyed by normalised GSTIN (`normGst`), dedupe on GST. `GET/POST/PUT /customers`, `GET /customers/:id`, search.
- **Orders pipeline** — statuses (new → confirmed → dispatched → delivered). Office sees an *incoming* queue from Sales. `GET /orders?status=`, `POST /orders/:id/confirm`, `PUT /orders/:id` (courier, tracking, status). Dispatching writes a Mira notification.
- **Payments** — merges seed + incoming from Sales. `GET /payments`, `POST /payments`, reconcile against orders.
- **Reps & commission** — reps ingested from LMS hires; commission calc per rep; city-based lead routing. `GET/POST /reps`, `GET /reps/:id/commission`.
- **Rep broadcasts** — admin sets an announcement image + active window; reps see a once-per-day popup. `GET/PUT /announcements`.
- **Mira notifications** — shipment updates per customer/order (courier, tracking, value). `GET/POST /notifications`.
- **i18n** — 7 languages (en/hi/mr/gu/ta/te/kn); store preference on the user.

## Suggested REST surface (minimum)
```
POST /auth/login {userId,password}            → staff session (role: office/admin/manager)
GET  /me
GET/POST/PUT /customers   GET /customers/:id  (master keyed by GSTIN)
GET  /orders?status=…   POST /orders   PUT /orders/:id   POST /orders/:id/confirm
GET/POST /payments
GET/POST /reps   GET /reps/:id/commission
GET/PUT  /announcements
GET/POST /notifications
```

## Data models (derive exact fields from crm-data.jsx)
- **Customer** {id, name, gstin(normalised key), city, terms, repId, phone, orders[]}
- **Order** {id, cust, code, city, rep, repId, value, status, courier, track, dispatchBy, items, source, ts}
- **Payment** {id, orderId, custId, custName, mode, amount, utr, ts}
- **Rep** {id, name, city, tier, commissionRate, hires-from-LMS meta}
- **Announcement** {image, active, windowStart, windowEnd}
- **Notification** {id, orderId, cust, custName, courier, track, value, ts}

## Design tokens (for any new backend-driven UI states)
`styles/tokens.css` — paper `#F6F1E6`, ink `#15130F`, emerald `#0E5C4A`; CRM also themeable via
`data-skin`/`data-accent`/`data-density` (see `CrmTweaks`). Serif **Fraunces**, sans **Inter**,
+ Noto Sans Indic for i18n.

## Build order suggestion
1. Auth + staff roles. 2. Customers (GSTIN master). 3. Orders + payments ingest from Sales.
4. Reps + commission + LMS hire ingest. 5. Announcements + Mira notifications. 6. Swap each
`localStorage` key listed above for its endpoint, keeping the JSON shapes identical.

> The Sales app README (separate handoff) covers the customer-facing side and the same
> orders/payments/notifications resources from the producer end — build them once, shared.
