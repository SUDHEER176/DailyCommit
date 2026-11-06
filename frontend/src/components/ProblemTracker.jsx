import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search, ExternalLink, Bookmark, BookmarkCheck,
  CheckCircle2, HelpCircle, Eye, Filter, Plus,
  Code2, Tag, Clock, ArrowUpDown, Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function ProblemTracker({ onOpenProblemModal, setActiveTab, onOpenCodeEditor }) {
  const [problems, setProblems] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(true);

  // Load problems from API / localStorage
  const loadProblems = async () => {
    try {
      const data = await api.getProblems();
      setProblems(data || []);
    } catch (e) {
      console.warn("Failed to load problems", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProblems();
  }, []);

  const handleToggleRevision = async (id) => {
    try {
      await api.toggleRevision(id);
      setProblems(prev =>
        prev.map(p => (p.id === id ? { ...p, needsRevision: !p.needsRevision } : p))
      );
    } catch (e) {
      console.error(e);
    }
  };

  // Filter problems based on search, difficulty, topic, status
  const filteredProblems = problems.filter(p => {
    const matchesSearch =
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.topic?.toLowerCase().includes(search.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesDifficulty =
      selectedDifficulty === 'All' || p.difficulty === selectedDifficulty;

    const matchesTopic =
      selectedTopic === 'All' || p.topic?.toLowerCase().includes(selectedTopic.toLowerCase());

    const matchesStatus =
      selectedStatus === 'All' ||
      (selectedStatus === 'Independent' && p.solveStatus === 'Independently') ||
      (selectedStatus === 'Hint Used' && p.solveStatus === 'Needed Hint') ||
      (selectedStatus === 'Editorial' && p.solveStatus === 'Looked at Solution');

    return matchesSearch && matchesDifficulty && matchesTopic && matchesStatus;
  });

  const topics = [
    'All',
    'Arrays',
    'Two Pointers',
    'Sliding Window',
    'Stacks & Queues',
    'Linked Lists',
    'Trees',
    'Graphs',
    'Dynamic Programming'
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Title and "Log New Problem" Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[28px] sm:text-[32px] leading-[1.15] font-medium tracking-[-0.02em] text-slate-900 dark:text-white">
              Problems
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Every problem you have logged, with how you solved it. Star the tricky ones to send them to revision.
          </p>
        </div>

        <button
          onClick={onOpenProblemModal}
          className="btn-primary-glow inline-flex items-center justify-center gap-2 h-10 px-4 rounded-[10px] text-sm font-medium active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Log problem</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-ink-850 border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.08] text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/[0.08]">
            {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  selectedDifficulty === diff
                    ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/[0.08]">
            {['All', 'Independent', 'Hint Used', 'Editorial'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  selectedStatus === status
                    ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Horizontal Filter Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
          <span className="text-slate-400 font-medium whitespace-nowrap mr-1">Topic:</span>
          {topics.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`px-3 py-1 rounded-lg whitespace-nowrap transition-colors ${
                selectedTopic === t
                  ? 'bg-brand-500 text-white font-medium shadow-xs'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Problem Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span>Showing {filteredProblems.length} of {problems.length} Problems</span>
        </div>

        {filteredProblems.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-black/60 border border-slate-200 dark:border-white/[0.08]">
            <Code2 className="w-10 h-10 mx-auto text-slate-400 mb-2 stroke-[1.5]" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No problems found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or log a new problem above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredProblems.map((p) => {
              const isEasy = p.difficulty === 'Easy';
              const isMed = p.difficulty === 'Medium';
              const isHard = p.difficulty === 'Hard';

              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-white dark:bg-black/80 border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] transition-colors shadow-xs flex flex-col justify-between gap-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Difficulty Badge */}
                        <span
                          className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-md ${
                            isEasy
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isMed
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {p.difficulty}
                        </span>

                        {/* Topic Tag */}
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.08]">
                          {p.topic}
                        </span>

                        {/* Solve Status Badge */}
                        <span className="font-mono text-xs text-slate-500">
                          {p.solveStatus === 'Independently' ? 'Independent' : p.solveStatus === 'Needed Hint' ? 'Needed Hint' : 'Editorial Solution'}
                        </span>
                      </div>

                      {p.timeSpentMinutes && (
                        <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {p.timeSpentMinutes} min
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-medium text-slate-900 dark:text-white ">
                      {p.title}
                    </h3>

                    {p.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                        "{p.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5 text-xs">
                    <button
                      onClick={() => handleToggleRevision(p.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
                        p.needsRevision
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium'
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                    >
                      {p.needsRevision ? (
                        <>
                          <BookmarkCheck className="w-3.5 h-3.5" />
                          <span>In Revision Queue</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>Revise Later</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenCodeEditor && onOpenCodeEditor(p)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 dark:text-brand-400 font-medium transition-colors"
                        title="Open in built-in LeetCode workspace"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Code</span>
                      </button>

                      {p.link && (
                        <a
                          href={p.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium"
                          title="Open on LeetCode.com"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
