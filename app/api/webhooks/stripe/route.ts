import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent, sstPlanPriceId } from '@/lib/stripe'
import { setSstClinicPlan, getSstClinicByEmail, getSstClinicStripeSubscription } from '@/lib/sst-trainer/clinic-registry'
import { provisionPlatformForBuyer } from '@/lib/sst-trainer/bundle'

export const maxDuration = 60
import { createUser, findUserByEmail, markBookPurchased } from '@/lib/users'
import { sendMagicLinkEmail, sendPostPurchaseLoginEmail, sendEmail, sendHubOwnerWelcomeEmail } from '@/lib/resend-client'
import { createCourseHub, redeemHubSeat, revokeHub, clampClinicianSeats, HUB_ADMIN_SEATS } from '@/lib/course-hub'
import { createMagicToken, NURTURE_TTL_MS } from '@/lib/magic-link-jwt'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { sql } from '@/lib/db'
import { CONFIG } from '@/lib/config'
import { escapeHtml } from '@/lib/resend-client'
import { ABANDONED_CHECKOUT_SEQUENCE } from '@/lib/email-sequences'
import { recordCoursePurchase } from '@/lib/course-purchases'
import { enrolUser as enrolAiCourseUser, unenrolUser as unenrolAiCourseUser } from '@/lib/ai-course/access'
import { findCourse } from '@/lib/ai-course/provider-catalogue'
import { CRM_COURSE_SLUG, CRM_PRACTICAL_SLUG, crmInvoiceDescription, type CrmTier } from '@/lib/crm-course'

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
/** Parse a JSON metadata string; fall back to the raw string on failure. */
function safeJson(s: string): unknown {
  try { return JSON.parse(s) } catch { return s }
}

/**
 * True when checkout-session / payment-intent metadata identifies a NON-CCM
 * product. The abandoned/failed-payment recovery emails are written for the
 * CCM flagship ("Concussion Management course", /pricing CTA, module count) —
 * sending that copy for an SST subscription, CRM, short-course, book or Hub
 * Pack checkout is the wrong product entirely, so those lanes skip.
 */
function isNonCcmProduct(md: Stripe.Metadata | Record<string, string> | null | undefined): boolean {
  if (!md) return false
  if (md.product === 'sst-trainer') return true
  if (md.stream === 'crm') return true
  if (md.courseType === 'clinic-hub-pack') return true
  const pt = md.productType
  return pt === 'crm-course' || pt === 'crm-upgrade' || pt === 'short-course' || pt === 'reference-book' || pt === 'clinic-hub-pack'
}

/**
 * Derive the in-person workshop city a buyer would most likely attend, from the
 * billing address Stripe collects at checkout (no extra checkout question — owner
 * directive: "just use that and populate them into the appropriate location
 * without asking"). AU state → nearest running workshop city slug; the exact
 * city name wins if it maps directly. Returns null for non-AU / unknown.
 */
function nearestWorkshopSlug(addr?: { city?: string | null; state?: string | null; country?: string | null } | null): string | null {
  if (!addr || (addr.country && addr.country.toUpperCase() !== 'AU')) return null
  const city = (addr.city || '').toLowerCase()
  if (city.includes('melbourne')) return 'melbourne'
  if (city.includes('sydney')) return 'sydney'
  if (city.includes('byron')) return 'byron-bay'
  if (city.includes('adelaide')) return 'adelaide'
  if (city.includes('perth')) return 'wa'
  const st = (addr.state || '').toUpperCase()
  const byState: Record<string, string> = {
    VIC: 'melbourne', TAS: 'melbourne',
    NSW: 'sydney', ACT: 'sydney',
    QLD: 'byron-bay',
    SA: 'adelaide', NT: 'adelaide',
    WA: 'wa',
  }
  return byState[st] ?? null
}

async function logAnalyticsEvent(
  eventType: string,
  eventData: Record<string, unknown>,
  userEmail?: string | null,
  // Client attribution carried through Stripe metadata. When present, the event
  // uses the CLIENT session id (so a purchase JOINs to its browsing page views)
  // and the first referrer — instead of a detached `server_…` id + null referrer.
  attribution?: { sessionId?: string | null; referrer?: string | null },
) {
  try {
    const normalisedEmail = userEmail ? userEmail.toLowerCase().trim() : null
    const sessionId = attribution?.sessionId?.trim() || 'server_' + Date.now()
    const referrer = attribution?.referrer?.trim() || null
    await sql`
      INSERT INTO analytics_events (event_type, event_data, session_id, timestamp_ms, user_agent, referrer, path, search, ip, country, user_email)
      VALUES (
        ${eventType},
        ${JSON.stringify(eventData)}::jsonb,
        ${sessionId},
        ${Date.now()},
        ${'stripe-webhook'},
        ${referrer},
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

      // A dispute is treated like a full refund for entitlement purposes (the
      // money is already clawed back) PLUS an ACTION-REQUIRED alert — disputes
      // have response deadlines. Idempotent via processed_webhook_events above.
      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute)
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
  // EXCEPTION: a subscription checkout completed with a 100%-off promo code
  // arrives as 'no_payment_required' — that IS a live subscription (bills from
  // the next cycle); skipping it left the clinic capped while paying
  // (2026-08-05 sweep #4). The BNPL guard is a one-time-payment concern.
  const zeroDueSubscription =
    session.payment_status === 'no_payment_required' && session.mode === 'subscription'
  if (session.payment_status !== 'paid' && !zeroDueSubscription) {
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
        tier: session.metadata?.plan,
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

  // CRM (Concussion Rehab Mastery, EP stream) purchase — grants the CRM
  // entitlement (course_purchases), NOT any CCM access_level. Isolated fulfilment:
  // CRM-specific invoice + /ep-course welcome. Returns early.
  if (session.metadata?.productType === 'crm-course' || session.metadata?.productType === 'crm-upgrade') {
    await handleCrmPurchase(session, customerEmail, customerName)
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
    } else if (existingUser.accessLevel === 'full-course' && accessLevel === 'full-course') {
      // REPEAT Complete/workshop purchase (e.g. attending another round).
      // Access is already maximal, but the NEW nomination and the sale itself
      // must still count: move the buyer to the newly nominated city and record
      // the purchase so the round threshold + admin revenue views see it.
      try {
        if (workshopCity) {
          await sql`UPDATE users SET workshop_location = ${workshopCity} WHERE LOWER(email) = ${customerEmail.toLowerCase()}`
        }
        await recordCoursePurchase({
          email: customerEmail,
          courseSlug: `ccm-complete-repeat-${session.id.slice(-8)}`,
          stripeSessionId: session.id,
          amountAud: (session.amount_total || 0) / 100,
        })
        console.log(`Repeat full-course purchase recorded for ${redact(customerEmail)}${workshopCity ? ` — nominated ${workshopCity}` : ''}`)
      } catch (err) {
        console.error(`Failed to record repeat purchase for ${redact(customerEmail)}:`, err)
      }
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

  // Record EVERY CCM purchase in course_purchases at fulfilment (2026-08-05
  // sweep #7). The hub-refund member-downgrade guard keys on this table
  // ("NOT EXISTS course_purchases" = hub was their only entitlement), so a
  // member who bought CCM independently was only protected if that purchase
  // left a row — and until now, none did. Slug per courseType; idempotent on
  // (email, slug) via recordCoursePurchase's ON CONFLICT upsert. The repeat
  // full-course path above records its own per-session slug — skip it here
  // so revenue sums over course_purchases don't double-count that sale.
  const isRepeatComplete =
    existingUser?.accessLevel === 'full-course' && accessLevel === 'full-course'
  if (!isRepeatComplete) {
    try {
      await recordCoursePurchase({
        email: customerEmail,
        courseSlug: accessLevel === 'full-course' ? 'ccm-complete' : 'ccm-online',
        stripeSessionId: session.id,
        amountAud: Math.round((session.amount_total || 0) / 100),
      })
    } catch (err) {
      // Best-effort: access_level is already provisioned above — never fail
      // the fulfilment (and trigger endless Stripe retries) over the ledger.
      console.error(`Failed to record CCM purchase for ${redact(customerEmail)}:`, err)
    }
  }

  // Mark any abandoned checkouts for this email as recovered
  try {
    await sql`UPDATE abandoned_checkouts SET recovered = true WHERE email = ${customerEmail.toLowerCase()} AND recovered = false`
  } catch (err) {
    console.error('Failed to mark abandoned checkouts as recovered:', err)
  }

  // Bundle: CCM enrolment includes the working clinical platform (SST Trainer +
  // Baseline). Provision it for online-only / full-course buyers.
  //
  // Gated on CCM_PLATFORM_BUNDLE_LIVE — its OWN flag since 2026-07-26. This used
  // to hang off CRM_INTERNATIONAL_LIVE, so the homepage promise on the flagship
  // product was withheld by a switch named for an unrelated market.
  //
  // Best-effort — a provisioning hiccup must never lose the sale or cause
  // endless Stripe retries; it can NEVER downgrade access.
  if (
    CONFIG.FEATURES.CCM_PLATFORM_BUNDLE_LIVE &&
    (accessLevel === 'online-only' || accessLevel === 'full-course')
  ) {
    await provisionPlatformBestEffort(customerEmail, customerName, `CCM ${courseType}`)
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
    const md = session.metadata ?? {}
    // Where would this buyer attend in person? Derived silently from the
    // billing address Stripe already collects — no extra checkout question.
    // Feeds the Ready-to-Train city-demand view; explicit workshop nominations
    // (full-course `location`) still win when present.
    const billing = session.customer_details?.address
    const likelyWorkshopCity = workshopCity || nearestWorkshopSlug(billing)
    await logAnalyticsEvent(
      'purchase_complete',
      {
        courseType,
        amount: purchaseAmount,
        currency,
        transactionId: session.id,
        accessLevel,
        // In-person city demand: nominated city if they picked one, else the
        // nearest workshop city inferred from their billing address.
        likelyWorkshopCity: likelyWorkshopCity || null,
        buyerCity: billing?.city || null,
        buyerState: billing?.state || null,
        buyerCountry: billing?.country || null,
        // Attribution stamped so the sale is self-describing, not inferred:
        firstReferrer: md.attr_first_ref || null,
        referrer: md.attr_ref || null,
        firstUtm: md.attr_first_utm ? safeJson(md.attr_first_utm) : null,
        utmSource: md.utm_source || null,
        utmMedium: md.utm_medium || null,
        utmCampaign: md.utm_campaign || null,
      },
      customerEmail,
      // Client session id + first referrer → the purchase row JOINs to the
      // browsing session and carries where they actually came from.
      { sessionId: md.attr_session || null, referrer: md.attr_first_ref || md.attr_ref || null },
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
    // 7-day TTL (not the 24h transactional default) — purchasers don't always
    // open the welcome email same-day, and an expired link dead-ends them.
    const token = createMagicToken(freshUser?.id || userId, customerEmail, userName, finalAccess, NURTURE_TTL_MS)
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
 * CRM (Concussion Rehab Mastery — EP stream) purchase. Watertight from CCM:
 * grants the CRM entitlement in course_purchases ('crm' unlocks /ep-course
 * content; 'crm-practical' = attends the SHARED CCM/CRM workshop), records the
 * nominated city, fires the purchase analytics with stream='crm', attaches a
 * CRM-SPECIFIC tax invoice, and sends the /ep-course welcome. Never touches
 * users.access_level (that's CCM). Fulfilment failures rethrow so Stripe retries.
 */
async function handleCrmPurchase(
  session: Stripe.Checkout.Session,
  customerEmail: string,
  customerName: string,
) {
  const tier = (session.metadata?.tier || 'online') as CrmTier
  const location = session.metadata?.location || ''
  const currency = (session.currency || 'aud').toUpperCase()
  const amountCents = session.amount_total || 0
  const amountAud = amountCents / 100

  // Ensure the user exists. accessLevel 'preview' can only ever UPGRADE-guard —
  // it never downgrades an existing CCM online-only/full-course user (see
  // createUser ON CONFLICT). workshopLocation records the nominated city.
  const existing = await findUserByEmail(customerEmail)
  const userId = existing
    ? existing.id
    : await createUser({
        email: customerEmail,
        name: customerName,
        accessLevel: 'preview',
        stripeCustomerId: typeof session.customer === 'string' ? session.customer : undefined,
        workshopLocation: location || undefined,
        signupSource: 'ep-course',
      })
  // Existing user: still capture the nominated city. createUser's COALESCE
  // prefers the NEW value (EXCLUDED first), so the latest nomination wins —
  // which is what we want for a fresh purchase.
  if (existing && location) {
    await createUser({ email: customerEmail, name: customerName, accessLevel: existing.accessLevel, workshopLocation: location, signupSource: 'ep-course' })
  }

  // Entitlements — rethrow on failure so Stripe retries (buyer must not be left
  // paid-without-access). online/complete grant the content course; complete/
  // upgrade add the shared practical-day nomination.
  try {
    if (tier === 'online' || tier === 'complete') {
      await recordCoursePurchase({ email: customerEmail, courseSlug: CRM_COURSE_SLUG, stripeSessionId: session.id, amountAud })
    }
    if (tier === 'complete' || tier === 'upgrade') {
      // 'complete' is ONE charge recorded on TWO slugs; the full amount lives on
      // the CRM_COURSE_SLUG row above, so the practical row records $0 — any
      // revenue sum over course_purchases would otherwise double-count it.
      await recordCoursePurchase({ email: customerEmail, courseSlug: CRM_PRACTICAL_SLUG, stripeSessionId: session.id, amountAud: tier === 'complete' ? 0 : amountAud })
    }
  } catch (err) {
    console.error(`[crm] entitlement write failed for ${redact(customerEmail)} (${tier}):`, err)
    try {
      await sendEmail({
        to: CONFIG.CONTACT_EMAIL,
        subject: `ACTION REQUIRED: CRM fulfilment failed for ${redact(customerEmail)}`,
        html: `<p>A customer paid for CRM (${escapeHtml(tier)}) but the <strong>entitlement write failed</strong> — no /ep-course access yet.</p><p><strong>Email:</strong> ${escapeHtml(customerEmail)}<br><strong>Amount:</strong> ${escapeHtml(currency)} $${amountAud.toFixed(2)}<br><strong>Session:</strong> <code>${escapeHtml(session.id)}</code></p><p>Error: ${escapeHtml(err instanceof Error ? err.message : String(err))}</p><p>Stripe will retry the webhook automatically.</p>`,
      })
    } catch (alertErr) { console.error('[crm] admin alert failed:', alertErr) }
    throw err
  }

  try {
    await sql`UPDATE abandoned_checkouts SET recovered = true WHERE email = ${customerEmail.toLowerCase()} AND recovered = false`
  } catch (err) {
    console.error('[crm] abandoned-checkout recover failed:', err)
  }

  // Bundle: every CRM enrolment includes the working clinical platform (SST
  // Trainer + Baseline). Provision it. UNGATED: a CRM purchase can only ever
  // exist once a CRM checkout route is deliberately switched on, and CRM buyers
  // are explicitly promised the platform ("the platform is the product").
  //
  // INTERNATIONAL only (gated on international:'true' AND the go-live flag): the
  // platform is bundled FREE for year 1, then bills MONTHLY at the real single-
  // clinician SST price (A$49/mo). We attach a REAL sst-trainer subscription with
  // a 365-day trial so monthly billing starts automatically at year 2 — managed
  // by the EXISTING sst-trainer subscription webhook handling. Resolve the Stripe
  // customer + saved card here and hand them to the provisioner (which owns the
  // clinic code the subscription is keyed to). Best-effort — never lose the sale.
  let bundledSubscription: { customerId: string; defaultPaymentMethod?: string } | undefined
  if (session.metadata?.international === 'true' && CONFIG.FEATURES.CRM_INTERNATIONAL_LIVE) {
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
    if (customerId) {
      let defaultPaymentMethod: string | undefined
      try {
        const { getStripe } = await import('@/lib/stripe')
        const piId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
        if (piId) {
          const pi = await getStripe().paymentIntents.retrieve(piId)
          defaultPaymentMethod = typeof pi.payment_method === 'string' ? pi.payment_method : pi.payment_method?.id
        }
      } catch (pmErr) {
        console.error(`[crm-intl] payment-method lookup failed for ${redact(customerEmail)} (year-2 monthly billing will need a PM):`, pmErr)
      }
      bundledSubscription = { customerId, defaultPaymentMethod }
    } else {
      console.error(`[crm-intl] no Stripe customer on international CRM session ${session.id} — cannot attach the bundled SST subscription`)
    }
  }
  await provisionPlatformBestEffort(customerEmail, customerName, `CRM ${tier}`, bundledSubscription)

  // Analytics — same purchase_complete event the CCM path fires, marked
  // stream='crm' + the nominated city so EP demand shows in Ready-to-Train and
  // per-sequence attribution works. (Owner: "populate in analytics".)
  try {
    const md = session.metadata ?? {}
    const billing = session.customer_details?.address
    const likelyWorkshopCity = location || nearestWorkshopSlug(billing)
    await logAnalyticsEvent(
      'purchase_complete',
      {
        stream: 'crm',
        courseType: `crm-${tier}`,
        tier,
        amount: amountAud,
        currency,
        transactionId: session.id,
        accessLevel: 'crm',
        likelyWorkshopCity: likelyWorkshopCity || null,
        buyerCity: billing?.city || null,
        buyerState: billing?.state || null,
        buyerCountry: billing?.country || null,
        firstReferrer: md.attr_first_ref || null,
        referrer: md.attr_ref || null,
        firstUtm: md.attr_first_utm ? safeJson(md.attr_first_utm) : null,
        utmSource: md.utm_source || null,
        utmMedium: md.utm_medium || null,
        utmCampaign: md.utm_campaign || null,
      },
      customerEmail,
      { sessionId: md.attr_session || null, referrer: md.attr_first_ref || md.attr_ref || null },
    )
  } catch (err) {
    console.error('[crm] analytics log failed:', err)
  }

  try {
    const { trackServerPurchase } = await import('@/lib/measurement-protocol')
    await trackServerPurchase(session.id, amountAud, currency, customerEmail)
  } catch (err) {
    console.error('[crm] server-side conversion failed:', err)
  }

  // CRM-SPECIFIC tax invoice — the line item names Concussion Rehab Mastery, the
  // tier and city, so it matches the buyer's own tax records (owner directive).
  let crmInvoice: { filename: string; content: Buffer } | undefined
  try {
    const { generateTaxInvoicePdf, invoiceNumberFromSession } = await import('@/lib/tax-invoice')
    const issueDate = new Date()
    const invNumber = invoiceNumberFromSession(session.id, issueDate)
    const pdf = generateTaxInvoicePdf({
      invoiceNumber: invNumber,
      issueDate,
      buyer: { name: customerName, email: customerEmail },
      lineItems: [{
        description: crmInvoiceDescription(tier, location || undefined),
        quantity: 1,
        unitPriceCents: amountCents,
        totalCents: amountCents,
      }],
      totalCents: amountCents,
      currency,
      paidAt: issueDate,
      paymentReference: session.id,
    })
    crmInvoice = { filename: `${invNumber}.pdf`, content: pdf }
  } catch (invErr) {
    console.error(`[crm] invoice PDF generation failed for ${redact(customerEmail)}:`, invErr)
  }

  // Welcome + magic link into the EP course.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || CONFIG.SEO.SITE_URL || 'https://portal.concussion-education-australia.com'
  const token = createMagicToken(userId, customerEmail, customerName, (existing?.accessLevel || 'preview') as 'preview' | 'online-only' | 'full-course')
  const loginUrl = `${baseUrl}/api/auth/verify?token=${token}&utm_source=email&utm_medium=email&utm_campaign=crm_purchase&redirect=${encodeURIComponent('/ep-course/dashboard')}`
  const tierLabel = tier === 'online' ? 'Online course' : tier === 'complete' ? 'Complete (online + practical day)' : 'Practical Day upgrade'
  try {
    await sendEmail({
      to: customerEmail,
      subject: `You're enrolled — Concussion Rehab Mastery`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1e293b;">
          <div style="height: 4px; background: linear-gradient(90deg, #0d9488, #0ea5e9); border-radius: 2px; margin-bottom: 24px;"></div>
          <h2 style="margin: 0 0 12px; font-size: 22px; color: #0f172a;">You're in, ${escapeHtml(customerName.split(' ')[0] || 'there')}.</h2>
          <p style="margin: 0 0 14px; font-size: 15px;"><strong>Concussion Rehab Mastery</strong> — ${escapeHtml(tierLabel)}${location ? ` · workshop city: ${escapeHtml(location)}` : ''}.</p>
          <p style="text-align: center; margin: 24px 0;">
            <a href="${loginUrl}" style="display: inline-block; padding: 14px 28px; background: #0d9488; color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">Open the course →</a>
          </p>
          <div style="background: #f0fdfa; border-left: 3px solid #0d9488; padding: 14px 16px; margin: 20px 0; border-radius: 6px; font-size: 14px;">
            <strong>What you paid:</strong> ${escapeHtml(currency)} $${amountAud.toFixed(2)}<br>
            <strong>Order ref:</strong> <code style="font-size: 12px;">${escapeHtml(session.id)}</code>${crmInvoice ? '<br><strong>Tax invoice:</strong> attached to this email' : ''}
          </div>
          <p style="margin: 14px 0 0; font-size: 14px; color: #475569;">Questions — just reply to this email.</p>
          <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">Zac Lewis<br>Concussion Education Australia</div>
        </div>
      `,
      tags: [
        { name: 'type', value: 'crm-purchase' },
        { name: 'tier', value: tier },
      ],
      ...(crmInvoice ? { attachments: [crmInvoice] } : {}),
    })
  } catch (emailErr) {
    console.error(`[crm] welcome email failed for ${redact(customerEmail)}:`, emailErr)
  }

  // Admin ping.
  try {
    await sendEmail({
      to: CONFIG.CONTACT_EMAIL,
      subject: `New sale: Concussion Rehab Mastery (${tierLabel})${location ? ` · ${location}` : ''} — ${currency} $${amountAud.toFixed(2)}`,
      html: `<p><strong>New CRM (EP stream) sale.</strong></p><ul><li><strong>Customer:</strong> ${escapeHtml(customerEmail)} (${escapeHtml(customerName)})</li><li><strong>Tier:</strong> ${escapeHtml(tierLabel)}</li>${location ? `<li><strong>Workshop city:</strong> ${escapeHtml(location)}</li>` : ''}<li><strong>Amount:</strong> ${escapeHtml(currency)} $${amountAud.toFixed(2)}</li><li><strong>Session:</strong> <code>${escapeHtml(session.id)}</code></li></ul>`,
      tags: [{ name: 'type', value: 'admin-crm-sale' }],
    })
  } catch (adminErr) {
    console.error('[crm] admin ping failed:', adminErr)
  }

  console.log(`[crm] Provisioned ${redact(customerEmail)} — ${tier}${location ? ` (${location})` : ''} — $${amountAud} ${currency}`)
}

/**
 * PIECE 2 wrapper — provision the bundled platform best-effort. On failure it
 * alerts the admin and RETURNS (never throws): a provisioning hiccup must not
 * lose the sale or trigger endless Stripe retries. `context` is a short label
 * for the logs/alert (e.g. "CRM online", "CCM full-course").
 */
async function provisionPlatformBestEffort(
  email: string,
  name: string,
  context: string,
  bundledSubscription?: { customerId: string; defaultPaymentMethod?: string },
): Promise<void> {
  try {
    const code = await provisionPlatformForBuyer(email, name, bundledSubscription)
    console.log(`[bundle] platform provisioned for ${redact(email)} (${context}) — clinic ${code}`)
  } catch (err) {
    console.error(`[bundle] platform provisioning failed for ${redact(email)} (${context}):`, err)
    try {
      await sendEmail({
        to: CONFIG.CONTACT_EMAIL,
        subject: `ACTION REQUIRED: platform provisioning failed for ${redact(email)} (${context})`,
        html: `<p>A customer paid but the <strong>bundled SST Trainer + Baseline platform provisioning failed</strong> — the course entitlement is fine, but they have no clinic code yet.</p><p><strong>Email:</strong> ${escapeHtml(email)}<br><strong>Context:</strong> ${escapeHtml(context)}</p><p>Error: ${escapeHtml(err instanceof Error ? err.message : String(err))}</p><p>Provision manually via the founding/clinical-testing flow, or retry. The sale is NOT at risk and Stripe will NOT retry.</p>`,
      })
    } catch (alertErr) {
      console.error('[bundle] provisioning admin alert failed:', alertErr)
    }
  }
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
  // which Stripe populates from the email field on the checkout page. The
  // session metadata also identifies the product (the PI often carries none),
  // so fetch it even when we already have an email.
  let sessionMeta: Stripe.Metadata | null = null
  if (paymentIntent.id) {
    try {
      const { getStripe } = await import('@/lib/stripe')
      const sessions = await getStripe().checkout.sessions.list({ payment_intent: paymentIntent.id, limit: 1 })
      sessionMeta = sessions.data[0]?.metadata ?? null
      if (!email) {
        email = sessions.data[0]?.customer_details?.email || sessions.data[0]?.customer_email || undefined
      }
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

  // Non-CCM products get no recovery email — the copy is CCM-specific.
  if (isNonCcmProduct(paymentIntent.metadata) || isNonCcmProduct(sessionMeta)) {
    console.log(`[Payment Failed] Skipping recovery email for non-CCM payment ${paymentIntent.id}`)
    return
  }

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

  // Non-CCM products get no recovery sequence — the copy is CCM-specific.
  if (isNonCcmProduct(session.metadata)) {
    console.log(`Skipping abandoned-checkout recovery for non-CCM session ${session.id} (${session.metadata?.productType || session.metadata?.product || session.metadata?.courseType})`)
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

  await revokeEntitlementsForCharge(charge, email, 'refund')
}

/**
 * Shared revocation core for FULL refunds and disputes: works out what product
 * the charge paid for (Checkout Session metadata is the source of truth —
 * PI metadata only carries courseType for CCM purchases) and revokes exactly
 * that entitlement. `cause` is only for log lines.
 */
async function revokeEntitlementsForCharge(charge: Stripe.Charge, email: string, cause: 'refund' | 'dispute') {
  let courseType: string | undefined
  let productType: string | undefined
  let refundedCourseSlug: string | undefined
  let refundedTier: string | undefined
  let chargeSessionId: string | undefined
  try {
    const { getStripe } = await import('@/lib/stripe')
    if (charge.payment_intent && typeof charge.payment_intent === 'string') {
      const pi = await getStripe().paymentIntents.retrieve(charge.payment_intent)
      courseType = pi.metadata?.courseType
      const sessions = await getStripe().checkout.sessions.list({ payment_intent: charge.payment_intent, limit: 1 })
      const sessionMeta = sessions.data[0]?.metadata
      chargeSessionId = sessions.data[0]?.id
      productType = sessionMeta?.productType
      refundedCourseSlug = sessionMeta?.courseSlug
      refundedTier = sessionMeta?.tier
      courseType = courseType || sessionMeta?.courseType
    }
  } catch { /* fallback to heuristic below */ }

  // Hub Pack refund/dispute → revoke the hub key (no further redemptions) and
  // downgrade the members whose ONLY entitlement is that hub. Redemption
  // provisions members via createUser with signupSource 'purchase' and NO
  // stripe_customer_id, so "bought something independently" is detectable as a
  // non-null stripe_customer_id that isn't this charge's customer — those
  // accounts are left alone (conservative: never claw back an independent
  // purchase). Members seated by ANOTHER un-revoked hub also keep access.
  if (courseType === 'clinic-hub-pack' || productType === 'clinic-hub-pack') {
    try {
      const hub = chargeSessionId ? await revokeHub({ stripeSessionId: chargeSessionId }) : null
      if (!hub) {
        console.error(`[hub-pack] ${cause} for ${redact(email)} but no un-revoked hub matched session ${chargeSessionId || 'unknown'} — check manually`)
        return
      }
      const chargeCustomerId = typeof charge.customer === 'string' ? charge.customer : charge.customer?.id ?? null
      const { rows: downgraded } = await sql<{ email: string }>`
        UPDATE users SET access_level = CASE
            -- Downgrade FLOOR (2026-08-05 sweep #7): a member whose own CCM
            -- purchase was online-only loses only the hub's full-course
            -- lift — they drop to the tier they personally paid for, never
            -- to 'preview'.
            WHEN EXISTS (
              SELECT 1 FROM course_purchases cp
              WHERE LOWER(cp.user_email) = LOWER(users.email) AND cp.course_slug = 'ccm-online'
            ) THEN 'online-only'
            ELSE 'preview'
          END
        WHERE LOWER(email) IN (SELECT email FROM course_hub_members WHERE hub_code = ${hub.code})
          AND access_level = 'full-course'
          AND (stripe_customer_id IS NULL OR stripe_customer_id = ${chargeCustomerId})
          AND NOT EXISTS (
            SELECT 1 FROM course_hub_members m2
            JOIN course_hubs h2 ON h2.code = m2.hub_code
            WHERE m2.email = LOWER(users.email) AND m2.hub_code <> ${hub.code} AND h2.revoked_at IS NULL
          )
          -- Guest one-time CCM buyers have NULL stripe_customer_id, so a
          -- member who bought the course independently would be swept by the
          -- provenance guard alone (2026-08-05 round-D F3): any independent
          -- purchase record OTHER than a lone 'ccm-online' keeps their
          -- full access untouched ('ccm-complete', repeat-round slugs, CRM,
          -- short courses — all conservative keeps); an own 'ccm-online'
          -- purchase instead floors the downgrade at 'online-only' above.
          AND NOT EXISTS (
            SELECT 1 FROM course_purchases cp
            WHERE LOWER(cp.user_email) = LOWER(users.email) AND cp.course_slug <> 'ccm-online'
          )
        RETURNING email
      `
      console.log(`[hub-pack] Revoked hub ${hub.code} after ${cause} for ${redact(email)} — downgraded ${downgraded.length} member account(s)`)
    } catch (err) {
      console.error(`[hub-pack] Failed to revoke hub after ${cause} for ${redact(email)}:`, err)
      try {
        await sendEmail({
          to: CONFIG.CONTACT_EMAIL,
          subject: `ACTION: hub revocation FAILED after ${cause}`,
          html: `<p style="margin:0;">Revoking the hub for ${escapeHtml(email)} (charge ${charge.id}) failed — revoke manually. Error logged server-side.</p>`,
          tags: [{ name: 'type', value: 'revocation-failed' }],
        })
      } catch { /* best-effort */ }
    }
    return
  }

  // CRM refund → remove the CRM entitlement. crm-course full refund revokes the
  // online course (and the practical add-on if it was the complete bundle);
  // a crm-upgrade refund removes only the practical day (they keep online).
  // Never touches CCM access_level.
  if (productType === 'crm-course' || productType === 'crm-upgrade') {
    try {
      if (productType === 'crm-upgrade') {
        await sql`DELETE FROM course_purchases WHERE user_email = ${email.toLowerCase()} AND course_slug = ${CRM_PRACTICAL_SLUG}`
      } else {
        await sql`DELETE FROM course_purchases WHERE user_email = ${email.toLowerCase()} AND course_slug IN (${CRM_COURSE_SLUG}, ${CRM_PRACTICAL_SLUG})`
      }
      console.log(`Revoked CRM entitlement (${productType}${refundedTier ? `/${refundedTier}` : ''}) for ${redact(email)} after full ${cause}`)
    } catch (err) {
      console.error(`Failed to revoke CRM entitlement for ${redact(email)} after ${cause}:`, err)
    }
    // crm-course refund also unwinds the bundled platform: cancel any live SST
    // subscription and drop the clinic back to trial. (A crm-upgrade refund
    // leaves the online course — and its platform bundle — in place.)
    if (productType === 'crm-course') {
      try {
        const clinic = await getSstClinicByEmail(email)
        // OWNER-only: getSstClinicByEmail's member fallback resolves a seated
        // practitioner to their EMPLOYER's clinic — a personal CRM refund must
        // never cancel someone else's subscription (2026-08-05 round-D F1).
        if (clinic && clinic.email.toLowerCase() === email.toLowerCase()) {
          const subId = await getSstClinicStripeSubscription(clinic.code)
          if (subId) {
            try {
              const { getStripe } = await import('@/lib/stripe')
              // Cancel ONLY the CRM-attached bundle sub — a self-serve tier
              // subscription the clinic pays for independently stays live.
              const sub = await getStripe().subscriptions.retrieve(subId)
              if (sub.metadata?.source === 'crm-international-bundle') {
                await getStripe().subscriptions.cancel(subId)
                await setSstClinicPlan(clinic.code, 'trial')
                console.log(`[crm] Cancelled bundled SST subscription ${subId} for clinic ${clinic.code} after ${cause}`)
              } else {
                console.log(`[crm] Clinic ${clinic.code} subscription ${subId} is not the CRM bundle — left untouched after ${cause}`)
              }
            } catch (subErr) {
              console.error(`[crm] Failed to cancel SST subscription ${subId} after ${cause}:`, subErr)
            }
          } else if (clinic.tier === 'single') {
            // No subscription + tier 'single': the CRM bundle's comp access
            // rides on plan alone — bundle.ts ALWAYS stamps tier 'single'
            // when it activates a clinic, so this provenance is safe to
            // unwind (2026-08-05 sweep #17).
            await setSstClinicPlan(clinic.code, 'trial')
            console.log(`[crm] Re-capped bundle-comp clinic ${clinic.code} after ${cause}`)
          } else {
            // No subscription and tier is null (or a non-bundle tier): comp /
            // alumni / manual grants look exactly like this — a personal CRM
            // refund must NOT claw back an entitlement the bundle never set.
            console.log(`[crm] Clinic ${clinic.code} plan is not CRM-bundle provenance (tier=${clinic.tier ?? 'null'}, no subscription) — left untouched after ${cause}`)
          }
        }
      } catch (err) {
        console.error(`[crm] Failed to unwind bundled platform for ${redact(email)} after ${cause}:`, err)
        try {
          await sendEmail({
            to: CONFIG.CONTACT_EMAIL,
            subject: `ACTION: CRM platform unwind FAILED after ${cause}`,
            html: `<p style="margin:0;">Unwinding the bundled SST platform for ${escapeHtml(email)} (charge ${charge.id}) failed — cancel the bundle subscription / re-cap the clinic manually.</p>`,
            tags: [{ name: 'type', value: 'revocation-failed' }],
          })
        } catch { /* best-effort */ }
      }
    }
    return
  }

  const chargeAmount = (charge.amount || 0) / 100

  // Reference-book refund → revoke the book flag (otherwise the $100 bundle
  // discount keeps applying via isBookOwner). Never touches course access.
  if (productType === 'reference-book') {
    try {
      await sql`
        UPDATE users SET reference_book_purchased_at = NULL WHERE LOWER(email) = ${email.toLowerCase()}
      `
      console.log(`Revoked reference-book ownership for ${redact(email)} after full ${cause} ($${chargeAmount})`)
    } catch (err) {
      console.error(`Failed to revoke book ownership for ${redact(email)} after ${cause}:`, err)
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
      console.log(`Revoked short-course access (${refundedCourseSlug || 'unknown slug'}) for ${redact(email)} after full ${cause} ($${chargeAmount})`)
    } catch (err) {
      console.error(`Failed to revoke short-course access for ${redact(email)} after ${cause}:`, err)
    }
    return
  }

  const user = await findUserByEmail(email)
  if (!user) {
    console.log(`Refunded user not found: ${redact(email)}`)
    return
  }

  // UNATTRIBUTABLE charges must not fall through to a CCM downgrade
  // (2026-08-05 round-D F2): a subscription-INVOICE charge (e.g. an SST
  // renewal) carries no checkout metadata — an alumni owner disputing $49
  // was getting their full-course access cut. Subscription lifecycle is
  // handled by the subscription webhooks; anything else unattributed goes
  // to the owner for a manual decision.
  if (!courseType) {
    // (Charge.invoice was removed from the pinned Stripe API version, so
    // subscription-renewal refunds can't be short-circuited here — they land
    // in this manual-alert path deliberately: no access is touched, the
    // owner decides.)
    try {
      await sendEmail({
        to: CONFIG.CONTACT_EMAIL,
        subject: `ACTION: unattributed ${cause} — revoke manually if needed`,
        html: `<p style="margin:0 0 1em 0;">A ${cause} on charge ${charge.id} ($${(charge.amount || 0) / 100} ${charge.currency}) for ${escapeHtml(email)} could not be attributed to a product (no checkout metadata). No access was changed — review and revoke manually if warranted.</p>`,
        tags: [{ name: 'type', value: 'revocation-unattributed' }],
      })
    } catch { /* alert best-effort */ }
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
    console.log(`Downgraded ${redact(email)} to ${downgradeLevel} access after ${cause} ($${chargeAmount})`)
  } catch (err) {
    console.error(`Failed to downgrade ${redact(email)} after ${cause}:`, err)
    try {
      await sendEmail({
        to: CONFIG.CONTACT_EMAIL,
        subject: `ACTION: access downgrade FAILED after ${cause}`,
        html: `<p style="margin:0;">Downgrading ${escapeHtml(email)} to ${downgradeLevel} after ${cause} (charge ${charge.id}) failed — apply manually.</p>`,
        tags: [{ name: 'type', value: 'revocation-failed' }],
      })
    } catch { /* best-effort */ }
  }
}

/**
 * charge.dispute.created — the money is already withheld, so entitlements are
 * revoked through the SAME logic as a full refund of the matched product, and
 * the admin gets an ACTION-REQUIRED alert (disputes have evidence deadlines).
 * Idempotent via the event-id idempotency in POST; revokeHub itself is also
 * idempotent, so a dispute after a refund is a safe no-op.
 */
async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id
  if (!chargeId) {
    console.error('Dispute with no charge id:', dispute.id)
    return
  }

  let charge: Stripe.Charge
  try {
    const { getStripe } = await import('@/lib/stripe')
    charge = await getStripe().charges.retrieve(chargeId)
  } catch (err) {
    console.error(`Failed to retrieve disputed charge ${chargeId}:`, err)
    throw err // 500 → Stripe retries; a dispute must never be silently dropped
  }

  const email = charge.receipt_email || charge.billing_details?.email
  const amount = (dispute.amount || charge.amount || 0) / 100
  const currency = (dispute.currency || charge.currency || 'aud').toUpperCase()
  console.log(`Dispute ${dispute.id} (${dispute.reason}) on charge ${chargeId} — $${amount} ${currency} — ${redact(email)}`)

  try {
    await logAnalyticsEvent('charge_disputed', {
      disputeId: dispute.id,
      chargeId,
      reason: dispute.reason,
      amount,
      currency,
      email: redact(email),
    }, email)
  } catch (err) {
    console.error('Failed to log dispute analytics:', err)
  }

  if (email) {
    await revokeEntitlementsForCharge(charge, email, 'dispute')
  } else {
    console.error(`Disputed charge ${chargeId} has no email — entitlements NOT revoked automatically`)
  }

  // ACTION-REQUIRED alert — this is the one Stripe event with a response
  // deadline attached. Alert failure rethrows so Stripe retries the event.
  try {
    const customerId = typeof charge.customer === 'string' ? charge.customer : charge.customer?.id
    const dueBy = dispute.evidence_details?.due_by
      ? new Date(dispute.evidence_details.due_by * 1000).toISOString().slice(0, 10)
      : 'unknown'
    await sendEmail({
      to: CONFIG.CONTACT_EMAIL,
      subject: `ACTION REQUIRED: payment dispute — ${currency} $${amount.toFixed(2)} (${dispute.reason})`,
      html: `
        <p><strong>A customer has disputed a charge.</strong> Entitlement revocation was attempted (check for ACTION follow-up emails if any step failed) (same as a full refund); respond in the Stripe dashboard before the deadline.</p>
        <ul>
          <li><strong>Customer:</strong> ${escapeHtml(email || 'unknown')}${charge.billing_details?.name ? ` (${escapeHtml(charge.billing_details.name)})` : ''}</li>
          <li><strong>Amount:</strong> ${escapeHtml(currency)} $${amount.toFixed(2)}</li>
          <li><strong>Reason:</strong> ${escapeHtml(dispute.reason || 'unknown')}</li>
          <li><strong>Evidence due:</strong> ${escapeHtml(dueBy)}</li>
          <li><strong>Charge:</strong> <code>${escapeHtml(chargeId)}</code></li>
          <li><strong>Stripe customer:</strong> <code>${escapeHtml(customerId || '—')}</code></li>
          <li><strong>Dispute:</strong> <code>${escapeHtml(dispute.id)}</code></li>
        </ul>
      `,
      tags: [{ name: 'type', value: 'admin-dispute-alert' }],
    })
  } catch (alertErr) {
    console.error('Dispute admin alert failed:', alertErr)
    throw alertErr
  }
}

/**
 * SST subscription status change → clinic plan. 'active'/'trialing'/'past_due'
 * keep the clinic on the paid plan — past_due is Stripe's dunning window
 * (smart retries usually recover the charge); reverting instantly blocked
 * admissions and stamped a paying subscriber's documents FREE-TRIAL
 * (2026-08-05 sweep #6). Reversion happens on unpaid/canceled/paused/
 * incomplete_expired/deletion. The trial gate only restricts ADMITTING new
 * patients — existing patients are never blocked, so a lapse never severs
 * care mid-episode.
 */
async function handleSstSubscriptionChange(sub: Stripe.Subscription) {
  if (sub.metadata?.product !== 'sst-trainer') return
  const clinicCode = sub.metadata?.clinicCode
  if (!clinicCode) {
    console.error('SST subscription change without clinicCode:', sub.id)
    return
  }
  const active = sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due'
  // Tier from the LIVE price id first — a plan switch made in the billing
  // portal/dashboard doesn't touch subscription metadata, which left seat
  // allowances stuck on the checkout-time tier (2026-08-05 sweep #7).
  const livePriceId = sub.items?.data?.[0]?.price?.id
  const tierFromPrice = (['single', 'clinic', 'enterprise'] as const).find(
    (t) => livePriceId && sstPlanPriceId(t) === livePriceId,
  )
  await setSstClinicPlan(clinicCode, active ? 'active' : 'trial', {
    customerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
    subscriptionId: sub.id,
    tier: tierFromPrice ?? sub.metadata?.plan,
  })
  console.log(`SST clinic ${clinicCode} → ${active ? 'active' : 'trial'} (sub ${sub.status}, tier ${tierFromPrice ?? sub.metadata?.plan ?? '?'})`)
}
