import express from 'express';
import { hasDatabase } from '../data/neon.js';
import { requireUser } from '../data/auth.js';
import { requirePro } from '../data/billing.js';
import { getDb, saveDb } from '../data/store.js';
import { aiReviewConfigured, aiReviewModel, aiReviewDailyLimit, reviewCode } from '../data/ai-review.js';
import { computeScore } from '../data/code-score.js';
import { createAnalysisCache } from '../data/analysis-cache.js';

const router = express.Router();
const LANGUAGES = new Set(['javascript', 'python', 'cpp', 'java']);
const localToday = () => new Date().toISOString().slice(0, 10);
const cache = createAnalysisCache();

/** GET /api/ai/status: whether code analysis is on, and whether it needs Pro */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: { reviewEnabled: aiReviewConfigured, model: aiReviewConfigured ? aiReviewModel : null, dailyLimit: aiReviewDailyLimit, proRequired: hasDatabase },
  });
});

const count = (v, max) => (Number.isInteger(v) && v >= 0 && v <= max ? v : null);

/**
 * POST /api/ai/review { problemId, attemptId, title, difficulty, language, code, passed, total, kind }
 * Analyses the code (time and space complexity, the approach, the main idea, a better way to think
 * about it) and scores it 0 to 100 together with how many tests `passed` out of `total`.
 * Pro only (when accounts are on). Identical code is answered from a cache and doesn't use the day's
 * allowance; each new analysis counts. After an accepted Submit (`kind: "submit"`, every test passed)
 * the verdict is kept on the attempt, where the recommender reads it.
 */
router.post('/review', requireUser, requirePro, async (req, res) => {
  if (!aiReviewConfigured) {
    return res.status(503).json({ success: false, error: 'Code analysis is not set up on this server yet' });
  }
  const { problemId, attemptId, title, difficulty, language, code, kind } = req.body || {};
  if (language && !LANGUAGES.has(language)) return res.status(400).json({ success: false, error: 'Unknown language' });
  const total = count(req.body?.total, 1000);
  const passed = total == null ? null : count(req.body?.passed, total);

  const db = getDb();
  const today = localToday();
  const key = cache.key(req.userId || 'local', problemId || '', language || '', code);
  const remembered = cache.get(key);

  if (!remembered) {
    const usage = db.aiReviews?.date === today ? db.aiReviews : { date: today, count: 0 };
    if (usage.count >= aiReviewDailyLimit) {
      return res.status(429).json({ success: false, error: `You've used today's ${aiReviewDailyLimit} code analyses. More tomorrow` });
    }
  }

  try {
    const analysis = remembered || await reviewCode({ title, difficulty, language, code });
    if (!remembered) cache.set(key, analysis);

    // Read the data again: other requests may have saved while the analysis ran
    const fresh = getDb();
    if (!remembered) fresh.aiReviews = { date: today, count: (fresh.aiReviews?.date === today ? fresh.aiReviews.count : 0) + 1 };
    if (kind === 'submit' && total > 0 && passed === total && typeof problemId === 'string' && typeof attemptId === 'string') {
      const attempt = (fresh.attempts?.[problemId] || []).find((a) => a.id === attemptId);
      if (attempt) attempt.aiVerdict = analysis.verdict;
    }
    saveDb(fresh);

    const used = fresh.aiReviews?.date === today ? fresh.aiReviews.count : 0;
    res.json({
      success: true,
      data: {
        ...analysis,
        score: computeScore({ passed, total, timeGrade: analysis.timeGrade, spaceGrade: analysis.spaceGrade }),
        cached: Boolean(remembered),
        remainingToday: Math.max(0, aiReviewDailyLimit - used),
      },
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.status ? err.message : 'Could not analyse this solution' });
  }
});

export default router;
