import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getClientIp } from '@/lib/get-client-ip'
import { z } from 'zod'

const schema = z.object({
  key: z.string().min(8).max(128),
  email: z.string().trim().toLowerCase().email().max(254),
  organisation: z.string().trim().min(1).max(200),
  ndaVersion: z.string().min(1).max(64),
})

const DEMO_COOKIE_MAX_AGE_SEC = 7 * 24 * 60 * 60 // 7 days

/**
 * POST /api/ai-course/demo-access/accept
 *
 * Validates the demo key, logs the acceptance (email, organisation,
 * IP, timestamp, NDA version), sets the demo_key + demo_org cookies,
 * and returns success. Calling page then redirects to /courses.
 *
 * Logged acceptances are the basis for any future "you signed an NDA"
 * argument — the table is the source of truth for who saw what when.
 */
export async function POST(request: NextRequest) {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { key, email, organisation, ndaVersion } = parsed.data

  if (!process.env.HEIDI_DEMO_KEY) {
    return NextResponse.json(
      { error: 'Demo access is not enabled on this deployment.' },
      { status: 503 }
    )
  }
  if (key !== process.env.HEIDI_DEMO_KEY) {
    return NextResponse.json({ error: 'Invalid demo key.' }, { status: 401 })
  }

  // Log the acceptance — lazy column creation so this works without a
  // pre-existing migration. Idempotent on email + nda_version.
  await sql`
    CREATE TABLE IF NOT EXISTS ai_course_demo_acceptances (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      organisation TEXT NOT NULL,
      nda_version TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  const ip = getClientIp(request)
  const userAgent = request.headers.get('user-agent') || ''
  const { rows: inserted } = await sql`
    INSERT INTO ai_course_demo_acceptances (email, organisation, nda_version, ip_address, user_agent)
    VALUES (${email}, ${organisation}, ${ndaVersion}, ${ip}, ${userAgent})
    RETURNING id
  `
  const acceptanceId = inserted[0]?.id ?? 0

  // Server-side analytics event so the NDA-accept is captured even if
  // the client-side tracker fails (ad-blockers, JS off, etc.). Schema
  // matches /api/analytics/track.
  try {
    const eventData = JSON.stringify({
      acceptanceId,
      organisation,
      email,
      ndaVersion,
      demoOrg: organisation,
      isDemo: true,
    })
    await sql`
      INSERT INTO analytics_events (
        event_type, event_data, session_id, timestamp_ms, user_agent,
        referrer, path, search, ip, country
      ) VALUES (
        'demo_nda_accepted',
        ${eventData}::jsonb,
        ${'server-nda-' + acceptanceId},
        ${Date.now()},
        ${userAgent},
        ${null},
        '/api/ai-course/demo-access/accept',
        ${null},
        ${ip},
        ${null}
      )
    `
  } catch (err) {
    // Don't fail the NDA accept if analytics insert fails — table
    // ownership is /api/analytics/track. Just log.
    console.error('[demo-access/accept] Failed to write analytics event:', err)
  }

  const response = NextResponse.json({
    success: true,
    acceptanceId,
    expiresInSeconds: DEMO_COOKIE_MAX_AGE_SEC,
  })
  response.cookies.set('demo_key', key, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: DEMO_COOKIE_MAX_AGE_SEC,
  })
  // Non-httpOnly so the watermark component can read the organisation
  response.cookies.set('demo_org', organisation, {
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: DEMO_COOKIE_MAX_AGE_SEC,
  })
  return response
}
