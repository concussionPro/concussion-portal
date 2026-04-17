import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

/**
 * GET /api/admin/preseason
 * Returns preseason clinic registrations and baseline submission data.
 * Both from Postgres.
 */
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
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
