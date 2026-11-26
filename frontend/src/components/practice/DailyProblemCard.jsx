import React, { useMemo } from 'react';
import { ArrowRight, Check, ExternalLink } from 'lucide-react';
import { localDay } from '@/lib/practice';

const DIFF_TEXT = { Easy: 'text-emerald-400', Medium: 'text-amber-400', Hard: 'text-rose-400' };
const WEEKS = 16;

/** The last WEEKS weeks as columns of 7 days (Sunday first), ending with the current week */
function useActivityGrid(days) {
  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - today.getDay() - (WEEKS - 1) * 7);
    const columns = [];
    let active = 0;
    for (let w = 0; w < WEEKS; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(start.getDate() + w * 7 + d);
        const key = localDay(date);
        const future = date > today;
        const on = !future && days.has(key);
        if (on) active++;
        col.push({ key, future, on, isToday: date.getTime() === today.getTime() });
      }
      columns.push(col);
    }
    return { columns, active };
  }, [days]);
}

/**
 * The hub's opening card: today's problem on the left, the streak and the last 16 weeks of
 * activity on the right. Solving the daily problem with Submit marks the day done.
 */
export default function DailyProblemCard({ problem, solvedToday, streak, days = new Set(), onSolve }) {
  const { columns, active } = useActivityGrid(days);
  if (!problem) return null;
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <section
      className="rounded-[20px] border border-white/[0.08] bg-ink-850 overflow-hidden grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px]"
      aria-labelledby="daily-problem-title"
    >
      {/* Today's problem */}
      <div className="p-6 sm:p-8 flex flex-col justify-between gap-8 min-w-0">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[13px] text-slate-500">
            <span className="cell" data-level={solvedToday ? 4 : 0} aria-hidden />
            <span>Today’s problem</span>
            <span aria-hidden>·</span>
            <span>{dateLabel}</span>
          </div>
          <div className="space-y-2">
            <h2 id="daily-problem-title" className="text-[28px] leading-[1.2] font-medium text-white">
              <span className="text-slate-500 tabular-nums">{problem.number}.</span> {problem.title}
            </h2>
            <div className="flex items-center gap-3 text-[13px]">
              <span className={DIFF_TEXT[problem.difficulty] || 'text-slate-400'}>{problem.difficulty}</span>
              <span className="w-1 h-1 rounded-full bg-slate-600" aria-hidden />
              <span className="text-slate-400">{problem.topic}</span>
            </div>
          </div>
          <p className="text-sm text-slate-400 max-w-md leading-[1.6]">
            {solvedToday
              ? `Solved. Your streak is ${streak} ${streak === 1 ? 'day' : 'days'}, the next problem opens tomorrow`
              : 'One problem a day, the same for everyone. An accepted submit counts toward your streak'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {solvedToday ? (
            <button
              onClick={onSolve}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-white transition-colors active:scale-[0.98]"
            >
              <Check className="w-4 h-4 text-brand-400" strokeWidth={1.5} />
              Solve again
            </button>
          ) : (
            <button
              onClick={onSolve}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl btn-primary-glow text-sm font-medium active:scale-[0.98]"
            >
              Solve in editor
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          )}
          {problem.url && (
            <a
              href={problem.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label={`Open ${problem.title} on LeetCode`}
            >
              LeetCode
              <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
            </a>
          )}
        </div>
      </div>

      {/* Streak and activity */}
      <div className="p-6 sm:p-8 bg-white/[0.02] border-t lg:border-t-0 lg:border-l border-white/[0.06] flex flex-col justify-between gap-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[56px] leading-none tabular-nums text-white">{streak}</div>
            <div className="mt-2 text-[13px] text-slate-400">Day streak</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[15px] tabular-nums text-white">{active}</div>
            <div className="mt-1 text-xs text-slate-500">active days, {WEEKS} weeks</div>
          </div>
        </div>

        <div className="flex gap-[4px]" role="img" aria-label={`${active} active days in the last ${WEEKS} weeks`}>
          {columns.map((col, i) => (
            <div key={i} className="flex flex-col gap-[4px] flex-1">
              {col.map((day) => (
                <span
                  key={day.key}
                  className={`block aspect-square w-full rounded-[3px] ${
                    day.future ? 'bg-transparent' : day.on ? 'bg-brand-500' : 'bg-[var(--raised)]'
                  } ${day.isToday ? 'ring-1 ring-slate-500' : ''}`}
                  title={day.future ? undefined : day.key}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
