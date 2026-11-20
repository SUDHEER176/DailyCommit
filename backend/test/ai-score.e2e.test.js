// The code score route (POST /api/ai/review) end to end in production mode: Pro only, scoring from
// the tests and the AI's grades, an analysis cache that spares the daily allowance, and the limit.
// Gemini is faked (see test/helpers/production-harness.js), so no key or network is needed.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startProduction } from './helpers/production-harness.js';

let h;
before(async () => {
  h = await startProduction({ GEMINI_API_KEY: 'fake-key-for-tests', AI_REVIEW_DAILY_LIMIT: '4' });
});
after(async () => { await h?.stop(); });

const OPTIMAL = { timeComplexity: 'O(n)', spaceComplexity: 'O(n)', bestKnownTime: 'O(n)', bestKnownSpace: 'O(n)', timeGrade: 'optimal', spaceGrade: 'optimal', approach: 'Hash set of seen values', intuition: 'Remember what you have seen; a repeat is a duplicate.', betterApproach: '' };
const BRUTE = { ...OPTIMAL, timeComplexity: 'O(n^2)', spaceComplexity: 'O(1)', timeGrade: 'poor', spaceGrade: 'optimal', approach: 'Brute force over all pairs', intuition: 'Compare every pair.', betterApproach: 'What do you need to remember about the numbers you have already seen?' };

async function proUser(email) {
  const user = await h.signUp('Scorer', email);
  const order = (await h.call('POST', '/billing/order', { planId: 'pro_monthly' }, user.token)).json.data;
  await h.call('POST', '/billing/verify', { orderId: order.orderId, paymentId: `pay_${email}`, signature: h.checkoutSignature(order.orderId, `pay_${email}`) }, user.token);
  return user;
}
const review = (user, body) => h.call('POST', '/ai/review', { problemId: 'nc-217', language: 'javascript', title: 'Contains Duplicate', difficulty: 'Easy', ...body }, user.token);

test('a Free account is asked to upgrade', async () => {
  const free = await h.signUp('Free Scorer', 'free-score@example.test');
  const res = await review(free, { code: 'x', passed: 1, total: 1 });
  assert.equal(res.status, 402);
  assert.equal(res.json.upgrade, true);
  assert.equal(h.gemini.calls, 0, 'nothing was sent to the model');
});

test('optimal code that passes everything scores 100; brute force that passes scores 72 and gets a better approach', async () => {
  const user = await proUser('pro-score1@example.test');
  h.gemini.analysis = OPTIMAL;
  const optimal = (await review(user, { code: 'const seen = new Set(); /* optimal */', passed: 3, total: 3, kind: 'submit' })).json.data;
  assert.equal(optimal.score.score, 100);
  assert.deepEqual([optimal.score.tests, optimal.score.time, optimal.score.space], [40, 40, 20]);
  assert.equal(optimal.verdict, 'optimal');
  assert.equal(optimal.betterApproach, '');

  h.gemini.analysis = BRUTE;
  const brute = (await review(user, { code: 'for (;;) { /* brute force */ }', passed: 3, total: 3, kind: 'submit' })).json.data;
  assert.equal(brute.score.score, 72);
  assert.equal(brute.timeComplexity, 'O(n^2)');
  assert.equal(brute.verdict, 'suboptimal');
  assert.match(brute.betterApproach, /already seen/);
});

test('code that fails tests scores low however fast it is, and a run with no test results gets no score', async () => {
  const user = await proUser('pro-score2@example.test');
  h.gemini.analysis = OPTIMAL;
  const failing = (await review(user, { code: 'return false; // fails', passed: 0, total: 3 })).json.data;
  assert.equal(failing.score.score, 0);
  const partial = (await review(user, { code: 'return maybe; // passes some', passed: 2, total: 3 })).json.data;
  assert.equal(partial.score.score, 65);
  const noTests = (await review(user, { code: 'return untested;' })).json.data;
  assert.equal(noTests.score.score, null);
  const nonsense = (await review(user, { code: 'return nonsense;', passed: 9, total: 3 })).json.data;
  assert.equal(nonsense.score.score, null, 'more passed than run is ignored, not trusted');
});

test('identical code is answered from the cache and does not use the daily allowance; new code does', async () => {
  const user = await proUser('pro-score3@example.test');
  h.gemini.analysis = OPTIMAL;
  const before = h.gemini.calls;
  const first = (await review(user, { code: 'const unique1 = 1;', passed: 1, total: 1 })).json.data;
  assert.equal(first.cached, false);
  assert.equal(first.remainingToday, 3, 'the limit is 4 and one was used');
  const again = (await review(user, { code: 'const unique1 = 1;\r\n  ', passed: 1, total: 1 })).json.data; // same code, other line ending and trailing spaces
  assert.equal(again.cached, true);
  assert.equal(again.remainingToday, 3, 'nothing more was used');
  // Run then Submit on the same code: one analysis, two different scores
  const fewer = (await review(user, { code: 'const unique1 = 1;', passed: 0, total: 1 })).json.data;
  assert.equal(fewer.cached, true);
  assert.equal(fewer.score.score, 0, 'the score uses the new test result');
  assert.equal(h.gemini.calls - before, 1, 'only one request reached the model');

  assert.equal((await review(user, { code: 'const unique2 = 2;', passed: 1, total: 1 })).json.data.remainingToday, 2);
});

test('the daily limit stops new analyses with a clear message, but cached ones still work', async () => {
  const user = await proUser('pro-score4@example.test');
  h.gemini.analysis = OPTIMAL;
  for (let i = 1; i <= 4; i++) assert.equal((await review(user, { code: `const lim${i} = ${i};`, passed: 1, total: 1 })).status, 200);
  const over = await review(user, { code: 'const lim5 = 5;', passed: 1, total: 1 });
  assert.equal(over.status, 429);
  assert.match(over.json.error, /4 code analyses/);
  assert.equal((await review(user, { code: 'const lim1 = 1;', passed: 1, total: 1 })).status, 200, 'code analysed earlier is free');
});

test('an accepted Submit keeps the verdict on the attempt for the recommender; a Run does not', async () => {
  const user = await proUser('pro-score5@example.test');
  await h.call('POST', '/planner/attempts', { id: 'att-1', problemId: 'nc-217', solved: true, runs: 1, submits: 1 }, user.token);
  h.gemini.analysis = BRUTE;
  await review(user, { code: 'const verdict1 = 1;', passed: 3, total: 3, kind: 'run', attemptId: 'att-1' });
  let attempt = (await h.call('GET', '/planner/attempts?problemId=nc-217', null, user.token)).json.data[0];
  assert.equal(attempt.aiVerdict, null, 'a Run does not decide the verdict');
  await review(user, { code: 'const verdict2 = 2;', passed: 2, total: 3, kind: 'submit', attemptId: 'att-1' });
  attempt = (await h.call('GET', '/planner/attempts?problemId=nc-217', null, user.token)).json.data[0];
  assert.equal(attempt.aiVerdict, null, 'a Submit that failed some tests does not either');
  await review(user, { code: 'const verdict3 = 3;', passed: 3, total: 3, kind: 'submit', attemptId: 'att-1' });
  attempt = (await h.call('GET', '/planner/attempts?problemId=nc-217', null, user.token)).json.data[0];
  assert.equal(attempt.aiVerdict, 'suboptimal');
});

test('when Gemini is busy the error is clear and nothing is counted', async () => {
  const user = await proUser('pro-score6@example.test');
  h.gemini.status = 429;
  const quota = await review(user, { code: 'const busy1 = 1;', passed: 1, total: 1 });
  assert.equal(quota.status, 429);
  h.gemini.status = 200;
  h.gemini.analysis = OPTIMAL;
  const ok = (await review(user, { code: 'const busy2 = 2;', passed: 1, total: 1 })).json.data;
  assert.equal(ok.remainingToday, 3, 'the failed attempt did not use any of the 4');
});
