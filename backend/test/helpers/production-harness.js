// Runs the real server in PRODUCTION mode, inside the test process, on an in-memory Postgres
// (pglite). So sign-up, sign-in, payments and the Pro checks run their real SQL, and nothing
// touches a real database, Razorpay, or an email provider:
//   - Razorpay's order API is faked (everything else, including signature checks, is real)
//   - verification and reset codes are read from the "email not set up" console message
//
// Usage (the env must be set before the server's modules load, which is why this is a function):
//   const h = await startProduction();   ...   await h.stop();

import crypto from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

export const KEY_SECRET = 'test-key-secret';
export const WEBHOOK_SECRET = 'test-webhook-secret';

const sign = (secret, data) => crypto.createHmac('sha256', secret).update(data).digest('hex');

export async function startProduction(envOverrides = {}) {
  const port = Number(envOverrides.PORT) || 7100 + Math.floor(Math.random() * 800);
  Object.assign(process.env, {
    APP_MODE: 'production', PORT: String(port), DOTENV_CONFIG_PATH: 'no-such-file.env',
    DATABASE_URL: 'postgresql://test:test@localhost/test', // never connected: the pool is swapped below
    RAZORPAY_KEY_ID: 'rzp_test_harness', RAZORPAY_KEY_SECRET: KEY_SECRET, RAZORPAY_WEBHOOK_SECRET: WEBHOOK_SECRET,
    GEMINI_API_KEY: '', JUDGE0_API_KEY: '', JUDGE0_URL: '', GOOGLE_CLIENT_ID: '',
    BREVO_API_KEY: '', RESEND_API_KEY: '', SMTP_HOST: '', SMTP_USER: '', SMTP_PASS: '', CORS_ORIGINS: '',
    ...envOverrides,
  });

  // Swap the database before anything queries it
  const pg = new PGlite();
  const run = (text, params) => pg.query(text, params);
  const { setBackend } = await import('../../data/neon.js');
  setBackend({ query: run, connect: async () => ({ query: run, release() {} }), end: async () => { try { await pg.close(); } catch { /* already closed */ } } });

  // Codes: the mailer prints "... Verification code for <email>: 123456" when no email is set up
  const codes = new Map();
  const realLog = console.log;
  console.log = (...args) => {
    const m = String(args[0]).match(/code for ([^:\s]+):? (\d{6})/i) || String(args[0]).match(/\[mail\].*for ([^\s:]+): (\d{6})/);
    if (m) codes.set(m[1], m[2]);
    else if (!String(args[0]).startsWith('[') && !String(args[0]).startsWith('\n[mail]') && !String(args[0]).startsWith('Backend')) realLog(...args);
  };

  // Fake Gemini: tests set `gemini.analysis` (what the model "says") or `gemini.status` (an error code)
  const gemini = {
    calls: 0,
    status: 200,
    analysis: {
      timeComplexity: 'O(n)', spaceComplexity: 'O(n)', bestKnownTime: 'O(n)', bestKnownSpace: 'O(n)',
      timeGrade: 'optimal', spaceGrade: 'optimal', approach: 'Hash set', intuition: 'Remember what you have seen.', betterApproach: '',
    },
  };

  // Fake Razorpay's order API and Gemini; everything else goes through
  const realFetch = globalThis.fetch;
  let orderCount = 0;
  globalThis.fetch = async (url, opts) => {
    if (String(url).includes('generativelanguage.googleapis.com')) {
      gemini.calls += 1;
      if (gemini.status !== 200) {
        return new Response(JSON.stringify({ error: { code: gemini.status, message: 'fake error', status: 'UNAVAILABLE' } }), { status: gemini.status, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({
        candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify(gemini.analysis) }] }, finishReason: 'STOP', index: 0 }],
        modelVersion: 'fake-gemini',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (String(url) === 'https://api.razorpay.com/v1/orders' && opts?.method === 'POST') {
      const body = JSON.parse(opts.body);
      return new Response(JSON.stringify({ id: `order_h${++orderCount}`, amount: body.amount, currency: body.currency }), { status: 200 });
    }
    return realFetch(url, opts);
  };

  const { start } = await import('../../server.js');
  const server = await start();
  const base = `http://localhost:${port}/api`;

  async function call(method, url, body, token) {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await realFetch(base + url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, json: await res.json().catch(() => null) };
  }

  /** Register + verify an account; resolves { token, user, email } */
  async function signUp(name, email, password = 'correct horse battery') {
    const reg = await call('POST', '/auth/register', { name, email, password });
    if (reg.status !== 202) throw new Error(`register failed: ${reg.status} ${JSON.stringify(reg.json)}`);
    const verify = await call('POST', '/auth/verify-email', { email, code: codes.get(email) });
    if (verify.status !== 200) throw new Error(`verify failed: ${verify.status} ${JSON.stringify(verify.json)}`);
    return { token: verify.json.data.token, user: verify.json.data.user, email, password };
  }

  /** A signed Razorpay webhook request, as Razorpay would send it */
  const webhook = (event) => {
    const raw = JSON.stringify(event);
    return realFetch(`${base}/billing/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Razorpay-Signature': sign(WEBHOOK_SECRET, raw) }, body: raw });
  };

  return {
    call, signUp, webhook, codes, sql: run, sign, gemini,
    checkoutSignature: (orderId, paymentId) => sign(KEY_SECRET, `${orderId}|${paymentId}`),
    async stop() {
      console.log = realLog;
      globalThis.fetch = realFetch;
      await new Promise((resolve) => server.close(resolve));
      await pg.close().catch(() => {});
    },
  };
}
