import { h } from '../../dom.js';
import { checkGap } from '../../grading.js';

// Fill-the-gap items. onProgress({ answered, correct, total }).
export function mount(container, items, { onProgress } = {}) {
  let answered = 0;
  let correct = 0;
  items.forEach((item, i) => {
    const [before, after] = item.text.split('___');
    const input = h('input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': `Completa la frase ${i + 1}` });
    const result = h('div', { class: 'result' });
    const check = () => {
      if (input.disabled || !input.value.trim()) return;
      const ok = checkGap(input.value, item.answers);
      input.disabled = true;
      input.classList.add(ok ? 'ok' : 'ko');
      btn.disabled = true;
      result.className = `result ${ok ? 'ok' : 'ko'}`;
      result.textContent = ok ? 'Esatto.' : `Risposta: ${item.answers.join(' / ')}`;
      answered += 1;
      if (ok) correct += 1;
      onProgress?.({ answered, correct, total: items.length });
    };
    const btn = h('button', { class: 'btn btn-sm', type: 'button', onClick: check }, 'Verifica');
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
    container.append(h('div', { class: 'gap' },
      h('p', { class: 'gap-text' }, before, input, after),
      h('div', { class: 'row' }, btn, h('span', { class: 'hint' }, `Suggerimento: ${item.hint}`)),
      result));
  });
}
