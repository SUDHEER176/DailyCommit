import React, { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { addDays } from '@/lib/userData';

// The review schedule the product uses: a problem you needed help with comes back on these days
const INTERVALS = [3, 7, 21];
const GRID_DAYS = 28; // four weeks from the solve date

// Sample problems, each solved a different number of days ago so the schedule reads differently
const SAMPLES = [
  { id: 'merge', title: 'Merge Intervals', difficulty: 'Medium', solvedAgo: 0, note: 'Needed the sort-by-start hint' },
  { id: 'course', title: 'Course Schedule', difficulty: 'Medium', solvedAgo: 4, note: 'Missed the cycle check' },
  { id: 'lru', title: 'LRU Cache', difficulty: 'Medium', solvedAgo: 9, note: 'Forgot to move nodes on get' },
  { id: 'median', title: 'Find Median from Data Stream', difficulty: 'Hard', solvedAgo: 22, note: 'Two heaps, balanced by size' },
];

const DIFF_DOT = { Easy: 'bg-emerald-500', Medium: 'bg-amber-500', Hard: 'bg-rose-500' };
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const fmt = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function reviewStatus(offset, todayOffset) {
  if (offset < todayOffset) return 'done';
  if (offset === todayOffset) return 'today';
  return 'upcoming';
}

function statusText(status, offset, todayOffset) {
  if (status === 'done') return 'Reviewed';
  if (status === 'today') return 'Due today';
  const n = offset - todayOffset;
  return `In ${n} ${n === 1 ? 'day' : 'days'}`;
}

/**
 * "When it comes back": pick a solved problem and see the days it returns for review,
 * drawn on a four week grid of heatmap cells starting from the solve date.
 */
export default function RevisionTimeline() {
  const [selectedId, setSelectedId] = useState(SAMPLES[0].id);
  const selected = SAMPLES.find((p) => p.id === selectedId);

  const { solvedOn, todayOffset, leadBlanks, reviews } = useMemo(() => {
    const today = startOfDay(new Date());
    const solvedOn = addDays(today, -selected.solvedAgo);
    const todayOffset = selected.solvedAgo;
    // Monday-first grid: pad the first week so columns line up with weekdays
    const leadBlanks = (solvedOn.getDay() + 6) % 7;
    const reviews = INTERVALS.map((day) => {
      const status = reviewStatus(day, todayOffset);
      return { day, date: addDays(solvedOn, day), status, label: statusText(status, day, todayOffset) };
    });
    return { solvedOn, todayOffset, leadBlanks, reviews };
  }, [selected]);

  const reviewDays = new Set(INTERVALS);

  return (
    <section className="relative w-full" aria-labelledby="revision-timeline-title">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Copy and the problem picker */}
        <div className="lg:col-span-5">
          <span className="eyebrow">Spaced revision</span>
          <h2
            id="revision-timeline-title"
            className="mt-3 text-[32px] sm:text-[40px] leading-[1.1] font-medium tracking-[-0.02em] text-slate-900 dark:text-white"
          >
            Solve it once, see it again before you forget
          </h2>
          <p className="mt-4 text-base leading-[1.6] text-slate-600 dark:text-slate-400">
            Mark a problem as needing revision and it returns to your plan 3, 7 and 21 days later.
            Pick one to see when it comes back.
          </p>

          <ul className="mt-8 space-y-1" role="radiogroup" aria-label="Sample problems">
            {SAMPLES.map((p) => {
              const active = p.id === selectedId;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSelectedId(p.id)}
                    className={`w-full grid grid-cols-[8px_minmax(0,1fr)_auto] items-center gap-3 h-14 px-3 rounded-[10px] text-left border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${
                      active
                        ? 'bg-white dark:bg-ink-850 border-slate-200 dark:border-white/[0.08]'
                        : 'border-transparent hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${DIFF_DOT[p.difficulty]}`} aria-hidden />
                    <span className="min-w-0">
                      <span className={`block truncate text-[15px] ${active ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {p.title}
                      </span>
                      <span className="block truncate text-[13px] text-slate-500">{p.note}</span>
                    </span>
                    <span className="font-mono text-xs tabular-nums text-slate-500">
                      {p.solvedAgo === 0 ? 'Today' : `${p.solvedAgo}d ago`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* The moment: four weeks of cells from the solve date, review days lit */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl bg-white dark:bg-ink-850 border border-slate-200 dark:border-white/[0.08] shadow-[0_12px_32px_-16px_rgba(15,23,42,0.18)] dark:shadow-none">
            <div className="flex items-baseline justify-between gap-4 px-6 pt-6">
              <h3 className="text-[15px] font-medium text-slate-900 dark:text-white truncate">{selected.title}</h3>
              <span className="shrink-0 font-mono text-xs tabular-nums text-slate-500">Solved {fmt(solvedOn)}</span>
            </div>

            <div className="px-6 pt-6">
              <div className="grid grid-cols-7 gap-2 max-w-[344px] sm:max-w-none" aria-hidden>
                {WEEKDAYS.map((d, i) => (
                  <span key={i} className="font-mono text-[11px] text-slate-500 text-center">{d}</span>
                ))}
                {Array.from({ length: leadBlanks }, (_, i) => <span key={`b${i}`} />)}
                {Array.from({ length: GRID_DAYS }, (_, day) => {
                  const isSolve = day === 0;
                  const isReview = reviewDays.has(day);
                  const isToday = day === todayOffset;
                  const isPast = day < todayOffset;
                  const level = isSolve || isReview ? 4 : isPast ? 1 : 0;
                  const reviewIndex = INTERVALS.indexOf(day);
                  return (
                    <span
                      key={`${selectedId}-${day}`}
                      data-level={level}
                      className={`cell !w-full !h-auto aspect-square !rounded-[6px] relative grid place-items-center ${isSolve || isReview ? 'animate-fadeIn' : ''} ${
                        isToday ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white ring-offset-white dark:ring-offset-ink-850' : ''
                      }`}
                      style={isReview ? { animationDelay: `${120 + reviewIndex * 90}ms`, animationFillMode: 'both' } : undefined}
                    >
                      {isReview && (
                        <span className="font-mono text-[11px] font-medium text-white tabular-nums">{day}</span>
                      )}
                    </span>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                <span className="flex items-center gap-2"><span className="cell" data-level="4" aria-hidden />Solve and review days</span>
                <span className="flex items-center gap-2"><span className="cell ring-2 ring-slate-900 dark:ring-white" aria-hidden />Today</span>
              </div>
            </div>

            <ol className="mt-6 grid grid-cols-1 sm:grid-cols-3 border-t border-slate-200 dark:border-white/[0.06]" aria-label="Review schedule">
              {reviews.map((r, i) => (
                <li
                  key={r.day}
                  className={`px-6 py-4 ${i > 0 ? 'border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-white/[0.06]' : ''}`}
                >
                  <div className="font-mono text-xs text-slate-500 tabular-nums">Day {r.day}</div>
                  <div className="mt-1 text-[15px] tabular-nums text-slate-900 dark:text-white">{fmt(r.date)}</div>
                  <div
                    className={`mt-1 flex items-center gap-1 text-xs ${
                      r.status === 'today'
                        ? 'text-brand-600 dark:text-brand-400 font-medium'
                        : 'text-slate-500'
                    }`}
                  >
                    {r.status === 'done' && <Check className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden />}
                    {r.label}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
