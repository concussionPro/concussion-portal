import { describe, it, expect } from 'vitest'
import { decideOutreach, classifyBatch } from '@/lib/prospect/outreach-decision'

describe('outreach decision engine — direct vs nurture from real engagement', () => {
  it('PRICING view → direct (sales-ready)', () => {
    const d = decideOutreach({ sectionFunnel: { pricing: 3, hero: 1, 'onsite-hero': 3 }, maxDwellMs: 43000 })
    expect(d.action).toBe('direct')
    expect(d.reason).toMatch(/personally/i)
    expect(d.reason).toMatch(/pricing/i)
    expect(d.signals).toContain('Pricing')
  })

  it('opened the Module 1 TRIAL → direct + openedTrial flag + named in reason', () => {
    const d = decideOutreach({ sectionFunnel: { 'module-1-trial': 1, hero: 1 }, maxDwellMs: 20000 })
    expect(d.action).toBe('direct')
    expect(d.openedTrial).toBe(true)
    expect(d.reason).toMatch(/trial/i)
  })

  it('next-step CTA → direct', () => {
    const d = decideOutreach({ sectionFunnel: { 'next-step': 1, hero: 1, credibility: 1 }, maxDwellMs: 15000 })
    expect(d.action).toBe('direct')
    expect(d.reason).toMatch(/next-step/i)
  })

  it('return visit (2 sessions) on pricing → direct, reason mentions came back', () => {
    const d = decideOutreach({ sectionFunnel: { pricing: 1, 'onsite-hero': 1 }, maxDwellMs: 12000, sessions: 2 })
    expect(d.action).toBe('direct')
    expect(d.reason).toMatch(/came back/i)
  })

  it('skimmed hero only, 4s → nurture (too early)', () => {
    const d = decideOutreach({ sectionFunnel: { hero: 1 }, maxDwellMs: 4000 })
    expect(d.action).toBe('nurture')
    expect(d.reason).toMatch(/skimmed|too early/i)
  })

  it('engaged low-intent sections, decent dwell, NO pricing/trial → nurture', () => {
    const d = decideOutreach({ sectionFunnel: { hero: 2, credibility: 2, footer: 1 }, maxDwellMs: 25000 })
    expect(d.action).toBe('nurture')
    expect(d.reason).toMatch(/nurture/i)
    expect(d.openedTrial).toBe(false)
  })

  it('zero engagement → nurture, score 0', () => {
    const d = decideOutreach({ sectionFunnel: {}, maxDwellMs: 0 })
    expect(d.action).toBe('nurture')
    expect(d.score).toBe(0)
  })

  it('score is higher for pricing+trial+long dwell than a single shallow signal', () => {
    const hot = decideOutreach({ sectionFunnel: { pricing: 3, 'module-1-trial': 1, 'next-step': 1 }, maxDwellMs: 66000, sessions: 2 })
    const warm = decideOutreach({ sectionFunnel: { 'trial-cta': 1 }, maxDwellMs: 4000 })
    expect(hot.score).toBeGreaterThan(warm.score)
    expect(hot.action).toBe('direct')
  })

  it('classifyBatch splits + sorts hot-first', () => {
    const rows: Array<{ id: number; engagement: { sectionFunnel: Record<string, number>; maxDwellMs: number } }> = [
      { id: 1, engagement: { sectionFunnel: { hero: 1 }, maxDwellMs: 3000 } },
      { id: 2, engagement: { sectionFunnel: { pricing: 3, 'module-1-trial': 1 }, maxDwellMs: 60000 } },
      { id: 3, engagement: { sectionFunnel: { 'next-step': 1 }, maxDwellMs: 12000 } },
    ]
    const { direct, nurture } = classifyBatch(rows)
    expect(direct.map((d) => d.id)).toEqual([2, 3]) // sorted by score desc
    expect(nurture.map((d) => d.id)).toEqual([1])
  })
})
