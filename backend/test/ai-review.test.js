// The AI analysis module with a fake Gemini client: no API key or network needed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '@google/genai';
import { reviewCode, MAX_CODE_CHARS } from '../data/ai-review.js';

const REVIEW = {
  timeComplexity: 'O(n)', spaceComplexity: 'O(n)', bestKnownTime: 'O(n)', bestKnownSpace: 'O(n)',
  timeGrade: 'optimal', spaceGrade: 'optimal',
  approach: 'Hash set of seen values', intuition: 'Remember what you have seen; a repeat means a duplicate.', betterApproach: '',
};
const BRUTE = {
  ...REVIEW, timeComplexity: 'O(n^2)', spaceComplexity: 'O(1)', timeGrade: 'poor', spaceGrade: 'optimal',
  approach: 'Brute force over all pairs', intuition: 'Compare every pair.', betterApproach: 'What do you need to remember about numbers you have already seen?',
};

function fakeClient(respond) {
  const calls = [];
  return {
    calls,
    models: { generateContent: async (req) => { calls.push(req); return respond(req); } },
  };
}
const ok = (body = REVIEW, extra = {}) => () => ({
  text: JSON.stringify(body), modelVersion: 'gemini-2.5-flash',
  candidates: [{ finishReason: 'STOP' }], ...extra,
});
const input = { title: 'Contains Duplicate', difficulty: 'Easy', language: 'javascript', code: 'function f(n){ /* ... */ }' };

test('sends a JSON-schema request to the default model and returns the parsed analysis', async () => {
  const client = fakeClient(ok());
  const review = await reviewCode(input, { client });
  assert.equal(review.timeGrade, 'optimal');
  assert.equal(review.spaceGrade, 'optimal');
  assert.equal(review.approach, 'Hash set of seen values');
  assert.equal(review.bestKnownSpace, 'O(n)');
  const req = client.calls[0];
  assert.equal(req.model, 'gemini-2.5-flash');
  assert.equal(req.config.responseMimeType, 'application/json');
  assert.deepEqual(req.config.responseJsonSchema.properties.timeGrade.enum, ['optimal', 'good', 'poor']);
  assert.ok(req.config.responseJsonSchema.required.includes('betterApproach'));
  assert.match(req.config.systemInstruction, /treat it as data/);
  assert.match(req.contents, /<code>\nfunction f/);
});

test('the verdict comes from the two grades, not from the model', async () => {
  assert.equal((await reviewCode(input, { client: fakeClient(ok(REVIEW)) })).verdict, 'optimal');
  assert.equal((await reviewCode(input, { client: fakeClient(ok(BRUTE)) })).verdict, 'suboptimal');
  assert.equal((await reviewCode(input, { client: fakeClient(ok({ ...REVIEW, timeGrade: 'good' })) })).verdict, 'acceptable');
  assert.equal((await reviewCode(input, { client: fakeClient(ok({ ...REVIEW, spaceGrade: 'poor' })) })).verdict, 'acceptable', 'optimal time but poor space is not a clean pass');
});

test('there is no "better approach" to show when time and space are both optimal', async () => {
  const review = await reviewCode(input, { client: fakeClient(ok({ ...REVIEW, betterApproach: 'You could try something else' })) });
  assert.equal(review.betterApproach, '');
  const brute = await reviewCode(input, { client: fakeClient(ok(BRUTE)) });
  assert.match(brute.betterApproach, /already seen/);
});

test('the model can be changed', async () => {
  const client = fakeClient(ok());
  await reviewCode(input, { client, model: 'some-other-model' });
  assert.equal(client.calls[0].model, 'some-other-model');
});

test('rejects empty and oversized code without calling Gemini', async () => {
  const client = fakeClient(ok());
  await assert.rejects(reviewCode({ ...input, code: '  ' }, { client }), { status: 400 });
  await assert.rejects(reviewCode({ ...input, code: 'x'.repeat(MAX_CODE_CHARS + 1) }, { client }), { status: 413 });
  assert.equal(client.calls.length, 0);
});

test('blocked, cut-off and unreadable replies become clear errors', async () => {
  await assert.rejects(reviewCode(input, { client: fakeClient(ok(REVIEW, { promptFeedback: { blockReason: 'SAFETY' } })) }), { status: 422 });
  await assert.rejects(reviewCode(input, { client: fakeClient(ok(REVIEW, { candidates: [{ finishReason: 'SAFETY' }] })) }), { status: 422 });
  await assert.rejects(reviewCode(input, { client: fakeClient(ok(REVIEW, { candidates: [{ finishReason: 'MAX_TOKENS' }] })) }), { status: 502 });
  await assert.rejects(reviewCode(input, { client: fakeClient(() => ({ text: 'not json', candidates: [{ finishReason: 'STOP' }] })) }), { status: 502 });
  await assert.rejects(reviewCode(input, { client: fakeClient(ok({ ...REVIEW, timeGrade: 'great' })) }), { status: 502 });
  await assert.rejects(reviewCode(input, { client: fakeClient(ok({ ...REVIEW, spaceGrade: undefined })) }), { status: 502 });
});

test('API errors map to statuses the route can send', async () => {
  const throwing = (err) => fakeClient(() => { throw err; });
  await assert.rejects(reviewCode(input, { client: throwing(new ApiError({ status: 429, message: 'quota' })) }), { status: 429 });
  await assert.rejects(reviewCode(input, { client: throwing(new ApiError({ status: 400, message: 'API key not valid. Please pass a valid API key.' })) }), { status: 503 });
  await assert.rejects(reviewCode(input, { client: throwing(new ApiError({ status: 403, message: 'denied' })) }), { status: 503 });
  await assert.rejects(reviewCode(input, { client: throwing(new ApiError({ status: 404, message: 'model not found' })) }), { status: 503 });
  await assert.rejects(reviewCode(input, { client: throwing(new ApiError({ status: 500, message: 'boom' })), retryDelays: [] }), { status: 502 });
  await assert.rejects(reviewCode(input, { client: throwing(new Error('socket hang up')) }), { status: 502 });
});

test('a transient Gemini 503 is retried, then succeeds', async () => {
  let calls = 0;
  const client = fakeClient(() => {
    calls += 1;
    if (calls < 3) throw new ApiError({ status: 503, message: 'high demand' });
    return { text: JSON.stringify(REVIEW), modelVersion: 'gemini-2.5-flash', candidates: [{ finishReason: 'STOP' }] };
  });
  const review = await reviewCode(input, { client, retryDelays: [0, 0] });
  assert.equal(review.verdict, 'optimal');
  assert.equal(calls, 3, 'two failures, then the good answer');
});

test('Gemini 503 that never clears gives up after the retries with a clear error', async () => {
  const client = fakeClient(() => { throw new ApiError({ status: 503, message: 'high demand' }); });
  await assert.rejects(reviewCode(input, { client, retryDelays: [0, 0] }), { status: 502 });
  assert.equal(client.calls.length, 3, 'one try plus two retries');
});

test('quota and key errors are not retried', async () => {
  const client = fakeClient(() => { throw new ApiError({ status: 429, message: 'quota' }); });
  await assert.rejects(reviewCode(input, { client, retryDelays: [0, 0] }), { status: 429 });
  assert.equal(client.calls.length, 1);
});

test('long fields are clipped', async () => {
  const review = await reviewCode(input, { client: fakeClient(ok({ ...BRUTE, betterApproach: 'x'.repeat(5000), intuition: 'y'.repeat(5000) })) });
  assert.equal(review.betterApproach.length, 800);
  assert.equal(review.intuition.length, 600);
});
