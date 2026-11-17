import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INTERVALS, review, buildSession, DAY } from '../js/srs.js';

const now = Date.UTC(2026, 10, 17, 9, 0, 0);

test('intervals are fixed', () => assert.deepEqual(INTERVALS, [0, 1, 3, 7, 14]));

test('new card correct goes to box 2 due in 1 day', () => {
  assert.deepEqual(review(undefined, true, now), { box: 2, due: now + 1 * DAY, last: now });
});

test('box 5 correct stays in box 5 due in 14 days', () => {
  assert.deepEqual(review({ box: 5, due: 0 }, true, now), { box: 5, due: now + 14 * DAY, last: now });
});

test('box 4 wrong goes back to box 1 due now', () => {
  assert.deepEqual(review({ box: 4, due: 0 }, false, now), { box: 1, due: now, last: now });
});

test('new card wrong is box 1 due now', () => {
  assert.deepEqual(review(undefined, false, now), { box: 1, due: now, last: now });
});

test('session excludes cards due in the future', () => {
  const ids = ['a', 'b'];
  const srs = { a: { box: 2, due: now + DAY }, b: { box: 2, due: now - DAY } };
  assert.deepEqual(buildSession(ids, srs, now), ['b']);
});

test('session puts due cards (oldest first) before new cards', () => {
  const ids = ['n1', 'd2', 'd1', 'n2'];
  const srs = { d1: { box: 1, due: now - 2 * DAY }, d2: { box: 3, due: now - DAY } };
  assert.deepEqual(buildSession(ids, srs, now), ['d1', 'd2', 'n1', 'n2']);
});

test('session caps new cards at 20 by default', () => {
  const ids = Array.from({ length: 30 }, (_, i) => 'c' + i);
  const s = buildSession(ids, {}, now);
  assert.equal(s.length, 20);
  assert.equal(s[0], 'c0');
});

test('session honours custom maxNew', () => {
  const ids = ['a', 'b', 'c'];
  assert.deepEqual(buildSession(ids, {}, now, 2), ['a', 'b']);
});
