import React, { useEffect } from 'react';
import { X, Trophy, PartyPopper } from 'lucide-react';

/**
 * The centred result popup. After an accepted Submit it says how the solution did:
 *   optimal   a score of 100: optimal in time and space
 *   solved    every test passed with a slower or heavier approach: congratulations, and a
 *             better way to think about the problem
 *   details   opened from the bar's "Details" link on any scored run
 * It shows the code, the time and space complexity (against the best known), and the main idea.
 */
export default function ScoreModal({ result, variant, problemTitle, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const { analysis, score, code } = result;
  const total = score.score;
  const optimal = variant === 'optimal';
  const details = variant === 'details';

  const title = optimal ? 'Optimal solution' : details ? 'Code analysis' : 'Solved! Nice work';
  const lead = optimal
    ? `You've completed an optimal solution, in time and in space complexity: ${analysis.timeComplexity} time and ${analysis.spaceComplexity} space.`
    : details
      ? `How this version of your code scored: ${total} out of 100.`
      : `Congratulations, every test passes. This approach is ${analysis.approach ? analysis.approach.toLowerCase() : 'a working one'}, and there is room to make it faster or lighter.`;

  const accent = optimal ? 'text-emerald-400' : 'text-yellow-400';
  const grade = { optimal: 'text-emerald-400', good: 'text-yellow-400', poor: 'text-rose-400' };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="score-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[calc(100vh-32px)] overflow-y-auto rounded-2xl bg-ink-850 border border-white/[0.1] p-6 sm:p-8 text-slate-100 animate-modalIn"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>

        <div className="flex items-center gap-3">
          {optimal ? <Trophy className={`w-6 h-6 ${accent}`} strokeWidth={1.5} /> : <PartyPopper className={`w-6 h-6 ${accent}`} strokeWidth={1.5} />}
          <h2 id="score-title" className={`text-[22px] font-medium ${accent}`}>{title}</h2>
        </div>
        {problemTitle && <p className="mt-1 text-[13px] text-slate-500">{problemTitle}</p>}
        <p className="mt-4 text-[15px] leading-6 text-slate-200">{lead}</p>

        {/* The score, and where it came from */}
        <div className="mt-6">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-mono text-[28px] leading-none tabular-nums text-white">{total}<span className="text-[15px] text-slate-500">/100</span></span>
            <span className="text-xs text-slate-500">
              Tests {score.tests}/{score.max.tests} · Time {score.time}/{score.max.time} · Space {score.space}/{score.max.space}
            </span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-black border border-white/[0.14] overflow-hidden" role="presentation">
            <div className={`h-full rounded-full ${optimal ? 'bg-emerald-400' : 'bg-yellow-400'}`} style={{ width: `${total}%` }} />
          </div>
        </div>

        {/* Complexity against the best known */}
        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          {[
            ['Time complexity', analysis.timeComplexity, analysis.bestKnownTime, analysis.timeGrade],
            ['Space complexity', analysis.spaceComplexity, analysis.bestKnownSpace, analysis.spaceGrade],
          ].map(([label, yours, best, g]) => (
            <div key={label} className="rounded-xl bg-ink-800 border border-white/[0.08] p-4">
              <p className="text-xs text-slate-500">{label}</p>
              <p className={`mt-1 font-mono text-[20px] ${grade[g] || 'text-white'}`}>{yours}</p>
              <p className="mt-1 text-xs text-slate-500">
                {g === 'optimal' ? 'Matches the best known' : <>Best known <span className="font-mono text-slate-300">{best}</span></>}
              </p>
            </div>
          ))}
        </div>

        {/* The main idea */}
        <div className="mt-6">
          <p className="text-[13px] text-white">The main idea{analysis.approach ? <span className="text-slate-500"> · {analysis.approach}</span> : null}</p>
          <p className="mt-2 text-[14px] leading-6 text-slate-300">{analysis.intuition}</p>
        </div>

        {/* A better way to think about it, when there is one */}
        {analysis.betterApproach && (
          <div className="mt-6 rounded-xl border border-yellow-400/30 bg-yellow-400/[0.05] p-4">
            <p className="text-[13px] text-yellow-300">Why not think about it this way?</p>
            <p className="mt-2 text-[14px] leading-6 text-slate-200">{analysis.betterApproach}</p>
          </div>
        )}

        {/* The code */}
        <div className="mt-6">
          <p className="text-[13px] text-white">Your code</p>
          <pre className="mt-2 max-h-56 overflow-auto p-4 rounded-xl bg-ink-900 border border-white/[0.06] font-mono text-[12px] leading-[1.6] text-slate-200 whitespace-pre">{code}</pre>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="btn-primary-glow h-10 px-5 rounded-[10px] text-sm font-medium active:scale-[0.98]"
          >
            {optimal ? 'Keep going' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
}
