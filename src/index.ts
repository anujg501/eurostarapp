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
app.use(express.json({ limit: '2mb' }));
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

// ---------------------------------------------------------------------------
// Serve the website (the React storefront) so one server runs the whole thing.
// The site compiles in the browser (React + Babel), so we just serve the files.
// The folder is named "docs" so GitHub Pages can also publish it directly.
// ---------------------------------------------------------------------------
// Resolve from the working directory (repo root) so it works both under ts-node
// (src/) and compiled (dist/src/) — the docs/ folder is always at the repo root.
const webDir = path.join(process.cwd(), 'docs');
app.get('/favicon.ico', (_req, res) => res.sendFile(path.join(webDir, 'assets', 'eurostar-logo.png')));
app.get('/', (_req, res) => res.sendFile(path.join(webDir, 'index.html'))); // app portal hub
app.get('/login', (_req, res) => res.sendFile(path.join(webDir, 'Eurostar Login.html')));
app.get('/site', (_req, res) => res.sendFile(path.join(webDir, 'Eurostar Sales website.html')));
app.get('/mobile', (_req, res) => res.sendFile(path.join(webDir, 'Eurostar Sales website (Mobile).html')));
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
});
