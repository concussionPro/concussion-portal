import { NextResponse, type NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { isRtpRequestAllowed } from '@/lib/rtp/gate'
import {
  ensureRtpTables,
  loadPathwayByCode,
  appendRegistryEvent,
  ageBand,
} from '@/lib/rtp/store'
import { applySymptomLog, pathwayState, type SymptomLog } from '@/lib/rtp/protocol'
import { PCSS_TOTAL_MAX } from '@/lib/rtp/symptoms'

/**
 * POST /api/rtp/symptom-log
 * Append a daily check-in for an athlete, run the engine's applySymptomLog
 * (the 24-hour-rule within-stage regression), persist the updated pathway, and
 * return the refreshed pathwayState. Gated (admin/demo) + rate limited.
 *
 * The engine is the single source of clinical truth: this route NEVER decides a
 * stage change itself — it persists whatever applySymptomLog returns.
 */
export async function POST(request: NextRequest) {
  if (!(await isRtpRequestAllowed(request))) {
    return NextResponse.json({ error: 'Not available' }, { status: 403 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await rateLimit({ key: `rtp:symptom-log:${ip}`, limit: 60, windowSec: 3600 })
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body = (await request.json()) as {
      code?: string
      pcssTotal?: number
      dominantSymptoms?: string[]
      redFlag?: boolean
    }

    if (!body.code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 })
    }
    const pcssTotal = Math.max(0, Math.min(PCSS_TOTAL_MAX, Math.round(Number(body.pcssTotal ?? 0))))
    const redFlag = body.redFlag === true
    const dominant = Array.isArray(body.dominantSymptoms)
      ? body.dominantSymptoms.slice(0, 22).map(String)
      : []

    await ensureRtpTables()
    const loaded = await loadPathwayByCode(body.code)
    if (!loaded) {
      return NextResponse.json({ error: 'Pathway not found' }, { status: 404 })
    }

    const loggedAt = new Date().toISOString()

    // 1. Persist the raw check-in.
    await sql`
      INSERT INTO rtp_symptom_logs (episode_id, logged_at, pcss_total, dominant_symptoms, red_flag)
      VALUES (${loaded.episodeId}, ${loggedAt}, ${pcssTotal}, ${JSON.stringify(dominant)}::jsonb, ${redFlag})
    `

    // 2. Run the engine's 24-hour-rule regression on this single log.
    const log: SymptomLog = { loggedAt, pcssTotal, redFlag }
    const before = loaded.episode
    const after = applySymptomLog(before, log)

    // 3. First time symptom-free (PCSS 0, no red flag) starts the 14-day clock.
    const newSymptomFree =
      !after.symptomFreeDate && pcssTotal === 0 && !redFlag
        ? loggedAt.slice(0, 10)
        : after.symptomFreeDate ?? null

    // 4. Persist whatever the engine decided (stage / clock / baseline).
    await sql`
      UPDATE rtp_pathways
      SET grts_stage = ${after.grtsStage},
          stage_entered_at = ${after.stageEnteredAt},
          stage_baseline_pcss = ${after.stageBaselinePcss ?? null},
          symptom_free_date = ${newSymptomFree}
      WHERE id = ${loaded.pathwayId}
    `

    // 5. De-identified registry on a regression or red-flag transition.
    if (after.grtsStage < before.grtsStage) {
      await appendRegistryEvent({
        sport: loaded.sport,
        ageBand: ageBand(loaded.dob),
        injuryToReturnDays: null,
        eventType: 'stage-regression',
      })
    }
    if (redFlag) {
      await appendRegistryEvent({
        sport: loaded.sport,
        ageBand: ageBand(loaded.dob),
        injuryToReturnDays: null,
        eventType: 'red-flag',
      })
      await sql`UPDATE rtp_episodes SET status = 'referred' WHERE id = ${loaded.episodeId}`
    }

    // 6. Recompute and return the fresh state (now injected at the boundary).
    const refreshed = { ...after, symptomFreeDate: newSymptomFree ?? undefined }
    const allLogs = [...loaded.logs, { loggedAt, pcssTotal, redFlag }]
    const state = pathwayState(refreshed, allLogs, new Date().toISOString())

    return NextResponse.json({ success: true, state })
  } catch (error) {
    console.error('RTP symptom-log error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
