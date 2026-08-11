import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { verifySessionToken } from '@/lib/jwt-session'
import { isRegisteredClinic, verifyViewKey, getClinicUsage, getClinic, getClinicProfile, resolveActingClinician } from '@/lib/sst-trainer/clinic-registry'
import { loadReportInput, renderSkin } from '@/lib/sst-trainer/reports/load'
import { renderReportContentToHtml, type RenderReportOptions } from '@/lib/sst-trainer/reports/render'
import { renderReportContentToPdf } from '@/lib/sst-trainer/reports/render-pdf'
import { type Jurisdiction, type ReportSkinKind } from '@/lib/sst-trainer/reports/jurisdiction'

/**
 * GET /api/sst/report?code=X&k=<viewKey>&patient=<label>&skin=acc884
 *
 * Emits a JURISDICTION report (e.g. the NZ ACC884 Client Summary Report) from a
 * patient's real episode data. Same auth + premium gate as /api/sst/gp-report.
 * Jurisdiction is derived from the skin (acc* → NZ, else AU). It is NOT a gate:
 * this docblock used to claim "the skin is validated against that jurisdiction's
 * allowed set, so an AU code can't emit an ACC form and vice-versa", which was
 * never true — jurisdiction is derived FROM the skin, so the check was
 * tautological (see tests/crm-certificate.test.ts, where the same tautology was
 * removed 2026-08-05). Any registered clinic may render any skin in ALL_SKINS;
 * the clinician chooses the right paper. Corrected 2026-08-06 along with the
 * matching false claim on the public /acc page.
 *
 * Output is print-ready HTML — the ACC forms are meant to be TRANSCRIBED onto
 * ACC's fillable form; SST compiles the content.
 *
 * IDENTITY IS REQUEST-SCOPED, NEVER STORED. `sst_clinic_sessions` holds only a
 * clinic-chosen `patient_label` (de-identified by design — see load.ts). An
 * ACC884 is useless to ACC without the ACC45 claim number and the client's real
 * name/DOB, so the clinician supplies them per-request (`first`, `last`, `dob`,
 * `claim`, `ethnicity`, `clinician`, `credential`); they are stamped on the
 * printed output and never written back to the store. Do NOT "fix" this by
 * persisting identity — the de-identification is the privacy posture.
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

  // Jurisdiction is implied by the skin (acc* → NZ forms, else AU). There is
  // deliberately NO clinic-level jurisdiction gate — an AU hub can render the
  // NZ form and vice versa; the clinician chooses the right paper.
  const jurisdiction: Jurisdiction = skin === 'acc884' || skin === 'acc885' ? 'NZ' : 'AU' 

  const rl = await rateLimit({ key: `sst-report:${code}`, limit: 30, windowSec: 60 })
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  if (!(await isRegisteredClinic(code))) {
    return NextResponse.json({ error: 'Clinic code not recognised' }, { status: 404 })
  }
  if (!(await verifyViewKey(code, sp.get('k')))) {
    return NextResponse.json({ error: 'Clinician key required' }, { status: 401 })
  }
  // TRIAL clinics render documents for their (≤3) trial patients WITH a
  // trial watermark — the report IS the conversion moment ("the paperwork
  // writes itself"); a 402 here was the pitch contradicting the product
  // (2026-08-05 sweep). Subscribing removes the watermark.
  const reportUsage = code === 'DEMO00' ? null : await getClinicUsage(code)
  const isTrial = reportUsage != null && reportUsage.plan !== 'active'
  // A clinic whose INCLUDED year (bought with a course enrolment) has lapsed is
  // on the trial allowance but was never a trialist. Stamping "generated on the
  // SST free trial" across their documents is simply untrue, and it lands on
  // someone who paid for the platform and was told it was included.
  const isLapsedInclusion = isTrial && reportUsage?.includedLapsed === true

  // Request-scoped identity (never persisted). Blank fields simply fall back to
  // the de-identified label, so an omitted identity degrades gracefully.
  const str = (k: string) => sp.get(k)?.trim() || undefined
  // ATTRIBUTION — SESSION FIRST, same rule as /api/sst/pms/file. The viewKey is
  // CLINIC-wide (all 15 seats share it), so `?clinician=` is a free-text field
  // any holder of the link can set to any name; and the hub's report links
  // don't send it at all, which left the "Reporting clinician" row absent on
  // every report generated from the hub. An authenticated identity always wins;
  // the query param stays as the fallback for the keyed-hub-link case where
  // there is no portal session to resolve (2026-08-05).
  let clinicianName = str('clinician')
  let clinicianCredential = str('credential')
  try {
    const tok = request.cookies.get('session')?.value
    const sess = tok ? verifySessionToken(tok) : null
    if (sess?.email && code !== 'DEMO00') {
      const resolved = await resolveActingClinician(sess.email, code)
      if (resolved) {
        clinicianName = resolved
        clinicianCredential = undefined
      }
    }
  } catch {
    /* unreadable session → fall back to the request-scoped value */
  }

  try {
    const input = await loadReportInput(code, patientLabel, jurisdiction, {
      patientCode: str('pcode'),
      // DEMO00 only — picks which of the three anonymous demo episodes renders.
      demoCase: str('case'),
      patientRef: str('ref'),
      patient: {
        firstName: str('first'),
        lastName: str('last'),
        dob: str('dob'),
        ethnicity: str('ethnicity'),
        claimRef: str('claim'),
        diagnosis: str('diagnosis'),
      },
      clinician: clinicianName ? { name: clinicianName, credential: clinicianCredential } : undefined,
    })
    if (!input) return NextResponse.json({ error: 'No episode data for that patient' }, { status: 404 })
    const content = renderSkin(skin, input)
    const profile = code === 'DEMO00' ? null : await getClinicProfile(code)
    const clinicName = profile?.clinic_name || (await getClinic(code))?.clinicName || undefined
    // ACC forms are transcribed onto ACC's own fillable form — say so, don't
    // stamp a scary DRAFT (the CONTENT is verified against the ACC884 spec).
    const transcribeNote =
      skin === 'acc884' || skin === 'acc885'
        ? 'Transcribe onto ACC’s current fillable ' + skin.toUpperCase() + ' form.'
        : undefined
    // DEMO00 renders a fabricated fixture episode (see reports/load.ts). This
    // report is linked publicly from the /acc pitch and is printable, so the
    // disclosure has to live IN THE DOCUMENT — a caption on the pitch page
    // doesn't travel when someone saves or forwards the PDF. Banner + DEMO
    // watermark, not 'DRAFT': a draft implies a real record awaiting sign-off.
    const isDemo = code === 'DEMO00'
    const renderOpts: RenderReportOptions = {
      clinicName,
      letterhead: profile
        ? {
            practitioner: profile.clinician_name,
            ahpra: profile.ahpra_number,
            provider: profile.provider_number,
            address: profile.clinic_address,
            phone: profile.clinic_phone,
          }
        : undefined,
      footerNote: transcribeNote,
      ...(isDemo
        ? {
            draftBanner:
              'DEMONSTRATION ONLY — fabricated example data. This is not a real client, not a real health record, and must not be filed with ACC.',
            watermarkText: 'DEMO',
          }
        : isTrial
          ? {
              draftBanner:
                isLapsedInclusion
                  ? 'UNLICENSED DOCUMENT — the platform year included with your enrolment has ended. Subscribe from your clinic workspace to issue reports without this notice.'
                  : 'FREE-TRIAL DOCUMENT — generated on the SST free trial. Subscribe from your clinic workspace to issue reports without this notice.',
              watermarkText: isLapsedInclusion ? 'UNLICENSED' : 'TRIAL',
            }
          : {}),
    }

    // ?format=pdf → the same document as a downloadable A4 PDF (same banners,
    // same watermark — the disclosure travels with the file).
    if ((sp.get('format') || '').toLowerCase() === 'pdf') {
      const pdf = renderReportContentToPdf(content, renderOpts)
      const slug = `${skin}-${patientLabel.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'patient'}`
      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${slug}.pdf"`,
        },
      })
    }

    const html = renderReportContentToHtml(content, renderOpts)
    // DISPATCH TOOLBAR (owner, 2026-08-11): the document buttons opened this
    // page and dead-ended — no way to send the form anywhere. Screen-only
    // (display:none under print, and never part of the PDF): download the PDF,
    // print, or email it (PDF attached) via /api/sst/report-email, which
    // re-verifies the same code+key this URL carries.
    const toolbar = `
<div class="sst-toolbar">
  <button type="button" onclick="location.href=location.href+(location.search?'&':'?')+'format=pdf'">Download PDF</button>
  <button type="button" onclick="window.print()">Print</button>
  <span class="mailgroup">
    <input id="sst-mail-to" type="email" placeholder="doctor@clinic.com" />
    <button type="button" id="sst-mail-send">Email report</button>
  </span>
  <span id="sst-mail-status"></span>
</div>
<style>
  .sst-toolbar { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    background: #f8fafc; border-bottom: 1px solid #e2e8f0; margin: -32px -22px 20px; padding: 10px 22px; }
  .sst-toolbar button { font: 600 12px/1 -apple-system,'Segoe UI',sans-serif; color: #0d7377; background: #fff;
    border: 1px solid #cbd5e1; border-radius: 8px; padding: 7px 12px; cursor: pointer; }
  .sst-toolbar button:hover { background: #f0fdfa; }
  .sst-toolbar #sst-mail-send { color: #fff; background: #0d7377; border-color: #0d7377; }
  .sst-toolbar .mailgroup { display: inline-flex; gap: 6px; margin-left: auto; }
  .sst-toolbar input { font: 12px/1 -apple-system,'Segoe UI',sans-serif; border: 1px solid #cbd5e1; border-radius: 8px;
    padding: 7px 10px; min-width: 200px; }
  .sst-toolbar #sst-mail-status { font: 600 11.5px/1.3 -apple-system,'Segoe UI',sans-serif; color: #475569; }
  @media print { .sst-toolbar { display: none; } }
</style>
<script>
(function () {
  var btn = document.getElementById('sst-mail-send')
  var input = document.getElementById('sst-mail-to')
  var status = document.getElementById('sst-mail-status')
  btn.addEventListener('click', function () {
    var to = (input.value || '').trim()
    if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(to)) { status.textContent = 'Enter a valid email address.'; return }
    btn.disabled = true
    status.textContent = 'Sending…'
    fetch('/api/sst/report-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qs: location.search, to: to }),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d } }) })
      .then(function (res) {
        status.textContent = res.ok ? 'Sent — PDF attached.' : (res.d && res.d.error) || 'Could not send.'
        btn.disabled = false
      })
      .catch(function () { status.textContent = 'Could not send.'; btn.disabled = false })
  })
})()
</script>`
    return new NextResponse(html.replace('</style></head><body>', '</style></head><body>' + toolbar), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (err) {
    console.error('SST report error:', err)
    return NextResponse.json({ error: 'Could not build report' }, { status: 500 })
  }
}
