import React from 'react';
import { ArrowRight, Check, ExternalLink } from 'lucide-react';

const DIFF_TEXT = { Easy: 'text-emerald-400', Medium: 'text-amber-400', Hard: 'text-rose-400' };

/**
 * Today's problem: one problem a day for everyone, cycling through the DailyCode 150.
 * Solving it with Submit marks the day done and counts toward the streak.
 */
export default function DailyProblemCard({ problem, solvedToday, streak, onSolve }) {
  if (!problem) return null;
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-ink-850 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6" aria-labelledby="daily-problem-title">
      <div className="min-w-0 space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="cell" data-level={solvedToday ? 4 : 0} aria-hidden />
          <span>Today’s problem · {dateLabel}</span>
        </div>
        <h2 id="daily-problem-title" className="text-[17px] font-medium text-white flex items-baseline gap-3 flex-wrap">
          <span>{problem.number}. {problem.title}</span>
          <span className={`text-[13px] font-normal ${DIFF_TEXT[problem.difficulty] || 'text-slate-400'}`}>{problem.difficulty}</span>
          <span className="text-[13px] font-normal text-slate-500">{problem.topic}</span>
        </h2>
        <p className="text-[13px] text-slate-400">
          {solvedToday
            ? `Solved. Your streak is ${streak} ${streak === 1 ? 'day' : 'days'}, come back tomorrow for the next one`
            : 'One problem a day, the same for everyone. Submit an accepted solution to count it toward your streak'}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {problem.url && (
          <a
            href={problem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 grid place-items-center rounded-[10px] text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Open on LeetCode"
            aria-label={`Open ${problem.title} on LeetCode`}
          >
            <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
          </a>
        )}
        {solvedToday ? (
          <button
            onClick={onSolve}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-[10px] text-sm bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-white transition-colors active:scale-[0.98]"
          >
            <Check className="w-4 h-4 text-brand-400" strokeWidth={1.5} />
            Solve again
          </button>
        ) : (
          <button
            onClick={onSolve}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-[10px] btn-primary-glow text-sm font-medium active:scale-[0.98]"
          >
            Solve in editor
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </button>
        )}
      </div>
    </section>
  );
}
