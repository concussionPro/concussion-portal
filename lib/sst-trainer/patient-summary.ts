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

  // Order by WHEN IT HAPPENED, not when it was inserted — an offline test or a
  // queue flushed days later otherwise becomes the "latest" test and drives the
  // clearance branch below (same rule as reports/load.ts and gp-report-html.ts).
  const occurredMs = (r: Row): number => {
    const inserted = Date.parse(r.created_at)
    const raw = Number(r.payload?.occurredAt)
    if (!Number.isFinite(raw)) return inserted
    // Trust it only when it is in the past and no earlier than a year before
    // the insert — a client may never date a session into the future.
    if (!Number.isFinite(inserted) || raw > inserted + 60_000 || raw < inserted - 365 * 86_400_000) {
      return inserted
    }
    return raw
  }
  const byOccurred = (list: Row[]) => [...list].sort((a, b) => occurredMs(a) - occurredMs(b))

  const evOf = (p: Row['payload']) => (typeof p?.eventType === 'string' ? p.eventType.toLowerCase() : '')
  /** audit entries (walk-out, red-flag self-clear) — NOT graded tests */
  const isEventRow = (p: Row['payload']) => evOf(p) === 'test-aborted' || evOf(p) === 'red-flag-cleared'

  // Every real graded test, measurable or not. `thresholds` used to keep only
  // rows carrying an hrt_bpm — but a 'no-intolerance' (and a red-flag) test
  // stores hrt NULL, so the latest test could never be one of those: the
  // clearance branch below was unreachable, and a red-flag test was invisible
  // while an older physiologic test kept reading as "training ongoing".
  const thresholdTests = byOccurred(rows.filter((r) => r.session_type === 'threshold' && !isEventRow(r.payload)))
  const measured = thresholdTests.filter((r) => typeof r.hrt_bpm === 'number')
  // An ABANDONED attempt is not a training session. It syncs with
  // session_type 'training' (eventType 'session-abandoned' — the Cancel tap and
  // the page-hide handler both send it) and carries no completedMinutes, so
  // counting it inflated `sst_sessions` ("N verified (M total)") on the
  // WorkCover / NDIS / GP documents with sessions the patient never did. An
  // interrupted-then-finished attempt is already collapsed by this rule: the
  // completed log carries the same sessionUid and is the row that counts.
  const trainings = rows.filter(
    (r) => r.session_type !== 'threshold' && evOf(r.payload) !== 'session-abandoned',
  )

  const isVerified = (p: Row['payload']) => {
    const src = p?.hrSource as string | undefined
    return p?.hrVerified === true && src !== 'manual' && src !== undefined
  }
  const verifiedSessions = trainings.filter((t) => isVerified(t.payload)).length

  // Numbers come from MEASURED tests; the clinical read comes from the NEWEST
  // test of any kind.
  const initial = measured[0] ?? null
  const latestMeasured = measured[measured.length - 1] ?? null
  const latestTest = thresholdTests[thresholdTests.length - 1] ?? null
  const latestInterp = (latestTest?.payload?.interpretation as string | undefined) ?? null
  const initialHrt = initial?.hrt_bpm ?? null
  const latestHrt = latestMeasured?.hrt_bpm ?? null
  const bandLow = latestMeasured?.band_low ?? null
  const bandHigh = latestMeasured?.band_high ?? null

  const ordered = byOccurred(rows)
  const firstMs = occurredMs(ordered[0])
  const lastMs = occurredMs(ordered[ordered.length - 1])
  const durationWeeks = Math.max(
    1,
    Math.round((lastMs - firstMs) / (7 * 24 * 3600 * 1000)),
  )

  const clearanceReady = latestInterp === 'no-intolerance'
  const wk = `${durationWeeks} week${durationWeeks === 1 ? '' : 's'}`

  let recoveryStatement: string
  if (latestInterp === 'red-flag') {
    // A red-flag graded test outranks every tolerance statement: the episode's
    // most recent objective test was STOPPED for a warning symptom, and a
    // document that quietly reported the older threshold instead read as an
    // uneventful course of training.
    recoveryStatement =
      'The most recent graded test was terminated for a red-flag symptom and referred for medical review; no statement of exercise tolerance can be made from it. Any earlier threshold below predates that event.'
  } else if (clearanceReady) {
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
