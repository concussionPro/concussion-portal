import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

describe('SCAT / Module 8 funnel exit conversion', () => {
  it('ScatFunnelExits supports ownsOnline → /upgrade (no Online re-sell)', () => {
    const src = readFileSync(join(root, 'components/scat/ScatFunnelExits.tsx'), 'utf8')
    expect(src).toMatch(/ownsOnline\??/)
    expect(src).toContain('href="/upgrade"')
    expect(src).toContain('Pay the difference')
    expect(src).toContain("context === 'module-8'")
    expect(src).toContain('Enrol Online')
  })

  it('CourseModulePage wires dual-exit on SCAT complete + Module 8 Online finish', () => {
    const src = readFileSync(join(root, 'components/course/CourseModulePage.tsx'), 'utf8')
    expect(src).toContain("from '@/components/scat/ScatFunnelExits'")
    expect(src).toContain('context="scat-complete"')
    expect(src).toContain('context="module-8"')
    expect(src).toContain('ownsOnline')
    expect(src).not.toMatch(/module_8_online_only[\s\S]{0,400}\/pricing#pricing-cards/)
    expect(src).toContain('Online finish without certificate CTA')
  })

  it('scat-mastery still hosts public dual-exit', () => {
    const src = readFileSync(join(root, 'app/scat-mastery/page.tsx'), 'utf8')
    expect(src).toContain('ScatFunnelExits')
    expect(src).toContain('context="scat-mastery"')
  })

  it('scat-mastery keeps clinic-day engagement AFTER dual exits (not above)', () => {
    const src = readFileSync(join(root, 'app/scat-mastery/page.tsx'), 'utf8')
    const exits = src.indexOf('<ScatFunnelExits context="scat-mastery"')
    const engage = src.indexOf('Use it this week')
    expect(exits).toBeGreaterThan(-1)
    expect(engage).toBeGreaterThan(exits)
    expect(src).not.toMatch(/Also free · second course[\s\S]{0,80}Concussion Care Has Changed/)
    expect(src).not.toMatch(/bg-gradient-to-br from-\[#0d5c63\][\s\S]{0,200}Also free/)
  })

  it('AfterTheAssessment: free mastery + Online + SST dual exit', () => {
    const src = readFileSync(join(root, 'components/scat-forms/AfterTheAssessment.tsx'), 'utf8')
    expect(src).toContain('href="/scat-mastery"')
    expect(src).toContain('Start free course')
    expect(src).toContain('Enrol Online')
    expect(src).toContain('href="/pricing"')
    expect(src).toContain('href="/clinical-suite"')
    expect(src).toContain('See SST Clinical Testing')
  })

  it('SCAT form Clients land completers on AfterTheAssessment (not mastery-only)', () => {
    for (const rel of [
      'app/scat-forms/scat6/Client.tsx',
      'app/scat-forms/child-scat6/Client.tsx',
      'app/scat-forms/scoat6/Client.tsx',
    ]) {
      const src = readFileSync(join(root, rel), 'utf8')
      expect(src).toContain("from '@/components/scat-forms/AfterTheAssessment'")
      expect(src).toContain('<AfterTheAssessment')
      expect(src).not.toContain('Want to master the SCAT6?')
      expect(src).not.toContain('Want to master the SCOAT6?')
    }
  })

  it('OrganicOfferStrip routes to Enrol Online (not buried /courses hub)', () => {
    const src = readFileSync(join(root, 'components/OrganicOfferStrip.tsx'), 'utf8')
    expect(src).toContain('/pricing?src=')
    expect(src).toContain('Enrol Online')
    expect(src).not.toContain('/courses?src=')
  })

  it('SoftScatPaidBridge on Module 101 completion (course-intent soft bridge)', () => {
    const bridge = readFileSync(join(root, 'components/scat/SoftScatPaidBridge.tsx'), 'utf8')
    expect(bridge).toContain('/pricing?promo=')
    expect(bridge).toContain('Clinical competency is the next layer')
    expect(bridge).toContain('PROMO_CODE')
    expect(bridge).toContain('SCAT_DISCOUNT_AUD')

    const page = readFileSync(join(root, 'components/course/CourseModulePage.tsx'), 'utf8')
    expect(page).toContain("from '@/components/scat/SoftScatPaidBridge'")
    expect(page).toContain('source="scat_module1_complete"')
    expect(page).toMatch(/moduleId === 101 && accessLevel === 'preview'/)
    // Cold drip pause must stay — soft bridge is UI-only, not unpausing nurture days
    const cron = readFileSync(join(root, 'app/api/cron/send-nurture-emails/route.ts'), 'utf8')
    expect(cron).toContain('PAUSED_SCAT_MASTERY_DAYS = new Set([3, 10, 28, 42])')
    expect(cron).toContain('PAUSED_PDF_LEAD_DAYS = new Set([3, 14, 45])')
  })

})
