# Eurostar — Tech Stack

A plain-language reference for the whole system.

**In one sentence:** React apps (hosted on GitHub Pages) talk to a Node/Express +
TypeScript back room (hosted on Render), which stores everything in PostgreSQL,
uses Claude for the Mira assistant, and relies on external services for videos
and SMS.

---

## The Apps (what users see) — the "shop floors"
| Tech | What it does |
|---|---|
| **React 18** | Builds all the screens and buttons |
| **Babel (in-browser)** | Compiles the app code live — no build step |
| **HTML + CSS** | Layout & styling (Fraunces + Inter + Noto Sans Indic) |
| **Bundled locally** | React/Babel stored in the repo, so apps run with no CDN |

Apps: **Sales, CRM, LMS, Mira Admin, Admin** + a **Portal** to launch them.

## The Back Room (the API) — the shared brain
| Tech | What it does |
|---|---|
| **Node.js** | Runs the back room |
| **Express** | Handles requests (login, orders, etc.) |
| **TypeScript** | Safer, typed JavaScript |
| **Prisma** | Manages the database (tables, migrations) |
| **JWT + bcrypt** | Secure logins & password hashing |
| **Zod** | Validates incoming data |

## Data & AI
| Tech | What it does |
|---|---|
| **PostgreSQL** (Render) | Permanent data store (customers, orders, …) |
| **SQLite** | Local-only simple file for quick testing |
| **Claude API** (Anthropic) | Powers the **Mira** assistant (server-side) |

## Hosting & Infrastructure
| Service | Role | Status |
|---|---|---|
| **GitHub Pages** | Hosts the 5 apps (public links) | live |
| **Render** | Runs the back room 24/7 | Phase 0 |
| **Render Postgres** | Production database | Phase 0 |
| **GitHub + Git** | Source code; auto-deploys apps on push | live |
| **Video host** (YouTube / Vimeo / Cloudflare Stream) | Holds LMS training videos; LMS stores the links | Phase 4 |
| **MSG91 / Twilio** | Real SMS login codes | later (test mode now) |

## Payments
- **UPI** (company QR + payment intent) with a **webhook** to confirm receipt.

---

## The apps and where they live
| App | Local URL | Live URL |
|---|---|---|
| Portal | `http://localhost:4000/` | `https://anujg501.github.io/eurostarapp/` |
| Sales | `/login` | `.../Eurostar%20Login.html` |
| CRM | `/crm/` | `.../crm/` |
| LMS | `/lms/` | `.../lms/` |
| Mira Admin | `/mira-admin/` | `.../mira-admin/` |
| Admin | `/admin/` | `.../admin/` |

## Repository layout
```
docs/          the 5 apps + portal (served by Pages and the backend)
  vendor/      React + Babel (local, no CDN)
  crm/ lms/ admin/ mira-admin/   each app in its own folder
prisma/        database schema + migrations + seed
src/           the back room (Express API)
  routes/      each API area (auth, orders, payments, catalog, …)
  services/    OTP, totals, ids
  data/        real catalogue (28 categories)
render.yaml    one-click Render setup (web service + Postgres)
```
