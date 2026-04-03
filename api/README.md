# Dalali API (Render)

Express service: IBKR Flex → Redis cache, `GET/POST /api/portfolio`, Postgres budget sync `PUT/GET /api/budget/:userId`, `GET /health`.

## Local

```bash
cd api
npm install
npm run dev            # default http://127.0.0.1:8787
```

Env vars: the server loads **repo root `.env` first**, then **`api/.env`** (overrides). You can keep a single root `.env` like before, or use `api/.env` only.

From the repo root, `npm run server:dev` runs the same dev server.

## Deploy on Render

**Option A — Native Node (recommended)**  
1. New **Web Service** → this repo, **Root Directory** = `api`.  
2. **Environment** = **Node**.  
3. **Build command**: `npm install && npm run build`  
4. **Start command**: `npm start`  
5. Add env: `IBKR_FLEX_TOKEN`, `IBKR_FLEX_QUERY_ID`, `REDIS_URL` (Render sets `PORT`).

**Option B — Docker**  
If the service is set to **Docker**, this folder now includes a `Dockerfile`. Keep **Root Directory** = `api` so Render finds `api/Dockerfile`. Do not use Docker at the repo root unless you add a root Dockerfile.

Optional: `DATABASE_URL`, `PORTFOLIO_POLL_MS` (≥10000), `PORTFOLIO_REDIS_KEY`.

## Vercel (frontend)

In the Vite app project, set:

- `VITE_USE_PORTFOLIO_API=1`
- `VITE_PORTFOLIO_API_BASE=https://<your-service>.onrender.com` (no trailing slash)

This base is used for both portfolio and budget API calls (`/api/portfolio`, `/api/budget/...`). CORS is open (`origin: true`).

## IBKR Flex client copy

`src/lib/ibkrFlexTypes.ts` and `ibkrFlexService.ts` are duplicated from the main app’s `src/services/finance/`. If you change Flex parsing in the app, copy the files here again (or extract a shared package later).
