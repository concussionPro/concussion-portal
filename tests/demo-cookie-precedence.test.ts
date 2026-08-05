/**
 * "Demo is a floor, never a downgrade."
 *
 * /demo/clinic sets a `clinic_demo` cookie for THIRTY DAYS. Two surfaces read
 * it BEFORE the session, so any entitled clinician who took the tour was
 * downgraded for a month afterwards:
 *
 *   - lib/toolkit-access.ts   → returned 'locked', paywalling a paying
 *     customer out of the Clinical Toolkit / templates / references they own.
 *   - /api/clinical-testing/clinic → returned the synthetic DEMO00 workspace,
 *     so an SST clinic saw demo patients in their hub and could not reach
 *     their own clinic code or viewKey.
 *
 * The access route (/api/clinical-testing/access) already had the right order
 * after the 2026-07-27 nav regression; these two did not.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { NextRequest } from 'next/server'
import { CLINIC_DEMO_KEY } from '@/lib/demo-key'

const originalSecret = process.env.SESSION_SECRET
const originalKv = process.env.KV_REST_API_URL
beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-for-demo-precedence-tests'
  process.env.KV_REST_API_URL = 'https://kv.test'
})
afterAll(() => {
  if (originalSecret === undefined) delete process.env.SESSION_SECRET
  else process.env.SESSION_SECRET = originalSecret
  if (originalKv === undefined) delete process.env.KV_REST_API_URL
  else process.env.KV_REST_API_URL = originalKv
})

// ── cookie jar backing the next/headers mock ────────────────────────────────
let jar: Record<string, string> = {}
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (jar[name] !== undefined ? { name, value: jar[name] } : undefined),
  }),
  headers: async () => new Headers(),
}))

vi.mock('@/lib/users', () => ({
  isBookOwner: vi.fn(async () => false),
  // No refund downgrade in these scenarios — the DB agrees with the JWT.
  getCurrentAccessLevel: vi.fn(async () => 'online-only'),
}))

vi.mock('@/lib/sst-trainer/access', () => ({
  hasClinicalAccess: vi.fn(async ({ email }: { email: string }) => email === 'clinic@real.com'),
}))
vi.mock('@/lib/sst-trainer/clinic-registry', () => ({
  getSstClinicByEmail: vi.fn(async (email: string) =>
    email === 'clinic@real.com'
      ? { code: 'REAL01', clinicName: 'Real Clinic', viewKey: 'real-view-key', email, contactName: 'Dr Real', createdAt: '', plan: 'active', tier: 'clinic' }
      : null,
  ),
  adoptExistingClinicForEmail: vi.fn(async () => null),
  getClinicUsage: vi.fn(async () => ({ plan: 'active', patientCount: 2, cap: 10, window: '30d', canAddPatient: true })),
  getClinicProfile: vi.fn(async () => null),
  setClinicProfile: vi.fn(async () => true),
  createSstClinic: vi.fn(),
}))
vi.mock('@/lib/resend-client', () => ({ sendEmail: vi.fn(async () => true) }))
vi.mock('@/lib/sst-trainer/clinic-welcome-email', () => ({ buildWelcomeEmail: vi.fn(() => '') }))

import { resolveToolkitPageAccess } from '@/lib/toolkit-access'
import { GET as clinicGET } from '@/app/api/clinical-testing/clinic/route'
import { createJWTSession } from '@/lib/jwt-session'
import { CLINIC_DEMO_USER_ID, CLINIC_DEMO_EMAIL } from '@/lib/demo-session'

describe('toolkit access — a stale demo cookie must not paywall a paying customer', () => {
  it('paid session + clinic_demo cookie → entitled', async () => {
    jar = {
      clinic_demo: CLINIC_DEMO_KEY,
      session: createJWTSession('u1', 'buyer@clinic.com', 'Buyer', 'online-only', true),
    }
    expect(await resolveToolkitPageAccess()).toBe('entitled')
  })

  it('clinic_demo alone (a real prospect, no session) still gets the sell screen', async () => {
    jar = { clinic_demo: CLINIC_DEMO_KEY }
    expect(await resolveToolkitPageAccess()).toBe('locked')
  })

  it("the demo tour's synthetic preview JWT gets the sell screen, not entitlement", async () => {
    jar = {
      clinic_demo: CLINIC_DEMO_KEY,
      session: createJWTSession(CLINIC_DEMO_USER_ID, CLINIC_DEMO_EMAIL, 'Clinic Demo', 'preview', false),
    }
    expect(await resolveToolkitPageAccess()).toBe('locked')
  })

  it('a free preview account is locked (gate not loosened)', async () => {
    jar = { session: createJWTSession('u2', 'free@clinic.com', 'Free', 'preview', true) }
    expect(await resolveToolkitPageAccess()).toBe('locked')
  })
})

function req(cookies: Record<string, string>) {
  return new NextRequest('https://portal.concussion-education-australia.com/api/clinical-testing/clinic', {
    headers: {
      cookie: Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; '),
    },
  })
}

describe('clinical-testing/clinic — a real clinic must win over a lingering demo cookie', () => {
  it('entitled session + clinic_demo → the REAL clinic and its viewKey', async () => {
    const res = await clinicGET(
      req({
        clinic_demo: CLINIC_DEMO_KEY,
        session: createJWTSession('u3', 'clinic@real.com', 'Dr Real', 'preview', true),
      }),
    )
    const body = await res.json()
    expect(body.clinic.code).toBe('REAL01')
    expect(body.clinic.viewKey).toBe('real-view-key')
  })

  it('clinic_demo alone still opens the DEMO00 workspace for the tour', async () => {
    const res = await clinicGET(req({ clinic_demo: CLINIC_DEMO_KEY }))
    const body = await res.json()
    expect(body.clinic.code).toBe('DEMO00')
    expect(body.clinic.viewKey).toBe('')
  })

  it('no session and no demo cookie → 403 (gate not loosened)', async () => {
    const res = await clinicGET(req({}))
    expect(res.status).toBe(403)
  })

  it('an unentitled session with no demo cookie → 403, never another clinic', async () => {
    const res = await clinicGET(
      req({ session: createJWTSession('u4', 'stranger@clinic.com', 'Stranger', 'preview', true) }),
    )
    expect(res.status).toBe(403)
  })
})
