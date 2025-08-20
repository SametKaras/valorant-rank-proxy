// src/lib/utils.js
export function parsePlayer(str) {
  const s = (str || '').trim();
  const hash = s.indexOf('#');
  if (hash === -1) {
    throw new Error('Player must be in the form Name#TAG');
  }
  const name = s.slice(0, hash);
  const tag = s.slice(hash + 1);
  if (!name || !tag) throw new Error('Invalid player format');
  return { name, tag };
}

// src/lib/utils.js
export function normalizeRegion(r) {
  const x = (r || '').toLowerCase();
  if (['eu','na','ap','kr','latam','br'].includes(x)) return x;
  return 'eu';
}
