import { describe, it, expect } from 'vitest'
import {
  organizationSchema,
  createMedicalWebPageSchema,
  createCourseSchema,
  createFAQSchema,
  createAuthorSchema,
  createHowToSchema,
  createBreadcrumbSchema,
  createAggregateRatingSchema,
  createBlogPostSchema,
  createMedicalConditionSchema,
  AUTHORS,
} from '@/lib/schema-markup'
import { buildCourseSchema, buildEventSchema } from '@/components/SchemaMarkup'
import { CONFIG } from '@/lib/config'

describe('organizationSchema', () => {
  it('uses the customer-facing brand short form, not the internal folder name', () => {
    expect(organizationSchema.alternateName).toBe('CEA')
    expect(organizationSchema.alternateName).not.toBe('ConcussionPro')
  })

  it('declares en-AU and AU country', () => {
    expect(organizationSchema.inLanguage).toBe('en-AU')
    expect(organizationSchema.address.addressCountry).toBe('AU')
  })

  it('populates sameAs with at least the marketing site and Osteopathy Australia', () => {
    expect(organizationSchema.sameAs.length).toBeGreaterThan(0)
    expect(organizationSchema.sameAs).toContain('https://osteopathy.org.au')
  })

  it('exposes founder as a Person with credentials', () => {
    expect(organizationSchema.founder['@type']).toBe('Person')
    expect(organizationSchema.founder.name).toBe('Zac Lewis')
    expect(organizationSchema.founder.hasCredential).toMatch(/Osteopath/)
    expect(organizationSchema.founder.hasCredential).toMatch(/AHPRA/)
  })

  it('points logo at the portal origin where /logo.png actually resolves (apex 404s)', () => {
    expect(organizationSchema.logo).toBe(`${CONFIG.SEO.SITE_URL}/logo.png`)
  })

  it('lists Osteopathy Australia as memberOf', () => {
    expect(organizationSchema.memberOf.name).toBe('Osteopathy Australia')
  })

  it('exposes a contactPoint with the support email', () => {
    expect(organizationSchema.contactPoint.email).toMatch(/@concussion-education-australia\.com$/)
    expect(organizationSchema.contactPoint.areaServed).toBe('AU')
  })
})

describe('createMedicalWebPageSchema', () => {
  const base = {
    title: 'SCAT6 Guide',
    description: 'How to use SCAT6 in clinical practice',
    url: 'https://portal.concussion-education-australia.com/scat6',
    lastReviewed: '2026-04-01',
  }

  it('uses the lastReviewed date the caller passes — never silently defaults', () => {
    const s = createMedicalWebPageSchema(base)
    expect(s.lastReviewed).toBe('2026-04-01')
  })

  it('includes ICD-10 code S06.0 for concussion grounding', () => {
    const s = createMedicalWebPageSchema(base) as { about: { code: { codeValue: string; codingSystem: string } } }
    expect(s.about.code.codeValue).toBe('S06.0')
    expect(s.about.code.codingSystem).toBe('ICD-10')
  })

  it('targets healthcare professionals in Australia', () => {
    const s = createMedicalWebPageSchema(base)
    expect(s.audience.audienceType).toBe('Healthcare Professionals')
    expect(s.audience.geographicArea.name).toBe('Australia')
  })

  it('attaches reviewedBy when provided as a known-author key', () => {
    const s = createMedicalWebPageSchema({ ...base, reviewedBy: 'Zac Lewis' }) as {
      reviewedBy?: { name: string; hasCredential: string }
    }
    expect(s.reviewedBy).toBeDefined()
    expect(s.reviewedBy?.name).toBe('Zac Lewis')
    expect(s.reviewedBy?.hasCredential).toMatch(/Osteopath/)
  })

  it('omits reviewedBy when none is passed', () => {
    const s = createMedicalWebPageSchema(base) as { reviewedBy?: unknown }
    expect(s.reviewedBy).toBeUndefined()
  })
})

describe('createCourseSchema', () => {
  it('synthesises a default online instance when none provided', () => {
    const s = createCourseSchema({
      name: 'Concussion Clinical Mastery',
      description: 'Flagship CPD course',
      cpdHours: 14,
    })
    expect(Array.isArray(s.hasCourseInstance)).toBe(true)
    expect(s.hasCourseInstance.length).toBe(1)
    expect(s.hasCourseInstance[0].courseMode).toBe('online')
  })

  it('formats price as 2dp AUD when priceAUD given', () => {
    const s = createCourseSchema({
      name: 'Online-Only',
      description: '8 modules',
      cpdHours: 8,
      priceAUD: 497,
    }) as { offers?: { price: string; priceCurrency: string } }
    expect(s.offers?.price).toBe('497.00')
    expect(s.offers?.priceCurrency).toBe('AUD')
  })

  it('emits a workshop CourseInstance with location, startDate, and offers', () => {
    const s = createCourseSchema({
      name: 'Concussion Clinical Mastery — Melbourne',
      description: 'Hybrid course with Melbourne workshop',
      cpdHours: 14,
      instances: [{
        courseMode: 'blended',
        startDate: '2026-06-13T08:00:00+10:00',
        location: {
          name: 'Rydges Melbourne',
          address: '186 Exhibition St',
          addressLocality: 'Melbourne',
          addressRegion: 'VIC',
        },
        priceAUD: 1400,
        availability: 'LimitedAvailability',
      }],
    })
    const inst = s.hasCourseInstance[0] as {
      courseMode: string
      startDate: string
      location: { address: { addressRegion: string; addressCountry: string } }
      offers: { price: string; availability: string }
    }
    expect(inst.courseMode).toBe('blended')
    expect(inst.startDate).toBe('2026-06-13T08:00:00+10:00')
    expect(inst.location.address.addressRegion).toBe('VIC')
    expect(inst.location.address.addressCountry).toBe('AU')
    expect(inst.offers.price).toBe('1400.00')
    expect(inst.offers.availability).toContain('LimitedAvailability')
  })

  it('recognises AHPRA as the awarding body', () => {
    const s = createCourseSchema({ name: 'X', description: 'Y', cpdHours: 14 })
    expect(s.educationalCredentialAwarded.recognizedBy.alternateName).toBe('AHPRA')
  })

  it('declares en-AU on top-level Course', () => {
    const s = createCourseSchema({ name: 'X', description: 'Y', cpdHours: 14 })
    expect(s.inLanguage).toBe('en-AU')
  })
})

describe('createBlogPostSchema', () => {
  const base = {
    title: 'How to use SCAT6',
    description: 'Step-by-step',
    datePublished: '2026-01-05',
    dateModified: '2026-04-12',
    url: 'https://portal.concussion-education-australia.com/blog/scat6-guide',
  }

  it('resolves a known-author string against the AUTHORS registry', () => {
    const s = createBlogPostSchema({ ...base, author: 'Zac Lewis' })
    expect(s.author.name).toBe('Zac Lewis')
    expect(s.author.hasCredential).toMatch(/Osteopath/)
    expect(s.author.jobTitle).toMatch(/Concussion Education Australia/)
  })

  it('resolves Dr Peter Corredig with GP credentials', () => {
    const s = createBlogPostSchema({ ...base, author: 'Dr Peter Corredig' })
    expect(s.author.hasCredential).toBe('MBBS, FRACGP')
    expect(s.author.jobTitle).toBe('General Practitioner')
  })

  it('accepts a guest-author object without inventing credentials', () => {
    const s = createBlogPostSchema({
      ...base,
      author: { name: 'Guest Writer', jobTitle: 'Researcher', hasCredential: 'PhD' },
    })
    expect(s.author.name).toBe('Guest Writer')
    expect(s.author.hasCredential).toBe('PhD')
  })

  it('includes citation array when sources provided — required for AI Overview trust', () => {
    const s = createBlogPostSchema({
      ...base,
      author: 'Zac Lewis',
      citations: [
        { name: 'CISG Amsterdam Consensus 2023', url: 'https://bjsm.bmj.com/content/57/11/695' },
        { name: 'AIS Concussion Position Statement', url: 'https://www.ais.gov.au/concussion' },
      ],
    }) as { citation?: Array<{ name: string; url: string }> }
    expect(s.citation).toBeDefined()
    expect(s.citation?.length).toBe(2)
    expect(s.citation?.[0].url).toContain('bjsm.bmj.com')
  })

  it('flattens keywords array into a comma-separated string', () => {
    const s = createBlogPostSchema({
      ...base,
      author: 'Zac Lewis',
      keywords: ['SCAT6', 'concussion', 'AHPRA'],
    }) as { keywords?: string }
    expect(s.keywords).toBe('SCAT6, concussion, AHPRA')
  })

  it('omits optional fields cleanly when not supplied', () => {
    const s = createBlogPostSchema({ ...base, author: 'Zac Lewis' }) as Record<string, unknown>
    expect(s.keywords).toBeUndefined()
    expect(s.citation).toBeUndefined()
    expect(s.wordCount).toBeUndefined()
    expect(s.articleSection).toBeUndefined()
  })

  it('declares en-AU and uses BlogPosting type', () => {
    const s = createBlogPostSchema({ ...base, author: 'Zac Lewis' })
    expect(s['@type']).toBe('BlogPosting')
    expect(s.inLanguage).toBe('en-AU')
  })

  it('uses hasCredential (current spec) not the deprecated credential field', () => {
    const s = createBlogPostSchema({ ...base, author: 'Zac Lewis' }) as Record<string, unknown> & {
      author: Record<string, unknown>
    }
    expect(s.author.hasCredential).toBeDefined()
    expect((s.author as Record<string, unknown>).credential).toBeUndefined()
  })
})

describe('createAuthorSchema', () => {
  it('emits hasCredential, not the deprecated credential alias', () => {
    const s = createAuthorSchema('Zac Lewis') as Record<string, unknown>
    expect(s.hasCredential).toBeDefined()
    expect(s.credential).toBeUndefined()
  })

  it('falls back to a generic Contributor for unknown string authors', () => {
    const s = createAuthorSchema('Random Person')
    expect(s.name).toBe('Random Person')
    expect(s.jobTitle).toBe('Contributor')
  })
})

describe('createFAQSchema', () => {
  it('produces FAQPage with one Question per entry', () => {
    const s = createFAQSchema([
      { question: 'Q1', answer: 'A1' },
      { question: 'Q2', answer: 'A2' },
    ])
    expect(s['@type']).toBe('FAQPage')
    expect(s.mainEntity.length).toBe(2)
    expect(s.mainEntity[0].name).toBe('Q1')
    expect(s.mainEntity[0].acceptedAnswer.text).toBe('A1')
  })
})

describe('createHowToSchema', () => {
  it('numbers steps starting from 1', () => {
    const s = createHowToSchema({
      name: 'Apply SCAT6',
      description: 'Steps',
      steps: [
        { name: 'Step 1', text: 'Do this' },
        { name: 'Step 2', text: 'Do that' },
      ],
    })
    expect(s.step[0].position).toBe(1)
    expect(s.step[1].position).toBe(2)
  })

  it('only includes url on a step if provided', () => {
    const s = createHowToSchema({
      name: 'X',
      description: 'Y',
      steps: [{ name: 'A', text: 'B' }],
    }) as { step: Array<Record<string, unknown>> }
    expect(s.step[0].url).toBeUndefined()
  })
})

describe('createBreadcrumbSchema', () => {
  it('positions breadcrumbs sequentially', () => {
    const s = createBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Blog', url: '/blog' },
      { name: 'Post', url: '/blog/x' },
    ])
    expect(s.itemListElement.map((i) => i.position)).toEqual([1, 2, 3])
  })
})

describe('createAggregateRatingSchema', () => {
  it('defaults bestRating to 5', () => {
    const s = createAggregateRatingSchema({ ratingValue: 4.8, reviewCount: 23 })
    expect(s.bestRating).toBe(5)
    expect(s.worstRating).toBe(1)
  })
})

describe('createMedicalConditionSchema', () => {
  it('emits ICD-10 code when provided', () => {
    const s = createMedicalConditionSchema({
      name: 'Sport-Related Concussion',
      icd10: 'S06.0',
      anatomy: 'Brain',
    }) as { code: { codeValue: string; codingSystem: string }; associatedAnatomy: { name: string } }
    expect(s.code.codeValue).toBe('S06.0')
    expect(s.code.codingSystem).toBe('ICD-10')
    expect(s.associatedAnatomy.name).toBe('Brain')
  })

  it('omits code field cleanly when no ICD-10 supplied', () => {
    const s = createMedicalConditionSchema({ name: 'Postural Tachycardia Syndrome' }) as Record<string, unknown>
    expect(s.code).toBeUndefined()
  })
})

describe('buildCourseSchema (homepage/pricing Course markup)', () => {
  it('does not carry a self-asserted aggregateRating (review-snippet spam-policy risk)', () => {
    const s = buildCourseSchema()
    expect(s.aggregateRating).toBeUndefined()
  })

  it('prices the offer from the online-course config constant', () => {
    const s = buildCourseSchema() as { offers: { price: number; priceCurrency: string } }
    expect(s.offers.price).toBe(CONFIG.COURSE.PRICE_ONLINE)
    expect(s.offers.priceCurrency).toBe('AUD')
  })

  it('only emits instances for cities with confirmed dates, with local-offset startDate', () => {
    const s = buildCourseSchema() as {
      hasCourseInstance: Array<{ name: string; startDate: string }>
    }
    // Melbourne is the only confirmed city right now
    expect(s.hasCourseInstance.length).toBe(1)
    expect(s.hasCourseInstance[0].name).toBe('Melbourne Session')
    expect(s.hasCourseInstance[0].startDate).toBe('2026-06-13T08:00:00+10:00')
  })
})

describe('buildEventSchema (workshop EducationEvent markup)', () => {
  it('returns null for cities still collecting interest (no confirmed date)', () => {
    expect(buildEventSchema('SYDNEY')).toBeNull()
    expect(buildEventSchema('BYRON_BAY')).toBeNull()
  })

  it('emits the real Melbourne venue with street address', () => {
    const s = buildEventSchema('MELBOURNE') as {
      location: { name: string; address: { streetAddress: string; addressLocality: string; addressRegion: string; postalCode: string; addressCountry: string } }
    }
    expect(s.location.name).toBe('Rydges Melbourne')
    expect(s.location.address.streetAddress).toBe('186 Exhibition St')
    expect(s.location.address.addressLocality).toBe('Melbourne')
    expect(s.location.address.addressRegion).toBe('VIC')
    expect(s.location.address.postalCode).toBe('3000')
    expect(s.location.address.addressCountry).toBe('AU')
  })

  it('uses local-offset start/end dates, not UTC (which shifts the calendar date)', () => {
    const s = buildEventSchema('MELBOURNE') as { startDate: string; endDate: string }
    expect(s.startDate).toBe('2026-06-13T08:00:00+10:00')
    expect(s.endDate).toBe('2026-06-13T16:00:00+10:00')
  })

  it('includes an image for rich results', () => {
    const s = buildEventSchema('MELBOURNE') as { image: string }
    expect(s.image).toBe(`${CONFIG.SEO.SITE_URL}/melbourne-workshop.jpg`)
  })

  it('prices the offer at the regular Complete Course price (early bird is over)', () => {
    const s = buildEventSchema('MELBOURNE') as {
      offers: { price: number; priceCurrency: string; availability: string }
    }
    expect(s.offers.price).toBe(CONFIG.COURSE.PRICE_REGULAR)
    expect(s.offers.price).toBe(1400)
    expect(s.offers.price).not.toBe(CONFIG.COURSE.PRICE_EARLY_BIRD)
    expect(s.offers.priceCurrency).toBe('AUD')
  })

  it('marks the offer SoldOut once the round is closed/completed, else LimitedAvailability', () => {
    const s = buildEventSchema('MELBOURNE') as { offers: { availability: string } }
    const status = CONFIG.LOCATIONS.MELBOURNE.status
    const expected =
      status === 'closed' || status === 'completed'
        ? 'https://schema.org/SoldOut'
        : 'https://schema.org/LimitedAvailability'
    expect(s.offers.availability).toBe(expected)
  })
})

describe('AUTHORS registry', () => {
  it('contains both founder and partnered GP', () => {
    expect(AUTHORS['Zac Lewis']).toBeDefined()
    expect(AUTHORS['Dr Peter Corredig']).toBeDefined()
  })

  it('does not leak the internal folder name', () => {
    const allValues = JSON.stringify(AUTHORS)
    expect(allValues).not.toContain('ConcussionPro')
  })
})
