import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * A PREFETCH MUST NEVER GRANT ACCESS.
 *
 * WHY THIS EXISTS (2026-08-06, master clean register D, and the verification
 * pass that followed it).
 *
 * Next prefetches a `<Link>` the moment it scrolls into the viewport. Ten
 * routes under app/demo/ are GET handlers that GRANT ACCESS by setting a
 * cookie — `demo_key` unlocks the private, gated CRM course; `clinic_demo`
 * signs the visitor in as a clinic prospect.
 *
 * So scrolling to the bottom of a PUBLIC accreditation page (/acsm, /cases,
 * /csep, /cep-uk, /hpcsa) handed the visitor a reviewer key without a click,
 * and /ep-course/modules/1 then served thousands of characters of PAID module
 * content. The same mechanism signed every visitor to /sst-trainer — the public
 * patient entry — in as "Clinic Demo" and fired `demo_tour_start`, THE ACC
 * outreach conversion signal, once per pageview. That metric was counting
 * scroll depth.
 *
 * WHY THE TEST IS SHAPED THIS WAY. The first fix put `prefetch={false}` on the
 * links and a guard on exactly ONE of the ten granting routes, then reported
 * the class closed. Verification found the other nine still completely
 * unguarded. `prefetch={false}` is a per-call-site defence that rots the moment
 * someone adds a link; the route-level guard is the one that cannot. So this
 * asserts the guard at the ROUTE, not at the link.
 */

const ROOT = join(__dirname, '..')
const DEMO = join(ROOT, 'app/demo')

/** Every route handler under app/demo/. */
function demoRoutes(): Array<{ name: string; src: string }> {
  return readdirSync(DEMO, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => ({ name: d.name, file: join(DEMO, d.name, 'route.ts') }))
    .filter((r) => existsSync(r.file))
    .map((r) => ({ name: r.name, src: readFileSync(r.file, 'utf8') }))
}

describe('demo routes cannot be triggered by a prefetch', () => {
  const routes = demoRoutes()

  it('finds the routes it claims to guard', () => {
    // A guard that enumerates nothing reports a pass. There were ten.
    expect(routes.length).toBeGreaterThan(5)
  })

  it('every route that sets a cookie checks for a prefetch first', () => {
    const granting = routes.filter((r) => /cookies\.set\(/.test(r.src))
    expect(granting.length, 'no granting routes found — has app/demo moved?').toBeGreaterThan(5)

    const unguarded = granting.filter(
      (r) => !/isPrefetchRequest\(|isPrefetch\(/.test(r.src),
    )
    expect(
      unguarded.map((r) => `/demo/${r.name} sets a cookie on GET with no prefetch guard — scrolling a link into view grants it`),
      'import isPrefetchRequest from lib/prefetch-guard and return 204 before granting',
    ).toEqual([])
  })

  it('the guard runs BEFORE the cookie is set, not after', () => {
    // Order is the whole point. A guard below the grant is decoration.
    for (const r of routes.filter((x) => /cookies\.set\(/.test(x.src))) {
      const guardAt = Math.max(r.src.indexOf('isPrefetchRequest('), r.src.indexOf('isPrefetch('))
      const grantAt = r.src.indexOf('cookies.set(')
      expect(guardAt, `/demo/${r.name}: no guard found`).toBeGreaterThan(-1)
      expect(guardAt, `/demo/${r.name}: guard appears AFTER the cookie is set`).toBeLessThan(grantAt)
    }
  })

  it('no route keeps a LOCAL copy of the guard', () => {
    // /demo/clinic had its own isPrefetch(), which omitted `sec-purpose`. It
    // was skipped during the sweep precisely BECAUSE it already looked
    // guarded, and was then measured in production granting 2 cookies to a
    // Speculation Rules prefetch — on the highest-traffic demo route in the
    // app. A second implementation is a second thing to forget to update.
    const localCopies = routes.filter((r) => /function isPrefetch\b/.test(r.src))
    expect(
      localCopies.map((r) => `/demo/${r.name} defines its own guard — import from lib/prefetch-guard instead`),
    ).toEqual([])
  })

  it('the shared helper covers the headers browsers actually send', () => {
    const helper = readFileSync(join(ROOT, 'lib/prefetch-guard.ts'), 'utf8')
    for (const h of ['next-router-prefetch', 'purpose', 'x-purpose', 'sec-purpose']) {
      expect(helper, `lib/prefetch-guard.ts stopped checking ${h}`).toContain(h)
    }
  })

  it('the guard can fail', () => {
    // Non-vacuity, proven against the exact shape that shipped: a granting
    // route with no guard, and a guard placed after the grant.
    const shipped = `export async function GET(request: NextRequest) {
      const res = NextResponse.redirect(dest)
      res.cookies.set('demo_key', DEMO_KEY, { httpOnly: true })
      return res
    }`
    expect(/cookies\.set\(/.test(shipped)).toBe(true)
    expect(/isPrefetchRequest\(/.test(shipped)).toBe(false)

    const guardTooLate = `res.cookies.set('demo_key', X); if (isPrefetchRequest(req)) return null`
    expect(guardTooLate.indexOf('isPrefetchRequest(')).toBeGreaterThan(guardTooLate.indexOf('cookies.set('))
  })
})
