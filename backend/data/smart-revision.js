// Smart revision (Pro): spaced repetition that adapts to how each problem went.
// Runs on the server only, behind the Pro check in GET /api/planner/revision, so it can't be
// switched on from the browser. Free users get fixed reviews on days 3, 7 and 21, computed in the
// browser (frontend/src/lib/practice.js).
//
//  - The first review comes sooner when the first solve was a struggle: read the solution →
//    tomorrow, needed a hint → in 2 days, otherwise 1 to 4 days from how the editor attempt went.
//  - After every review (a small SM-2 variant): "Hard" brings it back tomorrow and makes later
//    gaps shorter, "Good" grows the gap by the ease factor, "Easy" grows it faster.
//  - Problems the person didn't flag but clearly struggled with (wrong first submit, slow,
//    brute force per the AI review, rated hard) join the queue from the editor's attempts.
//  - A problem counts as mastered once the next gap would pass 45 days.
//
// Dates are whole days in the person's own time zone: `tzOffset` is the browser's
// Date.getTimezoneOffset() (minutes; IST is -330), so "due today" means their today.

import { attemptPerformance } from './recommender.js';

const DAY_MS = 86400000;
export const START_EASE = 2.5;
export const MIN_EASE = 1.3;
export const MASTERED_AFTER_DAYS = 45;
export const REVIEW_RESULTS = ['hard', 'ok', 'easy'];
const STRUGGLE_BELOW = 0.5; // attempt performance under this puts an unflagged problem on the queue
/** Struggled: poor results, or the person said it was hard (their word counts whatever the numbers say) */
const struggledWith = (signal) => signal != null && (signal.performance < STRUGGLE_BELOW || signal.attempt?.selfRating === 'hard');

/** Local calendar day number (days since 1970-01-01 in the person's time zone) */
export const dayIndex = (when, tzOffset = 0) => Math.floor((new Date(when).getTime() - tzOffset * 60000) / DAY_MS);
/** Day number → YYYY-MM-DD */
export const dayString = (index) => new Date(index * DAY_MS).toISOString().slice(0, 10);
/** YYYY-MM-DD → day number */
export const dayFromString = (ymd) => Math.floor(Date.parse(`${ymd}T00:00:00Z`) / DAY_MS);

const timeOf = (a) => Date.parse(a?.solvedAt || a?.lastActiveAt || a?.openedAt || 0) || 0;

/** How the most informative attempt went: the latest solved one, else the latest with any signal */
export function bestAttemptSignal(list = [], difficulty) {
  const sorted = (Array.isArray(list) ? list : []).slice().sort((a, b) => timeOf(b) - timeOf(a));
  const pick = sorted.find((a) => a.solved) || sorted[0];
  if (!pick) return null;
  const perf = attemptPerformance(pick, difficulty);
  return perf ? { performance: perf.performance, attempt: pick } : null;
}

/** How the first solve went (the earliest solved attempt, else the earliest with any signal) */
export function firstAttemptSignal(list = [], difficulty) {
  const sorted = (Array.isArray(list) ? list : []).slice().sort((a, b) => timeOf(a) - timeOf(b));
  const pick = sorted.find((a) => a.solved) || sorted.find((a) => a.submits || a.runs || a.gaveUp);
  if (!pick) return null;
  const perf = attemptPerformance(pick, difficulty);
  return perf ? { performance: perf.performance, attempt: pick } : null;
}

/** First gap in days, from how the first solve went */
export function firstInterval(q, performance = null) {
  if (q.solveStatus === 'solution') return 1;
  if (q.solveStatus === 'hint') return 2;
  if (performance != null) {
    if (performance < 0.3) return 1;
    if (performance < 0.5) return 2;
    if (performance < 0.75) return 3;
    return 4;
  }
  return 3;
}

/** Why a problem is on the queue, in a few words */
export function struggleReason(q, signal) {
  if (q.solveStatus === 'solution') return 'Read the solution';
  if (q.solveStatus === 'hint') return 'Needed a hint';
  if (q.isDifficult) return 'Starred';
  const a = signal?.attempt;
  if (a && !a.solved) return a.gaveUp ? 'You got stuck' : 'Not solved yet';
  if (a?.aiVerdict === 'suboptimal') return 'Brute-force solution';
  if (a?.selfRating === 'hard') return 'You rated it hard';
  if (a?.videoOpened || a?.hintsViewed) return 'Used hints';
  if (a?.firstSubmitVerdict && a.firstSubmitVerdict !== 'Accepted') return 'Wrong first submit';
  if (!a?.solved) return 'Not solved yet';
  return 'Slow solve';
}

/**
 * Replay a problem's reviews to get where it stands now.
 * @returns {{ interval, ease, dueDay: number, mastered: boolean, reviewCount: number, lastResult: string|null }}
 */
export function smartState(q, anchorIso, performance = null, tzOffset = 0) {
  let interval = firstInterval(q, performance);
  let ease = START_EASE;
  let dueDay = dayIndex(anchorIso, tzOffset) + interval;
  const reviews = Array.isArray(q.reviews) ? q.reviews : [];
  const results = Array.isArray(q.reviewResults) ? q.reviewResults : [];
  let lastResult = null;

  reviews.forEach((iso, i) => {
    const result = REVIEW_RESULTS.includes(results[i]) ? results[i] : 'ok'; // older reviews had no rating
    if (result === 'hard') {
      ease = Math.max(MIN_EASE, ease - 0.2);
      interval = 1;
    } else if (result === 'easy') {
      ease += 0.15;
      interval = Math.max(interval + 2, Math.round(interval * ease * 1.3));
    } else {
      interval = Math.max(interval + 1, Math.round(interval * ease));
    }
    dueDay = dayIndex(iso, tzOffset) + interval;
    lastResult = result;
  });

  return {
    interval,
    ease: Math.round(ease * 100) / 100,
    dueDay,
    mastered: interval >= MASTERED_AFTER_DAYS && lastResult !== 'hard',
    reviewCount: reviews.length,
    lastResult,
  };
}

/**
 * The smart revision queue: { due, upcoming, mastered }.
 * Each item: { question, smart: true, stage, interval, lastResult, dueDate: 'YYYY-MM-DD', daysUntil, label, reason }.
 * @param plan      the study plan (may be null: problems solved without a plan count too)
 * @param attempts  the editor's attempts map ({ problemId: Attempt[] })
 * @param today     the person's local date, YYYY-MM-DD
 * @param tzOffset  the person's Date.getTimezoneOffset(), in minutes
 * @param extra     { problems, attemptReviews }: the problem list, and the reviews done on problems
 *                  that aren't in a plan ({ problemId: { reviews: [iso], reviewResults: [..] } })
 */
export function smartRevisionSchedule(plan, attempts = {}, today = dayString(dayIndex(Date.now())), tzOffset = 0, extra = {}) {
  const todayIndex = dayFromString(today);
  const addedAt = Object.fromEntries((plan?.revisionQueue || []).map((r) => [r.id, r.addedAt]));
  const due = [], upcoming = [];
  let mastered = 0;

  (plan?.days || []).flatMap((d) => d.questions || []).forEach((q) => {
    const signal = bestAttemptSignal(attempts[q.id], q.difficulty);
    const flagged = Boolean(q.isDifficult || q.solveStatus === 'hint' || q.solveStatus === 'solution');
    const struggled = struggledWith(signal) && Boolean(q.completed || signal.attempt?.solved || signal.attempt?.submits || signal.attempt?.gaveUp);
    if (!flagged && !struggled) return;

    const anchorIso = q.completedAt || addedAt[q.id] || signal?.attempt?.solvedAt || signal?.attempt?.lastActiveAt;
    if (!anchorIso) return;

    const state = smartState(q, anchorIso, signal?.performance ?? null, tzOffset);
    if (state.mastered) { mastered++; return; }

    const daysUntil = state.dueDay - todayIndex; // negative = overdue
    const item = {
      question: q,
      smart: true,
      stage: state.reviewCount,
      interval: state.interval,
      lastResult: state.lastResult,
      dueDate: dayString(state.dueDay),
      daysUntil,
      label: state.reviewCount === 0 ? 'First review' : `Review ${state.reviewCount + 1}`,
      reason: state.lastResult === 'hard' ? 'Hard last time' : struggleReason(q, signal),
    };
    (daysUntil <= 0 ? due : upcoming).push(item);
  });

  // Problems solved outside any plan (e.g. from "Next up"): same rules, from the editor's attempts
  const inPlan = new Set((plan?.days || []).flatMap((d) => (d.questions || []).map((q) => q.id)));
  const byId = new Map((extra.problems || []).map((p) => [p.id, p]));
  Object.entries(attempts).forEach(([problemId, list]) => {
    const problem = byId.get(problemId);
    if (!problem || inPlan.has(problemId)) return;
    const done = extra.attemptReviews?.[problemId] || {};
    const reviews = Array.isArray(done.reviews) ? done.reviews : [];
    const signal = firstAttemptSignal(list, problem.difficulty);
    // Once a review has been done the problem stays on the queue, even if that review went well
    const struggled = struggledWith(signal) && Boolean(signal.attempt?.solved || signal.attempt?.submits || signal.attempt?.gaveUp);
    if (!struggled && reviews.length === 0) return;

    const anchorIso = signal?.attempt?.solvedAt || signal?.attempt?.lastActiveAt;
    if (!anchorIso) return;
    const q = { id: problemId, title: problem.title, number: problem.number, difficulty: problem.difficulty, topic: problem.topic, url: problem.url, completed: Boolean(signal?.attempt?.solved), reviews, reviewResults: done.reviewResults || [] };
    const state = smartState(q, anchorIso, signal?.performance ?? null, tzOffset);
    if (state.mastered) { mastered++; return; }
    const daysUntil = state.dueDay - todayIndex;
    const item = {
      question: q,
      smart: true,
      attemptOnly: true, // not in a study plan: reviews are recorded with POST /planner/review
      stage: state.reviewCount,
      interval: state.interval,
      lastResult: state.lastResult,
      dueDate: dayString(state.dueDay),
      daysUntil,
      label: state.reviewCount === 0 ? 'First review' : `Review ${state.reviewCount + 1}`,
      reason: state.lastResult === 'hard' ? 'Hard last time' : struggleReason(q, signal),
    };
    (daysUntil <= 0 ? due : upcoming).push(item);
  });

  due.sort((a, b) => a.daysUntil - b.daysUntil);
  upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
  return { due, upcoming, mastered };
}
