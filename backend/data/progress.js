// Progress summary for the practice hub: how many problems are solved, what's covered, what's left.
//
// The basics go to everyone (Free included). The detail (per-topic bars, weak topics, an on-track
// check against the study plan) is the Pro "detailed analytics" feature: buildProgress only
// includes it when `detailed` is true, which GET /api/planner/progress sets from isProUser.
//
// "Solved" means marked done in the study plan OR solved in the editor, each problem counted once.

import { bestAttemptSignal, dayIndex, dayFromString } from './smart-revision.js';

const WEAK_BELOW = 0.6; // average performance under this marks a started topic as weak
const BEHIND_BY = 3;    // problems behind the plan before it is called "behind"

const timeOf = (iso) => Date.parse(iso || 0) || 0;

/** Every solved problem id → ISO time it was (last) solved */
export function solvedProblems(plan, attempts = {}) {
  const solved = new Map();
  const note = (id, iso) => { if (!solved.has(id) || timeOf(iso) > timeOf(solved.get(id))) solved.set(id, iso || null); };
  (plan?.days || []).forEach((d) => (d.questions || []).forEach((q) => { if (q.completed) note(q.id, q.completedAt); }));
  Object.entries(attempts).forEach(([id, list]) => (Array.isArray(list) ? list : []).forEach((a) => { if (a.solved) note(id, a.solvedAt); }));
  return solved;
}

/**
 * @param problems   the 150-problem list
 * @param plan       the study plan, or null
 * @param attempts   the editor's attempts map
 * @param today      the person's local date, YYYY-MM-DD
 * @param tzOffset   their Date.getTimezoneOffset() in minutes
 * @param detailed   include the Pro detail
 */
export function buildProgress({ problems = [], plan = null, attempts = {}, today, tzOffset = 0, detailed = false }) {
  const solved = solvedProblems(plan, attempts);
  const todayIndex = dayFromString(today);
  const byId = new Map(problems.map((p) => [p.id, p]));
  const touched = (id) => (Array.isArray(attempts[id]) ? attempts[id] : []).some((a) => a.solved || a.submits || a.runs);

  const topics = new Map();
  const byDifficulty = { Easy: { solved: 0, total: 0 }, Medium: { solved: 0, total: 0 }, Hard: { solved: 0, total: 0 } };
  problems.forEach((p) => {
    const t = topics.get(p.topic) || { topic: p.topic, solved: 0, total: 0, started: false, perf: [] };
    t.total += 1;
    if (byDifficulty[p.difficulty]) byDifficulty[p.difficulty].total += 1;
    if (solved.has(p.id)) {
      t.solved += 1;
      if (byDifficulty[p.difficulty]) byDifficulty[p.difficulty].solved += 1;
    }
    if (solved.has(p.id) || touched(p.id)) t.started = true;
    const signal = bestAttemptSignal(attempts[p.id], p.difficulty);
    if (signal) t.perf.push(signal.performance);
    topics.set(p.topic, t);
  });

  let solvedToday = 0;
  solved.forEach((iso, id) => {
    if (byId.has(id) && iso && dayIndex(iso, tzOffset) === todayIndex) solvedToday += 1;
  });
  const solvedCount = [...solved.keys()].filter((id) => byId.has(id)).length;

  const data = {
    solved: solvedCount,
    total: problems.length,
    remaining: problems.length - solvedCount,
    solvedToday,
    topicsStarted: [...topics.values()].filter((t) => t.started).length,
    topicsTotal: topics.size,
    byDifficulty,
    detailed: null,
  };
  if (!detailed) return data;

  const rows = [...topics.values()].map((t) => ({
    topic: t.topic,
    solved: t.solved,
    total: t.total,
    started: t.started,
    avgPerformance: t.perf.length ? Math.round((t.perf.reduce((a, b) => a + b, 0) / t.perf.length) * 100) / 100 : null,
  }));
  const weakest = rows
    .filter((r) => r.started && r.avgPerformance != null && r.avgPerformance < WEAK_BELOW)
    .sort((a, b) => a.avgPerformance - b.avgPerformance)
    .slice(0, 3)
    .map((r) => r.topic);

  let onTrack = null;
  const days = plan?.days || [];
  if (days.length) {
    const scheduled = days.filter((d) => dayFromString(d.date) <= todayIndex).flatMap((d) => d.questions || []);
    const done = scheduled.filter((q) => solved.has(q.id)).length;
    const behindBy = Math.max(0, scheduled.length - done);
    onTrack = {
      scheduled: scheduled.length,
      done,
      behindBy,
      status: behindBy >= BEHIND_BY ? 'behind' : behindBy === 0 ? 'on-track' : 'slightly-behind',
      planEnds: days[days.length - 1].date,
      planTotal: days.reduce((n, d) => n + (d.questions || []).length, 0),
    };
  }

  data.detailed = { topics: rows, weakest, onTrack };
  return data;
}
