import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'
import { recordAdminAction } from '@/lib/admin-audit'
import { recordCoursePurchase } from '@/lib/course-purchases'
import { CRM_COURSE_SLUG, CRM_PRACTICAL_SLUG } from '@/lib/crm-course'

/**
 * POST /api/admin/grant-entitlements
 *
 * Grants course access to someone WITHOUT taking their money.
 *
 * WHY THIS EXISTS (2026-08-07). There was no way to do this. `course_purchases`
 * — the table that decides CRM ownership — is written in exactly one place, the
 * Stripe webhook. So the only route to a CRM entitlement was a real payment,
 * and `/api/admin/update-user-access` can set `access_level` and nothing else.
 *
 * That meant the owner could not open his own CRM course, a comped partner
 * could not be let in, and an accreditation assessor could only be handled by
 * the shared demo key. Every one of those ends in a hand-written UPDATE against
 * production, which is precisely the thing that should never be routine.
 *
 * Covers all six entitlement sources, because they do NOT live together:
 *   access_level        users.access_level          (CCM)
 *   CRM                 course_purchases 'crm'
 *   CRM practical day   course_purchases 'crm-practical'
 *   AI course           users.ai_course_enrolled
 *   SST platform        users.sst_entitled_at
 *   Hub pack seat       users.hub_pack_seat_at
 *
 * A CRM buyer's `access_level` stays 'preview' by design — the two course
 * streams are isolated — so granting CRM must NOT silently change it. Only an
 * explicit `accessLevel` in the body does that.
 *
 * Grants are recorded at amount 0 with a `comp:` session id, so they are
 * distinguishable from real sales in the ledger and revenue reporting cannot
 * mistake a comp for income.
 *
 * Every call is written to the admin audit log with before/after state.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body = {
  email?: string
  accessLevel?: 'preview' | 'online-only' | 'full-course'
  crm?: boolean
  crmPractical?: boolean
  aiCourse?: boolean
  sst?: boolean
  hubPack?: boolean
  /** Free-text note stored in the audit log — why this was comped. */
  reason?: string
}

async function snapshot(email: string) {
  const { rows } = await sql<{
    access_level: string
    ai_course_enrolled: boolean | null
    sst: boolean
    hub: boolean
  }>`
    SELECT access_level, ai_course_enrolled,
           sst_entitled_at IS NOT NULL AS sst,
           hub_pack_seat_at IS NOT NULL AS hub
    FROM users WHERE LOWER(email) = ${email}
  `
  if (!rows[0]) return null
  const { rows: owned } = await sql<{ course_slug: string }>`
    SELECT course_slug FROM course_purchases WHERE user_email = ${email}
  `
  return { ...rows[0], courses: owned.map((r) => r.course_slug).sort() }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })
  if (body.accessLevel && !['preview', 'online-only', 'full-course'].includes(body.accessLevel)) {
    return NextResponse.json({ error: 'invalid accessLevel' }, { status: 400 })
  }

  const before = await snapshot(email)
  if (!before) return NextResponse.json({ error: 'No such user' }, { status: 404 })

  const granted: string[] = []

  if (body.crm) {
    await recordCoursePurchase({
      email, courseSlug: CRM_COURSE_SLUG,
      stripeSessionId: `comp:${Date.now()}`, amount: 0, currency: 'AUD',
    })
    granted.push('crm')
  }
  if (body.crmPractical) {
    await recordCoursePurchase({
      email, courseSlug: CRM_PRACTICAL_SLUG,
      stripeSessionId: `comp:${Date.now()}`, amount: 0, currency: 'AUD',
    })
    granted.push('crm-practical')
  }

  // COALESCE on the timestamps: re-granting must not reset an existing
  // entitlement's start date, which is what `included_until` is derived from.
  if (body.aiCourse) {
    await sql`UPDATE users SET ai_course_enrolled = TRUE WHERE LOWER(email) = ${email}`
    granted.push('ai-course')
  }
  if (body.sst) {
    await sql`UPDATE users SET sst_entitled_at = COALESCE(sst_entitled_at, NOW()) WHERE LOWER(email) = ${email}`
    granted.push('sst')
  }
  if (body.hubPack) {
    await sql`UPDATE users SET hub_pack_seat_at = COALESCE(hub_pack_seat_at, NOW()) WHERE LOWER(email) = ${email}`
    granted.push('hub-pack')
  }
  if (body.accessLevel) {
    await sql`UPDATE users SET access_level = ${body.accessLevel} WHERE LOWER(email) = ${email}`
    granted.push(`access:${body.accessLevel}`)
  }

  const after = await snapshot(email)

  await recordAdminAction(request, {
    route: '/api/admin/grant-entitlements',
    target: email,
    detail: { granted, reason: body.reason ?? null, before, after },
  })

  return NextResponse.json({ success: true, email, granted, before, after })
}
