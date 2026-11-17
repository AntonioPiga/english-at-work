// Versioned localStorage store with export/import. Survives missing or broken storage.

export const STORAGE_KEY = 'eaw:v1';

export const DEFAULT_STATE = Object.freeze({
  version: 1,
  placement: null,
  modules: {},
  srs: {},
  streak: { last: null, days: 0 },
  settings: { rate: 1, voice: null, mic: true },
});

const clone = (v) => JSON.parse(JSON.stringify(v));

function deepMerge(base, extra) {
  if (Array.isArray(base) || Array.isArray(extra)) return clone(extra ?? base);
  if (typeof base !== 'object' || base === null || typeof extra !== 'object' || extra === null) {
    return extra === undefined ? clone(base) : clone(extra);
  }
  const out = clone(base);
  for (const k of Object.keys(extra)) out[k] = k in base ? deepMerge(base[k], extra[k]) : clone(extra[k]);
  return out;
}

function safe(fn, fallback) {
  try { return fn(); } catch { return fallback; }
}

export function createStore(storage = globalThis.localStorage) {
  let state = load();

  function load() {
    const raw = safe(() => storage?.getItem(STORAGE_KEY), null);
    if (!raw) return clone(DEFAULT_STATE);
    const parsed = safe(() => JSON.parse(raw), null);
    if (!parsed || parsed.version !== 1) return clone(DEFAULT_STATE);
    return deepMerge(DEFAULT_STATE, parsed);
  }

  function persist() {
    safe(() => storage?.setItem(STORAGE_KEY, JSON.stringify(state)));
  }

  return {
    get: () => clone(state),
    update(fn) {
      const draft = clone(state);
      fn(draft);
      state = draft;
      persist();
    },
    exportJSON: () => JSON.stringify(state, null, 2),
    importJSON(text) {
      const parsed = safe(() => JSON.parse(text), null);
      if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) return false;
      state = deepMerge(DEFAULT_STATE, parsed);
      persist();
      return true;
    },
    reset() {
      state = clone(DEFAULT_STATE);
      safe(() => storage?.removeItem(STORAGE_KEY));
    },
  };
}
