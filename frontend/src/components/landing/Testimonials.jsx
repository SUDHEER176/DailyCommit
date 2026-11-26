import React from 'react';
import { TESTIMONIALS } from '@/data/testimonials';
import SectionHead from './SectionHead';

/** Learner quotes in a three column grid. Renders nothing until real quotes are added. */
export default function Testimonials() {
  if (!TESTIMONIALS.length) return null;
  return (
    <section>
      <SectionHead title="Where learners landed" caption="In their own words" />
      <ul className="land-col mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        {TESTIMONIALS.map((t) => (
          <li key={t.name} className="flex flex-col rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-ink-850 p-6">
            <blockquote className="text-[15px] leading-[1.6] text-slate-700 dark:text-slate-200">“{t.quote}”</blockquote>
            <div className="mt-auto pt-6 flex items-center gap-3">
              <span className="grid place-items-center w-9 h-9 rounded-full bg-slate-100 dark:bg-ink-800 text-sm text-slate-600 dark:text-slate-300" aria-hidden>
                {t.name.charAt(0)}
              </span>
              <span>
                <span className="block text-sm text-slate-900 dark:text-white">{t.name}</span>
                {t.role && <span className="block text-[13px] text-slate-500">{t.role}</span>}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
