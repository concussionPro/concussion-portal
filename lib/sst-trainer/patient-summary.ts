import { sql } from '@/lib/db'

/**
 * Objective SST-episode summary for a patient — the values that autofill the
 * WorkCover / NDIS / GP documents. Construct-level only (measured facts about
 * exercise tolerance); no efficacy or diagnosis claim. Mirrors the query +
 * verified-session logic in gp-report-html.ts.
 */
export interface PatientSstSummary {
  initialHrt: number | null
  latestHrt: number | null
  bandLow: number | null
  bandHigh: number | null
  verifiedSessions: number
  totalSessions: number
  durationWeeks: number
  clearanceReady: boolean
  recoveryStatement: string
}

interface Row {
  session_type: string
  hrt_bpm: number | null
  band_low: number | null
  band_high: number | null
  payload: Record<string, unknown> | null
  created_at: string
}

export async function computePatientSstSummary(
  code: string,
  patientLabel: string,
  /** install-UUID identity — prefer over the display label (final sweep #9) */
  patientRef = '',
): Promise<PatientSstSummary | null> {
  const ref = patientRef.trim()
  const { rows } = await sql<Row>`
    SELECT session_type, hrt_bpm, band_low, band_high, payload, created_at
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

  const thresholds = rows.filter((r) => r.session_type === 'threshold' && typeof r.hrt_bpm === 'number')
  const trainings = rows.filter((r) => r.session_type !== 'threshold')

  const isVerified = (p: Row['payload']) => {
    const src = p?.hrSource as string | undefined
    return p?.hrVerified === true && src !== 'manual' && src !== undefined
  }
  const verifiedSessions = trainings.filter((t) => isVerified(t.payload)).length

  const initial = thresholds[0] ?? null
  const latest = thresholds[thresholds.length - 1] ?? null
  const initialHrt = initial?.hrt_bpm ?? null
  const latestHrt = latest?.hrt_bpm ?? null
  const bandLow = latest?.band_low ?? null
  const bandHigh = latest?.band_high ?? null

  const firstMs = Date.parse(rows[0].created_at)
  const lastMs = Date.parse(rows[rows.length - 1].created_at)
  const durationWeeks = Math.max(
    1,
    Math.round((lastMs - firstMs) / (7 * 24 * 3600 * 1000)),
  )

  const clearanceReady = (latest?.payload?.interpretation as string | undefined) === 'no-intolerance'
  const wk = `${durationWeeks} week${durationWeeks === 1 ? '' : 's'}`

  let recoveryStatement: string
  if (clearanceReady) {
    recoveryStatement =
      'The most recent graded re-test provoked no symptom exacerbation to volitional exhaustion, indicating recovered exercise tolerance on objective testing.'
  } else if (initialHrt != null && latestHrt != null && latestHrt > initialHrt) {
    recoveryStatement =
      `The measured heart-rate threshold has risen from ${initialHrt} bpm to ${latestHrt} bpm over ${wk} of clinician-supervised training, indicating improving exercise tolerance; the symptom-limited threshold has not yet fully resolved.`
  } else if (initialHrt != null) {
    recoveryStatement =
      `The measured heart-rate threshold is ${latestHrt ?? initialHrt} bpm; exercise tolerance remains symptom-limited and clinician-supervised training is ongoing.`
  } else {
    recoveryStatement = 'Clinician-supervised sub-symptom-threshold aerobic training is in progress.'
  }

  return {
    initialHrt,
    latestHrt,
    bandLow,
    bandHigh,
    verifiedSessions,
    totalSessions: trainings.length,
    durationWeeks,
    clearanceReady,
    recoveryStatement,
  }
}

/** Merge-field values for the discharge templates, derived from the summary. */
export function sstSummaryMergeFields(s: PatientSstSummary): Record<string, string> {
  const band = s.bandLow != null && s.bandHigh != null ? `${s.bandLow}–${s.bandHigh} bpm` : '—'
  return {
    sst_initial_hrt: s.initialHrt != null ? `${s.initialHrt} bpm` : '—',
    sst_latest_hrt: s.latestHrt != null ? `${s.latestHrt} bpm` : '—',
    sst_band: band,
    sst_sessions: `${s.verifiedSessions} verified (${s.totalSessions} total)`,
    sst_duration: `${s.durationWeeks} week${s.durationWeeks === 1 ? '' : 's'}`,
    sst_recovery_statement: s.recoveryStatement,
  }
}
