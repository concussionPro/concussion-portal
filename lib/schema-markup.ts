/**
 * Schema markup helpers for AI search citation and Google rich results.
 *
 * Healthcare YMYL pages need strong structured data — Course, MedicalWebPage,
 * Person with credentials, MedicalCondition with codes. AI Overviews and
 * Perplexity citation rely on it.
 */

import { CONFIG } from './config'

const SITE_URL = CONFIG.SEO.SITE_URL
const MARKETING_URL = 'https://concussion-education-australia.com'

/**
 * Known authors with verified credentials. Adding a guest author? Extend this
 * registry rather than fabricating credentials at the call site.
 */
export const AUTHORS = {
  'Zac Lewis': {
    name: 'Zac Lewis',
    jobTitle: 'Founder & Lead Educator, Concussion Education Australia',
    hasCredential: 'Registered Osteopath (AHPRA), B.Clin.Sci., M.Ost.Med',
    knowsAbout: [
      'Sport-Related Concussion',
      'SCAT-6 Assessment',
      'Vestibular-Ocular Screening',
      'Return-to-Play Protocols',
      'Mild Traumatic Brain Injury',
    ],
  },
  'Dr Peter Corredig': {
    name: 'Dr Peter Corredig',
    jobTitle: 'General Practitioner',
    hasCredential: 'MBBS, FRACGP',
    knowsAbout: ['General Practice', 'Sport-Related Concussion', 'Sports Medicine'],
  },
} as const

export type AuthorKey = keyof typeof AUTHORS
export type AuthorObject = {
  name: string
  jobTitle: string
  hasCredential: string
  knowsAbout?: readonly string[]
  sameAs?: readonly string[]
}
export type AuthorInput = string | AuthorObject

function resolveAuthor(input: AuthorInput): AuthorObject & { '@type': 'Person' } {
  if (typeof input === 'string') {
    const known = (AUTHORS as Record<string, AuthorObject>)[input]
    if (known) return { '@type': 'Person', ...known }
    return {
      '@type': 'Person',
      name: input,
      jobTitle: 'Contributor',
      hasCredential: '',
      knowsAbout: ['Sport-Related Concussion'],
    }
  }
  return { '@type': 'Person', ...input }
}

/**
 * Organization schema — establishes brand authority for AI search.
 */
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Concussion Education Australia',
  alternateName: 'CEA',
  url: MARKETING_URL,
  // Logo must live where the file actually resolves — /logo.png 404s on the
  // apex marketing domain but exists in the portal's public/ dir.
  logo: `${SITE_URL}/logo.png`,
  description:
    'Australia\'s concussion CPD provider for GPs, physiotherapists, osteopaths and allied health clinicians. AHPRA-aligned, Osteopathy Australia endorsed. Also publishes AI in Clinical Practice training covering AHPRA AI guidelines, Australian Privacy Principles, NDIS-audit-safe documentation, and AI scribe selection (Heidi, Lyrebird, ChatGPT).',
  founder: resolveAuthor('Zac Lewis'),
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'AU',
  },
  areaServed: { '@type': 'Country', name: 'Australia' },
  inLanguage: 'en-AU',
  sameAs: [
    MARKETING_URL,
    SITE_URL,
  ],
  knowsAbout: [
    'Sport-Related Concussion',
    'SCAT-6 Assessment',
    'SCOAT-6 Assessment',
    'Vestibular-Ocular Motor Screening',
    'Return-to-Play Protocols',
    'Concussion Management',
    'Sports Medicine',
    'Mild Traumatic Brain Injury',
    'AHPRA AI Guidelines',
    'Australian Privacy Principles for Healthcare',
    'AI Medical Scribes',
    'Heidi Health',
    'Lyrebird Health',
    'ChatGPT Clinical Notes',
    'NDIS Allied Health Documentation',
    'AI in Clinical Practice',
    'Healthcare AI Compliance',
  ],
  memberOf: { '@type': 'Organization', name: 'Osteopathy Australia', url: 'https://osteopathy.org.au' },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: CONFIG.CONTACT_EMAIL,
    areaServed: 'AU',
    availableLanguage: ['en'],
  },
}

/**
 * MedicalWebPage schema — healthcare-specific page context.
 *
 * Always pass a real `lastReviewed` date for clinical pages — AI search
 * weighs review recency for YMJL trust signals. Falling back to "today" is
 * misleading and gets filtered.
 */
export function createMedicalWebPageSchema(params: {
  title: string
  description: string
  url: string
  lastReviewed: string
  about?: string
  reviewedBy?: AuthorInput
}) {
  const reviewer = params.reviewedBy ? resolveAuthor(params.reviewedBy) : null
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: params.title,
    description: params.description,
    url: params.url,
    inLanguage: 'en-AU',
    lastReviewed: params.lastReviewed,
    ...(reviewer && {
      reviewedBy: {
        '@type': 'Person',
        name: reviewer.name,
        jobTitle: reviewer.jobTitle,
        hasCredential: reviewer.hasCredential,
      },
    }),
    audience: {
      '@type': 'MedicalAudience',
      audienceType: 'Healthcare Professionals',
      geographicArea: { '@type': 'Country', name: 'Australia' },
      healthCondition: { '@type': 'MedicalCondition', name: 'Sport-Related Concussion' },
    },
    about: {
      '@type': 'MedicalCondition',
      name: params.about || 'Sport-Related Concussion',
      alternateName: ['Concussion', 'Mild Traumatic Brain Injury', 'mTBI'],
      code: {
        '@type': 'MedicalCode',
        codeValue: 'S06.0',
        codingSystem: 'ICD-10',
      },
      associatedAnatomy: { '@type': 'AnatomicalStructure', name: 'Brain' },
    },
    medicalSpecialty: [
      'Sports Medicine',
      'Emergency Medicine',
      'Physiotherapy',
      'Neurology',
    ],
    isPartOf: {
      '@type': 'WebSite',
      name: 'Concussion Education Australia',
      url: MARKETING_URL,
    },
  }
}

/**
 * Course instance — one delivery of a course (workshop date or rolling online).
 */
export interface CourseInstanceInput {
  courseMode: 'online' | 'onsite' | 'blended'
  startDate?: string
  endDate?: string
  location?: { name: string; address: string; addressLocality: string; addressRegion: string }
  priceAUD?: number
  availability?: 'InStock' | 'LimitedAvailability' | 'SoldOut'
}

function buildCourseInstance(i: CourseInstanceInput) {
  const inst: Record<string, unknown> = {
    '@type': 'CourseInstance',
    courseMode: i.courseMode,
    inLanguage: 'en-AU',
  }
  if (i.startDate) inst.startDate = i.startDate
  if (i.endDate) inst.endDate = i.endDate
  if (i.location) {
    inst.location = {
      '@type': 'Place',
      name: i.location.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: i.location.address,
        addressLocality: i.location.addressLocality,
        addressRegion: i.location.addressRegion,
        addressCountry: 'AU',
      },
    }
  }
  if (typeof i.priceAUD === 'number') {
    inst.offers = {
      '@type': 'Offer',
      price: i.priceAUD.toFixed(2),
      priceCurrency: 'AUD',
      availability: `https://schema.org/${i.availability || 'InStock'}`,
      url: `${SITE_URL}/pricing`,
    }
  }
  return inst
}

/**
 * Course schema — educational credential for CPD recognition.
 *
 * Pass `instances` to expose individual workshop dates (Melbourne 13 Jun 2026
 * etc.) for Google Course rich results.
 */
export function createCourseSchema(params: {
  name: string
  description: string
  provider?: string
  cpdHours: number
  priceAUD?: number
  instances?: CourseInstanceInput[]
  /**
   * The body that actually recognises the credential. Defaults to Osteopathy
   * Australia, which endorses CCM ONLY — the EP stream (CRM) is accredited by
   * ESSA and must never publish an OA endorsement it doesn't hold.
   */
  recognizedBy?: { name: string; url: string }
  /** Overrides the credential label (the EP stream awards ESSA CPD points). */
  credentialName?: string
  audienceRoles?: string[]
  teaches?: string[]
  /** Where the offer is bought. Defaults to the CCM pricing page. */
  offerUrl?: string
}) {
  const fallbackInstance: CourseInstanceInput = {
    courseMode: 'online',
    priceAUD: params.priceAUD,
  }
  const instances = params.instances && params.instances.length > 0
    ? params.instances
    : [fallbackInstance]

  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: params.name,
    description: params.description,
    inLanguage: 'en-AU',
    provider: {
      '@type': 'Organization',
      name: params.provider || 'Concussion Education Australia',
      url: MARKETING_URL,
    },
    hasCourseInstance: instances.map(buildCourseInstance),
    educationalCredentialAwarded: {
      '@type': 'EducationalOccupationalCredential',
      // AHPRA does not accredit CPD — never claim recognizedBy AHPRA. These
      // hours count toward practitioners' AHPRA registration CPD requirements.
      name:
        params.credentialName ??
        `${params.cpdHours} CPD Hours (count toward AHPRA registration CPD requirements)`,
      credentialCategory: 'Continuing Professional Development',
      recognizedBy: {
        '@type': 'Organization',
        name: params.recognizedBy?.name ?? 'Osteopathy Australia',
        url: params.recognizedBy?.url ?? 'https://osteopathy.org.au',
      },
    },
    about: { '@type': 'MedicalCondition', name: 'Sport-Related Concussion' },
    educationalLevel: 'Professional Development',
    audience: {
      '@type': 'EducationalAudience',
      audienceType: 'Healthcare Professionals',
      educationalRole: params.audienceRoles ?? [
        'Medical Doctor',
        'Physiotherapist',
        'Osteopath',
        'Sports Trainer',
      ],
    },
    teaches: params.teaches ?? [
      'SCAT-6 Assessment Protocol',
      'SCOAT-6 Office Assessment',
      'Return-to-Play Decision Making',
      'Concussion Red Flags Recognition',
      'Vestibular-Ocular Motor Screening',
      'Neurocognitive Testing',
    ],
    timeRequired: `PT${params.cpdHours}H`,
    isAccessibleForFree: false,
    ...(typeof params.priceAUD === 'number' && {
      offers: {
        '@type': 'Offer',
        price: params.priceAUD.toFixed(2),
        priceCurrency: 'AUD',
        availability: 'https://schema.org/InStock',
        url: params.offerUrl ?? `${SITE_URL}/pricing`,
      },
    }),
  }
}

/**
 * FAQPage schema — favored by AI search for direct-answer extraction.
 * Keep answers 40-60 words for best citation odds.
 */
export function createFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'en-AU',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
}

/**
 * Person schema — author/instructor expertise signals.
 * Uses `hasCredential` (current spec) not the deprecated `credential`.
 */
export function createAuthorSchema(input: AuthorInput) {
  const a = resolveAuthor(input)
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: a.name,
    jobTitle: a.jobTitle,
    hasCredential: a.hasCredential,
    knowsAbout: a.knowsAbout || ['Sport-Related Concussion'],
    memberOf: { '@type': 'Organization', name: 'Concussion Education Australia' },
    ...('sameAs' in a && a.sameAs ? { sameAs: a.sameAs } : {}),
  }
}

/**
 * HowTo schema — step-by-step protocol display in AI Overviews.
 */
export function createHowToSchema(params: {
  name: string
  description: string
  steps: Array<{ name: string; text: string; url?: string }>
  totalTime?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: params.name,
    description: params.description,
    inLanguage: 'en-AU',
    totalTime: params.totalTime || 'PT10M',
    step: params.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.url ? { url: step.url } : {}),
    })),
  }
}

/** Breadcrumb navigation hint for crawlers. */
export function createBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/** Aggregate review rating (use only with real review counts). */
export function createAggregateRatingSchema(params: {
  ratingValue: number
  reviewCount: number
  bestRating?: number
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    ratingValue: params.ratingValue,
    reviewCount: params.reviewCount,
    bestRating: params.bestRating || 5,
    worstRating: 1,
  }
}

/**
 * BlogPosting schema — clinical articles. `author` accepts a known-author
 * key (e.g. 'Zac Lewis') or a full author object. Strings looked up against
 * the AUTHORS registry; pass a full object for guest writers.
 */
export function createBlogPostSchema(params: {
  title: string
  description: string
  datePublished: string
  dateModified: string
  author: AuthorInput
  url: string
  image?: string
  keywords?: string[]
  articleSection?: string
  wordCount?: number
  citations?: Array<{ name: string; url: string }>
}) {
  const author = resolveAuthor(params.author)
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: params.title,
    description: params.description,
    datePublished: params.datePublished,
    dateModified: params.dateModified,
    inLanguage: 'en-AU',
    author: {
      '@type': 'Person',
      name: author.name,
      jobTitle: author.jobTitle,
      hasCredential: author.hasCredential,
      memberOf: { '@type': 'Organization', name: 'Concussion Education Australia' },
    },
    publisher: {
      '@type': 'Organization',
      name: 'Concussion Education Australia',
      url: MARKETING_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': params.url },
    image: params.image || `${SITE_URL}/og-image.jpg`,
    ...(params.keywords && params.keywords.length > 0 && {
      keywords: params.keywords.join(', '),
    }),
    ...(params.articleSection && { articleSection: params.articleSection }),
    ...(typeof params.wordCount === 'number' && { wordCount: params.wordCount }),
    ...(params.citations && params.citations.length > 0 && {
      citation: params.citations.map((c) => ({
        '@type': 'CreativeWork',
        name: c.name,
        url: c.url,
      })),
    }),
  }
}

/**
 * MedicalCondition schema — use as `about` reference on clinical posts that
 * focus on a specific condition. Includes ICD-10 code for AI grounding.
 */
export function createMedicalConditionSchema(params: {
  name: string
  alternateNames?: string[]
  icd10?: string
  anatomy?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalCondition',
    name: params.name,
    ...(params.alternateNames && { alternateName: params.alternateNames }),
    ...(params.icd10 && {
      code: {
        '@type': 'MedicalCode',
        codeValue: params.icd10,
        codingSystem: 'ICD-10',
      },
    }),
    ...(params.anatomy && {
      associatedAnatomy: { '@type': 'AnatomicalStructure', name: params.anatomy },
    }),
  }
}
