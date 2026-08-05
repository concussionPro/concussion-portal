import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { CONFIG } from '../lib/config'
import { intlPriceForCountry } from '../lib/international-pricing'

/**
 * GEO / AI-CITATION SURFACE.
 *
 * llms.txt and llms-full.txt are what an AI retriever reads FIRST, and they are
 * hand-curated prose (rightly — they're marketing copy, not a data dump). The
 * failure mode is silent staleness: they sat unchanged while the ESSA stream
 * went live, so for two weeks the file a retriever consulted had no idea the
 * exercise-physiology course existed. Nothing failed; it was just wrong.
 *
 * These tests make drift LOUD. They assert coverage of every live product and
 * that every price quoted matches CONFIG — so shipping a price change without
 * updating the AI-facing surface breaks the build.
 *
 * They matter most right now: professional-body backlinks are the moment
 * crawlers and retrievers actually arrive.
 */
const REPO = join(__dirname, '..')
const llms = readFileSync(join(REPO, 'public/llms.txt'), 'utf8')
const llmsFull = readFileSync(join(REPO, 'public/llms-full.txt'), 'utf8')

describe('the AI-facing surface knows about every live product', () => {
  const REQUIRED = [
    ['the ESSA-accredited CRM stream', /Concussion Rehab Mastery/i],
    ['the ESSA accreditation itself', /ESSA/],
    ['the free awareness short course', /Concussion Care Has Changed|concussion-update/i],
    ['the SST Trainer', /SST Trainer/i],
    ['baseline testing', /Baseline Testing/i],
    ['the free SCAT6 course', /SCAT6.{0,20}Mastery/i],
    ['the flagship CCM course', /Osteopathy Australia/],
  ] as const

  it.each(REQUIRED)('llms.txt mentions %s', (_label, pattern) => {
    expect(llms).toMatch(pattern)
  })

  it('llms-full.txt covers the CRM stream and the tools too', () => {
    expect(llmsFull).toMatch(/Concussion Rehab Mastery/i)
    expect(llmsFull).toMatch(/SST Trainer/i)
  })
})

describe('quoted prices match CONFIG', () => {
  it('the AU online price is current', () => {
    const price = `A$${CONFIG.COURSE.PRICE_ONLINE}`
    expect(llms, `llms.txt should quote ${price}`).toContain(price)
  })

  it('the early-bird and sticker prices are current', () => {
    expect(llms).toContain(`A$${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString('en-US')}`)
    expect(llms).toContain(`$${CONFIG.COURSE.PRICE_REGULAR.toLocaleString('en-US')}`)
  })

  it('international prices match the pricing table', () => {
    for (const cc of ['US', 'GB', 'NZ']) {
      const p = intlPriceForCountry(cc)
      // Accept either the symbol form (US$347) or the code form (USD 347).
      const symbolForm = `${p.symbol}${p.amount}`
      const codeForm = `${p.code} ${p.amount}`
      expect(
        llms.includes(symbolForm) || llms.includes(codeForm),
        `llms.txt should quote ${cc} as ${symbolForm} or ${codeForm}`,
      ).toBe(true)
    }
  })

  it('never claims 14 CPD hours for an international (online-only) buyer', () => {
    // The practical day is AU-only. Any INTERNATIONAL block quoting 14 would be
    // an unfulfillable claim in a jurisdiction that can't attend it. Scoped to
    // that section only — the AU Q&A later in the file correctly says "8 online,
    // up to 14 with the in-person day".
    const start = llms.indexOf('## International availability')
    expect(start, 'international section missing from llms.txt').toBeGreaterThan(-1)
    const rest = llms.slice(start + 3)
    const end = rest.indexOf('\n## ')
    const intlSection = end > -1 ? rest.slice(0, end) : rest
    expect(intlSection).not.toMatch(/14 (CPD|hours)/)
    // …and it should say plainly that international is online-only.
    expect(intlSection).toMatch(/online only|online-only/i)
  })
})

describe('accreditation claims stay honest', () => {
  it('states ESSA as held only while the flag is on', () => {
    if (CONFIG.FEATURES.ESSA_ACCREDITED) {
      expect(llms).toMatch(/ACCREDITED BY ESSA|accredited by ESSA/i)
    } else {
      expect(llms).not.toMatch(/ACCREDITED BY ESSA/i)
    }
  })

  it('does not claim ACSM/CIMSPA credits that are not held', () => {
    // Hours are verifiable; a body's credit currency is not ours to assert.
    expect(llms).not.toMatch(/\d+\s*(ACSM )?CECs? (awarded|granted|earned)/i)
    expect(llms).not.toMatch(/HPCSA[- ]accredited/i)
    // And it should say so explicitly.
    expect(llms).toMatch(/PENDING and is never claimed as held|PENDING and are never claimed as held|pending/i)
  })

  it('does not describe the PARKED ACSM application as pending', () => {
    // 2026-08-05: this file said overseas recognitions including ACSM were
    // "PENDING", while app/acsm/page.tsx correctly says CEA holds no
    // Approved-Provider status and is NOT pursuing one. "Pending" implies an
    // application in train — a different, and untrue, claim from "parked".
    expect(llms).toMatch(/ACSM[^.]*\bNOT\b[^.]*(pursued|parked)/i)
  })

  it('scopes the Osteopathy Australia endorsement to the course, not the entity', () => {
    // The endorsement covers Concussion Clinical Mastery only. An entity-level
    // claim ("Concussion Education Australia is OA endorsed") also sweeps in
    // CRM, the AI course and the international offerings, where OA has no
    // standing at all.
    expect(llms).not.toMatch(/Concussion Education Australia[^.]{0,40}(is )?Osteopathy Australia[- ]endorsed/i)
    expect(llms).toMatch(/Osteopathy Australia endorses the Concussion Clinical Mastery course only/i)
  })

  it('never claims one offering holds both the OA endorsement and ESSA accreditation', () => {
    expect(llms).not.toMatch(/only Australian[^.]*endorsed[^.]*accredited/i)
    expect(llms).toMatch(/No course holds both/i)
  })

  it('never ASSERTS AHPRA accreditation — AHPRA accredits no CPD', () => {
    // Blunt matching on "AHPRA-accredited" is wrong here, and flagged a line we
    // want to keep: the FAQ heading "Is this course AHPRA-accredited?", whose
    // answer is "AHPRA does not accredit CPD courses". That is the exact query
    // clinicians search, and answering it is how the correction reaches an AI
    // summariser at all — deleting it would remove the rebuttal, not the myth.
    //
    // So: strip the interrogative headings and any sentence that DENIES
    // accreditation, then assert nothing left over makes the claim.
    const assertions = llms
      .split('\n')
      .filter((l) => !/^#{1,6}\s.*\?\s*$/.test(l.trim()))
      .filter((l) => !/(does not|doesn't|no longer|never)\s+accredit/i.test(l))
      .filter((l) => !/AHPRA accredits no CPD/i.test(l))
      .join('\n')
    expect(assertions).not.toMatch(/AHPRA[- ]accredited|accredited by AHPRA|AHPRA CPD (hours|points)/i)
    // …and the correction itself must still be present.
    expect(llms).toMatch(/AHPRA (does not accredit|accredits no)/i)
  })
})

describe('robots policy keeps AI crawlers welcome', () => {
  const robots = readFileSync(join(REPO, 'public/robots.txt'), 'utf8')

  it('no named bot group contains an Allow (which would cancel every Disallow for it)', () => {
    // Under the Robots Exclusion Protocol a crawler obeys ONLY its most-specific
    // matching group. A named group containing an `Allow:` therefore silently
    // un-disallows everything the `*` group blocks for that bot — this is what
    // exposed /p/ prospect pages to AI crawlers until 2026-07-10.
    //
    // Named groups that only DISALLOW are the safe direction and are expected
    // (Bytespider/CCBot are blocked deliberately: training-only extraction with
    // no search or citation value).
    const offenders: string[] = []
    let current: string | null = null
    for (const raw of robots.split('\n')) {
      const line = raw.trim()
      if (/^#/.test(line) || !line) continue
      const ua = line.match(/^User-agent:\s*(\S+)/i)
      if (ua) {
        current = ua[1]
        continue
      }
      if (current && current !== '*' && /^Allow:/i.test(line)) {
        offenders.push(`${current} → ${line}`)
      }
    }
    expect(offenders, `named groups with Allow:\n${offenders.join('\n')}`).toEqual([])
  })

  it('blocks training-only extractors while leaving search/citation bots to the * group', () => {
    // GPTBot, ClaudeBot, PerplexityBot etc. are welcome and must NOT be named —
    // naming them is how you accidentally create the Allow-group hazard above.
    for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'OAI-SearchBot']) {
      expect(robots, `${bot} must not have its own group`).not.toMatch(
        new RegExp(`^User-agent:\\s*${bot}\\b`, 'im'),
      )
    }
  })

  it('still shields private surfaces', () => {
    for (const path of ['/api/', '/admin', '/p/', '/clinical-testing', '/ep-course']) {
      expect(robots).toContain(`Disallow: ${path}`)
    }
  })
})
