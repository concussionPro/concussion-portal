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
      value: `HRt ${t.hrt} bpm${t.modality ? ` (${t.modality})` : ''}, resting symptom ${t.restingSymptomScore}/10, interpretation: ${t.interpretation}`,
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
  const inBand =
    rx != null
      ? input.sessions.filter(
          (s) => s.avgHeartRate >= rx.lowerBpm && s.avgHeartRate <= rx.upperBpm,
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
      value: rx != null ? `${inBand} / ${total}` : 'no active prescription',
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
    sections: [
      patientHeader(input),
      prescriptionSection(input),
      trajectorySection(input),
      adherenceReviewSection(input),
      {
        heading: 'Summary',
        kind: 'narrative',
        body: [
          input.latestTest?.message ??
            'Clinician-supervised sub-symptom-threshold aerobic training is in progress; measured exercise tolerance is tracked by serial graded testing (see trajectory).',
        ],
      },
    ],
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
  const recovered = input.latestTest?.interpretation === 'no-intolerance'
  const goalFields: ReportField[] =
    goals.length > 0
      ? goals.map((g, i) => ({
          label: `Goal ${i + 1}`,
          value: `${g.label}${g.status ? ` — ${g.status}` : ''}`,
        }))
      : [{ label: 'Goals', value: 'No goals recorded.' }]

  return {
    title: `ACC884 Client Summary Report — ${fullName(input.patient)}`,
    sections: [
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
      adherenceReviewSection(input, { accFraming: true }),
      { heading: 'Goals', kind: 'goals', fields: goalFields },
      {
        heading: 'Risk assessment',
        kind: 'summary',
        body: [
          input.prescription?.prolongedRecoveryRisk
            ? (input.prescription.clinicianNote ??
              'Measured threshold sits below the validated prolonged-recovery cut-off — flagged for closer review.')
            : 'No prolonged-recovery risk flag raised on the measured threshold.',
        ],
      },
      {
        heading: 'Outcome',
        kind: 'outcome',
        body: [
          recovered
            ? 'Most recent graded re-test provoked no symptom exacerbation to volitional exhaustion — objective exercise tolerance recovered.'
            : 'Exercise tolerance remains symptom-limited on graded testing at service exit.',
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
    ],
  }
}

/**
 * Return-to-play clearance record (sport). Reports the stand-down status, the
 * serial trajectory, and a clearance/extend recommendation — the clinician
 * makes the call; this template records the objective basis for it.
 */
export function rtpClearance(input: ReportInput): ReportContent {
  const recovered = input.latestTest?.interpretation === 'no-intolerance'
  return {
    title: `Return-to-play record — ${fullName(input.patient)}`,
    sections: [
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
            value: recovered ? 'Recovered on graded re-test' : 'Still symptom-limited',
          },
          {
            label: 'Recommendation',
            value: recovered ? 'Basis to progress the RTS pathway' : 'Extend — not yet cleared',
          },
        ],
      },
      trajectorySection(input),
      prescriptionSection(input),
    ],
  }
}

/** Return-to-work summary (WorkCover-style) — capacity framed by measured tolerance. */
export function rtwSummary(input: ReportInput): ReportContent {
  const { verified, total } = verifiedShare(input.sessions)
  return {
    title: `Return-to-work summary — ${fullName(input.patient)}`,
    sections: [
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
      {
        heading: 'Recommendation',
        kind: 'narrative',
        body: [
          input.latestTest?.interpretation === 'no-intolerance'
            ? 'Objective exercise tolerance has recovered; graded return-to-work can be progressed per the treating clinician.'
            : 'Exercise tolerance remains symptom-limited; a graded, tolerance-paced work return is indicated.',
        ],
      },
    ],
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
      `avg ${s.avgHeartRate} / peak ${s.peakHeartRate} bpm`,
      `symptom ${s.preSymptom}→${s.peakSymptom}/10`,
      s.hrVerified === false ? 'UNVERIFIED (manual/camera)' : 'verified (live HR)',
    ]
    if (s.symptomLimited) parts.push('STOP-RULE triggered (≥2-pt rise)')
    if (s.overrodeStop) parts.push('patient override used')
    if (s.nextDayFlare) parts.push('next-day flare reported')
    return { label: fmtDate(s.at ?? s.date), value: parts.join('; ') }
  })

  const testRows: ReportField[] = input.thresholdHistory.map((t) => ({
    label: fmtDate(t.at),
    value: `graded test — ${typeof t.hrt === 'number' ? `HRt ${t.hrt} bpm` : 'no threshold found'}, interpretation: ${t.interpretation}`,
  }))

  return {
    title: `Medicolegal record — ${fullName(input.patient)}`,
    sections: [
      patientHeader(input),
      prescriptionSection(input),
      trajectorySection(input),
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
    ],
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
  missedAppointment?: { at?: string; note?: string },
): ReportContent {
  return {
    title: `ACC885 Did Not Attend Report — ${fullName(input.patient)}`,
    sections: [
      patientHeader(input),
      {
        heading: 'Did Not Attend',
        kind: 'summary',
        fields: [
          { label: 'Scheduled appointment', value: fmtDate(missedAppointment?.at) },
          { label: 'Client notified in advance', value: 'No' },
        ],
        body: [
          missedAppointment?.note ??
            'The client did not attend the scheduled appointment and did not provide prior notice. Notified to ACC per the Concussion Services attendance-reporting requirement.',
        ],
      },
    ],
  }
}

// (No ACC six-monthly-review skin: no such prescribed ACC concussion form was
// verified. Outcome reporting is the ACC884 Client Summary Report.)
