// Application Configuration
// Centralized constants for URLs, dates, and settings

export const CONFIG = {
  // External URLs
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com',
  SHOP_URL: '/pricing', // Portal checkout
  CONTACT_EMAIL: 'zac@concussion-education-australia.com',

  // Course Details
  COURSE: {
    TOTAL_MODULES: 8,
    TOTAL_CPD_HOURS: 14,
    ONLINE_CPD_HOURS: 8,
    IN_PERSON_CPD_HOURS: 6,
    CPD_BADGE_TEXT: '14 CPD points - AHPRA Aligned, Endorsed by Osteopathy Australia',
    PRICE_REGULAR: 1400,
    PRICE_EARLY_BIRD: 1190,
    SAVINGS: 210,
    PROMO_CODE: 'SCAT6',
  },

  // Training Locations & Dates
  LOCATIONS: {
    MELBOURNE: {
      city: 'Melbourne',
      date: 'TBA',
      dateObj: new Date('2026-06-01'),
      spotsRemaining: 0,
    },
    SYDNEY: {
      city: 'Sydney',
      date: 'March 7, 2026',
      dateObj: new Date('2026-03-07'),
      spotsRemaining: 18,
    },
    BYRON_BAY: {
      city: 'Byron Bay',
      date: 'March 28, 2026',
      dateObj: new Date('2026-03-28'),
      spotsRemaining: 15,
    },
  },

  // Social Proof - Real testimonials only, no fake numbers
  SOCIAL_PROOF: {
    TOTAL_CLINICIANS: 0,
    SATISFACTION_RATING: 0,
    TOTAL_REVIEWS: 0,
    ENROLLMENTS_2026: 0,
  },

  // Early Bird Pricing Deadline
  EARLY_BIRD_DEADLINE: new Date('2026-03-21T23:59:59'),

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
    SHOW_SOCIAL_PROOF: false,
  },
} as const

export type Location = keyof typeof CONFIG.LOCATIONS
