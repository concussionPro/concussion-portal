import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'
import { setSstClinicPlan } from '@/lib/sst-trainer/clinic-registry'

export const maxDuration = 60
import { createUser, findUserByEmail, markBookPurchased } from '@/lib/users'
import { sendMagicLinkEmail, sendPostPurchaseLoginEmail, sendEmail, sendHubOwnerWelcomeEmail } from '@/lib/resend-client'
import { createCourseHub, redeemHubSeat, clampClinicianSeats, HUB_ADMIN_SEATS } from '@/lib/course-hub'
import { createMagicToken } from '@/lib/magic-link-jwt'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { sql } from '@/lib/db'
import { CONFIG } from '@/lib/config'
import { escapeHtml } from '@/lib/resend-client'
import { ABANDONED_CHECKOUT_SEQUENCE } from '@/lib/email-sequences'
import { recordCoursePurchase } from '@/lib/course-purchases'
import { enrolUser as enrolAiCourseUser, unenrolUser as unenrolAiCourseUser } from '@/lib/ai-course/access'
import { findCourse } from '@/lib/ai-course/provider-catalogue'

function labelForCourse(courseType: string, accessLevel: string): string {
  switch (courseType) {
    case 'full-course': return 'Complete Course (online + workshop)'
    case 'online-only': return 'Online Course'
    case 'workshop-upgrade': return 'Workshop Upgrade'
    case 'clinic-hub-pack': return 'Concussion Hub Pack — full clinic team access'
    case 'international-online': return 'Online Course (International)'
    default: return accessLevel === 'full-course' ? 'Complete Course' : 'Online Course'
  }
}
import Stripe from 'stripe'
/** Redact email for logging — show first 3 chars only */
function redact(email: string | null | undefined): string {
  if (!email) return 'unknown'
  return email.slice(0, 3) + '***'
}

// Server-side analytics — writes to Postgres (same table as client-side tracking).
// Persists user_email in its own column so JOIN-ing analytics_events to email_events
// (for per-sequence revenue attribution) and to users (for high-intent retargeting)
// is a single index lookup instead of a JSONB scan.
async function logAnalyticsEvent(
  eventType: string,
  eventData: Record<string, unknown>,
  userEmail?: string | null,
) {
  try {
    const normalisedEmail = userEmail ? userEmail.toLowerCase().trim() : null
    await sql`
      INSERT INTO analytics_events (event_type, event_data, session_id, timestamp_ms, user_agent, referrer, path, search, ip, country, user_email)
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
        ${null},
        ${normalisedEmail}
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
    let idempotencyInserted = false
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
      idempotencyInserted = true
    } catch (idempotencyError: unknown) {
      // Only skip on "table does not exist" — re-throw on connection/constraint errors
      const pgCode = (idempotencyError as { code?: string })?.code
      if (pgCode === '42P01') {
        console.warn('processed_webhook_events table missing — continuing without idempotency')
      } else {
        throw idempotencyError
      }
    }

    try {
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

      // SST Trainer subscriptions — flip the clinic's plan (lifts/re-applies
      // the 3-patient trial cap). checkout.session.completed already routes
      // to handleCheckoutCompleted, which branches on product='sst-trainer'.
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSstSubscriptionChange(event.data.object as Stripe.Subscription)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
    } catch (handlerError) {
      // If provisioning failed, remove idempotency record so Stripe can retry
      if (idempotencyInserted) {
        try {
          await sql`DELETE FROM processed_webhook_events WHERE event_id = ${event.id}`
          console.log(`Removed idempotency record for failed event ${event.id} — Stripe will retry`)
        } catch (cleanupErr) {
          console.error('Failed to clean up idempotency record:', cleanupErr)
        }
      }
      throw handlerError
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

  // SST Trainer subscription — a Clinical Testing clinic converting off the
  // free trial. Flip the clinic to 'active' (lifts the 3-patient cap) and
  // stash the Stripe customer/subscription for the billing portal. Isolated
  // from course provisioning; returns early.
  if (session.mode === 'subscription' && session.metadata?.product === 'sst-trainer') {
    const clinicCode = session.metadata?.clinicCode
    if (clinicCode) {
      await setSstClinicPlan(clinicCode, 'active', {
        customerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
        subscriptionId: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
      })
      console.log(`SST subscription active for clinic ${clinicCode}`)
    } else {
      console.error('SST subscription checkout without clinicCode:', session.id)
    }
    return
  }

  // Reference-book purchase path — separate from course checkout. Provisions the
  // user at 'preview' access, flags them as a book owner, and sends the receipt
  // + download email. The course upsell happens via a subsequent nurture email.
  if (session.metadata?.productType === 'reference-book') {
    await handleBookPurchase(session, customerEmail, customerName)
    return
  }

  // Short-course purchase path (AI in Clinical Practice, Vagus Nerve, future
  // monthly drops). Separate from CCM flagship. Provisions user, records the
  // purchase, enrols the user for course-specific access, sends a magic-link
  // welcome email. Returns early — does NOT fall through to CCM provisioning.
  if (session.metadata?.productType === 'short-course') {
    await handleShortCoursePurchase(session, customerEmail, customerName)
    return
  }

  // Hub Pack (full clinic team access). Creates a seat-capped access KEY the
  // buyer forwards to their team, provisions the buyer at full-course, and sends
  // the welcome + key + GST invoice. Returns early — does NOT fall through to the
  // single-account CCM path (which was the pre-2026-07-08 leak: only the buyer
  // got in).
  if (session.metadata?.courseType === 'clinic-hub-pack' || session.metadata?.productType === 'clinic-hub-pack') {
    await handleHubPackPurchase(session, customerEmail, customerName)
    return
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
    // Store full email so we can JOIN analytics_events → email_events.sequence
    // for per-sequence revenue attribution (which email campaign drove the sale).
    // PII consideration: this is an internal analytics table behind admin auth,
    // not a public surface. Redact only at log/console level (line above already
    // does that via console.log redact()).
    await logAnalyticsEvent(
      'purchase_complete',
      {
        courseType,
        amount: purchaseAmount,
        currency,
        transactionId: session.id,
        accessLevel,
      },
      customerEmail,
    )
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

  // Step 4: Send post-purchase welcome email (richer than bare magic link — includes
  // course label, amount, workshop details if applicable, and a "start here" nudge).
  try {
    // Re-read user to get definitive post-upgrade access level (existingUser is stale)
    const freshUser = await findUserByEmail(customerEmail)
    const finalAccess = (freshUser?.accessLevel || accessLevel) as 'preview' | 'online-only' | 'full-course'
    const userName = freshUser?.name || customerName
    const token = createMagicToken(freshUser?.id || userId, customerEmail, userName, finalAccess)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'

    const melConfirmed = workshopCity === 'melbourne' && CONFIG.LOCATIONS.MELBOURNE.status === 'confirmed'

    // Generate the tax invoice PDF as an attachment to the welcome email.
    // Best-effort — if PDF generation throws, the welcome email still goes
    // out (just without the attachment) and we log the failure for follow-up.
    let invoiceAttachment: { filename: string; content: Buffer } | undefined
    try {
      const { generateTaxInvoicePdf, invoiceNumberFromSession } = await import('@/lib/tax-invoice')
      const issueDate = new Date()
      const invNumber = invoiceNumberFromSession(session.id, issueDate)
      const pdf = generateTaxInvoicePdf({
        invoiceNumber: invNumber,
        issueDate,
        buyer: { name: userName, email: customerEmail },
        lineItems: [{
          description: labelForCourse(courseType, finalAccess) + (workshopCity ? ` — workshop: ${workshopCity}` : ''),
          quantity: 1,
          unitPriceCents: session.amount_total || 0,
          totalCents: session.amount_total || 0,
        }],
        totalCents: session.amount_total || 0,
        currency,
        paidAt: issueDate,
        paymentReference: session.id,
      })
      invoiceAttachment = { filename: `${invNumber}.pdf`, content: pdf }
    } catch (invErr) {
      console.error(`[invoice] PDF generation failed for ${redact(customerEmail)}:`, invErr)
    }

    const emailSent = await sendPostPurchaseLoginEmail({
      email: customerEmail,
      token,
      firstName: userName,
      courseLabel: labelForCourse(courseType, finalAccess),
      accessLevel: finalAccess,
      amount: purchaseAmount,
      currency,
      workshopCity: workshopCity || undefined,
      workshopDate: melConfirmed ? CONFIG.LOCATIONS.MELBOURNE.date : undefined,
      workshopVenue: melConfirmed ? 'Rydges Melbourne, Exhibition St' : undefined,
      accommodationPerkLine: melConfirmed ? `${CONFIG.VENUE_BENEFITS.MELBOURNE.accommodationDiscountPct}% off ${CONFIG.VENUE_BENEFITS.MELBOURNE.hotelName} accommodation — booking link and code in your follow-up email` : undefined,
      origin: baseUrl,
      ...(invoiceAttachment ? { attachments: [invoiceAttachment] } : {}),
    })

    if (emailSent) {
      console.log(`Login link sent to: ${redact(customerEmail)} | Course: ${courseType} | City: ${workshopCity || 'N/A'} | Access: ${finalAccess}`)
    } else {
      console.error(`Email send FAILED for ${redact(customerEmail)} — user account created, they can request a new link from /login`)
      try {
        await sendEmail({
          to: CONFIG.CONTACT_EMAIL,
          subject: `ACTION REQUIRED: Login email failed for ${redact(customerEmail)}`,
          html: `<p>A customer just paid but their login email failed to send.</p><p><strong>Email:</strong> ${escapeHtml(customerEmail)}<br><strong>Course:</strong> ${escapeHtml(courseType)}<br><strong>Access:</strong> ${escapeHtml(finalAccess)}</p><p>They can request a new login link from /login, but you may want to reach out proactively.</p>`,
        })
      } catch (alertErr) { console.error('Admin alert email failed:', alertErr) }
    }
  } catch (emailError) {
    console.error(`Email send failed for ${redact(customerEmail)} (user account created, they can use /login):`, emailError)
    try {
      await sendEmail({
        to: CONFIG.CONTACT_EMAIL,
        subject: `ACTION REQUIRED: Login email failed for ${redact(customerEmail)}`,
        html: `<p>A customer just paid but their login email threw an error.</p><p><strong>Course:</strong> ${escapeHtml(courseType)}</p><p>Error: ${escapeHtml(emailError instanceof Error ? emailError.message : String(emailError))}</p>`,
      })
    } catch (alertErr) { console.error('Admin alert email failed:', alertErr) }
  }

  // Step 5: Simple "new sale" ping to the admin, every time.
  try {
    const cityLine = workshopCity ? ` · ${workshopCity}` : ''
    await sendEmail({
      to: CONFIG.CONTACT_EMAIL,
      subject: `New sale: ${labelForCourse(courseType, accessLevel)}${cityLine} — ${currency} $${purchaseAmount.toFixed(2)}`,
      html: `
        <p><strong>New paid sale through the portal.</strong></p>
        <ul>
          <li><strong>Customer:</strong> ${escapeHtml(customerEmail)} (${escapeHtml(customerName)})</li>
          <li><strong>Course:</strong> ${escapeHtml(labelForCourse(courseType, accessLevel))}</li>
          ${workshopCity ? `<li><strong>Workshop:</strong> ${escapeHtml(workshopCity)}</li>` : ''}
          <li><strong>Amount:</strong> ${escapeHtml(currency)} $${purchaseAmount.toFixed(2)}</li>
          <li><strong>Stripe session:</strong> <code style="font-size: 12px;">${escapeHtml(session.id)}</code></li>
        </ul>
      `,
      tags: [{ name: 'type', value: 'admin-sale-notify' }],
    })
  } catch (adminErr) {
    console.error('Admin sale notification failed:', adminErr)
  }
}

/**
 * Handle short-course purchase (AI in Clinical Practice, Vagus Nerve, etc).
 * Creates a preview-level user if none exists, records the purchase, sets the
 * appropriate enrolment flag, and sends a magic-link welcome email.
 */
async function handleShortCoursePurchase(
  session: Stripe.Checkout.Session,
  customerEmail: string,
  customerName: string,
) {
  const courseSlug = session.metadata?.courseSlug
  if (!courseSlug) {
    console.error('[short-course] No courseSlug in session metadata:', session.id)
    return
  }
  const course = findCourse(courseSlug)
  if (!course) {
    console.error(`[short-course] Unknown courseSlug: ${courseSlug}`)
    return
  }

  const currency = (session.currency || 'aud').toUpperCase()
  const amountCents = session.amount_total || 0
  const amountAud = amountCents / 100

  // Ensure user exists at preview level (course-specific access is gated by
  // the enrolment flag, not the broader CCM accessLevel).
  const existing = await findUserByEmail(customerEmail)
  let userId: string
  if (existing) {
    userId = existing.id
  } else {
    userId = await createUser({
      email: customerEmail,
      name: customerName,
      accessLevel: 'preview',
      stripeCustomerId: typeof session.customer === 'string' ? session.customer : undefined,
      signupSource: 'purchase',
    })
  }

  // Record the purchase (idempotent per stripe session id). Fulfilment
  // failures MUST rethrow — the idempotency cleanup in POST removes the
  // processed_webhook_events row so Stripe retries the event. Alert the
  // admin too so a persistent failure doesn't go unnoticed.
  try {
    await recordCoursePurchase({
      email: customerEmail,
      courseSlug,
      stripeSessionId: session.id,
      amountAud,
    })
  } catch (err) {
    console.error(`[short-course] recordCoursePurchase failed for ${courseSlug}:`, err)
    try {
      await sendEmail({
        to: CONFIG.CONTACT_EMAIL,
        subject: `ACTION REQUIRED: Short-course fulfilment failed for ${redact(customerEmail)}`,
        html: `<p>A customer paid for a short course but <strong>recordCoursePurchase failed</strong> — they have no access yet.</p><p><strong>Email:</strong> ${escapeHtml(customerEmail)}<br><strong>Course:</strong> ${escapeHtml(courseSlug)}<br><strong>Amount:</strong> ${escapeHtml(currency)} $${amountAud.toFixed(2)}<br><strong>Session:</strong> <code>${escapeHtml(session.id)}</code></p><p>Error: ${escapeHtml(err instanceof Error ? err.message : String(err))}</p><p>Stripe will retry the webhook automatically.</p>`,
      })
    } catch (alertErr) { console.error('Admin alert email failed:', alertErr) }
    throw err
  }

  // Course-specific enrolment — same rethrow-so-Stripe-retries policy.
  if (courseSlug === 'ai-in-clinical-practice') {
    try {
      await enrolAiCourseUser(customerEmail)
    } catch (err) {
      console.error('[short-course] enrolAiCourseUser failed:', err)
      try {
        await sendEmail({
          to: CONFIG.CONTACT_EMAIL,
          subject: `ACTION REQUIRED: AI course enrolment failed for ${redact(customerEmail)}`,
          html: `<p>A customer paid for the AI course but <strong>enrolAiCourseUser failed</strong> — they have no access yet.</p><p><strong>Email:</strong> ${escapeHtml(customerEmail)}<br><strong>Amount:</strong> ${escapeHtml(currency)} $${amountAud.toFixed(2)}<br><strong>Session:</strong> <code>${escapeHtml(session.id)}</code></p><p>Error: ${escapeHtml(err instanceof Error ? err.message : String(err))}</p><p>Stripe will retry the webhook automatically.</p>`,
        })
      } catch (alertErr) { console.error('Admin alert email failed:', alertErr) }
      throw err
    }
  }

  // Generate tax invoice — same best-effort policy as the CCM and book
  // paths. A PDF failure must never block fulfilment.
  let courseInvoice: { filename: string; content: Buffer } | undefined
  try {
    const { generateTaxInvoicePdf, invoiceNumberFromSession } = await import('@/lib/tax-invoice')
    const issueDate = new Date()
    const invNumber = invoiceNumberFromSession(session.id, issueDate)
    const pdf = generateTaxInvoicePdf({
      invoiceNumber: invNumber,
      issueDate,
      buyer: { name: customerName, email: customerEmail },
      lineItems: [{
        description: `${course.title} — online short course (${course.cpdHours} CPD ${course.cpdHours === 1 ? 'hour' : 'hours'})`,
        quantity: 1,
        unitPriceCents: amountCents,
        totalCents: amountCents,
      }],
      totalCents: amountCents,
      currency,
      paidAt: issueDate,
      paymentReference: session.id,
    })
    courseInvoice = { filename: `${invNumber}.pdf`, content: pdf }
  } catch (invErr) {
    console.error(`[short-course] Invoice PDF generation failed for ${redact(customerEmail)}:`, invErr)
  }

  // Welcome email with magic link. Use the user's existing access level —
  // hardcoding 'preview' would downgrade an online-only/full-course user's
  // session when they click the link (same pattern as handleBookPurchase).
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || CONFIG.SEO.SITE_URL || 'https://portal.concussion-education-australia.com'
  const token = createMagicToken(userId, customerEmail, customerName, (existing?.accessLevel || 'preview') as 'preview' | 'online-only' | 'full-course')
  const loginUrl = `${baseUrl}/api/auth/verify?token=${token}&utm_source=email&utm_medium=email&utm_campaign=short_course_purchase&redirect=${encodeURIComponent(course.route)}`

  try {
    await sendEmail({
      to: customerEmail,
      subject: `You're enrolled — ${course.title}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1e293b;">
          <div style="height: 4px; background: linear-gradient(90deg, #0d9488, #0ea5e9); border-radius: 2px; margin-bottom: 24px;"></div>
          <h2 style="margin: 0 0 12px; font-size: 22px; color: #0f172a;">You're in, ${escapeHtml(customerName.split(' ')[0] || 'there')}.</h2>
          <p style="margin: 0 0 14px; font-size: 15px;"><strong>${escapeHtml(course.title)}</strong> is yours — ${course.cpdHours} CPD ${course.cpdHours === 1 ? 'hour' : 'hours'}, 12-month certificate on completion.</p>
          <p style="text-align: center; margin: 24px 0;">
            <a href="${loginUrl}" style="display: inline-block; padding: 14px 28px; background: #0d9488; color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">Open the course →</a>
          </p>
          <div style="background: #f0fdfa; border-left: 3px solid #0d9488; padding: 14px 16px; margin: 20px 0; border-radius: 6px; font-size: 14px;">
            <strong>What you paid:</strong> ${escapeHtml(currency)} $${amountAud.toFixed(2)}<br>
            <strong>Order ref:</strong> <code style="font-size: 12px;">${escapeHtml(session.id)}</code>${courseInvoice ? '<br><strong>Tax invoice:</strong> attached to this email' : ''}
          </div>
          <p style="margin: 14px 0 0; font-size: 14px; color: #475569;">Questions — just reply to this email.</p>
          <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">Zac Lewis<br>Concussion Education Australia</div>
        </div>
      `,
      tags: [
        { name: 'type', value: 'short-course-purchase' },
        { name: 'course', value: courseSlug },
      ],
      ...(courseInvoice ? { attachments: [courseInvoice] } : {}),
    })
  } catch (emailErr) {
    console.error(`[short-course] Welcome email failed for ${redact(customerEmail)}:`, emailErr)
  }

  console.log(`[short-course] Provisioned ${redact(customerEmail)} for ${courseSlug} — $${amountAud} ${currency}`)
}

/**
 * Hub Pack — full clinic team access. Creates a seat-capped access key, registers
 * the buyer as the first clinician seat, provisions the buyer at full-course, and
 * emails the welcome + key (forwardable) + GST invoice. The key's cap is the
 * clinician headcount the buyer declared at checkout, enforced atomically in
 * `redeemHubSeat` — access cannot leak past the paid team.
 */
async function handleHubPackPurchase(session: Stripe.Checkout.Session, customerEmail: string, customerName: string) {
  const currency = (session.currency || 'aud').toUpperCase()
  const amount = (session.amount_total || 0) / 100
  const clinicianSeats = clampClinicianSeats(Number(session.metadata?.clinicianCount) || 5)
  const clinicName = session.metadata?.clinicName || null

  // Create the hub + claim the owner's own clinician seat.
  const code = await createCourseHub({ ownerEmail: customerEmail, clinicName, clinicianSeats, stripeSessionId: session.id })
  await redeemHubSeat(code, customerEmail, customerName, 'clinician')

  // Provision the buyer at real full-course access (the exact existing suite).
  const userId = await createUser({
    email: customerEmail,
    name: customerName,
    accessLevel: 'full-course',
    stripeCustomerId: typeof session.customer === 'string' ? session.customer : undefined,
    signupSource: 'purchase',
  })

  try {
    await sql`UPDATE abandoned_checkouts SET recovered = true WHERE email = ${customerEmail.toLowerCase()} AND recovered = false`
  } catch (err) {
    console.error('[hub-pack] abandoned-checkout recover failed:', err)
  }

  // Welcome + key + GST invoice.
  try {
    const token = createMagicToken(userId, customerEmail, customerName, 'full-course')
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    let invoiceAttachment: { filename: string; content: Buffer } | undefined
    try {
      const { generateTaxInvoicePdf, invoiceNumberFromSession } = await import('@/lib/tax-invoice')
      const issueDate = new Date()
      const invNumber = invoiceNumberFromSession(session.id, issueDate)
      const pdf = generateTaxInvoicePdf({
        invoiceNumber: invNumber,
        issueDate,
        buyer: { name: customerName, email: customerEmail },
        lineItems: [{
          description: 'Concussion Hub Pack — full clinic team access',
          quantity: 1,
          unitPriceCents: session.amount_total || 0,
          totalCents: session.amount_total || 0,
        }],
        totalCents: session.amount_total || 0,
        currency,
        paidAt: issueDate,
        paymentReference: session.id,
      })
      invoiceAttachment = { filename: `${invNumber}.pdf`, content: pdf }
    } catch (invErr) {
      console.error(`[hub-pack][invoice] PDF generation failed for ${redact(customerEmail)}:`, invErr)
    }

    await sendHubOwnerWelcomeEmail({
      email: customerEmail,
      token,
      firstName: customerName,
      hubKey: code,
      clinicianSeats,
      adminSeats: HUB_ADMIN_SEATS,
      amount,
      currency,
      redeemUrl: `${baseUrl}/join-clinic?key=${code}`,
      origin: baseUrl,
      ...(invoiceAttachment ? { attachments: [invoiceAttachment] } : {}),
    })
  } catch (emailErr) {
    console.error(`[hub-pack] Welcome email failed for ${redact(customerEmail)}:`, emailErr)
  }

  // Admin ping.
  try {
    await sendEmail({
      to: CONFIG.CONTACT_EMAIL,
      subject: `New sale: Concussion Hub Pack (${clinicianSeats} clinicians) — ${currency} $${amount.toFixed(2)}`,
      html: `<p>Hub Pack purchased.</p><p><strong>Buyer:</strong> ${escapeHtml(customerEmail)}<br><strong>Clinic:</strong> ${escapeHtml(clinicName || '—')}<br><strong>Seats:</strong> ${clinicianSeats} clinicians + ${HUB_ADMIN_SEATS} admin<br><strong>Key:</strong> ${escapeHtml(code)}</p>`,
    })
  } catch (alertErr) {
    console.error('[hub-pack] admin ping failed:', alertErr)
  }

  console.log(`[hub-pack] Provisioned clinic hub for ${redact(customerEmail)} — key ${code}, ${clinicianSeats} clinician seats — $${amount} ${currency}`)
}

/**
 * Handle reference-book purchase.
 * Creates a preview-level user if none exists, flags them as a book owner,
 * sends a short receipt + download email, and pings the admin.
 */
async function handleBookPurchase(
  session: Stripe.Checkout.Session,
  customerEmail: string,
  customerName: string,
) {
  const currency = (session.currency || 'aud').toUpperCase()
  const amount = (session.amount_total || 0) / 100

  // Ensure the user exists so downloads can be gated by session cookie later.
  const existing = await findUserByEmail(customerEmail)
  let userId: string
  if (existing) {
    userId = existing.id
  } else {
    userId = await createUser({
      email: customerEmail,
      name: customerName,
      accessLevel: 'preview',
      signupSource: 'purchase',
    })
  }

  await markBookPurchased(customerEmail)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
  const token = createMagicToken(userId, customerEmail, customerName, (existing?.accessLevel || 'preview') as 'preview' | 'online-only' | 'full-course')
  const loginUrl = `${baseUrl}/api/auth/verify?token=${token}&utm_source=email&utm_medium=email&utm_campaign=reference_purchase`
  const downloadUrl = `${baseUrl}/api/reference/download`

  // Generate tax invoice — same best-effort policy as course purchase.
  let bookInvoice: { filename: string; content: Buffer } | undefined
  try {
    const { generateTaxInvoicePdf, invoiceNumberFromSession } = await import('@/lib/tax-invoice')
    const issueDate = new Date()
    const invNumber = invoiceNumberFromSession(session.id, issueDate)
    const pdf = generateTaxInvoicePdf({
      invoiceNumber: invNumber,
      issueDate,
      buyer: { name: customerName, email: customerEmail },
      lineItems: [{
        description: 'Concussion Clinical Mastery — Reference Text + Clinical Toolkit 2026 (256-page digital PDF, lifetime access)',
        quantity: 1,
        unitPriceCents: session.amount_total || 0,
        totalCents: session.amount_total || 0,
      }],
      totalCents: session.amount_total || 0,
      currency,
      paidAt: issueDate,
      paymentReference: session.id,
    })
    bookInvoice = { filename: `${invNumber}.pdf`, content: pdf }
  } catch (invErr) {
    console.error(`[book] Invoice PDF generation failed for ${redact(customerEmail)}:`, invErr)
  }

  try {
    await sendEmail({
      to: customerEmail,
      subject: 'Your Concussion Education Australia Reference Text is ready',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1e293b;">
          <div style="height: 4px; background: linear-gradient(90deg, #0d9488, #0ea5e9); border-radius: 2px; margin-bottom: 24px;"></div>
          <h2 style="margin: 0 0 12px; font-size: 22px; color: #0f172a;">You're in, ${escapeHtml(customerName.split(' ')[0] || 'there')}.</h2>
          <p style="margin: 0 0 14px; font-size: 15px;">Thanks for backing your clinical practice. The <strong>Concussion Clinical Mastery Reference Text</strong> is yours — 256 pages, lifetime access.</p>
          <p style="text-align: center; margin: 24px 0;">
            <a href="${loginUrl}" style="display: inline-block; padding: 14px 28px; background: #0d9488; color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">Access Your Account →</a>
          </p>
          <p style="margin: 0 0 14px; font-size: 14px; color: #475569;">The reference lives inside your account at <a href="${downloadUrl}" style="color: #0d9488;">portal.concussion-education-australia.com/api/reference/download</a>. Save a local copy for offline use if you like.</p>
          <div style="background: #f0fdfa; border-left: 3px solid #0d9488; padding: 14px 16px; margin: 20px 0; border-radius: 6px; font-size: 14px;">
            <strong>What you paid:</strong> ${escapeHtml(currency)} $${amount.toFixed(2)}<br>
            <strong>Order ref:</strong> <code style="font-size: 12px;">${escapeHtml(session.id)}</code>${bookInvoice ? '<br><strong>Tax invoice:</strong> attached to this email' : ''}
          </div>
          <p style="margin: 20px 0 0; font-size: 14px; color: #475569;">Next — the text pairs with the online course. Book owners get <strong>A$100 off</strong> the full course. I'll send you the details in a few days so you can read before deciding. No pressure.</p>
          <p style="margin: 14px 0 0; font-size: 14px; color: #475569;">Questions — just reply to this email.</p>
          <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">Zac Lewis<br>Concussion Education Australia</div>
        </div>
      `,
      tags: [
        { name: 'type', value: 'reference-purchase' },
        { name: 'sequence', value: 'book' },
      ],
      ...(bookInvoice ? { attachments: [bookInvoice] } : {}),
    })
    console.log(`[book] Reference purchase + email sent to ${redact(customerEmail)} — ${currency} $${amount}${bookInvoice ? ' (with invoice)' : ''}`)
  } catch (err) {
    console.error(`[book] Receipt email failed for ${redact(customerEmail)}:`, err)
    try {
      await sendEmail({
        to: CONFIG.CONTACT_EMAIL,
        subject: `ACTION REQUIRED: Reference receipt email failed — ${redact(customerEmail)}`,
        html: `<p>Book purchase went through but the receipt email failed.</p><p><strong>Customer:</strong> ${escapeHtml(customerEmail)}<br><strong>Amount:</strong> ${escapeHtml(currency)} $${amount.toFixed(2)}<br><strong>Session:</strong> ${escapeHtml(session.id)}</p>`,
      })
    } catch (alertErr) { console.error('Admin alert for book email failure also failed:', alertErr) }
  }

  // Admin "new sale" ping
  try {
    await sendEmail({
      to: CONFIG.CONTACT_EMAIL,
      subject: `New reference sale — ${currency} $${amount.toFixed(2)}`,
      html: `
        <p><strong>New Clinical Reference Text sale.</strong></p>
        <ul>
          <li><strong>Customer:</strong> ${escapeHtml(customerEmail)} (${escapeHtml(customerName)})</li>
          <li><strong>Amount:</strong> ${escapeHtml(currency)} $${amount.toFixed(2)}</li>
          <li><strong>User status:</strong> ${existing ? `existing (${escapeHtml(existing.accessLevel)}) — now flagged as book owner` : 'new preview user, book-owner flagged'}</li>
          <li><strong>Stripe session:</strong> <code>${escapeHtml(session.id)}</code></li>
        </ul>
      `,
      tags: [{ name: 'type', value: 'admin-reference-sale' }],
    })
  } catch (adminErr) {
    console.error('Admin reference sale notification failed:', adminErr)
  }

  // Analytics
  try {
    await logAnalyticsEvent('reference_purchase', {
      email: redact(customerEmail),
      amount,
      currency,
      transactionId: session.id,
    })
  } catch (err) {
    console.error('Failed to log reference purchase analytics:', err)
  }
}

/**
 * Handle failed payment — send recovery email
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  let email: string | undefined = paymentIntent.receipt_email || paymentIntent.metadata?.email || undefined
  // receipt_email / PI metadata are usually empty for Checkout-created
  // PaymentIntents — fall back to the Checkout Session's customer_details,
  // which Stripe populates from the email field on the checkout page.
  if (!email && paymentIntent.id) {
    try {
      const { getStripe } = await import('@/lib/stripe')
      const sessions = await getStripe().checkout.sessions.list({ payment_intent: paymentIntent.id, limit: 1 })
      email = sessions.data[0]?.customer_details?.email || sessions.data[0]?.customer_email || undefined
    } catch (lookupErr) {
      console.error('[Payment Failed] Checkout session lookup failed:', lookupErr)
    }
  }
  const errorMsg = paymentIntent.last_payment_error?.message || 'Unknown error'
  console.log(`Payment failed for ${redact(email)}: ${errorMsg}`)

  // Log to analytics
  try {
    await logAnalyticsEvent('payment_failed', {
      email: redact(email),
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
  // Stripe-hosted recovery link (after_expiration.recovery enabled at session
  // creation) — re-opens the exact abandoned checkout, valid 30 days.
  const recoveryUrl = session.after_expiration?.recovery?.url || null

  console.log(`Checkout expired: ${redact(email)} — ${courseType} ($${amount})`)

  // Log to analytics
  try {
    await logAnalyticsEvent('checkout_expired', { courseType, amount }, email)
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
    // Fail-safe: if the dedup check itself failed we can't know whether this
    // person was already emailed in the last 24h — skip rather than risk a
    // duplicate recovery email.
    console.error('Failed to check abandoned checkout dedup — skipping send:', err)
    return
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
      const html = firstEmail.template(name, recoveryUrl || undefined)
        .replaceAll('{{unsubscribe_url}}', unsubscribeUrl)

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

    // Store with emails_sent = 1 (or max if unsubscribed, so cron skips entirely)
    const emailsSent = unsubscribed ? ABANDONED_CHECKOUT_SEQUENCE.length : 1
    await sql`ALTER TABLE abandoned_checkouts ADD COLUMN IF NOT EXISTS recovery_url TEXT`
    await sql`
      INSERT INTO abandoned_checkouts (email, name, course_type, amount, abandoned_at, emails_sent, recovered, recovery_url)
      VALUES (${email.toLowerCase()}, ${name}, ${courseType}, ${amount}, now(), ${emailsSent}, false, ${recoveryUrl})
    `
    console.log(`Stored abandoned checkout for ${redact(email)} (emails_sent: ${emailsSent})`)
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
      email: redact(email),
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

  // Work out WHAT was refunded. The Checkout Session metadata is the source
  // of truth for productType (reference-book / short-course / CCM course) —
  // PI metadata only carries courseType for CCM purchases.
  let courseType: string | undefined
  let productType: string | undefined
  let refundedCourseSlug: string | undefined
  try {
    const { getStripe } = await import('@/lib/stripe')
    if (charge.payment_intent && typeof charge.payment_intent === 'string') {
      const pi = await getStripe().paymentIntents.retrieve(charge.payment_intent)
      courseType = pi.metadata?.courseType
      const sessions = await getStripe().checkout.sessions.list({ payment_intent: charge.payment_intent, limit: 1 })
      const sessionMeta = sessions.data[0]?.metadata
      productType = sessionMeta?.productType
      refundedCourseSlug = sessionMeta?.courseSlug
      courseType = courseType || sessionMeta?.courseType
    }
  } catch { /* fallback to heuristic below */ }

  const chargeAmount = (charge.amount || 0) / 100

  // Reference-book refund → revoke the book flag (otherwise the $100 bundle
  // discount keeps applying via isBookOwner). Never touches course access.
  if (productType === 'reference-book') {
    try {
      await sql`
        UPDATE users SET reference_book_purchased_at = NULL WHERE LOWER(email) = ${email.toLowerCase()}
      `
      console.log(`Revoked reference-book ownership for ${redact(email)} after full refund ($${chargeAmount})`)
    } catch (err) {
      console.error(`Failed to revoke book ownership for ${redact(email)} after refund:`, err)
    }
    return
  }

  // Short-course refund → remove the course_purchases row and any
  // course-specific enrolment flag. Never touches CCM access.
  if (productType === 'short-course') {
    try {
      if (refundedCourseSlug) {
        await sql`
          DELETE FROM course_purchases
          WHERE user_email = ${email.toLowerCase()} AND course_slug = ${refundedCourseSlug}
        `
      }
      if (refundedCourseSlug === 'ai-in-clinical-practice') {
        await unenrolAiCourseUser(email)
      }
      console.log(`Revoked short-course access (${refundedCourseSlug || 'unknown slug'}) for ${redact(email)} after full refund ($${chargeAmount})`)
    } catch (err) {
      console.error(`Failed to revoke short-course access for ${redact(email)} after refund:`, err)
    }
    return
  }

  // CCM course refund — determine downgrade level: workshop-upgrade refunds
  // downgrade to online-only (user still has their original online course
  // purchase), all others to preview. Price heuristic as fallback when
  // metadata lookup failed.
  let downgradeLevel: 'preview' | 'online-only' = 'preview'
  const isWorkshopUpgradeRefund = courseType
    ? courseType === 'workshop-upgrade'
    : (user.accessLevel === 'full-course' && chargeAmount < 1000)
  if (isWorkshopUpgradeRefund) {
    downgradeLevel = 'online-only'
  }

  try {
    await sql`
      UPDATE users SET access_level = ${downgradeLevel} WHERE LOWER(email) = ${email.toLowerCase()}
    `
    console.log(`Downgraded ${redact(email)} to ${downgradeLevel} access after refund ($${chargeAmount})`)
  } catch (err) {
    console.error(`Failed to downgrade ${redact(email)} after refund:`, err)
  }
}

/**
 * SST subscription status change → clinic plan. 'active'/'trialing' keep the
 * clinic on the paid plan (no cap); anything else (cancelled, unpaid,
 * past_due, deleted) reverts to 'trial'. The trial gate only restricts
 * ADMITTING new patients — existing patients are never blocked, so a lapse
 * never severs care mid-episode.
 */
async function handleSstSubscriptionChange(sub: Stripe.Subscription) {
  if (sub.metadata?.product !== 'sst-trainer') return
  const clinicCode = sub.metadata?.clinicCode
  if (!clinicCode) {
    console.error('SST subscription change without clinicCode:', sub.id)
    return
  }
  const active = sub.status === 'active' || sub.status === 'trialing'
  await setSstClinicPlan(clinicCode, active ? 'active' : 'trial', {
    customerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
    subscriptionId: sub.id,
  })
  console.log(`SST clinic ${clinicCode} → ${active ? 'active' : 'trial'} (sub ${sub.status})`)
}
