import express from 'express';
import { hasDatabase, query } from '../data/neon.js';
import { requireUser } from '../data/auth.js';
import {
  razorpayConfigured, razorpayKeyId, razorpayTestMode, webhookConfigured, publicPlans,
  createOrder, checkPaymentSignature, checkWebhookSignature, activateOrder, proStatus,
} from '../data/billing.js';

const router = express.Router();
const paymentsOn = () => hasDatabase && razorpayConfigured;
const paymentsOff = (res) =>
  res.status(503).json({ success: false, error: 'Payments are not set up yet. Add the Razorpay keys to backend/.env' });

/** GET /api/billing/plans: prices and whether checkout is available */
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    data: { plans: publicPlans(), enabled: paymentsOn(), testMode: razorpayTestMode, keyId: paymentsOn() ? razorpayKeyId : null },
  });
});

/** POST /api/billing/order { planId } → a Razorpay order for checkout */
router.post('/order', requireUser, async (req, res) => {
  if (!paymentsOn()) return paymentsOff(res);
  try {
    const { rows } = await query('SELECT id, name, email FROM users WHERE id = $1', [req.userId]);
    if (!rows[0]) return res.status(401).json({ success: false, error: 'Sign in to continue' });
    const order = await createOrder(rows[0], String(req.body.planId || ''));
    res.json({
      success: true,
      data: {
        keyId: razorpayKeyId,
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        planName: order.plan.name,
        prefill: { name: rows[0].name, email: rows[0].email },
      },
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.status ? err.message : 'Could not start the payment' });
  }
});

/** POST /api/billing/verify { orderId, paymentId, signature } → turns Pro on */
router.post('/verify', requireUser, async (req, res) => {
  if (!paymentsOn()) return paymentsOff(res);
  const orderId = String(req.body.orderId || '');
  const paymentId = String(req.body.paymentId || '');
  const signature = String(req.body.signature || '');
  try {
    if (!orderId || !paymentId || !checkPaymentSignature({ orderId, paymentId, signature })) {
      return res.status(400).json({ success: false, error: 'We could not confirm this payment. If money was taken, it will be refunded or applied automatically' });
    }
    const userId = await activateOrder(orderId, paymentId, { userId: req.userId });
    if (!userId) return res.status(400).json({ success: false, error: 'This payment does not match your account' });
    const { rows } = await query('SELECT plan_expires_at FROM users WHERE id = $1', [userId]);
    res.json({ success: true, data: proStatus(rows[0]) });
  } catch (err) {
    console.error('[billing] verify failed:', err.message);
    res.status(500).json({ success: false, error: 'Could not confirm the payment. Refresh in a minute' });
  }
});

/**
 * Razorpay webhook, mounted with a raw body in server.js. Backs up the checkout callback,
 * so Pro still turns on if the browser closes right after paying.
 */
export async function webhookHandler(req, res) {
  if (!hasDatabase) return res.status(503).end();
  const raw = req.body instanceof Buffer ? req.body : Buffer.from('');
  if (!checkWebhookSignature(raw, req.get('X-Razorpay-Signature'))) return res.status(400).end();
  try {
    const event = JSON.parse(raw.toString('utf8'));
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload?.payment?.entity;
      if (payment?.order_id && payment?.id) {
        await activateOrder(payment.order_id, payment.id, { amount: payment.amount });
      }
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[billing] webhook failed:', err.message);
    res.status(500).end(); // Razorpay retries
  }
}

export const billingStatus = () => ({ configured: razorpayConfigured, testMode: razorpayTestMode, webhook: webhookConfigured });

export default router;
