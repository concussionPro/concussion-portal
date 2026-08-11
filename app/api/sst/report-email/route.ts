import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/get-client-ip'
import { isRegisteredClinic, verifyViewKey, getClinicUsage, getClinic, getClinicProfile } from '@/lib/sst-trainer/clinic-registry'
import { loadReportInput, renderSkin } from '@/lib/sst-trainer/reports/load'
import type { RenderReportOptions } from '@/lib/sst-trainer/reports/render'
import { renderReportContentToPdf } from '@/lib/sst-trainer/reports/render-pdf'
import { type Jurisdiction, type ReportSkinKind } from '@/lib/sst-trainer/reports/jurisdiction'
import { sendEmailWithAttachment } from '@/lib/resend-client'
import { isEmailSuppressed } from '@/lib/email-suppression'

/**
 * POST /api/sst/report-email — { qs: "<the report URL's query string>", to }
 *
 * Emails the SAME document the report page shows, as a PDF attachment. The
 * report's dispatch toolbar posts its own location.search verbatim, so the
 * two surfaces can never render different documents for the same link — and
 * auth re-verifies here exactly as on GET /api/sst/report (clinic code +
 * viewKey; DEMO00 keyless by design).
 *
 * SEND-PATH RULES (2026-07-01 doctrine): suppression is checked FAIL CLOSED
 * before any send; the endpoint is rate-limited per-IP and per-clinic
 * (DEMO00 is keyless and therefore world-postable — the caps are what stop
 * it becoming a spam relay, and the demo document is watermarked DEMO on
 * every page). One recipient per call; no free-text content — subject and
 * body are composed server-side.
 *
 * KEEP IN SYNC with GET /api/sst/report: the load + renderOpts assembly is
 * deliberately the same shape (banner, watermark, letterhead, trial notice).
 */
const ALL_SKINS: ReportSkinKind[] = ['gp-report', 'rtp-clearance', 'rtw-summary', 'medicolegal', 'acc884', 'acc885']

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const to = typeof body?.to === 'string' ? body.to.trim() : ''
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return NextResponse.json({ error: 'A valid recipient email is required' }, { status: 400 })
  }
  const sp = new URLSearchParams(typeof body?.qs === 'string' ? body.qs : '')

  const code = (sp.get('code') || '').trim().toUpperCase()
  const patientLabel = (sp.get('patient') || '').trim()
  const skin = (sp.get('skin') || 'gp-report').trim() as ReportSkinKind
  if (!code || !patientLabel) return NextResponse.json({ error: 'code and patient required' }, { status: 400 })
  if (!ALL_SKINS.includes(skin)) return NextResponse.json({ error: 'Unknown report skin' }, { status: 400 })

  // Tighter than the GET: sending mail costs reputation, not just CPU.
  const ip = getClientIp(request) || 'unknown'
  const [byIp, byClinic] = await Promise.all([
    rateLimit({ key: `sst-report-mail:i:${ip}`, limit: 5, windowSec: 600 }),
    rateLimit({ key: `sst-report-mail:c:${code}`, limit: 20, windowSec: 86_400 }),
  ])
  if (!byIp.ok || !byClinic.ok) {
    return NextResponse.json({ error: 'Too many sends — try again later' }, { status: 429 })
  }

  if (!(await isRegisteredClinic(code))) return NextResponse.json({ error: 'Clinic code not recognised' }, { status: 404 })
  if (!(await verifyViewKey(code, sp.get('k')))) return NextResponse.json({ error: 'Clinician key required' }, { status: 401 })

  // FAIL CLOSED — an unsubscribed address never receives another send, even a
  // clinician-initiated clinical document; surface it so the clinician posts
  // the report another way instead of assuming it arrived.
  if (await isEmailSuppressed(to)) {
    return NextResponse.json({ error: 'That address has unsubscribed from our emails — send the PDF another way' }, { status: 422 })
  }

  const jurisdiction: Jurisdiction = skin === 'acc884' || skin === 'acc885' ? 'NZ' : 'AU'
  const isDemo = code === 'DEMO00'
  const reportUsage = isDemo ? null : await getClinicUsage(code)
  const isTrial = reportUsage != null && reportUsage.plan !== 'active'
  const isLapsedInclusion = isTrial && reportUsage?.includedLapsed === true

  const str = (k: string) => sp.get(k)?.trim() || undefined
  try {
    const input = await loadReportInput(code, patientLabel, jurisdiction, {
      patientCode: str('pcode'),
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
      clinician: str('clinician') ? { name: str('clinician') as string, credential: str('credential') } : undefined,
    })
    if (!input) return NextResponse.json({ error: 'No episode data for that patient' }, { status: 404 })
    const content = renderSkin(skin, input)
    const profile = isDemo ? null : await getClinicProfile(code)
    const clinicName = profile?.clinic_name || (await getClinic(code))?.clinicName || undefined
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
      footerNote:
        skin === 'acc884' || skin === 'acc885'
          ? 'Transcribe onto ACC’s current fillable ' + skin.toUpperCase() + ' form.'
          : undefined,
      ...(isDemo
        ? {
            draftBanner:
              'DEMONSTRATION ONLY — fabricated example data. This is not a real client, not a real health record, and must not be filed with ACC.',
            watermarkText: 'DEMO',
          }
        : isTrial
          ? {
              draftBanner: isLapsedInclusion
                ? 'UNLICENSED DOCUMENT — the platform year included with your enrolment has ended. Subscribe from your clinic workspace to issue reports without this notice.'
                : 'FREE-TRIAL DOCUMENT — generated on the SST free trial. Subscribe from your clinic workspace to issue reports without this notice.',
              watermarkText: isLapsedInclusion ? 'UNLICENSED' : 'TRIAL',
            }
          : {}),
    }

    const pdf = renderReportContentToPdf(content, renderOpts)
    const slug = `${skin}-${patientLabel.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'patient'}`
    const subject = `${isDemo ? '[Example] ' : ''}${content.title}${clinicName ? ` — ${clinicName}` : ''}`
    const bodyHtml = `
      <p>Please find attached: <strong>${content.title.replace(/</g, '&lt;')}</strong>${clinicName ? `, sent from ${clinicName.replace(/</g, '&lt;')}` : ''} via SST Trainer (Concussion Education Australia).</p>
      ${isDemo ? '<p><strong>This is a demonstration document</strong> built from fabricated example data — it is not a real client and not a real health record.</p>' : ''}
      <p style="color:#64748b;font-size:12px">Decision-support document — reviewed and signed by the supervising clinician before any clinical use. If you weren’t expecting this report, you can disregard it.</p>`

    const ok = await sendEmailWithAttachment({
      to,
      subject,
      html: bodyHtml,
      attachments: [{ filename: `${slug}.pdf`, content: Buffer.from(pdf) }],
    })
    if (!ok) return NextResponse.json({ error: 'Could not send — try again shortly' }, { status: 502 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('SST report-email error:', err)
    return NextResponse.json({ error: 'Could not build report' }, { status: 500 })
  }
}
