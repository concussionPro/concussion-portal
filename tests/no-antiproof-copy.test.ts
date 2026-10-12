import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * ANTI-PROOF COPY BAN.
 *
 * Owner, 2026-10-12: "dont say about round not forming". Same family as the
 * standing rule against stating a low seat count — a true fact that tells the
 * visitor the thing they are considering does not exist yet, which gives them
 * a reason to wait instead of a reason to act. The QR codes on the submitted
 * OA conference deck land on these pages and cannot be changed, so the pages
 * themselves have to earn the scan.
 */
function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name)
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : walk(p)
    return /\.(tsx?|ts)$/.test(e.name) ? [p] : []
  })
}
const BANNED = [
  /round forming\s*[—-]\s*no date confirmed/i,
  /no date confirmed yet/i,
]

describe('no page tells a visitor the round does not exist', () => {
  const files = [...walk('app/courses'), ...walk('app/oa2026')]

  it('the anti-proof lines appear in no page or meta description', () => {
    const hits: string[] = []
    for (const f of files) {
      const src = readFileSync(f, 'utf8')
      for (const line of src.split('\n')) {
        // the comments explaining the ban quote the banned text
        if (/old line read|BANNED|anti-proof|owner, 2026-10-12/i.test(line)) continue
        if (BANNED.some((re) => re.test(line))) hits.push(`${f}: ${line.trim().slice(0, 90)}`)
      }
    }
    expect(hits, `anti-proof copy found:\n${hits.join('\n')}`).toEqual([])
  })

  it('the deposit is described as refundable AND transferable', () => {
    for (const slug of ['byron-bay', 'sydney']) {
      const src = readFileSync(`app/courses/${slug}/page.tsx`, 'utf8')
      expect(src, slug).toContain('A$100 holds your place')
      expect(src, slug).toMatch(/counts toward anything/i)
    }
  })
})
