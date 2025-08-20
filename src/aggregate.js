// src/aggregate.js
import { fetchFromHenrik } from './sources/henrik.js';

export async function aggregate({ region, name, tag }) {
  // 1) Henrik
  try {
    const a = await fetchFromHenrik({ region, name, tag });
    if (a.rank || a.rr !== null) return a;
  } catch (e) {
    // proceed to next source in the future
  }

  throw new Error('all-sources-failed');
}
