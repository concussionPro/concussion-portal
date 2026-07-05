import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

/**
 * GET /api/admin/sst-outreach — the SST launch funnel, replies-only doctrine
 * (owner 2026-07-06): clinics provisioned → activated (first patient within
 * 14 days) → patients on program → sessions this week. Feeds the dedicated
 * SST Outreach tab in /admin/analytics. Cold-sequence send/reply counts join
 * here once the SST sequence goes live in the prospect engine.
 */
export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { rows: clinics } = await sql<{
      code: string
      clinic_name: string
      email: string
      created_at: string
      patients: number
      sessions: number
      first_session_at: string | null
      last_activity: string | null
    }>`
      SELECT
        c.code,
        c.clinic_name,
        c.email,
        c.created_at::text,
        COALESCE(s.patients, 0)::int AS patients,
        COALESCE(s.sessions, 0)::int AS sessions,
        s.first_session_at::text,
        s.last_activity::text
      FROM sst_clinics c
      LEFT JOIN (
        SELECT
          upper(clinic_code) AS code,
          COUNT(DISTINCT NULLIF(trim(coalesce(patient_label, '')), '')) AS patients,
          COUNT(*) AS sessions,
          MIN(created_at) AS first_session_at,
          MAX(created_at) AS last_activity
        FROM sst_clinic_sessions
        GROUP BY upper(clinic_code)
      ) s ON s.code = upper(c.code)
      WHERE upper(c.code) <> 'DEMO00'
      ORDER BY c.created_at DESC
    `
    const { rows: weekly } = await sql<{ n: number }>`
      SELECT COUNT(*)::int AS n FROM sst_clinic_sessions
      WHERE created_at >= NOW() - INTERVAL '7 days' AND upper(clinic_code) <> 'DEMO00'
    `
    const provisioned = clinics.length
    // Activated = first patient session within 14 days of provisioning — THE
    // activation metric; a clinic dark for 14 days gets the concierge touch.
    const activated = clinics.filter((c) => {
      if (!c.first_session_at) return false
      return (
        new Date(c.first_session_at).getTime() - new Date(c.created_at).getTime() <=
        14 * 86_400_000
      )
    }).length
    const dark14 = clinics.filter(
      (c) => !c.first_session_at && Date.now() - new Date(c.created_at).getTime() > 14 * 86_400_000,
    ).length

    return NextResponse.json({
      summary: {
        provisioned,
        activated,
        activationRate: provisioned > 0 ? activated / provisioned : 0,
        dark14,
        totalPatients: clinics.reduce((a, c) => a + c.patients, 0),
        sessionsThisWeek: weekly[0]?.n ?? 0,
        // joined when the SST cold sequence ships in the prospect engine
        coldSends: null,
        coldReplies: null,
      },
      clinics: clinics.map((c) => ({
        code: c.code,
        name: c.clinic_name,
        createdAt: c.created_at,
        patients: c.patients,
        sessions: c.sessions,
        firstSessionAt: c.first_session_at,
        lastActivity: c.last_activity,
        activated:
          !!c.first_session_at &&
          new Date(c.first_session_at).getTime() - new Date(c.created_at).getTime() <=
            14 * 86_400_000,
        needsConcierge:
          !c.first_session_at && Date.now() - new Date(c.created_at).getTime() > 14 * 86_400_000,
      })),
    })
  } catch (err) {
    console.error('sst-outreach analytics error:', err)
    return NextResponse.json({ error: 'query failed' }, { status: 500 })
  }
}
