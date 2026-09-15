import { SESSION_STOP_RISE } from '@/lib/sst-trainer/protocol'

/**
 * Single definition of an in-session flare for GP/payer report surfaces.
 * Matches the in-app stop rule and the clinical hub: a rise of MORE THAN
 * SESSION_STOP_RISE points (a rise of exactly 2 is tolerated, per the
 * Amsterdam 2-point rule), or an explicit flare / next-day flare flag.
 * The research registry's delayed 12-36 h outcome keeps its own
 * pre-registered >= 2 definition in research.ts; do not use this there.
 */
export function isTrainingFlare(payload: Record<string, unknown> | null | undefined): boolean {
  if (!payload) return false
  if (payload.flare === true || payload.nextDayFlare === true) return true
  const pre = typeof payload.preSymptom === 'number' ? payload.preSymptom : null
  const peak = typeof payload.peakSymptom === 'number' ? payload.peakSymptom : null
  return pre != null && peak != null && peak - pre > SESSION_STOP_RISE
}
