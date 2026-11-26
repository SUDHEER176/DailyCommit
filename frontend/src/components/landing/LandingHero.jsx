import React, { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { setOpenProblem, setPlanPrefill } from '@/lib/planPrefill';
import { PROBLEMS } from '@/lib/practice';
import { generateScheduleClient } from '@/utils/schedulerEngine';

// The plan wizard's own choices, so every answer carries over to it
const DAYS = [30, 45, 60];
const HOURS = [1, 2, 3, 4, 5];
const LEVELS = ['beginner', 'intermediate', 'advanced'];

const next = (list, v) => list[(list.indexOf(v) + 1) % list.length];
// Small labels: sentence case, muted, figures in mono only where they're numbers
const label = 'text-[13px] text-slate-500';

/** An underlined word in the headline: tapping it steps to the next choice */
function Word({ label, children, onTap }) {
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={`${label}: ${children}. Tap to change`}
      className="underline decoration-brand-500 decoration-2 sm:decoration-[3px] underline-offset-[0.12em] hover:decoration-brand-400 focus-visible:outline-none focus-visible:decoration-white transition-colors"
    >
      {children}
    </button>
  );
}

/**
 * Landing hero: the headline is the plan itself ("My interview is in 45 days, I can study
 * 2 hours a day, and I'm intermediate"), with the underlined words tappable. Under it, the plan
 * those answers make, worked out live by the same scheduler as the plan wizard: problems a day,
 * the finish date, every day as a tick (review days taller), and day one's problems.
 */
export default function LandingHero({ onNavigate }) {
  const [a, setA] = useState({ targetDays: 45, hours: 2, level: 'intermediate' });
  const go = (path) => onNavigate && onNavigate(path);
  const build = () => { setPlanPrefill(a); go('/practice/dsa'); };

  const plan = useMemo(
    () => generateScheduleClient({ questions: PROBLEMS, level: a.level, dailyHours: a.hours, targetDays: a.targetDays }),
    [a.level, a.hours, a.targetDays]
  );

  const studyDays = plan.days.filter((d) => d.questions.length > 0).length || 1;
  const perDay = Math.round(plan.totalQuestions / studyDays);
  const minutesEach = Math.round((a.hours * 60) / Math.max(1, perDay));
  const finish = new Date(`${plan.estimatedCompletionDate}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const today = new Date();
  const interview = new Date(today.getFullYear(), today.getMonth(), today.getDate() + a.targetDays);
  const short = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const first = plan.days[0]?.questions || [];

  return (
    <section className="land-col pt-8 sm:pt-12" aria-label="Plan your prep">
      <div className="flex items-center justify-between gap-6">
        <p className={label}>DSA interview prep, one day at a time</p>
        <p className={`${label} hidden sm:block`}>Tap the underlined words to change them</p>
      </div>

      {/* The headline is the question: tap a word to change it */}
      <h1 className="mt-6 font-hand font-semibold text-[46px] sm:text-[68px] lg:text-[84px] leading-[1.05] text-[#1a1a17] dark:text-[#eeebe3]">
        My interview is in{' '}
        <Word label="Days until the interview" onTap={() => setA((x) => ({ ...x, targetDays: next(DAYS, x.targetDays) }))}>{a.targetDays} days</Word>, I can study{' '}
        <Word label="Hours a day" onTap={() => setA((x) => ({ ...x, hours: next(HOURS, x.hours) }))}>{a.hours} {a.hours === 1 ? 'hour' : 'hours'}</Word>{' '}
        a day, and I’m{' '}
        <Word label="Level" onTap={() => setA((x) => ({ ...x, level: next(LEVELS, x.level) }))}>{a.level}</Word>.
      </h1>

      {/* What those answers make, and the two ways on */}
      <div className="mt-6 sm:mt-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <p className="max-w-xl text-[15px] sm:text-[17px] leading-[1.65] text-slate-500 dark:text-slate-400" aria-live="polite">
          That’s <span className="whitespace-nowrap text-slate-900 dark:text-white">{perDay} problems a day</span>, about {minutesEach} minutes each.
          All {plan.totalQuestions} done by <span className="whitespace-nowrap text-slate-900 dark:text-white">{finish}</span>, with every fifth day kept for what you’re about to forget.
          {plan.warning && <span className="block mt-2 text-[15px] text-amber-700 dark:text-amber-400">That pace needs more than {a.hours} {a.hours === 1 ? 'hour' : 'hours'} a day. Tap the days or hours to ease it</span>}
        </p>
        <div className="flex items-center gap-6 shrink-0">
          <button type="button" onClick={() => go('/practice/dsa')} className="text-[14px] sm:text-[15px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            Or just practice, free
          </button>
          <button
            type="button"
            onClick={build}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-full text-[15px] font-medium text-white bg-[#1a1a17] hover:bg-black dark:text-[#1a1a17] dark:bg-[#eeebe3] dark:hover:bg-white on-dark transition-colors active:scale-[0.98]"
          >
            Build my plan
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Every day of the plan as a tick: today blue, review days tall, practice days short */}
      <div className="mt-10 sm:mt-14">
        <div className="flex items-center justify-between gap-4">
          <p className={label}>Your {a.targetDays} days</p>
          <ul className="hidden sm:flex items-center gap-6 text-[13px] text-slate-500">
            <li className="flex items-center gap-2"><span className="w-px h-4 bg-slate-400 dark:bg-slate-600" />Practice</li>
            <li className="flex items-center gap-2"><span className="w-[3px] h-4 bg-[#1a1a17] dark:bg-[#eeebe3]" />Review</li>
            <li className="flex items-center gap-2"><span className="w-[3px] h-4 bg-brand-500" />Today</li>
          </ul>
        </div>
        <div className="mt-4 flex items-end justify-between h-14 border-b border-slate-200 dark:border-white/[0.08]" aria-hidden>
          {plan.days.map((d, i) => (
            <span
              key={d.dayNumber}
              title={`Day ${d.dayNumber}: ${d.isRevisionDay ? 'review' : `${d.questions.length} problems`}`}
              className={`transition-[height,background-color] duration-300 ${
                i === 0
                  ? 'w-[3px] h-full bg-brand-500'
                  : d.isRevisionDay
                    ? 'w-[3px] h-[68%] bg-[#1a1a17] dark:bg-[#eeebe3]'
                    : 'w-px h-[34%] bg-slate-300 dark:bg-slate-600'
              }`}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-[13px] tabular-nums text-slate-500">
          <span>{short(today)} · today</span>
          <span className="hidden sm:inline">Day {Math.ceil(plan.days.length / 2)}</span>
          <span>{short(interview)} · interview</span>
        </div>
      </div>

      {/* Day one's problems */}
      <div className="mt-10 sm:mt-12">
        <p className={`${label} pb-3 border-b border-slate-200 dark:border-white/[0.08]`}>Day 1</p>
        <ol className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-6">
          {first.slice(0, 3).map((q, i) => (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => { setOpenProblem(q.id, 'plan'); go('/practice/dsa'); }}
                className="group text-left"
              >
                <span className="font-mono text-[13px] text-brand-600 dark:text-brand-400">{String(i + 1).padStart(2, '0')}</span>
                <span className="mt-2 block text-[18px] sm:text-[19px] font-medium leading-[1.35] text-[#1a1a17] dark:text-[#eeebe3] group-hover:underline decoration-1 underline-offset-4">
                  {q.title}
                </span>
                <span className={`mt-1 block ${label}`}>{q.topic} · {q.difficulty}</span>
              </button>
            </li>
          ))}
        </ol>
        {first.length > 3 && <p className={`mt-6 ${label}`}>+ {first.length - 3} more today</p>}
      </div>
    </section>
  );
}
