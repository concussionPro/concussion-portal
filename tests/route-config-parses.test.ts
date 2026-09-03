import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// The parser Next itself compiles route configuration with. Requiring Next's
// bundled copy (rather than adding a dependency) guarantees this test agrees
// with the build byte for byte — a different path-to-regexp major would accept
// or reject different syntax and make the guard lie.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { pathToRegexp } = require('next/dist/compiled/path-to-regexp')

/**
 * ROUTE CONFIGURATION MUST PARSE.
 *
 * WHY THIS EXISTS — 2026-08-06, and it cost a live paywall bypass.
 *
 * The middleware matcher was widened to catch a backup directory that was
 * serving the entire paid Clinical Toolkit to anonymous requests. The pattern
 * used was:
 *
 *     '/docs:suffix(-|_)?:rest*'
 *
 * That is two ADJACENT path-to-regexp parameters. Next rejects it while
 * building the route manifest:
 *
 *     Error parsing /:nextData(_next/data/[^/]{1,})?/docs:suffix(-|_)?:rest*
 *     TypeError: Must have text between two parameters, missing text after "suffix"
 *
 * `npx tsc --noEmit` printed zero lines. All 1424 tests passed. Both are
 * STRUCTURALLY INCAPABLE of catching it: neither one parses route config.
 * TypeScript sees a string literal in a string array and is perfectly happy.
 *
 * So it shipped. The deploy went to ERROR — and a failed deploy does not mean
 * "the new thing is missing", it means production is PINNED to the previous
 * build. That commit's whole purpose was deleting the leaking directory, so the
 * bypass stayed open for another eleven minutes while everything reported green.
 *
 * The authoritative fix is the `Build` step now in CI. This test exists because
 * a full `next build` takes minutes and runs after a push, whereas this runs in
 * milliseconds on every save — the same class, caught before the commit.
 *
 * SCOPE — every surface in this repo that the same parser consumes:
 *   1. `export const config.matcher` in middleware.ts
 *   2. `source` and `destination` of every entry in next.config.ts `redirects()`
 *
 * If a `rewrites()` or `headers()` block is ever added, add it here. Those go
 * through the identical parser and would fail the identical way.
 */

const ROOT = join(__dirname, '..')

/** String literals inside a bracketed block, ignoring `//` comments. */
function literalsIn(block: string): string[] {
  return block
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .flatMap((line) => Array.from(line.matchAll(/'([^']*)'/g)).map((m) => m[1]))
}

function middlewareMatchers(): string[] {
  const src = readFileSync(join(ROOT, 'middleware.ts'), 'utf8')
  // Match to the array's CLOSING bracket (on its own line), not the first ']'
  // in the text — matcher entries may legitimately contain character classes
  // like '/([dD][oO][cC][sS].*)' (the case-insensitive docs gate, 2026-09-03),
  // and the naive form truncated extraction at the first ']' inside one.
  const block = /matcher:\s*\[([\s\S]*?)\n\s*\]/.exec(src)
  if (!block) throw new Error('middleware.ts: no `matcher: [...]` found — has the export been renamed?')
  return literalsIn(block[1]).filter(Boolean)
}

/** Every `source:`/`destination:` value in next.config.ts, with its line. */
function nextConfigRoutes(): Array<{ kind: string; value: string; line: number }> {
  const src = readFileSync(join(ROOT, 'next.config.ts'), 'utf8')
  const out: Array<{ kind: string; value: string; line: number }> = []
  src.split('\n').forEach((line, i) => {
    if (line.trim().startsWith('//')) return
    for (const m of line.matchAll(/\b(source|destination):\s*'([^']*)'/g)) {
      out.push({ kind: m[1], value: m[2], line: i + 1 })
    }
  })
  return out
}

function parseError(pattern: string): string | null {
  try {
    pathToRegexp(pattern)
    return null
  } catch (e) {
    return e instanceof Error ? e.message : String(e)
  }
}

describe('route configuration parses with the parser Next builds with', () => {
  it('finds the surfaces it claims to guard', () => {
    // A guard that silently matches nothing is worse than no guard, because it
    // reports a pass. Both extractors must return real work.
    expect(middlewareMatchers().length).toBeGreaterThan(10)
    expect(nextConfigRoutes().length).toBeGreaterThan(10)
  })

  it('every middleware matcher compiles', () => {
    const bad = middlewareMatchers()
      .map((m) => ({ m, err: parseError(m) }))
      .filter((r) => r.err)
    expect(
      bad.map((r) => `middleware.ts matcher '${r.m}' — ${r.err}`),
      'these matchers fail at BUILD time; the deploy errors and production pins to the previous build',
    ).toEqual([])
  })

  it('every next.config redirect source and destination compiles', () => {
    const bad = nextConfigRoutes()
      .map((r) => ({ ...r, err: parseError(r.value) }))
      .filter((r) => r.err)
    expect(
      bad.map((r) => `next.config.ts:${r.line} ${r.kind} '${r.value}' — ${r.err}`),
      'same parser as the matcher above; same build failure',
    ).toEqual([])
  })

  it('a matcher never uses two adjacent parameters', () => {
    // The specific shape that shipped. Caught by the compile checks above too,
    // but named explicitly so the failure message teaches the rule rather than
    // just quoting path-to-regexp at whoever hits it next.
    const adjacent = /:[A-Za-z_][A-Za-z0-9_]*(?:\([^)]*\))?[?*+]?:/
    const offenders = [
      ...middlewareMatchers().map((v) => ({ where: 'middleware matcher', v })),
      ...nextConfigRoutes().map((r) => ({ where: `next.config.ts:${r.line} ${r.kind}`, v: r.value })),
    ].filter((x) => adjacent.test(x.v))
    expect(
      offenders.map((x) => `${x.where} '${x.v}' — put literal text between parameters, or use a regex group like '/(docs.*)'`),
      'path-to-regexp requires text between two parameters',
    ).toEqual([])
  })

  it('the guard actually fires on the pattern that shipped', () => {
    // Non-vacuity. Every check above passes on a clean tree, so each one is
    // proven here against the exact string that failed the deploy, plus the
    // replacement that fixed it.
    const shipped = '/docs:suffix(-|_)?:rest*'
    expect(parseError(shipped)).toMatch(/Must have text between two parameters/)
    expect(/:[A-Za-z_][A-Za-z0-9_]*(?:\([^)]*\))?[?*+]?:/.test(shipped)).toBe(true)

    // And the forms actually in use are accepted, so the guard is not merely
    // rejecting everything.
    for (const ok of ['/(docs.*)', '/docs/:path*', '/(CourseContent_2026.*)', '/blog-1/:slug*']) {
      expect(parseError(ok), `${ok} must still be accepted`).toBeNull()
    }
  })

  it('the paid-toolkit directory the bypass lived in is gone and stays gone', () => {
    // The matcher makes the class unreachable; this makes sure nobody restores
    // the instance. /docs_backup_2026-01/ held md5-identical copies of every
    // PAID_DOCS asset and served them 200 to anonymous requests.
    const { existsSync, readdirSync } = require('node:fs') as typeof import('node:fs')
    const publicDir = join(ROOT, 'public')
    const backupLike = readdirSync(publicDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && /^docs[-_.]/i.test(d.name))
      .map((d) => d.name)
    expect(
      backupLike,
      'a docs-like sibling directory under public/ is served by the CDN; the paid gate keys on /docs/ exactly',
    ).toEqual([])
    expect(existsSync(join(publicDir, 'docs_backup_2026-01'))).toBe(false)
  })
})
