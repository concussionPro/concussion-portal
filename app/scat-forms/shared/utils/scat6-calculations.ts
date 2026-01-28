// Auto-calculation functions for SCAT6 form

import { SCAT6FormData } from '../types/scat6.types'

/**
 * Calculate total number of symptoms (count of symptoms rated > 0)
 * Max: 22
 */
export function calculateSymptomNumber(symptoms: SCAT6FormData['symptoms']): number {
  return Object.values(symptoms).filter(value => value > 0).length
}

/**
 * Calculate symptom severity score (sum of all ratings)
 * Max: 132 (22 symptoms × 6 max rating)
 */
export function calculateSymptomSeverity(symptoms: SCAT6FormData['symptoms']): number {
  return Object.values(symptoms).reduce((sum, value) => sum + value, 0)
}

/**
 * Calculate Orientation score (count of correct answers)
 * Max: 5
 */
export function calculateOrientation(formData: SCAT6FormData): number {
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
 * Max: 30 (3 trials × 10 words)
 */
export function calculateImmediateMemory(formData: SCAT6FormData): number {
  const trial1Score = formData.immediateMemoryTrial1.filter(Boolean).length
  const trial2Score = formData.immediateMemoryTrial2.filter(Boolean).length
  const trial3Score = formData.immediateMemoryTrial3.filter(Boolean).length
  return trial1Score + trial2Score + trial3Score
}

/**
 * Calculate Concentration score (Digits Backwards + Months in Reverse)
 * Max: 5 (4 from digits + 1 from months)
 */
export function calculateConcentration(formData: SCAT6FormData): number {
  let score = formData.digitsBackward // 0-4

  // Months: 1 point if completed in <30 seconds with 0 errors
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
export function calculateDelayedRecall(formData: SCAT6FormData): number {
  return formData.delayedRecall.filter(Boolean).length
}

/**
 * Calculate Total Cognitive Score
 * Max: 50 (5 + 30 + 5 + 10)
 */
export function calculateTotalCognitive(formData: SCAT6FormData): number {
  return (
    calculateOrientation(formData) +
    calculateImmediateMemory(formData) +
    calculateConcentration(formData) +
    calculateDelayedRecall(formData)
  )
}

/**
 * Calculate mBESS Total Errors
 * Max: 30 (3 stances × 10 errors each)
 */
export function calculateMBESS(formData: SCAT6FormData): number {
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
 * Get all calculated scores for display
 */
export function getAllCalculatedScores(formData: SCAT6FormData) {
  return {
    symptomNumber: calculateSymptomNumber(formData.symptoms),
    symptomSeverity: calculateSymptomSeverity(formData.symptoms),
    orientation: calculateOrientation(formData),
    immediateMemory: calculateImmediateMemory(formData),
    concentration: calculateConcentration(formData),
    delayedRecall: calculateDelayedRecall(formData),
    totalCognitive: calculateTotalCognitive(formData),
    mBessTotal: calculateMBESS(formData),
    mBessFoamTotal: calculateMBESSFoam(formData),
    tandemGaitAverage: calculateTandemGaitAverage(formData),
    tandemGaitFastest: calculateTandemGaitFastest(formData),
    dualTaskFastest: calculateDualTaskFastest(formData),
  }
}
