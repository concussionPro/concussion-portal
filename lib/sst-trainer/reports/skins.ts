/**
 * SST report SKINS — jurisdiction-specific templates over the payer-neutral core.
 *
 * These functions render a STRUCTURED CONTENT MODEL (`{ title, sections }`), NOT
 * PDF bytes. A downstream renderer (existing gp-report-pdf / gp-report-html, or
 * a future one) turns the model into a PDF/HTML/PMS note. That separation is the
 * point: a new report skin is a new function here; a new output format is a new
 * renderer — neither touches the SST engine, the jurisdiction resolver, or the
 * PMS adapters.
 *
 * CLAIM DISCIPLINE (mirrors the tools paper): every section reports PROVENANCE
 * and SIGNAL QUALITY (measured vs estimated HR, verified-session share, who
 * directed each decision). No efficacy or diagnostic claim is asserted by these
 * templates; recovery/clearance language is construct-level ("measured exercise
 * tolerance"), and the clinician owns the interpretation.
 *
 * ISOLATED: pure functions, no I/O, no route wiring. Reuses the engine types
 * from ../protocol and the persisted shapes from ../store.
 */

import { PROTOCOL_STAGE_CAP } from '../protocol'
import type { Prescription, ThresholdResult } from '../protocol'
import type { PersistedSession, PersistedTest } from '../store'
import type { Jurisdiction } from './jurisdiction'

// ── content model ────────────────────────────────────────────────────────────

/** One line item in a section — a labelled fact or a free-text paragraph. */
export interface ReportField {
  label: string
  value: string
}

/** A section of a report — a heading plus fields and/or body paragraphs. */
export interface ReportSection {
  heading: string
  /** Structured label:value rows (autofill / merge fields). */
  fields?: ReportField[]
  /** Free-text paragraphs (clinical narrative, statements). */
  body?: string[]
  /** Optional flag so a renderer can style a section as an audit/appendix block. */
  kind?: 'summary' | 'trajectory' | 'audit' | 'goals' | 'outcome' | 'narrative'
}

/** The rendered report as a structure — never bytes. */
export interface ReportContent {
  title: string
  sections: ReportSection[]
}

// ── report input (assembled from the engine + persistence) ───────────────────

/** A patient identity subset for the report header (from a PMS or the store). */
export interface ReportPatient {
  firstName: string
  lastName: string
  dob?: string
  ethnicity?: string
  /** ACC45 claim number (NZ) or WorkCover/insurer ref (AU), when present. */
  claimRef?: string
  /** Read-code / diagnosis label carried from the PMS condition (NZ S60..). */
  diagnosis?: string
}

/** A patient-stated rehab goal (drives the SMART-goal sections). */
export interface ReportGoal {
  id: string
  label: string
  /** clinician/patient status for outcome reporting. */
  status?: 'not-started' | 'in-progress' | 'achieved'
}

/**
 * Everything a skin needs. Deliberately assembled from EXISTING engine +
 * persistence types so the report layer never re-defines clinical shapes:
 *  - `prescription`  → ../protocol Prescription (band, dose, prognostic flag)
 *  - `thresholdHistory` → ../store PersistedTest[] (serial HRt measurements)
 *  - `sessions`      → ../store PersistedSession[] (training + stop-rule events)
 *  - `latestTest`    → ../protocol ThresholdResult (interpretation of the last test)
 */
export interface ReportInput {
  jurisdiction: Jurisdiction
  patient: ReportPatient
  /** Clinician name/credential emitting the report (E-E-A-T + defensibility). */
  clinician?: { name: string; credential?: string }
  prescription: Prescription | null
  latestTest?: ThresholdResult | null
  thresholdHistory: PersistedTest[]
  sessions: PersistedSession[]
  goals?: ReportGoal[]
  /** Episode window; ISO strings. */
  episode?: { startedAt?: string; reportedAt?: string }
}

// ── shared helpers ───────────────────────────────────────────────────────────

function fullName(p: ReportPatient): string {
  return `${p.firstName} ${p.lastName}`.trim()
}

function fmtDate(iso?: string | number | null): string {
  if (iso == null) return '—'
  const d = typeof iso === 'number' ? new Date(iso) : new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toISOString().slice(0, 10)
}

function bandText(rx: Prescription | null): string {
  return rx ? `${rx.lowerBpm}–${rx.upperBpm} bpm` : '—'
}

/** Verified-session share — the core signal-quality metric on every report.
 *  STRICT `=== true` (bluetooth live-verified only), matching the DB-backed GP
 *  reports and the report footer's promise that "manual or camera entries are
 *  never presented as verified". Note this is deliberately stricter than the
 *  PROGRESSION rule in protocol.ts (`!== false`, which grandfathers legacy
 *  pre-verification logs as advance evidence) — a payer/ACC report must not
 *  claim a legacy/unknown session as sensor-verified. */
function verifiedShare(sessions: PersistedSession[]): { verified: number; total: number } {
  const total = sessions.length
  const verified = sessions.filter((s) => s.hrVerified === true).length
  return { verified, total }
}

/**
 * What the LAST graded test actually established. Distinguishing 'none' from
 * 'symptom-limited' matters: with no valid graded test on record, a skin that
 * says "tolerance remains symptom-limited ON GRADED TESTING" is describing a
 * test that never happened — a fabricated finding on a document that goes to a
 * GP or an insurer. Missing data must read as missing.
 */
type TestedOutcome = 'recovered' | 'symptom-limited' | 'red-flag' | 'none'

function testedOutcome(input: ReportInput): TestedOutcome {
  const i = input.latestTest?.interpretation
  if (!i || i === 'invalid') return 'none'
  if (i === 'no-intolerance') return 'recovered'
  if (i === 'red-flag') return 'red-flag'
  return 'symptom-limited'
}

/**
 * How far the graded ramp got, for any statement built on the EXHAUSTION
 * endpoint.
 *
 * `no-intolerance` — the clearance-grade read that drives "objective exercise
 * tolerance recovered", "basis to progress the RTS pathway" and "graded
 * return-to-work can be progressed" — is returned whenever a test terminated at
 * voluntary exhaustion (RPE >= EXHAUSTION_RPE) with no >=3-point symptom rise,
 * REGARDLESS of ramp length: one recorded minute yields exactly the same
 * interpretation as a completed PROTOCOL_STAGE_CAP-minute protocol. Recovery
 * asserted off a one-minute ramp is a materially different clinical fact from
 * the same words off a completed protocol, so the exercise dose now travels
 * with the finding on every document that states it. Silent when the stage
 * table was not stored (legacy rows) — an absent count is never guessed.
 */
function recoveredRampStages(input: ReportInput): number | null {
  const last = [...input.thresholdHistory]
    .reverse()
    .find((t) => t.interpretation === 'no-intolerance')
  const n = last?.stagesRecorded
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : null
}

/** Sentence form, appended to a narrative "recovered" statement. */
function rampNote(input: ReportInput): string {
  const n = recoveredRampStages(input)
  if (n == null) return ''
  return ` That test ran ${n} minute${n === 1 ? '' : 's'} of the ${PROTOCOL_STAGE_CAP}-minute graded ramp before it was stopped — read the finding against that exercise dose.`
}

/** Parenthetical form, appended to a short field value. */
function rampShort(input: ReportInput): string {
  const n = recoveredRampStages(input)
  return n == null ? '' : ` (ramp ${n}/${PROTOCOL_STAGE_CAP} min)`
}

/**
 * Red-flag graded tests in this episode.
 *
 * A red flag is a SAFETY event, and until 2026-08-05 it appeared on NO report
 * except the medicolegal audit trail — so an RTP data summary or an ACC884
 * could state "objective exercise tolerance recovered" for an episode that had
 * contained a red-flag test, with nothing on the page to say so. Returns null
 * when there are none, so the section only ever renders off real data.
 */
function redFlagSection(input: ReportInput): ReportSection | null {
  const flagged = input.thresholdHistory.filter((t) => t.interpretation === 'red-flag')
  if (flagged.length === 0) return null
  const n = flagged.length
  return {
    heading: 'Red-flag events during this episode',
    kind: 'audit',
    body: [
      `${n} graded test${n === 1 ? ' was' : 's were'} stopped on a red-flag response; training was held pending clinician review. Read any progression, capacity or clearance statement in this report in that context.`,
    ],
    fields: flagged.map((t) => ({
      label: fmtDate(t.at),
      value: `graded test stopped — red-flag response${typeof t.hrt === 'number' ? ` (HR at stop ${t.hrt} bpm)` : ''}`,
    })),
  }
}

/** Drop the sections a skin decided not to render (null = no data for it). */
function sections(list: Array<ReportSection | null>): ReportSection[] {
  return list.filter((s): s is ReportSection => s != null)
}

/** Header/identity fields shared by every skin. */
function patientHeader(input: ReportInput): ReportSection {
  const p = input.patient
  const fields: ReportField[] = [
    { label: 'Patient', value: fullName(p) },
    { label: 'Date of birth', value: fmtDate(p.dob) },
  ]
  if (p.ethnicity) fields.push({ label: 'Ethnicity', value: p.ethnicity })
  if (p.claimRef) fields.push({ label: 'Claim / reference', value: p.claimRef })
  if (p.diagnosis) fields.push({ label: 'Diagnosis (read code)', value: p.diagnosis })
  if (input.clinician) {
    fields.push({
      label: 'Reporting clinician',
      value: [input.clinician.name, input.clinician.credential].filter(Boolean).join(', '),
    })
  }
  fields.push({ label: 'Report date', value: fmtDate(input.episode?.reportedAt ?? Date.now()) })
  return { heading: 'Patient', kind: 'summary', fields }
}

/**
 * The serial measured-HRt trajectory — the defensible spine of every SST report.
 * Renders each threshold test as a timestamped row so a reader can see the
 * measured tolerance change over the episode. Shared by all skins.
 */
function trajectorySection(input: ReportInput): ReportSection {
  const rows = input.thresholdHistory
    .filter((t) => typeof t.hrt === 'number')
    .map((t) => ({
      label: fmtDate(t.at),
      // A clinician-directed test is the ONLY way a same-day re-test can exist.
      // Saying so on the row keeps a same-day pair explainable instead of
      // looking like the spacing rule failed.
      value: `HRt ${t.hrt} bpm${t.modality ? ` (${t.modality})` : ''}, resting symptom ${t.restingSymptomScore}/10, interpretation: ${t.interpretation}${t.clinicianDirected ? ' (clinician-directed re-test)' : ''}`,
    }))
  const first = input.thresholdHistory.find((t) => typeof t.hrt === 'number')?.hrt ?? null
  const last = [...input.thresholdHistory].reverse().find((t) => typeof t.hrt === 'number')?.hrt ?? null
  const delta =
    first != null && last != null
      ? `Measured HRt moved from ${first} bpm to ${last} bpm across ${rows.length} test${rows.length === 1 ? '' : 's'}.`
      : 'No serial threshold measurements recorded.'
  return {
    heading: 'Serial measured heart-rate threshold (HRt) trajectory',
    kind: 'trajectory',
    body: [delta],
    fields: rows.length ? rows : [{ label: '—', value: 'No graded tests on record.' }],
  }
}

/**
 * "Measures reviewed during delivery" — the outcome-review evidence block.
 *
 * The ACC Concussion Services outcome reporting (the ACC884 Client Summary
 * Report) expects the outlined outcome measures to have been reviewed across the
 * service, not just captured once. SST produces that evidence as a by-product:
 * between-visit sessions are delivered against a measured HR band (connected-
 * sensor adherence), and the measured threshold is formally re-reviewed at each
 * graded re-test. This section surfaces those review points explicitly. Facts
 * only — no efficacy claim. (Not tied to a specific unverified clause number;
 * the requirement is the ACC884 outcome-review deliverable.)
 */
function adherenceReviewSection(input: ReportInput, opts?: { accFraming?: boolean }): ReportSection {
  const rx = input.prescription
  const { verified, total } = verifiedShare(input.sessions)
  // In-band adherence proxy: sessions whose average HR sat inside the prescribed
  // band. Reported as a proxy, not a per-second time-in-zone figure (the store
  // holds session-level averages, not the intra-session HR series).
  // Only sessions that actually RECORDED a heart rate can be counted in or out
  // of band; a session with no reading is neither, and the denominator says so.
  const withHr = input.sessions.filter((s) => typeof s.avgHeartRate === 'number')
  const inBand =
    rx != null
      ? withHr.filter(
          (s) => (s.avgHeartRate as number) >= rx.lowerBpm && (s.avgHeartRate as number) <= rx.upperBpm,
        ).length
      : 0
  // Each graded re-test is a formal review point — list the dates.
  const reviewDates = input.thresholdHistory
    .filter((t) => typeof t.hrt === 'number')
    .map((t) => fmtDate(t.at))
  const reviewPoints = reviewDates.length

  const fields: ReportField[] = [
    { label: 'Sessions delivered (verified sensor / total)', value: `${verified} / ${total}` },
    {
      label: 'Sessions with average HR inside prescribed band',
      value:
        rx == null
          ? 'no active prescription'
          : withHr.length === 0
            ? `no heart rate recorded on any of the ${total} session${total === 1 ? '' : 's'}`
            : `${inBand} / ${withHr.length}${withHr.length < total ? ` (${total - withHr.length} of ${total} recorded no heart rate)` : ''}`,
    },
    {
      label: 'Formal review points (graded re-tests)',
      value: reviewPoints > 0 ? `${reviewPoints} — ${reviewDates.join(', ')}` : 'none on record',
    },
  ]
  return {
    heading: 'Outcome measures reviewed during delivery',
    kind: 'audit',
    body: [
      `Sub-symptom-threshold sessions were delivered between clinic visits against a heart-rate band measured by graded testing; adherence was monitored from connected-sensor sessions (unverified manual/camera entries are excluded from the verified count). The measured threshold was formally re-reviewed at each graded re-test listed above — evidence that outcome measures were reviewed across, not merely at the end of, service delivery${opts?.accFraming ? ', supporting the ACC884 Client Summary Report' : ''}.`,
    ],
    fields,
  }
}

/** Prescription + signal-quality block. */
function prescriptionSection(input: ReportInput): ReportSection {
  const rx = input.prescription
  const { verified, total } = verifiedShare(input.sessions)
  const fields: ReportField[] = [
    { label: 'Training band', value: bandText(rx) },
    { label: 'Dose', value: rx ? `${rx.sessionMinutes} min × ${rx.daysPerWeek} days/week` : '—' },
    { label: 'Do-not-exceed ceiling', value: rx ? `${rx.upperBpm} bpm` : '—' },
    { label: 'Sessions (verified / total)', value: `${verified} / ${total}` },
  ]
  const body: string[] = []
  if (rx?.prolongedRecoveryRisk && rx.clinicianNote) body.push(rx.clinicianNote)
  return { heading: 'Current prescription & signal quality', kind: 'summary', fields, body }
}

// ── skins ────────────────────────────────────────────────────────────────────

/** GP / referrer update — the universal, payer-neutral clinical letter. */
export function gpReport(input: ReportInput): ReportContent {
  return {
    title: `SST progress report — ${fullName(input.patient)}`,
    sections: sections([
      patientHeader(input),
      prescriptionSection(input),
      trajectorySection(input),
      redFlagSection(input),
      adherenceReviewSection(input),
      {
        heading: 'Summary',
        kind: 'narrative',
        body: [gpSummaryLine(input)],
      },
    ]),
  }
}

/**
 * The GP report's narrative summary.
 *
 * `??` DOES NOT FALL BACK ON AN EMPTY STRING, and `loadReportInput` builds
 * `latestTest` with `message: ''` (the engine's patient-facing message is not
 * persisted with the row) — so every real clinic's GP report, and the DEMO00
 * one linked publicly from the /acc pitch, rendered `<h2>Summary</h2>` above an
 * EMPTY paragraph. The one narrative paragraph on the document a clinician
 * hands to a doctor was blank (2026-08-06).
 *
 * The fallback states the outcome that IS on record, in the same vocabulary the
 * ACC884 / RTW skins already use — and says plainly when nothing is on record
 * rather than describing a test that never happened.
 */
function gpSummaryLine(input: ReportInput): string {
  const msg = input.latestTest?.message?.trim()
  if (msg) return msg
  switch (testedOutcome(input)) {
    case 'recovered':
      return (
        'The most recent graded test reached volitional exhaustion with no symptom exacerbation — measured exercise tolerance has recovered.' +
        rampNote(input)
      )
    case 'symptom-limited':
      return 'Measured exercise tolerance remains symptom-limited on graded testing. Sub-symptom-threshold aerobic training continues against the measured band above; the serial trajectory tracks the threshold.'
    case 'red-flag':
      return 'The most recent graded test was stopped on a red-flag response, so exercise tolerance is NOT established. Training is held pending clinician review.'
    default:
      return 'No valid graded test is on record for this episode, so measured exercise tolerance is not established. Serial graded testing is the measure tracked in the trajectory above.'
  }
}

/**
 * ACC884 — NZ ACC Concussion Service **Client Summary Report**.
 *
 * Per the ACC Concussion Services Operational Guidelines, the ACC884 Client
 * Summary Report is the end-of-service reporting deliverable submitted to ACC
 * and the client's primary-care provider (within 5 business days of service
 * exit, or when further services are identified). It summarises the SERVICE
 * PROVIDED (the outlined treatment and hours), a RISK ASSESSMENT, the OUTCOMES,
 * and any SERVICES STILL NEEDED. It is NOT a treatment-extension request — that
 * is the ACC32 (Request for Prior Approval of Treatment).
 *
 * This renders the SST-derived CONTENT for those fields. The exact field ORDER
 * and labels should be transcribed onto ACC's current fillable ACC884 form
 * (available from the ACC provider portal) before submission — the form layout
 * is authoritative, this supplies the measured data to populate it.
 */
export function acc884(input: ReportInput): ReportContent {
  const goals = input.goals ?? []
  const outcome = testedOutcome(input)
  const recovered = outcome === 'recovered'
  const goalFields: ReportField[] =
    goals.length > 0
      ? goals.map((g, i) => ({
          label: `Goal ${i + 1}`,
          value: `${g.label}${g.status ? ` — ${g.status}` : ''}`,
        }))
      : [{ label: 'Goals', value: 'No goals recorded.' }]

  return {
    title: `ACC884 Client Summary Report — ${fullName(input.patient)}`,
    sections: sections([
      patientHeader(input),
      {
        heading: 'Service provided',
        kind: 'summary',
        body: [
          'Clinician-supervised sub-symptom-threshold aerobic exercise (SSTAE), delivered against a heart-rate threshold measured by graded testing, with between-visit home sessions monitored on a connected sensor.',
        ],
      },
      prescriptionSection(input),
      trajectorySection(input),
      redFlagSection(input),
      adherenceReviewSection(input, { accFraming: true }),
      { heading: 'Goals', kind: 'goals', fields: goalFields },
      {
        heading: 'Risk assessment',
        kind: 'summary',
        body: [
          input.prescription?.prolongedRecoveryRisk
            ? (input.prescription.clinicianNote ??
              'Measured threshold sits below the validated prolonged-recovery cut-off — flagged for closer review.')
            : // NO prescription = no measured threshold was ever established, so
              // there is nothing to have raised (or not raised) a flag against.
              // Printing "no risk flag raised" off absent data reads to ACC as a
              // negative finding (2026-08-05 reporting-integrity sweep).
              input.prescription
              ? 'No prolonged-recovery risk flag raised on the measured threshold.'
              : 'Not assessed — no measured heart-rate threshold is on record for this episode.',
        ],
      },
      {
        heading: 'Outcome',
        kind: 'outcome',
        body: [
          outcome === 'recovered'
            ? 'Most recent graded re-test provoked no symptom exacerbation to volitional exhaustion — objective exercise tolerance recovered.' + rampNote(input)
            : outcome === 'symptom-limited'
              ? 'Exercise tolerance remains symptom-limited on graded testing at service exit.'
              : outcome === 'red-flag'
                ? 'The most recent graded test was stopped on a red-flag response. Exercise tolerance was NOT established at service exit.'
                : 'No valid graded test is on record for this episode — exercise tolerance was not established.',
        ],
      },
      {
        heading: 'Services still needed',
        kind: 'summary',
        body: [
          recovered
            ? 'No further SSTAE indicated on the measured outcome; onward care at the treating clinician’s discretion.'
            : 'Further clinician-supervised SSTAE may be indicated; any additional ACC-funded treatment is requested separately via ACC32 (Request for Prior Approval of Treatment).',
        ],
      },
    ]),
  }
}

/**
 * Return-to-play clearance record (sport). Reports the stand-down status, the
 * serial trajectory, and a clearance/extend recommendation — the clinician
 * makes the call; this template records the objective basis for it.
 */
export function rtpClearance(input: ReportInput): ReportContent {
  const outcome = testedOutcome(input)
  const recovered = outcome === 'recovered'
  return {
    title: `Return-to-play record — ${fullName(input.patient)}`,
    sections: sections([
      patientHeader(input),
      {
        heading: 'Graduated return-to-sport status',
        kind: 'summary',
        fields: [
          // VERIFY: stand-down minimums follow the current sport's protocol
          // (e.g. AFL/Concussion-in-Sport-Group graduated RTS) — clinician-set.
          { label: 'Minimum stand-down met', value: 'Clinician to confirm' },
          {
            label: 'Objective exercise tolerance',
            // 'Still symptom-limited' is a TEST FINDING — never assert it for an
            // episode with no valid graded test on record.
            value:
              outcome === 'recovered'
                ? `Recovered on graded re-test${rampShort(input)}`
                : outcome === 'symptom-limited'
                  ? 'Still symptom-limited'
                  : outcome === 'red-flag'
                    ? 'Not established — last graded test stopped on a red-flag response'
                    : 'Not established — no valid graded test on record',
          },
          {
            label: 'Recommendation',
            value: recovered
              ? 'Basis to progress the RTS pathway'
              : outcome === 'none'
                ? 'Not cleared — no objective basis recorded'
                : 'Extend — not yet cleared',
          },
        ],
      },
      trajectorySection(input),
      redFlagSection(input),
      prescriptionSection(input),
    ]),
  }
}

/** Return-to-work summary (WorkCover-style) — capacity framed by measured tolerance. */
export function rtwSummary(input: ReportInput): ReportContent {
  const { verified, total } = verifiedShare(input.sessions)
  const outcome = testedOutcome(input)
  return {
    title: `Return-to-work summary — ${fullName(input.patient)}`,
    sections: sections([
      patientHeader(input),
      {
        heading: 'Work-capacity basis',
        kind: 'summary',
        body: [
          'Capacity statements below are informed by objectively measured exercise tolerance (heart-rate threshold on graded testing); they are not a diagnostic or fitness-for-duty determination, which remains the treating clinician’s judgement.',
        ],
        fields: [
          { label: 'Current training band', value: bandText(input.prescription) },
          { label: 'Verified / total sessions', value: `${verified} / ${total}` },
        ],
      },
      trajectorySection(input),
      redFlagSection(input),
      {
        heading: 'Recommendation',
        kind: 'narrative',
        body: [
          outcome === 'recovered'
            ? 'Objective exercise tolerance has recovered; graded return-to-work can be progressed per the treating clinician.' + rampNote(input)
            : outcome === 'symptom-limited'
              ? 'Exercise tolerance remains symptom-limited; a graded, tolerance-paced work return is indicated.'
              : outcome === 'red-flag'
                ? 'The most recent graded test was stopped on a red-flag response; exercise tolerance is NOT established. No capacity statement can be made from this data.'
                : 'No valid graded test is on record for this episode; exercise tolerance is not established and no capacity statement can be made from this data.',
        ],
      },
    ]),
  }
}

/**
 * Medicolegal record — the DEFENSIBILITY export. Every clinician-directed
 * decision, every stop-rule event, and the full timestamped serial measured-HRt
 * trajectory as an audit trail. Signal quality (measured vs manual) is stated on
 * every session so the record shows exactly what was verified and what was not.
 */
export function medicolegalRecord(input: ReportInput): ReportContent {
  // Session-level audit rows: stop-rule events, overrides, verification, flares.
  const sessionRows: ReportField[] = input.sessions.map((s) => {
    const parts: string[] = [
      // Never print "avg 0 / peak 0 bpm" — 0 is not a heart rate, it is the
      // absence of one, and this is the export whose purpose is defensibility.
      typeof s.avgHeartRate === 'number' && typeof s.peakHeartRate === 'number'
        ? `avg ${s.avgHeartRate} / peak ${s.peakHeartRate} bpm`
        : 'no heart rate recorded',
      `symptom ${s.preSymptom}→${s.peakSymptom}/10`,
      // STRICT === true. `hrVerified` is optional on SessionLog, and the old
      // `=== false ? unverified : verified` branch printed "verified (live HR)"
      // for every session whose provenance was simply NOT RECORDED — a positive
      // claim manufactured from missing data, on the one export whose entire
      // purpose is defensibility (2026-08-05 reporting-integrity sweep).
      s.hrVerified === true
        ? 'verified (live HR)'
        : s.hrVerified === false
          ? 'UNVERIFIED (manual/camera)'
          : 'HR provenance NOT RECORDED',
    ]
    if (s.symptomLimited) parts.push('STOP-RULE triggered (≥2-pt rise)')
    if (s.overrodeStop) parts.push('patient override used')
    if (s.nextDayFlare) parts.push('next-day flare reported')
    return { label: fmtDate(s.at ?? s.date), value: parts.join('; ') }
  })

  const testRows: ReportField[] = input.thresholdHistory.map((t) => ({
    label: fmtDate(t.at),
    value: `graded test — ${typeof t.hrt === 'number' ? `HRt ${t.hrt} bpm` : 'no threshold found'}, interpretation: ${t.interpretation}${t.clinicianDirected ? ' (clinician-directed re-test)' : ''}`,
  }))

  return {
    title: `Medicolegal record — ${fullName(input.patient)}`,
    sections: sections([
      patientHeader(input),
      prescriptionSection(input),
      trajectorySection(input),
      redFlagSection(input),
      adherenceReviewSection(input),
      {
        heading: 'Decision audit trail (graded tests)',
        kind: 'audit',
        fields: testRows.length ? testRows : [{ label: '—', value: 'No graded tests on record.' }],
      },
      {
        heading: 'Session audit trail (stop-rules, overrides, verification)',
        kind: 'audit',
        body: [
          'Every training session is listed with its heart-rate provenance and any stop-rule / override event. Unverified rows were logged from manual entry or camera and do not count toward progression evidence.',
        ],
        fields: sessionRows.length ? sessionRows : [{ label: '—', value: 'No sessions on record.' }],
      },
    ]),
  }
}

// ── attendance-driven ACC form ───────────────────────────────────────────────

/**
 * ACC885 — NZ ACC Concussion Service **Did Not Attend (DNA) Report**.
 *
 * Per the ACC Concussion Services Operational Guidelines, the ACC885 notifies
 * ACC (within 3 business days) when a client fails to attend a scheduled
 * appointment without notice. It is NOT a progress/outcome report — outcome
 * reporting is carried by the ACC884 Client Summary Report. This is fed by the
 * attendance signal (GensolveAdapter.pollAppointments → did-not-arrive), and is
 * a notification, so its content is minimal: who, which appointment, and that no
 * notice was given. Transcribe onto ACC's current fillable ACC885 form.
 */
export function acc885(
  input: ReportInput,
  missedAppointment?: { at?: string; note?: string; notifiedInAdvance?: boolean },
): ReportContent {
  // "Client notified in advance: No" was HARDCODED. The attendance signal
  // (PmsAdapter.pollAppointments → did-not-arrive) knows only that the client
  // did not arrive — it cannot know whether they phoned ahead. Asserting "No"
  // to ACC about a client who DID give notice is a false statement on a
  // prescribed form, so it is only stated when the caller actually supplies it
  // (2026-08-05 reporting-integrity sweep).
  const notified = missedAppointment?.notifiedInAdvance
  return {
    title: `ACC885 Did Not Attend Report — ${fullName(input.patient)}`,
    sections: [
      patientHeader(input),
      {
        heading: 'Did Not Attend',
        kind: 'summary',
        fields: [
          { label: 'Scheduled appointment', value: fmtDate(missedAppointment?.at) },
          {
            label: 'Client notified in advance',
            value: notified === true ? 'Yes' : notified === false ? 'No' : 'Not recorded — clinician to confirm',
          },
        ],
        body: [
          missedAppointment?.note ??
            (notified === false
              ? 'The client did not attend the scheduled appointment and did not provide prior notice. Notified to ACC per the Concussion Services attendance-reporting requirement.'
              : 'The client did not attend the scheduled appointment. Whether prior notice was given is not recorded in the practice data — confirm before submitting. Notified to ACC per the Concussion Services attendance-reporting requirement.'),
        ],
      },
    ],
  }
}

// (No ACC six-monthly-review skin: no such prescribed ACC concussion form was
// verified. Outcome reporting is the ACC884 Client Summary Report.)
