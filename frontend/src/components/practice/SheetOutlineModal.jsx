import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SheetIcon from './SheetIcon';

/** What a sheet that isn't written yet will cover, with a way into DailyCode 150 meanwhile */
export default function SheetOutlineModal({ sheet, onClose, onOpenPlan }) {
  return (
    <AnimatePresence>
      {sheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl bg-ink-850 border border-white/[0.08] flex flex-col overflow-hidden text-slate-100"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/[0.08] flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-ink-800 border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                  <SheetIcon sheet={sheet} size={28} />
                </div>
                <div>
                  <span className="text-xs text-slate-500">Coming soon</span>
                  <h2 className="mt-1 text-xl font-medium text-white">
                    {sheet.title}
                  </h2>
                  <p className="text-[13px] text-slate-400 mt-1">
                    {sheet.description}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 grid place-items-center rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Outline: what the sheet will cover */}
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-[13px] text-slate-400">
                We’re still writing the problems for this sheet. Here’s what it will cover.
              </p>
              <ol className="mt-4 divide-y divide-white/[0.06] border-y border-white/[0.06]">
                {sheet.syllabus.map((step, i) => (
                  <li key={step} className="h-11 px-1 flex items-center gap-4 text-[13px] sm:text-sm text-slate-200">
                    <span className="w-6 font-mono text-xs tabular-nums text-slate-500">{String(i + 1).padStart(2, '0')}</span>
                    <span className="truncate">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Footer: the sheet that works today */}
            <div className="p-4 px-6 border-t border-white/[0.08] bg-ink-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-[13px] text-slate-500">
                Until then, DailyCode 150 covers the same core patterns
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="h-9 px-3 rounded-lg text-[13px] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => { onClose(); onOpenPlan(); }}
                  className="h-9 px-4 rounded-lg btn-primary-glow font-medium text-[13px] inline-flex items-center gap-2 active:scale-[0.98]"
                >
                  Open DailyCode 150
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
