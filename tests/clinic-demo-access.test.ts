/**
 * Clinic-prospect demo access model (/demo/clinic → clinic_demo cookie).
 *
 * The pitch surface for ACC/supplier targets: browse the REAL portal with a
 * synthetic PREVIEW session — tools usable in demo mode, CCM/CRM visible but
 * locked, Module 1 trial + free courses open, no email/login.
 *
 * Invariants under test:
 *  1. Session API mints a preview-level demo user from the clinic_demo cookie
 *     (NEVER full-course, NEVER ownsCrm — paid streams stay sealed).
 *  2. The reviewer demo_key keeps its full-course scope (separate audience).
 *  3. Clinical-testing access route: a REAL entitlement WINS over a lingering
 *     demo cookie (2026-07-27 nav regression: the owner lost his Clinical
 *     Testing sidebar item because 'demo' was returned before his session was
 *     checked). Demo is a floor, never a downgrade.
 *  4. Without entitlement, the clinic_demo cookie opens exactly the 'demo'
 *     door — not 'sst', not 'course'.
 */
import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { DEMO_KEY, CLINIC_DEMO_KEY } from '@/lib/demo-key'

vi.mock('@/lib/users', () => ({
  findUserById: vi.fn(async () => null),
  isBookOwner: vi.fn(async () => false),
}))
vi.mock('@/lib/crm-course', () => ({
  userOwnsCrm: vi.fn(async () => false),
}))
vi.mock('@/lib/jwt-session', () => ({
  verifySessionToken: vi.fn((token: string) => {
    if (token === 'valid-course-holder') {
      return { type: 'session', userId: 'u1', email: 'buyer@clinic.com', name: 'Buyer', accessLevel: 'full-course', exp: Date.now() + 60_000 }
    }
    if (token === 'demo-jwt') {
      return { type: 'session', userId: 'demo-viewer-clinic', email: 'demo@clinic-preview.local', name: 'Clinic Demo', accessLevel: 'preview', exp: Date.now() + 60_000 }
    }
    return null
  }),
  createJWTSession: vi.fn(() => 'newtoken'),
}))
vi.mock('@/lib/db', () => ({
  sql: vi.fn(async () => {
    throw new Error('demo identities must never touch the database')
  }),
}))
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(async () => ({ ok: true })),
}))
vi.mock('@/lib/sst-trainer/access', () => ({
  resolveClinicalAccess: vi.fn(async ({ accessLevel }: { accessLevel: string }) =>
    accessLevel === 'full-course' ? 'course' : 'locked',
  ),
}))

import { GET as sessionGET } from '@/app/api/auth/session/route'
import { GET as accessGET } from '@/app/api/clinical-testing/access/route'
import { POST as progressPOST, DELETE as progressDELETE } from '@/app/api/progress/route'
import { isDemoUserId, isDemoEmail } from '@/lib/demo-session'

function req(url: string, cookies: Record<string, string>, init?: { method?: string; body?: string }) {
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
  return new NextRequest(`http://localhost${url}`, {
    ...init,
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  })
}

describe('session API — clinic-prospect demo user', () => {
  it('mints a PREVIEW-level demo user from the clinic_demo cookie', async () => {
    const res = await sessionGET(req('/api/auth/session', { clinic_demo: CLINIC_DEMO_KEY }))
    expect(res.status).toBe(200)
    const { user } = await res.json()
    expect(user.accessLevel).toBe('preview') // NOT full-course
    expect(user.ownsCrm).toBe(false) // CRM stream sealed
    expect(user.isDemo).toBe(true)
    // demo-viewer prefix = every downstream mutation-skip guard applies
    expect(user.id.startsWith('demo-viewer')).toBe(true)
  })

  it('rejects a wrong clinic_demo value (no clinic demo user minted)', async () => {
    const res = await sessionGET(req('/api/auth/session', { clinic_demo: 'guessed-key' }))
    // NODE_ENV=test hits the dev-preview fallback instead of 401 — the
    // invariant is that a guessed key NEVER mints the clinic demo user.
    const body = await res.json().catch(() => null)
    expect(body?.user?.id).not.toBe('demo-viewer-clinic')
  })

  it('reviewer demo_key keeps full-course scope and wins over clinic_demo', async () => {
    const res = await sessionGET(
      req('/api/auth/session', { demo_key: DEMO_KEY, clinic_demo: CLINIC_DEMO_KEY }),
    )
    const { user } = await res.json()
    expect(user.accessLevel).toBe('full-course')
  })
})

describe('clinical-testing access route — door ordering', () => {
  it('a real entitlement WINS over a lingering demo cookie', async () => {
    const res = await accessGET(
      req('/api/clinical-testing/access', { session: 'valid-course-holder', clinic_demo: CLINIC_DEMO_KEY }),
    )
    expect((await res.json()).access).toBe('course') // not 'demo'
  })

  it('clinic_demo alone opens exactly the demo door', async () => {
    const res = await accessGET(req('/api/clinical-testing/access', { clinic_demo: CLINIC_DEMO_KEY }))
    expect((await res.json()).access).toBe('demo')
  })

  it('an unentitled session + demo cookie still gets the demo floor', async () => {
    const res = await accessGET(
      req('/api/clinical-testing/access', { session: 'stale-or-invalid', clinic_demo: CLINIC_DEMO_KEY }),
    )
    expect((await res.json()).access).toBe('demo')
  })

  it('no cookies at all → none', async () => {
    const res = await accessGET(req('/api/clinical-testing/access', {}))
    expect((await res.json()).access).toBe('none')
  })
})

describe('demo JWT — reads work, writes never persist', () => {
  it('session API returns the demo user for a demo JWT with no users row', async () => {
    const res = await sessionGET(req('/api/auth/session', { session: 'demo-jwt' }))
    expect(res.status).toBe(200)
    const { user } = await res.json()
    expect(user.id).toBe('demo-viewer-clinic')
    expect(user.accessLevel).toBe('preview')
    expect(user.isDemo).toBe(true)
    // and the session cookie must NOT be deleted (the pre-fix behaviour)
    expect(res.cookies.get('session')?.value ?? 'kept').not.toBe('')
  })

  it('progress POST acknowledges but never touches the DB (sql mock throws)', async () => {
    const res = await progressPOST(
      req('/api/progress', { session: 'demo-jwt' }, { method: 'POST', body: JSON.stringify({ progress: {} }) }),
    )
    expect(res.status).toBe(200)
    expect((await res.json()).demo).toBe(true)
  })

  it('progress DELETE acknowledges but never touches the DB', async () => {
    const res = await progressDELETE(req('/api/progress', { session: 'demo-jwt' }))
    expect(res.status).toBe(200)
    expect((await res.json()).demo).toBe(true)
  })

  it('guards recognise exactly the demo identities', () => {
    expect(isDemoUserId('demo-viewer-clinic')).toBe(true)
    expect(isDemoUserId('demo-viewer-essa')).toBe(true)
    expect(isDemoUserId('u1')).toBe(false)
    expect(isDemoEmail('demo@clinic-preview.local')).toBe(true)
    expect(isDemoEmail('demo@partner-preview.local')).toBe(true)
    expect(isDemoEmail('buyer@clinic.com')).toBe(false)
  })
})
