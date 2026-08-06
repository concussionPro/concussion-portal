/**
 * SST report LOADER + skin dispatcher — the missing link that lets a clinician
 * actually EMIT a jurisdiction report (e.g. the NZ ACC884 Client Summary) from
 * real episode data.
 *
 * The skins in ./skins.ts are pure `ReportInput → ReportContent`; the live GP
 * report route uses a separate bespoke loader (gp-report-pdf.ts). This assembles
 * a `ReportInput` from the SAME `sst_clinic_sessions` source so ANY skin can be
 * rendered for a clinic+patient — closing the "skins modelled but unwired" gap.
 *
 * De-identified by design: the store holds a clinic-chosen `patient_label`, not
 * PII. The report uses that label as the name; the clinician fills real identity
 * (and the ACC45 claim number) when transcribing onto ACC's fillable form.
 */
import { sql } from '@/lib/db'
import { DEMO_CLINIC_CODE, getClinic } from '../clinic-registry'
import { computePrescription, asCondition } from '../protocol'
import type { Condition, ThresholdResult, TestModality } from '../protocol'
import type { PersistedTest, PersistedSession } from '../store'
import type { Jurisdiction, ReportSkinKind } from './jurisdiction'
import {
  gpReport, acc884, acc885, rtpClearance, rtwSummary, medicolegalRecord,
  type ReportInput, type ReportContent, type ReportPatient, type ReportGoal,
} from './skins'

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

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
/**
 * A number only if it is a PLAUSIBLE heart rate. The app's own entry fields
 * accept 30–240 bpm; anything outside that (above all the 0 that older builds
 * wrote when a session recorded nothing) is not a measurement and must never
 * be printed as one.
 */
const bpm = (v: unknown): number | null => {
  const n = num(v)
  return n != null && n >= 30 && n <= 240 ? n : null
}
/** DISTINCT recorded minutes in a stored stage table (0 when absent/unreadable). */
const distinctStages = (raw: unknown): number => {
  if (!Array.isArray(raw)) return 0
  const minutes = new Set<number>()
  for (const s of raw) {
    if (!s || typeof s !== 'object') continue
    const m = Number((s as Record<string, unknown>).minute)
    if (Number.isFinite(m)) minutes.add(m)
  }
  return minutes.size
}
/**
 * When the session ACTUALLY happened. `created_at` is server insert time, so
 * an offline session synced days later — or a whole queue flushed at once —
 * dated every row at sync time and collapsed multi-day episodes onto one day
 * in documents sent to GPs and insurers (2026-08-05). The client stamps
 * `occurredAt`; anything absent (legacy rows) or implausible falls back.
 */
const occurredIso = (r: { payload: Record<string, unknown> | null; created_at: string }): string => {
  const raw = num(r.payload?.occurredAt)
  if (raw == null) return r.created_at
  const inserted = new Date(r.created_at).getTime()
  // Trust it only when it is in the past and no earlier than a year before
  // the insert — never let a client date a session into the future.
  if (!Number.isFinite(inserted) || raw > inserted + 60_000 || raw < inserted - 365 * 86_400_000) {
    return r.created_at
  }
  return new Date(raw).toISOString()
}
/** Sensor-verified ONLY (strict) — a manual/camera entry is never "verified". */
const isVerified = (p: Record<string, unknown> | null): boolean => {
  const src = p?.hrSource as string | undefined
  return p?.hrVerified === true && src !== 'manual' && src !== undefined
}
/**
 * Did this row record its HR provenance AT ALL? Collapsing "unknown" to `false`
 * made the medicolegal skin print "UNVERIFIED (manual/camera)" — a positive
 * claim about a source — for pre-verification legacy rows that recorded no
 * source whatsoever. Undefined stays undefined so the skin says "NOT RECORDED"
 * (2026-08-05 reporting-integrity sweep).
 */
const hasHrProvenance = (p: Record<string, unknown> | null): boolean => {
  if (!p) return false
  if (typeof p.hrVerified === 'boolean') return true
  return typeof p.hrSource === 'string' && p.hrSource.trim() !== ''
}
/** payload.eventType, lower-cased ('' when absent). */
const evTypeOf = (p: Record<string, unknown> | null): string =>
  typeof p?.eventType === 'string' ? p.eventType.toLowerCase() : ''
/** EVENT rows (test-aborted / red-flag-cleared) are audit events stored under
 *  session_type='threshold' with interpretation forced 'invalid' and hrt_bpm
 *  null. They are NOT graded tests and must not enter a report's test history,
 *  pick the prescription, or read as the "latest" test. */
const isThresholdEventRow = (r: Row): boolean => {
  const e = evTypeOf(r.payload)
  return e === 'test-aborted' || e === 'red-flag-cleared'
}
const VALID_INTERP = new Set(['physiologic', 'no-intolerance', 'red-flag', 'invalid'])
const asInterp = (s: unknown): ThresholdResult['interpretation'] =>
  (typeof s === 'string' && VALID_INTERP.has(s) ? s : 'invalid') as ThresholdResult['interpretation']

export interface LoadReportOptions {
  /** install-UUID identity — prefer over the display label when present */
  patientRef?: string
  /** Real identity to stamp on the report (else the de-identified label is used). */
  patient?: Partial<ReportPatient>
  clinician?: { name: string; credential?: string }
  goals?: ReportGoal[]
}

// ── FIXTURE — demo clinic only ───────────────────────────────────────────────
// DEMO00 is the shared public demo clinic: keyless by design (verifyViewKey
// passes DEMO00 without a viewKey) and NEVER holds real patient data. Pitch
// recipients self-serve report demos via /demo/acc-style links, so instead of
// querying `sst_clinic_sessions` (empty for DEMO00) the loader synthesises one
// clinically-realistic ~4-week episode: serial graded tests with the measured
// HRt progressing 128 → 142 → 155 bpm (physiologic → recovering), a final
// exhaustion-limited re-test with no symptom provocation (no-intolerance), and
// sensor-verified home sessions inside the prescribed band with symptom scores
// trending down. Identity/opts merge exactly as on the real path, so demo URLs
// can carry names, claim refs and clinicians. Timestamps are offsets from
// "now" so the episode always looks recent.

const DAY_MS = 24 * 60 * 60 * 1000

function demoReportInput(
  patientLabel: string,
  jurisdiction: Jurisdiction,
  opts: LoadReportOptions,
): ReportInput {
  const anchor = Date.now()
  const at = (daysAgo: number) => anchor - daysAgo * DAY_MS
  const iso = (daysAgo: number) => new Date(at(daysAgo)).toISOString()

  // Serial graded tests — the HRt trajectory IS the demo's clinical story.
  const thresholdHistory: PersistedTest[] = [
    { at: at(27), interpretation: 'physiologic', hrt: 128, thresholdStage: 5, modality: 'treadmill', restingSymptomScore: 5 },
    { at: at(18), interpretation: 'physiologic', hrt: 142, thresholdStage: 7, modality: 'treadmill', restingSymptomScore: 3 },
    { at: at(9), interpretation: 'physiologic', hrt: 155, thresholdStage: 9, modality: 'treadmill', restingSymptomScore: 1 },
    // Final re-test: exhaustion-limited, no provocation → no HRt to record.
    { at: at(1), interpretation: 'no-intolerance', hrt: null, thresholdStage: null, modality: 'treadmill', restingSymptomScore: 0 },
  ]

  // Home sessions between tests — avg/peak inside the band prescribed from the
  // then-current HRt (128→102-115, 142→114-128, 155→124-140), ~20 min, symptoms
  // trending down. One early stop-rule flare (day 25) for realism.
  const mk = (
    daysAgo: number, avg: number, peak: number, pre: number, peakSym: number,
    mins: number, nextDayFlare = false,
  ): PersistedSession => ({
    date: iso(daysAgo), at: at(daysAgo), avgHeartRate: avg, peakHeartRate: peak,
    preSymptom: pre, peakSymptom: peakSym, completedMinutes: mins,
    hrVerified: true, nextDayFlare,
  })
  const sessions: PersistedSession[] = [
    // Week 1 — band 102–115 bpm (HRt 128)
    mk(26, 106, 113, 5, 6, 18),
    mk(25, 110, 115, 4, 7, 12, true), // stopped on the ≥2-pt rise; flared next day
    mk(23, 104, 111, 5, 6, 20),
    mk(21, 107, 114, 4, 5, 20),
    mk(19, 109, 114, 3, 4, 20),
    // Week 2–3 — band 114–128 bpm (HRt 142)
    mk(17, 118, 126, 3, 4, 20),
    mk(15, 121, 127, 3, 3, 20),
    mk(13, 120, 126, 2, 3, 20),
    mk(11, 123, 128, 2, 2, 20),
    mk(10, 122, 127, 1, 2, 20),
    // Week 4 — band 124–140 bpm (HRt 155)
    mk(8, 129, 137, 1, 2, 20),
    mk(6, 132, 139, 1, 1, 20),
    mk(4, 134, 140, 0, 1, 20),
    mk(2, 133, 139, 0, 0, 20),
  ]

  // Prescription via the REAL engine, from the last MEASURED threshold (the
  // final re-test found no intolerance, so 155 bpm is the band that was in
  // play at exit). Resting HR 62 → ΔHR 93: no prolonged-recovery flag.
  const prescription = computePrescription(155, 'concussion', { restingHr: 62 })

  const latestTest: ThresholdResult = {
    hrtFound: false,
    hrt: null,
    thresholdStage: null,
    interpretation: 'no-intolerance',
    message: '',
  }

  // Identity merging mirrors the real path — demo URLs carry names/claim refs.
  const patient: ReportPatient = {
    firstName: opts.patient?.firstName ?? patientLabel,
    lastName: opts.patient?.lastName ?? '',
    dob: opts.patient?.dob,
    ethnicity: opts.patient?.ethnicity,
    claimRef: opts.patient?.claimRef,
    diagnosis: opts.patient?.diagnosis,
  }

  return {
    jurisdiction,
    patient,
    clinician: opts.clinician,
    prescription,
    latestTest,
    thresholdHistory,
    sessions,
    // Obviously-demo goals so the goal sections render populated.
    goals: opts.goals ?? [
      { id: 'demo-goal-1', label: 'Return to full-time work without symptom flare', status: 'achieved' },
      { id: 'demo-goal-2', label: 'Return to recreational running', status: 'in-progress' },
    ],
    episode: { startedAt: iso(27), reportedAt: new Date(anchor).toISOString() },
  }
}

/**
 * Assemble a `ReportInput` for one clinic + patient label, or null when there is
 * no episode data. Same query + verification rules as the live GP report.
 *
 * DEMO00 short-circuits to a synthetic fixture episode (above) — never the DB.
 */
export async function loadReportInput(
  code: string,
  patientLabel: string,
  jurisdiction: Jurisdiction,
  opts: LoadReportOptions = {},
): Promise<ReportInput | null> {
  if (code.trim().toUpperCase() === DEMO_CLINIC_CODE) {
    return demoReportInput(patientLabel, jurisdiction, opts)
  }
  // Identity: patientRef FIRST when the caller has one — label-only matching
  // merged two same-named humans into one signable document and 404'd the
  // "(2)"-suffixed one (2026-08-05 round-3 #3). A ref'd query still picks up
  // the same human's label-only rows (older clients) via the case-folded
  // label; label-only callers keep working unchanged.
  const ref = (opts.patientRef ?? '').trim()
  const { rows } = await sql<Row>`
    SELECT patient_label, session_type, hrt_bpm, band_low, band_high, condition, payload, created_at
    FROM sst_clinic_sessions
    WHERE upper(clinic_code) = ${code.toUpperCase()}
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

  // Event rows are excluded on BOTH branches: an aborted-test / clearance
  // acknowledgement is not a graded test, and a 'session-abandoned' record is
  // an audit row, not a delivered session — it must not count toward the
  // skins' "Sessions delivered", adherence, or medicolegal per-session rows.
  // ORDER BY WHEN IT HAPPENED, not when it landed. The SQL orders by
  // created_at (insert time), so a test taken offline and flushed days later
  // sorted AFTER tests taken since — and `latest` (which picks the clearance
  // interpretation and the whole recommendation branch) resolved to a STALE
  // test. A queued 'no-intolerance' landing after a later symptomatic re-test
  // would have printed "recommend clearance review" (2026-08-05
  // reporting-integrity sweep).
  const byOccurred = <T extends Row>(list: T[]): T[] =>
    [...list].sort((a, b) => Date.parse(occurredIso(a)) - Date.parse(occurredIso(b)))
  const thresholds = byOccurred(rows.filter((r) => r.session_type === 'threshold' && !isThresholdEventRow(r)))
  const trainings = byOccurred(
    rows.filter((r) => r.session_type !== 'threshold' && evTypeOf(r.payload) !== 'session-abandoned'),
  )
  const latest = thresholds[thresholds.length - 1]
  // Normalised, never cast: `condition` comes straight out of the
  // sst_clinic_sessions column, which is patient-app input. A raw `as Condition`
  // cast let an unrecognised value reach the prescription engine and throw
  // (500-ing this report) — see asCondition in ../protocol.
  const condition = asCondition(latest?.condition)

  const thresholdHistory: PersistedTest[] = thresholds.map((t) => ({
    at: new Date(occurredIso(t)).getTime(),
    interpretation: (t.payload?.interpretation as string) ?? 'invalid',
    hrt: t.hrt_bpm,
    thresholdStage: num(t.payload?.thresholdStage),
    modality: (t.payload?.modality as TestModality) ?? null,
    restingSymptomScore: num(t.payload?.restingSymptomScore) ?? 0,
    // Same-day re-test run on the clinician-directed override. Carried through
    // so the serial-testing table can say the spacing rule was lifted on
    // clinical instruction rather than leaving an unexplained same-day pair.
    clinicianDirected: t.payload?.clinicianDirected === true,
    // How far the graded ramp actually got. The exhaustion arm of
    // detectThreshold returns the CLEARANCE-GRADE 'no-intolerance' from a
    // ramp of ANY length — one recorded minute reads the same as a completed
    // 20-minute protocol — and no document said which. Count DISTINCT minutes
    // (a duplicated row set is not a longer test).
    stagesRecorded: distinctStages(t.payload?.stages),
  }))

  const sessions: PersistedSession[] = trainings.map((t) => ({
    date: occurredIso(t),
    at: new Date(occurredIso(t)).getTime(),
    // NULL, never 0. A session that recorded no reading measured nothing, and
    // 0 bpm was reaching the medicolegal export as "avg 0 / peak 0 bpm" — a
    // measurement asserted for a session that measured nothing. `bpm()` drops
    // anything under the app's own physiologic floor, so legacy rows (and any
    // watch build) that wrote a placeholder 0 read as NOT RECORDED too.
    avgHeartRate: bpm(t.payload?.avgHeartRate) ?? bpm(t.payload?.avgHr),
    peakHeartRate: bpm(t.payload?.peakHeartRate) ?? bpm(t.payload?.peakHr),
    preSymptom: num(t.payload?.preSymptom) ?? 0,
    peakSymptom: num(t.payload?.peakSymptom) ?? 0,
    completedMinutes: num(t.payload?.completedMinutes) ?? 0,
    hrVerified: hasHrProvenance(t.payload) ? isVerified(t.payload) : undefined,
    nextDayFlare: t.payload?.nextDayFlare === true,
    // Stop-rule + override provenance for the medicolegal skin. The web app
    // sends `symptomLimited` (SessionLog); the watch sends `flare`, which at
    // post time is the same ≥2-pt symptom-rise stop (its nextDayFlare
    // component is always false when the session is committed). Either app
    // also marks the event as 'session-symptom-stopped'.
    symptomLimited:
      t.payload?.symptomLimited === true ||
      t.payload?.flare === true ||
      evTypeOf(t.payload) === 'session-symptom-stopped',
    // web key is overrodeStop; accept the snake_case variant defensively
    // (the hub already does)
    overrodeStop: t.payload?.overrodeStop === true || t.payload?.overrode_stop === true,
  }))

  // The prescription in force derives from the last MEASURED test (hrt found)
  // — the final re-test may legitimately carry no HRt (no-intolerance), and
  // the band in play at exit is the one from the last measurement. Mirrors
  // the demo fixture's reasoning above.
  const lastMeasured = [...thresholds].reverse().find((t) => t.hrt_bpm != null)
  const latestHrt = lastMeasured?.hrt_bpm ?? null
  const restingHr = num(lastMeasured?.payload?.restingHr)
  const prescription = latestHrt != null ? computePrescription(latestHrt, condition, { restingHr }) : null

  const latestTest: ThresholdResult | null = latest
    ? {
        hrtFound: latest.hrt_bpm != null,
        hrt: latest.hrt_bpm,
        thresholdStage: num(latest.payload?.thresholdStage),
        interpretation: asInterp(latest.payload?.interpretation),
        message: '',
      }
    : null

  const patient: ReportPatient = {
    firstName: opts.patient?.firstName ?? patientLabel,
    lastName: opts.patient?.lastName ?? '',
    dob: opts.patient?.dob,
    ethnicity: opts.patient?.ethnicity,
    claimRef: opts.patient?.claimRef,
    diagnosis: opts.patient?.diagnosis,
  }

  return {
    jurisdiction,
    patient,
    clinician: opts.clinician,
    prescription,
    latestTest,
    thresholdHistory,
    sessions,
    goals: opts.goals,
    episode: { startedAt: byOccurred(rows)[0] ? occurredIso(byOccurred(rows)[0]) : rows[0].created_at, reportedAt: new Date().toISOString() },
  }
}

/** Dispatch a skin kind to its renderer. One place kind → function is decided. */
export function renderSkin(kind: ReportSkinKind, input: ReportInput): ReportContent {
  switch (kind) {
    case 'acc884': return acc884(input)
    case 'acc885': return acc885(input)
    case 'rtp-clearance': return rtpClearance(input)
    case 'rtw-summary': return rtwSummary(input)
    case 'medicolegal': return medicolegalRecord(input)
    case 'gp-report':
    default: return gpReport(input)
  }
}
