import React, { useState } from 'react';
import { Check, Minus } from 'lucide-react';
import SectionHead, { Panel } from './SectionHead';
import { rv } from './ink';

// Mirrors FREE_FEATURES and PRO_FEATURES on the pricing page. "soon" marks Pro features not built yet
const GROUPS = [
  {
    name: 'Plan and practice',
    rows: [
      { text: 'One active plan that follows your target date', free: true },
      { text: 'Code editor with run and submit, in 4 languages', free: true },
      { text: 'Problem log, streak and solve heatmap', free: true },
      { text: 'Company-wise sheets', soon: true },
      { text: 'Mock interview mode: 2 problems in 45 minutes', soon: true },
    ],
  },
  {
    name: 'Revision',
    rows: [
      { text: 'Reviews at 3, 7 and 21 days', free: true },
      { text: 'Smart revision: shaky problems sooner, solid ones later' },
      { text: 'Morning email with the day’s plan and reviews', soon: true },
    ],
  },
  {
    name: 'Feedback',
    rows: [
      { text: 'Solved by difficulty and weekly pace', free: true },
      { text: 'AI code review: time and space, whether it’s optimal, one tip' },
      { text: 'Code score out of 100 after each submit' },
      { text: 'Weak topics and an on-track check for your date', soon: true },
    ],
  },
];

const Yes = () => <Check className="w-4 h-4 mx-auto text-slate-900 dark:text-white" strokeWidth={1.5} aria-label="Included" />;
const No = () => <Minus className="w-4 h-4 mx-auto text-slate-400 dark:text-slate-600" strokeWidth={1.5} aria-label="Not included" />;

/** Free and Pro side by side, one feature group at a time */
export default function FreeVsPro({ onNavigate }) {
  const [g, setG] = useState(0);
  const group = GROUPS[g];

  return (
    <section id="compare" className="scroll-mt-24">
      <SectionHead title="Free to practice. Pro for the last mile" caption="Pro is ₹199 a month or ₹1,499 a year, and never renews by itself" />
      <Panel className="overflow-hidden grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)]">
        <div {...rv(0)} className="p-3 md:border-r border-b md:border-b-0 border-slate-200 dark:border-white/[0.06] flex md:flex-col gap-1 overflow-x-auto">
          {GROUPS.map((x, i) => (
            <button
              key={x.name}
              type="button"
              aria-pressed={g === i}
              onClick={() => setG(i)}
              className={`shrink-0 text-left px-3 py-3 rounded-xl transition-colors ${g === i ? 'bg-white dark:bg-white/[0.06]' : 'hover:bg-white/60 dark:hover:bg-white/[0.03]'}`}
            >
              <span className={`block text-[15px] ${g === i ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{x.name}</span>
              <span className="block mt-0.5 text-xs text-slate-500">{x.rows.length} features</span>
            </button>
          ))}
        </div>

        <div>
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/[0.06]">
                <th className="h-14 px-5 text-left font-normal text-slate-500 text-[13px]">{group.name}</th>
                <th className="w-24 sm:w-36 font-medium text-slate-900 dark:text-white">Free</th>
                <th className="w-24 sm:w-36 font-medium text-brand-600 dark:text-brand-400 bg-brand-500/[0.06]">Pro</th>
              </tr>
            </thead>
            <tbody>
              {group.rows.map((r, i) => (
                <tr key={r.text} {...rv(i + 1)} className="border-b border-slate-200 dark:border-white/[0.06]">
                  <td className="h-14 px-5 text-slate-700 dark:text-slate-300">
                    {r.text}
                    {r.soon && <span className="ml-2 text-xs text-slate-500">Soon</span>}
                  </td>
                  <td>{r.free ? <Yes /> : <No />}</td>
                  <td className="bg-brand-500/[0.06]">{r.soon ? <span className="block text-center text-xs text-slate-500">Soon</span> : <Yes />}</td>
                </tr>
              ))}
              <tr>
                <td className="h-20 px-5" />
                <td className="text-center">
                  <button type="button" onClick={() => onNavigate && onNavigate('/practice/dsa')} className="h-9 px-3 rounded-lg text-[13px] text-slate-900 dark:text-white bg-white dark:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16] transition-colors">
                    Start free
                  </button>
                </td>
                <td className="text-center bg-brand-500/[0.06]">
                  <button type="button" onClick={() => onNavigate && onNavigate('/pricing')} className="btn-primary-glow h-9 px-4 rounded-lg text-[13px] font-medium">
                    Get Pro
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  );
}
