import React, { useEffect, useMemo, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { BRAND } from '@/lib/brand';

// Shown until the server answers, and if it cannot be reached (checkout stays off then)
const FALLBACK_PLANS = [
  { id: 'pro_monthly', name: 'Pro monthly', amount: 19900, currency: 'INR', days: 30 },
  { id: 'pro_yearly', name: 'Pro yearly', amount: 149900, currency: 'INR', days: 365 },
];

const FREE_FEATURES = [
  'One active plan that follows your target date',
  'Problem log, streak and solve heatmap',
  'Revision at 3, 7 and 21 days',
  'Code editor with run and submit',
  'Solved by difficulty and weekly pace',
];

// Pro features not built yet are marked, so nobody pays for something that is not there
const PRO_FEATURES = [
  { text: 'Everything in Free' },
  { text: 'Company-wise sheets: Amazon, Google, Microsoft and more', soon: true },
  { text: 'Smart revision: problems you needed help on come back sooner', soon: true },
  { text: 'Mock interview mode: 2 problems in 45 minutes, scored', soon: true },
  { text: 'Detailed analytics: weak topics and on-track check for your date', soon: true },
  { text: 'Morning email with the day’s plan and revisions', soon: true },
];

const FAQ = [
  ['Does Pro renew by itself?', 'No. Pro is a one-time payment for 30 or 365 days. When it ends, your account goes back to Free and keeps all your data.'],
  ['How can I pay?', 'UPI, debit and credit cards, net banking and wallets, through Razorpay.'],
  ['What happens to my streak and plan on Free?', 'Nothing. Logging, streaks and revision stay free for good.'],
  ['Can I extend Pro early?', 'Yes. Buying again adds the new days on top of the time you have left.'],
];

const inr = (paise) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);

const longDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

let checkoutScript = null;
function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (!checkoutScript) {
    checkoutScript = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.async = true;
      s.onload = resolve;
      s.onerror = () => { checkoutScript = null; reject(new Error('Could not load Razorpay. Check your connection')); };
      document.body.appendChild(s);
    });
  }
  return checkoutScript;
}

export default function PricingPage({ currentUser, onOpenAuthModal, onUserUpdate }) {
  const [billing, setBilling] = useState(null);
  const [cycle, setCycle] = useState('yearly');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.getBillingPlans().then(setBilling);
  }, []);

  const plans = billing?.plans?.length ? billing.plans : FALLBACK_PLANS;
  const monthly = plans.find((p) => p.id === 'pro_monthly');
  const yearly = plans.find((p) => p.id === 'pro_yearly');
  const chosen = cycle === 'yearly' ? yearly : monthly;
  const savePct = monthly && yearly ? Math.round((1 - yearly.amount / (monthly.amount * 12)) * 100) : 0;

  const signedIn = Boolean(currentUser?.isAuthenticated);
  const isPro = currentUser?.plan === 'pro';
  const enabled = Boolean(billing?.enabled);

  const perMonth = useMemo(() => (chosen ? Math.round(chosen.amount / (chosen.days / 30)) : 0), [chosen]);

  const upgrade = async () => {
    setError('');
    setSuccess('');
    if (!signedIn) return onOpenAuthModal && onOpenAuthModal();
    setBusy(true);
    try {
      await loadCheckout();
      const order = await api.startCheckout(chosen.id);
      if (!order.success) throw new Error(order.error);
      const o = order.data;
      const rzp = new window.Razorpay({
        key: o.keyId,
        order_id: o.orderId,
        amount: o.amount,
        currency: o.currency,
        name: BRAND.name,
        description: o.planName,
        prefill: o.prefill,
        theme: { color: '#0066FF' },
        handler: async (resp) => {
          const done = await api.verifyPayment({
            orderId: resp.razorpay_order_id,
            paymentId: resp.razorpay_payment_id,
            signature: resp.razorpay_signature,
          });
          setBusy(false);
          if (done.success) {
            onUserUpdate && onUserUpdate(done.data);
            setSuccess(`You’re on Pro until ${longDate(done.data.proUntil)}`);
          } else {
            setError(done.error);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on('payment.failed', (r) => {
        setBusy(false);
        setError(r?.error?.description || 'The payment did not go through. No money was taken');
      });
      rzp.open();
    } catch (e) {
      setBusy(false);
      setError(e.message || 'Could not start the payment');
    }
  };

  let cta = `Upgrade for ${chosen ? inr(chosen.amount) : ''}`;
  if (!signedIn) cta = 'Sign in to upgrade';
  else if (isPro) cta = `Add ${cycle === 'yearly' ? 'a year' : 'a month'} for ${inr(chosen.amount)}`;
  if (busy) cta = 'Opening checkout';

  return (
    <div className="pt-8 sm:pt-16 pb-24 text-slate-900 dark:text-white animate-fadeIn">
      <div className="max-w-2xl">
        <h1 className="text-[36px] sm:text-[48px] leading-[1.08] font-medium tracking-[-0.02em]">
          Free for the daily habit. Pro for interview season
        </h1>
        <p className="mt-4 text-base sm:text-lg leading-[1.6] text-slate-600 dark:text-slate-400">
          Logging, streaks and revision stay free. Pro adds the sheets and tools for the weeks before your interviews.
        </p>
      </div>

      {/* Billing cycle */}
      <div className="mt-10 inline-grid grid-cols-2 p-1 h-10 rounded-[10px] bg-white dark:bg-ink-850 border border-slate-200 dark:border-white/[0.08]" role="group" aria-label="Billing cycle">
        {[
          ['monthly', 'Monthly'],
          ['yearly', savePct > 0 ? `Yearly · save ${savePct}%` : 'Yearly'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={cycle === value}
            onClick={() => setCycle(value)}
            className={`px-4 rounded-md text-[13px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${
              cycle === value
                ? 'bg-slate-100 dark:bg-ink-800 text-slate-900 dark:text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Free */}
        <section className="rounded-2xl bg-white dark:bg-ink-850 border border-slate-200 dark:border-white/[0.08] p-6 sm:p-8 flex flex-col">
          <h2 className="text-[15px] font-medium">Free</h2>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-[40px] leading-none font-medium tracking-[-0.02em] tabular-nums">₹0</span>
            <span className="text-sm text-slate-500">forever</span>
          </div>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Everything you need to practice every day</p>
          <ul className="mt-6 space-y-3">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" strokeWidth={1.5} />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-8">
            <div className="h-10 grid place-items-center rounded-[10px] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-500">
              {signedIn ? (isPro ? 'Included in Pro' : 'Your current plan') : 'No card needed'}
            </div>
          </div>
        </section>

        {/* Pro */}
        <section className="rounded-2xl bg-white dark:bg-ink-850 border border-brand-500/40 p-6 sm:p-8 flex flex-col shadow-[0_16px_40px_-24px_rgba(0,102,255,0.35)] dark:shadow-none">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-[15px] font-medium">Pro</h2>
            {isPro && currentUser?.proUntil && (
              <span className="text-xs text-slate-500">Active until {longDate(currentUser.proUntil)}</span>
            )}
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-[40px] leading-none font-medium tracking-[-0.02em] tabular-nums">{chosen ? inr(chosen.amount) : ''}</span>
            <span className="text-sm text-slate-500">{cycle === 'yearly' ? 'per year' : 'per month'}</span>
          </div>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 tabular-nums">
            {cycle === 'yearly' ? `About ${inr(perMonth)} a month, paid once for 365 days` : 'Paid once for 30 days, no auto-renewal'}
          </p>

          <ul className="mt-6 space-y-3">
            {PRO_FEATURES.map((f) => (
              <li key={f.text} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-brand-600 dark:text-brand-400" strokeWidth={1.5} />
                <span className="flex-1">
                  {f.text}
                  {f.soon && <span className="ml-2 font-mono text-[11px] text-slate-500">Soon</span>}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-8">
            <button
              type="button"
              onClick={upgrade}
              disabled={busy || (signedIn && !enabled)}
              className="btn-primary-glow w-full h-10 rounded-[10px] text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60 active:scale-[0.98]"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />}
              {cta}
            </button>

            <div className="mt-3 min-h-[20px] text-[13px]" aria-live="polite">
              {error && <p role="alert" className="text-rose-600 dark:text-rose-400">{error}</p>}
              {!error && success && <p className="text-emerald-600 dark:text-emerald-400">{success}</p>}
              {!error && !success && signedIn && billing && !enabled && (
                <p className="text-slate-500">
                  {billing.offline ? 'Can’t reach the server right now' : 'Payments are not set up on the server yet'}
                </p>
              )}
              {!error && !success && enabled && billing?.testMode && (
                <p className="text-slate-500">
                  Test mode: no real money is taken. Use card <span className="font-mono">4111 1111 1111 1111</span>, any future date and any CVV
                </p>
              )}
              {!error && !success && enabled && !billing?.testMode && (
                <p className="text-slate-500">Secure payment by Razorpay · UPI, cards and net banking</p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Questions */}
      <div className="mt-16 sm:mt-24 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <h2 className="text-[22px] font-medium">Questions</h2>
        <dl className="divide-y divide-slate-200 dark:divide-white/[0.08] border-y border-slate-200 dark:border-white/[0.08]">
          {FAQ.map(([q, a]) => (
            <div key={q} className="py-5">
              <dt className="text-[15px] text-slate-900 dark:text-white">{q}</dt>
              <dd className="mt-2 text-sm leading-[1.6] text-slate-600 dark:text-slate-400">{a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
