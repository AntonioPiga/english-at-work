import { h, levelBadge, pct, formatDate } from '../dom.js';

export async function render({ store, content, speech }) {
  const idx = await content.loadIndex();
  const state = store.get();
  const allModules = idx.tracks.flatMap((t) => t.modules);
  const completed = allModules.filter((m) => state.modules[m.id]?.completedAt).length;
  const boxes = [0, 0, 0, 0, 0];
  for (const s of Object.values(state.srs)) boxes[(s.box ?? 1) - 1] += 1;
  const root = h('div', { dataset: { title: 'Progressi' } }, h('h1', null, 'Progressi'));

  root.append(h('div', { class: 'kpi' },
    h('div', { class: 'card' }, h('strong', null, `${completed}/${allModules.length}`), h('span', { class: 'small muted' }, 'moduli completati')),
    h('div', { class: 'card' }, h('strong', null, state.streak.days), h('span', { class: 'small muted' }, 'giorni di serie')),
    h('div', { class: 'card' }, h('strong', null, state.placement ? state.placement.level : '–'), h('span', { class: 'small muted' }, 'livello consigliato')),
    h('div', { class: 'card' }, h('strong', null, boxes[4]), h('span', { class: 'small muted' }, 'carte consolidate'))));

  for (const t of idx.tracks) {
    const rows = t.modules.map((m) => {
      const p = state.modules[m.id];
      const fl = p?.fluency?.length ? (p.fluency.reduce((a, b) => a + b, 0) / p.fluency.length).toFixed(1) + '★' : '–';
      return h('tr', null, h('td', null, h('a', { href: `#/module/${m.id}` }, m.title)), h('td', null, levelBadge(m.level)),
        h('td', null, p ? `${pct(p.quiz.correct, p.quiz.total)}%` : '–'), h('td', null, p ? `${pct(p.exercises.correct, p.exercises.total)}%` : '–'), h('td', null, fl),
        h('td', { class: 'small muted' }, p?.completedAt ? formatDate(p.completedAt) : '–'));
    });
    root.append(h('div', { class: 'card' }, h('h2', null, t.title),
      h('div', { style: 'overflow-x:auto' }, h('table', { class: 'table' },
        h('thead', null, h('tr', null, h('th', null, 'Modulo'), h('th', null, 'Liv.'), h('th', null, 'Quiz'), h('th', null, 'Eserc.'), h('th', null, 'Fluid.'), h('th', null, 'Fatto'))),
        h('tbody', null, ...rows)))));
  }

  root.append(h('div', { class: 'card' }, h('h2', null, 'Flashcard per scatola'),
    h('p', { class: 'small muted' }, 'Scatola 1 = da rivedere spesso, scatola 5 = consolidata (ogni 14 giorni).'),
    h('div', { class: 'row' }, ...boxes.map((n, i) => h('div', { class: 'card', style: 'margin:0;flex:1;text-align:center;padding:.6rem' }, h('strong', null, n), h('div', { class: 'small muted' }, `Scatola ${i + 1}`))))));

  // Settings
  const rate = h('input', { type: 'range', min: '0.6', max: '1.3', step: '0.1', value: String(state.settings.rate), 'aria-label': 'Velocità della voce' });
  const rateLabel = h('span', { class: 'small muted' }, `${state.settings.rate.toFixed(1)}×`);
  rate.addEventListener('input', () => { rateLabel.textContent = `${Number(rate.value).toFixed(1)}×`; store.update((d) => { d.settings.rate = Number(rate.value); }); });
  const mic = h('input', { type: 'checkbox', checked: state.settings.mic ? true : null });
  mic.addEventListener('change', () => store.update((d) => { d.settings.mic = mic.checked; }));
  root.append(h('div', { class: 'card' }, h('h2', null, 'Impostazioni'),
    h('div', { class: 'row' }, h('label', null, 'Velocità voce '), rate, rateLabel, h('button', { class: 'btn btn-sm', type: 'button', onClick: () => speech.speak('Thanks everyone for joining. Shall we get started?', { rate: Number(rate.value) }) }, '🔊 Prova')),
    h('p', { class: 'small muted' }, speech.canListen() ? 'Riconoscimento vocale disponibile in questo browser.' : 'Riconoscimento vocale non disponibile in questo browser (funziona su Chrome ed Edge). Gli esercizi di fluidità restano utilizzabili.'),
    h('label', { class: 'row' }, mic, ' Avvia il microfono automaticamente negli esercizi di fluidità')));

  // Export / import / reset
  const fileInput = h('input', { type: 'file', accept: 'application/json', hidden: true });
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files?.[0]; if (!f) return;
    const text = await f.text();
    if (!confirm('Importare questo file sostituirà i progressi attuali. Continuare?')) return;
    if (store.importJSON(text)) location.reload(); else alert('File non valido: deve essere un export di English at Work.');
  });
  root.append(h('div', { class: 'card' }, h('h2', null, 'Backup'),
    h('p', { class: 'small muted' }, 'I progressi vivono solo in questo browser. Esportali per non perderli o per spostarli su un altro dispositivo.'),
    h('div', { class: 'row' },
      h('button', { class: 'btn', type: 'button', onClick: () => {
        const blob = new Blob([store.exportJSON()], { type: 'application/json' });
        const a = h('a', { href: URL.createObjectURL(blob), download: 'english-at-work-progress.json' });
        document.body.append(a); a.click(); a.remove();
      } }, '⬇ Esporta progressi'),
      h('button', { class: 'btn', type: 'button', onClick: () => fileInput.click() }, '⬆ Importa'),
      fileInput,
      h('button', { class: 'btn', type: 'button', style: 'color:var(--err)', onClick: () => { if (confirm('Cancellare tutti i progressi? Non si può annullare.')) { store.reset(); location.reload(); } } }, 'Azzera tutto'))));
  return root;
}
