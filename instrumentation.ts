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
  const { CONFIG } = await import('@/lib/config')
  const { isStripePriceId } = await import('@/lib/stripe')
  const singlePrice = process.env.STRIPE_SST_SINGLE_PRICE_ID
  if (CONFIG.FEATURES.CRM_INTERNATIONAL_LIVE && !singlePrice) {
    missing.push('STRIPE_SST_SINGLE_PRICE_ID (required while CRM_INTERNATIONAL_LIVE is true — without it the year-2 renewal is never created and the platform is given away permanently)')
  }

  // SHAPE, not just presence. A live secret key was once pasted into this var;
  // a presence check accepts that, and the value then reaches Stripe, which
  // rejects it with an error message CONTAINING the key. Validate the prefix so
  // the misconfiguration is caught at boot instead of at the first sale.
  for (const key of ['STRIPE_SST_SINGLE_PRICE_ID', 'STRIPE_SST_CLINIC_PRICE_ID', 'STRIPE_SST_ENTERPRISE_PRICE_ID'] as const) {
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
