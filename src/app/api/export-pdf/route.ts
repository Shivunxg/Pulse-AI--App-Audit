import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { checkPdfExportAllowed } from '@/lib/tiers';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const tier = user.tier || 'free';

    const gateCheck = checkPdfExportAllowed(tier);
    if (!gateCheck.allowed) {
      return NextResponse.json(
        { error: gateCheck.reason, upgradeRequired: gateCheck.upgradeRequired, tierLimited: true },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { html, filename } = body;

    if (!html || typeof html !== 'string') {
      return NextResponse.json({ error: 'html is required' }, { status: 400 });
    }

    const workerUrl = process.env.PLAYWRIGHT_WORKER_URL;
    if (!workerUrl) {
      return NextResponse.json(
        { error: 'PDF generation service not configured' },
        { status: 503 }
      );
    }

    const res = await fetch(`${workerUrl}/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.WORKER_SECRET ? { 'x-worker-secret': process.env.WORKER_SECRET } : {}),
      },
      body: JSON.stringify({ html, filename }),
      signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`[pdf] Worker returned ${res.status}: ${errText}`);
      return NextResponse.json(
        { error: 'PDF generation failed', detail: errText },
        { status: 502 }
      );
    }

    const pdfBuffer = await res.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename || 'pulse-ai-report.pdf'}"`,
      },
    });

  } catch (err) {
    console.error('[pdf] Route error:', err);
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
