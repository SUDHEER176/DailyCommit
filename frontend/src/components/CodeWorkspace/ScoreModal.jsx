import React, { useEffect } from 'react';
import { X, Lightbulb, ArrowRight, ChevronRight } from 'lucide-react';

/**
 * The code analysis, as a panel on the right of the workspace so the problem and code stay in view.
 *   optimal   a score of 100: optimal in time and space
 *   solved    an accepted Submit with a slower or heavier approach
 *   details   opened from the score pill on any scored run
 * The hero is the score ring, built from three segments (tests, time, space) so the lost points
 * show where they were lost. Below it: complexity against the best known, the main idea, a better
 * way to think about it, the self-rating, and the next problem.
 */

const PARTS = [
  { key: 'tests', label: 'Tests' },
  { key: 'time', label: 'Time' },
  { key: 'space', label: 'Space' },
];

function ScoreRing({ score, optimal }) {
  const size = 144;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = 6; // px of track between segments
  const fill = optimal ? '#34d399' : '#0066ff';
  let start = 0;
  const segments = PARTS.map(({ key }) => {
    const max = score.max[key];
    const len = (c * max) / 100;
    const seg = { key, start, len: Math.max(0, len - gap), earned: Math.max(0, len - gap) * (score[key] / max) };
    start += len;
    return seg;
  });

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        {segments.map((s) => (
          <g key={s.key}>
            <circle
              cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--raised)" strokeWidth={stroke}
              strokeDasharray={`${s.len} ${c}`} strokeDashoffset={-s.start}
            />
            <circle
              cx={size / 2} cy={size / 2} r={r} fill="none" stroke={fill} strokeWidth={stroke}
              strokeDasharray={`${s.earned} ${c}`} strokeDashoffset={-s.start}
              style={{ transition: 'stroke-dasharray 700ms var(--ease)' }}
            />
          </g>
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[36px] leading-none tabular-nums text-white">{score.score}</span>
        <span className="mt-1 font-mono text-xs tabular-nums text-slate-500">/100</span>
      </div>
    </div>
  );
}

export default function ScoreModal({
  result, variant, problemTitle, onClose,
  selfRating = null, onRate = null, // self-rating, after an accepted Submit
  nextProblem = null, onOpenNext = null, // the Next up suggestion
}) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const { analysis, score, code } = result;
  const optimal = variant === 'optimal' || score.score === 100;
  const details = variant === 'details';
  const status = optimal ? 'Optimal solution' : details ? 'Code analysis' : 'Accepted';
  const statusClass = optimal ? 'text-emerald-400' : details ? 'text-white' : 'text-emerald-400';
  const summary = optimal
    ? 'Every test passes, with the best known time and space'
    : details
      ? `${score.tests === score.max.tests ? 'Every test passes' : 'Some tests fail'}; here is where the points went`
      : 'Every test passes. There is room to make it faster or lighter';

  const complexity = [
    ['Time', analysis.timeComplexity, analysis.bestKnownTime, analysis.timeGrade],
    ['Space', analysis.spaceComplexity, analysis.bestKnownSpace, analysis.spaceGrade],
  ];

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="analysis-title"
      className="fixed top-2 right-2 bottom-2 z-[70] w-[440px] max-w-[calc(100vw-16px)] flex flex-col rounded-xl border border-white/[0.1] bg-ink-850 shadow-[0_16px_48px_rgba(0,0,0,0.35)] text-slate-100 panel-in"
    >
      {/* Header */}
      <div className="h-14 pl-5 pr-3 border-b border-white/[0.08] flex items-center justify-between gap-3 flex-shrink-0">
        <div className="min-w-0">
          <h2 id="analysis-title" className={`text-[15px] font-medium ${statusClass}`}>{status}</h2>
          {problemTitle && <p className="text-xs text-slate-500 truncate">{problemTitle}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the analysis"
          className="w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-6 space-y-8">
        {/* Score ring and where the points came from */}
        <section className="flex items-center gap-6">
          <ScoreRing score={score} optimal={optimal} />
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-[13px] text-slate-400 leading-5">{summary}</p>
            <dl className="space-y-1.5">
              {PARTS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-3 text-[13px]">
                  <dt className="flex items-center gap-2 text-slate-400">
                    <span
                      className={`w-2 h-2 rounded-[2px] ${score[key] === score.max[key] ? (optimal ? 'bg-emerald-400' : 'bg-brand-500') : 'bg-[var(--raised)] ring-1 ring-inset ring-white/[0.1]'}`}
                      aria-hidden
                    />
                    {label}
                  </dt>
                  <dd className="font-mono tabular-nums">
                    <span className="text-white">{score[key]}</span>
                    <span className="text-slate-500">/{score.max[key]}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Complexity against the best known */}
        <section aria-label="Complexity">
          <div className="rounded-xl border border-white/[0.08] divide-y divide-white/[0.06]">
            {complexity.map(([label, yours, best, grade]) => (
              <div key={label} className="h-12 px-4 grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 text-[13px]">
                <span className="text-slate-500">{label}</span>
                <span className="font-mono text-white truncate">{yours}</span>
                {grade === 'optimal' ? (
                  <span className="text-xs text-emerald-400">Optimal</span>
                ) : (
                  <span className="text-xs text-slate-500">
                    Best <span className={`font-mono ${grade === 'poor' ? 'text-rose-400' : 'text-amber-400'}`}>{best}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* The main idea */}
        <section>
          <h3 className="text-[13px] text-white">
            The main idea
            {analysis.approach && <span className="text-slate-500"> · {analysis.approach}</span>}
          </h3>
          <p className="mt-2 text-[14px] leading-6 text-slate-300">{analysis.intuition}</p>
        </section>

        {/* A better way to think about it, when there is one */}
        {!optimal && analysis.betterApproach && (
          <section>
            <h3 className="flex items-center gap-2 text-[13px] text-white">
              <Lightbulb className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
              A better way to think about it
            </h3>
            <p className="mt-2 text-[14px] leading-6 text-slate-300">{analysis.betterApproach}</p>
          </section>
        )}

        {/* How it felt, after an accepted Submit */}
        {onRate && (
          <section role="group" aria-label="How hard was this problem for you">
            <h3 className="text-[13px] text-white">How did that feel?</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[['easy', 'Easy'], ['ok', 'OK'], ['hard', 'Hard']].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selfRating === value}
                  onClick={() => onRate(value)}
                  className={`h-9 rounded-lg text-[13px] border transition-colors ${
                    selfRating === value
                      ? 'bg-white/[0.08] border-white/[0.16] text-white'
                      : 'border-white/[0.08] text-slate-400 hover:text-white hover:border-white/[0.14]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-2 h-4 text-xs text-slate-500">{selfRating ? 'Saved. It shapes your next problem and revision' : ''}</p>
          </section>
        )}

        {/* The code, folded away */}
        {code && (
          <details className="group">
            <summary className="list-none cursor-pointer inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-white transition-colors [&::-webkit-details-marker]:hidden">
              <ChevronRight className="w-4 h-4 transition-transform duration-150 group-open:rotate-90" strokeWidth={1.5} />
              Show the code that was scored
            </summary>
            <pre className="mt-3 max-h-64 overflow-auto p-4 rounded-xl bg-ink-900 border border-white/[0.06] font-mono text-[12px] leading-[1.6] text-slate-200 whitespace-pre">{code}</pre>
          </details>
        )}
      </div>

      {/* Footer: the next problem, or close */}
      <div className="p-3 border-t border-white/[0.08] flex items-center gap-2 flex-shrink-0">
        {nextProblem && onOpenNext ? (
          <>
            <button
              type="button"
              onClick={() => { onClose(); onOpenNext(nextProblem); }}
              className="btn-primary-glow flex-1 min-w-0 h-10 px-4 rounded-[10px] text-sm font-medium inline-flex items-center justify-between gap-3 active:scale-[0.98]"
            >
              <span className="truncate">Next: {nextProblem.title}</span>
              <ArrowRight className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-[10px] text-sm text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              Close
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="flex-1 h-10 rounded-[10px] text-sm bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-white transition-colors active:scale-[0.98]"
          >
            Back to the code
          </button>
        )}
      </div>
    </aside>
  );
}
