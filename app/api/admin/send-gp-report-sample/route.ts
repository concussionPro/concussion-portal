import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'
import { sendEmail } from '@/lib/resend-client'

/**
 * POST /api/admin/send-gp-report-sample
 * Body: { patient?: string, code?: string, to?: string }
 *
 * Emails the auto-generated SST GP episode report to the owner (default) —
 * used to preview the report end-to-end in a real inbox, and later to demo
 * it to founding clinics. When the episode has fewer than two measured
 * thresholds (all DEMO00 patients today), a clearly-labelled mock
 * trajectory is injected so the instrument itself is visible.
 */
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const code = (body.code as string | undefined)?.toUpperCase() || 'DEMO00'
  const patient = (body.patient as string | undefined) || 'Jordan Pike'
  const to = (body.to as string | undefined) || 'z.lew87@gmail.com'

  const origin = req.nextUrl.origin
  const res = await fetch(
    `${origin}/api/sst/gp-report?code=${encodeURIComponent(code)}&patient=${encodeURIComponent(patient)}`,
    { cache: 'no-store' },
  )
  if (!res.ok) {
    return NextResponse.json({ error: `report fetch failed: ${res.status}` }, { status: 502 })
  }
  let html = await res.text()

  // Demo episodes have a single test — inject a labelled mock trajectory so
  // the emailed preview shows the actual instrument.
  if (html.includes('Fewer than two measured thresholds')) {
    const pts: Array<[string, number]> = [['26 May', 118], ['2 Jun', 132], ['9 Jun', 141], ['16 Jun', 152], ['23 Jun', 165]]
    const W = 640, H = 180, PAD = 34
    const vals = pts.map((p) => p[1])
    const mn = Math.min(...vals) - 8, mx = Math.max(...vals) + 8
    const X = (i: number) => PAD + (i / (pts.length - 1)) * (W - PAD * 2)
    const Y = (v: number) => H - PAD - ((v - mn) / (mx - mn)) * (H - PAD * 2)
    const poly = pts.map((p, i) => `${X(i).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' ')
    const dots = pts
      .map((p, i) =>
        `<circle cx="${X(i).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="4" fill="#0d7377"/>` +
        `<text x="${X(i).toFixed(1)}" y="${(Y(p[1]) - 9).toFixed(1)}" font-size="10" text-anchor="middle" fill="#334155">${p[1]}</text>` +
        `<text x="${X(i).toFixed(1)}" y="${H - 12}" font-size="9" text-anchor="middle" fill="#64748b">${p[0]}</text>`)
      .join('')
    const svg = `<svg viewBox="0 0 ${W} ${H}" role="img"><polyline points="${poly}" fill="none" stroke="#0d7377" stroke-width="2"/>${dots}</svg>
<p class="legend">Teal points are sensor-verified measurements (bpm at each graded test). Final test: no symptom exacerbation to volitional exhaustion. [Mock series for preview]</p>`
    html = html.replace(/<p class="legend">Fewer than two measured thresholds[^<]*<\/p>/, svg)
    html = html.replace('<tr><th>Graded tests (measured HRt)</th><td>1</td></tr>', '<tr><th>Graded tests (measured HRt)</th><td>5</td></tr>')
    html = html.replace(/<tr><th>Home training sessions<\/th><td>\d+ total · \d+ sensor-verified<\/td><\/tr>/, '<tr><th>Home training sessions</th><td>24 total · 21 sensor-verified</td></tr>')
    html = html.replace(/<tr><th>Symptom flares during training<\/th><td>\d+<\/td><\/tr>/, '<tr><th>Symptom flares during training</th><td>2 (weeks 1–2; settled without regression)</td></tr>')
  }

  const banner =
    '<div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:10px 14px;margin-bottom:16px;font:13px -apple-system,sans-serif;color:#92400e"><strong>MOCK REPORT</strong> — demo-data preview of the auto-built GP episode report: trajectory, compliance, and the referral-back recommendation. Live reports generate per patient from the Patients roster.</div>'
  html = html.replace('<body>', '<body>' + banner).replace(/<button class="noprint"[\s\S]*?<\/button>/, '')

  const ok = await sendEmail({
    to,
    subject: 'MOCK — SST Trainer GP episode report (clearance referral preview)',
    html,
  })
  return NextResponse.json({ ok, to, code, patient })
}
