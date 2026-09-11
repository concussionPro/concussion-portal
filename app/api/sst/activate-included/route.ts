import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { verifyViewKey, DEMO_CLINIC_CODE, normaliseClinicCode } from '@/lib/sst-trainer/clinic-registry'
import { INCLUDED_PLATFORM_MONTHS } from '@/lib/sst-trainer/bundle'

/**
 * POST /api/sst/activate-included { clinicCode, viewKey }
 *
 * Starts the course-included platform period (owner 2026-09-11): a course
 * purchase grants the tier as PENDING with no expiry stamp, so the included
 * months don't burn while the buyer is still working through the course.
 * This endpoint is the clinician's explicit "start my included 3 months" —
 * it stamps included_until = NOW() + INCLUDED_PLATFORM_MONTHS and clears the
 * pending flag, which is also what arms the renewal-prompt cron for them.
 *
 * viewKey-authed (the same clinician credential as patient minting) so a
 * patient-held clinic code alone can never start — or restart — the clock.
 * IDEMPOTENT: an already-stamped clinic returns its existing date unchanged;
 * activation must never extend or reset a running period.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let body: { clinicCode?: unknown; viewKey?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const code = normaliseClinicCode(body.clinicCode)
  const viewKey = typeof body.viewKey === 'string' ? body.viewKey : ''
  if (!code) return NextResponse.json({ error: 'clinic code required' }, { status: 400 })
  const rl = await rateLimit({ key: `sst-activate:${code}`, limit: 10, windowSec: 60 })
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  if (code === DEMO_CLINIC_CODE) {
    return NextResponse.json({ error: 'Demo clinic is read-only' }, { status: 403 })
  }
  if (!(await verifyViewKey(code, viewKey))) {
    return NextResponse.json({ error: 'Clinician key required' }, { status: 401 })
  }
  try {
    await sql`ALTER TABLE sst_clinics ADD COLUMN IF NOT EXISTS included_until TIMESTAMPTZ`.catch(() => {})
    await sql`ALTER TABLE sst_clinics ADD COLUMN IF NOT EXISTS included_pending BOOLEAN`.catch(() => {})
    const { rows } = await sql<{ included_until: string | null; included_pending: boolean | null }>`
      SELECT included_until, included_pending FROM sst_clinics WHERE code = ${code} LIMIT 1
    `
    if (!rows.length) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 })
    if (rows[0].included_until) {
      // Already running (or already expired) — never reset the clock.
      return NextResponse.json({ activated: false, alreadyActive: true, includedUntil: rows[0].included_until })
    }
    if (!rows[0].included_pending) {
      return NextResponse.json({ error: 'No pending included period on this clinic' }, { status: 409 })
    }
    const { rows: upd } = await sql<{ included_until: string }>`
      UPDATE sst_clinics
      SET included_until = NOW() + (${INCLUDED_PLATFORM_MONTHS} || ' months')::interval,
          included_pending = FALSE
      WHERE code = ${code} AND included_pending = TRUE AND included_until IS NULL
      RETURNING included_until
    `
    if (!upd.length) {
      // Raced by a concurrent activation — read back the winner's stamp.
      const { rows: again } = await sql<{ included_until: string | null }>`
        SELECT included_until FROM sst_clinics WHERE code = ${code} LIMIT 1
      `
      return NextResponse.json({ activated: false, alreadyActive: true, includedUntil: again[0]?.included_until ?? null })
    }
    return NextResponse.json({ activated: true, includedUntil: upd[0].included_until, months: INCLUDED_PLATFORM_MONTHS })
  } catch (err) {
    console.error('[sst-activate] failed:', err)
    return NextResponse.json({ error: 'Activation failed — try again' }, { status: 500 })
  }
}
