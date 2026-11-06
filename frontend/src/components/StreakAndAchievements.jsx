import React from 'react';
import { Flame, Check, Lock, Trophy, Footprints, Layers, CalendarCheck } from 'lucide-react';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const dateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Which days of this week (Mon–Sun) had a solve.
 * activeDays: Set or array of 'YYYY-MM-DD' keys. Without it, the streak itself says
 * the last `streak` days up to today were active.
 */
function weekState(streak, activeDays) {
  const today = new Date();
  const todayIdx = (today.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(today);
  monday.setDate(today.getDate() - todayIdx);
  const set = activeDays ? new Set(activeDays) : null;

  return DAY_NAMES.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const future = i > todayIdx;
    const done = set ? set.has(dateKey(d)) : !future && todayIdx - i < streak;
    return { name, done: done && !future, future, today: i === todayIdx };
  });
}

export function DailyStreakCard({ streak = 0, longest, activeDays, className = '' }) {
  const week = weekState(streak, activeDays);

  return (
    <section className={`p-6 rounded-2xl bg-white dark:bg-ink-850 border border-slate-200 dark:border-white/[0.08] ${className}`}>
      <h2 className="text-[15px] font-medium text-slate-900 dark:text-white">Daily streak</h2>

      <div className="mt-5 flex items-center gap-4">
        <span className="grid place-items-center w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
          <Flame className="w-6 h-6" strokeWidth={1.5} />
        </span>
        <div>
          <div className="font-mono text-[28px] leading-none font-medium tabular-nums text-slate-900 dark:text-white">
            {streak}
            <span className="ml-2 font-sans text-[13px] font-normal text-slate-500">{streak === 1 ? 'day' : 'days'}</span>
          </div>
          {longest !== undefined && <div className="mt-1 text-xs text-slate-500">Longest {longest}</div>}
        </div>
      </div>

      <ol className="mt-6 grid grid-cols-7 gap-1" aria-label="This week">
        {week.map((d) => (
          <li key={d.name} className="flex flex-col items-center gap-2">
            <span
              className={`grid place-items-center w-8 h-8 rounded-lg ${
                d.done
                  ? 'bg-brand-500 text-white'
                  : d.future
                    ? 'border border-dashed border-slate-200 dark:border-white/[0.08]'
                    : 'bg-slate-100 dark:bg-white/[0.04]'
              } ${d.today ? 'ring-1 ring-offset-2 ring-slate-900 dark:ring-white ring-offset-white dark:ring-offset-ink-850' : ''}`}
              aria-label={`${d.name}: ${d.done ? 'solved' : d.future ? 'upcoming' : 'no solve'}`}
            >
              {d.done && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
            </span>
            <span className={`font-mono text-[11px] ${d.today ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{d.name}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Flat hexagon badge: filled when earned, outlined with a lock when not */
function HexBadge({ unlocked, icon: Icon }) {
  return (
    <div className="relative w-16 h-[72px] mx-auto">
      <svg viewBox="0 0 64 72" className="absolute inset-0 w-full h-full" aria-hidden>
        <polygon
          points="32,2 61,18.5 61,53.5 32,70 3,53.5 3,18.5"
          className={unlocked ? 'fill-amber-500/15 stroke-amber-500/60' : 'fill-slate-100 dark:fill-white/[0.03] stroke-slate-200 dark:stroke-white/[0.1]'}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span className={`absolute inset-0 grid place-items-center ${unlocked ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-600'}`}>
        {unlocked ? <Icon className="w-6 h-6" strokeWidth={1.5} /> : <Lock className="w-5 h-5" strokeWidth={1.5} />}
      </span>
    </div>
  );
}

/**
 * Milestones the app can check from real data.
 * Pass whatever is known; dates are shown when they are available.
 */
export function buildAchievements({ solved = 0, longestStreak = 0, topicsDone = null, dates = {} }) {
  const list = [
    { id: 'first', name: 'First solve', need: 'Solve 1 problem', icon: Footprints, unlocked: solved >= 1, date: dates.first },
    { id: 'week', name: 'Week streak', need: 'Solve 7 days in a row', icon: CalendarCheck, unlocked: longestStreak >= 7, date: dates.week },
    { id: 'fifty', name: '50 solved', need: `${Math.max(0, 50 - solved)} more to go`, icon: Trophy, unlocked: solved >= 50, date: dates.fifty },
  ];
  if (topicsDone !== null) {
    list.push({ id: 'topic', name: 'Topic finished', need: 'Finish every problem in a topic', icon: Layers, unlocked: topicsDone >= 1, date: dates.topic });
  }
  return list;
}

const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null);

export function AchievementsCard({ achievements = [], className = '' }) {
  const earned = achievements.filter((a) => a.unlocked).length;
  return (
    <section className={`p-6 rounded-2xl bg-white dark:bg-ink-850 border border-slate-200 dark:border-white/[0.08] ${className}`}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[15px] font-medium text-slate-900 dark:text-white">Achievements</h2>
        <span className="font-mono text-xs tabular-nums text-slate-500">{earned} of {achievements.length}</span>
      </div>
      <ul className={`mt-5 grid gap-4 ${achievements.length > 3 ? 'grid-cols-2 gap-y-6' : 'grid-cols-3'}`}>
        {achievements.map((a) => (
          <li key={a.id} className="flex flex-col items-center text-center" title={a.unlocked ? a.name : a.need}>
            <HexBadge unlocked={a.unlocked} icon={a.icon} />
            <p className={`mt-3 text-[13px] leading-4 ${a.unlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{a.name}</p>
            <p className="mt-1 text-[11px] leading-4 text-slate-500">{a.unlocked ? fmt(a.date) || 'Earned' : a.need}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Analytics sidebar: streak card above achievements */
export default function StreakAndAchievements({ streak = 0, longest, activeDays, achievements, solved = 0, className = '' }) {
  const list = achievements || buildAchievements({ solved, longestStreak: Math.max(streak, longest || 0) });
  return (
    <div className={`space-y-4 w-full ${className}`}>
      <DailyStreakCard streak={streak} longest={longest} activeDays={activeDays} />
      <AchievementsCard achievements={list} />
    </div>
  );
}
