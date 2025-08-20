// src/lib/format.js
export function formatLine({ rank, rr, elo, leaderboard }, { cached = false } = {}) {
  const parts = [];
  if (rank) parts.push(`Rank: ${rank}`);
  if (rr !== undefined && rr !== null) parts.push(`RR: ${rr}`);
  if (elo !== undefined && elo !== null) parts.push(`Elo: ${elo}`);
  if (leaderboard !== undefined && leaderboard !== null) parts.push(`Leaderboard: #${leaderboard}`);
  if (cached) parts.push('cached'); // istersen bunu da kaldırabiliriz
  return parts.join(' | ');
}
