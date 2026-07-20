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
import { getClinic } from '../clinic-registry'
import { computePrescription } from '../protocol'
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
/** Sensor-verified ONLY (strict) — a manual/camera entry is never "verified". */
const isVerified = (p: Record<string, unknown> | null): boolean => {
  const src = p?.hrSource as string | undefined
  return p?.hrVerified === true && src !== 'manual' && src !== undefined
}
const VALID_INTERP = new Set(['physiologic', 'no-intolerance', 'red-flag', 'invalid'])
const asInterp = (s: unknown): ThresholdResult['interpretation'] =>
  (typeof s === 'string' && VALID_INTERP.has(s) ? s : 'invalid') as ThresholdResult['interpretation']

export interface LoadReportOptions {
  /** Real identity to stamp on the report (else the de-identified label is used). */
  patient?: Partial<ReportPatient>
  clinician?: { name: string; credential?: string }
  goals?: ReportGoal[]
}

/**
 * Assemble a `ReportInput` for one clinic + patient label, or null when there is
 * no episode data. Same query + verification rules as the live GP report.
 */
export async function loadReportInput(
  code: string,
  patientLabel: string,
  jurisdiction: Jurisdiction,
  opts: LoadReportOptions = {},
): Promise<ReportInput | null> {
  const { rows } = await sql<Row>`
    SELECT patient_label, session_type, hrt_bpm, band_low, band_high, condition, payload, created_at
    FROM sst_clinic_sessions
    WHERE upper(clinic_code) = ${code.toUpperCase()}
      AND trim(coalesce(patient_label, '')) = ${patientLabel}
    ORDER BY created_at ASC
  `
  if (rows.length === 0) return null

  const thresholds = rows.filter((r) => r.session_type === 'threshold')
  const trainings = rows.filter((r) => r.session_type !== 'threshold')
  const latest = thresholds[thresholds.length - 1]
  const condition = ((latest?.condition as Condition) || 'concussion') as Condition

  const thresholdHistory: PersistedTest[] = thresholds.map((t) => ({
    at: new Date(t.created_at).getTime(),
    interpretation: (t.payload?.interpretation as string) ?? 'invalid',
    hrt: t.hrt_bpm,
    thresholdStage: num(t.payload?.thresholdStage),
    modality: (t.payload?.modality as TestModality) ?? null,
    restingSymptomScore: num(t.payload?.restingSymptomScore) ?? 0,
  }))

  const sessions: PersistedSession[] = trainings.map((t) => ({
    date: t.created_at,
    at: new Date(t.created_at).getTime(),
    avgHeartRate: num(t.payload?.avgHeartRate) ?? num(t.payload?.avgHr) ?? 0,
    peakHeartRate: num(t.payload?.peakHeartRate) ?? num(t.payload?.peakHr) ?? 0,
    preSymptom: num(t.payload?.preSymptom) ?? 0,
    peakSymptom: num(t.payload?.peakSymptom) ?? 0,
    completedMinutes: num(t.payload?.completedMinutes) ?? 0,
    hrVerified: isVerified(t.payload),
    nextDayFlare: t.payload?.nextDayFlare === true,
  }))

  const latestHrt = latest?.hrt_bpm ?? null
  const restingHr = num(latest?.payload?.restingHr)
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
    episode: { startedAt: rows[0].created_at, reportedAt: new Date().toISOString() },
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
