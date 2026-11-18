import React, { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { api } from '../../services/api';

const VERDICT = {
  optimal: { label: 'Optimal', className: 'text-emerald-400' },
  acceptable: { label: 'Good enough for an interview', className: 'text-amber-400' },
  suboptimal: { label: 'Can be faster', className: 'text-rose-400' },
};

let statusPromise = null;
const aiStatus = () => (statusPromise ||= api.getAiStatus());

/**
 * "Review my code" after an accepted submit: time and space complexity, whether it's optimal,
 * and one tip. On demand rather than automatic, since each review costs money. Hidden when the
 * server has no reviewer set up. `submitKey` changes on every accepted submit, which clears the
 * previous review.
 */
export default function AiReviewPanel({ problem, language, code, submitKey, attemptId, onVerdict }) {
  const [enabled, setEnabled] = useState(false);
  const [state, setState] = useState({ phase: 'idle' }); // idle | loading | done | error

  useEffect(() => {
    let alive = true;
    aiStatus().then((s) => { if (alive) setEnabled(Boolean(s?.reviewEnabled)); });
    return () => { alive = false; };
  }, []);

  useEffect(() => { setState({ phase: 'idle' }); }, [submitKey, problem?.id]);

  if (!enabled) return null;

  const review = async () => {
    setState({ phase: 'loading' });
    const res = await api.reviewCode({
      problemId: problem?.id ? String(problem.id) : undefined,
      attemptId,
      title: problem?.title,
      difficulty: problem?.difficulty,
      language,
      code,
    });
    if (res.success) {
      setState({ phase: 'done', review: res.data });
      onVerdict?.(res.data.verdict);
    } else {
      setState({ phase: 'error', error: res.error, upgrade: res.upgrade });
    }
  };

  if (state.phase === 'idle' || state.phase === 'loading') {
    return (
      <div className="mt-4">
        <button
          type="button"
          onClick={review}
          disabled={state.phase === 'loading'}
          className="inline-flex items-center gap-2 h-8 px-3 rounded-lg bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-[13px] text-white transition-colors disabled:opacity-60"
        >
          {state.phase === 'loading'
            ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" strokeWidth={1.5} />
            : <Sparkles className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />}
          {state.phase === 'loading' ? 'Reviewing your code' : 'Review my code'}
        </button>
        <span className="ml-3 text-xs text-slate-500">Time and space complexity, and one tip</span>
      </div>
    );
  }

  if (state.phase === 'error') {
    return (
      <div className="mt-4 text-[13px]" role="alert">
        {state.upgrade ? (
          <p className="text-slate-400">
            Code review is part of Pro. <a href="/pricing" className="text-brand-400 hover:text-brand-300 underline underline-offset-2">See Pro</a>
          </p>
        ) : (
          <p className="text-rose-400">
            {state.error}{' '}
            <button type="button" onClick={review} className="text-slate-300 hover:text-white underline underline-offset-2">Try again</button>
          </p>
        )}
      </div>
    );
  }

  const r = state.review;
  const verdict = VERDICT[r.verdict] || VERDICT.acceptable;
  return (
    <section className="mt-4 rounded-xl border border-white/[0.08] bg-ink-850 p-4 font-sans" aria-label="Code review">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <span className={`text-[15px] font-medium ${verdict.className}`}>{verdict.label}</span>
        <span className="text-[13px] text-slate-400">Time <span className="font-mono text-white">{r.timeComplexity}</span></span>
        <span className="text-[13px] text-slate-400">Space <span className="font-mono text-white">{r.spaceComplexity}</span></span>
        {r.verdict !== 'optimal' && r.bestKnownTime && (
          <span className="text-[13px] text-slate-400">Best known <span className="font-mono text-white">{r.bestKnownTime}</span></span>
        )}
      </div>
      <p className="mt-3 text-[13px] text-slate-300">{r.summary}</p>
      <p className="mt-2 text-[13px] text-slate-300"><span className="text-slate-500">Tip</span> · {r.tip}</p>
      {typeof r.remainingToday === 'number' && (
        <p className="mt-3 text-xs text-slate-500">{r.remainingToday} {r.remainingToday === 1 ? 'review' : 'reviews'} left today</p>
      )}
    </section>
  );
}
