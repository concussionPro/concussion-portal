import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { adminActorFor } from '@/lib/admin-audit'
import { createAdminSessionToken, ADMIN_COOKIE_NAME } from '@/lib/admin-session'

const originalSecret = process.env.SESSION_SECRET
beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-for-admin-audit-tests'
})
afterAll(() => {
  if (originalSecret === undefined) delete process.env.SESSION_SECRET
  else process.env.SESSION_SECRET = originalSecret
})

/**
 * ADMIN SURFACE HARDENING (2026-08-06) — four separate defects:
 *
 *  1. /api/admin/sst-clinics returned EVERY clinic's viewKey and a ready-made
 *     hub link in one bulk response. Each of those URLs reads that clinic's
 *     Clinical Hub — patient data — with no further auth.
 *  2. /api/admin/alumni-sst-activation resolved clinics with the member-fallback
 *     lookup, so an alumnus seated at a THIRD PARTY's clinic would have flipped
 *     that clinic to a comped plan; and it swallowed DB errors to null, whose
 *     next step mints a duplicate clinic + view key.
 *  3. No admin mutation was attributable or reconstructable.
 *  4. "Sign out" of the portal left admin_session behind, and admin_session
 *     unlocks paid customer content on user-facing surfaces.
 */

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')

describe('1. /api/admin/sst-clinics does not bulk-leak view keys', () => {
  const src = read('app/api/admin/sst-clinics/route.ts')

  it('takes ?code= and returns a single clinic with its key', () => {
    expect(src).toMatch(/searchParams\.get\('code'\)/)
    expect(src).toMatch(/clinic:\s*\{/)
    expect(src).toContain('viewKey: clinic.viewKey')
  })

  it('404s an unknown code rather than falling back to the listing', () => {
    expect(src).toMatch(/Clinic not found[\s\S]{0,60}404/)
  })

  it('the keyless directory carries no viewKey and no hubLink', () => {
    const directory = src.match(/const directory = clinics\.map[\s\S]*?\n\s*\}\)\)/)?.[0] ?? ''
    expect(directory).not.toContain('viewKey')
    expect(directory).not.toContain('hubLink')
    // patientLink is public (no key) and stays.
    expect(directory).toContain('patientLink')
  })

  it('is still admin-gated', () => {
    expect(src).toContain('isAdminRequest')
  })

  it('the admin UI fetches one key on demand instead of receiving them all', () => {
    const ui = read('app/admin/preseason/page.tsx')
    expect(ui).toMatch(/\/api\/admin\/sst-clinics\?code=/)
    // The row type must no longer carry a hub link.
    const rowType = ui.match(/interface SstClinicRow \{[\s\S]*?\n\}/)?.[0] ?? ''
    expect(rowType).not.toContain('hubLink: string')
  })
})

describe('2. alumni SST activation is owner-only and fails loudly', () => {
  const src = read('app/api/admin/alumni-sst-activation/route.ts')

  it('uses the owner-only lookup, never the member-fallback one', () => {
    expect(src).toContain('await getSstClinicOwnedByEmail(')
    // The permissive lookup must not be CALLED here (the header comment names
    // it, which is why this checks the call form).
    expect(src).not.toContain('await getSstClinicByEmail(')
    expect(src).not.toMatch(/^\s+getSstClinicByEmail,$/m)
  })

  it('the lookup sits INSIDE the try, so a failure cannot reach createSstClinic', () => {
    const loop = src.match(/for \(const a of alumni\) \{[\s\S]*?\n  \}/)?.[0] ?? ''
    const tryStart = loop.indexOf('try {')
    expect(tryStart).toBeGreaterThan(-1)
    expect(loop.indexOf('await getSstClinicOwnedByEmail(')).toBeGreaterThan(tryStart)
    expect(loop.indexOf('await createSstClinic(')).toBeGreaterThan(tryStart)
  })

  it('logs failures and reports a partial run as a 500', () => {
    expect(src).toMatch(/console\.error\(`\[alumni-sst-activation\] FAILED/)
    expect(src).toMatch(/status: errors > 0 \? 500 : 200/)
  })

  it('still defaults to dryRun — nothing fires without an explicit false', () => {
    expect(src).toContain('body?.dryRun !== false')
  })
})

describe('2b. the owner-only lookup itself', () => {
  const src = read('lib/sst-trainer/clinic-registry.ts')
  const fn = src.match(/export async function getSstClinicOwnedByEmail[\s\S]*?\n\}/)?.[0] ?? ''

  it('exists and queries sst_clinics by owner email only', () => {
    expect(fn).toContain('FROM sst_clinics')
    expect(fn).toContain('WHERE email =')
  })

  it('has NO member fallback', () => {
    expect(fn).not.toContain('sst_clinic_members')
  })

  it('does not swallow errors to null', () => {
    expect(fn).not.toMatch(/catch\s*(\([^)]*\))?\s*\{[\s\S]*?return null/)
  })

  it('leaves the permissive getSstClinicByEmail intact for READ surfaces', () => {
    // Seated practitioners must still resolve to their employer's hub when
    // merely VIEWING it — the fix is scoped to mutation.
    expect(src).toContain('export async function getSstClinicByEmail')
  })
})

describe('3. admin audit trail', () => {
  const src = read('lib/admin-audit.ts')

  it('defines the single admin_actions table with the agreed columns', () => {
    expect(src).toMatch(/CREATE TABLE IF NOT EXISTS admin_actions/)
    for (const col of ['actor', 'route', 'target', 'detail', 'at']) {
      expect(src).toMatch(new RegExp(`\\s${col} `))
    }
  })

  it('never throws — an audit failure must not fail the mutation', () => {
    expect(src).toMatch(/catch \(err\) \{[\s\S]*?console\.error\('\[admin-audit\]/)
    const fn = src.match(/export async function recordAdminAction[\s\S]*?\n\}/)?.[0] ?? ''
    expect(fn).toMatch(/Promise<void>/)
  })

  it('reports the CREDENTIAL used, since the session carries no subject', () => {
    const cookieReq = new Request('https://x.test/', {
      headers: { cookie: `${ADMIN_COOKIE_NAME}=${createAdminSessionToken()}` },
    })
    expect(adminActorFor(cookieReq)).toBe('cookie')

    const keyReq = new Request('https://x.test/', { headers: { 'x-admin-key': 'whatever' } })
    expect(adminActorFor(keyReq)).toBe('api-key')

    expect(adminActorFor(new Request('https://x.test/'))).toBe('unknown')
  })

  it('a forged admin cookie is not counted as a cookie session', () => {
    const forged = new Request('https://x.test/', {
      headers: { cookie: `${ADMIN_COOKIE_NAME}=not-a-real-token` },
    })
    expect(adminActorFor(forged)).toBe('unknown')
  })

  it('is called from the routes that mutate customer state', () => {
    const mutating = [
      'app/api/admin/create-user/route.ts',
      'app/api/admin/update-user-access/route.ts',
      'app/api/admin/unsubscribe/route.ts',
      'app/api/admin/prospect-unsubscribe/route.ts',
      'app/api/admin/squarespace-suppress/route.ts',
      'app/api/admin/alumni-sst-activation/route.ts',
      'app/api/admin/reissue-certificate/route.ts',
    ]
    for (const p of mutating) {
      expect(read(p), p).toContain('recordAdminAction')
    }
  })

  it('is NOT bolted onto read-only routes', () => {
    const readOnly = [
      'app/api/admin/sst-clinics/route.ts',
      'app/api/admin/ready-to-train/route.ts',
      'app/api/admin/workshop-alumni/route.ts',
      'app/api/admin/find-user/route.ts',
    ]
    for (const p of readOnly) {
      expect(read(p), p).not.toContain('recordAdminAction')
    }
  })
})

describe('4. user logout clears admin_session too', () => {
  const src = read('app/api/auth/logout/route.ts')

  it('deletes the admin cookie alongside the user and demo identities', () => {
    expect(src).toContain('ADMIN_COOKIE_NAME')
    const list = src.match(/for \(const name of \[([^\]]*)\]/)?.[1] ?? ''
    for (const name of ["'session'", "'demo_key'", "'demo_org'", "'clinic_demo'", 'ADMIN_COOKIE_NAME']) {
      expect(list).toContain(name)
    }
  })

  it('records WHY: user-facing surfaces admit admin_session to paid content', () => {
    // If any of these stop granting on admin_session, revisit the decision —
    // that is the evidence the "leave it signed in" convenience rested on.
    for (const p of [
      'lib/course-access.ts',
      'components/ai-course/CourseGate.tsx',
      'components/ep-course/CrmCourseGate.tsx',
      'app/platform/app/layout.tsx',
    ]) {
      expect(read(p), p).toContain('ADMIN_COOKIE_NAME')
    }
    // Same grant, reached through isAdminRequest (which accepts the cookie).
    expect(read('lib/ai-course/access.ts')).toContain('isAdminRequest')
    expect(read('lib/require-admin.ts')).toContain('ADMIN_COOKIE_NAME')
  })

  it('the reverse direction is unchanged — admin logout does not sign out the user', () => {
    const adminLogout = read('app/api/admin/logout/route.ts')
    expect(adminLogout).toContain('ADMIN_COOKIE_NAME')
    expect(adminLogout).not.toContain("'session'")
  })
})
