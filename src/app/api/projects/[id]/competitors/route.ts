import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { runAudit } from '@/lib/audit-engine';

function checkCompetitorAuditAllowed(tier: string): { allowed: boolean; reason?: string } {
  if (tier !== 'enterprise') {
    return {
      allowed: false,
      reason: 'Competitor benchmarking is an Enterprise feature. Compare your site against competitors on performance, SEO, security, and UX.',
    };
  }
  return { allowed: true };
}

function summarizeFindings(findings: any) {
  if (!findings || typeof findings !== 'object') return { critical: 0, warning: 0, passed: 0 };
  let critical = 0, warning = 0, passed = 0;
  for (const category of Object.values(findings) as any[]) {
    if (!category || typeof category !== 'object') continue;
    if (Array.isArray(category.issues)) {
      critical += category.issues.filter((i: any) => i.severity === 'critical').length;
      warning += category.issues.filter((i: any) => i.severity === 'warning').length;
    }
    if (Array.isArray(category.passed)) passed += category.passed.length;
  }
  return { critical, warning, passed };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { id } = await params;
    const project = await db.project.findFirst({ where: { id, userId: user.id } });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const competitors = await db.competitor.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      competitors: competitors.map(c => ({
        id: c.id,
        name: c.name,
        url: c.url,
        comparison: JSON.parse(c.comparison || '{}'),
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (err) {
    console.error('[competitors] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const tier = user.tier || 'free';
    const gateCheck = checkCompetitorAuditAllowed(tier);
    if (!gateCheck.allowed) {
      return NextResponse.json(
        { error: gateCheck.reason, upgradeRequired: 'enterprise', tierLimited: true },
        { status: 403 }
      );
    }

    const { id } = await params;
    const project = await db.project.findFirst({ where: { id, userId: user.id } });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    if (project.type !== 'website') {
      return NextResponse.json({ error: 'Competitor audits are only available for website projects' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { name, url } = body;
    if (!name || !url) {
      return NextResponse.json({ error: 'name and url are required' }, { status: 400 });
    }

    const ownLatestAudit = await db.audit.findFirst({
      where: { projectId: id, status: 'completed' },
      orderBy: { createdAt: 'desc' },
    });

    if (!ownLatestAudit) {
      return NextResponse.json(
        { error: 'Run an audit on your own project first before comparing to competitors.' },
        { status: 400 }
      );
    }

    let competitorResult;
    try {
      competitorResult = await runAudit(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to audit competitor URL';
      return NextResponse.json({ error: `Could not audit ${url}: ${msg}` }, { status: 400 });
    }

    const comparison = {
      yours: {
        healthScore: ownLatestAudit.healthScore,
        performanceScore: ownLatestAudit.performanceScore,
        seoScore: ownLatestAudit.seoScore,
        accessibilityScore: ownLatestAudit.accessibilityScore,
        securityScore: ownLatestAudit.securityScore,
        uxScore: ownLatestAudit.uxScore,
        technologyScore: (ownLatestAudit as any).technologyScore ?? null,
        contentScore: (ownLatestAudit as any).contentScore ?? null,
        responseTime: ownLatestAudit.responseTime,
        pageSize: ownLatestAudit.pageSize,
        auditedAt: ownLatestAudit.createdAt,
      },
      competitor: {
        healthScore: competitorResult.healthScore,
        performanceScore: competitorResult.performanceScore,
        seoScore: competitorResult.seoScore,
        accessibilityScore: competitorResult.accessibilityScore,
        securityScore: competitorResult.securityScore,
        uxScore: competitorResult.uxScore,
        technologyScore: (competitorResult as any).technologyScore ?? null,
        contentScore: (competitorResult as any).contentScore ?? null,
        responseTime: competitorResult.responseTime,
        pageSize: competitorResult.pageSize,
        auditedAt: new Date(),
      },
      deltas: {
        health: (ownLatestAudit.healthScore || 0) - competitorResult.healthScore,
        performance: (ownLatestAudit.performanceScore || 0) - competitorResult.performanceScore,
        seo: (ownLatestAudit.seoScore || 0) - competitorResult.seoScore,
        accessibility: (ownLatestAudit.accessibilityScore || 0) - competitorResult.accessibilityScore,
        security: (ownLatestAudit.securityScore || 0) - competitorResult.securityScore,
        ux: (ownLatestAudit.uxScore || 0) - competitorResult.uxScore,
      },
      findingsSummary: {
        yours: summarizeFindings(JSON.parse(ownLatestAudit.findings || '{}')),
        competitor: summarizeFindings(competitorResult.findings),
      },
    };

    const competitor = await db.competitor.create({
      data: {
        projectId: id,
        name,
        url,
        comparison: JSON.stringify(comparison),
      },
    });

    return NextResponse.json({
      competitor: {
        id: competitor.id,
        name: competitor.name,
        url: competitor.url,
        comparison,
        createdAt: competitor.createdAt,
      },
    });

  } catch (err) {
    console.error('[competitors] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
