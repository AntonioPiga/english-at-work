import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, DEFAULT_STATE, STORAGE_KEY } from '../js/store.js';

function memStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k), _m: m };
}

test('storage key is eaw:v1', () => assert.equal(STORAGE_KEY, 'eaw:v1'));

test('empty storage yields default state', () => {
  const s = createStore(memStorage());
  assert.deepEqual(s.get(), DEFAULT_STATE);
  assert.equal(s.get().version, 1);
  assert.equal(s.get().placement, null);
  assert.deepEqual(s.get().settings, { rate: 1, voice: null, mic: true });
});

test('update persists under key', () => {
  const st = memStorage();
  const s = createStore(st);
  s.update((d) => { d.streak.days = 3; });
  assert.equal(JSON.parse(st.getItem('eaw:v1')).streak.days, 3);
  assert.equal(s.get().streak.days, 3);
});

test('corrupted value yields defaults', () => {
  const s = createStore(memStorage({ 'eaw:v1': '{not json' }));
  assert.deepEqual(s.get(), DEFAULT_STATE);
});

test('throwing storage still works in memory', () => {
  const bad = { getItem() { throw new Error('nope'); }, setItem() { throw new Error('nope'); }, removeItem() {} };
  const s = createStore(bad);
  s.update((d) => { d.streak.days = 2; });
  assert.equal(s.get().streak.days, 2);
});

test('importJSON rejects wrong version and returns false', () => {
  const s = createStore(memStorage());
  assert.equal(s.importJSON('{"version":2}'), false);
  assert.equal(s.importJSON('garbage'), false);
});

test('importJSON replaces state and exportJSON round-trips', () => {
  const s = createStore(memStorage());
  s.update((d) => { d.modules['x'] = { quiz: { correct: 1, total: 2 }, exercises: { correct: 0, total: 0 }, fluency: [3], completedAt: 'now' }; });
  const txt = s.exportJSON();
  const s2 = createStore(memStorage());
  assert.equal(s2.importJSON(txt), true);
  assert.deepEqual(s2.get(), s.get());
  assert.equal(s2.get().settings.rate, 1);
});

test('reset returns to defaults', () => {
  const s = createStore(memStorage());
  s.update((d) => { d.streak.days = 9; });
  s.reset();
  assert.deepEqual(s.get(), DEFAULT_STATE);
});

test('get returns a copy, not the live state', () => {
  const s = createStore(memStorage());
  s.get().streak.days = 99;
  assert.equal(s.get().streak.days, 0);
});
