"use client";

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

export function useTaskSteps({
  steps = [],
  current = 0,
  failed = false,
}: {
  steps?: any[];
  current?: number;
  failed?: boolean;
}) {
  const complete = !failed && current >= steps.length;

  const rows = steps.map((step, i) => {
    let resolvedStatus = step.status;
    if (!resolvedStatus) {
      resolvedStatus = i < current
        ? "done"
        : i === current && failed
          ? "error"
          : i === current && !complete
            ? "active"
            : "pending";
    }
    return { ...step, status: resolvedStatus };
  });

  const active = rows.find((r) => r.status === "active");
  const sentence = failed
    ? `Failed at ${steps[Math.min(current, steps.length - 1)]?.label ?? "step"}`
    : complete
      ? `All ${steps.length} steps complete`
      : active
        ? `${active.label}, step ${current + 1} of ${steps.length}`
        : "";

  return { rows, complete, failed, sentence };
}

const Tick = (
  <svg viewBox="0 0 16 16" width="10" height="10" fill="none" aria-hidden>
    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Cross = (
  <svg viewBox="0 0 16 16" width="10" height="10" fill="none" aria-hidden>
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/** Status mark: the same square cell the heatmap uses, filled when the step is done */
function StatusCell({ status }: { status: string }) {
  if (status === "done") {
    return (
      <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.16, ease: EASE }}
        className="grid place-items-center size-4 rounded-[4px] bg-brand-500 text-white"
      >
        {Tick}
      </motion.span>
    );
  }
  if (status === "error") {
    return <span className="grid place-items-center size-4 rounded-[4px] bg-rose-500/15 text-rose-500">{Cross}</span>;
  }
  if (status === "active") {
    return <span className="size-4 rounded-[4px] border-[1.5px] border-brand-500" />;
  }
  return <span className="size-4 rounded-[4px] border border-slate-300 dark:border-white/[0.14]" />;
}

export function TaskSteps({
  steps = [],
  current = 0,
  failed = false,
  label = "Task progress",
  className = "",
  onStepClick,
}: {
  steps?: any[];
  current?: number;
  failed?: boolean;
  label?: string;
  className?: string;
  onStepClick?: (row: any, index: number) => void;
}) {
  const { rows, complete, sentence } = useTaskSteps({ steps, current, failed });
  const reduced = useReducedMotion() === true;

  const [spoken, setSpoken] = useState("");
  useEffect(() => {
    if (!sentence) return;
    const t = setTimeout(() => setSpoken(sentence), 500);
    return () => clearTimeout(t);
  }, [sentence]);

  const isInteractive = typeof onStepClick === "function";

  return (
    <div className={`w-full ${className}`}>
      <ol aria-label={label} className="space-y-1">
        {rows.map((row, index) => {
          const isDone = row.status === "done";
          const isActive = row.status === "active";
          const isError = row.status === "error";

          const tone = isDone
            ? "text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-600"
            : isActive
              ? "text-slate-900 dark:text-white"
              : isError
                ? "text-rose-600 dark:text-rose-400"
                : "text-slate-700 dark:text-slate-300";

          return (
            <motion.li
              key={row.id || index}
              aria-current={isActive ? "step" : undefined}
              initial={reduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index, 5) * 0.05, ease: EASE }}
            >
              <button
                type="button"
                disabled={!isInteractive}
                onClick={() => isInteractive && onStepClick!(row, index)}
                className={`w-full flex items-center gap-3 h-11 px-3 rounded-[10px] text-left transition-colors duration-150 active:scale-[0.99] ${
                  isActive
                    ? "bg-slate-50 dark:bg-white/[0.04] shadow-[inset_0_0_0_1px_rgba(17,24,39,0.06)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    : "hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                } ${isInteractive ? "cursor-pointer" : "cursor-default"}`}
              >
                <StatusCell status={row.status} />

                <span className={`min-w-0 flex-1 truncate text-sm ${tone}`}>{row.label || row.title}</span>

                {row.priority === "High" && !isDone && (
                  <span className="hidden sm:inline text-xs text-rose-600 dark:text-rose-400">High priority</span>
                )}

                {row.topic && (
                  <span className="hidden sm:inline text-xs text-slate-500 truncate max-w-[140px]">{row.topic}</span>
                )}

                {row.meta ? (
                  <span className="w-14 flex-shrink-0 text-right font-mono text-xs tabular-nums text-slate-500">{row.meta}</span>
                ) : null}
              </button>
            </motion.li>
          );
        })}
      </ol>
      <span role="status" className="sr-only">{spoken}</span>
      <span className="sr-only" aria-live={complete || failed ? "polite" : "off"}>
        {complete ? "Run complete" : failed ? "Run failed" : ""}
      </span>
    </div>
  );
}

export default TaskSteps;
