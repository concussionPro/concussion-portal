import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { resolveActingClinician } from '@/lib/sst-trainer/clinic-registry'
import { verifyViewKey, getClinicUsage } from '@/lib/sst-trainer/clinic-registry'
import { resolveTenantAdapter, gensolveWritesConfirmed, markPmsOk } from '@/lib/sst-trainer/pms/tenant'
import { deliverReport } from '@/lib/sst-trainer/pms/deliver'
import { loadReportInput, renderSkin } from '@/lib/sst-trainer/reports/load'

import { type Jurisdiction, type ReportSkinKind } from '@/lib/sst-trainer/reports/jurisdiction'

const ALL_SKINS: ReportSkinKind[] = ['gp-report', 'rtp-clearance', 'rtw-summary', 'medicolegal', 'acc884', 'acc885']
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/get-client-ip'

/**
 * POST /api/sst/pms/file — file a report into the patient's record in the
 * clinic's OWN PMS. The loop-closer: episode data → rendered report → clinical
 * note in Gensolve/Cliniko, no re-keying, no portal for the clinician to visit.
 *
 * Body: { code, k, patient, skin, pmsPatientId, claim?, clinician? }
 *
 * GENSOLVE WRITE GATE: until GENSOLVE_UPLOAD_CONFIRMED=true (set after the
 * first partner tenant validates the write field-shapes), Gensolve filing
 * returns a clear "pending first-partner validation" — search works, writes
 * wait. Cliniko writes are live (tenant-validated 2026-07-20).
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = await rateLimit({ key: `pms-file:${ip}`, limit: 20, windowSec: 60 })
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  let body: {
    code?: string; k?: string; patient?: string; skin?: string
    pmsPatientId?: string; claim?: string; clinician?: string; ref?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const code = (body.code || '').trim().toUpperCase()
  const patient = (body.patient || '').trim()
  const skin = (body.skin || '') as ReportSkinKind
  const pmsPatientId = (body.pmsPatientId || '').trim()
  if (code === 'DEMO00') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!code || !body.k || !(await verifyViewKey(code, body.k).catch(() => false))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!patient || !pmsPatientId) return NextResponse.json({ error: 'patient and pmsPatientId required' }, { status: 400 })

  // Jurisdiction is implied by the skin (same rule as the report viewer);
  // unknown skins are rejected below by renderSkin's input contract.
  const jurisdiction: Jurisdiction = skin === 'acc884' || skin === 'acc885' ? 'NZ' : 'AU'
  if (!ALL_SKINS.includes(skin)) {
    return NextResponse.json({ error: 'Unknown report type' }, { status: 400 })
  }

  const resolved = await resolveTenantAdapter(code)
  if (!resolved) return NextResponse.json({ error: 'No PMS connected for this clinic' }, { status: 404 })
  if (resolved.kind === 'gensolve' && !gensolveWritesConfirmed()) {
    return NextResponse.json(
      {
        error:
          'Gensolve filing is pending first-partner validation — the adapter is built, and switching it on for your tenant is part of the pilot. Search works now; filing follows validation.',
        pendingValidation: true,
      },
      { status: 409 },
    )
  }

  try {
    const input = await loadReportInput(code, patient, jurisdiction, {
      patientRef: typeof body.ref === 'string' ? body.ref : undefined,
      patient: body.claim?.trim() ? { claimRef: body.claim.trim() } : undefined,
      clinician: await (async () => {
        if (body.clinician?.trim()) return { name: body.clinician.trim() }
        // Attribution fallback (2026-08-04 seats build): resolve WHO is acting
        // from the portal session — owner or seated member — so filed notes
        // carry a real name even when the UI didn't pass one.
        const tok = request.cookies.get('session')?.value
        const sess = tok ? verifySessionToken(tok) : null
        if (sess?.email) {
          const name = await resolveActingClinician(sess.email, code)
          if (name) return { name }
        }
        return undefined
      })(),
    })
    if (!input) return NextResponse.json({ error: 'No episode data found for that patient label' }, { status: 404 })
    const content = renderSkin(skin, input)
    // Trial clinics may file, but the filed note carries the same trial
    // notice the on-screen document does — filing was bypassing the entire
    // premium/watermark layer (2026-08-05 sweep #3).
    if (code !== 'DEMO00' && (await getClinicUsage(code)).plan !== 'active') {
      content.sections.push({
        heading: 'Notice',
        kind: 'narrative',
        body: ['FREE-TRIAL DOCUMENT — generated on the SST free trial. Subscribe from the clinic workspace to file reports without this notice.'],
      })
    }
    const result = await deliverReport({
      adapter: resolved.adapter,
      patientId: pmsPatientId,
      content,
      occurredAt: new Date().toISOString(),
    })
    if (result.ok) await markPmsOk(code)
    return NextResponse.json(
      result.ok
        ? { ok: true, noteId: result.note.id ?? null }
        : { ok: false, error: result.note.error || 'The PMS refused the note' },
      { status: result.ok ? 200 : 502 },
    )
  } catch (err) {
    console.error(`[pms-file] failed for ${code}/${skin}:`, err)
    return NextResponse.json({ error: 'Filing failed — nothing was written' }, { status: 500 })
  }
}
