import { CONFIG } from '@/lib/config'
import { intlPriceForCountry } from '@/lib/international-pricing'

const SITE_URL = CONFIG.SEO.SITE_URL
const MARKETING_URL = 'https://concussion-education-australia.com'

/**
 * Course + Organization structured data for the INTERNATIONAL landing pages
 * (/acsm, /cep-uk, /cimspa, /uk, /concussion-rehab-mastery).
 *
 * WHY THESE PAGES SPECIFICALLY: they are the pages professional bodies will
 * link to. A backlink from ACSM or CIMSPA is the moment Google and the AI
 * retrievers arrive — and until now those pages carried no structured data at
 * all, so a crawler could see the prose but had nothing machine-readable saying
 * what the course IS, what it costs, who provides it, or what credential it
 * awards. In a YMYL niche that is exactly the data that decides whether you get
 * cited or skipped.
 *
 * HONESTY RULES BAKED IN — these mirror the flags the visible copy obeys:
 *  - `credentialAwarded` states HOURS, never CECs/CEUs/points for a body that
 *    hasn't granted them. ESSA is the only accreditation asserted, and only
 *    while CONFIG.FEATURES.ESSA_ACCREDITED is true.
 *  - International = 8 online modules only. The in-person day is AU-only, so
 *    these pages must never imply 16 hours.
 *  - Price comes from lib/international-pricing (the same source the page
 *    displays and Stripe charges), so schema can't drift from the real offer.
 */
export function InternationalCourseSchema({
  name,
  description,
  /** ISO-3166 alpha-2 the price should be quoted in (GB, US, …). */
  country,
  /** Canonical path for this landing, e.g. '/acsm'. */
  path,
  /** Professions this landing addresses — sharpens the audience signal. */
  roles = ['Exercise Physiologist', 'Physiotherapist'],
}: {
  name: string
  description: string
  country?: string | null
  path: string
  roles?: string[]
}) {
  const price = intlPriceForCountry(country)
  const url = `${SITE_URL}${path}`
  const hours = CONFIG.COURSE.ONLINE_CPD_POINTS

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `${url}#course`,
    name,
    description,
    url,
    inLanguage: 'en',
    provider: {
      '@type': 'Organization',
      name: 'Concussion Education Australia',
      url: MARKETING_URL,
    },
    hasCourseInstance: [
      {
        '@type': 'CourseInstance',
        courseMode: 'online',
        courseWorkload: `PT${hours}H`,
        // Self-paced: no start/end date, available continuously.
        offers: {
          '@type': 'Offer',
          price: price.amount.toFixed(2),
          priceCurrency: price.code,
          availability: 'https://schema.org/InStock',
          url,
        },
      },
    ],
    educationalCredentialAwarded: {
      '@type': 'EducationalOccupationalCredential',
      // HOURS, not credits. Never assert a body's currency (CEC/CEU/CPD point)
      // until that body has actually granted it.
      name: `Certificate of Completion — ${hours} hours of learning`,
      credentialCategory: 'Continuing Professional Development',
      ...(CONFIG.FEATURES.ESSA_ACCREDITED && {
        recognizedBy: {
          '@type': 'Organization',
          name: 'Exercise & Sports Science Australia (ESSA)',
          url: 'https://www.essa.org.au',
        },
      }),
    },
    about: { '@type': 'MedicalCondition', name: 'Concussion' },
    educationalLevel: 'Professional Development',
    audience: {
      '@type': 'EducationalAudience',
      audienceType: 'Healthcare Professionals',
      educationalRole: roles,
    },
    teaches: [
      'Graded exercise testing (Buffalo Concussion Treadmill Test)',
      'Heart-rate-threshold exercise prescription',
      'Sub-symptom-threshold aerobic rehabilitation',
      'Phenotype-specific concussion rehabilitation',
      'Graded return to activity and sport',
      'Scope of practice and referral',
    ],
    timeRequired: `PT${hours}H`,
    isAccessibleForFree: false,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
