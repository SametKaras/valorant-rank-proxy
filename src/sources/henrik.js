// src/sources/henrik.js
import axios from 'axios';

export async function fetchFromHenrik({ region, name, tag }) {
  const url = `https://api.henrikdev.xyz/valorant/v2/mmr/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
  const { data } = await axios.get(url, { timeout: 6000 });
  const d = data?.data;
  if (!d) throw new Error('henrik: no data');

  const rank = d.currenttierpatched ?? null;
  const rr = d.ranking_in_tier ?? null;
  const elo = d.elo ?? null;

  if (rank === null && rr === null && elo === null) {
    throw new Error('henrik: incomplete data');
  }
  return { source: 'henrik', rank, rr, elo };
}
