// Auto-calculation functions for SCAT6 form

import { SCAT6FormData } from '../types/scat6.types'

/**
 * ============================================================================
 * NOT ADMINISTERED vs SCORED ZERO
 * ============================================================================
 *
 * Every scored field that can be left untouched is nullable in the model
 * (`null` = never administered). A subtest that was NOT run returns `null`
 * here so the UI and the PDF exporter can print a dash instead of inventing a
 * clinical finding — a "0" in a SCAT6 score box is a real, and usually
 * alarming, result (0/5 orientation, 0/30 memory) or a perfect one (0 mBESS
 * errors of 30). A genuine zero still returns 0 and still prints.
 *
 * Maximums below are the SCAT6 instrument's own (Echemendia RJ, et al.
 * Br J Sports Med 2023;57:622-631 — verified against public/docs/SCAT6_Flat.pdf).
 */

/**
 * Calculate total number of symptoms (count of symptoms rated > 0)
 * Max: 22. Unrated items are not counted.
 */
export function calculateSymptomNumber(symptoms: SCAT6FormData['symptoms']): number {
  return Object.values(symptoms).filter(value => (value ?? 0) > 0).length
}

/**
 * Calculate symptom severity score (sum of all ratings)
 * Max: 132 (22 symptoms × 6 max rating). Unrated items contribute nothing.
 */
export function calculateSymptomSeverity(symptoms: SCAT6FormData['symptoms']): number {
  return Object.values(symptoms).reduce<number>((sum, value) => sum + (value ?? 0), 0)
}

/** How many of the 22 symptoms were actually rated. */
export function countSymptomsRated(symptoms: SCAT6FormData['symptoms']): number {
  return Object.values(symptoms).filter(value => value !== null).length
}

/** Was the symptom scale administered at all? */
export function isSymptomsAdministered(symptoms: SCAT6FormData['symptoms']): boolean {
  return countSymptomsRated(symptoms) > 0
}

const orientationItems = (formData: SCAT6FormData): (boolean | null)[] => [
  formData.orientationMonth,
  formData.orientationDate,
  formData.orientationDayOfWeek,
  formData.orientationYear,
  formData.orientationTime,
]

/** Was orientation administered? (any of the 5 items answered either way) */
export function isOrientationAdministered(formData: SCAT6FormData): boolean {
  return orientationItems(formData).some(v => v !== null)
}

/**
 * Calculate Orientation score (count of correct answers)
 * Max: 5. Unanswered items score nothing.
 */
export function calculateOrientation(formData: SCAT6FormData): number {
  return orientationItems(formData).filter(v => v === true).length
}

/** Was immediate memory administered? */
export function isImmediateMemoryAdministered(formData: SCAT6FormData): boolean {
  return (
    formData.wordListUsed !== '' ||
    formData.immediateMemoryTimeCompleted.trim() !== '' ||
    formData.immediateMemoryTrial1.some(Boolean) ||
    formData.immediateMemoryTrial2.some(Boolean) ||
    formData.immediateMemoryTrial3.some(Boolean)
  )
}

/**
 * Calculate Immediate Memory score (sum of all 3 trials)
 * Max: 30 (3 trials × 10 words)
 */
export function calculateImmediateMemory(formData: SCAT6FormData): number {
  const trial1Score = formData.immediateMemoryTrial1.filter(Boolean).length
  const trial2Score = formData.immediateMemoryTrial2.filter(Boolean).length
  const trial3Score = formData.immediateMemoryTrial3.filter(Boolean).length
  return trial1Score + trial2Score + trial3Score
}

/** Was digits backwards administered? */
export function isDigitsAdministered(formData: SCAT6FormData): boolean {
  return formData.digitsBackward !== null
}

/** Was months-in-reverse administered? */
export function isMonthsAdministered(formData: SCAT6FormData): boolean {
  return formData.monthsReverseErrors !== null || formData.monthsReverseTime.trim() !== ''
}

/**
 * Months in Reverse score, max 1.
 * SCAT6: "1 point if no errors and completion under 30 seconds."
 * Returns null when the subtest was not administered, or when it was run but
 * the completion time was never recorded (the point cannot be decided without
 * it — reporting 0 would assert a failure that was never measured).
 */
export function calculateMonthsScore(formData: SCAT6FormData): number | null {
  if (!isMonthsAdministered(formData)) return null
  if (formData.monthsReverseErrors === null) return null
  // Any error loses the point regardless of time.
  if (formData.monthsReverseErrors > 0) return 0
  const seconds = parseFloat(formData.monthsReverseTime)
  if (!Number.isFinite(seconds) || seconds <= 0) return null
  return seconds < 30 ? 1 : 0
}

/**
 * Calculate Concentration score (Digits Backwards + Months in Reverse)
 * Max: 5 (4 from digits + 1 from months).
 * Both halves are required — a partial /5 understates the athlete.
 */
export function calculateConcentration(formData: SCAT6FormData): number | null {
  const months = calculateMonthsScore(formData)
  if (formData.digitsBackward === null || months === null) return null
  return formData.digitsBackward + months
}

/** Was delayed recall administered? */
export function isDelayedRecallAdministered(formData: SCAT6FormData): boolean {
  return formData.delayedRecallStartTime.trim() !== '' || formData.delayedRecall.some(Boolean)
}

/**
 * Calculate Delayed Recall score (count of words recalled)
 * Max: 10
 */
export function calculateDelayedRecall(formData: SCAT6FormData): number {
  return formData.delayedRecall.filter(Boolean).length
}

/**
 * Calculate Total Cognitive Score
 * Max: 50 (5 + 30 + 5 + 10)
 * Only produced when all four contributors were administered — a partial total
 * printed against "of 50" reads as impairment that was never measured.
 */
export function calculateTotalCognitive(formData: SCAT6FormData): number | null {
  const concentration = calculateConcentration(formData)
  if (
    !isOrientationAdministered(formData) ||
    !isImmediateMemoryAdministered(formData) ||
    concentration === null ||
    !isDelayedRecallAdministered(formData)
  ) {
    return null
  }
  return (
    calculateOrientation(formData) +
    calculateImmediateMemory(formData) +
    concentration +
    calculateDelayedRecall(formData)
  )
}

/** Was the firm-surface mBESS administered? (all three stances recorded) */
export function isBalanceAdministered(formData: SCAT6FormData): boolean {
  return (
    formData.mBessDoubleErrors !== null &&
    formData.mBessTandemErrors !== null &&
    formData.mBessSingleErrors !== null
  )
}

/**
 * Calculate mBESS Total Errors
 * Max: 30 (3 stances × 10 errors each). Null unless all three stances ran.
 */
export function calculateMBESS(formData: SCAT6FormData): number | null {
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
export function calculateMBESSFoam(formData: SCAT6FormData): number | null {
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
 * Calculate average tandem gait time (3 trials)
 */
export function calculateTandemGaitAverage(formData: SCAT6FormData): string {
  const times = [
    parseFloat(formData.tandemGaitTrial1),
    parseFloat(formData.tandemGaitTrial2),
    parseFloat(formData.tandemGaitTrial3),
  ].filter(t => !isNaN(t) && t > 0)

  if (times.length === 0) return ''

  const average = times.reduce((sum, t) => sum + t, 0) / times.length
  return average.toFixed(2)
}

/**
 * Calculate fastest tandem gait time (3 trials)
 */
export function calculateTandemGaitFastest(formData: SCAT6FormData): string {
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
 * Calculate fastest dual task gait time (3 trials)
 */
export function calculateDualTaskFastest(formData: SCAT6FormData): string {
  const times = [
    parseFloat(formData.dualTask1Time),
    parseFloat(formData.dualTask2Time),
    parseFloat(formData.dualTask3Time),
  ].filter(t => !isNaN(t) && t > 0)

  if (times.length === 0) return ''

  const fastest = Math.min(...times)
  return fastest.toFixed(2)
}

/**
 * Minutes elapsed between the last immediate-memory trial and the start of
 * delayed recall. SCAT6 requires a minimum of 5 minutes; returns null when
 * either time is missing or unparseable (never a fabricated interval).
 */
export function delayedRecallIntervalMinutes(formData: SCAT6FormData): number | null {
  const parse = (value: string): number | null => {
    const match = /^(\d{1,2}):(\d{2})/.exec(value.trim())
    if (!match) return null
    const hours = Number(match[1])
    const minutes = Number(match[2])
    if (hours > 23 || minutes > 59) return null
    return hours * 60 + minutes
  }
  const start = parse(formData.immediateMemoryTimeCompleted)
  const end = parse(formData.delayedRecallStartTime)
  if (start === null || end === null) return null
  // Wrap across midnight rather than reporting a negative interval.
  return end >= start ? end - start : end + 24 * 60 - start
}

/**
 * Get all calculated scores for display
 */
export function getAllCalculatedScores(formData: SCAT6FormData) {
  return {
    symptomsAdministered: isSymptomsAdministered(formData.symptoms),
    symptomsRated: countSymptomsRated(formData.symptoms),
    symptomNumber: calculateSymptomNumber(formData.symptoms),
    symptomSeverity: calculateSymptomSeverity(formData.symptoms),
    orientationAdministered: isOrientationAdministered(formData),
    orientation: calculateOrientation(formData),
    immediateMemoryAdministered: isImmediateMemoryAdministered(formData),
    immediateMemory: calculateImmediateMemory(formData),
    monthsScore: calculateMonthsScore(formData),
    concentration: calculateConcentration(formData),
    delayedRecallAdministered: isDelayedRecallAdministered(formData),
    delayedRecall: calculateDelayedRecall(formData),
    totalCognitive: calculateTotalCognitive(formData),
    balanceAdministered: isBalanceAdministered(formData),
    mBessTotal: calculateMBESS(formData),
    mBessFoamTotal: calculateMBESSFoam(formData),
    tandemGaitAverage: calculateTandemGaitAverage(formData),
    tandemGaitFastest: calculateTandemGaitFastest(formData),
    dualTaskFastest: calculateDualTaskFastest(formData),
    delayedRecallIntervalMinutes: delayedRecallIntervalMinutes(formData),
  }
}
