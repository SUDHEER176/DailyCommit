import React from 'react';
import { ArrowRight, Plus } from 'lucide-react';

export default function FinalCTA({ onOpenProblemModal, onNavigate }) {
  // A short run of filled cells, the streak this section asks you to start
  const run = [0, 1, 2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-ink-850 px-6 py-16 sm:px-16 sm:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
        <div className="lg:col-span-8">
          <span className="eyebrow">Free to start</span>
          <h2 className="mt-3 text-[32px] sm:text-[48px] leading-[1.08] font-medium tracking-[-0.025em] text-slate-900 dark:text-white">
            Your next offer starts with today’s streak
          </h2>
          <p className="mt-4 max-w-xl text-base sm:text-lg leading-[1.6] text-slate-600 dark:text-slate-400">
            One problem a day, revision that comes back on time, and a roadmap that keeps you honest.
            Show up for 30 days and look at the heatmap.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenProblemModal}
              className="btn-primary-glow inline-flex items-center gap-2 h-12 px-5 rounded-[10px] text-[15px] font-medium active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" strokeWidth={1.5} />
              Log today’s problem
            </button>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('/practice/dsa')}
              className="inline-flex items-center gap-2 h-12 px-5 rounded-[10px] text-[15px] text-slate-900 dark:text-white bg-white dark:bg-ink-800 border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] transition-colors active:scale-[0.98]"
            >
              Open practice hub
              <ArrowRight className="w-4 h-4 text-slate-500 dark:text-slate-400" strokeWidth={1.5} />
            </button>
          </div>
          <p className="mt-6 font-mono text-xs text-slate-500">Works alongside LeetCode · Every problem tracked</p>
        </div>

        <div className="lg:col-span-4 hidden lg:flex justify-end" aria-hidden>
          <div className="grid grid-cols-7 gap-1.5">
            {run.map((l, i) => (
              <span key={i} className="cell !w-6 !h-6 !rounded-[5px]" data-level={l} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
