import { h, errorView, todayKey, updateStreak } from '../dom.js';
import { buildSession, review } from '../srs.js';

export async function render({ params, store, content, speech }) {
  let deck;
  try { deck = await content.loadDeck(params.deck); } catch { return errorView('Mazzo non trovato.', '#/flashcards'); }
  const settings = store.get().settings;
  const byId = new Map(deck.cards.map((c) => [c.id, c]));
  const now = Date.now();
  let queue = buildSession(deck.cards.map((c) => c.id), store.get().srs, now, 20);
  const stage = h('div');
  const root = h('div', { dataset: { title: deck.title } },
    h('a', { class: 'btn btn-ghost btn-sm', href: '#/flashcards' }, '← Mazzi'),
    h('h1', null, deck.title), h('p', { class: 'muted' }, deck.description), stage);

  let known = 0; let unknown = 0; let seen = 0; const total0 = queue.length;
  const counter = h('p', { class: 'small muted' });

  const runCard = () => {
    if (!queue.length) return done();
    const id = queue[0];
    const card = byId.get(id);
    counter.textContent = `Carta ${Math.min(seen + 1, total0)} di ${total0}${queue.length > total0 - seen ? ` (+${queue.length - (total0 - seen)} da rivedere)` : ''}`;
    const fc = h('div', { class: 'flashcard', role: 'button', tabindex: '0', 'aria-label': 'Gira la carta' },
      h('div', { class: 'inner' },
        h('div', { class: 'face front' }, h('span', { class: 'label' }, 'Italiano'), h('div', null, card.front)),
        h('div', { class: 'face back' }, h('span', { class: 'label' }, 'English'), h('div', null, card.back, h('div', { class: 'example' }, card.example)))));
    const answers = h('div', { class: 'row', style: 'margin-top:1rem;justify-content:center', hidden: true },
      h('button', { class: 'btn', type: 'button', onClick: () => answer(false) }, '✗ Non sapevo'),
      h('button', { class: 'btn btn-primary', type: 'button', onClick: () => answer(true) }, '✓ Sapevo'),
      h('button', { class: 'btn btn-icon', type: 'button', 'aria-label': 'Ascolta', onClick: () => speech.speak(card.back.replace(/\(.*?\)/g, '') + '. ' + card.example, { rate: settings.rate }) }, '🔊'));
    const flip = () => { fc.classList.add('flipped'); answers.hidden = false; };
    fc.addEventListener('click', flip);
    fc.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } });
    const answer = (correct) => {
      store.update((d) => { d.srs[id] = review(d.srs[id], correct, Date.now()); });
      queue.shift();
      if (correct) known += 1; else { unknown += 1; queue.push(id); }
      seen += 1;
      runCard();
    };
    stage.replaceChildren(counter, fc, answers, h('p', { class: 'small muted', style: 'text-align:center;margin-top:.5rem' }, 'Tocca la carta per girarla'));
  };

  const done = () => {
    store.update((d) => { d.streak = updateStreak(d.streak, todayKey()); });
    stage.replaceChildren(h('div', { class: 'card' },
      h('h2', null, 'Sessione finita'),
      h('p', null, `${known} sapute, ${unknown} da rivedere. Le carte sbagliate torneranno domani.`),
      h('div', { class: 'row' }, h('a', { class: 'btn btn-primary', href: '#/flashcards' }, 'Altri mazzi'), h('a', { class: 'btn', href: '#/' }, 'Torna al corso'))));
  };

  if (!queue.length) {
    stage.replaceChildren(h('div', { class: 'card' },
      h('h2', null, 'Niente da ripassare oggi'),
      h('p', { class: 'muted' }, 'Tutte le carte di questo mazzo sono in pari. Puoi comunque fare un giro di ripasso libero.'),
      h('button', { class: 'btn btn-primary', type: 'button', onClick: () => {
        queue = deck.cards.map((c) => c.id).sort(() => Math.random() - 0.5).slice(0, 10);
        runCard();
      } }, 'Ripassa 10 carte a caso')));
    return root;
  }
  runCard();
  return root;
}
