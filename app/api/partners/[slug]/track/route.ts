/**
 * POST /api/partners/[slug]/track
 *
 * Client-side event sink for the partner pitch portal (/partners/[slug]).
 * Same contract as the prospect track route, but writes to partner_portal_views
 * keyed to partner_institutions. Captures section_view / cta_click / exit so the
 * partnerships analytics segment can show real engagement, not just sends.
 * (Zac 2026-06-27 — sweep all outreach tracking into analytics.)
 *
 * Auth: body.accessKey must match the partner's access_key (the portal page
 * passes it to the tracker). All UA strings persisted; bots filtered at read.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getPartnerBySlug, recordPartnerView } from '@/lib/partners/repo'

const ALLOWED_INTERACTION_TYPES = new Set(['view', 'section_view', 'cta_click', 'exit'])

interface TrackPayload {
  accessKey?: string
  interactionType?: string
  section?: string
  target?: string
  dwellMs?: number
}

function getClientIp(req: NextRequest): string | undefined {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]?.trim() || undefined
  return req.headers.get('x-real-ip') ?? undefined
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
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

  const section = (body.section ?? 'unknown').toString().slice(0, 64)
  const target = body.target ? body.target.toString().slice(0, 128) : undefined
  const dwellMs =
    typeof body.dwellMs === 'number' && body.dwellMs > 0 && body.dwellMs < 24 * 60 * 60 * 1000
      ? Math.round(body.dwellMs)
      : undefined

  const partner = await getPartnerBySlug(slug)
  if (!partner) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  // Access-key gate — the portal page passes the partner's own key to the tracker.
  if (!body.accessKey || body.accessKey !== partner.accessKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await recordPartnerView({
      partnerId: partner.id,
      viewerIp: getClientIp(req),
      userAgent: req.headers.get('user-agent') ?? undefined,
      section,
      interactionType: interactionType as 'view' | 'section_view' | 'cta_click' | 'exit',
      target,
      dwellMs,
    })
  } catch (err) {
    console.error('[partner-track] Insert failed:', err)
    return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
