import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { findUserByEmail } from '@/lib/users'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'
import { VALID_LOCATIONS } from '@/lib/stripe'

/**
 * POST /api/admin/generate-upgrade-link
 * Body: { email: string, location: 'melbourne' | 'sydney' | 'byron-bay' | 'adelaide' | 'wa' }
 *
 * Returns a permanent short URL (portal.../pay/[code]) for a known
 * online-only user to upgrade to full-course at a specific workshop
 * city. Admin pastes the URL into a personal email — recipient clicks
 * any time, /pay/[code] creates a fresh 24h Stripe session JIT and
 * 302s to it. From the recipient's perspective the link never expires.
 *
 * Returns 400 if the user's accessLevel isn't online-only.
 */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: { email?: string; location?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const email = body.email?.trim().toLowerCase()
  const location = body.location?.trim().toLowerCase()
  if (!email || !location) {
    return NextResponse.json({ error: 'email and location required' }, { status: 400 })
  }
  // Catch a mistyped city HERE rather than at /pay/[code], where it would
  // create a real Stripe session nominating a workshop city that no
  // Ready-to-Train pipeline knows about.
  if (!VALID_LOCATIONS.includes(location as (typeof VALID_LOCATIONS)[number])) {
    return NextResponse.json(
      { error: `location must be one of: ${VALID_LOCATIONS.join(', ')}` },
      { status: 400 },
    )
  }

  const user = await findUserByEmail(email)
  if (!user) {
    return NextResponse.json({ error: 'user not found — they need an online-only purchase first' }, { status: 404 })
  }
  if (user.accessLevel !== 'online-only') {
    return NextResponse.json({
      error: `user.accessLevel is '${user.accessLevel}' — upgrade flow only valid for online-only buyers. Fix via /api/admin/update-user-access first if needed.`
    }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS pay_links (
        code TEXT PRIMARY KEY,
        url TEXT,
        email TEXT NOT NULL,
        location TEXT,
        course_type TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    // Ensure course_type column exists (older table from prior schema)
    await sql`ALTER TABLE pay_links ADD COLUMN IF NOT EXISTS course_type TEXT`

    const code = crypto.randomBytes(6).toString('base64url').slice(0, 8)
    await sql`
      INSERT INTO pay_links (code, email, location, course_type)
      VALUES (${code}, ${user.email}, ${location}, 'workshop-upgrade')
    `
    const shortUrl = `${baseUrl}/pay/${code}`

    return NextResponse.json({
      success: true,
      shortUrl,
      buyer: { email: user.email, name: user.name, accessLevel: user.accessLevel },
      location,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Link creation failed' }, { status: 500 })
  }
}
