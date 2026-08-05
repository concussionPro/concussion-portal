/**
 * AUTH / SESSION / IDENTITY regression suite (2026-08-05 auth sweep).
 *
 * Each block pins a defect that was live in production:
 *
 *  1. EMAIL-ONLY LOGIN ESCALATION (P0). /api/signup-free and /api/email-gate
 *     mint a session cookie from an email address alone. The old guard asked
 *     `access_level !== 'preview'` — but CRM buyers, SST clinics, bundle
 *     owners, AI-course enrollees and Hub owners are ALL 'preview' by design,
 *     so posting a paying customer's address returned a live session for their
 *     account (their paid course, their clinic's viewKey → every patient's HR
 *     history, their Stripe billing portal).
 *  2. DEMO COOKIE DOWNGRADE. The 30-day /demo/clinic cookie was read BEFORE
 *     the session in two places, so a paying customer who took the tour lost
 *     their toolkit and got the DEMO00 workspace instead of their own clinic.
 *  3. INCOMPLETE LOGOUT. Only `session` was cleared, leaving a demo identity
 *     (which /api/auth/session falls back to) logged in after "Sign out".
 *  4. RAW JSON ON A GATED ASSET. Public pages link gated documents; a browser
 *     navigation got `{"error":"Please log in…"}` in a tab instead of /login.
 *  5. POST-LOGIN LANDING for the SCAT forms — the free-tier deep link the
 *     middleware bounces must be honoured for a preview user.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const originalSecret = process.env.SESSION_SECRET
beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-for-auth-identity-tests'
})
afterAll(() => {
  if (originalSecret === undefined) delete process.env.SESSION_SECRET
  else process.env.SESSION_SECRET = originalSecret
})

// ── Shared mocks for the entitlement sources ────────────────────────────────
const state = {
  ownedCourses: [] as string[],
  sst: false,
  book: false,
  ai: false,
  hub: null as unknown,
  throwOn: '' as string,
}

vi.mock('@/lib/users', () => ({
  isBookOwner: vi.fn(async () => {
    if (state.throwOn === 'book') throw new Error('db down')
    return state.book
  }),
  hasSstEntitlement: vi.fn(async () => {
    if (state.throwOn === 'sst') throw new Error('db down')
    return state.sst
  }),
  findUserByEmail: vi.fn(async () => null),
  findUserById: vi.fn(async () => null),
  createUser: vi.fn(async () => 'new-user-id'),
  updateLastLogin: vi.fn(async () => {}),
  getCurrentAccessLevel: vi.fn(async () => null),
}))
vi.mock('@/lib/course-purchases', () => ({
  getOwnedCourses: vi.fn(async () => {
    if (state.throwOn === 'courses') throw new Error('db down')
    return state.ownedCourses
  }),
}))
vi.mock('@/lib/ai-course/access', () => ({
  isUserEnrolled: vi.fn(async () => state.ai),
}))
vi.mock('@/lib/course-hub', () => ({
  getHubByOwner: vi.fn(async () => state.hub),
}))

beforeEach(() => {
  state.ownedCourses = []
  state.sst = false
  state.book = false
  state.ai = false
  state.hub = null
  state.throwOn = ''
})

import { hasElevatedEntitlement } from '@/lib/account-escalation'

describe('hasElevatedEntitlement — the email-only-login guard', () => {
  const lead = { email: 'lead@clinic.com', accessLevel: 'preview' as const }

  it('a bare free lead owns nothing → instant session is safe', async () => {
    expect(await hasElevatedEntitlement(lead)).toBe(false)
  })

  it('a paid CCM access level is elevated (the original check)', async () => {
    expect(await hasElevatedEntitlement({ ...lead, accessLevel: 'online-only' })).toBe(true)
    expect(await hasElevatedEntitlement({ ...lead, accessLevel: 'full-course' })).toBe(true)
  })

  // Every one of these carries access_level 'preview' in production.
  it('a CRM / short-course buyer is elevated', async () => {
    state.ownedCourses = ['crm']
    expect(await hasElevatedEntitlement(lead)).toBe(true)
  })

  it('an SST-entitled clinic is elevated (their viewKey unlocks patient data)', async () => {
    state.sst = true
    expect(await hasElevatedEntitlement(lead)).toBe(true)
  })

  it('a Reference+Toolkit bundle owner is elevated', async () => {
    state.book = true
    expect(await hasElevatedEntitlement(lead)).toBe(true)
  })

  it('an AI-course / RTP enrollee is elevated', async () => {
    state.ai = true
    expect(await hasElevatedEntitlement(lead)).toBe(true)
  })

  it('a Hub Pack owner is elevated', async () => {
    state.hub = { code: 'HUB123', ownerEmail: lead.email }
    expect(await hasElevatedEntitlement(lead)).toBe(true)
  })

  it('FAILS CLOSED — a DB error answers "elevated", never "mint a session"', async () => {
    state.throwOn = 'courses'
    expect(await hasElevatedEntitlement(lead)).toBe(true)
    state.throwOn = 'sst'
    expect(await hasElevatedEntitlement(lead)).toBe(true)
  })

  it('an empty email is treated as elevated (never mint a session for nobody)', async () => {
    expect(await hasElevatedEntitlement({ email: '   ', accessLevel: 'preview' })).toBe(true)
  })
})

// ── 3. Logout completeness ──────────────────────────────────────────────────
import { POST as logoutPOST } from '@/app/api/auth/logout/route'

describe('logout clears EVERY identity cookie', () => {
  it('kills session AND the demo identities', async () => {
    const res = await logoutPOST(
      new NextRequest('http://localhost/api/auth/logout', {
        method: 'POST',
        headers: {
          origin: 'http://localhost',
          cookie: 'session=x; demo_key=y; demo_org=ESSA; clinic_demo=z',
        },
      }),
    )
    expect(res.status).toBe(200)
    // Each cookie is expired at path '/' — the path the demo routes set them on.
    for (const name of ['session', 'demo_key', 'demo_org', 'clinic_demo']) {
      const c = res.cookies.get(name)
      expect(c, `${name} must be cleared by logout`).toBeDefined()
      expect(c?.value).toBe('')
      expect(c?.path).toBe('/')
    }
  })
})

// ── 4/5. The shared gated-asset lists ───────────────────────────────────────
import { isAuthDoc, isPaidDoc, isPublicDoc, PUBLIC_DOCS } from '@/lib/gated-docs'

describe('gated document lists', () => {
  it('nothing is public — every asset costs at least an email capture', () => {
    expect(PUBLIC_DOCS.size).toBe(0)
    expect(isPublicDoc('/docs/SCAT6_Fillable.pdf')).toBe(false)
  })

  it('the SCAT/SCOAT forms are AUTH-tier, not paid', () => {
    expect(isAuthDoc('/docs/SCAT6_Fillable.pdf')).toBe(true)
    expect(isAuthDoc('/docs/SCOAT6_Fillable.pdf')).toBe(true)
    expect(isPaidDoc('/docs/SCAT6_Fillable.pdf')).toBe(false)
  })

  it('paid templates stay paid, including percent-encoded pathnames', () => {
    expect(isPaidDoc('/docs/ClinicalToolkit_Complete.zip')).toBe(true)
    // What a browser actually sends for a filename with spaces.
    expect(isPaidDoc('/docs/Email%20Template%20Pack.docx')).toBe(true)
    expect(isAuthDoc('/docs/Email%20Template%20Pack.docx')).toBe(false)
  })

  it('an unlisted doc is in no tier (middleware blanket-403s it)', () => {
    expect(isAuthDoc('/docs/anything-else.pdf')).toBe(false)
    expect(isPaidDoc('/docs/anything-else.pdf')).toBe(false)
    expect(isPublicDoc('/docs/anything-else.pdf')).toBe(false)
  })

  it('a malformed percent-escape never throws', () => {
    expect(() => isPaidDoc('/docs/%E0%A4%A.pdf')).not.toThrow()
    expect(isPaidDoc('/docs/%E0%A4%A.pdf')).toBe(false)
  })
})
