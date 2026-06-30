import { NextRequest, NextResponse } from 'next/server';
import { runAudit } from '@/lib/audit-engine';

export const maxDuration = 30;

const requestLog = new Map<string, number[]>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT) return true;
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return false;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429, headers: CORS_HEADERS }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400, headers: CORS_HEADERS });
    }

    let normalizedUrl: string;
    try {
      normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ error: 'Please enter a valid URL' }, { status: 400, headers: CORS_HEADERS });
    }

    const hostname = new URL(normalizedUrl).hostname;
    if (/^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|169\.254\.)/.test(hostname)) {
      return NextResponse.json({ error: 'This URL cannot be audited' }, { status: 400, headers: CORS_HEADERS });
    }

    const result = await runAudit(normalizedUrl);

    return NextResponse.json({
      url: normalizedUrl,
      healthScore: result.healthScore,
      performanceScore: result.performanceScore,
      seoScore: result.seoScore,
      accessibilityScore: result.accessibilityScore,
      securityScore: result.securityScore,
      uxScore: result.uxScore,
      criticalCount: Object.values(result.findings).flatMap((c: any) => c?.issues || []).filter((i: any) => i.severity === 'critical').length,
      warningCount: Object.values(result.findings).flatMap((c: any) => c?.issues || []).filter((i: any) => i.severity === 'warning').length,
      topIssue: Object.values(result.findings).flatMap((c: any) => c?.issues || []).find((i: any) => i.severity === 'critical')?.title || null,
    }, { headers: CORS_HEADERS });

  } catch (err) {
    console.error('[widget-audit] Error:', err);
    const msg = err instanceof Error ? err.message : 'Audit failed';
    return NextResponse.json({ error: `Could not audit this URL: ${msg}` }, { status: 500, headers: CORS_HEADERS });
  }
}
