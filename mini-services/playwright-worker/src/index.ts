import express, { Request, Response, NextFunction } from 'express';
import { runDeepAudit } from './audit';

const app = express();
app.use(express.json({ limit: '1mb' }));

// ── Auth middleware ──────────────────────────────────────────────
const WORKER_SECRET = process.env.WORKER_SECRET;

function requireSecret(req: Request, res: Response, next: NextFunction) {
  if (!WORKER_SECRET) return next(); // dev mode — no secret set
  const auth = req.headers['x-worker-secret'];
  if (auth !== WORKER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ── Health check ─────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'pulse-playwright-worker', ts: new Date().toISOString() });
});

// ── Deep audit endpoint ───────────────────────────────────────────
app.post('/audit', requireSecret, async (req: Request, res: Response) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url is required' });
  }

  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

  console.log(`[audit] Starting deep audit: ${normalizedUrl}`);
  const startedAt = Date.now();

  try {
    const result = await runDeepAudit(normalizedUrl);
    const elapsed = Date.now() - startedAt;
    console.log(`[audit] Completed in ${elapsed}ms — health: ${result.healthScore}`);
    return res.json({ ok: true, result, elapsed });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[audit] Failed: ${msg}`);
    return res.status(500).json({ ok: false, error: msg });
  }
});

// ── Start ─────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3001', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[worker] Pulse Playwright Worker running on port ${PORT}`);
  console.log(`[worker] Auth: ${WORKER_SECRET ? 'enabled' : 'disabled (dev mode)'}`);
});
