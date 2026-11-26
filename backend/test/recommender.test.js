import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  recommendNext, computeMastery, attemptPerformance, completedFromPlan, DIFFICULTY_RATING,
} from '../data/recommender.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const problems = readJson('backend/data/neetcode150.json');
const graph = readJson('backend/data/problem-graph.json');
const byId = new Map(problems.map((p) => [p.id, p]));
const TODAY = '2026-11-18';

const solvedAttempt = (problemId, extra = {}) => ({
  id: `${problemId}-${Math.random()}`, problemId, runs: 1, submits: 1, solved: true,
  firstSubmitVerdict: 'Accepted', finalVerdict: 'Accepted', solvedAt: '2026-11-18T10:00:00Z',
  secondsToSolve: 300, hintsViewed: false, videoOpened: false, pastedChars: 0, selfRating: null, ...extra,
});
const failedAttempt = (problemId, extra = {}) => ({
  id: `${problemId}-${Math.random()}`, problemId, runs: 6, submits: 3, solved: false,
  firstSubmitVerdict: 'Wrong Answer', finalVerdict: 'Wrong Answer', lastActiveAt: '2026-11-18T11:00:00Z', ...extra,
});
const attemptsOf = (...list) => list.reduce((acc, a) => ({ ...acc, [a.problemId]: [...(acc[a.problemId] || []), a] }), {});

// ── The graph itself ──

test('graph covers all 150 problems with known patterns', () => {
  assert.equal(Object.keys(graph.problems).length, 150);
  problems.forEach((p) => {
    const info = graph.problems[p.id];
    assert.ok(info, `missing ${p.id}`);
    assert.ok(graph.patterns[info.pattern], `${p.id} has unknown pattern ${info.pattern}`);
  });
});

test('graph links point at real problems that are never easier', () => {
  Object.entries(graph.problems).forEach(([id, info]) => {
    info.next.forEach((n) => {
      assert.ok(byId.has(n), `${id} → unknown ${n}`);
      assert.notEqual(n, id);
      assert.ok(DIFFICULTY_RATING[byId.get(n).difficulty] >= DIFFICULTY_RATING[byId.get(id).difficulty], `${id} → ${n} goes to an easier problem`);
    });
  });
});

test('pattern prerequisites exist and have no cycles', () => {
  const visiting = new Set();
  const done = new Set();
  const visit = (p) => {
    assert.ok(graph.patterns[p], `unknown prerequisite ${p}`);
    if (done.has(p)) return;
    assert.ok(!visiting.has(p), `cycle through ${p}`);
    visiting.add(p);
    graph.patterns[p].prereqs.forEach(visit);
    visiting.delete(p);
    done.add(p);
  };
  Object.keys(graph.patterns).forEach(visit);
});

// ── Signals ──

test('attempt performance reflects how the solve went', () => {
  const clean = attemptPerformance(solvedAttempt('nc-1', { secondsToSolve: 240, selfRating: 'easy' }), 'Easy');
  const struggled = attemptPerformance(solvedAttempt('nc-1', { firstSubmitVerdict: 'Wrong Answer', videoOpened: true, secondsToSolve: 3600, selfRating: 'hard' }), 'Easy');
  assert.ok(clean.performance > 0.9);
  assert.ok(struggled.performance < 0.3);
  assert.equal(attemptPerformance({ solved: false, runs: 0, submits: 0 }, 'Easy'), null, 'just opening a problem says nothing');
  assert.equal(attemptPerformance(solvedAttempt('nc-1', { pastedChars: 800 }), 'Easy').weight, 0.3, 'pasted solutions count for less');
});

test('a brute-force solve flagged by the AI review counts for less', () => {
  const plain = attemptPerformance(solvedAttempt('nc-1'), 'Easy').performance;
  const bruteForce = attemptPerformance(solvedAttempt('nc-1', { aiVerdict: 'suboptimal' }), 'Easy').performance;
  assert.ok(bruteForce < plain - 0.15);
  // A fast first-try brute force stays at the same level instead of stepping up
  const rec = recommendNext({ problems, graph, attempts: attemptsOf(solvedAttempt('nc-1', { secondsToSolve: 200, aiVerdict: 'suboptimal' })), afterId: 'nc-1', today: TODAY });
  assert.notEqual(rec.kind, 'step-up');
});

test('mastery rises with strong solves and falls with failures', () => {
  const up = computeMastery({ problems, graph, attempts: attemptsOf(solvedAttempt('nc-49'), solvedAttempt('nc-347')), level: 'intermediate' });
  const down = computeMastery({ problems, graph, attempts: attemptsOf(failedAttempt('nc-217'), failedAttempt('nc-242')), level: 'intermediate' });
  assert.ok(up.patterns['hash-lookup'].rating > 1100);
  assert.ok(down.patterns['hash-lookup'].rating < 1100);
});

test('completedFromPlan reads solved plan questions', () => {
  const plan = { days: [{ date: TODAY, questions: [{ id: 'nc-1', completed: true, solveStatus: 'hint' }, { id: 'nc-217', completed: false }] }] };
  const map = completedFromPlan(plan);
  assert.deepEqual([...map.keys()], ['nc-1']);
  assert.equal(map.get('nc-1').solveStatus, 'hint');
});

// ── Recommendations ──

test('a brand-new learner starts at the beginning', () => {
  const rec = recommendNext({ problems, graph, today: TODAY });
  assert.equal(rec.kind, 'start');
  assert.equal(rec.problem.id, 'nc-217');
});

test('with a plan and no history, it follows the plan', () => {
  const plan = { config: { level: 'beginner' }, days: [{ date: TODAY, questions: [{ id: 'nc-125', completed: false }] }] };
  const rec = recommendNext({ problems, graph, plan, today: TODAY });
  assert.equal(rec.kind, 'plan');
  assert.equal(rec.problem.id, 'nc-125');
});

test('a fast first-try Two Sum steps up to the linked harder problem', () => {
  const attempts = attemptsOf(solvedAttempt('nc-1', { secondsToSolve: 240, selfRating: 'easy' }));
  const rec = recommendNext({ problems, graph, attempts, afterId: 'nc-1', today: TODAY });
  assert.equal(rec.kind, 'step-up');
  assert.equal(rec.problem.id, 'nc-167', 'Two Sum II reuses the Two Sum idea');
  assert.match(rec.reason, /Two Sum/);
  assert.match(rec.reason, /quickly and on the first try/);
});

test('struggling with a Medium steps down to an easier problem in the same pattern', () => {
  const attempts = attemptsOf(failedAttempt('nc-49'));
  const rec = recommendNext({ problems, graph, attempts, afterId: 'nc-49', today: TODAY });
  assert.ok(['step-down', 'reinforce'].includes(rec.kind), rec.kind);
  assert.equal(byId.get(rec.problem.id).difficulty, 'Easy');
  assert.equal(graph.problems[rec.problem.id].pattern, 'hash-lookup');
});

test('struggling with nothing easier left unsolved revisits the simpler linked problem', () => {
  const attempts = attemptsOf(
    solvedAttempt('nc-217'), solvedAttempt('nc-242'), solvedAttempt('nc-1'),
    failedAttempt('nc-49', { lastActiveAt: '2026-11-18T12:00:00Z' }),
  );
  const rec = recommendNext({ problems, graph, attempts, afterId: 'nc-49', today: TODAY });
  assert.equal(rec.kind, 'revisit');
  assert.equal(rec.problem.id, 'nc-242', 'Valid Anagram is the simpler form of Group Anagrams');
});

test('an average solve stays at the same level', () => {
  const attempts = attemptsOf(solvedAttempt('nc-49', { hintsViewed: true, secondsToSolve: 2500 }));
  const rec = recommendNext({ problems, graph, attempts, afterId: 'nc-49', today: TODAY });
  assert.equal(byId.get(rec.problem.id).difficulty, 'Medium');
});

test('a solve with a wrong first try, hints and a Hard rating is not praised as quick and does not step up', () => {
  const attempts = attemptsOf(solvedAttempt('nc-217', { firstSubmitVerdict: 'Wrong Answer', hintsViewed: true, selfRating: 'hard', secondsToSolve: 20 }));
  const rec = recommendNext({ problems, graph, attempts, afterId: 'nc-217', today: TODAY });
  assert.notEqual(rec.kind, 'step-up');
  assert.doesNotMatch(rec.reason, /quickly|first try/);
  assert.notEqual(rec.problem.id, 'nc-128', 'the harder follow-up waits for a strong solve');
});

test('saying "stuck" with no submit at all steps down to an easier problem in the same pattern', () => {
  const attempts = attemptsOf({ id: 'g', problemId: 'nc-128', runs: 1, submits: 0, solved: false, gaveUp: true, lastActiveAt: '2026-11-18T12:00:00Z' });
  const rec = recommendNext({ problems, graph, attempts, afterId: 'nc-128', today: TODAY });
  assert.ok(['step-down', 'reinforce', 'revisit'].includes(rec.kind), rec.kind);
  assert.equal(byId.get(rec.problem.id).difficulty, 'Easy');
  assert.equal(graph.problems[rec.problem.id].pattern, 'hash-lookup');
});

test('opening a problem, running the sample once and leaving says nothing; real effort or "stuck" does', () => {
  assert.equal(attemptPerformance({ solved: false, runs: 1, submits: 0, activeSeconds: 30 }, 'Easy'), null);
  assert.equal(attemptPerformance({ solved: false, runs: 0, submits: 0, activeSeconds: 600 }, 'Easy'), null);
  assert.ok(attemptPerformance({ solved: false, runs: 4, submits: 0, activeSeconds: 600 }, 'Easy'), 'ten minutes and several runs is a real attempt');
  assert.ok(attemptPerformance({ solved: false, runs: 0, submits: 2, activeSeconds: 40 }, 'Easy'), 'failed submits count');
  assert.deepEqual(attemptPerformance({ solved: false, runs: 0, submits: 0, gaveUp: true }, 'Easy'), { performance: 0.1, weight: 1 });
});

test('never suggests a pattern whose prerequisites are untouched', () => {
  // Strong on hash lookups; k-sum (3Sum) also needs two pointers, which hasn't been touched
  const attempts = attemptsOf(solvedAttempt('nc-217'), solvedAttempt('nc-242'), solvedAttempt('nc-1'), solvedAttempt('nc-49'), solvedAttempt('nc-36'), solvedAttempt('nc-128'), solvedAttempt('nc-2013'));
  const rec = recommendNext({ problems, graph, attempts, afterId: 'nc-128', today: TODAY });
  const pattern = graph.problems[rec.problem.id].pattern;
  const touched = new Set(['hash-lookup']);
  assert.ok(graph.patterns[pattern].prereqs.every((p) => touched.has(p)), `${rec.problem.id} (${pattern}) is locked`);
});

test('a strong solve in a pattern reached early stays in that pattern', () => {
  // Edit Distance's pattern lists grid DP as a prerequisite, but solving it shows the pattern is open
  const attempts = attemptsOf(solvedAttempt('nc-72', { secondsToSolve: 900 }));
  const rec = recommendNext({ problems, graph, attempts, afterId: 'nc-72', today: TODAY });
  assert.equal(rec.kind, 'step-up');
  assert.equal(graph.problems[rec.problem.id].pattern, 'dp-two-strings');
});

test('behind schedule, it picks from overdue plan days', () => {
  const plan = {
    config: { level: 'intermediate' },
    days: [
      { date: '2026-11-15', questions: [{ id: 'nc-217', completed: false }, { id: 'nc-242', completed: false }] },
      { date: '2026-11-16', questions: [{ id: 'nc-125', completed: false }, { id: 'nc-121', completed: false }] },
      { date: '2026-11-25', questions: [{ id: 'nc-4', completed: false }] },
    ],
  };
  const attempts = attemptsOf(solvedAttempt('nc-1', { secondsToSolve: 200 }));
  const rec = recommendNext({ problems, graph, attempts, plan, afterId: 'nc-1', today: TODAY });
  assert.equal(rec.kind, 'catch-up');
  assert.ok(['nc-217', 'nc-242', 'nc-125', 'nc-121'].includes(rec.problem.id));
  assert.match(rec.reason, /4 problems behind/);
});

test('excluded and solved problems are never suggested', () => {
  const attempts = attemptsOf(solvedAttempt('nc-1', { secondsToSolve: 200 }));
  const rec = recommendNext({ problems, graph, attempts, afterId: 'nc-1', exclude: ['nc-167'], today: TODAY });
  assert.notEqual(rec.problem.id, 'nc-167');
  assert.notEqual(rec.problem.id, 'nc-1');
});

test('the same history always gives the same suggestion', () => {
  const attempts = attemptsOf(solvedAttempt('nc-20'), failedAttempt('nc-739'));
  const a = recommendNext({ problems, graph, attempts, today: TODAY });
  const b = recommendNext({ problems, graph, attempts, today: TODAY });
  assert.deepEqual(a, b);
});

test('everything solved returns null', () => {
  const attempts = Object.fromEntries(problems.map((p) => [p.id, [solvedAttempt(p.id)]]));
  assert.equal(recommendNext({ problems, graph, attempts, today: TODAY }), null);
});

test('the frontend copies are in sync with the backend', () => {
  const pairs = [
    ['backend/data/recommender.js', 'frontend/src/lib/recommender.js'],
    ['backend/data/problem-graph.json', 'frontend/src/data/problemGraph.json'],
  ];
  pairs.forEach(([src, copy]) => {
    // \r?: Windows checkouts have CRLF line endings, and `.` doesn't match \r
    const body = (p) => fs.readFileSync(path.join(root, p), 'utf8').replace(/^\/\/ GENERATED.*\r?\n/, '');
    assert.equal(body(copy), body(src), `${copy} is stale; run: node scripts/sync-recommender.mjs`);
  });
});
