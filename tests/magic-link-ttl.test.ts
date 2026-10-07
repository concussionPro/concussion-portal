import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { PAID_TTL_MS, NURTURE_TTL_MS } from '@/lib/magic-link-jwt'

/**
 * Owner, 2026-10-06, after a buyer needed two login links to get in:
 * "why would you mint a 24hr token for a paid user".
 *
 * The 24h default belongs to a user-initiated /login request, where the person
 * is sitting in front of their inbox. It was never right for someone who has
 * just paid and may open the email on Monday.
 */
describe('a paid buyer never gets a short-lived login link', () => {
  it('the paid window is 30 days, and longer than the nurture window', () => {
    expect(PAID_TTL_MS).toBe(30 * 24 * 60 * 60 * 1000)
    expect(PAID_TTL_MS).toBeGreaterThan(NURTURE_TTL_MS)
  })

  const paidPaths = [
    'app/api/webhooks/stripe/route.ts',
    'app/api/admin/resend-purchase-welcome/route.ts',
    'app/api/hub/redeem/route.ts',
    'app/api/webhooks/squarespace/route.ts',
    'app/api/admin/create-user/route.ts',
  ]

  it('every paid mint passes an explicit TTL — none fall through to the 24h default', () => {
    for (const rel of paidPaths) {
      const src = readFileSync(rel, 'utf8')
      // Match to end of line: an argument list can contain nested parens
      // (e.g. `(existing?.accessLevel || 'preview')`), so a [^)]* match stops
      // short and reports a false positive.
      const mints = src.split('\n').filter((l) => l.includes('createMagicToken('))
      expect(mints.length, `${rel} has no mint`).toBeGreaterThan(0)
      for (const m of mints) {
        expect(m, `${rel}: ${m} relies on the 24h default`).toContain('PAID_TTL_MS')
      }
    }
  })

  it('the purchase-welcome RESEND is covered — it is the repair path for someone already locked out', () => {
    const src = readFileSync('app/api/admin/resend-purchase-welcome/route.ts', 'utf8')
    expect(src).toContain('PAID_TTL_MS')
  })

  it('a self-requested /login link keeps the tight window — the user is right there', () => {
    const src = readFileSync('app/api/send-magic-link/route.ts', 'utf8')
    expect(src).toContain('createMagicToken(user.id, user.email, user.name, user.accessLevel)')
  })
})
