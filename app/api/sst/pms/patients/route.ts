import { NextRequest, NextResponse } from 'next/server'
import { verifyViewKey } from '@/lib/sst-trainer/clinic-registry'
import { resolveTenantAdapter } from '@/lib/sst-trainer/pms/tenant'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/get-client-ip'

/**
 * GET /api/sst/pms/patients?code&k&q — search the clinic's OWN connected PMS
 * for a patient (the identity bridge: the clinician picks the PMS patient at
 * report-filing time; no stored mapping, no sync, no second source of truth).
 * Read-only; works for Gensolve too (search is how tenant validation starts).
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = await rateLimit({ key: `pms-search:${ip}`, limit: 30, windowSec: 60 })
  if (!rl.ok) return NextResponse.json({ error: 'Too many searches' }, { status: 429 })

  const p = request.nextUrl.searchParams
  const code = (p.get('code') || '').trim().toUpperCase()
  const k = p.get('k')
  const q = (p.get('q') || '').trim()
  if (!code || !k || !(await verifyViewKey(code, k).catch(() => false))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (q.length < 2) return NextResponse.json({ patients: [] })

  const resolved = await resolveTenantAdapter(code)
  if (!resolved) return NextResponse.json({ error: 'No PMS connected for this clinic' }, { status: 404 })

  try {
    const patients = await resolved.adapter.findPatient(q)
    return NextResponse.json({
      kind: resolved.kind,
      patients: patients.slice(0, 12).map((pt) => ({
        id: pt.id,
        name: `${pt.firstName} ${pt.lastName}`.trim(),
        dob: pt.dob ?? null,
      })),
    })
  } catch (err) {
    console.error(`[pms-search] ${resolved.kind} search failed for ${code}:`, err)
    return NextResponse.json({ error: 'PMS search failed — check the connection' }, { status: 502 })
  }
}
