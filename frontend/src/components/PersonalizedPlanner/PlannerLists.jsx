import React from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { dayLevel, difficultyText, fmtDate, secondaryButton } from './plannerUtils';

/** Revision tab: starred problems and ones solved with help, each with a Solve again button */
export function PlannerRevision({ revisionQueue = [], onOpenEditor }) {
  return (
    <section className="rounded-2xl bg-ink-850 border border-white/[0.08] overflow-hidden">
      <div className="px-6 py-5 border-b border-white/[0.08]">
        <h2 className="text-[17px] font-medium text-white">Revision</h2>
        <p className="mt-1 text-[13px] text-slate-500">
          Problems you starred, or solved with a hint or the solution. Solve them again without help to make the pattern stick.
        </p>
      </div>

      {revisionQueue.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <Star className="w-5 h-5 mx-auto text-slate-500" strokeWidth={1.5} aria-hidden />
          <p className="mt-3 text-[15px] text-white">Nothing to revise yet</p>
          <p className="mt-1 text-[13px] text-slate-500">Star a tricky problem while you solve it and it shows up here</p>
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {revisionQueue.map((q) => (
            <li key={q.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-xs tabular-nums text-slate-500">{q.number}</span>
                  <span className="text-[15px] text-white">{q.title}</span>
                  <span className={`text-[13px] ${difficultyText[q.difficulty] || 'text-slate-400'}`}>{q.difficulty}</span>
                  <span className="text-[13px] text-slate-500">{q.topic}</span>
                </div>
                {q.notes && <p className="mt-1 text-[13px] text-slate-400 truncate"><span className="text-slate-500">Note </span>{q.notes}</p>}
              </div>
              <button onClick={() => onOpenEditor(q)} className={`${secondaryButton} self-start sm:self-auto`}>
                Solve again
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** All days tab: a card per plan day; clicking one opens it in the Day tab */
export function PlannerAllDays({ days = [], selectedDayNum, onOpenDay }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {days.map((d) => {
        const selected = d.dayNumber === selectedDayNum;
        const done = d.questions.filter((q) => q.completed).length;
        return (
          <button
            key={d.dayNumber}
            onClick={() => onOpenDay(d.dayNumber)}
            className={`text-left rounded-2xl border p-5 transition-colors ${
              selected ? 'bg-ink-800 border-white/[0.14]' : 'bg-ink-850 border-white/[0.08] hover:border-white/[0.14]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[13px] text-white">
                <span className="cell" data-level={dayLevel(d)} aria-hidden />
                Day {d.dayNumber}
                {d.isRevisionDay && <span className="text-slate-500">Revision</span>}
              </span>
              <span className="font-mono text-xs text-slate-500">{fmtDate(d.date)}</span>
            </div>
            <ul className="mt-4 space-y-2">
              {d.questions.map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className={`truncate ${q.completed ? 'text-slate-500 line-through decoration-slate-600' : 'text-slate-300'}`}>{q.title}</span>
                  <span className={`flex-shrink-0 text-xs ${difficultyText[q.difficulty] || 'text-slate-500'}`}>{q.difficulty}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between font-mono text-xs tabular-nums text-slate-500">
              <span>{done} of {d.questions.length} solved</span>
              <span>{d.totalEstimatedMinutes} min</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
