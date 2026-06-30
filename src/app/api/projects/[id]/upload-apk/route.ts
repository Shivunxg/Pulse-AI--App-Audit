import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { runAndroidAudit } from '@/lib/android-audit';
import { generateAndroidAiSummary } from '@/lib/ai-summary';
import { checkAuditAllowed, checkAiSummaryAllowed } from '@/lib/tiers';

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

    if (project.type !== 'android') {
      return NextResponse.json({ error: 'This endpoint is for Android projects only' }, { status: 400 });
    }

    const formData = await request.formData();
    const apkFile = formData.get('apk') as File | null;

    if (!apkFile) {
      return NextResponse.json({ error: 'No APK file provided' }, { status: 400 });
    }
    if (!apkFile.name.endsWith('.apk')) {
      return NextResponse.json({ error: 'File must be an .apk file' }, { status: 400 });
    }
    // Vercel serverless body limit is ~4.5MB on Hobby; keep a sane cap regardless of plan
    if (apkFile.size > 150 * 1024 * 1024) {
      return NextResponse.json({ error: 'APK file too large (max 150MB for analysis)' }, { status: 400 });
    }

    // ── Tier gating (Android Deep Audit counts as a deep audit) ──────────────
    const tier = user.tier || 'free';
    const auditsThisMonth = user.auditsThisMonth || 0;
    const auditsResetAt = user.auditsResetAt || new Date();
    const gateCheck = checkAuditAllowed(tier, auditsThisMonth, auditsResetAt, 'deep');
    if (!gateCheck.allowed) {
      return NextResponse.json(
        { error: gateCheck.reason, upgradeRequired: gateCheck.upgradeRequired, tierLimited: true },
        { status: 403 }
      );
    }

    const apkBuffer = Buffer.from(await apkFile.arrayBuffer());

    const audit = await db.audit.create({
      data: { projectId: id, status: 'running', mode: 'deep' },
    });

    // Increment usage counter (or reset if new billing cycle)
    const daysSinceReset = (Date.now() - new Date(auditsResetAt).getTime()) / (1000 * 60 * 60 * 24);
    const shouldReset = daysSinceReset >= 30;
    await db.user.update({
      where: { id: user.id },
      data: shouldReset
        ? ({ auditsThisMonth: 1, auditsResetAt: new Date() } as any)
        : ({ auditsThisMonth: { increment: 1 } } as any),
    }).catch(err => console.warn('[upload-apk] Failed to update usage counter (non-fatal):', err));

    // Run synchronously — Vercel kills background async work after response is sent.
    // APK is analyzed entirely in-memory (no filesystem writes — Vercel's fs is ephemeral).
    try {
      const result = await runAndroidAudit(apkBuffer, apkFile.size);

      let aiSummaryJson = '{}';
      if (checkAiSummaryAllowed(tier)) {
        try {
          const aiSummary = await generateAndroidAiSummary(result.findings, project.name);
          aiSummaryJson = JSON.stringify(aiSummary);
        } catch (aiErr) {
          console.error('[upload-apk] AI summary error (non-fatal):', aiErr);
        }
      } else {
        aiSummaryJson = JSON.stringify({
          executiveSummary: '', keyStrengths: [], criticalIssues: [],
          recommendations: [], priorityActions: [], _locked: true,
        });
      }

      const completed = await db.audit.update({
        where: { id: audit.id },
        data: {
          status: 'completed',
          mode: 'deep',
          healthScore: result.healthScore,
          performanceScore: result.performanceScore,
          seoScore: result.seoScore,
          accessibilityScore: result.accessibilityScore,
          securityScore: result.securityScore,
          uxScore: result.uxScore,
          technologyScore: result.technologyScore,
          contentScore: result.contentScore,
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
      });

    } catch (err) {
      console.error('[upload-apk] Audit execution error:', err);
      await db.audit.update({ where: { id: audit.id }, data: { status: 'failed' } });
      const msg = err instanceof Error ? err.message : 'APK analysis failed';
      return NextResponse.json({ error: msg }, { status: 500 });
    }

  } catch (err) {
    console.error('[upload-apk] Route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
