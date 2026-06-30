import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Run all three queries in parallel instead of sequentially —
    // each round-trip to Supabase via PgBouncer adds latency, so this
    // cuts dashboard load time roughly to the slowest single query
    // instead of the sum of all three.
    const [totalProjects, totalAudits, allAudits] = await Promise.all([
      db.project.count({ where: { userId: user.id } }),
      db.audit.count({ where: { project: { userId: user.id } } }),
      db.audit.findMany({
        where: { project: { userId: user.id } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          status: true,
          healthScore: true,
          performanceScore: true,
          seoScore: true,
          accessibilityScore: true,
          securityScore: true,
          uxScore: true,
          createdAt: true,
          project: { select: { id: true, name: true, url: true } },
        },
      }),
    ]);

    const completedAudits = allAudits.filter(a => a.status === 'completed' && a.healthScore !== null);
    const avgHealthScore = completedAudits.length > 0
      ? Math.round(completedAudits.reduce((sum, a) => sum + (a.healthScore || 0), 0) / completedAudits.length)
      : 0;

    return NextResponse.json({
      totalProjects,
      totalAudits,
      avgHealthScore,
      recentAudits: allAudits.map(a => ({
        id: a.id,
        status: a.status,
        healthScore: a.healthScore,
        performanceScore: a.performanceScore,
        seoScore: a.seoScore,
        accessibilityScore: a.accessibilityScore,
        securityScore: a.securityScore,
        uxScore: a.uxScore,
        createdAt: a.createdAt,
        project: { id: a.project.id, name: a.project.name, url: a.project.url },
      })),
    }, {
      headers: {
        // Cache for 10s on the client, allow stale-while-revalidate for 30s —
        // avoids re-hitting the DB on rapid back/forward nav while still
        // staying fresh enough for a dashboard.
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}