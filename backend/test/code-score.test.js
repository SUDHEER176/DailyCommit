import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeScore, verdictFromGrades } from '../data/code-score.js';
import { createAnalysisCache } from '../data/analysis-cache.js';

test('every test passed with optimal time and space is exactly 100', () => {
  assert.deepEqual(computeScore({ passed: 3, total: 3, timeGrade: 'optimal', spaceGrade: 'optimal' }),
    { score: 100, tests: 40, time: 40, space: 20, max: { tests: 40, time: 40, space: 20 } });
});

test('brute force that passes everything scores in the 70s, and a one-step-off answer scores higher', () => {
  const brute = computeScore({ passed: 3, total: 3, timeGrade: 'poor', spaceGrade: 'optimal' });
  assert.equal(brute.score, 72, '40 for tests + 12 for poor time + 20 for space');
  const good = computeScore({ passed: 3, total: 3, timeGrade: 'good', spaceGrade: 'good' });
  assert.equal(good.score, 82);
  assert.ok(good.score > brute.score && good.score < 100);
});

test('speed earns nothing when the code does not work: credit is scaled by the tests passed', () => {
  assert.equal(computeScore({ passed: 0, total: 3, timeGrade: 'optimal', spaceGrade: 'optimal' }).score, 0, 'a function that returns a constant is O(1) but worth nothing');
  const partial = computeScore({ passed: 2, total: 3, timeGrade: 'optimal', spaceGrade: 'optimal' });
  assert.deepEqual([partial.tests, partial.time, partial.space, partial.score], [26, 26, 13, 65]);
});

test('nothing rounds up to 100 while a test still fails', () => {
  const s = computeScore({ passed: 399, total: 400, timeGrade: 'optimal', spaceGrade: 'optimal' });
  assert.ok(s.score < 100, `got ${s.score}`);
});

test('no score yet without test results or grades', () => {
  assert.equal(computeScore({}).score, null);
  assert.equal(computeScore({ passed: 1, total: 0, timeGrade: 'optimal', spaceGrade: 'optimal' }).score, null);
  assert.equal(computeScore({ passed: 4, total: 3, timeGrade: 'optimal', spaceGrade: 'optimal' }).score, null, 'more passed than run is nonsense');
  const noGrades = computeScore({ passed: 3, total: 3 });
  assert.equal(noGrades.score, null);
  assert.equal(noGrades.tests, 40, 'the tests part is still known');
});

test('the verdict follows the grades', () => {
  assert.equal(verdictFromGrades('optimal', 'optimal'), 'optimal');
  assert.equal(verdictFromGrades('optimal', 'good'), 'optimal');
  assert.equal(verdictFromGrades('optimal', 'poor'), 'acceptable');
  assert.equal(verdictFromGrades('good', 'optimal'), 'acceptable');
  assert.equal(verdictFromGrades('poor', 'optimal'), 'suboptimal');
});

test('the analysis cache ignores line endings and outer spaces, but not the person, problem, language or code', () => {
  const cache = createAnalysisCache(3);
  const k = (...a) => cache.key(...a);
  assert.equal(k('u1', 'nc-1', 'python', 'a\r\nb\n'), k('u1', 'nc-1', 'python', '  a\nb'));
  assert.notEqual(k('u1', 'nc-1', 'python', 'a'), k('u2', 'nc-1', 'python', 'a'));
  assert.notEqual(k('u1', 'nc-1', 'python', 'a'), k('u1', 'nc-2', 'python', 'a'));
  assert.notEqual(k('u1', 'nc-1', 'python', 'a'), k('u1', 'nc-1', 'java', 'a'));
  assert.notEqual(k('u1', 'nc-1', 'python', 'a'), k('u1', 'nc-1', 'python', 'a '.repeat(2) + 'b'));
});

test('the analysis cache remembers, and forgets the oldest first', () => {
  const cache = createAnalysisCache(2);
  cache.set('a', 1); cache.set('b', 2); cache.set('c', 3);
  assert.equal(cache.get('a'), null, 'the oldest went');
  assert.equal(cache.get('b'), 2);
  assert.equal(cache.get('c'), 3);
  assert.equal(cache.size, 2);
});
