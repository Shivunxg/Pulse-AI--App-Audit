import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const audit = await db.audit.findFirst({
      where: { publicSlug: slug, isPublic: true } as any,
      include: { project: { select: { name: true, url: true, type: true } } },
    });

    if (!audit) {
      return NextResponse.json({ error: 'Report not found or no longer public' }, { status: 404 });
    }

    db.audit.update({
      where: { id: audit.id },
      data: { publicViews: { increment: 1 } } as any,
    }).catch(() => {});

    return NextResponse.json({
      audit: {
        id: audit.id,
        mode: audit.mode,
        healthScore: audit.healthScore,
        performanceScore: audit.performanceScore,
        seoScore: audit.seoScore,
        accessibilityScore: audit.accessibilityScore,
        securityScore: audit.securityScore,
        uxScore: audit.uxScore,
        technologyScore: (audit as any).technologyScore,
        contentScore: (audit as any).contentScore,
        findings: JSON.parse(audit.findings || '{}'),
        aiSummary: JSON.parse(audit.aiSummary || '{}'),
        responseTime: audit.responseTime,
        pageSize: audit.pageSize,
        createdAt: audit.createdAt,
        project: audit.project,
      },
    }, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
    });
  } catch (err) {
    console.error('[public-report] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
