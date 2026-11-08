import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AchievementsCard, buildAchievements } from '../StreakAndAchievements';
import {
  countSolvesByDay, currentStreak, dateKey, difficultyRing, iconButton, longestStreak,
} from './plannerUtils';

// Solved ring geometry
const R = 62;
const C = 2 * Math.PI * R;
const GAP = 0.012; // small break between difficulty segments, as a share of the ring

/**
 * The three overview cards above the tabs: solved ring, streak calendar and achievements.
 * `calOffset` (months back from this one) lives in the parent so it survives opening the editor.
 */
export default function PlannerOverview({ questions, byTopic, solvedCount, calOffset, setCalOffset }) {
  const ringParts = difficultyRing(questions);
  const solvedTotal = ringParts.reduce((a, p) => a + p.done, 0);
  const totalAll = ringParts.reduce((a, p) => a + p.total, 0) || 150;

  // Streaks
  const solvesByDay = countSolvesByDay(questions);
  const todayDate = new Date();
  const todayKey = dateKey(todayDate);
  const streak = currentStreak(solvesByDay, todayDate);
  const longest = longestStreak(solvesByDay);

  // Calendar month being shown
  const calMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + calOffset, 1);
  const calDays = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
  const calLead = calMonth.getDay();
  const activeDaysThisMonth = Array.from({ length: calDays }, (_, i) =>
    solvesByDay[dateKey(new Date(calMonth.getFullYear(), calMonth.getMonth(), i + 1))] ? 1 : 0
  ).reduce((a, b) => a + b, 0);

  // Achievements, from real solve history
  const solvedTimes = questions.filter((q) => q.completed && q.completedAt).map((q) => q.completedAt).sort();
  const finishedTopics = byTopic.filter(({ items }) => items.length && items.every((q) => q.completed));
  const topicDates = finishedTopics
    .map(({ items }) => items.map((q) => q.completedAt).filter(Boolean).sort().pop())
    .filter(Boolean)
    .sort();
  const achievements = buildAchievements({
    solved: solvedCount,
    longestStreak: longest,
    topicsDone: finishedTopics.length,
    dates: { first: solvedTimes[0], fifty: solvedTimes[49], topic: topicDates[0] },
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
      {/* Solved ring */}
      <section className="xl:col-span-5 p-6 rounded-2xl bg-ink-850 border border-white/[0.08] flex flex-col">
        <h2 className="text-[15px] font-medium text-white">Solved</h2>
        <div className="flex-1 mt-4 flex items-center gap-8">
          <div className="relative w-40 h-40 flex-shrink-0">
            <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90" role="img"
              aria-label={ringParts.map((p) => `${p.level} ${p.done} of ${p.total}`).join(', ')}>
              {ringParts.map((p) => (
                <g key={p.level}>
                  <circle cx="80" cy="80" r={R} fill="none" stroke={p.track} strokeWidth="10"
                    strokeDasharray={`${Math.max(0, p.share - GAP) * C} ${C}`} strokeDashoffset={-p.start * C} />
                  {p.done > 0 && (
                    <circle cx="80" cy="80" r={R} fill="none" stroke={p.color} strokeWidth="10"
                      strokeDasharray={`${Math.max(0, p.share - GAP) * C * (p.done / p.total)} ${C}`}
                      strokeDashoffset={-p.start * C}
                      className="transition-[stroke-dasharray] duration-500 ease-out" />
                  )}
                </g>
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-[32px] leading-none font-medium tabular-nums text-white">{solvedTotal}</span>
              <span className="mt-1 font-mono text-xs tabular-nums text-slate-500">of {totalAll}</span>
            </div>
          </div>

          <ul className="flex-1">
            {ringParts.map((p) => (
              <li key={p.level} className="flex items-center justify-between gap-4 h-10 border-b border-white/[0.06] last:border-b-0">
                <span className="flex items-center gap-2 text-[13px] text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} aria-hidden />
                  {p.level}
                </span>
                <span className="font-mono text-[13px] tabular-nums text-white">
                  {p.done}<span className="text-slate-500"> / {p.total}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Streak calendar */}
      <section className="xl:col-span-4 p-6 rounded-2xl bg-ink-850 border border-white/[0.08]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-medium text-white">Daily streak</h2>
            <div className="mt-3 flex items-center gap-3">
              <span className="cell !w-4 !h-4 !rounded-[4px]" data-level={streak > 0 ? 4 : 0} aria-hidden />
              <div>
                <div className="font-mono text-[24px] leading-none font-medium tabular-nums text-white">
                  {streak}<span className="ml-2 font-sans text-[13px] font-normal text-slate-500">{streak === 1 ? 'day' : 'days'}</span>
                </div>
                <div className="mt-1 text-xs text-slate-500">Longest {longest}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCalOffset((o) => o - 1)} className={iconButton(false)} aria-label="Previous month">
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button onClick={() => setCalOffset((o) => Math.min(0, o + 1))} disabled={calOffset >= 0}
              className={`${iconButton(false)} disabled:opacity-30 disabled:pointer-events-none`} aria-label="Next month">
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between text-xs">
          <span className="text-slate-300">{calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          <span className="font-mono tabular-nums text-slate-500">{activeDaysThisMonth} active days</span>
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <span key={i} className="h-5 grid place-items-center font-mono text-[11px] text-slate-500">{d}</span>
          ))}
          {Array.from({ length: calLead }).map((_, i) => <span key={`e${i}`} aria-hidden />)}
          {Array.from({ length: calDays }, (_, i) => {
            const date = new Date(calMonth.getFullYear(), calMonth.getMonth(), i + 1);
            const k = dateKey(date);
            const n = solvesByDay[k] || 0;
            const lvl = n === 0 ? 0 : n === 1 ? 2 : n === 2 ? 3 : 4;
            const future = date > todayDate;
            return (
              <span
                key={k}
                data-level={lvl}
                title={future ? undefined : `${n} solved`}
                className={`cell !w-full !h-7 !rounded-md grid place-items-center font-mono text-[11px] tabular-nums ${
                  future ? '!bg-transparent text-slate-600' : lvl > 0 ? 'text-white' : 'text-slate-500'
                } ${k === todayKey ? 'ring-1 ring-white ring-offset-1 ring-offset-ink-850' : ''}`}
              >
                {i + 1}
              </span>
            );
          })}
        </div>
      </section>

      <AchievementsCard className="md:col-span-2 xl:col-span-3" achievements={achievements} />
    </div>
  );
}
