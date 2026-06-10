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
    expect(html).toContain('self-paced online, 8 CPD hours')
    expect(html).toContain('working solo')
    expect(html).not.toContain('Hub Pack')
    expect(html).not.toMatch(/on-site/i)
  })

  it('individual pitch never mentions the Melbourne workshop date or stale prices', () => {
    const { html } = mergeTemplate(T1, clinic({ team: team(1) }), 'https://example.com', 'tok')
    expect(html).not.toMatch(/melbourne workshop/i)
    expect(html).not.toMatch(/13 june/i)
    expect(html).not.toContain('1,190')
    expect(html).not.toContain('1190')
  })

  it('medium clinic (2-5 clinical) gets the team-online + branded toolkit pitch', () => {
    for (const n of [2, 5]) {
      const { html } = mergeTemplate(T1, clinic({ team: team(n) }), 'https://example.com', 'tok')
      expect(html).toContain('Your team trains online')
      expect(html).toContain('branded clinical toolkit')
      expect(html).not.toMatch(/one on-site day/i)
    }
  })

  it('large clinic (>=6 clinical) gets the whole-team one-day on-site pitch', () => {
    for (const n of [6, 8, 21]) {
      const { html } = mergeTemplate(T1, clinic({ team: team(n) }), 'https://example.com', 'tok')
      expect(html).toContain('one on-site day')
      expect(html).toContain('whole team')
    }
  })

  it('T1 leads with free tools inside the portal (give-before-you-ask)', () => {
    const { html } = mergeTemplate(T1, clinic({ team: team(4) }), 'https://example.com', 'tok')
    expect(html).toContain('free to use')
    expect(html).toMatch(/SCAT6.*forms/i)
    expect(html).toContain('baseline testing')
    expect(html).not.toMatch(/I built/i) // facts-first, no "I built you a dashboard" preamble
    const words = html.replace(/<[^>]+>/g, ' ').split('Zac Lewis')[0].split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length
    expect(words, `T1 = ${words} words`).toBeLessThan(80) // elite first-touch benchmark
  })

  it('T2 keeps the size-matched angle per tier', () => {
    const onsite = mergeTemplate(T2, clinic({ team: team(8) }), 'https://example.com', 'tok')
    expect(onsite.html).toContain('whole team trained together in one day')
    expect(onsite.html).toContain('14 CPD hours')
    const hub = mergeTemplate(T2, clinic({ team: team(4) }), 'https://example.com', 'tok')
    expect(hub.html).toContain('clinic-branded toolkit')
    expect(hub.html).toContain('Hub Pack pricing')
    const solo = mergeTemplate(T2, clinic({ team: team(1) }), 'https://example.com', 'tok')
    expect(solo.html).toContain('self-paced online, 8 CPD hours')
    expect(solo.html).toContain("Module 1's unlocked to try free")
  })

  it('every T1/T2 drives to the prospect portal via a naked text link (no image)', () => {
    for (const n of [1, 4, 8]) {
      for (const tpl of [T1, T2]) {
        const { html } = mergeTemplate(tpl, clinic({ team: team(n), slug: 'demo-clinic', accessKey: 'AK' }), 'https://example.com', 'tok')
        expect(html).not.toMatch(/<img/i) // text-first — no embedded screenshot
        expect(html).toContain('/p/demo-clinic?k=AK') // single link = their portal
        expect(html).toContain('concussion learning portal') // text framing is the hook
      }
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

describe('cold-email hygiene (2026-06-10 portal-led: the dashboard is the pitch, one link)', () => {
  const tiers: Array<[string, ProspectClinic]> = [
    ['individual', clinic({ team: team(1) })],
    ['hub', clinic({ team: team(4) })],
    ['on-site', clinic({ team: team(8) })],
    ['unknown city + name', clinic({ team: team(8), city: 'Unknown', shortName: 'Unknown' })],
  ]

  it('the ONLY links any template carries point to the prospect portal — no cal.com, no third-party URLs in the body', () => {
    for (const tpl of [T1, T2, T3]) {
      for (const [label, c] of tiers) {
        const { html } = mergeTemplate(tpl, c, 'https://example.com', 'tok')
        // Every URL in the email must be a /p/<slug> portal link or the
        // portal's own og-image screenshot. The booking CTA lives ON the
        // portal, never in the email body.
        const urls = html.match(/https?:\/\/[^\s"'<>]+/g) ?? []
        for (const u of urls) {
          expect(u, `${label} ${tpl.slug} stray url: ${u}`).toMatch(/\/p\/|\/api\/prospect\/og-image/)
        }
        expect(html, `${label} ${tpl.slug}`).not.toMatch(/cal\.com/i)
        expect(html).not.toMatch(/<table/i)
      }
    }
  })

  it('NO template embeds an image — all three are text-first with a portal link', () => {
    for (const [label, c] of tiers) {
      expect(mergeTemplate(T1, c, 'x', 'tok').html, `${label} T1`).not.toMatch(/<img/i)
      expect(mergeTemplate(T2, c, 'x', 'tok').html, `${label} T2`).not.toMatch(/<img/i)
      expect(mergeTemplate(T3, c, 'x', 'tok').html, `${label} T3`).not.toMatch(/<img/i)
      expect(mergeTemplate(T1, c, 'x', 'tok').html, `${label} T1 link`).toMatch(/\/p\//)
      expect(mergeTemplate(T3, c, 'x', 'tok').html, `${label} T3 link`).toMatch(/\/p\//)
    }
  })

  it('bodies stay tight — T1 under 120 words, T2/T3 under 90 (screenshot-led, not a wall of text)', () => {
    for (const [label, c] of tiers) {
      const t1 = bodyWordCount(mergeTemplate(T1, c, 'x', 'tok').html)
      expect(t1, `${label} T1 = ${t1} words`).toBeLessThan(120)
      const t2 = bodyWordCount(mergeTemplate(T2, c, 'x', 'tok').html)
      expect(t2, `${label} T2 = ${t2} words`).toBeLessThan(90)
      const t3 = bodyWordCount(mergeTemplate(T3, c, 'x', 'tok').html)
      expect(t3, `${label} T3 = ${t3} words`).toBeLessThan(90)
    }
  })

  it('the booking CTA is NOT in the email — it lives on the portal', () => {
    const { html } = mergeTemplate(T1, clinic({}), 'https://example.com', 'tok')
    expect(html).not.toMatch(/book a walkthrough/i)
    expect(html).not.toMatch(/cal\.com/i)
    // The email drives to the dashboard, where the call CTA lives.
    expect(html).toMatch(/dashboard/i)
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

describe('ICP preflight gate — AU private clinics only (regression: 2026-06-11 leaks)', () => {
  // Every one of these ACTUALLY GOT SENT or queued on 2026-06-11 and must be blocked.
  const mustBlock: Array<[string, Partial<ProspectClinic>]> = [
    ['UK clinic (.co.uk)', { shortName: 'LSO London Sports Orthopaedics', contactEmail: 'anthony.tang@sportsortho.co.uk', city: 'London' }],
    ['Epworth hospital (.org.au)', { shortName: 'Epworth', contactEmail: 'aidan.davey@epworth.org.au' }],
    ['UQ Sport (university, .com.au)', { shortName: 'UQ Sport', contactEmail: 'davidh@uqsport.com.au' }],
    ['Hunter Academy (.org.au)', { shortName: 'Hunter Academy of Sport', contactEmail: 'sallie@hunteracademy.org.au' }],
    ['Far North Community Services (.org.au)', { shortName: 'Far North Community Services', contactEmail: 'edward.hanrahan@farnorth.org.au' }],
    ['Laser I.T. (.biz, non-clinic)', { shortName: 'Laser I.T.', contactEmail: 'adrian@laserit.biz' }],
    ['Salvation Army (.org.au)', { shortName: 'The Salvation Army Australia', contactEmail: 'cameron.strathdee@salvationarmy.org.au' }],
    ['Brain Injury SA (.org.au)', { shortName: 'Brain Injury SA', contactEmail: 'dylanc@braininjurysa.org.au' }],
    ['Therapy Focus (.org.au)', { shortName: 'Therapy Focus', contactEmail: 'chelsea.petrovic@therapyfocus.org.au' }],
    ['Primary Health Care Limited (corporate)', { shortName: 'Primary Health Care Limited', contactEmail: 'donald.otasowie@primaryhealthcare.com.au' }],
    ['Strength Clinic Academy Singapore', { shortName: 'Strength Clinic Academy', contactEmail: 'james@strengthclinicacademy.com', city: 'Singapore' }],
    ['NZ chiro (.co.nz)', { shortName: 'Connect Chiropractic', contactEmail: 'matt@connectchiro.co.nz' }],
    ['NZ osteo website', { shortName: 'The Osteopathic Clinic', contactEmail: 'matt@connecthealth.nz' }],
    ['UK physio (.co.uk)', { shortName: 'Inspire Physio & Fitness', contactEmail: 'jubilee@inspire-physio.co.uk' }],
    ['hospital in name', { shortName: 'University Hospital Geelong' }],
    ['health network email', { contactEmail: 'jane@monashhealth.org' }],
    ['edu.au email', { contactEmail: 'jane@unimelb.edu.au' }],
    ['gov.au email', { contactEmail: 'jane@health.nsw.gov.au' }],
  ]
  for (const [label, overrides] of mustBlock) {
    it(`BLOCKS: ${label}`, async () => {
      const result = await preflightClinic(clinic(overrides), { verifyEmail: false })
      expect(result.failures.map((f) => f.code), label).toContain('institutional_target')
      expect(result.severity).toBe('quarantine')
    })
  }

  // Legit AU private clinics on .com.au / .com — must NOT be blocked.
  const mustPass: Array<[string, Partial<ProspectClinic>]> = [
    ['Barwon Sports Physiotherapy', { shortName: 'Barwon Sports Physiotherapy', contactEmail: 'marcus@barwonsportsphysio.com.au' }],
    ['Momentum Physiotherapy & Health Services', { shortName: 'Momentum Physiotherapy & Health Services', contactEmail: 'simonetsang@momentumphysio.com' }],
    ['Sydney Physios and Allied Health Service', { shortName: 'Sydney Physios and Allied Health Service', contactEmail: 'hai@sydneyphysios.com.au' }],
    ['Minerva Allied Health Services', { shortName: 'Minerva Allied Health Services', contactEmail: 'samanthab@minervaalliedhealth.com' }],
    ['Inspire Health Services (.com.au)', { shortName: 'Inspire Health Services', contactEmail: 'will.morris@inspirehealthservices.com.au' }],
    ['Super Clinic Physio', { shortName: 'Super Clinic Physio', contactEmail: 'admin@superclinicphysio.com.au' }],
  ]
  for (const [label, overrides] of mustPass) {
    it(`PASSES: ${label}`, async () => {
      const result = await preflightClinic(clinic(overrides), { verifyEmail: false })
      expect(result.failures.map((f) => f.code), label).not.toContain('institutional_target')
    })
  }
})
