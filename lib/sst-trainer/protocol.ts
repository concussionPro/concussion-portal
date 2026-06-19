/**
 * Sub-Symptom-Threshold Trainer — clinical protocol engine.
 *
 * The evidence-based brain of the wearable/app product. Pure functions, no I/O,
 * so it powers the web MVP, the clinician dashboard, and (later) the native
 * Apple Watch / Garmin apps identically.
 *
 * EVIDENCE BASE (referenced inline; full citations in the EP course + brief):
 *  - Buffalo Concussion Treadmill Test (BCTT) — modified Balke protocol:
 *    start 3.6 mph (>5'5") or 3.2 mph (<=5'5"), 0deg incline for minute 1, then
 *    +1deg incline EVERY MINUTE for 15 stages; after 15deg, +0.2 mph/min.
 *    HR, RPE and symptom severity (0-10 VAS) recorded EVERY MINUTE (each stage).
 *    Symptom threshold = a rise of >=3 points above resting VAS -> HR at that
 *    minute = HRt. Voluntary exhaustion = RPE > 17 without symptom provocation.
 *    (Leddy & Willer 2013; Leddy et al. 2018/2019; BCTT instruction manual,
 *    J Sport Med suppl.) -> this is why the app prompts PER MINUTE, not per 10bpm.
 *  - Sub-symptom-threshold aerobic exercise (SSTAE): train at 80-90% of HRt,
 *    ~20 min, most days; within-session stop if symptoms rise >=2 points; re-test
 *    and advance the ceiling as tolerance recovers (Leddy 2019 JAMA Peds; Leddy
 *    "Practical Management: Prescribing SSTAE" 2020).
 *
 * SCOPE: condition-parameterised so the same engine serves concussion/mTBI today
 * and the broader neurorehab / TBI expansion (graded, autonomically-paced
 * exercise within a symptom-defined ceiling). Condition presets only change
 * defaults and copy — the safety logic is shared.
 */

export type Condition =
  | 'concussion'
  | 'mtbi'
  | 'tbi'
  | 'neuro-other'
  // Platform-expansion pathways (each a protocol module sharing the same safety
  // logic; only the band/dose defaults below differ).
  | 'cancer'
  | 'long-covid'
  | 'cardiac'

/** A single minute/stage of the guided graded (threshold-finding) test. */
export interface TestStage {
  minute: number          // 1-based stage index
  heartRate: number       // bpm at the end of the stage
  rpe?: number            // Borg 6-20 (optional)
  symptomScore: number    // 0-10 overall symptom severity at the stage
  /** symptoms the user tapped this stage (from their preselected list) */
  symptomsReported?: string[]
}

export type TestTermination = 'symptom-limited' | 'exhaustion-limited' | 'red-flag'

export interface TestInput {
  restingSymptomScore: number   // 0-10, captured before the ramp
  stages: TestStage[]
  termination: TestTermination
  condition?: Condition
}

export interface ThresholdResult {
  hrtFound: boolean
  hrt: number | null            // heart-rate threshold (bpm)
  thresholdStage: number | null // which minute provoked it
  /** clinical interpretation for the user + clinician */
  interpretation:
    | 'physiologic'             // symptom-limited -> exercise intolerance, prescribe SSTAE
    | 'no-intolerance'          // exhaustion-limited, no provocation -> likely not physiologic phenotype, refer
    | 'red-flag'                // stopped for a red flag -> medical review
    | 'invalid'                 // not enough data
  message: string
}

/** Per-condition tuning. Safety thresholds are shared; only framing/defaults differ. */
const CONDITION_DEFAULTS: Record<Condition, { lowerPct: number; upperPct: number; sessionMinutes: number; daysPerWeek: number }> = {
  // Concussion / mTBI: Leddy 80-90% HRt, ~20 min, most days.
  concussion:    { lowerPct: 0.8, upperPct: 0.9, sessionMinutes: 20, daysPerWeek: 6 },
  mtbi:          { lowerPct: 0.8, upperPct: 0.9, sessionMinutes: 20, daysPerWeek: 6 },
  // Moderate-severe TBI / neuro: start more conservative (wider safety margin, shorter).
  tbi:           { lowerPct: 0.7, upperPct: 0.8, sessionMinutes: 15, daysPerWeek: 5 },
  'neuro-other': { lowerPct: 0.7, upperPct: 0.85, sessionMinutes: 15, daysPerWeek: 5 },
  // ── Platform-expansion pathways ──────────────────────────────────────────
  // These deliberately mirror the tbi/neuro-other conservatism: a lower, narrower
  // band well under the symptom ceiling and shorter, fewer sessions. The same
  // HRt-anchored, symptom-limited safety logic applies — only the dose is gentler.
  // Cancer (pre-/rehab): exercise oncology guidance favours moderate, well-
  // tolerated aerobic dosing (~65-80% of an individualised ceiling) to manage
  // fatigue/deconditioning without overload (ACSM/COSA exercise-oncology
  // guidelines; Campbell et al. 2019 MSSE roundtable).
  cancer:        { lowerPct: 0.65, upperPct: 0.8, sessionMinutes: 20, daysPerWeek: 5 },
  // Long COVID / post-viral dysautonomia (POTS): pacing-first to avoid post-
  // exertional symptom exacerbation — narrow band (~70-80%), shorter sessions,
  // advance only on clean runs (NICE/CDC post-COVID pacing; Levine POTS exercise
  // protocol adapted to a symptom-limited ceiling).
  'long-covid':  { lowerPct: 0.7, upperPct: 0.8, sessionMinutes: 15, daysPerWeek: 5 },
  // Cardiac / pulmonary rehab: lowest, most conservative band (~60-75%) reflecting
  // standard phase-II rehab intensity targets and a hard do-not-exceed ceiling
  // (AACVPR / ESC cardiac-rehabilitation prescriptions).
  cardiac:       { lowerPct: 0.6, upperPct: 0.75, sessionMinutes: 20, daysPerWeek: 5 },
}

/** The validated symptom-provocation threshold: a rise of >=3 points from rest. */
export const PROVOCATION_RISE = 3
/** Within-session stop rule during training: a rise of >=2 points. */
export const SESSION_STOP_RISE = 2
/** Voluntary-exhaustion RPE (Borg) without symptom provocation. */
export const EXHAUSTION_RPE = 17

/**
 * Detect the heart-rate threshold (HRt) from a guided graded test.
 * HRt = HR at the FIRST stage whose symptom score rose >=3 points above rest.
 */
export function detectThreshold(input: TestInput): ThresholdResult {
  if (input.termination === 'red-flag') {
    return {
      hrtFound: false, hrt: null, thresholdStage: null, interpretation: 'red-flag',
      message: 'You stopped for a warning symptom. Do not continue — contact your treating clinician or seek medical review before any further exertion.',
    }
  }
  if (!input.stages.length) {
    return { hrtFound: false, hrt: null, thresholdStage: null, interpretation: 'invalid', message: 'Not enough test data was recorded.' }
  }

  const provoked = input.stages.find(
    (s) => s.symptomScore - input.restingSymptomScore >= PROVOCATION_RISE,
  )

  if (provoked) {
    return {
      hrtFound: true,
      hrt: provoked.heartRate,
      thresholdStage: provoked.minute,
      interpretation: 'physiologic',
      message: `Your symptom threshold was reached at ${provoked.heartRate} bpm (minute ${provoked.minute}). This is your heart-rate threshold (HRt) — the anchor for your training band.`,
    }
  }

  // No >=3-point rise. If they reached exhaustion, there is no symptom ceiling.
  return {
    hrtFound: false, hrt: null, thresholdStage: null, interpretation: 'no-intolerance',
    message: 'You reached your exercise limit without provoking your symptoms. That suggests your symptoms are unlikely to be driven by exercise intolerance — share this with your clinician, who may direct a different pathway (cervical, vestibular, mood).',
  }
}

export interface Prescription {
  hrt: number
  lowerBpm: number      // 80% (concussion) of HRt
  upperBpm: number      // 90% (concussion) of HRt — the do-not-exceed ceiling
  sessionMinutes: number
  daysPerWeek: number
  stopRisePoints: number
  summary: string
}

/** Convert an HRt into the sub-symptom-threshold training prescription. */
export function computePrescription(hrt: number, condition: Condition = 'concussion'): Prescription {
  const d = CONDITION_DEFAULTS[condition]
  const lowerBpm = Math.round(hrt * d.lowerPct)
  const upperBpm = Math.round(hrt * d.upperPct)
  return {
    hrt,
    lowerBpm,
    upperBpm,
    sessionMinutes: d.sessionMinutes,
    daysPerWeek: d.daysPerWeek,
    stopRisePoints: SESSION_STOP_RISE,
    summary: `Train at ${lowerBpm}-${upperBpm} bpm (${Math.round(d.lowerPct * 100)}-${Math.round(d.upperPct * 100)}% of your ${hrt} bpm threshold). Aim for ${d.sessionMinutes} minutes, ${d.daysPerWeek} days a week. Keep your heart rate under ${upperBpm} bpm. Stop the session if your symptoms rise ${SESSION_STOP_RISE} or more points above how you felt before you started.`,
  }
}

export interface SessionLog {
  date: string
  avgHeartRate: number
  peakHeartRate: number
  preSymptom: number      // 0-10 before
  peakSymptom: number     // 0-10 worst during
  nextDayFlare?: boolean  // reported worse the next day
  completedMinutes: number
}

export type ProgressionDecision = 'advance' | 'hold' | 'regress' | 'refer'

export interface ProgressionResult {
  decision: ProgressionDecision
  newCeilingBpm?: number
  message: string
}

/**
 * Decide whether to advance the ceiling, hold, regress or refer, from recent
 * sessions. Evidence-aligned: advance only after a clean run (no within-session
 * provocation AND no next-day flare); regress/refer on repeated provocation.
 */
export function progressionDecision(
  rx: Prescription,
  recent: SessionLog[],
  opts: { cleanSessionsToAdvance?: number; stepBpm?: number } = {},
): ProgressionResult {
  const cleanNeeded = opts.cleanSessionsToAdvance ?? 3
  const step = opts.stepBpm ?? 5
  if (!recent.length) return { decision: 'hold', message: 'Log a few sessions first.' }

  const flares = recent.filter((s) => s.nextDayFlare || s.peakSymptom - s.preSymptom >= SESSION_STOP_RISE)
  if (flares.length >= 2) {
    return { decision: 'regress', newCeilingBpm: rx.upperBpm - step, message: 'Symptoms are being provoked repeatedly — ease the ceiling back and rebuild. If it keeps happening, re-test or check in with your clinician.' }
  }

  const lastClean = recent.slice(-cleanNeeded)
  const allClean = lastClean.length >= cleanNeeded && lastClean.every(
    (s) => !s.nextDayFlare && s.peakSymptom - s.preSymptom < SESSION_STOP_RISE && s.completedMinutes >= rx.sessionMinutes * 0.8,
  )
  if (allClean) {
    return { decision: 'advance', newCeilingBpm: rx.upperBpm + step, message: `${cleanNeeded} clean sessions with no flare — you can step your ceiling up by ${step} bpm to keep the stimulus effective. (Or re-test your threshold for a precise update.)` }
  }
  return { decision: 'hold', message: 'Staying the course — keep training in your current band until you have a clean run.' }
}
