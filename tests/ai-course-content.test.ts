import { describe, it, expect } from 'vitest'
import { MODULES, findModule } from '@/lib/ai-course/content'
import { TOOLS } from '@/lib/ai-course/tools-matrix'
import { CONTENT_SOURCES } from '@/lib/ai-course/content-sources'

describe('AI course module catalogue', () => {
  it('has at least 9 modules covering compliance, tools, docs, comms, specialties, hub', () => {
    expect(MODULES.length).toBeGreaterThanOrEqual(9)
  })

  it('module 1 is flagged as load-bearing (required reading)', () => {
    const m1 = MODULES.find((m) => m.slug === 'module-1-compliance')
    expect(m1).toBeDefined()
    expect(m1?.loadBearing).toBe(true)
  })

  it('per-clinician reading time is at most 2 hours (any single specialty + core modules)', () => {
    // Specialty modules are alternatives — one clinician reads one specialty,
    // not all four. So per-user reading time = sum of non-specialty modules
    // + the longest single specialty module.
    const isSpecialty = (slug: string) => slug.includes('module-5-')
    const core = MODULES.filter((m) => !isSpecialty(m.slug))
    const specialty = MODULES.filter((m) => isSpecialty(m.slug))
    const coreMin = core.reduce((s, m) => s + m.durationMin, 0)
    const longestSpecialty = Math.max(0, ...specialty.map((m) => m.durationMin))
    const perUserMin = coreMin + longestSpecialty
    expect(perUserMin).toBeLessThanOrEqual(120)
  })

  it('every module has a non-empty title and description', () => {
    for (const m of MODULES) {
      expect(m.title.length).toBeGreaterThan(5)
      expect(m.description.length).toBeGreaterThan(20)
    }
  })

  it('findModule returns undefined for unknown slug, the module for known', () => {
    expect(findModule('nope')).toBeUndefined()
    expect(findModule('module-1-compliance')?.number).toBe(1)
  })

  it('module slugs are URL-safe (lowercase, hyphens only)', () => {
    for (const m of MODULES) {
      expect(m.slug).toMatch(/^[a-z0-9-]+$/)
    }
  })
})

describe('AI course tools matrix', () => {
  it('contains at least one Tier A (healthcare-purpose-built) tool', () => {
    expect(TOOLS.some((t) => t.tier === 'A')).toBe(true)
  })

  it('contains at least one Tier C (consumer) tool', () => {
    expect(TOOLS.some((t) => t.tier === 'C')).toBe(true)
  })

  it('every tool has a name, vendor, URL, primary use', () => {
    for (const t of TOOLS) {
      expect(t.name.length).toBeGreaterThan(0)
      expect(t.vendor.length).toBeGreaterThan(0)
      expect(t.url).toMatch(/^https?:\/\//)
      expect(t.primaryUse.length).toBeGreaterThan(0)
    }
  })

  it('tier C tools do not claim AU residency (they are consumer-grade)', () => {
    for (const t of TOOLS) {
      if (t.tier === 'C') {
        expect(t.auResidency).toBe(false)
      }
    }
  })

  it('Heidi Health is listed as Tier A with AU residency', () => {
    const heidi = TOOLS.find((t) => t.name.toLowerCase().includes('heidi'))
    expect(heidi).toBeDefined()
    expect(heidi?.tier).toBe('A')
    expect(heidi?.auResidency).toBe(true)
  })
})

describe('AI course content sources', () => {
  it('monitors at least one regulator, one insurer, one tool vendor, one professional body', () => {
    const cats = new Set(CONTENT_SOURCES.map((s) => s.category))
    expect(cats.has('regulator')).toBe(true)
    expect(cats.has('insurer')).toBe(true)
    expect(cats.has('tool-vendor')).toBe(true)
    expect(cats.has('professional-body')).toBe(true)
  })

  it('every source has a non-empty url, name, watchFor, and affectsModules array', () => {
    for (const s of CONTENT_SOURCES) {
      expect(s.url).toMatch(/^https?:\/\//)
      expect(s.name.length).toBeGreaterThan(0)
      expect(s.watchFor.length).toBeGreaterThan(0)
      expect(s.affectsModules.length).toBeGreaterThan(0)
    }
  })

  it('AHPRA, OAIC, and TGA are all monitored as regulators', () => {
    const regulators = CONTENT_SOURCES.filter((s) => s.category === 'regulator').map((s) => s.id)
    expect(regulators.some((id) => id.includes('ahpra'))).toBe(true)
    expect(regulators.some((id) => id.includes('oaic'))).toBe(true)
    expect(regulators.some((id) => id.includes('tga'))).toBe(true)
  })

  it('source ids are unique', () => {
    const ids = CONTENT_SOURCES.map((s) => s.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })
})
