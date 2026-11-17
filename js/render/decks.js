import { h } from '../dom.js';
import { buildSession } from '../srs.js';

export async function render({ store, content }) {
  const idx = await content.loadIndex();
  const state = store.get();
  const now = Date.now();
  const root = h('div', { dataset: { title: 'Flashcard' } }, h('h1', null, 'Flashcard'),
    h('p', { class: 'muted' }, 'Ripetizione spaziata: le carte che sbagli tornano prima, quelle che sai si allontanano. Ogni giorno: prima le carte in scadenza, poi fino a 20 nuove per mazzo.'));
  for (const entry of idx.decks ?? []) {
    let deck;
    try { deck = await content.loadDeck(entry.id); } catch { continue; }
    const ids = deck.cards.map((c) => c.id);
    const due = buildSession(ids, state.srs, now, 0).length;
    const fresh = ids.filter((id) => !state.srs[id]).length;
    const learned = ids.filter((id) => state.srs[id]?.box === 5).length;
    root.append(h('a', { class: 'card link', href: `#/flashcards/${deck.id}` },
      h('div', { class: 'row between' }, h('h2', null, deck.title), h('span', { class: `badge ${due ? 'badge-warn' : ''}` }, due ? `${due} da ripassare` : 'in pari')),
      h('p', { class: 'muted' }, deck.description),
      h('p', { class: 'small muted' }, `${ids.length} carte · ${fresh} nuove · ${learned} consolidate`)));
  }
  return root;
}
