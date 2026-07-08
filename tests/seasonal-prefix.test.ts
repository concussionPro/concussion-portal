import { describe, it, expect } from 'vitest'
import { seasonalPrefix, melbourneMonth } from '@/lib/prospect/email-templates'

const UNDERWAY = 'With winter sport season underway, '
const ABOUT = 'With footy season about to start, '
const FINALS = 'With finals season here, '

describe('seasonalPrefix — AU contact-sport calendar', () => {
  it('is "underway" through the winter season (Apr–Aug)', () => {
    for (const iso of ['2026-04-15', '2026-05-15', '2026-06-15', '2026-07-08', '2026-08-15']) {
      expect(seasonalPrefix(new Date(`${iso}T02:00:00Z`))).toBe(UNDERWAY)
    }
  })

  it('is "about to start" in the pre-season ramp (Feb–Mar)', () => {
    expect(seasonalPrefix(new Date('2026-02-15T02:00:00Z'))).toBe(ABOUT)
    expect(seasonalPrefix(new Date('2026-03-15T02:00:00Z'))).toBe(ABOUT)
  })

  it('is finals framing in September', () => {
    expect(seasonalPrefix(new Date('2026-09-15T02:00:00Z'))).toBe(FINALS)
  })

  it('is silent off-season (Oct–Jan)', () => {
    for (const iso of ['2026-10-15', '2026-11-15', '2026-12-15', '2026-01-15']) {
      expect(seasonalPrefix(new Date(`${iso}T02:00:00Z`))).toBe('')
    }
  })

  it('evaluates the month in Melbourne, not UTC (boundary safety)', () => {
    // 2026-03-31 14:00 UTC = 2026-04-01 01:00 Melbourne (AEDT +11).
    // Naive UTC getMonth() = March → would wrongly say "about to start".
    // Melbourne = April → correctly "underway".
    const d = new Date('2026-03-31T14:00:00Z')
    expect(melbourneMonth(d)).toBe(3) // April (0-indexed)
    expect(seasonalPrefix(d)).toBe(UNDERWAY)
  })
})
