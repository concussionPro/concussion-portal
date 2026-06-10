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
    PRICE_REGULAR: 1400,
    // HISTORICAL — early bird ended 31 May 2026 (see EARLY_BIRD_DEADLINE).
    // Do NOT use for display or charging: the current Complete Course price
    // is PRICE_REGULAR everywhere. Kept only for past-sale reconciliation
    // and deadline-gated code paths that now resolve to regular.
    PRICE_EARLY_BIRD: 1190,
    PRICE_INTERNATIONAL: 197,
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
    // Per-clinician workshop upgrade for Hub Pack customers. Below the
    // standalone workshop-upgrade price because the clinic already paid
    // for the bundle — this is the marginal in-person cost only.
    PRICE_CLINIC_WORKSHOP_UPGRADE: 497,
    SCAT_MASTERY_CPD_POINTS: 0,
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
    MELBOURNE: {
      city: 'Melbourne',
      slug: 'melbourne',
      date: 'Saturday 13 June 2026',
      dateObj: new Date('2026-06-13T08:00:00+10:00') as Date | null,
      // 'closed' (2026-06-11): runs in 2 days — registration shut, no time for
      // new participants. NOT 'completed' (workshop hasn't run; completion
      // materials must NOT fire). Sales blocked; page reframes to the next round.
      status: 'closed' as 'collecting' | 'confirmed' | 'closed' | 'completed',
    },
  },

  // Workshop Capacity & Threshold
  WORKSHOP: {
    CAPACITY_PER_COURSE: 12,
    CONFIRMATION_THRESHOLD: 8,    // paid registrants needed to confirm a date
    LEAD_TIME_WEEKS: 6,           // weeks of notice after threshold hit
    EARLY_BIRD_SEAT_THRESHOLD: 6, // 50% — early bird ends when this many seats sold (for confirmed cities)
    EARLY_BIRD_DAYS_BEFORE: 7,    // Early bird ends this many days before course date
    // EARLY BIRD IS OVER (owner decision, June 2026). The Melbourne round's
    // early-bird cutoff was 31 May 2026 — this date is the documented truth
    // and is intentionally in the past so every client-side
    // `new Date() < deadline` check resolves to regular pricing.
    // The Complete Course is PRICE_REGULAR ($1,400) everywhere, display AND charge.
    EARLY_BIRD_DEADLINE: '2026-05-31',
    // Current-round enrolment scoping (per location slug). getEnrollmentCount()
    // only counts full-course users created on/after this date so attendees of
    // past rounds (e.g. Q1 2026 workshops) don't consume seats/capacity for the
    // active round. Melbourne 13 June 2026 round: demand capture ran through
    // 2026 before the date was confirmed (2026-04-18), so the round opens at
    // the start of 2026. Update when the next round is announced.
    ROUND_START: {
      melbourne: '2026-01-01',
    } as Record<string, string>,
    NEXT_ROUND: 'Melbourne — Sat 13 June 2026',   // Lead with confirmed Melbourne date
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
    DESCRIPTION: 'AHPRA-aligned concussion management course. SCAT6, VOMS, BESS mastery. 8 online modules + practical training. 14 CPD hours, endorsed by Osteopathy Australia.',
  },

  // Feature Flags
  FEATURES: {
    SHOW_COUNTDOWN: true,
    SHOW_SPOTS_REMAINING: true,
    SHOW_SOCIAL_PROOF: true,
  },
}

export type LocationKey = keyof typeof CONFIG.LOCATIONS
export type Location = LocationKey
export type LocationConfig = typeof CONFIG.LOCATIONS[LocationKey]
export type LocationStatus = 'collecting' | 'confirmed' | 'closed' | 'completed'

/** Calculate Afterpay/Klarna instalment amount (price / 4, rounded up to cents) */
export function afterpayInstalment(price: number): string {
  return (Math.ceil(price / 4 * 100) / 100).toFixed(2)
}
