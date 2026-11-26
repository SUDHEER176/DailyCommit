import 'dotenv/config'; // must stay first: loads DATABASE_URL before the store connects
import { monitoringOn, setupErrorHandling } from './data/monitoring.js'; // second: Sentry starts before Express loads
import { pathToFileURL } from 'url';
import express from 'express';
import cors from 'cors';
import tasksRouter from './routes/tasks.js';
import problemsRouter from './routes/problems.js';
import roadmapRouter from './routes/roadmap.js';
import statsRouter from './routes/stats.js';
import authRouter from './routes/auth.js';
import plannerRouter from './routes/planner.js';
import billingRouter, { webhookHandler, billingStatus } from './routes/billing.js';
import executeRouter, { executeStatus } from './routes/execute.js';
import aiRouter from './routes/ai.js';
import devRouter from './routes/dev.js';
import { aiReviewConfigured, aiReviewModel } from './data/ai-review.js';
import { APP_MODE, isProduction, isTesting } from './data/app-mode.js';
import { initDb, flushDb, storageMode } from './data/store.js';
import { pool, ping } from './data/neon.js';
import { requireUser, googleClientId } from './data/auth.js';
import { suspiciouslyCheapPlans } from './data/billing.js';
import { mailConfigured, mailProvider, verifyMailer } from './data/mailer.js';

const app = express();
// Render and similar hosts sit behind one proxy; this makes req.ip the visitor's address (used by rate limits)
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// CORS_ORIGINS: comma-separated sites allowed to call this API from a browser, e.g.
// "https://dailycommit.online,https://www.dailycommit.online". Requests with no Origin header
// (curl, Razorpay's webhook, health checks) are not browser requests and always pass.
// Unset means any site may call it (fine locally; production logs a warning at startup).
const corsOrigins = String(process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean);
app.use(cors({
  origin: corsOrigins.length
    ? (origin, callback) => callback(null, !origin || corsOrigins.includes(origin))
    : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));
// Razorpay signs the exact bytes it sends, so the webhook reads the raw body before JSON parsing
app.post('/api/billing/webhook', express.raw({ type: 'application/json', limit: '1mb' }), webhookHandler);
app.use(express.json({ limit: '2mb' }));

// Sign-in routes are public; every data route needs a signed-in user (in Neon mode)
app.use('/api/auth', authRouter);
app.use('/api/tasks', requireUser, tasksRouter);
// LeetCode statement lookups stay public so guests can use the editor
app.use('/api/problems', (req, res, next) => (req.method === 'GET' && req.path.startsWith('/details/') ? next() : requireUser(req, res, next)), problemsRouter);
app.use('/api/roadmap', requireUser, roadmapRouter);
app.use('/api/stats', requireUser, statsRouter);
app.use('/api/planner', requireUser, plannerRouter);
app.use('/api/billing', billingRouter);
// C++ and Java runs for the code editor; public like the statement lookups, rate limited per IP
app.use('/api/execute', executeRouter);
// AI code review after an accepted submit (signed in and Pro when accounts are on)
app.use('/api/ai', aiRouter);
// Sample data and reset, for trying the app; these routes don't exist in production
if (isTesting) app.use('/api/dev', devRouter);

// Health check, including the database connection
app.get('/api/health', async (req, res) => {
  const body = { status: 'healthy', mode: APP_MODE, storage: storageMode, timestamp: new Date().toISOString() };
  if (pool) {
    try {
      const { now } = await ping();
      body.database = { connected: true, serverTime: now };
    } catch (err) {
      return res.status(503).json({ ...body, status: 'degraded', database: { connected: false, error: err.message } });
    }
  }
  res.json(body);
});

// Errors that reach Express go to Sentry (when on) and come back as JSON
setupErrorHandling(app);

/** Start the API. Resolves with the HTTP server once it is listening. */
export async function start() {
  if (isProduction && !pool) {
    console.error('[mode] APP_MODE=production needs DATABASE_URL in backend/.env. Set it, or run with APP_MODE=testing.');
    process.exit(1);
  }
  console.log(isProduction
    ? '[mode] PRODUCTION: sign-in required, payments on, Pro features for Pro accounts'
    : '[mode] TESTING: no sign-in, every Pro feature free, payments off, data in backend/data/testing-db.json');
  try {
    const info = await initDb();
    if (info.mode === 'neon') {
      console.log(`[neon] connected. Accounts on: email and password${googleClientId ? ', Google' : ' (Google off, set GOOGLE_CLIENT_ID to enable)'}`);
      const billing = billingStatus();
      console.log(billing.configured
        ? `[billing] Razorpay on (${billing.testMode ? 'test mode' : 'LIVE mode'})${billing.webhook ? ', webhook on' : ', webhook off (set RAZORPAY_WEBHOOK_SECRET)'}`
        : '[billing] Razorpay off, set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to take payments');
      suspiciouslyCheapPlans().forEach((p) => console.error(`[billing] WARNING: plan "${p.id}" costs only ${p.amount / 100} ${p.currency}. If that is a leftover test price, fix PLANS in data/billing.js before taking real payments.`));
      if (mailConfigured) {
        verifyMailer()
          .then(() => console.log(`[mail] ${mailProvider} ready, verification codes will be emailed`))
          .catch((err) => console.error(`[mail] ${mailProvider} check failed:`, err.message,
            mailProvider === 'smtp' && /timeout/i.test(err.message)
              ? '(this host probably blocks SMTP ports; set BREVO_API_KEY or RESEND_API_KEY instead)'
              : ''));
      } else {
        console.log('[mail] Email not set, verification codes are printed here instead of emailed');
      }
    } else {
      console.log(`[storage] local file (${process.env.DB_FILE || 'data/testing-db.json'}), accounts off`);
    }
    const runner = executeStatus();
    console.log(runner.configured
      ? `[execute] C++ and Java run on Judge0 (${runner.url})`
      : '[execute] C++ and Java off, set JUDGE0_API_KEY (or JUDGE0_URL for a self-hosted Judge0)');
    console.log(aiReviewConfigured
      ? `[ai] Code review on (${aiReviewModel})`
      : '[ai] Code review off, set GEMINI_API_KEY to enable (free key: https://aistudio.google.com/apikey)');
    console.log(monitoringOn ? '[monitoring] Sentry on, errors are reported' : '[monitoring] Sentry off, set SENTRY_DSN to report errors');
    if (isProduction && !corsOrigins.length) {
      console.warn('[cors] CORS_ORIGINS is not set, so any website can call this API from a browser. Set it to your site, e.g. CORS_ORIGINS=https://yourdomain.com');
    }
  } catch (err) {
    console.error('[neon] could not connect:', err.message);
    console.error('Check DATABASE_URL in backend/.env, then start the server again.');
    process.exit(1);
  }

  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`Backend API running on http://localhost:${PORT} (health: /api/health)`);
      resolve(server);
    });
  });
}

async function shutdown() {
  await flushDb().catch(() => {});
  if (pool) await pool.end().catch(() => {});
  process.exit(0);
}
export { app };

// Run when started with `node server.js`; tests import this file and call start() themselves
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  start();
}
