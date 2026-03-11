import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'
import { createUser, findUserByEmail } from '@/lib/users'
import { sendMagicLinkEmail, sendAbandonedCheckoutEmail } from '@/lib/email'
import { sendEmail } from '@/lib/resend-client'
import { createMagicToken } from '@/lib/magic-link-jwt'
import { sql } from '@/lib/db'
import { CONFIG } from '@/lib/config'
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

      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session)
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
  const preferredCity = session.metadata?.preferredCity || ''
  const accessLevel = (session.metadata?.accessLevel || 'online-only') as 'online-only' | 'full-course'

  const workshopCity = location || preferredCity
  console.log(`Payment completed: ${customerEmail} — ${courseType}${workshopCity ? ` (${workshopCity})` : ''} — $${(session.amount_total || 0) / 100} AUD`)

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
        workshopLocation: workshopCity || undefined,
        signupSource: 'purchase',
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
      workshopLocation: workshopCity || undefined,
      signupSource: 'purchase',
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
      console.log(`Login link sent to: ${customerEmail} | Course: ${courseType} | City: ${workshopCity || 'N/A'} | Access: ${finalAccess}`)
    } else {
      console.error(`Email send FAILED for ${customerEmail} — user account created, they can request a new link from /login`)
    }
  } catch (emailError) {
    // User account exists — they can request a new login link from /login
    console.error(`Email send failed for ${customerEmail} (user account created, they can use /login):`, emailError)
  }
}

/**
 * Handle failed payment — send recovery email
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const email = paymentIntent.receipt_email || paymentIntent.metadata?.email
  const errorMsg = paymentIntent.last_payment_error?.message || 'Unknown error'
  console.log(`Payment failed for ${email || 'unknown'}: ${errorMsg}`)

  if (!email) return

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'

  await sendEmail({
    to: email,
    subject: 'Your payment didn\'t go through — we can help',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 16px;">
          Your payment didn't go through
        </h2>
        <p style="font-size: 15px; color: #475569; line-height: 1.6;">
          We noticed your payment for the Concussion Management course didn't complete. This sometimes happens with card limits or temporary bank holds.
        </p>
        <p style="font-size: 15px; color: #475569; line-height: 1.6;">
          You can try again anytime — your spot is still available:
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${baseUrl}/pricing" style="display: inline-block; background: #0d9488; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
            Try Again →
          </a>
        </div>
        <p style="font-size: 14px; color: #64748b; line-height: 1.6;">
          If you keep having trouble, reply to this email and I'll help sort it out. You can also try a different card or payment method.
        </p>
        <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b;">
          Zac Lewis<br>
          Concussion Education Australia<br>
          <a href="mailto:zac@concussion-education-australia.com" style="color: #0d9488;">zac@concussion-education-australia.com</a>
        </div>
      </div>
    `,
    tags: [
      { name: 'type', value: 'payment-failed-recovery' },
    ],
  })

  console.log(`Payment failure recovery email sent to ${email}`)
}

/**
 * Handle expired checkout session — store for abandoned cart recovery emails
 */
async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const email = session.customer_email || session.customer_details?.email
  if (!email) {
    console.log('Expired checkout session with no email:', session.id)
    return
  }

  const name = session.customer_details?.name || ''
  const courseType = session.metadata?.courseType || 'unknown'
  const amount = (session.amount_total || 0) / 100

  console.log(`Checkout expired: ${email} — ${courseType} ($${amount})`)

  // Send immediate abandoned checkout recovery email
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    await sendAbandonedCheckoutEmail(email, baseUrl)
    console.log(`Sent immediate abandoned checkout email to ${email}`)
  } catch (error) {
    console.error(`Failed to send abandoned checkout email to ${email}:`, error)
  }

  // Store abandoned checkout in Postgres for recovery cron drip sequence
  try {
    // Don't add if already tracked (same email within last 24h)
    const { rows: recent } = await sql`
      SELECT id FROM abandoned_checkouts
      WHERE email = ${email.toLowerCase()}
        AND abandoned_at > now() - interval '24 hours'
      LIMIT 1
    `
    if (recent.length > 0) return

    await sql`
      INSERT INTO abandoned_checkouts (email, name, course_type, amount, abandoned_at, emails_sent, recovered)
      VALUES (${email.toLowerCase()}, ${name}, ${courseType}, ${amount}, now(), 0, false)
    `

    console.log(`Stored abandoned checkout for ${email}`)
  } catch (err) {
    console.error('Failed to store abandoned checkout:', err)
  }
}
