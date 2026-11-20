// End-to-end API checks in file mode (no DATABASE_URL), covering every route the frontend calls.
// Starts the real server on a spare port with a throwaway data file, so the tracked data/db.json is untouched.
//   cd backend && npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5100 + Math.floor(Math.random() * 800);
const BASE = `http://localhost:${PORT}/api`;
let server;
let tmpDir;

async function call(method, url, body) {
  const res = await fetch(BASE + url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status, json, text };
}

before(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dailycommit-test-'));
  const env = { ...process.env, PORT: String(PORT), DB_FILE: path.join(tmpDir, 'db.json'), APP_MODE: 'testing' };
  // Force file mode and keep optional services off, whatever the developer's shell has set
  for (const key of ['DATABASE_URL', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'JUDGE0_API_KEY', 'JUDGE0_URL', 'GEMINI_API_KEY']) env[key] = '';
  // dotenv never overrides variables that are already set, even to an empty string
  server = spawn(process.execPath, ['server.js'], { cwd: backendDir, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  server.stdout.on('data', (d) => { log += d; });
  server.stderr.on('data', (d) => { log += d; });
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Server did not start:\n${log}`);
});

after(() => {
  server?.kill();
  if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('health reports testing mode and file storage', async () => {
  const { status, json } = await call('GET', '/health');
  assert.equal(status, 200);
  assert.equal(json.mode, 'testing');
  assert.equal(json.storage, 'file');
});

test('testing mode starts with a clean slate and marks billing as testing', async () => {
  assert.equal((await call('GET', '/auth/config')).json.data.mode, 'testing');
  assert.equal((await call('GET', '/billing/plans')).json.data.testingMode, true);
});

test('production mode refuses to start without a database', async () => {
  const env = { ...process.env, PORT: String(PORT + 1), APP_MODE: 'production', DATABASE_URL: '' };
  const child = spawn(process.execPath, ['server.js'], { cwd: backendDir, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let err = '';
  child.stderr.on('data', (d) => { err += d; });
  const code = await new Promise((resolve) => child.on('exit', resolve));
  assert.equal(code, 1);
  assert.match(err, /needs DATABASE_URL/);
});

test('auth config says accounts are off in file mode', async () => {
  const { status, json } = await call('GET', '/auth/config');
  assert.equal(status, 200);
  assert.ok(json.success);
});

test('tasks: create, list, toggle, carry over, update, delete', async () => {
  const today = new Date().toISOString().split('T')[0];
  assert.equal((await call('POST', '/tasks', {})).status, 400);
  const created = await call('POST', '/tasks', { title: 'Test task', topic: 'Stack', estimatedMinutes: 20, date: today, priority: 'High' });
  assert.ok([200, 201].includes(created.status));
  const id = created.json.data.id;
  const list = await call('GET', `/tasks?date=${today}`);
  assert.ok(list.json.data.some((t) => t.id === id));
  assert.equal((await call('PATCH', `/tasks/${id}/toggle`)).json.data.completed, true);
  assert.ok((await call('POST', `/tasks/${id}/carry-over`, {})).json.success);
  assert.equal((await call('PUT', `/tasks/${id}`, { title: 'Renamed' })).json.data.title, 'Renamed');
  assert.ok((await call('DELETE', `/tasks/${id}`)).json.success);
  assert.equal((await call('DELETE', `/tasks/${id}`)).status, 404);
});

test('problem log: create, filter, toggle revision, update, delete', async () => {
  assert.equal((await call('POST', '/problems', {})).status, 400);
  const created = await call('POST', '/problems', { title: 'Two Sum', difficulty: 'Easy', topic: 'Arrays & Hashing', solveStatus: 'Independently' });
  assert.ok(created.json.success);
  const id = created.json.data.id;
  const filtered = await call('GET', '/problems?difficulty=Easy&search=two');
  assert.ok(filtered.json.data.some((p) => p.id === id));
  assert.ok((await call('PATCH', `/problems/${id}/toggle-revision`)).json.success);
  assert.equal((await call('PUT', `/problems/${id}`, { notes: 'hash map' })).json.data.notes, 'hash map');
  assert.ok((await call('DELETE', `/problems/${id}`)).json.success);
});

test('roadmap and stats', async () => {
  const roadmap = await call('GET', '/roadmap');
  assert.ok(Array.isArray(roadmap.json.data));
  const toggled = await call('PATCH', '/roadmap/week/1/topic', { topicIndex: 0 });
  assert.ok(toggled.json.success);
  assert.equal((await call('PATCH', '/roadmap/week/999/topic', { topicIndex: 0 })).status, 404);
  const stats = await call('GET', '/stats');
  assert.equal(stats.status, 200);
  assert.ok(stats.json.success);
  assert.ok((await call('PUT', '/stats/user', { dailyGoal: 4 })).json.success);
});

test('planner: generate, update a question, carry forward, reset', async () => {
  const questions = await call('GET', '/planner/questions');
  assert.equal(questions.json.length, 150);

  const gen = await call('POST', '/planner/generate', { level: 'beginner', dailyHours: 2, targetDays: 30 });
  assert.ok(gen.json.success);
  assert.ok(gen.json.plan.days.length > 0);
  const firstQ = gen.json.plan.days[0].questions[0];

  const updated = await call('PATCH', `/planner/question/${firstQ.id}`, { completed: true, solveStatus: 'hint' });
  assert.ok(updated.json.success);
  assert.ok(updated.json.plan.revisionQueue.some((q) => q.id === firstQ.id), 'a hinted solve goes to revision');

  // Reviews: an unrated one, then a rated one; ratings stay aligned with the timestamps
  await call('PATCH', `/planner/question/${firstQ.id}`, { reviewed: true });
  const rated = await call('PATCH', `/planner/question/${firstQ.id}`, { reviewed: true, reviewResult: 'hard' });
  const reviewedQ = rated.json.plan.days.flatMap((d) => d.questions).find((q) => q.id === firstQ.id);
  assert.equal(reviewedQ.reviews.length, 2);
  assert.deepEqual(reviewedQ.reviewResults, [null, 'hard']);
  const bogus = await call('PATCH', `/planner/question/${firstQ.id}`, { reviewed: true, reviewResult: 'meh' });
  assert.deepEqual(bogus.json.plan.days.flatMap((d) => d.questions).find((q) => q.id === firstQ.id).reviewResults, [null, 'hard', null]);
  assert.equal((await call('PATCH', '/planner/question/nope', { completed: true })).status, 404);

  assert.ok((await call('GET', '/planner/plan')).json.plan);

  // Smart revision: open in file mode (accounts off), and the hinted problem is on it
  const revision = await call('GET', '/planner/revision?today=2026-11-19&tz=-330');
  assert.equal(revision.json.data.smart, true);
  const queued = [...revision.json.data.due, ...revision.json.data.upcoming].map((i) => i.question.id);
  assert.ok(queued.includes(firstQ.id));
  assert.equal((await call('GET', '/planner/revision?today=bad&tz=9999')).status, 200, 'bad params fall back');
  assert.equal((await call('POST', '/planner/carry-forward')).status, 200);
  assert.ok((await call('POST', '/planner/reset')).json.success);
  assert.equal((await call('GET', '/planner/plan')).json.plan, null);
});

test('attempts: sanitized, upserted by id, listed per problem', async () => {
  assert.equal((await call('POST', '/planner/attempts', { problemId: 'nc-1' })).status, 400);
  const first = await call('POST', '/planner/attempts', {
    id: 't1', problemId: 'nc-1', runs: 2, submits: 1, solved: true, secondsToSolve: 240,
    languages: ['python', 'ruby'], pastedChars: -3, selfRating: 'easy', extra: 'dropped',
  });
  assert.ok(first.json.success);
  assert.deepEqual(first.json.data.languages, ['python']);
  assert.equal(first.json.data.pastedChars, 0);
  assert.equal(first.json.data.extra, undefined);
  assert.equal(first.json.data.gaveUp, false, 'not stuck unless the person says so');
  const stuck = await call('POST', '/planner/attempts', { id: 'stuck1', problemId: 'nc-3', gaveUp: true, runs: 1 });
  assert.equal(stuck.json.data.gaveUp, true);
  await call('POST', '/planner/attempts', { id: 't1', problemId: 'nc-1', runs: 3, submits: 2, solved: true });
  const list = await call('GET', '/planner/attempts?problemId=nc-1');
  assert.equal(list.json.data.length, 1);
  assert.equal(list.json.data[0].runs, 3);
});

test('testing mode: sample data fills Revision and Progress, reviews work without a plan, reset wipes it', async () => {
  await call('POST', '/dev/reset');
  assert.equal((await call('GET', '/planner/progress?today=2026-11-19&tz=0')).json.data.solved, 0, 'starts empty');
  const empty = (await call('GET', '/planner/revision?today=2026-11-19&tz=0')).json.data;
  assert.equal(empty.due.length + empty.upcoming.length, 0);

  assert.ok((await call('POST', '/dev/seed')).json.success);
  const today = new Date().toISOString().slice(0, 10);
  const rev = (await call('GET', `/planner/revision?today=${today}&tz=0`)).json.data;
  const ids = [...rev.due, ...rev.upcoming].map((i) => i.question.id);
  assert.ok(ids.includes('nc-217') && ids.includes('nc-49') && ids.includes('nc-20'), 'struggled problems are on it');
  assert.ok(!ids.includes('nc-1') && !ids.includes('nc-242'), 'clean solves are not');
  assert.ok([...rev.due, ...rev.upcoming].every((i) => i.attemptOnly), 'no study plan, so all come from attempts');

  const progress = (await call('GET', `/planner/progress?today=${today}&tz=0`)).json.data;
  assert.equal(progress.solved, 6);
  assert.ok(progress.solvedToday >= 1);
  assert.ok(progress.detailed, 'file mode is open, so the Pro detail is included');

  // A Hard review without a plan: recorded, and the problem comes back tomorrow
  const reviewed = await call('POST', '/planner/review', { problemId: 'nc-217', reviewResult: 'hard' });
  assert.equal(reviewed.json.data.inPlan, false);
  assert.deepEqual((await call('GET', '/planner/review')).json.data['nc-217'].reviewResults, ['hard']);
  const after = (await call('GET', `/planner/revision?today=${today}&tz=0`)).json.data;
  const item = [...after.due, ...after.upcoming].find((i) => i.question.id === 'nc-217');
  assert.equal(item.stage, 1);
  assert.equal(item.lastResult, 'hard');
  assert.equal((await call('POST', '/planner/review', { problemId: 'nope' })).status, 400);

  await call('POST', '/dev/reset');
  assert.equal((await call('GET', '/planner/progress?today=2026-11-19')).json.data.solved, 0);
});

test('next problem follows the recorded attempts', async () => {
  // The attempts test above recorded a solved Two Sum
  const after = await call('GET', '/planner/next?after=nc-1&today=2026-11-18');
  assert.ok(after.json.success);
  assert.ok(after.json.data.problem.id);
  assert.notEqual(after.json.data.problem.id, 'nc-1');
  assert.ok(after.json.data.reason.length > 0);
  const excluded = await call('GET', `/planner/next?after=nc-1&exclude=${after.json.data.problem.id}`);
  assert.notEqual(excluded.json.data.problem.id, after.json.data.problem.id);
  assert.equal((await call('GET', '/planner/next?today=not-a-date')).status, 200);
});

test('AI review reports itself off without a key and refuses politely', async () => {
  const status = await call('GET', '/ai/status');
  assert.equal(status.json.data.reviewEnabled, false);
  const review = await call('POST', '/ai/review', { problemId: 'nc-1', code: 'x', language: 'javascript' });
  assert.equal(review.status, 503);
  assert.equal((await call('POST', '/ai/review', { code: 'x', language: 'ruby' })).status, 503, 'off is checked first');
});

test('attempts keep the AI verdict and drop unknown verdicts', async () => {
  const saved = await call('POST', '/planner/attempts', { id: 'v1', problemId: 'nc-2', solved: true, aiVerdict: 'suboptimal' });
  assert.equal(saved.json.data.aiVerdict, 'suboptimal');
  const bad = await call('POST', '/planner/attempts', { id: 'v2', problemId: 'nc-2', aiVerdict: 'amazing' });
  assert.equal(bad.json.data.aiVerdict, null);
});

test('billing is off without Razorpay and a database', async () => {
  const history = await call('GET', '/billing/history');
  assert.equal(history.status, 200);
  assert.deepEqual(history.json.data.payments, []);
  const plans = await call('GET', '/billing/plans');
  assert.equal(plans.json.data.enabled, false);
  assert.equal((await call('POST', '/billing/order', { planId: 'pro_monthly' })).status, 503);
});

test('execute rejects bad input and reports when Judge0 is off', async () => {
  assert.equal((await call('POST', '/execute', { language: 'ruby', source: 'x' })).status, 400);
  assert.equal((await call('POST', '/execute', { language: 'cpp', source: '' })).status, 400);
  assert.equal((await call('POST', '/execute', { language: 'cpp', source: 'int main(){}' })).status, 503);
});
