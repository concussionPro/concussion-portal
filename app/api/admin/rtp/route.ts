import { NextResponse, type NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'
import { ensureRtpTables, rowToEpisode, type EpisodeRow } from '@/lib/rtp/store'
import { pathwayState } from '@/lib/rtp/protocol'

/**
 * GET /api/admin/rtp
 * Admin roster — orgs plus every athlete with their current pathway state
 * (computed via the engine, `now` injected here). Gated by middleware AND
 * isAdminRequest.
 */
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureRtpTables()

    const { rows: orgRows } = await sql`
      SELECT o.id, o.name, o.type, o.sport, o.share_code, o.created_at,
        (SELECT COUNT(*) FROM rtp_athletes a WHERE a.org_id = o.id) AS athlete_count
      FROM rtp_orgs o
      ORDER BY o.created_at DESC
    `

    // Each athlete's most-recent episode + pathway.
    const { rows: athleteRows } = await sql`
      SELECT DISTINCT ON (a.id)
        a.id AS athlete_id, a.name AS athlete_name, a.share_code, a.dob, a.org_id,
        o.name AS org_name,
        e.id AS episode_id, e.injury_date, e.sport, e.status,
        p.grts_stage, p.rtl_stage, p.symptom_free_date,
        p.stage_entered_at, p.stage_baseline_pcss, p.cleared_for_contact
      FROM rtp_athletes a
      JOIN rtp_episodes e ON e.athlete_id = a.id
      JOIN rtp_pathways p ON p.episode_id = e.id
      LEFT JOIN rtp_orgs o ON o.id = a.org_id
      ORDER BY a.id, e.created_at DESC
    `

    const now = new Date().toISOString()
    const athletes = await Promise.all(
      athleteRows.map(async (r) => {
        const { rows: logRows } = await sql`
          SELECT logged_at, pcss_total, red_flag
          FROM rtp_symptom_logs WHERE episode_id = ${r.episode_id}
          ORDER BY logged_at ASC
        `
        const logs = logRows.map((l) => ({
          loggedAt: l.logged_at instanceof Date ? l.logged_at.toISOString() : String(l.logged_at),
          pcssTotal: Number(l.pcss_total ?? 0),
          redFlag: l.red_flag === true,
        }))
        const state = pathwayState(rowToEpisode(r as EpisodeRow), logs, now)
        return {
          athleteName: r.athlete_name,
          shareCode: r.share_code,
          orgName: r.org_name ?? null,
          sport: r.sport ?? null,
          injuryDate: r.injury_date,
          status: r.status,
          grtsStage: state.grtsStage,
          grtsStageName: state.grtsStageName,
          rtlStage: state.rtlStage,
          rtlStageName: state.rtlStageName,
          earliestContactDate: state.earliestContactDate,
          redFlag: state.redFlag,
          awaitingClearance: state.awaitingClearance,
          eligibleToAdvance: state.advance.eligible,
          statusLine: state.status,
        }
      }),
    )

    return NextResponse.json({
      orgs: orgRows.map((o) => ({
        id: o.id,
        name: o.name,
        type: o.type,
        sport: o.sport,
        shareCode: o.share_code,
        athleteCount: Number(o.athlete_count ?? 0),
        createdAt: o.created_at instanceof Date ? o.created_at.toISOString() : o.created_at,
      })),
      athletes,
    })
  } catch (error) {
    console.error('RTP admin roster error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
