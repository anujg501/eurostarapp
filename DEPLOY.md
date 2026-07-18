# Deploying

The demo runs at **https://eurostarcl.democheck.xyz** on 139.59.59.111
(pm2 process `eurostarcl-backend`, port 4750, Postgres db `eurostarcl`).

## Automatic — just push

Anything pushed to **`sunny-branch`** is live within ~1 minute. No manual step.

A cron job on the server runs `/usr/local/bin/eurostarcl-deploy.sh` every minute.
It fetches the branch, and when the commit changed it:

1. checks out the new code (`.env` is gitignored, so it is never touched),
2. runs `npm ci` **only if** `package.json`/`package-lock.json` changed,
3. runs `prisma generate` + `prisma migrate deploy`,
4. compiles TypeScript,
5. restarts pm2 and health-checks `:4750/health`.

If any step fails it logs the reason and **leaves the previous version running**,
so a broken commit does not take the site down.

Watch it:

```bash
ssh root@139.59.59.111 'tail -f /var/log/eurostarcl-deploy.log'
```

## Why polling, not a GitHub Action

A workflow would need an SSH key stored as a repository secret, and adding
secrets requires *admin* on `anujg501/eurostarapp` — the deploy account only has
push. The repo is public, so read-only polling needs no credentials at all.

If admin access becomes available, this is worth replacing with a webhook or a
GitHub Action for instant deploys instead of up-to-60-second ones.

## The Admin panel build

`admin-web/` is a Vite app, but its build output (`docs/admin-react/`) is
**committed**. The server does not build it — it serves the committed bundle.

So after changing anything under `admin-web/`, rebuild and commit the output:

```bash
cd admin-web && npx vite build   # writes ../docs/admin-react
git add -A docs/admin-react admin-web && git commit && git push
```

Forgetting this is the easy mistake: the source changes, the deployed panel does not.

## Manual deploy

```bash
ssh root@139.59.59.111 '/usr/local/bin/eurostarcl-deploy.sh; tail -5 /var/log/eurostarcl-deploy.log'
```
