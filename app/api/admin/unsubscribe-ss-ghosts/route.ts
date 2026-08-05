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
 *   AND access_level = 'preview' (and owns NO CRM course — see below)
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
      -- CRM (EP stream) buyers keep access_level 'preview' — their entitlement
      -- lives in course_purchases (lib/crm-course.ts). A Squarespace-origin
      -- lead who later BOUGHT CRM and hasn't logged in yet was silently
      -- flagged nurture_unsubscribed by the 'unsub' action, cutting a paying
      -- customer out of their own onboarding.
      AND NOT EXISTS (
        SELECT 1 FROM course_purchases cp
        WHERE LOWER(cp.user_email) = LOWER(email)
          AND cp.course_slug IN ('crm','crm-practical')
      )
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

// GET is ALWAYS a dry run. The admin cookie is sameSite 'lax', so a top-level
// cross-site navigation carries it — and middleware's CSRF check only guards
// unsafe methods. A `?dryRun=0` escape hatch on GET meant one clicked link
// could mass-unsubscribe. Mutating requires POST.
export async function GET(request: NextRequest) {
  return handle(request, true)
}
export async function POST(request: NextRequest) {
  return handle(request, false)
}
