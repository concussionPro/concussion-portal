/**
 * Admin action audit trail.
 *
 * Every admin mutation used to be unattributed and unreconstructable — the only
 * trace was a `console.log` that ages out of Vercel's retention. When a customer
 * asks "who changed my access, and when?", or a dispute turns on whether an
 * unsubscribe was honoured, there was nothing to read.
 *
 * ONE table, lazily migrated like every other store in this repo. Called from
 * the admin routes that MUTATE CUSTOMER STATE (grant / create / upgrade access,
 * unsubscribe, alumni activation, seat management, refund-adjacent). Read-only
 * admin routes are deliberately NOT instrumented: a log of every dashboard load
 * buries the mutations that matter.
 *
 * ACTOR GRANULARITY, honestly stated: the admin session cookie
 * (lib/admin-session.ts) carries no subject — there is one operator and one
 * ADMIN_API_KEY — so the actor records the CREDENTIAL used, not a person:
 *   'cookie'  — a browser session from /api/admin/login
 *   'api-key' — x-admin-key / Authorization: Bearer (scripts, curl, cron)
 * Don't infer more than that from it. If admin accounts are ever added, the
 * subject belongs in the session payload and then here.
 *
 * NEVER THROWS. An audit write failing must not fail the mutation the operator
 * actually asked for — a lost log line is bad, a half-applied admin action is
 * worse. Failures go to console.error.
 */

import type { NextRequest } from 'next/server'
import { sql } from './db'
import { verifyAdminSessionToken, ADMIN_COOKIE_NAME } from './admin-session'

export type AdminActor = 'cookie' | 'api-key' | 'unknown'

let tableEnsured = false
async function ensureTable(): Promise<void> {
  if (tableEnsured) return
  await sql`
    CREATE TABLE IF NOT EXISTS admin_actions (
      id SERIAL PRIMARY KEY,
      actor TEXT NOT NULL,
      route TEXT NOT NULL,
      target TEXT,
      detail JSONB,
      at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS admin_actions_at_idx ON admin_actions (at DESC)`
  await sql`CREATE INDEX IF NOT EXISTS admin_actions_target_idx ON admin_actions (target)`
  tableEnsured = true
}

/** Which credential authenticated this request (see the header note). */
export function adminActorFor(request: NextRequest | Request): AdminActor {
  const cookieVal =
    'cookies' in request
      ? (request as NextRequest).cookies.get(ADMIN_COOKIE_NAME)?.value
      : parseCookieHeader(request.headers.get('cookie') || '', ADMIN_COOKIE_NAME)
  if (cookieVal && verifyAdminSessionToken(cookieVal)) return 'cookie'
  if (request.headers.get('x-admin-key') || request.headers.get('authorization')) return 'api-key'
  return 'unknown'
}

/**
 * Record one admin mutation.
 *
 * `target` is WHO/WHAT was changed — an email, a clinic code, a count for a
 * bulk run. `detail` is the shape of the change (before/after, counts). Keep
 * secrets out of both: this table is read by whoever reconstructs the history,
 * so never pass a view key, token or API key.
 */
export async function recordAdminAction(
  request: NextRequest | Request,
  entry: { route: string; target?: string | null; detail?: unknown },
): Promise<void> {
  try {
    await ensureTable()
    await sql`
      INSERT INTO admin_actions (actor, route, target, detail)
      VALUES (
        ${adminActorFor(request)},
        ${entry.route.slice(0, 200)},
        ${entry.target ? String(entry.target).slice(0, 200) : null},
        ${entry.detail === undefined ? null : JSON.stringify(entry.detail)}
      )
    `
  } catch (err) {
    console.error('[admin-audit] failed to record action:', entry.route, err)
  }
}

function parseCookieHeader(header: string, name: string): string | undefined {
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return undefined
}
