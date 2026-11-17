import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute } from '../js/router.js';

test('empty hash is home', () => assert.deepEqual(parseRoute(''), { name: 'home', params: {} }));
test('#/ is home', () => assert.deepEqual(parseRoute('#/'), { name: 'home', params: {} }));
test('placement', () => assert.deepEqual(parseRoute('#/placement'), { name: 'placement', params: {} }));
test('track', () => assert.deepEqual(parseRoute('#/track/calls'), { name: 'track', params: { id: 'calls' } }));
test('module', () => assert.deepEqual(parseRoute('#/module/calls-01-opening'), { name: 'module', params: { id: 'calls-01-opening' } }));
test('decks list', () => assert.deepEqual(parseRoute('#/flashcards'), { name: 'decks', params: {} }));
test('deck', () => assert.deepEqual(parseRoute('#/flashcards/false-friends'), { name: 'flashcards', params: { deck: 'false-friends' } }));
test('reference', () => assert.equal(parseRoute('#/reference').name, 'reference'));
test('progress', () => assert.equal(parseRoute('#/progress').name, 'progress'));
test('notfound', () => assert.equal(parseRoute('#/nope/x/y').name, 'notfound'));
test('malformed percent-encoding is notfound, not a crash', () => assert.equal(parseRoute('#/module/%E0').name, 'notfound'));
