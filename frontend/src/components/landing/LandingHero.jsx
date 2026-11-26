import React, { useState } from 'react';
import { ArrowDown, Check } from 'lucide-react';
import { setPlanPrefill } from '@/lib/planPrefill';
import { PROBLEMS } from '@/lib/practice';
import { Ink, useInkSheet } from './ink';

// Tape colors, one per card
const TAPE = ['#c9e4c5', '#f3d2a8', '#d8cdf0', '#bfe3dc'];

// Each card writes its title in when it scrolls into view, then the rest follows
function PaperCard({ i, tilt, title, children }) {
  const ink = useInkSheet();
  return (
    <div {...ink} className="paper ink-sheet ink-stagger p-5 pt-6 h-full" style={{ transform: `rotate(${tilt}deg)`, '--tape': TAPE[i], '--i': i }}>
      <span className="tape" aria-hidden />
      <h3 className="font-hand text-[26px] leading-none text-slate-900 dark:text-white"><Ink>{title}</Ink></h3>
      <div className="mt-4 ink-fade" style={{ '--at': '0.45s' }}>{children}</div>
    </div>
  );
}

const LEVELS = [['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']];
const HOURS = [1, 2, 3, 4, 5];
const FINISH = [30, 45, 60];

/** Card 1: the plan wizard's first answers. Build opens the wizard in the hub with them filled in */
function GoalsCard({ onNavigate }) {
  const [a, setA] = useState({ level: 'intermediate', hours: 2, targetDays: 45 });
  const set = (k, v) => setA((x) => ({ ...x, [k]: v }));
  const chip = (on) =>
    `h-7 px-2 rounded-md text-[13px] tabular-nums transition-colors ${
      on ? 'text-slate-900 dark:text-white bg-slate-900/[0.06] dark:bg-white/[0.08]' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
    }`;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setPlanPrefill(a); onNavigate && onNavigate('/practice/dsa'); }}
      aria-label="Your goals"
    >
      <p className="text-xs text-slate-500">I am</p>
      <div className="mt-1 flex flex-wrap gap-1" role="radiogroup" aria-label="Level">
        {LEVELS.map(([v, l]) => (
          <button key={v} type="button" role="radio" aria-checked={a.level === v} onClick={() => set('level', v)} className={`${chip(a.level === v)} inline-flex items-center gap-1`}>
            {a.level === v && <Check className="w-3 h-3 text-brand-500" strokeWidth={2} />}
            {l}
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-500">Hours a day</p>
      <div className="mt-1 flex gap-1" role="radiogroup" aria-label="Hours a day">
        {HOURS.map((h) => (
          <button key={h} type="button" role="radio" aria-checked={a.hours === h} onClick={() => set('hours', h)} className={`${chip(a.hours === h)} w-8 px-0`}>{h}h</button>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-500">Finish in</p>
      <div className="mt-1 flex gap-1" role="radiogroup" aria-label="Finish in">
        {FINISH.map((d) => (
          <button key={d} type="button" role="radio" aria-checked={a.targetDays === d} onClick={() => set('targetDays', d)} className={chip(a.targetDays === d)}>{d} days</button>
        ))}
      </div>
      <div className="mt-6 flex justify-center">
        <button
          type="submit"
          className="relative font-hand text-[22px] leading-none h-11 px-8 rounded-[50%] text-slate-900 dark:text-white -rotate-2 hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.06] transition-colors"
        >
          <Ink at={0.9}>Build my plan</Ink>
          {/* Circled by hand once the words are written: the loop overlaps where it started */}
          <svg className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] overflow-visible text-slate-900/70 dark:text-white/80 pointer-events-none" viewBox="0 0 160 48" preserveAspectRatio="none" aria-hidden>
            <path className="ink-circle" style={{ '--at': '1.5s' }} pathLength="1" d="M96 4.5C136 5.5 157 13 155 25C153 38 117 44.5 77 44C35 43.5 4 36 4.5 23.5C5 11 39 3.5 84 4C104 4.2 118 6 130 10" />
          </svg>
        </button>
      </div>
    </form>
  );
}

// Card 2: an example first week in list order, one topic a day, Sunday for revision
const WEEK = [
  ['M', 'Arrays & Hashing', '2h'],
  ['T', 'Arrays & Hashing', '2h'],
  ['W', 'Two Pointers', '2h'],
  ['T', 'Sliding Window', '2h'],
  ['F', 'Stack', '2h'],
  ['S', 'Binary Search', '2h'],
  ['S', 'Revision', '1h'],
];

function WeekCard() {
  return (
    <div>
      <div className="flex items-center gap-1 text-xs">
        <span className="h-6 px-2 grid place-items-center rounded-md bg-slate-900/[0.06] dark:bg-white/[0.08] text-slate-900 dark:text-white">Week 1</span>
        <span className="px-2 text-slate-500">W2</span>
        <span className="px-1 text-slate-500">W3 … W7</span>
      </div>
      <ul className="mt-3 divide-y divide-slate-900/[0.06] dark:divide-white/[0.06]">
        {WEEK.map(([d, t, h], i) => (
          <li key={i} className="flex items-center gap-3 h-8 text-[13px]">
            <span className="w-3 font-mono text-[11px] text-slate-500">{d}</span>
            <span className={`flex-1 truncate ${t === 'Revision' ? 'font-hand text-[18px] text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>{t === 'Revision' ? <Ink at={1}>{t}</Ink> : t}</span>
            <span className="font-mono text-[11px] text-slate-500 tabular-nums">{h}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Card 3: today's problems, the first three of the list
const TODAY = PROBLEMS.slice(0, 3);
const DIFF = { Easy: 'text-emerald-600 dark:text-emerald-400', Medium: 'text-amber-600 dark:text-amber-400', Hard: 'text-rose-600 dark:text-rose-400' };

function TodayCard() {
  return (
    <ul className="space-y-3">
      {TODAY.map((p, i) => (
        <li key={p.id} className="flex items-start gap-3">
          <span className={`mt-0.5 grid place-items-center w-4 h-4 shrink-0 rounded border ${i === 0 ? 'bg-brand-500 border-brand-500' : 'border-slate-400 dark:border-white/30'}`} aria-hidden>
            {i === 0 && <Check className="on-dark w-3 h-3 text-white" strokeWidth={2.5} />}
          </span>
          <span className="min-w-0">
            <span className={`block text-[13px] leading-5 ${i === 0 ? 'text-slate-500 line-through decoration-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>{p.title}</span>
            <span className={`text-[11px] ${DIFF[p.difficulty]}`}>{p.difficulty}</span>
          </span>
        </li>
      ))}
      <li className="pt-2 font-hand text-[20px] text-slate-500"><Ink at={0.9}>1 of 3 done, keep going</Ink></li>
    </ul>
  );
}

// Card 4: one problem's way back, with the review days as squares
function RevisionCard() {
  const marks = { 0: 'Solved', 3: 'Day 3', 7: 'Day 7', 21: 'Day 21' };
  return (
    <div>
      <p className="text-[13px] text-slate-800 dark:text-slate-200">Group Anagrams</p>
      <p className="text-[11px] text-slate-500">Needed a hint, so it comes back</p>
      <div className="mt-4 grid grid-cols-7 gap-1" aria-label="Solved today, then reviews on day 3, 7 and 21">
        {Array.from({ length: 28 }, (_, d) => (
          <span key={d} className="cell !w-full !h-auto aspect-square !rounded-[3px]" data-level={d === 0 ? 4 : marks[d] ? 3 : 0} title={marks[d]} />
        ))}
      </div>
      <ul className="mt-4 space-y-1 font-hand text-[19px] leading-tight text-slate-700 dark:text-slate-300">
        <li><Ink at={0.8}>Day 3, a quick look</Ink></li>
        <li><Ink at={1.5}>Day 7, solve it again</Ink></li>
        <li><Ink at={2.2}>Day 21, it sticks</Ink></li>
      </ul>
    </div>
  );
}

/**
 * Landing hero: a centered headline and two actions, then four taped paper cards that walk
 * through goals, the week, today and revision.
 */
export default function LandingHero({ onNavigate }) {
  return (
    <section className="hero-screen flex flex-col pt-6 sm:pt-10">
      <div className="text-center animate-fadeIn">
        <p className="inline-flex items-center h-7 px-3 rounded-full bg-brand-500/10 text-[13px] text-brand-600 dark:text-brand-400">
          DSA interview prep, one day at a time
        </p>
        <h1 className="mt-4 text-[36px] sm:text-[52px] leading-[1.08] font-medium tracking-[-0.03em] text-slate-900 dark:text-white">
          Interview date set? Let’s plan it
        </h1>
        <p className="mt-3 text-lg sm:text-2xl text-slate-500 dark:text-slate-400">
          A daily DSA plan that remembers what you’ll forget
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => document.getElementById('compare')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="btn-primary-glow inline-flex items-center gap-2 h-10 px-5 rounded-lg text-[15px] font-medium transition-[background-color,transform] active:scale-[0.98]"
          >
            See what Pro adds
            <ArrowDown className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('/practice/dsa')}
            className="inline-flex items-center h-10 px-5 rounded-lg text-[15px] text-slate-900 dark:text-white border border-slate-300 dark:border-white/[0.14] hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors active:scale-[0.98]"
          >
            Start practicing for free
          </button>
        </div>
      </div>

      {/* Fills the rest of the first screen, edge to edge, with the cards centered in it */}
      <div className="mt-10 flex-1 flex items-center rounded-[24px] border border-slate-200 dark:border-white/[0.06] bg-slate-100/70 dark:bg-ink-850 px-5 py-10 sm:px-8">
        <div className="land-col w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          <PaperCard i={0} tilt={-2} title="Your goals"><GoalsCard onNavigate={onNavigate} /></PaperCard>
          <PaperCard i={1} tilt={1.5} title="Your week"><WeekCard /></PaperCard>
          <PaperCard i={2} tilt={-1} title="Today"><TodayCard /></PaperCard>
          <PaperCard i={3} tilt={2} title="Comes back"><RevisionCard /></PaperCard>
        </div>
      </div>
    </section>
  );
}
