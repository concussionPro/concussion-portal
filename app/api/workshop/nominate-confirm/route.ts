import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'

/**
 * POST /api/workshop/nominate-confirm — the HUMAN half of an email city
 * nomination. Body: { e, t, city }.
 *
 * The email link (nominate-click) only redirects; this endpoint is called by
 * the Confirm button on the /pricing banner, so a nomination exists only when
 * a person acted on the landed page. Mail-security sandboxes (Microsoft
 * Defender link detonation was the culprit that fabricated the entire first
 * round of Q4 numbers) follow redirects but do not tap in-page buttons.
 *
 * Same HMAC as one-click unsubscribe: the payload can only have been minted
 * by us, for that address.
 *
 * ON CONFLICT upgrades the source: if a scanner-quarantined row
 * ('q4-blast-click-suspect') exists for the same email+city and the human
 * later genuinely confirms, the row becomes confirmed rather than the
 * confirmation being silently dropped.
 */

export const dynamic = 'force-dynamic'

const CITY_SLUGS = new Set(['sydney', 'byron-bay', 'melbourne', 'adelaide', 'wa'])

export async function POST(request: NextRequest) {
  let body: { e?: string; t?: string; city?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const email = (body.e || '').trim().toLowerCase()
  const token = body.t || ''
  const slug = (body.city || '').trim().toLowerCase()

  if (!email || !CITY_SLUGS.has(slug) || token !== generateUnsubscribeToken(email)) {
    // No detail — a signed-payload failure that explains itself is a probing aid.
    return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  }

  try {
    await sql`
      INSERT INTO workshop_interest (email, name, city, source)
      VALUES (${email}, ${''}, ${slug}, 'q4-blast-confirmed')
      ON CONFLICT (email, city)
      DO UPDATE SET source = 'q4-blast-confirmed'
    `
    console.log(`[nominate-confirm] ${slug} confirmed`)
  } catch (err) {
    console.error('[nominate-confirm] write failed:', err)
    return NextResponse.json({ error: 'Write failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
