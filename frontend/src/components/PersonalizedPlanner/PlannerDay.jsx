import React from 'react';
import { ArrowRight, FileText, Star } from 'lucide-react';
import SolvedCheckbox from './SolvedCheckbox';
import { dayLevel, difficultyText, fmtDate, iconButton, notesField, solveOptions } from './plannerUtils';

/**
 * Day tab: a strip with one cell per plan day, then the selected day's problems as cards.
 */
export default function PlannerDay({
  plan,
  activeDay,
  selectedDayNum,
  setSelectedDayNum,
  daysCount,
  todayStr,
  notesOpenId,
  setNotesOpenId,
  actions,      // { toggleComplete, toggleDifficult, setSolveStatus, saveNotes, openEditor }
}) {
  const isToday = activeDay?.date === todayStr;
  const dayCompletedCount = activeDay?.questions?.filter((q) => q.completed).length || 0;
  const dayTotalCount = activeDay?.questions?.length || 0;

  return (
    <div className="space-y-4">
      {/* Every day of the plan as a heatmap cell */}
      <section className="p-4 rounded-2xl bg-ink-850 border border-white/[0.08]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] text-slate-400">
            Day <span className="font-mono tabular-nums text-white">{selectedDayNum}</span> of {daysCount}
          </span>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5"><span className="cell" data-level="0" />Not started</span>
            <span className="flex items-center gap-1.5"><span className="cell" data-level="2" />Started</span>
            <span className="flex items-center gap-1.5"><span className="cell" data-level="4" />Done</span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-[3px]">
          {plan?.days?.map((d) => {
            const selected = d.dayNumber === selectedDayNum;
            return (
              <button
                key={d.dayNumber}
                onClick={() => setSelectedDayNum(d.dayNumber)}
                data-level={dayLevel(d)}
                title={`Day ${d.dayNumber} · ${fmtDate(d.date)}${d.date === todayStr ? ' · today' : ''}${d.isRevisionDay ? ' · revision' : ''}`}
                aria-label={`Day ${d.dayNumber}, ${fmtDate(d.date)}`}
                aria-current={selected ? 'date' : undefined}
                className={`cell !w-3.5 !h-3.5 !rounded-[3px] ${
                  selected ? 'ring-1 ring-white ring-offset-1 ring-offset-ink-850' : d.date === todayStr ? 'ring-1 ring-white/40' : 'hover:ring-1 hover:ring-white/30'
                }`}
              />
            );
          })}
        </div>
      </section>

      {/* Selected day header */}
      <div className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-[17px] font-medium text-white flex flex-wrap items-baseline gap-x-3">
            Day {activeDay?.dayNumber}
            <span className="text-[13px] font-normal text-slate-400">{fmtDate(activeDay?.date, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            {isToday && <span className="text-[13px] font-normal text-brand-400">Today</span>}
            {activeDay?.isRevisionDay && <span className="text-[13px] font-normal text-slate-400">Revision day</span>}
          </h2>
          {activeDay?.topics?.length > 0 && <p className="mt-1 text-[13px] text-slate-500">{activeDay.topics.join(' · ')}</p>}
        </div>
        <div className="flex items-center gap-4 font-mono text-xs tabular-nums">
          <span className="text-slate-500">{activeDay?.totalEstimatedMinutes || 60} min</span>
          <span className="text-white">{dayCompletedCount} of {dayTotalCount} solved</span>
        </div>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeDay?.questions?.map((q, idx) => (
          <QuestionCard
            key={q.id || idx}
            question={q}
            notesOpen={notesOpenId === q.id}
            onToggleNotes={() => setNotesOpenId(notesOpenId === q.id ? null : q.id)}
            actions={actions}
          />
        ))}
      </ul>
    </div>
  );
}

/** One problem of the day: solve toggle, meta, notes, how it was solved, star and Solve */
function QuestionCard({ question: q, notesOpen, onToggleNotes, actions }) {
  return (
    <li className={`flex flex-col p-5 rounded-2xl border transition-colors ${
      q.completed ? 'bg-ink-850 border-white/[0.06]' : 'bg-ink-850 border-white/[0.08] hover:border-white/[0.14]'
    }`}>
      <div className="flex items-start gap-3">
        <SolvedCheckbox question={q} onToggle={actions.toggleComplete} className="mt-0.5 flex-shrink-0" withTooltip />
        <div className="min-w-0 flex-1">
          <div className={`text-[15px] leading-5 ${q.completed ? 'text-slate-500 line-through decoration-slate-600' : 'text-white'}`}>
            {q.title}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs">
            <span className="font-mono tabular-nums text-slate-500">{q.number}</span>
            <span className={difficultyText[q.difficulty] || 'text-slate-400'}>{q.difficulty}</span>
            <span className="text-slate-500">· {q.topic}</span>
            <span className="font-mono tabular-nums text-slate-500">· {q.estimatedMinutes || 25} min</span>
          </div>
        </div>
      </div>

      {q.notes && !notesOpen && (
        <p className="mt-3 pl-7 text-xs text-slate-400 line-clamp-2"><span className="text-slate-500">Note · </span>{q.notes}</p>
      )}

      {notesOpen && (
        <textarea
          rows={2}
          autoFocus
          defaultValue={q.notes || ''}
          onBlur={(e) => actions.saveNotes(q, e.target.value)}
          aria-label={`Notes for ${q.title}`}
          placeholder="What tripped you up, and what worked"
          className={`mt-3 w-full ${notesField}`}
        />
      )}

      <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center gap-1">
        <div className="flex items-center h-8 p-0.5 rounded-lg border border-white/[0.08]" role="group" aria-label="How you solved it">
          {solveOptions.map((o) => {
            const on = q.solveStatus === o.key;
            return (
              <button
                key={o.key}
                onClick={() => actions.setSolveStatus(q, o.key)}
                title={o.title}
                aria-pressed={on}
                className={`h-full px-2 rounded-md text-xs transition-colors ${on ? `bg-white/[0.06] ${o.on}` : 'text-slate-500 hover:text-white'}`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => actions.toggleDifficult(q)}
          className={iconButton(q.isDifficult)}
          aria-pressed={!!q.isDifficult}
          aria-label={q.isDifficult ? 'Remove from revision' : 'Star for revision'}
          title={q.isDifficult ? 'Starred for revision' : 'Star for revision'}
        >
          <Star className={`w-4 h-4 ${q.isDifficult ? 'fill-current' : ''}`} strokeWidth={1.5} />
        </button>
        <button
          onClick={onToggleNotes}
          className={iconButton(q.notes || notesOpen)}
          aria-expanded={notesOpen}
          aria-label="Notes"
          title="Notes on mistakes and approach"
        >
          <FileText className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <button
          onClick={() => actions.openEditor(q)}
          className="ml-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-[13px] text-white transition-colors active:scale-[0.98]"
          title="Open in the code editor"
        >
          Solve
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
        </button>
      </div>
    </li>
  );
}
