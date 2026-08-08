/**
 * ANALYSIS ENGINE — turns the research extract into the numbers a paper states.
 *
 * Deliberately separate from the extract: the extract decides WHO is in the
 * cohort (consent, de-identification), this decides WHAT is computed. Keeping
 * them apart means a change to an analysis can never widen a cohort.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE PRIMARY QUESTION.
 *
 *   Does time spent ABOVE the prescribed sub-symptom band predict next-day
 *   symptom exacerbation, and is there a tolerable excursion budget?
 *
 * Nearly all sub-symptom threshold aerobic exercise (SSTAE) literature reports
 * PRESCRIBED dose. This product records DELIVERED dose — seconds below / in /
 * above the band, with heart-rate readings marked verified only when they came
 * from a live sensor feed — and pairs each session with a next-day check-in.
 * That is what makes the question answerable by measurement rather than by
 * convention, and it is the reason the dataset is publishable at all.
 *
 * Worth running whichever way it falls: a dose-response quantifies a rule
 * currently asserted; a null result de-escalates a restriction that makes the
 * intervention burdensome and plausibly drives dropout.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT THIS MODULE WILL NOT DO.
 *
 * It computes DESCRIPTIVES and effect estimates with confidence intervals. It
 * does NOT fit the mixed-effects model that the primary inference requires, and
 * it must not pretend to.
 *
 * Sessions are nested within episode within participant. Someone who flares
 * easily contributes many correlated rows, so pooling sessions as if they were
 * independent inflates significance — that is the single most likely route to a
 * wrong published finding from this dataset. The final model belongs in R or
 * Python (glmer / statsmodels) run by a statistician who can be a co-author.
 * What this produces is the analysis-ready table for them, plus the
 * descriptives that let you see the shape early.
 *
 * `clusterWarning` is emitted on every result for that reason.
 */

import type { ResearchRow } from './patient-registry'

/** One session, flattened for analysis. */
export interface SessionObs {
  researchRef: string
  daysSinceInjury: number | null
  ageBand: string | null
  sex: string | null
  /** Seconds above the prescribed band — the exposure. */
  secondsAbove: number | null
  secondsIn: number | null
  secondsBelow: number | null
  /** Share of readings live-sensor verified (0-100). */
  verifiedReadingPct: number | null
  /** Next-day check-in said "worse" — the outcome. */
  nextDayFlare: boolean | null
  peakSymptom: number | null
  preSymptom: number | null
  hrtBpm: number | null
  sessionIndex: number
}

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null
const bool = (v: unknown): boolean | null => (typeof v === 'boolean' ? v : null)

/**
 * Flatten the extract. Session index is assigned per participant in
 * chronological order — the extract is already ordered by researchRef then
 * created_at, which is what makes a positional index meaningful here.
 */
export function toObservations(rows: ResearchRow[]): SessionObs[] {
  const seen = new Map<string, number>()
  const out: SessionObs[] = []
  for (const r of rows) {
    const p = r.payload ?? {}
    // Threshold TESTS are not training sessions and carry no band adherence.
    if (r.sessionType === 'threshold') continue
    const idx = (seen.get(r.researchRef) ?? 0) + 1
    seen.set(r.researchRef, idx)
    out.push({
      researchRef: r.researchRef,
      daysSinceInjury: r.daysSinceInjury,
      ageBand: r.ageBand,
      sex: r.sex,
      secondsAbove: num(p.secondsAbove),
      secondsIn: num(p.secondsIn),
      secondsBelow: num(p.secondsBelow),
      verifiedReadingPct: num(p.verifiedReadingPct),
      nextDayFlare: bool(p.nextDayFlare),
      peakSymptom: num(p.peakSymptom),
      preSymptom: num(p.preSymptom),
      hrtBpm: r.hrtBpm,
      sessionIndex: idx,
    })
  }
  return out
}

/**
 * ANALYSIS SET for the primary question. Three exclusions, each stated so the
 * paper's flow diagram can be generated from code rather than from memory:
 *
 *  1. no next-day check-in  → the outcome is unobserved, not negative. Treating
 *     a missing check-in as "no flare" would bias the effect toward null and is
 *     the most tempting mistake available here.
 *  2. adherence not sensor-verified → a typed heart rate cannot evidence
 *     time-above-band. These sessions are descriptive only.
 *  3. no time-in-zone data → no exposure.
 */
export interface AnalysisSet {
  included: SessionObs[]
  excludedNoCheckin: number
  excludedUnverified: number
  excludedNoZoneData: number
}

export const MIN_VERIFIED_PCT = 80

export function buildAnalysisSet(obs: SessionObs[]): AnalysisSet {
  let excludedNoCheckin = 0, excludedUnverified = 0, excludedNoZoneData = 0
  const included: SessionObs[] = []
  for (const o of obs) {
    if (o.secondsAbove === null && o.secondsIn === null) { excludedNoZoneData++; continue }
    if (o.verifiedReadingPct === null || o.verifiedReadingPct < MIN_VERIFIED_PCT) { excludedUnverified++; continue }
    if (o.nextDayFlare === null) { excludedNoCheckin++; continue }
    included.push(o)
  }
  return { included, excludedNoCheckin, excludedUnverified, excludedNoZoneData }
}

export interface ExposureStratum {
  label: string
  minSecondsAbove: number
  maxSecondsAbove: number | null
  sessions: number
  participants: number
  flares: number
  flareRate: number
  ci95: [number, number]
}

/**
 * Wilson score interval — correct at the small counts and extreme proportions
 * this dataset will actually produce. The normal approximation gives intervals
 * that cross zero or exceed one when a stratum has few flares, which is exactly
 * where the interesting strata sit.
 */
export function wilson(successes: number, n: number): [number, number] {
  if (n === 0) return [0, 0]
  const z = 1.959964
  const p = successes / n
  const d = 1 + (z * z) / n
  const c = p + (z * z) / (2 * n)
  const s = z * Math.sqrt(p * (1 - p) / n + (z * z) / (4 * n * n))
  return [Math.max(0, (c - s) / d), Math.min(1, (c + s) / d)]
}

/**
 * Flare rate by excursion band. The strata are minutes-above, because that is
 * the unit a clinician would act on ("under two minutes is fine") — a
 * per-second odds ratio is not a prescribable rule.
 */
export const EXPOSURE_STRATA: Array<{ label: string; min: number; max: number | null }> = [
  { label: '0 (in band)', min: 0, max: 0 },
  { label: '1-60s', min: 1, max: 60 },
  { label: '1-2 min', min: 61, max: 120 },
  { label: '2-5 min', min: 121, max: 300 },
  { label: '>5 min', min: 301, max: null },
]

export function flareByExposure(set: AnalysisSet): ExposureStratum[] {
  return EXPOSURE_STRATA.map((s) => {
    const rows = set.included.filter((o) => {
      const a = o.secondsAbove ?? 0
      return a >= s.min && (s.max === null || a <= s.max)
    })
    const flares = rows.filter((o) => o.nextDayFlare === true).length
    const [lo, hi] = wilson(flares, rows.length)
    return {
      label: s.label,
      minSecondsAbove: s.min,
      maxSecondsAbove: s.max,
      sessions: rows.length,
      participants: new Set(rows.map((o) => o.researchRef)).size,
      flares,
      flareRate: rows.length ? flares / rows.length : 0,
      ci95: [lo, hi],
    }
  })
}

export interface CohortSummary {
  participants: number
  sessions: number
  sessionsPerParticipant: number
  medianDaysSinceInjury: number | null
  ageBands: Record<string, number>
  sexes: Record<string, number>
  overallFlareRate: number
}

export function summariseCohort(obs: SessionObs[]): CohortSummary {
  const byRef = new Map<string, SessionObs[]>()
  for (const o of obs) {
    const arr = byRef.get(o.researchRef) ?? []
    arr.push(o); byRef.set(o.researchRef, arr)
  }
  const firsts = [...byRef.values()].map((a) => a[0])
  const days = firsts.map((f) => f.daysSinceInjury).filter((d): d is number => d !== null).sort((a, b) => a - b)
  const count = (key: keyof SessionObs) => {
    const m: Record<string, number> = {}
    for (const f of firsts) {
      const k = String(f[key] ?? 'unknown')
      m[k] = (m[k] ?? 0) + 1
    }
    return m
  }
  const withCheckin = obs.filter((o) => o.nextDayFlare !== null)
  return {
    participants: byRef.size,
    sessions: obs.length,
    sessionsPerParticipant: byRef.size ? obs.length / byRef.size : 0,
    medianDaysSinceInjury: days.length ? days[Math.floor(days.length / 2)] : null,
    ageBands: count('ageBand'),
    sexes: count('sex'),
    overallFlareRate: withCheckin.length
      ? withCheckin.filter((o) => o.nextDayFlare === true).length / withCheckin.length
      : 0,
  }
}

/**
 * POWER. The primary question is a session-level comparison of two proportions
 * (flare rate in-band vs above-band), which is why the PARTICIPANT n is far
 * lower than a between-subjects design would need.
 *
 * The design effect correction is not optional. With ~15 correlated sessions
 * per participant, ignoring clustering understates the required n several-fold
 * — this returns the corrected figure so nobody plans a study off the naive one.
 */
export function requiredParticipants(
  baselineFlareRate: number,
  detectableRate: number,
  sessionsPerParticipant = 15,
  intraclassCorrelation = 0.15,
): { naiveSessions: number; designEffect: number; effectiveSessions: number; participants: number } {
  const p1 = Math.min(Math.max(baselineFlareRate, 0.001), 0.999)
  const p2 = Math.min(Math.max(detectableRate, 0.001), 0.999)
  const zA = 1.959964, zB = 0.8416212 // alpha .05 two-sided, 80% power
  const pBar = (p1 + p2) / 2
  const naivePerArm = Math.ceil(
    ((zA * Math.sqrt(2 * pBar * (1 - pBar)) + zB * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2) /
      ((p1 - p2) ** 2),
  )
  const naiveSessions = naivePerArm * 2
  const designEffect = 1 + (sessionsPerParticipant - 1) * intraclassCorrelation
  const effectiveSessions = Math.ceil(naiveSessions * designEffect)
  return {
    naiveSessions,
    designEffect,
    effectiveSessions,
    participants: Math.ceil(effectiveSessions / sessionsPerParticipant),
  }
}

export const CLUSTER_WARNING =
  'Sessions are nested within participant. These are DESCRIPTIVE estimates with ' +
  'Wilson intervals that assume independence; the primary inference requires a ' +
  'mixed-effects logistic model with a participant random intercept. Do not ' +
  'report these p-values or intervals as the primary result.'

export interface AnalysisResult {
  cohort: CohortSummary
  set: Omit<AnalysisSet, 'included'> & { includedSessions: number }
  exposure: ExposureStratum[]
  power: ReturnType<typeof requiredParticipants>
  clusterWarning: string
}

export function runAnalysis(rows: ResearchRow[]): AnalysisResult {
  const obs = toObservations(rows)
  const set = buildAnalysisSet(obs)
  const exposure = flareByExposure(set)
  const inBand = exposure[0]
  return {
    cohort: summariseCohort(obs),
    set: {
      includedSessions: set.included.length,
      excludedNoCheckin: set.excludedNoCheckin,
      excludedUnverified: set.excludedUnverified,
      excludedNoZoneData: set.excludedNoZoneData,
    },
    exposure,
    power: requiredParticipants(inBand.flareRate || 0.15, (inBand.flareRate || 0.15) * 2),
    clusterWarning: CLUSTER_WARNING,
  }
}
