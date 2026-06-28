import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const totalProjects = await db.project.count({ where: { userId: user.id } });
    const allAudits = await db.audit.findMany({
      where: { project: { userId: user.id } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { project: { select: { id: true, name: true, url: true } } },
    });

    const completedAudits = allAudits.filter(a => a.status === 'completed' && a.healthScore !== null);
    const avgHealthScore = completedAudits.length > 0
      ? Math.round(completedAudits.reduce((sum, a) => sum + (a.healthScore || 0), 0) / completedAudits.length)
      : 0;

    return NextResponse.json({
      totalProjects,
      totalAudits: await db.audit.count({ where: { project: { userId: user.id } } }),
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
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}