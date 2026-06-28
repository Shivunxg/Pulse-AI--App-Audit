import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const projects = await db.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { audits: true } },
        audits: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return NextResponse.json({
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        url: p.url,
        auditCount: p._count.audits,
        latestAudit: p.audits[0] ? {
          id: p.audits[0].id,
          status: p.audits[0].status,
          healthScore: p.audits[0].healthScore,
          createdAt: p.audits[0].createdAt,
        } : null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (err) {
    console.error('Projects list error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { name, url } = await request.json();
    if (!name || !url) {
      return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 });
    }

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    const project = await db.project.create({
      data: { name, url: normalizedUrl, userId: user.id },
    });

    return NextResponse.json({
      project: { id: project.id, name: project.name, url: project.url, createdAt: project.createdAt },
    }, { status: 201 });
  } catch (err) {
    console.error('Project create error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}