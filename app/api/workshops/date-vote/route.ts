import { NextRequest, NextResponse } from 'next/server'
import { VOTE_CITIES, type VoteCity, verifyVoteToken, recordVote } from '@/lib/workshop-votes'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/get-client-ip'

/**
 * GET /api/workshops/date-vote?city=melbourne&e=<email>&t=<hmac>&s=<source>
 *
 * One-click, no-login date vote from the announce email. The HMAC binds
 * email+city, so a forwarded link can only ever vote AS that recipient FOR
 * that city — nothing else is writable. Idempotent; re-clicks refresh the
 * timestamp. Always redirects to the thanks page (which carries the enrol
 * CTA) — a voter should land on a next step, never on JSON.
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = await rateLimit({ key: `date-vote:${ip}`, limit: 30, windowSec: 60 })
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const p = request.nextUrl.searchParams
  const city = (p.get('city') || '').trim() as VoteCity
  const email = (p.get('e') || '').trim().toLowerCase()
  const token = (p.get('t') || '').trim()
  const source = (p.get('s') || 'date-blast').slice(0, 40)

  const base = request.nextUrl.origin
  if (!VOTE_CITIES.includes(city) || !email || !token || !verifyVoteToken(email, city, token)) {
    // Bad/stale link — send them somewhere useful rather than an error wall.
    return NextResponse.redirect(`${base}/pricing?utm_source=email&utm_medium=email&utm_campaign=${encodeURIComponent(source)}&utm_content=vote-invalid`)
  }

  try {
    await recordVote({ email, city, source })
  } catch (err) {
    console.error('[date-vote] record failed:', err)
    // Still land them on the thanks page — the click's intent is what matters
    // to the visitor; the miss is logged for the admin.
  }

  return NextResponse.redirect(`${base}/workshops/thanks?city=${encodeURIComponent(city)}&utm_source=email&utm_medium=email&utm_campaign=${encodeURIComponent(source)}&utm_content=vote-${city}`)
}
