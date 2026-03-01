import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'
import { createUser, findUserByEmail } from '@/lib/users'
import { sendMagicLinkEmail } from '@/lib/email'
import { createJWTSession } from '@/lib/jwt-session'
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
  const customerPhone = session.customer_details?.phone || undefined

  if (!customerEmail) {
    console.error('No customer email in checkout session')
    return
  }

  // Extract metadata
  const courseType = session.metadata?.courseType || 'online-only'
  const location = session.metadata?.location || ''
  const accessLevel = (session.metadata?.accessLevel || 'online-only') as 'online-only' | 'full-course'

  console.log(`✅ Payment completed: ${customerEmail} — ${courseType}${location ? ` (${location})` : ''} — $${(session.amount_total || 0) / 100} AUD`)

  try {
    // Check if user already exists (e.g. upgrading from online-only to full-course)
    const existingUser = await findUserByEmail(customerEmail)

    if (existingUser) {
      console.log(`👤 Existing user found: ${customerEmail} (current: ${existingUser.accessLevel})`)

      // Only upgrade access level, never downgrade
      if (
        (existingUser.accessLevel === 'preview' || existingUser.accessLevel === 'online-only') &&
        accessLevel === 'full-course'
      ) {
        // The createUser function handles upgrades
        await createUser({
          email: customerEmail,
          name: customerName,
          accessLevel: 'full-course',
          stripeCustomerId: session.customer as string || undefined,
        })
        console.log(`⬆️ Upgraded ${customerEmail} to full-course`)
      }

      // Send login link
      const token = await createJWTSession(
        existingUser.id,
        existingUser.email,
        existingUser.name,
        accessLevel === 'full-course' ? 'full-course' : existingUser.accessLevel,
        true
      )
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
      await sendMagicLinkEmail(customerEmail, token, baseUrl)

      console.log(`📧 Login link sent to existing user: ${customerEmail}`)
      return
    }

    // Create new user
    console.log(`✨ Creating new user: ${customerEmail} (${accessLevel})`)

    const userId = await createUser({
      email: customerEmail,
      name: customerName,
      accessLevel,
      stripeCustomerId: session.customer as string || undefined,
    })

    // Generate JWT and send magic link
    const token = await createJWTSession(
      userId,
      customerEmail,
      customerName,
      accessLevel,
      true // Remember for 30 days
    )

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    await sendMagicLinkEmail(customerEmail, token, baseUrl)

    console.log(`📧 Welcome email + login link sent to: ${customerEmail}`)
    console.log(`   Course: ${courseType} | Location: ${location || 'N/A'} | Access: ${accessLevel}`)
  } catch (error) {
    console.error('Failed to provision user after checkout:', error)
    // Don't throw — Stripe will retry the webhook. Log for manual resolution.
    console.error(`⚠️ MANUAL ACTION REQUIRED: Provision ${customerEmail} with ${accessLevel} access`)
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const email = paymentIntent.receipt_email || paymentIntent.metadata?.email || 'unknown'
  console.log(`❌ Payment failed for ${email}: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`)
  // TODO: Send payment failure notification email
}
