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
    CPD_BADGE_TEXT: 'Up to 14 CPD points - AHPRA Aligned, Endorsed by Osteopathy Australia',
    PRICE_ONLINE: 497,
    PRICE_REGULAR: 1400,
    PRICE_EARLY_BIRD: 1190,
    SAVINGS: 210,
    SCAT_MASTERY_CPD_POINTS: 2,
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
      date: '',
      dateObj: null as Date | null,
      status: 'collecting' as 'collecting' | 'confirmed' | 'completed',
    },
  },

  // Workshop Capacity & Threshold
  WORKSHOP: {
    CAPACITY_PER_COURSE: 12,
    CONFIRMATION_THRESHOLD: 8,    // paid registrants needed to confirm a date
    LEAD_TIME_WEEKS: 6,           // weeks of notice after threshold hit
    EARLY_BIRD_SEAT_THRESHOLD: 6, // 50% — early bird ends when this many seats sold (for confirmed cities)
    EARLY_BIRD_DAYS_BEFORE: 7,    // Early bird ends this many days before course date
    EARLY_BIRD_DEADLINE: '2026-06-30', // Hard deadline for early bird pricing
    NEXT_ROUND: 'Jun–Aug 2026',   // Approximate window for next workshops
    Q1_COMPLETED: true,           // Q1 2026 workshops ran — used for social proof
  },

  // Social Proof — real numbers only, updated manually
  SOCIAL_PROOF: {
    SCAT_FORM_DOWNLOADS: 500,
    WORKSHOP_REGISTRATIONS: 15,   // Total people registered for next round
  },

  // SEO Metadata
  SEO: {
    SITE_NAME: 'ConcussionPro - Concussion Education Australia',
    SITE_URL: 'https://portal.concussion-education-australia.com',
    TWITTER_HANDLE: '@ConcussionEduAU',
    OG_IMAGE: 'https://portal.concussion-education-australia.com/og-image.jpg',
    DESCRIPTION: 'AHPRA-aligned concussion management course. SCAT6, VOMS, BESS mastery. 8 online modules + practical training. 14 CPD points, endorsed by Osteopathy Australia.',
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
