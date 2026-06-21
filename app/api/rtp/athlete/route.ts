import { NextResponse, type NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { CONFIG } from '@/lib/config'
import { rateLimit } from '@/lib/rate-limit'
import { isRtpRequestAllowed } from '@/lib/rtp/gate'
import {
  ensureRtpTables,
  generateUniqueCode,
  ageBand,
  appendRegistryEvent,
} from '@/lib/rtp/store'

/**
 * Age below which a parent/guardian must also consent. Mirrors the preseason
 * tool's working threshold (legal capacity for health-data consent varies by
 * state/information type — confirm with legal advice before launch).
 */
const MINOR_CONSENT_AGE = 16

function ageFromDob(dob?: string): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

interface ConsentData {
  agreed?: boolean
  atISO?: string
  version?: string
  guardian?: { name?: string; agreed?: boolean }
}

/**
 * POST /api/rtp/athlete
 * Onboard an athlete (paired to an org via share code, or a standalone free
 * individual), record consent, and open their concussion episode + pathway
 * (GRTS stage 0, RTL stage 0). Gated (admin/demo) + rate limited until launch.
 *
 * Consent is mandatory (APP 3.3 / APP 5): rejected unless consent.agreed===true;
 * under-16s additionally require a guardian consent — the engine's clinical
 * logic never runs on data collected without consent.
 */
export async function POST(request: NextRequest) {
  if (!isRtpRequestAllowed(request)) {
    return NextResponse.json({ error: 'Not available' }, { status: 403 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await rateLimit({ key: `rtp:athlete:${ip}`, limit: 20, windowSec: 3600 })
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body = (await request.json()) as {
      orgCode?: string
      name?: string
      dob?: string
      sex?: string
      parentEmail?: string
      injuryDate?: string
      sport?: string
      mechanism?: string
      consent?: ConsentData
    }

    // ── Consent (mandatory before ANY health data is stored) ────────────────
    if (body.consent?.agreed !== true) {
      return NextResponse.json(
        { error: 'Consent is required to start tracking.' },
        { status: 400 },
      )
    }
    const age = ageFromDob(body.dob)
    if (age !== null && age < MINOR_CONSENT_AGE && body.consent.guardian?.agreed !== true) {
      return NextResponse.json(
        { error: 'A parent/guardian must consent for athletes under 16.' },
        { status: 400 },
      )
    }

    const name = (body.name || '').trim()
    if (!name) {
      return NextResponse.json({ error: 'Athlete name is required' }, { status: 400 })
    }
    if (!body.injuryDate || isNaN(new Date(body.injuryDate).getTime())) {
      return NextResponse.json({ error: 'A valid injury date is required' }, { status: 400 })
    }

    await ensureRtpTables()

    // ── Resolve org pairing (optional — standalone individuals allowed) ─────
    let orgId: number | null = null
    let orgSport: string | null = null
    if (body.orgCode) {
      const { rows } = await sql`
        SELECT id, sport FROM rtp_orgs WHERE share_code = ${body.orgCode.toUpperCase()} LIMIT 1
      `
      if (rows.length === 0) {
        return NextResponse.json({ error: 'Invalid organisation code' }, { status: 404 })
      }
      orgId = rows[0].id
      orgSport = rows[0].sport
    }

    const sport = (body.sport || '').trim() || orgSport || null
    const shareCode = await generateUniqueCode('rtp_athletes')

    // Build the stored consent record (normalised).
    const consentRecord = {
      agreed: true,
      atISO: body.consent.atISO || new Date().toISOString(),
      version: body.consent.version || 'rtp-v1',
      ...(body.consent.guardian?.agreed
        ? { guardian: { name: (body.consent.guardian.name || '').trim(), agreed: true } }
        : {}),
    }

    // ── Insert athlete ──────────────────────────────────────────────────────
    const { rows: athleteRows } = await sql`
      INSERT INTO rtp_athletes (org_id, name, dob, sex, parent_email, share_code, consent)
      VALUES (
        ${orgId}, ${name}, ${body.dob || null}, ${body.sex || null},
        ${body.parentEmail?.toLowerCase() || null}, ${shareCode}, ${JSON.stringify(consentRecord)}::jsonb
      )
      RETURNING id
    `
    const athleteId = athleteRows[0].id

    // ── Open the episode ──────────────────────────────────────────────────────
    const { rows: epRows } = await sql`
      INSERT INTO rtp_episodes (athlete_id, injury_date, sport, mechanism, status)
      VALUES (${athleteId}, ${body.injuryDate}, ${sport}, ${body.mechanism || null}, 'active')
      RETURNING id
    `
    const episodeId = epRows[0].id

    // ── Open the pathway at GRTS 0 / RTL 0 (stage clock starts now) ──────────
    await sql`
      INSERT INTO rtp_pathways (episode_id, grts_stage, rtl_stage, stage_entered_at)
      VALUES (${episodeId}, 0, 0, now())
    `

    // De-identified registry: a new episode was opened.
    await appendRegistryEvent({
      sport,
      ageBand: ageBand(body.dob),
      injuryToReturnDays: null,
      eventType: 'episode-opened',
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || CONFIG.APP_URL
    return NextResponse.json({
      success: true,
      shareCode,
      pathwayLink: `${baseUrl}/rtp/a/${shareCode}`,
    })
  } catch (error) {
    console.error('RTP athlete onboarding error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
