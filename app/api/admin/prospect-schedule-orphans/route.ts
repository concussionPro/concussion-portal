/**
 * POST /api/admin/prospect-schedule-orphans
 *
 * Distributes scheduled_send_at across all eligible prospects that are
 * missing one. New Apollo/Hunter imports land in the DB with
 * status='researching' but no scheduled_send_at, so the cron never
 * sees them. This route gives every orphan a slot, spreading evenly
 * across Mon-Fri weekdays out to the configured horizon.
 *
 * Eligibility:
 *   status NOT IN ('archived', 'lost', 'bounced', 'engaged', 'won')
 *   scheduled_send_at IS NULL
 *   next_template_slug IS NULL OR 'initial' (only T1 candidates — T2/T3
 *     orphans would mean someone already had a T1 fire with no
 *     follow-up scheduled, which is the bootstrap-sequence migration's
 *     job, not this one)
 *
 * Body: {
 *   dryRun?: boolean (default true)
 *   dailyCap?: number (default 12 — match current adaptive cap)
 *   startDate?: 'YYYY-MM-DD' (default = next business day UTC)
 *   maxDays?: number (default 90 — bail if pool > cap×90)
 * }
 *
 * Spacing rules:
 *   - Mon-Fri only (skip Sat/Sun)
 *   - dailyCap clinics per day — cron decides which N to fire based on
 *     its adaptive cap at fire time, but we space evenly so capacity
 *     isn't lumped on one day
 *   - All scheduled_send_at slots = target_day 00:00 UTC so cron at
 *     00:01 UTC picks up that day's batch (matches existing pattern)
 *   - priority_wave defaults to P3 for unscheduled orphans (mid-priority)
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'

export const maxDuration = 300

function nextBusinessDayUtc(from: Date): Date {
  const d = new Date(from)
  d.setUTCHours(0, 0, 0, 0)
  if (from.getTime() > d.getTime()) d.setUTCDate(d.getUTCDate() + 1)
  while ([0, 6].includes(d.getUTCDay())) d.setUTCDate(d.getUTCDate() + 1)
  return d
}

function advanceBusinessDay(d: Date): Date {
  const next = new Date(d)
  next.setUTCDate(next.getUTCDate() + 1)
  while ([0, 6].includes(next.getUTCDay())) next.setUTCDate(next.getUTCDate() + 1)
  return next
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { dryRun?: boolean; dailyCap?: number; startDate?: string; maxDays?: number }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }
  const dryRun = body.dryRun !== false
  const dailyCap = Math.max(1, Math.min(body.dailyCap ?? 12, 50))
  const maxDays = Math.max(5, Math.min(body.maxDays ?? 90, 250))
  const startDate = body.startDate
    ? nextBusinessDayUtc(new Date(body.startDate))
    : nextBusinessDayUtc(new Date())

  const { rows: orphans } = await sql<{
    id: number
    slug: string
    short_name: string
    status: string
    contact_email: string
  }>`
    SELECT id, slug, short_name, status, contact_email
    FROM prospect_clinics
    WHERE status NOT IN ('archived', 'lost', 'bounced', 'engaged', 'won')
      AND scheduled_send_at IS NULL
      AND (next_template_slug IS NULL OR next_template_slug = 'initial')
    ORDER BY priority_wave ASC NULLS LAST, id ASC
  `

  if (orphans.length === 0) {
    return NextResponse.json({
      summary: { mode: dryRun ? 'dry-run' : 'applied', orphanCount: 0, scheduled: 0 },
      results: [],
    })
  }

  // Compute the schedule horizon — bail if it'd exceed maxDays
  const horizonDays = Math.ceil(orphans.length / dailyCap)
  if (horizonDays > maxDays) {
    return NextResponse.json(
      {
        error: `Orphan pool too large for horizon: ${orphans.length} orphans / cap ${dailyCap} = ${horizonDays} days > maxDays ${maxDays}`,
        hint: `Increase dailyCap or maxDays`,
      },
      { status: 400 },
    )
  }

  const results: Array<{
    id: number
    slug: string
    shortName: string
    scheduledFor: string
  }> = []

  let currentDay = new Date(startDate)
  let countThisDay = 0
  for (const o of orphans) {
    if (countThisDay >= dailyCap) {
      currentDay = advanceBusinessDay(currentDay)
      countThisDay = 0
    }
    const slotIso = currentDay.toISOString()
    results.push({
      id: o.id,
      slug: o.slug,
      shortName: o.short_name,
      scheduledFor: slotIso,
    })
    if (!dryRun) {
      await sql`
        UPDATE prospect_clinics
        SET scheduled_send_at = ${slotIso},
            next_template_slug = COALESCE(next_template_slug, 'initial'),
            priority_wave = COALESCE(priority_wave, 'P3'),
            updated_at = NOW()
        WHERE id = ${o.id}
      `
    }
    countThisDay += 1
  }

  // Per-day distribution summary
  const byDay = new Map<string, number>()
  for (const r of results) {
    const d = r.scheduledFor.slice(0, 10)
    byDay.set(d, (byDay.get(d) ?? 0) + 1)
  }
  const distribution = Array.from(byDay.entries())
    .map(([date, n]) => ({ date, count: n }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return NextResponse.json({
    summary: {
      mode: dryRun ? 'dry-run' : 'applied',
      orphanCount: orphans.length,
      scheduled: results.length,
      dailyCap,
      startDate: startDate.toISOString().slice(0, 10),
      endDate: distribution[distribution.length - 1]?.date ?? null,
      daysSpanned: distribution.length,
    },
    distribution,
    results: results.slice(0, 100),
    truncated: results.length > 100,
  })
}
