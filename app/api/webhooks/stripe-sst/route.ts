import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { constructWebhookEvent, getStripe } from '@/lib/stripe'
import { upsertSstSubscription, type SstPlan } from '@/lib/sst-subscription'

/**
 * POST /api/webhooks/stripe-sst
 *
 * DEDICATED webhook for SST Trainer subscriptions, kept separate from the
 * course webhook (/api/webhooks/stripe) so SST billing can never interfere
 * with course access. Point a SEPARATE Stripe webhook endpoint at this URL
 * with its own signing secret in STRIPE_SST_WEBHOOK_SECRET, subscribed to:
 *   checkout.session.completed,
 *   customer.subscription.created, .updated, .deleted
 */

export const runtime = 'nodejs'

function planFromMetadata(meta: Stripe.Metadata | null | undefined): SstPlan | undefined {
  const p = meta?.plan
  return p === 'monthly' || p === 'annual' ? p : undefined
}

async function syncSubscription(subscriptionId: string, fallbackEmail?: string) {
  const sub = await getStripe().subscriptions.retrieve(subscriptionId)
  // Resolve email: subscription metadata → customer record → fallback
  let email = sub.metadata?.email || fallbackEmail || ''
  if (!email && sub.customer) {
    try {
      const cust = await getStripe().customers.retrieve(sub.customer as string)
      if (cust && !('deleted' in cust && cust.deleted)) email = (cust as Stripe.Customer).email || ''
    } catch {
      /* best effort */
    }
  }
  if (!email) {
    console.error('SST webhook: no email for subscription', subscriptionId)
    return
  }
  const item = sub.items?.data?.[0]
  // In the current Stripe API the billing period lives on the subscription item.
  const periodEnd = item?.current_period_end
  await upsertSstSubscription({
    email,
    stripeCustomerId: (sub.customer as string) || undefined,
    stripeSubscriptionId: sub.id,
    plan: planFromMetadata(sub.metadata) ||
      (item?.plan?.interval === 'year' ? 'annual' : item?.plan?.interval === 'month' ? 'monthly' : undefined),
    status: sub.status,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
  })
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_SST_WEBHOOK_SECRET
  if (!secret) {
    // Not configured yet — accept-and-ignore so Stripe doesn't retry-storm.
    return NextResponse.json({ received: true, note: 'SST webhook not configured' })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const payload = await request.text()
    event = constructWebhookEvent(payload, signature, secret) as Stripe.Event
  } catch (err) {
    console.error('SST webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        // Only our SST subscription checkouts
        if (session.mode === 'subscription' && session.metadata?.product === 'sst-trainer' && session.subscription) {
          await syncSubscription(session.subscription as string, session.customer_details?.email || undefined)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        if (sub.metadata?.product === 'sst-trainer') {
          await syncSubscription(sub.id)
        }
        break
      }
      default:
        // ignore everything else
        break
    }
  } catch (err) {
    console.error('SST webhook handler error:', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
