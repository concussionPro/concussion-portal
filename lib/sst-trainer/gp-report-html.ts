import { sql } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { getClinic, isRegisteredClinic, verifyViewKey } from '@/lib/sst-trainer/clinic-registry'

/**
 * GET /api/sst/gp-report?code=X&k=<viewKey>&patient=<label>
 *
 * The GP / referring-practitioner report (owner directive 2026-07-06):
 * Medicare CDM funds ~5 allied-health services per calendar year, and the
 * provider owes the referring GP a written report after the last service.
 * This endpoint automates that report from the episode data: the serial
 * measured-HRt trajectory, training compliance, flare history — and a
 * recommendation branch:
 *   - re-test interpretation 'no-intolerance'  → refer back for clearance
 *     to return to sport (recovered exercise tolerance)
 *   - anything else                            → recommend extending the
 *     treatment plan (unresolved exercise intolerance), same data.
 *
 * Print-ready HTML (browser print → PDF). Decision-support only: the
 * clinician reviews and signs; the report never claims a diagnosis.
 * Auth identical to clinic-sessions: registered code + clinician viewKey.
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

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * When the session ACTUALLY happened. `created_at` is server INSERT time, so a
 * session recorded offline and flushed days later was dated at sync time, and a
 * flushed queue collapsed a multi-week episode onto one day — on the document
 * the GP reads. The client stamps `occurredAt`; anything absent (legacy rows)
 * or implausible falls back. Same clause as reports/load.ts, which had the fix
 * while this exporter did not (2026-08-05 reporting-integrity sweep).
 */
function occurredIso(r: { payload: Record<string, unknown> | null; created_at: string }): string {
  const raw = r.payload?.occurredAt
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return r.created_at
  const inserted = new Date(r.created_at).getTime()
  if (!Number.isFinite(inserted) || raw > inserted + 60_000 || raw < inserted - 365 * 86_400_000) {
    return r.created_at
  }
  return new Date(raw).toISOString()
}

/** Minimal inline SVG line chart of the measured-HRt series. */
function trajectorySvg(points: Array<{ date: string; hrt: number | null; verified: boolean }>): string {
  const usable = points.filter((p) => typeof p.hrt === 'number') as Array<{
    date: string
    hrt: number
    verified: boolean
  }>
  if (usable.length < 2) return ''
  const W = 640
  const H = 180
  const PAD = 34
  const hrts = usable.map((p) => p.hrt)
  const min = Math.min(...hrts) - 8
  const max = Math.max(...hrts) + 8
  const x = (i: number) => PAD + (i / (usable.length - 1)) * (W - PAD * 2)
  const y = (v: number) => H - PAD - ((v - min) / (max - min || 1)) * (H - PAD * 2)
  const poly = usable.map((p, i) => `${x(i).toFixed(1)},${y(p.hrt).toFixed(1)}`).join(' ')
  const dots = usable
    .map(
      (p, i) =>
        `<circle cx="${x(i).toFixed(1)}" cy="${y(p.hrt).toFixed(1)}" r="4" fill="${p.verified ? '#0d7377' : '#94a3b8'}"/>` +
        `<text x="${x(i).toFixed(1)}" y="${(y(p.hrt) - 9).toFixed(1)}" font-size="10" text-anchor="middle" fill="#334155">${p.hrt}</text>` +
        `<text x="${x(i).toFixed(1)}" y="${H - 12}" font-size="9" text-anchor="middle" fill="#64748b">${new Date(p.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</text>`,
    )
    .join('')
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Serial measured heart-rate threshold">
    <polyline points="${poly}" fill="none" stroke="#0d7377" stroke-width="2"/>
    ${dots}
  </svg>
  <p class="legend">Teal points are sensor-verified measurements; grey are unverified sources. Values are the symptom-threshold heart rate (bpm) at each graded test.</p>`
}


/** Build the print-ready episode-report HTML. Returns null when the patient
 *  has no episode data. Extracted from the route so server code (e.g. the
 *  admin sample-mailer) can build reports without an HTTP round-trip through
 *  the public domain (Cloudflare 502s self-fetch loops). */
export async function buildGpReportHtml(
  code: string,
  patientLabel: string,
  patientRef = '',
): Promise<string | null> {
  // Identity: ref FIRST when the caller has one. Label-only matching merged
  // two same-named patients into ONE signable clinical document
  // (2026-08-05 journey sim) — same clause as reports/load.ts.
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
  // Sort by WHEN IT HAPPENED — the SQL orders by insert time, so an offline
  // test flushed late became the "latest" and drove the clearance branch.
  const byOccurred = (list: Row[]): Row[] =>
    [...list].sort((a, b) => Date.parse(occurredIso(a)) - Date.parse(occurredIso(b)))
  const thresholds = byOccurred(rows.filter((r) => r.session_type === 'threshold' && !isEventRow(r)))
  const trainings = byOccurred(rows.filter((r) => r.session_type !== 'threshold' && evOf(r) !== 'session-abandoned'))
  const ordered = byOccurred(rows)
  const latest = thresholds[thresholds.length - 1]
  const interp = (latest?.payload?.interpretation as string | undefined) ?? null
  const clearanceReady = interp === 'no-intolerance'
  // A red-flag graded test is a safety event. It never appeared on this report,
  // so a GP could read "recommend clearance review" for an episode that had
  // contained one (2026-08-05 reporting-integrity sweep).
  const redFlagTests = thresholds.filter((t) => t.payload?.interpretation === 'red-flag')

  const trajPoints = thresholds.map((t) => {
    const src = (t.payload?.hrSource as string | undefined) ?? undefined
    return {
      date: occurredIso(t),
      hrt: t.hrt_bpm,
      verified: t.payload?.hrVerified === true && src !== 'manual' && src !== undefined,
    }
  })
  const verifiedSessions = trainings.filter((t) => t.payload?.hrVerified === true && (t.payload?.hrSource as string | undefined) !== 'manual' && (t.payload?.hrSource as string | undefined) !== undefined).length
  // Symptom scoring is what a flare is DETECTED from. With no symptom data on
  // any session, "0 flares" is absence of measurement printed as a negative
  // finding — the GP reads "no flares occurred". Count and coverage both.
  const sessionsWithSymptomData = trainings.filter(
    (t) =>
      typeof t.payload?.preSymptom === 'number' ||
      typeof t.payload?.peakSymptom === 'number' ||
      t.payload?.flare === true,
  ).length
  const flares = trainings.filter((t) => {
    const pre = typeof t.payload?.preSymptom === 'number' ? (t.payload.preSymptom as number) : null
    const peak = typeof t.payload?.peakSymptom === 'number' ? (t.payload.peakSymptom as number) : null
    return t.payload?.flare === true || (pre != null && peak != null && peak - pre >= 2)
  }).length
  const flaresCell =
    trainings.length === 0
      ? 'no training sessions on record'
      : sessionsWithSymptomData === 0
        ? 'not recorded — no symptom scores on any session'
        : sessionsWithSymptomData < trainings.length
          ? `${flares} (symptom scores recorded on ${sessionsWithSymptomData} of ${trainings.length} sessions)`
          : String(flares)
  const firstDate = occurredIso(ordered[0])
  const lastDate = occurredIso(ordered[ordered.length - 1])
  const clinic = await getClinic(code)
  const clinicName = clinic?.clinicName ?? code

  const recommendation = clearanceReady
    ? {
        heading: 'Recommendation: referral back for clearance review',
        body: `${esc(patientLabel)}'s most recent graded re-test provoked no symptom exacerbation to volitional exhaustion (recovered exercise tolerance). The rehabilitation goal of the sub-symptom threshold program has been met on objective criteria. We recommend review by the referring practitioner for clearance to return to sport, subject to your clinical assessment and any code-of-sport requirements (including minimum stand-down periods).`,
      }
    : latest
      ? {
          heading: 'Recommendation: extension of the treatment plan',
          body: `${esc(patientLabel)}'s most recent graded test continued to provoke symptoms below age-expected exercise capacity (unresolved exercise intolerance). The measured threshold trajectory above documents progress to date. We recommend an extension of the current treatment plan to continue supervised sub-symptom threshold training, with re-testing to objective resolution before clearance is considered.`,
        }
      : {
          // No graded test on record at all. The old text asserted a test
          // finding ("most recent graded test continued to provoke symptoms")
          // for an episode where no test had ever been completed.
          heading: 'Recommendation: graded testing required',
          body: `No completed graded exercise test is on record for ${esc(patientLabel)} in this episode, so exercise tolerance has not been objectively established and no clearance or capacity statement can be made from this data. We recommend a graded exercise test before any progression decision.`,
        }
  // Prognostic note (Haider 2019): a measured HRt < 135 bpm (or the engine's
  // prolonged-recovery flag) predicts a slower recovery. Decision-support only —
  // it does NOT change the prescription; the clinician interprets it.
  const lowThreshold = thresholds.some(
    (t) => t.payload?.prolongedRecoveryRisk === true || (typeof t.hrt_bpm === 'number' && t.hrt_bpm < 135),
  )
  const prognosticNote = lowThreshold
    ? `<div class="prog"><h2>Prognostic note</h2><p>A measured heart-rate threshold below 135&nbsp;bpm was recorded during this episode. In the published cohort (Haider et&nbsp;al., 2019) a low heart-rate threshold — and a low resting-to-threshold reserve — is associated with a longer recovery. Decision-support only: interpret alongside your clinical assessment. It does not alter the sub-symptom training prescription.</p></div>`
    : ''
  // Rendered ONLY when red-flag tests exist — never a "no red flags" line, which
  // would be a negative finding manufactured from whatever wasn't recorded.
  const redFlagNote = redFlagTests.length
    ? `<div class="prog"><h2>Red-flag events during this episode</h2><p>${redFlagTests.length} graded test${redFlagTests.length === 1 ? ' was' : 's were'} stopped on a red-flag response (${redFlagTests
        .map((t) => fmtDate(occurredIso(t)))
        .join(', ')}); training was held pending clinician review. Please read the recommendation below in that context.</p></div>`
    : ''

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>SST episode report — ${esc(patientLabel)}</title>
<style>
  body { font: 13px/1.55 -apple-system, 'Segoe UI', sans-serif; color: #1e293b; max-width: 720px; margin: 32px auto; padding: 0 20px; }
  h1 { font-size: 19px; margin: 0 0 2px; } h2 { font-size: 14px; margin: 22px 0 6px; }
  .meta { color: #64748b; font-size: 12px; margin-bottom: 18px; }
  table { border-collapse: collapse; width: 100%; font-size: 12.5px; }
  td, th { border: 1px solid #e2e8f0; padding: 6px 9px; text-align: left; }
  th { background: #f8fafc; font-weight: 600; }
  .rec { border: 2px solid ${clearanceReady ? '#0d7377' : '#b45309'}; border-radius: 8px; padding: 12px 16px; margin-top: 18px; }
  .rec h2 { margin-top: 0; color: ${clearanceReady ? '#0d7377' : '#b45309'}; }
  .prog { border: 1px solid #d97706; background: #fffbeb; border-radius: 8px; padding: 10px 16px; margin-top: 14px; }
  .prog h2 { margin-top: 0; color: #b45309; font-size: 13px; }
  .prog p { margin: 4px 0 0; font-size: 12.5px; }
  .legend { color: #64748b; font-size: 11px; }
  .foot { margin-top: 26px; color: #64748b; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
  .sig { margin-top: 30px; } .sig span { display: inline-block; border-top: 1px solid #94a3b8; min-width: 260px; padding-top: 4px; color: #475569; font-size: 12px; }
  @media print { body { margin: 0 auto; } .noprint { display: none; } }
</style></head><body>
<button class="noprint" onclick="print()" style="float:right;padding:6px 14px;cursor:pointer">Print / save PDF</button>
<h1>Sub-symptom threshold exercise program — episode report</h1>
<p class="meta">Patient: <strong>${esc(patientLabel)}</strong> · Condition: ${esc(latest?.condition ?? 'concussion')} · Episode: ${fmtDate(firstDate)} – ${fmtDate(lastDate)}<br>
Supervising clinic: ${esc(clinicName)} · Report generated ${fmtDate(new Date())} · Prepared to support the written report to the referring practitioner (MBS chronic disease management allied-health items)</p>

<h2>Measured symptom-threshold trajectory</h2>
${trajectorySvg(trajPoints) || '<p class="legend">Fewer than two measured thresholds recorded — the trajectory chart is available from the second graded test.</p>'}

<h2>Episode summary</h2>
<table>
<tr><th>Graded tests (measured HRt)</th><td>${thresholds.length}</td></tr>
<tr><th>Latest measured threshold</th><td>${
      latest?.hrt_bpm != null
        ? // A null band printed as "prescribed band null–null bpm" on the GP's
          // copy. Say the band isn't recorded rather than emit a non-number.
          latest.band_low != null && latest.band_high != null
          ? `${latest.hrt_bpm} bpm (prescribed band ${latest.band_low}–${latest.band_high} bpm)`
          : `${latest.hrt_bpm} bpm (prescribed band not recorded)`
        : latest
          ? 'not measurable at latest test'
          : 'no graded test on record'
    }</td></tr>
<tr><th>Latest test interpretation</th><td>${esc(interp ?? (latest ? 'not recorded' : 'no graded test on record'))}</td></tr>
<tr><th>Home training sessions</th><td>${trainings.length} total · ${verifiedSessions} sensor-verified</td></tr>
<tr><th>Symptom flares during training</th><td>${esc(flaresCell)}</td></tr>
</table>

${redFlagNote}
${prognosticNote}
<div class="rec"><h2>${recommendation.heading}</h2><p>${recommendation.body}</p></div>

<div class="sig"><span>Supervising clinician — name, signature, date</span></div>

<p class="foot">Generated by SST Trainer (Concussion Education Australia) from clinic-supervised program data. Pair with the GP/Referrer Letter template in your Clinical Toolkit — this report is the data attachment; the letter carries your findings and recommendation. Decision-support only — this report does not constitute a diagnosis or clearance; the supervising clinician reviews and signs before transmission. Heart-rate points marked verified were captured from a connected sensor; manual entries are never presented as verified.</p>
</body></html>`

  return html
}
