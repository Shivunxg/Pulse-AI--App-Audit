import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) throw new Error('STRIPE_SECRET_KEY not set');
    _stripe = new Stripe(apiKey, {
      apiVersion: '2024-12-18.acacia' as any,
    });
  }
  return _stripe;
}

export type Currency = 'usd' | 'inr';

/**
 * Detect likely currency based on request headers / Accept-Language / Vercel geo.
 * Defaults to USD (primary international market). Falls back to INR only on
 * explicit India geo signal.
 */
export function detectCurrency(request: Request): Currency {
  // Vercel sets x-vercel-ip-country on edge/serverless requests
  const country = request.headers.get('x-vercel-ip-country');
  if (country === 'IN') return 'inr';
  return 'usd';
}
