import React from 'react';
import { Check } from 'lucide-react';

/** The square "solved" toggle used on sheet rows and day cards */
export default function SolvedCheckbox({ question, onToggle, className = '', withTooltip = false }) {
  const q = question;
  return (
    <button
      onClick={() => onToggle(q)}
      aria-label={q.completed ? `Mark ${q.title} not solved` : `Mark ${q.title} solved`}
      title={withTooltip ? (q.completed ? 'Mark not solved' : 'Mark solved') : undefined}
      className={`rounded-[4px] ${className}`}
    >
      {q.completed ? (
        <span className="grid place-items-center w-4 h-4 rounded-[4px] bg-brand-500 text-white">
          <Check className="w-3 h-3" strokeWidth={2.5} />
        </span>
      ) : (
        <span className="block w-4 h-4 rounded-[4px] border border-white/[0.14] hover:border-white/30 transition-colors" />
      )}
    </button>
  );
}
