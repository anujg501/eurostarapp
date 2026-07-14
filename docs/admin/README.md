# Handoff: Eurostar Admin + Mira Admin — Backend for the existing React apps

Two internal admin tools ship together here. Both frontends are **already built**; both fake all
state in the browser with `localStorage`. **Your task: add a backend** (API + DB + auth) and swap
the mocks for API calls. Do not rebuild the UIs.

---

## 1 · Sales App Admin (`Eurostar Admin.html`)
Catalog & merchandising console for the Sales app. React 18 + Babel-in-browser.
- `admin/admin-app.jsx` — all screens. `admin/admin.css`, `styles/tokens.css`.
- Depends on `app/icons.jsx` and `app/data.jsx` (shared catalog data) + `assets/logo-data.js`.

### What it controls → endpoints (keys become the Sales/catalog API)
| localStorage key | Purpose | Becomes |
|---|---|---|
| `eurostar-extra-colors-v1` (XCOL_KEY) | admin-added colours per category | `GET/PUT /admin/catalog/colours` |
| `eurostar-extra-shapes-v1` (XSHP_KEY) | admin-added shapes per category | `GET/PUT /admin/catalog/shapes` |
| `eurostar-cat-thumbs-v1` / `eurostar-shape-thumbs-v1` | category/shape thumbnail images | asset/CMS endpoints |
| `eurostar-splash-image` / `-active` | marketing splash pop-up in Sales | `GET/PUT /admin/splash` |
| `eurostar-rep-announce-image/-active/-title/-msg/-badge/-updated` | rep broadcast banner (once-a-day pop-up for reps) | `GET/PUT /announcements` (same resource the CRM RepBroadcast writes) |
| `ad-tweak-*` | admin UI theme (skin/accent/density) | pure client state — keep local |

These are the **producer** side of catalog overlays, inventory art, and rep announcements that the
Sales app and CRM read. Build them as shared resources; the Sales handoff README lists the reader side.

### Suggested surface
```
POST /auth/login {userId,password}   → admin session
GET/PUT /admin/catalog/colours       GET/PUT /admin/catalog/shapes
GET/PUT /admin/thumbs                 (category & shape images)
GET/PUT /admin/splash
GET/PUT /announcements
```

---

## 2 · Mira Admin (`Eurostar Mira Admin.html`)
Single self-contained file — the control panel for the **Mira** AI assistant used across Sales,
CRM and LMS. Configures Mira's persona and reviews chat logs.

### Config + logs → endpoints
| localStorage key | Purpose | Becomes |
|---|---|---|
| `eurostar-mira-instructions` | persona / system instructions (highest priority) | `GET/PUT /assistant/config#instructions` |
| `eurostar-mira-rules` | rule list | `…#rules` |
| `eurostar-mira-knowledge` | knowledge base entries | `…#knowledge` |
| `eurostar-mira-examples` | few-shot examples | `…#examples` |
| `eurostar-mira-enabled` | master on/off | `…#enabled` |
| `eurostar-mira-images` | reference images | asset endpoint |
| `eurostar-mira-chatlog` / `-crm` / `-lms` | chat transcripts per app (Sales / CRM / LMS) | `GET /assistant/chatlogs?app=` |
| `eurostar-mira-notifications` | shipment notifications (written by CRM, shown by Mira) | shared `GET/POST /notifications` |

### Runtime
Mira composes a system prompt from instructions + rules + knowledge + examples, then calls an LLM.
**Move the LLM call server-side** (`POST /assistant/chat {app, sessionId, message}`) so the API key
is never in the client, and persist transcripts to `chatlogs`.

### Suggested surface
```
GET/PUT /assistant/config        (instructions, rules, knowledge, examples, enabled, images)
POST    /assistant/chat          {app, sessionId, message} → reply (server holds LLM key)
GET     /assistant/chatlogs?app=sales|crm|lms
GET/POST /notifications          (shared with CRM/Sales)
```

---

## Design tokens
`styles/tokens.css` — paper `#F6F1E6`, ink `#15130F`, emerald `#0E5C4A`. Admin themeable via
`data-skin/-accent/-density`. Serif **Fraunces**, sans **Inter**.

## Build order
1. Admin auth. 2. Catalog overlays + thumbs + splash + announcements (shared with Sales/CRM).
3. Mira config CRUD. 4. Server-side `/assistant/chat` + chatlog persistence. 5. Swap each key above
for its endpoint, keeping JSON shapes identical.

> Shared resources across all five apps: **announcements**, **notifications**, and the **catalog**.
> Build each once. See the Sales, CRM and LMS handoff READMEs for the reader/producer sides.
