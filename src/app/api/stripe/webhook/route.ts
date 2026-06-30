import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import Stripe from 'stripe';

export const runtime = 'nodejs';

async function getTierFromPriceId(priceId: string): Promise<'pro' | 'enterprise' | null> {
  if (priceId === process.env.STRIPE_PRICE_PRO_USD || priceId === process.env.STRIPE_PRICE_PRO_INR) {
    return 'pro';
  }
  if (priceId === process.env.STRIPE_PRICE_ENTERPRISE_USD || priceId === process.env.STRIPE_PRICE_ENTERPRISE_INR) {
    return 'enterprise';
  }
  return null;
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[stripe-webhook] Signature verification failed: ${msg}`);
    return NextResponse.json({ error: `Webhook signature verification failed: ${msg}` }, { status: 400 });
  }

  console.log(`[stripe-webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (!userId || !planId) {
          console.error('[stripe-webhook] Missing userId or planId in session metadata');
          break;
        }

        await db.user.update({
          where: { id: userId },
          data: { tier: planId } as any,
        });

        console.log(`[stripe-webhook] User ${userId} upgraded to ${planId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        const priceId = subscription.items.data[0]?.price.id;

        if (!userId || !priceId) break;

        const tier = await getTierFromPriceId(priceId);
        if (!tier) break;

        // If subscription is active or trialing, ensure tier matches; if cancelled, downgrade
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          await db.user.update({ where: { id: userId }, data: { tier } as any });
          console.log(`[stripe-webhook] User ${userId} subscription updated -> ${tier}`);
        } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          await db.user.update({ where: { id: userId }, data: { tier: 'free' } as any });
          console.log(`[stripe-webhook] User ${userId} subscription ${subscription.status} -> downgraded to free`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        await db.user.update({ where: { id: userId }, data: { tier: 'free' } as any });
        console.log(`[stripe-webhook] User ${userId} subscription deleted -> downgraded to free`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn(`[stripe-webhook] Payment failed for customer ${invoice.customer}`);
        // Stripe's automatic retry logic + dunning emails handle this.
        // Subscription will move to past_due then unpaid/canceled, handled above.
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (err) {
    console.error('[stripe-webhook] Handler error:', err);
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
