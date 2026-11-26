import React, { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import SectionHead, { Panel } from './SectionHead';
import { PROBLEMS } from '@/lib/practice';
import { Ink, useInkSheet, rv } from './ink';

const TOPICS = [...new Set(PROBLEMS.map((p) => p.topic))];
const DIFFS = ['All', 'Easy', 'Medium', 'Hard'];
const DIFF_INK = { Easy: 'text-emerald-600 dark:text-emerald-400', Medium: 'text-amber-600 dark:text-amber-400', Hard: 'text-rose-600 dark:text-rose-400' };
const FIRST = 6;

/** Pick a topic and a difficulty, get that slice of the list on a taped sheet */
export default function TopicPicker({ onNavigate }) {
  const [topic, setTopic] = useState('Sliding Window');
  const [diff, setDiff] = useState('All');
  const [all, setAll] = useState(false);
  const ink = useInkSheet();

  const problems = useMemo(
    () => PROBLEMS.filter((p) => p.topic === topic && (diff === 'All' || p.difficulty === diff)),
    [topic, diff]
  );
  const shown = all ? TOPICS : TOPICS.slice(0, FIRST).concat(TOPICS.indexOf(topic) >= FIRST ? [topic] : []);

  const chip = (on) =>
    `h-9 px-4 rounded-lg text-[13px] border transition-colors ${
      on
        ? 'text-slate-900 dark:text-white bg-white dark:bg-white/[0.08] border-slate-300 dark:border-white/[0.14]'
        : 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/[0.06] hover:text-slate-900 dark:hover:text-white'
    }`;

  return (
    <section id="topics" className="scroll-mt-24">
      <SectionHead title="Practice it topic by topic" caption="Pick a topic. Pick a level. Get its problems" />
      <Panel className="p-4 sm:p-6">
        <p className="text-xs text-slate-500">1 · Topic</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {shown.map((t) => (
            <button key={t} type="button" aria-pressed={topic === t} onClick={() => setTopic(t)} className={chip(topic === t)}>{t}</button>
          ))}
          <button type="button" onClick={() => setAll((v) => !v)} className="h-9 px-2 font-hand text-[18px] text-slate-500 hover:text-slate-900 dark:hover:text-white">
            {all ? 'fewer' : `+ ${TOPICS.length - FIRST} more`}
          </button>
        </div>

        <p className="mt-5 text-xs text-slate-500">2 · Difficulty</p>
        <div className="mt-2 inline-flex p-1 rounded-lg border border-slate-200 dark:border-white/[0.06]">
          {DIFFS.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={diff === d}
              onClick={() => setDiff(d)}
              className={`h-8 px-3 rounded-md text-[13px] transition-colors ${diff === d ? 'bg-slate-900/[0.06] dark:bg-white/[0.08] text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* The slice, on a taped sheet */}
        <div {...ink} {...rv(2)} className="ink-sheet mt-10 sm:px-8">
          <div className="paper px-5 py-5 sm:px-7" style={{ transform: 'rotate(-0.6deg)', '--tape': '#d8cdf0' }}>
            <span className="tape" aria-hidden />
            <div className="flex items-baseline justify-between gap-4">
              <p className="flex items-baseline gap-3 min-w-0">
                <span className="font-hand text-[30px] leading-none text-slate-900 dark:text-white truncate"><Ink key={topic}>{topic}</Ink></span>
                <span className="hidden sm:inline text-xs text-slate-500">{diff === 'All' ? 'every level' : diff.toLowerCase()}</span>
              </p>
              <span className="shrink-0 text-[13px] text-slate-700 dark:text-slate-300 tabular-nums">{problems.length} {problems.length === 1 ? 'problem' : 'problems'}</span>
            </div>
            <ul style={{ '--at': '0.4s' }} className="ink-fade mt-4 divide-y divide-slate-900/[0.06] dark:divide-white/[0.06]">
              {problems.length === 0 && <li className="py-4 font-hand text-[20px] text-slate-500"><Ink key={`none-${topic}-${diff}`}>None at this level, try another</Ink></li>}
              {problems.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('/practice/dsa')}
                    className="group w-full flex items-center gap-4 h-12 text-left"
                  >
                    <span className="flex-1 truncate text-[15px] text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">{p.title}</span>
                    <span className={`text-xs ${DIFF_INK[p.difficulty]}`}>{p.difficulty}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-4 text-right font-hand text-[18px] text-slate-500"><Ink at={1}>all from DailyCode 150</Ink></p>
        </div>
      </Panel>
    </section>
  );
}
