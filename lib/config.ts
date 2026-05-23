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
    PRICE_EARLY_BIRD: 1190,
    PRICE_INTERNATIONAL: 347,
    SAVINGS: 210,
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
      status: 'collecting' as 'collecting' | 'confirmed' | 'completed',
    },
    BYRON_BAY: {
      city: 'Byron Bay',
      slug: 'byron-bay',
      date: '',
      dateObj: null as Date | null,
      status: 'collecting' as 'collecting' | 'confirmed' | 'completed',
    },
    MELBOURNE: {
      city: 'Melbourne',
      slug: 'melbourne',
      date: 'Saturday 13 June 2026',
      dateObj: new Date('2026-06-13T08:00:00+10:00') as Date | null,
      status: 'confirmed' as 'collecting' | 'confirmed' | 'completed',
    },
  },

  // Workshop Capacity & Threshold
  WORKSHOP: {
    CAPACITY_PER_COURSE: 12,
    CONFIRMATION_THRESHOLD: 8,    // paid registrants needed to confirm a date
    LEAD_TIME_WEEKS: 6,           // weeks of notice after threshold hit
    EARLY_BIRD_SEAT_THRESHOLD: 6, // 50% — early bird ends when this many seats sold (for confirmed cities)
    EARLY_BIRD_DAYS_BEFORE: 7,    // Early bird ends this many days before course date
    EARLY_BIRD_DEADLINE: '2026-05-31', // Hard deadline for early bird pricing (Melbourne Jun 13 launch)
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
export type LocationStatus = 'collecting' | 'confirmed' | 'completed'

/** Calculate Afterpay/Klarna instalment amount (price / 4, rounded up to cents) */
export function afterpayInstalment(price: number): string {
  return (Math.ceil(price / 4 * 100) / 100).toFixed(2)
}
