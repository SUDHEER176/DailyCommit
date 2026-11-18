import React from 'react';

const longDate = (ymd) => {
  const [y, m, d] = String(ymd).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const STATUS = {
  'on-track': { text: 'On track', className: 'text-emerald-400' },
  'slightly-behind': { text: 'Slightly behind', className: 'text-amber-400' },
  behind: { text: 'Behind', className: 'text-rose-400' },
};

function Stat({ label, value, hint }) {
  return (
    <div>
      <div className="font-mono text-[22px] leading-none tabular-nums text-white">{value}</div>
      <div className="mt-2 text-xs text-slate-500">{label}</div>
      {hint && <div className="text-[11px] text-slate-600">{hint}</div>}
    </div>
  );
}

function Bar({ value, total, className = 'bg-brand-500' }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden" role="presentation">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/**
 * Where the person stands: how many problems are solved, what's covered, what's left.
 * `data` is /api/planner/progress. Free sees the basics; `data.detailed` (per-topic breakdown,
 * weak topics, on-track check) is only sent for Pro, so Free gets a pointer to Pro instead.
 */
export default function ProgressCard({ data, streak = 0, revisionsDue = 0, onUpgrade = null }) {
  if (!data) return null;
  const { solved, total, remaining, solvedToday, topicsStarted, topicsTotal, byDifficulty, detailed } = data;

  const started = detailed?.topics.filter((t) => t.started)
    .sort((a, b) => (a.avgPerformance ?? 1) - (b.avgPerformance ?? 1) || b.total - a.total) || [];
  const notStarted = detailed?.topics.filter((t) => !t.started) || [];
  const onTrack = detailed?.onTrack;

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-ink-850 p-6 space-y-5" aria-labelledby="progress-title">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="progress-title" className="text-[15px] font-medium text-white">Your progress</h2>
        <span className="font-mono text-xs tabular-nums text-slate-500">{solved} of {total} solved · {remaining} to go</span>
      </div>

      <Bar value={solved} total={total} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <Stat label="Solved today" value={solvedToday} />
        <Stat label="Day streak" value={streak} />
        <Stat label="Topics started" value={`${topicsStarted}/${topicsTotal}`} />
        <Stat label="Revisions due" value={revisionsDue} />
      </div>

      <p className="text-xs text-slate-500 font-mono tabular-nums">
        Easy {byDifficulty.Easy.solved}/{byDifficulty.Easy.total} · Medium {byDifficulty.Medium.solved}/{byDifficulty.Medium.total} · Hard {byDifficulty.Hard.solved}/{byDifficulty.Hard.total}
      </p>

      {detailed ? (
        <div className="pt-4 border-t border-white/[0.06] space-y-4">
          {onTrack && (
            <p className="text-[13px] text-slate-300">
              <span className={`font-medium ${STATUS[onTrack.status].className}`}>{STATUS[onTrack.status].text}.</span>{' '}
              {onTrack.done} of {onTrack.scheduled} planned problems done so far
              {onTrack.behindBy > 0 ? `, ${onTrack.behindBy} behind` : ''}. Plan ends {longDate(onTrack.planEnds)}.
            </p>
          )}

          {detailed.weakest.length > 0 && (
            <p className="text-[13px] text-slate-300">
              <span className="text-slate-500">Needs work</span> · {detailed.weakest.join(', ')}
            </p>
          )}

          {started.length > 0 && (
            <ul className="space-y-2.5" aria-label="Covered topics">
              {started.map((t) => (
                <li key={t.topic} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_3rem] items-center gap-3 text-[13px]">
                  <span className="truncate text-slate-300">{t.topic}</span>
                  <Bar value={t.solved} total={t.total} className={t.avgPerformance != null && t.avgPerformance < 0.6 ? 'bg-amber-500' : 'bg-brand-500'} />
                  <span className="text-right font-mono text-xs tabular-nums text-slate-500">{t.solved}/{t.total}</span>
                </li>
              ))}
            </ul>
          )}

          {notStarted.length > 0 && (
            <p className="text-xs text-slate-500">
              <span className="text-slate-400">Still to cover</span> · {notStarted.map((t) => t.topic).join(', ')}
            </p>
          )}
        </div>
      ) : (
        onUpgrade && (
          <p className="pt-4 border-t border-white/[0.06] text-xs text-slate-500">
            Pro adds a breakdown by topic, what needs work, and an on-track check for your plan.{' '}
            <button type="button" onClick={onUpgrade} className="text-brand-400 hover:text-brand-300">Pro</button>
          </p>
        )
      )}
    </section>
  );
}
