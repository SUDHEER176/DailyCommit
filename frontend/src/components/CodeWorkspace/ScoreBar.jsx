import React from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';

// The code score as a pill in the editor header: hidden until the first Run or Submit, then a
// small ring that fills with the score (amber under 50, blue above, green at 100). Clicking it
// opens the analysis. The breakdown is in the tooltip and in the details popup.

const ringColor = (score) => (score >= 100 ? '#34d399' : score >= 50 ? '#0066ff' : '#f59e0b');

function describe(state) {
  const { phase, score, parts, note } = state;
  if (phase === 'analyzing') return 'Scoring tests, time and space';
  if (phase === 'done' && parts && score != null) {
    return `Tests ${parts.tests}/${parts.max.tests} · Time ${parts.time}/${parts.max.time} · Space ${parts.space}/${parts.max.space}`;
  }
  return note || '';
}

function Ring({ value }) {
  const r = 6;
  const c = 2 * Math.PI * r;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="-rotate-90 flex-shrink-0">
      <circle cx="8" cy="8" r={r} fill="none" stroke="var(--hairline-strong)" strokeWidth="2" />
      <circle
        cx="8" cy="8" r={r} fill="none" stroke={ringColor(value)} strokeWidth="2" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)}
        style={{ transition: 'stroke-dashoffset 500ms var(--ease), stroke 500ms var(--ease)' }}
      />
    </svg>
  );
}

export default function ScoreBar({ state, onDetails }) {
  if (!state || state.phase === 'idle') return null;
  const analyzing = state.phase === 'analyzing';
  const value = Math.max(0, Math.min(100, Math.round(state.score ?? 0)));
  const canOpen = state.phase === 'done' && Boolean(state.analysis);
  const tip = describe(state);

  const body = (
    <>
      {analyzing ? (
        <Loader2 className="w-4 h-4 text-slate-500 animate-spin" strokeWidth={1.5} aria-hidden />
      ) : (
        <Ring value={value} />
      )}
      {analyzing ? (
        <span>Scoring</span>
      ) : (
        <>
          <span className="font-mono tabular-nums text-white">{value}</span>
          <span>{state.phase === 'done' ? 'score' : state.phase === 'locked' ? 'tests only' : 'score'}</span>
        </>
      )}
      {canOpen && <ChevronRight className="w-3.5 h-3.5 -mr-0.5" strokeWidth={1.5} aria-hidden />}
    </>
  );

  const pill = 'h-7 pl-2 pr-2.5 inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] text-xs text-slate-500';

  return (
    <span className="inline-flex items-center gap-2" aria-live="polite">
      {canOpen ? (
        <button
          type="button"
          onClick={onDetails}
          title={tip}
          aria-label={`Code score ${value} of 100. ${tip}. Open the analysis`}
          className={`${pill} hover:border-white/[0.14] hover:text-slate-300 transition-colors`}
        >
          {body}
        </button>
      ) : (
        <span className={pill} title={tip} role="status" aria-label={analyzing ? tip : `Code score ${value} of 100. ${tip}`}>
          {body}
        </span>
      )}
      {state.phase === 'locked' && (
        <a href="/pricing" className="text-xs text-brand-400 hover:text-brand-300">Pro</a>
      )}
    </span>
  );
}
