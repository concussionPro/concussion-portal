import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'
import { createUser, findUserByEmail } from '@/lib/users'
import { sendMagicLinkEmail } from '@/lib/email'
import { createMagicToken } from '@/lib/magic-link-jwt'
import Stripe from 'stripe'

/**
 * Stripe Webhook Handler
 *
 * Handles payment events from Stripe:
 * - checkout.session.completed: User completed one-time payment
 *   → Create user account, send magic link login email
 *
 * Metadata stored on checkout session:
 *   courseType: 'online-only' | 'full-course'
 *   location: 'sydney' | 'melbourne' | 'byron-bay' | ''
 *   accessLevel: 'online-only' | 'full-course'
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

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
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
 * Handle successful checkout (one-time payment)
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerEmail = session.customer_email || session.customer_details?.email
  const customerName = session.customer_details?.name || 'Student'

  if (!customerEmail) {
    console.error('No customer email in checkout session:', session.id)
    // Throw so the webhook returns 500 and Stripe retries
    throw new Error(`No customer email in checkout session ${session.id}`)
  }

  // Extract metadata
  const courseType = session.metadata?.courseType || 'online-only'
  const location = session.metadata?.location || ''
  const accessLevel = (session.metadata?.accessLevel || 'online-only') as 'online-only' | 'full-course'

  console.log(`Payment completed: ${customerEmail} — ${courseType}${location ? ` (${location})` : ''} — $${(session.amount_total || 0) / 100} AUD`)

  // Step 1: Create/upgrade user account — MUST succeed or Stripe will retry
  const existingUser = await findUserByEmail(customerEmail)
  let userId: string

  if (existingUser) {
    console.log(`Existing user found: ${customerEmail} (current: ${existingUser.accessLevel})`)
    userId = existingUser.id

    // Only upgrade access level, never downgrade
    if (
      (existingUser.accessLevel === 'preview' || existingUser.accessLevel === 'online-only') &&
      accessLevel === 'full-course'
    ) {
      await createUser({
        email: customerEmail,
        name: customerName,
        accessLevel: 'full-course',
        stripeCustomerId: session.customer as string || undefined,
        workshopLocation: location || undefined,
      })
      console.log(`Upgraded ${customerEmail} to full-course`)
    }
  } else {
    console.log(`Creating new user: ${customerEmail} (${accessLevel})`)

    userId = await createUser({
      email: customerEmail,
      name: customerName,
      accessLevel,
      stripeCustomerId: session.customer as string || undefined,
      workshopLocation: location || undefined,
    })
  }

  // Step 2: Send magic link email — best effort, user can request new link from /login
  try {
    const finalAccess = existingUser
      ? (accessLevel === 'full-course' ? 'full-course' : existingUser.accessLevel)
      : accessLevel
    const userName = existingUser?.name || customerName
    const token = createMagicToken(userId, customerEmail, userName, finalAccess)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    const emailSent = await sendMagicLinkEmail(customerEmail, token, baseUrl)

    if (emailSent) {
      console.log(`Login link sent to: ${customerEmail} | Course: ${courseType} | Location: ${location || 'N/A'} | Access: ${finalAccess}`)
    } else {
      console.error(`Email send FAILED for ${customerEmail} — user account created, they can request a new link from /login`)
    }
  } catch (emailError) {
    // User account exists — they can request a new login link from /login
    console.error(`Email send failed for ${customerEmail} (user account created, they can use /login):`, emailError)
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const email = paymentIntent.receipt_email || paymentIntent.metadata?.email || 'unknown'
  console.log(`Payment failed for ${email}: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`)
}
