import React from 'react';
import StreakAndAchievements from './StreakAndAchievements';

const pct = (n, total) => Math.round(((n || 0) / (total || 1)) * 100);

function Stat({ label, value, unit, note }) {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-ink-850 border border-slate-200 dark:border-white/[0.08]">
      <div className="text-[13px] text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-3 font-mono text-[32px] leading-none font-medium tabular-nums text-slate-900 dark:text-white">
        {value}
        {unit && <span className="ml-1 text-base text-slate-500">{unit}</span>}
      </div>
      <div className="mt-3 text-xs text-slate-500">{note}</div>
    </div>
  );
}

export default function StatsCharts({ stats = {} }) {
  const difficultyCounts = stats.difficultyCounts || { Easy: 18, Medium: 20, Hard: 4 };
  const statusCounts = stats.statusCounts || { Independently: 28, NeededHint: 10, LookedAtSolution: 4 };
  const totalSolved = stats.totalProblemsSolved || 42;
  const streak = stats.user?.streak || 62;

  const difficulty = [
    { key: 'Easy', n: difficultyCounts.Easy || 0, bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
    { key: 'Medium', n: difficultyCounts.Medium || 0, bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
    { key: 'Hard', n: difficultyCounts.Hard || 0, bar: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' },
  ];
  const status = [
    { key: 'On my own', n: statusCounts.Independently || 0, bar: 'bg-brand-500' },
    { key: 'Needed a hint', n: statusCounts.NeededHint || 0, bar: 'bg-slate-400 dark:bg-slate-500' },
    { key: 'Read the solution', n: statusCounts.LookedAtSolution || 0, bar: 'bg-slate-300 dark:bg-slate-700' },
  ];

  const independentPct = pct(statusCounts.Independently, totalSolved);
  const medPct = pct(difficultyCounts.Medium, totalSolved);

  return (
    <div className="space-y-8 pb-12">
      {/* Streak & Achievements panel — mobile shows stacked, lg shows as a sidebar */}
      <div>
        <h1 className="text-[28px] sm:text-[32px] leading-[1.15] font-medium tracking-[-0.02em] text-slate-900 dark:text-white">
          Analytics
        </h1>
        <p className="mt-2 text-[15px] text-slate-500 dark:text-slate-400">
          How many problems you have solved, how hard they were and how often you needed help
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Problems solved" value={totalSolved} note="All time" />
        <Stat label="Solved on your own" value={independentPct} unit="%" note="Target 80% or more" />
        <Stat label="Medium share" value={medPct} unit="%" note="Most interview loops sit at 50% or more" />
        <Stat label="Current streak" value={streak} unit="days" note="Solve one today to keep it" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: charts column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main chart: difficulty split */}
          <section className="p-6 rounded-2xl bg-white dark:bg-ink-850 border border-slate-200 dark:border-white/[0.08]">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[15px] font-medium text-slate-900 dark:text-white">Difficulty split</h2>
              <span className="font-mono text-[13px] tabular-nums text-slate-500">{totalSolved} solved</span>
            </div>

            <div className="mt-8 flex h-10 w-full overflow-hidden rounded-lg gap-[2px]" role="img"
              aria-label={difficulty.map((d) => `${d.key} ${d.n}`).join(', ')}>
              {difficulty.map((d) => (
                <div key={d.key} className={`${d.bar} first:rounded-l-lg last:rounded-r-lg`} style={{ width: `${pct(d.n, totalSolved)}%` }} />
              ))}
            </div>

            <dl className="mt-8 grid grid-cols-3 gap-6">
              {difficulty.map((d) => (
                <div key={d.key}>
                  <dt className={`text-[13px] ${d.text}`}>{d.key}</dt>
                  <dd className="mt-2 flex items-baseline gap-2">
                    <span className="font-mono text-2xl tabular-nums text-slate-900 dark:text-white">{d.n}</span>
                    <span className="font-mono text-[13px] tabular-nums text-slate-500">{pct(d.n, totalSolved)}%</span>
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* How problems were solved */}
          <section className="p-6 rounded-2xl bg-white dark:bg-ink-850 border border-slate-200 dark:border-white/[0.08]">
            <h2 className="text-[15px] font-medium text-slate-900 dark:text-white">How you solved them</h2>
            <ul className="mt-6 space-y-5">
              {status.map((s) => (
                <li key={s.key}>
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span className="text-slate-700 dark:text-slate-300">{s.key}</span>
                    <span className="font-mono tabular-nums text-slate-500">
                      {s.n} · {pct(s.n, totalSolved)}%
                    </span>
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                    <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${pct(s.n, totalSolved)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right: Streak & Achievements sidebar */}
        <StreakAndAchievements streak={streak} solved={totalSolved} />
      </div>
    </div>
  );
}
