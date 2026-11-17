import { h, levelBadge } from '../dom.js';

export async function render({ content, speech, store }) {
  const idx = await content.loadIndex();
  const modules = await content.loadAllModules();
  const settings = store.get().settings;
  const root = h('div', { dataset: { title: 'Grammatica' } }, h('h1', null, 'Grammatica e frasi'),
    h('p', { class: 'muted' }, 'Tutte le pillole di grammatica e i phrase bank del corso, consultabili fuori sequenza.'));
  for (const t of idx.tracks) {
    root.append(h('h2', { style: 'margin-top:1.5rem' }, t.title));
    for (const entry of t.modules) {
      const m = modules.find((x) => x.id === entry.id);
      if (!m) continue;
      root.append(h('div', { class: 'card' },
        h('div', { class: 'row between' }, h('h3', null, m.grammar.title), levelBadge(m.level)),
        h('p', { class: 'small muted' }, 'Dal modulo ', h('a', { href: `#/module/${m.id}` }, m.title)),
        h('p', null, m.grammar.explanation),
        h('ul', { class: 'examples' }, ...m.grammar.examples.map((ex) => h('li', null,
          h('button', { class: 'btn btn-icon btn-sm', type: 'button', 'aria-label': 'Ascolta', onClick: () => speech.speak(ex.en, { rate: settings.rate }) }, '🔊'),
          h('div', null, h('div', { class: 'en' }, ex.en), ex.note ? h('div', { class: 'small muted' }, ex.note) : null)))),
        h('div', { class: 'trap' }, h('strong', null, 'Trappola italiana: '), m.grammar.italianTrap),
        h('details', { style: 'margin-top:.75rem' }, h('summary', null, `Frasi pronte (${m.phrases.length})`),
          ...m.phrases.map((p) => h('div', { class: 'phrase' },
            h('button', { class: 'btn btn-icon btn-sm', type: 'button', 'aria-label': 'Ascolta', onClick: () => speech.speak(p.en, { rate: settings.rate }) }, '🔊'),
            h('div', null, h('div', { class: 'en' }, p.en), h('div', { class: 'it' }, p.it)))))));
    }
  }
  return root;
}
