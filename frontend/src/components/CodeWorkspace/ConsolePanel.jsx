import React from 'react';
import { Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { decodeEntities } from '../../services/execution/testCases';
import NextUpCard from '../practice/NextUpCard';
import { card, tabClass, iconButton, squareClass } from './styles';
import { clip } from './statement';

/** The console card: sample test cases with a square each, and the Result tab with the verdict */
export default function ConsolePanel({
  bottomTab, collapsed, onShowTab, onToggle, executionResult, sampleCases, activeTestIndex, onSelectCase,
  selfRating, onRate, showRating, onOpenProblem, next, stuckOpen, onAskEasier,
}) {
  const activeCase = sampleCases[activeTestIndex] || sampleCases[0];
  const results = executionResult?.results || [];
  const passedCount = results.filter((r) => r.passed).length;
  const caseState = (i) => (results[i] ? (results[i].passed ? 'pass' : 'fail') : null);

  return (
    <section className={card} aria-label="Console">
      <div className="h-11 pl-4 pr-2 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0">
        <div className="h-full flex items-center gap-6">
          <button onClick={() => onShowTab('testcases')} className={tabClass(bottomTab === 'testcases' && !collapsed)}>
            <Terminal className="w-4 h-4" strokeWidth={1.5} />
            Test cases
          </button>
          <button onClick={() => onShowTab('result')} className={tabClass(bottomTab === 'result' && !collapsed)}>
            Result
            {executionResult && (
              <span className={`w-2 h-2 rounded-[2px] ${executionResult.success ? 'bg-emerald-400' : 'bg-rose-400'}`} aria-hidden />
            )}
          </button>
        </div>
        <button
          onClick={onToggle}
          title={collapsed ? 'Show the console' : 'Hide the console'}
          aria-label={collapsed ? 'Show the console' : 'Hide the console'}
          aria-expanded={!collapsed}
          className={iconButton}
        >
          {collapsed ? <ChevronUp className="w-4 h-4" strokeWidth={1.5} /> : <ChevronDown className="w-4 h-4" strokeWidth={1.5} />}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4">
        {bottomTab === 'testcases' && (
          <div>
            <div className="flex flex-wrap items-center gap-1">
              {sampleCases.map((c, i) => (
                <button
                  key={c.id || i}
                  onClick={() => onSelectCase(i)}
                  className={`h-8 px-3 inline-flex items-center gap-2 rounded-lg text-[13px] transition-colors ${
                    activeTestIndex === i
                      ? 'bg-white/[0.06] text-white'
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-[2px] ${squareClass(caseState(i))}`} aria-hidden />
                  Case {i + 1}
                </button>
              ))}
            </div>

            {activeCase ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Input</p>
                  <pre className="mt-2 p-3 rounded-[10px] bg-ink-900 border border-white/[0.06] font-mono text-[13px] text-slate-200 whitespace-pre-wrap">{decodeEntities(activeCase.input)}</pre>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Expected</p>
                  <pre className="mt-2 p-3 rounded-[10px] bg-ink-900 border border-white/[0.06] font-mono text-[13px] text-slate-200 whitespace-pre-wrap">{decodeEntities(activeCase.expected)}</pre>
                </div>
                {results[activeTestIndex] && !results[activeTestIndex].error && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-500">Your output</p>
                    <pre className={`mt-2 p-3 rounded-[10px] bg-ink-900 border border-white/[0.06] font-mono text-[13px] whitespace-pre-wrap ${results[activeTestIndex].passed ? 'text-slate-200' : 'text-rose-400'}`}>{results[activeTestIndex].actual}</pre>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-4 text-[13px] text-slate-500">This problem has no sample cases yet</p>
            )}
          </div>
        )}

        {bottomTab === 'result' && (
          !executionResult ? (
            <div className="h-full min-h-[120px] flex items-center justify-center text-[13px] text-slate-500">
              Run to check the sample cases, or submit to check them all
            </div>
          ) : (
            <div>
              {/* Verdict: the moment of this screen */}
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className={`text-[22px] leading-none font-medium ${executionResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {executionResult.verdict}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {executionResult.type === 'submit' ? 'Submitted' : 'Sample cases'} ·{' '}
                    <span className="font-mono tabular-nums">{passedCount} / {results.length} passed</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[22px] leading-none tabular-nums text-white">
                    {executionResult.runtimeMs}<span className="ml-1 text-[13px] text-slate-500">ms</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">Runtime</div>
                </div>
              </div>

              {executionResult.type === 'submit' && executionResult.success && showRating && (
                <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="How hard was this problem for you">
                  <span className="text-[13px] text-slate-400">How did that feel?</span>
                  {[['easy', 'Easy'], ['ok', 'OK'], ['hard', 'Hard']].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selfRating === value}
                      onClick={() => onRate(value)}
                      className={`h-7 px-3 rounded-lg text-[13px] border transition-colors ${
                        selfRating === value
                          ? 'bg-white/[0.08] border-white/[0.16] text-white'
                          : 'border-white/[0.08] text-slate-400 hover:text-white hover:border-white/[0.14]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  {selfRating && <span className="text-xs text-slate-500">Saved</span>}
                </div>
              )}

              {executionResult.type === 'submit' && executionResult.success && onOpenProblem && (
                <div className="mt-4">
                  <NextUpCard compact rec={next.rec} loading={next.loading} onOpen={onOpenProblem} onSkip={next.skip} />
                </div>
              )}

              {/* Couldn't get it? Say so and get an easier problem to build up with */}
              {!executionResult.success && onOpenProblem && (
                <div className="mt-4">
                  {stuckOpen ? (
                    <NextUpCard compact rec={next.rec} loading={next.loading} onOpen={onOpenProblem} onSkip={next.skip} />
                  ) : (
                    <p className="text-[13px] text-slate-400">
                      Stuck on this one?{' '}
                      <button type="button" onClick={onAskEasier}
                        className="text-white underline underline-offset-4 decoration-white/30 hover:decoration-white rounded-sm">
                        Suggest an easier problem
                      </button>
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-1" aria-label={`${passedCount} of ${results.length} cases passed`}>
                {results.map((r, i) => (
                  <span
                    key={i}
                    title={`Case ${r.testCaseIndex}: ${r.passed ? 'passed' : 'failed'}`}
                    className={`w-3 h-3 rounded-[3px] ${r.passed ? 'bg-brand-500' : 'bg-rose-500'}`}
                  />
                ))}
              </div>

              <ul className="mt-6 divide-y divide-white/[0.06] border-t border-white/[0.06]">
                {results.map((res, i) => (
                  <li key={i} className="py-3 font-mono text-[13px]">
                    <div className="flex items-center justify-between font-sans">
                      <span className="text-slate-300">Case {res.testCaseIndex}</span>
                      <span className={res.passed ? 'text-emerald-400' : 'text-rose-400'}>
                        {res.passed ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                    {res.error ? (
                      <p className="mt-2 text-rose-400 whitespace-pre-wrap">{res.error}</p>
                    ) : (
                      <dl className="mt-2 grid grid-cols-[80px_minmax(0,1fr)] gap-x-2 gap-y-1">
                        <dt className="text-slate-500">Output</dt>
                        <dd className={`break-all ${res.passed ? 'text-slate-200' : 'text-rose-400'}`} title={res.actual}>{clip(res.actual)}</dd>
                        <dt className="text-slate-500">Expected</dt>
                        <dd className="text-slate-200 break-all" title={res.expected}>{clip(res.expected)}</dd>
                      </dl>
                    )}
                    {res.logs && (
                      <pre className="mt-2 p-2 rounded-lg bg-ink-850 text-xs text-slate-400 whitespace-pre-wrap">{res.logs}</pre>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )
        )}
      </div>
    </section>
  );
}
