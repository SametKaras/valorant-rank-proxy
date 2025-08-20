// src/aggregate.js
import { fetchFromHenrik } from './sources/henrik.js';

export async function aggregate({ region, name, tag }) {
  // 1) Henrik (primary)
  const a = await fetchFromHenrik({ region, name, tag });
  if (a.rank != null || a.rr != null || a.elo != null) return a;

  // (İstersen burada ileride başka fallback kaynaklar ekleriz)
  throw new Error('all-sources-failed');
}
