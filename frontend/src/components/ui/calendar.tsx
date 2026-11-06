"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

// Deterministic solve counts per day, so the month reads like a real history.
function solvesOn(day: number, today: number): number {
  if (day > today) return -1; // future
  if (day === today) return 1;
  const v = Math.abs(Math.sin(day * 78.233) * 43758.5453) % 1;
  if (v < 0.3) return 0;
  return v < 0.6 ? 1 : v < 0.85 ? 2 : 3;
}

const levelFor = (n: number) => (n <= 0 ? 0 : n === 1 ? 2 : n === 2 ? 3 : 4);

export function Calendar({
  onOpenProblemModal,
  className = "",
}: {
  onOpenProblemModal?: () => void;
  className?: string;
}) {
  const now = new Date();
  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });
  const today = now.getDate();
  const firstDayOfWeek = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    return { d, solves: solvesOn(d, today) };
  });
  const solvedDays = days.filter((x) => x.solves > 0).length;

  return (
    <section
      className={`flex flex-col rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-ink-850 p-6 ${className}`}
      aria-label={`Solve calendar, ${monthLabel}`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-[15px] font-medium text-slate-900 dark:text-white">{monthLabel}</h3>
        <span className="font-mono text-[13px] tabular-nums text-slate-500 dark:text-slate-400">
          {solvedDays} of {today} days
        </span>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-1.5">
        {dayNames.map((d, i) => (
          <span key={`h-${i}`} className="h-6 grid place-items-center font-mono text-[11px] text-slate-500">
            {d}
          </span>
        ))}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <span key={`e-${i}`} aria-hidden />
        ))}
        {days.map(({ d, solves }) => {
          const lvl = levelFor(solves);
          const isToday = d === today;
          const isFuture = solves < 0;
          return (
            <span
              key={d}
              title={isFuture ? undefined : `${solves} solved`}
              data-level={lvl}
              className={`cell !w-full !h-auto aspect-square !rounded-md grid place-items-center font-mono text-[11px] tabular-nums ${
                isFuture
                  ? "!bg-transparent text-slate-400 dark:text-slate-600"
                  : lvl >= 3
                    ? "text-white"
                    : lvl > 0
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-500"
              } ${isToday ? "ring-1 ring-offset-2 ring-slate-900 dark:ring-white ring-offset-white dark:ring-offset-ink-850" : ""}`}
            >
              {d}
            </span>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-end gap-1.5 font-mono text-[11px] text-slate-500">
        <span className="mr-1">Less</span>
        {[0, 2, 3, 4].map((l) => (
          <span key={l} className="cell" data-level={l} aria-hidden />
        ))}
        <span className="ml-1">More</span>
      </div>

      <div className="mt-auto pt-6 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between gap-4">
        <p className="text-[13px] text-slate-500 dark:text-slate-400">2 problems picked from your current module</p>
        <button
          type="button"
          onClick={onOpenProblemModal}
          className="inline-flex items-center gap-1 flex-shrink-0 rounded-md text-[13px] text-brand-600 dark:text-brand-400 hover:underline underline-offset-4"
        >
          Start
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </section>
  );
}

export default Calendar;
