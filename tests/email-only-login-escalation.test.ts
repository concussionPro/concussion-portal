/**
 * P0 — EMAIL-ONLY LOGIN MUST NOT TAKE OVER AN OWNED ACCOUNT.
 *
 * /api/email-gate and /api/signup-free set a real, year-long session cookie
 * from an email address alone (no token, no link). That is fine for a new lead
 * and for an account that owns nothing; for anyone else the browser that types
 * the address BECOMES the customer.
 *
 * The 2026-07-12 guard only asked `access_level !== 'preview'`. Every
 * entitlement shipped since rides alongside 'preview' — CRM buyers, SST
 * clinics, Reference+Toolkit bundle owners, AI-course enrollees, Hub owners —
 * so they all looked like free leads. Posting an SST clinic owner's address
 * returned a session that reads their clinic's private viewKey and, through
 * it, every patient's label + heart-rate history, plus their Stripe billing
 * portal.
 *
 * The invariant: SESSION COOKIE ⟺ the account owns nothing. Anything else gets
 * a magic link to the address itself.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const originalSecret = process.env.SESSION_SECRET
beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-for-escalation-route-tests'
})
afterAll(() => {
  if (originalSecret === undefined) delete process.env.SESSION_SECRET
  else process.env.SESSION_SECRET = originalSecret
})

const VICTIM = {
  id: 'victim-id',
  email: 'clinic.owner@realclinic.com',
  name: 'Clinic Owner',
  accessLevel: 'preview' as const,
  createdAt: new Date().toISOString(),
}

const state = {
  existing: null as typeof VICTIM | null,
  ownedCourses: [] as string[],
  sst: false,
  book: false,
  ai: false,
  hub: null as unknown,
  dbDown: false,
}

vi.mock('@/lib/users', () => ({
  findUserByEmail: vi.fn(async () => state.existing),
  createUser: vi.fn(async () => 'fresh-user-id'),
  updateLastLogin: vi.fn(async () => {}),
  isBookOwner: vi.fn(async () => state.book),
  hasSstEntitlement: vi.fn(async () => {
    if (state.dbDown) throw new Error('neon unreachable')
    return state.sst
  }),
}))
vi.mock('@/lib/course-purchases', () => ({ getOwnedCourses: vi.fn(async () => state.ownedCourses) }))
vi.mock('@/lib/ai-course/access', () => ({ isUserEnrolled: vi.fn(async () => state.ai) }))
vi.mock('@/lib/course-hub', () => ({ getHubByOwner: vi.fn(async () => state.hub) }))
vi.mock('@/lib/db', () => ({ sql: vi.fn(async () => ({ rows: [], rowCount: 0 })) }))

const sendMagicLinkEmail = vi.fn(async () => true)
vi.mock('@/lib/resend-client', () => ({
  sendEmail: vi.fn(async () => true),
  sendMagicLinkEmail: (...args: unknown[]) => sendMagicLinkEmail(...(args as [])),
  escapeHtml: (s: string) => s,
}))
vi.mock('@/app/api/unsubscribe/route', () => ({ generateUnsubscribeToken: () => 'tok' }))

import { POST as emailGatePOST } from '@/app/api/email-gate/route'
import { POST as signupFreePOST } from '@/app/api/signup-free/route'

beforeEach(() => {
  state.existing = null
  state.ownedCourses = []
  state.sst = false
  state.book = false
  state.ai = false
  state.hub = null
  state.dbDown = false
  sendMagicLinkEmail.mockClear()
})

/** Unique address per call so the routes' in-memory per-email rate limiter
 *  (3–5 attempts / 15 min, module-level Map) never colours a later case. */
let n = 0
function post(url: string, body: Record<string, unknown>) {
  return new NextRequest(`https://portal.concussion-education-australia.com${url}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${++n % 250}` },
    body: JSON.stringify(body),
  })
}

function withEmail(email: string) {
  state.existing = { ...VICTIM, email }
  return email
}

describe('/api/email-gate — session cookie only for an account that owns nothing', () => {
  it('a brand-new lead is logged straight in', async () => {
    const res = await emailGatePOST(post('/api/email-gate', { email: `new${n}@lead.com` }))
    expect(res.status).toBe(200)
    expect(res.cookies.get('session')?.value).toBeTruthy()
  })

  it('an existing account that owns nothing is logged straight in', async () => {
    withEmail(`plain${n}@lead.com`)
    const res = await emailGatePOST(post('/api/email-gate', { email: `plain${n}@lead.com` }))
    expect(res.cookies.get('session')?.value).toBeTruthy()
  })

  const owned: Array<[string, () => void]> = [
    ['an SST clinic owner', () => { state.sst = true }],
    ['a CRM / short-course buyer', () => { state.ownedCourses = ['crm'] }],
    ['a Reference+Toolkit bundle owner', () => { state.book = true }],
    ['an AI-course enrollee', () => { state.ai = true }],
    ['a Hub Pack owner', () => { state.hub = { code: 'HUB1' } }],
  ]

  for (const [label, arm] of owned) {
    it(`${label} gets a magic link and NO session cookie`, async () => {
      const email = withEmail(`owner${n}@realclinic.com`)
      arm()
      const res = await emailGatePOST(post('/api/email-gate', { email }))
      const body = await res.json()
      expect(body.requiresEmailLogin).toBe(true)
      expect(res.cookies.get('session')).toBeUndefined()
      // The link goes to the ADDRESS, never to the caller.
      expect(sendMagicLinkEmail).toHaveBeenCalledTimes(1)
    })
  }

  it('a paid access level still gets a magic link (the original guard)', async () => {
    const email = withEmail(`paid${n}@realclinic.com`)
    state.existing = { ...state.existing!, accessLevel: 'full-course' as never }
    const res = await emailGatePOST(post('/api/email-gate', { email }))
    expect((await res.json()).requiresEmailLogin).toBe(true)
    expect(res.cookies.get('session')).toBeUndefined()
  })

  it('FAILS CLOSED — a DB error mints no session', async () => {
    const email = withEmail(`dbdown${n}@realclinic.com`)
    state.dbDown = true
    const res = await emailGatePOST(post('/api/email-gate', { email }))
    expect((await res.json()).requiresEmailLogin).toBe(true)
    expect(res.cookies.get('session')).toBeUndefined()
  })
})

describe('/api/signup-free — same invariant on the free-course front door', () => {
  it('a brand-new lead is logged straight in', async () => {
    const res = await signupFreePOST(
      post('/api/signup-free', { email: `fresh${n}@lead.com`, name: 'Fresh Lead' }),
    )
    expect(res.status).toBe(200)
    expect(res.cookies.get('session')?.value).toBeTruthy()
  })

  it('an SST clinic owner gets a magic link and NO session cookie', async () => {
    const email = withEmail(`sstowner${n}@realclinic.com`)
    state.sst = true
    const res = await signupFreePOST(post('/api/signup-free', { email, name: 'Clinic Owner' }))
    const body = await res.json()
    expect(body.requiresEmailLogin).toBe(true)
    expect(res.cookies.get('session')).toBeUndefined()
    expect(sendMagicLinkEmail).toHaveBeenCalledTimes(1)
  })

  it('a CRM buyer gets a magic link and NO session cookie', async () => {
    const email = withEmail(`crmbuyer${n}@realclinic.com`)
    state.ownedCourses = ['crm']
    const res = await signupFreePOST(post('/api/signup-free', { email, name: 'EP Buyer' }))
    expect((await res.json()).requiresEmailLogin).toBe(true)
    expect(res.cookies.get('session')).toBeUndefined()
  })
})
