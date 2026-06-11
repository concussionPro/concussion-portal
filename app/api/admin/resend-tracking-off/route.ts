/**
 * POST /api/admin/resend-tracking-off
 *
 * Disables OPEN + CLICK tracking on every Resend domain. Removes the tracking
 * pixel (fake opens) and the link-redirect wrapper (fake scanner clicks +
 * spam-filter signal). After this, engagement is measured ONLY by real
 * server-side portal dwell + replies + bookings — no phantom scanner events,
 * and better inbox placement (Resend's own guidance: tracking hurts it).
 *
 * Auth: admin. One-shot.
 */
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { isAdminRequest } from '@/lib/require-admin'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const key = process.env.RESEND_API_KEY
  if (!key) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })

  const resend = new Resend(key)
  const results: Array<{ domain: string; id: string; outcome: string }> = []

  try {
    const list = await resend.domains.list()
    const domains = (list.data?.data ?? []) as Array<{ id: string; name: string }>
    if (!domains.length) return NextResponse.json({ ok: false, error: 'no domains returned', raw: list.error })

    for (const d of domains) {
      try {
        const upd = await resend.domains.update({
          id: d.id,
          clickTracking: false,
          openTracking: false,
        })
        results.push({ domain: d.name, id: d.id, outcome: upd.error ? `error: ${upd.error.message}` : 'tracking disabled' })
      } catch (err) {
        results.push({ domain: d.name, id: d.id, outcome: `error: ${err instanceof Error ? err.message : String(err)}` })
      }
    }
    return NextResponse.json({ ok: true, results })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
