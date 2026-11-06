import React from 'react';
import { motion } from 'framer-motion';
import { BRAND } from '@/lib/brand';

const EASE = [0.22, 1, 0.36, 1];

/**
 * Readiness dial: the outer ring is the current sprint, the inner ring the baseline it is compared with.
 */
const CoverageDial = ({ percentage = 82, baseline = 54 }) => {
  const size = 280;
  const outer = { r: 120, w: 10 };
  const inner = { r: 100, w: 4 };
  const circ = (r) => 2 * Math.PI * r;

  return (
    <figure className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 280 280" className="-rotate-90" aria-hidden>
          <circle cx="140" cy="140" r={inner.r} fill="none" strokeWidth={inner.w} className="stroke-slate-200 dark:stroke-white/[0.06]" />
          <motion.circle
            cx="140" cy="140" r={inner.r} fill="none" strokeWidth={inner.w} strokeLinecap="round"
            className="stroke-slate-400 dark:stroke-slate-500"
            strokeDasharray={circ(inner.r)}
            initial={{ strokeDashoffset: circ(inner.r) }}
            whileInView={{ strokeDashoffset: circ(inner.r) * (1 - baseline / 100) }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: EASE }}
          />
          <circle cx="140" cy="140" r={outer.r} fill="none" strokeWidth={outer.w} className="stroke-slate-200 dark:stroke-white/[0.06]" />
          <motion.circle
            cx="140" cy="140" r={outer.r} fill="none" strokeWidth={outer.w} strokeLinecap="round"
            stroke="#0066FF"
            strokeDasharray={circ(outer.r)}
            initial={{ strokeDashoffset: circ(outer.r) }}
            whileInView={{ strokeDashoffset: circ(outer.r) * (1 - percentage / 100) }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: EASE }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="font-mono tabular-nums text-slate-900 dark:text-white">
            <span className="text-[56px] leading-none font-medium">{percentage}</span>
            <span className="text-2xl text-slate-500">%</span>
          </div>
          <p className="mt-2 max-w-[160px] text-[13px] leading-5 text-slate-500 dark:text-slate-400">
            of core interview patterns mastered
          </p>
        </div>
      </div>

      <figcaption className="mt-6 flex flex-col items-center gap-2">
        <div className="flex items-center gap-6 text-[13px] text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-sm bg-brand-500" aria-hidden />
            This sprint <span className="font-mono tabular-nums">{percentage}%</span>
          </span>
          <span className="flex items-center gap-2 text-slate-500">
            <span className="w-2 h-2 rounded-sm bg-slate-400 dark:bg-slate-500" aria-hidden />
            Baseline <span className="font-mono tabular-nums">{baseline}%</span>
          </span>
        </div>
        <p className="text-xs text-slate-500">Measured across 84 interview problems</p>
      </figcaption>
    </figure>
  );
};

export default function Stats15({ stats = {}, setActiveTab = () => {} }) {
  const readinessScore = stats.readinessScore || 82;

  const ledgerItems = [
    {
      title: 'Pattern drills',
      subtitle: 'Medium and hard problems rotated into each day',
      percentage: stats.difficultyCounts
        ? Math.min(100, Math.round(((stats.difficultyCounts.Medium + stats.difficultyCounts.Hard) / 25) * 100))
        : 94,
      targetTab: 'problems',
    },
    {
      title: 'Spaced revision',
      subtitle: 'Problems you needed a hint for, reviewed on schedule',
      percentage: 78,
      targetTab: 'revision',
    },
    {
      title: 'Roadmap milestones',
      subtitle: 'Six weekly checkpoints, checked as you finish topics',
      percentage: stats.roadmapProgress || 86,
      targetTab: 'roadmap',
    },
  ];

  return (
    <section className="relative w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <div className="lg:col-span-7">
          <span className="eyebrow">Scheduling</span>
          <h2 className="mt-3 text-[32px] sm:text-[40px] leading-[1.1] font-medium tracking-[-0.02em] text-slate-900 dark:text-white max-w-xl">
            Every session starts with a list, not a decision
          </h2>
          <p className="mt-4 max-w-xl text-base leading-[1.6] text-slate-600 dark:text-slate-400">
            {BRAND.name} rotates the day’s problems, schedules revisions and checks roadmap milestones,
            so you spend the hour solving instead of choosing what to solve.
          </p>

          <ul className="mt-10 border-t border-slate-200 dark:border-white/[0.08]">
            {ledgerItems.map((item) => (
              <li key={item.title} className="border-b border-slate-200 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setActiveTab(item.targetTab)}
                  className="group w-full grid grid-cols-[minmax(0,1fr)_120px_48px] items-center gap-6 py-4 text-left rounded-lg"
                >
                  <span className="min-w-0">
                    <span className="block text-[15px] text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {item.title}
                    </span>
                    <span className="block mt-1 text-[13px] text-slate-500 dark:text-slate-400 truncate">
                      {item.subtitle}
                    </span>
                  </span>
                  <span className="h-1 rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden" aria-hidden>
                    <span className="block h-full rounded-full bg-slate-400 dark:bg-slate-500" style={{ width: `${item.percentage}%` }} />
                  </span>
                  <span className="font-mono text-[15px] tabular-nums text-right text-slate-900 dark:text-white">
                    {item.percentage}%
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-5 flex justify-center">
          <CoverageDial percentage={readinessScore} baseline={54} />
        </div>
      </div>
    </section>
  );
}
