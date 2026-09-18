import { describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * /pricing-international fold fix (analytics WO 13 Sep 2026):
 * money-path sessions died on the page — rework: cut length, restate offer,
 * put the next step at the exit. Prior weekday pass (15 Sep) skipped this.
 */
describe('intl pricing fold conversion', () => {
  const tabs = readFileSync(join(process.cwd(), 'components/international/IntlCoursesTabs.tsx'), 'utf8')
  const ccm = readFileSync(join(process.cwd(), 'components/ccm/CcmInternationalContent.tsx'), 'utf8')
  const crm = readFileSync(join(process.cwd(), 'components/crm/CrmInternationalContent.tsx'), 'utf8')
  const previewMod = readFileSync(join(process.cwd(), 'app/preview/[module]/page.tsx'), 'utf8')

  it('IntlCoursesTabs enables heroFlow + priceFirst for CCM and CRM', () => {
    expect(tabs.includes('heroFlow: true')).toBe(true)
    expect(tabs.includes('priceFirst: true')).toBe(true)
    expect(tabs.includes('priceCardInHero: true')).toBe(true)
    expect(tabs.includes('Online concussion CPD in your local currency')).toBe(true)
  })

  it('CCM puts pricing before media when priceFirst and marks the fold-fix', () => {
    expect(ccm.includes('priceFirst?: boolean')).toBe(true)
    expect(ccm.includes('data-cea-conversion="intl-fold-fix-sep18"')).toBe(true)
    expect(ccm.includes('Start SST Clinical Testing')).toBe(true)
    expect(ccm.includes('href="/clinical-suite"')).toBe(true)
    // priceFirst branch renders pricingSection before optional heroMedia
    const heroBlock = ccm.slice(ccm.indexOf('{heroFlow && ('), ccm.indexOf('{!audience.standardsBandTop'))
    expect(heroBlock.includes('priceFirst')).toBe(true)
    expect(heroBlock.indexOf('{pricingSection}')).toBeLessThan(heroBlock.indexOf('{audience.heroMedia}'))
  })

  it('CCM collapses secondary showcase/tools on priceFirst', () => {
    expect(ccm.includes('See inside the course (optional)')).toBe(true)
    expect(ccm.includes('Clinical tools included with enrolment')).toBe(true)
  })

  it('CRM priceFirst puts card in hero without training photo first', () => {
    expect(crm.includes('priceFirst?: boolean')).toBe(true)
    expect(crm.includes('Start SST Clinical Testing')).toBe(true)
  })

  it('preview module pages expose an above-fold enrol CTA', () => {
    expect(previewMod.includes('Above-fold enrol')).toBe(true)
    // enrol Link appears twice (above-fold + bottom)
    const enrolHits = previewMod.split('href={meta.enrolHref}').length - 1
    expect(enrolHits).toBeGreaterThanOrEqual(2)
  })
})
