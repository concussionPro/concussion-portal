import { jsPDF } from 'jspdf'
import { sql } from '@/lib/db'
import { getClinic } from '@/lib/sst-trainer/clinic-registry'

/**
 * PDF GP / referring-practitioner episode report (owner 2026-07-06:
 * "needs to be in pdf. more dot point information. CEA branded — subtle,
 * footer or something").
 *
 * A4 jsPDF, matching the certificate/tax-invoice house stack. Dot-point
 * dense; branding is a thin teal footer rule + one small grey line.
 * Recommendation branches on the latest re-test interpretation.
 */

type Row = {
  patient_label: string | null
  session_type: string
  hrt_bpm: number | null
  band_low: number | null
  band_high: number | null
  condition: string | null
  payload: Record<string, unknown> | null
  created_at: string
}

const TEAL: [number, number, number] = [13, 115, 119]
const SLATE8: [number, number, number] = [30, 41, 59]
const SLATE5: [number, number, number] = [100, 116, 139]
const AMBER: [number, number, number] = [180, 83, 9]

function fmt(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export interface GpReportData {
  patientLabel: string
  clinicName: string
  condition: string
  firstDate: string
  lastDate: string
  clearanceReady: boolean
  interp: string | null
  latestHrt: number | null
  bandLow: number | null
  bandHigh: number | null
  testCount: number
  traj: Array<{ date: string; hrt: number | null; verified: boolean }>
  tests: Array<{
    date: string
    restingSx: number | null
    endSx: number | null
    hrt: number | null
    interpretation: string | null
    verified: boolean
  }>
  sessionRows: Array<{
    date: string
    pre: number | null
    peak: number | null
    minutes: number | null
    verified: boolean
    flare: boolean
  }>
  sessionsTotal: number
  sessionsVerified: number
  weeks: number
  flares: number
}

export async function loadGpReportData(code: string, patientLabel: string): Promise<GpReportData | null> {
  const { rows } = await sql<Row>`
    SELECT patient_label, session_type, hrt_bpm, band_low, band_high, condition, payload, created_at
    FROM sst_clinic_sessions
    WHERE upper(clinic_code) = ${code}
      AND trim(coalesce(patient_label, '')) = ${patientLabel}
    ORDER BY created_at ASC
  `
  if (rows.length === 0) return null
  const thresholds = rows.filter((r) => r.session_type === 'threshold')
  const trainings = rows.filter((r) => r.session_type !== 'threshold')
  const latest = thresholds[thresholds.length - 1]
  const interp = (latest?.payload?.interpretation as string | undefined) ?? null
  const weekSet = new Set(
    trainings.map((t) => {
      const d = new Date(t.created_at)
      return `${d.getFullYear()}-${Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000 + 4) / 7)}`
    }),
  )
  return {
    patientLabel,
    clinicName: (await getClinic(code))?.clinicName ?? code,
    condition: latest?.condition ?? 'concussion',
    firstDate: rows[0].created_at,
    lastDate: rows[rows.length - 1].created_at,
    clearanceReady: interp === 'no-intolerance',
    interp,
    latestHrt: latest?.hrt_bpm ?? null,
    bandLow: latest?.band_low ?? null,
    bandHigh: latest?.band_high ?? null,
    testCount: thresholds.length,
    traj: thresholds.map((t) => {
      const src = (t.payload?.hrSource as string | undefined) ?? undefined
      return {
        date: t.created_at,
        hrt: t.hrt_bpm,
        verified: t.payload?.hrVerified === true && src !== 'manual' && src !== undefined,
      }
    }),
    tests: thresholds.map((t) => {
      const stages = Array.isArray(t.payload?.stages) ? (t.payload.stages as Array<Record<string, unknown>>) : []
      const lastStage = stages[stages.length - 1]
      const src = (t.payload?.hrSource as string | undefined) ?? undefined
      return {
        date: t.created_at,
        restingSx: typeof t.payload?.restingSymptomScore === 'number' ? (t.payload.restingSymptomScore as number) : null,
        endSx: typeof lastStage?.symptomScore === 'number' ? (lastStage.symptomScore as number) : null,
        hrt: t.hrt_bpm,
        interpretation: (t.payload?.interpretation as string | undefined) ?? null,
        verified: t.payload?.hrVerified === true && src !== 'manual' && src !== undefined,
      }
    }),
    sessionRows: trainings.slice(-10).map((t) => {
      const pre = typeof t.payload?.preSymptom === 'number' ? (t.payload.preSymptom as number) : null
      const peak = typeof t.payload?.peakSymptom === 'number' ? (t.payload.peakSymptom as number) : null
      return {
        date: t.created_at,
        pre,
        peak,
        minutes: typeof t.payload?.completedMinutes === 'number' ? (t.payload.completedMinutes as number) : null,
        verified: t.payload?.hrVerified === true,
        flare: t.payload?.flare === true || t.payload?.nextDayFlare === true || (pre != null && peak != null && peak - pre >= 2),
      }
    }),
    sessionsTotal: trainings.length,
    sessionsVerified: trainings.filter((t) => t.payload?.hrVerified === true).length,
    weeks: Math.max(1, weekSet.size),
    flares: trainings.filter((t) => {
      const pre = typeof t.payload?.preSymptom === 'number' ? (t.payload.preSymptom as number) : null
      const peak = typeof t.payload?.peakSymptom === 'number' ? (t.payload.peakSymptom as number) : null
      return t.payload?.flare === true || (pre != null && peak != null && peak - pre >= 2)
    }).length,
  }
}

function bullets(doc: jsPDF, items: string[], x: number, y: number, maxW: number): number {
  doc.setFontSize(9.5)
  doc.setTextColor(...SLATE8)
  for (const item of items) {
    const lines = doc.splitTextToSize(item, maxW - 5)
    doc.setFillColor(...TEAL)
    doc.circle(x + 1.2, y - 1.2, 0.8, 'F')
    doc.text(lines, x + 4.5, y)
    y += lines.length * 4.4 + 1.6
  }
  return y
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(10.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...SLATE8)
  doc.text(title, 20, y)
  doc.setFont('helvetica', 'normal')
  return y + 6
}

export function renderGpReportPdf(d: GpReportData): Buffer {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  let y = 22

  // Header
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...SLATE8)
  doc.text('Sub-Symptom Threshold Exercise Program', 20, y)
  y += 6.5
  doc.setFontSize(11)
  doc.setTextColor(...TEAL)
  doc.text('Episode report for the referring practitioner', 20, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...SLATE5)
  doc.text(
    `Patient: ${d.patientLabel}   ·   Condition: ${d.condition}   ·   Episode: ${fmt(d.firstDate)} – ${fmt(d.lastDate)}`,
    20, y,
  )
  y += 4.5
  doc.text(
    `Supervising clinic: ${d.clinicName}   ·   Report generated: ${fmt(new Date())}   ·   Supports the written report to the referrer (MBS CDM allied-health items)`,
    20, y,
  )
  y += 4
  doc.setDrawColor(...TEAL)
  doc.setLineWidth(0.5)
  doc.line(20, y, W - 20, y)
  y += 9

  // Program summary
  y = sectionTitle(doc, 'Program summary', y)
  y = bullets(doc, [
    `Graded symptom-threshold tests completed: ${d.testCount} (Buffalo protocol; test terminates at a sustained 3-point symptom rise or volitional exhaustion).`,
    d.latestHrt != null
      ? `Latest measured threshold: ${d.latestHrt} bpm — prescribed home-training band ${d.bandLow}–${d.bandHigh} bpm (80–90% of measured threshold).`
      : 'Latest graded test: threshold not measurable (see interpretation below).',
    `Latest test interpretation: ${d.interp ?? 'pending re-test'}.`,
    `Home program: ~20 minutes of aerobic work inside the prescribed band, monitored live from the patient's own heart-rate device.`,
  ], 22, y, W - 44)
  y += 3

  // Trajectory chart
  y = sectionTitle(doc, 'Measured threshold trajectory', y)
  const usable = d.traj.filter((p) => typeof p.hrt === 'number') as Array<{ date: string; hrt: number; verified: boolean }>
  if (usable.length >= 2) {
    const cx = 22, cw = W - 52, ch = 42, cy = y + 2
    const vals = usable.map((p) => p.hrt)
    const mn = Math.min(...vals) - 8, mx = Math.max(...vals) + 8
    const X = (i: number) => cx + (i / (usable.length - 1)) * cw
    const Y = (v: number) => cy + ch - ((v - mn) / (mx - mn || 1)) * ch
    doc.setDrawColor(...TEAL)
    doc.setLineWidth(0.6)
    for (let i = 1; i < usable.length; i++) {
      doc.line(X(i - 1), Y(usable[i - 1].hrt), X(i), Y(usable[i].hrt))
    }
    doc.setFontSize(8)
    for (let i = 0; i < usable.length; i++) {
      const p = usable[i]
      if (p.verified) doc.setFillColor(...TEAL)
      else doc.setFillColor(148, 163, 184)
      doc.circle(X(i), Y(p.hrt), 1.4, 'F')
      doc.setTextColor(...SLATE8)
      doc.text(String(p.hrt), X(i), Y(p.hrt) - 3, { align: 'center' })
      doc.setTextColor(...SLATE5)
      doc.text(new Date(p.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }), X(i), cy + ch + 5, { align: 'center' })
    }
    y = cy + ch + 9
    doc.setFontSize(8)
    doc.setTextColor(...SLATE5)
    doc.text('Teal points: sensor-verified measurements. Grey: unverified source. Values are the symptom-threshold heart rate (bpm) at each graded test.', 22, y)
    y += 8
  } else {
    y = bullets(doc, ['Fewer than two measured thresholds recorded — the trajectory chart is produced from the second graded test onward.'], 22, y, W - 44)
    y += 3
  }

  // table renderer: header row + zebra data rows
  const table = (headers: string[], widths: number[], rows: string[][], startY: number): number => {
    let ty = startY
    const x0 = 20
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...SLATE5)
    let x = x0
    headers.forEach((h, i) => { doc.text(h, x + 1.5, ty); x += widths[i] })
    ty += 1.6
    doc.setDrawColor(203, 213, 225)
    doc.setLineWidth(0.25)
    doc.line(x0, ty, x0 + widths.reduce((a, b) => a + b, 0), ty)
    ty += 4.2
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...SLATE8)
    for (const row of rows) {
      x = x0
      row.forEach((cell, i) => { doc.text(cell, x + 1.5, ty); x += widths[i] })
      ty += 4.6
    }
    return ty + 2
  }

  // Graded tests — symptom data
  y = sectionTitle(doc, 'Graded tests — symptom data', y)
  y = table(
    ['Date', 'Resting sx', 'Sx at end', 'Rise', 'HRt (bpm)', 'Result', 'HR source'],
    [24, 22, 21, 14, 22, 44, 22],
    d.tests.map((t) => [
      new Date(t.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
      t.restingSx != null ? `${t.restingSx}/10` : '—',
      t.endSx != null ? `${t.endSx}/10` : '—',
      t.restingSx != null && t.endSx != null ? `+${Math.max(0, t.endSx - t.restingSx)}` : '—',
      t.hrt != null ? String(t.hrt) : '—',
      (t.interpretation ?? '—').replace('no-intolerance', 'no intolerance (recovered)').replace('intolerance', 'intolerance'),
      t.verified ? 'verified' : 'unverified',
    ]),
    y,
  )
  y += 2

  // Recent home sessions — symptom data
  y = sectionTitle(doc, `Home sessions — symptom data (last ${d.sessionRows.length} of ${d.sessionsTotal})`, y)
  y = table(
    ['Date', 'Pre sx', 'Peak sx', 'Rise', 'Minutes', 'HR', 'Flare'],
    [24, 18, 18, 14, 18, 24, 18],
    d.sessionRows.map((r) => [
      new Date(r.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
      r.pre != null ? `${r.pre}/10` : '—',
      r.peak != null ? `${r.peak}/10` : '—',
      r.pre != null && r.peak != null ? `+${Math.max(0, r.peak - r.pre)}` : '—',
      r.minutes != null ? String(r.minutes) : '—',
      r.verified ? 'verified' : 'manual',
      r.flare ? 'YES' : '—',
    ]),
    y,
  )
  doc.setFontSize(8)
  doc.setTextColor(...SLATE5)
  doc.text(
    `Totals: ${d.sessionsTotal} sessions over ${d.weeks} week${d.weeks === 1 ? '' : 's'} (~${(d.sessionsTotal / d.weeks).toFixed(1)}/wk) · ${d.sessionsVerified} sensor-verified (${d.sessionsTotal > 0 ? Math.round((d.sessionsVerified / d.sessionsTotal) * 100) : 0}%) · ${d.flares} flare${d.flares === 1 ? '' : 's'} · sessions auto-stop at a 2-point rise · progression advances on verified clean sessions only`,
    20, y, { maxWidth: W - 40 },
  )
  y += 10

  // second page if the recommendation won't fit
  if (y > 240) { doc.addPage(); y = 24 }

  // Recommendation — compact
  const recColor = d.clearanceReady ? TEAL : AMBER
  const recTitle = d.clearanceReady
    ? 'Recommendation: referral back for clearance review'
    : 'Recommendation: extension of the treatment plan'
  const recBody = d.clearanceReady
    ? [
        'Latest re-test: no symptom exacerbation to volitional exhaustion — recovered exercise tolerance; program goal met on objective criteria.',
        'Recommend medical review for clearance to return to sport, subject to your assessment and code-of-sport stand-down requirements.',
      ]
    : [
        'Latest test still provokes symptoms below expected capacity — exercise intolerance improving but unresolved (trajectory above).',
        'Recommend extension of the treatment plan: continued supervised sub-symptom training with re-testing to objective resolution before clearance.',
      ]
  doc.setDrawColor(...recColor)
  doc.setLineWidth(0.7)
  const boxTop = y
  let by = y + 7
  doc.setFontSize(10.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...recColor)
  doc.text(recTitle, 24, by)
  doc.setFont('helvetica', 'normal')
  by += 6
  doc.setFontSize(9.5)
  doc.setTextColor(...SLATE8)
  for (const line of recBody) {
    const lines = doc.splitTextToSize(line, W - 56)
    doc.setFillColor(...recColor)
    doc.circle(25.2, by - 1.2, 0.8, 'F')
    doc.text(lines, 28.5, by)
    by += lines.length * 4.4 + 1.6
  }
  doc.roundedRect(20, boxTop, W - 40, by - boxTop + 2, 2, 2, 'S')
  y = by + 12

  // Signature
  doc.setDrawColor(148, 163, 184)
  doc.setLineWidth(0.3)
  doc.line(20, y, 95, y)
  doc.setFontSize(8.5)
  doc.setTextColor(...SLATE5)
  doc.text('Supervising clinician — name, signature, date', 20, y + 4)

  // Subtle CEA footer
  const fy = 285
  doc.setDrawColor(...TEAL)
  doc.setLineWidth(0.4)
  doc.line(20, fy - 5, W - 20, fy - 5)
  doc.setFontSize(7.5)
  doc.setTextColor(...SLATE5)
  doc.text(
    'Generated by SST Trainer  ·  Concussion Education Australia  ·  concussion-education-australia.com',
    20, fy,
  )
  doc.text(
    'Decision-support only — this report is not a diagnosis or clearance. The supervising clinician reviews and signs before transmission.',
    20, fy + 3.6,
  )

  return Buffer.from(doc.output('arraybuffer'))
}
