import React, { useState } from 'react';
import { ArrowRight, Check, RotateCcw } from 'lucide-react';
import Spinner from '../ui/Spinner';
import { REVIEW_DAYS } from '@/lib/practice';

const DIFF_DOT = { Easy: 'bg-emerald-500', Medium: 'bg-amber-500', Hard: 'bg-rose-500' };

const whenLabel = (item) => {
  if (item.daysUntil === 0) return 'Due today';
  if (item.daysUntil < 0) return `${-item.daysUntil} ${item.daysUntil === -1 ? 'day' : 'days'} overdue`;
  if (item.daysUntil === 1) return 'Tomorrow';
  return item.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/** Three cells for the 3, 7 and 21 day reviews: done ones filled, the current one ringed */
function Stages({ stage }) {
  return (
    <span className="flex items-center gap-1" aria-label={`Review ${stage + 1} of ${REVIEW_DAYS.length}`}>
      {REVIEW_DAYS.map((d, i) => (
        <span
          key={d}
          title={`Day ${d} review`}
          data-level={i < stage ? 4 : 0}
          className={`cell !w-2.5 !h-2.5 !rounded-[3px] ${i === stage ? 'ring-1 ring-white/50' : ''}`}
        />
      ))}
    </span>
  );
}

/**
 * Problems coming back for review on days 3, 7 and 21. "Review" opens the editor and an accepted
 * submit records the review; "Mark reviewed" records it without solving here.
 */
export default function RevisionQueueCard({ schedule, hasPlan, onReview, onMarkReviewed, onOpenPlanner }) {
  const [marking, setMarking] = useState(null);
  const { due, upcoming, mastered } = schedule;

  const mark = async (item) => {
    setMarking(item.question.id);
    try { await onMarkReviewed(item); } finally { setMarking(null); }
  };

  return (
    <section className="p-6 rounded-2xl bg-ink-850 border border-white/[0.08] space-y-4" aria-labelledby="revision-title">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="revision-title" className="text-[15px] font-medium text-white">Revision</h3>
        <span className="font-mono text-xs tabular-nums text-slate-500">
          {due.length} due{mastered > 0 ? ` · ${mastered} mastered` : ''}
        </span>
      </div>

      {!hasPlan ? (
        <div className="py-2 space-y-3">
          <p className="text-[13px] text-slate-400">
            Star a problem, or mark it solved with a hint, and it comes back here on days 3, 7 and 21.
          </p>
          <button
            onClick={onOpenPlanner}
            className="w-full h-9 rounded-lg text-[13px] bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-white transition-colors active:scale-[0.98]"
          >
            Build my plan
          </button>
        </div>
      ) : due.length === 0 && upcoming.length === 0 ? (
        <div className="py-2 text-center space-y-1">
          <RotateCcw className="w-5 h-5 mx-auto text-slate-500" strokeWidth={1.5} aria-hidden />
          <p className="text-[13px] text-white">Nothing to revise yet</p>
          <p className="text-xs text-slate-500">Star a tricky problem in your plan and it shows up here</p>
        </div>
      ) : (
        <>
          {due.length > 0 ? (
            <ul className="space-y-1">
              {due.slice(0, 5).map((item) => {
                const q = item.question;
                return (
                  <li key={q.id} className="px-2.5 py-2 rounded-lg hover:bg-white/[0.03]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DIFF_DOT[q.difficulty] || 'bg-slate-500'}`} aria-hidden />
                      <span className="flex-1 truncate text-[13px] text-slate-200">{q.title}</span>
                      <Stages stage={item.stage} />
                    </div>
                    <div className="mt-1.5 pl-3.5 flex items-center justify-between gap-2">
                      <span className={`text-xs ${item.daysUntil < 0 ? 'text-amber-300' : 'text-slate-500'}`}>
                        Day {item.reviewDay} review · {whenLabel(item)}
                      </span>
                      <span className="flex items-center gap-1">
                        <button
                          onClick={() => mark(item)}
                          disabled={marking === q.id}
                          className="h-7 px-2 rounded-md text-xs text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                          title="Record this review without solving here"
                        >
                          {marking === q.id ? <Spinner size={12} label="Saving" /> : <Check className="w-3.5 h-3.5" strokeWidth={1.5} />}
                          Done
                        </button>
                        <button
                          onClick={() => onReview(item)}
                          className="h-7 px-2 rounded-md text-xs text-white bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] transition-colors inline-flex items-center gap-1"
                        >
                          Review
                          <ArrowRight className="w-3 h-3 text-slate-400" strokeWidth={1.5} />
                        </button>
                      </span>
                    </div>
                  </li>
                );
              })}
              {due.length > 5 && <li className="px-2.5 text-xs text-slate-500">{due.length - 5} more due</li>}
            </ul>
          ) : (
            <p className="text-[13px] text-slate-400">All caught up for today</p>
          )}

          {upcoming.length > 0 && (
            <div className="pt-3 border-t border-white/[0.06]">
              <p className="text-xs text-slate-500">Coming up</p>
              <ul className="mt-2 space-y-1">
                {upcoming.slice(0, 3).map((item) => (
                  <li key={item.question.id} className="flex items-center justify-between gap-3 h-7 px-2.5 text-[13px]">
                    <span className="truncate text-slate-400">{item.question.title}</span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-slate-500">Day {item.reviewDay} · {whenLabel(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
