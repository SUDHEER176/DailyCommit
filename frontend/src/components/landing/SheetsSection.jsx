import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import SectionHead, { Panel } from './SectionHead';
import SheetIcon from '../practice/SheetIcon';
import { SHEETS } from '../practice/sheets';
import { rv } from './ink';

const TABS = ['DSA', 'Core CS', 'System Design'];

/**
 * The practice hub's sheets, by category. Only DailyCode 150 has problems behind it today,
 * so the rest say they are outlines being written.
 */
export default function SheetsSection({ onNavigate }) {
  const [tab, setTab] = useState('DSA');
  const list = SHEETS.filter((s) => s.category === tab);

  return (
    <section id="sheets" className="scroll-mt-24">
      <SectionHead title="Start with one list, branch out later" caption="DailyCode 150, language tracks and core CS" />
      <Panel className="p-4 sm:p-6">
        <div {...rv(0)} className="flex flex-wrap gap-2" role="tablist" aria-label="Sheet categories">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`h-9 px-3 rounded-lg text-[13px] border transition-colors ${
                tab === t
                  ? 'text-slate-900 dark:text-white bg-white dark:bg-white/[0.08] border-slate-200 dark:border-white/[0.1]'
                  : 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/[0.06] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map((s, i) => {
            const live = s.id === 'dailycode-150';
            return (
              <li key={s.id} {...rv(i + 1)} className="flex items-center gap-4 h-16 px-4 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-ink-900">
                <span className="grid place-items-center w-9 h-9 shrink-0 rounded-lg bg-slate-100 dark:bg-white/[0.06]">
                  <SheetIcon sheet={s} size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] text-slate-900 dark:text-white">{s.title}</span>
                  {live && <span className="block text-xs text-slate-500">{s.tag}</span>}
                </span>
                {live ? (
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('/practice/dsa')}
                    className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-[13px] text-slate-900 dark:text-white bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.12] transition-colors"
                  >
                    Explore
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                ) : (
                  <span className="font-mono text-xs text-slate-500">Outline</span>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>
    </section>
  );
}
