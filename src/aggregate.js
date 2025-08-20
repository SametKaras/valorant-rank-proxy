// src/aggregate.js
import { fetchFromTRN } from './sources/trn.js';
import { fetchFromHenrik } from './sources/henrik.js'; // mevcutsa

export async function aggregate({ region, name, tag }) {
  // 1) TRN first
  try {
    const t = await fetchFromTRN({ region, name, tag });
    if (t.rank != null || t.rr != null || t.elo != null) return t;
  } catch (_) {}

  // 2) Henrik fallback (optional)
  try {
    const h = await fetchFromHenrik({ region, name, tag });
    if (h.rank != null || h.rr != null || h.elo != null) return h;
  } catch (_) {}

  throw new Error('all-sources-failed');
}
