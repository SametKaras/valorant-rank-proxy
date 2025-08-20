// src/lib/cache.js
const store = new Map(); // key -> { data, until }

export function set(key, data, ttlMs = 45_000) {
  const until = Date.now() + ttlMs;
  store.set(key, { data, until });
}

export function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.until) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function del(key) {
  store.delete(key);
}

export function clear() {
  store.clear();
}
