import React from 'react';
import { ArrowRight, Plus } from 'lucide-react';

/**
 * Landing hero: a left-aligned headline over the product preview that follows it.
 */
export default function HeroSection({
  title = "A daily DSA plan that remembers what you'll forget",
  subtitle = 'Plan the day’s problems, log every solve, and get the tricky ones back at 3, 7 and 21 days. Built for engineers preparing for coding interviews.',
  onOpenProblemModal,
  onNavigate,
}) {
  const openPractice = () => {
    if (onNavigate) {
      onNavigate('/practice/dsa');
    } else {
      window.history.pushState({}, '', '/practice/dsa');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <section className="relative w-full pt-16 sm:pt-24 text-slate-900 dark:text-white">
      <div className="max-w-3xl animate-fadeIn">
        <h1 className="text-[40px] leading-[1.06] sm:text-[56px] lg:text-[64px] lg:leading-[1.04] font-medium tracking-[-0.03em]">
          {title}
        </h1>

        <p className="mt-6 max-w-[36rem] text-lg sm:text-xl leading-[1.5] text-slate-600 dark:text-slate-400">
          {subtitle}
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
            onClick={openPractice}
            className="group inline-flex items-center gap-2 h-12 px-5 rounded-[10px] text-[15px] text-slate-900 dark:text-white bg-white dark:bg-ink-800 border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] transition-colors active:scale-[0.98]"
          >
            Open practice hub
            <ArrowRight className="w-4 h-4 text-slate-500 dark:text-slate-400" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </section>
  );
}
