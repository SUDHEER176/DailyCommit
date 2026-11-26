import React from 'react';
import { Play, Send, ChevronLeft, PanelLeftClose, PanelLeftOpen, Pause, Timer } from 'lucide-react';
import { iconButton } from './styles';

/** Back, hide the problem, the problem's name, the solve timer, today's square and streak, Run and Submit */
export default function WorkspaceTopBar({
  problem, onBack, statementCollapsed, onToggleStatement, timer, doneToday, streak,
  busy, isRunning, isSubmitting, runStatus, onRun, onSubmit,
}) {
  return (
    <header className="h-12 px-2 rounded-xl border border-white/[0.08] bg-ink-850 flex items-center gap-2 flex-shrink-0">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 h-8 pl-1.5 pr-2.5 rounded-lg text-[13px] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
        Problems
      </button>
      <button
        onClick={onToggleStatement}
        title={statementCollapsed ? 'Show the problem' : 'Hide the problem'}
        aria-label={statementCollapsed ? 'Show the problem' : 'Hide the problem'}
        aria-pressed={statementCollapsed}
        className={iconButton}
      >
        {statementCollapsed ? <PanelLeftOpen className="w-4 h-4" strokeWidth={1.5} /> : <PanelLeftClose className="w-4 h-4" strokeWidth={1.5} />}
      </button>
      <span className="hidden md:block w-px h-5 bg-white/[0.08]" aria-hidden />
      <span className="hidden md:block min-w-0 truncate pl-2 text-[13px] text-slate-300">
        {problem.number ? `${problem.number}. ` : ''}{problem.title}
      </span>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={timer.toggle}
          title={timer.paused ? 'Resume the timer' : 'Pause the timer'}
          aria-label={`${timer.label} on this problem, ${timer.paused ? 'paused' : 'running'}`}
          className={`hidden sm:inline-flex items-center gap-2 h-8 px-2.5 rounded-lg font-mono text-[13px] tabular-nums transition-colors hover:bg-white/[0.06] ${timer.paused ? 'text-slate-500' : 'text-slate-300'}`}
        >
          {timer.paused ? <Pause className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Timer className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.5} />}
          {timer.label}
        </button>

        <span
          className="hidden sm:inline-flex items-center gap-2 h-8 px-2.5 text-[13px] text-slate-500"
          title={doneToday ? 'Today counts toward your streak' : 'An accepted submit fills today’s square'}
        >
          <span className={`w-2.5 h-2.5 rounded-[2px] transition-colors duration-500 ${doneToday ? 'bg-brand-500' : 'bg-[var(--raised)] ring-1 ring-inset ring-white/[0.1]'}`} aria-hidden />
          <span className="font-mono tabular-nums text-white">{streak}</span>
          <span className="hidden lg:inline">day streak</span>
        </span>

        <span className="hidden sm:block w-px h-5 bg-white/[0.08]" aria-hidden />

        <button
          onClick={onRun}
          disabled={busy}
          className="inline-flex items-center gap-2 h-8 px-3 rounded-lg bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-[13px] text-white transition-colors active:scale-[0.98] disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
          {isRunning ? (runStatus || 'Running') : 'Run'}
        </button>
        <button
          onClick={onSubmit}
          disabled={busy}
          className="btn-primary-glow inline-flex items-center gap-2 h-8 px-3.5 rounded-lg text-[13px] font-medium active:scale-[0.98] disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
          {isSubmitting ? (runStatus || 'Submitting') : 'Submit'}
        </button>
      </div>
    </header>
  );
}
