import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateModule, validateDeck, validatePlacement, validateIndex, validateTree } from '../scripts/validate-content.mjs';

const quizQ = (i) => ({ q: `Question ${i}?`, options: ['a', 'b', 'c', 'd'], answer: 1, why: 'because' });

export function fixtureModule() {
  return {
    id: 'calls-01-opening',
    track: 'calls',
    order: 1,
    title: 'Opening a call',
    level: 'B1',
    minutes: 12,
    grammar: {
      title: 'Present simple vs continuous',
      explanation: 'Breve spiegazione in italiano.',
      examples: [
        { en: "We're migrating the batch.", note: 'in corso' },
        { en: 'The job runs nightly.', note: 'routine' },
        { en: "I'm looking into it.", note: 'in corso' },
        { en: 'The service calls the API daily.', note: 'abituale' },
      ],
      italianTrap: "Non dire 'I work on it now'.",
    },
    phrases: Array.from({ length: 8 }, (_, i) => ({ en: `Phrase ${i}`, it: `Frase ${i}`, when: 'apertura' })),
    quiz: Array.from({ length: 6 }, (_, i) => quizQ(i)),
    gapfill: [
      { text: 'Could you ___ me through it?', answers: ['walk'], hint: 'guidare' },
      { text: 'Let me ___ back to you.', answers: ['get', 'come'], hint: 'ritornare' },
    ],
    reorder: [
      { words: ["Let's", 'start', 'with', 'the', 'incident'], answer: "Let's start with the incident" },
      { words: ['Can', 'you', 'hear', 'me'], answer: 'Can you hear me' },
    ],
    fluency: [
      { prompt: 'Explain the failure.', seconds: 45, model: 'The root cause was a timeout. We have rolled back.', keyPhrases: ['root cause', 'rolled back', 'timeout'] },
      { prompt: 'Open the call.', seconds: 30, model: 'Thanks everyone for joining.', keyPhrases: ['thanks everyone', 'for joining', 'everyone for joining'] },
      { prompt: 'Close the call.', seconds: 30, model: 'Let me recap the actions.', keyPhrases: ['let me recap', 'recap', 'the actions'] },
    ],
  };
}

test('valid module has no errors', () => assert.deepEqual(validateModule(fixtureModule()), []));

test('answer index out of range', () => {
  const m = fixtureModule(); m.quiz[0].answer = 4;
  assert.match(validateModule(m).join('\n'), /answer/);
});

test('quiz needs exactly 4 options', () => {
  const m = fixtureModule(); m.quiz[0].options = ['a', 'b', 'c'];
  assert.match(validateModule(m).join('\n'), /options/);
});

test('quiz needs 6 to 8 questions', () => {
  const m = fixtureModule(); m.quiz = m.quiz.slice(0, 5);
  assert.match(validateModule(m).join('\n'), /quiz/);
});

test('phrases need 8 to 12 entries', () => {
  const m = fixtureModule(); m.phrases = m.phrases.slice(0, 7);
  assert.match(validateModule(m).join('\n'), /phrases/);
});

test('fluency needs 3 to 4 drills and key phrases must appear in model', () => {
  const m = fixtureModule(); m.fluency[0].keyPhrases = ['not there'];
  assert.match(validateModule(m).join('\n'), /keyPhrases/);
  const m2 = fixtureModule(); m2.fluency = m2.fluency.slice(0, 2);
  assert.match(validateModule(m2).join('\n'), /fluency/);
});

test('gapfill + reorder must total 4 to 6', () => {
  const m = fixtureModule(); m.reorder = [];
  assert.match(validateModule(m).join('\n'), /gapfill|reorder/);
});

test('grammar explanation max 200 words and italianTrap required', () => {
  const m = fixtureModule(); m.grammar.explanation = Array(201).fill('parola').join(' ');
  assert.match(validateModule(m).join('\n'), /explanation/);
  const m2 = fixtureModule(); delete m2.grammar.italianTrap;
  assert.match(validateModule(m2).join('\n'), /italianTrap/);
});

test('level must be B1, B2 or C1', () => {
  const m = fixtureModule(); m.level = 'A2';
  assert.match(validateModule(m).join('\n'), /level/);
});

test('write allowed only on emails and presentations', () => {
  const m = fixtureModule(); m.write = [{ prompt: 'p', model: 'm', checklist: ['a'] }];
  assert.match(validateModule(m).join('\n'), /write/);
  const m2 = fixtureModule(); m2.track = 'emails'; m2.id = 'emails-01-x'; m2.write = [{ prompt: 'p', model: 'm', checklist: ['a', 'b'] }];
  assert.deepEqual(validateModule(m2), []);
});

test('reorder words must form the answer', () => {
  const m = fixtureModule(); m.reorder[0].words = ['Nope', 'start'];
  assert.match(validateModule(m).join('\n'), /reorder/);
});

test('valid deck has no errors, duplicate ids flagged', () => {
  const deck = { id: 'false-friends', title: 'Falsi amici', description: 'd', cards: [
    { id: 'ff-actually', front: 'attualmente', back: 'currently', example: 'We are currently testing.' },
    { id: 'ff-eventually', front: 'eventualmente', back: 'if necessary', example: 'Call me if necessary.' },
  ] };
  assert.deepEqual(validateDeck(deck), []);
  deck.cards[1].id = 'ff-actually';
  assert.match(validateDeck(deck).join('\n'), /duplicate/);
});

test('placement needs 0 or exactly 20 levelled questions', () => {
  assert.deepEqual(validatePlacement({ questions: [] }), []);
  const q = (lvl) => ({ ...quizQ(1), level: lvl });
  const balanced = [...Array(7).fill('B1'), ...Array(7).fill('B2'), ...Array(6).fill('C1')].map(q);
  assert.deepEqual(validatePlacement({ questions: balanced }), []);
  assert.match(validatePlacement({ questions: Array.from({ length: 20 }, () => q('B1')) }).join('\n'), /split/);
  assert.match(validatePlacement({ questions: [q('B1')] }).join('\n'), /20/);
  assert.match(validatePlacement({ questions: Array.from({ length: 20 }, () => q('A1')) }).join('\n'), /level/);
});

test('index referencing a missing file is an error', () => {
  const idx = { tracks: [{ id: 'calls', title: 'Calls', subtitle: 's', modules: [{ id: 'calls-99', file: 'tracks/calls/99-missing.json', title: 't', level: 'B1', minutes: 10 }] }], decks: [], placement: 'placement.json' };
  assert.match(validateIndex(idx, new URL('../content/', import.meta.url)).join('\n'), /99-missing/);
});

test('real content tree validates with zero errors', async () => {
  const errors = await validateTree(new URL('../content/', import.meta.url));
  assert.deepEqual(errors, []);
});

test('reorder alternative answers must use the same words', () => {
  const m = fixtureModule();
  m.reorder[0].answers = ['Start with the incident let\'s'];
  assert.deepEqual(validateModule(m), []);
  m.reorder[0].answers = ['Start with the problem let\'s'];
  assert.match(validateModule(m).join('\n'), /reorder\[0\] alternative/);
});
