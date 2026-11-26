import React from 'react';
import { useReveal } from './ink';

/** Section title on the left, a short line on the right, over the section's panel */
export default function SectionHead({ title, caption, action }) {
  return (
    <div className="land-col flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-8">
      <h2 className="text-[28px] sm:text-[36px] leading-[1.15] tracking-[-0.02em] text-slate-900 dark:text-white">{title}</h2>
      {action || (caption && <p className="text-sm text-slate-500 dark:text-slate-400 sm:pb-2">{caption}</p>)}
    </div>
  );
}

/** The big rounded surface each section's content sits in: edge to edge, its content centered.
 *  It fades in when it scrolls into view, then the cards marked with rv(i) inside it follow */
export function Panel({ className = '', children }) {
  const reveal = useReveal();
  return (
    <div {...reveal} className="reveal mt-6 rounded-[24px] border border-slate-200 dark:border-white/[0.06] bg-slate-100/70 dark:bg-ink-850">
      <div className={`land-col ${className}`}>{children}</div>
    </div>
  );
}
