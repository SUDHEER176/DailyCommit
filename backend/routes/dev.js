import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, saveDb, freshUserData } from '../data/store.js';

// Testing-mode helpers (mounted by server.js only when APP_MODE=testing; they don't exist in
// production): load sample practice history so the Revision and Progress cards have something to
// show, or wipe everything and start fresh.

const router = express.Router();
const PROBLEMS = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/neetcode150.json'), 'utf-8'));
const byId = new Map(PROBLEMS.map((p) => [p.id, p]));

const hoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString();

// [problemId, hours ago it was solved, what happened]
const SAMPLE = [
  ['nc-217', 96, { firstSubmitVerdict: 'Wrong Answer', submits: 3, hintsViewed: true, secondsToSolve: 1500, selfRating: 'hard' }],     // struggled
  ['nc-49', 150, { firstSubmitVerdict: 'Wrong Answer', submits: 4, videoOpened: true, secondsToSolve: 3600 }],                          // watched the video
  ['nc-20', 30, { firstSubmitVerdict: 'Wrong Answer', submits: 2, secondsToSolve: 1700, aiVerdict: 'suboptimal' }],                     // slow brute force
  ['nc-1', 50, { firstSubmitVerdict: 'Accepted', submits: 1, secondsToSolve: 240, selfRating: 'easy' }],                                // clean, fast: not on the revision queue
  ['nc-242', 74, { firstSubmitVerdict: 'Accepted', submits: 1, secondsToSolve: 420 }],                                                  // clean
  ['nc-125', 2, { firstSubmitVerdict: 'Accepted', submits: 1, secondsToSolve: 360 }],                                                    // solved today
];

function attempt(problemId, hours, extra) {
  const p = byId.get(problemId);
  return {
    id: `sample-${problemId}`, problemId, title: p.title, difficulty: p.difficulty, topic: p.topic,
    openedAt: hoursAgo(hours + 0.5), lastActiveAt: hoursAgo(hours), activeSeconds: extra.secondsToSolve, runs: 2,
    submits: 1, firstSubmitVerdict: 'Accepted', finalVerdict: 'Accepted', solved: true, solvedAt: hoursAgo(hours),
    languages: ['python'], hintsViewed: false, videoOpened: false, pastedChars: 0, selfRating: null, aiVerdict: null,
    ...extra,
  };
}

/** POST /api/dev/seed: sample attempts (plus one unsolved), replacing any existing attempts */
router.post('/seed', (req, res) => {
  const db = getDb();
  db.attempts = Object.fromEntries(SAMPLE.map(([id, hours, extra]) => [id, [attempt(id, hours, extra)]]));
  db.attempts['nc-3'] = [attempt('nc-3', 40, { solved: false, solvedAt: null, finalVerdict: 'Wrong Answer', firstSubmitVerdict: 'Wrong Answer', submits: 3, secondsToSolve: null })];
  db.attemptReviews = {};
  saveDb(db);
  res.json({ success: true, data: { attempts: db.attempts } });
});

/** POST /api/dev/reset: wipe the plan, attempts, reviews and everything else */
router.post('/reset', (req, res) => {
  saveDb(freshUserData({ name: 'Tester' }));
  res.json({ success: true });
});

export default router;
