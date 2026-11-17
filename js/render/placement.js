import { h, levelBadge, todayKey, updateStreak } from '../dom.js';

const LEVELS = ['C1', 'B2', 'B1'];

export function suggestLevel(perLevel) {
  for (const lvl of LEVELS) {
    const p = perLevel[lvl];
    if (p && p.total && p.correct / p.total >= 0.6) return lvl;
  }
  return 'B1';
}

export async function render({ store, content }) {
  const data = await content.loadPlacement();
  const qs = data.questions;
  const root = h('div', { dataset: { title: 'Test iniziale' } });
  if (!qs.length) {
    root.append(h('div', { class: 'card' }, h('h1', null, 'Test iniziale'), h('p', null, 'Il test non è ancora disponibile.')));
    return root;
  }
  let i = 0;
  let correct = 0;
  const perLevel = { B1: { correct: 0, total: 0 }, B2: { correct: 0, total: 0 }, C1: { correct: 0, total: 0 } };
  const bar = h('div', { class: 'progress-bar' }, h('span', { style: 'width:0%' }));
  const stage = h('div', { class: 'card' });

  const showQuestion = () => {
    const q = qs[i];
    bar.firstChild.style.width = `${Math.round((i / qs.length) * 100)}%`;
    const why = h('div', { class: 'why', hidden: true });
    const nextBtn = h('button', { class: 'btn btn-primary', type: 'button', hidden: true, onClick: () => { i += 1; if (i < qs.length) showQuestion(); else finish(); } }, i + 1 < qs.length ? 'Avanti →' : 'Vedi il risultato');
    const buttons = [];
    const choices = h('div', { class: 'choices' });
    q.options.forEach((opt, oi) => {
      const b = h('button', { class: 'choice', type: 'button', onClick: () => {
        buttons.forEach((x) => { x.disabled = true; });
        const ok = oi === q.answer;
        b.classList.add(ok ? 'correct' : 'wrong');
        buttons[q.answer].classList.add('correct');
        perLevel[q.level].total += 1;
        if (ok) { correct += 1; perLevel[q.level].correct += 1; }
        why.hidden = false; why.className = `why ${ok ? 'ok' : 'ko'}`; why.textContent = q.why;
        nextBtn.hidden = false;
      } }, h('span', { class: 'letter' }, 'ABCD'[oi]), h('span', null, opt));
      buttons.push(b); choices.append(b);
    });
    stage.replaceChildren(h('p', { class: 'small muted' }, `Domanda ${i + 1} di ${qs.length}`), h('div', { class: 'stem' }, q.q), choices, why, h('div', { class: 'row', style: 'margin-top:.75rem' }, nextBtn));
  };

  const finish = () => {
    bar.firstChild.style.width = '100%';
    const level = suggestLevel(perLevel);
    store.update((d) => {
      d.placement = { level, score: correct, perLevel, at: new Date().toISOString() };
      d.streak = updateStreak(d.streak, todayKey());
    });
    stage.replaceChildren(
      h('h2', null, 'Risultato'),
      h('p', null, `Hai risposto correttamente a ${correct} domande su ${qs.length}.`),
      h('table', { class: 'table' }, h('tbody', null, ...['B1', 'B2', 'C1'].map((l) => h('tr', null, h('td', null, levelBadge(l)), h('td', null, `${perLevel[l].correct}/${perLevel[l].total}`))))),
      h('p', { style: 'margin-top:1rem' }, 'Ti consiglio di partire dai moduli ', levelBadge(level), ' di ogni percorso. Puoi comunque fare tutti i moduli nell’ordine che preferisci.'),
      h('div', { class: 'row' }, h('a', { class: 'btn btn-primary', href: '#/' }, 'Vai al corso')));
  };

  root.append(h('h1', null, 'Test iniziale'), h('p', { class: 'muted' }, 'Venti domande a scelta multipla. Rispondi d’istinto: serve a capire da dove partire, non a dare un voto.'), bar, stage);
  showQuestion();
  return root;
}
