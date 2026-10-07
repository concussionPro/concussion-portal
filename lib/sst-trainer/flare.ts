import { SESSION_STOP_RISE } from '@/lib/sst-trainer/protocol'

/**
 * Single definition of an in-session flare for GP/payer report surfaces.
 * Matches the in-app stop rule and the clinical hub: a rise of
 * SESSION_STOP_RISE points OR MORE (Leddy 2019 JAMA Pediatr — "stop their home
 * exercise session if their symptoms increased by 2 or more points"), or an
 * explicit flare / next-day flare flag.
 * The research registry's delayed 12-36 h outcome keeps its own
 * pre-registered definition in research.ts; do not use this there.
 */
export function isTrainingFlare(payload: Record<string, unknown> | null | undefined): boolean {
  if (!payload) return false
  if (payload.flare === true || payload.nextDayFlare === true) return true
  const pre = typeof payload.preSymptom === 'number' ? payload.preSymptom : null
  const peak = typeof payload.peakSymptom === 'number' ? payload.peakSymptom : null
  return pre != null && peak != null && peak - pre >= SESSION_STOP_RISE
}
