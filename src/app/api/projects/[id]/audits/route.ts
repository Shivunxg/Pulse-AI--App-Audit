import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { runAudit } from '@/lib/audit-engine';
import { generateAiSummary } from '@/lib/ai-summary';

export const maxDuration = 60;

export async function POST(
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

    if (project.type !== 'website') {
      return NextResponse.json({ error: 'Use the APK upload endpoint for Android projects' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    // Deep audit requires Playwright which is not available on Vercel — always use simple
    const mode = 'simple';

    const audit = await db.audit.create({
      data: { projectId: id, status: 'running', mode },
    });

    // Run audit synchronously — Vercel kills background async work after response
    try {
      const result = await runAudit(project.url);

      let aiSummaryJson = '{}';
      try {
        const aiSummary = await generateAiSummary(result.findings, project.url);
        aiSummaryJson = JSON.stringify(aiSummary);
      } catch (aiErr) {
        console.error('AI summary error (non-fatal):', aiErr);
      }

      const completed = await db.audit.update({
        where: { id: audit.id },
        data: {
          status: 'completed',
          healthScore: result.healthScore,
          performanceScore: result.performanceScore,
          seoScore: result.seoScore,
          accessibilityScore: result.accessibilityScore,
          securityScore: result.securityScore,
          uxScore: result.uxScore,
          findings: JSON.stringify(result.findings),
          aiSummary: aiSummaryJson,
          responseTime: result.responseTime,
          pageSize: result.pageSize,
        },
      });

      return NextResponse.json({
        audit: {
          id: completed.id,
          status: completed.status,
          mode: completed.mode,
          healthScore: completed.healthScore,
          createdAt: completed.createdAt,
        },
      }, { status: 200 });

    } catch (err) {
      console.error('Audit execution error:', err);
      await db.audit.update({ where: { id: audit.id }, data: { status: 'failed' } });
      return NextResponse.json({ error: 'Audit failed', detail: String(err) }, { status: 500 });
    }

  } catch (err) {
    console.error('Audit trigger error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}