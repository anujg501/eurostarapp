# Handoff: Eurostar LMS — Backend for the existing React app

## Overview
The Eurostar **LMS** ("Recruitment & Training") is the internal app for hiring and onboarding
sales reps: a candidate pipeline (source → screen → train → score → onboard), training modules
with practice checklists, an admin console, and an "Onboard to CRM" action that pushes a hired
rep into the CRM. **The React frontend is already built and interactive.** It has **no backend** —
state is faked in the browser with `localStorage`.

**Your task: add a backend** (API + DB + auth) and replace the `localStorage` mocks with real API
calls. Do **not** rebuild the UI. The React source is the source of truth for data shapes.

## Files & how to run
- `Eurostar LMS.html` — entry (React 18 + Babel-in-browser, no build step today).
- `lms/lms-data.jsx` — seed data + globals (candidates, modules, reps).
- `lms/lms-candidate.jsx` — candidate/trainee views + practice checklists.
- `lms/lms-admin.jsx` — admin console (pipeline, scoring, CSV export).
- `lms/lms-app.jsx` — router/state + the "Onboard to CRM" bus write.
- `lms/lms.css`, `assets/` (logos), `app/mira-staff.js`.
- Open the HTML in a browser to see it running.

A reasonable modernization: bundled React (Vite/Next) keeping the same components. Optional; must not change the UI.

## Cross-app integration (the contract)
The LMS feeds the CRM through a shared `localStorage` key today. In the backend this becomes a
shared API resource:

| Key | Written by | Read by | Becomes |
|---|---|---|---|
| `eurostar-crm-new-hires` | LMS "Onboard to CRM" (`lms-app.jsx`) | CRM (Reps ingest) | `POST /reps` (LMS) → `GET /reps` (CRM) |
| `lms-practice-<candId>-<app>` | candidate practice checklist | candidate view | `GET/PUT /candidates/:id/practice` |
| `eurostar-lang` | all apps | all | user profile pref |

## Modules & endpoints they need
- **Candidate pipeline** — {candId, name, city, state, source, stage, score, repId}. Stages move
  through the funnel; admin scores and advances. `GET /candidates?stage=`, `POST /candidates`,
  `PUT /candidates/:id` (stage/score), `GET /candidates/:id`.
- **Training modules & practice** — modules with checklists; per-candidate tick state.
  `GET /modules`, `GET/PUT /candidates/:id/practice`.
- **Onboard to CRM** — turns a candidate into a rep record and posts it to the reps resource the
  CRM reads. `POST /reps` with {id, name, city, state, source, repId, hiredAt}.
- **CSV export** — admin exports candidates (client builds CSV today; can stay client-side or add
  `GET /candidates.csv`).
- **Auth** — admin vs candidate/trainee roles.

## Suggested REST surface (minimum)
```
POST /auth/login {userId,password}                 → session (role: admin | candidate)
GET  /me
GET  /candidates?stage=…   POST /candidates   PUT /candidates/:id   GET /candidates/:id
GET  /modules
GET/PUT /candidates/:id/practice
POST /reps   {from onboarded candidate}            → shared with CRM
```

## Data models (derive exact fields from lms-data.jsx)
- **Candidate** {candId, name, city, state, source, stage, score, repId, contact}
- **Module** {id, title, app, steps[]}
- **PracticeState** {candId, app, ticks[]}
- **Rep (onboarded)** {id, name, city, state, source, repId, hiredAt}

## Design tokens
`lms/lms.css` + brand palette (paper `#F6F1E6`, ink `#15130F`, green `#15803D` accent). Serif
**Fraunces**, sans **Inter**.

## Build order suggestion
1. Auth + roles. 2. Candidates CRUD + stages + scoring. 3. Modules + practice state.
4. Onboard → `POST /reps` (shared with CRM). 5. Swap each `localStorage` key above for its endpoint,
keeping JSON shapes identical.

> The CRM handoff (separate) consumes `eurostar-crm-new-hires` from the *reader* side — build the
> reps resource once, shared between LMS (writer) and CRM (reader).
