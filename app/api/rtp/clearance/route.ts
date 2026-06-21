import { NextResponse, type NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'
import { ensureRtpTables, loadPathwayByCode, appendRegistryEvent, ageBand } from '@/lib/rtp/store'

/**
 * POST /api/rtp/clearance
 * Record a medical-practitioner clearance for an athlete's episode and set
 * pathway.cleared_for_contact. ADMIN / CLINICIAN ONLY — gated by isAdminRequest
 * (the tool tracks and recommends; only a clinician records the contact gate).
 */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as {
      code?: string
      clinicianName?: string
      clinicianEmail?: string
      clearedFor?: string
      note?: string
    }

    if (!body.code) {
      return NextResponse.json({ error: 'Missing athlete code' }, { status: 400 })
    }
    const clinicianName = (body.clinicianName || '').trim()
    if (!clinicianName) {
      return NextResponse.json({ error: 'Clinician name is required' }, { status: 400 })
    }
    const clearedFor =
      body.clearedFor === 'competition' ? 'competition' : 'contact training'

    await ensureRtpTables()
    const loaded = await loadPathwayByCode(body.code)
    if (!loaded) {
      return NextResponse.json({ error: 'Pathway not found' }, { status: 404 })
    }

    const { rows } = await sql`
      INSERT INTO rtp_clearances (episode_id, clinician_name, clinician_email, cleared_for, note)
      VALUES (
        ${loaded.episodeId}, ${clinicianName}, ${body.clinicianEmail?.toLowerCase() || null},
        ${clearedFor}, ${(body.note || '').trim() || null}
      )
      RETURNING id
    `
    const clearanceId = rows[0].id

    await sql`
      UPDATE rtp_pathways
      SET cleared_for_contact = true, clearance_id = ${clearanceId}
      WHERE id = ${loaded.pathwayId}
    `

    await appendRegistryEvent({
      sport: loaded.sport,
      ageBand: ageBand(loaded.dob),
      injuryToReturnDays: null,
      eventType: 'clearance-recorded',
    })

    return NextResponse.json({ success: true, clearanceId })
  } catch (error) {
    console.error('RTP clearance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
