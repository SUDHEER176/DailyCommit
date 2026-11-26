import React, { useState } from 'react';
import { Play, Send, CheckCircle2, Lightbulb, FileText, StickyNote } from 'lucide-react';
import SectionHead, { Panel } from './SectionHead';
import { rv } from './ink';

const STEPS = ['Read', 'Attempt', 'Run', 'Submit', 'Score', 'Revise'];

const K = ({ children }) => <span className="text-brand-600 dark:text-brand-400">{children}</span>;
const C = ({ children }) => <span className="text-slate-500">{children}</span>;

function Statement() {
  return (
    <div className="space-y-3 text-[13px] leading-[1.65] text-slate-700 dark:text-slate-300">
      <p className="text-[15px] text-slate-900 dark:text-white">1. Two Sum <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">Easy</span></p>
      <p>Given an array of integers <code className="font-mono text-xs">nums</code> and an integer <code className="font-mono text-xs">target</code>, return the indices of the two numbers that add up to <code className="font-mono text-xs">target</code>.</p>
      <p>Each input has exactly one solution, and the same element can’t be used twice.</p>
      <div className="rounded-lg bg-slate-100 dark:bg-white/[0.04] p-3 font-mono text-xs">
        <div><C>Input</C>  nums = [2, 7, 11, 15], target = 9</div>
        <div><C>Output</C> [0, 1]</div>
      </div>
    </div>
  );
}

function Hints() {
  return (
    <ol className="space-y-3 text-[13px] leading-[1.6]">
      <li className="rounded-lg border border-slate-200 dark:border-white/[0.08] p-3 text-slate-700 dark:text-slate-300">
        <span className="font-mono text-xs text-slate-500">Hint 1</span>
        <p className="mt-1">For each number, the one you need is <code className="font-mono text-xs">target - x</code>. Can you look it up in O(1)?</p>
      </li>
      <li className="rounded-lg border border-dashed border-slate-300 dark:border-white/[0.12] p-3 text-slate-500">Hint 2, tap to show</li>
      <li className="rounded-lg border border-dashed border-slate-300 dark:border-white/[0.12] p-3 text-slate-500">Video walkthrough</li>
    </ol>
  );
}

function Score() {
  const rows = [['Tests', '12 / 12', 'All passed'], ['Time', 'O(n)', 'Optimal'], ['Space', 'O(n)', 'Optimal']];
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[40px] leading-none tabular-nums text-slate-900 dark:text-white">100</span>
        <span className="text-sm text-slate-500">code score</span>
        <span className="ml-auto font-mono text-[11px] px-1.5 py-1 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400">Pro</span>
      </div>
      <ul className="mt-4 divide-y divide-slate-200 dark:divide-white/[0.06]">
        {rows.map(([k, v, g]) => (
          <li key={k} className="flex items-center h-10 text-[13px]">
            <span className="w-16 text-slate-500">{k}</span>
            <span className="flex-1 font-mono text-slate-900 dark:text-white">{v}</span>
            <span className="text-emerald-600 dark:text-emerald-400">{g}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[13px] leading-[1.6] text-slate-600 dark:text-slate-400">One pass with a hash map: check for the complement before storing the number, so an element never pairs with itself.</p>
    </div>
  );
}

function Revise() {
  return (
    <div>
      <p className="text-[13px] text-slate-700 dark:text-slate-300">How did that feel?</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {['Hard', 'OK', 'Easy'].map((r) => (
          <span key={r} className={`h-9 grid place-items-center rounded-lg border text-[13px] ${r === 'Hard' ? 'border-brand-500 text-slate-900 dark:text-white bg-brand-500/10' : 'border-slate-200 dark:border-white/[0.08] text-slate-500'}`}>{r}</span>
        ))}
      </div>
      <p className="mt-6 text-xs text-slate-500">Back in your revision queue on</p>
      <ul className="mt-2 grid grid-cols-3 gap-2">
        {['Day 3', 'Day 7', 'Day 21'].map((d) => (
          <li key={d} className="rounded-lg bg-slate-100 dark:bg-white/[0.04] p-3">
            <span className="cell" data-level="3" aria-hidden />
            <div className="mt-2 text-[13px] text-slate-900 dark:text-white">{d}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const LEFT = [
  { tab: 'Problem', body: <Statement /> },
  { tab: 'Hints', body: <Hints /> },
  { tab: 'Problem', body: <Statement /> },
  { tab: 'Problem', body: <Statement /> },
  { tab: 'Analysis', body: <Score /> },
  { tab: 'Notes', body: <Revise /> },
];

const RESULT = [
  null,
  null,
  { ok: true, text: 'Sample cases', detail: '3 / 3 passed · 2 ms' },
  { ok: true, text: 'Accepted', detail: '12 / 12 tests · 41 ms' },
  { ok: true, text: 'Accepted', detail: '12 / 12 tests · 41 ms' },
  { ok: true, text: 'Accepted', detail: 'Saved to your log' },
];

/** How a problem goes in the code workspace, one step per tab */
export default function SolveFlow() {
  const [step, setStep] = useState(0);
  const left = LEFT[step];
  const result = RESULT[step];
  const tabIcon = { Problem: FileText, Hints: Lightbulb, Analysis: CheckCircle2, Notes: StickyNote };

  return (
    <section id="how-it-works" className="scroll-mt-24">
      <SectionHead title="One problem, start to finish" caption="Read, attempt, run, submit, score, revise" />
      <Panel className="p-4 sm:p-6">
        <div {...rv(0)} className="flex flex-wrap gap-2" role="tablist" aria-label="Steps">
          {STEPS.map((s, i) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={step === i}
              onClick={() => setStep(i)}
              className={`h-9 px-3 rounded-lg text-[13px] border transition-colors ${
                step === i
                  ? 'text-slate-900 dark:text-white bg-white dark:bg-white/[0.08] border-slate-200 dark:border-white/[0.1]'
                  : 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/[0.06] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {i + 1}. {s}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Left: problem side */}
          <div {...rv(1)} className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-ink-900 min-h-[380px]">
            <div className="flex items-center gap-4 h-11 px-4 border-b border-slate-200 dark:border-white/[0.06] text-[13px]">
              {['Problem', 'Hints', 'Analysis', 'Notes'].map((t) => {
                const Icon = tabIcon[t];
                const on = left.tab === t;
                return (
                  <span key={t} className={`inline-flex items-center gap-1.5 h-full border-b-2 ${on ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white' : 'border-transparent text-slate-500'}`}>
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                    {t}
                  </span>
                );
              })}
            </div>
            <div key={step} className="p-4 animate-fadeIn">{left.body}</div>
          </div>

          {/* Right: the editor */}
          <div {...rv(2)} className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-ink-900 flex flex-col min-h-[380px]">
            <div className="flex items-center justify-between h-11 px-4 border-b border-slate-200 dark:border-white/[0.06]">
              <span className="text-[13px] text-slate-700 dark:text-slate-300">Python</span>
              <span className="flex items-center gap-2">
                <span className={`grid place-items-center w-8 h-8 rounded-lg ${step === 2 ? 'on-dark bg-slate-900 text-white dark:bg-white dark:text-ink-900' : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300'}`}><Play className="w-3.5 h-3.5" strokeWidth={1.5} /></span>
                <span className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] ${step === 3 ? 'on-dark bg-brand-500 text-white' : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300'}`}><Send className="w-3.5 h-3.5" strokeWidth={1.5} />Submit</span>
              </span>
            </div>
            <pre className="flex-1 p-4 font-mono text-[13px] leading-[1.8] text-slate-800 dark:text-slate-200 overflow-hidden">
<C>{'1 '}</C><K>class</K> Solution:{'\n'}
<C>{'2 '}</C>    <K>def</K> twoSum(self, nums, target):{'\n'}
<C>{'3 '}</C>        seen = {'{}'}{'\n'}
<C>{'4 '}</C>        <K>for</K> i, x <K>in</K> enumerate(nums):{'\n'}
<C>{'5 '}</C>            <K>if</K> target - x <K>in</K> seen:{'\n'}
<C>{'6 '}</C>                <K>return</K> [seen[target - x], i]{'\n'}
<C>{'7 '}</C>            seen[x] = i
            </pre>
            <div className="h-12 px-4 flex items-center justify-between border-t border-slate-200 dark:border-white/[0.06] text-[13px]">
              {result ? (
                <>
                  <span className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />{result.text}</span>
                  <span className="font-mono text-xs text-slate-500 tabular-nums">{result.detail}</span>
                </>
              ) : (
                <span className="text-slate-500">{step === 0 ? 'Read the problem, then write your approach' : 'Stuck? Open a hint, the timer keeps going'}</span>
              )}
            </div>
          </div>
        </div>
      </Panel>
    </section>
  );
}
