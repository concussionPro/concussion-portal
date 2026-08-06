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

/** Minimal location shape the schema builders need (structural subset of
 *  CONFIG.LOCATIONS entries; tests may pass fixtures). */
export type SchemaLocationData = {
  city: string
  slug: string
  dateObj: Date | null
  status: 'collecting' | 'confirmed' | 'closed' | 'completed'
}

/**
 * A location only qualifies for date-bearing schema when its workshop is
 * confirmed AND still in the future. Completed rounds (e.g. Melbourne June
 * 2026) and floated-but-unconfirmed dates must never emit as scheduled events.
 */
function hasConfirmedFutureDate(loc: { dateObj: Date | null; status: string }): boolean {
  return !!loc.dateObj && loc.status === 'confirmed' && loc.dateObj.getTime() > Date.now()
}

/** Plain-object Course schema — exported separately so tests can assert on it.
 *  `locations` is injectable for tests; production callers use live CONFIG. */
export function buildCourseSchema(
  locations: { MELBOURNE: SchemaLocationData; SYDNEY: SchemaLocationData } = CONFIG.LOCATIONS
): Record<string, unknown> {
  // Only include course instances with a confirmed FUTURE date
  const courseInstances = []

  if (hasConfirmedFutureDate(locations.MELBOURNE)) {
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
      startDate: toAESTOffsetISO(locations.MELBOURNE.dateObj!),
    })
  }

  if (hasConfirmedFutureDate(locations.SYDNEY)) {
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
      startDate: toAESTOffsetISO(locations.SYDNEY.dateObj!),
    })
  }

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: 'Concussion Management Clinical Course',
    description: `Comprehensive concussion management training covering SCAT6, VOMS, BESS protocols. ${CONFIG.COURSE.TOTAL_MODULES} online modules plus an optional hands-on practical day. ${CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hours online (up to ${CONFIG.COURSE.TOTAL_CPD_POINTS} with the in-person day), AHPRA-aligned, endorsed by Osteopathy Australia.`,
    provider: {
      '@type': 'Organization',
      name: 'Concussion Education Australia',
      url: CONFIG.SEO.SITE_URL,
    },
    // CREDENTIAL MUST MATCH THE PRICE PUBLISHED BESIDE IT. `offers.price` below
    // is PRICE_ONLINE ($497) — the online-only tier, which awards
    // ONLINE_CPD_POINTS. Advertising the full online+practical total against
    // the online-only price published "up to 16 CPD hours for A$497" to Google
    // and the answer engines (same defect fixed on /scat-mastery). The
    // in-person hours are named as a separately-purchased extra, not as part of
    // this offer. Numbers derive from CONFIG — never hardcode (CLAUDE.md).
    educationalCredentialAwarded: `${CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hours (online modules) - AHPRA Aligned, Endorsed by Osteopathy Australia. Up to ${CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours with the separately-priced in-person practical day (+${CONFIG.COURSE.IN_PERSON_CPD_POINTS}).`,
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

/** Plain-object EducationEvent schema, or null when the city has no LIVE
 *  future-dated round. `locationDataOverride` is injectable for tests;
 *  production callers use live CONFIG. */
export function buildEventSchema(
  location: EventLocationKey,
  locationDataOverride?: SchemaLocationData
): Record<string, unknown> | null {
  const locationData: SchemaLocationData = locationDataOverride ?? CONFIG.LOCATIONS[location]

  // Only emit EventScheduled markup for a LIVE round: a launched date
  // ('confirmed', or 'closed' = registration closed pre-workshop) that is
  // still in the future. A completed round (Melbourne June 2026) or a
  // merely-floated/collecting city must not appear in rich results as a
  // scheduled event at all — under the nomination model those cities are
  // "collecting nominations", not running a bookable event.
  const isLiveFutureRound =
    !!locationData.dateObj &&
    locationData.dateObj.getTime() > Date.now() &&
    (locationData.status === 'confirmed' || locationData.status === 'closed')
  if (!locationData.dateObj || !isLiveFutureRound) {
    return null
  }

  // Nomination-model pricing (owner decision 2026-07-02): the standing
  // sellable price is PRICE_EARLY_BIRD ($1,190); PRICE_REGULAR ($1,400) is
  // only charged in the final EARLY_BIRD_DAYS_BEFORE window of a confirmed
  // round. Mirrors isEarlyBirdForLocation() in lib/config.ts, computed from
  // the (possibly injected) locationData so fixtures stay truthful.
  const inFinalWindow =
    locationData.status === 'confirmed' &&
    Date.now() >=
      locationData.dateObj.getTime() -
        CONFIG.WORKSHOP.EARLY_BIRD_DAYS_BEFORE * 24 * 60 * 60 * 1000
  const offerPrice = inFinalWindow
    ? CONFIG.COURSE.PRICE_REGULAR
    : CONFIG.COURSE.PRICE_EARLY_BIRD

  // Confirmed workshops have a real venue (currently only Melbourne — Rydges).
  const venue = location === 'MELBOURNE' ? CONFIG.VENUE_BENEFITS.MELBOURNE : null

  // The event image must not assert the wrong city. /melbourne-workshop.jpg is
  // a poster with "MELBOURNE — JUNE 13, 2026" BURNED INTO THE ARTWORK, and this
  // builder runs for every location key (/courses/sydney renders
  // <EventSchema location="SYDNEY" />), so a Sydney EducationEvent was handing
  // Google a Melbourne-dated poster as its rich-result image. Melbourne keeps
  // its own poster; every other city gets the city-neutral workshop photo
  // already used on /in-person.
  const eventImage =
    location === 'MELBOURNE'
      ? `${CONFIG.SEO.SITE_URL}/melbourne-workshop.jpg`
      : `${CONFIG.SEO.SITE_URL}/workshop-training.jpg`

  return {
    '@context': 'https://schema.org',
    '@type': 'EducationEvent',
    name: `Concussion Management Training - ${locationData.city}`,
    description: 'Full-day practical training in SCAT6, VOMS, and BESS protocols for concussion assessment and management.',
    image: eventImage,
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
      price: offerPrice,
      priceCurrency: 'AUD',
      // A live round with seats is LimitedAvailability (capped at 12); a
      // closed-but-not-yet-run round is SoldOut — avoids misleading
      // "available" rich results for a workshop nobody can still book.
      // Completed rounds never reach here (they emit no event at all).
      availability:
        locationData.status === 'closed'
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
