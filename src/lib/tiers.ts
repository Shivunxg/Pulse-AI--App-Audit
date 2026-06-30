// Pulse AI tier definitions and feature gating

export type Tier = 'free' | 'pro' | 'enterprise';

export interface TierLimits {
  name: string;
  monthlyAudits: number; // -1 = unlimited
  deepAuditsAllowed: boolean;
  pdfExport: boolean;
  aiSummary: boolean;
  technologyAudit: boolean;
  contentAudit: boolean;
  axeCore: boolean; // real WCAG scan vs basic checks
  apiAccess: boolean;
  whiteLabel: boolean;
  teamSeats: number;
  priceUsdMonthly: number; // USD, primary international pricing
  priceInrMonthly: number; // INR, for Indian customers
  stripePriceIdUsd?: string; // Stripe Price ID for USD subscription
  stripePriceIdInr?: string; // Stripe Price ID for INR subscription
}

export const TIER_CONFIG: Record<Tier, TierLimits> = {
  free: {
    name: 'Free',
    monthlyAudits: 5,
    deepAuditsAllowed: false,
    pdfExport: false,
    aiSummary: false,
    technologyAudit: false,
    contentAudit: false,
    axeCore: false,
    apiAccess: false,
    whiteLabel: false,
    teamSeats: 1,
    priceUsdMonthly: 0,
    priceInrMonthly: 0,
  },
  pro: {
    name: 'Pro',
    monthlyAudits: 100,
    deepAuditsAllowed: true,
    pdfExport: true,
    aiSummary: true,
    technologyAudit: true,
    contentAudit: true,
    axeCore: true,
    apiAccess: false,
    whiteLabel: false,
    teamSeats: 3,
    priceUsdMonthly: 19,
    priceInrMonthly: 1499,
    stripePriceIdUsd: process.env.STRIPE_PRICE_PRO_USD,
    stripePriceIdInr: process.env.STRIPE_PRICE_PRO_INR,
  },
  enterprise: {
    name: 'Enterprise',
    monthlyAudits: -1, // unlimited
    deepAuditsAllowed: true,
    pdfExport: true,
    aiSummary: true,
    technologyAudit: true,
    contentAudit: true,
    axeCore: true,
    apiAccess: true,
    whiteLabel: true,
    teamSeats: -1, // unlimited
    priceUsdMonthly: 99,
    priceInrMonthly: 7999,
    stripePriceIdUsd: process.env.STRIPE_PRICE_ENTERPRISE_USD,
    stripePriceIdInr: process.env.STRIPE_PRICE_ENTERPRISE_INR,
  },
};

export function getTierLimits(tier: string): TierLimits {
  return TIER_CONFIG[tier as Tier] || TIER_CONFIG.free;
}

export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: Tier;
}

/**
 * Check if a user can run an audit given their tier and current usage.
 * Resets monthly counter if a new billing cycle has started.
 */
export function checkAuditAllowed(
  tier: string,
  auditsThisMonth: number,
  auditsResetAt: Date,
  mode: 'simple' | 'deep'
): UsageCheckResult {
  const limits = getTierLimits(tier);

  // Check if monthly reset is due (30 days since last reset)
  const daysSinceReset = (Date.now() - auditsResetAt.getTime()) / (1000 * 60 * 60 * 24);
  const effectiveAuditsThisMonth = daysSinceReset >= 30 ? 0 : auditsThisMonth;

  // Deep audit gate
  if (mode === 'deep' && !limits.deepAuditsAllowed) {
    return {
      allowed: false,
      reason: `Deep Audit (Core Web Vitals, axe-core WCAG scan, mobile testing) requires a Pro plan. You're currently on ${limits.name}.`,
      upgradeRequired: 'pro',
    };
  }

  // Monthly quota gate
  if (limits.monthlyAudits !== -1 && effectiveAuditsThisMonth >= limits.monthlyAudits) {
    return {
      allowed: false,
      reason: `You've used all ${limits.monthlyAudits} audits included in your ${limits.name} plan this month. Upgrade to Pro for ${TIER_CONFIG.pro.monthlyAudits} audits/month, or wait for your quota to reset.`,
      upgradeRequired: 'pro',
    };
  }

  return { allowed: true };
}

/**
 * Check if a user's tier allows PDF export.
 */
export function checkPdfExportAllowed(tier: string): UsageCheckResult {
  const limits = getTierLimits(tier);
  if (!limits.pdfExport) {
    return {
      allowed: false,
      reason: 'PDF export is a Pro feature. Upgrade to download professional audit reports.',
      upgradeRequired: 'pro',
    };
  }
  return { allowed: true };
}

/**
 * Check if a user's tier allows AI-powered summary generation.
 */
export function checkAiSummaryAllowed(tier: string): boolean {
  return getTierLimits(tier).aiSummary;
}

/**
 * Filter findings to remove Technology/Content categories for Free tier.
 * Returns a stripped-down findings object for non-Pro users.
 */
export function filterFindingsByTier(findings: any, tier: string): any {
  const limits = getTierLimits(tier);
  const filtered = { ...findings };

  if (!limits.technologyAudit) delete filtered.technology;
  if (!limits.contentAudit) delete filtered.content;

  return filtered;
}
