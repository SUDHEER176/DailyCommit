// Daily problem and spaced-revision schedule for the practice hub.
import problemList from '../data/neetcode150.json';
import { attemptPerformance } from './recommender.js';

const DAY_MS = 86400000;

/** Local calendar day as YYYY-MM-DD */
export const localDay = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / DAY_MS);

// ── Daily problem ──

const EPOCH = new Date(2026, 0, 1);
const STEP = 37; // shares no factor with 150, so every problem comes up once in 150 days, topics mixed

/** Today's problem: the same for everyone on a given day, cycling through all 150 */
export function dailyProblem(date = new Date()) {
  const n = problemList.length;
  const day = ((daysBetween(EPOCH, date) % n) + n) % n;
  return problemList[(day * STEP) % n];
}

const DAILY_LOG_KEY = 'dc_daily_solved'; // { 'YYYY-MM-DD': problemId }

export function readDailyLog() {
  try { return JSON.parse(localStorage.getItem(DAILY_LOG_KEY) || '{}') || {}; } catch { return {}; }
}

export function markDailySolved(problemId, date = new Date()) {
  const log = { ...readDailyLog(), [localDay(date)]: problemId };
  try { localStorage.setItem(DAILY_LOG_KEY, JSON.stringify(log)); } catch { /* storage unavailable */ }
  return log;
}

// ── Streak ──

/** Days with a solve: planner solves, daily problems and solves in the editor, as a set of YYYY-MM-DD */
export function activeDays(plan, dailyLog = {}, attempts = {}) {
  const days = new Set(Object.keys(dailyLog));
  Object.values(attempts).forEach((list) => (Array.isArray(list) ? list : []).forEach((a) => {
    if (a.solved && a.solvedAt) days.add(localDay(new Date(a.solvedAt)));
  }));
  (plan?.days || []).forEach((d) => d.questions.forEach((q) => {
    if (q.completed && q.completedAt) days.add(localDay(new Date(q.completedAt)));
  }));
  return days;
}

/** Consecutive days with a solve, ending today (or yesterday, since today still counts until midnight) */
export function currentStreak(days, today = new Date()) {
  const d = startOfDay(today);
  if (!days.has(localDay(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(localDay(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

// ── Revision queue ──

export const REVIEW_DAYS = [3, 7, 21];

/** A problem comes back when it was starred, or solved with a hint or the solution */
export const needsRevision = (q) => Boolean(q.isDifficult || q.solveStatus === 'hint' || q.solveStatus === 'solution');

/**
 * Every problem on the revision schedule, from the plan.
 * Reviews are due 3, 7 and 21 days after the problem was solved (or starred, if it wasn't marked solved).
 * After the third review it counts as mastered.
 */
export function revisionSchedule(plan, today = new Date(), extra = {}) {
  const addedAt = Object.fromEntries((plan?.revisionQueue || []).map((r) => [r.id, r.addedAt]));
  const due = [], upcoming = [];
  let mastered = 0;

  (plan?.days || []).flatMap((d) => d.questions).forEach((q) => {
    if (!needsRevision(q)) return;
    const anchorIso = q.completedAt || addedAt[q.id];
    if (!anchorIso) return;
    const reviews = Array.isArray(q.reviews) ? q.reviews.length : 0;
    if (reviews >= REVIEW_DAYS.length) { mastered++; return; }

    const anchor = new Date(anchorIso);
    const dueDate = new Date(startOfDay(anchor).getTime() + REVIEW_DAYS[reviews] * DAY_MS);
    const offset = daysBetween(today, dueDate); // negative = overdue
    const item = {
      question: q,
      stage: reviews,
      reviewDay: REVIEW_DAYS[reviews],
      dueDate,
      daysUntil: offset,
      reason: q.solveStatus === 'solution' ? 'Read the solution' : q.solveStatus === 'hint' ? 'Needed a hint' : 'Starred',
    };
    (offset <= 0 ? due : upcoming).push(item);
  });

  // Problems solved outside any plan (e.g. from "Next up") that went badly, from the editor's
  // attempts: the same 3 / 7 / 21 days, counted from when they were solved
  const inPlan = new Set((plan?.days || []).flatMap((d) => (d.questions || []).map((q) => q.id)));
  const byId = new Map((extra.problems || []).map((p) => [p.id, p]));
  Object.entries(extra.attempts || {}).forEach(([problemId, list]) => {
    const problem = byId.get(problemId);
    if (!problem || inPlan.has(problemId)) return;
    const reviews = extra.attemptReviews?.[problemId]?.reviews || [];
    const first = (Array.isArray(list) ? list : []).slice()
      .sort((a, b) => Date.parse(a.solvedAt || a.lastActiveAt || a.openedAt || 0) - Date.parse(b.solvedAt || b.lastActiveAt || b.openedAt || 0))
      .find((a) => a.solved || a.submits || a.runs);
    const perf = first ? attemptPerformance(first, problem.difficulty) : null;
    const struggled = perf != null && (perf.performance < 0.5 || first.selfRating === 'hard') && Boolean(first.solved || first.submits);
    if (!struggled && reviews.length === 0) return;
    const anchorIso = first?.solvedAt || first?.lastActiveAt;
    if (!anchorIso) return;
    if (reviews.length >= REVIEW_DAYS.length) { mastered++; return; }

    const dueDate = new Date(startOfDay(new Date(anchorIso)).getTime() + REVIEW_DAYS[reviews.length] * DAY_MS);
    const offset = daysBetween(today, dueDate);
    const item = {
      question: { id: problemId, title: problem.title, number: problem.number, difficulty: problem.difficulty, topic: problem.topic, url: problem.url },
      attemptOnly: true,
      stage: reviews.length,
      reviewDay: REVIEW_DAYS[reviews.length],
      dueDate,
      daysUntil: offset,
      reason: first.solved ? 'Struggled with it' : 'Not solved yet',
    };
    (offset <= 0 ? due : upcoming).push(item);
  });

  due.sort((a, b) => a.daysUntil - b.daysUntil);           // most overdue first
  upcoming.sort((a, b) => a.daysUntil - b.daysUntil);      // soonest first
  return { due, upcoming, mastered };
}

/**
 * A review's Hard / Good / Easy rating from how solving it again in the editor went. Sent with
 * the review; the server's smart revision uses it, the fixed schedule ignores it.
 */
export function reviewResultFromAttempt(attempt, difficulty) {
  const perf = attemptPerformance(attempt, difficulty);
  if (!perf) return 'ok';
  if (perf.performance >= 0.8) return 'easy';
  if (perf.performance < 0.45) return 'hard';
  return 'ok';
}

/** A server smart-revision item: due date 'YYYY-MM-DD' (the person's calendar) → local Date */
export const withLocalDueDate = (item) => {
  const [y, m, d] = String(item.dueDate).split('-').map(Number);
  return { ...item, dueDate: new Date(y, m - 1, d) };
};

/** The editor's problem object for a list entry or planned question */
export const editorProblem = (q) => ({
  id: q.id,
  number: q.number,
  title: q.title,
  difficulty: q.difficulty,
  topic: q.topic,
  url: q.url,
});

export const PROBLEMS = problemList;
export const PROBLEM_COUNT = problemList.length;
export const TOPIC_COUNT = new Set(problemList.map((p) => p.topic)).size;
