import React from 'react';

// The code score bar: a black track with a yellow fill that grows with the score, and turns green
// at 100. The numbers under it say where the points came from.

const fillClass = (score) =>
  score >= 100 ? 'bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.65)]' : score >= 50 ? 'bg-yellow-400' : 'bg-amber-500';

function hintFor(state) {
  const { phase, score, kind, parts, note } = state;
  if (phase === 'analyzing') return 'Analyzing your code…';
  if (phase === 'done') {
    if (score === null) return 'No test results to score yet';
    if (score >= 100) return kind === 'run' ? 'Looks optimal. Submit to finish' : 'Optimal solution';
    return `Tests ${parts.tests}/${parts.max.tests} · Time ${parts.time}/${parts.max.time} · Space ${parts.space}/${parts.max.space}`;
  }
  if (phase === 'skipped' || phase === 'locked' || phase === 'unavailable') return note;
  return 'Run or submit to score your code on tests, time and space';
}

export default function ScoreBar({ state, onDetails }) {
  const value = Math.max(0, Math.min(100, Math.round(state.score ?? 0)));
  const analyzing = state.phase === 'analyzing';

  return (
    <div className="px-4 py-2 border-b border-white/[0.08] bg-ink-850 flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 flex-shrink-0">Code score</span>
        <div
          role="progressbar"
          aria-label="Code score"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          className={`relative flex-1 h-2 rounded-full bg-black border border-white/[0.14] overflow-hidden ${analyzing ? 'animate-pulse' : ''}`}
        >
          <div
            className={`h-full rounded-full transition-[width,background-color] duration-700 ease-out ${fillClass(value)}`}
            style={{ width: `${value}%` }}
          />
        </div>
        <span className="w-14 flex-shrink-0 text-right font-mono text-xs tabular-nums text-white">{value}/100</span>
      </div>

      <div className="mt-1 min-h-[16px] flex items-center justify-between gap-3 text-[11px] text-slate-500">
        <span aria-live="polite">
          {hintFor(state)}
          {state.phase === 'locked' && (
            <> · <a href="/pricing" className="text-brand-400 hover:text-brand-300 underline underline-offset-2">See Pro</a></>
          )}
        </span>
        {state.phase === 'done' && state.analysis && (
          <button type="button" onClick={onDetails}
            className="flex-shrink-0 text-slate-300 hover:text-white underline underline-offset-4 decoration-white/30 hover:decoration-white rounded-sm">
            Details
          </button>
        )}
      </div>
    </div>
  );
}
