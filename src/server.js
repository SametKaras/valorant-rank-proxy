// src/server.js
import 'dotenv/config';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Basit healthcheck
app.get('/', (_req, res) => {
  res.send('OK');
});

// Şimdilik iskelet: /rank daha sonra gerçek veriyi döndürecek
app.get('/rank', (req, res) => {
  const player = (req.query.player || '').trim();
  const region = (req.query.region || process.env.DEFAULT_REGION || 'eu').toLowerCase();
  if (!player.includes('#')) {
    return res
      .status(400)
      .send('Kullanım: /rank?player=Name#TAG&region=eu');
  }
  res.send(`(iskelet) ${player} @ ${region} — birazdan gerçek veriyi ekleyeceğiz`);
});

app.listen(PORT, () => {
  console.log(`valorant-rank-proxy listening on :${PORT}`);
});
