import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INTERVALS, review, buildSession, DAY, startOfDay } from '../js/srs.js';

const now = new Date(2026, 10, 17, 21, 0, 0).getTime(); // 21:00 local
const day = (n) => new Date(2026, 10, 17 + n).getTime(); // local midnight + n days

test('intervals are fixed', () => assert.deepEqual(INTERVALS, [0, 1, 3, 7, 14]));

test('startOfDay returns local midnight', () => assert.equal(startOfDay(now), day(0)));

test('new card correct goes to box 2, due next local morning, with intro stamp', () => {
  assert.deepEqual(review(undefined, true, now), { box: 2, due: day(1), last: now, intro: now });
});

test('existing card keeps its intro stamp', () => {
  assert.equal(review({ box: 2, due: 0, intro: 5 }, true, now).intro, 5);
});

test('box 5 correct stays in box 5 due in 14 days', () => {
  assert.deepEqual(review({ box: 5, due: 0, intro: 1 }, true, now), { box: 5, due: day(14), last: now, intro: 1 });
});

test('box 4 wrong goes back to box 1 due now', () => {
  assert.deepEqual(review({ box: 4, due: 0, intro: 1 }, false, now), { box: 1, due: now, last: now, intro: 1 });
});

test('new card wrong is box 1 due now', () => {
  assert.deepEqual(review(undefined, false, now), { box: 1, due: now, last: now, intro: now });
});

test('session excludes cards due in the future', () => {
  const srs = { a: { box: 2, due: now + DAY }, b: { box: 2, due: now - DAY } };
  assert.deepEqual(buildSession(['a', 'b'], srs, now), ['b']);
});

test('session puts due cards (oldest first) before new cards', () => {
  const srs = { d1: { box: 1, due: now - 2 * DAY }, d2: { box: 3, due: now - DAY } };
  assert.deepEqual(buildSession(['n1', 'd2', 'd1', 'n2'], srs, now), ['d1', 'd2', 'n1', 'n2']);
});

test('session caps new cards at 20 by default', () => {
  const ids = Array.from({ length: 30 }, (_, i) => 'c' + i);
  assert.equal(buildSession(ids, {}, now).length, 20);
});

test('session honours custom maxNew, including 0', () => {
  assert.deepEqual(buildSession(['a', 'b', 'c'], {}, now, 2), ['a', 'b']);
  assert.deepEqual(buildSession(['a', 'b', 'c'], {}, now, 0), []);
});

test('session subtracts cards already introduced today from the new-card budget', () => {
  const srs = { a: { box: 2, due: day(1), intro: now - 1000 } }; // introduced today, not due
  const ids = ['a', 'b', 'c', 'd'];
  assert.deepEqual(buildSession(ids, srs, now, 2), ['b']);
});
