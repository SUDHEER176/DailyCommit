import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckSquare, Calendar, Clock, ArrowRight,
  Plus, CheckCircle2, Circle, Flame, Target,
  ArrowRightCircle, Tag, RotateCcw
} from 'lucide-react';
import { api } from '../services/api';

export default function DailyPlanner({ setActiveTab, onOpenTaskModal }) {
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    try {
      const data = await api.getTasks();
      setTasks(data || []);
    } catch (e) {
      console.warn("Failed to load tasks", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleToggle = async (id) => {
    try {
      await api.toggleTask(id);
      setTasks(prev =>
        prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
      );
    } catch (e) {
      console.warn("Failed to toggle task", e);
    }
  };

  const handleCarryOver = async (id) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      await api.carryOverTask(id, tomorrowStr);
      setTasks(prev =>
        prev.map(t =>
          t.id === id ? { ...t, date: tomorrowStr, carriedOver: true } : t
        )
      );
    } catch (e) {
      console.warn("Failed to carry over task", e);
    }
  };

  // Filter tasks for selected date
  const dayTasks = tasks.filter(t => t.date === selectedDate || (!t.date && selectedDate === new Date().toISOString().split('T')[0]));
  const completedCount = dayTasks.filter(t => t.completed).length;
  const totalMinutes = dayTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 30), 0);
  const completedMinutes = dayTasks
    .filter(t => t.completed)
    .reduce((sum, t) => sum + (t.estimatedMinutes || 30), 0);
  const pct = dayTasks.length > 0 ? Math.round((completedCount / dayTasks.length) * 100) : 0;

  const getPriorityBadge = (p) => {
    switch (p?.toLowerCase()) {
      case 'high':
        return 'text-rose-600 dark:text-rose-400 border-transparent';
      case 'medium':
        return 'text-amber-600 dark:text-amber-400 border-transparent';
      case 'low':
        return 'text-brand-600 dark:text-brand-400 border-transparent';
      default:
        return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/[0.08]';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── SIMPLE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-ink-850 transition-colors">
        <div className="space-y-1.5">
          <span className="eyebrow">Daily study planner</span>
          <h2 className="text-[28px] sm:text-[32px] leading-[1.15] font-medium tracking-[-0.02em] text-slate-900 dark:text-white">
            Daily planner
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            Time-box the day’s problems. Finishing your list keeps the streak going.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenTaskModal && onOpenTaskModal()}
            className="btn-primary-glow inline-flex items-center justify-center gap-2 h-10 px-4 rounded-[10px] text-sm font-medium active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add task</span>
          </button>
        </div>
      </div>

      {/* ── DAILY SUMMARY & TIME BUDGET GAUGE ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Date Selector */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-ink-850 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-400">Date</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm font-medium text-slate-900 dark:text-white bg-transparent border-none p-0 focus:outline-none cursor-pointer"
            />
          </div>
          <Calendar className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        </div>

        {/* Task Completion Progress */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-ink-850 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Completed Tasks</span>
            <span className="font-medium text-slate-900 dark:text-white">{completedCount} / {dayTasks.length}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-white/10 h-2 rounded-full overflow-hidden">
            <div
              className="bg-brand-600 h-full rounded-full transition-colors duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Time Budget */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-ink-850 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Study Budget</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {completedMinutes} / {totalMinutes || 60} min
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-white/10 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-colors duration-500"
              style={{ width: `${totalMinutes ? Math.round((completedMinutes / totalMinutes) * 100) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── TODAY'S TASK LIST ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-ink-850 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Planned for {selectedDate === new Date().toISOString().split('T')[0] ? "Today" : selectedDate} ({dayTasks.length} Tasks)
          </span>
          <span className="text-[11px] text-slate-400">Click circle to complete</span>
        </div>

        {dayTasks.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <CheckSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No tasks scheduled for this date
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Plan 2 to 4 high-priority algorithmic drills to maintain your daily study momentum.
            </p>
            <button
              onClick={() => onOpenTaskModal && onOpenTaskModal()}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors"
            >
              + Add a Task
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {dayTasks.map((t) => (
              <div
                key={t.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggle(t.id)}
                    className="flex-shrink-0 text-slate-400 hover:text-brand-600 transition-colors"
                  >
                    {t.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-brand-500" />
                    )}
                  </button>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${getPriorityBadge(t.priority)}`}>
                        {t.priority || 'Medium'}
                      </span>
                      {t.topic && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08]">
                          {t.topic}
                        </span>
                      )}
                      {t.carriedOver && (
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-500/10 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-500/20">
                          Carried Over
                        </span>
                      )}
                    </div>

                    <div className={`text-sm font-medium text-slate-900 dark:text-white truncate ${t.completed ? 'line-through opacity-60' : ''}`}>
                      {t.title}
                    </div>
                  </div>
                </div>

                {/* Right time & rollover */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t.estimatedMinutes || 30}m</span>
                  </span>

                  {!t.completed && (
                    <button
                      onClick={() => handleCarryOver(t.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                      title="Carry over to tomorrow"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
