// Smart revision scheduling (backend/data/smart-revision.js) and the Pro checks that gate it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  firstInterval, smartState, smartRevisionSchedule, dayIndex, dayString, MASTERED_AFTER_DAYS,
} from '../data/smart-revision.js';
import { createProChecks } from '../data/billing.js';

// Day n after 2026-11-01, at 10:00 UTC; tests use UTC (tzOffset 0) unless they say otherwise
const iso = (n) => new Date(Date.UTC(2026, 10, 1 + n, 10)).toISOString();
const ymd = (n) => dayString(dayIndex(iso(n)));
const SOLVED = iso(0);
const dueOffset = (state) => state.dueDay - dayIndex(SOLVED);

test('the first review comes sooner the more the first solve was a struggle', () => {
  assert.equal(firstInterval({ solveStatus: 'solution' }), 1);
  assert.equal(firstInterval({ solveStatus: 'hint' }), 2);
  assert.equal(firstInterval({ isDifficult: true }), 3);
  assert.equal(firstInterval({}, 0.2), 1);
  assert.equal(firstInterval({}, 0.9), 4);
});

test('Good reviews grow the gap, roughly like the fixed 3 / 7 / 21 schedule', () => {
  const reviews = [iso(3), iso(11), iso(31)];
  const gaps = [0, 1, 2, 3].map((n) => smartState({ isDifficult: true, reviews: reviews.slice(0, n), reviewResults: ['ok', 'ok', 'ok'].slice(0, n) }, SOLVED).interval);
  assert.deepEqual(gaps, [3, 8, 20, 50]);
  assert.equal(smartState({ isDifficult: true, reviews, reviewResults: ['ok', 'ok', 'ok'] }, SOLVED).mastered, true);
});

test('Hard resets to tomorrow and makes later gaps shorter; Easy stretches them', () => {
  const hard = smartState({ isDifficult: true, reviews: [iso(3)], reviewResults: ['hard'] }, SOLVED);
  assert.equal(hard.interval, 1);
  assert.equal(dueOffset(hard), 4, 'reviewed on day 3, back on day 4');
  assert.ok(hard.ease < 2.5);
  assert.equal(hard.mastered, false);
  const easy = smartState({ isDifficult: true, reviews: [iso(3)], reviewResults: ['easy'] }, SOLVED);
  const good = smartState({ isDifficult: true, reviews: [iso(3)], reviewResults: ['ok'] }, SOLVED);
  assert.ok(easy.interval > good.interval);
});

test('older reviews without a rating count as Good', () => {
  assert.equal(
    smartState({ isDifficult: true, reviews: [iso(3)] }, SOLVED).interval,
    smartState({ isDifficult: true, reviews: [iso(3)], reviewResults: ['ok'] }, SOLVED).interval,
  );
});

test('a problem read from the solution needs more reviews before it is mastered', () => {
  const reviewsUntilMastered = (q) => {
    const reviews = [];
    for (let i = 0; i < 10; i++) {
      if (smartState({ ...q, reviews }, SOLVED).mastered) return reviews.length;
      reviews.push(iso(10 * (i + 1)));
    }
    return Infinity;
  };
  assert.ok(reviewsUntilMastered({ solveStatus: 'solution' }) > reviewsUntilMastered({ isDifficult: true }));
});

test('due dates follow the person’s time zone, not the server’s', () => {
  // Solved at 20:00 UTC on Nov 1 = 01:30 on Nov 2 in India (UTC+5:30, getTimezoneOffset -330)
  const late = new Date(Date.UTC(2026, 10, 1, 20)).toISOString();
  const q = { solveStatus: 'hint' }; // first review 2 days later
  assert.equal(dayString(smartState(q, late, null, 0).dueDay), '2026-11-03', 'in UTC: Nov 1 + 2');
  assert.equal(dayString(smartState(q, late, null, -330).dueDay), '2026-11-04', 'in India: Nov 2 + 2');
});

test('the schedule picks up struggles nobody flagged, from editor attempts', () => {
  const plan = { days: [{ date: '2026-11-01', questions: [
    { id: 'nc-1', title: 'Two Sum', difficulty: 'Easy', completed: true, completedAt: SOLVED, solveStatus: 'independent' },
    { id: 'nc-217', title: 'Contains Duplicate', difficulty: 'Easy', completed: true, completedAt: SOLVED, solveStatus: 'independent' },
  ] }] };
  const attempts = {
    'nc-1': [{ id: 'a', solved: true, submits: 3, firstSubmitVerdict: 'Wrong Answer', secondsToSolve: 3600, selfRating: 'hard', solvedAt: SOLVED }],
    'nc-217': [{ id: 'b', solved: true, submits: 1, firstSubmitVerdict: 'Accepted', secondsToSolve: 300, solvedAt: SOLVED }],
  };
  const { due, upcoming } = smartRevisionSchedule(plan, attempts, ymd(5));
  assert.deepEqual([...due, ...upcoming].map((i) => i.question.id), ['nc-1']);
  assert.equal(due[0].reason, 'You rated it hard');
  assert.equal(due[0].smart, true);
  assert.match(due[0].dueDate, /^\d{4}-\d{2}-\d{2}$/);
});

test('due and upcoming are split by the person’s today and sorted', () => {
  const plan = { days: [{ date: '2026-11-01', questions: [
    { id: 'a', completed: true, completedAt: SOLVED, solveStatus: 'solution' }, // due day 1
    { id: 'b', completed: true, completedAt: SOLVED, solveStatus: 'hint' },     // due day 2
    { id: 'c', completed: true, completedAt: SOLVED, isDifficult: true },      // due day 3
  ] }] };
  const { due, upcoming } = smartRevisionSchedule(plan, {}, ymd(2));
  assert.deepEqual(due.map((i) => i.question.id), ['a', 'b']);
  assert.deepEqual(upcoming.map((i) => i.question.id), ['c']);
  assert.equal(due[0].daysUntil, -1);
});

test('mastered problems leave the queue and are counted', () => {
  const plan = { days: [{ date: '2026-11-01', questions: [
    { id: 'a', completed: true, completedAt: SOLVED, isDifficult: true, reviews: [iso(3), iso(11), iso(31)], reviewResults: ['ok', 'ok', 'ok'] },
  ] }] };
  const s = smartRevisionSchedule(plan, {}, ymd(40));
  assert.equal(s.mastered, 1);
  assert.equal(s.due.length + s.upcoming.length, 0);
  assert.ok(MASTERED_AFTER_DAYS >= 30);
});

// ── The Pro checks, with a fake users table ──

function fakeChecks(planExpiresAt, { dbOn = true } = {}) {
  const calls = [];
  const query = async (sql, params) => { calls.push(params); return { rows: planExpiresAt === undefined ? [] : [{ plan_expires_at: planExpiresAt }] }; };
  return { calls, ...createProChecks({ hasDatabase: dbOn, query }) };
}
const runGuard = async (guard, userId) => {
  let status = null, body = null, passed = false;
  const res = { status(s) { status = s; return this; }, json(b) { body = b; return this; } };
  await guard({ userId }, res, () => { passed = true; });
  return { passed, status, body };
};

test('isProUser: true while Pro runs, false after it ends, for unknown users and without a user', async () => {
  const future = new Date(Date.now() + 5 * 86400000);
  const past = new Date(Date.now() - 86400000);
  assert.equal(await fakeChecks(future).isProUser('u1'), true);
  assert.equal(await fakeChecks(past).isProUser('u1'), false);
  assert.equal(await fakeChecks(null).isProUser('u1'), false, 'never bought Pro');
  assert.equal(await fakeChecks(undefined).isProUser('u1'), false, 'no such user');
  assert.equal(await fakeChecks(future).isProUser(null), false, 'not signed in');
  const checks = fakeChecks(future);
  await checks.isProUser('u42');
  assert.deepEqual(checks.calls[0], ['u42'], 'looks up the signed-in user');
});

test('requirePro lets Pro through and answers 402 with upgrade for Free', async () => {
  const pro = await runGuard(fakeChecks(new Date(Date.now() + 86400000)).requirePro, 'u1');
  assert.deepEqual(pro, { passed: true, status: null, body: null });
  const free = await runGuard(fakeChecks(null).requirePro, 'u1');
  assert.equal(free.passed, false);
  assert.equal(free.status, 402);
  assert.equal(free.body.upgrade, true);
});

test('with accounts off (file mode) every Pro check passes without touching a database', async () => {
  const checks = fakeChecks(null, { dbOn: false });
  assert.equal(await checks.isProUser(null), true);
  assert.equal((await runGuard(checks.requirePro, null)).passed, true);
  assert.equal(checks.calls.length, 0);
});

test('a failing database answers 500, never lets the request through', async () => {
  const { requirePro } = createProChecks({ hasDatabase: true, query: async () => { throw new Error('connection reset'); } });
  const r = await runGuard(requirePro, 'u1');
  assert.equal(r.passed, false);
  assert.equal(r.status, 500);
});
