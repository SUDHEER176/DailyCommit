import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { daysUntil, parseDay, shortDate, addDays } from '@/lib/userData';

// ── Progress rings: one ring per difficulty, each filled to its share of the plan ──
const STYLE = {
  Easy: { key: 'easy', ink: 'text-emerald-500', track: 'stroke-emerald-500/15', dot: 'bg-emerald-500' },
  Medium: { key: 'medium', ink: 'text-amber-500', track: 'stroke-amber-500/15', dot: 'bg-amber-500' },
  Hard: { key: 'hard', ink: 'text-rose-500', track: 'stroke-rose-500/15', dot: 'bg-rose-500' },
};
const withStyle = (label, solved, total) => ({ ...STYLE[label], label, solved, total });

// Shown to visitors who are not signed in, tagged "Example"
const EXAMPLE = {
  example: true,
  levels: [withStyle('Easy', 68, 100), withStyle('Medium', 58, 150), withStyle('Hard', 16, 50)],
  solved: 142,
  planTotal: 300,
  targetDate: shortDate(addDays(new Date(), 47)),
  daysLeft: 47,
  streak: 21,
};

/** The signed-in person's numbers: plan progress when there is a plan, logged solves otherwise */
export function buildProgress(stats, signedIn) {
  if (!signedIn) return EXAMPLE;
  const plan = stats?.plan;
  const streak = stats?.user?.streak ?? 0;
  if (plan?.total) {
    const by = plan.byDifficulty || {};
    return {
      example: false,
      levels: ['Easy', 'Medium', 'Hard'].map((l) => withStyle(l, by[l]?.done || 0, by[l]?.total || 0)),
      solved: plan.completed || 0,
      planTotal: plan.total,
      targetDate: plan.targetDate ? shortDate(parseDay(plan.targetDate)) : null,
      daysLeft: daysUntil(plan.targetDate),
      streak,
    };
  }
  const counts = stats?.difficultyCounts || {};
  return {
    example: false,
    noPlan: true,
    levels: ['Easy', 'Medium', 'Hard'].map((l) => withStyle(l, counts[l] || 0, null)),
    solved: stats?.totalProblemsSolved || 0,
    planTotal: null,
    targetDate: null,
    daysLeft: null,
    streak,
  };
}

const SIZE = 200;
const STROKE = 12;
const RING_GAP = 4;
const radius = (i) => SIZE / 2 - STROKE / 2 - i * (STROKE + RING_GAP); // outer ring first

function ProgressCard({ data, onPlan }) {
  const LEVELS = data.levels;
  const [drawn, setDrawn] = useState(false);
  const [focus, setFocus] = useState(null);
  useEffect(() => {
    const t = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const target = data.targetDate;
  const focused = LEVELS.find((l) => l.key === focus);
  const share = (l) => (l.total ? Math.min(1, l.solved / l.total) : 0);
  const pct = (l) => Math.round(share(l) * 100);

  return (
    <div className="rounded-2xl bg-white dark:bg-ink-850 border border-slate-200 dark:border-white/[0.08] shadow-[0_12px_32px_-16px_rgba(15,23,42,0.18)] dark:shadow-none">
      <div className="flex items-baseline justify-between px-6 pt-6">
        <h2 className="flex items-baseline gap-2 text-[15px] font-medium text-slate-900 dark:text-white">
          Your progress
          {data.example && <span className="text-xs font-normal text-slate-500">Example</span>}
        </h2>
        {target && <span className="font-mono text-xs text-slate-500 tabular-nums">Target {target}</span>}
      </div>

      <div className="flex items-center gap-8 p-6">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }} onMouseLeave={() => setFocus(null)}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90" aria-hidden="true">
            {LEVELS.map((l, i) => {
              const r = radius(i);
              const c = 2 * Math.PI * r;
              const dim = focus && focus !== l.key;
              return (
                <g key={l.key} onMouseEnter={() => setFocus(l.key)} className={`transition-opacity duration-200 ${dim ? 'opacity-30' : ''}`}>
                  <circle cx={SIZE / 2} cy={SIZE / 2} r={r} fill="none" strokeWidth={STROKE} className={l.track} />
                  <circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={r}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={`${drawn ? share(l) * c : 0} ${c}`}
                    className={`${l.ink} transition-[stroke-dasharray] duration-700 ease-out`}
                    style={{ transitionDelay: `${i * 90}ms` }}
                  />
                </g>
              );
            })}
          </svg>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="font-mono text-[32px] leading-none font-medium tabular-nums text-slate-900 dark:text-white">
                {focused ? focused.solved : data.solved}
              </div>
              <div className="mt-2 text-xs text-slate-500 tabular-nums">
                {focused
                  ? (focused.total ? `of ${focused.total} ${focused.label.toLowerCase()}` : `${focused.label.toLowerCase()} solved`)
                  : (data.planTotal ? `of ${data.planTotal} solved` : 'solved')}
              </div>
            </div>
          </div>
        </div>

        <ul className="flex-1 min-w-0 space-y-1" aria-label="Solved by difficulty">
          {LEVELS.map((l) => (
            <li key={l.key}>
              <button
                type="button"
                onMouseEnter={() => setFocus(l.key)}
                onMouseLeave={() => setFocus(null)}
                onFocus={() => setFocus(l.key)}
                onBlur={() => setFocus(null)}
                className={`w-full px-2 py-2 rounded-lg text-left transition-[opacity,background-color] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${
                  focus === l.key ? 'bg-slate-100 dark:bg-white/[0.04]' : ''
                } ${focus && focus !== l.key ? 'opacity-50' : ''}`}
              >
                <span className="flex items-center gap-2 text-[13px] text-slate-700 dark:text-slate-300">
                  <span className={`w-2 h-2 rounded-full ${l.dot}`} />
                  {l.label}
                  {l.total != null && <span className="ml-auto font-mono text-xs text-slate-500 tabular-nums">{pct(l)}%</span>}
                </span>
                <span className="mt-1 block pl-4 font-mono text-[15px] tabular-nums text-slate-900 dark:text-white">
                  {l.solved}{l.total != null && <span className="text-slate-500">/{l.total}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 border-t border-slate-200 dark:border-white/[0.06]">
        <div className="px-6 py-4">
          {data.daysLeft != null ? (
            <>
              <div className="font-mono text-xl font-medium tabular-nums text-slate-900 dark:text-white">{data.daysLeft}</div>
              <div className="mt-1 text-xs text-slate-500">{data.daysLeft === 1 ? 'day' : 'days'} until {target}</div>
            </>
          ) : (
            <>
              <button type="button" onClick={onPlan}
                className="text-[15px] text-slate-900 dark:text-white underline underline-offset-4 decoration-slate-300 dark:decoration-white/30 hover:decoration-current rounded-sm">
                Set a target date
              </button>
              <div className="mt-1 text-xs text-slate-500">Build a plan to see your rings fill</div>
            </>
          )}
        </div>
        <div className="px-6 py-4 border-l border-slate-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="cell" data-level="4" aria-hidden="true" />
            <span className="font-mono text-xl font-medium tabular-nums text-slate-900 dark:text-white">{data.streak}</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">day streak</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Landing hero: headline and actions on the left, the progress ring on the right,
 * with the product preview following below.
 */
export default function HeroSection({
  title = "A daily DSA plan that remembers what you'll forget",
  subtitle = 'Plan the day’s problems, log every solve, and get the tricky ones back at 3, 7 and 21 days. Built for engineers preparing for coding interviews.',
  onOpenProblemModal,
  onNavigate,
  stats,
  signedIn = false,
}) {
  const progress = useMemo(() => buildProgress(stats, signedIn), [stats, signedIn]);
  const openPractice = () => {
    if (onNavigate) {
      onNavigate('/practice/dsa');
    } else {
      window.history.pushState({}, '', '/practice/dsa');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <section className="relative w-full pt-16 sm:pt-24 text-slate-900 dark:text-white xl:grid xl:grid-cols-[minmax(0,1fr)_440px] xl:gap-16 xl:items-center">
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

      {/* Desktop only: on phones the product preview right below already carries the visual */}
      <div className="hidden xl:block animate-fadeIn [animation-delay:120ms]">
        <ProgressCard data={progress} onPlan={openPractice} />
      </div>
    </section>
  );
}
