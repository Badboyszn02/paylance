import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { errorHandler } from './middleware/validate.js';
import { requestTimeout } from './middleware/timeout.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import {
  authLimit, searchLimit, writeLimit, generalLimit,
} from './middleware/rateLimits.js';
import { attachSocket } from './realtime/socket.js';
import { pool, poolStats, dbPing } from './db/pool.js';
import { cached, cacheStats } from './lib/cache.js';

import { authRouter } from './routes/auth.js';
import { profileRouter } from './routes/profile.js';
import { listingsRouter, CATEGORIES } from './routes/listings.js';
import { searchRouter } from './routes/search.js';
import { ordersRouter } from './routes/orders.js';
import { messagesRouter } from './routes/messages.js';
import { paymentsRouter } from './routes/payments.js';
import { reviewsRouter } from './routes/reviews.js';
import { dashboardRouter } from './routes/dashboard.js';

const app = express();
app.set('trust proxy', 1);
app.use(securityHeaders);
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(requestTimeout(Number(process.env.REQUEST_TIMEOUT_MS || 30_000)));

// Per-route rate limits below: tighter on auth, looser on reads.

app.get('/health', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const dbOk = await dbPing();
  const status = dbOk ? 200 : 503;
  res.status(status).json({
    ok: dbOk,
    chainId: config.arc.chainId,
    db: dbOk ? 'up' : 'down',
    pool: poolStats(),
    cache: cacheStats(),
    uptime: Math.round(process.uptime()),
  });
});

// Heavy aggregate: cached 60s in memory, short Cache-Control for browsers.
app.get('/api/stats', searchLimit, async (_req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    const stats = await cached('stats:v2', 60_000, async () => {
      const { rows } = await pool.query(`
        SELECT
          (SELECT count(*) FROM (
             SELECT id FROM users WHERE role IN ('freelancer','creator')
             UNION SELECT freelancer_id FROM listings WHERE kind = 'service'
             UNION SELECT freelancer_id FROM orders
           ) providers) AS freelancers,
          (SELECT count(*) FROM orders) AS orders,
          (SELECT coalesce(sum(amount_usdc),0) FROM transactions WHERE type='release') AS usdc_paid,
          (SELECT count(*) FROM listings WHERE status='active') AS listings`);
      return rows[0];
    });
    res.json(stats);
  } catch (e) { next(e); }
});

// Immutable for the lifetime of the process; cache for an hour.
app.get('/api/meta', (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json({
    categories: CATEGORIES,
    chainId: config.arc.chainId,
    platformFee: config.platformFee,
    platformWallet: config.platformWallet,
    listingRegistry: config.arc.listingRegistry,
  });
});

app.use('/api/auth', authLimit, authRouter);
app.use('/api/profile', generalLimit, profileRouter);
app.use('/api/listings', generalLimit, listingsRouter);
app.use('/api/search', searchLimit, searchRouter);
app.use('/api/orders', generalLimit, ordersRouter);
app.use('/api/orders/:id/messages', messagesRouter);
app.use('/api/payments', writeLimit, paymentsRouter);
app.use('/api/reviews', writeLimit, reviewsRouter);
app.use('/api/dashboard', generalLimit, dashboardRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

const server = http.createServer(app);
attachSocket(server);

// A wedged process is worse than a restarting one. Log loudly, exit, let Railway respawn.
process.on('unhandledRejection', (reason) => {
  console.error('[fatal] unhandledRejection', reason);
  shutdown(1);
});
process.on('uncaughtException', (err) => {
  console.error('[fatal] uncaughtException', err);
  shutdown(1);
});

let shuttingDown = false;
function shutdown(code = 0): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('[shutdown] draining connections…');
  server.close(() => {
    pool.end()
      .catch((err) => console.error('[shutdown] pool.end failed', err.message))
      .finally(() => process.exit(code));
  });
  setTimeout(() => {
    console.error('[shutdown] forced exit after 10s');
    process.exit(code || 1);
  }, 10_000).unref();
}
process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));

server.listen(config.port, () => {
  console.log(`PayLance API on :${config.port}  (Arc chainId ${config.arc.chainId})`);
});
