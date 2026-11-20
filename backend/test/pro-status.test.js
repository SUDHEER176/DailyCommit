// The frontend's Pro status helpers (frontend/src/lib/pro.js, no imports, so it runs here too).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPro, proDaysLeft, proNotice } from '../../frontend/src/lib/pro.js';

const NOW = Date.parse('2026-11-19T12:00:00Z');
const DAY = 86400000;
const user = (plan, untilOffsetMs) => ({
  isAuthenticated: true, plan, proUntil: untilOffsetMs == null ? null : new Date(NOW + untilOffsetMs).toISOString(),
});

test('isPro needs a signed-in Pro plan with a future end date', () => {
  assert.equal(isPro(user('pro', 30 * DAY), NOW), true);
  assert.equal(isPro(user('pro', -DAY), NOW), false, 'a stale cached profile past its end date is not Pro');
  assert.equal(isPro(user('free', 30 * DAY), NOW), false);
  assert.equal(isPro({ ...user('pro', 30 * DAY), isAuthenticated: false }, NOW), false);
  assert.equal(isPro(null, NOW), false);
});

test('days left round up, so the last day reads as 1', () => {
  assert.equal(proDaysLeft(user('pro', 30 * DAY), NOW), 30);
  assert.equal(proDaysLeft(user('pro', 2 * 3600000), NOW), 1);
  assert.equal(proDaysLeft(user('free', null), NOW), null);
});

test('notice: expiring in the last week, ended for two weeks, otherwise nothing', () => {
  assert.equal(proNotice(user('pro', 30 * DAY), NOW), null);
  assert.deepEqual({ ...proNotice(user('pro', 3 * DAY), NOW), until: undefined }, { kind: 'expiring', days: 3, until: undefined });
  assert.equal(proNotice(user('free', -5 * DAY), NOW).kind, 'ended');
  assert.equal(proNotice(user('free', -20 * DAY), NOW), null, 'long-ended Pro is not mentioned');
  assert.equal(proNotice(user('free', null), NOW), null, 'never had Pro');
  assert.equal(proNotice({ ...user('pro', 3 * DAY), isAuthenticated: false }, NOW), null);
});
