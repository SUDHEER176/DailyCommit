// Shared constants, formatters, stats and class names for the DailyCode 150 planner views.
import problemList from '../../data/neetcode150.json';

// ── List order ──

/** Topics in DailyCode 150 order */
export const TOPIC_ORDER = Array.from(new Set(problemList.map((p) => p.topic)));

/** Problem id → its position in the list, for sorting */
export const ORDER_INDEX = Object.fromEntries(problemList.map((p, i) => [p.id, i]));

/** DOM id of a topic's section in the sheet, used to scroll to it */
export const topicAnchor = (topic) => 'topic-' + topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');

/** Every planned question grouped by topic, each group in list order. Empty topics are dropped. */
export function groupByTopic(questions) {
  return TOPIC_ORDER.map((topic) => ({
    topic,
    items: questions
      .filter((q) => q.topic === topic)
      .sort((a, b) => (ORDER_INDEX[a.id] ?? 999) - (ORDER_INDEX[b.id] ?? 999)),
  })).filter((t) => t.items.length > 0);
}

// ── Dates ──

/** Today as YYYY-MM-DD in UTC, the format plan days use */
export const todayIso = () => new Date().toISOString().split('T')[0];

/** Local date → YYYY-MM-DD, for bucketing solves by the day they happened */
export const dateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** "Nov 8" style label for a YYYY-MM-DD string */
export const fmtDate = (iso, opts = { month: 'short', day: 'numeric' }) => {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', opts);
};

// ── Stats ──

/** Heatmap level (0 to 4) for a plan day, from how much of it is solved */
export const dayLevel = (d) => {
  const total = d.questions?.length || 0;
  const done = d.questions?.filter((q) => q.completed).length || 0;
  if (!total || !done) return 0;
  if (done === total) return 4;
  return done / total >= 0.5 ? 3 : 2;
};

/** { 'YYYY-MM-DD': number of problems solved that day } */
export function countSolvesByDay(questions) {
  const byDay = {};
  questions.forEach((q) => {
    if (!q.completed || !q.completedAt) return;
    const k = dateKey(new Date(q.completedAt));
    byDay[k] = (byDay[k] || 0) + 1;
  });
  return byDay;
}

/** Consecutive days with a solve, ending today (or yesterday, since today still counts until midnight) */
export function currentStreak(solvesByDay, today = new Date()) {
  const d = new Date(today);
  if (!solvesByDay[dateKey(today)]) d.setDate(d.getDate() - 1);
  let n = 0;
  while (solvesByDay[dateKey(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/** Longest run of consecutive days with a solve */
export function longestStreak(solvesByDay) {
  const keys = Object.keys(solvesByDay).sort();
  let best = 0, run = 0, prev = null;
  keys.forEach((k) => {
    const t = new Date(`${k}T00:00:00`).getTime();
    run = prev !== null && t - prev === 86400000 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  });
  return best;
}

/** Segments of the solved ring: one per difficulty, sized by its share of the plan */
export function difficultyRing(questions) {
  const parts = [
    { level: 'Easy', color: '#2fa872', track: 'rgba(47,168,114,0.3)', text: 'text-emerald-400' },
    { level: 'Medium', color: '#c78f2a', track: 'rgba(199,143,42,0.3)', text: 'text-amber-400' },
    { level: 'Hard', color: '#e5484d', track: 'rgba(229,72,77,0.3)', text: 'text-rose-400' },
  ].map((p) => {
    const items = questions.filter((q) => q.difficulty === p.level);
    return { ...p, total: items.length, done: items.filter((q) => q.completed).length };
  });
  const sum = parts.reduce((a, p) => a + p.total, 0) || 1;
  let start = 0;
  return parts.map((p) => {
    const share = p.total / sum;
    const out = { ...p, start, share };
    start += share;
    return out;
  });
}

// ── Labels and styles ──

export const difficultyText = {
  Easy: 'text-emerald-400',
  Medium: 'text-amber-400',
  Hard: 'text-rose-400',
};

/** How a problem was solved, shown as a segmented control on day cards */
export const solveOptions = [
  { key: 'independent', label: 'Solo', title: 'Solved on my own', on: 'text-emerald-400' },
  { key: 'hint', label: 'Hint', title: 'Needed a hint', on: 'text-amber-400' },
  { key: 'solution', label: 'Solution', title: 'Read the solution', on: 'text-rose-400' },
];

export const tabClass = (active) =>
  `relative h-full inline-flex items-center gap-2 text-[13px] transition-colors ${
    active
      ? 'text-white after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-white'
      : 'text-slate-500 hover:text-slate-200'
  }`;

export const iconButton = (on) =>
  `w-8 h-8 grid place-items-center rounded-lg transition-colors ${
    on ? 'text-white bg-white/[0.06]' : 'text-slate-500 hover:text-white hover:bg-white/[0.06]'
  }`;

export const secondaryButton =
  'inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-[13px] text-white transition-colors active:scale-[0.98] disabled:opacity-50';

export const linkButton =
  'w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors';

export const notesField =
  'rounded-[10px] bg-ink-800 border border-white/[0.08] p-3 text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors';
