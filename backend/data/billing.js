import crypto from 'crypto';
import { pool, query, hasDatabase } from './neon.js';

// Razorpay keys live in backend/.env. Test keys (rzp_test_...) take test payments only.
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET } = process.env;
export const razorpayConfigured = Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
export const razorpayKeyId = RAZORPAY_KEY_ID || null;
export const razorpayTestMode = Boolean(RAZORPAY_KEY_ID?.startsWith('rzp_test_'));

// Prices are set here only, never taken from the browser. Amounts are in paise.
export const PLANS = {
  pro_monthly: { id: 'pro_monthly', name: 'Pro monthly', amount: 19900, currency: 'INR', days: 30 },
  pro_yearly: { id: 'pro_yearly', name: 'Pro yearly', amount: 100, currency: 'INR', days: 365 },
};

/** Plans priced so low it is almost certainly a leftover test value (under ₹50) */
export const suspiciouslyCheapPlans = () => Object.values(PLANS).filter((p) => p.amount < 5000);

export const publicPlans = () =>
  Object.values(PLANS).map(({ id, name, amount, currency, days }) => ({ id, name, amount, currency, days }));

/** Pro status from a users row */
export function proStatus(row) {
  const until = row?.plan_expires_at ? new Date(row.plan_expires_at) : null;
  const active = Boolean(until && until.getTime() > Date.now());
  return { plan: active ? 'pro' : 'free', proUntil: until ? until.toISOString() : null };
}

/**
 * Pro checks. `requirePro` is a route guard: mount after requireUser; it answers 402 with
 * `upgrade: true` for Free accounts, so the frontend can point to the pricing page.
 * `isProUser` is for routes that serve both plans differently. In file mode (no database, one
 * local user, accounts off) everything stays open, like the rest of the API.
 */
export function createProChecks({ hasDatabase: dbOn, query: runQuery }) {
  /** Whether this user may use Pro features right now (always true in file mode) */
  async function isProUser(userId) {
    if (!dbOn) return true;
    if (!userId) return false;
    const { rows } = await runQuery('SELECT plan_expires_at FROM users WHERE id = $1', [userId]);
    return proStatus(rows[0]).plan === 'pro';
  }

  async function requirePro(req, res, next) {
    try {
      if (await isProUser(req.userId)) return next();
      res.status(402).json({ success: false, upgrade: true, error: 'This is part of Pro' });
    } catch (err) {
      console.error('[billing] Pro check failed:', err.message);
      res.status(500).json({ success: false, error: 'Could not check your plan' });
    }
  }

  return { isProUser, requirePro };
}

// The real checks, against the users table. Tests build their own with createProChecks.
export const { isProUser, requirePro } = createProChecks({ hasDatabase, query });

/** Create a Razorpay order for a plan and remember it against the user */
export async function createOrder(user, planId) {
  const plan = PLANS[planId];
  if (!plan) throw Object.assign(new Error('Unknown plan'), { status: 400 });

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64'),
    },
    body: JSON.stringify({
      amount: plan.amount,
      currency: plan.currency,
      receipt: `dc_${Date.now().toString(36)}`,
      notes: { user_id: user.id, plan_id: plan.id },
    }),
    signal: AbortSignal.timeout(10000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[billing] Razorpay order failed:', res.status, body?.error?.description || body);
    throw Object.assign(new Error('Could not start the payment. Try again'), { status: 502 });
  }

  await query(
    'INSERT INTO payments (order_id, user_id, plan_id, amount, currency) VALUES ($1, $2, $3, $4, $5)',
    [body.id, user.id, plan.id, plan.amount, plan.currency]
  );
  return { orderId: body.id, amount: plan.amount, currency: plan.currency, plan };
}

const safeEqualHex = (a, b) => {
  const x = Buffer.from(String(a || ''), 'utf8');
  const y = Buffer.from(String(b || ''), 'utf8');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/** Checkout's success callback signature: HMAC-SHA256(order_id|payment_id, key secret) */
export function checkPaymentSignature({ orderId, paymentId, signature }) {
  const expected = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqualHex(expected, signature);
}

/** Webhook signature: HMAC-SHA256(raw body, webhook secret) */
export function checkWebhookSignature(rawBody, signature) {
  if (!RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
  return safeEqualHex(expected, signature);
}
export const webhookConfigured = Boolean(RAZORPAY_WEBHOOK_SECRET);

/**
 * Mark an order paid and extend Pro. Safe to call twice (checkout callback and webhook):
 * only the first call changes anything. Returns the user id, or null if the order is unknown.
 */
export async function activateOrder(orderId, paymentId, { userId = null, amount = null } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM payments WHERE order_id = $1 FOR UPDATE', [orderId]);
    const pay = rows[0];
    if (!pay || (userId && pay.user_id !== userId)) {
      await client.query('ROLLBACK');
      return null;
    }
    if (pay.status === 'paid') {
      await client.query('COMMIT');
      return pay.user_id;
    }
    if (amount != null && Number(amount) !== pay.amount) {
      await client.query('ROLLBACK');
      console.error('[billing] amount mismatch on', orderId, amount, '!=', pay.amount);
      return null;
    }
    const plan = PLANS[pay.plan_id];
    await client.query("UPDATE payments SET status = 'paid', payment_id = $2, paid_at = now() WHERE order_id = $1", [orderId, paymentId]);
    // Extend from today, or from the current expiry if Pro is still running
    await client.query(
      `UPDATE users SET plan_expires_at = GREATEST(COALESCE(plan_expires_at, now()), now()) + make_interval(days => $2)
       WHERE id = $1`,
      [pay.user_id, plan.days]
    );
    await client.query('COMMIT');
    return pay.user_id;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => { });
    throw err;
  } finally {
    client.release();
  }
}

/**
 * A refund came through (Razorpay's refund.processed webhook). If the payment is now refunded in
 * full, mark it refunded and take its days off Pro: another purchase's days stay, and the end
 * date never goes into the past because of a refund. A partial refund changes nothing.
 * Safe to call again for the same payment. Returns { userId, revoked } or null when the payment
 * isn't one of ours or wasn't paid.
 */
export async function applyRefund(paymentId, refundedAmount) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM payments WHERE payment_id = $1 FOR UPDATE', [paymentId]);
    const pay = rows[0];
    if (!pay || pay.status !== 'paid') {
      await client.query('ROLLBACK');
      return null;
    }
    if (Number(refundedAmount) < pay.amount) {
      await client.query('COMMIT');
      return { userId: pay.user_id, revoked: false };
    }
    const plan = PLANS[pay.plan_id];
    await client.query("UPDATE payments SET status = 'refunded' WHERE order_id = $1", [pay.order_id]);
    await client.query(
      'UPDATE users SET plan_expires_at = GREATEST(plan_expires_at - make_interval(days => $2), now()) WHERE id = $1 AND plan_expires_at IS NOT NULL',
      [pay.user_id, plan?.days ?? 0]
    );
    await client.query('COMMIT');
    return { userId: pay.user_id, revoked: true };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => { });
    throw err;
  } finally {
    client.release();
  }
}
