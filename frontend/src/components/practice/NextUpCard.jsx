import React, { useEffect, useState } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

const DIFF_TEXT = { Easy: 'text-emerald-400', Medium: 'text-amber-400', Hard: 'text-rose-400' };

const KIND_LABEL = {
  start: 'Start here',
  plan: 'Next in your plan',
  'catch-up': 'Catch up',
  'step-up': 'Step up',
  reinforce: 'Same level',
  'step-down': 'Build up to it',
  prerequisite: 'Foundation first',
  revisit: 'Revisit',
  'next-pattern': 'New pattern',
};

/**
 * Fetches a recommendation. `refreshKey` changes when the person's history changes;
 * nothing is fetched while `enabled` is false.
 */
export function useNextProblem({ after = null, refreshKey = 0, enabled = true } = {}) {
  const [state, setState] = useState({ loading: enabled, rec: null });
  const [skipped, setSkipped] = useState([]);

  // A different starting problem means earlier skips no longer apply
  useEffect(() => { setSkipped([]); }, [after]);

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    api.getNextProblem({ after, exclude: skipped })
      .then((rec) => { if (alive) setState({ loading: false, rec }); })
      .catch(() => { if (alive) setState({ loading: false, rec: null }); });
    return () => { alive = false; };
  }, [after, refreshKey, skipped, enabled]);

  const skip = () => { if (state.rec?.problem) setSkipped((s) => [...s, state.rec.problem.id]); };
  return { ...state, skip };
}

/**
 * The adaptive "Next up" suggestion: one problem picked from how recent solves went,
 * with the reason in one line, so it's clear why this one and not another.
 * `compact` is the slimmer version shown in the editor after an accepted submit.
 */
export default function NextUpCard({ rec, loading, onOpen, onSkip, compact = false }) {
  if (loading && !rec) {
    return (
      <section className={`rounded-2xl border border-white/[0.08] bg-ink-850 ${compact ? 'p-4' : 'p-6'}`} aria-busy="true">
        <div className="h-3 w-24 rounded bg-white/[0.06]" />
        <div className="mt-3 h-4 w-56 rounded bg-white/[0.06]" />
      </section>
    );
  }
  if (!rec?.problem) {
    if (compact) return null;
    return (
      <section className="rounded-2xl border border-white/[0.08] bg-ink-850 p-6">
        <p className="text-xs text-slate-500">Next up</p>
        <p className="mt-2 text-[15px] text-white">You’ve solved every problem in the list</p>
        <p className="mt-1 text-[13px] text-slate-400">Your revision queue keeps them fresh</p>
      </section>
    );
  }

  const { problem, kind, reason, patternName } = rec;
  return (
    <section
      className={`rounded-2xl border border-white/[0.08] bg-ink-850 flex flex-col md:flex-row md:items-center justify-between gap-4 ${compact ? 'p-4' : 'p-6'}`}
      aria-labelledby="next-up-title"
    >
      <div className="min-w-0 space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Next up</span>
          <span aria-hidden>·</span>
          <span>{KIND_LABEL[kind] || 'Suggested'}</span>
          {patternName && (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{patternName}</span>
            </>
          )}
        </div>
        <h2 id="next-up-title" className={`${compact ? 'text-[15px]' : 'text-[17px]'} font-medium text-white flex items-baseline gap-3 flex-wrap`}>
          <span>{problem.number ? `${problem.number}. ` : ''}{problem.title}</span>
          <span className={`text-[13px] font-normal ${DIFF_TEXT[problem.difficulty] || 'text-slate-400'}`}>{problem.difficulty}</span>
        </h2>
        <p className="text-[13px] text-slate-400">{reason}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={loading}
            title="Suggest a different problem"
            aria-label="Suggest a different problem"
            className="w-10 h-10 grid place-items-center rounded-[10px] text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          </button>
        )}
        <button
          type="button"
          onClick={() => onOpen(problem)}
          className="btn-primary-glow inline-flex items-center gap-2 h-10 px-4 rounded-[10px] text-sm font-medium active:scale-[0.98]"
        >
          Solve
          <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
    </section>
  );
}
