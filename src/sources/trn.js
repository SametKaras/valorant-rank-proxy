// src/sources/trn.js
import axios from 'axios';

/**
 * Tracker Network (TRN) VALORANT profile API
 * Docs: https://tracker.gg/developers  (after login)
 *
 * Endpoint (example):
 *   GET https://public-api.tracker.gg/v2/valorant/standard/profile/{region}/{name}%23{tag}
 *
 * Returns (normalized):
 *   { source: 'trn', rank, rr, elo }
 */
export async function fetchFromTRN({ region, name, tag }) {
  const apiKey = process.env.TRN_API_KEY;
  if (!apiKey) {
    throw new Error('trn: missing API key');
  }

  // %23 for '#'
  const profile = `${encodeURIComponent(name)}%23${encodeURIComponent(tag)}`;
  // TRN region typically: eu | na | ap | kr | latam | br (we pass what we have)
  const url = `https://public-api.tracker.gg/v2/valorant/standard/profile/${region}/${profile}`;

  try {
    const { data } = await axios.get(url, {
      timeout: 8000,
      headers: { 'TRN-Api-Key': apiKey }
    });

    // Find a segment with overall rank/rr info
    const segments = data?.data?.segments || [];
    const overview =
      segments.find(s => s.type === 'overview') ||
      segments.find(s => s.type === 'profile') ||
      segments[0];

    const stats = overview?.stats || {};

    // try several possible fields (TRN sometimes varies)
    const rank =
      stats.rankName?.value ??
      stats.competitiveRank?.metadata?.tierName ??
      stats.tier?.metadata?.name ??
      stats.tierName?.value ??
      null;

    const rr =
      stats.rankRating?.value ??
      stats.rankedRating?.value ??
      stats.rr?.value ??
      null;

    const elo =
      stats.elo?.value ??
      stats.competitiveTier?.value ??
      null;

    if (rank === null && rr === null && elo === null) {
      throw new Error('trn: incomplete data');
    }

    return { source: 'trn', rank, rr, elo };
  } catch (err) {
    const status = err.response?.status;
    const body = err.response?.data;
    console.error('TRN API error:', status, body || err.message);
    throw err;
  }
}
