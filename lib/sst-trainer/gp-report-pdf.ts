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

export async function loadGpReportData(code: string, patientLabel: string, patientRef = ''): Promise<GpReportData | null> {
  const ref = patientRef.trim()
  const { rows } = await sql<Row>`
    SELECT patient_label, session_type, hrt_bpm, band_low, band_high, condition, payload, created_at
    FROM sst_clinic_sessions
    WHERE upper(clinic_code) = ${code}
      AND (
        (${ref} <> '' AND payload->>'patientRef' = ${ref})
        OR (
          lower(trim(coalesce(patient_label, ''))) = ${patientLabel.trim().toLowerCase()}
          AND (${ref} = '' OR NULLIF(trim(coalesce(payload->>'patientRef', '')), '') IS NULL)
        )
      )
    ORDER BY created_at ASC
  `
  if (rows.length === 0) return null
  const evOf = (r: { payload?: Record<string, unknown> | null }) =>
    typeof r.payload?.eventType === 'string' ? String(r.payload.eventType).toLowerCase() : ''
  const isEventRow = (r: { payload?: Record<string, unknown> | null }) =>
    evOf(r) === 'test-aborted' || evOf(r) === 'red-flag-cleared'
  // Event rows (aborted / clearance) are audit entries, not tests; abandoned
  // sessions are not delivered sessions (round-L #4 — parity with reports/load.ts).
  const thresholds = rows.filter((r) => r.session_type === 'threshold' && !isEventRow(r))
  const trainings = rows.filter((r) => r.session_type !== 'threshold' && evOf(r) !== 'session-abandoned')
  const latest = thresholds[thresholds.length - 1]
  const interp = (latest?.payload?.interpretation as string | undefined) ?? null
  const weekSet = new Set(
    trainings.map((t) => {
      const d = new Date(t.created_at)
      return `w${Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86400000 + 4) / 7)}`
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
        verified: t.payload?.hrVerified === true && (t.payload?.hrSource as string | undefined) !== 'manual' && (t.payload?.hrSource as string | undefined) !== undefined,
        flare: t.payload?.flare === true || t.payload?.nextDayFlare === true || (pre != null && peak != null && peak - pre >= 2),
      }
    }),
    sessionsTotal: trainings.length,
    sessionsVerified: trainings.filter((t) => t.payload?.hrVerified === true && (t.payload?.hrSource as string | undefined) !== 'manual' && (t.payload?.hrSource as string | undefined) !== undefined).length,
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
  // SINGLE PAGE, quick-scan order (owner 2026-07-06): a GP reads who → what
  // → verdict first, evidence after. Recommendation sits directly under the
  // header; trajectory + symptom tables are the supporting evidence below.
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  let y = 18

  // ── Header ──────────────────────────────────────────────────────────
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...SLATE8)
  doc.text('Sub-Symptom Threshold Exercise Program — Episode Report', 20, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...SLATE5)
  doc.text(`Patient: ${d.patientLabel}   ·   ${d.condition}   ·   Episode ${fmt(d.firstDate)} – ${fmt(d.lastDate)}`, 20, y)
  y += 4.2
  doc.text(`Supervising clinic: ${d.clinicName}   ·   Generated ${fmt(new Date())}   ·   Supports the CDM written report to the referrer`, 20, y)
  y += 3.4
  doc.setDrawColor(...TEAL)
  doc.setLineWidth(0.5)
  doc.line(20, y, W - 20, y)
  y += 7

  // ── Recommendation (the verdict, first) ─────────────────────────────
  const recColor = d.clearanceReady ? TEAL : AMBER
  const recTitle = d.clearanceReady
    ? 'RECOMMENDATION — referral back for clearance review'
    : 'RECOMMENDATION — extension of the treatment plan'
  const recBody = d.clearanceReady
    ? 'Latest graded re-test provoked no symptom exacerbation to volitional exhaustion (recovered exercise tolerance). Program goal met on objective criteria — recommend medical review for return-to-sport clearance, subject to your assessment and code-of-sport stand-down requirements.'
    : 'Latest graded test still provokes symptoms below expected capacity — exercise intolerance improving but unresolved. Recommend extending the treatment plan: continued supervised sub-symptom training, re-testing to objective resolution before clearance.'
  const recLines = doc.splitTextToSize(recBody, W - 52)
  const recH = 10 + recLines.length * 4.2
  doc.setDrawColor(...recColor)
  doc.setLineWidth(0.8)
  doc.roundedRect(20, y, W - 40, recH, 2, 2, 'S')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...recColor)
  doc.text(recTitle, 24, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...SLATE8)
  doc.text(recLines, 24, y + 11)
  y += recH + 7

  // ── Key numbers strip ────────────────────────────────────────────────
  doc.setFontSize(9)
  doc.setTextColor(...SLATE8)
  const pct = d.sessionsTotal > 0 ? Math.round((d.sessionsVerified / d.sessionsTotal) * 100) : 0
  doc.setFont('helvetica', 'bold')
  doc.text(
    `${d.testCount} graded tests   ·   latest threshold ${d.latestHrt != null ? `${d.latestHrt} bpm (band ${d.bandLow}–${d.bandHigh})` : 'not measurable'}   ·   ${d.sessionsTotal} home sessions, ${pct}% sensor-verified   ·   ${d.flares} flare${d.flares === 1 ? '' : 's'}`,
    20, y,
  )
  doc.setFont('helvetica', 'normal')
  y += 7

  // ── Trajectory ───────────────────────────────────────────────────────
  y = sectionTitle(doc, 'Measured symptom-threshold trajectory (bpm per graded test)', y)
  const usable = d.traj.filter((p) => typeof p.hrt === 'number') as Array<{ date: string; hrt: number; verified: boolean }>
  if (usable.length >= 2) {
    const cx = 24, cw = W - 56, ch = 30, cy = y + 3
    const vals = usable.map((p) => p.hrt)
    const mn = Math.min(...vals) - 8, mx = Math.max(...vals) + 8
    const X = (i: number) => cx + (i / (usable.length - 1)) * cw
    const Y = (v: number) => cy + ch - ((v - mn) / (mx - mn || 1)) * ch
    doc.setDrawColor(...TEAL)
    doc.setLineWidth(0.6)
    for (let i = 1; i < usable.length; i++) doc.line(X(i - 1), Y(usable[i - 1].hrt), X(i), Y(usable[i].hrt))
    doc.setFontSize(8)
    for (let i = 0; i < usable.length; i++) {
      const pnt = usable[i]
      if (pnt.verified) doc.setFillColor(...TEAL)
      else doc.setFillColor(148, 163, 184)
      doc.circle(X(i), Y(pnt.hrt), 1.3, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...SLATE8)
      doc.text(String(pnt.hrt), X(i), Y(pnt.hrt) - 2.6, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...SLATE5)
      doc.text(new Date(pnt.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }), X(i), cy + ch + 4.5, { align: 'center' })
    }
    y = cy + ch + 8
    doc.setFontSize(7.5)
    doc.setTextColor(...SLATE5)
    doc.text('Teal = sensor-verified · grey = unverified source', 24, y)
    y += 6
  } else {
    doc.setFontSize(8.5)
    doc.setTextColor(...SLATE5)
    doc.text('Chart available from the second graded test.', 24, y)
    y += 6
  }

  // ── Tables ───────────────────────────────────────────────────────────
  const table = (headers: string[], widths: number[], rows: string[][], startY: number): number => {
    let ty = startY
    const x0 = 20
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...SLATE5)
    let x = x0
    headers.forEach((h, i) => { doc.text(h, x + 1.5, ty); x += widths[i] })
    ty += 1.4
    doc.setDrawColor(203, 213, 225)
    doc.setLineWidth(0.25)
    doc.line(x0, ty, x0 + widths.reduce((a, b) => a + b, 0), ty)
    ty += 3.9
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...SLATE8)
    for (const row of rows) {
      x = x0
      row.forEach((cell, i) => { doc.text(cell, x + 1.5, ty); x += widths[i] })
      ty += 4.1
    }
    return ty + 1.5
  }

  y = sectionTitle(doc, 'Graded tests — symptom data', y)
  y = table(
    ['Date', 'Resting sx', 'Sx at end', 'Rise', 'HRt (bpm)', 'Result', 'HR source'],
    [24, 22, 21, 14, 22, 45, 21],
    d.tests.slice(-6).map((t) => [
      new Date(t.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
      t.restingSx != null ? `${t.restingSx}/10` : '—',
      t.endSx != null ? `${t.endSx}/10` : '—',
      t.restingSx != null && t.endSx != null ? `+${Math.max(0, t.endSx - t.restingSx)}` : '—',
      t.hrt != null ? String(t.hrt) : '—',
      (t.interpretation ?? '—').replace('no-intolerance', 'no intolerance (recovered)'),
      t.verified ? 'verified' : 'unverified',
    ]),
    y,
  )
  y += 3

  const recent = d.sessionRows.slice(-8)
  y = sectionTitle(doc, `Home sessions — symptom data (last ${recent.length} of ${d.sessionsTotal})`, y)
  y = table(
    ['Date', 'Pre sx', 'Peak sx', 'Rise', 'Minutes', 'HR', 'Flare'],
    [24, 18, 18, 14, 18, 24, 18],
    recent.map((r) => [
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
  doc.setFontSize(7.5)
  doc.setTextColor(...SLATE5)
  doc.text(
    `~${(d.sessionsTotal / d.weeks).toFixed(1)} sessions/week over ${d.weeks} week${d.weeks === 1 ? '' : 's'} · sessions auto-stop at a 2-point symptom rise · band progression advances only on verified, symptom-clean sessions`,
    20, y, { maxWidth: W - 40 },
  )
  y += 9

  // ── Signature ────────────────────────────────────────────────────────
  const sy = Math.min(Math.max(y + 4, 252), 262)
  doc.setDrawColor(148, 163, 184)
  doc.setLineWidth(0.3)
  doc.line(20, sy, 95, sy)
  doc.setFontSize(8)
  doc.setTextColor(...SLATE5)
  doc.text('Supervising clinician — name, signature, date', 20, sy + 3.8)

  // ── Subtle CEA footer ────────────────────────────────────────────────
  const fy = 285
  doc.setDrawColor(...TEAL)
  doc.setLineWidth(0.4)
  doc.line(20, fy - 5, W - 20, fy - 5)
  doc.setFontSize(7.5)
  doc.setTextColor(...SLATE5)
  doc.text('Generated by SST Trainer  ·  Concussion Education Australia  ·  concussion-education-australia.com', 20, fy)
  doc.text('Decision-support only — not a diagnosis or clearance. The supervising clinician reviews and signs before transmission.', 20, fy + 3.6)

  return Buffer.from(doc.output('arraybuffer'))
}
