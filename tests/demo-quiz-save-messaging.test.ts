import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Demo / ESSA-review sessions must never claim progress or notes were saved.
 * Live pixel check (/demo/essa → module quiz) previously showed the compact
 * header correctly, but section-0 hero, part-quiz copy, attempt copy, and
 * ModuleNotes still implied persistence.
 */
const root = resolve(__dirname, '..')
const read = (rel: string) => readFileSync(resolve(root, rel), 'utf8')

describe('demo quiz / notes never claim Saved', () => {
  it('CourseModulePage shows demo banner on section 0 and gates save copy', () => {
    const src = read('components/course/CourseModulePage.tsx')
    // Hero (section 0) must carry the same amber disclaimer as the compact header
    expect(src.match(/Demo — progress not saved/g)?.length ?? 0).toBeGreaterThanOrEqual(2)
    expect(src).toMatch(/isDemoViewer \|\| syncState === 'demo'[\s\S]*?Demo — progress not saved/)
    // Part-quiz mid-flow must not unconditionally claim answers are saved
    expect(src).toMatch(/Demo — answers stay on this device only for this visit/)
    expect(src).toMatch(/demo session \(not saved to your record\)/)
    // Broken completion CTA regression (92ed8f52) — must name next module + path
    expect(src).toMatch(/Start Module \$\{isSCATModule \? moduleId - 99 : moduleId \+ 1\}/)
    expect(src).toMatch(/\$\{moduleBasePath\}\/\$\{moduleId \+ 1\}/)
    expect(src).not.toMatch(/router\.push\(hasNext \? `\/` : backHref\)/)
  })

  it('ModuleNotes never flashes Saved for demo responses', () => {
    const src = read('components/course/ModuleNotes.tsx')
    expect(src).toMatch(/isDemo\?: boolean/)
    expect(src).toMatch(/data\?\.demo/)
    expect(src).toMatch(/Demo — not saved/)
    expect(src).toMatch(/Demo session — reflections stay on this visit only/)
  })

  it('EP course nav footer discloses demo for ESSA reviewers', () => {
    const src = read('components/ep-course/EpCourseNavigation.tsx')
    expect(src).toMatch(/user\?\.isDemo/)
    expect(src).toMatch(/Demo — progress not saved/)
  })

  it('CCM ApplyTomorrow M1 does not tell patients rest is critical', () => {
    const src = read('components/course/ApplyTomorrow.tsx')
    expect(src).not.toMatch(/rest is critical/i)
    expect(src).toMatch(/early guided activity/)
  })
})

describe('Squarespace sync doc includes upgrade A$693', () => {
  it('lists canonical portal prices including upgrade', () => {
    const src = read('docs/SQUARESPACE_COPY_SYNC.md')
    expect(src).toMatch(/A\$497/)
    expect(src).toMatch(/A\$1,?190/)
    expect(src).toMatch(/A\$1,?400/)
    expect(src).toMatch(/A\$693/)
    expect(src).toMatch(/upgradePriceFor/)
  })
})
