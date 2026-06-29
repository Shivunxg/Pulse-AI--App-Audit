# Pulse AI — Playwright Worker

Deep audit microservice for Pulse AI. Runs Playwright + Chromium on Railway.

## What it does

Accepts `POST /audit { url }` and returns a full deep audit result including:
- Core Web Vitals (FCP, LCP, CLS, TTI)
- Console JS errors
- Rendered DOM analysis (post-JS execution)
- Broken internal links (up to 20 sampled)
- Mobile viewport rendering check (375px)
- Security headers
- Full SEO analysis (title, meta, OG, structured data, sitemap, robots.txt)
- Accessibility (alt text, labels, landmarks, skip links)
- UX (viewport, favicon, PWA manifest, external link security)
- Page screenshot (base64 JPEG)

## Deploy to Railway (3 steps)

### 1. Create Railway project

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Select `Shivunxg/Pulse-AI--App-Audit`
3. Railway auto-detects `railway.toml` — it will build using the Dockerfile at `mini-services/playwright-worker/Dockerfile`

### 2. Set environment variables in Railway

| Variable | Value |
|---|---|
| `PORT` | `3001` |
| `WORKER_SECRET` | Any random 32-char string (e.g. `openssl rand -hex 16`) |

### 3. Add variables to Vercel

After Railway deploys, copy the generated URL (e.g. `https://pulse-playwright-worker.railway.app`)
and add to Vercel:

| Variable | Value |
|---|---|
| `PLAYWRIGHT_WORKER_URL` | `https://pulse-playwright-worker.railway.app` |
| `WORKER_SECRET` | Same secret as Railway |

That's it. Deep Audit will now use the Railway worker automatically.
If the worker is down, it gracefully falls back to Enhanced HTTP audit.

## Local development

```bash
cd mini-services/playwright-worker
npm install
npx playwright install chromium
npm run dev
```

Test:
```bash
curl -X POST http://localhost:3001/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://sendit.co.in"}'
```

## Endpoints

- `GET /health` — health check
- `POST /audit` — run deep audit (requires `x-worker-secret` header if `WORKER_SECRET` is set)
