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
    // Online enrol still exists for free SCAT path
    expect(src).toContain('Enrol Online')
  })

  it('CourseModulePage wires dual-exit on SCAT complete + Module 8 Online finish', () => {
    const src = readFileSync(join(root, 'components/course/CourseModulePage.tsx'), 'utf8')
    expect(src).toContain("from '@/components/scat/ScatFunnelExits'")
    expect(src).toContain('context="scat-complete"')
    expect(src).toContain('context="module-8"')
    expect(src).toContain('ownsOnline')
    // Must not send Online owners to full-price Complete on /pricing from the invite
    expect(src).not.toMatch(/module_8_online_only[\s\S]{0,400}\/pricing#pricing-cards/)
  })

  it('scat-mastery still hosts public dual-exit', () => {
    const src = readFileSync(join(root, 'app/scat-mastery/page.tsx'), 'utf8')
    expect(src).toContain('ScatFunnelExits')
    expect(src).toContain('context="scat-mastery"')
  })
})

  it('scat-mastery keeps clinic-day engagement AFTER dual exits (not above)', () => {
    const src = readFileSync(join(root, 'app/scat-mastery/page.tsx'), 'utf8')
    const exits = src.indexOf('<ScatFunnelExits context="scat-mastery"')
    const engage = src.indexOf('Use it this week')
    expect(exits).toBeGreaterThan(-1)
    expect(engage).toBeGreaterThan(exits)
    // Must not resurrect CCHC banner JSX above exits (comment mentions OK)
    expect(src).not.toMatch(/Also free · second course[\s\S]{0,80}Concussion Care Has Changed/)
    expect(src).not.toMatch(/bg-gradient-to-br from-\[#0d5c63\][\s\S]{0,200}Also free/)
  })

