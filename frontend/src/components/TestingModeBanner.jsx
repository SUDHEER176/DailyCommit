import React, { useState } from 'react';
import { api } from '../services/api';

/**
 * A thin strip across the top in testing mode, so nobody mistakes it for the live app: no
 * sign-in, every Pro feature free, payments off. Two helpers for trying things out: load sample
 * practice history (so Revision and Progress have something to show), or wipe it and start fresh.
 */
export default function TestingModeBanner({ mode }) {
  const [busy, setBusy] = useState(false);
  if (mode !== 'testing') return null;

  const run = (action, confirmText) => async () => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    const ok = await action();
    setBusy(false);
    if (ok) window.location.reload();
    else window.alert('That didn’t work. Is the backend running in testing mode?');
  };

  const button = 'h-6 px-2 rounded text-[12px] border border-amber-500/40 hover:bg-amber-500/20 transition-colors disabled:opacity-50';

  return (
    <div role="status" className="w-full bg-amber-500/10 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 text-[13px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-mono text-[11px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-500/20">Testing</span>
        <span className="flex-1 min-w-[16rem]">No sign-in needed. Every Pro feature is free and payments are off. Data stays on this machine.</span>
        <button type="button" disabled={busy} onClick={run(api.loadSampleData)} className={button}>Load sample data</button>
        <button
          type="button"
          disabled={busy}
          onClick={run(api.resetTestingData, 'Wipe all testing data (plan, attempts, reviews) and start fresh?')}
          className={button}
        >
          Start fresh
        </button>
      </div>
    </div>
  );
}
