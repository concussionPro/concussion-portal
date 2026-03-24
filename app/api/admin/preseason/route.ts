import { NextRequest, NextResponse } from 'next/server'
import { get as getBlob, list as listBlobs } from '@vercel/blob'
import crypto from 'crypto'
import { sql } from '@/lib/db'

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

interface ClinicRegistration {
  clinicName: string
  contactName: string
  email: string
  code: string
  createdAt: string
}

interface BaselineSubmission {
  clinicCode: string
  clinicName?: string
  submittedAt: string
  athleteName?: string
  symptomCount?: number
  symptomSeverity?: number
  cognitiveScore?: number
}

/**
 * GET /api/admin/preseason
 * Returns preseason clinic registrations and baseline submission data.
 * Clinics: Blob storage (preseason-clinics.json)
 * Baselines: Postgres (preseason_baselines table)
 */
export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let clinics: ClinicRegistration[] = []
    let baselines: BaselineSubmission[] = []

    // Load clinics from Blob (still on Blob — KV is source of truth, Blob is the admin list)
    try {
      let blob = await getBlob('preseason-clinics.json', { access: 'private' })
      if (!blob) {
        const { blobs } = await listBlobs({ prefix: 'preseason-clinics' })
        const sorted = blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        if (sorted.length > 0) {
          blob = await getBlob(sorted[0].url, { access: 'private' })
        }
      }
      if (blob && blob.statusCode === 200 && blob.stream) {
        const text = await new Response(blob.stream).text()
        clinics = JSON.parse(text)
      }
    } catch (err) {
      console.warn('Failed to load preseason clinics:', err)
    }

    // Load baselines from Postgres (migrated from lossy Blob read-modify-write)
    try {
      const { rows } = await sql`
        SELECT clinic_code, clinic_name, athlete_name, submitted_at, symptom_count, symptom_severity, cognitive_score
        FROM preseason_baselines
        ORDER BY submitted_at DESC
      `
      baselines = rows.map(r => ({
        clinicCode: r.clinic_code,
        clinicName: r.clinic_name,
        athleteName: r.athlete_name,
        submittedAt: r.submitted_at instanceof Date ? r.submitted_at.toISOString() : r.submitted_at,
        symptomCount: r.symptom_count,
        symptomSeverity: r.symptom_severity,
        cognitiveScore: r.cognitive_score,
      }))
    } catch (err) {
      console.warn('Failed to load preseason baselines from Postgres:', err)
      // Fallback: try Blob for old data
      try {
        let blob = await getBlob('preseason-baselines.json', { access: 'private' })
        if (!blob) {
          const { blobs } = await listBlobs({ prefix: 'preseason-baselines' })
          const sorted = blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
          if (sorted.length > 0) {
            blob = await getBlob(sorted[0].url, { access: 'private' })
          }
        }
        if (blob && blob.statusCode === 200 && blob.stream) {
          const text = await new Response(blob.stream).text()
          baselines = JSON.parse(text)
        }
      } catch {
        // Both sources failed
      }
    }

    return NextResponse.json({
      success: true,
      clinics,
      totalClinics: clinics.length,
      baselines,
      totalBaselines: baselines.length,
    })
  } catch (error) {
    console.error('Admin preseason API error:', error)
    return NextResponse.json(
      { error: 'Failed to load preseason data' },
      { status: 500 }
    )
  }
}
