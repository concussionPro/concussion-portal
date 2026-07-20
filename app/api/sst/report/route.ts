import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { isRegisteredClinic, verifyViewKey, getClinicUsage, getClinic } from '@/lib/sst-trainer/clinic-registry'
import { loadReportInput, renderSkin } from '@/lib/sst-trainer/reports/load'
import { renderReportContentToHtml } from '@/lib/sst-trainer/reports/render'
import { getReportSkins, reportSkinLabel, type Jurisdiction, type ReportSkinKind } from '@/lib/sst-trainer/reports/jurisdiction'

/**
 * GET /api/sst/report?code=X&k=<viewKey>&patient=<label>&skin=acc884
 *
 * Emits a JURISDICTION report (e.g. the NZ ACC884 Client Summary Report) from a
 * patient's real episode data. Same auth + premium gate as /api/sst/gp-report.
 * Jurisdiction is derived from the skin (acc* → NZ, else AU) and the skin is
 * validated against that jurisdiction's allowed set, so an AU code can't emit an
 * ACC form and vice-versa. Output is print-ready HTML — the ACC forms are meant
 * to be TRANSCRIBED onto ACC's fillable form; SST compiles the content.
 */
const ALL_SKINS: ReportSkinKind[] = ['gp-report', 'rtp-clearance', 'rtw-summary', 'medicolegal', 'acc884', 'acc885']

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const code = (sp.get('code') || '').trim().toUpperCase()
  const patientLabel = (sp.get('patient') || '').trim()
  const skin = (sp.get('skin') || 'gp-report').trim() as ReportSkinKind
  if (!code || !patientLabel) {
    return NextResponse.json({ error: 'code and patient required' }, { status: 400 })
  }
  if (!ALL_SKINS.includes(skin)) {
    return NextResponse.json({ error: `Unknown report skin. One of: ${ALL_SKINS.join(', ')}` }, { status: 400 })
  }

  // Jurisdiction is implied by the skin; validate the skin is allowed there.
  const jurisdiction: Jurisdiction = skin === 'acc884' || skin === 'acc885' ? 'NZ' : 'AU'
  if (!getReportSkins(jurisdiction).includes(skin)) {
    return NextResponse.json({ error: `${reportSkinLabel(skin)} is not available in ${jurisdiction}.` }, { status: 400 })
  }

  const rl = await rateLimit({ key: `sst-report:${code}`, limit: 30, windowSec: 60 })
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  if (!(await isRegisteredClinic(code))) {
    return NextResponse.json({ error: 'Clinic code not recognised' }, { status: 404 })
  }
  if (!(await verifyViewKey(code, sp.get('k')))) {
    return NextResponse.json({ error: 'Clinician key required' }, { status: 401 })
  }
  // PREMIUM: documents are the paid tier (DEMO exempt) — mirrors gp-report.
  if (code !== 'DEMO00') {
    const usage = await getClinicUsage(code)
    if (usage.plan !== 'active') {
      return NextResponse.json({ error: 'Clinic documents are a premium feature — subscribe to unlock.' }, { status: 402 })
    }
  }

  try {
    const input = await loadReportInput(code, patientLabel, jurisdiction)
    if (!input) return NextResponse.json({ error: 'No episode data for that patient' }, { status: 404 })
    const content = renderSkin(skin, input)
    const clinicName = (await getClinic(code))?.clinicName ?? undefined
    // ACC forms are transcribed onto ACC's own fillable form — say so, don't
    // stamp a scary DRAFT (the CONTENT is verified against the ACC884 spec).
    const footerNote =
      skin === 'acc884' || skin === 'acc885'
        ? 'Transcribe onto ACC’s current fillable ' + skin.toUpperCase() + ' form.'
        : undefined
    const html = renderReportContentToHtml(content, { clinicName, footerNote })
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (err) {
    console.error('SST report error:', err)
    return NextResponse.json({ error: 'Could not build report' }, { status: 500 })
  }
}
