import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
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

// 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

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
