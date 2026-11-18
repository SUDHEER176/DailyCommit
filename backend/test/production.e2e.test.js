// End-to-end tests of the real server in production mode on an in-memory Postgres.
// See test/helpers/production-harness.js for what is real and what is faked.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startProduction } from './helpers/production-harness.js';

let h;
before(async () => {
  // Spaces and a trailing slash in the list are tolerated
  h = await startProduction({ CORS_ORIGINS: 'https://app.example.test, https://www.example.test/' });
});
after(async () => { await h?.stop(); });

const DAY = 86400000;
const daysFromNow = (iso) => (Date.parse(iso) - Date.now()) / DAY;

test('production mode: health says so, and data routes need a sign-in', async () => {
  const health = await h.call('GET', '/health');
  assert.equal(health.json.mode, 'production');
  assert.equal(health.json.storage, 'neon');
  assert.equal((await h.call('GET', '/planner/plan')).status, 401);
  assert.equal((await h.call('GET', '/planner/revision')).status, 401);
  assert.equal((await h.call('GET', '/dev/seed')).status, 404, 'testing helpers do not exist in production');
});

test('CORS: only the listed sites may call the API from a browser; non-browser callers pass', async () => {
  const url = `http://localhost:${process.env.PORT}/api/health`;
  const allowed = await fetch(url, { headers: { Origin: 'https://app.example.test' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://app.example.test');
  const alsoAllowed = await fetch(url, { headers: { Origin: 'https://www.example.test' } });
  assert.equal(alsoAllowed.headers.get('access-control-allow-origin'), 'https://www.example.test', 'trailing slash in the setting is ignored');

  const blocked = await fetch(url, { headers: { Origin: 'https://evil.example.test' } });
  assert.equal(blocked.headers.get('access-control-allow-origin'), null, 'an unlisted site gets no permission');
  const preflight = await fetch(url, { method: 'OPTIONS', headers: { Origin: 'https://evil.example.test', 'Access-Control-Request-Method': 'GET' } });
  assert.equal(preflight.headers.get('access-control-allow-origin'), null);

  const noOrigin = await fetch(url); // curl, Razorpay's webhook, health checks
  assert.equal(noOrigin.status, 200);
});

test('sign up with an emailed code, then sign in', async () => {
  const email = 'ada@example.test';
  const reg = await h.call('POST', '/auth/register', { name: 'Ada', email, password: 'correct horse battery' });
  assert.equal(reg.json.data.pendingVerification, true);
  assert.equal((await h.call('POST', '/auth/register', { name: 'Ada', email: 'bad', password: 'correct horse battery' })).status, 400);
  assert.equal((await h.call('POST', '/auth/register', { name: 'Ada', email: 'x@example.test', password: 'short' })).status, 400);

  assert.equal((await h.call('POST', '/auth/verify-email', { email, code: '000000' })).status, 400);
  const ok = await h.call('POST', '/auth/verify-email', { email, code: h.codes.get(email) });
  assert.equal(ok.status, 200);
  const token = ok.json.data.token;
  assert.ok(token);

  const me = await h.call('GET', '/auth/me', null, token);
  assert.equal(me.json.data.email, email);
  assert.equal(me.json.data.plan, 'free');
  assert.equal(me.json.data.emailVerified, true);

  assert.equal((await h.call('POST', '/auth/login', { email, password: 'nope nope nope' })).status, 401);
  assert.equal((await h.call('POST', '/auth/login', { email, password: 'correct horse battery' })).status, 200);
  assert.equal((await h.call('POST', '/auth/register', { name: 'Ada', email, password: 'correct horse battery' })).status, 409, 'email already taken');

  assert.equal((await h.call('POST', '/auth/logout', null, token)).status, 200);
  assert.equal((await h.call('GET', '/auth/me', null, token)).status, 401, 'the session is gone after sign-out');
});

// ── Payments and Pro ──

test('a Free account: no smart revision, no progress detail, AI review asks to upgrade', async () => {
  const free = await h.signUp('Free User', 'free@example.test');
  assert.equal((await h.call('GET', '/planner/revision', null, free.token)).json.data.smart, false);
  assert.equal((await h.call('GET', '/planner/progress', null, free.token)).json.data.detailed, null);
  const review = await h.call('POST', '/ai/review', { problemId: 'nc-1', language: 'javascript', code: 'x' }, free.token);
  assert.equal(review.status, 402);
  assert.equal(review.json.upgrade, true);
  const plans = (await h.call('GET', '/billing/plans')).json.data;
  assert.equal(plans.enabled, true);
  assert.equal(plans.testingMode, false);
});

test('buying Pro: order, checkout signature, Pro on, safe to repeat, extensions stack', async () => {
  const buyer = await h.signUp('Buyer', 'buyer@example.test');
  const other = await h.signUp('Other', 'other@example.test');

  assert.equal((await h.call('POST', '/billing/order', { planId: 'nope' }, buyer.token)).status, 400);
  assert.equal((await h.call('POST', '/billing/order', { planId: 'pro_monthly' })).status, 401, 'needs sign-in');
  const order = (await h.call('POST', '/billing/order', { planId: 'pro_monthly' }, buyer.token)).json.data;
  assert.equal(order.amount, 19900);
  const { rows: created } = await h.sql('SELECT status, amount FROM payments WHERE order_id = $1', [order.orderId]);
  assert.deepEqual(created[0], { status: 'created', amount: 19900 });

  const verify = (token, sig) => h.call('POST', '/billing/verify', { orderId: order.orderId, paymentId: 'pay_1', signature: sig }, token);
  assert.equal((await verify(buyer.token, 'bad-signature')).status, 400, 'a forged signature is refused');
  assert.equal((await verify(other.token, h.checkoutSignature(order.orderId, 'pay_1'))).status, 400, 'someone else\'s order is refused');
  const { rows: still } = await h.sql('SELECT status FROM payments WHERE order_id = $1', [order.orderId]);
  assert.equal(still[0].status, 'created', 'nothing was activated by the failed attempts');

  const paid = await verify(buyer.token, h.checkoutSignature(order.orderId, 'pay_1'));
  assert.equal(paid.json.data.plan, 'pro');
  assert.ok(Math.abs(daysFromNow(paid.json.data.proUntil) - 30) < 1);

  const again = await verify(buyer.token, h.checkoutSignature(order.orderId, 'pay_1'));
  assert.equal(again.json.data.proUntil, paid.json.data.proUntil, 'repeating the callback adds no days');

  // Pro now unlocks things
  assert.equal((await h.call('GET', '/auth/me', null, buyer.token)).json.data.plan, 'pro');
  assert.equal((await h.call('GET', '/planner/revision', null, buyer.token)).json.data.smart, true);
  assert.ok((await h.call('GET', '/planner/progress', null, buyer.token)).json.data.detailed);
  assert.equal((await h.call('POST', '/ai/review', { code: 'x', language: 'javascript' }, buyer.token)).status, 503, 'past the Pro gate; the reviewer itself is not set up');

  // A second purchase adds to the time left
  const order2 = (await h.call('POST', '/billing/order', { planId: 'pro_monthly' }, buyer.token)).json.data;
  const second = await h.call('POST', '/billing/verify', { orderId: order2.orderId, paymentId: 'pay_2', signature: h.checkoutSignature(order2.orderId, 'pay_2') }, buyer.token);
  assert.ok(Math.abs(daysFromNow(second.json.data.proUntil) - 60) < 1);

  const history = (await h.call('GET', '/billing/history', null, buyer.token)).json.data;
  assert.equal(history.plan, 'pro');
  assert.deepEqual(history.payments.map((p) => [p.planName, p.status]), [['Pro monthly', 'paid'], ['Pro monthly', 'paid']]);
  assert.equal((await h.call('GET', '/billing/history', null, other.token)).json.data.payments.length, 0, 'history is per person');
});

test('the webhook activates Pro when the browser never came back, and refuses bad requests', async () => {
  const user = await h.signUp('Webhook User', 'hook@example.test');
  const order = (await h.call('POST', '/billing/order', { planId: 'pro_monthly' }, user.token)).json.data;
  const event = (amount) => ({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_w1', order_id: order.orderId, amount } } } });

  const forged = await fetch(`http://localhost:${process.env.PORT}/api/billing/webhook`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Razorpay-Signature': 'f'.repeat(64) }, body: JSON.stringify(event(19900)),
  });
  assert.equal(forged.status, 400);
  assert.equal((await h.webhook(event(100))).status, 200);
  assert.equal((await h.call('GET', '/auth/me', null, user.token)).json.data.plan, 'free', 'an amount that does not match activates nothing');
  assert.equal((await h.webhook(event(19900))).status, 200);
  assert.equal((await h.call('GET', '/auth/me', null, user.token)).json.data.plan, 'pro');
  await h.webhook(event(19900)); // Razorpay retries: still just one month
  const me = (await h.call('GET', '/auth/me', null, user.token)).json.data;
  assert.ok(Math.abs(daysFromNow(me.proUntil) - 30) < 1);
});

test('refunds: a full refund takes that purchase\'s days off Pro; partial refunds and repeats change nothing', async () => {
  const user = await h.signUp('Refunded', 'refunded@example.test');
  const buy = async (paymentId) => {
    const order = (await h.call('POST', '/billing/order', { planId: 'pro_monthly' }, user.token)).json.data;
    await h.call('POST', '/billing/verify', { orderId: order.orderId, paymentId, signature: h.checkoutSignature(order.orderId, paymentId) }, user.token);
  };
  await buy('pay_r1');
  await buy('pay_r2');
  const me = async () => (await h.call('GET', '/auth/me', null, user.token)).json.data;
  assert.ok(Math.abs(daysFromNow((await me()).proUntil) - 60) < 1, 'two months bought');

  const refundEvent = (paymentId, refunded) => ({
    event: 'refund.processed',
    payload: {
      refund: { entity: { id: `rfnd_${paymentId}`, payment_id: paymentId, amount: refunded, status: 'processed' } },
      payment: { entity: { id: paymentId, amount: 19900, amount_refunded: refunded, refund_status: refunded >= 19900 ? 'full' : 'partial' } },
    },
  });

  await h.webhook(refundEvent('pay_r1', 5000)); // partial: nothing changes
  assert.ok(Math.abs(daysFromNow((await me()).proUntil) - 60) < 1);
  const { rows: partial } = await h.sql("SELECT status FROM payments WHERE payment_id = 'pay_r1'");
  assert.equal(partial[0].status, 'paid');

  await h.webhook(refundEvent('pay_r1', 19900)); // full: that month comes off, the other stays
  assert.ok(Math.abs(daysFromNow((await me()).proUntil) - 30) < 1);
  const { rows: full } = await h.sql("SELECT status FROM payments WHERE payment_id = 'pay_r1'");
  assert.equal(full[0].status, 'refunded');

  await h.webhook(refundEvent('pay_r1', 19900)); // Razorpay retries: not taken off twice
  assert.ok(Math.abs(daysFromNow((await me()).proUntil) - 30) < 1);

  assert.equal((await h.webhook(refundEvent('pay_unknown', 19900))).status, 200, 'a payment that is not ours is ignored');

  await h.webhook(refundEvent('pay_r2', 19900)); // the other one too: back to Free
  assert.equal((await me()).plan, 'free');
  assert.equal((await h.call('GET', '/planner/revision', null, user.token)).json.data.smart, false);

  const history = (await h.call('GET', '/billing/history', null, user.token)).json.data;
  assert.deepEqual(history.payments.map((p) => p.status), ['refunded', 'refunded']);
});

test('when Pro ends, every Pro feature switches off', async () => {
  const user = await h.signUp('Expiring', 'expiring@example.test');
  const order = (await h.call('POST', '/billing/order', { planId: 'pro_monthly' }, user.token)).json.data;
  await h.call('POST', '/billing/verify', { orderId: order.orderId, paymentId: 'pay_e', signature: h.checkoutSignature(order.orderId, 'pay_e') }, user.token);
  assert.equal((await h.call('GET', '/planner/revision', null, user.token)).json.data.smart, true);
  await h.sql("UPDATE users SET plan_expires_at = now() - interval '1 day' WHERE email = $1", ['expiring@example.test']);
  assert.equal((await h.call('GET', '/auth/me', null, user.token)).json.data.plan, 'free');
  assert.equal((await h.call('GET', '/planner/revision', null, user.token)).json.data.smart, false);
  assert.equal((await h.call('POST', '/ai/review', { code: 'x', language: 'javascript' }, user.token)).status, 402);
});

test('forgot password: the answer never reveals who has an account, and unverified accounts get nothing', async () => {
  assert.equal((await h.call('POST', '/auth/forgot-password', { email: 'not-an-email' })).status, 400);

  h.codes.clear();
  const unknown = await h.call('POST', '/auth/forgot-password', { email: 'nobody@example.test' });
  assert.equal(unknown.status, 200);
  assert.deepEqual(Object.keys(unknown.json.data).sort(), ['email', 'retryAfter']);
  assert.equal(h.codes.has('nobody@example.test'), false, 'no email for an address with no account');

  await h.call('POST', '/auth/register', { name: 'Never Verified', email: 'unverified@example.test', password: 'correct horse battery' });
  h.codes.delete('unverified@example.test');
  const unverified = await h.call('POST', '/auth/forgot-password', { email: 'unverified@example.test' });
  assert.equal(unverified.status, 200, 'same answer');
  assert.equal(h.codes.has('unverified@example.test'), false, 'but a reset can\'t be used to skip email verification');

  const real = await h.signUp('Real', 'real-forgot@example.test');
  h.codes.delete(real.email);
  const known = await h.call('POST', '/auth/forgot-password', { email: real.email });
  assert.equal(known.status, 200);
  assert.deepEqual(Object.keys(known.json.data).sort(), ['email', 'retryAfter'], 'looks exactly like the unknown case');
  assert.match(h.codes.get(real.email), /^\d{6}$/);
});

test('reset password: the code sets a new password, signs out every old session, and works once', async () => {
  const user = await h.signUp('Forgetful', 'forgetful@example.test', 'old password 123');
  const second = (await h.call('POST', '/auth/login', { email: user.email, password: 'old password 123' })).json.data.token;
  assert.equal((await h.call('GET', '/auth/me', null, second)).status, 200);

  h.codes.delete(user.email);
  await h.call('POST', '/auth/forgot-password', { email: user.email });
  const code = h.codes.get(user.email);

  assert.equal((await h.call('POST', '/auth/reset-password', { email: user.email, code: '000000', password: 'new password 456' })).status, 400, 'wrong code');
  assert.equal((await h.call('POST', '/auth/reset-password', { email: user.email, code, password: 'short' })).status, 400, 'too short');
  assert.equal((await h.call('POST', '/auth/reset-password', { email: 'nobody@example.test', code, password: 'new password 456' })).status, 400, 'someone else\'s address');

  const done = await h.call('POST', '/auth/reset-password', { email: user.email, code, password: 'new password 456' });
  assert.equal(done.status, 200, 'the short attempt above did not use up the code');
  assert.equal(done.json.data.user.email, user.email);
  const fresh = done.json.data.token;

  assert.equal((await h.call('POST', '/auth/login', { email: user.email, password: 'old password 123' })).status, 401, 'the old password stops working');
  assert.equal((await h.call('POST', '/auth/login', { email: user.email, password: 'new password 456' })).status, 200);
  assert.equal((await h.call('GET', '/auth/me', null, user.token)).status, 401, 'the old session is signed out');
  assert.equal((await h.call('GET', '/auth/me', null, second)).status, 401, 'so is the other one');
  assert.equal((await h.call('GET', '/auth/me', null, fresh)).status, 200, 'the new session works');

  assert.equal((await h.call('POST', '/auth/reset-password', { email: user.email, code, password: 'another password 789' })).status, 400, 'the code works once');
});

test('export: the person\'s own data, nothing secret, nothing of anyone else\'s', async () => {
  const me = await h.signUp('Exporter', 'exporter@example.test');
  const someone = await h.signUp('Someone Else', 'someone-else@example.test');
  await h.call('POST', '/planner/attempts', { id: 'mine', problemId: 'nc-1', solved: true, runs: 1, submits: 1, title: 'MY-MARKER' }, me.token);
  await h.call('POST', '/planner/attempts', { id: 'theirs', problemId: 'nc-2', solved: true, runs: 1, submits: 1, title: 'THEIR-MARKER' }, someone.token);
  const order = (await h.call('POST', '/billing/order', { planId: 'pro_monthly' }, me.token)).json.data;
  await h.call('POST', '/billing/verify', { orderId: order.orderId, paymentId: 'pay_x1', signature: h.checkoutSignature(order.orderId, 'pay_x1') }, me.token);

  assert.equal((await h.call('GET', '/auth/me/export')).status, 401, 'needs sign-in');
  const exported = (await h.call('GET', '/auth/me/export', null, me.token)).json.data;
  assert.equal(exported.profile.email, 'exporter@example.test');
  assert.equal(exported.profile.plan, 'pro');
  assert.equal(exported.payments.length, 1);
  assert.equal(exported.payments[0].status, 'paid');
  const text = JSON.stringify(exported);
  assert.ok(text.includes('MY-MARKER'), 'includes their attempts');
  assert.ok(!text.includes('THEIR-MARKER'), 'and not anyone else\'s');
  assert.ok(!/password_hash|\$2[aby]\$/.test(text), 'no password hash');
});

test('delete account: needs the password, erases the person and their data, keeps anonymous payment records', async () => {
  const user = await h.signUp('Leaving', 'leaving@example.test', 'my old password 1');
  await h.call('POST', '/planner/attempts', { id: 'a1', problemId: 'nc-1', solved: true, runs: 1, submits: 1 }, user.token);
  const order = (await h.call('POST', '/billing/order', { planId: 'pro_monthly' }, user.token)).json.data;
  await h.call('POST', '/billing/verify', { orderId: order.orderId, paymentId: 'pay_d1', signature: h.checkoutSignature(order.orderId, 'pay_d1') }, user.token);
  const { rows: [{ id: userId }] } = await h.sql("SELECT id FROM users WHERE email = 'leaving@example.test'");
  await new Promise((r) => setTimeout(r, 400)); // saved data reaches the database
  assert.ok((await h.sql('SELECT 1 FROM user_state WHERE user_id = $1', [userId])).rows.length > 0, 'there is saved data to erase');

  assert.equal((await h.call('DELETE', '/auth/me', {})).status, 401, 'needs sign-in');
  assert.equal((await h.call('DELETE', '/auth/me', {}, user.token)).status, 400, 'no password');
  assert.equal((await h.call('DELETE', '/auth/me', { password: 'wrong wrong 123' }, user.token)).status, 400, 'wrong password');
  assert.equal((await h.call('GET', '/auth/me', null, user.token)).status, 200, 'still there after the failed attempts');

  assert.equal((await h.call('DELETE', '/auth/me', { password: 'my old password 1' }, user.token)).status, 200);

  assert.equal((await h.call('GET', '/auth/me', null, user.token)).status, 401, 'signed out');
  assert.equal((await h.call('POST', '/auth/login', { email: 'leaving@example.test', password: 'my old password 1' })).status, 401, 'cannot sign in again');
  const { rows: [row] } = await h.sql('SELECT email, name, password_hash, google_sub, plan_expires_at FROM users WHERE id = $1', [userId]);
  assert.deepEqual(row, { email: `deleted-${userId}@deleted.invalid`, name: 'Deleted account', password_hash: null, google_sub: null, plan_expires_at: null });
  assert.equal((await h.sql('SELECT 1 FROM user_state WHERE user_id = $1', [userId])).rows.length, 0, 'saved data is gone');
  const { rows: pay } = await h.sql('SELECT status FROM payments WHERE user_id = $1', [userId]);
  assert.deepEqual(pay, [{ status: 'paid' }], 'the payment record stays, tied to no personal details');

  await new Promise((r) => setTimeout(r, 400)); // nothing writes the data back afterwards
  assert.equal((await h.sql('SELECT 1 FROM user_state WHERE user_id = $1', [userId])).rows.length, 0);

  // The address is free again, and the new account starts empty and Free
  const again = await h.signUp('Back Again', 'leaving@example.test', 'a brand new password');
  assert.equal(again.user.plan, 'free');
  assert.equal((await h.call('GET', '/planner/attempts?problemId=nc-1', null, again.token)).json.data.length, 0);
});

test('delete account for a Google-only account: type your email to confirm', async () => {
  const crypto = await import('node:crypto');
  const token = crypto.randomBytes(32).toString('base64url');
  const { rows: [{ id }] } = await h.sql(
    "INSERT INTO users (email, name, google_sub, email_verified, email_verified_at) VALUES ('g-only@example.test', 'G Only', 'sub-123', true, now()) RETURNING id");
  await h.sql("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + interval '1 day')",
    [crypto.createHash('sha256').update(token).digest('hex'), id]);

  assert.equal((await h.call('DELETE', '/auth/me', {}, token)).status, 400);
  assert.equal((await h.call('DELETE', '/auth/me', { confirm: 'someone-else@example.test' }, token)).status, 400);
  assert.equal((await h.call('DELETE', '/auth/me', { confirm: 'G-Only@Example.test ' }, token)).status, 200, 'case and spaces do not matter');
  const { rows: [row] } = await h.sql('SELECT name, google_sub FROM users WHERE id = $1', [id]);
  assert.deepEqual(row, { name: 'Deleted account', google_sub: null });
});

test('each account only sees its own data', async () => {
  const a = await h.signUp('A', 'a@example.test');
  const b = await h.signUp('B', 'b@example.test');
  await h.call('POST', '/planner/attempts', { id: 'only-a', problemId: 'nc-1', solved: true, runs: 1, submits: 1 }, a.token);
  assert.equal((await h.call('GET', '/planner/attempts?problemId=nc-1', null, a.token)).json.data.length, 1);
  assert.equal((await h.call('GET', '/planner/attempts?problemId=nc-1', null, b.token)).json.data.length, 0);
});
