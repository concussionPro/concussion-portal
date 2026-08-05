import { NextResponse, type NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { CONFIG } from '@/lib/config'
import { rateLimit } from '@/lib/rate-limit'
import { isRtpRequestAllowed } from '@/lib/rtp/gate'
import { ensureRtpTables, generateUniqueCode } from '@/lib/rtp/store'

const ORG_TYPES = new Set(['club', 'school', 'association'])

/**
 * POST /api/rtp/register-org
 * Create an organisation (club / school / association) and return its share
 * code — athletes pair to it via /api/rtp/athlete. Gated (admin/demo) + rate
 * limited until launch.
 */
export async function POST(request: NextRequest) {
  if (!(await isRtpRequestAllowed(request))) {
    return NextResponse.json({ error: 'Not available' }, { status: 403 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await rateLimit({ key: `rtp:register-org:${ip}`, limit: 10, windowSec: 3600 })
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body = (await request.json()) as {
      name?: string
      type?: string
      sport?: string
    }

    const name = (body.name || '').trim()
    if (!name) {
      return NextResponse.json({ error: 'Organisation name is required' }, { status: 400 })
    }
    const type = ORG_TYPES.has(body.type || '') ? body.type! : 'club'
    const sport = (body.sport || '').trim() || null

    await ensureRtpTables()
    const shareCode = await generateUniqueCode('rtp_orgs')

    const { rows } = await sql`
      INSERT INTO rtp_orgs (name, type, sport, share_code)
      VALUES (${name}, ${type}, ${sport}, ${shareCode})
      RETURNING id
    `

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || CONFIG.APP_URL
    return NextResponse.json({
      success: true,
      orgId: rows[0].id,
      shareCode,
      // Athletes onboard against this org code via the athlete surface.
      athleteJoinLink: `${baseUrl}/rtp/a/new?org=${shareCode}`,
    })
  } catch (error) {
    console.error('RTP register-org error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
