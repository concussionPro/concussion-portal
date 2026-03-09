// Auto-calculation functions for Child SCAT6 form

import { ChildSCAT6FormData } from '../types/child-scat6.types'

/**
 * Calculate number of child-reported symptoms (count > 0)
 * Max: 21
 */
export function calculateChildSymptomNumber(symptoms: ChildSCAT6FormData['childSymptoms']): number {
  return Object.values(symptoms).filter(value => value > 0).length
}

/**
 * Calculate child symptom severity score (sum of all ratings)
 * Max: 63 (21 symptoms x 3 max rating)
 */
export function calculateChildSymptomSeverity(symptoms: ChildSCAT6FormData['childSymptoms']): number {
  return Object.values(symptoms).reduce((sum, value) => sum + value, 0)
}

/**
 * Calculate number of parent-reported symptoms (count > 0)
 * Max: 21
 */
export function calculateParentSymptomNumber(symptoms: ChildSCAT6FormData['parentSymptoms']): number {
  return Object.values(symptoms).filter(value => value > 0).length
}

/**
 * Calculate parent symptom severity score (sum of all ratings)
 * Max: 63 (21 symptoms x 3 max rating)
 */
export function calculateParentSymptomSeverity(symptoms: ChildSCAT6FormData['parentSymptoms']): number {
  return Object.values(symptoms).reduce((sum, value) => sum + value, 0)
}

/**
 * Calculate Orientation score (count of correct answers)
 * Max: 5
 */
export function calculateOrientation(formData: ChildSCAT6FormData): number {
  let score = 0
  if (formData.orientationMonth) score++
  if (formData.orientationDate) score++
  if (formData.orientationDayOfWeek) score++
  if (formData.orientationYear) score++
  if (formData.orientationTime) score++
  return score
}

/**
 * Calculate Immediate Memory score (sum of all 3 trials)
 * Max: 30 (3 trials x 10 words)
 */
export function calculateImmediateMemory(formData: ChildSCAT6FormData): number {
  const trial1Score = formData.immediateMemoryTrial1.filter(Boolean).length
  const trial2Score = formData.immediateMemoryTrial2.filter(Boolean).length
  const trial3Score = formData.immediateMemoryTrial3.filter(Boolean).length
  return trial1Score + trial2Score + trial3Score
}

/**
 * Calculate Concentration score (Digits Backwards + Months in Reverse)
 * Max: 5 (4 from digits + 1 from months)
 */
export function calculateConcentration(formData: ChildSCAT6FormData): number {
  let score = formData.digitsBackward // 0-4

  const monthsTime = parseFloat(formData.monthsReverseTime) || 0
  if (monthsTime > 0 && monthsTime < 30 && formData.monthsReverseErrors === 0) {
    score += 1
  }

  return score
}

/**
 * Calculate Delayed Recall score (count of words recalled)
 * Max: 10
 */
export function calculateDelayedRecall(formData: ChildSCAT6FormData): number {
  return formData.delayedRecall.filter(Boolean).length
}

/**
 * Calculate Total Cognitive Score
 * Max: 50 (5 + 30 + 5 + 10)
 */
export function calculateTotalCognitive(formData: ChildSCAT6FormData): number {
  return (
    calculateOrientation(formData) +
    calculateImmediateMemory(formData) +
    calculateConcentration(formData) +
    calculateDelayedRecall(formData)
  )
}

/**
 * Calculate mBESS Total Errors
 * Max: 30 (3 stances x 10 errors each)
 */
export function calculateMBESS(formData: ChildSCAT6FormData): number {
  return (
    formData.mBessDoubleErrors +
    formData.mBessTandemErrors +
    formData.mBessSingleErrors
  )
}

/**
 * Calculate mBESS on Foam Total Errors (optional)
 * Max: 30
 */
export function calculateMBESSFoam(formData: ChildSCAT6FormData): number | null {
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
export function calculateTandemGaitAverage(formData: ChildSCAT6FormData): string {
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
export function calculateTandemGaitFastest(formData: ChildSCAT6FormData): string {
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
 * Calculate Complex Tandem Gait Forward Total
 */
export function calculateComplexTandemForward(formData: ChildSCAT6FormData): number {
  return formData.complexTandemForwardEyesOpen + formData.complexTandemForwardEyesClosed
}

/**
 * Calculate Complex Tandem Gait Backward Total
 */
export function calculateComplexTandemBackward(formData: ChildSCAT6FormData): number {
  return formData.complexTandemBackwardEyesOpen + formData.complexTandemBackwardEyesClosed
}

/**
 * Calculate Complex Tandem Gait Total
 */
export function calculateComplexTandemTotal(formData: ChildSCAT6FormData): number {
  return calculateComplexTandemForward(formData) + calculateComplexTandemBackward(formData)
}

/**
 * Calculate fastest dual task gait time (3 trials)
 */
export function calculateDualTaskFastest(formData: ChildSCAT6FormData): string {
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
 * Get all calculated scores for display
 */
export function getAllCalculatedScores(formData: ChildSCAT6FormData) {
  return {
    childSymptomNumber: calculateChildSymptomNumber(formData.childSymptoms),
    childSymptomSeverity: calculateChildSymptomSeverity(formData.childSymptoms),
    parentSymptomNumber: calculateParentSymptomNumber(formData.parentSymptoms),
    parentSymptomSeverity: calculateParentSymptomSeverity(formData.parentSymptoms),
    orientation: calculateOrientation(formData),
    immediateMemory: calculateImmediateMemory(formData),
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
