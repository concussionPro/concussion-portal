import { CONFIG } from '@/lib/config'

// NOTE: The Organization schema lives in lib/schema-markup.ts and is injected
// globally by app/layout.tsx — don't add a second one here (duplicate/conflicting
// org entities confuse Google's entity reconciliation).

/**
 * Format a Date as an AEST local-offset ISO string ('2026-06-13T08:00:00+10:00').
 * Workshops are AU-local events — toISOString() would emit UTC and shift the
 * calendar date in rich results. June is outside AEDT, so +10:00 is correct
 * for all current workshop cities.
 */
function toAESTOffsetISO(date: Date): string {
  const shifted = new Date(date.getTime() + 10 * 60 * 60 * 1000)
  return shifted.toISOString().replace(/\.\d{3}Z$/, '+10:00')
}

/** Plain-object Course schema — exported separately so tests can assert on it. */
export function buildCourseSchema(): Record<string, unknown> {
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
      startDate: toAESTOffsetISO(CONFIG.LOCATIONS.MELBOURNE.dateObj),
    })
  }

  if (CONFIG.LOCATIONS.SYDNEY.dateObj) {
    courseInstances.push({
      '@type': 'CourseInstance',
      name: 'Sydney Session',
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
      startDate: toAESTOffsetISO(CONFIG.LOCATIONS.SYDNEY.dateObj),
    })
  }

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: 'Concussion Management Clinical Course',
    description: 'Comprehensive concussion management training covering SCAT6, VOMS, BESS protocols. 8 online modules plus hands-on practical training. 14 CPD hours, AHPRA-aligned, endorsed by Osteopathy Australia.',
    provider: {
      '@type': 'Organization',
      name: 'Concussion Education Australia',
      url: CONFIG.SEO.SITE_URL,
    },
    educationalCredentialAwarded: '14 CPD hours - AHPRA Aligned, Endorsed by Osteopathy Australia',
    timeRequired: 'P2W',
    offers: {
      '@type': 'Offer',
      price: CONFIG.COURSE.PRICE_ONLINE,
      priceCurrency: 'AUD',
      availability: 'https://schema.org/InStock',
      url: `${CONFIG.APP_URL}${CONFIG.SHOP_URL}`,
    },
  }

  // No aggregateRating: self-asserted ratings without on-page, user-submitted
  // reviews risk Google's review-snippet spam policy.

  if (courseInstances.length > 0) {
    schema.hasCourseInstance = courseInstances
  }

  return schema
}

export function CourseSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildCourseSchema()) }}
    />
  )
}

type EventLocationKey = 'MELBOURNE' | 'SYDNEY'

/** Plain-object EducationEvent schema, or null when the city has no confirmed date. */
export function buildEventSchema(location: EventLocationKey): Record<string, unknown> | null {
  const locationData = CONFIG.LOCATIONS[location]

  // If location has no confirmed date, don't render event schema
  if (!locationData.dateObj) {
    return null
  }

  // Confirmed workshops have a real venue (currently only Melbourne — Rydges).
  const venue = location === 'MELBOURNE' ? CONFIG.VENUE_BENEFITS.MELBOURNE : null

  return {
    '@context': 'https://schema.org',
    '@type': 'EducationEvent',
    name: `Concussion Management Training - ${locationData.city}`,
    description: 'Full-day practical training in SCAT6, VOMS, and BESS protocols for concussion assessment and management.',
    image: `${CONFIG.SEO.SITE_URL}/melbourne-workshop.jpg`,
    startDate: toAESTOffsetISO(locationData.dateObj),
    endDate: toAESTOffsetISO(new Date(locationData.dateObj.getTime() + 8 * 60 * 60 * 1000)),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: venue
      ? {
          '@type': 'Place',
          name: venue.hotelName,
          address: {
            '@type': 'PostalAddress',
            streetAddress: '186 Exhibition St',
            addressLocality: 'Melbourne',
            addressRegion: 'VIC',
            postalCode: '3000',
            addressCountry: 'AU',
          },
        }
      : {
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
      // Early bird is over — advertise the regular Complete Course price.
      price: CONFIG.COURSE.PRICE_REGULAR,
      priceCurrency: 'AUD',
      // SoldOut once the round's registration is closed — avoids misleading
      // "available" rich results for a workshop nobody can still book.
      availability:
        locationData.status === 'closed' || locationData.status === 'completed'
          ? 'https://schema.org/SoldOut'
          : 'https://schema.org/LimitedAvailability',
      url: `${CONFIG.APP_URL}${CONFIG.SHOP_URL}`,
      validFrom: new Date().toISOString(),
    },
  }
}

export function EventSchema({ location }: { location: EventLocationKey }) {
  const schema = buildEventSchema(location)
  if (!schema) return null

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
