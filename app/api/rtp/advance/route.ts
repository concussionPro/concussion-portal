import { NextResponse, type NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { isRtpRequestAllowed } from '@/lib/rtp/gate'
import {
  ensureRtpTables,
  loadPathwayByCode,
  appendRegistryEvent,
  ageBand,
  clampRtl,
} from '@/lib/rtp/store'
import {
  canAdvanceGrts,
  pathwayState,
  GRTS_RETURN_STAGE,
  RTL_COMPLETE_STAGE,
  type GrtsStage,
} from '@/lib/rtp/protocol'

const MS_PER_DAY = 86_400_000

/**
 * POST /api/rtp/advance  { code, track: 'grts' | 'rtl' }
 * Advance a pathway one stage. The GRTS track is gated by the engine — this
 * route re-runs canAdvanceGrts() server-side and refuses if not eligible, so
 * the engine is the single source of truth even for the write path. The RTL
 * track is athlete/parent self-reported school progress (no clinical gate),
 * capped at full-time school (stage 4). Gated (admin/demo) + rate limited.
 */
export async function POST(request: NextRequest) {
  if (!isRtpRequestAllowed(request)) {
    return NextResponse.json({ error: 'Not available' }, { status: 403 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await rateLimit({ key: `rtp:advance:${ip}`, limit: 60, windowSec: 3600 })
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body = (await request.json()) as { code?: string; track?: 'grts' | 'rtl' }
    if (!body.code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 })
    }
    const track = body.track === 'rtl' ? 'rtl' : 'grts'

    await ensureRtpTables()
    const loaded = await loadPathwayByCode(body.code)
    if (!loaded) {
      return NextResponse.json({ error: 'Pathway not found' }, { status: 404 })
    }

    const now = new Date().toISOString()

    // ── RTL track: self-reported, capped at full-time school ────────────────
    if (track === 'rtl') {
      const nextRtl = clampRtl(loaded.episode.rtlStage + 1)
      if (nextRtl === loaded.episode.rtlStage) {
        return NextResponse.json({ error: 'Already at full-time school.' }, { status: 400 })
      }
      await sql`UPDATE rtp_pathways SET rtl_stage = ${nextRtl} WHERE id = ${loaded.pathwayId}`
      const state = pathwayState({ ...loaded.episode, rtlStage: nextRtl }, loaded.logs, now)
      if (nextRtl === RTL_COMPLETE_STAGE) {
        await appendRegistryEvent({
          sport: loaded.sport,
          ageBand: ageBand(loaded.dob),
          injuryToReturnDays: null,
          eventType: 'rtl-complete',
        })
      }
      return NextResponse.json({ success: true, state })
    }

    // ── GRTS track: the engine decides eligibility ──────────────────────────
    const check = canAdvanceGrts(loaded.episode, loaded.logs, now)
    if (!check.eligible) {
      return NextResponse.json(
        { error: 'Not eligible to advance', reason: check.reason, blockedBy: check.blockedBy },
        { status: 409 },
      )
    }

    const nextStage = (loaded.episode.grtsStage + 1) as GrtsStage
    // New stage resets the 24-hour clock and the worsening baseline.
    await sql`
      UPDATE rtp_pathways
      SET grts_stage = ${nextStage},
          stage_entered_at = ${now},
          stage_baseline_pcss = NULL
      WHERE id = ${loaded.pathwayId}
    `

    // Reaching return-to-competition closes the episode + writes the outcome.
    if (nextStage >= GRTS_RETURN_STAGE) {
      await sql`UPDATE rtp_episodes SET status = 'cleared' WHERE id = ${loaded.episodeId}`
      const days = Math.max(
        0,
        Math.round((Date.parse(now) - Date.parse(loaded.episode.injuryDate)) / MS_PER_DAY),
      )
      await appendRegistryEvent({
        sport: loaded.sport,
        ageBand: ageBand(loaded.dob),
        injuryToReturnDays: days,
        eventType: 'returned-to-competition',
      })
    } else {
      await appendRegistryEvent({
        sport: loaded.sport,
        ageBand: ageBand(loaded.dob),
        injuryToReturnDays: null,
        eventType: 'stage-advance',
      })
    }

    const state = pathwayState(
      { ...loaded.episode, grtsStage: nextStage, stageEnteredAt: now, stageBaselinePcss: undefined },
      loaded.logs,
      now,
    )
    return NextResponse.json({ success: true, state })
  } catch (error) {
    console.error('RTP advance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
