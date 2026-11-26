import React from 'react';
import { Plus, CheckSquare } from 'lucide-react';

/** Today's tasks from the planner, with buttons to open the plan and add a task */
export default function TodayTasksCard({ currentUser, todayTasks, onOpenPlan, onOpenTaskModal }) {
  return (
    <div className="p-6 rounded-2xl bg-ink-850 border border-white/[0.08] space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-medium text-white">Today</h3>
        <span className="font-mono text-xs text-slate-500">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {currentUser || todayTasks.length > 0 ? (
        <div className="space-y-3">
          <div className="space-y-1">
            {todayTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="h-10 px-2.5 rounded-lg hover:bg-white/[0.03] flex items-center justify-between text-[13px]"
              >
                <div className="flex items-center gap-2 overflow-hidden pr-2">
                  {task.completed ? (
                    <span className="cell !w-3.5 !h-3.5 !rounded-[4px]" data-level="4" aria-label="Done" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-[4px] border border-white/[0.14] flex-shrink-0" aria-label="To do" />
                  )}
                  <span className={`truncate ${task.completed ? 'line-through decoration-slate-600 text-slate-500' : 'text-slate-200'}`}>
                    {task.title}
                  </span>
                </div>
                {task.estimatedMinutes && (
                  <span className="font-mono text-xs tabular-nums text-slate-500 flex-shrink-0">
                    {task.estimatedMinutes} min
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 grid grid-cols-2 gap-2 border-t border-white/[0.06]">
            <button
              onClick={onOpenPlan}
              className="h-9 rounded-lg text-[13px] flex items-center justify-center gap-2 bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-white transition-colors active:scale-[0.98]"
            >
              <span>Open plan</span>
            </button>
            <button
              onClick={onOpenTaskModal}
              className="h-9 rounded-lg hover:bg-white/[0.06] text-slate-300 hover:text-white text-[13px] transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" strokeWidth={1.5} />
              <span>Add task</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 space-y-3">
          <CheckSquare className="w-5 h-5 mx-auto text-slate-500" strokeWidth={1.5} aria-hidden />
          <div>
            <h4 className="text-[13px] font-medium text-white">No plan yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-[220px] mx-auto">
              Build a day-by-day plan around your hours and target date.
            </p>
          </div>
          <button
            onClick={onOpenPlan}
            className="w-full h-9 rounded-lg text-[13px] flex items-center justify-center gap-2 bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-white transition-colors active:scale-[0.98]"
          >
            <span>Build my plan</span>
          </button>
        </div>
      )}
    </div>
  );
}
