// src/sources/henrik.js
import axios from 'axios';

export async function fetchFromHenrik({ region, name, tag }) {
  const url = `https://api.henrikdev.xyz/valorant/v2/mmr/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;

  const key = process.env.HENRIK_API_KEY;
  if (!key) throw new Error('henrik: missing API key');

  const headers = {
    Authorization: key,                 // NOT "Bearer"
    Accept: 'application/json',
    'User-Agent': 'valorant-rank-proxy/1.0'
  };

  try {
    const { data } = await axios.get(url, { timeout: 8000, headers });

    // d: ana veri düğümü
    const d = data?.data;
    if (!d) throw new Error('henrik: no data');

    // Bazı hesaplarda alanlar "current_data" altında, bazılarında üst düzeyde ya da by_season içinde
    const cd = d.current_data ?? d; // current_data varsa tercih et

    // 1) Birincil deneme – current_data / üst düzey alanlar
    let rank =
      cd.currenttierpatched ??
      d.currenttierpatched ??
      cd.patched_tier ??
      null;

    let rr =
      cd.ranking_in_tier ??
      cd.ranked_rating ??
      null;

    let elo =
      cd.elo ??
      d.elo ??
      null;

    // 2) Yedek – by_season içinden en dolu sezonu bul
    if ((rank == null && rr == null && elo == null) && d.by_season && typeof d.by_season === 'object') {
      const seasons = Object.values(d.by_season);
      // En çok bilgi içeren sezonu seç (ranking_in_tier / patched_tier / elo varlığına göre)
      let best = null;
      for (const s of seasons) {
        if (!s || typeof s !== 'object') continue;
        const candRank =
          s.patched_tier ??
          s.currenttierpatched ??
          null;
        const candRr =
          s.ranking_in_tier ??
          s.ranked_rating ??
          null;
        const candElo =
          s.elo ?? null;
        if (candRank != null || candRr != null || candElo != null) {
          best = { rank: candRank ?? null, rr: candRr ?? null, elo: candElo ?? null };
          // İlk dolu sezonu al, isterseniz burada sezona göre sıralama yapılabilir
          break;
        }
      }
      if (best) {
        rank = best.rank;
        rr = best.rr;
        elo = best.elo;
      }
    }

    // 3) Hâlâ boş ise, bu hesap Unrated olabilir veya API ilgili act için veri döndürmüyor
    if (rank == null && rr == null && elo == null) {
      // Geçici teşhis logu (isteğe bağlı, sorun bitince kaldır)
      console.warn('henrik: mmr fields empty; keys:', Object.keys(d || {}), 'current_data keys:', Object.keys(cd || {}));
      throw new Error('henrik: incomplete data');
    }

    return { source: 'henrik', rank, rr, elo };
  } catch (err) {
    const status = err.response?.status;
    const body = err.response?.data;
    console.error('Henrik API error:', status, body || err.message);
    throw err;
  }
}
