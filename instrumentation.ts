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
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'RESEND_API_KEY',
    'POSTGRES_URL',
    'ADMIN_API_KEY',
  ]

  const oneOf = [
    ['SESSION_SECRET', 'MAGIC_LINK_SECRET'],
  ]

  const missing = required.filter((k) => !process.env[k])
  const missingGroups = oneOf.filter((group) => group.every((k) => !process.env[k]))

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
