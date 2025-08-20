// src/lib/format.js
export function formatLine({ rank, rr, elo, source }, { cached = false } = {}) {
  const parts = [];
  if (rank) parts.push(`Rank: ${rank}`);
  if (rr !== undefined && rr !== null) parts.push(`RR: ${rr}`);
  if (elo !== undefined && elo !== null) parts.push(`Elo: ${elo}`);
  parts.push(`src:${source || 'n/a'}${cached ? ',cached' : ''}`);
  return parts.join(' | ');
}
