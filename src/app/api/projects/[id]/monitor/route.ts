import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

function checkMonitoringAllowed(tier: string): { allowed: boolean; reason?: string } {
  if (tier === 'free') {
    return {
      allowed: false,
      reason: 'Continuous Monitoring is a Pro feature. Automatically re-audit your site on a schedule and get alerted when scores drop.',
    };
  }
  return { allowed: true };
}

function computeNextRun(frequency: string, from: Date = new Date()): Date {
  const next = new Date(from);
  if (frequency === 'daily') next.setDate(next.getDate() + 1);
  else if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  else if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
  else next.setDate(next.getDate() + 7);
  return next;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { id } = await params;
    const project = await db.project.findFirst({ where: { id, userId: user.id } });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const schedule = await db.monitorSchedule.findUnique({ where: { projectId: id } });

    return NextResponse.json({ schedule });
  } catch (err) {
    console.error('[monitor] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const tier = user.tier || 'free';
    const gateCheck = checkMonitoringAllowed(tier);
    if (!gateCheck.allowed) {
      return NextResponse.json(
        { error: gateCheck.reason, upgradeRequired: 'pro', tierLimited: true },
        { status: 403 }
      );
    }

    const { id } = await params;
    const project = await db.project.findFirst({ where: { id, userId: user.id } });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const { enabled, frequency, mode, alertOnDrop, dropThreshold, alertEmail } = body;

    const validFrequencies = ['daily', 'weekly', 'monthly'];
    const finalFrequency = validFrequencies.includes(frequency) ? frequency : 'weekly';
    const finalMode = mode === 'deep' ? 'deep' : 'simple';

    if (finalMode === 'deep' && tier !== 'enterprise') {
      return NextResponse.json(
        { error: 'Deep Audit monitoring requires Enterprise. Pro tier supports Simple Audit monitoring.', upgradeRequired: 'enterprise', tierLimited: true },
        { status: 403 }
      );
    }

    const nextRunAt = enabled ? computeNextRun(finalFrequency) : null;

    const schedule = await db.monitorSchedule.upsert({
      where: { projectId: id },
      create: {
        projectId: id,
        enabled: !!enabled,
        frequency: finalFrequency,
        mode: finalMode,
        alertOnDrop: alertOnDrop !== false,
        dropThreshold: typeof dropThreshold === 'number' ? dropThreshold : 10,
        alertEmail: alertEmail || user.email,
        nextRunAt,
      },
      update: {
        enabled: !!enabled,
        frequency: finalFrequency,
        mode: finalMode,
        alertOnDrop: alertOnDrop !== false,
        dropThreshold: typeof dropThreshold === 'number' ? dropThreshold : 10,
        alertEmail: alertEmail || user.email,
        ...(enabled ? { nextRunAt } : {}),
      },
    });

    return NextResponse.json({ schedule });

  } catch (err) {
    console.error('[monitor] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
