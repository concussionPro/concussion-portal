/**
 * Toggle nurture_unsubscribed on Squarespace-imported preview users who
 * never engaged.
 *
 * Originally written to MARK these users unsubscribed (assumption: they
 * only wanted the SCAT PDF). Reversed once it became clear the legacy
 * Squarespace site is a real zero-cost acquisition channel — every
 * form-fill is a real clinician lead, even if they don't immediately
 * log in. The right path is to keep them in the nurture funnel and let
 * List-Unsubscribe handle per-user opt-out.
 *
 * Endpoint kept so this can be reversed cleanly. `?action=unsub` flags
 * them, `?action=resub` un-flags them. Default is `resub`.
 *
 * Heuristic stays the same:
 *   signup_source = 'squarespace'
 *   AND access_level = 'preview'
 *   AND last_login_at IS NULL
 *   AND created >= 14 days ago
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

async function findGhosts(currentlyUnsubbed: boolean) {
  const { rows } = await sql`
    SELECT id, email, name, created_at
    FROM users
    WHERE signup_source = 'squarespace'
      AND access_level = 'preview'
      AND last_login_at IS NULL
      AND created_at < NOW() - INTERVAL '14 days'
      AND COALESCE(nurture_unsubscribed, false) = ${currentlyUnsubbed}
    ORDER BY created_at ASC
  `
  return rows as Array<{ id: string; email: string; name: string; created_at: string }>
}

async function handle(request: NextRequest, dryRun: boolean) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const action = (new URL(request.url).searchParams.get('action') || 'resub').toLowerCase()
  if (action !== 'unsub' && action !== 'resub') {
    return NextResponse.json({ error: "action must be 'unsub' or 'resub'" }, { status: 400 })
  }
  const target = action === 'unsub'
  // For unsub we look at currently-subbed users; for resub we look at currently-unsubbed
  const ghosts = await findGhosts(!target)

  if (dryRun) {
    return NextResponse.json({ dryRun: true, action, count: ghosts.length, ghosts: ghosts.map((g) => ({ email: g.email, name: g.name, createdAt: g.created_at })) })
  }

  let updated = 0
  for (const g of ghosts) {
    try {
      await sql`UPDATE users SET nurture_unsubscribed = ${target} WHERE id = ${g.id}`
      updated++
    } catch (err) {
      console.error(`[ss-ghosts] Failed ${action} for ${g.email}:`, err)
    }
  }
  return NextResponse.json({ ok: true, action, found: ghosts.length, updated })
}

export async function GET(request: NextRequest) {
  const dry = new URL(request.url).searchParams.get('dryRun') !== '0'
  return handle(request, dry)
}
export async function POST(request: NextRequest) {
  return handle(request, false)
}
