# Eurostar — project notes

## Deployment (IMPORTANT)
- **This project deploys via GitHub Pages CI/CD** — the `pages-build-deployment`
  workflow ("Deploy from a branch", `/docs`). **NOT Render.**
- The live site **eurostargems.com is served by GitHub Pages**, published from the
  `docs/` folder on branch `claude/github-connection-306nod`.
- After a push, the Pages workflow builds and deploys automatically. Check its
  status under the repo's **Actions → pages-build-deployment**.
- GitHub Pages sits behind a CDN, so a freshly deployed change can take a few
  minutes to appear and often needs a hard-refresh (Ctrl+Shift+R) / incognito to
  bypass the browser cache.
- `render.yaml` in the repo is **legacy / unused** — do not treat Render as the
  host.

## Repo layout
- `docs/` — the 5 web apps (Sales, CRM `crm/`, LMS `lms/`, Admin `admin/`,
  Mira `mira-admin/`) + shared `vendor/` (React + Babel, vendored, no CDN).
  These are the deployed website.
- `src/` — Node/Express/TypeScript backend API (Prisma/PostgreSQL).
- `prisma/` — database schema + migrations.
- `mobile/` — Expo/React Native app (earlier work).

## Branches
- `claude/github-connection-306nod` — the main/deploy branch (what Pages builds).
- `sunny` — review branch (does NOT trigger the Pages deploy).
- `backup/universal-app-2026-07-16` — parked universal-app experiment.
