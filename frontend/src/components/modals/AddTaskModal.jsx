import React, { useState } from 'react';
import { X, CheckSquare, Plus, Clock, Tag, Flag } from 'lucide-react';
import { TOPIC_LIST } from '../../data/initialData';

export default function AddTaskModal({ isOpen, onClose, onAddTask, defaultDate }) {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('Arrays & Strings');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [priority, setPriority] = useState('Medium');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title,
      topic,
      estimatedMinutes: Number(estimatedMinutes),
      priority,
      date
    });

    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="surface-highlight animate-modalIn glass-panel p-6 sm:p-7 rounded-2xl max-w-md w-full border border-white/[0.08] shadow-sm space-y-5 bg-ink-900/95">

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Add task</h3>
              <p className="text-xs text-slate-400">Plan today's DSA concepts or problem drills</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
              Task Title / Goal *
            </label>
            <input
              type="text"
              required
              placeholder="Learn Kadane's algorithm and solve 3 problems"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                Topic
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="glass-input w-full px-3 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                {TOPIC_LIST.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                Est. Time (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="300"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="glass-input w-full px-3 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                <option value="High">High priority</option>
                <option value="Medium">Medium priority</option>
                <option value="Low">Low priority</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-medium text-xs active:scale-[0.98] transition-colors"
            >
              Add Task to Plan
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
