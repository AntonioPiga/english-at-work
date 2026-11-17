import { startRouter } from './router.js';

const app = document.getElementById('app');

startRouter((route) => {
  app.innerHTML = '';
  const p = document.createElement('p');
  p.textContent = `Vista: ${route.name}`;
  app.append(p);
});
