import { NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { verifySessionToken } from '@/lib/jwt-session'
import { CONFIG } from '@/lib/config'

/**
 * CPD auth: the tracker is FREE for any signed-in portal user by design
 * (spec §1 — free tier is the default for every account; it is the lead-gen
 * surface). No course purchase, no SST entitlement, no tier gate in v1.
 */
export function cpdSession(req: NextRequest): { email: string; name: string } | null {
  // PARKED (owner 2026-08-03): while CPD_TRACKER_LIVE is false every /api/cpd/*
  // route answers as absent. Data persists; flip the flag to restore.
  if (!CONFIG.FEATURES.CPD_TRACKER_LIVE) return null
  const token = req.cookies.get('session')?.value
  const data = token ? verifySessionToken(token) : null
  if (!data) return null
  return { email: data.email.toLowerCase(), name: data.name }
}

/** Server-side instrumentation into the existing analytics_events table
 *  (spec §8, reusing the repo's event store rather than a new table). */
export async function trackCpdEvent(
  req: NextRequest,
  eventType: string,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    await sql`
      INSERT INTO analytics_events (event_type, event_data, session_id, timestamp_ms, user_agent, referrer, path, search, ip, country)
      VALUES (${eventType}, ${JSON.stringify(data)}::jsonb, ${'server_' + Date.now()}, ${Date.now()},
        ${req.headers.get('user-agent') || 'unknown'}, ${req.headers.get('referer') || null},
        ${req.nextUrl.pathname}, ${null}, ${req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'},
        ${req.headers.get('x-vercel-ip-country') || null})
    `
  } catch (err) {
    console.error('[cpd] event tracking failed (non-fatal):', err)
  }
}
