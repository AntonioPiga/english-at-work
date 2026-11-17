import { h } from '../../dom.js';
import { keyPhraseCoverage } from '../../grading.js';

// Short writing tasks compared against a model + self-check list. onProgress({ answered, correct, total }).
export function mount(container, items, { onProgress } = {}) {
  let answered = 0;
  let correct = 0;
  items.forEach((item, i) => {
    const ta = h('textarea', { placeholder: 'Scrivi qui in inglese…', 'aria-label': `Compito di scrittura ${i + 1}` });
    const out = h('div', { hidden: true });
    const btn = h('button', { class: 'btn btn-primary btn-sm', type: 'button', onClick: () => {
      if (ta.value.trim().length < 20) { out.hidden = false; out.replaceChildren(h('p', { class: 'result ko' }, 'Scrivi almeno un paio di frasi prima di confrontare.')); return; }
      btn.disabled = true; ta.readOnly = true;
      const cov = keyPhraseCoverage(ta.value, item.keyPhrases ?? []);
      const words = ta.value.trim().split(/\s+/).length;
      out.hidden = false;
      out.replaceChildren(
        h('p', { class: 'small muted' }, `${words} parole.`, item.keyPhrases?.length ? ` Frasi chiave usate: ${cov.found.length}/${item.keyPhrases.length}.` : ''),
        item.keyPhrases?.length ? h('div', { class: 'row' },
          ...cov.found.map((k) => h('span', { class: 'chip key' }, `✓ ${k}`)),
          ...cov.missing.map((k) => h('span', { class: 'chip missing' }, `✗ ${k}`))) : null,
        h('h3', { style: 'margin-top:.8rem' }, 'Modello'),
        h('pre', { class: 'model', style: 'white-space:pre-wrap;font:inherit' }, item.model),
        h('h3', null, 'Checklist'),
        h('ul', { class: 'checklist' }, ...item.checklist.map((c) => h('li', null, h('label', null, h('input', { type: 'checkbox' }), c)))),
      );
      answered += 1;
      if (cov.ratio >= 0.6) correct += 1;
      onProgress?.({ answered, correct, total: items.length });
    } }, 'Confronta con il modello');
    container.append(h('div', { class: 'drill' },
      h('div', { class: 'prompt' }, item.prompt), ta, h('div', { class: 'row', style: 'margin-top:.5rem' }, btn), out));
  });
}
