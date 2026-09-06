import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildSecureSeatUrgency } from '@/lib/secure-seat-urgency'

const root = process.cwd()

describe('prod FAIL regressions (half-full / scat6 braces / complete-reference)', () => {
  it('ready-to-train gates n/12 until half full (paid >= 6)', () => {
    const src = readFileSync(join(root, 'app/ready-to-train/page.tsx'), 'utf8')
    expect(src).toMatch(/const SHOW_COUNT_FROM = 6/)
    expect(src).toMatch(/c\.paid >= SHOW_COUNT_FROM/)
    expect(src).not.toMatch(/showProgress = showCount && !c\.ranAlready && c\.paid > 0/)
  })

  it('buildSecureSeatUrgency omits numeric n/12 below half full', () => {
    const low = buildSecureSeatUrgency({
      cityLabel: 'Sydney',
      enrolled: 3,
      threshold: 12,
      progressKnown: true,
    })
    expect(low.progressLine).not.toMatch(/\d+\s+of\s+12/)
    const mid = buildSecureSeatUrgency({
      cityLabel: 'Sydney',
      enrolled: 6,
      threshold: 12,
      progressKnown: true,
    })
    expect(mid.progressLine).toMatch(/6 of 12/)
  })


  it('SpotsRemaining uses half-full urgency (no raw N spots remaining below half)', () => {
    const src = readFileSync(join(root, 'components/SpotsRemaining.tsx'), 'utf8')
    expect(src).toContain('buildSecureSeatUrgency')
    expect(src).toContain('progressKnown: true')
    expect(src).not.toMatch(/\{spotsLeft\} \{spotsLeft === 1 \? 'spot' : 'spots'\} remaining/)
  })

  it('melbourne-nov7 seat line uses half-full urgency (no raw seats left below half)', () => {
    const src = readFileSync(join(root, 'app/melbourne-nov7/page.tsx'), 'utf8')
    expect(src).toContain('buildSecureSeatUrgency')
    expect(src).not.toContain('seats left — capped at')
  })

  it('ClinicalToolkitDoc parses {scat6_*} merge tokens (digits)', () => {
    const src = readFileSync(join(root, 'components/toolkit/ClinicalToolkitDoc.tsx'), 'utf8')
    expect(src).toContain('[a-z0-9_]')
    expect(src).toContain("curly_brace")
    // Live parse check — digits must match (old [a-z_]+ left scat6 raw).
    const re = /\{([a-z][a-z0-9_]*)\}/g
    expect([...'{scat6_symptom_severity}'.matchAll(re)].map((m) => m[1])).toEqual([
      'scat6_symptom_severity',
    ])
  })

  it('complete-reference uses streamed /docs/ URL, not blob API buffer', () => {
    const page = readFileSync(join(root, 'app/complete-reference/page.tsx'), 'utf8')
    expect(page).toContain("pdfUrl = '/docs/CCM_Complete_Reference_2026.pdf'")
    expect(page).not.toMatch(/createObjectURL|pdfBlobUrl/)
    expect(page).not.toMatch(/const pdfUrl = '\/api\/reference\/download'/)
    expect(page).toMatch(/entitled && !isDemo/)
    expect(page).toContain('Included with enrolment')
    expect(page).not.toContain('Premium Access Required')
    const docsRoute = readFileSync(join(root, 'app/docs/[...slug]/route.ts'), 'utf8')
    expect(docsRoute).toMatch(/createReadStream/)
    const api = readFileSync(join(root, 'app/api/reference/download/route.ts'), 'utf8')
    expect(api).toMatch(/NextResponse\.redirect/)
    expect(api).not.toMatch(/readFile|fs\.readFile/)
  })
})
