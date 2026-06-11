/**
 * Tests for the Concussion Care PARTNERSHIP arm pure helpers + seed data.
 * No DB — repo.ts (Postgres) is deliberately not imported here.
 */
import { describe, it, expect } from 'vitest'
import { kebabCase, generateAccessKey, tierForType } from '@/lib/partners/helpers'
import { PARTNER_SEED } from '@/lib/partners/seed-data'

describe('kebabCase (slug generation)', () => {
  it('lowercases and hyphenates plain names', () => {
    expect(kebabCase('Newington College')).toBe('newington-college')
    expect(kebabCase('Hunter Academy of Sport')).toBe('hunter-academy-of-sport')
  })

  it('drops apostrophes rather than turning them into hyphens', () => {
    expect(kebabCase("The King's School")).toBe('the-kings-school')
    expect(kebabCase("Brisbane Boys' College")).toBe('brisbane-boys-college')
    expect(kebabCase("St Joseph's College Hunters Hill")).toBe('st-josephs-college-hunters-hill')
    expect(kebabCase("St Ignatius' College Riverview")).toBe('st-ignatius-college-riverview')
  })

  it('trims and collapses surrounding/space runs', () => {
    expect(kebabCase('  AIS  ')).toBe('ais')
    expect(kebabCase('SA Institute  of   Sport')).toBe('sa-institute-of-sport')
  })
})

describe('generateAccessKey', () => {
  it('produces unguessable, non-deterministic keys', () => {
    const a = generateAccessKey()
    const b = generateAccessKey()
    expect(a).not.toBe(b)
    // 8 bytes base64url ≈ 11 chars
    expect(a.length).toBeGreaterThanOrEqual(10)
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/) // base64url alphabet
  })
})

describe('tierForType', () => {
  it('maps academy→1, school→2, club→3', () => {
    expect(tierForType('academy')).toBe(1)
    expect(tierForType('school')).toBe(2)
    expect(tierForType('club')).toBe(3)
  })
})

describe('PARTNER_SEED', () => {
  it('produces unique slugs across the whole list', () => {
    const slugs = PARTNER_SEED.map((s) => kebabCase(s.name))
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('keeps tier consistent with type', () => {
    for (const s of PARTNER_SEED) {
      expect(tierForType(s.type)).toBe(
        s.type === 'academy' ? 1 : s.type === 'school' ? 2 : 3,
      )
    }
  })

  it('marks Hunter Academy of Sport as lead #1', () => {
    const hunter = PARTNER_SEED.find((s) => s.name === 'Hunter Academy of Sport')
    expect(hunter?.notes).toBe('lead #1')
  })

  it('contains the expected SOM volume (academies + named-association schools)', () => {
    const academies = PARTNER_SEED.filter((s) => s.type === 'academy').length
    const schools = PARTNER_SEED.filter((s) => s.type === 'school').length
    expect(academies).toBe(18) // 9 NIN + 9 NSW RAS
    expect(schools).toBe(35) // AAGPS 9 + CAS 6 + GPS QLD 9 + APS VIC 11
  })
})
