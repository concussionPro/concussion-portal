import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

/**
 * The utm payload posted to a checkout route must use utm_source / utm_medium /
 * utm_campaign keys.
 *
 * WHY THIS TEST EXISTS. lib/stripe.ts stamps Stripe metadata from
 * `utm?.utm_source`, but `utmSchema` (lib/schemas.ts) is a loose
 * `record(string, string)` — so a payload of `{ source, medium, campaign }`
 * passes validation, returns HTTP 200, mints a perfectly good Checkout
 * Session, and stamps NO attribution at all. Nothing fails. The purchase just
 * arrives anonymous.
 *
 * Found 2026-10-14 by reading a live session back off Stripe while walking the
 * OA conference QR flow: metadata carried `source: 'portal'` and no
 * `utm_source`, despite the caller passing one. Three callers had the wrong
 * shape — /oa2026, /melbourne-nov7 and the international CCM content — so the
 * quarterly blast's purchases had never been attributable either.
 *
 * This is a key-NAME bug in a loosely-typed field: TypeScript cannot catch it,
 * the schema will not reject it, and the only visible symptom is a reporting
 * gap nobody looks at until they need the number. Hence a lint-style test.
 */

const ROOT = join(__dirname, '..')
const SEARCH_DIRS = ['app', 'components']
const UTM_LITERAL = /utm:\s*\{([^}]*)\}/g

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry.startsWith('.')) continue
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(ts|tsx)$/.test(p)) out.push(p)
  }
  return out
}

describe('utm payloads stamp attribution', () => {
  const files = SEARCH_DIRS.flatMap((d) => walk(join(ROOT, d)))

  it('finds the callers at all (guards against the regex silently matching nothing)', () => {
    const withUtm = files.filter((f) => /utm:\s*\{/.test(readFileSync(f, 'utf8')))
    expect(withUtm.length).toBeGreaterThan(0)
  })

  it('every inline utm object uses utm_-prefixed keys', () => {
    const offenders: string[] = []
    for (const file of files) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(UTM_LITERAL)) {
        const body = m[1]
        // Keys as written: `source:`, `utm_source:`, `'utm_source':` …
        const keys = [...body.matchAll(/(?:^|[,{\s])['"]?([A-Za-z_][A-Za-z0-9_]*)['"]?\s*:/g)].map(
          (k) => k[1],
        )
        for (const key of keys) {
          // Spread/aliased values are not literal keys; only flag bare ones.
          if (['source', 'medium', 'campaign', 'term', 'content'].includes(key)) {
            offenders.push(`${file.replace(ROOT + '/', '')} → utm: { ${key}: … }`)
          }
        }
      }
    }
    expect(
      offenders,
      `utm keys must be utm_source/utm_medium/utm_campaign — lib/stripe.ts reads utm?.utm_source, ` +
        `and utmSchema accepts any string key, so these stamp nothing:\n  ${offenders.join('\n  ')}`,
    ).toEqual([])
  })

  it('lib/stripe.ts still reads the utm_ keys this test enforces', () => {
    // If the reader ever changes shape, this test is enforcing the wrong thing.
    const stripeSrc = readFileSync(join(ROOT, 'lib/stripe.ts'), 'utf8')
    expect(stripeSrc).toContain('utm?.utm_source')
  })
})
