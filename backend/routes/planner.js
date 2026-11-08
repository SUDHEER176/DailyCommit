import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, saveDb } from '../data/store.js';
import { generateSchedule } from '../data/scheduler-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const QUESTIONS_FILE = path.join(__dirname, '../data/neetcode150.json');

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
  const { completed, isDifficult, solveStatus, notes, reviewed } = req.body;

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
        if (reviewed === true) q.reviews = [...(Array.isArray(q.reviews) ? q.reviews : []), new Date().toISOString()];
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

export default router;
