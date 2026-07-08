import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { isRegisteredClinic, verifyViewKey, getClinicUsage } from '@/lib/sst-trainer/clinic-registry'
import { computePatientSstSummary, sstSummaryMergeFields } from '@/lib/sst-trainer/patient-summary'

/**
 * GET /api/sst/patient-summary?code=X&k=<viewKey>&patient=<label>
 * Objective SST-episode values to autofill the WorkCover/NDIS/GP documents.
 * Auth = registered code + clinician viewKey (same as the report). PREMIUM:
 * gated to an active plan, like the documents themselves. DEMO exempt.
 */
export async function GET(request: NextRequest) {
  const code = (request.nextUrl.searchParams.get('code') || '').trim().toUpperCase()
  const patientLabel = (request.nextUrl.searchParams.get('patient') || '').trim()
  if (!code || !patientLabel) {
    return NextResponse.json({ error: 'code and patient required' }, { status: 400 })
  }
  const rl = await rateLimit({ key: `sst-patient-summary:${code}`, limit: 60, windowSec: 60 })
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  if (!(await isRegisteredClinic(code))) {
    return NextResponse.json({ error: 'Clinic code not recognised' }, { status: 404 })
  }
  if (!(await verifyViewKey(code, request.nextUrl.searchParams.get('k')))) {
    return NextResponse.json({ error: 'Clinician key required' }, { status: 401 })
  }
  if (code !== 'DEMO00') {
    const usage = await getClinicUsage(code)
    if (usage.plan !== 'active') {
      return NextResponse.json({ error: 'premium', message: 'Documents require an active plan.' }, { status: 402 })
    }
  }
  const summary = await computePatientSstSummary(code, patientLabel)
  if (!summary) return NextResponse.json({ error: 'No episode data for that patient' }, { status: 404 })
  return NextResponse.json({ summary, mergeFields: sstSummaryMergeFields(summary) })
}
