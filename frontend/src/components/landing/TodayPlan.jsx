import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/services/api';
import {
  PROBLEMS, activeDays, currentStreak, localDay, readDailyLog, revisionSchedule, withLocalDueDate,
} from '@/lib/practice';
import { setOpenProblem, setPlanPrefill } from '@/lib/planPrefill';
import { todayIso } from '../PersonalizedPlanner/plannerUtils';
import SectionHead from './SectionHead';
import { rv, useReveal } from './ink';

const DIFF = { Easy: 'text-emerald-600 dark:text-emerald-400', Medium: 'text-amber-600 dark:text-amber-400', Hard: 'text-rose-600 dark:text-rose-400' };
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// A card: large radius, quiet surface, the same in every tile
const card = 'rounded-[20px] border border-slate-200 dark:border-white/[0.07] bg-white dark:bg-ink-850 p-4 sm:p-5';
// Square icon button, like the calendar's month arrows
const iconBtn = 'grid place-items-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.1] hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none';
// Small tinted pill under a card's title
const pill = 'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[13px] transition-colors';

/** A card's header: a small line above a big title, actions on the right */
function CardHead({ over, title, children }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[13px] text-slate-500">{over}</p>
        <h3 className="mt-1 text-[20px] sm:text-[22px] leading-[1.2] font-medium tracking-[-0.01em] text-slate-700 dark:text-slate-300 break-words">{title}</h3>
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}

/** The day mark used everywhere: a fire in a dotted circle once solved, a number otherwise */
function DayMark({ solved, today, label, muted, size = 'w-8 h-8' }) {
  if (solved) {
    return (
      <span className={`grid place-items-center ${size} rounded-full border border-dashed border-orange-400/40 dark:border-white/[0.14] text-[15px] leading-none`} aria-label={`${label}, solved`}>
        <span aria-hidden>🔥</span>
      </span>
    );
  }
  return (
    <span
      className={`grid place-items-center ${size} rounded-full text-[13px] tabular-nums ${
        today
          ? 'bg-slate-200 dark:bg-white/[0.12] text-slate-900 dark:text-white font-medium'
          : muted
            ? 'text-[#b9bfcb] dark:text-slate-600'
            : 'text-slate-800 dark:text-slate-200'
      }`}
    >
      {label}
    </span>
  );
}

/** The streak as a month calendar: week numbers down the side, a fire on each solved day */
function StreakCalendar({ days, streak, onInsights }) {
  const now = new Date();
  const [offset, setOffset] = useState(0); // months back from this one
  const view = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  const todayKey = localDay(now);

  // Six Monday-first weeks covering the month, spilling into the months around it
  const cells = useMemo(() => {
    const lead = (view.getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, i) => new Date(view.getFullYear(), view.getMonth(), 1 - lead + i));
  }, [view.getFullYear(), view.getMonth()]); // eslint-disable-line react-hooks/exhaustive-deps

  const inMonth = (d) => d.getMonth() === view.getMonth();
  const solvedThisMonth = cells.filter((d) => inMonth(d) && days.has(localDay(d))).length;
  const monthName = view.toLocaleDateString('en-US', { month: 'long' });

  return (
    <div className={`${card} flex flex-col`}>
      <CardHead over={view.getFullYear()} title={monthName}>
        <button type="button" className={iconBtn} onClick={() => setOffset((o) => o + 1)} aria-label="Previous month">
          <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <button type="button" className={iconBtn} onClick={() => setOffset((o) => Math.max(0, o - 1))} disabled={offset === 0} aria-label="Next month">
          <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </CardHead>

      <button
        type="button"
        onClick={onInsights}
        className={`${pill} mt-3 self-start text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/15`}
      >
        <BarChart3 className="w-3.5 h-3.5" strokeWidth={1.5} />
        View insights
      </button>

      <div className="mt-4 grid grid-cols-[20px_repeat(7,minmax(0,1fr))] gap-y-1 items-center justify-items-center" role="grid" aria-label={`${monthName} ${view.getFullYear()}, solved days`}>
        <span />
        {WEEKDAYS.map((w) => (
          <span key={w} className="h-7 grid place-items-center text-[11px] uppercase text-slate-500">{w}</span>
        ))}
        {Array.from({ length: 6 }, (_, row) => (
          <React.Fragment key={row}>
            <span className="text-[11px] tabular-nums text-[#b9bfcb] dark:text-slate-600">{row + 1}</span>
            {cells.slice(row * 7, row * 7 + 7).map((d) => {
              const key = localDay(d);
              return (
                <DayMark
                  key={key}
                  label={d.getDate()}
                  solved={days.has(key)}
                  today={key === todayKey}
                  muted={!inMonth(d) || key > todayKey}
                  size="w-8 h-8"
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <p className="mt-4 text-[13px] text-slate-500 tabular-nums">
        {streak > 0 ? `${streak}-day streak` : 'No streak yet, solve one today'}
        {solvedThisMonth > 0 && ` · ${solvedThisMonth} ${solvedThisMonth === 1 ? 'day' : 'days'} solved in ${monthName}`}
      </p>
    </div>
  );
}

/** A problem row: a numbered dotted circle (a fire once solved), the title, a note */
function Row({ index, done, title, meta, metaClass = 'text-slate-500', onOpen }) {
  return (
    <li>
      <button type="button" onClick={onOpen} className="group w-full flex items-center gap-3 h-11 px-2 -mx-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
        {done ? (
          <DayMark solved label={title} size="w-7 h-7 shrink-0" />
        ) : (
          <span className="grid place-items-center w-7 h-7 shrink-0 rounded-full border border-dashed border-slate-300 dark:border-white/[0.16] text-[12px] tabular-nums text-slate-500 group-hover:border-brand-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {index}
          </span>
        )}
        <span className={`flex-1 truncate text-[14px] ${done ? 'text-slate-500 line-through decoration-slate-400' : 'text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
          {title}
        </span>
        <span className={`shrink-0 text-xs ${metaClass}`}>{meta}</span>
        <ChevronRight className="w-4 h-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
      </button>
    </li>
  );
}

// Fixed schedule items know their review day; Pro's smart items carry a label instead
const reviewNote = (item) => {
  const what = item.reviewDay ? `Day ${item.reviewDay}` : item.label || 'Review';
  return item.daysUntil < 0 ? `${what}, ${-item.daysUntil}d late` : what;
};

/**
 * Signed-in home: today's problems from the study plan, the revisions due today, and the
 * streak as a month calendar with a fire on each solved day. A click on a problem opens it in
 * the practice hub's editor.
 */
export default function TodayPlan({ onNavigate }) {
  const [plan, setPlan] = useState(undefined); // undefined while loading, null when there is none
  const [smart, setSmart] = useState(null);
  const [attempts, setAttempts] = useState({});
  const [attemptReviews, setAttemptReviews] = useState({});
  const reveal = useReveal();

  useEffect(() => {
    api.getStudyPlan().then((p) => setPlan(p?.days ? p : null)).catch(() => setPlan(null));
    // Pro gets the server's smart schedule; everyone else the fixed 3 / 7 / 21 days, as in the hub
    api.getRevisionSchedule().then((s) => setSmart(s?.smart ? s : null)).catch(() => setSmart(null));
    api.getAttempts().then((a) => setAttempts(a && !Array.isArray(a) ? a : {})).catch(() => {});
    api.getAttemptReviews().then((r) => setAttemptReviews(r || {})).catch(() => {});
  }, []);

  const go = (path) => onNavigate && onNavigate(path);
  const open = (id, kind) => { setOpenProblem(id, kind); go('/practice/dsa'); };
  const buildPlan = () => { setPlanPrefill({}); go('/practice/dsa'); }; // opens the hub on the plan wizard

  // Today in the plan (the planner keys days the same way)
  const todayKey = todayIso();
  const day = plan?.days?.find((d) => d.date === todayKey);
  const questions = day?.questions || [];
  const left = questions.filter((q) => !q.completed).length;
  const firstDate = plan?.days?.[0]?.date;
  const lastDate = plan?.days?.[plan.days.length - 1]?.date;
  const fmt = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  let empty = null;
  if (plan === null) empty = 'No study plan yet. Build one and today’s problems show up here.';
  else if (plan && !day && firstDate && todayKey < firstDate) empty = `Your plan starts ${fmt(firstDate)}.`;
  else if (plan && !day && lastDate && todayKey > lastDate) empty = 'Your plan is finished. Every day is done.';
  else if (plan && day && questions.length === 0) empty = day.isRevisionDay ? 'A revision day: nothing new, just the reviews.' : 'Nothing new on the plan today.';
  else if (plan && !day) empty = 'Nothing planned for today.';

  const due = smart
    ? smart.due.map(withLocalDueDate)
    : revisionSchedule(plan || null, new Date(), { attempts, problems: PROBLEMS, attemptReviews }).due;

  const days = activeDays(plan || null, readDailyLog(), attempts);
  const streak = currentStreak(days);

  return (
    <section id="today-plan" className="scroll-mt-24">
      <SectionHead title="Today’s plan" caption={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} />
      <div {...reveal} className="reveal land-col mt-6 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_340px] gap-3">

        <div className="min-w-0 grid grid-cols-[minmax(0,1fr)] gap-3 content-start">
          {/* Today: the plan's problems */}
          <div {...rv(0)} className={card}>
            <CardHead over={day ? `Day ${day.dayNumber} of ${plan.days.length}` : 'Today'} title={day?.topics?.length ? day.topics.join(' · ') : 'Your problems'} />
            {questions.length > 0 && (
              <span className={`${pill} mt-3 text-brand-700 dark:text-brand-400 bg-brand-500/10 border border-brand-500/30`}>
                {left === 0 ? 'All done for today' : `${questions.length - left} of ${questions.length} done`}
              </span>
            )}

            {plan === undefined ? (
              <p className="mt-4 text-[13px] text-slate-500">Loading your plan</p>
            ) : empty ? (
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-[14px] text-slate-600 dark:text-slate-400">{empty}</p>
                <button
                  type="button"
                  onClick={plan === null ? buildPlan : () => go('/practice/dsa')}
                  className="on-dark shrink-0 inline-flex items-center gap-2 h-8 px-3 rounded-lg text-[13px] font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-ink-900 dark:hover:bg-white transition-colors"
                >
                  {plan === null ? 'Build a plan' : 'Open the practice hub'}
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <ul className="mt-3">
                {questions.map((q, i) => (
                  <Row key={q.id} index={i + 1} done={q.completed} title={q.title} meta={q.difficulty} metaClass={DIFF[q.difficulty]} onOpen={() => open(q.id, 'plan')} />
                ))}
              </ul>
            )}
          </div>

          {/* Comes back today: the revisions due */}
          <div {...rv(1)} className={card}>
            <CardHead over={smart ? 'Smart revision' : 'Day 3, 7 and 21'} title="Comes back today">
              <span className="font-mono text-[13px] tabular-nums text-slate-500">{due.length}</span>
            </CardHead>
            {due.length === 0 ? (
              <p className="mt-4 text-[14px] text-slate-600 dark:text-slate-400">Nothing to review today.</p>
            ) : (
              <ul className="mt-3">
                {due.slice(0, 5).map((item, i) => (
                  <Row
                    key={item.question.id}
                    index={i + 1}
                    done={false}
                    title={item.question.title}
                    meta={reviewNote(item)}
                    metaClass={item.daysUntil < 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}
                    onOpen={() => open(item.question.id, 'review')}
                  />
                ))}
              </ul>
            )}
            {due.length > 5 && (
              <button type="button" onClick={() => go('/practice/dsa')} className="mt-3 inline-flex items-center gap-1 text-[13px] text-brand-600 dark:text-brand-400 hover:underline underline-offset-4">
                All {due.length} reviews
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>

        {/* Streak: the month calendar */}
        <div {...rv(2)} className="self-start">
          <StreakCalendar days={days} streak={streak} onInsights={() => go('/practice/dsa')} />
        </div>
      </div>
    </section>
  );
}
