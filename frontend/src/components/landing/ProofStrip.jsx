import React from 'react';
import { PROBLEM_COUNT, TOPIC_COUNT } from '@/lib/practice';
import { Ink, useInkSheet } from './ink';

const FACTS = [
  { value: '4', label: 'languages in the editor' },
  { value: '3 · 7 · 21', label: 'days until each review' },
  { value: '₹0', label: 'to start, no card' },
];

/** A strip of what's in the box: the list on the left in handwriting, three facts on the right */
export default function ProofStrip() {
  const ink = useInkSheet();
  return (
    <section {...ink} className="ink-sheet rounded-[24px] border border-slate-200 dark:border-white/[0.06] bg-slate-100/70 dark:bg-ink-850 px-6 py-6 sm:px-8">
      <div className="land-col flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div>
        <p className="font-hand text-[34px] sm:text-[40px] leading-none text-slate-900 dark:text-white">
          <Ink><span className="marker tabular-nums" style={{ '--marker-at': '1.1s' }}>{PROBLEM_COUNT} problems</span>, {TOPIC_COUNT} topics</Ink>
        </p>
        <p className="ink-fade mt-2 text-[15px] text-slate-500 dark:text-slate-400" style={{ '--at': '0.5s' }}>One list, in the order interviews build on</p>
      </div>
      <ul className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-white/[0.08]">
        {FACTS.map((f, i) => (
          <li key={f.label} className="px-4 sm:px-6 text-center">
            <div className="font-hand text-[26px] leading-none text-slate-900 dark:text-white"><Ink at={1.2 + i * 0.4}>{f.value}</Ink></div>
            <div className="ink-fade mt-2 text-xs text-slate-500" style={{ '--at': `${1.4 + i * 0.4}s` }}>{f.label}</div>
          </li>
        ))}
      </ul>
      </div>
    </section>
  );
}
