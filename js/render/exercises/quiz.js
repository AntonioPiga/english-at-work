import { h } from '../../dom.js';

const LETTERS = ['A', 'B', 'C', 'D'];

// Renders multiple-choice questions. onProgress({ answered, correct, total }) after each answer.
export function mount(container, items, { onProgress } = {}) {
  let answered = 0;
  let correct = 0;
  items.forEach((item, qi) => {
    const buttons = [];
    const why = h('div', { class: 'why', hidden: true });
    const choices = h('div', { class: 'choices', role: 'group', 'aria-label': `Domanda ${qi + 1}` });
    item.options.forEach((opt, oi) => {
      const b = h('button', { class: 'choice', type: 'button', onClick: () => {
        buttons.forEach((x) => { x.disabled = true; });
        const ok = oi === item.answer;
        b.classList.add(ok ? 'correct' : 'wrong');
        buttons[item.answer].classList.add('correct');
        why.hidden = false;
        why.className = `why ${ok ? 'ok' : 'ko'}`;
        why.textContent = (ok ? 'Giusto. ' : 'Non proprio. ') + item.why;
        answered += 1;
        if (ok) correct += 1;
        onProgress?.({ answered, correct, total: items.length });
      } }, h('span', { class: 'letter' }, LETTERS[oi]), h('span', null, opt));
      buttons.push(b);
      choices.append(b);
    });
    container.append(h('div', { class: 'question' }, h('div', { class: 'stem' }, `${qi + 1}. ${item.q}`), choices, why));
  });
}
