import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'
import { grantSstEntitlement } from '@/lib/users'
import {
  createSstClinic,
  getSstClinicByEmail,
  setSstClinicPlan,
  getClinicUsage,
} from '@/lib/sst-trainer/clinic-registry'

/**
 * POST /api/admin/alumni-sst-activation — owner directive 2026-08-03:
 * "give alumni the 1 year free access… ID them and spin up their clinical
 * suite/tools in their dash's."
 *
 * For every PAID, non-test course user (online-only | full-course):
 *   1. grant the SST entitlement (the 'sst' access door — Clinical Testing
 *      unlocks in their dashboard regardless of the launch flag),
 *   2. provision their clinic idempotently (existing clinic wins; clinic
 *      name = their own name — solo-practitioner default, renameable later),
 *   3. set plan 'active' (lifts the 3-patient trial cap for the included year).
 *
 * Deliberately sends NO email — the owner communicates personally. The comp
 * year is recorded in the response (activated_at); billing at year-end is a
 * separate later step.
 *
 * Body: { dryRun?: boolean }
 */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const dryRun = body?.dryRun !== false // default TRUE — must pass {dryRun:false} to execute

  const { rows: alumni } = await sql`
    SELECT id, email, name, access_level, created_at::date AS joined
    FROM users
    WHERE access_level IN ('online-only', 'full-course')
      AND COALESCE(is_test, false) = false
    ORDER BY created_at
  `

  const results: Array<Record<string, unknown>> = []
  for (const a of alumni) {
    const email = String(a.email).toLowerCase()
    const name = (a.name as string) || email.split('@')[0]
    const existing = await getSstClinicByEmail(email)
    if (dryRun) {
      results.push({
        email,
        name,
        accessLevel: a.access_level,
        joined: a.joined,
        wouldProvision: !existing,
        existingCode: existing?.code ?? null,
      })
      continue
    }
    try {
      await grantSstEntitlement(email, name)
      const clinic =
        existing ??
        (await createSstClinic({ clinicName: name, contactName: name, email }))
      await setSstClinicPlan(clinic.code, 'active')
      const usage = await getClinicUsage(clinic.code)
      results.push({
        email,
        name,
        code: clinic.code,
        plan: usage.plan,
        capLifted: usage.cap === null,
        preExisting: Boolean(existing),
        activated_at: new Date().toISOString().slice(0, 10),
      })
    } catch (err) {
      results.push({ email, name, error: err instanceof Error ? err.message : String(err) })
    }
  }

  return NextResponse.json({ dryRun, count: alumni.length, results })
}
