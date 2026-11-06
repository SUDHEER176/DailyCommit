import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];

function Card({ className = '', onClick, children }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`group relative flex flex-col text-left rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-ink-850 p-6 transition-colors duration-150 ${
        onClick ? 'hover:border-slate-300 dark:hover:border-white/[0.14] cursor-pointer' : ''
      } ${className}`}
    >
      {onClick && (
        <ArrowUpRight
          className="absolute top-6 right-6 w-4 h-4 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
          strokeWidth={1.5}
          aria-hidden
        />
      )}
      {children}
    </Tag>
  );
}

function CardText({ title, children }) {
  return (
    <div className="mt-auto pt-6">
      <h3 className="text-[15px] font-medium text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm leading-[1.55] text-slate-500 dark:text-slate-400">{children}</p>
    </div>
  );
}

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function FeatureBento({ stats = {}, setActiveTab, onNavigate }) {
  const streak = stats?.user?.streak ?? 7;
  const filledDays = Math.max(1, Math.min(streak, 7));
  const go = (tab) => () => {
    if (setActiveTab) setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goPractice = () => onNavigate && onNavigate('/practice/dsa');

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <div className="max-w-2xl">
        <span className="eyebrow">Features</span>
        <h2 className="mt-3 text-[32px] sm:text-[40px] leading-[1.1] font-medium tracking-[-0.02em] text-slate-900 dark:text-white">
          Everything a prep session needs, in one tab
        </h2>
        <p className="mt-4 text-base leading-[1.6] text-slate-600 dark:text-slate-400">
          Streaks, revision, roadmaps, a code editor and analytics, from your first problem to the final round.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[minmax(240px,auto)]">
        {/* Streak */}
        <Card className="md:col-span-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-8">
            <div className="flex-shrink-0">
              <div className="font-mono text-[48px] leading-none font-medium tabular-nums text-slate-900 dark:text-white">{streak}</div>
              <div className="mt-2 text-[13px] text-slate-500 dark:text-slate-400">day streak</div>
            </div>
            <div className="flex-1 grid grid-cols-7 gap-2">
              {days.map((d, i) => (
                <div key={d} className="flex flex-col items-center gap-2">
                  <span
                    className="cell !w-full !h-auto aspect-square max-w-[40px] !rounded-md"
                    data-level={i < filledDays ? 4 : 0}
                    aria-label={`${d}: ${i < filledDays ? 'solved' : 'not yet'}`}
                  />
                  <span className="font-mono text-[11px] text-slate-500">{d}</span>
                </div>
              ))}
            </div>
          </div>
          <CardText title="Streaks that stick">
            A daily goal and a solve heatmap turn consistency into something you can see.
          </CardText>
        </Card>

        {/* Revision */}
        <Card className="md:col-span-2" onClick={go('revision')}>
          <ul className="divide-y divide-slate-200 dark:divide-white/[0.06]">
            {[
              { t: 'Longest Substring', d: 'Due today', now: true },
              { t: 'Merge Intervals', d: 'In 3 days' },
              { t: 'Course Schedule', d: 'In 7 days' },
            ].map((r) => (
              <li key={r.t} className="flex items-center justify-between gap-4 h-10">
                <span className="text-[13px] text-slate-700 dark:text-slate-200 truncate">{r.t}</span>
                <span className={`font-mono text-xs flex-shrink-0 ${r.now ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500'}`}>{r.d}</span>
              </li>
            ))}
          </ul>
          <CardText title="Spaced repetition">
            Problems come back at 3, 7 and 21 days, right before you forget them.
          </CardText>
        </Card>

        {/* Focus timer */}
        <Card className="md:col-span-2">
          <div className="flex justify-center">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden>
                <circle cx="60" cy="60" r="52" fill="none" strokeWidth="6" className="stroke-slate-200 dark:stroke-white/[0.06]" />
                <circle
                  cx="60" cy="60" r="52" fill="none" strokeWidth="6" strokeLinecap="round"
                  className="stroke-slate-900 dark:stroke-slate-200"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 * 0.32}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-xl tabular-nums text-slate-900 dark:text-white">17:04</span>
                <span className="mt-1 text-[11px] text-slate-500">of 25:00</span>
              </div>
            </div>
          </div>
          <CardText title="Focus timer">
            Timed sprints that mirror real interview pressure.
          </CardText>
        </Card>

        {/* Code editor */}
        <Card className="md:col-span-2" onClick={goPractice}>
          <div className="rounded-xl bg-slate-50 dark:bg-ink-900 border border-slate-200 dark:border-white/[0.06] p-4 font-mono text-xs leading-[1.7] text-slate-800 dark:text-slate-200 overflow-hidden">
            <div><span className="text-brand-600 dark:text-brand-400">def</span> maxArea(h):</div>
            <div className="pl-4">l, r = <span className="text-amber-600 dark:text-amber-300">0</span>, len(h) - <span className="text-amber-600 dark:text-amber-300">1</span></div>
            <div className="pl-4"><span className="text-brand-600 dark:text-brand-400">while</span> l {'<'} r:</div>
            <div className="pl-8 text-slate-500"># two pointers</div>
            <div className="mt-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} /> Accepted
            </div>
          </div>
          <CardText title="Code editor">
            Write, run and submit in the browser with a Monaco editor.
          </CardText>
        </Card>

        {/* Roadmap */}
        <Card className="md:col-span-2" onClick={go('roadmap')}>
          <ol>
            {[
              { t: 'Arrays & Hashing', s: 'done' },
              { t: 'Two Pointers', s: 'done' },
              { t: 'Sliding Window', s: 'active' },
              { t: 'Trees & Graphs', s: 'todo' },
            ].map((step, i, arr) => (
              <li key={step.t} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`w-3 h-3 mt-1 rounded-full flex-shrink-0 ${
                      step.s === 'done'
                        ? 'bg-slate-400 dark:bg-slate-500'
                        : step.s === 'active'
                          ? 'border-2 border-brand-500 bg-transparent'
                          : 'border border-slate-300 dark:border-white/[0.14]'
                    }`}
                  />
                  {i < arr.length - 1 && <span className="w-px h-5 bg-slate-200 dark:bg-white/[0.08]" />}
                </div>
                <span className={`text-[13px] ${step.s === 'todo' ? 'text-slate-400 dark:text-slate-500' : step.s === 'active' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                  {step.t}
                </span>
              </li>
            ))}
          </ol>
          <CardText title="Guided roadmaps">
            A week-by-week syllabus from arrays to dynamic programming.
          </CardText>
        </Card>

        {/* Analytics */}
        <Card className="md:col-span-3" onClick={go('analytics')}>
          <div className="flex items-end gap-2 h-28" aria-label="Problems solved per week, last 12 weeks">
            {[38, 52, 30, 64, 48, 80, 58, 92, 70, 86, 62, 100].map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className={`flex-1 rounded-t-[3px] ${i === 11 ? 'bg-brand-500' : 'bg-slate-200 dark:bg-white/[0.08]'}`}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[11px] text-slate-500">
            <span>12 weeks ago</span>
            <span>This week</span>
          </div>
          <CardText title="Progress analytics">
            Difficulty split, solve status and weekly pace, so you always know where you stand.
          </CardText>
        </Card>

        {/* Sheets */}
        <Card className="md:col-span-3" onClick={goPractice}>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              ["Striver's A2Z", 455],
              ['SDE Sheet', 180],
              ['NeetCode', 150],
              ['Striver 75', 75],
              ['System Design', 48],
              ['OS & DBMS', 64],
            ].map(([name, n]) => (
              <li key={name} className="flex items-center justify-between gap-2 h-9 px-3 rounded-lg border border-slate-200 dark:border-white/[0.08] text-[13px] text-slate-700 dark:text-slate-200">
                <span className="truncate">{name}</span>
                <span className="font-mono text-xs tabular-nums text-slate-500">{n}</span>
              </li>
            ))}
          </ul>
          <CardText title="Practice sheets">
            The interview sheets people trust, in one place, with progress tracked per topic.
          </CardText>
        </Card>
      </div>
    </motion.section>
  );
}
