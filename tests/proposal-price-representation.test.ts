import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { CONFIG, workshopPriceFor } from '@/lib/config'

/**
 * BESPOKE PROPOSALS MUST COMPARE AGAINST A PRICE SOMEONE IS ACTUALLY CHARGED.
 *
 * The Sydney Physios, Advanced Health Buderim and Totum pages quoted their
 * on-site cohort rates as a saving against A$1,400 — the STICKER price, which
 * is only ever charged in the final CONFIG.WORKSHOP.EARLY_BIRD_DAYS_BEFORE
 * window of a confirmed date. Every one of those clinics would actually have
 * paid workshopPriceFor() (A$1,190 today), so the stated saving was inflated
 * by the difference. Same ACL price-representation defect already fixed
 * elsewhere in the portal.
 *
 * Tier prices and totals are the commercial quote and are NOT asserted here —
 * only that no figure on these pages is a hardcoded price nobody is charged.
 */

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')

const PROPOSALS = [
  'app/proposals/sydney-physios/page.tsx',
  'app/proposals/sydney-physios/print/page.tsx',
  'app/proposals/advanced-health-buderim/page.tsx',
  'components/prospect/TotumLanding.tsx',
]

describe('proposal pages derive the public rate from lib/config', () => {
  for (const p of PROPOSALS) {
    it(`${p} imports workshopPriceFor`, () => {
      expect(read(p)).toMatch(/workshopPriceFor/)
    })

    it(`${p} states no hardcoded 1,400 / 530 / 500 price claim in RENDERED copy`, () => {
      // Comments explaining the fix legitimately name the old figures, so
      // strip them: the assertion is about what a clinic actually reads.
      const src = read(p)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
      // Layout widths like max-w-[1400px] are not price claims.
      const priceClaims = src.match(/\$\s*1,400|A\$1,400|CAD\s*\$1,400|\$500 less|A\$530|A\$500\/clinician/g) ?? []
      expect(priceClaims).toEqual([])
    })

    it(`${p} computes savings from the derived rate, never a literal`, () => {
      expect(read(p)).not.toMatch(/=\s*1400\s*-/)
    })
  }
})

describe('the saving that gets quoted is true', () => {
  it('Sydney: max saving is against the price a Sydney buyer pays today', () => {
    const src = read('app/proposals/sydney-physios/page.tsx')
    expect(src).toContain("const PUBLIC_RATE = workshopPriceFor(CLINIC.locationSlug)")
    expect(src).toMatch(/MAX_SAVING = Math\.max\(\.\.\.COHORT_TIERS\.map\(\(t\) => PUBLIC_RATE - t\.perClinician\)\)/)
    // Sydney is 'collecting' — early bird, so the comparator is PRICE_EARLY_BIRD.
    expect(workshopPriceFor('sydney')).toBe(CONFIG.COURSE.PRICE_EARLY_BIRD)
  })

  it('Buderim: no CONFIG city, so the no-city nomination rate applies', () => {
    const src = read('app/proposals/advanced-health-buderim/page.tsx')
    expect(src).toContain('const PUBLIC_RATE = workshopPriceFor(null)')
    expect(workshopPriceFor(null)).toBe(CONFIG.COURSE.PRICE_EARLY_BIRD)
  })

  it('Totum: no cross-currency saving is asserted at all', () => {
    const src = read('components/prospect/TotumLanding.tsx')
    // There is no CAD list price anywhere in CONFIG, so a "save CAD $X"
    // against one would be a fabricated figure.
    expect(src).not.toMatch(/Save CAD/)
    expect(src).toContain('PUBLIC_SEAT_RATE_AUD')
    // And the AUD reference rate must not be struck through a CAD number.
    expect(src).not.toMatch(/line-through">\{tier\.regular\}/)
  })

  it('the sticker price is still a real, charged price in CONFIG', () => {
    // The fix is about which price we COMPARE to, not about deleting $1,400 —
    // the final 14-day window of a confirmed date genuinely charges it.
    expect(CONFIG.COURSE.PRICE_REGULAR).toBeGreaterThan(CONFIG.COURSE.PRICE_EARLY_BIRD)
    expect(CONFIG.WORKSHOP.EARLY_BIRD_DAYS_BEFORE).toBeGreaterThan(0)
  })
})
