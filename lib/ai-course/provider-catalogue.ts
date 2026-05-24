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
  status: 'live' | 'coming-soon' | 'pilot'
  tags: string[]
  /** Early-access discount percentage applied at launch for waitlist signups */
  earlyBirdDiscountPct?: number
  /** Computed early-bird price (priceAUD * (1 - earlyBirdDiscountPct/100)), rounded */
  earlyBirdPriceAUD?: number | null
  /** Soft launch target — display only, not enforced */
  launchTarget?: string
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
    courseCount: 2,
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
    cpdHours: 3,
    cpdRecognition: ['AHPRA-aligned', 'By Osteopathy Australia–endorsed provider'],
    description: 'AHPRA-aligned compliance training for AI use by Australian clinicians. Covers Privacy Act, APP 6/8/11, TGA boundaries, AHPRA documentation, indemnity carrier positions.',
    route: '/courses/ai-in-clinical-practice',
    priceAUD: 147,
    status: 'coming-soon',
    tags: ['compliance', 'ai', 'documentation', 'privacy', 'all-specialties'],
    earlyBirdDiscountPct: 15,
    earlyBirdPriceAUD: 125,
    launchTarget: '1 June 2026',
  },
  {
    id: 'vagus-nerve',
    title: 'The Vagus Nerve in Clinical Practice',
    providerId: 'cea',
    cpdHours: 1.25,
    cpdRecognition: ['AHPRA-aligned', 'By Osteopathy Australia–endorsed provider'],
    description: 'Evidence-based assessment + defensible interventions for autonomic dysfunction. Anatomy, red flags, phenotypes (POTS, post-concussion, long-COVID), interventions with honest evidence ranking. 6 modules · ~75 minutes.',
    route: '/courses/vagus-nerve',
    priceAUD: 97,
    status: 'coming-soon',
    tags: ['autonomic', 'concussion', 'pots', 'long-covid', 'evidence-based', 'all-specialties'],
    earlyBirdDiscountPct: 15,
    earlyBirdPriceAUD: 82,
    launchTarget: 'July 2026',
  },
  {
    id: 'concussion-clinical-mastery',
    title: 'Concussion Clinical Mastery',
    providerId: 'cea',
    cpdHours: 14,
    cpdRecognition: ['Osteopathy Australia–endorsed', 'AHPRA-aligned', 'MedCPD Career Health accredited'],
    description: '8 online modules + full-day workshop. SCAT6, VOMS, BESS, return-to-sport/learn/work protocols. Workshop confirmed for Melbourne 13 June 2026.',
    route: '/pricing',
    priceAUD: 1190,
    status: 'live',
    tags: ['concussion', 'sport-medicine', 'physio', 'osteo', 'gp'],
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
