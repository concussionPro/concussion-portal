import { describe, it, expect } from 'vitest'
import { regionalPriority } from '@/lib/prospect/regional-priority'

describe('regional accessibility priority (Byron / OOL / BNK)', () => {
  it('drive-from-Byron centres score highest', () => {
    for (const c of ['Gold Coast', 'Lismore', 'Sunshine Coast', 'Toowoomba', 'Brisbane', 'Coffs Harbour']) {
      const r = regionalPriority(c, 'QLD')
      expect(r.tier === 'drive', `${c}`).toBe(true)
      expect(r.score).toBe(100)
    }
  })
  it('fly-regional centres serviced from OOL/BNK score high', () => {
    expect(regionalPriority('Newcastle', 'NSW').tier).toBe('fly-regional')
    expect(regionalPriority('Cairns', 'QLD').tier).toBe('fly-regional')
    expect(regionalPriority('Townsville', 'QLD').score).toBe(80)
  })
  it('capital-city metros are deprioritised (CPD-saturated)', () => {
    for (const c of ['Bondi Junction', 'Cronulla', 'Subiaco', 'Norwood', 'East Bentleigh']) {
      const r = regionalPriority(c, 'NSW')
      expect(r.tier, `${c}`).toBe('metro')
      expect(r.score).toBeLessThan(50)
    }
  })
  it('drive beats fly beats metro', () => {
    const drive = regionalPriority('Gold Coast', 'QLD').score
    const fly = regionalPriority('Cairns', 'QLD').score
    const metro = regionalPriority('Bondi', 'NSW').score
    expect(drive).toBeGreaterThan(fly)
    expect(fly).toBeGreaterThan(metro)
  })
  it('unknown city falls back to state', () => {
    expect(regionalPriority('Unknown', 'NSW').score).toBeGreaterThan(regionalPriority('Unknown', 'WA').score)
  })
})
