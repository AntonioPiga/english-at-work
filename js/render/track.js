import { h, levelBadge, pct, errorView } from '../dom.js';

export async function render({ params, store, content }) {
  const idx = await content.loadIndex();
  const track = idx.tracks.find((t) => t.id === params.id);
  if (!track) return errorView('Percorso non trovato.');
  const state = store.get();
  const root = h('div', { dataset: { title: track.title } });
  root.append(
    h('a', { class: 'btn btn-ghost btn-sm', href: '#/' }, '← Corso'),
    h('h1', null, track.title),
    h('p', { class: 'muted' }, track.subtitle),
  );
  if (state.placement) root.append(h('p', { class: 'small muted' }, 'Livello consigliato dal test: ', levelBadge(state.placement.level)));
  track.modules.forEach((m, i) => {
    const p = state.modules[m.id];
    const quiz = p ? pct(p.quiz.correct, p.quiz.total) : null;
    root.append(h('a', { class: 'card link', href: `#/module/${m.id}` },
      h('div', { class: 'row between' },
        h('div', { class: 'row' }, h('span', { class: 'step-num' }, i + 1), h('h2', null, m.title)),
        levelBadge(m.level)),
      h('p', { class: 'muted small' }, `${m.minutes} min`,
        p?.completedAt ? h('span', { class: 'badge badge-ok', style: 'margin-left:.5rem' }, `Completato · quiz ${quiz}%`) : null)));
  });
  return root;
}
