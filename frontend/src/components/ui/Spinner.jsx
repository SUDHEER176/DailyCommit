import React from 'react';

/**
 * Spinner for in-app loading states (buttons, panels, page sections).
 *   <Spinner />                      small inline spinner
 *   <Spinner size={32} label="Loading problems" />
 *   <PageLoader label="Loading your dashboard" />   centered block
 */
export default function Spinner({ size = 18, className = '', label = 'Loading' }) {
  return (
    <span role="status" aria-label={label} className={`inline-flex ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin motion-reduce:[animation-duration:2s]"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="2.5" opacity="0.15" />
        <path d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5" stroke="#0066FF" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function PageLoader({ label = 'Loading', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-24 text-slate-500 dark:text-slate-400 ${className}`}>
      <Spinner size={28} label={label} />
      <p className="text-sm">{label}</p>
    </div>
  );
}
