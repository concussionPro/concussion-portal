import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { isRegisteredClinic, verifyViewKey } from '@/lib/sst-trainer/clinic-registry'
import { buildGpReportHtml } from '@/lib/sst-trainer/gp-report-html'

/**
 * GET /api/sst/gp-report?code=X&k=<viewKey>&patient=<label>
 * See lib/sst-trainer/gp-report-html.ts for the report itself.
 * Auth identical to clinic-sessions: registered code + clinician viewKey.
 */
export async function GET(request: NextRequest) {
  const code = (request.nextUrl.searchParams.get('code') || '').trim().toUpperCase()
  const patientLabel = (request.nextUrl.searchParams.get('patient') || '').trim()
  if (!code || !patientLabel) {
    return NextResponse.json({ error: 'code and patient required' }, { status: 400 })
  }
  const rl = await rateLimit({ key: `sst-gp-report:${code}`, limit: 30, windowSec: 60 })
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  if (!(await isRegisteredClinic(code))) {
    return NextResponse.json({ error: 'Clinic code not recognised' }, { status: 404 })
  }
  const viewKey = request.nextUrl.searchParams.get('k')
  if (!(await verifyViewKey(code, viewKey))) {
    return NextResponse.json({ error: 'Clinician key required' }, { status: 401 })
  }
  try {
    const html = await buildGpReportHtml(code, patientLabel)
    if (!html) return NextResponse.json({ error: 'No episode data for that patient' }, { status: 404 })
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (err) {
    console.error('SST gp-report error:', err)
    return NextResponse.json({ error: 'Could not build report' }, { status: 500 })
  }
}
