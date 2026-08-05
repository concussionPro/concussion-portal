import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { SST_TIER_FROM_AUD, SST_TRIAL_PATIENT_CAP } from '@/lib/config'
import { isRegisteredClinic, verifyViewKey, getClinicUsage } from '@/lib/sst-trainer/clinic-registry'
import { buildGpReportHtml } from '@/lib/sst-trainer/gp-report-html'
import { loadGpReportData, renderGpReportPdf } from '@/lib/sst-trainer/gp-report-pdf'

/**
 * GET /api/sst/gp-report?code=X&k=<viewKey>&patient=<label>
 * See lib/sst-trainer/gp-report-html.ts for the report itself.
 * Auth identical to clinic-sessions: registered code + clinician viewKey.
 */
/** Shown when a trial clinic opens the report link — the report is premium. */
function reportPaywallHtml(origin: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Clinic documents — premium</title>
<style>body{font:15px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1e293b;background:#f7fafa;margin:0}
.card{max-width:520px;margin:70px auto;background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:34px 30px;text-align:center;box-shadow:0 18px 40px -22px rgba(22,36,63,.35)}
h1{font-size:21px;margin:0 0 6px;color:#16243f}p{color:#475569;margin:8px 0}
ul{text-align:left;max-width:360px;margin:14px auto;color:#475569;font-size:14px}
a.btn{display:inline-block;margin-top:18px;background:#16243f;color:#fff;font-weight:700;padding:13px 28px;border-radius:12px;text-decoration:none}
.sub{margin-top:12px;font-size:12.5px;color:#94a3b8}</style></head>
<body><div class="card">
<h1>Clinic documents are a premium feature</h1>
<p>Your free trial runs the full tool — the graded test, live training, and every patient&rsquo;s measured-threshold trajectory in your hub. The <strong>ready-to-sign documents</strong> come with a plan:</p>
<ul>
<li>GP / referrer episode report &amp; clearance referral</li>
<li>WorkCover &amp; NDIS allied-health reports</li>
<li>School &amp; sports-club return-to-play authorisations</li>
<li>Parent / patient symptom &amp; recovery plan</li>
</ul>
<a class="btn" href="${origin}/clinical-testing/subscribe">Unlock documents — subscribe</a>
<p class="sub">Plans from A$${SST_TIER_FROM_AUD}/month — cancel anytime. Your first ${SST_TRIAL_PATIENT_CAP} patients are free, and a watermarked preview of every document is available from your Clinical Hub during the trial.</p>
</div></body></html>`
}

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
  // PREMIUM: document outputs are the paid tier. Trial clinics run the tool and
  // review all data; the ready-to-sign report needs an active plan. DEMO exempt.
  if (code !== 'DEMO00') {
    const usage = await getClinicUsage(code)
    if (usage.plan !== 'active') {
      return new NextResponse(reportPaywallHtml(request.nextUrl.origin), {
        status: 402,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }
  }
  try {
    // PDF is the deliverable (owner 2026-07-06); ?format=html for screen.
    if (request.nextUrl.searchParams.get('format') === 'html') {
      const html = await buildGpReportHtml(code, patientLabel, request.nextUrl.searchParams.get('ref')?.trim() || '')
      if (!html) return NextResponse.json({ error: 'No episode data for that patient' }, { status: 404 })
      return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    }
    const patientRef = request.nextUrl.searchParams.get('ref')?.trim() || ''
    const data = await loadGpReportData(code, patientLabel, patientRef)
    if (!data) return NextResponse.json({ error: 'No episode data for that patient' }, { status: 404 })
    const pdf = renderGpReportPdf(data)
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="sst-episode-report-${patientLabel.replace(/[^a-z0-9-]+/gi, '-')}.pdf"`,
      },
    })
  } catch (err) {
    console.error('SST gp-report error:', err)
    return NextResponse.json({ error: 'Could not build report' }, { status: 500 })
  }
}
