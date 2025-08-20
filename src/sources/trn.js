// src/sources/trn.js
import axios from 'axios';

export async function fetchFromTRN({ region, name, tag }) {
  const apiKey = process.env.TRN_API_KEY;
  if (!apiKey) throw new Error('trn: missing API key');

  const profile = `${encodeURIComponent(name)}%23${encodeURIComponent(tag)}`;

  // Not: platform = riot; region query ile geçiyoruz (eu|na|ap|kr|latam|br)
  const url = `https://public-api.tracker.gg/v2/valorant/standard/profile/riot/${profile}?region=${encodeURIComponent(region)}`;

  try {
    const { data } = await axios.get(url, {
      timeout: 8000,
      headers: {
        'TRN-Api-Key': apiKey,
        'Accept': 'application/json',
        // Bazı ortamlarda UA gerekebiliyor:
        'User-Agent': 'valorant-rank-proxy/1.0'
      }
    });

    const segments = data?.data?.segments || [];
    const overview =
      segments.find(s => s.type === 'overview') ||
      segments.find(s => s.type === 'profile') ||
      segments[0];

    const stats = overview?.stats || {};

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
