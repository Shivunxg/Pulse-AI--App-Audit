import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runAudit } from '@/lib/audit-engine';
import { generateAiSummary } from '@/lib/ai-summary';

export const maxDuration = 60; // Hobby plan max — was 300 (Pro-only), caused every deploy to fail validation
export const dynamic = 'force-dynamic';

function computeNextRun(frequency: string, from: Date = new Date()): Date {
  const next = new Date(from);
  if (frequency === 'daily') next.setDate(next.getDate() + 1);
  else if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  else if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
  else next.setDate(next.getDate() + 7);
  return next;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const dueSchedules = await db.monitorSchedule.findMany({
    where: { enabled: true, nextRunAt: { lte: now } },
    include: { project: true },
    take: 8, // Reduced from 20 — Hobby plan caps maxDuration at 60s total,
    // and each audit + DB writes can take several seconds sequentially.
    // Hourly cron tick means a backlog clears within a few hours even at
    // this lower batch size; safer than timing out mid-batch.
  });

  console.log(`[monitor-cron] Found ${dueSchedules.length} due schedules`);

  const results: { projectId: string; status: string; healthScore?: number; alerted?: boolean }[] = [];

  for (const schedule of dueSchedules) {
    try {
      const previousAudit = await db.audit.findFirst({
        where: { projectId: schedule.projectId, status: 'completed' },
        orderBy: { createdAt: 'desc' },
      });

      const audit = await db.audit.create({
        data: { projectId: schedule.projectId, status: 'running', mode: schedule.mode },
      });

      const result = await runAudit(schedule.project.url);

      let aiSummaryJson = '{}';
      try {
        const aiSummary = await generateAiSummary(result.findings, schedule.project.url);
        aiSummaryJson = JSON.stringify(aiSummary);
      } catch {
        // non-fatal
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
          technologyScore: (result as any).technologyScore ?? null,
          contentScore: (result as any).contentScore ?? null,
          findings: JSON.stringify(result.findings),
          aiSummary: aiSummaryJson,
          responseTime: result.responseTime,
          pageSize: result.pageSize,
        },
      });

      let alerted = false;
      if (schedule.alertOnDrop && previousAudit?.healthScore != null) {
        const drop = previousAudit.healthScore - result.healthScore;
        if (drop >= schedule.dropThreshold) {
          console.warn(`[monitor-cron] ALERT: ${schedule.project.name} dropped ${drop} points (${previousAudit.healthScore} -> ${result.healthScore})`);
          alerted = true;
        }
      }

      await db.monitorSchedule.update({
        where: { id: schedule.id },
        data: { lastRunAt: now, nextRunAt: computeNextRun(schedule.frequency, now) },
      });

      results.push({ projectId: schedule.projectId, status: 'completed', healthScore: result.healthScore, alerted });

    } catch (err) {
      console.error(`[monitor-cron] Failed for project ${schedule.projectId}:`, err);
      results.push({ projectId: schedule.projectId, status: 'failed' });

      await db.monitorSchedule.update({
        where: { id: schedule.id },
        data: { lastRunAt: now, nextRunAt: computeNextRun(schedule.frequency, now) },
      }).catch(() => {});
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
