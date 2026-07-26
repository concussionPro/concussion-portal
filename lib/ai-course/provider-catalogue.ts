import { CONFIG } from '@/lib/config'
/**
 * Provider abstraction for the CPD marketplace surface.
 *
 * This is the foundation for the Heidi pitch's "marketplace" framing:
 * the portal can host courses from multiple trusted providers, with
 * Heidi (or any other distributor) as the curator. Today CEA is the
 * only listed provider; tomorrow a partner can be added by appending
 * to this catalogue and providing their course metadata.
 *
 * The actual course content for non-CEA providers is intentionally
 * placeholder during preview — the marketplace SHELL exists, the
 * SUPPLY is the platform partner's job to curate. The pitch is exactly
 * this distinction.
 */

export interface ProviderProfile {
  id: string
  name: string
  shortName: string
  description: string
  url: string
  verified: boolean
  // Visual treatment
  brandColor: string
  /** Number of courses this provider has on the platform */
  courseCount: number
  /** Whether this provider is the platform's own first-party content */
  firstParty: boolean
}

export interface CourseCatalogueEntry {
  id: string
  title: string
  providerId: string
  cpdHours: number
  /** AHPRA / RACGP / ACRRM recognition status */
  cpdRecognition: string[]
  description: string
  /** Where the course content lives */
  route: string
  priceAUD: number | null
  /**
   * Whether /api/courses/checkout may sell this entry directly as a
   * short-course Stripe session. CCM is listed in the catalogue for display
   * but MUST go through /pricing (full-course/online-only flow with workshop
   * location, access levels and fulfilment) — selling it here would charge
   * the buyer and fulfil nothing.
   */
  purchasableViaCheckout: boolean
  /**
   * 'preview' = built but pre-launch: gated + noindex, surfaced on /courses
   * ONLY for admin/demo viewers (and the ESSA reviewer via the /demo/essa
   * cookie). Invisible to the public until flipped to 'coming-soon'/'live'.
   */
  status: 'live' | 'coming-soon' | 'pilot' | 'preview'
  tags: string[]
  /** Early-access discount percentage applied at launch for waitlist signups */
  earlyBirdDiscountPct?: number
  /** Computed early-bird price (priceAUD * (1 - earlyBirdDiscountPct/100)), rounded */
  earlyBirdPriceAUD?: number | null
  /** Soft launch target — display only, not enforced */
  launchTarget?: string
  /**
   * Hard launch timestamp — when status flips from 'coming-soon' to effectively 'live'.
   * ISO 8601 with timezone. If set, getEffectiveStatus() uses this date to flip
   * automatically — NO cron job needed. Single source of truth.
   */
  launchAt?: string
  /**
   * When early-bird (launch week) discount ends. After this date,
   * getEffectivePrice() returns priceAUD, not earlyBirdPriceAUD.
   * ISO 8601 with timezone. NO cron job needed for price reversion.
   */
  earlyBirdEndsAt?: string
}

/**
 * Returns the effective status of a course at the current moment.
 * Replaces the manual "flip status from coming-soon to live on launch day" cron.
 *
 * Logic:
 *   - If course.status is already 'live' OR 'pilot': return as-is
 *   - If course.status is 'coming-soon' AND launchAt is set AND now >= launchAt:
 *     return 'live' (date-driven flip)
 *   - Otherwise: return course.status
 */
export function getEffectiveStatus(course: CourseCatalogueEntry): CourseCatalogueEntry['status'] {
  if (course.status === 'live' || course.status === 'pilot' || course.status === 'preview') return course.status
  if (course.launchAt && new Date() >= new Date(course.launchAt)) return 'live'
  return course.status
}

/**
 * Returns the effective price of a course at the current moment.
 * Replaces the manual "remove earlyBirdDiscountPct/earlyBirdPriceAUD after launch
 * week" step. Single source of truth.
 *
 * Logic:
 *   - If earlyBirdEndsAt is set AND now > earlyBirdEndsAt: return priceAUD (full price)
 *   - Else if earlyBirdPriceAUD is set: return earlyBirdPriceAUD
 *   - Else: return priceAUD
 *
 * Returns { price, isEarlyBird, isFullPrice } so consumers can render correctly.
 */
export function getEffectivePrice(course: CourseCatalogueEntry): {
  price: number | null
  isEarlyBird: boolean
  isFullPrice: boolean
} {
  const fullPrice = course.priceAUD
  const earlyPrice = course.earlyBirdPriceAUD ?? null

  if (course.earlyBirdEndsAt && new Date() > new Date(course.earlyBirdEndsAt)) {
    return { price: fullPrice, isEarlyBird: false, isFullPrice: true }
  }
  if (earlyPrice !== null) {
    return { price: earlyPrice, isEarlyBird: true, isFullPrice: false }
  }
  return { price: fullPrice, isEarlyBird: false, isFullPrice: true }
}

export const PROVIDERS: ProviderProfile[] = [
  {
    id: 'cea',
    name: 'Concussion Education Australia',
    shortName: 'CEA',
    description: 'Osteopathy Australia–endorsed CPD for concussion management and AI use in clinical practice.',
    url: 'https://concussion-education-australia.com',
    verified: true,
    brandColor: 'teal',
    courseCount: 3,
    firstParty: true,
  },
  // Placeholder slots for the marketplace expansion. Renders as "vetting
  // in progress" or "invited" cards on the providers page — used in the
  // pitch deck to demonstrate the marketplace shell is ready for supply.
  {
    id: 'placeholder-medcast',
    name: 'Medcast (placeholder)',
    shortName: 'Medcast',
    description: 'Example partner slot — large existing CPD provider that could be onboarded once Heidi or another distributor signs.',
    url: 'https://medcast.com.au',
    verified: false,
    brandColor: 'slate',
    courseCount: 0,
    firstParty: false,
  },
  {
    id: 'placeholder-racgp',
    name: 'RACGP Webinars (placeholder)',
    shortName: 'RACGP',
    description: 'Example partner slot — RACGP-accredited webinars could be ingested via API once partnership is in place.',
    url: 'https://racgp.org.au',
    verified: false,
    brandColor: 'slate',
    courseCount: 0,
    firstParty: false,
  },
]

export const COURSES: CourseCatalogueEntry[] = [
  {
    id: 'ai-in-clinical-practice',
    title: 'AI in Clinical Practice',
    providerId: 'cea',
    // Honest learning-hours figure (module reading times sum to ~2.3 hr → 2 CPD
    // points for ESSA, which allocates 1 point/hour). Was 3; corrected 2026-06.
    cpdHours: 2,
    cpdRecognition: ['AHPRA-aligned', 'By Osteopathy Australia–endorsed provider'],
    description: 'AHPRA-aligned compliance training for AI use by Australian clinicians. Covers Privacy Act, APP 6/8/11, TGA boundaries, AHPRA documentation, indemnity carrier positions.',
    route: '/courses/ai-in-clinical-practice',
    // Flat A$99 (owner truth 2026-07-02). The old $197-with-50%-launch-week
    // structure expired 24 June while every live surface kept saying A$99 —
    // a perpetual "launch week" is an ACL false-discount risk, so the price
    // IS A$99 with no strikethrough. Raise by editing priceAUD when decided.
    priceAUD: 99,
    purchasableViaCheckout: true,
    status: 'coming-soon',
    tags: ['compliance', 'ai', 'documentation', 'privacy', 'all-specialties'],
    launchTarget: '17 June 2026',
    // Date-driven launch: getEffectiveStatus() flips this to 'live' once now >= launchAt.
    launchAt: '2026-06-17T00:01:00+10:00',
  },
  {
    id: 'vagus-nerve',
    title: 'The Vagus Nerve in Clinical Practice',
    providerId: 'cea',
    cpdHours: 1,
    cpdRecognition: ['AHPRA-aligned', 'By Osteopathy Australia–endorsed provider'],
    description: 'Evidence-based assessment + defensible interventions for autonomic dysfunction. Anatomy, red flags, phenotypes (POTS, post-concussion, long-COVID), interventions with honest evidence ranking. 6 modules · ~75 minutes.',
    route: '/courses/vagus-nerve',
    priceAUD: 97,
    purchasableViaCheckout: true,
    status: 'pilot',
    tags: ['autonomic', 'concussion', 'pots', 'long-covid', 'evidence-based', 'all-specialties'],
    // Hidden from public pricing display until proper funnel exists (lead magnet + blog cluster + waitlist).
    // Catalogue entry preserved for when we're ready to flip back to 'coming-soon' or 'live'.
    earlyBirdDiscountPct: 15,
    earlyBirdPriceAUD: 82,
    launchTarget: 'TBD — funnel build pending',
  },
  {
    id: 'concussion-clinical-mastery',
    title: 'Concussion Clinical Mastery',
    providerId: 'cea',
    cpdHours: 14,
    cpdRecognition: ['Osteopathy Australia–endorsed', 'AHPRA-aligned', 'MedCPD Career Health accredited'],
    description: '8 online modules + full-day workshop. SCAT6, VOMS, BESS, return-to-sport/learn/work protocols. Workshop dates launch per city as clinicians nominate — online access starts immediately.',
    route: '/pricing',
    // Standing early-bird under the nomination model ($1,400 sticker applies
    // only in the final 14 days before a scheduled workshop).
    priceAUD: 1190,
    // Display-only here: CCM checkout lives at /pricing (full-course flow).
    purchasableViaCheckout: false,
    status: 'live',
    tags: ['concussion', 'sport-medicine', 'physio', 'osteo', 'gp'],
  },
  {
    id: 'concussion-rehab-mastery',
    title: 'Concussion Rehab Mastery',
    providerId: 'cea',
    // Online tier = 8 CPD hours; complete (with the shared practical day) = 14.
    cpdHours: 8,
    // ESSA accreditation GRANTED 2026-07-24. Derived from the same flag every
    // other ESSA claim obeys, so this entry can never contradict the live copy.
    cpdRecognition: CONFIG.FEATURES.ESSA_ACCREDITED
      ? ['Accredited by ESSA', '8 ESSA CPD points online (16 with the practical day)']
      : ['Designed to ESSA CPD standards', 'ESSA accreditation pending'],
    description: 'The EP-scoped concussion-rehab stream for Accredited Exercise Physiologists & Exercise Scientists — BCTT/HRt, sub-symptom-threshold prescription, graded return-to-activity, plus the live clinical tools. 8 online modules · 8 CPD (14 with the shared practical day).',
    route: '/concussion-rehab-mastery',
    priceAUD: 497,
    // CRM has its OWN checkout (/api/crm/checkout), not the generic short-course
    // flow this flag drives — so false is correct and does not mean "unbuyable".
    purchasableViaCheckout: false,
    // Live since ESSA approval. Was left at 'preview', which hid the stream from
    // /courses for everyone but admin/demo while it was selling.
    status: CONFIG.FEATURES.ESSA_ACCREDITED ? 'live' : 'preview',
    tags: ['concussion', 'rehab', 'exercise-physiology', 'essa', 'aep'],
  },
  // Placeholder partner cards removed — they were demo-shells with
  // route: '#' that dead-linked. Real partner courses will be added
  // once provider applications close. Coming-soon courses are now
  // ONLY first-party CEA courses that can be honestly waitlisted for.
]

export function findProvider(id: string): ProviderProfile | undefined {
  return PROVIDERS.find((p) => p.id === id)
}

export function findCourse(id: string): CourseCatalogueEntry | undefined {
  return COURSES.find((c) => c.id === id)
}

export function coursesByProvider(providerId: string): CourseCatalogueEntry[] {
  return COURSES.filter((c) => c.providerId === providerId)
}
