// Loads course content (JSON) relative to the page. Caches in memory.

const cache = new Map();

async function fetchJSON(path) {
  if (cache.has(path)) return cache.get(path);
  const p = (async () => {
    const res = await fetch(new URL(`content/${path}`, document.baseURI));
    if (!res.ok) throw new Error('content-load-failed');
    return res.json();
  })();
  cache.set(path, p);
  p.catch(() => cache.delete(path));
  return p;
}

export const loadIndex = () => fetchJSON('index.json');

export async function loadModule(id) {
  const idx = await loadIndex();
  for (const t of idx.tracks) {
    const entry = t.modules.find((m) => m.id === id);
    if (entry) return fetchJSON(entry.file);
  }
  throw new Error('content-not-found');
}

export async function loadDeck(id) {
  const idx = await loadIndex();
  const entry = (idx.decks ?? []).find((d) => d.id === id);
  if (!entry) throw new Error('content-not-found');
  return fetchJSON(entry.file);
}

export async function loadPlacement() {
  const idx = await loadIndex();
  return fetchJSON(idx.placement);
}

export async function loadAllModules() {
  const idx = await loadIndex();
  const entries = idx.tracks.flatMap((t) => t.modules);
  return Promise.all(entries.map((e) => fetchJSON(e.file)));
}
