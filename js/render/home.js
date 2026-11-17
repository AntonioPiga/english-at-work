import { h, levelBadge, pct } from '../dom.js';
import { buildSession } from '../srs.js';

export async function render({ store, content }) {
  const idx = await content.loadIndex();
  const state = store.get();
  const root = h('div', { dataset: { title: 'Corso' } });

  const placementCard = state.placement
    ? h('div', { class: 'card row between' },
        h('div', null, h('strong', null, 'Livello consigliato: '), levelBadge(state.placement.level),
          h('span', { class: 'muted small' }, ` · ${state.placement.score}/20 nel test iniziale`)),
        h('a', { class: 'btn btn-sm', href: '#/placement' }, 'Rifai il test'))
    : h('div', { class: 'card' },
        h('h2', null, 'Da dove partire?'),
        h('p', { class: 'muted' }, 'Venti domande, cinque minuti: ti dico da quale livello conviene iniziare. Puoi saltarlo e scegliere tu.'),
        h('a', { class: 'btn btn-primary', href: '#/placement' }, 'Fai il test iniziale'));

  const trackCards = idx.tracks.map((t) => {
    const done = t.modules.filter((m) => state.modules[m.id]?.completedAt).length;
    const total = t.modules.length;
    return h('a', { class: 'card link', href: `#/track/${t.id}` },
      h('div', { class: 'row between' }, h('h2', null, t.title), h('span', { class: 'badge' }, `${done}/${total}`)),
      h('p', { class: 'muted' }, t.subtitle),
      h('div', { class: 'progress-bar' }, h('span', { style: `width:${pct(done, total)}%` })));
  });

  // Flashcards due today across decks
  let due = 0;
  try {
    const decks = await Promise.all((idx.decks ?? []).map((d) => content.loadDeck(d.id)));
    const now = Date.now();
    for (const d of decks) due += buildSession(d.cards.map((c) => c.id), state.srs, now, 0).length;
  } catch { /* ignore: cards are optional on home */ }

  const streak = state.streak.days;
  root.append(
    h('h1', null, 'English at Work'),
    h('p', { class: 'muted' }, 'Call tecniche, mail formali e presentazioni. Dieci-quindici minuti al giorno, sempre nel tuo contesto di lavoro.'),
    placementCard,
    h('div', { class: 'grid' }, trackCards),
    h('div', { class: 'grid cols-2' },
      h('a', { class: 'card link', href: '#/flashcards' },
        h('h2', null, 'Flashcard'),
        h('p', { class: 'muted' }, due ? `${due} carte da ripassare oggi` : 'Nessuna carta in scadenza: puoi imparare carte nuove')),
      h('a', { class: 'card link', href: '#/progress' },
        h('h2', null, 'Progressi'),
        h('p', { class: 'muted' }, streak ? `Serie attiva: ${streak} ${streak === 1 ? 'giorno' : 'giorni'}` : 'Inizia oggi la tua serie'))),
  );
  return root;
}
