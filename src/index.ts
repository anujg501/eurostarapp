import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { config } from './config';
import { HttpError } from './util/http';

import { authRouter } from './routes/auth';
import { catalogRouter } from './routes/catalog';
import { inventoryRouter } from './routes/inventory';
import { customersRouter } from './routes/customers';
import { cartsRouter } from './routes/carts';
import { ordersRouter } from './routes/orders';
import { paymentsRouter } from './routes/payments';
import { rfqRouter } from './routes/rfq';
import { assistantRouter } from './routes/assistant';
import { notificationsRouter } from './routes/notifications';
import { repsRouter } from './routes/reps';
import { announcementsRouter } from './routes/announcements';
import { candidatesRouter, modulesRouter } from './routes/candidates';
import { adminRouter } from './routes/admin';
import { usersRouter } from './routes/users';
import { liftBuiltinCatalogOverlays } from './services/catalogOverlays';

const app = express();

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow same-origin / server-to-server (no origin) and configured origins.
      if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);
app.use(
  express.json({
    limit: '2mb',
    // Keep the untouched bytes so webhook handlers can verify the provider's
    // HMAC signature, which is computed over the exact payload as sent.
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
    },
  })
);
app.use(morgan('dev'));

// Health check
app.get('/health', (_req, res) => res.json({ ok: true, service: 'eurostar-backend' }));

// API routes
app.use('/auth', authRouter);
app.use('/catalog', catalogRouter);
app.use('/inventory', inventoryRouter);
app.use('/customers', customersRouter);
app.use('/carts', cartsRouter);
app.use('/orders', ordersRouter);
app.use('/payments', paymentsRouter);
app.use('/rfq', rfqRouter);
app.use('/assistant', assistantRouter);
app.use('/notifications', notificationsRouter);
app.use('/reps', repsRouter);
app.use('/announcements', announcementsRouter);
app.use('/candidates', candidatesRouter);
app.use('/modules', modulesRouter);
// The Admin UI and the Admin API share the /admin prefix. The UI routes are
// declared first and match only the exact page + its build assets; everything
// else under /admin falls through to the API router below.
const adminUiDir = path.join(process.cwd(), 'docs', 'admin-react');
app.get(['/admin', '/admin/'], (_req, res) => res.sendFile(path.join(adminUiDir, 'index.html')));
app.use('/admin/assets', express.static(path.join(adminUiDir, 'assets')));

app.use('/admin', adminRouter);
app.use('/users', usersRouter);

// ---------------------------------------------------------------------------
// Serve the website (the React storefront) so one server runs the whole thing.
// The site compiles in the browser (React + Babel), so we just serve the files.
// The folder is named "docs" so GitHub Pages can also publish it directly.
// ---------------------------------------------------------------------------
// Resolve from the working directory (repo root) so it works both under ts-node
// (src/) and compiled (dist/src/) — the docs/ folder is always at the repo root.
const webDir = path.join(process.cwd(), 'docs');
app.get('/favicon.ico', (_req, res) => res.sendFile(path.join(webDir, 'assets', 'eurostar-logo.png')));
// The root is the customer-facing storefront. It used to be the internal portal
// hub, which listed the CRM, LMS, Mira and Admin panels — fine on a private demo
// box, wrong on a public domain where it advertises the back office to every
// visitor. Staff reach the hub at /portal, and each app keeps its own login.
app.get('/', (_req, res) => res.sendFile(path.join(webDir, 'Eurostar Sales website.html')));
app.get('/portal', (_req, res) => res.sendFile(path.join(webDir, 'index.html')));
app.get('/login', (_req, res) => res.sendFile(path.join(webDir, 'Eurostar Login.html')));
app.get('/site', (_req, res) => res.sendFile(path.join(webDir, 'Eurostar Sales website.html')));
app.get('/mobile', (_req, res) => res.sendFile(path.join(webDir, 'Eurostar Sales website (Mobile).html')));

// Clean, memorable paths for each app (e.g. eurostargems.com/shop).
// The Sales page is a single file, so serve it directly. /mira points at the
// mira-admin folder (different name). /crm, /lms and /admin need no route here:
// the static server below already turns /crm into /crm/ and serves its
// index.html (adding our own /crm redirect would loop, since Express treats
// /crm and /crm/ as the same route).
app.get(['/shop', '/sales'], (_req, res) => res.sendFile(path.join(webDir, 'Eurostar Sales website.html')));
app.get('/mira', (_req, res) => res.redirect(301, '/mira-admin/'));

app.use(express.static(webDir)); // serves the portal, Sales, and /crm/ (each has an index.html)

// 404 — JSON for API paths, otherwise fall back to the login page.
app.use((req, res) => {
  if (req.path.startsWith('/api') || req.accepts(['html', 'json']) === 'json') {
    return res.status(404).json({ error: 'Not found' });
  }
  return res.status(404).sendFile(path.join(webDir, 'Eurostar Login.html'));
});

// Central error handler
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, ...(err.extra ? { details: err.extra } : {}) });
  }
  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ error: 'Something went wrong on our side' });
});

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Eurostar backend running on http://localhost:${config.port}`);

  // One-time lift of the storefront's built-in colours/shapes into the admin
  // overlay maps (no-op once done — see catalogOverlays.ts). Runs after boot
  // so a failure can never keep the API from starting.
  liftBuiltinCatalogOverlays()
    .then(({ colours, shapes }) => {
      // eslint-disable-next-line no-console
      if (colours || shapes) console.log(`Catalog overlays: lifted ${colours} colours, ${shapes} shapes from the storefront data`);
    })
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.warn('Catalog overlays lift failed:', e);
    });
});
