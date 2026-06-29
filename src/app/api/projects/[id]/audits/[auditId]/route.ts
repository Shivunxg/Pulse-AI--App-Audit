import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; auditId: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id, auditId } = await params;
    const project = await db.project.findFirst({
      where: { id, userId: user.id },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const audit = await db.audit.findFirst({
      where: { id: auditId, projectId: id },
    });
    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    return NextResponse.json({
      audit: {
        id: audit.id,
        status: audit.status,
        mode: audit.mode,
        healthScore: audit.healthScore,
        performanceScore: audit.performanceScore,
        seoScore: audit.seoScore,
        accessibilityScore: audit.accessibilityScore,
        securityScore: audit.securityScore,
        uxScore: audit.uxScore,
        responseTime: audit.responseTime,
        pageSize: audit.pageSize,
        findings: JSON.parse(audit.findings || '{}'),
        aiSummary: JSON.parse(audit.aiSummary || '{}'),
        createdAt: audit.createdAt,
        updatedAt: audit.updatedAt,
      },
    });
  } catch (err) {
    console.error('Audit detail error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}