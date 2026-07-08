import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { createUser } from '@/lib/users'
import { createMagicToken } from '@/lib/magic-link-jwt'
import { sendMagicLinkEmail } from '@/lib/resend-client'
import { redeemHubSeat, type HubRole } from '@/lib/course-hub'

/**
 * POST /api/hub/redeem  { code, email, name, role }
 * A team member redeems their clinic's Hub access key for their OWN login.
 * The key is the auth; `redeemHubSeat` atomically enforces the paid seat cap so
 * the key can't grant access beyond the team (no leak). On success the member is
 * provisioned at real `full-course` access and emailed a one-click login.
 */
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function POST(request: NextRequest) {
  let body: { code?: string; email?: string; name?: string; role?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const code = (body.code || '').trim().toUpperCase()
  const email = (body.email || '').trim().toLowerCase()
  const name = (body.name || '').trim()
  const role: HubRole = body.role === 'admin' ? 'admin' : 'clinician'

  if (!code || !email || !name) {
    return NextResponse.json({ error: 'Access key, name and email are all required.' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  // Rate-limit per IP AND per key — blocks key brute-forcing and mass redemption.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await rateLimit({ key: `hub-redeem:${ip}`, limit: 10, windowSec: 300 })
  if (!rl.ok) return NextResponse.json({ error: 'Too many attempts. Please try again shortly.' }, { status: 429 })
  const rlKey = await rateLimit({ key: `hub-redeem-code:${code}`, limit: 30, windowSec: 3600 })
  if (!rlKey.ok) return NextResponse.json({ error: 'This key has had too many attempts. Contact your clinic.' }, { status: 429 })

  const result = await redeemHubSeat(code, email, name, role)

  if (result === 'no-hub') {
    return NextResponse.json({ error: 'That access key was not recognised. Check it and try again.' }, { status: 404 })
  }
  if (result === 'full') {
    return NextResponse.json(
      { error: "All of this clinic's seats are in use. Ask whoever set up your clinic access — they can't add more on this key." },
      { status: 409 },
    )
  }

  // result is 'ok' (new seat) or 'already' (idempotent) — both grant access.
  try {
    const userId = await createUser({ email, name, accessLevel: 'full-course', signupSource: 'purchase' })
    const token = createMagicToken(userId, email, name, 'full-course')
    await sendMagicLinkEmail(email, token, request.nextUrl.origin)
  } catch (err) {
    console.error('Hub redeem provisioning failed:', err)
    return NextResponse.json({ error: 'We saved your seat but hit a snag emailing your login. Contact support@concussion-education-australia.com.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, alreadyMember: result === 'already' })
}
