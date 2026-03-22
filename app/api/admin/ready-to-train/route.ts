import { NextRequest, NextResponse } from 'next/server'
import { list as listBlobs } from '@vercel/blob'
import crypto from 'crypto'
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
 * Returns all ready-to-train pool data grouped by city.
 */
export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { blobs } = await listBlobs()

    // Find all ready-to-train blob files
    const rttBlobs = blobs.filter(b => b.pathname.startsWith('ready-to-train-'))

    // Group by city (take most recent blob per pathname)
    const blobsByPath = new Map<string, typeof blobs[0]>()
    for (const blob of rttBlobs) {
      const existing = blobsByPath.get(blob.pathname)
      if (!existing || new Date(blob.uploadedAt) > new Date(existing.uploadedAt)) {
        blobsByPath.set(blob.pathname, blob)
      }
    }

    const cities = []
    let totalCount = 0

    for (const [pathname, blob] of blobsByPath) {
      const citySlug = pathname.replace('ready-to-train-', '').replace('.json', '')
      try {
        const res = await fetch(`${blob.url}?t=${Date.now()}`, { cache: 'no-store' })
        const registrations = await res.json()
        const count = registrations.length

        cities.push({
          city: citySlug,
          label: CITY_LABELS[citySlug] || citySlug,
          count,
          registrations,
        })
        totalCount += count
      } catch (err) {
        console.warn(`Failed to read ${pathname}:`, err)
      }
    }

    // Sort by count descending
    cities.sort((a, b) => b.count - a.count)

    // Paid threshold data — per-city full-course enrollments from Postgres
    const paidThreshold: Array<{
      city: string; label: string; count: number; threshold: number;
      registrants: Array<{ name: string; email: string; createdAt: string }>
    }> = []
    let paidTotal = 0

    for (const loc of Object.values(CONFIG.LOCATIONS)) {
      const count = await getEnrollmentCount(loc.slug)
      const registrants = await getEnrollmentsByLocation(loc.slug)
      paidThreshold.push({
        city: loc.slug,
        label: loc.city,
        count,
        threshold: CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD,
        registrants,
      })
      paidTotal += count
    }

    return NextResponse.json({
      success: true,
      totalCount,
      cities,
      paidThreshold,
      paidTotal,
    })
  } catch (error) {
    console.error('Admin ready-to-train API error:', error)
    return NextResponse.json(
      { error: 'Failed to load ready-to-train data' },
      { status: 500 }
    )
  }
}
