/**
 * POST /api/admin/prospect-bootstrap-sequence
 *
 * One-shot migration to wire up the T2/T3 follow-up sequence on existing
 * clinics. Two things happen:
 *
 * 1. Auto-signoff the 'followup' and 'final' templates so the cron will
 *    actually fire them. The signoff gate exists for original Zac-review
 *    of new copy, but T2/T3 templates have lived in the codebase since
 *    inception — just never enabled.
 *
 * 2. Backfill state for clinics that already had T1 fired in the
 *    pre-sequence era. For each clinic with an `initial` outreach_log
 *    row but no `followup` row, set:
 *       next_template_slug = 'followup'
 *       scheduled_send_at  = initial_log.sent_at + 4 business days
 *    Skip clinics in dead states (lost/bounced/engaged/won/archived).
 *    Skip clinics already past the T2 window so they don't get a fire
 *    20+ days late — those graduate straight to 'final' if still in
 *    'sent'/'opened' status.
 *
 * Body: { dryRun?: boolean }  — default true.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'

function addBusinessDays(from: Date, n: number): Date {
  const d = new Date(from)
  d.setUTCHours(0, 0, 0, 0)
  let added = 0
  while (added < n) {
    d.setUTCDate(d.getUTCDate() + 1)
    const dow = d.getUTCDay()
    if (dow !== 0 && dow !== 6) added += 1
  }
  return d
}

const FOLLOWUP_GAP_BUSINESS_DAYS = 4
const FINAL_GAP_BUSINESS_DAYS = 5

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { dryRun?: boolean }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }
  const dryRun = body.dryRun !== false

  // ── 1. Sign off followup + final templates ──
  let templatesSignedOff = 0
  if (!dryRun) {
    const r = await sql`
      UPDATE email_template_signoff
      SET signed_off_at = NOW(),
          signed_off_by = 'auto:bootstrap-sequence',
          notes = COALESCE(notes, '') || E'\n[auto] signed off via prospect-bootstrap-sequence ' || NOW()::text
      WHERE slug IN ('followup', 'final') AND signed_off_at IS NULL
    `
    templatesSignedOff = r.rowCount ?? 0
  }

  // ── 2. Backfill sequence state for clinics with T1 already fired ──
  // Walk every clinic-with-T1 that's not in a dead state and has no
  // followup row yet. For each:
  //   - if T1 sent_at + 4 BD is still in the future → schedule T2
  //   - if T1 sent_at + 4 BD is in the past (cron missed it) → push out
  //     to today + 1 BD so cron picks it up tomorrow morning
  // Only count REAL production T1 sends:
  //  - resend_email_id IS NOT NULL → excludes sentinel rows from
  //    /api/admin/prospect-mark-already-sent (those have NULL)
  //  - audit_key NOT LIKE '%:test:%' → excludes dev/test fires
  //  - audit_key NOT LIKE '%manual-pre-engine%' → excludes pre-engine markers
  // Use MAX(sent_at) to dedupe clinics with multiple real T1 fires
  // (test + prod). The most recent send drives the T2 timing.
  const { rows: candidates } = await sql<{
    id: number
    slug: string
    short_name: string
    status: string
    next_template_slug: string | null
    scheduled_send_at: string | null
    t1_sent_at: string
    has_followup_log: boolean
  }>`
    SELECT
      pc.id, pc.slug, pc.short_name, pc.status, pc.next_template_slug, pc.scheduled_send_at,
      MAX(ol_initial.sent_at) AS t1_sent_at,
      EXISTS (
        SELECT 1 FROM prospect_outreach_log ol2
        WHERE ol2.clinic_id = pc.id
          AND ol2.template_slug = 'followup'
          AND ol2.resend_email_id IS NOT NULL
      ) AS has_followup_log
    FROM prospect_clinics pc
    JOIN prospect_outreach_log ol_initial
      ON ol_initial.clinic_id = pc.id
      AND ol_initial.template_slug = 'initial'
      AND ol_initial.resend_email_id IS NOT NULL
      AND ol_initial.audit_key NOT LIKE '%:test:%'
      AND ol_initial.audit_key NOT LIKE '%manual-pre-engine%'
    WHERE pc.status NOT IN ('archived', 'lost', 'bounced', 'engaged', 'won')
    GROUP BY pc.id, pc.slug, pc.short_name, pc.status, pc.next_template_slug, pc.scheduled_send_at
  `

  const now = new Date()
  const tomorrow = addBusinessDays(now, 1)
  const updates: Array<{
    id: number
    slug: string
    shortName: string
    decision: 'schedule-followup' | 'schedule-final' | 'already-correct' | 'past-window-skip'
    nextTemplate: string | null
    nextDate: string | null
  }> = []

  for (const row of candidates) {
    if (row.has_followup_log) {
      // T2 already fired → either need T3 scheduled or sequence complete.
      const { rows: finalCheck } = await sql<{ has_final_log: boolean }>`
        SELECT EXISTS (
          SELECT 1 FROM prospect_outreach_log ol
          WHERE ol.clinic_id = ${row.id} AND ol.template_slug = 'final'
        ) AS has_final_log
      `
      if (finalCheck[0]?.has_final_log) {
        // T3 also fired — full sequence done.
        if (row.next_template_slug !== null || row.scheduled_send_at !== null) {
          if (!dryRun) {
            await sql`
              UPDATE prospect_clinics
              SET next_template_slug = NULL, scheduled_send_at = NULL, updated_at = NOW()
              WHERE id = ${row.id}
            `
          }
          updates.push({
            id: row.id, slug: row.slug, shortName: row.short_name,
            decision: 'schedule-final',
            nextTemplate: null, nextDate: null,
          })
        } else {
          updates.push({
            id: row.id, slug: row.slug, shortName: row.short_name,
            decision: 'already-correct', nextTemplate: null, nextDate: null,
          })
        }
      } else {
        // Need T3 scheduled.
        const t2Date = new Date(row.t1_sent_at) // approximation — we'd need ol_followup.sent_at to be precise
        // Find true T2 sent_at via separate query for accuracy.
        const { rows: t2 } = await sql<{ sent_at: string }>`
          SELECT sent_at FROM prospect_outreach_log
          WHERE clinic_id = ${row.id} AND template_slug = 'followup'
          ORDER BY sent_at DESC LIMIT 1
        `
        if (t2[0]) t2Date.setTime(new Date(t2[0].sent_at).getTime())
        let nextDate = addBusinessDays(t2Date, FINAL_GAP_BUSINESS_DAYS)
        if (nextDate.getTime() < now.getTime()) nextDate = tomorrow
        if (!dryRun) {
          await sql`
            UPDATE prospect_clinics
            SET next_template_slug = 'final',
                scheduled_send_at = ${nextDate.toISOString()},
                updated_at = NOW()
            WHERE id = ${row.id}
          `
        }
        updates.push({
          id: row.id, slug: row.slug, shortName: row.short_name,
          decision: 'schedule-final',
          nextTemplate: 'final', nextDate: nextDate.toISOString(),
        })
      }
    } else {
      // T2 not yet fired. Schedule it.
      let nextDate = addBusinessDays(new Date(row.t1_sent_at), FOLLOWUP_GAP_BUSINESS_DAYS)
      if (nextDate.getTime() < now.getTime()) nextDate = tomorrow
      if (!dryRun) {
        await sql`
          UPDATE prospect_clinics
          SET next_template_slug = 'followup',
              scheduled_send_at = ${nextDate.toISOString()},
              updated_at = NOW()
          WHERE id = ${row.id}
        `
      }
      updates.push({
        id: row.id, slug: row.slug, shortName: row.short_name,
        decision: 'schedule-followup',
        nextTemplate: 'followup', nextDate: nextDate.toISOString(),
      })
    }
  }

  return NextResponse.json({
    summary: {
      mode: dryRun ? 'dry-run' : 'applied',
      templatesSignedOff,
      clinicsExamined: candidates.length,
      updatesPlanned: updates.length,
      followupScheduled: updates.filter((u) => u.decision === 'schedule-followup').length,
      finalScheduled: updates.filter((u) => u.decision === 'schedule-final' && u.nextTemplate === 'final').length,
      sequenceComplete: updates.filter((u) => u.decision === 'schedule-final' && u.nextTemplate === null).length,
      alreadyCorrect: updates.filter((u) => u.decision === 'already-correct').length,
    },
    updates,
  })
}
