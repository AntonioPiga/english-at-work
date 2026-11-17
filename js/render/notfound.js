import { h } from '../dom.js';

export function render() {
  return h('div', { class: 'card' },
    h('h1', null, 'Pagina non trovata'),
    h('p', null, 'Il link non corrisponde a nessuna pagina del corso.'),
    h('a', { class: 'btn btn-primary', href: '#/' }, 'Torna al corso'));
}
