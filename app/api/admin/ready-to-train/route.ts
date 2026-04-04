import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { sql } from '@/lib/db'
import { getEnrollmentsByLocation, getEnrollmentCount } from '@/lib/users'
import { CONFIG } from '@/lib/config'

const CITY_LABELS: Record<string, string> = {
  sydney: 'Sydney',
  melbourne: 'Melbourne',
  'byron-bay': 'Byron Bay',
  adelaide: 'Adelaide',
  wa: 'Western Australia',
}

function timingSafeCompare(a: string, b: string): boolean {
  const aHash = crypto.createHmac('sha256', 'compare').update(a).digest()
  const bHash = crypto.createHmac('sha256', 'compare').update(b).digest()
  return crypto.timingSafeEqual(aHash, bHash)
}

function isAdminAuthorized(request: NextRequest): boolean {
  const expected = process.env.ADMIN_API_KEY
  if (!expected) return false
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey && timingSafeCompare(adminKey, expected)) return true
  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (bearer && timingSafeCompare(bearer, expected)) return true
  return false
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
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Paid enrollments (from users table — confirmed workshop attendees)
    const paidEnrollments: Array<{
      city: string; label: string; count: number; threshold: number;
      registrants: Array<{ name: string; email: string; createdAt: string }>
    }> = []
    let paidTotal = 0

    for (const loc of Object.values(CONFIG.LOCATIONS)) {
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

    // 2. Ready to upgrade (online-only users who completed modules)
    const { rows: rttRows } = await sql`
      SELECT city, email, name, registered_at, completed_at
      FROM workshop_ready_to_train
      ORDER BY city, registered_at DESC
    `

    const readyByCity = new Map<string, Array<{ email: string; name: string; registeredAt: string; completedAt: string }>>()
    for (const r of rttRows) {
      const city = r.city
      if (!readyByCity.has(city)) readyByCity.set(city, [])
      readyByCity.get(city)!.push({
        email: r.email,
        name: r.name,
        registeredAt: r.registered_at instanceof Date ? r.registered_at.toISOString() : r.registered_at,
        completedAt: r.completed_at instanceof Date ? r.completed_at.toISOString() : r.completed_at,
      })
    }

    const readyToUpgrade: Array<{
      city: string; label: string; count: number;
      registrations: Array<{ email: string; name: string; registeredAt: string; completedAt: string }>
    }> = []
    let readyTotal = 0

    for (const [city, registrations] of readyByCity) {
      readyToUpgrade.push({
        city,
        label: CITY_LABELS[city] || city,
        count: registrations.length,
        registrations,
      })
      readyTotal += registrations.length
    }
    readyToUpgrade.sort((a, b) => b.count - a.count)

    // 3. Interest registrations (pre-purchase browsing)
    const { rows: interestRows } = await sql`
      SELECT city, email, name, source, created_at
      FROM workshop_interest
      ORDER BY city, created_at DESC
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

    return NextResponse.json({
      success: true,
      paidEnrollments,
      paidTotal,
      readyToUpgrade,
      readyTotal,
      interest,
      interestTotal,
    })
  } catch (error) {
    console.error('Admin ready-to-train API error:', error)
    return NextResponse.json(
      { error: 'Failed to load workshop pipeline data' },
      { status: 500 }
    )
  }
}
