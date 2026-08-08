/**
 * Next.js instrumentation — runs once at server startup.
 * Validates required env vars so misconfiguration surfaces at boot,
 * not at the first request that happens to need a given secret.
 *
 * Docs: https://nextjs.org/docs/app/guides/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const required = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'RESEND_API_KEY',
    'POSTGRES_URL',
    'ADMIN_API_KEY',
  ]

  const oneOf = [
    ['SESSION_SECRET', 'MAGIC_LINK_SECRET'],
  ]

  const missing = required.filter((k) => !process.env[k])
  const missingGroups = oneOf.filter((group) => group.every((k) => !process.env[k]))

  /**
   * FLAG-DEPENDENT REQUIREMENTS.
   *
   * CRM_INTERNATIONAL_LIVE turning on does two things with money attached:
   *  1. international CRM sells with the platform bundled FREE for year 1, then
   *     billing MONTHLY from year 2 via a real sst-trainer subscription;
   *  2. bundle provisioning fires on CCM purchases too.
   *
   * The year-2 subscription needs STRIPE_SST_SINGLE_PRICE_ID. Without it,
   * createBundledSstSubscription logs a warning and SKIPS — the sale still
   * completes, the buyer still gets a free platform year, and no renewal is
   * ever scheduled. That failure is silent and permanent per customer, so it
   * must not be possible to ship the flag on without the price.
   */
  const { CONFIG, SST_INCLUDED_TIER } = await import('@/lib/config')
  const { isStripePriceId, SST_PLAN_ENV_VAR } = await import('@/lib/stripe')

  // The year-2 renewal rides the tier a course enrolment INCLUDES, so the var
  // to demand is whichever SLOT that tier is wired to — NOT a literal name.
  //
  // This was hardcoded to STRIPE_SST_STARTER_PRICE_ID, a variable that has
  // never been set in production and that the 2026-08-08 ladder retired
  // altogether (Enterprise went quote-only, freeing its slot for Pro, so three
  // purchasable tiers now fit the three slots that exist). Because
  // instrumentation THROWS in production, a stale name here is not a warning —
  // it is a site-wide outage on deploy. Derive it.
  const includedPriceVar = SST_PLAN_ENV_VAR[SST_INCLUDED_TIER.plan]
  const includedPrice = process.env[includedPriceVar]
  if ((CONFIG.FEATURES.CRM_INTERNATIONAL_LIVE || CONFIG.FEATURES.CCM_PLATFORM_BUNDLE_LIVE) && !includedPrice) {
    missing.push(`${includedPriceVar} (backs the ${SST_INCLUDED_TIER.name} tier a course enrolment includes — without it the year-2 renewal is never created and the platform is given away permanently)`)
  }

  // SHAPE, not just presence. A live secret key was once pasted into this var;
  // a presence check accepts that, and the value then reaches Stripe, which
  // rejects it with an error message CONTAINING the key. Validate the prefix so
  // the misconfiguration is caught at boot instead of at the first sale.
  // Enumerated from SST_PLAN_ENV_VAR so a re-wired slot can never be skipped.
  for (const key of Object.values(SST_PLAN_ENV_VAR)) {
    const val = process.env[key]
    if (val && !isStripePriceId(val)) {
      missing.push(`${key} is not a Stripe Price id — it must start with "price_" (a secret key or product id here will be rejected by Stripe, and Stripe echoes the value back in the error)`)
    }
  }

  if (missing.length || missingGroups.length) {
    const parts: string[] = []
    if (missing.length) parts.push(`missing: ${missing.join(', ')}`)
    for (const g of missingGroups) parts.push(`missing one of: ${g.join(' | ')}`)
    const msg = `[instrumentation] Environment misconfiguration — ${parts.join('; ')}`

    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg)
    }
    console.warn(msg)
  }
}
