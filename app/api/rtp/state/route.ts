import { NextResponse, type NextRequest } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { isRtpRequestAllowed } from '@/lib/rtp/gate'
import { ensureRtpTables, loadPathwayByCode } from '@/lib/rtp/store'
import { pathwayState } from '@/lib/rtp/protocol'

/**
 * GET /api/rtp/state?code=ABC123
 * Load the episode + symptom logs for an athlete code and return the engine's
 * pathwayState(). `now` is injected at this route boundary (current ISO) so the
 * engine stays pure/deterministic. Gated (admin/demo) + rate limited.
 */
export async function GET(request: NextRequest) {
  if (!(await isRtpRequestAllowed(request))) {
    return NextResponse.json({ error: 'Not available' }, { status: 403 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await rateLimit({ key: `rtp:state:${ip}`, limit: 120, windowSec: 60 })
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const code = new URL(request.url).searchParams.get('code')
    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 })
    }

    await ensureRtpTables()
    const loaded = await loadPathwayByCode(code)
    if (!loaded) {
      return NextResponse.json({ error: 'Pathway not found' }, { status: 404 })
    }

    // Inject `now` here — the engine never reads the clock itself.
    const now = new Date().toISOString()
    const state = pathwayState(loaded.episode, loaded.logs, now)

    return NextResponse.json({
      athleteName: loaded.athleteName,
      sport: loaded.sport,
      injuryDate: loaded.episode.injuryDate,
      status: loaded.status,
      state,
      logCount: loaded.logs.length,
    })
  } catch (error) {
    console.error('RTP state error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
