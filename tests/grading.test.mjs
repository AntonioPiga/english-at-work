import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, keyPhraseCoverage, checkGap, checkReorder } from '../js/grading.js';

test('normalize lowercases, strips punctuation, collapses spaces', () => {
  assert.equal(normalize('  Hello,   World!  '), 'hello world');
});

test('normalize expands contractions', () => {
  assert.equal(normalize("We've rolled it back."), 'we have rolled it back');
  assert.equal(normalize("I'm not sure we'll make it; they're late and he's gone, you'd see, don't worry"), 'i am not sure we will make it they are late and he is gone you would see do not worry');
});

test('normalize handles curly apostrophes', () => {
  assert.equal(normalize('We’ve done it'), 'we have done it');
});

test('coverage finds contracted phrase', () => {
  const r = keyPhraseCoverage("We've rolled it back.", ['we have rolled it back']);
  assert.deepEqual(r, { found: ['we have rolled it back'], missing: [], ratio: 1 });
});

test('coverage reports missing phrases and ratio', () => {
  const r = keyPhraseCoverage('The root cause was a timeout.', ['root cause', 'rolled back', 'by end of day', 'timeout']);
  assert.deepEqual(r.found, ['root cause', 'timeout']);
  assert.deepEqual(r.missing, ['rolled back', 'by end of day']);
  assert.equal(r.ratio, 0.5);
});

test('coverage with no key phrases is ratio 1', () => {
  assert.equal(keyPhraseCoverage('anything', []).ratio, 1);
});

test('coverage matches whole words only', () => {
  assert.equal(keyPhraseCoverage('we rolled it backwards', ['back']).ratio, 0);
});

test('checkGap tolerates case and trailing spaces', () => {
  assert.equal(checkGap('Walk ', ['walk']), true);
});

test('checkGap rejects different word', () => {
  assert.equal(checkGap('walks', ['walk']), false);
});

test('checkGap accepts any listed answer', () => {
  assert.equal(checkGap("I'd", ['I would', 'I’d']), true);
});

test('checkReorder joins words and compares normalized', () => {
  assert.equal(checkReorder(['Let\'s', 'start', 'with', 'the', 'incident'], "Let's start with the incident."), true);
  assert.equal(checkReorder(['start', 'Let\'s', 'with', 'the', 'incident'], "Let's start with the incident."), false);
});

test('checkReorder accepts any of several valid orders', () => {
  const alts = ['By June we will have migrated every service', 'We will have migrated every service by June'];
  assert.equal(checkReorder(['We', 'will', 'have', 'migrated', 'every', 'service', 'by', 'June'], alts), true);
  assert.equal(checkReorder(['June', 'by', 'We', 'will', 'have', 'migrated', 'every', 'service'], alts), false);
});
