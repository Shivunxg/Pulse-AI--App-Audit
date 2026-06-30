import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId'); // optional filter

    const projects = await db.project.findMany({
      where: { userId: user.id, ...(projectId ? { id: projectId } : {}) },
      select: {
        id: true,
        name: true,
        url: true,
        type: true,
        audits: {
          where: { status: 'completed' },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            mode: true,
            healthScore: true,
            performanceScore: true,
            seoScore: true,
            accessibilityScore: true,
            securityScore: true,
            uxScore: true,
            technologyScore: true,
            contentScore: true,
            createdAt: true,
          },
        },
      },
    });

    // Per-project trend series
    const projectTrends = projects.map(p => ({
      projectId: p.id,
      projectName: p.name,
      projectUrl: p.url,
      type: p.type,
      auditCount: p.audits.length,
      series: p.audits.map(a => ({
        date: a.createdAt,
        mode: a.mode,
        health: a.healthScore,
        performance: a.performanceScore,
        seo: a.seoScore,
        accessibility: a.accessibilityScore,
        security: a.securityScore,
        ux: a.uxScore,
        technology: a.technologyScore,
        content: a.contentScore,
      })),
      // Delta between first and most recent audit
      delta: p.audits.length >= 2
        ? Math.round((p.audits[p.audits.length - 1].healthScore || 0) - (p.audits[0].healthScore || 0))
        : null,
      latest: p.audits.length > 0 ? p.audits[p.audits.length - 1].healthScore : null,
    }));

    // Cross-project aggregate: average health score per calendar day, across all projects
    const allAudits = projects.flatMap(p =>
      p.audits.map(a => ({ ...a, projectName: p.name }))
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const dailyAggMap = new Map<string, { sum: number; count: number }>();
    for (const a of allAudits) {
      if (a.healthScore == null) continue;
      const day = new Date(a.createdAt).toISOString().slice(0, 10);
      const existing = dailyAggMap.get(day) || { sum: 0, count: 0 };
      existing.sum += a.healthScore;
      existing.count += 1;
      dailyAggMap.set(day, existing);
    }
    const aggregateSeries = Array.from(dailyAggMap.entries())
      .map(([date, { sum, count }]) => ({ date, avgHealth: Math.round(sum / count) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Risk summary: projects with declining health score (negative delta)
    const decliningProjects = projectTrends.filter(p => p.delta != null && p.delta < 0);
    const improvingProjects = projectTrends.filter(p => p.delta != null && p.delta > 0);

    return NextResponse.json({
      projectTrends,
      aggregateSeries,
      summary: {
        totalProjects: projects.length,
        totalAudits: allAudits.length,
        decliningCount: decliningProjects.length,
        improvingCount: improvingProjects.length,
        decliningProjects: decliningProjects.map(p => ({ name: p.projectName, delta: p.delta, latest: p.latest })),
      },
    }, {
      headers: { 'Cache-Control': 'private, max-age=15, stale-while-revalidate=60' },
    });

  } catch (err) {
    console.error('[trends] Route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
