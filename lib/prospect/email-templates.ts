import type { EmailTemplate, Discipline, ProspectClinic } from './types'
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
const OG_VERSION = (process.env.VERCEL_GIT_COMMIT_SHA || 'v1').slice(0, 8)

/** Clickable dashboard-screenshot hero — the single link in T1/T2. */
function screenshotHero(portalUrl: string, ogUrl: string, clinicName: string): string {
  return `<p style="margin:20px 0;"><a href="${portalUrl}" style="text-decoration:none;"><img src="${ogUrl}" alt="${clinicName} concussion training dashboard" width="600" style="width:100%;max-width:600px;height:auto;border-radius:12px;border:1px solid #e2e8f0;display:block;" /></a></p>`
}

/** Deterministic per-prospect variant index — stable across retries. */
function variantIndex(slug: string, length: number): number {
  return slug.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % length
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
  } = {},
): { subject: string; html: string; text: string } {
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

  // ── The portal: the single link, fronted by its screenshot ────────────
  const portalUrl = `${PORTAL_BASE}/p/${clinic.slug}?k=${clinic.accessKey ?? ''}`
  const ogImageUrl = `${PORTAL_BASE}/api/prospect/og-image?slug=${encodeURIComponent(clinic.slug)}&v=${OG_VERSION}`
  const hero = screenshotHero(portalUrl, ogImageUrl, safeShortName)
  const portalLink = `<a href="${portalUrl}">open ${safeShortName}'s dashboard</a>`

  // What's built for them + where the value lands — tier-matched. This is the
  // "what we do / what's in it for you" the email leads with before the
  // screenshot. The regulatory opening is the WHY-NOW.
  let builtLine: string // what I made them
  let valueLine: string // why it matters for THEM
  if (isOnSiteTarget) {
    builtLine = `I built ${safeShortName} a working concussion-training dashboard — your team's learning suite, the SCAT6/SCOAT6 tools, baseline testing, and a clinic-branded clinical toolkit, all set up under your name.`
    valueLine = `${REGULATORY_LINE} Most clinics${cityPhrase} aren't set up for it. I train your whole team in the protocol in one on-site day — that's how ${safeShortName} becomes the clinic that is.`
  } else if (isIndividualTarget) {
    builtLine = `I built you a working concussion-training dashboard — the full learning suite, SCAT6/SCOAT6 tools, and a clinical toolkit, set up ready to use.`
    valueLine = `${REGULATORY_LINE} ${soloPlural.replace(/^./, (c) => c.toUpperCase())} working solo get the clearance questions first. The whole protocol — SCAT6, VOMS, return-to-play — is self-paced online, 8 CPD hours.`
  } else {
    builtLine = `I built ${safeShortName} a working concussion-training dashboard — your team's learning suite, the SCAT6/SCOAT6 tools, baseline testing, and a clinic-branded clinical toolkit, all set up under your name.`
    valueLine = `${REGULATORY_LINE} Most clinics${cityPhrase} aren't set up for it. Your team trains online and you get the branded clinical toolkit to run the protocol day to day — that's how ${safeShortName} owns concussion care locally.`
  }

  // T1 — lead → screenshot hero → "what's inside, take a look" → portal link.
  const t1Body = [
    `<p>${builtLine}</p>`,
    hero,
    `<p>${valueLine}</p>`,
    `<p>Module 1's unlocked to try, and the pricing and a 15-minute call are in there too. Take a look — ${portalLink}.</p>`,
  ].join('\n')

  // T2 — short nudge back to the dashboard with one fresh angle + hero again.
  let t2Angle: string
  if (isOnSiteTarget) {
    t2Angle = `The on-site day is the whole team trained together in one day — 14 CPD hours each, Osteopathy Australia endorsed — and the dashboard has the full cohort pricing for ${safeShortName}.`
  } else if (isIndividualTarget) {
    t2Angle = `It's the complete protocol — SCAT6, VOMS, return-to-play — self-paced online, 8 CPD hours, Osteopathy Australia endorsed. Module 1's unlocked to try free.`
  } else {
    t2Angle = `Your team trains online at their own pace — 14 CPD hours each, Osteopathy Australia endorsed — plus the clinic-branded toolkit. The dashboard has your Hub Pack pricing.`
  }
  const t2Body = [
    `<p>Following up on the concussion dashboard I set up for ${safeShortName} last week.</p>`,
    `<p>${t2Angle}</p>`,
    hero,
    `<p>Worth a look — ${portalLink}. Or just reply with a question and I'll answer it.</p>`,
  ].join('\n')

  // T3 — breakup with price transparency in text + one last portal link.
  let priceLine: string
  if (isOnSiteTarget) {
    const fromTotal = Math.min(...cohortPricing.cohortTiers.map((t) => t.total))
    priceLine = `the on-site team training day starts at A$${fromTotal.toLocaleString('en-AU')}`
  } else if (isIndividualTarget) {
    priceLine = `the online course is A$${CONFIG.COURSE.PRICE_ONLINE.toLocaleString('en-AU')}`
  } else {
    priceLine = `the Hub Pack — your team trained online plus the clinic-branded toolkit — is A$${CONFIG.COURSE.PRICE_CLINIC_HUB_PACK.toLocaleString('en-AU')}`
  }
  const t3Body = [
    `<p>Last one from me. In case price was the open question: ${priceLine} — full breakdown and a 15-minute call are on ${safeShortName}'s dashboard: ${portalLink}.</p>`,
    `<p>If the timing's wrong, no problem — reply 'later' and I'll check back next season, or STOP and I won't email again.</p>`,
  ].join('\n')

  // ── Subject lines — short, specific, lowercase-leaning, non-salesy ─────
  // Rotated deterministically by slug hash; variants referencing city or
  // shortName are filtered out when that field is unknown.
  type SubjectVariant = { subject: string; refs: 'city' | 'shortName' | 'none' }
  let allVariants: SubjectVariant[]
  if (template.slug === 'initial') {
    allVariants = [
      { subject: `concussion training for ${clinic.shortName}`, refs: 'shortName' },
      { subject: `concussion protocol for ${clinic.city} clinics`, refs: 'city' },
      { subject: `the 21-day stand-down — are you across it?`, refs: 'none' },
      { subject: `concussion CPD for ${clinic.shortName}`, refs: 'shortName' },
    ]
  } else if (template.slug === 'followup') {
    allVariants = [
      { subject: `quick follow-up — ${clinic.shortName}`, refs: 'shortName' },
      { subject: `following up on concussion training`, refs: 'none' },
      { subject: `one-pager on the concussion training`, refs: 'none' },
    ]
  } else {
    allVariants = [
      { subject: `closing the loop — ${clinic.shortName}`, refs: 'shortName' },
      { subject: `closing the loop on concussion training`, refs: 'none' },
    ]
  }
  const subjectVariants = allVariants
    .filter((v) => !(v.refs === 'city' && hasUnknownCity))
    .filter((v) => !(v.refs === 'shortName' && hasUnknownShortName))
    // Keep subjects under 50 chars (mobile preview cutoff) — long clinic
    // names knock out the name-bearing variants rather than truncating.
    .filter((v) => v.subject.length <= 50)
    .map((v) => v.subject)
  if (subjectVariants.length === 0) subjectVariants.push('the 21-day stand-down — are you across it?')
  const subjectVariant = subjectVariants[variantIndex(clinic.slug, subjectVariants.length)]

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
  return { subject, html, text }
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
