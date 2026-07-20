// Application Configuration
// Centralized constants for URLs, dates, and settings

export const CONFIG = {
  // External URLs
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com',
  SHOP_URL: '/pricing', // Portal checkout — no longer links to Squarespace
  CONTACT_EMAIL: 'zac@concussion-education-australia.com',

  // Course Details
  COURSE: {
    TOTAL_MODULES: 8,
    TOTAL_CPD_POINTS: 14,
    ONLINE_CPD_POINTS: 8,
    IN_PERSON_CPD_POINTS: 6,
    CPD_BADGE_TEXT: 'Up to 14 CPD hours - AHPRA Aligned, Endorsed by Osteopathy Australia',
    PRICE_ONLINE: 497,
    // PRICING MODEL (owner decision 2026-07-02):
    // PRICE_REGULAR ($1,400) is the sticker/standard price. It is only ever
    // CHARGED in the final EARLY_BIRD_DAYS_BEFORE window of a confirmed,
    // scheduled workshop. Everyone who buys BEFORE their city's date launches
    // (status 'collecting'/'completed'-awaiting-next-round) — or after launch
    // but outside the final window — pays PRICE_EARLY_BIRD ($1,190).
    // The Complete Course is buyable at ANY time for ANY city: the buyer
    // nominates a city, lands in the Ready-to-Train pipeline, and a date
    // launches when the city hits CONFIRMATION_THRESHOLD.
    // ACL discipline: $1,400 must remain a REAL price (genuinely charged in
    // the final window) — never present $1,190 as a discount off a price
    // that is never charged. Use isEarlyBirdForLocation()/workshopPriceFor().
    PRICE_REGULAR: 1400,
    PRICE_EARLY_BIRD: 1190,
    // SCAT6 completion code — dollar amount must match the Stripe coupon.
    SCAT_DISCOUNT_AUD: 50,
    // International (USD) — CRM course + first year on the platform, with the
    // annual renewal covering the concussion-update module + platform access.
    // Consumed by lib/stripe.ts (international-online checkout) and the
    // /acsm + /pricing-international offer cards — keep them in lockstep.
    PRICE_INTERNATIONAL: 347,
    RENEWAL_INTERNATIONAL: 99,
    SAVINGS: 210,
    // Concussion Hub Pack — clinic-tier offer for cold outreach.
    // 5 online seats + branded clinical docs + admin pack + 30min consult.
    PRICE_CLINIC_HUB_PACK: 1497,
    CLINIC_HUB_SEATS_INCLUDED: 5,
    // Per-clinician seat ADDED beyond the 5 included. Large clinics that
    // want their whole 10-20 person team trained pay marginal per-seat
    // online access. Priced well below standalone individual ($497) since
    // they're already a Hub Pack customer, but high enough that the unit
    // economics work — Zac's online delivery cost is ~$0 per seat but the
    // perceived value tracks team size.
    PRICE_CLINIC_HUB_EXTRA_SEAT: 497,
    // Per-clinician workshop upgrade for Hub Pack customers: a hub member
    // joins a PUBLIC workshop date for this price. Set at $600 = ~50% of the
    // $1,190 solo complete-course price — the clinic already paid for the
    // online bundle, so this is the marginal in-person seat only, at roughly
    // half what a solo clinician pays to attend (owner 2026-07-08).
    PRICE_CLINIC_WORKSHOP_UPGRADE: 600,
    SCAT_MASTERY_CPD_POINTS: 1,
    SCAT_MASTERY_MODULES: 3,
    PROMO_CODE: 'SCAT6',
  },

  // Training Locations & Dates
  // status: 'collecting' = accepting purchases, tracking toward threshold
  //         'confirmed'  = admin set date + venue after threshold hit
  //         'completed'  = workshop has happened
  LOCATIONS: {
    SYDNEY: {
      city: 'Sydney',
      slug: 'sydney',
      date: '',
      dateObj: null as Date | null,
      status: 'collecting' as 'collecting' | 'confirmed' | 'closed' | 'completed',
    },
    BYRON_BAY: {
      city: 'Byron Bay',
      slug: 'byron-bay',
      date: '',
      dateObj: null as Date | null,
      status: 'collecting' as 'collecting' | 'confirmed' | 'closed' | 'completed',
    },
    ADELAIDE: {
      city: 'Adelaide',
      slug: 'adelaide',
      date: '',
      dateObj: null as Date | null,
      status: 'collecting' as 'collecting' | 'confirmed' | 'closed' | 'completed',
    },
    WA: {
      city: 'Perth (WA)',
      slug: 'wa',
      date: '',
      dateObj: null as Date | null,
      status: 'collecting' as 'collecting' | 'confirmed' | 'closed' | 'completed',
    },
    MELBOURNE: {
      city: 'Melbourne',
      slug: 'melbourne',
      date: 'Saturday 13 June 2026',
      dateObj: new Date('2026-06-13T08:00:00+10:00') as Date | null,
      // 'completed' (2026-06-15): workshop RAN on 13 June. 6 paid attendees are
      // now alumni — full-course + workshop_location='melbourne' + past dateObj.
      // They're the warm base for Level 2 / continuing-ed outreach (see the
      // workshop-alumni segment). Sales blocked; page reframes to the next round.
      status: 'completed' as 'collecting' | 'confirmed' | 'closed' | 'completed',
    },
  },

  // Workshop Capacity & Threshold
  WORKSHOP: {
    CAPACITY_PER_COURSE: 12,
    CONFIRMATION_THRESHOLD: 8,    // paid registrants needed to confirm a date
    LEAD_TIME_WEEKS: 6,           // weeks of notice after threshold hit
    // Early bird ($1,190) closes this many days before a CONFIRMED workshop
    // date — the final window is charged at PRICE_REGULAR ($1,400). For
    // cities with no launched date (collecting / completed awaiting next
    // round), early bird is ALWAYS active (owner decision 2026-07-02).
    EARLY_BIRD_DAYS_BEFORE: 14,
    // Current-round enrolment scoping (per location slug). getEnrollmentCount()
    // only counts full-course users created on/after this date so attendees of
    // past rounds (e.g. Q1 2026 workshops) don't consume seats/capacity for the
    // active round. Melbourne 13 June 2026 round: demand capture ran through
    // 2026 before the date was confirmed (2026-04-18), so the round opens at
    // the start of 2026. Update when the next round is announced.
    ROUND_START: {
      melbourne: '2026-01-01',
    } as Record<string, string>,
    Q1_COMPLETED: true,           // Q1 2026 workshops ran — used for social proof
  },

  // Workshop venue partnerships — Rydges Melbourne for the Jun 13 2026 workshop
  VENUE_BENEFITS: {
    MELBOURNE: {
      hotelName: 'Rydges Melbourne',
      hotelAddress: '186 Exhibition St, Melbourne CBD',
      bookingUrl: 'https://www.rydges.com/accommodation/melbourne-vic/melbourne/',
      accommodationDiscountPct: 25,
      accommodationCode: 'CEA25',            // Update when Rydges confirms the actual code
      parkingConferenceRate: 45,             // $/day, enter before 10am, exit by 6pm
      parkingOvernightRate: 60,              // $/night for hotel guests
    },
  },

  // Social Proof — real numbers only, updated manually
  SOCIAL_PROOF: {
    SCAT_FORM_DOWNLOADS: 500,
    WORKSHOP_REGISTRATIONS: 15,   // Total people registered for next round
  },

  // SEO Metadata
  SEO: {
    SITE_NAME: 'Concussion Education Australia',
    SITE_URL: 'https://portal.concussion-education-australia.com',
    TWITTER_HANDLE: '@ConcussionEduAU',
    OG_IMAGE: 'https://portal.concussion-education-australia.com/og-image.jpg',
    DESCRIPTION: 'AHPRA-aligned concussion management course. SCAT6, VOMS, BESS mastery. 8 online modules (8 CPD hours) + optional practical day (up to 14 CPD hours). Endorsed by Osteopathy Australia.',
  },

  // Feature Flags
  FEATURES: {
    SHOW_COUNTDOWN: true,
    SHOW_SPOTS_REMAINING: true,
    SHOW_SOCIAL_PROOF: true,
    // ESSA accreditation for the CRM (EP) stream. FALSE until the certificate
    // is actually granted. Controls EVERY ESSA claim on the EP landing + hub +
    // nurture: when false → "designed to ESSA CPD standards · accreditation
    // pending" and NEVER "accredited"; when true → "ESSA-accredited · 8 ESSA
    // CPD points". Flip to true ONLY on real approval. Bundled to the client
    // (not secret). This is the one switch that takes the EP stream live.
    ESSA_ACCREDITED: false,
  },
}

export type LocationKey = keyof typeof CONFIG.LOCATIONS
export type Location = LocationKey
export type LocationConfig = typeof CONFIG.LOCATIONS[LocationKey]
export type LocationStatus = 'collecting' | 'confirmed' | 'closed' | 'completed'

/**
 * Is the $1,190 early-bird rate active for this city? (Pure — safe on client
 * and server; the server charge in lib/stripe.ts uses this same function.)
 *
 *  - No city / unknown city / 'collecting' / 'completed' (awaiting next
 *    round): TRUE — everyone who buys before a date launches pays $1,190.
 *  - 'confirmed' with a future date: TRUE until EARLY_BIRD_DAYS_BEFORE days
 *    out, then FALSE (the final window is charged at PRICE_REGULAR $1,400).
 *  - 'confirmed' with a past date (admin hasn't flipped to completed yet):
 *    TRUE — the purchase is a nomination for the next round.
 */
export function isEarlyBirdForLocation(locationSlug?: string | null): boolean {
  const loc = locationSlug
    ? Object.values(CONFIG.LOCATIONS).find((l) => l.slug === locationSlug)
    : undefined
  if (!loc || loc.status !== 'confirmed' || !loc.dateObj) return true
  const dateMs = loc.dateObj.getTime()
  if (dateMs < Date.now()) return true // past date = next-round nomination
  const closeMs = dateMs - CONFIG.WORKSHOP.EARLY_BIRD_DAYS_BEFORE * 24 * 60 * 60 * 1000
  return Date.now() < closeMs
}

/** Complete Course price for a city under the early-bird model (AUD). */
export function workshopPriceFor(locationSlug?: string | null): number {
  return isEarlyBirdForLocation(locationSlug)
    ? CONFIG.COURSE.PRICE_EARLY_BIRD
    : CONFIG.COURSE.PRICE_REGULAR
}

/** Workshop-upgrade price for an online-only owner (difference to the
 *  current Complete Course price for their city). */
export function upgradePriceFor(locationSlug?: string | null): number {
  return workshopPriceFor(locationSlug) - CONFIG.COURSE.PRICE_ONLINE
}

/**
 * SST Trainer clinic pricing (A$/month) — single source for every surface
 * (founding page, pricing page, gp-report paywall, clinic welcome email).
 * Founding clinics lock their tier rate for life; solo tier from A$49.
 */
export const SST_PRICING = {
  FOUNDING_FROM: 49, // solo-tier founding lock (for life)
  STANDARD_SOLO: 99, // standard solo-tier rate after the founding period
} as const

/** Calculate Afterpay/Klarna instalment amount (price / 4, rounded up to cents) */
export function afterpayInstalment(price: number): string {
  return (Math.ceil(price / 4 * 100) / 100).toFixed(2)
}
