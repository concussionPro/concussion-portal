/**
 * Mark Squarespace-imported preview users who never engaged as
 * nurture_unsubscribed=true. They came in via CSV import / sync, never
 * logged in, never visited the site — they only wanted the SCAT PDF.
 * Continuing to email them is a deliverability risk and noise.
 *
 * Heuristic for "never engaged":
 *   signup_source = 'squarespace'
 *   AND access_level = 'preview'
 *   AND last_login_at IS NULL
 *   AND created >= 14 days ago (give recent imports a chance to engage)
 *   AND nurture_unsubscribed != true (don't re-flag)
 *
 * GET ?dryRun=1 → preview targets, no writes.
 * POST          → flag them.
 *
 * Auth: x-admin-key / Bearer / admin cookie.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

async function findGhosts() {
  const { rows } = await sql`
    SELECT id, email, name, created_at
    FROM users
    WHERE signup_source = 'squarespace'
      AND access_level = 'preview'
      AND last_login_at IS NULL
      AND created_at < NOW() - INTERVAL '14 days'
      AND COALESCE(nurture_unsubscribed, false) = false
    ORDER BY created_at ASC
  `
  return rows as Array<{ id: string; email: string; name: string; created_at: string }>
}

async function handle(request: NextRequest, dryRun: boolean) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const ghosts = await findGhosts()
  if (dryRun) {
    return NextResponse.json({ dryRun: true, count: ghosts.length, ghosts: ghosts.map((g) => ({ email: g.email, name: g.name, createdAt: g.created_at })) })
  }
  let updated = 0
  for (const g of ghosts) {
    try {
      await sql`UPDATE users SET nurture_unsubscribed = true WHERE id = ${g.id}`
      updated++
    } catch (err) {
      console.error(`[unsubscribe-ss-ghosts] Failed for ${g.email}:`, err)
    }
  }
  return NextResponse.json({ ok: true, found: ghosts.length, updated })
}

export async function GET(request: NextRequest) {
  const dry = new URL(request.url).searchParams.get('dryRun') !== '0'
  return handle(request, dry)
}
export async function POST(request: NextRequest) {
  return handle(request, false)
}
