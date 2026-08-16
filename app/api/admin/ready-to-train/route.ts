import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getEnrollmentsByLocation, getEnrollmentCount, getEnrollmentsWithoutLocation } from '@/lib/users'
import { CONFIG } from '@/lib/config'
import { CRM_PRACTICAL_SLUG } from '@/lib/crm-course'
import { isAdminRequest } from '@/lib/require-admin'

const CITY_LABELS: Record<string, string> = {
  sydney: 'Sydney',
  melbourne: 'Melbourne',
  'byron-bay': 'Byron Bay',
  adelaide: 'Adelaide',
  wa: 'Western Australia',
}

/**
 * GET /api/admin/ready-to-train
 *
 * Returns workshop pipeline data in 3 clear sections:
 * 1. paidEnrollments — full-course users who paid (confirmed attendees)
 * 2. readyToUpgrade — online-only users who completed modules and chose a city
 * 3. interest — pre-purchase interest registrations (browsing, not bought yet)
 */
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Paid enrollments — confirmed practical-day attendees, BOTH streams
    // (CCM full-course + CRM 'crm-practical'). See practicalDayAttendees().
    const paidEnrollments: Array<{
      city: string; label: string; count: number; threshold: number;
      registrants: Array<{ name: string; email: string; createdAt: string; stream: 'ccm' | 'crm' }>
    }> = []
    let paidTotal = 0

    for (const loc of Object.values(CONFIG.LOCATIONS)) {
      // Skip COMPLETED workshops — their registrants are ALUMNI (the workshop
      // ran), not pending paid registrants counting toward a threshold. Showing
      // Melbourne as "6/8 — 2 more to confirm" after it ran is wrong; those 6
      // live in the Alumni view now. Only collecting/confirmed cities belong in
      // the "to confirm a date" threshold board.
      if (loc.status === 'completed') continue
      const count = await getEnrollmentCount(loc.slug)
      const registrants = await getEnrollmentsByLocation(loc.slug)
      paidEnrollments.push({
        city: loc.slug,
        label: loc.city,
        count,
        threshold: CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD,
        registrants,
      })
      paidTotal += count
    }

    // 1b. Full-course sales with NO workshop location — manual sales created
    // before /admin/create-user had a city selector (plus any legacy rows).
    // Surfaced so they aren't invisible on the seat board; not counted toward
    // any city threshold.
    const noLocationRegistrants = await getEnrollmentsWithoutLocation()
    const paidNoLocation = {
      count: noLocationRegistrants.length,
      registrants: noLocationRegistrants,
    }

    // 2. Ready to upgrade (online-only users who completed modules).
    // Excludes anyone who has since bought a practical-day seat — they're
    // counted in section 1 (paidEnrollments); leaving them here double-counted
    // the same person against "Paid".
    //
    // BOTH streams count as bought: CCM full-course AND the CRM 'crm-practical'
    // entitlement (a CRM Complete/upgrade buyer keeps access_level 'preview',
    // so the access_level test alone listed PAYING seat-holders as
    // unconverted leads to chase).
    const { rows: rttRows } = await sql`
      SELECT w.city, w.email, w.name, w.registered_at, w.completed_at
      FROM workshop_ready_to_train w
      WHERE NOT EXISTS (
        SELECT 1 FROM users u
        WHERE LOWER(u.email) = LOWER(w.email)
          AND u.access_level = 'full-course'
      )
      AND NOT EXISTS (
        SELECT 1 FROM course_purchases cp
        WHERE LOWER(cp.user_email) = LOWER(w.email)
          AND cp.course_slug = ${CRM_PRACTICAL_SLUG}
      )
      ORDER BY w.city, w.registered_at DESC
    `

    // 2b. CHECKOUT NOMINATIONS — paid online-only buyers who named a city at
    // checkout and have not self-registered on /ready-to-train.
    //
    // Until 2026-08-10 this state had no occupant, so nothing read it. The
    // signup gate now routes buyers through "begin online, then upgrade", which
    // makes a checkout nomination on an online-only purchase the NORMAL path
    // rather than an edge case — and `users.workshop_location` was written by
    // the Stripe webhook and read by nobody. A buyer who paid $497 and named a
    // city was invisible on the board that decides which city runs next, which
    // is the one number the nomination model exists to produce.
    //
    // They join section 2 (the upgrade pipeline), NOT section 1: section 1 is
    // paid practical-day seats counting toward a threshold, and these people
    // have not bought a seat. Excluded if they have since bought either stream's
    // practical day, on the same basis as the self-registered pool above.
    const { rows: nominationRows } = await sql`
      SELECT u.email, u.name, u.workshop_location AS city,
             COALESCE(
               (SELECT MIN(cp.purchased_at) FROM course_purchases cp
                 WHERE LOWER(cp.user_email) = LOWER(u.email)),
               u.created_at
             ) AS nominated_at
      FROM users u
      WHERE u.access_level = 'online-only'
        AND u.workshop_location IS NOT NULL
        AND u.workshop_location <> ''
        AND NOT EXISTS (
          SELECT 1 FROM workshop_ready_to_train w
          WHERE LOWER(w.email) = LOWER(u.email) AND w.city = u.workshop_location
        )
        AND NOT EXISTS (
          SELECT 1 FROM course_purchases cp
          WHERE LOWER(cp.user_email) = LOWER(u.email)
            AND cp.course_slug = ${CRM_PRACTICAL_SLUG}
        )
      ORDER BY nominated_at DESC
    `

    // 2c. GEO SIGNAL (owner 2026-08-11): paid online-only buyers who nominated
    // NOTHING — checkout skipped (correctly) and the post-purchase ask unused.
    // Their purchase event carries likelyWorkshopCity (nearest workshop slug
    // from Stripe billing geo). Weakest of the three signals, so rows are
    // tagged 'geo' and EXCLUDED from the city counts the launch threshold
    // reads — they give "an idea of location", never a nomination.
    const { rows: geoRows } = await sql`
      SELECT u.email, u.name,
             (SELECT e.event_data->>'likelyWorkshopCity' FROM analytics_events e
               WHERE e.event_type = 'purchase_complete' AND LOWER(e.user_email) = LOWER(u.email)
               ORDER BY e.created_at DESC LIMIT 1) AS geo_city,
             COALESCE((SELECT MIN(cp.purchased_at) FROM course_purchases cp
               WHERE LOWER(cp.user_email) = LOWER(u.email)), u.created_at) AS purchased_at
      FROM users u
      WHERE u.access_level = 'online-only'
        AND (u.workshop_location IS NULL OR u.workshop_location = '')
        AND EXISTS (SELECT 1 FROM course_purchases cp WHERE LOWER(cp.user_email) = LOWER(u.email))
        AND NOT EXISTS (SELECT 1 FROM workshop_ready_to_train w WHERE LOWER(w.email) = LOWER(u.email))
        AND NOT EXISTS (SELECT 1 FROM course_purchases cp
          WHERE LOWER(cp.user_email) = LOWER(u.email) AND cp.course_slug = ${CRM_PRACTICAL_SLUG})
    `

    const readyByCity = new Map<string, Array<{ email: string; name: string; registeredAt: string; completedAt: string | null; source: 'registered' | 'checkout' | 'geo' }>>()
    for (const r of rttRows) {
      const city = r.city
      if (!readyByCity.has(city)) readyByCity.set(city, [])
      readyByCity.get(city)!.push({
        email: r.email,
        name: r.name,
        registeredAt: r.registered_at instanceof Date ? r.registered_at.toISOString() : r.registered_at,
        completedAt: r.completed_at instanceof Date ? r.completed_at.toISOString() : r.completed_at,
        source: 'registered',
      })
    }

    // Checkout nominations fold into the same per-city buckets, marked by
    // source so the board distinguishes "finished the course and asked for a
    // city" from "named a city on the way through checkout". Both are real
    // demand for that city; only the first is a warm upgrade conversation.
    for (const r of geoRows) {
      const city = typeof r.geo_city === 'string' ? r.geo_city : ''
      if (!CITY_LABELS[city]) continue
      if (!readyByCity.has(city)) readyByCity.set(city, [])
      readyByCity.get(city)!.push({
        email: r.email,
        name: r.name,
        registeredAt: r.purchased_at instanceof Date ? r.purchased_at.toISOString() : r.purchased_at,
        completedAt: null,
        source: 'geo',
      })
    }

    for (const r of nominationRows) {
      const city = r.city
      if (!readyByCity.has(city)) readyByCity.set(city, [])
      readyByCity.get(city)!.push({
        email: r.email,
        name: r.name,
        registeredAt: r.nominated_at instanceof Date ? r.nominated_at.toISOString() : r.nominated_at,
        completedAt: null,
        source: 'checkout',
      })
    }

    const readyToUpgrade: Array<{
      city: string; label: string; count: number; nominatedCount: number; geoCount: number;
      registrations: Array<{ email: string; name: string; registeredAt: string; completedAt: string | null; source: 'registered' | 'checkout' | 'geo' }>
    }> = []
    let readyTotal = 0

    for (const [city, registrations] of readyByCity) {
      registrations.sort((a, b) => +new Date(b.registeredAt) - +new Date(a.registeredAt))
      const real = registrations.filter((r) => r.source !== 'geo')
      readyToUpgrade.push({
        city,
        label: CITY_LABELS[city] || city,
        count: real.length,
        nominatedCount: registrations.filter((r) => r.source === 'checkout').length,
        geoCount: registrations.filter((r) => r.source === 'geo').length,
        registrations,
      })
      readyTotal += real.length
    }
    readyToUpgrade.sort((a, b) => b.count - a.count)

    // 3. Interest registrations (pre-purchase browsing).
    //
    // Auto-promote: anyone who later buys the full-course (access_level=
    // 'full-course' in users) is no longer a pure interest lead — they show
    // in section 1 (paidEnrollments) instead. We filter them out here at
    // display time so the audit record stays in workshop_interest, but the
    // analytics view doesn't double-count.
    //
    // Filter is "any practical-day purchase" not "same city", because someone
    // who registered WA interest and then bought Melbourne workshop has
    // converted — they're not waiting on WA anymore. Both streams count: the
    // CRM 'crm-practical' entitlement buys a seat at the SAME shared day.
    const { rows: interestRows } = await sql`
      SELECT wi.city, wi.email, wi.name, wi.source, wi.created_at
      FROM workshop_interest wi
      WHERE NOT EXISTS (
        SELECT 1 FROM users u
        WHERE LOWER(u.email) = LOWER(wi.email)
          AND u.access_level = 'full-course'
      )
      AND NOT EXISTS (
        SELECT 1 FROM course_purchases cp
        WHERE LOWER(cp.user_email) = LOWER(wi.email)
          AND cp.course_slug = ${CRM_PRACTICAL_SLUG}
      )
      -- Scanner-detonated email clicks quarantined 2026-08-16 — not demand.
      AND COALESCE(wi.source, '') NOT LIKE '%suspect%'
      ORDER BY wi.city, wi.created_at DESC
    `

    const interestByCity = new Map<string, Array<{ email: string; name: string; source: string; createdAt: string }>>()
    for (const r of interestRows) {
      const city = r.city
      if (!interestByCity.has(city)) interestByCity.set(city, [])
      interestByCity.get(city)!.push({
        email: r.email,
        name: r.name,
        source: r.source,
        createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
      })
    }

    const interest: Array<{
      city: string; label: string; count: number;
      registrations: Array<{ email: string; name: string; source: string; createdAt: string }>
    }> = []
    let interestTotal = 0

    for (const [city, registrations] of interestByCity) {
      interest.push({
        city,
        label: CITY_LABELS[city] || city,
        count: registrations.length,
        registrations,
      })
      interestTotal += registrations.length
    }
    interest.sort((a, b) => b.count - a.count)

    // 4. Date votes — one-click nominations from the date-announce email
    // (workshop_date_votes). The pre-venue fill signal: names per city, so
    // venues get booked on numbers, not hope.
    let dateVotes: Array<{ city: string; votes: Array<{ email: string; createdAt: string }> }> = []
    try {
      const { listVotes } = await import('@/lib/workshop-votes')
      const votes = await listVotes()
      const byCity = new Map<string, Array<{ email: string; createdAt: string }>>()
      for (const v of votes) {
        if (!byCity.has(v.city)) byCity.set(v.city, [])
        byCity.get(v.city)!.push({ email: v.email, createdAt: v.created_at })
      }
      dateVotes = Array.from(byCity.entries())
        .map(([city, vs]) => ({ city, votes: vs }))
        .sort((a, b) => b.votes.length - a.votes.length)
    } catch (err) {
      console.error('[ready-to-train] date-votes load failed (non-fatal):', err)
    }

    return NextResponse.json({
      success: true,
      paidEnrollments,
      paidTotal,
      paidNoLocation,
      readyToUpgrade,
      readyTotal,
      interest,
      interestTotal,
      dateVotes,
    })
  } catch (error) {
    console.error('Admin ready-to-train API error:', error)
    return NextResponse.json(
      { error: 'Failed to load workshop pipeline data' },
      { status: 500 }
    )
  }
}
