import React from 'react';
import { Play, CheckCircle2, Lightbulb, ExternalLink, FileText } from 'lucide-react';
import { card, tabClass, toolButton } from './styles';
import { difficultyText, renderInline, tidyStatement } from './statement';

/** The problem card: Description and Hints tabs, the statement, and links to read more */
export default function ProblemPanel({ problem, isLoadingDetails, activeTab, onTab, onHintsViewed, onVideoOpened, solvedBefore }) {
  return (
    <section className={card} aria-label="Problem">
      <div className="h-11 px-4 border-b border-white/[0.08] flex items-center gap-6 flex-shrink-0">
        <button onClick={() => onTab('description')} className={tabClass(activeTab === 'description')}>
          <FileText className="w-4 h-4" strokeWidth={1.5} />
          Description
        </button>
        <button onClick={() => { onTab('solution'); onHintsViewed(); }} className={tabClass(activeTab === 'solution')}>
          <Lightbulb className="w-4 h-4" strokeWidth={1.5} />
          Hints and topics
        </button>
        {isLoadingDetails && (
          <span className="ml-auto font-mono text-xs text-slate-500">Loading statement</span>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-6 text-sm leading-[1.65] text-slate-300">
        {activeTab === 'description' && (
          <>
            <h1 className="flex items-center gap-2.5 text-xl font-medium text-white">
              <span>{problem.number ? `${problem.number}. ` : ''}{problem.title}</span>
              {solvedBefore && (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" strokeWidth={1.75} aria-label="Solved" />
              )}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className={`h-6 px-2 inline-flex items-center rounded-md bg-white/[0.04] ${difficultyText[problem.difficulty] || difficultyText.Easy}`}>
                {problem.difficulty}
              </span>
              {problem.topic && (
                <span className="h-6 px-2 inline-flex items-center rounded-md bg-white/[0.04] text-slate-400">{problem.topic}</span>
              )}
              <button
                type="button"
                onClick={() => { onTab('solution'); onHintsViewed(); }}
                className="h-6 px-2 inline-flex items-center gap-1.5 rounded-md bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5" strokeWidth={1.5} />
                Hints
              </button>
            </div>

            {problem.contentHtml ? (
              <div
                className="problem-content-html mt-6"
                dangerouslySetInnerHTML={{ __html: tidyStatement(problem.contentHtml) }}
              />
            ) : (
              <>
                <div className="mt-6 space-y-4 whitespace-pre-line">
                  {renderInline(problem.description)}
                </div>

                {problem.examples?.length > 0 && (
                  <div className="mt-8 space-y-3">
                    {problem.examples.map((ex, idx) => (
                      <div key={idx}>
                        <p className="text-[13px] text-white">Example {idx + 1}</p>
                        <dl className="mt-2 rounded-xl bg-ink-900 border border-white/[0.06] p-4 font-mono text-[13px] leading-[1.7] grid grid-cols-[88px_minmax(0,1fr)] gap-x-2">
                          <dt className="text-slate-500">Input</dt>
                          <dd className="text-slate-200 break-words">{ex.input}</dd>
                          <dt className="text-slate-500">Output</dt>
                          <dd className="text-slate-200">{ex.output}</dd>
                          {ex.explanation && (
                            <>
                              <dt className="text-slate-500">Why</dt>
                              <dd className="text-slate-400 font-sans text-[13px]">{ex.explanation}</dd>
                            </>
                          )}
                        </dl>
                      </div>
                    ))}
                  </div>
                )}

                {problem.constraints?.length > 0 && (
                  <div className="mt-8">
                    <p className="text-[13px] text-white">Constraints</p>
                    <ul className="mt-2 space-y-1 font-mono text-[13px] text-slate-400">
                      {problem.constraints.map((c, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-slate-600" aria-hidden>·</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'solution' && (
          <div>
            <h2 className="text-[15px] font-medium text-white">Topics and approach</h2>
            <p className="mt-2 text-sm text-slate-400">
              This problem mostly tests <span className="text-white">{problem.topic || 'data structures'}</span>.
              Try it on your own first, then come back here if you get stuck.
            </p>
            {problem.video && (
              <a
                href={problem.video}
                target="_blank"
                rel="noreferrer"
                onClick={onVideoOpened}
                className="mt-6 inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-[13px] text-white transition-colors"
              >
                Watch the NeetCode explanation
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.5} />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Footer: where else to read about it */}
      <div className="h-10 px-2 border-t border-white/[0.08] flex items-center gap-1 flex-shrink-0">
        {(problem.url || problem.link) && (
          <a href={problem.url || problem.link} target="_blank" rel="noopener noreferrer" className={toolButton}>
            <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
            LeetCode
          </a>
        )}
        {problem.video && (
          <a href={problem.video} target="_blank" rel="noreferrer" onClick={onVideoOpened} className={toolButton}>
            <Play className="w-3.5 h-3.5" strokeWidth={1.5} />
            Explanation
          </a>
        )}
      </div>
    </section>
  );
}
