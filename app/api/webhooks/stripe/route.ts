import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent, PRODUCT_ACCESS_LEVELS } from '@/lib/stripe'
import { createUser } from '@/lib/users'
import { createJWTSession } from '@/lib/jwt-session'
import { sendMagicLinkEmail } from '@/lib/email'
import Stripe from 'stripe'

/**
 * Stripe Webhook Handler
 *
 * Handles payment events from Stripe:
 * - checkout.session.completed: User completed payment
 * - customer.subscription.created: Subscription started
 * - customer.subscription.updated: Subscription changed
 * - customer.subscription.deleted: Subscription canceled
 * - invoice.payment_succeeded: Recurring payment succeeded
 * - invoice.payment_failed: Payment failed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not set')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Verify webhook signature
    const event = constructWebhookEvent(body, signature, webhookSecret)

    console.log(`Stripe webhook received: ${event.type}`)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful checkout
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerEmail = session.customer_email || session.customer_details?.email
  const customerName = session.customer_details?.name || 'User'

  if (!customerEmail) {
    console.error('No customer email in checkout session')
    return
  }

  // Get line items to determine product
  const lineItems = session.line_items?.data
  if (!lineItems || lineItems.length === 0) {
    console.error('No line items in checkout session')
    return
  }

  const priceId = lineItems[0].price?.id
  if (!priceId) {
    console.error('No price ID in line items')
    return
  }

  // Determine access level based on product
  const accessLevel = (PRODUCT_ACCESS_LEVELS as any)[priceId] || 'preview'

  try {
    // Create user account
    const userId = await createUser({
      email: customerEmail,
      name: customerName,
      accessLevel: accessLevel as 'online-only' | 'full-course' | 'preview',
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
    })

    console.log(`User created: ${userId} (${customerEmail})`)

    // Generate magic link token
    const token = createJWTSession(
      userId,
      customerEmail,
      customerName,
      accessLevel as 'online-only' | 'full-course',
      true // Remember me for 30 days
    )

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'

    // Send magic link email
    await sendMagicLinkEmail(customerEmail, token, baseUrl)

    console.log(`Magic link email sent to: ${customerEmail}`)
  } catch (error) {
    console.error('Failed to create user after checkout:', error)
    throw error
  }
}

/**
 * Handle subscription update (e.g., upgrade/downgrade)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`Subscription updated: ${subscription.id}`)
  // TODO: Update user access level if they upgraded/downgraded
  // TODO: Send email notification of plan change
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`Subscription canceled: ${subscription.id}`)
  // TODO: Downgrade user to preview access
  // TODO: Send cancellation confirmation email
}

/**
 * Handle successful recurring payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`Payment succeeded: ${invoice.id}`)
  // TODO: Send receipt email
  // TODO: Extend access for another billing period
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Payment failed: ${invoice.id}`)
  // TODO: Send payment failure email with update payment link
  // TODO: Flag account for suspension if multiple failures
}
