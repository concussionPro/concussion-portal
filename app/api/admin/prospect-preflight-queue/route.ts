/**
 * POST /api/admin/prospect-preflight-queue
 *
 * Runs the full preflight gate over the active prospect queue and
 * (optionally) auto-quarantines anything that fails. Designed to be
 * run before a major ramp — a clean queue is a prerequisite for
 * sustainable volume.
 *
 * Body:
 *   { dryRun?: boolean (default true), scope?: 'queued' | 'all-live' (default 'queued') }
 *
 * Returns per-prospect pass/fail breakdown + summary counts by failure
 * code. When dryRun=false, writes status='archived' + a preflight note
 * for any clinic with severity='quarantine'.
 *
 * Concurrency: processes in batches of 20 to bound DNS lookups; per-
 * process MX cache in preflight.ts keeps repeated domain lookups O(1).
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'
import { getClinicById } from '@/lib/prospect/repo'
import { preflightClinic, failureSummary } from '@/lib/prospect/preflight'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: { dryRun?: boolean; scope?: 'queued' | 'all-live' }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }
  const dryRun = body.dryRun !== false // default true
  const scope = body.scope === 'all-live' ? 'all-live' : 'queued'

  // Scope selection
  //  - queued: has a scheduled_send_at and isn't dead
  //  - all-live: any clinic not in dead-status (researching/approved/sent/etc.)
  const { rows } = scope === 'all-live'
    ? await sql<{ id: number }>`
        SELECT id FROM prospect_clinics
        WHERE status NOT IN ('archived', 'lost', 'bounced', 'won', 'replied')
        ORDER BY id
      `
    : await sql<{ id: number }>`
        SELECT id FROM prospect_clinics
        WHERE scheduled_send_at IS NOT NULL
          AND status NOT IN ('archived', 'lost', 'bounced', 'won', 'replied')
        ORDER BY scheduled_send_at
      `

  const failureCounts: Record<string, number> = {}
  const perProspect: Array<{
    id: number
    shortName: string
    email: string
    severity: string
    failures: string
    quarantined: boolean
  }> = []

  let pass = 0
  let enrich = 0
  let quarantine = 0
  let quarantineApplied = 0

  // Process in batches of 20 (bounded DNS concurrency)
  const BATCH = 20
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH)
    const clinics = await Promise.all(slice.map((r) => getClinicById(r.id)))
    const results = await Promise.all(
      clinics.map(async (c) => {
        if (!c) return null
        const pf = await preflightClinic(c)
        return { clinic: c, pf }
      }),
    )
    for (const r of results) {
      if (!r) continue
      const { clinic, pf } = r
      if (pf.severity === 'pass') pass += 1
      else if (pf.severity === 'enrich') enrich += 1
      else quarantine += 1

      for (const f of pf.failures) {
        failureCounts[f.code] = (failureCounts[f.code] ?? 0) + 1
      }

      let quarantined = false
      if (!dryRun && pf.severity === 'quarantine') {
        try {
          await sql`
            UPDATE prospect_clinics
            SET status = 'archived',
                notes = COALESCE(notes || E'\\n', '') || ${'[preflight-batch ' + new Date().toISOString().slice(0, 10) + '] ' + failureSummary(pf)},
                scheduled_send_at = NULL,
                updated_at = NOW()
            WHERE id = ${clinic.id}
          `
          quarantineApplied += 1
          quarantined = true
        } catch (err) {
          console.error('[preflight-batch] update failed for', clinic.id, err)
        }
      }

      if (pf.severity !== 'pass') {
        perProspect.push({
          id: clinic.id,
          shortName: clinic.shortName,
          email: clinic.contactEmail,
          severity: pf.severity,
          failures: failureSummary(pf),
          quarantined,
        })
      }
    }
  }

  return NextResponse.json({
    ok: true,
    summary: {
      scope,
      dryRun,
      checked: rows.length,
      pass,
      enrich,
      quarantine,
      quarantineApplied,
    },
    failureCounts,
    failingProspects: perProspect.slice(0, 200), // cap response payload
    truncated: perProspect.length > 200,
  })
}
