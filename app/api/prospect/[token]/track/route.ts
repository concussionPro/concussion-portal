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
 * Bot guard: scanner user-agents are dropped at the door (SCANNER_UA below)
 * so email-security detonations can't flip 'engaged' or fire alerts; the
 * aggregator-side regex filter in the engagement route still covers reads
 * of historical rows. Per-clinic KV rate limit caps forged/looping clients.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getClinicBySlug } from '@/lib/prospect/repo'
import { accessKeyMatches } from '@/lib/prospect/access-key'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { CONFIG } from '@/lib/config'
import { rateLimit } from '@/lib/rate-limit'

const ALLOWED_INTERACTION_TYPES = new Set([
  'view',
  'section_view',
  'cta_click',
  'exit',
])

// Same filter the demo tour entry uses (app/demo/clinic/route.ts): email-
// security sandboxes detonate portal links and "click" CTAs — a scanner
// interaction is not engagement and must not flip status or alert Zac.
const SCANNER_UA = /bot|crawler|spider|headless|safelinks|mimecast|proofpoint|barracuda|googleimageproxy|expanse|urlscan|preview|scan/i

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

  // Scanner detonations are dropped whole — not persisted, never escalated.
  if (SCANNER_UA.test(req.headers.get('user-agent') || '')) {
    return new NextResponse(null, { status: 204 })
  }

  // Validate clinic + access key
  const clinic = await getClinicBySlug(token)
  if (!clinic) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (!accessKeyMatches(body.accessKey, clinic)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Per-clinic cap — a forged/looping client can't flood the views table.
  // The MONEY signals (cta/pricing → engaged flip + hot-lead alert) are
  // exempt: a portal forwarded round a 3-4 person clinic can legitimately
  // exceed 30 section/exit events in an hour, and a 429'd cta_click
  // silently lost the one signal the engine exists for (round-H #3).
  const isMoneySignal = body.interactionType === 'cta_click' || body.interactionType === 'pricing_view'
  if (!isMoneySignal) {
    const rl = await rateLimit({ key: `prospect-track:${clinic.id}`, limit: 30, windowSec: 3600 })
    if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  } else {
    const rl = await rateLimit({ key: `prospect-track-cta:${clinic.id}`, limit: 20, windowSec: 3600 })
    if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
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

  // ── Real-time intent escalation ──────────────────────────────────────────
  // Buying signals must not sit in the cold drip. A CTA click OR reaching the
  // pricing section pulls the clinic OUT of the cold cadence into the 'engaged'
  // lane (halts cold sends; picked up by daily-outreach-report + nurture). A CTA
  // click also alerts Zac in real time on the FIRST hand-raise per clinic — so a
  // hot lead (like On The Mend clicking book-a-call) is never missed again.
  const isCta = interactionType === 'cta_click'
  const isPricing = interactionType === 'section_view' && section === 'pricing'
  if (isCta || isPricing) {
    try {
      await sql`
        UPDATE prospect_clinics
        SET status = 'engaged', scheduled_send_at = NULL, updated_at = NOW()
        WHERE id = ${clinic.id}
          AND status IN ('approved', 'sent', 'opened', 'researching', 'queued', 'scheduled')
      `
    } catch (err) {
      console.error('[prospect-track] intent flip failed:', err)
    }
  }
  if (isCta) {
    try {
      // Exactly one hot-lead alert per clinic, EVER — audit-keyed in
      // email_audit_log so forged/repeat clicks (or a race on the COUNT this
      // used to rely on) can't spam Zac's inbox.
      const { rowCount: firstAlert } = await sql`
        INSERT INTO email_audit_log (audit_key, sent_at)
        VALUES (${`prospect_hotlead_${token}`}, NOW())
        ON CONFLICT (audit_key) DO NOTHING
      `
      if ((firstAlert ?? 0) > 0) {
        const { rows: c } = await sql<{ name: string; contact_full_name: string | null; contact_email: string | null; city: string | null; state: string | null; status: string }>`
          SELECT name, contact_full_name, contact_email, city, state, status
          FROM prospect_clinics WHERE id = ${clinic.id}
        `
        const d = c[0]
        // Don't alert on our own tours / dead deals. A cold clinic was just
        // flipped to 'engaged' above (→ alert); archived/lost/won were never
        // flipped, so their original status still excludes them here.
        if (d && !['archived', 'lost', 'won', 'engaged-elsewhere'].includes(d.status)) {
          const origin = req.nextUrl.origin
          await sendEmail({
            to: CONFIG.CONTACT_EMAIL,
            subject: `🔥 Buying signal: ${d.name} clicked "${target || 'a CTA'}"`,
            html: `<p><strong>${escapeHtml(d.name)}</strong> just clicked <strong>${escapeHtml(target || 'a CTA')}</strong> on their portal.</p>
              <p>${escapeHtml(d.contact_full_name || '—')}${d.contact_email ? ` · <a href="mailto:${escapeHtml(d.contact_email)}">${escapeHtml(d.contact_email)}</a>` : ''}<br>${escapeHtml([d.city, d.state].filter(Boolean).join(', ') || '')}</p>
              <p>They've been moved to <strong>engaged</strong> (cold drip stopped). <a href="${origin}/p/${escapeHtml(token)}">Open their portal →</a></p>
              <p style="color:#64748b;font-size:13px">Reach out personally — this is a hand-raise, not a cold contact.</p>`,
          }).catch(() => {})
        }
      }
    } catch (err) {
      console.error('[prospect-track] intent alert failed:', err)
    }
  }

  return new NextResponse(null, { status: 204 })
}
