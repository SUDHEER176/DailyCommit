import React from 'react';
import { CalendarCheck, Code2, Map, RotateCcw, BarChart3, CheckCircle2 } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { addDays, dayKey, levelFor, parseDay } from '@/lib/userData';

// 20 weeks of solve history, deterministic so it renders the same every time.
// The last three weeks are an unbroken run, which is the streak the header counts.
const WEEKS = 20;
const heat = Array.from({ length: WEEKS * 7 }, (_, i) => {
  const v = Math.abs(Math.sin((i + 3) * 12.9898) * 43758.5453) % 1;
  if (i >= WEEKS * 7 - 21) return v > 0.55 ? 4 : v > 0.2 ? 3 : 2;
  if (v < 0.34) return 0;
  return v < 0.58 ? 1 : v < 0.8 ? 2 : v < 0.93 ? 3 : 4;
});

const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

const due = [
  { title: 'Merge Intervals', when: 'Day 7 review' },
  { title: 'Longest Substring Without Repeating', when: 'Day 3 review' },
  { title: 'Course Schedule', when: 'Day 21 review' },
];

const nav = [
  { icon: CalendarCheck, label: 'Today', active: true },
  { icon: Code2, label: 'Practice' },
  { icon: Map, label: 'Roadmap' },
  { icon: RotateCcw, label: 'Revision', countKey: 'revision' },
  { icon: BarChart3, label: 'Analytics' },
];

const K = ({ children }) => <span className="text-brand-600 dark:text-brand-400">{children}</span>;
const N = ({ children }) => <span className="text-amber-600 dark:text-amber-300">{children}</span>;
const C = ({ children }) => <span className="text-slate-500">{children}</span>;

const monthShort = (d) => d.toLocaleDateString('en-GB', { month: 'short' });
const daysAgo = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  const today = new Date();
  return Math.max(0, Math.round((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000));
};

export default function ProductPreview({ stats = {}, signedIn = false }) {
  // Signed in: the person's real numbers. Signed out: a sample learner, tagged "Example"
  const today = new Date();
  const start = addDays(today, 1 - WEEKS * 7);
  const streak = signedIn ? stats?.user?.streak ?? 0 : 21;
  const solved = signedIn ? stats?.totalProblemsSolved ?? 0 : 142;
  const inRevision = signedIn ? stats?.revisionCount ?? 0 : 3;
  const cells = signedIn
    ? Array.from({ length: WEEKS * 7 }, (_, i) => levelFor(stats?.activity?.[dayKey(addDays(start, i))] || 0))
    : heat;
  // Each month in the 20 week window once, oldest first (at most 5)
  const monthLabels = signedIn
    ? [...new Set(Array.from({ length: WEEKS }, (_, w) => monthShort(addDays(start, w * 7 + 3))))].slice(-5)
    : months;
  const since = signedIn
    ? (stats?.firstSolvedAt ? `solved since ${parseDay(stats.firstSolvedAt).toLocaleDateString('en-GB', { month: 'long' })}` : 'solved')
    : 'solved since July';
  const dueList = signedIn
    ? (stats?.revisionDue || []).map((d) => {
        const n = daysAgo(d.solvedAt);
        return { title: d.title, when: n == null ? '' : n === 0 ? 'Solved today' : `Solved ${n} ${n === 1 ? 'day' : 'days'} ago` };
      })
    : due;

  return (
    <div className="relative mt-16 sm:mt-20 animate-fadeIn" style={{ animationDelay: '80ms' }}>
      <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-ink-850 overflow-hidden shadow-[0_24px_64px_-32px_rgba(17,24,39,0.25)] dark:shadow-none">
        {/* Window chrome */}
        <div className="flex items-center gap-3 px-4 h-10 border-b border-slate-200 dark:border-white/[0.08]">
          <div className="flex gap-2" aria-hidden>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-white/[0.12]" />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-white/[0.12]" />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-white/[0.12]" />
          </div>
          <span className="mx-auto font-mono text-xs text-slate-500">{BRAND.domain}/today</span>
          <span className="w-12 text-right text-xs text-slate-500">{signedIn ? '' : 'Example'}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] lg:grid-cols-[200px_minmax(0,1fr)_360px]">
          {/* Sidebar */}
          <div className="hidden md:flex flex-col gap-1 p-3 border-r border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-ink-900/60">
            {nav.map(({ icon: Icon, label, active, countKey }) => (
              <div
                key={label}
                className={`flex items-center gap-2 h-8 px-2 rounded-lg text-[13px] ${
                  active
                    ? 'bg-white dark:bg-white/[0.06] text-slate-900 dark:text-white shadow-[inset_0_0_0_1px_rgba(17,24,39,0.06)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={1.5} />
                <span className="flex-1">{label}</span>
                {countKey === 'revision' && (
                  <span className="font-mono text-xs tabular-nums text-slate-500">{inRevision}</span>
                )}
              </div>
            ))}
          </div>

          {/* Editor */}
          <div className="min-w-0 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/[0.08]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-3 min-w-0">
                <span className="text-[15px] font-medium text-slate-900 dark:text-white truncate">15. 3Sum</span>
                <span className="text-xs text-amber-600 dark:text-amber-400">Medium</span>
                <span className="hidden sm:inline text-xs text-slate-500">Two pointers</span>
              </div>
              <span className="font-mono text-xs text-slate-500">Python</span>
            </div>

            <pre className="mt-4 rounded-xl bg-slate-50 dark:bg-ink-900 border border-slate-200 dark:border-white/[0.06] p-4 text-xs sm:text-[13px] leading-[1.7] font-mono text-slate-800 dark:text-slate-200 overflow-hidden">
<C># sort, then close in from both ends</C>{'\n'}
<K>def</K> threeSum(nums):{'\n'}
{'    '}nums.sort(){'\n'}
{'    '}out = []{'\n'}
{'    '}<K>for</K> i <K>in</K> range(len(nums) - <N>2</N>):{'\n'}
{'        '}<K>if</K> i <K>and</K> nums[i] == nums[i - <N>1</N>]: <K>continue</K>{'\n'}
{'        '}l, r = i + <N>1</N>, len(nums) - <N>1</N>{'\n'}
{'        '}<K>while</K> l {'<'} r:{'\n'}
{'            '}s = nums[i] + nums[l] + nums[r]{'\n'}
{'            '}<K>if</K> s == <N>0</N>: out.append([nums[i], nums[l], nums[r]]){'\n'}
{'            '}l, r = (l + <N>1</N>, r) <K>if</K> s {'<'} <N>0</N> <K>else</K> (l, r - <N>1</N>){'\n'}
{'    '}<K>return</K> out
            </pre>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 h-auto sm:h-10 px-3 py-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06]">
              <span className="flex items-center gap-2 text-[13px] text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                Accepted
                <span className="font-mono text-xs tabular-nums text-slate-500">312 / 312 tests</span>
              </span>
              <span className="font-mono text-xs tabular-nums text-slate-500">Runtime 41 ms · logged to today</span>
            </div>
          </div>

          {/* Streak and revision queue */}
          <div className="md:col-span-2 lg:col-span-1 p-4 sm:p-6 flex flex-col gap-8">
            <div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="font-mono text-[32px] leading-none font-medium tabular-nums text-slate-900 dark:text-white">{streak}</div>
                  <div className="mt-2 text-[13px] text-slate-500 dark:text-slate-400">day streak</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[15px] tabular-nums text-slate-900 dark:text-white">{solved}</div>
                  <div className="mt-1 text-xs text-slate-500">{since}</div>
                </div>
              </div>

              <div className="mt-6 overflow-hidden">
                <div className="grid grid-flow-col grid-rows-7 gap-[3px] justify-start" aria-label="Solve history, last 20 weeks">
                  {cells.map((lvl, i) => (
                    <span key={i} className="cell !w-[11px] !h-[11px] lg:!w-3 lg:!h-3" data-level={lvl} />
                  ))}
                </div>
                <div className="mt-2 flex justify-between font-mono text-[11px] text-slate-500 pr-2">
                  {monthLabels.map((m, i) => <span key={i}>{m}</span>)}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-slate-900 dark:text-white">Due for revision</span>
                <span className="font-mono text-xs tabular-nums text-slate-500">{signedIn ? `${inRevision} waiting` : `${due.length} today`}</span>
              </div>
              <ul className="mt-2 divide-y divide-slate-200 dark:divide-white/[0.06]">
                {dueList.length === 0 && (
                  <li className="flex items-center h-10 text-[13px] text-slate-500">Nothing waiting for revision</li>
                )}
                {dueList.map((d) => (
                  <li key={d.title} className="flex items-center justify-between gap-4 h-10">
                    <span className="text-[13px] text-slate-700 dark:text-slate-300 truncate">{d.title}</span>
                    <span className="font-mono text-xs text-slate-500 flex-shrink-0">{d.when}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
