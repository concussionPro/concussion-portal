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

/** Verified-session share — the core signal-quality metric on every report. */
function verifiedShare(sessions: PersistedSession[]): { verified: number; total: number } {
  const total = sessions.length
  const verified = sessions.filter((s) => s.hrVerified !== false).length
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
 * ACC884 — NZ ACC allied-health treatment plan / extension request.
 * Skeleton with the known ACC fields: SMART goals, requested additional service
 * (session) hours, and outcome status per the ACC Contract clause 5.13.2
 * reporting obligation. Field wording is a scaffold — VERIFY against the current
 * ACC884 form before production emission.
 */
export function acc884(input: ReportInput): ReportContent {
  const goals = input.goals ?? []
  const goalFields: ReportField[] =
    goals.length > 0
      ? goals.map((g, i) => ({
          label: `SMART goal ${i + 1}`,
          value: `${g.label}${g.status ? ` — ${g.status}` : ''}`,
        }))
      : [{ label: 'SMART goals', value: 'No goals recorded.' }]

  return {
    title: `ACC884 treatment plan — ${fullName(input.patient)}`,
    sections: [
      patientHeader(input),
      { heading: 'SMART goals', kind: 'goals', fields: goalFields },
      {
        heading: 'Requested service',
        kind: 'summary',
        // VERIFY: ACC884 requests additional treatment SESSIONS, not clinician
        // hours; map dose → requested sessions once the current form is confirmed.
        fields: [
          { label: 'Requested additional sessions', value: 'TODO — clinician-entered' },
          { label: 'Rationale', value: 'Ongoing symptom-limited exercise intolerance on graded testing.' },
        ],
      },
      prescriptionSection(input),
      trajectorySection(input),
      {
        heading: 'Outcome status (cl. 5.13.2)',
        kind: 'outcome',
        body: [
          input.latestTest?.interpretation === 'no-intolerance'
            ? 'Most recent graded re-test provoked no symptom exacerbation to volitional exhaustion — objective exercise tolerance recovered.'
            : 'Exercise tolerance remains symptom-limited on graded testing; treatment ongoing.',
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
          { label: 'Minimum stand-down met', value: 'TODO — clinician-confirmed' },
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

// ── stubbed skins (TODO) ─────────────────────────────────────────────────────

/**
 * ACC885 — NZ ACC progress report (attendance-driven).
 * TODO: build once the current ACC885 field set + the attendance feed
 * (GensolveAdapter.pollAppointments → attended-session count) are wired.
 */
export function acc885(input: ReportInput): ReportContent {
  return {
    title: `ACC885 progress report — ${fullName(input.patient)}`,
    sections: [
      patientHeader(input),
      {
        heading: 'ACC885',
        kind: 'summary',
        body: ['TODO — ACC885 progress/attendance report not yet implemented.'],
      },
    ],
  }
}

/**
 * NZ ACC six-monthly review.
 * TODO: build once the six-monthly review template + long-episode trajectory
 * summarisation are confirmed.
 */
export function sixMonthlyReview(input: ReportInput): ReportContent {
  return {
    title: `ACC six-monthly review — ${fullName(input.patient)}`,
    sections: [
      patientHeader(input),
      {
        heading: 'Six-monthly review',
        kind: 'summary',
        body: ['TODO — ACC six-monthly review not yet implemented.'],
      },
    ],
  }
}
