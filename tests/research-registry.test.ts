import { describe, it, expect } from 'vitest'
import {
  classifyFlare, FLARE_MIN_RISE, FLARE_WINDOW_HOURS,
  MISSED_SESSION_REASONS, CONFOUNDED_MISS_REASONS, isMissedSessionReason,
  EPISODE_OUTCOMES, RESEARCH_CONSENT_SCOPE_V1,
} from '../lib/sst-trainer/research'
import { SESSION_STOP_RISE } from '../lib/sst-trainer/protocol'
import { CONFIG } from '../lib/config'

describe('the flare definition is locked before data', () => {
  it('matches the within-session stop rule so "worse" means one thing', () => {
    // If these drift apart, the prescription and the analysis disagree about
    // what counts as a meaningful symptom rise.
    expect(FLARE_MIN_RISE).toBe(SESSION_STOP_RISE)
  })

  it('classifies a >=2 point rise as a flare', () => {
    expect(classifyFlare(2, 4, true)).toBe('flare')
    expect(classifyFlare(2, 3, true)).toBe('no-flare')
    expect(classifyFlare(0, 10, true)).toBe('flare')
  })

  it('treats a MISSING answer as unobserved, never as no-flare', () => {
    // Coding silence as "no flare" biases toward the null, and the people least
    // likely to answer are the ones who feel worst.
    expect(classifyFlare(2, null, false)).toBe('unobserved')
    expect(classifyFlare(2, 4, false)).toBe('unobserved')
    expect(classifyFlare(null, 4, true)).toBe('unobserved')
    expect(classifyFlare(2, undefined, true)).toBe('unobserved')
  })

  it('uses a DELAYED window — exertional exacerbation is not immediate', () => {
    expect(FLARE_WINDOW_HOURS.min).toBeGreaterThanOrEqual(12)
    expect(FLARE_WINDOW_HOURS.max).toBeLessThanOrEqual(48)
  })
})

describe('missed-session reasons make confounding visible', () => {
  it('flags the reasons that are NOT independent of the outcome', () => {
    // A day skipped BECAUSE the patient felt unwell cannot serve as a clean
    // rest-day comparator; it has to be handled separately or excluded.
    expect(CONFOUNDED_MISS_REASONS).toContain('symptomatic')
    expect(CONFOUNDED_MISS_REASONS).toContain('clinician-paused')
    expect(CONFOUNDED_MISS_REASONS).not.toContain('life')
    expect(CONFOUNDED_MISS_REASONS).not.toContain('rest-day')
  })

  it('every confounded reason is a real reason', () => {
    for (const r of CONFOUNDED_MISS_REASONS) {
      expect(MISSED_SESSION_REASONS as readonly string[]).toContain(r)
    }
  })

  it('rejects anything that is not a known reason', () => {
    expect(isMissedSessionReason('symptomatic')).toBe(true)
    expect(isMissedSessionReason('vibes')).toBe(false)
    expect(isMissedSessionReason(null)).toBe(false)
  })
})

describe('episode outcomes distinguish the ways an episode really ends', () => {
  it('separates cleared from resolved-without-clearance, and dropout from loss', () => {
    expect(EPISODE_OUTCOMES).toContain('resolved-cleared')
    expect(EPISODE_OUTCOMES).toContain('resolved-no-clear')
    // Discontinued (chose to stop) and lost-to-followup (vanished) are
    // different censoring mechanisms and must not be pooled.
    expect(EPISODE_OUTCOMES).toContain('discontinued')
    expect(EPISODE_OUTCOMES).toContain('lost-to-followup')
  })
})

describe('research consent is gated and names the linkage', () => {
  it('is owner-controlled, and the WORDING is versioned so it stays recoverable', () => {
    // Turned ON 2026-08-09 by owner instruction, ahead of ethics approval.
    // RESEARCH_CONSENT_VERSION is what makes that recoverable: consents taken
    // under the current wording are version 1 and individually identifiable, so
    // if a committee alters the wording that is a version bump and the v1
    // cohort can be re-consented rather than silently mis-scoped.
    expect(typeof CONFIG.FEATURES.SST_RESEARCH_CONSENT_LIVE).toBe('boolean')
  })

  it('names linkage explicitly — the one clause that cannot be retrofitted', () => {
    const linkage = RESEARCH_CONSENT_SCOPE_V1.find((c) => /linkage/i.test(c))
    expect(linkage).toBeTruthy()
    // Linkage must be performed BY THE CLINIC; receiving identifiable outside
    // records would defeat the pseudonymity everything else guarantees.
    expect(linkage).toMatch(/clinic/i)
  })

  it('covers independent re-analysis — the COI mitigation', () => {
    expect(RESEARCH_CONSENT_SCOPE_V1.some((c) => /independent/i.test(c))).toBe(true)
  })
})
