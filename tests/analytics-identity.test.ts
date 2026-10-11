import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

/**
 * Measured 2026-10-10: 1 of 1,016 page views in 28 days carried a user
 * identity. 97.5% of ALL portal analytics was anonymous, including every
 * logged-in paying customer.
 *
 * Cause: setIdentity() was only called from the React page at /auth/verify,
 * and that page stopped rendering when the magic link moved to a server
 * interstitial (GET serves a form, POST 303-redirects to the destination).
 * A customer could log in, work through the course, and appear as nobody —
 * which is what happened to the newest CRM buyer, and it also starves the
 * acquisition backfill, which joins on user_email.
 */
const provider = readFileSync('components/AnalyticsProvider.tsx', 'utf8')

describe('a logged-in user is identified in analytics', () => {
  it('the provider asks the session who this is', () => {
    expect(provider).toContain("fetch('/api/auth/session'")
    expect(provider).toContain('setIdentity(email)')
  })

  it('it only asks when nothing is stored, so it costs one request at most', () => {
    expect(provider).toContain('if (getIdentity()) return')
  })

  it('a logged-out visitor stays anonymous rather than erroring', () => {
    const i = provider.indexOf("fetch('/api/auth/session'")
    expect(provider.slice(i, i + 600)).toContain('.catch(')
  })

  it('no email is ever put in a URL to achieve this', () => {
    // the ?email= pickup is for campaign links only and must not be the
    // mechanism for session identity
    expect(provider).not.toMatch(/redirect[^\n]*email=\$\{/)
  })
})
