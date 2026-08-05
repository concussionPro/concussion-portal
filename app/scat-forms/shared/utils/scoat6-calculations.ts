// Auto-calculation functions for SCOAT6 form

import { SCOAT6FormData } from '../types/scoat6.types'

/**
 * ============================================================================
 * "WAS THIS SECTION ADMINISTERED?"
 * ============================================================================
 * Numbers that default to 0 make "never tested" and "scored zero" identical in
 * the data, and for several SCOAT6 subtests a 0 is a strong clinical assertion
 * (0 mBESS errors = perfect balance; 0/30 immediate memory = profound amnesia;
 * 0 symptom severity = asymptomatic). Scored fields are therefore `number |
 * null` and every consumer — the on-screen totals AND the exported PDF — asks
 * these predicates first. Not administered => print blank / "—", never a
 * number. Setup-only selections (word list, digit list, foot tested) are NOT
 * evidence of administration: the clinician can pick a list and be interrupted.
 */

export type Scoat6SymptomColumnKey =
  | 'preInjury' | 'dayInjured' | 'consult1' | 'consult2' | 'consult3'

/**
 * A symptom column counts as administered if any symptom in it is rated above
 * zero, or (for the dated columns) the clinician dated that assessment. An
 * all-zero undated Pre-injury column stays "not administered" — failing closed
 * beats printing "0 symptoms, severity 0" for a column nobody filled in.
 */
export function isSymptomColumnAdministered(
  formData: SCOAT6FormData,
  column: Scoat6SymptomColumnKey
): boolean {
  const anyRated = Object.values(formData.symptoms).some(
    s => typeof s === 'object' && 'preInjury' in s && s[column] > 0
  )
  if (anyRated) return true
  if (column === 'preInjury') return false
  return formData.symptomDates[column].trim() !== ''
}

/** Word-list selection is setup, not a score — only trials/completion time count. */
export function isImmediateMemoryAdministered(formData: SCOAT6FormData): boolean {
  return (
    formData.immediateMemoryTimeCompleted.trim() !== '' ||
    formData.immediateMemoryTrial1.some(Boolean) ||
    formData.immediateMemoryTrial2.some(Boolean) ||
    formData.immediateMemoryTrial3.some(Boolean)
  )
}

export function isDigitsAdministered(formData: SCOAT6FormData): boolean {
  return formData.digitsBackward !== null
}

/** Both halves are needed: the point turns on time AND error count. */
export function isMonthsAdministered(formData: SCOAT6FormData): boolean {
  return formData.monthsReverseTime.trim() !== '' && formData.monthsReverseErrors !== null
}

export function isDelayedRecallAdministered(formData: SCOAT6FormData): boolean {
  return (
    formData.delayedRecallStartTime.trim() !== '' ||
    formData.delayedRecallMinutesSinceImmediate.trim() !== '' ||
    formData.delayedRecall.some(Boolean)
  )
}

/** All three stances must be recorded before a /30 total can be asserted. */
export function isBalanceAdministered(formData: SCOAT6FormData): boolean {
  return (
    formData.mBessDoubleErrors !== null &&
    formData.mBessTandemErrors !== null &&
    formData.mBessSingleErrors !== null
  )
}

export function isComplexTandemAdministered(formData: SCOAT6FormData): boolean {
  return (
    formData.complexTandemForwardEyesOpen !== null &&
    formData.complexTandemForwardEyesClosed !== null &&
    formData.complexTandemBackwardEyesOpen !== null &&
    formData.complexTandemBackwardEyesClosed !== null
  )
}

export function isDualTaskAdministered(formData: SCOAT6FormData): boolean {
  return formData.dualTaskTrialsAttempted !== null || formData.dualTaskTrialsCorrect !== null
}

export function isMvomsBaselineAdministered(formData: SCOAT6FormData): boolean {
  const b = formData.mvomsBaseline
  return [b.headache, b.dizziness, b.nausea, b.fogginess].some(v => v !== null)
}

/** A row is administered only if it is not flagged Not Tested and was rated. */
export function isMvomsRowAdministered(row: SCOAT6FormData['mvomsVMS']): boolean {
  if (row.notTested) return false
  return [row.headache, row.dizziness, row.nausea, row.fogginess].some(v => v !== null)
}

/** Every item must be answered before a /21 can be reported against the bands. */
export function isGAD7Administered(formData: SCOAT6FormData): boolean {
  if (formData.gad7NotDone) return false
  return [
    formData.gad7_1, formData.gad7_2, formData.gad7_3, formData.gad7_4,
    formData.gad7_5, formData.gad7_6, formData.gad7_7,
  ].every(v => v !== null)
}

export function isPHQ2Administered(formData: SCOAT6FormData): boolean {
  if (formData.phq2NotDone) return false
  return formData.phq2_1 !== null && formData.phq2_2 !== null
}

export function isSleepAdministered(formData: SCOAT6FormData): boolean {
  if (formData.sleepNotDone) return false
  return [
    formData.sleep1, formData.sleep2, formData.sleep3,
    formData.sleep4, formData.sleep5,
  ].every(v => v !== null)
}

/**
 * Calculate symptom number for a specific date column
 */
export function calculateSymptomNumber(
  symptoms: SCOAT6FormData['symptoms'],
  column: 'preInjury' | 'dayInjured' | 'consult1' | 'consult2' | 'consult3'
): number {
  return Object.values(symptoms)
    .map(s => typeof s === 'object' && 'preInjury' in s ? s[column] : 0)
    .filter(value => value > 0).length
}

/**
 * Calculate symptom severity for a specific date column
 */
export function calculateSymptomSeverity(
  symptoms: SCOAT6FormData['symptoms'],
  column: 'preInjury' | 'dayInjured' | 'consult1' | 'consult2' | 'consult3'
): number {
  return Object.values(symptoms)
    .map(s => typeof s === 'object' && 'preInjury' in s ? s[column] : 0)
    .reduce((sum, value) => sum + value, 0)
}

/**
 * Calculate Immediate Memory score (sum of all 3 trials)
 * Max: 30 (3 trials × 10 words)
 */
export function calculateImmediateMemory(formData: SCOAT6FormData): number {
  const trial1Score = formData.immediateMemoryTrial1.filter(Boolean).length
  const trial2Score = formData.immediateMemoryTrial2.filter(Boolean).length
  const trial3Score = formData.immediateMemoryTrial3.filter(Boolean).length
  return trial1Score + trial2Score + trial3Score
}

/**
 * Months in Reverse point (0 or 1), per the SCOAT6 sheet's "(N <30 sec)" note:
 * 1 point for an error-free recitation completed in under 30 seconds.
 * `null` when the subtest was not administered.
 */
export function calculateMonthsPoint(formData: SCOAT6FormData): number | null {
  if (!isMonthsAdministered(formData)) return null
  const monthsTime = parseFloat(formData.monthsReverseTime)
  const errorFree = formData.monthsReverseErrors === 0
  return Number.isFinite(monthsTime) && monthsTime > 0 && monthsTime < 30 && errorFree ? 1 : 0
}

/**
 * Calculate Concentration score (Digits Backwards + Months in Reverse)
 * Max: 5 (4 from digits + 1 from months).
 * `null` unless BOTH halves were administered — a /5 built from one half is a
 * partial sum printed against a full denominator.
 */
export function calculateConcentration(formData: SCOAT6FormData): number | null {
  const monthsPoint = calculateMonthsPoint(formData)
  if (formData.digitsBackward === null || monthsPoint === null) return null
  return formData.digitsBackward + monthsPoint
}

/**
 * Calculate Delayed Recall score (count of words recalled)
 * Max: 10
 */
export function calculateDelayedRecall(formData: SCOAT6FormData): number {
  return formData.delayedRecall.filter(Boolean).length
}

/**
 * Calculate mBESS Total Errors
 * Max: 30 (3 stances × 10 errors each).
 * `null` unless all three stances were recorded — a partial sum printed as
 * "x of 30" understates errors, i.e. reads as better balance than was tested.
 */
export function calculateMBESS(formData: SCOAT6FormData): number | null {
  if (!isBalanceAdministered(formData)) return null
  return (
    (formData.mBessDoubleErrors ?? 0) +
    (formData.mBessTandemErrors ?? 0) +
    (formData.mBessSingleErrors ?? 0)
  )
}

/**
 * Calculate mBESS on Foam Total Errors (optional)
 * Max: 30
 */
export function calculateMBESSFoam(formData: SCOAT6FormData): number | null {
  if (
    formData.mBessFoamDoubleErrors === null ||
    formData.mBessFoamTandemErrors === null ||
    formData.mBessFoamSingleErrors === null
  ) {
    return null
  }
  return (
    formData.mBessFoamDoubleErrors +
    formData.mBessFoamTandemErrors +
    formData.mBessFoamSingleErrors
  )
}

/**
 * Calculate average tandem gait time — the SCOAT6 box is labelled
 * "Average 3 Trials", so it stays blank until all three trials are timed
 * rather than passing off a 1- or 2-trial mean as a 3-trial average.
 */
export function calculateTandemGaitAverage(formData: SCOAT6FormData): string {
  const times = [
    parseFloat(formData.tandemGaitTrial1),
    parseFloat(formData.tandemGaitTrial2),
    parseFloat(formData.tandemGaitTrial3),
  ].filter(t => !isNaN(t) && t > 0)

  if (times.length < 3) return ''

  const average = times.reduce((sum, t) => sum + t, 0) / times.length
  return average.toFixed(2)
}

/**
 * Calculate fastest tandem gait time (3 trials)
 */
export function calculateTandemGaitFastest(formData: SCOAT6FormData): string {
  const times = [
    parseFloat(formData.tandemGaitTrial1),
    parseFloat(formData.tandemGaitTrial2),
    parseFloat(formData.tandemGaitTrial3),
  ].filter(t => !isNaN(t) && t > 0)

  if (times.length === 0) return ''

  const fastest = Math.min(...times)
  return fastest.toFixed(2)
}

/**
 * Calculate Complex Tandem Gait Forward Total (`null` if either leg is missing)
 */
export function calculateComplexTandemForward(formData: SCOAT6FormData): number | null {
  const { complexTandemForwardEyesOpen: open, complexTandemForwardEyesClosed: closed } = formData
  if (open === null || closed === null) return null
  return open + closed
}

/**
 * Calculate Complex Tandem Gait Backward Total (`null` if either leg is missing)
 */
export function calculateComplexTandemBackward(formData: SCOAT6FormData): number | null {
  const { complexTandemBackwardEyesOpen: open, complexTandemBackwardEyesClosed: closed } = formData
  if (open === null || closed === null) return null
  return open + closed
}

/**
 * Calculate Complex Tandem Gait Total (Forward + Backward)
 */
export function calculateComplexTandemTotal(formData: SCOAT6FormData): number | null {
  const forward = calculateComplexTandemForward(formData)
  const backward = calculateComplexTandemBackward(formData)
  if (forward === null || backward === null) return null
  return forward + backward
}

/**
 * Calculate Dual Task Cognitive Accuracy (correct / attempted).
 * Returns '' when it cannot be computed, so nothing is printed.
 */
export function calculateDualTaskAccuracy(formData: SCOAT6FormData): string {
  const { dualTaskTrialsAttempted: attempted, dualTaskTrialsCorrect: correct } = formData
  if (attempted === null || correct === null || attempted === 0) return ''
  return (correct / attempted).toFixed(2)
}

/**
 * Calculate GAD-7 Anxiety Screen Score
 * Max: 21 (7 questions × 3 max rating)
 */
export function calculateGAD7(formData: SCOAT6FormData): number | null {
  if (!isGAD7Administered(formData)) return null
  return (
    (formData.gad7_1 ?? 0) +
    (formData.gad7_2 ?? 0) +
    (formData.gad7_3 ?? 0) +
    (formData.gad7_4 ?? 0) +
    (formData.gad7_5 ?? 0) +
    (formData.gad7_6 ?? 0) +
    (formData.gad7_7 ?? 0)
  )
}

/**
 * Get GAD-7 severity level
 */
export function getGAD7Severity(score: number): string {
  if (score <= 4) return 'Minimal anxiety'
  if (score <= 9) return 'Mild anxiety'
  if (score <= 14) return 'Moderate anxiety'
  return 'Severe anxiety'
}

/**
 * Calculate PHQ-2 Depression Screen Score
 * Max: 6 (2 questions × 3 max rating)
 */
export function calculatePHQ2(formData: SCOAT6FormData): number | null {
  if (!isPHQ2Administered(formData)) return null
  return (formData.phq2_1 ?? 0) + (formData.phq2_2 ?? 0)
}

/**
 * Calculate Sleep Screen Score
 * Max: 17
 */
export function calculateSleepScore(formData: SCOAT6FormData): number | null {
  if (!isSleepAdministered(formData)) return null
  return (
    (formData.sleep1 ?? 0) +
    (formData.sleep2 ?? 0) +
    (formData.sleep3 ?? 0) +
    (formData.sleep4 ?? 0) +
    (formData.sleep5 ?? 0)
  )
}

/**
 * Get Sleep disorder severity level
 */
export function getSleepSeverity(score: number): string {
  if (score <= 4) return 'Normal'
  if (score <= 7) return 'Mild'
  if (score <= 10) return 'Moderate'
  return 'Severe'
}

/**
 * Get all calculated scores for display
 */
export function getAllCalculatedScores(formData: SCOAT6FormData) {
  return {
    // "Was it administered?" — consumers must render '—' where these are false
    // instead of the raw 0 the model would otherwise hand them.
    symptomsAdministered: {
      preInjury: isSymptomColumnAdministered(formData, 'preInjury'),
      dayInjured: isSymptomColumnAdministered(formData, 'dayInjured'),
      consult1: isSymptomColumnAdministered(formData, 'consult1'),
      consult2: isSymptomColumnAdministered(formData, 'consult2'),
      consult3: isSymptomColumnAdministered(formData, 'consult3'),
    },
    immediateMemoryAdministered: isImmediateMemoryAdministered(formData),
    digitsAdministered: isDigitsAdministered(formData),
    monthsAdministered: isMonthsAdministered(formData),
    delayedRecallAdministered: isDelayedRecallAdministered(formData),
    balanceAdministered: isBalanceAdministered(formData),
    complexTandemAdministered: isComplexTandemAdministered(formData),
    dualTaskAdministered: isDualTaskAdministered(formData),

    monthsPoint: calculateMonthsPoint(formData),

    // Symptoms for each date column
    symptomNumberPreInjury: calculateSymptomNumber(formData.symptoms, 'preInjury'),
    symptomNumberDayInjured: calculateSymptomNumber(formData.symptoms, 'dayInjured'),
    symptomNumberConsult1: calculateSymptomNumber(formData.symptoms, 'consult1'),
    symptomNumberConsult2: calculateSymptomNumber(formData.symptoms, 'consult2'),
    symptomNumberConsult3: calculateSymptomNumber(formData.symptoms, 'consult3'),

    symptomSeverityPreInjury: calculateSymptomSeverity(formData.symptoms, 'preInjury'),
    symptomSeverityDayInjured: calculateSymptomSeverity(formData.symptoms, 'dayInjured'),
    symptomSeverityConsult1: calculateSymptomSeverity(formData.symptoms, 'consult1'),
    symptomSeverityConsult2: calculateSymptomSeverity(formData.symptoms, 'consult2'),
    symptomSeverityConsult3: calculateSymptomSeverity(formData.symptoms, 'consult3'),

    // Cognitive scores
    immediateMemory: calculateImmediateMemory(formData),
    concentration: calculateConcentration(formData),
    delayedRecall: calculateDelayedRecall(formData),

    // Balance scores
    mBessTotal: calculateMBESS(formData),
    mBessFoamTotal: calculateMBESSFoam(formData),
    tandemGaitAverage: calculateTandemGaitAverage(formData),
    tandemGaitFastest: calculateTandemGaitFastest(formData),

    // Complex Tandem Gait
    complexTandemForward: calculateComplexTandemForward(formData),
    complexTandemBackward: calculateComplexTandemBackward(formData),
    complexTandemTotal: calculateComplexTandemTotal(formData),

    // Dual Task
    dualTaskAccuracy: calculateDualTaskAccuracy(formData),

    // Mental Health Screens
    // Severity labels are diagnostic statements — only ever derived from a
    // completed screen, never from the absence of answers.
    gad7Score: calculateGAD7(formData),
    gad7Severity: (() => {
      const score = calculateGAD7(formData)
      return score === null ? null : getGAD7Severity(score)
    })(),
    phq2Score: calculatePHQ2(formData),
    sleepScore: calculateSleepScore(formData),
    sleepSeverity: (() => {
      const score = calculateSleepScore(formData)
      return score === null ? null : getSleepSeverity(score)
    })(),
  }
}
