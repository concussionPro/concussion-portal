/**
 * Course → platform bundle provisioning.
 *
 * The course promise ("enrolment includes the working clinical platform — SST
 * Trainer + Baseline") is FULFILLED here. Called from the Stripe webhook after a
 * qualifying course purchase (international CRM, and — same switch — CCM
 * online/full-course).
 *
 * ONE clinic code covers BOTH tools: the SST Trainer and the Preseason Baseline
 * tool share the KV `clinic:{code}` namespace (see clinic-registry header), so a
 * single code + viewKey unlocks the SST Trainer patient app AND the Baseline /
 * serial-testing tool. The buyer never needs a second credential.
 *
 * IDEMPOTENT: reuses an existing clinic for the email (never mints a second);
 * setSstClinicPlan/grantSstEntitlement are upserts; the welcome email is a
 * re-send on repeat calls (also a "recover my link" path). The caller wraps this
 * best-effort — a provisioning hiccup must never lose the sale.
 */
import {
  getSstClinicByEmail,
  getSstClinicStripeSubscription,
  createSstClinic,
  setSstClinicPlan,
  type SstClinic,
} from './clinic-registry'
import { buildWelcomeEmail } from './clinic-welcome-email'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { grantSstEntitlement } from '@/lib/users'
import { createMagicToken } from '@/lib/magic-link-jwt'
import { CONFIG } from '@/lib/config'
import { sstPlanPriceId, redactStripeSecrets } from '@/lib/stripe'

/**
 * When a course purchase should carry the bundled-then-monthly SST platform
 * subscription (international CRM only), the caller passes the buyer's Stripe
 * customer + saved card so we can attach the REAL sst-trainer subscription.
 */
export interface BundledSubscription {
  customerId: string
  defaultPaymentMethod?: string
}

/**
 * Provision the bundled clinical platform for a course buyer and return the
 * clinic code. Throws only if the clinic itself can't be created/read — the
 * caller decides that provisioning is best-effort.
 *
 * When `bundledSubscription` is supplied (international CRM), the platform is
 * FREE for year 1, then bills MONTHLY at the real single-clinician SST price —
 * attached here as an sst-trainer subscription with a 365-day trial.
 */
export async function provisionPlatformForBuyer(
  email: string,
  name: string,
  bundledSubscription?: BundledSubscription,
): Promise<string> {
  const cleanEmail = email.trim().toLowerCase()
  const clinicName = (name || '').trim() || 'Clinic'
  const contactName = (name || '').trim()

  // Idempotent: reuse the buyer's existing clinic if one exists; else mint one.
  const clinic: SstClinic =
    (await getSstClinicByEmail(cleanEmail)) ??
    (await createSstClinic({ clinicName, contactName, email: cleanEmail }))

  // Bundled-then-monthly SST subscription (international CRM). Placed BEFORE
  // the plan flip below so the ONLY route to an uncapped clinic is one that has
  // a real renewal attached.
  let subscriptionAttached = false
  if (bundledSubscription) {
    subscriptionAttached = await createBundledSstSubscription(clinic.code, bundledSubscription)
  }

  // Lift the 3-patient trial cap ONLY when a renewal actually exists.
  //
  // This used to run unconditionally, which meant every provisioned buyer got an
  // UNCAPPED clinic forever, free — including CCM buyers (who never carry a
  // subscription) the moment bundle provisioning was switched on, and including
  // international buyers whose subscription creation had silently failed. The
  // free platform year is deliberate; a free platform *forever* is not.
  if (subscriptionAttached) {
    // tier 'single': the intl bundle's included platform IS the single-
    // clinician tier — without it the clinic sat unlimited (null tier) until
    // a random subscription.updated event flipped it to the 5-active cap.
    await setSstClinicPlan(clinic.code, 'active', { tier: 'single' })
  } else {
    console.warn(
      `[bundle] clinic ${clinic.code} provisioned WITHOUT a renewal subscription — staying on the trial cap. ` +
        `Lift it manually (or set STRIPE_SST_SINGLE_PRICE_ID) if this buyer is entitled to an uncapped clinic.`,
    )
  }

  // Reverse-funnel account: grant the SST entitlement (Clinical Testing unlocked;
  // everything else stays purchase-gated — this never touches access_level for an
  // existing user) and mint a 7-day magic-link login. If this step fails the
  // welcome email still ships with the clinic code + patient link.
  let loginUrl: string | null = null
  try {
    const userId = await grantSstEntitlement(cleanEmail, contactName)
    const token = createMagicToken(userId, cleanEmail, contactName, 'preview', 7 * 24 * 60 * 60 * 1000)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || CONFIG.APP_URL
    loginUrl = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent('/clinical-testing')}`
  } catch (err) {
    console.error('[bundle] grantSstEntitlement/login-link failed (welcome still sends code):', err)
  }

  await sendEmail({
    to: cleanEmail,
    subject: `Your clinical platform is ready — SST Trainer + Baseline`,
    html: buildWelcomeEmail({
      contactName,
      clinicName,
      code: clinic.code,
      viewKey: clinic.viewKey,
      loginUrl,
    }),
    tags: [
      { name: 'type', value: 'sst-clinic-welcome' },
      { name: 'sequence', value: 'course-bundle-platform' },
    ],
  })

  return clinic.code
}

/**
 * Attach the REAL single-clinician SST subscription (A$49/mo,
 * STRIPE_SST_SINGLE_PRICE_ID) to a clinic, FREE for year 1 then auto-monthly.
 *
 *  - Uses the existing dashboard Price (SST_PLANS.single) — no invented price.
 *  - trial_period_days: 365 → year 1 bundled/free; monthly billing starts at
 *    year 2 automatically.
 *  - metadata.product='sst-trainer' + clinicCode → the EXISTING sst-trainer
 *    subscription webhook (customer.subscription.updated/deleted →
 *    setSstClinicPlan) manages every plan flip: trialing/active keep the clinic
 *    'active', canceled/unpaid/past_due revert it to 'trial'. No parallel handling.
 *  - IDEMPOTENT: skips if the clinic already carries a stripe_subscription_id.
 *  - If STRIPE_SST_SINGLE_PRICE_ID is unset, skip and return FALSE — the caller
 *    then leaves the clinic on the trial cap rather than giving away an uncapped
 *    platform with no renewal behind it.
 *  - Fail-soft: any Stripe error → admin alert, return false (never lose the sale).
 *
 * Returns whether the clinic now has a renewal subscription attached.
 */
async function createBundledSstSubscription(clinicCode: string, sub: BundledSubscription): Promise<boolean> {
  try {
    // Idempotent — never a second subscription for a clinic.
    const existing = await getSstClinicStripeSubscription(clinicCode)
    if (existing) {
      console.log(`[bundle] SST subscription already exists for clinic ${clinicCode} (${existing}) — skipping`)
      return true // already has a renewal — the clinic may stay uncapped
    }

    const priceId = sstPlanPriceId('single') // STRIPE_SST_SINGLE_PRICE_ID (A$49/mo)
    if (!priceId) {
      console.warn(
        `[bundle] STRIPE_SST_SINGLE_PRICE_ID unset — clinic ${clinicCode} gets NO monthly subscription, so the trial cap stays on`,
      )
      return false
    }

    const { getStripe } = await import('@/lib/stripe')
    const created = await getStripe().subscriptions.create({
      customer: sub.customerId,
      items: [{ price: priceId, quantity: 1 }],
      // Year 1 free (bundled with the course) → monthly billing starts at year 2.
      trial_period_days: 365,
      ...(sub.defaultPaymentMethod ? { default_payment_method: sub.defaultPaymentMethod } : {}),
      // Reuse the EXISTING sst-trainer plan-flip handling — do NOT add parallel logic.
      metadata: {
        product: 'sst-trainer',
        plan: 'single',
        clinicCode,
        source: 'crm-international-bundle',
      },
    })

    // tier 'single' so year 1 matches what the subscription's webhook events
    // will set from year 2 (metadata.plan='single') — never a tier flip.
    await setSstClinicPlan(clinicCode, 'active', { customerId: sub.customerId, subscriptionId: created.id, tier: 'single' })
    console.log(`[bundle] SST subscription ${created.id} attached to clinic ${clinicCode} (365-day trial → A$49/mo at year 2)`)
    return true
  } catch (err) {
    // Redact first: Stripe echoes an invalid id back inside its error message,
    // so a misconfigured price env var would otherwise print a live key here.
    const safeMessage = redactStripeSecrets(err instanceof Error ? err.message : String(err))
    console.error(`[bundle] SST subscription creation failed for clinic ${clinicCode}: ${safeMessage}`)
    try {
      await sendEmail({
        to: CONFIG.CONTACT_EMAIL,
        subject: `ACTION REQUIRED: bundled SST subscription failed for clinic ${clinicCode}`,
        html: `<p>An international CRM buyer paid but the <strong>bundled-then-monthly SST subscription failed to create</strong> — course + platform (free year 1) are fine, but no monthly billing is scheduled for year 2.</p><p><strong>Clinic:</strong> ${escapeHtml(clinicCode)}</p><p>Error: ${escapeHtml(safeMessage)}</p><p>Create the sst-trainer subscription manually in Stripe (single plan, 365-day trial, metadata product=sst-trainer + clinicCode). The sale is NOT at risk and Stripe will NOT retry.</p>`,
      })
    } catch (alertErr) {
      console.error('[bundle] SST subscription admin alert failed:', alertErr)
    }
    return false
  }
}
