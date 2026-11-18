import express from 'express';
import { hasDatabase } from '../data/neon.js';
import { requireUser } from '../data/auth.js';
import { requirePro } from '../data/billing.js';
import { getDb, saveDb } from '../data/store.js';
import { aiReviewConfigured, aiReviewModel, aiReviewDailyLimit, reviewCode } from '../data/ai-review.js';

const router = express.Router();
const LANGUAGES = new Set(['javascript', 'python', 'cpp', 'java']);
const localToday = () => new Date().toISOString().slice(0, 10);

/** GET /api/ai/status: whether code review is on, and whether it needs Pro */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: { reviewEnabled: aiReviewConfigured, model: aiReviewConfigured ? aiReviewModel : null, dailyLimit: aiReviewDailyLimit, proRequired: hasDatabase },
  });
});

/**
 * POST /api/ai/review { problemId, attemptId, title, difficulty, language, code }
 * Reviews an accepted solution. Pro only (when accounts are on), capped per person per day.
 * The verdict is also stored on the attempt, where the recommender reads it.
 */
router.post('/review', requireUser, requirePro, async (req, res) => {
  if (!aiReviewConfigured) {
    return res.status(503).json({ success: false, error: 'Code review is not set up on this server yet' });
  }
  const { problemId, attemptId, title, difficulty, language, code } = req.body || {};
  if (language && !LANGUAGES.has(language)) return res.status(400).json({ success: false, error: 'Unknown language' });

  const db = getDb();
  const today = localToday();
  const usage = db.aiReviews?.date === today ? db.aiReviews : { date: today, count: 0 };
  if (usage.count >= aiReviewDailyLimit) {
    return res.status(429).json({ success: false, error: `You've used today's ${aiReviewDailyLimit} reviews. More tomorrow` });
  }

  try {
    const review = await reviewCode({ title, difficulty, language, code });

    // Count only reviews that worked, and keep the verdict on the attempt for the recommender.
    // Read the data again: other requests may have saved while the review ran.
    const fresh = getDb();
    fresh.aiReviews = { date: today, count: (fresh.aiReviews?.date === today ? fresh.aiReviews.count : 0) + 1 };
    const attempt = typeof problemId === 'string' && typeof attemptId === 'string'
      ? (fresh.attempts?.[problemId] || []).find((a) => a.id === attemptId)
      : null;
    if (attempt) attempt.aiVerdict = review.verdict;
    saveDb(fresh);

    res.json({ success: true, data: { ...review, remainingToday: aiReviewDailyLimit - fresh.aiReviews.count } });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.status ? err.message : 'Could not review this solution' });
  }
});

export default router;
