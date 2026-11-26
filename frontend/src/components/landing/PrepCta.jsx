import React from 'react';
import { Ink, useInkSheet } from './ink';

/** Closing panel: one line, the practice hub and Pro */
export default function PrepCta({ onNavigate }) {
  const go = (p) => onNavigate && onNavigate(p);
  const ink = useInkSheet();
  return (
    <section {...ink} className="ink-sheet rounded-[24px] border border-slate-200 dark:border-white/[0.06] bg-slate-100/70 dark:bg-ink-850 px-4 py-16 sm:px-6 sm:py-20 text-center">
      <h2 className="text-[32px] sm:text-[44px] leading-[1.1] font-medium tracking-[-0.025em] text-slate-900 dark:text-white">
        Head over to the practice hub
      </h2>
      <p className="mt-4 mx-auto max-w-md text-base sm:text-lg leading-[1.6] text-slate-500 dark:text-slate-400">
        DailyCode 150 and the editor are waiting. Free to start, Pro when you want feedback on every solve.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => go('/practice/dsa')} className="btn-primary-glow h-10 px-5 rounded-lg text-[15px] font-medium transition-[background-color,transform] active:scale-[0.98]">
          Open the practice hub
        </button>
        <button type="button" onClick={() => go('/pricing')} className="h-10 px-5 rounded-lg text-[15px] text-slate-900 dark:text-white border border-slate-300 dark:border-white/[0.14] hover:bg-white dark:hover:bg-white/[0.04] transition-colors">
          See Pro
        </button>
      </div>
      <p className="mt-6 font-hand text-[20px] text-slate-500"><Ink at={0.4}>today’s square is still empty</Ink></p>
    </section>
  );
}
