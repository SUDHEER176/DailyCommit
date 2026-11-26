import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { scrubEvent, setupErrorHandling, monitoringOn } from '../data/monitoring.js';

test('error reports carry no personal details or secrets', () => {
  const event = scrubEvent({
    request: {
      url: '/api/auth/login',
      data: '{"email":"a@b.c","password":"hunter2"}',
      cookies: { session: 'x' },
      query_string: 'token=abc',
      headers: { Authorization: 'Bearer secret', Cookie: 's=1', 'X-Razorpay-Signature': 'sig', 'content-type': 'application/json' },
    },
    user: { id: 'u1', email: 'a@b.c', ip_address: '1.2.3.4' },
  });
  assert.equal(event.request.url, '/api/auth/login');
  assert.equal(event.request.data, undefined);
  assert.equal(event.request.cookies, undefined);
  assert.equal(event.request.query_string, undefined);
  assert.deepEqual(event.request.headers, { 'content-type': 'application/json' });
  assert.deepEqual(event.user, { id: 'u1' });
});

test('Sentry stays off without SENTRY_DSN', () => {
  assert.equal(monitoringOn, Boolean(process.env.SENTRY_DSN));
});

test('errors come back as JSON: a short message for server errors, the reason for bad requests', async () => {
  const app = express();
  app.use(express.json());
  app.post('/echo', (req, res) => res.json(req.body));
  app.get('/boom', () => { throw new Error('database password is wrong'); });
  setupErrorHandling(app);
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const quiet = console.error;
  console.error = () => {}; // the handler logs server errors; keep the test output clean
  try {
    const boom = await fetch(`${base}/boom`);
    assert.equal(boom.status, 500);
    const body = await boom.json();
    assert.doesNotMatch(body.error, /password/); // internal details never reach the browser
    assert.match(body.error, /Something went wrong/);

    const bad = await fetch(`${base}/echo`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{not json' });
    assert.equal(bad.status, 400);
    assert.equal(typeof (await bad.json()).error, 'string');
  } finally {
    console.error = quiet;
    server.close();
  }
});
