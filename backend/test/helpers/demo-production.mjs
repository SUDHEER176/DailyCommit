// Manual testing: the real server in PRODUCTION mode on an in-memory Postgres, on port 5000 so
// the frontend (npm run dev) talks to it. Sign-up, sign-in, password reset, Pro and the account
// screens can all be tried in a browser without a real database or email.
//
//   cd backend && node test/helpers/demo-production.mjs
//
// A small helper server on port 5001 stands in for the email inbox and the payment gateway:
//   GET  /code?email=you@example.com        the latest emailed code (sign-up or reset)
//   POST /pro?email=you@example.com&days=3  makes that account Pro for N days (with a paid payment)
// Everything is lost when you stop it. The app itself has no such routes.

import http from 'node:http';
import { startProduction } from './production-harness.js';

const h = await startProduction({ PORT: '5000' });

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const email = url.searchParams.get('email') || '';
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (url.pathname === '/code') return res.end(JSON.stringify({ code: h.codes.get(email) || null }));
  if (url.pathname === '/pro' && req.method === 'POST') {
    const days = Number(url.searchParams.get('days') || 30);
    const { rows } = await h.sql('SELECT id FROM users WHERE email = $1', [email]);
    if (!rows[0]) { res.statusCode = 404; return res.end(JSON.stringify({ error: 'no such user' })); }
    await h.sql("UPDATE users SET plan_expires_at = now() + make_interval(days => $2) WHERE id = $1", [rows[0].id, days]);
    await h.sql(
      "INSERT INTO payments (order_id, user_id, plan_id, amount, currency, status, payment_id, paid_at) VALUES ($1, $2, 'pro_monthly', 19900, 'INR', 'paid', $3, now())",
      [`order_demo_${Date.now()}`, rows[0].id, `pay_demo_${Date.now()}`]
    );
    return res.end(JSON.stringify({ ok: true, days }));
  }
  res.statusCode = 404;
  res.end('{}');
}).listen(5001, () => console.error('DEMO READY: API on http://localhost:5000, helper on http://localhost:5001 (/code, /pro)'));
