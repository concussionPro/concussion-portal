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
    chiropractors: 0,
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
    // Tier-mapping tests assume a VERIFIED team (real website read). The
    // generic-fallback path for unverified teams is covered separately below.
    notes: '[team-enriched=test/2026-06-18]',
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
  it('T1 lists the real trial products accurately — Module 1 is a TRIAL, never a free module', () => {
    // 2026-07-02 trim: the toolkit/admin-pack/reference-library recap moved
    // OFF T1 (word budget ≤80) — it lives on the portal and in the T2
    // re-offer (asserted below). T1 keeps the kit trio + the reply-question.
    for (const n of [1, 4, 8]) {
      const { html, text } = mergeTemplate(T1, clinic({ team: team(n) }), 'https://example.com', 'tok')
      expect(html).toMatch(/SCAT6\/SCOAT6 forms/i)
      expect(html).toMatch(/baseline tool/i)
      expect(html).toMatch(/Module 1 trial/i)
      // Correction (Zac 2026-06-11): Module 1 is NOT free — it's a trial section.
      expect(html).not.toMatch(/free (CPD )?module/i)
      expect(html).not.toMatch(/I built/i)
      // The ONE CTA is the interest question closing the note (2026-07-02).
      expect(text).toContain('reply "trial"')
      // Exactly ONE link: the clean /p/<slug> portal path.
      expect(html.match(/<a\s+href=/gi) ?? []).toHaveLength(1)
    }
  })

  it('UNVERIFIED team → generic Hub Pack pitch regardless of size (no fabricated headcount/tier)', () => {
    // notes:'' ⇒ team JSONB is the import placeholder. Even a "large" (8) or
    // "solo" (1) fake team must NOT trigger the on-site or individual pitch —
    // both commit to a specific size we haven't verified. Falls to Hub Pack.
    // (2026-07-02 copy: T1's tier mention is now a short "option" noun.)
    for (const n of [1, 8, 20]) {
      const html = mergeTemplate(T1, clinic({ team: team(n), notes: '' }), 'x', 'tok').html
      expect(html).toMatch(/Hub Pack/i)
      expect(html).not.toMatch(/on-site team training/i)
      expect(html).not.toMatch(/self-paced course/i)
    }
    // And T3 quotes the FIXED hub price, never a team-derived on-site total.
    // (openedTrial:true reaches the price-disclosure branch — the default
    // non-sampler T3 leads with the Module 1 nudge instead of a price.)
    const t3 = mergeTemplate(T3, clinic({ team: team(12), notes: '' }), 'x', 'tok', { openedTrial: true }).html
    expect(t3).toMatch(/Hub Pack/i)
    expect(t3).not.toMatch(/on-site team training day starts at/i)
  })

  it('T1 is tailored per tier — on-site (large) / Hub Pack (medium) / self-paced (solo)', () => {
    // 2026-07-02: the tier pitch is folded into the kit sentence as a short
    // tier-matched option noun (the full tier pitch lives on the portal + T2).
    const solo = mergeTemplate(T1, clinic({ team: team(1) }), 'x', 'tok').html
    expect(solo).toMatch(/self-paced course option/i)
    expect(solo).not.toMatch(/Hub Pack/i)
    expect(solo).not.toMatch(/on-site team training/i)
    const hub = mergeTemplate(T1, clinic({ team: team(4) }), 'x', 'tok').html
    expect(hub).toMatch(/team Hub Pack option/i)
    expect(hub).not.toMatch(/on-site team training/i)
    const onsite = mergeTemplate(T1, clinic({ team: team(8) }), 'x', 'tok').html
    expect(onsite).toMatch(/on-site team training option/i)
    expect(onsite).not.toMatch(/Hub Pack/i)
  })

  it('T1 never mentions the Melbourne workshop date or stale prices', () => {
    const { html } = mergeTemplate(T1, clinic({ team: team(1) }), 'https://example.com', 'tok')
    expect(html).not.toMatch(/melbourne workshop/i)
    expect(html).not.toMatch(/13 june/i)
    expect(html).not.toContain('1,190')
    expect(html).not.toContain('1190')
  })

  it('T1 stays tight (product-led, 80 words or fewer)', () => {
    // Doctrine (2026-07-02 trim): first touch runs 80 words max — the prior
    // 95-105-word T1 was over the cold-note budget. Checked on the on-site
    // tier (the longest tier noun) so every tier fits.
    const { html } = mergeTemplate(T1, clinic({ team: team(8) }), 'https://example.com', 'tok')
    const words = html.replace(/<[^>]+>/g, ' ').split('Zac Lewis')[0].split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length
    // Cap raised 80→95 (owner 2026-08-16: 'we need to offer something
    // substantial' — the reply-'trial' SST close is the offer; tightness
    // doctrine otherwise unchanged).
    expect(words, `T1 = ${words} words`).toBeLessThanOrEqual(95)
  })

  it('T2 re-offers the free tools + the toolkit/docs value', () => {
    // The full toolkit/docs recap is the GENERIC re-offer, which renders for
    // prospects who already sampled Module 1 (openedTrial:true). Non-samplers
    // (the default) get the Module 1 relevance hook instead — asserted after.
    const { html } = mergeTemplate(T2, clinic({ team: team(4) }), 'https://example.com', 'tok', { openedTrial: true })
    expect(html).toMatch(/SCAT6\/SCOAT6 forms/i)
    expect(html).toMatch(/clinical toolkit/i)
    expect(html).toMatch(/admin pack/i)
    // Default (never opened the trial) → relevance-first Module 1 nudge, the
    // proven missing step for engaged-but-never-sampled clinics.
    const nonSampler = mergeTemplate(T2, clinic({ team: team(4) }), 'https://example.com', 'tok')
    expect(nonSampler.html).toMatch(/Module 1/i)
    expect(nonSampler.html).toMatch(/don't present as one/i)
  })

  it('every T1/T2 link is the CLEAN per-clinic portal path — no ?k=, no utm, no image', () => {
    for (const n of [1, 4, 8]) {
      for (const tpl of [T1, T2]) {
        const { html } = mergeTemplate(tpl, clinic({ team: team(n), slug: 'demo-clinic', accessKey: 'AK' }), 'https://example.com', 'tok')
        expect(html).not.toMatch(/<img/i)         // text-first, no image
        expect(html).toContain('/p/demo-clinic')  // clinic-named path (personalised)
        expect(html).not.toContain('?k=')          // no random key — the spam-detonation trigger
        expect(html).not.toMatch(/utm_/i)          // no tracking params
      }
    }
  })

  it('T3 disclosure shows the config-derived price per tier', () => {
    // Price transparency belongs to the sampled path (openedTrial:true) —
    // a non-sampler's breakup leads with the Module 1 nudge, no price-lead.
    // Prices stay config-derived: $497 online, $1,497 Hub Pack, on-site total.
    const opts = { openedTrial: true } as const
    const solo = mergeTemplate(T3, clinic({ team: team(1) }), 'https://example.com', 'tok', opts)
    expect(solo.html).toContain('online course is A$497')
    expect(solo.html).not.toContain('Hub Pack')
    const medium = mergeTemplate(T3, clinic({ team: team(4) }), 'https://example.com', 'tok', opts)
    expect(medium.html).toContain('Hub Pack')
    expect(medium.html).toContain('A$1,497')
    const large = mergeTemplate(T3, clinic({ team: team(8) }), 'https://example.com', 'tok', opts)
    expect(large.html).toContain('on-site team training day starts at A$8,000')
    // The default non-sampler breakup carries NO price — relevance nudge only.
    const nonSampler = mergeTemplate(T3, clinic({ team: team(4) }), 'https://example.com', 'tok')
    expect(nonSampler.html).not.toContain('A$1,497')
    expect(nonSampler.html).toMatch(/Module 1/i)
  })

  it("T3 carries the breakup line (reply 'later' / STOP)", () => {
    const { text } = mergeTemplate(T3, clinic({}), 'https://example.com', 'tok')
    expect(text).toContain("later' and I'll check back next season")
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

  it('bodies stay tight — T1 80 words max, T2/T3 under 90 (portal-led, not a wall of text)', () => {
    for (const [label, c] of tiers) {
      const t1 = bodyWordCount(mergeTemplate(T1, c, 'x', 'tok').html)
      expect(t1, `${label} T1 = ${t1} words`).toBeLessThanOrEqual(95)
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
    // The email drives to the per-clinic portal path, where the call CTA lives.
    expect(html).toMatch(/\/p\//)
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

describe('intent-aware follow-ups (Zac 2026-06-14: T2/T3 adapt to what they viewed on the portal)', () => {
  // One naked /p/ link, no image, never surveillance-y, under 90 words — the
  // invariants every hinted variant must keep.
  function assertHygiene(html: string, label: string) {
    expect(html, `${label} no image`).not.toMatch(/<img/i)
    // Exactly one anchor, and it points at the /p/ portal path. (The naked
    // URL renders /p/ twice — href + visible text — so count <a> tags.)
    const anchors = html.match(/<a\s+href=/gi) ?? []
    expect(anchors.length, `${label} exactly one link`).toBe(1)
    expect(html, `${label} link is the portal path`).toMatch(/href="[^"]*\/p\//)
    expect(html, `${label} no ?k=`).not.toContain('?k=')
    expect(html, `${label} no utm`).not.toMatch(/utm_/i)
    // Never creepy — no "I saw/noticed you viewed X" framing.
    expect(html, `${label} not surveillance-y`).not.toMatch(/saw you|noticed you|i see you|you viewed|you looked at|you visited/i)
    const words = bodyWordCount(html)
    expect(words, `${label} = ${words} words (<90)`).toBeLessThan(90)
  }

  // NOTE (2026-07-02): hint-tailored copy applies to prospects who already
  // opened the Module 1 trial (openedTrial:true). A NON-sampler always gets
  // the relevance→Module-1 nudge first, regardless of hint — that override is
  // asserted separately below.
  const SAMPLED = { openedTrial: true } as const

  it("T2 hint='pricing' leads with an offer to talk pricing/options for the clinic", () => {
    const { html, text } = mergeTemplate(T2, clinic({ team: team(4) }), 'https://example.com', 'tok', { ...SAMPLED, engagementHint: 'pricing' })
    expect(text).toMatch(/pricing was the question/i)
    expect(text).toMatch(/walk through what it'd look like for Test Clinic/i)
    expect(text).toMatch(/just reply/i)
    assertHygiene(html, "T2 pricing")
  })

  it("T2 hint='trial' references the Module 1 trial → full-program value at the TRUE online CPD hours (8, never 14)", () => {
    const { html, text } = mergeTemplate(T2, clinic({ team: team(4) }), 'https://example.com', 'tok', { ...SAMPLED, engagementHint: 'trial' })
    expect(text).toMatch(/Module 1/i)
    expect(text).toMatch(/full online program/i)
    // Online-only copy must claim 8 CPD hours — 14 is ONLY online+in-person.
    expect(text).toMatch(/8 CPD hours/i)
    expect(text).not.toMatch(/14 CPD hours/i)
    assertHygiene(html, "T2 trial")
  })

  it("T2 hint='toolkit' nudges the practical toolkit value + the course upsell", () => {
    const { html, text } = mergeTemplate(T2, clinic({ team: team(4) }), 'https://example.com', 'tok', { ...SAMPLED, engagementHint: 'toolkit' })
    expect(text).toMatch(/clinical toolkit/i)
    expect(text).toMatch(/unlocks with the online course/i)
    assertHygiene(html, "T2 toolkit")
  })

  it('T2 hint=null (or omitted) is the GENERIC re-offer — identical to no-hint', () => {
    const generic = mergeTemplate(T2, clinic({ team: team(4) }), 'https://example.com', 'tok', { ...SAMPLED })
    const explicitNull = mergeTemplate(T2, clinic({ team: team(4) }), 'https://example.com', 'tok', { ...SAMPLED, engagementHint: null })
    expect(explicitNull.html).toBe(generic.html)
    // Generic keeps the full docs recap; doesn't carry the pricing-talk sentence.
    expect(generic.html).toMatch(/admin pack and reference library/i)
    expect(generic.html).not.toMatch(/pricing was the question/i)
  })

  it('each T2 hint produces DISTINCT copy from the generic', () => {
    const generic = mergeTemplate(T2, clinic({ team: team(4) }), 'x', 'tok', { ...SAMPLED }).html
    for (const h of ['pricing', 'trial', 'toolkit'] as const) {
      const hinted = mergeTemplate(T2, clinic({ team: team(4) }), 'x', 'tok', { ...SAMPLED, engagementHint: h }).html
      expect(hinted, `hint=${h} differs from generic`).not.toBe(generic)
    }
  })

  it('a NON-sampler T2 overrides every hint with the relevance→Module-1 nudge (one link, hygienic)', () => {
    const base = mergeTemplate(T2, clinic({ team: team(4) }), 'x', 'tok').html
    expect(base).toMatch(/don't present as one/i)
    expect(base).toMatch(/Module 1/i)
    for (const h of ['pricing', 'trial', 'toolkit'] as const) {
      const hinted = mergeTemplate(T2, clinic({ team: team(4) }), 'x', 'tok', { engagementHint: h }).html
      expect(hinted, `non-sampler ignores hint=${h}`).toBe(base)
    }
    assertHygiene(base, 'T2 non-sampler')
  })

  it("T3 hint='pricing' offers to talk the numbers through but keeps the breakup close on its OWN line", () => {
    const { html, text } = mergeTemplate(T3, clinic({ team: team(4) }), 'https://example.com', 'tok', { ...SAMPLED, engagementHint: 'pricing' })
    expect(text).toMatch(/talk through the options for Test Clinic/i)
    // The breakup close is its own short paragraph (2026-07-02), never buried
    // at the tail of the price sentence.
    expect(html).toContain("<p>Reply 'later' and I'll check back next season, or STOP and I won't email again.</p>")
    expect(text).toContain("later' and I'll check back next season")
    expect(text).toContain("STOP and I won't email again")
    // Still the config-derived price, still one link, still hygienic.
    expect(text).toContain('A$1,497')
    assertHygiene(html, "T3 pricing")
    expect(html).not.toMatch(/saw you|noticed you/i)
  })

  it('T3 hint=null is the generic breakup (unchanged), close on its own line for EVERY variant', () => {
    const generic = mergeTemplate(T3, clinic({ team: team(4) }), 'x', 'tok', { ...SAMPLED })
    const explicitNull = mergeTemplate(T3, clinic({ team: team(4) }), 'x', 'tok', { ...SAMPLED, engagementHint: null })
    expect(explicitNull.html).toBe(generic.html)
    expect(generic.html).toMatch(/if you ever want the full course/i)
    // Non-sampler default: relevance→Module-1 nudge, no price-lead, same
    // standalone close line.
    const nonSampler = mergeTemplate(T3, clinic({ team: team(4) }), 'x', 'tok')
    expect(nonSampler.html).toMatch(/Module 1/i)
    for (const variant of [generic.html, nonSampler.html]) {
      expect(variant).toContain("<p>Reply 'later' and I'll check back next season, or STOP and I won't email again.</p>")
    }
  })

  it('engagementHint never leaks into T1 copy (T1 = no prior engagement)', () => {
    const base = mergeTemplate(T1, clinic({ team: team(4) }), 'x', 'tok').html
    for (const h of ['pricing', 'trial', 'toolkit', null] as const) {
      const hinted = mergeTemplate(T1, clinic({ team: team(4) }), 'x', 'tok', { engagementHint: h }).html
      expect(hinted, `T1 ignores hint=${h}`).toBe(base)
    }
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
