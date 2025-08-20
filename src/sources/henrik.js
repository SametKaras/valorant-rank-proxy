// src/sources/henrik.js
import axios from 'axios';

export async function fetchFromHenrik({ region, name, tag }) {
  const url =
    `https://api.henrikdev.xyz/valorant/v2/mmr/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;

  const key = process.env.HENRIK_API_KEY;
  if (!key) throw new Error('henrik: missing API key');

  // DİKKAT: Bearer YOK — doğrudan anahtar
  const headers = {
    Authorization: key,
    Accept: 'application/json',
    'User-Agent': 'valorant-rank-proxy/1.0'
  };

  try {
    const { data } = await axios.get(url, { timeout: 8000, headers });
    const d = data?.data;
    if (!d) throw new Error('henrik: no data');

    const rank = d.currenttierpatched ?? null;
    const rr   = d.ranking_in_tier ?? null;
    const elo  = d.elo ?? null;

    if (rank === null && rr === null && elo === null) {
      throw new Error('henrik: incomplete data');
    }
    return { source: 'henrik', rank, rr, elo };
  } catch (err) {
    const status = err.response?.status;
    const body   = err.response?.data;
    console.error('Henrik API error:', status, body || err.message);
    throw err;
  }
}
