import { startRouter } from './router.js';
import { createStore } from './store.js';
import * as content from './content.js';
import * as speech from './speech.js';
import { h, errorView } from './dom.js';
import * as home from './render/home.js';
import * as track from './render/track.js';
import * as moduleView from './render/module.js';
import * as placement from './render/placement.js';
import * as decks from './render/decks.js';
import * as flashcards from './render/flashcards.js';
import * as reference from './render/reference.js';
import * as progress from './render/progress.js';
import * as notfound from './render/notfound.js';

const VIEWS = { home, track, module: moduleView, placement, decks, flashcards, reference, progress, notfound };
const NAV_FOR = { home: 'home', placement: 'home', track: 'home', module: 'home', decks: 'decks', flashcards: 'decks', reference: 'reference', progress: 'progress' };

const app = document.getElementById('app');
const store = createStore();
const ctx = { store, content, speech, onLeave, navigate: (hash) => { location.hash = hash; } };

let renderToken = 0;
let leaveHandlers = [];
const onLeave = (fn) => leaveHandlers.push(fn);

startRouter(async (route) => {
  const token = ++renderToken;
  document.querySelectorAll('.topbar nav a').forEach((a) => {
    if (a.dataset.nav === NAV_FOR[route.name]) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  speech.stopSpeaking();
  speech.stopListening();
  for (const fn of leaveHandlers) { try { fn(); } catch (e) { console.error(e); } }
  leaveHandlers = [];
  app.replaceChildren(h('p', { class: 'muted' }, 'Caricamento…'));
  try {
    const view = VIEWS[route.name] || notfound;
    const el = await view.render({ ...ctx, params: route.params });
    if (token !== renderToken) return;
    el.classList.add('fade-in');
    app.replaceChildren(el);
    window.scrollTo({ top: 0 });
    app.focus({ preventScroll: true });
    document.title = (el.dataset.title ? `${el.dataset.title} · ` : '') + 'English at Work';
  } catch (err) {
    console.error(err);
    if (token !== renderToken) return;
    app.replaceChildren(errorView('Non riesco a caricare i contenuti.', { retry: true }));
  }
});
