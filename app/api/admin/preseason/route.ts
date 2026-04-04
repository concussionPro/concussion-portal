import { NextRequest, NextResponse } from 'next/server'
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

/**
 * GET /api/admin/preseason
 * Returns preseason clinic registrations and baseline submission data.
 * Both from Postgres.
 */
export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Load clinics from Postgres
    const { rows: clinicRows } = await sql`
      SELECT clinic_name, contact_name, email, code, created_at
      FROM preseason_clinics
      ORDER BY created_at DESC
    `
    const clinics = clinicRows.map(r => ({
      clinicName: r.clinic_name,
      contactName: r.contact_name,
      email: r.email,
      code: r.code,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    }))

    // Load baselines from Postgres
    const { rows: baselineRows } = await sql`
      SELECT clinic_code, clinic_name, athlete_name, submitted_at, symptom_count, symptom_severity, cognitive_score
      FROM preseason_baselines
      ORDER BY submitted_at DESC
    `
    const baselines = baselineRows.map(r => ({
      clinicCode: r.clinic_code,
      clinicName: r.clinic_name,
      athleteName: r.athlete_name,
      submittedAt: r.submitted_at instanceof Date ? r.submitted_at.toISOString() : r.submitted_at,
      symptomCount: r.symptom_count,
      symptomSeverity: r.symptom_severity,
      cognitiveScore: r.cognitive_score,
    }))

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
