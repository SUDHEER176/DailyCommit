// Revision for problems solved outside a study plan, and the progress summary.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { smartRevisionSchedule, dayIndex, dayString } from '../data/smart-revision.js';
import { buildProgress } from '../data/progress.js';

const PROBLEMS = JSON.parse(fs.readFileSync(new URL('../data/neetcode150.json', import.meta.url), 'utf8'));
const iso = (n) => new Date(Date.UTC(2026, 10, 1 + n, 10)).toISOString();
const ymd = (n) => dayString(dayIndex(iso(n)));
const SOLVED = iso(0);
const solvedTry = (problemId, extra = {}) => ({
  id: `a-${problemId}`, problemId, solved: true, runs: 1, submits: 1, firstSubmitVerdict: 'Accepted', secondsToSolve: 300, solvedAt: SOLVED, ...extra,
});

test('with no plan at all, a struggled problem from the editor lands on the queue; a clean one does not', () => {
  const attempts = {
    'nc-217': [solvedTry('nc-217', { firstSubmitVerdict: 'Wrong Answer', submits: 3, hintsViewed: true, secondsToSolve: 2000, selfRating: 'hard' })],
    'nc-1': [solvedTry('nc-1')],
  };
  const { due, upcoming } = smartRevisionSchedule(null, attempts, ymd(5), 0, { problems: PROBLEMS });
  const items = [...due, ...upcoming];
  assert.deepEqual(items.map((i) => i.question.id), ['nc-217']);
  assert.equal(items[0].attemptOnly, true);
  assert.equal(items[0].question.title, 'Contains Duplicate');
  assert.equal(due.length, 1, 'due by day 5');
});

test('an unsolved problem with failed submits is on the queue as "Not solved yet"', () => {
  const attempts = { 'nc-3': [{ id: 'x', problemId: 'nc-3', solved: false, runs: 4, submits: 3, firstSubmitVerdict: 'Wrong Answer', lastActiveAt: SOLVED }] };
  const { due, upcoming } = smartRevisionSchedule(null, attempts, ymd(1), 0, { problems: PROBLEMS });
  assert.equal([...due, ...upcoming][0].reason, 'Not solved yet');
});

test('after a review the problem stays on the queue even if the review solve was clean, and an Easy review pushes it out', () => {
  const struggle = solvedTry('nc-217', { firstSubmitVerdict: 'Wrong Answer', submits: 3, hintsViewed: true, secondsToSolve: 2000 });
  const clean = solvedTry('nc-217', { id: 'again', solvedAt: iso(3), secondsToSolve: 200 });
  const attemptReviews = { 'nc-217': { reviews: [iso(3)], reviewResults: ['easy'] } };
  const { due, upcoming } = smartRevisionSchedule(null, { 'nc-217': [struggle, clean] }, ymd(4), 0, { problems: PROBLEMS, attemptReviews });
  const item = [...due, ...upcoming][0];
  assert.ok(item, 'still on the queue');
  assert.equal(item.stage, 1);
  assert.ok(item.daysUntil > 0);
});

test('problems in the plan are not listed twice', () => {
  const plan = { days: [{ date: '2026-11-01', questions: [{ id: 'nc-217', title: 'Contains Duplicate', difficulty: 'Easy', completed: true, completedAt: SOLVED, solveStatus: 'hint' }] }] };
  const attempts = { 'nc-217': [solvedTry('nc-217', { firstSubmitVerdict: 'Wrong Answer', submits: 3, secondsToSolve: 2000 })] };
  const { due, upcoming } = smartRevisionSchedule(plan, attempts, ymd(5), 0, { problems: PROBLEMS });
  assert.equal([...due, ...upcoming].filter((i) => i.question.id === 'nc-217').length, 1);
});

test('progress basics count solves from the plan and the editor once each', () => {
  const plan = { days: [{ date: '2026-11-01', questions: [
    { id: 'nc-1', completed: true, completedAt: SOLVED },
    { id: 'nc-217', completed: false },
  ] }] };
  const attempts = { 'nc-1': [solvedTry('nc-1')], 'nc-242': [solvedTry('nc-242', { solvedAt: iso(2) })] };
  const p = buildProgress({ problems: PROBLEMS, plan, attempts, today: ymd(2) });
  assert.equal(p.solved, 2, 'Two Sum counted once, though in both places');
  assert.equal(p.total, 150);
  assert.equal(p.remaining, 148);
  assert.equal(p.solvedToday, 1, 'only Valid Anagram was solved on the 3rd');
  assert.equal(p.topicsStarted, 1, 'both are Arrays & Hashing');
  assert.equal(p.topicsTotal, 18);
  assert.equal(p.byDifficulty.Easy.solved, 2);
  assert.equal(p.detailed, null, 'no Pro detail unless asked for');
});

test('progress detail: per-topic rows, weak topics, and the on-track check against the plan', () => {
  const plan = { days: [
    { date: '2026-11-01', questions: [{ id: 'nc-1', completed: true, completedAt: SOLVED }, { id: 'nc-217', completed: false }] },
    { date: '2026-11-02', questions: [{ id: 'nc-242', completed: false }, { id: 'nc-49', completed: false }] },
    { date: '2026-11-20', questions: [{ id: 'nc-125', completed: false }] },
  ] };
  const attempts = { 'nc-217': [{ id: 'w', problemId: 'nc-217', solved: false, runs: 3, submits: 3, firstSubmitVerdict: 'Wrong Answer', lastActiveAt: SOLVED }] };
  const p = buildProgress({ problems: PROBLEMS, plan, attempts, today: ymd(5), detailed: true });
  const arrays = p.detailed.topics.find((t) => t.topic === 'Arrays & Hashing');
  assert.equal(arrays.solved, 1);
  assert.equal(arrays.started, true);
  assert.deepEqual(p.detailed.weakest, ['Arrays & Hashing']);
  assert.equal(p.detailed.onTrack.scheduled, 4, 'four problems were due by day 5');
  assert.equal(p.detailed.onTrack.done, 1);
  assert.equal(p.detailed.onTrack.status, 'behind');
  assert.equal(p.detailed.onTrack.planEnds, '2026-11-20');
});

test('rating a problem Hard puts it on the queue even when the numbers look fine', () => {
  const attempts = { 'nc-217': [solvedTry('nc-217', { secondsToSolve: 100, selfRating: 'hard' })] };
  const { due, upcoming } = smartRevisionSchedule(null, attempts, ymd(5), 0, { problems: PROBLEMS });
  assert.deepEqual([...due, ...upcoming].map((i) => i.question.id), ['nc-217']);
  assert.equal([...due, ...upcoming][0].reason, 'You rated it hard');
});
