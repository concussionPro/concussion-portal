/**
 * POST /api/prospect/[token]/track
 *
 * Client-side event sink for the prospect portal (/p/[slug]). Captures
 * granular interaction signals beyond the initial landing view:
 *
 *   - section_view   : section scrolled into 50% viewport
 *   - cta_click      : CTA button/link clicked
 *   - exit           : tab closed / navigated away, with last section + dwell
 *
 * Schema piggybacks on prospect_portal_views — adds interaction_type +
 * target columns via lazy ALTER. The default interaction_type='view' on
 * existing rows preserves the old "landing" view semantics.
 *
 * Auth: relies on the access_key in the request body matching the clinic
 * record. Same model as the landing-page render.
 *
 * Bot guard: aggregator-side regex filter already exists in the engagement
 * route. We persist all UA strings here for completeness, filtering at
 * read-time.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getClinicBySlug } from '@/lib/prospect/repo'
import { accessKeyMatches } from '@/lib/prospect/access-key'

const ALLOWED_INTERACTION_TYPES = new Set([
  'view',
  'section_view',
  'cta_click',
  'exit',
])

interface TrackPayload {
  accessKey?: string
  interactionType?: string
  section?: string
  target?: string
  dwellMs?: number
}

async function ensureColumns(): Promise<void> {
  // Lazy migration — idempotent. Adds interaction_type + target.
  await sql`ALTER TABLE prospect_portal_views ADD COLUMN IF NOT EXISTS interaction_type TEXT NOT NULL DEFAULT 'view'`
  await sql`ALTER TABLE prospect_portal_views ADD COLUMN IF NOT EXISTS target TEXT`
  await sql`ALTER TABLE prospect_portal_views ADD COLUMN IF NOT EXISTS dwell_ms INTEGER`
}

function getClientIp(req: NextRequest): string | null {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]?.trim() || null
  return req.headers.get('x-real-ip')
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  let body: TrackPayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const interactionType = (body.interactionType ?? 'view').toString()
  if (!ALLOWED_INTERACTION_TYPES.has(interactionType)) {
    return NextResponse.json({ error: 'Invalid interactionType' }, { status: 400 })
  }

  // Section + target are short strings; clip aggressively.
  const section = (body.section ?? 'unknown').toString().slice(0, 64)
  const target = body.target ? body.target.toString().slice(0, 128) : null
  const dwellMs = typeof body.dwellMs === 'number' && body.dwellMs > 0 && body.dwellMs < 24 * 60 * 60 * 1000
    ? Math.round(body.dwellMs)
    : null

  // Validate clinic + access key
  const clinic = await getClinicBySlug(token)
  if (!clinic) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (!accessKeyMatches(body.accessKey, clinic)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureColumns()
  } catch (err) {
    console.error('[prospect-track] Schema migration failed:', err)
  }

  const viewerIp = getClientIp(req)
  const userAgent = req.headers.get('user-agent')

  try {
    await sql`
      INSERT INTO prospect_portal_views
        (clinic_id, viewer_ip, user_agent, section_visited, interaction_type, target, dwell_ms)
      VALUES
        (${clinic.id}, ${viewerIp}, ${userAgent}, ${section}, ${interactionType}, ${target}, ${dwellMs})
    `
  } catch (err) {
    console.error('[prospect-track] Insert failed:', err)
    return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
