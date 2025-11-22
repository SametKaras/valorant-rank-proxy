# Valorant Rank Proxy

A tiny HTTP service that returns a VALORANT player’s **Rank / RR / Elo** as a single line of text.  
Perfect for chat bots (e.g. StreamElements on Kick) and easy hosting on **Deno Deploy** (free).  
**Primary data source:** HenrikDev (API key via their Discord).  
**Fallback:** KyrosKoh public API (used automatically if Henrik is unavailable).

---

## Live Usage (hosted)

If you’re using this deployed instance, call:

```
GET https://vave-valorant.deno.dev/rank?player=<Name%23TAG>&region=<eu|na|ap|kr|latam|br>
```


Examples:

- Healthcheck: `https://vave-valorant.deno.dev/` → `OK`
- Rank: `https://vave-valorant.deno.dev/rank?player=russz%231982&region=eu`

> Note: `#` **must** be URL-encoded as `%23` (e.g., `russz%231982`).

---

## StreamElements (Kick) – Bot Command

Create a **Custom Command** called `!rank`.

### Fixed player (e.g. the streamer’s own account)
Replace `Name#TAG` with the account you want to track:

```
$(urlfetch https://vave-valorant.deno.dev/rank?player=$(urlencode Name#TAG)&region=eu)
```

### Flexible (viewer supplies the player and region)

```
$(urlfetch https://vave-valorant.deno.dev/rank?player=$(urlencode $(1))&region=$(2))
```

Usage: `!rank Name#TAG eu`

Set a cooldown (5–10s) to avoid spam. 👌

---

## API

### `GET /rank`
**Query params**
- `player` (required) — format: `Name#TAG` (remember to URL-encode `#` as `%23`)
- `region` (optional) — one of `eu`, `na`, `ap`, `kr`, `latam`, `br` (default `eu`)

**Response**
- Plain text line: `Rank: <Tier> | RR: <points> | Elo: <elo>`
- If both sources fail or return empty values: `Rank is temporarily unavailable.`

**Debug**
- `GET /__debug` → `{"hasKey":true,"ttl":"60000"}` (does not leak the actual key)

---

## How It Works

1. **HenrikDev (primary)** — we call `Authorization: <HENRIK_API_KEY>` (⚠️ **no `Bearer` prefix**).  
2. **KyrosKoh (fallback)** — if Henrik fails or returns incomplete data, we call  
   `https://api.kyroskoh.xyz/valorant/v1/mmr/<region>/<name>/<tag>?show=all&display=0`  
   and parse the returned text to extract Rank / RR / Elo.  
   If parsing fails, the raw line from Kyros is returned as-is.

Caching is in-memory (per instance) and controlled by `CACHE_TTL_MS` (default 60s).

---

## Self-Hosting

### Option A — Deno Deploy (recommended, free)

1) Connect GitHub on [Deno Deploy](https://dash.deno.com) → **New Project**  
2) **Root directory:** `deno`  
   **Entrypoint:** `deno/main.ts`  
3) **Environment Variables:**  
   - `HENRIK_API_KEY` — your HenrikDev API key (**no `Bearer`**, just the raw key) — optional if you rely only on the Kyros fallback  
   - `CACHE_TTL_MS` — optional, default `60000` (60s)
4) Deploy, then test:
   - `/` → `OK`  
   - `/__debug` → `{"hasKey":true,...}`  
   - `/rank?player=russz%231982&region=na`

> Uses an in-memory cache per instance. Ideal for chat usage and keeps upstream calls low.

### Option B — Node/Express (local or any VPS)

1) Install & run:
   ```bash
   npm i
   npm start
   ```
2) Environment (`.env`):
   
   ```env
   PORT=3000
   DEFAULT_REGION=eu
   CACHE_TTL_MS=60000
   HENRIK_API_KEY=YOUR_HENRIK_KEY
   ```
3) Endpoints:  
   - `http://localhost:3000/` → `OK`  
   - `http://localhost:3000/rank?player=russz%231982&region=eu`

---

## Configuration

- **HENRIK_API_KEY** (required): set via Deno Deploy env or `.env` locally.  
  Sent as `Authorization: <KEY>` (⚠️ no `Bearer` prefix).
- **CACHE_TTL_MS** (optional): cache duration in ms (default 60000).  
  Increase to 120000+ if you hit rate limits.
- **DEFAULT_REGION** (optional, Node only): default `eu`.  
- **PORT** (Node only): defaults to `3000`.

---

## Troubleshooting

- `Rank is temporarily unavailable.`  
  Check Deno Deploy **Logs** and `/__debug`.
  
  - **401 Unauthorized**: invalid/missing Henrik key. Ensure `Authorization` header is the **raw key**.
  - **404**: player or region incorrect.
  - **429**: rate limited → raise `CACHE_TTL_MS` (60–120s).
  - **5xx**: upstream outage; the service returns cached value if available.

- **“Name#TAG” not working in browser**: `#` must be `%23` in URLs.

---

## Notes & Fair Use

- This project relies on a **community API** (HenrikDev). Respect their rate limits and terms.
- Intended for **read-only** use (no game modifications).  
- If you publish your own instance, please keep caching enabled and add a cooldown on chat commands.

---

## License

MIT — do whatever you want, but please keep the attribution.
