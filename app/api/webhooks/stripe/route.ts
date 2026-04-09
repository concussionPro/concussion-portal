import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'

export const maxDuration = 60
import { createUser, findUserByEmail } from '@/lib/users'
import { sendMagicLinkEmail, sendEmail } from '@/lib/resend-client'
import { createMagicToken } from '@/lib/magic-link-jwt'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { sql } from '@/lib/db'
import { CONFIG } from '@/lib/config'
import { ABANDONED_CHECKOUT_SEQUENCE } from '@/lib/email-sequences'
import Stripe from 'stripe'
/** Redact email for logging — show first 3 chars only */
function redact(email: string | null | undefined): string {
  if (!email) return 'unknown'
  return email.slice(0, 3) + '***'
}

// Server-side analytics — writes to Postgres (same table as client-side tracking)
async function logAnalyticsEvent(eventType: string, eventData: Record<string, unknown>) {
  try {
    await sql`
      INSERT INTO analytics_events (event_type, event_data, session_id, timestamp_ms, user_agent, referrer, path, search, ip, country)
      VALUES (
        ${eventType},
        ${JSON.stringify(eventData)}::jsonb,
        ${'server_' + Date.now()},
        ${Date.now()},
        ${'stripe-webhook'},
        ${null},
        ${'/api/webhooks/stripe'},
        ${null},
        ${'server'},
        ${null}
      )
    `
  } catch (err) {
    console.error('[webhook] Failed to log analytics:', err)
  }
}

/**
 * Stripe Webhook Handler
 *
 * Handles payment events from Stripe:
 * - checkout.session.completed: User completed one-time payment
 *   → Create user account, send magic link login email
 *
 * Metadata stored on checkout session:
 *   courseType: 'online-only' | 'full-course' | 'workshop-upgrade'
 *   location: 'sydney' | 'melbourne' | 'byron-bay' | ''
 *   accessLevel: 'online-only' | 'full-course'
 *
 * Workshop upgrades: courseType='workshop-upgrade' maps to accessLevel='full-course'
 * via COURSE_ACCESS_MAP. The shouldUpgrade logic handles online-only → full-course.
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
    let event: Stripe.Event
    try {
      event = constructWebhookEvent(body, signature, webhookSecret)
    } catch (sigError) {
      console.error('Stripe webhook signature verification failed:', sigError)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log(`Stripe webhook received: ${event.type} (${event.id})`)

    // Idempotency: atomic INSERT — if event already exists, skip processing
    try {
      const { rows } = await sql`
        INSERT INTO processed_webhook_events (event_id, event_type, processed_at)
        VALUES (${event.id}, ${event.type}, now())
        ON CONFLICT (event_id) DO NOTHING
        RETURNING event_id
      `
      if (rows.length === 0) {
        console.log(`Skipping duplicate event: ${event.id}`)
        return NextResponse.json({ received: true, duplicate: true })
      }
    } catch (idempotencyError) {
      // If table doesn't exist yet, continue — don't block payments
      console.warn('Idempotency check failed (table may not exist yet):', idempotencyError)
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      // BNPL (Afterpay/Klarna): payment confirmed asynchronously after checkout.session.completed
      case 'checkout.session.async_payment_succeeded':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'checkout.session.async_payment_failed':
        console.log(`Async payment failed for session: ${(event.data.object as Stripe.Checkout.Session).id}`)
        break

      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
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
  // BNPL (Afterpay/Klarna) fires checkout.session.completed with payment_status='unpaid'.
  // Do NOT provision the account until payment is confirmed — async_payment_succeeded will re-call this.
  if (session.payment_status !== 'paid') {
    console.log(`Deferred payment — skipping provisioning for ${session.id} (status: ${session.payment_status})`)
    return
  }

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
  const currency = (session.currency || 'aud').toUpperCase()
  console.log(`Payment completed: ${redact(customerEmail)} — ${courseType}${workshopCity ? ` (${workshopCity})` : ''} — $${(session.amount_total || 0) / 100} ${currency}`)

  // Step 1: Create/upgrade user account — MUST succeed or Stripe will retry
  const existingUser = await findUserByEmail(customerEmail)
  let userId: string

  if (existingUser) {
    console.log(`Existing user found: ${redact(customerEmail)} (current: ${existingUser.accessLevel})`)
    userId = existingUser.id

    // Only upgrade access level, never downgrade
    // preview → online-only or full-course, online-only → full-course
    const shouldUpgrade =
      (existingUser.accessLevel === 'preview' && (accessLevel === 'online-only' || accessLevel === 'full-course')) ||
      (existingUser.accessLevel === 'online-only' && accessLevel === 'full-course')

    if (shouldUpgrade) {
      await createUser({
        email: customerEmail,
        name: customerName,
        accessLevel,
        stripeCustomerId: (typeof session.customer === 'string' ? session.customer : undefined),
        workshopLocation: workshopCity || undefined,
        signupSource: 'purchase',
      })
      console.log(`Upgraded ${redact(customerEmail)} to ${accessLevel}`)
    }
  } else {
    console.log(`Creating new user: ${redact(customerEmail)} (${accessLevel})`)

    userId = await createUser({
      email: customerEmail,
      name: customerName,
      accessLevel,
      stripeCustomerId: (typeof session.customer === 'string' ? session.customer : undefined),
      workshopLocation: workshopCity || undefined,
      signupSource: 'purchase',
    })
  }

  // Mark any abandoned checkouts for this email as recovered
  try {
    await sql`UPDATE abandoned_checkouts SET recovered = true WHERE email = ${customerEmail.toLowerCase()} AND recovered = false`
  } catch (err) {
    console.error('Failed to mark abandoned checkouts as recovered:', err)
  }

  // Step 2: Check workshop threshold — send admin alert when threshold hit
  if (accessLevel === 'full-course' && workshopCity) {
    try {
      const { getEnrollmentCount } = await import('@/lib/users')
      const count = await getEnrollmentCount(workshopCity)
      if (count >= CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD) {
        const cityLabel = workshopCity === 'byron-bay' ? 'Byron Bay' : workshopCity.charAt(0).toUpperCase() + workshopCity.slice(1)
        const adminEmail = CONFIG.CONTACT_EMAIL
        await sendEmail({
          to: adminEmail,
          subject: `${cityLabel} has reached ${CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD} registrants — time to confirm the date`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
              <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 16px;">
                Workshop threshold reached: ${cityLabel}
              </h2>
              <p style="font-size: 15px; color: #475569; line-height: 1.6;">
                <strong>${cityLabel}</strong> now has <strong>${count} paid registrants</strong> for the Complete Course workshop.
              </p>
              <p style="font-size: 15px; color: #475569; line-height: 1.6;">
                Next steps:
              </p>
              <ol style="font-size: 15px; color: #475569; line-height: 1.8;">
                <li>Choose a date (at least ${CONFIG.WORKSHOP.LEAD_TIME_WEEKS} weeks from now)</li>
                <li>Book the venue</li>
                <li>Update <code>lib/config.ts</code> — set status to <code>'confirmed'</code>, add <code>date</code> and <code>dateObj</code></li>
                <li>Deploy</li>
              </ol>
              <p style="font-size: 14px; color: #64748b; margin-top: 20px;">
                The pre-workshop email sequence will kick in automatically once the date is set.
              </p>
            </div>
          `,
          tags: [{ name: 'type', value: 'workshop-threshold-alert' }],
        })
        console.log(`[Threshold] ${cityLabel} hit ${count} registrants — admin alert sent`)
      }
    } catch (err) {
      console.error('Threshold check failed:', err)
    }
  }

  // Step 3: Log purchase to analytics + fire Google Ads conversion server-side
  const purchaseAmount = (session.amount_total || 0) / 100
  try {
    await logAnalyticsEvent('purchase_complete', {
      email: customerEmail,
      courseType,
      amount: purchaseAmount,
      currency,
      transactionId: session.id,
      accessLevel,
    })
  } catch (err) {
    console.error('Failed to log purchase analytics:', err)
  }

  // Fire Google Ads conversion via GA4 Measurement Protocol (server-side backup)
  // The checkout success page also fires client-side — GA4 deduplicates by transaction_id
  try {
    const { trackServerPurchase } = await import('@/lib/measurement-protocol')
    await trackServerPurchase(session.id, purchaseAmount, currency, customerEmail)
  } catch (err) {
    console.error('Failed to fire server-side purchase conversion:', err)
  }

  // Step 4: Send magic link email — best effort, user can request new link from /login
  try {
    // Re-read user to get definitive post-upgrade access level (existingUser is stale)
    const freshUser = await findUserByEmail(customerEmail)
    const finalAccess = (freshUser?.accessLevel || accessLevel) as 'preview' | 'online-only' | 'full-course'
    const userName = freshUser?.name || customerName
    const token = createMagicToken(freshUser?.id || userId, customerEmail, userName, finalAccess)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    const emailSent = await sendMagicLinkEmail(customerEmail, token, baseUrl)

    if (emailSent) {
      console.log(`Login link sent to: ${redact(customerEmail)} | Course: ${courseType} | City: ${workshopCity || 'N/A'} | Access: ${finalAccess}`)
    } else {
      console.error(`Email send FAILED for ${redact(customerEmail)} — user account created, they can request a new link from /login`)
      // Alert business owner so they can manually send the link
      try {
        await sendEmail({
          to: CONFIG.CONTACT_EMAIL,
          subject: `ACTION REQUIRED: Login email failed for ${customerEmail}`,
          html: `<p>A customer just paid but their login email failed to send.</p><p><strong>Email:</strong> ${customerEmail}<br><strong>Course:</strong> ${courseType}<br><strong>Access:</strong> ${finalAccess}</p><p>They can request a new login link from /login, but you may want to reach out proactively.</p>`,
        })
      } catch { /* best effort */ }
    }
  } catch (emailError) {
    console.error(`Email send failed for ${redact(customerEmail)} (user account created, they can use /login):`, emailError)
    try {
      await sendEmail({
        to: CONFIG.CONTACT_EMAIL,
        subject: `ACTION REQUIRED: Login email failed for ${customerEmail}`,
        html: `<p>A customer just paid but their login email threw an error.</p><p><strong>Email:</strong> ${customerEmail}<br><strong>Course:</strong> ${courseType}</p><p>Error: ${emailError}</p>`,
      })
    } catch { /* best effort */ }
  }
}

/**
 * Handle failed payment — send recovery email
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const email = paymentIntent.receipt_email || paymentIntent.metadata?.email
  const errorMsg = paymentIntent.last_payment_error?.message || 'Unknown error'
  console.log(`Payment failed for ${redact(email)}: ${errorMsg}`)

  // Log to analytics
  try {
    await logAnalyticsEvent('payment_failed', {
      email: email || 'unknown',
      error: errorMsg,
      amount: (paymentIntent.amount || 0) / 100,
      currency: paymentIntent.currency,
    })
  } catch (err) {
    console.error('Failed to log payment failure analytics:', err)
  }

  if (!email) return

  // Check if user has unsubscribed
  try {
    const { rows: userRows } = await sql`
      SELECT nurture_unsubscribed FROM users WHERE LOWER(email) = ${email.toLowerCase()} LIMIT 1
    `
    if (userRows.length > 0 && userRows[0].nurture_unsubscribed) {
      console.log(`[Payment Failed] Skipped recovery email for ${redact(email)} — unsubscribed`)
      return
    }
  } catch { /* user may not exist — proceed */ }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
  const unsubToken = generateUnsubscribeToken(email)
  const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken}`

  try {
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
            Concussion Education Australia &middot; Melbourne, VIC, Australia<br>
            <a href="mailto:zac@concussion-education-australia.com" style="color: #0d9488;">zac@concussion-education-australia.com</a>
          </div>
          <p style="margin-top: 16px; font-size: 12px; color: #94a3b8; text-align: center;">
            <a href="${unsubscribeUrl}" style="color: #94a3b8;">Unsubscribe</a>
          </p>
        </div>
      `,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      tags: [
        { name: 'type', value: 'payment-failed-recovery' },
      ],
    })

    console.log(`Payment failure recovery email sent to ${redact(email)}`)
  } catch (emailError) {
    console.error(`[Payment Failed] Failed to send recovery email to ${redact(email)}:`, emailError)
  }
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

  console.log(`Checkout expired: ${redact(email)} — ${courseType} ($${amount})`)

  // Log to analytics
  try {
    await logAnalyticsEvent('checkout_expired', { email, courseType, amount })
  } catch (err) {
    console.error('Failed to log checkout expired analytics:', err)
  }

  // Check if already tracked (same email within last 24h) — dedup before email AND db insert
  try {
    const { rows: recent } = await sql`
      SELECT id FROM abandoned_checkouts
      WHERE email = ${email.toLowerCase()}
        AND abandoned_at > now() - interval '24 hours'
      LIMIT 1
    `
    if (recent.length > 0) {
      console.log(`Skipping duplicate abandoned checkout for ${redact(email)} (within 24h)`)
      return
    }
  } catch (err) {
    console.error('Failed to check abandoned checkout dedup:', err)
  }

  // Store abandoned checkout and send first recovery email immediately.
  // With 30-min Stripe session expiry, the user just left — strike while warm.
  // Cron handles emails 2 (24h) and 3 (72h).
  try {
    // Check if user has unsubscribed from nurture emails
    let unsubscribed = false
    try {
      const { rows: userRows } = await sql`
        SELECT nurture_unsubscribed FROM users WHERE email = ${email.toLowerCase()} LIMIT 1
      `
      if (userRows.length > 0 && userRows[0].nurture_unsubscribed) {
        unsubscribed = true
      }
    } catch { /* user may not exist yet — proceed */ }

    const firstEmail = ABANDONED_CHECKOUT_SEQUENCE[0]
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    const unsubToken = generateUnsubscribeToken(email)
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken}`

    if (!unsubscribed) {
      const html = firstEmail.template(name)
        .replace('{{unsubscribe_url}}', unsubscribeUrl)

      await sendEmail({
        to: email,
        subject: firstEmail.subject,
        html,
        tags: [
          { name: 'sequence', value: 'abandoned-checkout' },
          { name: 'email-number', value: '1' },
        ],
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })
      console.log(`[Abandoned] Email 1 sent immediately → ${redact(email)}`)
    } else {
      console.log(`[Abandoned] Skipped email for ${redact(email)} — unsubscribed`)
    }

    // Store with emails_sent = 1 (or 0 if unsubscribed, so cron won't re-send email 1 either)
    await sql`
      INSERT INTO abandoned_checkouts (email, name, course_type, amount, abandoned_at, emails_sent, recovered)
      VALUES (${email.toLowerCase()}, ${name}, ${courseType}, ${amount}, now(), ${unsubscribed ? 0 : 1}, false)
    `
    console.log(`Stored abandoned checkout for ${redact(email)} (emails_sent: ${unsubscribed ? 0 : 1})`)
  } catch (err) {
    console.error('Failed to process abandoned checkout:', err)
  }
}

/**
 * Handle refund — downgrade user access
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  const email = charge.receipt_email || charge.billing_details?.email
  if (!email) {
    console.log('Refund with no email:', charge.id)
    return
  }

  const refundAmount = (charge.amount_refunded || 0) / 100
  const refundCurrency = (charge.currency || 'aud').toUpperCase()
  console.log(`Refund processed for ${redact(email)} — $${refundAmount} ${refundCurrency}`)

  // Log to analytics
  try {
    await logAnalyticsEvent('charge_refunded', {
      email,
      amountRefunded: refundAmount,
      amountOriginal: (charge.amount || 0) / 100,
      isFullRefund: charge.amount_refunded >= charge.amount,
    })
  } catch (err) {
    console.error('Failed to log refund analytics:', err)
  }

  // Only downgrade on full refund — partial refunds keep access
  if (charge.amount_refunded < charge.amount) {
    console.log(`Partial refund for ${redact(email)} — no access change`)
    return
  }

  const user = await findUserByEmail(email)
  if (!user) {
    console.log(`Refunded user not found: ${redact(email)}`)
    return
  }

  // Determine downgrade level: workshop-upgrade refunds downgrade to online-only
  // (user still has their original online course purchase), all others to preview.
  // Look up courseType from Stripe metadata for accuracy (price heuristic as fallback).
  let downgradeLevel: 'preview' | 'online-only' = 'preview'
  let courseType: string | undefined
  try {
    const { getStripe } = await import('@/lib/stripe')
    if (charge.payment_intent && typeof charge.payment_intent === 'string') {
      const pi = await getStripe().paymentIntents.retrieve(charge.payment_intent)
      courseType = pi.metadata?.courseType
    }
  } catch { /* fallback to heuristic */ }

  const chargeAmount = (charge.amount || 0) / 100
  const isWorkshopUpgradeRefund = courseType
    ? courseType === 'workshop-upgrade'
    : (user.accessLevel === 'full-course' && chargeAmount < 1000)
  if (isWorkshopUpgradeRefund) {
    downgradeLevel = 'online-only'
  }

  try {
    await sql`
      UPDATE users SET access_level = ${downgradeLevel} WHERE email = ${email.toLowerCase()}
    `
    console.log(`Downgraded ${redact(email)} to ${downgradeLevel} access after refund ($${chargeAmount})`)
  } catch (err) {
    console.error(`Failed to downgrade ${redact(email)} after refund:`, err)
  }
}
