import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * PROSPECT UNSUBSCRIBE — the unsigned-token disclosure hole (2026-08-06
 * server-surface audit).
 *
 * The token has two formats. `<slug>.<hmac>` is signed. `<slug>-<base36>` is
 * LEGACY and carries no signature at all, so `?t=<guessed-slug>-1` is a valid
 * token for that slug — and slugs are derived from the clinic's public name,
 * not secret. The route's only legacy restriction was "the clinic must have
 * been contacted", which is inverted: contacted clinics ARE the live pipeline.
 *
 * That made GET a PII oracle — it rendered the clinic's real contact email,
 * confirming both the address and that the guess was real — and POST
 * permanently suppressed that address and marked the clinic lost.
 *
 * These tests lock the disclosure rule: only a SIGNED token may see an address
 * echoed back. Legacy links must keep WORKING (Spam Act unsubscribe promise) —
 * they just stop talking.
 */

process.env.SESSION_SECRET = 'test-secret-for-prospect-unsubscribe'

const CONTACT_EMAIL = 'reception@guessable-clinic.com.au'

let suppressed: string[] = []
/** Rows the legacy recency check finds. Empty = never contacted / aged out. */
let recentOutreachRows: unknown[] = []

vi.mock('@/lib/prospect/repo', () => ({
  getClinicBySlug: async (slug: string) =>
    slug === 'guessable-clinic'
      ? { id: 1, slug, contactEmail: CONTACT_EMAIL, status: 'contacted' }
      : null,
  suppress: async (email: string) => {
    suppressed.push(email)
  },
}))

vi.mock('@/lib/db', () => ({
  sql: async () => ({ rows: recentOutreachRows, rowCount: recentOutreachRows.length }),
}))

// KV-backed limiter is not under test here; allow every request through so the
// disclosure assertions are about disclosure, not throttling.
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: async () => ({ ok: true, remaining: 99, resetIn: 60 }),
}))

async function getBody(token: string): Promise<string> {
  const { GET } = await import('@/app/api/prospect/unsubscribe/route')
  const { NextRequest } = await import('next/server')
  const res = await GET(
    new NextRequest(`https://portal.test/api/prospect/unsubscribe?t=${encodeURIComponent(token)}`),
  )
  return res.text()
}

describe('prospect unsubscribe — unsigned tokens never disclose the address', () => {
  beforeEach(() => {
    suppressed = []
    recentOutreachRows = [{ '?column?': 1 }] // clinic WAS recently contacted
  })

  it('a SIGNED token still shows the recipient their address (unchanged)', async () => {
    const { generateUnsubscribeToken } = await import('@/lib/prospect/unsubscribe-token')
    const body = await getBody(generateUnsubscribeToken('guessable-clinic'))
    expect(body).toContain(CONTACT_EMAIL)
  })

  it('a GUESSED legacy token never renders the contact email', async () => {
    // No signature — anyone can construct this from the public clinic name.
    const body = await getBody('guessable-clinic-1')
    expect(body).not.toContain(CONTACT_EMAIL)
    expect(body).not.toContain('guessable-clinic.com.au')
    expect(body).toContain('your address')
  })

  it('a legacy token still UNSUBSCRIBES — the Spam Act promise keeps working', async () => {
    const { POST } = await import('@/app/api/prospect/unsubscribe/route')
    const { NextRequest } = await import('next/server')
    const res = await POST(
      new NextRequest('https://portal.test/api/prospect/unsubscribe?t=guessable-clinic-1', {
        method: 'POST',
      }),
    )
    expect(res.status).toBe(200)
    expect(suppressed).toEqual([CONTACT_EMAIL])
  })

  it('an AGED-OUT legacy token suppresses nobody', async () => {
    recentOutreachRows = [] // no send inside the 90-day window
    const { POST } = await import('@/app/api/prospect/unsubscribe/route')
    const { NextRequest } = await import('next/server')
    const res = await POST(
      new NextRequest('https://portal.test/api/prospect/unsubscribe?t=guessable-clinic-1', {
        method: 'POST',
      }),
    )
    expect(res.status).toBe(200)
    expect(suppressed).toEqual([])
    // ...and still says nothing about the address.
    expect(await getBody('guessable-clinic-1')).not.toContain(CONTACT_EMAIL)
  })

  it('an unknown slug discloses nothing either way', async () => {
    const body = await getBody('no-such-clinic-1')
    expect(body).not.toContain(CONTACT_EMAIL)
    expect(body).toContain('your address')
  })
})
