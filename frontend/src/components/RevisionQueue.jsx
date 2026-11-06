import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  RotateCcw, Brain, CheckCircle2, Clock, HelpCircle,
  Eye, ExternalLink, Sparkles, Award, ArrowRight,
  BookmarkCheck, Calendar
} from 'lucide-react';
import { api } from '../services/api';

export default function RevisionQueue({ setActiveTab, onOpenProblemModal }) {
  const [revisionProblems, setRevisionProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadQueue = async () => {
    try {
      const data = await api.getProblems();
      // Problems that need revision: either flagged with needsRevision or status is not Independently
      const queue = (data || []).filter(
        p => p.needsRevision || p.solveStatus === 'Needed Hint' || p.solveStatus === 'Looked at Solution'
      );
      setRevisionProblems(queue);
    } catch (e) {
      console.warn("Failed to load revision queue", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleMarkMastered = async (id) => {
    try {
      await api.toggleRevision(id);
      setRevisionProblems(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[28px] sm:text-[32px] leading-[1.15] font-medium tracking-[-0.02em] text-slate-900 dark:text-white">
              Revision
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Problems you needed a hint or the editorial for. Solve them again without help to make the pattern stick.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-mono font-medium">
            Pending Review: {revisionProblems.length}
          </span>
        </div>
      </div>

      {/* Revision List */}
      {revisionProblems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-black/80 border border-slate-200 dark:border-white/[0.08] space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-medium text-slate-900 dark:text-white">Nothing to revise today</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Problems you solve with a hint, or mark for review, show up here on their revision day.
          </p>
          <button
            onClick={() => setActiveTab && setActiveTab('problems')}
            className="px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition-colors"
          >
            Browse solved problems
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {revisionProblems.map((p) => {
            const isEasy = p.difficulty === 'Easy';
            const isMed = p.difficulty === 'Medium';
            const isHard = p.difficulty === 'Hard';

            return (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-white dark:bg-ink-850 border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-white/[0.14] transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
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
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.08]">
                      {p.topic}
                    </span>
                  </div>

                  <span className="text-xs font-mono text-amber-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Review Due
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-medium text-slate-900 dark:text-white">
                    {p.title}
                  </h3>
                  {p.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                      "{p.notes}"
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Initial Status:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{p.solveStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recall Goal:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Solve without hints</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5 text-xs">
                  <button
                    onClick={() => handleMarkMastered(p.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-medium transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Mastered</span>
                  </button>

                  {p.link && (
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 font-medium transition-colors"
                    >
                      <span>Re-Attempt</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
