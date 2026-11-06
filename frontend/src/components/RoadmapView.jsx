import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Map, CheckCircle2, Circle, ChevronDown, ChevronRight,
  GraduationCap, Zap, BookOpen, Trophy, Compass,
  Sparkles, Target, Layers, ArrowRight, Calendar, Plus
} from 'lucide-react';

export default function RoadmapView({ setActiveTab }) {
  const [completedTopics, setCompletedTopics] = useState(() => {
    try {
      const saved = localStorage.getItem('completed_roadmap_topics');
      return saved ? JSON.parse(saved) : [
        "Arrays & Dynamic Strings",
        "Two Pointers Technique",
        "Sliding Window Patterns"
      ];
    } catch {
      return [
        "Arrays & Dynamic Strings",
        "Two Pointers Technique",
        "Sliding Window Patterns"
      ];
    }
  });

  const toggleTopic = (topicName) => {
    setCompletedTopics(prev => {
      const next = prev.includes(topicName)
        ? prev.filter(t => t !== topicName)
        : [...prev, topicName];
      try {
        localStorage.setItem('completed_roadmap_topics', JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  };

  const phases = [
    {
      phase: "Phase 1 • Weeks 1-3",
      title: "Foundations & Linear Structures",
      color: "border-brand-500/30 bg-brand-500/5",
      badge: "Essential",
      topics: [
        "Arrays & Dynamic Strings",
        "Two Pointers Technique",
        "Sliding Window Patterns",
        "Hash Maps & Sets",
        "Prefix Sum Arrays"
      ]
    },
    {
      phase: "Phase 2 • Weeks 4-6",
      title: "Hierarchical & Linked Structures",
      color: "border-brand-500/30 bg-brand-500/5",
      badge: "Core",
      topics: [
        "Linked Lists & Fast/Slow Pointers",
        "Stacks & Monotonic Stacks",
        "Binary Trees & Traversals",
        "Binary Search Trees (BST)",
        "Heaps & Priority Queues"
      ]
    },
    {
      phase: "Phase 3 • Weeks 7-9",
      title: "Graphs, Search & Backtracking",
      color: "border-slate-500/30 bg-slate-500/5",
      badge: "Advanced",
      topics: [
        "Breadth-First Search (BFS)",
        "Depth-First Search (DFS)",
        "Topological Sort & DAGs",
        "Union-Find (Disjoint Sets)",
        "Backtracking Permutations"
      ]
    },
    {
      phase: "Phase 4 • Weeks 10-12",
      title: "Dynamic Programming & Optimization",
      color: "border-slate-500/30 bg-slate-500/5",
      badge: "Mastery",
      topics: [
        "1D Dynamic Programming",
        "2D Grid DP & Matrix Paths",
        "0/1 Knapsack & Unbounded",
        "Longest Common Subsequence",
        "Bit Manipulation & Bitmasks"
      ]
    }
  ];

  const allTopics = phases.flatMap(p => p.topics);
  const totalCompleted = completedTopics.length;
  const progressPct = Math.round((totalCompleted / allTopics.length) * 100);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[28px] sm:text-[32px] leading-[1.15] font-medium tracking-[-0.02em] text-slate-900 dark:text-white">
              Roadmap
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Twelve weeks from arrays to dynamic programming. Check a topic when you finish it.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-400">Completed</div>
            <div className="text-lg font-medium font-mono text-brand-600 dark:text-brand-400">
              {totalCompleted} / {allTopics.length} Topics
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-ink-850 border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-700 dark:text-slate-300">Overall Interview Readiness Gauge</span>
          <span className="font-mono text-brand-600 dark:text-brand-400 font-medium">{progressPct}% Complete</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-colors duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* The 4 Core Progression Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {phases.map((ph, idx) => {
          const phaseCompleted = ph.topics.filter(t => completedTopics.includes(t)).length;
          const phasePct = Math.round((phaseCompleted / ph.topics.length) * 100);

          return (
            <div
              key={idx}
              className={`p-6 rounded-2xl border ${ph.color} bg-white dark:bg-black/80 shadow-sm space-y-4 flex flex-col justify-between`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">
                    {ph.phase}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-medium">
                    {phaseCompleted}/{ph.topics.length} Done ({phasePct}%)
                  </span>
                </div>

                <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                  {ph.title}
                </h3>

                <div className="space-y-2 pt-1">
                  {ph.topics.map((t) => {
                    const isDone = completedTopics.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() => toggleTopic(t)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-colors ${
                          isDone
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-medium'
                            : 'bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/[0.14]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          )}
                          <span>{t}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {isDone ? 'Done' : 'Mark done'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                <button
                  onClick={() => setActiveTab && setActiveTab('planner')}
                  className="text-brand-600 dark:text-brand-400 hover:underline font-medium inline-flex items-center gap-1"
                >
                  <span>Plan {ph.badge} in Daily Planner</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setActiveTab && setActiveTab('problems')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Log Problem
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
