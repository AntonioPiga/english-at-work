import { h, levelBadge, errorView, todayKey, updateStreak } from '../dom.js';
import * as quiz from './exercises/quiz.js';
import * as gapfill from './exercises/gapfill.js';
import * as reorder from './exercises/reorder.js';
import * as fluency from './exercises/fluency.js';
import * as write from './exercises/write.js';

export async function render({ params, store, content, speech, onLeave }) {
  const idx = await content.loadIndex();
  const track = idx.tracks.find((t) => t.modules.some((m) => m.id === params.id));
  if (!track) return errorView('Modulo non trovato.');
  const entry = track.modules.find((m) => m.id === params.id);
  const pos = track.modules.indexOf(entry);
  const next = track.modules[pos + 1];
  const mod = await content.loadModule(params.id);
  const settings = store.get().settings;
  let touched = false;
  const onActivity = () => { if (touched) return; touched = true; store.update((d) => { d.streak = updateStreak(d.streak, todayKey()); }); };

  const results = {
    quiz: { correct: 0, total: mod.quiz.length },
    exercises: { correct: 0, total: (mod.gapfill?.length ?? 0) + (mod.reorder?.length ?? 0) + (mod.write?.length ?? 0) },
    fluency: [],
  };
  let gapState = { correct: 0 };
  let reorderState = { correct: 0 };
  let writeState = { correct: 0 };
  const sumExercises = () => { results.exercises.correct = gapState.correct + reorderState.correct + writeState.correct; };

  const sections = [];
  const navLinks = {};
  const markDone = (key) => navLinks[key]?.classList.add('done');

  const section = (key, num, title, ...body) => {
    const sec = h('section', { class: 'block', id: `sec-${key}` }, h('h2', null, h('span', { class: 'step-num' }, num), title), ...body);
    sections.push(sec);
    navLinks[key] = h('a', { href: `#sec-${key}`, onClick: (e) => { e.preventDefault(); sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, `${num}. ${title}`);
    return sec;
  };

  // 1. Grammar
  const g = mod.grammar;
  section('grammar', 1, 'Grammatica',
    h('div', { class: 'card' },
      h('h3', null, g.title),
      h('p', null, g.explanation),
      h('ul', { class: 'examples' }, ...g.examples.map((ex) => h('li', null,
        h('button', { class: 'btn btn-icon btn-sm', type: 'button', 'aria-label': 'Ascolta', onClick: () => speech.speak(ex.en, { rate: settings.rate }) }, '🔊'),
        h('div', null, h('div', { class: 'en' }, ex.en), ex.note ? h('div', { class: 'small muted' }, ex.note) : null)))),
      h('div', { class: 'trap' }, h('strong', null, 'Trappola italiana: '), g.italianTrap)));
  markDone('grammar');

  // 2. Phrases
  section('phrases', 2, 'Frasi pronte',
    h('div', { class: 'card' },
      h('p', { class: 'small muted' }, 'Ascolta e ripeti ogni frase ad alta voce. Poi coprile e prova a dirle dall’italiano.'),
      ...mod.phrases.map((p) => h('div', { class: 'phrase' },
        h('button', { class: 'btn btn-icon btn-sm', type: 'button', 'aria-label': 'Ascolta', onClick: () => speech.speak(p.en, { rate: settings.rate }) }, '🔊'),
        h('div', null, h('div', { class: 'when' }, p.when), h('div', { class: 'en' }, p.en), h('div', { class: 'it' }, p.it)))),
      h('div', { class: 'row', style: 'margin-top:.75rem' },
        h('button', { class: 'btn btn-sm', type: 'button', onClick: async () => { for (const p of mod.phrases) { const done = await speech.speak(p.en, { rate: settings.rate }); if (!done) break; } } }, '🔊 Ascolta tutte'),
        h('button', { class: 'btn btn-sm', type: 'button', onClick: () => speech.stopSpeaking() }, '■ Stop'))));
  markDone('phrases');

  // 3. Quiz
  const quizBox = h('div', { class: 'card' });
  quiz.mount(quizBox, mod.quiz, { onProgress: ({ answered, correct, total }) => {
    onActivity();
    results.quiz.correct = correct;
    if (answered === total) { markDone('quiz'); quizBox.append(h('p', { class: 'result' }, `Quiz: ${correct}/${total}`)); }
  } });
  section('quiz', 3, 'Quiz', quizBox);

  // 4. Exercises (gapfill + reorder)
  const exBox = h('div', { class: 'card' });
  let exDone = 0;
  const exTotalParts = (mod.gapfill?.length ? 1 : 0) + (mod.reorder?.length ? 1 : 0);
  const partDone = () => { exDone += 1; if (exDone === exTotalParts) markDone('exercises'); };
  if (mod.gapfill?.length) {
    exBox.append(h('h3', null, 'Completa'));
    gapfill.mount(exBox, mod.gapfill, { onProgress: ({ answered, correct, total }) => { onActivity(); gapState.correct = correct; sumExercises(); if (answered === total) partDone(); } });
  }
  if (mod.reorder?.length) {
    exBox.append(h('h3', { style: 'margin-top:1rem' }, 'Riordina'));
    reorder.mount(exBox, mod.reorder, { onProgress: ({ answered, correct, total }) => { onActivity(); reorderState.correct = correct; sumExercises(); if (answered === total) partDone(); } });
  }
  section('exercises', 4, 'Esercizi', exBox);

  // 5. Fluency
  const flBox = h('div', { class: 'card' });
  flBox.append(h('p', { class: 'small muted' }, 'Leggi la situazione, avvia il timer e rispondi a voce come se fossi in call. Allo scadere confronta con il modello.'));
  fluency.mount(flBox, mod.fluency, { speech, settings, onLeave, onActivity, onProgress: ({ answered, stars, total }) => { results.fluency = stars; if (answered === total) markDone('fluency'); } });
  section('fluency', 5, 'Fluidità', flBox);

  // 6. Write (optional)
  if (mod.write?.length) {
    const wBox = h('div', { class: 'card' });
    write.mount(wBox, mod.write, { onProgress: ({ answered, correct, total }) => { onActivity(); writeState.correct = correct; sumExercises(); if (answered === total) markDone('write'); } });
    section('write', 6, 'Scrivi', wBox);
  }

  // Completion
  const saved = store.get().modules[mod.id];
  const completeMsg = h('div', { class: 'card' });
  const completeBtn = h('button', { class: 'btn btn-primary', type: 'button', onClick: () => {
    store.update((d) => {
      d.modules[mod.id] = { quiz: { ...results.quiz }, exercises: { ...results.exercises }, fluency: results.fluency.filter(Boolean), completedAt: new Date().toISOString() };
      d.streak = updateStreak(d.streak, todayKey());
    });
    completeMsg.replaceChildren(
      h('h2', null, 'Modulo completato'),
      h('p', null, `Quiz ${results.quiz.correct}/${results.quiz.total} · Esercizi ${results.exercises.correct}/${results.exercises.total} · Fluidità ${results.fluency.filter(Boolean).length ? (results.fluency.filter(Boolean).reduce((a, b) => a + b, 0) / results.fluency.filter(Boolean).length).toFixed(1) + '★' : '–'}`),
      h('div', { class: 'row' },
        next ? h('a', { class: 'btn btn-primary', href: `#/module/${next.id}` }, `Prossimo: ${next.title} →`) : h('a', { class: 'btn btn-primary', href: '#/' }, 'Percorso finito, torna al corso'),
        h('a', { class: 'btn', href: `#/track/${track.id}` }, 'Torna al percorso')));
  } }, saved?.completedAt ? 'Salva di nuovo i risultati' : 'Segna il modulo come completato');
  completeMsg.append(
    h('h2', null, 'Fine del modulo'),
    h('p', { class: 'muted' }, saved?.completedAt ? 'Lo avevi già completato: rifarlo aggiorna i punteggi.' : 'Quando hai fatto tutto quello che volevi, salva i risultati.'),
    completeBtn);

  const root = h('div', { dataset: { title: mod.title } },
    h('div', { class: 'module-head' },
      h('a', { class: 'btn btn-ghost btn-sm', href: `#/track/${track.id}` }, `← ${track.title}`),
      h('div', { class: 'row between' }, h('h1', null, mod.title), levelBadge(mod.level)),
      h('p', { class: 'muted small' }, `Modulo ${pos + 1} di ${track.modules.length} · ${mod.minutes} min`)),
    h('nav', { class: 'section-nav', 'aria-label': 'Sezioni del modulo' }, ...Object.values(navLinks)),
    ...sections,
    completeMsg);
  return root;
}
