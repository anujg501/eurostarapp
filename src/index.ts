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
import { proformaRouter } from './routes/proforma';
import { assistantRouter } from './routes/assistant';
import { notificationsRouter } from './routes/notifications';
import { repsRouter } from './routes/reps';
import { reportsRouter } from './routes/reports';
import { franchiseRouter } from './routes/franchise';
import { leadsRouter } from './routes/leads';
import { announcementsRouter } from './routes/announcements';
import { candidatesRouter, mediaRouter, modulesRouter, questionsRouter } from './routes/candidates';
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
    // Image uploads fall back to an inline base64 data URL whenever object
    // storage is not configured, and base64 inflates the bytes by about a
    // third. The upload route already accepts files up to 8 MB, so a 2 MB
    // JSON limit rejected images the app had just told the operator were
    // fine. Keep the two limits consistent (8 MB file ≈ 11 MB encoded).
    limit: '12mb',
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
app.use('/proforma', proformaRouter);
app.use('/assistant', assistantRouter);
app.use('/notifications', notificationsRouter);
app.use('/reps', repsRouter);
app.use('/reports', reportsRouter);
app.use('/franchise', franchiseRouter);
app.use('/leads', leadsRouter);
app.use('/announcements', announcementsRouter);
app.use('/candidates', candidatesRouter);
app.use('/modules', modulesRouter);
app.use('/questions', questionsRouter);
app.use('/media', mediaRouter);
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
// These entry pages are served with sendFile, which bypasses the static
// middleware below that marks HTML/JS no-cache. Without this the browser can
// hold a stale copy of the page — and the page is what carries the ?v= script
// tags, so a cached page keeps loading yesterday's JS no matter how many times
// the app is redeployed. Always revalidate the entry HTML.
const sendPage = (res: express.Response, file: string) => {
  res.setHeader('Cache-Control', 'no-cache');
  return res.sendFile(file);
};

app.get('/', (_req, res) => sendPage(res, path.join(webDir, 'Eurostar Sales website.html')));
app.get('/portal', (_req, res) => sendPage(res, path.join(webDir, 'index.html')));
app.get('/login', (_req, res) => sendPage(res, path.join(webDir, 'Eurostar Login.html')));
app.get('/site', (_req, res) => sendPage(res, path.join(webDir, 'Eurostar Sales website.html')));
app.get('/mobile', (_req, res) => sendPage(res, path.join(webDir, 'Eurostar Sales website (Mobile).html')));

// Serve the folder-apps' real entry HTML directly at their clean URL, the way
// /admin is served above. Their docs/<app>/index.html is a meta-refresh loader
// that pointed at "Eurostar CRM.html" etc.; that filename used to 301 back to
// the clean URL, so the loader looped. Browsers cache a 301 permanently, so the
// loop survived even after the redirect was removed. Serving the app here means
// the loader is never reached, and the stale cached redirect is irrelevant.
// These pages load their scripts with RELATIVE paths ("crm/crm-app.jsx"), which
// only resolve when the address ends in a slash. Opening "/crm" (no slash) made
// the browser fetch "/crm/crm-app.jsx" instead of "/crm/crm/crm-app.jsx" — every
// script 404'd and the page rendered blank. So the no-slash form redirects to the
// canonical slashed URL, then that serves the page.
//
// One handler per app, not two routes: Express runs with non-strict routing, so
// a "/crm" route also matches "/crm/" — registering them separately made the
// redirect swallow both and loop. Here we branch on the real path instead. The
// redirect is 302 (never cached); a cached 301 once caused a loop here.
const serveApp = (file: string) => (req: express.Request, res: express.Response) => {
  if (!req.path.endsWith('/')) {
    const q = req.originalUrl.indexOf('?');
    return res.redirect(302, req.path + '/' + (q >= 0 ? req.originalUrl.slice(q) : ''));
  }
  return sendPage(res, file);
};
app.get(['/crm', '/crm/'], serveApp(path.join(webDir, 'crm', 'Eurostar CRM.html')));
app.get(['/lms', '/lms/'], serveApp(path.join(webDir, 'lms', 'Eurostar LMS.html')));
app.get(['/mira-admin', '/mira-admin/'], serveApp(path.join(webDir, 'mira-admin', 'Eurostar Mira Admin.html')));

// The pages are files with spaces in their names ("Eurostar Sales website.html"),
// and several in-app links still point at those filenames — a leftover from when
// each app was opened straight from a folder. They work, but "%20" in the address
// bar of a client-facing site reads as unfinished, so send them to the clean
// route instead. 301 rather than 302: these filenames are not coming back.
// Middleware rather than app.get(): the incoming path is percent-encoded
// ("/Eurostar%20Sales%20website.html") and Express will not match a route
// pattern containing literal spaces against it, so it silently fell through to
// the static handler. Decoding here and comparing is what actually works.
const LEGACY_PAGES: Record<string, string> = {
  '/eurostar sales website.html': '/',
  '/eurostar sales website (mobile).html': '/mobile',
  '/eurostar login.html': '/login',
  '/admin/eurostar admin.html': '/admin',
  // NOTE: the crm, lms and mira-admin filenames are deliberately NOT redirected.
  // Their clean URL (e.g. /crm/) serves an index.html loader whose meta-refresh
  // points straight back at the filename (Eurostar CRM.html). Redirecting the
  // filename to /crm/ therefore looped: /crm/ -> loader -> Eurostar CRM.html ->
  // 301 /crm/ -> loader -> … The Sales entry above is safe because "/" serves a
  // real portal page, not a loader that bounces back.
};
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  let decoded: string;
  try {
    decoded = decodeURIComponent(req.path).toLowerCase();
  } catch {
    return next(); // malformed escape — let the normal 404 handle it
  }
  const target = LEGACY_PAGES[decoded];
  // 301 rather than 302: these filenames are not coming back.
  return target ? res.redirect(301, target) : next();
});

// Clean, memorable paths for each app (e.g. eurostargems.com/shop).
// The Sales page is a single file, so serve it directly. /mira points at the
// mira-admin folder (different name). /crm, /lms and /admin need no route here:
// the static server below already turns /crm into /crm/ and serves its
// index.html (adding our own /crm redirect would loop, since Express treats
// /crm and /crm/ as the same route).
app.get(['/shop', '/sales'], (_req, res) => res.sendFile(path.join(webDir, 'Eurostar Sales website.html')));
app.get('/mira', (_req, res) => res.redirect(301, '/mira-admin/'));

// Serves the portal, Sales, and /crm/ (each has an index.html). The app has no
// build step — its screens are .jsx files compiled in the browser by Babel — so
// a deploy just changes those files in place. Tell the browser to revalidate
// HTML/JS/JSX every load (304 when unchanged, fresh when the file changed);
// otherwise a cached app.jsx keeps running old code until a hard refresh.
app.use(
  express.static(webDir, {
    setHeaders(res, filePath) {
      if (/\.(jsx|js|html)$/i.test(filePath)) res.setHeader('Cache-Control', 'no-cache');
    },
  })
);

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
