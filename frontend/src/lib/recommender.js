// GENERATED from backend/data/recommender.js by scripts/sync-recommender.mjs. Edit the backend file, then re-run the script.
// Next-problem recommender for the DailyCode 150.
//
// Deterministic on purpose: the same history always gives the same suggestion, every pick
// comes with a plain-language reason, and it runs offline. No imports, so the same file runs
// in the backend (data/recommender.js) and in the browser (frontend/src/lib/recommender.js,
// copied by `node scripts/sync-recommender.mjs`). Edit the backend copy, then sync.
//
// How it decides:
//  1. Each attempt becomes a performance score from 0 to 1 (attemptPerformance): solved or not,
//     first-submit verdict, hints or video used, active time against the expected time for its
//     difficulty, the self-rating, and the AI review's verdict when there is one. Solves with a
//     lot of pasted code count for less.
//  2. Those scores update an Elo-style skill rating per pattern (computeMastery). Easy, Medium and
//     Hard problems are rated 1000, 1300 and 1600, so a hard solve moves the rating more than an
//     easy one, and one bad day doesn't undo several good ones.
//  3. From the last problem worked on, recommendNext picks the next one: harder in the same
//     pattern after a strong solve, the same level after an average one, and easier or a
//     prerequisite pattern after a struggle. It stays inside the study plan when the person is
//     behind schedule, and never jumps to a pattern whose prerequisites haven't been touched.

export const DIFFICULTY_RATING = { Easy: 1000, Medium: 1300, Hard: 1600 };
export const LEVEL_RATING = { beginner: 900, intermediate: 1100, advanced: 1300 };
const EXPECTED_MINUTES = { Easy: 15, Medium: 30, Hard: 50 };
const STRONG = 0.75;
const WEAK = 0.45;
const BEHIND_THRESHOLD = 3;

const ratingOf = (difficulty) => DIFFICULTY_RATING[difficulty] || DIFFICULTY_RATING.Medium;
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const expectedScore = (skill, problemRating) => 1 / (1 + 10 ** ((problemRating - skill) / 400));

/**
 * One attempt → { performance 0..1, weight 0..1 }, or null when there is nothing to learn from
 * (the problem was opened and read, nothing more).
 */
export function attemptPerformance(attempt, difficulty) {
  if (!attempt) return null;
  if (!attempt.solved) {
    // The person said they're stuck ("Suggest an easier problem"): believe them, in full
    if (attempt.gaveUp) return { performance: 0.1, weight: 1 };
    if (!attempt.submits && !attempt.runs) return null;
    // Opened it, ran the sample once and left within a couple of minutes: just looking, not struggling
    if (!attempt.submits && attempt.runs <= 1 && (attempt.activeSeconds || 0) < 120) return null;
    // Tried and didn't get there (yet). Counts, but less, since they may come back to it.
    return { performance: attempt.submits ? 0.1 : 0.2, weight: 0.6 };
  }
  let p = 1;
  if (attempt.firstSubmitVerdict && attempt.firstSubmitVerdict !== 'Accepted') p -= 0.15;
  if (attempt.hintsViewed) p -= 0.15;
  if (attempt.videoOpened) p -= 0.3;
  const seconds = Number(attempt.secondsToSolve);
  if (seconds > 0) {
    const ratio = seconds / ((EXPECTED_MINUTES[difficulty] || 30) * 60);
    if (ratio > 2.5) p -= 0.3;
    else if (ratio > 1.5) p -= 0.15;
    else if (ratio < 0.5) p += 0.05;
  }
  if (attempt.selfRating === 'easy') p += 0.1;
  if (attempt.selfRating === 'hard') p -= 0.25;
  // From the optional AI review: a brute-force answer that passes is not yet mastery, so even a
  // fast, clean brute-force solve lands below the step-up threshold
  if (attempt.aiVerdict === 'suboptimal') p -= 0.35;
  if (attempt.aiVerdict === 'optimal') p += 0.05;
  // A large paste usually means the solution came from somewhere else
  const weight = (attempt.pastedChars || 0) >= 200 ? 0.3 : 1;
  return { performance: clamp(p, 0.05, 1), weight };
}

/** For problems marked solved in the planner without an editor attempt (solved on LeetCode, say) */
function statusPerformance(solveStatus) {
  if (solveStatus === 'independent') return { performance: 0.8, weight: 0.7 };
  if (solveStatus === 'hint') return { performance: 0.5, weight: 0.7 };
  if (solveStatus === 'solution') return { performance: 0.25, weight: 0.7 };
  return { performance: 0.7, weight: 0.5 };
}

const timeOf = (a) => Date.parse(a.solvedAt || a.lastActiveAt || a.openedAt || 0) || 0;

/** Build lookups once per call */
function index(problems, graph) {
  const byId = new Map();
  const order = new Map();
  problems.forEach((p, i) => { byId.set(p.id, p); order.set(p.id, i); });
  const patternOf = (id) => graph?.problems?.[id]?.pattern || `topic:${byId.get(id)?.topic || 'other'}`;
  const nextOf = (id) => graph?.problems?.[id]?.next || [];
  const prevOf = new Map();
  Object.entries(graph?.problems || {}).forEach(([id, info]) => {
    (info.next || []).forEach((n) => prevOf.set(n, [...(prevOf.get(n) || []), id]));
  });
  const patternName = (pattern) => graph?.patterns?.[pattern]?.name || pattern.replace(/^topic:/, '');
  const prereqsOf = (pattern) => graph?.patterns?.[pattern]?.prereqs || [];
  return { byId, order, patternOf, nextOf, prevOf: (id) => prevOf.get(id) || [], patternName, prereqsOf };
}

/** Every event that tells us something, oldest first: one per attempt, plus planner-only solves */
function collectEvents({ attempts = {}, completed = new Map(), byId }) {
  const events = [];
  const seenSolved = new Set();
  Object.entries(attempts).forEach(([problemId, list]) => {
    (Array.isArray(list) ? list : []).forEach((a) => {
      const perf = attemptPerformance(a, byId.get(problemId)?.difficulty);
      if (!perf) return;
      events.push({ problemId, at: timeOf(a), ...perf, attempt: a });
      if (a.solved) seenSolved.add(problemId);
    });
  });
  completed.forEach((info, problemId) => {
    if (seenSolved.has(problemId)) return;
    events.push({ problemId, at: Date.parse(info.completedAt || 0) || 0, ...statusPerformance(info.solveStatus) });
  });
  return events.sort((a, b) => a.at - b.at);
}

/**
 * Skill rating per pattern. Unseen patterns start from an overall rating, which itself starts
 * from the level the person picked in the planner.
 */
export function computeMastery({ problems = [], graph, attempts = {}, completed = new Map(), level = 'intermediate' }) {
  const ix = index(problems, graph);
  let overall = LEVEL_RATING[level] || LEVEL_RATING.intermediate;
  const patterns = {};
  collectEvents({ attempts, completed, byId: ix.byId }).forEach((e) => {
    const problem = ix.byId.get(e.problemId);
    if (!problem) return;
    const pattern = ix.patternOf(e.problemId);
    const entry = patterns[pattern] || (patterns[pattern] = { rating: overall, events: 0 });
    const r = ratingOf(problem.difficulty);
    // Learn fast at first, then settle
    const k = (entry.events < 4 ? 64 : 40) * e.weight;
    entry.rating += k * (e.performance - expectedScore(entry.rating, r));
    entry.events += 1;
    overall += 16 * e.weight * (e.performance - expectedScore(overall, r));
  });
  Object.values(patterns).forEach((p) => { p.rating = Math.round(p.rating); });
  return { overall: Math.round(overall), patterns };
}

/** Completed plan questions → Map(id → { completedAt, solveStatus }) */
export function completedFromPlan(plan) {
  const map = new Map();
  (plan?.days || []).forEach((d) => (d.questions || []).forEach((q) => {
    if (q.completed) map.set(q.id, { completedAt: q.completedAt, solveStatus: q.solveStatus });
  }));
  return map;
}

function lastWorkedOn(attempts, completed) {
  let best = null;
  Object.entries(attempts).forEach(([problemId, list]) => {
    (Array.isArray(list) ? list : []).forEach((a) => {
      if (!a.solved && !a.submits && !a.runs && !a.gaveUp) return;
      const t = timeOf(a);
      if (!best || t > best.t) best = { problemId, t };
    });
  });
  completed.forEach((info, problemId) => {
    const t = Date.parse(info.completedAt || 0) || 0;
    if (!best || t > best.t) best = { problemId, t };
  });
  return best?.problemId || null;
}

function performanceOn(problemId, { attempts, completed, byId }) {
  const list = (attempts[problemId] || []).slice().sort((a, b) => timeOf(a) - timeOf(b));
  for (let i = list.length - 1; i >= 0; i--) {
    const perf = attemptPerformance(list[i], byId.get(problemId)?.difficulty);
    if (perf) return { ...perf, attempt: list[i] };
  }
  if (completed.has(problemId)) return statusPerformance(completed.get(problemId).solveStatus);
  return null;
}

const describe = (p) => p && {
  id: p.id, number: p.number, title: p.title, difficulty: p.difficulty, topic: p.topic, url: p.url || p.problemUrl || null,
};

/**
 * The next problem to work on.
 * @returns {null | { problem, kind, reason, pattern, patternName, rating, after }}
 *   kind: 'start' | 'plan' | 'catch-up' | 'step-up' | 'reinforce' | 'step-down' | 'prerequisite' | 'revisit' | 'next-pattern'
 */
export function recommendNext({
  problems = [],
  graph,
  attempts = {},
  plan = null,
  level,
  afterId = null,
  today = new Date().toISOString().slice(0, 10),
  exclude = [],
} = {}) {
  if (!problems.length) return null;
  const ix = index(problems, graph);
  const completed = completedFromPlan(plan);
  // A solve in the editor counts even when the problem isn't in the plan
  Object.entries(attempts).forEach(([id, list]) => {
    const solved = (Array.isArray(list) ? list : []).filter((a) => a.solved).sort((a, b) => timeOf(a) - timeOf(b));
    if (solved.length && !completed.has(id)) completed.set(id, { completedAt: solved[solved.length - 1].solvedAt, solveStatus: null });
  });
  const userLevel = level || plan?.config?.level || 'intermediate';
  const mastery = computeMastery({ problems, graph, attempts, completed, level: userLevel });
  const ratingFor = (pattern) => mastery.patterns[pattern]?.rating ?? mastery.overall;

  const excluded = new Set(exclude);
  const solved = (id) => completed.has(id);
  const touchedPatterns = new Set([...completed.keys()].map(ix.patternOf));
  // A pattern is open once its prerequisites have been touched, or once the person has already
  // solved something in it (they've shown they can work there)
  const unlocked = (pattern) => touchedPatterns.has(pattern) || ix.prereqsOf(pattern).every((p) => touchedPatterns.has(p));

  const planQuestions = (plan?.days || []).flatMap((d) => (d.questions || []).map((q) => ({ id: q.id, date: d.date })));
  const planDate = new Map(planQuestions.map((q) => [q.id, q.date]));
  const overdue = planQuestions.filter((q) => q.date < today && !solved(q.id) && ix.byId.has(q.id));
  const behind = overdue.length >= BEHIND_THRESHOLD;

  const afterProblemId = afterId && ix.byId.has(afterId) ? afterId : lastWorkedOn(attempts, completed);
  const after = afterProblemId ? ix.byId.get(afterProblemId) : null;
  const afterPerf = after ? performanceOn(after.id, { attempts, completed, byId: ix.byId }) : null;
  const pool = (behind ? overdue.map((q) => ix.byId.get(q.id)) : problems)
    .filter((p) => p && !solved(p.id) && !excluded.has(p.id) && p.id !== after?.id);

  const result = (problem, kind, reason) => ({
    problem: describe(problem),
    kind,
    reason,
    pattern: ix.patternOf(problem.id),
    patternName: ix.patternName(ix.patternOf(problem.id)),
    rating: ratingFor(ix.patternOf(problem.id)),
    after: after ? { ...describe(after), performance: afterPerf ? Math.round(afterPerf.performance * 100) / 100 : null } : null,
  });

  const inPlanSoon = (id) => {
    const date = planDate.get(id);
    if (!date) return false;
    const days = (Date.parse(date) - Date.parse(today)) / 86400000;
    return days >= 0 && days <= 7;
  };

  // ── No history yet: follow the plan, or start at the beginning of the list ──
  if (!after || !afterPerf) {
    const todays = planQuestions.find((q) => q.date >= today && !solved(q.id) && !excluded.has(q.id) && ix.byId.has(q.id));
    const first = behind ? pool[0] : (todays && ix.byId.get(todays.id)) || pool.find((p) => unlocked(ix.patternOf(p.id))) || pool[0];
    if (!first) return null;
    if (behind) return result(first, 'catch-up', `You're ${overdue.length} problems behind your plan, so this one is from an earlier day.`);
    if (todays && first.id === todays.id) return result(first, 'plan', 'Next in your plan.');
    return result(first, 'start', `A good first ${ix.patternName(ix.patternOf(first.id))} problem.`);
  }

  const p = afterPerf.performance;
  const band = p >= STRONG ? 'strong' : p < WEAK ? 'weak' : 'steady';
  const afterPattern = ix.patternOf(after.id);
  const afterRating = ratingOf(after.difficulty);
  const skill = ratingFor(afterPattern);
  // Where to aim: one difficulty step above what was just solved after a strong solve, the same
  // level after an average one, one step below after a struggle. Blended 70/30 with the pattern
  // rating so the longer history tempers a single result.
  const step = band === 'strong' ? 300 : band === 'weak' ? -300 : 0;
  const target = clamp(0.7 * (afterRating + step) + 0.3 * clamp(skill, 1000, 1600), 1000, 1600);
  const linkedHarder = new Set(ix.nextOf(after.id));
  const linkedEasier = new Set(ix.prevOf(after.id));
  const afterPrereqs = new Set(ix.prereqsOf(afterPattern));

  const score = (c) => {
    const pattern = ix.patternOf(c.id);
    let s = -Math.abs(ratingOf(c.difficulty) - target) / 10;
    if (pattern === afterPattern) s += 30;
    // The "harder follow-up" link only pulls after a strong solve; an average one stays at its level
    if (band === 'strong' && linkedHarder.has(c.id)) s += 45;
    if (band === 'weak' && linkedEasier.has(c.id)) s += 45;
    if (band === 'weak' && afterPrereqs.has(pattern)) s += 35;
    if (!unlocked(pattern)) s -= 500;
    if (inPlanSoon(c.id)) s += 10;
    s -= (ix.order.get(c.id) || 0) / 60; // earlier in the list breaks ties
    return s;
  };

  // After a struggle with nothing easier left in the pattern, go back over a solved, simpler one
  if (band === 'weak' && !behind) {
    const easierUnsolved = pool.some((c) => (ix.patternOf(c.id) === afterPattern || afterPrereqs.has(ix.patternOf(c.id)))
      && ratingOf(c.difficulty) <= afterRating && (ratingOf(c.difficulty) < afterRating || linkedEasier.has(c.id)));
    if (!easierUnsolved) {
      const revisit = problems
        .filter((c) => c.id !== after.id && solved(c.id) && !excluded.has(c.id)
          && (ix.patternOf(c.id) === afterPattern || linkedEasier.has(c.id))
          && ratingOf(c.difficulty) <= afterRating)
        // The direct easier version first, then the easiest in the pattern
        .sort((a, b) => (linkedEasier.has(b.id) - linkedEasier.has(a.id))
          || ratingOf(a.difficulty) - ratingOf(b.difficulty) || (ix.order.get(a.id) - ix.order.get(b.id)))[0];
      if (revisit) {
        return result(revisit, 'revisit', `${after.title} was a tough one. Redo ${revisit.title}, the same idea in a simpler form, then try ${after.title} again.`);
      }
    }
  }

  const best = pool.slice().sort((a, b) => score(b) - score(a))[0];
  if (!best) return null;

  const bestPattern = ix.patternOf(best.id);
  const samePattern = bestPattern === afterPattern;
  const bestRating = ratingOf(best.difficulty);
  const quick = afterPerf.attempt?.secondsToSolve && afterPerf.attempt.secondsToSolve < (EXPECTED_MINUTES[after.difficulty] || 30) * 60;
  const firstTry = afterPerf.attempt?.firstSubmitVerdict === 'Accepted';

  if (behind) {
    return result(best, 'catch-up', `You're ${overdue.length} problems behind your plan, so this one is from an earlier day${samePattern ? ` and keeps you on ${ix.patternName(afterPattern)}` : ''}.`);
  }
  if (band === 'weak') {
    if (afterPrereqs.has(bestPattern)) {
      return result(best, 'prerequisite', `${after.title} builds on ${ix.patternName(bestPattern)}. Practise it with ${best.title} first.`);
    }
    if (bestRating < afterRating || linkedEasier.has(best.id)) {
      return result(best, 'step-down', `${after.title} was a tough one. ${best.title} is a gentler ${ix.patternName(bestPattern)} problem to build up to it.`);
    }
    return result(best, 'reinforce', `More ${ix.patternName(bestPattern)} practice at a level that suits you right now.`);
  }
  if (samePattern || linkedHarder.has(best.id)) {
    // Only a strong solve is praised and stepped up from; an average one gets practice at its level
    if (band === 'strong' && (bestRating > afterRating || linkedHarder.has(best.id))) {
      const how = [quick && 'quickly', firstTry && 'on the first try'].filter(Boolean).join(' and ');
      return result(best, 'step-up', `You solved ${after.title}${how ? ` ${how}` : ''}. ${best.title} uses the same idea with a twist.`);
    }
    if (bestRating > afterRating) {
      return result(best, 'step-up', `${best.title} is the next ${ix.patternName(bestPattern)} problem, a little harder.`);
    }
    return result(best, 'reinforce', `One more ${ix.patternName(bestPattern)} problem at this level to make it stick.`);
  }
  const patternLeft = pool.some((c) => ix.patternOf(c.id) === afterPattern);
  return result(best, 'next-pattern', patternLeft
    ? `Good progress on ${ix.patternName(afterPattern)}. Next, mix in ${ix.patternName(bestPattern)}.`
    : `You've covered every ${ix.patternName(afterPattern)} problem. Next up: ${ix.patternName(bestPattern)}.`);
}
