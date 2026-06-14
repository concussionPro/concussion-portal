import { describe, it, expect } from 'vitest'
import { conversionScore } from '@/lib/prospect/conversion-score'

describe('conversion-probability score', () => {
  it('unreachable email (low Hunter / role / accept-all) → 0, not queueable', () => {
    expect(conversionScore({ clinicalCount: 8, verificationScore: 50, state: 'QLD' }).score).toBe(0)
    expect(conversionScore({ clinicalCount: 8, verificationScore: 95, hunterRole: true, state: 'QLD' }).reachable).toBe(false)
  })
  it('regional on-site, clean, engaged → band A', () => {
    const s = conversionScore({ city: 'Gold Coast', state: 'QLD', clinicalCount: 12, verificationScore: 95, maxDwellMs: 40000, contactFirstName: 'Sam' })
    expect(s.band).toBe('A')
    expect(s.score).toBeGreaterThan(70)
  })
  it('regional beats metro at same tier', () => {
    const reg = conversionScore({ city: 'Newcastle', state: 'NSW', clinicalCount: 8, verificationScore: 90 }).score
    const metro = conversionScore({ city: 'Bondi', state: 'NSW', clinicalCount: 8, verificationScore: 90 }).score
    expect(reg).toBeGreaterThan(metro)
  })
  it('returned visitor outranks never-engaged same clinic', () => {
    const ret = conversionScore({ city: 'Lismore', state: 'NSW', clinicalCount: 6, verificationScore: 90, sessions: 2 }).score
    const cold = conversionScore({ city: 'Lismore', state: 'NSW', clinicalCount: 6, verificationScore: 90 }).score
    expect(ret).toBeGreaterThan(cold)
  })
  it('on-site outranks individual', () => {
    const onsite = conversionScore({ city: 'Cairns', state: 'QLD', clinicalCount: 8, verificationScore: 90 }).score
    const indiv = conversionScore({ city: 'Cairns', state: 'QLD', clinicalCount: 1, verificationScore: 90 }).score
    expect(onsite).toBeGreaterThan(indiv)
  })
})
