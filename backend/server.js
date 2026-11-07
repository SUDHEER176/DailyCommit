import 'dotenv/config'; // must stay first: loads DATABASE_URL before the store connects
import express from 'express';
import cors from 'cors';
import tasksRouter from './routes/tasks.js';
import problemsRouter from './routes/problems.js';
import roadmapRouter from './routes/roadmap.js';
import statsRouter from './routes/stats.js';
import authRouter from './routes/auth.js';
import plannerRouter from './routes/planner.js';
import billingRouter, { webhookHandler, billingStatus } from './routes/billing.js';
import { initDb, flushDb, storageMode } from './data/store.js';
import { pool, ping } from './data/neon.js';
import { requireUser, googleClientId } from './data/auth.js';
import { mailConfigured, verifyMailer } from './data/mailer.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
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

// Health check, including the database connection
app.get('/api/health', async (req, res) => {
  const body = { status: 'healthy', storage: storageMode, timestamp: new Date().toISOString() };
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

async function start() {
  try {
    const info = await initDb();
    if (info.mode === 'neon') {
      console.log(`[neon] connected. Accounts on: email and password${googleClientId ? ', Google' : ' (Google off, set GOOGLE_CLIENT_ID to enable)'}`);
      const billing = billingStatus();
      console.log(billing.configured
        ? `[billing] Razorpay on (${billing.testMode ? 'test mode' : 'LIVE mode'})${billing.webhook ? ', webhook on' : ', webhook off (set RAZORPAY_WEBHOOK_SECRET)'}`
        : '[billing] Razorpay off, set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to take payments');
      if (mailConfigured) {
        verifyMailer()
          .then(() => console.log('[mail] SMTP ready, verification codes will be emailed'))
          .catch((err) => console.error('[mail] SMTP login failed:', err.message));
      } else {
        console.log('[mail] SMTP not set, verification codes are printed here instead of emailed');
      }
    } else {
      console.log('[storage] DATABASE_URL not set, using data/db.json. Accounts are off');
    }
  } catch (err) {
    console.error('[neon] could not connect:', err.message);
    console.error('Check DATABASE_URL in backend/.env, then start the server again.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Backend API running on http://localhost:${PORT} (health: /api/health)`);
  });
}

async function shutdown() {
  await flushDb().catch(() => {});
  if (pool) await pool.end().catch(() => {});
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
