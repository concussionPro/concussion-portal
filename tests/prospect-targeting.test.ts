import { describe, it, expect } from 'vitest'
import { EMAIL_TEMPLATES, mergeTemplate } from '@/lib/prospect/email-templates'
import { preflightClinic } from '@/lib/prospect/preflight'
import type { ProspectClinic, ClinicTeam } from '@/lib/prospect/types'

const T1 = EMAIL_TEMPLATES.find((t) => t.slug === 'initial')!
const T2 = EMAIL_TEMPLATES.find((t) => t.slug === 'followup')!
const T3 = EMAIL_TEMPLATES.find((t) => t.slug === 'final')!

function team(clinical: number): ClinicTeam {
  return {
    osteopaths: 0,
    physiotherapists: clinical,
    generalPractitioners: 0,
    sportsMedicineDoctors: 0,
    exercisePhys: 0,
    myotherapists: 0,
    remedialMassage: 0,
    practiceManager: 1,
    admin: 1,
  }
}

function clinic(overrides: Partial<ProspectClinic>): ProspectClinic {
  return {
    id: 1,
    slug: 'test-clinic',
    shortName: 'Test Clinic',
    contactEmail: 'jane@testclinic.com.au',
    contactFirstName: 'Jane',
    city: 'Ballina',
    state: 'NSW',
    region: 'Northern Rivers',
    team: team(3),
    travelBand: 'within-2hr',
    clinicWebsiteUrl: 'https://testclinic.com.au',
    ...overrides,
  } as ProspectClinic
}

/**
 * Word count of the email body: strip tags, cut at the signature ("Zac
 * Lewis"), count only tokens containing alphanumerics (standalone em-dashes
 * aren't words). Mirrors the under-80-words first-touch constraint.
 */
function bodyWordCount(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ')
  const body = text.split('Zac Lewis')[0]
  return body.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length
}

describe('size-tier pitch selection (Zac 2026-06-10: large on-site > medium hub > individuals)', () => {
  it('solo clinician (1 clinical) gets the individual self-paced pitch, not a team product', () => {
    const { html } = mergeTemplate(T1, clinic({ team: team(1) }), 'https://example.com', 'tok')
    expect(html).toContain('self-paced')
    expect(html).toContain('8 CPD hours')
    expect(html).not.toContain('Hub Pack')
    expect(html).not.toContain('doc pack')
    expect(html).not.toMatch(/on-site/i)
  })

  it('individual pitch never mentions the Melbourne workshop date or stale prices', () => {
    const { html } = mergeTemplate(T1, clinic({ team: team(1) }), 'https://example.com', 'tok')
    expect(html).not.toMatch(/melbourne workshop/i)
    expect(html).not.toMatch(/13 june/i)
    expect(html).not.toContain('1,190')
    expect(html).not.toContain('1190')
  })

  it('medium clinic (2-5 clinical) gets the team-online + clinic doc pack pitch', () => {
    for (const n of [2, 5]) {
      const { html } = mergeTemplate(T1, clinic({ team: team(n) }), 'https://example.com', 'tok')
      expect(html).toContain('trained online')
      expect(html).toContain('clinic-branded clinical doc pack')
      expect(html).not.toMatch(/on-site/i)
    }
  })

  it('large clinic (>=6 clinical) gets the whole-team one-day on-site pitch', () => {
    for (const n of [6, 8, 21]) {
      const { html } = mergeTemplate(T1, clinic({ team: team(n) }), 'https://example.com', 'tok')
      expect(html).toMatch(/on-site/i)
      expect(html).toContain('whole clinic teams')
      expect(html).toContain('one day')
      expect(html).not.toContain('doc pack')
    }
  })

  it('T2 keeps the size-matched angle per tier', () => {
    const onsite = mergeTemplate(T2, clinic({ team: team(8) }), 'https://example.com', 'tok')
    expect(onsite.html).toContain('whole team trained together in one day')
    expect(onsite.html).toContain('14 CPD hours')
    const hub = mergeTemplate(T2, clinic({ team: team(4) }), 'https://example.com', 'tok')
    expect(hub.html).toContain('clinic-branded clinical doc pack')
    expect(hub.html).toContain('training online')
    const solo = mergeTemplate(T2, clinic({ team: team(1) }), 'https://example.com', 'tok')
    expect(solo.html).toContain('self-paced')
    expect(solo.html).toContain('8 CPD hours')
  })

  it('T2 offers to SEND the one-page outline (reply-bait, no link)', () => {
    for (const n of [1, 4, 8]) {
      const { html } = mergeTemplate(T2, clinic({ team: team(n) }), 'https://example.com', 'tok')
      expect(html).toContain('one-page outline')
      expect(html).toContain('want it?')
    }
  })

  it('T3 disclosure shows the config-derived price per tier', () => {
    const solo = mergeTemplate(T3, clinic({ team: team(1) }), 'https://example.com', 'tok')
    expect(solo.html).toContain('online course is A$497')
    expect(solo.html).not.toContain('Hub Pack')
    const medium = mergeTemplate(T3, clinic({ team: team(4) }), 'https://example.com', 'tok')
    expect(medium.html).toContain('Hub Pack')
    expect(medium.html).toContain('A$1,497')
    const large = mergeTemplate(T3, clinic({ team: team(8) }), 'https://example.com', 'tok')
    expect(large.html).toContain('on-site team training day starts at A$8,000')
  })

  it("T3 carries the breakup line (reply 'later' / STOP)", () => {
    const { text } = mergeTemplate(T3, clinic({}), 'https://example.com', 'tok')
    expect(text).toContain("reply 'later' and I'll check back next season")
    expect(text).toContain("STOP and I won't email again")
  })
})

describe('cold-email hygiene (2026-06-10 rewrite: zero links, plain note, replies are the metric)', () => {
  const tiers: Array<[string, ProspectClinic]> = [
    ['individual', clinic({ team: team(1) })],
    ['hub', clinic({ team: team(4) })],
    ['on-site', clinic({ team: team(8) })],
    ['unknown city + name', clinic({ team: team(8), city: 'Unknown', shortName: 'Unknown' })],
  ]

  it('NO template ever carries a body URL, image, or table (Safe Links detonates them)', () => {
    for (const tpl of [T1, T2, T3]) {
      for (const [, c] of tiers) {
        const { html, text } = mergeTemplate(tpl, c, 'https://example.com', 'tok')
        expect(html).not.toContain('http://')
        expect(html).not.toContain('https://')
        expect(text).not.toContain('http://')
        expect(text).not.toContain('https://')
        expect(html).not.toMatch(/<img/i)
        expect(html).not.toMatch(/<table/i)
      }
    }
  })

  it('T1 body is under 80 words for every tier (strip tags, count to signature)', () => {
    for (const [label, c] of tiers) {
      const { html } = mergeTemplate(T1, c, 'https://example.com', 'tok')
      const words = bodyWordCount(html)
      expect(words, `${label} T1 = ${words} words`).toBeLessThan(80)
    }
  })

  it('T2 body is under 90 words and T3 under 70, for every tier', () => {
    for (const [label, c] of tiers) {
      const t2Words = bodyWordCount(mergeTemplate(T2, c, 'https://example.com', 'tok').html)
      expect(t2Words, `${label} T2 = ${t2Words} words`).toBeLessThan(90)
      const t3Words = bodyWordCount(mergeTemplate(T3, c, 'https://example.com', 'tok').html)
      expect(t3Words, `${label} T3 = ${t3Words} words`).toBeLessThan(70)
    }
  })

  it('T1 carries the interest-based soft CTA, not a calendar/link ask', () => {
    const { text } = mergeTemplate(T1, clinic({}), 'https://example.com', 'tok')
    expect(text).toContain('Worth a couple of minutes on the phone')
    expect(text).toContain('Reply here')
    expect(text).not.toMatch(/book a/i)
    expect(text).not.toMatch(/calendar|cal\.com/i)
  })

  it('T1 and T2 carry the STOP compliance line; no unsubscribe URL in any body', () => {
    for (const tpl of [T1, T2]) {
      const { text, html } = mergeTemplate(tpl, clinic({}), 'https://example.com', 'tok')
      expect(text).toContain("reply STOP and I won't email again")
      expect(html).not.toMatch(/unsubscribe/i)
    }
  })

  it('stale prices and placeholder years never ship', () => {
    for (const tpl of [T1, T2, T3]) {
      for (const [, c] of tiers) {
        const { subject, html, text } = mergeTemplate(tpl, c, 'https://example.com', 'tok')
        for (const banned of ['1,190', '2099']) {
          expect(html).not.toContain(banned)
          expect(text).not.toContain(banned)
          expect(subject).not.toContain(banned)
        }
      }
    }
  })

  it('priorEngagement option is accepted but never changes copy (scanner noise)', () => {
    for (const tpl of [T2, T3]) {
      const base = mergeTemplate(tpl, clinic({}), 'https://example.com', 'tok', { priorEngagement: 'none' })
      const clicked = mergeTemplate(tpl, clinic({}), 'https://example.com', 'tok', { priorEngagement: 'clicked' })
      expect(clicked.html).toBe(base.html)
      expect(clicked.subject).toBe(base.subject)
      expect(base.html).not.toMatch(/noticed you|saw you took a look/i)
    }
  })

  it('subjects stay under 50 chars, never contain Unknown, and are deterministic per slug', () => {
    const fixtures = [
      clinic({}),
      clinic({ shortName: 'Momentum Physiotherapy & Health Services' }),
      clinic({ city: 'Unknown', shortName: 'Unknown' }),
    ]
    for (const tpl of [T1, T2, T3]) {
      for (const c of fixtures) {
        const a = mergeTemplate(tpl, c, 'https://example.com', 'tok')
        const b = mergeTemplate(tpl, c, 'https://example.com', 'tok')
        expect(a.subject.length).toBeLessThanOrEqual(50)
        expect(a.subject).not.toMatch(/unknown/i)
        expect(a.subject).not.toMatch(/free/i)
        expect(b.subject).toBe(a.subject)
      }
    }
  })

  it('city is referenced when known and skipped gracefully when Unknown', () => {
    const known = mergeTemplate(T1, clinic({ city: 'Geelong', team: team(8) }), 'https://example.com', 'tok')
    expect(known.text).toContain('in Geelong')
    const unknown = mergeTemplate(T1, clinic({ city: 'Unknown', team: team(8) }), 'https://example.com', 'tok')
    expect(unknown.text).not.toMatch(/unknown/i)
    const blank = mergeTemplate(T1, clinic({ city: '', team: team(8) }), 'https://example.com', 'tok')
    expect(blank.text).not.toContain(' in ,')
  })

  it('job-title contact names fall back to a neutral greeting', () => {
    const { text } = mergeTemplate(T1, clinic({ contactFirstName: 'Practice Manager' }), 'https://example.com', 'tok')
    expect(text).toContain('Hi there,')
  })
})

describe('institutional preflight gate (Zac 2026-06-10: unis and hospitals are not targets)', () => {
  const cases: Array<[string, Partial<ProspectClinic>]> = [
    ['hospital in name', { shortName: 'University Hospital Geelong' }],
    ['health network email', { contactEmail: 'jane@monashhealth.org' }],
    ['UK public health email', { contactEmail: 'jane@health.org.uk' }],
    ['edu.au email', { contactEmail: 'jane@unimelb.edu.au' }],
    ['gov.au email', { contactEmail: 'jane@health.nsw.gov.au' }],
    ['edu.au website', { clinicWebsiteUrl: 'https://sport.monash.edu.au/clinic' }],
    ['university in name', { shortName: 'University Sports Medicine Centre' }],
  ]
  for (const [label, overrides] of cases) {
    it(`quarantines: ${label}`, async () => {
      const result = await preflightClinic(clinic(overrides), { verifyEmail: false })
      expect(result.failures.map((f) => f.code)).toContain('institutional_target')
      expect(result.severity).toBe('quarantine')
    })
  }

  it('does NOT flag private clinics with "Health Services" in the name', async () => {
    for (const name of ['Inspire Health Services', 'Minerva Allied Health Services', 'Momentum Physiotherapy & Health Services']) {
      const result = await preflightClinic(clinic({ shortName: name }), { verifyEmail: false })
      expect(result.failures.map((f) => f.code)).not.toContain('institutional_target')
    }
  })
})
