import React, { useState } from 'react';
import { X } from 'lucide-react';
import { proNotice } from '@/lib/pro';

const longDate = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// Dismissing hides the notice for the rest of the day; it comes back tomorrow while it still applies
const dismissKey = (notice) => `codestreak_pro_notice_${notice.kind}_${new Date().toISOString().slice(0, 10)}`;
const wasDismissed = (notice) => {
  try { return localStorage.getItem(dismissKey(notice)) === '1'; } catch { return false; }
};

/**
 * A one-line notice when Pro is about to end (last 7 days) or has just ended (last 14 days).
 * Pro doesn't renew by itself, so this is the only reminder people get.
 */
export default function ProNotice({ currentUser, onNavigate }) {
  const notice = proNotice(currentUser);
  const [hidden, setHidden] = useState(() => (notice ? wasDismissed(notice) : true));

  if (!notice || hidden) return null;

  const dismiss = () => {
    try { localStorage.setItem(dismissKey(notice), '1'); } catch { /* storage unavailable */ }
    setHidden(true);
  };

  const text = notice.kind === 'expiring'
    ? `Your Pro ends ${notice.days === 1 ? 'today' : `in ${notice.days} days`}, on ${longDate(notice.until)}. Pro doesn’t renew by itself.`
    : `Your Pro ended on ${longDate(notice.until)}. Your data and streak are safe on Free.`;

  return (
    <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4" role="status">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-ink-850 px-4 py-3 text-[13px]">
        <p className="flex-1 min-w-0 text-slate-700 dark:text-slate-300">{text}</p>
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('/pricing')}
          className="flex-shrink-0 text-brand-600 dark:text-brand-400 hover:underline underline-offset-2"
        >
          {notice.kind === 'expiring' ? 'Extend Pro' : 'Renew Pro'}
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex-shrink-0 w-7 h-7 grid place-items-center rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
