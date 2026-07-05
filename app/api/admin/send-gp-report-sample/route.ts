import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'
import { sendEmailWithAttachment } from '@/lib/resend-client'
import { loadGpReportData, renderGpReportPdf, type GpReportData } from '@/lib/sst-trainer/gp-report-pdf'

/**
 * POST /api/admin/send-gp-report-sample
 * Body: { patient?: string, code?: string, to?: string }
 *
 * Emails the PDF GP episode report (owner preview / clinic demo). Demo
 * episodes only hold a single test, so a clearly-labelled mock series is
 * substituted when the episode has fewer than two measured thresholds.
 */
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const code = (body.code as string | undefined)?.toUpperCase() || 'DEMO00'
  const patient = (body.patient as string | undefined) || 'Jordan Pike'
  const to = (body.to as string | undefined) || 'z.lew87@gmail.com'

  let data = await loadGpReportData(code, patient).catch(() => null)
  if (!data) return NextResponse.json({ error: 'no episode data' }, { status: 404 })

  const mocked = data.traj.filter((t) => t.hrt != null).length < 2
  if (mocked) {
    const day = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()
    const mk = (n: number, hrt: number, resting: number, end: number, interp: string): GpReportData['tests'][number] & GpReportData['traj'][number] =>
      ({ date: day(n), hrt, verified: true, restingSx: resting, endSx: end, interpretation: interp })
    const tests = [mk(35, 118, 2, 5, 'intolerance'), mk(28, 132, 2, 5, 'intolerance'), mk(21, 141, 1, 4, 'intolerance'), mk(14, 152, 1, 4, 'intolerance'), mk(7, 165, 0, 1, 'no-intolerance')]
    data = {
      ...data,
      patientLabel: `${data.patientLabel} [MOCK SERIES]`,
      clearanceReady: true,
      interp: 'no-intolerance',
      latestHrt: 165,
      bandLow: 132,
      bandHigh: 149,
      testCount: 5,
      traj: tests,
      tests,
      sessionRows: [26, 24, 21, 19, 17, 14, 12, 10, 8, 6].map((n, i) => ({
        date: day(n), pre: i < 4 ? 2 : 1, peak: i === 1 ? 4 : i < 4 ? 3 : 1,
        minutes: 20, verified: i !== 7, flare: i === 1,
      })),
      sessionsTotal: 24,
      sessionsVerified: 21,
      weeks: 5,
      flares: 2,
    }
  }

  const pdf = renderGpReportPdf(data)
  const ok = await sendEmailWithAttachment({
    to,
    subject: `${mocked ? 'MOCK — ' : ''}SST Trainer GP episode report (PDF)`,
    html: `<p style="font:14px -apple-system,sans-serif;color:#1e293b">Attached: the auto-generated GP episode report for <strong>${patient}</strong>${mocked ? ' (mock five-week series — demo episodes hold a single test)' : ''}. This PDF is what the roster button produces and what pairs with the GP/Referrer Letter template as the data attachment.</p>`,
    attachments: [{ filename: `sst-episode-report-${patient.replace(/[^a-z0-9-]+/gi, '-')}.pdf`, content: pdf }],
  })
  return NextResponse.json({ ok, to, code, patient, mocked, format: 'pdf' })
}
