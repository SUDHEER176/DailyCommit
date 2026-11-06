import React from 'react';
import { CheckCircle2, ArrowUpRight } from 'lucide-react';

/**
 * How it works: four steps around the day's sprint card.
 */
export default function HowItWorks7({
  title = 'How a week of prep runs',
  subtitle = 'Pick a track, solve the day’s problems, revise what slipped and keep the streak going.',
  setActiveTab,
  onOpenProblemModal,
  className = '',
}) {
  const steps = [
    {
      number: '01',
      title: 'Pick a track',
      description: 'Choose the 4 week fast track or the 6 week roadmap, covering 16 core patterns from two pointers to dynamic programming.',
      action: () => setActiveTab && setActiveTab('roadmap'),
    },
    {
      number: '02',
      title: 'Solve the day’s problems',
      description: 'Two or three hand-picked problems a day, with a time limit, complexity notes and test cases.',
      action: onOpenProblemModal,
    },
    {
      number: '03',
      title: 'Revise what slipped',
      description: 'Problems you needed a hint for come back on their own at 3, 7 and 21 days.',
      action: () => setActiveTab && setActiveTab('revision'),
    },
    {
      number: '04',
      title: 'Keep the streak',
      description: 'The heatmap marks every day you showed up, next to your weekly pace and topic readiness.',
      action: () => setActiveTab && setActiveTab('analytics'),
    },
  ];

  const Step = ({ step }) => (
    <button
      type="button"
      onClick={step.action}
      className="group w-full text-left rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-ink-850 p-6 hover:border-slate-300 dark:hover:border-white/[0.14] transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-slate-500">{step.number}</span>
        <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} aria-hidden />
      </div>
      <h3 className="mt-4 text-[15px] font-medium text-slate-900 dark:text-white">{step.title}</h3>
      <p className="mt-2 text-sm leading-[1.55] text-slate-500 dark:text-slate-400">{step.description}</p>
    </button>
  );

  return (
    <section className={`w-full ${className}`}>
      <div className="max-w-2xl">
        <span className="eyebrow">How it works</span>
        <h2 className="mt-3 text-[32px] sm:text-[40px] leading-[1.1] font-medium tracking-[-0.02em] text-slate-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-4 text-base leading-[1.6] text-slate-600 dark:text-slate-400">{subtitle}</p>
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <div className="grid gap-4 content-start order-2 lg:order-1">
          {steps.slice(0, 2).map((s) => <Step key={s.number} step={s} />)}
        </div>

        {/* The day's sprint, as it appears in the app */}
        <div className="order-1 lg:order-2 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-ink-950 p-4 flex flex-col">
          <div className="flex items-center justify-between px-2 h-8">
            <span className="text-[13px] text-slate-900 dark:text-white">Today’s sprint</span>
            <span className="font-mono text-xs text-slate-500">2 of 3</span>
          </div>

          <div className="mt-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-ink-850 p-4 flex-1">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-slate-900 dark:text-white">167. Two Sum II</span>
              <span className="text-xs text-amber-600 dark:text-amber-400">Medium</span>
            </div>

            <pre className="mt-4 rounded-lg bg-slate-50 dark:bg-ink-900 border border-slate-200 dark:border-white/[0.06] p-3 font-mono text-xs leading-[1.7] text-slate-800 dark:text-slate-200 overflow-hidden">
<span className="text-slate-500">{'// two pointers, O(n)'}</span>{'\n'}
<span className="text-brand-600 dark:text-brand-400">while</span> (l {'<'} r) {'{'}{'\n'}
{'  '}<span className="text-brand-600 dark:text-brand-400">const</span> sum = nums[l] + nums[r];{'\n'}
{'  '}<span className="text-brand-600 dark:text-brand-400">if</span> (sum === target) <span className="text-brand-600 dark:text-brand-400">return</span> [l + <span className="text-amber-600 dark:text-amber-300">1</span>, r + <span className="text-amber-600 dark:text-amber-300">1</span>];{'\n'}
{'  '}sum {'<'} target ? l++ : r--;{'\n'}
{'}'}
            </pre>

            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                Accepted
              </span>
              <span className="font-mono tabular-nums text-slate-500">21 / 21 tests · 4 ms</span>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between px-2 h-10">
            <span className="flex items-center gap-2 text-[13px] text-slate-600 dark:text-slate-300">
              <span className="cell" data-level="4" aria-hidden />
              Streak
            </span>
            <span className="font-mono text-[13px] tabular-nums text-slate-900 dark:text-white">7 days</span>
          </div>
        </div>

        <div className="grid gap-4 content-start order-3">
          {steps.slice(2, 4).map((s) => <Step key={s.number} step={s} />)}
        </div>
      </div>
    </section>
  );
}
