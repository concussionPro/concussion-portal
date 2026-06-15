import type { EmailTemplate, EmailTemplateSlug, Discipline, ProspectClinic } from './types'
import { dominantDiscipline, clinicalCount, hubPackPriceFor, computePricing } from './pricing'
import { CONFIG } from '@/lib/config'

/**
 * Cold-outreach templates — rewritten 2026-06-10.
 *
 * WHY THE REWRITE: the designed-HTML emails (bento stat tables, hero image,
 * 3-4 tracked links, Cal.com CTA) produced 0 genuine replies from ~90
 * delivered. Every "open" and "click" was a Microsoft Defender / Mimecast
 * scanner. Microsoft Defender Safe Links scans ALL URLs pre-delivery and
 * sandbox-detonates any URL without established reputation — i.e. every
 * unique tracking/portal link — and it's on by default for Microsoft 365
 * Business Premium (the standard clinic SKU).
 *
 * NEW RULES (verified research, 2026-06-10):
 *  - First touch UNDER 80 WORDS, conversational, reads like a personal note.
 *  - Interest-based soft CTA ("worth a couple of minutes on the phone?")
 *    books ~2x more meetings than calendar-link asks at first touch
 *    (Gong Labs, 304,174 emails). The booking link comes AFTER a reply.
 *  - ZERO body links, zero images, zero tables. Replies are the only metric.
 *  - The personalized prospect portal/dashboard still exists — Zac sends
 *    that link MANUALLY after a prospect replies. It is no longer embedded
 *    in cold sends (Safe Links detonates it; humans never saw it anyway).
 *  - Unsubscribe is handled entirely by the List-Unsubscribe + one-click
 *    headers set in process-scheduled.ts / prospect-send — the body carries
 *    only the plain "reply STOP" line.
 *
 * Approved facts ONLY (never fabricate claims/deadlines/discounts):
 * Concussion Clinical Mastery; Osteopathy Australia endorsed; AHPRA-aligned;
 * 14 CPD hours per clinician (8 online); SCAT6/SCOAT6, VOMS, oculomotor,
 * BESS, cervical, RTP protocols; on-site full-day team training; Hub Pack
 * (team online + clinic-branded clinical doc pack); online course A$497;
 * 2024 AIS/SMA guidelines made the 21-day RTP stand-down mandatory in
 * community sport with physios/GPs named as clearance providers; Zac is
 * based in Byron Bay and travels to clinics.
 */

/**
 * The openingVariants field is retained for EmailTemplate type compat only.
 * Per-tier copy is now built inside mergeTemplate (the size tier decides the
 * pitch, not the discipline-keyed HTML blocks of the old design).
 */
const NO_OPENING_VARIANTS: Record<Discipline, string> = {
  osteopaths: '',
  physiotherapists: '',
  generalPractitioners: '',
  sportsMedicineDoctors: '',
  exercisePhys: '',
  myotherapists: '',
  remedialMassage: '',
  practiceManager: '',
  admin: '',
}

// Plain-text signature + compliance line. No logo, no links, no styling.
const SIGNOFF_HTML = `<p>Zac Lewis, Osteopath<br>Concussion Education Australia — Byron Bay</p>`
const STOP_LINE_HTML = `<p>If this isn't relevant, reply STOP and I won't email again.</p>`

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    slug: 'initial',
    // T1 — under 80 words. One personalized opening line (clinic + discipline
    // + size-tier angle + city when known), one or two sentences of relevance
    // (21-day stand-down / clearance providers / what Zac does), then the
    // interest-based soft CTA. Subjects rotate deterministically by slug hash.
    subjectTemplate: '{subject_variant}',
    bodyTemplate: `<p>Hi {contact_first_name},</p>
{body_paragraphs}
${SIGNOFF_HTML}
${STOP_LINE_HTML}`,
    openingVariants: NO_OPENING_VARIANTS,
    signedOffAt: null,
    signedOffBy: null,
  },
  {
    slug: 'followup',
    // T2 (+7 business days) — under ~90 words. References T1 briefly, adds
    // ONE new size-matched angle, offers to SEND the one-page outline
    // (reply-bait — we never link it), same soft call CTA. Zero links.
    subjectTemplate: '{subject_variant}',
    bodyTemplate: `<p>Hi {contact_first_name},</p>
{body_paragraphs}
${SIGNOFF_HTML}
${STOP_LINE_HTML}`,
    openingVariants: NO_OPENING_VARIANTS,
    signedOffAt: null,
    signedOffBy: null,
  },
  {
    slug: 'final',
    // T3 (+8 business days) — the breakup, under 70 words. Price transparency
    // in plain text (numbers derived from config/pricing constants), then the
    // "reply 'later' or STOP" close. The STOP offer lives inside the breakup
    // line itself, so no separate compliance footer here.
    subjectTemplate: '{subject_variant}',
    bodyTemplate: `<p>Hi {contact_first_name},</p>
{body_paragraphs}
${SIGNOFF_HTML}`,
    openingVariants: NO_OPENING_VARIANTS,
    signedOffAt: null,
    signedOffBy: null,
  },
]

/** Discipline → plural clinician noun for the solo-clinician opening line. */
const SOLO_PLURAL: Record<Discipline, string> = {
  osteopaths: 'osteos',
  physiotherapists: 'physios',
  generalPractitioners: 'GPs',
  sportsMedicineDoctors: 'sports medicine doctors',
  exercisePhys: 'exercise physiologists',
  myotherapists: 'myotherapists',
  remedialMassage: 'remedial massage therapists',
  practiceManager: 'clinicians',
  admin: 'clinicians',
}

// Verified regulatory hook — the single relevance sentence shared by all tiers.
const REGULATORY_LINE =
  'Community sport now carries a mandatory 21-day stand-down (2024 AIS/SMA guidelines), and physios and GPs are named clearance providers.'

// The pitch IS the custom portal (Zac 2026-06-10). Every prospect has a
// pre-built, clinic-branded dashboard at /p/<slug> — their learning suite
// (Module 1 unlocked to try), SCAT tools, clinical toolkit, tier pricing AND
// the inline Cal.com booking. The email's only job is to get them there. So:
// ONE link — their portal — fronted by a real screenshot of that dashboard
// (the screenshot sells the value even if they never click). The booking CTA
// lives ON the portal, not in the email.
const PORTAL_BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
// Bump the screenshot cache once per deploy (Gmail/Microlink cache by URL).
// Text-first cold sends (Zac 2026-06-11): NO embedded screenshot. Resend's
// 98.57% deliverability proves the domain delivers, but that's server delivery
// not Primary-inbox placement — and the prior image-heavy campaign delivered
// fine yet got 0 human replies while complaint rate sits at 0.29% (near the
// 0.3% line). So the email is a concise personal note with ONE naked UTM-tagged
// portal link; the dashboard screenshot lives ON the portal, seen on landing.

/** Deterministic per-prospect variant index — stable across retries. */
function variantIndex(slug: string, length: number): number {
  return slug.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % length
}

/**
 * A subject-line variant. `key` is the STABLE, clinic-agnostic identifier for
 * the TEMPLATE (not the rendered text) — it is what the self-optimizing engine
 * records per send and scores on. `refs` drives the unknown-data guards.
 */
type SubjectVariant = { subject: string; refs: 'city' | 'shortName' | 'none'; key: string }

/**
 * Build the ELIGIBLE subject variants for a clinic + touch, applying the same
 * unknown-city / unknown-name guards and ≤50-char mobile-preview filter the
 * engine has always used. Pure — no DB, no randomness. Returned in a stable
 * order so `variantIndex(slug, …)` reproduces the legacy deterministic pick.
 *
 * Shared by mergeTemplate (rendering) and eligibleSubjectKeys (so
 * process-scheduled can ask "which variant keys could this send use?" without
 * duplicating the guard logic).
 */
function eligibleSubjectVariants(
  templateSlug: EmailTemplateSlug,
  clinic: ProspectClinic,
): SubjectVariant[] {
  const hasUnknownCity = !clinic.city || /unknown/i.test(clinic.city)
  const hasUnknownShortName = !clinic.shortName || /unknown/i.test(clinic.shortName)

  let allVariants: SubjectVariant[]
  if (templateSlug === 'initial') {
    allVariants = [
      { subject: `Concussion training for ${clinic.shortName}`, refs: 'shortName', key: 'name' },
      { subject: `Concussion protocol for ${clinic.city} clinics`, refs: 'city', key: 'city' },
      { subject: `The 21-day stand-down — are you across it?`, refs: 'none', key: 'capability_q' },
      { subject: `Concussion CPD for ${clinic.shortName}`, refs: 'shortName', key: 'name_ready' },
    ]
  } else if (templateSlug === 'followup') {
    allVariants = [
      { subject: `Quick follow-up — ${clinic.shortName}`, refs: 'shortName', key: 'name_followup' },
      { subject: `Following up on concussion training`, refs: 'none', key: 'generic_followup' },
      { subject: `One-pager on the concussion training`, refs: 'none', key: 'onepager' },
    ]
  } else {
    allVariants = [
      { subject: `Closing the loop — ${clinic.shortName}`, refs: 'shortName', key: 'name_loop' },
      { subject: `Closing the loop on concussion training`, refs: 'none', key: 'generic_loop' },
    ]
  }

  const eligible = allVariants
    .filter((v) => !(v.refs === 'city' && hasUnknownCity))
    .filter((v) => !(v.refs === 'shortName' && hasUnknownShortName))
    // Keep subjects under 50 chars (mobile preview cutoff) — long clinic
    // names knock out the name-bearing variants rather than truncating.
    .filter((v) => v.subject.length <= 50)
  // Degenerate guard — only reachable if every variant were filtered out
  // (in practice each touch keeps a ≤50-char 'none' variant, so this never
  // fires). Falls back to the universal regulatory hook.
  if (eligible.length === 0) {
    eligible.push({ subject: 'The 21-day stand-down — are you across it?', refs: 'none', key: 'fallback' })
  }
  return eligible
}

/**
 * The stable variant keys a send for this clinic + touch could legitimately
 * use (post-guards / post-length-filter), in eligible order. process-scheduled
 * passes these to the optimizer as the candidate arms.
 */
export function eligibleSubjectKeys(
  templateSlug: EmailTemplateSlug,
  clinic: ProspectClinic,
): string[] {
  return eligibleSubjectVariants(templateSlug, clinic).map((v) => v.key)
}

/**
 * Merge a clinic's data into a template. Returns { subject, html, text }.
 *
 * Interface kept compatible with process-scheduled.ts and prospect-send:
 *  - `priorEngagement` is still ACCEPTED but IGNORED. Open/click signals
 *    proved to be scanner noise (Defender/Mimecast detonations), and the
 *    "noticed you clicked" copy was false personalization. The lookup in
 *    process-scheduled.ts can stay; it no longer changes copy.
 *  - `regionalVariant` swaps the on-site sentence for the explicit
 *    "I'm based in Byron Bay and come to you" framing.
 *  - `networkVariant` swaps the T1 opening line for the multi-location angle.
 *  - `baseUrl` / `unsubscribeToken` are unused (zero body links; unsubscribe
 *    is header-only via List-Unsubscribe in the send path) but kept so
 *    every caller keeps working unchanged.
 */
export function mergeTemplate(
  template: EmailTemplate,
  clinic: ProspectClinic,
  _baseUrl: string,
  _unsubscribeToken: string,
  options: {
    regionalVariant?: boolean
    networkVariant?: { networkSize: number; nearestMetro?: string }
    nearestMetro?: string
    /** Accepted for interface compat — intentionally ignored (see above). */
    priorEngagement?: 'none' | 'opened' | 'clicked'
    /**
     * Intent-aware follow-up (Zac 2026-06-14). Unlike `priorEngagement` (email
     * open/click — scanner noise, ignored), this is derived from what the human
     * actually viewed ON the portal (prospect_portal_views section beacons,
     * which scanners never fire because they don't run the page JS). It tailors
     * ONE sentence of the T2 (and T3) follow-up to the prospect's strongest
     * prior signal — value-framed, never surveillance-y ("I saw you viewed…"):
     *   - 'pricing' → lead with an offer to talk pricing/options for the clinic
     *   - 'trial'   → reference the Module 1 trial → full-program value
     *   - 'toolkit' → nudge the practical toolkit/learning value
     *   - null/omitted → the generic follow-up copy (unchanged)
     * mergeTemplate stays PURE — process-scheduled derives the hint from the DB
     * and passes it in. T1 ('initial') has no prior engagement, so the hint is
     * a no-op there.
     */
    engagementHint?: 'pricing' | 'trial' | 'toolkit' | null
    /**
     * Self-optimizing engine hook. When set, render the subject variant with
     * this stable `key` IF it survives the unknown-data guards + ≤50-char
     * filter for this clinic; otherwise fall back to the deterministic
     * slug-hash pick (so an ineligible forced key degrades gracefully). When
     * omitted, behaviour is the legacy deterministic slug-hash rotation —
     * existing callers and retry stability are unchanged. mergeTemplate stays
     * pure: it does NOT query the DB; process-scheduled supplies the key.
     */
    forceSubjectKey?: string
  } = {},
): { subject: string; html: string; text: string; subjectKey: string } {
  // ── Tier selection — the size tier decides the pitch ──────────────────
  // on-site (≥6 clinical): whole team trained in one day, on-site.
  // hub (2-5 clinical): team trained online + clinic-branded doc pack.
  // individual (≤1 clinical): the clinician's own protocol/CPD, self-paced.
  const hubPricing = hubPackPriceFor(clinic.team)
  const cohortPricing = computePricing(clinic.team, clinic.travelBand)
  const isOnSiteTarget = hubPricing.recommendedOffer === 'on-site-cohort'
  const isIndividualTarget = !isOnSiteTarget && clinicalCount(clinic.team) <= 1

  // ── Unknown-data guards — never ship "Unknown" in copy ────────────────
  const hasUnknownCity = !clinic.city || /unknown/i.test(clinic.city)
  const hasUnknownShortName = !clinic.shortName || /unknown/i.test(clinic.shortName)
  const hasUnknownRegion = !clinic.region || /unknown/i.test(clinic.region)
  const safeShortName = hasUnknownShortName ? 'your clinic' : clinic.shortName
  const safeRegion = hasUnknownRegion ? 'your region' : clinic.region
  // City reference is appended when known, skipped gracefully when not.
  const cityPhrase = hasUnknownCity ? '' : ` in ${clinic.city}`

  const discipline = dominantDiscipline(clinic.team)
  const soloPlural = SOLO_PLURAL[discipline] ?? 'clinicians'

  // ── The per-clinic link that passes spam filters (Zac 2026-06-11) ────────
  // Personalised per clinic (their name in the path) AND spam-safe. What gets
  // sandbox-detonated by Defender/Gmail is the random access KEY + UTM tracking
  // PARAMS + tracking redirect — NOT the mere fact a URL is unique. So: a CLEAN
  // PATH with the clinic's human-readable slug, NO query string, NO random key,
  // NO tracking redirect (tracking off). Reads like a real page for their
  // clinic, not a tracking link. Shown as a naked URL (anchor text = destination
  // — a mismatch is itself a phishing signal). The portal at this path leads
  // with the free kit the email promises (message-match), course as next step.
  const FREE_URL = `${PORTAL_BASE}/p/${clinic.slug}`
  const FREE_LINK = `<a href="${FREE_URL}">${FREE_URL.replace(/^https?:\/\//, '')}</a>`

  // T1 — tailored per tier, accurate to the REAL portal products (Zac
  // 2026-06-11): free SCAT6/SCOAT6 forms + baseline tool, the Module 1 TRIAL
  // (a preview — NOT a free module), and the clinical toolkit / admin pack /
  // reference docs; then ONE tier-matched line — on-site for large (≥6),
  // Hub Pack for medium (2-5), self-paced course for solo (≤1) — + clean link.
  const tierLine = isOnSiteTarget
    ? `For a team ${safeShortName}'s size the step up is an on-site practical day — your clinicians trained on your own cases, 14 CPD hours each, OA endorsed.`
    : isIndividualTarget
      ? `The full course is self-paced online — 14 CPD hours, OA endorsed.`
      : `For a team your size the Hub Pack trains everyone online plus your own clinic-branded toolkit — 14 CPD hours each, OA endorsed.`
  const t1Body = [
    `<p>${REGULATORY_LINE} Most ${soloPlural}${cityPhrase} aren't set up for it yet.</p>`,
    `<p>I've put a concussion kit together for ${safeShortName}: the fillable SCAT6/SCOAT6 forms, a baseline tool and the Module 1 trial — yours to use. You can also preview the course — the clinical toolkit (GP/NDIS/school letters, billing), admin pack and reference library — which unlock when you enrol.</p>`,
    `<p>${tierLine} It's all here: ${FREE_LINK}</p>`,
  ].join('\n')

  // T2 — re-offer: free tools + the toolkit/docs value + the tier line, clean
  // link. When an engagementHint is supplied, the SECOND paragraph is swapped
  // for a value-framed sentence matched to what they viewed on the portal
  // (pricing / trial / toolkit). Never says "I saw you viewed…" — it's framed
  // as a helpful option, not surveillance. Hinted variants drop the generic
  // tier-line (the tailored sentence already carries the upsell) to stay tight.
  // null/omitted → the generic re-offer below, unchanged.
  const hint = options.engagementHint ?? null
  let t2SecondPara: string
  if (hint === 'pricing') {
    t2SecondPara =
      `<p>If the pricing was the question, I'm happy to walk through what it'd look like for ${safeShortName} — just reply. The SCAT6/SCOAT6 forms and baseline tool are yours to use either way. ${tierLine}</p>`
  } else if (hint === 'trial') {
    t2SecondPara =
      `<p>Hope Module 1 was a useful start — the full program builds from there into the hands-on protocol, 14 CPD hours each, OA endorsed. The SCAT6/SCOAT6 forms and baseline tool are yours to use either way.</p>`
  } else if (hint === 'toolkit') {
    t2SecondPara =
      `<p>The clinical toolkit (GP/NDIS/school letters, billing) unlocks with the full course — along with the protocol training and 14 CPD hours. The SCAT6/SCOAT6 forms and baseline tool are yours either way.</p>`
  } else {
    t2SecondPara =
      `<p>The SCAT6/SCOAT6 forms and baseline tool are yours to use either way. The clinical toolkit (GP/NDIS/school letters, billing), admin pack and reference library are previewable on the page — they unlock with the course. ${tierLine}</p>`
  }
  const t2Body = [
    `<p>Circling back — the concussion kit for ${safeShortName} is still here: ${FREE_LINK}</p>`,
    t2SecondPara,
  ].join('\n')

  // T3 — breakup. Free kit stays available; price transparency for the course.
  let priceLine: string
  if (isOnSiteTarget) {
    const fromTotal = Math.min(...cohortPricing.cohortTiers.map((t) => t.total))
    priceLine = `the on-site team training day starts at A$${fromTotal.toLocaleString('en-AU')}`
  } else if (isIndividualTarget) {
    priceLine = `the online course is A$${CONFIG.COURSE.PRICE_ONLINE.toLocaleString('en-AU')}`
  } else {
    priceLine = `the Hub Pack — your team trained online plus the clinic-branded toolkit — is A$${CONFIG.COURSE.PRICE_CLINIC_HUB_PACK.toLocaleString('en-AU')}`
  }
  // T3 second paragraph — when they looked at pricing, lead with the offer to
  // talk the numbers through (value-framed, not "I saw you viewed pricing").
  // Every other hint (and null) keeps the standard breakup price line. Both
  // keep the identical "reply 'later' / STOP" close.
  const t3SecondPara =
    hint === 'pricing'
      ? `<p>And if cost was the sticking point — ${priceLine}, and I'm happy to talk through the options for ${safeShortName} if it helps; just reply. Otherwise no problem — reply 'later' and I'll check back next season, or STOP and I won't email again.</p>`
      : `<p>And if you ever want the full course, ${priceLine}. Otherwise no problem — reply 'later' and I'll check back next season, or STOP and I won't email again.</p>`
  const t3Body = [
    `<p>Last one from me. The SCAT6/SCOAT6 forms, baseline tool and CPD module are at ${FREE_LINK} whenever you want them.</p>`,
    t3SecondPara,
  ].join('\n')

  // ── Subject lines — short, specific, sentence-case, non-salesy ─────────
  // Built by eligibleSubjectVariants() (guards + ≤50-char filter applied).
  // Selection: the deterministic slug-hash rotation by default; when the
  // optimizer supplies a forceSubjectKey that's eligible for THIS clinic, that
  // variant wins instead. An ineligible/unknown forced key degrades to the
  // slug-hash pick. The CHOSEN key is returned so the send loop can log it.
  const eligibleVariants = eligibleSubjectVariants(template.slug, clinic)
  let chosenVariant = eligibleVariants[variantIndex(clinic.slug, eligibleVariants.length)]
  if (options.forceSubjectKey) {
    const forced = eligibleVariants.find((v) => v.key === options.forceSubjectKey)
    if (forced) chosenVariant = forced
  }
  const subjectVariant = chosenVariant.subject
  const subjectKey = chosenVariant.key

  const bodyHtml =
    template.slug === 'initial' ? t1Body : template.slug === 'followup' ? t2Body : t3Body

  const variables: Record<string, string | undefined> = {
    contact_first_name: safeFirstName(clinic.contactFirstName),
    body_paragraphs: bodyHtml,
    subject_variant: subjectVariant,
  }

  const subject = mergeVariables(template.subjectTemplate, variables)
  const html = mergeVariables(template.bodyTemplate, variables)
  const text = htmlToPlainText(html)
  return { subject, html, text, subjectKey }
}

/**
 * If contact_first_name looks like a job title (Director, Principal, Manager,
 * Owner etc) — which happens when Apollo stuffs a role into the wrong field —
 * fall back to a neutral greeting. Anything resembling "Hi Director,"
 * "Hi Manager," "Hi Unknown," "Hi Owner," etc must NEVER ship.
 */
const TITLE_FIRST_NAME_PATTERN = /^(director|manager|principal|owner|founder|partner|ceo|md|head|chief|admin|reception|practice|clinic|info|unknown|n\/a|na|none|test)$/i

function safeFirstName(raw: string | null | undefined): string {
  const v = (raw ?? '').trim()
  if (!v) return 'there'
  // Multi-word "Job Title" capture (e.g. "Practice Manager")
  if (/^(?:director|manager|principal|owner|founder|partner|head|chief|practice|clinic|admin|reception)(?:\s+\w+)*$/i.test(v)) return 'there'
  if (TITLE_FIRST_NAME_PATTERN.test(v)) return 'there'
  // Names with bracketed roles (e.g. "John (Director)") — strip the role
  const cleaned = v.replace(/\s*\([^)]*\)\s*/g, '').trim()
  if (!cleaned) return 'there'
  if (TITLE_FIRST_NAME_PATTERN.test(cleaned)) return 'there'
  return cleaned
}

/**
 * Token resolution. Removes any unresolved {placeholders} entirely so the
 * email never ships with raw merge artefacts visible.
 */
function mergeVariables(str: string, vars: Record<string, string | undefined>): string {
  return str
    .replace(/\{([a-z_]+)\}/g, (_m, key) => {
      const value = vars[key]
      if (value && value.trim().length > 0) return value
      return ''
    })
    .replace(/[ \t]+/g, ' ')
    .trim()
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function previewInitialEmail(
  clinic: ProspectClinic,
  baseUrl: string = 'https://portal.concussion-education-australia.com',
): { subject: string; html: string; text: string } {
  const tpl = EMAIL_TEMPLATES.find((t) => t.slug === 'initial')!
  return mergeTemplate(tpl, clinic, baseUrl, 'preview-token')
}

export { dominantDiscipline }
