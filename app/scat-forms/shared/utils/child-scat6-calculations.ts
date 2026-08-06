// Auto-calculation functions for Child SCAT6 form
//
// Maximums are the ones PRINTED on the Child SCAT6 (BJSM 2023) Step 6 decision
// table: symptom number of 21, severity of 63, Immediate Memory of 30,
// Concentration of 6, Delayed Recall of 10, Cognitive Total of 46, mBESS of 30.
// There is no orientation subtest on the Child SCAT6.
//
// Every function returns `null` for "not administered / not recorded" and a
// number (including 0) only when the clinician actually recorded something.
// Callers must print the null case as blank or a dash — never as 0.

import {
  ChildSCAT6FormData,
  ChildSCAT6SymptomScores,
  CHILD_SCAT6_SYMPTOM_KEYS,
  CHILD_SCAT6_SYMPTOM_COUNT,
} from '../types/child-scat6.types'

export const CHILD_SCAT6_MAX = {
  symptomNumber: CHILD_SCAT6_SYMPTOM_COUNT, // 21
  symptomSeverity: CHILD_SCAT6_SYMPTOM_COUNT * 3, // 63
  immediateMemory: 30,
  digitsBackward: 5,
  daysReverse: 1,
  concentration: 6,
  delayedRecall: 10,
  cognitiveTotal: 46,
  mBessPerStance: 10,
  mBessTotal: 30,
} as const

/** Number of the 21 items that carry a rating. */
export function countSymptomsRated(symptoms: ChildSCAT6SymptomScores): number {
  return CHILD_SCAT6_SYMPTOM_KEYS.filter(key => symptoms[key] !== null).length
}

/** True only when every one of the 21 items has been rated. */
export function isSymptomScaleComplete(symptoms: ChildSCAT6SymptomScores): boolean {
  return countSymptomsRated(symptoms) === CHILD_SCAT6_SYMPTOM_COUNT
}

/**
 * Number of symptoms endorsed (rating > 0). Max 21.
 * null when not a single item was rated — an unrated scale is not "0 symptoms".
 */
export function calculateSymptomNumber(symptoms: ChildSCAT6SymptomScores): number | null {
  if (countSymptomsRated(symptoms) === 0) return null
  return CHILD_SCAT6_SYMPTOM_KEYS.filter(key => (symptoms[key] ?? 0) > 0).length
}

/**
 * Symptom severity (sum of ratings). Max 63 (21 items x 3).
 * null when nothing was rated.
 */
export function calculateSymptomSeverity(symptoms: ChildSCAT6SymptomScores): number | null {
  if (countSymptomsRated(symptoms) === 0) return null
  return CHILD_SCAT6_SYMPTOM_KEYS.reduce((sum, key) => sum + (symptoms[key] ?? 0), 0)
}

/**
 * Was Immediate Memory administered? The word list is chosen BEFORE the trials
 * are run, so it is setup and NOT evidence — a clinician who selects List A and
 * is then interrupted otherwise exports a ringed grid of thirty zeros and an
 * "Immediate Memory Score 0 of 30" for a child who was never tested. Only a
 * completion time or a ticked word counts.
 */
export function isImmediateMemoryAdministered(formData: ChildSCAT6FormData): boolean {
  return (
    formData.immediateMemoryTimeCompleted !== '' ||
    formData.immediateMemoryTrial1.some(Boolean) ||
    formData.immediateMemoryTrial2.some(Boolean) ||
    formData.immediateMemoryTrial3.some(Boolean)
  )
}

/**
 * Immediate Memory score (sum of all 3 trials). Max 30.
 * null when the subtest was not administered.
 */
export function calculateImmediateMemory(formData: ChildSCAT6FormData): number | null {
  if (!isImmediateMemoryAdministered(formData)) return null
  return (
    formData.immediateMemoryTrial1.filter(Boolean).length +
    formData.immediateMemoryTrial2.filter(Boolean).length +
    formData.immediateMemoryTrial3.filter(Boolean).length
  )
}

/**
 * Days in reverse. The Child SCAT6 prints the criterion verbatim: "1 point if
 * no errors and completion under 30 seconds" (and uses DAYS of the week, not
 * the adult form's months).
 *
 * Three states, because the printed criterion only determines two of them:
 *   - errors > 0                      -> 0. The point is lost whatever the time.
 *   - errors = 0 AND time < 30s       -> 1.
 *   - errors = 0 AND no/invalid time  -> null. Neither half of the criterion is
 *     satisfied nor failed. Printing 0 would assert a failed subtest on the
 *     strength of a stopwatch nobody wrote down.
 * null also covers "no error count recorded at all".
 */
export function calculateDaysReverse(formData: ChildSCAT6FormData): number | null {
  if (formData.daysReverseErrors === null) return null
  if (formData.daysReverseErrors > 0) return 0
  const seconds = parseFloat(formData.daysReverseTime)
  if (isNaN(seconds) || seconds <= 0) return null
  return seconds < 30 ? 1 : 0
}

/**
 * Concentration = Digits Backward (of 5) + Days in reverse (of 1). Max 6.
 * null unless BOTH halves were administered — a total built from one half
 * understates concentration against a printed "of 6".
 */
export function calculateConcentration(formData: ChildSCAT6FormData): number | null {
  const days = calculateDaysReverse(formData)
  if (formData.digitsBackward === null || days === null) return null
  return formData.digitsBackward + days
}

/**
 * Was Delayed Recall administered? The start time is recorded when the recall
 * is given, so it (or any ticked word) is the evidence.
 */
export function isDelayedRecallAdministered(formData: ChildSCAT6FormData): boolean {
  return formData.delayedRecallStartTime !== '' || formData.delayedRecall.some(Boolean)
}

/**
 * Delayed Recall score (words recalled). Max 10.
 * null when not administered.
 */
export function calculateDelayedRecall(formData: ChildSCAT6FormData): number | null {
  if (!isDelayedRecallAdministered(formData)) return null
  return formData.delayedRecall.filter(Boolean).length
}

/**
 * Cognitive total = Immediate Memory + Concentration + Delayed Recall. Max 46.
 * null unless all three contributors were administered — a total that sums two
 * of three subtests against a printed "of 46" reads as impairment.
 */
export function calculateTotalCognitive(formData: ChildSCAT6FormData): number | null {
  const memory = calculateImmediateMemory(formData)
  const concentration = calculateConcentration(formData)
  const recall = calculateDelayedRecall(formData)
  if (memory === null || concentration === null || recall === null) return null
  return memory + concentration + recall
}

/**
 * mBESS total errors. Max 30 (3 stances x 10).
 * null unless all three stances were scored — 0 errors of 30 is a PERFECT
 * balance result and must never be produced by an untouched form.
 */
export function calculateMBESS(formData: ChildSCAT6FormData): number | null {
  const { mBessDoubleErrors, mBessTandemErrors, mBessSingleErrors } = formData
  if (mBessDoubleErrors === null || mBessTandemErrors === null || mBessSingleErrors === null) {
    return null
  }
  return mBessDoubleErrors + mBessTandemErrors + mBessSingleErrors
}

/**
 * mBESS on foam total errors (optional section). Max 30.
 */
export function calculateMBESSFoam(formData: ChildSCAT6FormData): number | null {
  const { mBessFoamDoubleErrors, mBessFoamTandemErrors, mBessFoamSingleErrors } = formData
  if (
    mBessFoamDoubleErrors === null ||
    mBessFoamTandemErrors === null ||
    mBessFoamSingleErrors === null
  ) {
    return null
  }
  return mBessFoamDoubleErrors + mBessFoamTandemErrors + mBessFoamSingleErrors
}

/**
 * Average tandem gait time. Returns '' unless all three trials were timed —
 * averaging one or two trials against a box labelled "Average 3 Trials" would
 * report a number the child never produced.
 */
export function calculateTandemGaitAverage(formData: ChildSCAT6FormData): string {
  const times = [
    formData.tandemGaitTrial1,
    formData.tandemGaitTrial2,
    formData.tandemGaitTrial3,
  ].map(t => parseFloat(t))

  if (times.some(t => isNaN(t) || t <= 0)) return ''

  const average = times.reduce((sum, t) => sum + t, 0) / times.length
  return average.toFixed(2)
}

/**
 * Fastest tandem gait time of the trials actually completed.
 */
export function calculateTandemGaitFastest(formData: ChildSCAT6FormData): string {
  const times = [
    parseFloat(formData.tandemGaitTrial1),
    parseFloat(formData.tandemGaitTrial2),
    parseFloat(formData.tandemGaitTrial3),
  ].filter(t => !isNaN(t) && t > 0)

  if (times.length === 0) return ''

  return Math.min(...times).toFixed(2)
}

/** Complex tandem gait forward total points (eyes open + eyes closed). */
export function calculateComplexTandemForward(formData: ChildSCAT6FormData): number | null {
  const { complexTandemForwardEyesOpen: open, complexTandemForwardEyesClosed: closed } = formData
  if (open === null || closed === null) return null
  return open + closed
}

/** Complex tandem gait backward total points (eyes open + eyes closed). */
export function calculateComplexTandemBackward(formData: ChildSCAT6FormData): number | null {
  const { complexTandemBackwardEyesOpen: open, complexTandemBackwardEyesClosed: closed } = formData
  if (open === null || closed === null) return null
  return open + closed
}

/** Complex tandem gait total points (forward + backward). */
export function calculateComplexTandemTotal(formData: ChildSCAT6FormData): number | null {
  const forward = calculateComplexTandemForward(formData)
  const backward = calculateComplexTandemBackward(formData)
  if (forward === null || backward === null) return null
  return forward + backward
}

/** Fastest dual task gait time of the trials actually completed. */
export function calculateDualTaskFastest(formData: ChildSCAT6FormData): string {
  const times = [
    parseFloat(formData.dualTask1Time),
    parseFloat(formData.dualTask2Time),
    parseFloat(formData.dualTask3Time),
  ].filter(t => !isNaN(t) && t > 0)

  if (times.length === 0) return ''

  return Math.min(...times).toFixed(2)
}

/**
 * Get all calculated scores for display.
 * `null` anywhere means "not administered" — render it as a dash, never as 0.
 */
export function getAllCalculatedScores(formData: ChildSCAT6FormData) {
  return {
    childSymptomNumber: calculateSymptomNumber(formData.childSymptoms),
    childSymptomSeverity: calculateSymptomSeverity(formData.childSymptoms),
    childSymptomsRated: countSymptomsRated(formData.childSymptoms),
    childSymptomScaleComplete: isSymptomScaleComplete(formData.childSymptoms),
    parentSymptomNumber: calculateSymptomNumber(formData.parentSymptoms),
    parentSymptomSeverity: calculateSymptomSeverity(formData.parentSymptoms),
    parentSymptomsRated: countSymptomsRated(formData.parentSymptoms),
    parentSymptomScaleComplete: isSymptomScaleComplete(formData.parentSymptoms),
    immediateMemory: calculateImmediateMemory(formData),
    daysReverse: calculateDaysReverse(formData),
    concentration: calculateConcentration(formData),
    delayedRecall: calculateDelayedRecall(formData),
    totalCognitive: calculateTotalCognitive(formData),
    mBessTotal: calculateMBESS(formData),
    mBessFoamTotal: calculateMBESSFoam(formData),
    tandemGaitAverage: calculateTandemGaitAverage(formData),
    tandemGaitFastest: calculateTandemGaitFastest(formData),
    complexTandemForward: calculateComplexTandemForward(formData),
    complexTandemBackward: calculateComplexTandemBackward(formData),
    complexTandemTotal: calculateComplexTandemTotal(formData),
    dualTaskFastest: calculateDualTaskFastest(formData),
  }
}
