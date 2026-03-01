import { CONFIG } from '@/lib/config'

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Concussion Education Australia',
    description: CONFIG.SEO.DESCRIPTION,
    url: CONFIG.SEO.SITE_URL,
    logo: `${CONFIG.SEO.SITE_URL}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      email: CONFIG.CONTACT_EMAIL,
      contactType: 'Customer Service',
      areaServed: 'AU',
    },
    sameAs: [
      // Add social media URLs when available
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function CourseSchema() {
  // Only include course instances that have confirmed dates
  const courseInstances = []

  if (CONFIG.LOCATIONS.MELBOURNE.dateObj) {
    courseInstances.push({
      '@type': 'CourseInstance',
      name: 'Melbourne Session',
      courseMode: 'blended',
      location: {
        '@type': 'Place',
        name: 'Melbourne, Victoria',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Melbourne',
          addressRegion: 'VIC',
          addressCountry: 'AU',
        },
      },
      startDate: CONFIG.LOCATIONS.MELBOURNE.dateObj.toISOString(),
    })
  }

  if (CONFIG.LOCATIONS.SYDNEY.dateObj) {
    courseInstances.push({
      '@type': 'CourseInstance',
      name: 'Sydney Session - March 2026',
      courseMode: 'blended',
      location: {
        '@type': 'Place',
        name: 'Sydney, New South Wales',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Sydney',
          addressRegion: 'NSW',
          addressCountry: 'AU',
        },
      },
      startDate: CONFIG.LOCATIONS.SYDNEY.dateObj.toISOString(),
    })
  }

  if (CONFIG.LOCATIONS.BYRON_BAY.dateObj) {
    courseInstances.push({
      '@type': 'CourseInstance',
      name: 'Byron Bay Session - March 2026',
      courseMode: 'blended',
      location: {
        '@type': 'Place',
        name: 'Byron Bay, New South Wales',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Byron Bay',
          addressRegion: 'NSW',
          addressCountry: 'AU',
        },
      },
      startDate: CONFIG.LOCATIONS.BYRON_BAY.dateObj.toISOString(),
    })
  }

  const earlyBirdDate = CONFIG.EARLY_BIRD_DEADLINE
    ? CONFIG.EARLY_BIRD_DEADLINE.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: 'Concussion Management Clinical Course',
    description: 'Comprehensive concussion management training covering SCAT6, VOMS, BESS protocols. 8 online modules plus hands-on practical training. 14 CPD points, AHPRA-aligned, endorsed by Osteopathy Australia.',
    provider: {
      '@type': 'Organization',
      name: 'Concussion Education Australia',
      url: CONFIG.SEO.SITE_URL,
    },
    educationalCredentialAwarded: '14 CPD points - AHPRA Aligned, Endorsed by Osteopathy Australia',
    timeRequired: 'P2W',
    offers: {
      '@type': 'Offer',
      price: CONFIG.COURSE.PRICE_EARLY_BIRD,
      priceCurrency: 'AUD',
      availability: 'https://schema.org/InStock',
      url: CONFIG.SHOP_URL,
      priceValidUntil: earlyBirdDate,
    },
  }

  // Only include aggregate rating if we have real reviews
  if (CONFIG.SOCIAL_PROOF.TOTAL_REVIEWS > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: CONFIG.SOCIAL_PROOF.SATISFACTION_RATING,
      reviewCount: CONFIG.SOCIAL_PROOF.TOTAL_REVIEWS,
      bestRating: 5,
      worstRating: 1,
    }
  }

  if (courseInstances.length > 0) {
    schema.hasCourseInstance = courseInstances
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function EventSchema({ location }: { location: 'MELBOURNE' | 'SYDNEY' | 'BYRON_BAY' }) {
  const locationData = CONFIG.LOCATIONS[location]

  // If location has no confirmed date, don't render event schema
  if (!locationData.dateObj) {
    return null
  }

  const earlyBirdDate = CONFIG.EARLY_BIRD_DEADLINE
    ? CONFIG.EARLY_BIRD_DEADLINE.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'EducationEvent',
    name: `Concussion Management Training - ${locationData.city}`,
    description: 'Full-day practical training in SCAT6, VOMS, and BESS protocols for concussion assessment and management.',
    startDate: locationData.dateObj.toISOString(),
    endDate: new Date(locationData.dateObj.getTime() + 8 * 60 * 60 * 1000).toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: locationData.city,
      address: {
        '@type': 'PostalAddress',
        addressLocality: locationData.city,
        addressCountry: 'AU',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'Concussion Education Australia',
      url: CONFIG.SEO.SITE_URL,
    },
    offers: {
      '@type': 'Offer',
      price: CONFIG.COURSE.PRICE_EARLY_BIRD,
      priceCurrency: 'AUD',
      availability: CONFIG.FEATURES.SHOW_SPOTS_REMAINING && locationData.spotsRemaining > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/LimitedAvailability',
      url: CONFIG.SHOP_URL,
      validFrom: new Date().toISOString(),
      priceValidUntil: earlyBirdDate,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function BreadcrumbSchema({ items }: { items: Array<{ name: string; url: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${CONFIG.SEO.SITE_URL}${item.url}`,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
