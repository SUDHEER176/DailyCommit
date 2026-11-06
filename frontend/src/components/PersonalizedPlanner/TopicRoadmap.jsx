import React from 'react';

// Topic roadmap: each topic sits after the topics it builds on.
// x is the node centre on a 0–1000 track, row is the level from the top.
const NODES = [
  { topic: 'Arrays & Hashing', x: 500, row: 0 },
  { topic: 'Two Pointers', x: 340, row: 1 },
  { topic: 'Stack', x: 660, row: 1 },
  { topic: 'Binary Search', x: 180, row: 2 },
  { topic: 'Sliding Window', x: 500, row: 2 },
  { topic: 'Linked List', x: 820, row: 2 },
  { topic: 'Trees', x: 500, row: 3 },
  { topic: 'Tries', x: 180, row: 4 },
  { topic: 'Heap / Priority Queue', label: 'Heap / Priority Q', x: 500, row: 4 },
  { topic: 'Backtracking', x: 820, row: 4 },
  { topic: 'Intervals', x: 90, row: 5 },
  { topic: 'Greedy', x: 290, row: 5 },
  { topic: 'Advanced Graphs', x: 500, row: 5 },
  { topic: 'Graphs', x: 710, row: 5 },
  { topic: '1-D Dynamic Programming', label: '1-D DP', x: 910, row: 5 },
  { topic: '2-D Dynamic Programming', label: '2-D DP', x: 600, row: 6 },
  { topic: 'Bit Manipulation', x: 910, row: 6 },
  { topic: 'Math & Geometry', x: 810, row: 7 },
];

const EDGES = [
  ['Arrays & Hashing', 'Two Pointers'],
  ['Arrays & Hashing', 'Stack'],
  ['Two Pointers', 'Binary Search'],
  ['Two Pointers', 'Sliding Window'],
  ['Two Pointers', 'Linked List'],
  ['Binary Search', 'Trees'],
  ['Linked List', 'Trees'],
  ['Trees', 'Tries'],
  ['Trees', 'Heap / Priority Queue'],
  ['Trees', 'Backtracking'],
  ['Heap / Priority Queue', 'Intervals'],
  ['Heap / Priority Queue', 'Greedy'],
  ['Heap / Priority Queue', 'Advanced Graphs'],
  ['Backtracking', 'Graphs'],
  ['Backtracking', '1-D Dynamic Programming'],
  ['Graphs', 'Advanced Graphs'],
  ['Graphs', '2-D Dynamic Programming'],
  ['Graphs', 'Math & Geometry'],
  ['1-D Dynamic Programming', '2-D Dynamic Programming'],
  ['1-D Dynamic Programming', 'Bit Manipulation'],
  ['Bit Manipulation', 'Math & Geometry'],
];

const ROW_H = 92;
const NODE_H = 56;
const WIDTH = 1000;

const byName = Object.fromEntries(NODES.map((n) => [n.topic, n]));

function edgePath(a, b) {
  const ay = a.row * ROW_H + NODE_H;
  const by = b.row * ROW_H;
  if (a.row === b.row) {
    // Same level: run along the middle of the nodes
    const y = a.row * ROW_H + NODE_H / 2;
    const dir = b.x < a.x ? -1 : 1;
    return `M ${a.x + dir * 80} ${y} L ${b.x - dir * 80} ${y}`;
  }
  const mid = (ay + by) / 2;
  return `M ${a.x} ${ay} C ${a.x} ${mid}, ${b.x} ${mid}, ${b.x} ${by}`;
}

/**
 * progress: { [topic]: { done, total } }
 * onSelect(topic): open that topic in the sheet
 */
export default function TopicRoadmap({ progress = {}, onSelect, solved = 0, total = 150 }) {
  const height = (Math.max(...NODES.map((n) => n.row)) + 1) * ROW_H - (ROW_H - NODE_H);
  const isDone = (t) => progress[t]?.total > 0 && progress[t].done === progress[t].total;

  return (
    <section className="p-6 rounded-2xl bg-ink-850 border border-white/[0.08]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-[15px] font-medium text-white">Roadmap</h2>
        <div className="flex items-center gap-3 w-full sm:w-72">
          <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden" aria-hidden>
            <div className="h-full rounded-full bg-brand-500 transition-[width] duration-500 ease-out" style={{ width: `${total ? (solved / total) * 100 : 0}%` }} />
          </div>
          <span className="font-mono text-xs tabular-nums text-slate-400">
            <span className="text-white">{solved}</span> / {total}
          </span>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto -mx-2 px-2 pb-2">
        <div className="relative min-w-[960px]" style={{ height }}>
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${WIDTH} ${height}`}
            preserveAspectRatio="none"
            aria-hidden
          >
            {EDGES.map(([from, to]) => {
              const a = byName[from];
              const b = byName[to];
              if (!a || !b) return null;
              const lit = isDone(from);
              return (
                <path
                  key={`${from}-${to}`}
                  d={edgePath(a, b)}
                  fill="none"
                  stroke={lit ? 'rgba(77,142,255,0.55)' : 'rgba(238,240,245,0.12)'}
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>

          {NODES.map((n) => {
            const p = progress[n.topic] || { done: 0, total: 0 };
            const pct = p.total ? (p.done / p.total) * 100 : 0;
            const done = isDone(n.topic);
            return (
              <button
                key={n.topic}
                onClick={() => onSelect && onSelect(n.topic)}
                title={`${n.topic} · ${p.done} of ${p.total} solved`}
                className={`absolute -translate-x-1/2 w-[160px] px-3 flex flex-col justify-center gap-2 rounded-[10px] border text-left transition-colors ${
                  done
                    ? 'bg-ink-800 border-brand-500/50 hover:border-brand-500'
                    : 'bg-ink-800 border-white/[0.08] hover:border-white/[0.2]'
                }`}
                style={{ left: `${(n.x / WIDTH) * 100}%`, top: n.row * ROW_H, height: NODE_H }}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[13px] leading-4 text-white truncate">{n.label || n.topic}</span>
                  <span className="font-mono text-[11px] tabular-nums text-slate-500 flex-shrink-0">{p.done}/{p.total}</span>
                </span>
                <span className="h-1 rounded-full bg-white/[0.06] overflow-hidden" aria-hidden>
                  <span className="block h-full rounded-full bg-brand-500 transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
