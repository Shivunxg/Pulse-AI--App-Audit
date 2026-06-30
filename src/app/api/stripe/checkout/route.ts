import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getStripe, detectCurrency, type Currency } from '@/lib/stripe';
import { TIER_CONFIG, type Tier } from '@/lib/tiers';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const planId = body.planId as Tier;
    const requestedCurrency = body.currency as Currency | undefined;

    if (planId !== 'pro' && planId !== 'enterprise') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const tierConfig = TIER_CONFIG[planId];
    const currency: Currency = requestedCurrency || detectCurrency(request);

    const priceId = currency === 'inr' ? tierConfig.stripePriceIdInr : tierConfig.stripePriceIdUsd;

    if (!priceId) {
      console.error(`[stripe] Missing price ID for ${planId} (${currency})`);
      return NextResponse.json(
        { error: `Pricing not configured for ${planId} in ${currency.toUpperCase()}. Contact support.` },
        { status: 503 }
      );
    }

    const stripe = getStripe();
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-ai-app-audit.vercel.app';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/?checkout=success&plan=${planId}`,
      cancel_url: `${origin}/?checkout=cancelled`,
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        planId,
        currency,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId,
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });

  } catch (err) {
    console.error('[stripe] Checkout session error:', err);
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
