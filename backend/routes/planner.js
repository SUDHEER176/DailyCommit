import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, saveDb } from '../data/store.js';
import { generateSchedule } from '../data/scheduler-engine.js';
import { recommendNext } from '../data/recommender.js';
import { smartRevisionSchedule } from '../data/smart-revision.js';
import { isProUser } from '../data/billing.js';
import { buildProgress } from '../data/progress.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const REVIEW_RESULTS = new Set(['hard', 'ok', 'easy']);
const QUESTIONS_FILE = path.join(__dirname, '../data/neetcode150.json');
const GRAPH = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/problem-graph.json'), 'utf-8'));

// Helper to load canonical questions
function getCanonicalQuestions() {
  if (fs.existsSync(QUESTIONS_FILE)) {
    return JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf-8'));
  }
  return [];
}

// 1. GET /api/planner/questions
router.get('/questions', (req, res) => {
  const db = getDb();
  const baseQuestions = getCanonicalQuestions();
  const plan = db.studyPlan;

  if (!plan || !plan.days) {
    return res.json(baseQuestions);
  }

  // Merge with user status if plan exists
  const statusMap = {};
  plan.days.forEach(day => {
    day.questions.forEach(q => {
      statusMap[q.id] = q;
    });
  });

  const merged = baseQuestions.map(q => {
    if (statusMap[q.id]) {
      return { ...q, ...statusMap[q.id] };
    }
    return q;
  });

  res.json(merged);
});

// 2. GET /api/planner/plan
router.get('/plan', (req, res) => {
  const db = getDb();
  res.json({
    plan: db.studyPlan || null
  });
});

// 3. POST /api/planner/generate
router.post('/generate', (req, res) => {
  const db = getDb();
  const {
    level = 'intermediate',
    difficultyPref = 'mixed_easy_medium',
    dailyHours = 2,
    targetDays = 45,
    includeRevision = true,
    startDate = new Date().toISOString().split('T')[0]
  } = req.body;

  const baseQuestions = getCanonicalQuestions();

  // Collect any existing completed question IDs so they are preserved!
  const completedIds = new Set();
  if (db.studyPlan && db.studyPlan.days) {
    db.studyPlan.days.forEach(day => {
      day.questions.forEach(q => {
        if (q.completed) completedIds.add(q.id);
      });
    });
  }
  // Also check existing problems logged in problem tracker
  if (Array.isArray(db.problems)) {
    db.problems.forEach(p => {
      const match = baseQuestions.find(bq => bq.title.toLowerCase() === p.title.toLowerCase() || bq.number === p.id);
      if (match) completedIds.add(match.id);
    });
  }

  const generatedPlan = generateSchedule({
    questions: baseQuestions,
    level,
    difficultyPref,
    dailyHours: Number(dailyHours),
    targetDays: Number(targetDays),
    includeRevision: Boolean(includeRevision),
    startDate,
    existingCompletedIds: Array.from(completedIds)
  });

  // Preserve existing revision queue if any
  generatedPlan.revisionQueue = (db.studyPlan && db.studyPlan.revisionQueue) ? db.studyPlan.revisionQueue : [];

  db.studyPlan = generatedPlan;
  saveDb(db);

  res.json({
    success: true,
    plan: db.studyPlan
  });
});

// 4. PATCH /api/planner/question/:id
router.patch('/question/:id', (req, res) => {
  const db = getDb();
  const { id } = req.params;
  // `reviewed: true` records one spaced-revision review (day 3, 7 or 21) on the question
  // `reviewResult` ('hard' | 'ok' | 'easy') rates that review for smart revision; stored in
  // q.reviewResults, aligned with q.reviews (older reviews have no rating)
  const { completed, isDifficult, solveStatus, notes, reviewed, reviewResult } = req.body;

  if (!db.studyPlan || !db.studyPlan.days) {
    return res.status(404).json({ error: 'No active study plan found. Please generate a plan first.' });
  }

  let updatedQuestion = null;

  db.studyPlan.days.forEach(day => {
    day.questions.forEach(q => {
      if (q.id === id) {
        if (completed !== undefined) {
          q.completed = Boolean(completed);
          q.completedAt = completed ? new Date().toISOString() : null;
        }
        if (isDifficult !== undefined) q.isDifficult = Boolean(isDifficult);
        if (solveStatus !== undefined) q.solveStatus = solveStatus;
        if (notes !== undefined) q.notes = notes;
        if (reviewed === true) {
          const reviews = Array.isArray(q.reviews) ? q.reviews : [];
          const results = Array.isArray(q.reviewResults) ? q.reviewResults.slice(0, reviews.length) : [];
          while (results.length < reviews.length) results.push(null);
          q.reviews = [...reviews, new Date().toISOString()];
          q.reviewResults = [...results, REVIEW_RESULTS.has(reviewResult) ? reviewResult : null];
        }
        updatedQuestion = { ...q };
      }
    });

    // Recompute day stats
    day.completedCount = day.questions.filter(q => q.completed).length;
    day.isFullyCompleted = day.questions.length > 0 && day.questions.every(q => q.completed);
  });

  if (!updatedQuestion) {
    return res.status(404).json({ error: 'Question not found in active study plan.' });
  }

  // Manage revision queue
  if (!db.studyPlan.revisionQueue) db.studyPlan.revisionQueue = [];
  const inQueueIdx = db.studyPlan.revisionQueue.findIndex(rq => rq.id === id);

  if (updatedQuestion.isDifficult || updatedQuestion.solveStatus === 'hint' || updatedQuestion.solveStatus === 'solution') {
    if (inQueueIdx === -1) {
      db.studyPlan.revisionQueue.push({
        ...updatedQuestion,
        addedAt: new Date().toISOString()
      });
    } else {
      db.studyPlan.revisionQueue[inQueueIdx] = {
        ...db.studyPlan.revisionQueue[inQueueIdx],
        ...updatedQuestion
      };
    }
  } else if (inQueueIdx !== -1 && !updatedQuestion.isDifficult) {
    // Remove if user marked it not difficult and solved independently
    if (updatedQuestion.solveStatus === 'independent') {
      db.studyPlan.revisionQueue.splice(inQueueIdx, 1);
    }
  }

  // Recompute overall plan progress
  let totalQ = 0;
  let compQ = 0;
  db.studyPlan.days.forEach(d => {
    d.questions.forEach(q => {
      totalQ++;
      if (q.completed) compQ++;
    });
  });
  db.studyPlan.completedCount = compQ;
  db.studyPlan.remainingCount = Math.max(0, totalQ - compQ);

  saveDb(db);

  res.json({
    success: true,
    question: updatedQuestion,
    plan: db.studyPlan
  });
});

// 5. POST /api/planner/carry-forward
router.post('/carry-forward', (req, res) => {
  const db = getDb();
  if (!db.studyPlan || !db.studyPlan.days) {
    return res.status(404).json({ error: 'No active study plan found.' });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueQuestions = [];

  // Find uncompleted questions on days strictly before today
  db.studyPlan.days.forEach(day => {
    if (day.date < todayStr) {
      const unfinished = day.questions.filter(q => !q.completed);
      unfinished.forEach(q => overdueQuestions.push(q));
      // Remove unfinished from past day so they don't count twice
      day.questions = day.questions.filter(q => q.completed);
      day.completedCount = day.questions.length;
      day.isFullyCompleted = true;
    }
  });

  if (overdueQuestions.length === 0) {
    return res.json({
      success: true,
      message: 'No overdue questions to carry forward!',
      plan: db.studyPlan
    });
  }

  // Find future or today days
  const upcomingDays = db.studyPlan.days.filter(d => d.date >= todayStr);

  if (upcomingDays.length === 0) {
    // Create new days if needed
    const lastDay = db.studyPlan.days[db.studyPlan.days.length - 1];
    const nextDate = new Date(lastDay ? lastDay.date : todayStr);
    nextDate.setDate(nextDate.getDate() + 1);

    db.studyPlan.days.push({
      dayNumber: db.studyPlan.days.length + 1,
      date: nextDate.toISOString().split('T')[0],
      topics: Array.from(new Set(overdueQuestions.map(q => q.topic))),
      questions: overdueQuestions,
      totalEstimatedMinutes: overdueQuestions.reduce((a, b) => a + (b.estimatedMinutes || 30), 0),
      isRevisionDay: false,
      completedCount: 0,
      isFullyCompleted: false
    });
  } else {
    // Distribute evenly across upcoming days without overloading tomorrow
    let targetDayIdx = 0;
    overdueQuestions.forEach(q => {
      const day = upcomingDays[targetDayIdx % upcomingDays.length];
      day.questions.push(q);
      day.topics = Array.from(new Set(day.questions.map(item => item.topic)));
      day.totalEstimatedMinutes = day.questions.reduce((a, b) => a + (b.estimatedMinutes || 30), 0);
      day.completedCount = day.questions.filter(item => item.completed).length;
      day.isFullyCompleted = day.questions.every(item => item.completed);
      targetDayIdx++;
    });
  }

  saveDb(db);

  res.json({
    success: true,
    carriedCount: overdueQuestions.length,
    plan: db.studyPlan
  });
});

// 6. POST /api/planner/reset
router.post('/reset', (req, res) => {
  const db = getDb();
  db.studyPlan = null;
  saveDb(db);
  res.json({ success: true, message: 'Study plan reset successfully.' });
});

// ── Attempts ──
// One record per time a problem is opened in the editor: active time, runs, submits, verdicts,
// hint use, pasted characters and a self-rating. These are the signals the next-problem
// recommender will read. Stored per problem in db.attempts, separate from the study plan,
// so problems opened outside the plan (daily problem, practice hub) are recorded too.

const MAX_ATTEMPTS_PER_PROBLEM = 20;
const RATINGS = new Set(['easy', 'ok', 'hard']);
const LANGUAGES = new Set(['javascript', 'python', 'cpp', 'java']);
const AI_VERDICTS = new Set(['optimal', 'acceptable', 'suboptimal']);

const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : null);
const count = (v, max = 100000) => Math.min(max, Math.max(0, Math.floor(Number(v) || 0)));
const isoOrNull = (v) => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null);

/** Keep only known fields, bounded, so a client can't store arbitrary data */
function cleanAttempt(body) {
  const id = str(body.id, 64);
  const problemId = str(body.problemId, 80);
  if (!id || !problemId) return null;
  return {
    id,
    problemId,
    title: str(body.title, 160),
    difficulty: str(body.difficulty, 16),
    topic: str(body.topic, 80),
    openedAt: isoOrNull(body.openedAt),
    lastActiveAt: isoOrNull(body.lastActiveAt),
    activeSeconds: count(body.activeSeconds, 24 * 3600),
    runs: count(body.runs, 10000),
    submits: count(body.submits, 10000),
    firstSubmitVerdict: str(body.firstSubmitVerdict, 40),
    finalVerdict: str(body.finalVerdict, 40),
    solved: Boolean(body.solved),
    solvedAt: isoOrNull(body.solvedAt),
    secondsToSolve: body.secondsToSolve == null ? null : count(body.secondsToSolve, 24 * 3600),
    languages: Array.isArray(body.languages) ? body.languages.filter((l) => LANGUAGES.has(l)).slice(0, 4) : [],
    hintsViewed: Boolean(body.hintsViewed),
    videoOpened: Boolean(body.videoOpened),
    pastedChars: count(body.pastedChars, 1000000),
    selfRating: RATINGS.has(body.selfRating) ? body.selfRating : null,
    aiVerdict: AI_VERDICTS.has(body.aiVerdict) ? body.aiVerdict : null,
  };
}

// POST /api/planner/attempts: create or update one attempt (the client sends its full current state)
router.post('/attempts', (req, res) => {
  const attempt = cleanAttempt(req.body || {});
  if (!attempt) return res.status(400).json({ success: false, error: 'An attempt needs an id and a problemId' });

  const db = getDb();
  if (!db.attempts || typeof db.attempts !== 'object') db.attempts = {};
  const list = Array.isArray(db.attempts[attempt.problemId]) ? db.attempts[attempt.problemId] : [];
  const idx = list.findIndex((a) => a.id === attempt.id);
  if (idx === -1) list.push(attempt);
  else list[idx] = attempt;
  db.attempts[attempt.problemId] = list.slice(-MAX_ATTEMPTS_PER_PROBLEM);

  saveDb(db);
  res.json({ success: true, data: attempt });
});

// GET /api/planner/attempts[?problemId=nc-1]: every attempt, or one problem's attempts
router.get('/attempts', (req, res) => {
  const all = getDb().attempts || {};
  const { problemId } = req.query;
  res.json({ success: true, data: problemId ? all[problemId] || [] : all });
});

// GET /api/planner/revision?today=YYYY-MM-DD&tz=-330
// Smart revision queue for Pro (see data/smart-revision.js). Free accounts get { smart: false }
// and the browser shows the fixed day 3 / 7 / 21 schedule instead. `today` is the person's local
// date and `tz` their Date.getTimezoneOffset() in minutes, so due dates follow their calendar.
router.get('/revision', async (req, res) => {
  try {
    if (!(await isProUser(req.userId))) return res.json({ success: true, data: { smart: false } });
  } catch (err) {
    console.error('[planner] Pro check failed:', err.message);
    return res.status(500).json({ success: false, error: 'Could not check your plan' });
  }
  const db = getDb();
  const today = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.today || '')) ? req.query.today : new Date().toISOString().slice(0, 10);
  const tz = Number(req.query.tz);
  const tzOffset = Number.isFinite(tz) && Math.abs(tz) <= 14 * 60 ? tz : 0;
  const schedule = smartRevisionSchedule(db.studyPlan, db.attempts || {}, today, tzOffset, {
    problems: getCanonicalQuestions(),
    attemptReviews: db.attemptReviews || {},
  });
  res.json({ success: true, data: { smart: true, ...schedule } });
});

// GET /api/planner/review: reviews done on problems that aren't in a study plan
// ({ problemId: { reviews: [iso], reviewResults: [..] } }), which the fixed schedule also needs
router.get('/review', (req, res) => {
  res.json({ success: true, data: getDb().attemptReviews || {} });
});

// POST /api/planner/review { problemId, reviewResult? }
// Records one spaced-revision review. On the plan's question when the problem is in the plan,
// otherwise in db.attemptReviews, so revision works without a study plan too.
router.post('/review', (req, res) => {
  const problemId = typeof req.body?.problemId === 'string' ? req.body.problemId.slice(0, 80) : '';
  const result = REVIEW_RESULTS.has(req.body?.reviewResult) ? req.body.reviewResult : null;
  if (!problemId || !getCanonicalQuestions().some((p) => p.id === problemId)) {
    return res.status(400).json({ success: false, error: 'Unknown problem' });
  }
  const db = getDb();
  const now = new Date().toISOString();
  let recorded = false;
  (db.studyPlan?.days || []).forEach((day) => (day.questions || []).forEach((q) => {
    if (q.id !== problemId) return;
    const reviews = Array.isArray(q.reviews) ? q.reviews : [];
    const results = Array.isArray(q.reviewResults) ? q.reviewResults.slice(0, reviews.length) : [];
    while (results.length < reviews.length) results.push(null);
    q.reviews = [...reviews, now];
    q.reviewResults = [...results, result];
    recorded = true;
  }));
  if (!recorded) {
    if (!db.attemptReviews || typeof db.attemptReviews !== 'object') db.attemptReviews = {};
    const entry = db.attemptReviews[problemId] || { reviews: [], reviewResults: [] };
    db.attemptReviews[problemId] = { reviews: [...entry.reviews, now], reviewResults: [...entry.reviewResults, result] };
  }
  saveDb(db);
  res.json({ success: true, data: { problemId, inPlan: recorded } });
});

// GET /api/planner/progress?today=YYYY-MM-DD&tz=-330
// Solved / covered / left for everyone; `detailed` (per-topic, weak topics, on-track check) only for Pro.
router.get('/progress', async (req, res) => {
  let pro;
  try { pro = await isProUser(req.userId); } catch (err) {
    console.error('[planner] Pro check failed:', err.message);
    return res.status(500).json({ success: false, error: 'Could not check your plan' });
  }
  const db = getDb();
  const today = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.today || '')) ? req.query.today : new Date().toISOString().slice(0, 10);
  const tz = Number(req.query.tz);
  const tzOffset = Number.isFinite(tz) && Math.abs(tz) <= 14 * 60 ? tz : 0;
  res.json({ success: true, data: buildProgress({ problems: getCanonicalQuestions(), plan: db.studyPlan, attempts: db.attempts || {}, today, tzOffset, detailed: pro }) });
});

// GET /api/planner/next?after=nc-1&today=YYYY-MM-DD&exclude=nc-2,nc-3
// The next problem to work on, with the reason. `today` is the person's local date (the server's
// clock may be in another time zone); `after` is the problem just worked on, defaulting to the latest.
router.get('/next', (req, res) => {
  const db = getDb();
  const today = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.today || '')) ? req.query.today : new Date().toISOString().slice(0, 10);
  const exclude = String(req.query.exclude || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 50);
  const recommendation = recommendNext({
    problems: getCanonicalQuestions(),
    graph: GRAPH,
    attempts: db.attempts || {},
    plan: db.studyPlan || null,
    afterId: req.query.after ? String(req.query.after) : null,
    today,
    exclude,
  });
  res.json({ success: true, data: recommendation });
});

export default router;
