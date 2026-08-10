import { describe, it, expect } from 'vitest'
import {
  classifyFlare, FLARE_MIN_RISE, FLARE_WINDOW_HOURS,
  MISSED_SESSION_REASONS, CONFOUNDED_MISS_REASONS, isMissedSessionReason,
  EPISODE_OUTCOMES, RESEARCH_CONSENT_SCOPE_V1,
} from '../lib/sst-trainer/research'
import { SESSION_STOP_RISE } from '../lib/sst-trainer/protocol'
import { CONFIG } from '../lib/config'

describe('the flare definition is locked before data', () => {
  it('keeps its pre-registered magnitude — and the stop rule its own', () => {
    // These share the number 2 but are DIFFERENT variables since 2026-08-11:
    // the in-session stop fires on a rise EXCEEDING SESSION_STOP_RISE
    // (Amsterdam 2023 tolerates <=2), while the delayed flare outcome keeps
    // its locked >=2 definition (see research.ts for the disclosure).
    expect(FLARE_MIN_RISE).toBe(2)
    expect(SESSION_STOP_RISE).toBe(2)
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

/**
 * DOI HYGIENE. Zenodo mints two kinds of DOI and they are not interchangeable:
 *
 *   CONCEPT  10.5281/zenodo.21482633 — always resolves to the LATEST version
 *   VERSION  10.5281/zenodo.21482634 (v1), 10.5281/zenodo.21855932 (v2)
 *
 * Every "our protocol is published, here it is" link must be the CONCEPT DOI,
 * or the accreditation bodies, course pages and pricing surfaces that link it
 * keep pointing at a superseded document forever. 16 surfaces were doing
 * exactly that after v2 was deposited — including every accreditation page a
 * reviewing body actually clicks.
 *
 * The GP/insurer report is the deliberate exception: it states which version
 * the care conformed to, so it must cite the SPECIFIC version DOI.
 */
describe('protocol DOI references', () => {
  const read = async (rel: string) =>
    (await import('node:fs/promises')).readFile(new URL(rel, import.meta.url), 'utf8')

  it('no surface still points at the superseded v1 version DOI', async () => {
    const { execSync } = await import('node:child_process')
    const hits = execSync(
      "grep -rl '10.5281/zenodo.21482634' app lib components --include=*.ts --include=*.tsx || true",
      { cwd: new URL('..', import.meta.url).pathname, encoding: 'utf8' },
    ).trim()
    expect(hits, `still on the v1 version DOI:\n${hits}`).toBe('')
  })

  it('the clinical report cites the SPECIFIC version it conforms to', async () => {
    const src = await read('../lib/sst-trainer/gp-report-html.ts')
    // A conformance statement that pointed at "latest" would silently re-scope
    // what a signed, transmitted report claimed about the care delivered.
    expect(src).toContain('10.5281/zenodo.21855932')
  })
})

describe('the protocol reference is centralised', () => {
  it('no file hardcodes a zenodo DOI except the reference module and the report', async () => {
    const { execSync } = await import('node:child_process')
    const hits = execSync(
      "grep -rl 'zenodo\\.' app lib components --include=*.ts --include=*.tsx || true",
      { cwd: new URL('..', import.meta.url).pathname, encoding: 'utf8' },
    ).trim().split('\n').filter(Boolean)
    // Two legitimate holders: the source of truth, and the clinical report,
    // which pins a SPECIFIC version because it is a conformance claim.
    const allowed = ['lib/protocol-reference.ts', 'lib/sst-trainer/gp-report-html.ts']
    const stray = hits.filter((h) => !allowed.includes(h))
    expect(stray, `hardcoded DOI outside the reference module:\n${stray.join('\n')}`).toEqual([])
  })

  it('the visible label states the version so a reviewer knows what they will open', async () => {
    const { PROTOCOL_DOI_LABEL, PROTOCOL_VERSION, PROTOCOL_DOI } = await import('../lib/protocol-reference')
    expect(PROTOCOL_DOI_LABEL).toContain(PROTOCOL_DOI)
    expect(PROTOCOL_DOI_LABEL).toContain(`v${PROTOCOL_VERSION}`)
  })

  it('concept and version DOIs are distinct — conflating them is the whole bug', async () => {
    const { PROTOCOL_DOI, PROTOCOL_VERSION_DOI } = await import('../lib/protocol-reference')
    expect(PROTOCOL_DOI).not.toBe(PROTOCOL_VERSION_DOI)
  })
})
