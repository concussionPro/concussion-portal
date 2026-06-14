import { describe, it, expect } from 'vitest'
import { decideOutreach, classifyBatch } from '@/lib/prospect/outreach-decision'

describe('outreach decision — manual email is the CLOSE, not a nudge (Zac 2026-06-14)', () => {
  // ── DIRECT only fires on a genuine buying signal worth Zac's time ──────────
  it('RETURN visit → direct (the strongest signal)', () => {
    const d = decideOutreach({ sectionFunnel: { pricing: 1, 'onsite-hero': 1 }, maxDwellMs: 15000, sessions: 2 })
    expect(d.action).toBe('direct')
    expect(d.reason).toMatch(/came back|return/i)
  })

  it('hit NEXT-STEP CTA → direct (explicit "what now")', () => {
    const d = decideOutreach({ sectionFunnel: { 'next-step': 1, hero: 1 }, maxDwellMs: 12000 })
    expect(d.action).toBe('direct')
    expect(d.reason).toMatch(/next-step/i)
  })

  it('opened TRIAL + viewed PRICING → direct (deep, both feet in)', () => {
    const d = decideOutreach({ sectionFunnel: { 'module-1-trial': 1, pricing: 1 }, maxDwellMs: 20000 })
    expect(d.action).toBe('direct')
    expect(d.reason).toMatch(/trial.*pricing|both feet/i)
  })

  it('studied PRICING hard (≥45s) → direct', () => {
    const d = decideOutreach({ sectionFunnel: { pricing: 2, 'onsite-hero': 1 }, maxDwellMs: 50000 })
    expect(d.action).toBe('direct')
    expect(d.reason).toMatch(/studied pricing|walk the numbers/i)
  })

  // ── The key correction: single pricing view → NURTURE, wait for return ─────
  it('viewed PRICING ONCE, brief → NURTURE (wait for return visit)', () => {
    const d = decideOutreach({ sectionFunnel: { pricing: 1, 'onsite-hero': 1 }, maxDwellMs: 20000 })
    expect(d.action).toBe('nurture')
    expect(d.reason).toMatch(/return visit/i)
  })

  it('opened trial once (no pricing, single visit) → NURTURE', () => {
    const d = decideOutreach({ sectionFunnel: { 'module-1-trial': 1, hero: 1 }, maxDwellMs: 15000 })
    expect(d.action).toBe('nurture')
    expect(d.openedTrial).toBe(true)
  })

  it('skimmed hero only → nurture (far too early)', () => {
    const d = decideOutreach({ sectionFunnel: { hero: 1 }, maxDwellMs: 4000 })
    expect(d.action).toBe('nurture')
    expect(d.reason).toMatch(/skimmed|too early/i)
  })

  it('engaged low-intent, no pricing/trial → nurture', () => {
    const d = decideOutreach({ sectionFunnel: { hero: 2, credibility: 2 }, maxDwellMs: 25000 })
    expect(d.action).toBe('nurture')
  })

  it('zero engagement → nurture, score 0', () => {
    const d = decideOutreach({ sectionFunnel: {}, maxDwellMs: 0 })
    expect(d.action).toBe('nurture')
    expect(d.score).toBe(0)
  })

  it('returned + deep beats a single-view browse on score; classifyBatch sorts + splits', () => {
    const rows: Array<{ id: number; engagement: { sectionFunnel: Record<string, number>; maxDwellMs: number; sessions?: number } }> = [
      { id: 1, engagement: { sectionFunnel: { pricing: 1 }, maxDwellMs: 20000 } },             // single pricing → nurture
      { id: 2, engagement: { sectionFunnel: { pricing: 2, 'next-step': 1 }, maxDwellMs: 60000, sessions: 2 } }, // returned + deep → direct
      { id: 3, engagement: { sectionFunnel: { hero: 1 }, maxDwellMs: 3000 } },                  // skim → nurture
    ]
    const { direct, nurture } = classifyBatch(rows)
    expect(direct.map((d) => d.id)).toEqual([2])
    expect(nurture.map((d) => d.id).sort()).toEqual([1, 3])
  })
})
