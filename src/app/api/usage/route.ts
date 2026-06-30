import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getTierLimits } from '@/lib/tiers';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const tier = user.tier || 'free';
    const auditsThisMonth = user.auditsThisMonth || 0;
    const auditsResetAt = user.auditsResetAt || new Date();
    const limits = getTierLimits(tier);

    const daysSinceReset = (Date.now() - new Date(auditsResetAt).getTime()) / (1000 * 60 * 60 * 24);
    const effectiveAuditsUsed = daysSinceReset >= 30 ? 0 : auditsThisMonth;
    const daysUntilReset = Math.max(0, Math.ceil(30 - daysSinceReset));

    return NextResponse.json({
      tier,
      tierName: limits.name,
      auditsUsed: effectiveAuditsUsed,
      auditsLimit: limits.monthlyAudits,
      daysUntilReset,
      limits,
    });
  } catch (err) {
    console.error('[usage] Route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
