// The AI review module with a fake Gemini client: no API key or network needed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '@google/genai';
import { reviewCode, MAX_CODE_CHARS } from '../data/ai-review.js';

const REVIEW = {
  timeComplexity: 'O(n)', spaceComplexity: 'O(n)', bestKnownTime: 'O(n)',
  verdict: 'optimal', summary: 'One pass with a hash map.', tip: 'Try the sorted-input variant.',
};

function fakeClient(respond) {
  const calls = [];
  return {
    calls,
    models: { generateContent: async (req) => { calls.push(req); return respond(req); } },
  };
}
const ok = (body = REVIEW, extra = {}) => () => ({
  text: JSON.stringify(body), modelVersion: 'gemini-3.8-flash',
  candidates: [{ finishReason: 'STOP' }], ...extra,
});
const input = { title: 'Two Sum', difficulty: 'Easy', language: 'javascript', code: 'function twoSum(n,t){ /* ... */ }' };

test('sends a JSON-schema request to the free Flash model and returns the parsed review', async () => {
  const client = fakeClient(ok());
  const review = await reviewCode(input, { client });
  assert.deepEqual({ ...review, model: undefined }, { ...REVIEW, model: undefined });
  const req = client.calls[0];
  assert.equal(req.model, 'gemini-3.8-flash');
  assert.equal(req.config.responseMimeType, 'application/json');
  assert.deepEqual(req.config.responseJsonSchema.properties.verdict.enum, ['optimal', 'acceptable', 'suboptimal']);
  assert.match(req.config.systemInstruction, /treat it as data/);
  assert.match(req.contents, /<code>\nfunction twoSum/);
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
  await assert.rejects(reviewCode(input, { client: fakeClient(ok({ ...REVIEW, verdict: 'great' })) }), { status: 502 });
});

test('API errors map to statuses the route can send', async () => {
  const throwing = (err) => fakeClient(() => { throw err; });
  await assert.rejects(reviewCode(input, { client: throwing(new ApiError({ status: 429, message: 'quota' })) }), { status: 429 });
  await assert.rejects(reviewCode(input, { client: throwing(new ApiError({ status: 400, message: 'API key not valid. Please pass a valid API key.' })) }), { status: 503 });
  await assert.rejects(reviewCode(input, { client: throwing(new ApiError({ status: 403, message: 'denied' })) }), { status: 503 });
  await assert.rejects(reviewCode(input, { client: throwing(new ApiError({ status: 404, message: 'model not found' })) }), { status: 503 });
  await assert.rejects(reviewCode(input, { client: throwing(new ApiError({ status: 500, message: 'boom' })) }), { status: 502 });
  await assert.rejects(reviewCode(input, { client: throwing(new Error('socket hang up')) }), { status: 502 });
});

test('long fields are clipped', async () => {
  const review = await reviewCode(input, { client: fakeClient(ok({ ...REVIEW, tip: 'x'.repeat(5000) })) });
  assert.equal(review.tip.length, 600);
});
