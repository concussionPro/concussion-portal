import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync, existsSync } from 'fs'
import { join, relative } from 'path'
import { CONFIG } from '../lib/config'

/**
 * REGISTER C — ONE CANONICAL TABLE, ENFORCED ACROSS THE WHOLE TREE.
 *
 * Every other claim test in this suite is scoped to a named file or directory:
 * geo-llm-surface reads public/llms.txt, email-copy-truth reads the email
 * templates, accreditation-claims walks app/ and components/,
 * completion-evidence-no-expiry names eight specific paths. That scoping is
 * exactly how the recurring failure works — a claim gets corrected on the
 * surfaces a test happens to watch and survives everywhere else:
 *
 *   - "AHPRA CPD hours" was fixed on twelve surfaces and still shipped in the
 *     dashboard welcome modal, the reference repository and an outbound admin
 *     email builder;
 *   - the AIS/SMA stand-down was de-mandated in the cold-email template
 *     (lib/prospect/email-templates.ts carries the note) and still read as a
 *     mandate on /clinical-suite/guild and in the AIS blog post;
 *   - "12-month certificate validity" was removed from every web surface the
 *     no-expiry test names, and survived in the COURSE PROSE two courses ship
 *     (content/ai-course/*.md, content/vagus-course/*.md) — which the test
 *     never globbed;
 *   - "14 CPD hours" survived the 2026-07-30 OA re-rate in public/.well-known/
 *     llms.txt, two send scripts, the Google Ads copy and four docs.
 *
 * So this file walks EVERY text file in the repo. It is deliberately blunt: a
 * new surface is covered the moment it exists, with no test edit.
 *
 * FENCED FILES. A file is skipped only if it is explicitly bricked — the marker
 * must sit in its first 3 000 characters, next to an unconditional throw or an
 * early return. That is a narrow, self-documenting exemption for historical
 * one-shots (send-melbourne-outreach.mjs, setup-stripe-products.ts,
 * setup-google-ads.py) whose copy cannot fire. It is not a way to opt new code
 * out: unfencing one of those files re-arms every rule below against it.
 */
const REPO = join(__dirname, '..')

const SKIP_DIRS = new Set([
  'node_modules', '.next', '.git', '.vercel', 'coverage',
  // Separate projects with their own lifecycles (see CLAUDE.md).
  'neurovision', 'sst-native', 'sst-watch',
  // Generated email-audit artifacts (regenerated from lib/email-sequences.ts).
  // Excluded so failures point at the TEMPLATE, not 300 copies of its output.
  '.data',
  // This directory: the rules below quote the banned forms as fixtures.
  'tests',
])
const TEXT = /\.(tsx?|jsx?|mjs|cjs|md|txt|json|html|css|py)$/

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const full = join(dir, entry)
    let st
    try { st = statSync(full) } catch { continue }
    if (st.isDirectory()) walk(full, out)
    else if (TEXT.test(entry)) out.push(full)
  }
  return out
}

/**
 * Blank out code comments, preserving line count and byte offsets.
 *
 * Nearly every fix in this repo leaves behind a comment naming the wrong value
 * it replaced ("a literal is how 14 CPD survived the re-rate", "expires_at is
 * retired"). Those comments are the institutional memory that stops the defect
 * recurring — scanning them would make this file punish the documentation of a
 * fix. Comments cannot render, so they are exempt; strings and JSX text are not.
 *
 * Markdown inline code is exempt on the same grounds. docs/SQUARESPACE_COPY_SYNC.md
 * is a find-and-replace sheet whose left column QUOTES the stale strings to hunt
 * for (`14 CPD`, `AOA Endorsed`); scanning them would make this file fail the one
 * document written to fix the drift it guards. Backticks are the marker: prose
 * asserting a rating stays in scope, a quoted literal does not. This is the same
 * exemption tests/ already gets for holding the banned forms as fixtures.
 */
function stripComments(src: string, path: string): string {
  if (/\.md$/.test(path)) {
    // Inline spans only — fenced blocks stay in scope, since a copy-paste block
    // is shippable copy.
    return src.replace(/`[^`\n]+`/g, (m) => ' '.repeat(m.length))
  }
  if (!/\.(tsx?|jsx?|mjs|cjs)$/.test(path)) return src
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/^\s*\/\/.*$/gm, (m) => ' '.repeat(m.length))
    .replace(/^\s*\*(?!\/).*$/gm, (m) => ' '.repeat(m.length))
}

interface Surface { path: string; src: string; fenced: boolean }

const surfaces: Surface[] = walk(REPO).map((path) => {
  const raw = readFileSync(path, 'utf8')
  const rel = relative(REPO, path)
  return {
    path: rel,
    src: stripComments(raw, rel),
    fenced: /BRICKED|DEPRECATED — DO NOT USE|DEPRECATED - DO NOT USE/.test(raw.slice(0, 3000)),
  }
})

/** Live surfaces — everything that is not explicitly bricked. */
const live = surfaces.filter((s) => !s.fenced)

/**
 * Live surfaces MINUS the root-level scoping archives (COURSE_SCOPING_TRILOGY,
 * SCOPE_*, STRATEGY_AUDIT_*, COURSE_MAP …). Those are dated planning documents
 * that cost out courses which were never built — "PPCS Clinical Mastery
 * (6 CPD hrs, A$397)" is a proposal, not a rating, and holding a proposal to
 * the shipped catalogue would make the quantity rules unreadable noise.
 *
 * The exclusion is by LOCATION, not by opt-in: anything under app/, components/,
 * lib/, content/, data/, public/, scripts/ or docs/ is in scope no matter what
 * it says about itself. A planning doc that moves into docs/ starts being
 * checked.
 */
const shipped = live.filter((s) => s.path.includes('/'))

/** Report every offending line, with its file and line number. */
function scan(
  files: Surface[],
  predicate: (line: string, file: Surface) => boolean,
): string[] {
  const hits: string[] = []
  for (const f of files) {
    f.src.split('\n').forEach((line, i) => {
      if (predicate(line, f)) hits.push(`${f.path}:${i + 1} → ${line.trim().slice(0, 160)}`)
    })
  }
  return hits
}

// ───────────────────────────────────────────────────────────────────────────
// CLASS: AHPRA is framed as accrediting CPD or awarding hours.
//
// Ground truth: AHPRA accredits no CPD and awards no hours. "AHPRA-aligned" is
// the only sanctioned framing; hours are self-claimed by the registrant.
// ───────────────────────────────────────────────────────────────────────────
const AHPRA_ASSERTION =
  /AHPRA[- ]?(?:accredited|approved|certified|endorsed)\b|(?:accredited|approved|certified|endorsed) by AHPRA|AHPRA[- ]CPD[- ]?(?:hour|point)|AHPRA (?:awards|grants|issues) /i

/**
 * The phrase is NOT an assertion when the line denies it, asks it as a
 * question, or quotes it as the thing being warned against — all three are
 * copy we want to keep. The AI course teaches clinicians to treat
 * "AHPRA-approved" as a vendor red flag; llms.txt answers the FAQ heading
 * "Is this course AHPRA-accredited?" with the correction. Deleting those would
 * remove the rebuttal, not the myth.
 */
function isAhpraRebuttal(line: string): boolean {
  return (
    /\b(?:does not|doesn't|do not|don't|are not|is not|aren't|isn't|not|never|no longer|cannot|can't)\b[^.]{0,60}\b(?:accredit|approve|certif|endorse)/i.test(line) ||
    /AHPRA accredits (?:no|nothing)/i.test(line) ||
    /\?\s*$/.test(line.trim()) ||
    // The phrase ALONE inside quotes — i.e. named as a phrase, the way
    // /courses/how-we-vet lists 'Marketing uses "AHPRA-certified" … language'.
    // Deliberately tight: the quotes must hug the phrase and nothing else.
    // Matching any quoted context would exempt essentially all TSX copy, since
    // a title or description string is itself quoted — which is how
    // `title: "AHPRA-accredited concussion course"` slipped past the first
    // version of this rule.
    /["'“”]\s*AHPRA[- ](?:accredited|approved|certified|endorsed)\s*["'“”]/i.test(line) ||
    /red flag|misus|overclaim|must never|never write|banned|not permissible|only permissible/i.test(line)
  )
}

describe('AHPRA is never framed as accrediting CPD or awarding hours', () => {
  it('no live surface asserts AHPRA accreditation, approval or AHPRA CPD hours', () => {
    const offenders = scan(live, (line) =>
      AHPRA_ASSERTION.test(line) && !isAhpraRebuttal(line),
    )
    expect(
      offenders,
      `AHPRA accredits no CPD and awards no hours — use "AHPRA-aligned":\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('the detector fires on every phrasing, and spares the rebuttals', () => {
    const reintroduced = [
      '<p>Earn your first AHPRA CPD hour — takes about 75 minutes</p>',
      'title: "AHPRA-accredited concussion course"',
      'description: "This course is accredited by AHPRA."',
      'body: `walk through pricing, AHPRA CPD hours, or the cohort schedule`',
      '<span>AHPRA-approved training for allied health</span>',
      'AHPRA awards 16 hours for this activity.',
    ]
    for (const line of reintroduced) {
      expect(
        AHPRA_ASSERTION.test(line) && !isAhpraRebuttal(line),
        `detector missed: ${line}`,
      ).toBe(true)
    }
    const keep = [
      '### Is this course AHPRA-accredited?',
      'AHPRA does not certify, accredit, or endorse individual AI products.',
      'AHPRA accredits no CPD and awards no hours — CEA courses are AHPRA-aligned.',
      'Marketing uses "AHPRA-certified" or "AHPRA-approved" language.',
      '<p>16 CPD hours — AHPRA-aligned, endorsed by Osteopathy Australia</p>',
    ]
    for (const line of keep) {
      expect(
        AHPRA_ASSERTION.test(line) && !isAhpraRebuttal(line),
        `false positive on: ${line}`,
      ).toBe(false)
    }
  })
})

// ───────────────────────────────────────────────────────────────────────────
// CLASS: a CPD figure that no longer matches the canonical rating.
//
// The 2026-07-30 OA re-rate moved the practical day 6 → 8 and the total
// 14 → 16. Fourteen and six survived in eight places. Every CPD quantity in
// the repo must be one the config can account for.
// ───────────────────────────────────────────────────────────────────────────
const CPD_QUANTITY = /(\d+(?:\.\d+)?)\s*(?:AHPRA\s*|ESSA\s*)?(?:CPD|cpd)[- ]?(?:hour|hr|point|pt|Hour|Point)/g
/**
 * The compound form — "a 14-CPD-hour program". Deliberately requires the unit,
 * because a bare "3 CPD" also matches phrases like "vote for up to 3 CPD
 * topics", where the number counts topics, not hours.
 */
const CPD_DASH = /(\d+(?:\.\d+)?)-CPD[- ](?:hour|hr|point)/gi
/**
 * A "CPD Points:" / "CPD hours:" LABEL, after which the numbers on the line are
 * all CPD quantities even though none of them sits next to the letters "CPD".
 * That is the shape the stale .well-known fork used — "CPD Points: 8 (online
 * only), or up to 14 with the in-person workshop day" — so an adjacency-only
 * rule read the 8 and never saw the 14.
 */
const CPD_LABEL = /\bCPD\s*(?:Points?|Hours?)\s*:/i
const BARE_NUMBER = /\b(\d{1,2})\b/g
/**
 * The composition breakdown — "16 CPD hours (8 online + 8 in-person)". Neither
 * component number touches the letters "CPD", so adjacency alone read the 16
 * and missed a practical-day figure sitting one bracket away. This is the most
 * common shape the rating appears in across the site.
 */
const CPD_BREAKDOWN = /(\d{1,2})\s*(?:CPD\s*)?(?:hours?|hrs?|points?)?\s*online\s*[+&]\s*(\d{1,2})\s*(?:CPD\s*)?(?:hours?|hrs?|points?)?\s*in[- ]?person/gi

/** Every CPD quantity the business can currently justify, from its source. */
const ALLOWED_CPD = new Set<number>([
  0,
  CONFIG.COURSE.ONLINE_CPD_POINTS,      // 8  — CCM/CRM online
  CONFIG.COURSE.IN_PERSON_CPD_POINTS,   // 8  — the practical day (OA re-rate 2026-07-30)
  CONFIG.COURSE.TOTAL_CPD_POINTS,       // 16 — CCM total
  CONFIG.COURSE.CRM_TOTAL_CPD_POINTS,   // 16 — CRM total under ESSA
  CONFIG.COURSE.SCAT_MASTERY_CPD_POINTS, // 1 — free SCAT6 course
  CONFIG.ESSA_ACCREDITATION.ONLINE_POINTS,
  CONFIG.ESSA_ACCREDITATION.PRACTICAL_POINTS,
  2, // AI in Clinical Practice — lib/ai-course/provider-catalogue.ts cpdHours
])

/**
 * SUBJECT, NOT DIGITS — the rule that makes this guard survivable.
 *
 * A CPD quantity is only wrong when it is asserted as OURS. "16 CPD hours",
 * "8 ESSA CPD points online" are ratings of a CEA offering and must track
 * CONFIG. "AHPRA Boards want 20–50 hours a year", "SESNZ 20 CPD pts/yr",
 * "CIMSPA members must record 10 CPD points per year", "CASES caps endorsement
 * at 10 credits per event" are facts about somebody else's scheme and are
 * legitimately any number at all.
 *
 * The first version of this rule matched on the digits, so every future mention
 * of another body's requirement would have failed the build — and the
 * predictable response to a guard that fires on correct content is to delete
 * the guard, not the claim. Ownership is decided here instead.
 */
const THIRD_PARTY_SCHEME =
  // A recurring requirement — the giveaway that the number belongs to a scheme.
  /\b(?:per|a|each|every)\s+(?:year|annum|cycle)\b|\/\s*(?:yr|year|annum)\b|\bp\.a\.|annual(?:ly)?\b|registration cycle|CPD year/i
const THIRD_PARTY_VERB =
  /requirement|require[sd]?\b|required to record|members must|must record|capped at|\bcap\b|per event|per registration|budget|equivalency|scheme|allocat|ceiling|floor|benchmark|typical(?:ly)?|expected shape/i
/** Bodies whose own schemes get documented in the accreditation packs. */
const THIRD_PARTY_BODY =
  /\bAHPRA\b|\bSESNZ\b|\bCEPNZ\b|\bCIMSPA\b|\bCASES\b|\bBASES\b|\bCSEP\b|\bACSM\b|\bHPCSA\b|\bBOC\b|\bCPA\b|Pharmacy Board|Physiotherapy Board|Board's|Medical Board/i

/**
 * Is this line stating a CPD figure that belongs to a CEA offering?
 *
 * On a RENDERING surface (app/, components/, lib/, data/, content/, public/)
 * the default is yes — that copy exists to sell or describe our own courses —
 * unless the line is plainly describing another body's scheme.
 *
 * In internal prose (docs/, scripts/) the default flips: those files exist
 * largely to document other organisations, so a figure counts as ours only when
 * the line actually names a CEA offering. That is still real coverage — it is
 * what catches "Concussion Clinical Mastery, a 14-CPD-hour program" in an
 * outreach draft, which is exactly where the last re-rate's stragglers hid.
 */
const CEA_OFFERING =
  /Concussion Clinical Mastery|Concussion Rehab Mastery|\bCCM\b|\bCRM\b|Concussion Education Australia|\bCEA\b|SCAT6? Mastery|AI in Clinical Practice|Vagus|\bour (?:course|program|flagship)|the (?:online|complete|full) course|practical day|in-person day|workshop/i

function assertsOurCpd(line: string, path: string): boolean {
  const thirdParty =
    THIRD_PARTY_SCHEME.test(line) ||
    (THIRD_PARTY_BODY.test(line) && THIRD_PARTY_VERB.test(line))
  if (thirdParty) return false
  const isRenderingSurface = /^(?:app|components|lib|data|content|public)\//.test(path)
  return isRenderingSurface || CEA_OFFERING.test(line)
}

/** Every CPD quantity on a line that the canonical set cannot account for. */
function staleCpdFigures(line: string, path = 'app/x.tsx'): number[] {
  if (!assertsOurCpd(line, path)) return []
  const found = new Set<number>()
  const patterns = CPD_LABEL.test(line)
    ? [CPD_QUANTITY, CPD_DASH, BARE_NUMBER]
    : [CPD_QUANTITY, CPD_DASH]
  for (const re of patterns) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(line))) {
      const n = Number(m[1])
      if (!ALLOWED_CPD.has(n)) found.add(n)
    }
  }
  CPD_BREAKDOWN.lastIndex = 0
  let b: RegExpExecArray | null
  while ((b = CPD_BREAKDOWN.exec(line))) {
    for (const g of [b[1], b[2]]) {
      const n = Number(g)
      if (!ALLOWED_CPD.has(n)) found.add(n)
    }
  }
  return [...found]
}

describe('every CPD figure in the repo is one the config can account for', () => {
  const cpdOffenders = (files: Surface[]) => {
    const offenders: string[] = []
    for (const f of files) {
      f.src.split('\n').forEach((line, i) => {
        for (const n of staleCpdFigures(line, f.path)) {
          offenders.push(`${f.path}:${i + 1} → ${n} CPD — ${line.trim().slice(0, 140)}`)
        }
      })
    }
    return offenders
  }
  const allowed = () => [...ALLOWED_CPD].sort((a, b) => a - b).join(', ')

  it('no rendering surface quotes a CPD quantity outside the canonical set', () => {
    // What the customer, the crawler and the PDF actually see.
    const rendering = live.filter((s) =>
      /^(?:app|components|lib|data|content|public)\//.test(s.path),
    )
    const offenders = cpdOffenders(rendering)
    expect(
      offenders,
      `CPD ratings must derive from CONFIG.COURSE — allowed: ${allowed()}\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('internal prose stays current wherever it names a CEA offering', () => {
    // Separate assertion, narrower subject test: docs/ and scripts/ legitimately
    // quote other organisations' numbers, but a stale rating of OUR course in an
    // outreach draft still goes out to a real person.
    const internal = live.filter((s) => /^(?:docs|scripts)\//.test(s.path))
    const offenders = cpdOffenders(internal)
    expect(
      offenders,
      `these state a CEA CPD rating that no longer matches config — allowed: ${allowed()}\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('the allowed set tracks config rather than restating it', () => {
    // If the practical day were re-rated again, ALLOWED_CPD moves with it and
    // the literals left behind in copy become the failures — which is the point.
    expect(ALLOWED_CPD.has(CONFIG.COURSE.TOTAL_CPD_POINTS)).toBe(true)
    expect(
      CONFIG.COURSE.ONLINE_CPD_POINTS + CONFIG.COURSE.IN_PERSON_CPD_POINTS,
      'online + practical must equal the advertised total',
    ).toBe(CONFIG.COURSE.TOTAL_CPD_POINTS)
  })

  it('subject-scoping did not defang the rule — a CEA claim still fails anywhere', () => {
    // The scoping change (match the claim's SUBJECT, not the digits) is only
    // safe if it still fires on a genuine CEA rating. Proven on BOTH buckets,
    // in memory, using the paths each assertion actually scans.
    const publicPage = 'components/PricingOptions.tsx'
    expect(
      staleCpdFigures("'Full-day workshop (14 CPD hours)',", publicPage),
      'a hardcoded 14 CPD hours on a public page must still fail',
    ).toEqual([14])
    expect(
      staleCpdFigures('<p>16 CPD Hours | 8 online + 6 in-person</p>', publicPage),
    ).toEqual([6])
    // Internal prose: only when the line names a CEA offering.
    const draft = 'docs/partnership-outreach.md'
    expect(
      staleCpdFigures("I've built Concussion Clinical Mastery, a 14-CPD-hour program", draft),
      'a stale CEA rating in an outreach draft must still fail',
    ).toEqual([14])
    // …and a third party's number in the same file must not.
    expect(
      staleCpdFigures('SESNZ / CEPNZ (New Zealand). Low hundreds; 20 CPD pts/yr; scheme modelled on ESSA.', draft),
    ).toEqual([])
    expect(
      staleCpdFigures('CIMSPA members must record 10 CPD points per year, minimum 5 from endorsed providers.', draft),
    ).toEqual([])
    expect(
      staleCpdFigures('AU clinicians need 20–50 CPD hours a year.', 'app/courses/private-preview/page.tsx'),
    ).toEqual([])
    expect(
      staleCpdFigures('- **Total**: **40 CPD credits** per CPD year (1 Oct – 30 Sep). Credit-weighted.', 'docs/ahpra-cpd-requirements.md'),
    ).toEqual([])
  })

  it('the detector catches the exact figures that survived the last re-rate', () => {
    const stale = [
      '<li>6 CPD hours on top of the full online course (16 CPD hours total)</li>',
      'Adding the practical day takes you to the full 14 CPD hours',
      "description: 'Comprehensive concussion education with 10 CPD hours'",
      "I've built Concussion Clinical Mastery, a 14-CPD-hour concussion program",
      '"Earn 14 AHPRA CPD Points"',
      '- CPD Points: 8 (online only), or up to 14 with the in-person workshop day',
    ]
    for (const line of stale) {
      expect(
        staleCpdFigures(line).length > 0,
        `detector missed a stale CPD figure in: ${line}`,
      ).toBe(true)
    }
    // …and does not trip on the current ratings.
    for (const line of [
      '<p>16 CPD hours (8 online + 8 in-person)</p>',
      '1 CPD hour awarded on completing all 3 modules',
      'A$99 · 2 CPD hours · certificate on completion.',
      '- CPD Points: 8 (online only), or up to 16 with the in-person workshop day (8 online + 8 in-person)',
    ]) {
      expect(staleCpdFigures(line), `false positive on: ${line}`).toEqual([])
    }
  })
})

// ───────────────────────────────────────────────────────────────────────────
// CLASS: a course price literal that is not a current price.
//
// llms-full.txt quoted "International tier: USD $197" against
// PRICE_INTERNATIONAL 347, eleven lines from its own correct US$347 — because
// the price test read llms.txt only.
// ───────────────────────────────────────────────────────────────────────────
const CURRENT_PRICES = new Set<number>([
  CONFIG.COURSE.PRICE_ONLINE,
  CONFIG.COURSE.PRICE_ONLINE - CONFIG.COURSE.SCAT_DISCOUNT_AUD,
  CONFIG.COURSE.PRICE_ONLINE - CONFIG.COURSE.BUNDLE_OWNER_DISCOUNT_AUD,
  CONFIG.COURSE.PRICE_REGULAR,
  CONFIG.COURSE.PRICE_EARLY_BIRD,
  CONFIG.COURSE.PRICE_EARLY_BIRD - CONFIG.COURSE.PRICE_ONLINE, // upgrade difference
  CONFIG.COURSE.PRICE_REGULAR - CONFIG.COURSE.PRICE_ONLINE,
  CONFIG.COURSE.PRICE_INTERNATIONAL,
  CONFIG.COURSE.RENEWAL_INTERNATIONAL,
  CONFIG.COURSE.PRICE_CLINIC_HUB_PACK,
  CONFIG.COURSE.PRICE_CLINIC_HUB_EXTRA_SEAT,
  CONFIG.COURSE.PRICE_CLINIC_WORKSHOP_UPGRADE,
  // The refundable seat deposit (owner 2026-09-05) is charged for real, via
  // price_data rather than a Stripe Price id — which is why it still belongs
  // here: this rule asks whether a tier-labelled figure is actually charged,
  // not whether it has its own Price object.
  CONFIG.COURSE.PRICE_SECURE_SEAT,
])

/**
 * Only prices attached to one of OUR tier words are checked. A bare dollar
 * amount in the repo is usually something else entirely (a Rydges parking rate,
 * an ACC fee schedule, an analytics threshold), and banning those would make
 * this rule noise rather than signal.
 */
const TIER_PRICE =
  /(?:online|full[- ]course|early[- ]?bird|upgrade|international|hub pack|sticker)\s+(?:tier|price|rate)?[^.\n]{0,30}?(?<![A-Z])(?:A?\$|US\$|USD\s?\$?)\s?([\d,]{3,6})\b/gi

describe('no surface quotes a superseded course price', () => {
  it('every tier-labelled price literal is a price that is actually charged', () => {
    const offenders: string[] = []
    for (const f of shipped) {
      f.src.split('\n').forEach((line, i) => {
        TIER_PRICE.lastIndex = 0
        let m: RegExpExecArray | null
        while ((m = TIER_PRICE.exec(line))) {
          const n = Number(m[1].replace(/,/g, ''))
          if (!CURRENT_PRICES.has(n)) {
            offenders.push(`${f.path}:${i + 1} → $${n} — ${line.trim().slice(0, 140)}`)
          }
        }
      })
    }
    expect(
      offenders,
      `these quote a price no tier charges — derive from CONFIG.COURSE / workshopPriceFor():\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('the detector catches the superseded international price', () => {
    const line = '- **International tier:** USD $197 — Online tier, jurisdiction-neutral content.'
    TIER_PRICE.lastIndex = 0
    const m = TIER_PRICE.exec(line)
    expect(m, 'detector did not match the international tier line').not.toBeNull()
    expect(CURRENT_PRICES.has(Number(m![1].replace(/,/g, '')))).toBe(false)
    // …and passes once corrected to the config value.
    const fixed = `- **International tier:** USD $${CONFIG.COURSE.PRICE_INTERNATIONAL} — Online tier.`
    TIER_PRICE.lastIndex = 0
    const m2 = TIER_PRICE.exec(fixed)
    expect(CURRENT_PRICES.has(Number(m2![1].replace(/,/g, '')))).toBe(true)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// CLASS: completion evidence framed as expiring or needing renewal.
//
// Removed from the web, survived in the prose of two courses.
// ───────────────────────────────────────────────────────────────────────────
const EXPIRING_CERTIFICATE =
  /certificate[^.\n]{0,60}valid (?:for|until)\s+\d|valid for \d+\s*(?:month|year)[^.\n]{0,40}certificate|\b\d+[- ]month (?:validity|renewal)|validity:\s*\d+\s*month|re-?sit[^.\n]{0,40}(?:each|every) year[^.\n]{0,30}(?:refresh|renew)|certificate[^.\n]{0,40}(?:expires|lapses)|renew (?:your|the) certificate (?:each|every) year/i

describe('completion evidence never expires, anywhere', () => {
  it('no live surface gives a certificate a validity window or a renewal', () => {
    const offenders = scan(live, (line) =>
      EXPIRING_CERTIFICATE.test(line) &&
      // The ACCREDITATION has a real expiry (CONFIG.ESSA_ACCREDITATION.VALID_UNTIL).
      // That is a property of the offering, not of the holder's certificate.
      !/ESSA|PDNF|accreditation/i.test(line) &&
      // A THIRD PARTY's document that genuinely does expire — the clinician's
      // own indemnity certificate of currency, registration, police check.
      // /clinical-testing/cpd stores those for the user; they are not ours.
      !/indemnity|certificate of currency|registration|police|first aid|working with children/i.test(line) &&
      // The retired `expires_at` COLUMN. The migrations that drop its NOT NULL
      // and null it out are the mechanism that made certificates permanent —
      // banning the identifier would ban the fix.
      !/expires_at|expiryDate|expiry_date|ALTER (?:TABLE|COLUMN)/i.test(line),
    )
    expect(
      offenders,
      `completion evidence states what someone did and when — it does not lapse:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('the detector catches the forms that survived in course prose', () => {
    for (const line of [
      '- **Validity: 12 months.** AI regulation in Australia is moving.',
      '- Issues a verifiable certificate valid for 12 months',
      "detail: 'verifiable certificate URL · A4 PDF download · 12-month validity'",
      'with verifiable certificates, 12-month renewal, and a monthly refresh pipeline',
      '- **Renewal.** Re-sit the short assessment each year to refresh the certificate.',
    ]) {
      expect(EXPIRING_CERTIFICATE.test(line), `detector missed: ${line}`).toBe(true)
    }
    for (const line of [
      '<p className="font-semibold text-foreground">No expiry</p>',
      "'Valid — completion evidence, no expiry'",
      'Accredited by ESSA — Accreditation No. PDNF26077, valid until 24 July 2027.',
    ]) {
      const flagged = EXPIRING_CERTIFICATE.test(line) && !/ESSA|PDNF|accreditation/i.test(line)
      expect(flagged, `false positive on: ${line}`).toBe(false)
    }
  })
})

// ───────────────────────────────────────────────────────────────────────────
// CLASS: the AIS/SMA stand-down framed as a mandate or as law.
//
// It is guidance. It binds an athlete only where their code has adopted it.
// ───────────────────────────────────────────────────────────────────────────
const STANDDOWN_MANDATE =
  /mandator(?:y|ily)[^.\n]{0,40}stand[- ]?down|stand[- ]?down[^.\n]{0,30}\bis\b[^.\n]{0,20}mandator|\bmandates?\b[^.\n]{0,30}stand[- ]?down|stand[- ]?down[^.\n]{0,20}\*?mandates?\*?\s|(?:guidelines?|statement|AIS|SMA)[^.\n]{0,40}\bmandates? a\b[^.\n]{0,30}stand[- ]?down|stand[- ]?down[^.\n]{0,30}(?:is law|by law|legally required)/i

describe('the AIS/SMA stand-down is guidance, never a mandate', () => {
  it('no live surface calls the stand-down mandatory or legally binding', () => {
    const offenders = scan(live, (line) =>
      STANDDOWN_MANDATE.test(line) &&
      // Lines that exist to record the correction are the fix, not the defect.
      !/ACCURACY|guidance, not law|not a mandate|is GUIDANCE|guidance-only/i.test(line),
    )
    expect(
      offenders,
      `the AIS/SMA position statement recommends; codes adopt. It is not law:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('the detector catches the phrasings that were fixed piecemeal', () => {
    for (const line of [
      'community sport now carries a **mandatory 21-day stand-down** under the AIS/SMA guidelines',
      'Short: 21-day mandatory stand-down + named clearance providers (2024 AIS/SMA)',
      'The AIS/SMA community-sport guidelines now mandate a 21-day stand-down',
      'The 21-day stand-down *mandates* trained people — they have a compliance need.',
    ]) {
      expect(STANDDOWN_MANDATE.test(line), `detector missed: ${line}`).toBe(true)
    }
    for (const line of [
      'The AIS/SMA concussion guidelines set a recommended minimum 21-day return-to-contact period for community sport.',
      'The Position Statement is guidance, not law.',
      '21-day minimum stand-down',
    ]) {
      expect(STANDDOWN_MANDATE.test(line), `false positive on: ${line}`).toBe(false)
    }
  })
})

// ───────────────────────────────────────────────────────────────────────────
// CLASS: an endorsement or accreditation applied to the wrong offering.
//
// Osteopathy Australia endorses Concussion Clinical Mastery ONLY.
// ESSA accredits Concussion Rehab Mastery ONLY. No offering holds both.
// ───────────────────────────────────────────────────────────────────────────
/**
 * Does this line hand a SINGLE offering both credentials?
 *
 * Osteopathy Australia endorses Concussion Clinical Mastery; ESSA accredits
 * Concussion Rehab Mastery. Naming both side by side is correct and common
 * ("CCM — OA-endorsed · CRM — ESSA-accredited", "there's a separate
 * ESSA-accredited stream for exercise physiologists"). Bundling them into one
 * parenthetical — "(Osteopathy Australia-endorsed, ESSA-accredited)", which is
 * what the enterprise send script said about one training offering — is not.
 *
 * The scan and its self-test both call THIS function. An earlier draft inlined
 * the predicate in each, which is the same drift this file exists to prevent.
 */
function claimsBothCredentials(line: string): boolean {
  // docs/brand-voice.md states the banned sentence verbatim in order to ban it
  // ('never write "endorsed by OA and accredited by ESSA" about one offering').
  // A rule that fails on its own source text is a rule nobody keeps.
  if (/never write|must never|do not write|banned|red flag/i.test(line)) return false
  if (!/Osteopathy Australia|OA[- ]endorsed/i.test(line)) return false
  if (!/ESSA[- ]accredited|accredited by ESSA|accredited across/i.test(line)) return false
  const distinguishes =
    /Concussion Rehab Mastery|separate[^.\n]{0,30}stream|\bstream\b[^.\n]{0,60}\bstream\b|both courses|rehab stream/i.test(line)
  const collapses = /the one |the only |both professions/i.test(line)
  return !distinguishes || collapses
}

describe('endorsement and accreditation stay attached to their own course', () => {
  it('no surface claims one offering holds both the OA endorsement and ESSA accreditation', () => {
    const offenders = scan(live, claimsBothCredentials)
    expect(
      offenders,
      `OA endorses CCM, ESSA accredits CRM — no course holds both:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('no surface asserts an entity-level Osteopathy Australia endorsement', () => {
    const offenders = scan(live, (line) =>
      /Concussion Education Australia[^.\n]{0,50}(?:is )?(?:Osteopathy Australia[- ]endorsed|endorsed by Osteopathy Australia)/i.test(line) &&
      // Naming the COURSE as the subject of the endorsement is the fix, not the
      // defect: "Concussion Education Australia · Concussion Clinical Mastery is
      // endorsed by Osteopathy Australia" is a company line followed by a
      // course-scoped claim. Only an unqualified company-level claim fails.
      !/course only|not Concussion Education Australia|flagship|Concussion Clinical Mastery/i.test(line),
    )
    expect(
      offenders,
      `the endorsement covers the CCM course, not the company:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('the detector catches both shapes that collapsed the two streams', () => {
    for (const line of [
      // The superlative, from the workshop-announce credential strip.
      'Endorsed by Osteopathy Australia · ESSA-accredited rehab stream — the one concussion program accredited across both professions.',
      // The parenthetical, from the live enterprise outreach script.
      'We certify clinical teams in the updated protocol (Osteopathy Australia-endorsed, ESSA-accredited) with a platform that produces the documentation.',
    ]) {
      expect(claimsBothCredentials(line), `detector missed: ${line}`).toBe(true)
    }
    for (const line of [
      'Concussion Clinical Mastery — endorsed by Osteopathy Australia · Concussion Rehab Mastery — accredited by ESSA.',
      'endorsed by Osteopathy Australia, from A$497. There is a separate ESSA-accredited stream for exercise physiologists.',
      'Clinical-stream training OA-endorsed; exercise-physiology stream ESSA-accredited (No. PDNF26077)',
    ]) {
      expect(claimsBothCredentials(line), `false positive on: ${line}`).toBe(false)
    }
  })
})

// ───────────────────────────────────────────────────────────────────────────
// CLASS: a claim that renders by DEFAULT on routes it was never scoped for.
//
// Found by reading what production SERVES, not the source: /acsm, /cep-uk and
// /concussion-rehab-mastery — all CRM surfaces — were shipping "Endorsed by
// Osteopathy Australia" as their twitter:description, and the CRM flagship as
// its og:description too, because app/layout.tsx falls back to
// CONFIG.SEO.DESCRIPTION for all three description tags. The JSON-LD
// Organization node had already been scoped for this exact reason; the meta
// tags one layer up had not.
// ───────────────────────────────────────────────────────────────────────────
describe('the site-wide metadata fallback is true on every route it lands on', () => {
  it('the derived claim strings actually resolve', () => {
    // They are assigned AFTER the CONFIG literal (an object literal cannot read
    // its own fields mid-construction). A typo in that assignment leaves the
    // empty-string placeholder in place, which typechecks and renders blank
    // metadata on every route — silent, and invisible to every other test.
    expect(CONFIG.SEO.DESCRIPTION.length).toBeGreaterThan(80)
    expect(CONFIG.COURSE.CPD_BADGE_TEXT).toContain(String(CONFIG.COURSE.TOTAL_CPD_POINTS))
    expect(CONFIG.SEO.DESCRIPTION).toContain(String(CONFIG.COURSE.TOTAL_CPD_POINTS))
    expect(CONFIG.SEO.DESCRIPTION).toContain(String(CONFIG.COURSE.ONLINE_CPD_POINTS))
  })

  it('the default description scopes its endorsement to the endorsed course', () => {
    const d = CONFIG.SEO.DESCRIPTION
    if (/Osteopathy Australia/i.test(d)) {
      expect(
        d,
        'this string is the description/og/twitter fallback for EVERY route, including the ESSA (CRM) and international pages — name the course the endorsement covers',
      ).toMatch(/Concussion Clinical Mastery/i)
    }
    // A bare trailing "Endorsed by Osteopathy Australia." is the shape that
    // made it an entity-level claim wherever it rendered.
    expect(d).not.toMatch(/(?:^|\.\s)Endorsed by Osteopathy Australia\.?\s*$/i)
  })

  it('the CRM flagship supplies its own social preview rather than inheriting CCM copy', () => {
    const src = readFileSync(join(REPO, 'app/concussion-rehab-mastery/page.tsx'), 'utf8')
    expect(src).toMatch(/openGraph:/)
    expect(src).toMatch(/twitter:/)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// CLASS: an unsubstantiated superlative.
//
// docs/brand-voice.md: never "the only Australian…" or any comparable
// superlative — unsubstantiated, and a breach of the AHPRA advertising
// guidelines. "The only concussion-rehabilitation course scoped for AEPs" was
// live in the CRM page's description meta tag.
// ───────────────────────────────────────────────────────────────────────────
const SELF_SUPERLATIVE =
  /\bthe only (?:Australian|concussion|course|program|provider|platform|clinical)|Australia's only|only (?:course|program|provider) in Australia|the first and only|\bthe one (?:concussion )?(?:course|program)/i

describe('no unsubstantiated superlative about CEA or its courses', () => {
  it('no rendering surface claims to be the only one of its kind', () => {
    const rendering = live.filter((s) =>
      /^(?:app|components|lib|data|content|public)\//.test(s.path),
    )
    const offenders = scan(rendering, (line) =>
      SELF_SUPERLATIVE.test(line) &&
      // Statements ABOUT third parties are facts, not self-promotion.
      !/\bACC\b|\bBIST\b|instrument named|provider-news/i.test(line),
    )
    expect(
      offenders,
      `unsubstantiated superlative — breaches the AHPRA advertising guidelines:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('the detector catches the form that shipped in a meta description', () => {
    expect(
      SELF_SUPERLATIVE.test(
        'The only concussion-rehabilitation course scoped for Accredited Exercise Physiologists and Exercise Scientists.',
      ),
    ).toBe(true)
    expect(
      SELF_SUPERLATIVE.test(
        'the one concussion program accredited across both professions',
      ),
    ).toBe(true)
    expect(
      SELF_SUPERLATIVE.test(
        'Concussion rehabilitation scoped for Accredited Exercise Physiologists and Exercise Scientists.',
      ),
    ).toBe(false)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// STRUCTURAL: no second copy of a hand-maintained public claim surface.
// ───────────────────────────────────────────────────────────────────────────
describe('the AI-facing surface has exactly one copy', () => {
  it('public/.well-known/llms.txt is not a second, drifting fork of llms.txt', () => {
    // It was one: a full generation behind (14 CPD, 6 in-person, the AI course
    // tagged "By Osteopathy Australia–endorsed provider", no CRM stream, no
    // accreditation-honesty section). Nothing caught it because the route
    // handler at app/.well-known/llms.txt/route.ts shadows the static file, so
    // the fork was never SERVED — it just sat there waiting for that route to
    // be deleted. One canonical file, served twice.
    expect(
      existsSync(join(REPO, 'public/.well-known/llms.txt')),
      'delete it — app/.well-known/llms.txt/route.ts serves public/llms.txt at that path',
    ).toBe(false)
    const route = readFileSync(join(REPO, 'app/.well-known/llms.txt/route.ts'), 'utf8')
    expect(route).toMatch(/'public',\s*'llms\.txt'/)
  })

  it('llms-full.txt is price-checked too, not just llms.txt', () => {
    const full = readFileSync(join(REPO, 'public/llms-full.txt'), 'utf8')
    expect(full).toContain(`A$${CONFIG.COURSE.PRICE_ONLINE}`)
    expect(full).toContain(`${CONFIG.COURSE.PRICE_INTERNATIONAL}`)
    expect(full, 'the superseded USD $197 international price').not.toMatch(/USD \$?197\b/)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// DERIVED COUNTS: the literals that stand in for datasets must track them.
// ───────────────────────────────────────────────────────────────────────────
describe('published counts match the datasets behind them', () => {
  it('CRM reference counts track lib/ep-references, not the CCM repository', async () => {
    const { getEpReferences, epCitationTotal } = await import('../lib/ep-references')
    const { CRM_REFERENCE_COUNT, CRM_CITATION_TOTAL, REFERENCE_COUNT } =
      await import('../data/reference-count')
    expect(
      CRM_REFERENCE_COUNT,
      'data/reference-count.ts CRM_REFERENCE_COUNT is out of sync with the EP modules',
    ).toBe(getEpReferences().length)
    expect(CRM_CITATION_TOTAL).toBe(epCitationTotal())
    // The two courses have different evidence bases. If these ever coincide the
    // guard below stops meaning anything, so assert they are genuinely distinct.
    expect(
      CRM_REFERENCE_COUNT,
      'CRM and CCM counts must not be conflated — that was the defect',
    ).not.toBe(REFERENCE_COUNT)
  })

  it('no CRM-scoped page renders the CCM repository count', () => {
    const crmPages = [
      'app/acsm/page.tsx', 'app/cep-uk/page.tsx', 'app/csep/page.tsx',
      'app/sesnz/page.tsx', 'app/hpcsa/page.tsx', 'app/cases/page.tsx',
      'app/cimspa/page.tsx', 'app/platform/evidence/page.tsx',
      'app/ep-course/dashboard/page.tsx', 'components/crm/CrmInternationalContent.tsx',
    ]
    const offenders = crmPages.filter((p) => {
      const src = readFileSync(join(REPO, p), 'utf8')
      const code = src.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
      return /\bREFERENCE_COUNT\b/.test(code.replace(/\bCRM_REFERENCE_COUNT\b/g, ''))
    })
    expect(
      offenders,
      `these sell Concussion Rehab Mastery — they must quote CRM_REFERENCE_COUNT:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('the front-desk knowledge-check count is derived from the questions that exist', async () => {
    const { ADMIN_COURSE_MODULES, ADMIN_COURSE_QUESTION_COUNT } =
      await import('../data/hub-program-content')
    expect(ADMIN_COURSE_QUESTION_COUNT).toBe(
      ADMIN_COURSE_MODULES.filter((m) => m.knowledgeCheck).length,
    )
    // The doc and its printed certificate claimed a 10-question check with an
    // 8/10 pass mark, and neither the bank nor any grader existed.
    const doc = readFileSync(join(REPO, 'components/toolkit/AdminCourseDoc.tsx'), 'utf8')
    expect(doc).not.toMatch(/10-question|pass mark 8\/10/i)
    expect(doc).toMatch(/ADMIN_COURSE_QUESTION_COUNT/)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// FLAG DISCIPLINE: a lapsed accreditation is the same defect as a never-held one.
// ───────────────────────────────────────────────────────────────────────────
describe('the ESSA claim dies with the accreditation', () => {
  it('the generated certificate gates its ESSA lines on the flag, and derives them', () => {
    const cert = readFileSync(join(REPO, 'lib/certificate.ts'), 'utf8')
    expect(
      cert,
      'the PDF must stop asserting ESSA accreditation once VALID_UNTIL passes',
    ).toMatch(/CONFIG\.FEATURES\.ESSA_ACCREDITED/)
    expect(cert).toMatch(/CONFIG\.ESSA_ACCREDITATION\.NUMBER/)
    expect(cert).toMatch(/CONFIG\.ESSA_ACCREDITATION\.statement\(/)
    // The number and the mandated sentence were literals on a document lodged
    // with the very body that issued them.
    expect(cert).not.toMatch(/No\. PDNF26077 \(Online\)/)
    expect(cert).not.toMatch(/criteria for 8 Continuing Professional Development/)
  })

  it('the accreditation is still in force — otherwise every ESSA claim is stale', () => {
    // Not a style rule: CONFIG flips ESSA_ACCREDITED off past VALID_UNTIL, and
    // ~40 surfaces fall back to "pending" copy on that day. This fails first.
    const expiry = new Date(`${CONFIG.ESSA_ACCREDITATION.VALID_UNTIL}T23:59:59+10:00`)
    expect(
      Date.now() < expiry.getTime(),
      `ESSA accreditation ${CONFIG.ESSA_ACCREDITATION.NUMBER} expires ${CONFIG.ESSA_ACCREDITATION.VALID_UNTIL} — re-accredit or the portal-wide claim goes false`,
    ).toBe(true)
    expect(CONFIG.FEATURES.ESSA_ACCREDITED).toBe(true)
  })
})
