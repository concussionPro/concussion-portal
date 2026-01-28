// Auto-calculation functions for SCOAT6 form

import { SCOAT6FormData } from '../types/scoat6.types'

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
 * Calculate Concentration score (Digits Backwards + Months in Reverse)
 * Max: 5 (4 from digits + 1 from months)
 */
export function calculateConcentration(formData: SCOAT6FormData): number {
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
export function calculateDelayedRecall(formData: SCOAT6FormData): number {
  return formData.delayedRecall.filter(Boolean).length
}

/**
 * Calculate mBESS Total Errors
 * Max: 30 (3 stances × 10 errors each)
 */
export function calculateMBESS(formData: SCOAT6FormData): number {
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
 * Calculate average tandem gait time (3 trials)
 */
export function calculateTandemGaitAverage(formData: SCOAT6FormData): string {
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
 * Calculate Complex Tandem Gait Forward Total
 */
export function calculateComplexTandemForward(formData: SCOAT6FormData): number {
  return formData.complexTandemForwardEyesOpen + formData.complexTandemForwardEyesClosed
}

/**
 * Calculate Complex Tandem Gait Backward Total
 */
export function calculateComplexTandemBackward(formData: SCOAT6FormData): number {
  return formData.complexTandemBackwardEyesOpen + formData.complexTandemBackwardEyesClosed
}

/**
 * Calculate Complex Tandem Gait Total (Forward + Backward)
 */
export function calculateComplexTandemTotal(formData: SCOAT6FormData): number {
  return calculateComplexTandemForward(formData) + calculateComplexTandemBackward(formData)
}

/**
 * Calculate Dual Task Cognitive Accuracy
 */
export function calculateDualTaskAccuracy(formData: SCOAT6FormData): string {
  if (formData.dualTaskTrialsAttempted === 0) return '-'
  const accuracy = formData.dualTaskTrialsCorrect / formData.dualTaskTrialsAttempted
  return accuracy.toFixed(2)
}

/**
 * Calculate GAD-7 Anxiety Screen Score
 * Max: 21 (7 questions × 3 max rating)
 */
export function calculateGAD7(formData: SCOAT6FormData): number {
  if (formData.gad7NotDone) return 0
  return (
    formData.gad7_1 +
    formData.gad7_2 +
    formData.gad7_3 +
    formData.gad7_4 +
    formData.gad7_5 +
    formData.gad7_6 +
    formData.gad7_7
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
export function calculatePHQ2(formData: SCOAT6FormData): number {
  if (formData.phq2NotDone) return 0
  return formData.phq2_1 + formData.phq2_2
}

/**
 * Calculate Sleep Screen Score
 * Max: 17
 */
export function calculateSleepScore(formData: SCOAT6FormData): number {
  if (formData.sleepNotDone) return 0
  return (
    formData.sleep1 +
    formData.sleep2 +
    formData.sleep3 +
    formData.sleep4 +
    formData.sleep5
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
    gad7Score: calculateGAD7(formData),
    gad7Severity: getGAD7Severity(calculateGAD7(formData)),
    phq2Score: calculatePHQ2(formData),
    sleepScore: calculateSleepScore(formData),
    sleepSeverity: getSleepSeverity(calculateSleepScore(formData)),
  }
}
