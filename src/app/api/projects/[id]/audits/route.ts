import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { runAudit } from '@/lib/audit-engine';
import { generateAiSummary } from '@/lib/ai-summary';

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

    const audit = await db.audit.create({
      data: {
        projectId: id,
        status: 'running',
      },
    });

    // Run audit asynchronously — update DB when done
    (async () => {
      try {
        const result = await runAudit(project.url);

        let aiSummaryJson = '{}';
        try {
          const aiSummary = await generateAiSummary(result.findings, project.url);
          aiSummaryJson = JSON.stringify(aiSummary);
        } catch (aiErr) {
          console.error('AI summary error:', aiErr);
        }

        await db.audit.update({
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
      } catch (err) {
        console.error('Audit execution error:', err);
        await db.audit.update({
          where: { id: audit.id },
          data: { status: 'failed' },
        });
      }
    })();

    return NextResponse.json({
      audit: { id: audit.id, status: 'running', createdAt: audit.createdAt },
    }, { status: 202 });
  } catch (err) {
    console.error('Audit trigger error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}