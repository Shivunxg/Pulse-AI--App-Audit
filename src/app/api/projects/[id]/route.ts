import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const project = await db.project.findFirst({
      where: { id, userId: user.id },
      include: {
        audits: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        url: project.url,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        audits: project.audits.map(a => ({
          id: a.id,
          status: a.status,
          healthScore: a.healthScore,
          performanceScore: a.performanceScore,
          seoScore: a.seoScore,
          accessibilityScore: a.accessibilityScore,
          securityScore: a.securityScore,
          uxScore: a.uxScore,
          responseTime: a.responseTime,
          pageSize: a.pageSize,
          findings: a.findings,
          aiSummary: a.aiSummary,
          createdAt: a.createdAt,
        })),
      },
    });
  } catch (err) {
    console.error('Project detail error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const project = await db.project.findFirst({ where: { id, userId: user.id } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    await db.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Project delete error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}