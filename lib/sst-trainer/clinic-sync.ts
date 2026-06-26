/**
 * Clinic data-flow — sends a patient's SST events back to their clinician via
 * the CLINIC CODE they entered at intake. Fire-and-forget + best-effort: a
 * failed sync must NEVER block or break the patient's session UI. Only fires
 * when a clinic code is present (self-guided users send nothing).
 *
 * The journey it carries:
 *   - 'threshold' (initial assessment + every re-test): HRt, prescribed band,
 *     and the clinical interpretation — 'physiologic' (in rehab) vs
 *     'no-intolerance' (recovered: the return-to-activity / clearance signal).
 *   - 'training' (each rehab session): the session log (HR, minutes, symptom Δ).
 */

export interface ClinicSyncInput {
  clinicCode?: string | null
  patientLabel?: string | null
  sessionType: 'threshold' | 'training'
  hrtBpm?: number | null
  bandLow?: number | null
  bandHigh?: number | null
  condition?: string | null
  payload?: unknown
}

export function syncSessionToClinic(input: ClinicSyncInput): void {
  const code = input.clinicCode?.trim()
  if (!code) return // self-guided — nothing flows
  try {
    void fetch('/api/sst/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicCode: code,
        patientLabel: input.patientLabel ?? null,
        sessionType: input.sessionType,
        hrtBpm: input.hrtBpm ?? null,
        bandLow: input.bandLow ?? null,
        bandHigh: input.bandHigh ?? null,
        condition: input.condition ?? null,
        payload: input.payload ?? {},
      }),
      keepalive: true, // survive navigation away from the session screen
    }).catch(() => {})
  } catch {
    /* best-effort: never throw into the patient UI */
  }
}
