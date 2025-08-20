/// <reference lib="deno.ns" />
// deno/main.ts

function normalizeRegion(r: string) {
  const x = (r || "").toLowerCase();
  return ["eu", "na", "ap", "kr", "latam", "br"].includes(x) ? x : "eu";
}

function formatLine(d: { rank?: string | null; rr?: number | null; elo?: number | null }) {
  const parts: string[] = [];
  if (d.rank) parts.push(`Rank: ${d.rank}`);
  if (d.rr !== undefined && d.rr !== null) parts.push(`RR: ${d.rr}`);
  if (d.elo !== undefined && d.elo !== null) parts.push(`Elo: ${d.elo}`);
  return parts.join(" | ");
}

// basit RAM cache (Deno Deploy instance resetlerinde sıfırlanır; bizim kullanım için yeterli)
const CACHE = new Map<string, { data: { rank?: string|null; rr?: number|null; elo?: number|null }; until: number }>();

function parseHenrik(json: any) {
  const d = json?.data;
  if (!d) return null;

  const cd = d.current_data ?? d;

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

  // eski/alternatif şema: by_season
  if (rank == null && rr == null && elo == null && d.by_season && typeof d.by_season === "object") {
    for (const s of Object.values(d.by_season)) {
      if (!s) continue;
      const candRank = (s as any).patched_tier ?? (s as any).currenttierpatched ?? null;
      const candRr   = (s as any).ranking_in_tier ?? (s as any).ranked_rating ?? null;
      const candElo  = (s as any).elo ?? null;
      if (candRank != null || candRr != null || candElo != null) {
        rank = candRank; rr = candRr; elo = candElo;
        break;
      }
    }
  }

  if (rank == null && rr == null && elo == null) return null;
  return { rank, rr, elo };
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // healthcheck
  if (url.pathname === "/") return new Response("OK");

  // basit debug: env var var mı vs.
  if (url.pathname === "/__debug") {
    const hasKey = !!Deno.env.get("HENRIK_API_KEY");
    const ttl = Deno.env.get("CACHE_TTL_MS") ?? "60000";
    return new Response(JSON.stringify({ hasKey, ttl }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }

  if (url.pathname === "/rank") {
    const player = (url.searchParams.get("player") ?? "").trim();
    const region = normalizeRegion(url.searchParams.get("region") ?? "eu");
    const ttl = Number(Deno.env.get("CACHE_TTL_MS") ?? "60000");

    if (!player.includes("#")) {
      return new Response("Kullanım: /rank?player=Name#TAG&region=eu", { status: 400 });
    }

    const [name, tag] = player.split("#");
    const key = `${region}:${name}#${tag}`;

    // cache hit
    const hit = CACHE.get(key);
    if (hit && Date.now() < hit.until) {
      return new Response(formatLine(hit.data), { status: 200 });
    }

    // upstream (HenrikDev)
    const apiKey = Deno.env.get("HENRIK_API_KEY");
    if (!apiKey) {
      return new Response("Server misconfigured (missing HENRIK_API_KEY).", { status: 500 });
    }

    const api = `https://api.henrikdev.xyz/valorant/v2/mmr/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
    let res: Response;
    try {
      res = await fetch(api, {
        headers: {
          // DİKKAT: Bearer kullanma — anahtar direkt Authorization değeridir
          "Authorization": apiKey,
          "Accept": "application/json",
          "User-Agent": "valorant-rank-proxy/deno"
        }
      });
    } catch {
      // network hatası: varsa son iyi değeri döndür
      if (hit) return new Response(formatLine(hit.data), { status: 200 });
      return new Response("Rank is temporarily unavailable.", { status: 503 });
    }

    const raw = await res.text();
    // logları Deno Deploy → Logs'ta görürsün (teşhis için faydalı)
    console.log("Henrik status:", res.status);
    console.log("Henrik body:", raw.slice(0, 200));

    if (!res.ok) {
      if (hit) return new Response(formatLine(hit.data), { status: 200 });
      return new Response("Rank is temporarily unavailable.", { status: 503 });
    }

    let json: any = null;
    try { json = JSON.parse(raw); } catch { json = null; }
    const data = json ? parseHenrik(json) : null;

    if (!data) {
      if (hit) return new Response(formatLine(hit.data), { status: 200 });
      return new Response("Rank is temporarily unavailable.", { status: 503 });
    }

    CACHE.set(key, { data, until: Date.now() + ttl });
    return new Response(formatLine(data), { status: 200 });
  }

  return new Response("Not found", { status: 404 });
});
