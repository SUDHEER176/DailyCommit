import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { BRAND } from '@/lib/brand';

/**
 * Features 13 Block (React Bits Pro)
 * Clean Minimalist Accordion List with Floating Preview Card Panel
 */
export default function Features13({
  setActiveTab = () => {},
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const items = [
    {
      index: "01",
      title: "Sprints that draft themselves",
      description: `Tell it your interview date and ${BRAND.name} writes a balanced rotation across LeetCode patterns, daily time limits and revision intervals.`,
      previewHeader: "Next sprint",
      previewBadge: "Drafted",
      previewCaption: "A week of practice, drafted from your interview date",
      previewStatus: "Balanced across 3 pattern categories",
      rows: [
        { label: "Arrays", bars: [{ w: "w-16", color: "bg-slate-200 dark:bg-white/[0.08]" }, { w: "w-12", color: "bg-slate-200 dark:bg-white/[0.08]" }, { w: "w-14", color: "bg-slate-200 dark:bg-white/[0.08]" }] },
        { label: "Search", bars: [{ w: "w-12", color: "bg-slate-200 dark:bg-white/[0.08]" }, { w: "w-28", color: "bg-brand-500" }, { w: "w-10", color: "bg-slate-200 dark:bg-white/[0.08]" }] },
        { label: "Trees", bars: [{ w: "w-20", color: "bg-slate-200 dark:bg-white/[0.08]" }, { w: "w-10", color: "bg-slate-200 dark:bg-white/[0.08]" }, { w: "w-14", color: "bg-slate-200 dark:bg-white/[0.08]" }] },
        { label: "Graphs", bars: [{ w: "w-10", color: "bg-slate-200 dark:bg-white/[0.08]" }, { w: "w-16", color: "bg-slate-200 dark:bg-white/[0.08]" }, { w: "w-18", color: "bg-slate-200 dark:bg-white/[0.08]" }] },
      ]
    },
    {
      index: "02",
      title: "Load that stays level",
      description: "Keeps the daily load steady by balancing easy warmups, medium core patterns and hard challenge problems.",
      previewHeader: "Daily load balance",
      previewBadge: "Optimized",
      previewCaption: "A steady 45 minute session each day",
      previewStatus: "Today: 2 medium, 1 easy",
      rows: [
        { label: "Easy", bars: [{ w: "w-28", color: "bg-brand-500" }, { w: "w-12", color: "bg-slate-200 dark:bg-white/[0.08]" }] },
        { label: "Medium", bars: [{ w: "w-36", color: "bg-brand-500" }, { w: "w-8", color: "bg-slate-200 dark:bg-white/[0.08]" }] },
        { label: "Hard", bars: [{ w: "w-16", color: "bg-slate-200 dark:bg-white/[0.08]" }, { w: "w-6", color: "bg-slate-200 dark:bg-white/[0.08]" }] },
        { label: "Review", bars: [{ w: "w-20", color: "bg-slate-200 dark:bg-white/[0.08]" }, { w: "w-14", color: "bg-slate-200 dark:bg-white/[0.08]" }] },
      ]
    },
    {
      index: "03",
      title: "Recall without the scramble",
      description: "Spaced repetition brings tricky problems back right before you would forget them, so a problem from three weeks ago still feels familiar.",
      previewHeader: "Recall queue",
      previewBadge: "Spaced",
      previewCaption: "Intervals that hold 86% retention",
      previewStatus: "3 problems due for review today",
      rows: [
        { label: "Day 1", bars: [{ w: "w-14", color: "bg-slate-200 dark:bg-white/[0.08]" }, { w: "w-24", color: "bg-brand-500" }] },
        { label: "Day 3", bars: [{ w: "w-32", color: "bg-slate-200 dark:bg-white/[0.08]" }, { w: "w-10", color: "bg-slate-200 dark:bg-white/[0.08]" }] },
        { label: "Day 7", bars: [{ w: "w-20", color: "bg-brand-500" }, { w: "w-16", color: "bg-slate-200 dark:bg-white/[0.08]" }] },
        { label: "Day 14", bars: [{ w: "w-28", color: "bg-slate-200 dark:bg-white/[0.08]" }, { w: "w-12", color: "bg-slate-200 dark:bg-white/[0.08]" }] },
      ]
    },
    {
      index: "04",
      title: "Quiet milestones that actually hold",
      description: "Six weekly checkpoints make sure the foundational patterns hold before you move on to harder topics.",
      previewHeader: "Milestone status",
      previewBadge: "On track",
      previewCaption: "Weekly checkpoints for each topic",
      previewStatus: "Week 2 of 6 complete · 78% mastery",
      rows: [
        { label: "Week 1", bars: [{ w: "w-36", color: "bg-brand-500" }, { w: "w-8", color: "bg-brand-500" }] },
        { label: "Week 2", bars: [{ w: "w-28", color: "bg-brand-500" }, { w: "w-16", color: "bg-slate-200 dark:bg-white/[0.08]" }] },
        { label: "Week 3", bars: [{ w: "w-16", color: "bg-slate-200 dark:bg-white/[0.08]" }, { w: "w-24", color: "bg-slate-200 dark:bg-white/[0.08]" }] },
        { label: "Week 4", bars: [{ w: "w-12", color: "bg-slate-200 dark:bg-white/[0.08]" }, { w: "w-16", color: "bg-slate-200 dark:bg-white/[0.08]" }] },
      ]
    }
  ];

  return (
    <section className="w-full space-y-12">
      
      {/* Top Heading */}
      <div className="space-y-3 max-w-2xl">
        <span className="eyebrow">Planning</span>
        <h2 className="text-[32px] sm:text-[40px] leading-[1.1] font-medium tracking-[-0.02em] text-slate-900 dark:text-white">
          Every problem, already sorted
        </h2>
        <p className="text-base leading-[1.6] text-slate-600 dark:text-slate-400">
          {BRAND.name} drafts balanced rotations, keeps the daily load steady and runs spaced repetition, so prep stops being a daily negotiation with yourself.
        </p>
      </div>

      {/* Two Column Layout: Accordion (Left) + Floating Card Preview Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left 6 Cols: Minimalist Numbered Accordion */}
        <div className="lg:col-span-6 border-t border-slate-200 dark:border-white/[0.08]">
          {items.map((item, idx) => {
            const isOpen = activeIndex === idx;

            return (
              <div
                key={item.index}
                className="border-b border-slate-200 dark:border-white/[0.08] transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className="w-full py-5 flex items-center justify-between text-left group rounded-lg"
                >
                  <div className="flex items-center gap-6 min-w-0 pr-4">
                    <span className="text-xs font-mono text-slate-400 dark:text-slate-500 select-none flex-shrink-0">
                      {item.index}
                    </span>
                    <h3 className={`text-base sm:text-lg font-medium transition-colors ${
                      isOpen 
                        ? 'text-slate-900 dark:text-white' 
                        : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
                    }`}>
                      {item.title}
                    </h3>
                  </div>

                  <div className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 flex-shrink-0 pl-2">
                    <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${isOpen ? "rotate-180 text-slate-600 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"}`} strokeWidth={1.5} />
                  </div>
                </button>

                {/* Expanded Description Drawer */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pl-10 sm:pl-11 pb-5 pr-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Right 6 Cols: Big Preview Container with Floating Card */}
        <div className="lg:col-span-6">
          <div className="relative w-full rounded-2xl bg-slate-100 dark:bg-ink-850 border border-slate-200 dark:border-white/[0.08] p-6 sm:p-12 flex flex-col items-center justify-center min-h-[380px] sm:min-h-[420px] shadow-sm dark:shadow-none transition-colors">
            
            {/* Inner Floating Mockup Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-sm sm:max-w-md bg-white dark:bg-ink-900 border border-slate-200/90 dark:border-white/[0.08] rounded-xl p-6 shadow-sm dark:shadow-none space-y-5"
              >
                {/* Card Top Row */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {items[activeIndex].previewHeader}
                  </span>
                  <span className="font-mono text-xs text-slate-500">
                    {items[activeIndex].previewBadge}
                  </span>
                </div>

                {/* Timeline Pill Bar Rows */}
                <div className="space-y-3 pt-1">
                  {items[activeIndex].rows.map((row, rIdx) => (
                    <div key={rIdx} className="flex items-center gap-3 text-xs">
                      <span className="w-14 font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {row.label}
                      </span>
                      <div className="flex-1 flex items-center gap-1.5 overflow-hidden">
                        {row.bars.map((b, bIdx) => (
                          <div 
                            key={bIdx} 
                            className={`h-2 rounded-sm ${b.w} ${b.color}`} 
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Card Bottom Status */}
                <div className="pt-4 border-t border-slate-200 dark:border-white/[0.06] flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="cell" data-level="4" aria-hidden />
                  <span className="truncate">{items[activeIndex].previewStatus}</span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Bottom Caption Text Below Card */}
            <motion.p 
              key={`caption-${activeIndex}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.1 }}
              className="text-[13px] text-slate-500 text-center mt-6"
            >
              {items[activeIndex].previewCaption}
            </motion.p>

          </div>
        </div>

      </div>

    </section>
  );
}
