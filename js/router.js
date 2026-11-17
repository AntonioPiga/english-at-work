// Hash router: "#/track/calls" -> { name: 'track', params: { id: 'calls' } }

const ROUTES = [
  { pattern: [], name: 'home' },
  { pattern: ['placement'], name: 'placement' },
  { pattern: ['track', ':id'], name: 'track' },
  { pattern: ['module', ':id'], name: 'module' },
  { pattern: ['flashcards'], name: 'decks' },
  { pattern: ['flashcards', ':deck'], name: 'flashcards' },
  { pattern: ['reference'], name: 'reference' },
  { pattern: ['progress'], name: 'progress' },
];

export function parseRoute(hash) {
  const path = (hash || '').replace(/^#\/?/, '');
  let segments;
  try { segments = path.split('/').filter(Boolean).map(decodeURIComponent); } catch { return { name: 'notfound', params: {} }; }
  for (const route of ROUTES) {
    if (route.pattern.length !== segments.length) continue;
    const params = {};
    let ok = true;
    route.pattern.forEach((part, i) => {
      if (part.startsWith(':')) params[part.slice(1)] = segments[i];
      else if (part !== segments[i]) ok = false;
    });
    if (ok) return { name: route.name, params };
  }
  return { name: 'notfound', params: {} };
}

export function startRouter(onChange) {
  const fire = () => onChange(parseRoute(location.hash));
  window.addEventListener('hashchange', fire);
  fire();
  return () => window.removeEventListener('hashchange', fire);
}
