/**
 * Sub-Symptom-Threshold Trainer — clinical protocol engine.
 *
 * The evidence-based brain of the wearable/app product. Pure functions, no I/O,
 * so it powers the web MVP, the clinician dashboard, and (later) the native
 * Apple Watch / Garmin apps identically.
 *
 * EVIDENCE BASE (referenced inline; full citations in the EP course + brief):
 *  - Buffalo Concussion Treadmill Test (BCTT) — modified Balke protocol:
 *    start 3.2 mph (up to 5'10") or 3.6 mph (5'10" and above), 0deg incline for
 *    minute 1, then +1deg incline EVERY MINUTE for 15 stages; after 15deg,
 *    +0.4 mph/min in lieu of incline.
 *    HR, RPE and symptom severity (0-10 VAS) recorded EVERY MINUTE (each stage).
 *    Symptom threshold = a rise of >=3 points above resting VAS -> HR at that
 *    minute = HRt. Voluntary exhaustion = RPE > 17 without symptom provocation.
 *    (Leddy & Willer 2013; Leddy et al. 2018/2019; BCTT instruction manual,
 *    J Sport Med suppl.) -> this is why the app prompts PER MINUTE, not per 10bpm.
 *  - Sub-symptom-threshold aerobic exercise (SSTAE): train at 80-90% of HRt,
 *    ~20 min, most days; within-session stop if symptoms rise MORE than 2 points; re-test
 *    and advance the ceiling as tolerance recovers (Leddy 2019 JAMA Peds;
 *    Bezherano et al. "Practical Management: Prescribing SSTAE" 2021, CJSM).
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

/**
 * The canonical Condition allowlist — the ONE list every boundary validates
 * against. `Condition` is a compile-time type only; every value that reaches
 * this engine arrives over the wire (the patient app POSTs `condition` to
 * /api/sst/session) or back out of the `sst_clinic_sessions.condition` column,
 * so a `as Condition` cast is a lie TypeScript cannot catch.
 */
export const CONDITIONS = [
  'concussion',
  'mtbi',
  'tbi',
  'neuro-other',
  'cancer',
  'long-covid',
  'cardiac',
] as const satisfies readonly Condition[]

/**
 * Normalise an untrusted value to a Condition, falling back to the product
 * default ('concussion') for anything unrecognised — the same default both
 * call sites already expressed as `|| 'concussion'` for the null case.
 *
 * WHY THIS EXISTS (2026-08-06 server-surface audit): `condition` was stored
 * from the request body with only a 40-char slice, then cast `as Condition`
 * and indexed straight into CONDITION_DEFAULTS. Two live failure modes:
 *  - an unrecognised string ('Concussion', 'post-concussion', '') → the
 *    lookup is `undefined` and reading `.lowerPct` THROWS, 500-ing the GP /
 *    ACC884 report for that patient;
 *  - a PROTOTYPE key ('toString', 'constructor', 'valueOf') → the lookup
 *    resolves to a Function.prototype member, does NOT throw, and silently
 *    yields `lowerBpm: NaN, upperBpm: NaN, sessionMinutes: undefined` — a
 *    clinical training band of "NaN-NaN bpm" on a printed prescription, and
 *    NaN written into the integer band columns.
 * Use `Object.hasOwn` so the prototype chain can never satisfy the lookup.
 */
export function asCondition(raw: unknown): Condition {
  return typeof raw === 'string' && (CONDITIONS as readonly string[]).includes(raw)
    ? (raw as Condition)
    : 'concussion'
}

/** How the graded test is being performed — stored on the result for the clinician. */
export type TestModality = 'treadmill' | 'bike' | 'walk' | 'other'

/** A single minute/stage of the guided graded (threshold-finding) test. */
export interface TestStage {
  minute: number          // 1-based stage index
  heartRate: number       // bpm at the end of the stage
  rpe?: number            // Borg 6-20 (optional)
  symptomScore: number    // 0-10 overall symptom severity at the stage
  /** symptoms the user tapped this stage (from their preselected list) */
  symptomsReported?: string[]
  /** true iff at log time the live feed was fresh AND the logged value equalled it */
  hrVerified?: boolean
}

export type TestTermination = 'symptom-limited' | 'exhaustion-limited' | 'red-flag'

export interface TestInput {
  restingSymptomScore: number   // 0-10, captured before the ramp
  stages: TestStage[]
  termination: TestTermination
  condition?: Condition
  /** treadmill / bike / brisk walking — chosen on the pre-test setup screen */
  modality?: TestModality
  /**
   * Measured resting heart rate (bpm), when a surface has one (camera
   * spot-check, watch). Optional — the web ramp doesn't capture it yet — but
   * when present it arms the stronger arm of the validity gate in
   * detectThreshold (HRt must clear resting by MIN_HRT_ABOVE_RESTING and the
   * band floor must sit above resting).
   */
  restingHr?: number | null
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
/**
 * Within-session symptom tolerance during training: the MAXIMUM ACCEPTABLE
 * rise. The consensus wording is that no MORE than mild exacerbation is
 * acceptable — an increase of up to 2 points on 0–10 is explicitly tolerated
 * (Patricios et al., Amsterdam consensus statement, Br J Sports Med
 * 2023;57:695–711). The stop rule is therefore a rise EXCEEDING this value
 * (>2, i.e. ≥3 on an integer scale) — comparisons use `>`, never `>=`.
 * (Until 2026-08-11 the app stopped at exactly ≥2 — stricter than the
 * consensus, truncating sessions at the rise the guideline deems acceptable.)
 *
 * NOTE: the pre-registered NEXT-DAY flare definition (research.ts
 * FLARE_MIN_RISE, ≥2 at the 12–36h check-in) is a DIFFERENT variable and
 * deliberately keeps its locked ≥2 definition — see research.ts.
 */
export const SESSION_STOP_RISE = 2
/**
 * PHYSIOLOGICAL VALIDITY GATE (owner, 2026-08-11): an HRt is a submaximal
 * EXERTION heart rate. When resting HR is known, the threshold must clear it
 * by this margin or the test is not readable (the ΔHR construct — HRt minus
 * resting — is established: Haider 2019 treats ΔHR ≤50 bpm as prognostic of
 * prolonged recovery; a ΔHR at or near zero is not a measurement at all, it
 * is artefact). 15 bpm is the owner-set floor under any plausible ΔHR.
 */
export const MIN_HRT_ABOVE_RESTING = 15
/**
 * Voluntary-exhaustion RPE (Borg 6-20) without symptom provocation. The BCTT
 * manual phrases the criterion as RPE > 17; the applied rule everywhere in this
 * codebase (engine, guided test, public calculator) is RPE >= 17, i.e. the test
 * is treated as having reached voluntary exhaustion one point earlier than the
 * manual's wording — the conservative direction for a TERMINATION rule.
 */
export const EXHAUSTION_RPE = 17
/** Top of the Borg 6-20 scale — anything above it is not a rating. */
export const BORG_MAX = 20
/** Resting symptoms at or above this on the readiness screen → today is not a test day. */
export const MAX_RESTING_TO_TEST = 8
/** A stage-to-stage HR jump above this (bpm) needs an explicit confirm — never mint HRt from a typo. */
export const HR_JUMP_CONFIRM = 40
/** Minimum spacing between graded tests (hours), except after a regress / clinician instruction. */
export const RETEST_MIN_HOURS = 48
/** A session is verified only when at least this share of readings were live-feed-verified. */
export const VERIFIED_READING_MIN_PCT = 80
/**
 * Length of the graded ramp, in 60-second stages. The modified Balke BCTT is
 * +1deg incline per minute for 15 stages then +0.4 mph/min; 20 minutes is the
 * point at which every surface ends the test. Reaching it without provocation
 * means the patient completed the WHOLE protocol symptom-free — the second way
 * (besides a recorded RPE >= EXHAUSTION_RPE) that a test can honestly report no
 * exercise intolerance. Single source of truth for the web GuidedTest
 * (MAX_STAGES) and the watch (SSTProtocol.protocolStageCap); the two surfaces
 * must never cap at different numbers.
 */
export const PROTOCOL_STAGE_CAP = 20

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
  // Defence in depth: the clients stamp `termination: 'aborted'` on a walk-out
  // (app/platform/app/page.tsx onAbort). It is outside TestTermination, so it
  // only ever arrives via the wire — and an abandoned test can never be read,
  // regardless of how many stages it happens to carry.
  if ((input.termination as string) === 'aborted') {
    return {
      hrtFound: false, hrt: null, thresholdStage: null, interpretation: 'invalid',
      message: 'This test was ended before it finished, so there is no result to read from it.',
    }
  }

  const provoked = input.stages.find(
    (s) => s.symptomScore - input.restingSymptomScore >= PROVOCATION_RISE,
  )

  if (provoked) {
    // ── PHYSIOLOGICAL VALIDITY GATE (owner, 2026-08-11) ──────────────────────
    // A demo run produced HRt 65 bpm beside a live resting HR of 76 — a
    // threshold BELOW rest, prescribing a band the patient exceeded by sitting
    // still. The engine accepted a garbage reading (sensor artefact or
    // mis-entry) and prescribed from it. An HRt is a submaximal EXERTION heart
    // rate; the checks below fail closed to 'invalid' — re-test, never
    // prescribe:
    //  - vs the ramp itself (always available): threshold-stage HR strictly
    //    below the FIRST stage's HR means heart rate fell while effort ramped.
    //  - vs resting HR (when a surface supplied one): HRt must clear resting
    //    by MIN_HRT_ABOVE_RESTING (ΔHR construct — Haider 2019 uses HRt−resting;
    //    ΔHR near zero is artefact, not a result), and the prescribed band's
    //    FLOOR must sit above resting — a floor below rest is untrainable.
    const firstStageHr = input.stages[0]?.heartRate
    const resting =
      typeof input.restingHr === 'number' && Number.isFinite(input.restingHr) && input.restingHr >= 30
        ? input.restingHr
        : null
    const bandFloor = Math.round(provoked.heartRate * CONDITION_DEFAULTS[asCondition(input.condition)].lowerPct)
    const belowStart = typeof firstStageHr === 'number' && provoked.heartRate < firstStageHr
    const belowResting =
      resting !== null && (provoked.heartRate < resting + MIN_HRT_ABOVE_RESTING || bandFloor <= resting)
    if (belowStart || belowResting) {
      return {
        hrtFound: false, hrt: null, thresholdStage: null, interpretation: 'invalid',
        message: `Your symptoms rose, but the heart rate recorded at that moment (${provoked.heartRate} bpm) was ${belowStart ? `below your first minute's ${firstStageHr} bpm` : `too close to your resting ${resting} bpm`} — a threshold at or below resting heart rate isn't a readable result. This usually means a dropped sensor reading or a typing slip. Re-test with a reliable heart-rate source; your symptom response still counts, so tell your clinician it happened.`,
      }
    }
    return {
      hrtFound: true,
      hrt: provoked.heartRate,
      thresholdStage: provoked.minute,
      interpretation: 'physiologic',
      message: `Your symptom threshold was reached at ${provoked.heartRate} bpm (minute ${provoked.minute}). This is your heart-rate threshold (HRt) — the anchor for your training band.`,
    }
  }

  // No >=3-point rise. 'no-intolerance' is the CLEARANCE-GRADE read — it drives
  // clearanceReady, the hub's clearance banner and the GP report's "tolerance
  // recovered" recommendation — so it may only be returned when the test
  // actually reached the OTHER validated BCTT endpoint: voluntary exhaustion
  // (RPE >= EXHAUSTION_RPE). A test that stopped before EITHER endpoint proves
  // nothing: a walk-out at minute 2 has no >=3-point rise either, and must
  // never read as "your symptoms are not exercise-driven". Fail closed to
  // 'invalid' — the same bucket an aborted test lands in.
  // There are exactly TWO ways to evidence that, and an absent Borg score is
  // neither. (An earlier version of this gate grandfathered stage sets with no
  // RPE at all; that was a live hole, not a legacy allowance — the watch writes
  // rpe: nil on every stage and only attaches the terminal Borg on its
  // exhaustion-stop path, so its stage-cap finish arrived RPE-less and was
  // waved through as clearance-grade.)
  // The exhaustion arm reads the TERMINAL stage only, and only inside the Borg
  // scale (6-20). Both shipping surfaces write it that way — the watch sets
  // stages[last].rpe on its exhaustion-stop sheet, the web carries the current
  // RPE onto the stage it finishes with — so a mid-test 17 followed by easier
  // stages is not an exhaustion endpoint, and an out-of-scale number (rpe: 999)
  // is not a Borg rating at all.
  const terminalRpe = input.stages[input.stages.length - 1]?.rpe
  const reachedExhaustion =
    typeof terminalRpe === 'number' &&
    Number.isFinite(terminalRpe) &&
    terminalRpe >= EXHAUSTION_RPE &&
    terminalRpe <= BORG_MAX
  // Count DISTINCT stages, not array length: a replayed/duplicated row set
  // (twenty copies of minute 1) is not a completed 20-minute ramp, and the
  // completed-protocol arm is the one endpoint that needs no Borg rating.
  const completedProtocol =
    new Set(input.stages.map((s) => s.minute).filter((m) => Number.isFinite(m))).size >= PROTOCOL_STAGE_CAP
  if (!reachedExhaustion && !completedProtocol) {
    return {
      hrtFound: false, hrt: null, thresholdStage: null, interpretation: 'invalid',
      message: `The test ended before either stopping point was reached — your symptoms did not rise ${PROVOCATION_RISE} points, and you did not record reaching your limit. There is no threshold to read from it. Repeat the test another day and take the effort up until you genuinely cannot go harder.`,
    }
  }

  // Exhaustion reached with no provocation → there is no symptom ceiling.
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
  /**
   * HRt below the validated prolonged-recovery cutoff. Haider MN et al.,
   * "The Predictive Capacity of the BCTT," Front Neurol 2019 (PMC6492460):
   * absolute HRt < 135 bpm — and ΔHR (threshold − resting) ≤ 50 bpm (73% sens /
   * 78% spec) — are associated with prolonged (>30-day) recovery. This is a
   * PROGNOSTIC flag, NOT a dose modifier: the evidence provides no validated
   * severity-adjusted starting dose, so we surface the risk rather than inventing
   * a shorter prescription.
   */
  prolongedRecoveryRisk: boolean
  summary: string
  /** clinician-facing note when prolongedRecoveryRisk is set (else null) */
  clinicianNote: string | null
}

/**
 * Convert an HRt into the sub-symptom-threshold training prescription.
 *
 * DOSE IS EVIDENCE-FIXED, individualised ONLY by the %-of-HRt band:
 *  - intensity 80–90% of the HR at symptom exacerbation (Leddy et al., JAMA
 *    Pediatrics 2019 used 80%; Haider/Leddy, Sports Health 2021 give the 80–90%
 *    band). A low HRt already yields a gentle absolute band — that IS the
 *    individualisation.
 *  - ~20 min/day, most days (5–7/wk) — FIXED from day one in the RCTs; those
 *    protocols progressed by HEART RATE (+5–10 bpm/day if tolerated), NOT by
 *    lengthening sessions (Haider/Leddy, Sports Health 2021).
 *  - within-session stop when the symptom rise EXCEEDS 2 points on 0–10: up to
 *    a 2-point ("mild") exacerbation is explicitly acceptable (Patricios et al.,
 *    Amsterdam consensus, BJSM 2023;57:695–711; Leddy trials tolerated mild
 *    exacerbation during sub-threshold work).
 *
 * There is NO published rule that shortens the starting dose by severity of
 * exercise intolerance, so we do not invent one. Instead we compute the
 * validated prognostic flag (Haider 2019) and hand dose judgement for those
 * patients to the clinician.
 */
export function computePrescription(
  hrt: number,
  condition: Condition = 'concussion',
  opts: { restingHr?: number | null } = {},
): Prescription {
  // FAIL SAFE, never NaN: `condition` reaches here from the wire and from the
  // DB column, so it is normalised through the allowlist rather than trusted.
  // An own-property lookup keeps 'toString'/'constructor' off the prototype
  // chain (see asCondition) — the difference between a real band and a printed
  // "NaN-NaN bpm" prescription.
  const resolved = asCondition(condition)
  const d = CONDITION_DEFAULTS[resolved]
  const lowerBpm = Math.round(hrt * d.lowerPct)
  const upperBpm = Math.round(hrt * d.upperPct)

  const deltaHr = typeof opts.restingHr === 'number' && Number.isFinite(opts.restingHr) ? hrt - opts.restingHr : null
  const prolongedRecoveryRisk = hrt < 135 || (deltaHr !== null && deltaHr <= 50)
  const clinicianNote = prolongedRecoveryRisk
    ? `Threshold ${hrt} bpm${deltaHr !== null ? ` (ΔHR ${deltaHr} bpm)` : ''} is below the validated prolonged-recovery cutoff (HRt <135 bpm${deltaHr !== null ? ' / ΔHR ≤50 bpm' : ''}; Haider 2019). This predicts a slower recovery — oversee dosing directly, keep the band conservative, and re-assess more frequently. The evidence gives no severity-adjusted dose, so a shorter starting session is a clinical judgement, not an app default.`
    : null

  return {
    hrt,
    lowerBpm,
    upperBpm,
    sessionMinutes: d.sessionMinutes,
    daysPerWeek: d.daysPerWeek,
    stopRisePoints: SESSION_STOP_RISE,
    prolongedRecoveryRisk,
    clinicianNote,
    summary: `Train at ${lowerBpm}-${upperBpm} bpm (${Math.round(d.lowerPct * 100)}-${Math.round(d.upperPct * 100)}% of your ${hrt} bpm threshold). Aim for ${d.sessionMinutes} minutes, ${d.daysPerWeek} days a week. Don't let your heart rate go above ${upperBpm} bpm. Stop the session if your symptoms rise more than ${SESSION_STOP_RISE} points above how you felt before you started — a small rise of up to ${SESSION_STOP_RISE} points is okay.`,
  }
}

export interface SessionLog {
  /**
   * Stable id for the session ATTEMPT (client-minted). Also stamped on the
   * abandoned-session record the app syncs when the tab is killed mid-session,
   * so the clinician read side can collapse "interrupted then finished" into
   * the completed session instead of showing a phantom abandonment.
   */
  sessionUid?: string
  date: string
  /**
   * Session-average / peak HR, or NULL when the session recorded no heart-rate
   * reading at all (manual tier with nothing typed, or a sensor that never
   * streamed). It used to be coerced to 0 at the save, which is not a heart
   * rate — 0 then printed verbatim as "avg 0 / peak 0 bpm" on the patient's
   * progress list, the clinician's hub row and, worst, the MEDICOLEGAL record,
   * i.e. a measurement asserted for a session that measured nothing. Anything
   * below the app's own physiologic floor (30 bpm, the same bound the entry
   * fields enforce) is treated as "not recorded" on read (2026-08-06).
   */
  avgHeartRate: number | null
  peakHeartRate: number | null
  preSymptom: number      // 0-10 before
  peakSymptom: number     // 0-10 worst during
  nextDayFlare?: boolean  // reported worse the next day (set by the next-day check-in)
  completedMinutes: number
  /**
   * true = strap/watch-fed session whose readings were live-verified (>=80%).
   * Sessions logged by this app ALWAYS carry an explicit true/false; only an
   * explicit `false` is excluded from advance evidence (legacy logs without the
   * field predate verification and are grandfathered).
   */
  hrVerified?: boolean
  /** share (0-100) of readings that were live-feed-verified at log time */
  verifiedReadingPct?: number
  /** the session ended on the more-than-2-point symptom-rise stop rule */
  symptomLimited?: boolean
  /** the patient used their one "I feel okay, continue" override */
  overrodeStop?: boolean
  /** immediate post-session self-report ("Compared to before the session…") */
  endFeel?: 'same' | 'better' | 'worse'
  /** next-day check-in answer (worse also sets nextDayFlare) */
  nextDayCheckin?: 'same' | 'better' | 'worse'
  /** time-in-zone seconds (Garmin/Polar-style summary) */
  secondsBelow?: number
  secondsIn?: number
  secondsAbove?: number
}

// ── heart-rate reading verification ──────────────────────────────────────────

/**
 * A single reading is verified iff, at the moment it was logged, the live feed
 * was FRESH and the logged value equals the feed value. A typed number, a stale
 * feed, or a mismatch can never produce a verified reading.
 */
export function isVerifiedReading(
  entered: number | null,
  liveBpm: number | null,
  feedFresh: boolean,
): boolean {
  return feedFresh && entered != null && liveBpm != null && entered === liveBpm
}

export interface SessionVerification {
  hrVerified: boolean
  /** 0-100 integer */
  verifiedReadingPct: number
}

/**
 * Session-level verification: >=80% of readings verified AND the source is a
 * Bluetooth heart-rate stream (watch broadcast or strap). Camera PPG is a
 * resting spot-check only and manual entry is by definition unverified — neither
 * can ever mark a session verified.
 */
export function sessionVerification(
  readings: Array<{ verified: boolean }>,
  source: 'bluetooth' | 'camera' | 'manual' | string,
): SessionVerification {
  const pct = readings.length
    ? Math.round((readings.filter((r) => r.verified).length / readings.length) * 100)
    : 0
  return {
    verifiedReadingPct: pct,
    hrVerified: source === 'bluetooth' && readings.length > 0 && pct >= VERIFIED_READING_MIN_PCT,
  }
}

// ── re-test spacing ──────────────────────────────────────────────────────────

export interface RetestGate {
  allowed: boolean
  reason: string | null
}

/**
 * Serial re-tests are spaced: never twice in one day, and at least 48 hours
 * apart — EXCEPT after a regress (the band just moved down; a fresh threshold is
 * clinically useful) or on clinician instruction. A red-flag lock blocks
 * everything until the patient confirms clinical clearance.
 *
 * `clinicianDirected` is the ONLY thing that lifts the one-per-day rule, and it
 * is not a patient-facing convenience: the caller may set it only from an
 * explicit, recorded clinician-directed action (in the app today, after a
 * red-flag clearance — the whole point of the review is that the clinician may
 * want a fresh threshold that day). It NEVER applies to the patient-initiated
 * path, and it can never re-open a live red-flag lock (checked first, above).
 */
export function canRetest(
  nowMs: number,
  lastTestAt: number | null,
  opts: { afterRegress?: boolean; clinicianDirected?: boolean; redFlagLocked?: boolean } = {},
): RetestGate {
  if (opts.redFlagLocked) {
    return {
      allowed: false,
      reason: 'Testing is paused until a clinician has reviewed you and cleared you to resume.',
    }
  }
  if (lastTestAt == null) return { allowed: true, reason: null }
  // Max one test per calendar day for the patient-initiated path.
  if (
    new Date(nowMs).toDateString() === new Date(lastTestAt).toDateString() &&
    !opts.clinicianDirected
  ) {
    return {
      allowed: false,
      reason: 'You have already tested today. One test a day is the limit — try again tomorrow.',
    }
  }
  const hoursSince = (nowMs - lastTestAt) / 3_600_000
  if (hoursSince < RETEST_MIN_HOURS && !opts.afterRegress && !opts.clinicianDirected) {
    return {
      allowed: false,
      reason: `Your last test was under ${RETEST_MIN_HOURS} hours ago. Give it a couple of days between tests — your band is still current.`,
    }
  }
  return { allowed: true, reason: null }
}

export type ProgressionDecision = 'advance' | 'hold' | 'regress' | 'refer' | 'retest' | 'rest'

export interface ProgressionResult {
  decision: ProgressionDecision
  newCeilingBpm?: number
  message: string
}

/**
 * Decide whether to advance the ceiling, hold, regress, refer or re-test, from
 * recent sessions. Evidence-aligned AND fail-closed:
 *
 *  - ADVANCE evidence = VERIFIED sessions only (live Bluetooth HR — watch
 *    broadcast or strap). A session that is explicitly unverified (manual /
 *    camera / low verified-reading share) can NEVER count toward the clean run.
 *  - REGRESS is never gated: flare/safety evidence counts from EVERY session,
 *    verified or not.
 *  - CEILING CAP: a suggested advance never exceeds the measured HRt. At the
 *    cap the decision becomes 'retest' — the app prompts a re-test instead of
 *    ratcheting past the measurement.
 */
export function progressionDecision(
  rx: Prescription,
  recent: SessionLog[],
  opts: { cleanSessionsToAdvance?: number; stepBpm?: number } = {},
): ProgressionResult {
  const cleanNeeded = opts.cleanSessionsToAdvance ?? 3
  const step = opts.stepBpm ?? 5
  if (!recent.length) return { decision: 'hold', message: 'Log a few sessions first.' }

  // In-session semantics track the stop rule: a rise EXCEEDING the tolerated
  // 2 points (Amsterdam 2023). A ≤2-pt rise is the acceptable mild
  // exacerbation and must not count as provocation, or the engine regresses
  // patients for sessions the guideline calls well-tolerated.
  const isFlare = (s: SessionLog) =>
    s.nextDayFlare || s.peakSymptom - s.preSymptom > SESSION_STOP_RISE

  // Regress only on RECENT repeated provocation — window to the last few
  // sessions so old, long-since-resolved flares can't ratchet the ceiling down
  // forever (a recovered patient with clean recent runs must not keep regressing).
  // Safety data always counts: this window includes manual/unverified sessions.
  // REST TRIGGER (owner clinical rail 2026-07-06; fills the evidence gap on
  // repeated day-over-day provocation — the RCTs cover the expected mild
  // within-session bump but not multi-session flaring). TWO flare sessions IN A
  // ROW → prescribe a rest day, ease the ceiling back, and push a clinician
  // check-in. A single isolated flare still just holds/reduces and continues
  // (that IS the evidence-based response — reduce, don't rest; Haider/Leddy 2021).
  const lastTwo = recent.slice(-2)
  if (lastTwo.length === 2 && lastTwo.every(isFlare)) {
    return {
      decision: 'rest',
      newCeilingBpm: Math.max(rx.lowerBpm, rx.upperBpm - step),
      message:
        'Two sessions in a row provoked your symptoms. Take a rest day today, ease the ceiling back, and check in with your clinician before your next session — then resume gently. Repeated flaring means the current dose is too much, not that you should push through it.',
    }
  }

  // Regress only on RECENT repeated provocation (not necessarily consecutive) —
  // window to the last few sessions so old, long-since-resolved flares can't
  // ratchet the ceiling down forever.
  const flareWindow = recent.slice(-Math.max(cleanNeeded, 3))
  const flares = flareWindow.filter(isFlare)
  if (flares.length >= 2) {
    // FLOOR THE REGRESS. This was `rx.upperBpm - step` with no lower bound, so
    // repeated regressions walked the band down without limit — and applyCeiling
    // shifts BOTH bounds by the same delta, so the lower bound descended with it.
    // The rest rail can't save it: rest needs two CONSECUTIVE flares, while
    // regress fires on two flares in the last three sessions, so a
    // flare/clean/flare pattern regresses repeatedly without ever resting.
    // From a 150 bpm HRt that reaches sub-resting heart rates in ~15 cycles.
    //
    // Floored at half the measured HRt — the same bound the watch app uses
    // (sst-watch/Sources/SSTProtocol.swift), so the two surfaces can't give the
    // same patient different bands. Below that the dose is no longer a
    // meaningful stimulus and the answer is a re-test, not a lower ceiling.
    const floor = Math.round(rx.hrt / 2)
    return {
      decision: 'regress',
      newCeilingBpm: Math.max(floor, rx.upperBpm - step),
      message: 'Symptoms are being provoked repeatedly — ease the ceiling back and rebuild. If it keeps happening, re-test or check in with your clinician.',
    }
  }
  // A single recent flare (any source) blocks an advance — hold and rebuild.
  if (flares.length > 0) {
    return { decision: 'hold', message: 'A recent session provoked symptoms — hold your band until you have a clean run.' }
  }

  // Advance evidence: verified sessions only. `hrVerified === false` (manual /
  // camera / stale-feed sessions) never counts; the app stamps every session
  // explicitly, so only pre-verification legacy logs lack the field.
  const verified = recent.filter((s) => s.hrVerified !== false)
  const lastClean = verified.slice(-cleanNeeded)
  const allClean = lastClean.length >= cleanNeeded && lastClean.every(
    (s) => !isFlare(s) && s.completedMinutes >= rx.sessionMinutes * 0.8,
  )
  if (allClean) {
    // Ceiling cap: upperBpm may never exceed the measured HRt.
    if (rx.upperBpm >= rx.hrt) {
      return { decision: 'retest', message: 'You have reached your measured threshold — time to re-test. A fresh test is the only safe way to raise your band further.' }
    }
    const newCeilingBpm = Math.min(rx.upperBpm + step, rx.hrt)
    return { decision: 'advance', newCeilingBpm, message: `${cleanNeeded} clean tracked sessions with no flare — you can step your ceiling up to ${newCeilingBpm} bpm to keep the stimulus effective. (Or re-test your threshold for a precise update.)` }
  }
  return { decision: 'hold', message: 'Staying the course — keep training in your current band until you have a clean run of tracked sessions.' }
}
