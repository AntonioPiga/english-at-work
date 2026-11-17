import { h } from '../../dom.js';
import { checkReorder } from '../../grading.js';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Click-to-build sentence from word chips. onProgress({ answered, correct, total }).
export function mount(container, items, { onProgress } = {}) {
  let answered = 0;
  let correct = 0;
  items.forEach((item, i) => {
    let source = shuffle(item.words);
    if (source.join(' ') === item.words.join(' ') && item.words.length > 2) source = [...item.words].reverse();
    let target = [];
    let locked = false;
    const sourceEl = h('div', { class: 'chips', 'aria-label': 'Parole disponibili' });
    const targetEl = h('div', { class: 'chips target', 'aria-label': 'La tua frase' });
    const result = h('div', { class: 'result' });
    const btn = h('button', { class: 'btn btn-sm', type: 'button', onClick: () => {
      if (locked || target.length !== item.words.length) return;
      locked = true;
      const ok = checkReorder(target, [item.answer, ...(item.answers ?? [])]);
      btn.disabled = true;
      result.className = `result ${ok ? 'ok' : 'ko'}`;
      result.textContent = ok ? 'Esatto.' : `Risposta: ${item.answer}`;
      answered += 1;
      if (ok) correct += 1;
      onProgress?.({ answered, correct, total: items.length });
      draw();
    } }, 'Verifica');
    const draw = () => {
      sourceEl.replaceChildren(...source.map((w, idx) => h('button', { class: 'chip', type: 'button', disabled: locked, onClick: () => { target.push(w); source.splice(idx, 1); draw(); } }, w)));
      targetEl.replaceChildren(...(target.length ? target.map((w, idx) => h('button', { class: 'chip', type: 'button', disabled: locked, onClick: () => { source.push(w); target.splice(idx, 1); draw(); } }, w)) : [h('span', { class: 'hint' }, 'Tocca le parole nell’ordine giusto')]));
      btn.disabled = locked || target.length !== item.words.length;
    };
    draw();
    container.append(h('div', { class: 'gap' }, h('p', { class: 'small muted' }, `Riordina ${i + 1}`), targetEl, sourceEl, h('div', { class: 'row', style: 'margin-top:.5rem' }, btn), result));
  });
}
