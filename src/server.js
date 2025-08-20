// src/server.js
import 'dotenv/config';
import express from 'express';
import { aggregate } from './aggregate.js';
import { formatLine } from './lib/format.js';
import { parsePlayer, normalizeRegion } from './lib/utils.js';
import * as cache from './lib/cache.js';

// src/server.js (dosyanın en üstü civarı, importlardan sonra)
const key = process.env.TRN_API_KEY || '';
console.log('TRN key present:', key ? `yes (len=${key.length})` : 'no');


const app = express();
const PORT = process.env.PORT || 3000;
const DEFAULT_REGION = process.env.DEFAULT_REGION || 'eu';
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 45_000);

// Healthcheck
app.get('/', (_req, res) => res.send('OK'));

// Real /rank
app.get('/rank', async (req, res) => {
  try {
    const playerRaw = (req.query.player || '').trim();
    const regionRaw = (req.query.region || DEFAULT_REGION).toLowerCase();

    // Parse & normalize
    const { name, tag } = parsePlayer(playerRaw);
    const region = normalizeRegion(regionRaw);

    const key = `${region}:${name}#${tag}`;

    // Cache hit
    const hit = cache.get(key);
    if (hit) {
      return res.send(formatLine(hit, { cached: true }));
    }

    // Query sources
    const data = await aggregate({ region, name, tag });

    // Cache store
    cache.set(key, data, CACHE_TTL_MS);

    // Respond
    return res.send(formatLine(data));
  } catch (err) {
    // Fallback to last good value if present
    const playerRaw = (req.query.player || '').trim();
    const regionRaw = (req.query.region || DEFAULT_REGION).toLowerCase();
    let fallback = null;
    try {
      const { name, tag } = parsePlayer(playerRaw);
      const region = normalizeRegion(regionRaw);
      const key = `${region}:${name}#${tag}`;
      fallback = cache.get(key);
    } catch (_) {}

    if (fallback) {
      return res.send(formatLine(fallback, { cached: true }));
    }
    return res.status(503).send('Rank is temporarily unavailable.');
  }
});

app.listen(PORT, () => {
  console.log(`valorant-rank-proxy listening on :${PORT}`);
});
