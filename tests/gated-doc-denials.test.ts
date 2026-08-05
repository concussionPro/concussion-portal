/**
 * Gated static assets: the SHAPE of the denial (2026-08-05 live crawl).
 *
 * Two PUBLIC pages link gated documents by design — /course links the course
 * brochure as a big download card, and /scat-forms/scat6 links the official
 * SCAT6 fillable in copy that tells a clinician to use it MID-ASSESSMENT. Both
 * answered an anonymous browser with a raw JSON body (`{"error":"Please log
 * in…"}`) rendered in a tab.
 *
 * Invariants:
 *  - a browser NAVIGATION with no session → 307 to /login?redirect=<file>, the
 *    same treatment protected pages already get;
 *  - a programmatic caller keeps the exact status + JSON body it parses today;
 *  - an AUTHENTICATED but unentitled visitor is NEVER bounced to /login (that
 *    loops — /login sends a signed-in user straight back to ?redirect); they
 *    get an HTML page pointing at where the file legitimately lives;
 *  - no gate is loosened: nothing that was denied is now served.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { NextRequest } from 'next/server'

const originalSecret = process.env.SESSION_SECRET
beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-for-doc-gate-tests'
})
afterAll(() => {
  if (originalSecret === undefined) delete process.env.SESSION_SECRET
  else process.env.SESSION_SECRET = originalSecret
})

// The bundle-owner fallback on paid docs does one indexed lookup — no rows
// here, so an unentitled session stays denied.
vi.mock('@vercel/postgres', () => ({ sql: vi.fn(async () => ({ rows: [] })) }))

import { middleware } from '@/middleware'
import { createJWTSession } from '@/lib/jwt-session'
import { DEMO_KEY, CLINIC_DEMO_KEY } from '@/lib/demo-key'

const NAV = { 'sec-fetch-mode': 'navigate', accept: 'text/html,application/xhtml+xml' }
const FETCH = { 'sec-fetch-mode': 'cors', accept: 'application/json' }

function req(path: string, headers: Record<string, string>, cookie?: string) {
  return new NextRequest(`https://portal.concussion-education-australia.com${path}`, {
    headers: { ...headers, ...(cookie ? { cookie } : {}) },
  })
}

const previewCookie = () =>
  `session=${createJWTSession('u-preview', 'free@clinic.com', 'Free', 'preview', true)}`
const paidCookie = () =>
  `session=${createJWTSession('u-paid', 'buyer@clinic.com', 'Buyer', 'online-only', true)}`

describe('AUTH_DOCS (the free SCAT/SCOAT forms)', () => {
  it('anonymous NAVIGATION redirects to /login carrying the file as ?redirect', async () => {
    const res = await middleware(req('/docs/SCAT6_Fillable.pdf', NAV))
    expect(res.status).toBe(307)
    const loc = new URL(res.headers.get('location')!)
    expect(loc.pathname).toBe('/login')
    expect(loc.searchParams.get('redirect')).toBe('/docs/SCAT6_Fillable.pdf')
  })

  it('anonymous PROGRAMMATIC request keeps the 401 JSON contract', async () => {
    const res = await middleware(req('/docs/SCAT6_Fillable.pdf', FETCH))
    expect(res.status).toBe(401)
    expect(res.headers.get('content-type')).toContain('application/json')
    expect(await res.json()).toEqual({ error: 'Please log in to download this file.' })
  })

  it('any authenticated user is served — including a free preview account', async () => {
    const res = await middleware(req('/docs/SCAT6_Fillable.pdf', NAV, previewCookie()))
    expect(res.headers.get('location')).toBeNull()
    expect(res.status).toBe(200)
  })
})

describe('PAID_DOCS', () => {
  it('anonymous navigation → /login (they may well be a buyer who is signed out)', async () => {
    const res = await middleware(req('/docs/ClinicalToolkit_Complete.zip', NAV))
    expect(res.status).toBe(307)
    expect(new URL(res.headers.get('location')!).pathname).toBe('/login')
  })

  it('AUTHENTICATED but unentitled → HTML, never a /login loop', async () => {
    const res = await middleware(req('/docs/ClinicalToolkit_Complete.zip', NAV, previewCookie()))
    expect(res.headers.get('location')).toBeNull() // no redirect ⇒ no loop
    expect(res.status).toBe(401)
    expect(res.headers.get('content-type')).toContain('text/html')
    const body = await res.text()
    expect(body).toContain('/clinical-toolkit')
    expect(body).not.toContain('{"error"')
  })

  it('a paid session is still served (gate not loosened)', async () => {
    const res = await middleware(req('/docs/ClinicalToolkit_Complete.zip', NAV, paidCookie()))
    expect(res.status).toBe(200)
    expect(res.headers.get('location')).toBeNull()
  })

  it('programmatic callers keep the 401 JSON contract', async () => {
    const res = await middleware(req('/docs/ClinicalToolkit_Complete.zip', FETCH))
    expect(res.status).toBe(401)
    expect((await res.json()).error).toContain('Authentication required')
  })
})

describe('the course brochure (/CourseContent_2026.pdf, linked from the public /course page)', () => {
  it('anonymous navigation → /login instead of a JSON blob in a tab', async () => {
    const res = await middleware(req('/CourseContent_2026.pdf', NAV))
    expect(res.status).toBe(307)
    const loc = new URL(res.headers.get('location')!)
    expect(loc.pathname).toBe('/login')
    expect(loc.searchParams.get('redirect')).toBe('/CourseContent_2026.pdf')
  })

  it('signed in but not enrolled → HTML with the enrolment path, no loop', async () => {
    const res = await middleware(req('/CourseContent_2026.pdf', NAV, previewCookie()))
    expect(res.headers.get('location')).toBeNull()
    expect(res.headers.get('content-type')).toContain('text/html')
    expect(await res.text()).toContain('/pricing')
  })

  it('an enrolled session is served', async () => {
    const res = await middleware(req('/CourseContent_2026.pdf', NAV, paidCookie()))
    expect(res.status).toBe(200)
  })
})

describe('blanket-blocked assets', () => {
  it('an unlisted /docs file is 403 HTML for a browser, 403 JSON for a script', async () => {
    const nav = await middleware(req('/docs/something-internal.pdf', NAV))
    expect(nav.status).toBe(403)
    expect(nav.headers.get('content-type')).toContain('text/html')
    // NOT a login redirect — logging in would not help, so don't pretend it does.
    expect(nav.headers.get('location')).toBeNull()

    const prog = await middleware(req('/docs/something-internal.pdf', FETCH))
    expect(prog.status).toBe(403)
    expect((await prog.json()).error).toContain('Direct access not allowed')
  })

  it('/resources/*.pdf stays 403 and points at the resources page', async () => {
    const res = await middleware(req('/resources/cheat-sheet.pdf', NAV))
    expect(res.status).toBe(403)
    expect(await res.text()).toContain('/resources')
  })

  it('a paid doc is never served to an anonymous programmatic caller', async () => {
    const res = await middleware(req('/docs/RehabFlow.png', FETCH))
    expect(res.status).toBe(401)
  })
})

/**
 * REGRESSION (found 2026-08-05 adversarial round, introduced by the denial-shape
 * change itself): the /login bounce is only safe for a browser with NO identity.
 *
 * /login redirects on whatever /api/auth/session resolves, and that route falls
 * back to the demo cookies when the session cookie is absent or stale. A partner
 * reviewer (demo_key) or clinic prospect (clinic_demo) who taps a toolkit
 * download therefore went asset → /login → asset → … until the browser gave up
 * with ERR_TOO_MANY_REDIRECTS — and no login could ever satisfy the gate,
 * because a demo identity is not an entitlement. Before the change these
 * callers got a JSON 401; the loop is strictly new.
 */
describe('demo identities must never be bounced to /login', () => {
  const demoKeyCookie = () => `demo_key=${DEMO_KEY}`
  const clinicDemoCookie = () => `clinic_demo=${CLINIC_DEMO_KEY}`

  for (const doc of [
    '/docs/ClinicalToolkit_Complete.zip',
    '/docs/SCAT6_Fillable.pdf',
    '/CourseContent_2026.pdf',
  ]) {
    it(`${doc} answers a demo_key browser with a page, not a redirect`, async () => {
      const res = await middleware(req(doc, NAV, demoKeyCookie()))
      expect(res.headers.get('location')).toBeNull()
      expect(res.headers.get('content-type')).toContain('text/html')
    })

    it(`${doc} answers a clinic_demo browser with a page, not a redirect`, async () => {
      const res = await middleware(req(doc, NAV, clinicDemoCookie()))
      expect(res.headers.get('location')).toBeNull()
      expect(res.headers.get('content-type')).toContain('text/html')
    })
  }

  it('a STALE session alongside a demo cookie also gets the page', async () => {
    const res = await middleware(
      req('/docs/ClinicalToolkit_Complete.zip', NAV, `session=not.avalidtoken; ${demoKeyCookie()}`),
    )
    expect(res.headers.get('location')).toBeNull()
  })

  it('a demo cookie does NOT unlock the asset — the gate is unchanged', async () => {
    const res = await middleware(req('/docs/ClinicalToolkit_Complete.zip', FETCH, demoKeyCookie()))
    expect(res.status).toBe(401)
    expect((await res.json()).error).toContain('Authentication required')
  })

  it('a real paid session still wins over the demo cookie', async () => {
    const res = await middleware(
      req('/docs/ClinicalToolkit_Complete.zip', NAV, `${paidCookie()}; ${demoKeyCookie()}`),
    )
    expect(res.status).toBe(200)
  })

  it('a genuinely anonymous browser is still redirected (the fix is not a blanket opt-out)', async () => {
    const res = await middleware(req('/docs/ClinicalToolkit_Complete.zip', NAV))
    expect(res.status).toBe(307)
    expect(new URL(res.headers.get('location')!).pathname).toBe('/login')
  })
})
