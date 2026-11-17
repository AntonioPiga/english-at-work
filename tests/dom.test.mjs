import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHTML, formatDate, todayKey, updateStreak, currentStreak } from '../js/dom.js';

test('escapeHTML escapes angle brackets, ampersand and quotes', () => {
  assert.equal(escapeHTML('<a&b> "x" \'y\''), '&lt;a&amp;b&gt; &quot;x&quot; &#39;y&#39;');
});

test('todayKey is YYYY-MM-DD in local time', () => {
  assert.equal(todayKey(new Date(2026, 10, 17, 23, 30)), '2026-11-17');
});

test('updateStreak increments on consecutive day, keeps same day, resets after a gap', () => {
  assert.deepEqual(updateStreak({ last: '2026-11-16', days: 3 }, '2026-11-17'), { last: '2026-11-17', days: 4 });
  assert.deepEqual(updateStreak({ last: '2026-11-17', days: 4 }, '2026-11-17'), { last: '2026-11-17', days: 4 });
  assert.deepEqual(updateStreak({ last: '2026-11-10', days: 4 }, '2026-11-17'), { last: '2026-11-17', days: 1 });
  assert.deepEqual(updateStreak({ last: null, days: 0 }, '2026-11-17'), { last: '2026-11-17', days: 1 });
});

test('formatDate renders Italian short date', () => {
  assert.match(formatDate('2026-11-17T10:00:00.000Z'), /17/);
});

test('updateStreak keeps days when the clock goes backwards', () => {
  assert.deepEqual(updateStreak({ last: '2026-11-18', days: 4 }, '2026-11-17'), { last: '2026-11-17', days: 4 });
});

test('currentStreak is 0 when the last activity is older than yesterday', () => {
  assert.equal(currentStreak({ last: '2026-11-16', days: 5 }, '2026-11-17'), 5);
  assert.equal(currentStreak({ last: '2026-11-17', days: 5 }, '2026-11-17'), 5);
  assert.equal(currentStreak({ last: '2026-11-10', days: 5 }, '2026-11-17'), 0);
  assert.equal(currentStreak({ last: null, days: 0 }, '2026-11-17'), 0);
});
