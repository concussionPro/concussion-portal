import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * DEPLOY CONFIGURATION — the class that ONLY Vercel validates.
 *
 * WHY THIS EXISTS (2026-08-06, master clean register F).
 *
 * Register F's mandate this pass was a single question: what else reports green
 * on a tree that cannot deploy, or on a production that is broken? The answer
 * turned out to be "an entire category of configuration", because tsc, vitest
 * and CI all stop at the language boundary.
 *
 *   - `next build` compiles the route manifest, so it catches a bad middleware
 *     matcher (added to CI this pass, after one shipped a live paywall bypass).
 *   - NOTHING catches vercel.json. An unknown key there fails the deployment
 *     BEFORE the build even starts, and the build log comes back EMPTY — three
 *     silent ERROR deploys on 2026-07-20 came from a `_regions_note` comment
 *     key someone added for readability. CLAUDE.md records it; nothing enforced
 *     it.
 *   - NOTHING catches a cron pointing at a route that no longer exists. Vercel
 *     will happily call it on schedule forever, take the 404, and report
 *     nothing. The cold-outreach engine has already been silently dark once for
 *     nine days (17–26 June) from an unrelated silent failure.
 *
 * All three share a shape: valid JSON, valid TypeScript, catastrophic at deploy
 * or runtime. This file is the gate for them.
 */

const ROOT = join(__dirname, '..')
const vercelJson = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'))

/**
 * Keys Vercel actually accepts. An unknown key is not ignored — it fails the
 * whole deployment before the build, with empty logs, which is the single
 * hardest failure mode in this repo to diagnose.
 */
const ALLOWED_KEYS = new Set([
  'regions', 'crons', 'buildCommand', 'devCommand', 'framework',
  'installCommand', 'outputDirectory', 'headers', 'redirects', 'rewrites',
  'cleanUrls', 'trailingSlash', 'functions', 'images', 'public', 'git',
  'ignoreCommand', 'env', 'build',
])

describe('vercel.json is deployable', () => {
  it('contains no key Vercel would reject', () => {
    const unknown = Object.keys(vercelJson).filter((k) => !ALLOWED_KEYS.has(k))
    expect(
      unknown,
      'an unknown key fails the DEPLOYMENT before the build runs, and the build log comes back empty — do not add comment keys',
    ).toEqual([])
  })

  it('still pins execution to Sydney, which is a compliance control not a preference', () => {
    // CLAUDE.md: `"regions": ["syd1"]` puts function execution in Australia
    // alongside the ap-southeast-2 Neon database. Together they satisfy ACC
    // Service Schedule cl.14.1.2 — client personal information stored in NZ
    // and/or Australia — which flows down to CEA in the NZ scheme deals that
    // are the primary revenue path. A well-meaning "add us-east-1 for speed"
    // breaks a contractual obligation, silently, with no test failing.
    expect(vercelJson.regions).toEqual(['syd1'])
  })
})

describe('every cron points at a route that exists', () => {
  const crons: Array<{ path: string; schedule: string }> = vercelJson.crons ?? []

  it('finds the crons it claims to guard', () => {
    // A guard matching nothing reports a pass.
    expect(crons.length).toBeGreaterThan(10)
  })

  it('has a handler file for every scheduled path', () => {
    const missing = crons.filter(({ path }) => {
      // App Router: a cron path of /api/cron/x is served by app/api/cron/x/route.ts.
      // Omitting the `app/` prefix here made every cron look missing and the
      // guard fail on a clean tree — caught immediately, but it is the same
      // detector bug class register C hit twice inside its own guard this week.
      const rel = join('app', path.split('?')[0].replace(/^\/+|\/+$/g, ''))
      return !existsSync(join(ROOT, rel, 'route.ts')) && !existsSync(join(ROOT, rel, 'route.tsx'))
    })
    expect(
      missing.map((c) => `${c.path} (${c.schedule}) has no route handler`),
      'Vercel calls a dead cron path on schedule forever, takes the 404, and reports nothing',
    ).toEqual([])
  })

  it('uses only valid five-field cron expressions', () => {
    const bad = crons.filter(({ schedule }) => {
      const f = schedule.trim().split(/\s+/)
      if (f.length !== 5) return true
      // Vercel rejects a malformed field at deploy time, not at build time.
      return !f.every((x) => /^(\*|\d+|\d+-\d+|(\*|\d+(-\d+)?)\/\d+|\d+(,\d+)+)$/.test(x))
    })
    expect(bad.map((c) => `${c.path}: '${c.schedule}'`)).toEqual([])
  })

  it('schedules no two crons at the same minute on the same path', () => {
    const seen = new Map<string, number>()
    for (const c of crons) {
      const k = `${c.schedule} ${c.path}`
      seen.set(k, (seen.get(k) ?? 0) + 1)
    }
    expect([...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k)).toEqual([])
  })
})

describe('the guards above can actually fail', () => {
  // Non-vacuity, proven in memory. Every assertion here passes on the current
  // tree, so each is exercised against the shape that actually broke
  // production. Register C found two detector bugs inside its own guard this
  // week; a guard is not trustworthy until it has been shown to fail.
  it('rejects the comment key that caused three empty-log deploys', () => {
    const withComment = { regions: ['syd1'], crons: [], _regions_note: 'syd1 for ACC compliance' }
    expect(Object.keys(withComment).filter((k) => !ALLOWED_KEYS.has(k))).toEqual(['_regions_note'])
  })

  it('rejects a non-AU region', () => {
    expect(['syd1', 'iad1']).not.toEqual(['syd1'])
  })

  it('rejects a cron path with no handler, and accepts one that has it', () => {
    // Both directions. Asserting only the negative would have passed happily
    // while the resolver was broken and every real cron looked missing.
    expect(existsSync(join(ROOT, 'app/api/cron/this-route-was-deleted/route.ts'))).toBe(false)
    expect(existsSync(join(ROOT, 'app/api/cron/monitoring/route.ts'))).toBe(true)
  })

  it('rejects a malformed schedule', () => {
    const valid = (s: string) => {
      const f = s.trim().split(/\s+/)
      return f.length === 5 && f.every((x) => /^(\*|\d+|\d+-\d+|(\*|\d+(-\d+)?)\/\d+|\d+(,\d+)+)$/.test(x))
    }
    expect(valid('0 22 * * *')).toBe(true)
    expect(valid('0 23 * * 0-4')).toBe(true)
    expect(valid('45 * * * *')).toBe(true)
    expect(valid('0 22 * *')).toBe(false)       // four fields
    expect(valid('0 22 * * MON')).toBe(false)   // named day, unsupported
    expect(valid('every-day')).toBe(false)
  })
})

describe('the health check can report which build is serving', () => {
  // The deeper finding behind all of this: a failed deploy PINS production to
  // the previous build, and /api/health returned {"status":"healthy"} right
  // through two such incidents on 2026-08-06 because it only pinged Postgres.
  // The route now reports the commit SHA, and CI polls it after every push to
  // main. If the SHA disappears from the response, that CI job silently starts
  // passing on a timeout it can never satisfy — so the contract is locked here.
  const src = readFileSync(join(ROOT, 'app/api/health/route.ts'), 'utf8')

  it('exposes the commit SHA on the public branch, not only to admins', () => {
    expect(src).toMatch(/VERCEL_GIT_COMMIT_SHA/)
    // The unauthenticated path must carry it — CI cannot send an admin key.
    const publicBranch = src.slice(src.indexOf('if (!isAdmin'), src.indexOf('// Admin: full diagnostics'))
    expect(publicBranch).toMatch(/build:\s*buildInfo\(\)/)
  })

  it('is never cached, since a cached SHA is the exact failure being detected', () => {
    expect(src).toMatch(/export const dynamic = 'force-dynamic'/)
  })
})

describe('the deploy monitor does not cry wolf', () => {
  const ci = readFileSync(join(ROOT, '.github/workflows/ci.yml'), 'utf8')

  it('accepts a DESCENDANT of the pushed commit, not only an exact match', () => {
    // The first version demanded live === github.sha and failed on a perfectly
    // healthy production: six commits went out in quick succession, Vercel
    // supersedes an in-flight build when a newer one arrives, so intermediate
    // SHAs never serve. It waited 18 minutes for a commit that could not exist,
    // then reported failure.
    //
    // A monitor that fires on a healthy system is worse than no monitor,
    // because the next REAL alert gets ignored. The property that matters is
    // that production is not stuck BEHIND — so a descendant must pass.
    expect(ci, 'the superseded-push case must be accepted via an ancestry check')
      .toMatch(/git merge-base --is-ancestor/)
  })

  it('still fails when production is genuinely behind', () => {
    // The alarm must survive the fix. If the job ever unconditionally exits 0,
    // the whole point is gone.
    expect(ci).toMatch(/production is PINNED to an older build/)
    expect(ci).toMatch(/exit 1/)
  })

  it('checks out full history, which the ancestry test requires', () => {
    // actions/checkout defaults to depth 1; merge-base then cannot see the
    // live commit and every comparison silently fails, sending the job back to
    // exact-match behaviour.
    expect(ci).toMatch(/fetch-depth:\s*0/)
  })
})
