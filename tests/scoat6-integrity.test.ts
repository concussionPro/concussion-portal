import { describe, it, expect } from 'vitest'
import {
  getDefaultSCOAT6FormData,
  type SCOAT6FormData,
} from '@/app/scat-forms/shared/types/scoat6.types'
import {
  calculateSymptomNumber,
  calculateSymptomSeverity,
  calculateImmediateMemory,
  calculateMonthsPoint,
  calculateConcentration,
  calculateDelayedRecall,
  calculateMBESS,
  calculateMBESSFoam,
  calculateTandemGaitAverage,
  calculateTandemGaitFastest,
  calculateComplexTandemForward,
  calculateComplexTandemBackward,
  calculateComplexTandemTotal,
  calculateDualTaskAccuracy,
  calculateGAD7,
  getGAD7Severity,
  calculatePHQ2,
  calculateSleepScore,
  getSleepSeverity,
  isSymptomColumnAdministered,
  isImmediateMemoryAdministered,
  isDigitsAdministered,
  isMonthsAdministered,
  isDelayedRecallAdministered,
  isBalanceAdministered,
  isComplexTandemAdministered,
  isDualTaskAdministered,
  isMvomsBaselineAdministered,
  isMvomsRowAdministered,
  isGAD7Administered,
  isPHQ2Administered,
  isSleepAdministered,
} from '@/app/scat-forms/shared/utils/scoat6-calculations'

/**
 * SCOAT6 clinical-record integrity.
 *
 * The defect class under test: software inventing a clinical value the
 * clinician never entered. Numbers default to 0, so an untouched subtest can
 * be exported as a real finding — 0 mBESS errors of 30 (perfect balance),
 * 0/30 immediate memory (profound amnesia), 0 symptom severity (asymptomatic).
 * Every scored SCOAT6 section must therefore be able to say "not administered".
 *
 * Denominators verified against public/docs/SCOAT6_Flat.pdf:
 *   symptom scale     23 named symptoms + "other", each 0-6
 *   immediate memory  3 trials x 10 words = 30
 *   digits backwards  0-4;  months in reverse 0-1 ("N <30 sec")
 *   delayed recall    10
 *   mBESS             3 stances x 10 errors = 30 (+ optional foam /30)
 *   GAD-7 21, PHQ-2 6, Sleep screen 17 (4+4+3+3+3)
 * NOTE: SCOAT6 has NO orientation section and NO near-point-of-convergence
 * measure (both are SCAT6 / full-VOMS items), so neither can be fabricated here.
 */

const NAMED_SYMPTOMS = [
  'headaches', 'pressureInHead', 'neckPain', 'nauseaVomiting', 'dizziness',
  'blurredVision', 'balanceProblems', 'sensitivityLight', 'sensitivityNoise',
  'feelingSlowedDown', 'feelingInFog', 'difficultyConcentrating',
  'difficultyRemembering', 'fatigueOrLowEnergy', 'confusion', 'drowsiness',
  'moreEmotional', 'irritability', 'sadness', 'nervousAnxious',
  'sleepDisturbance', 'abnormalHeartRate', 'excessiveSweating',
] as const

const blank = (): SCOAT6FormData => getDefaultSCOAT6FormData()

describe('untouched SCOAT6 form fabricates nothing', () => {
  const f = blank()

  it('reports no symptom column as administered', () => {
    for (const col of ['preInjury', 'dayInjured', 'consult1', 'consult2', 'consult3'] as const) {
      expect(isSymptomColumnAdministered(f, col), col).toBe(false)
    }
  })

  it('reports no cognitive, balance, gait or screen section as administered', () => {
    expect(isImmediateMemoryAdministered(f)).toBe(false)
    expect(isDigitsAdministered(f)).toBe(false)
    expect(isMonthsAdministered(f)).toBe(false)
    expect(isDelayedRecallAdministered(f)).toBe(false)
    expect(isBalanceAdministered(f)).toBe(false)
    expect(isComplexTandemAdministered(f)).toBe(false)
    expect(isDualTaskAdministered(f)).toBe(false)
    expect(isMvomsBaselineAdministered(f)).toBe(false)
    expect(isMvomsRowAdministered(f.mvomsSmoothPursuits)).toBe(false)
    expect(isMvomsRowAdministered(f.mvomsSaccadesHorizontal)).toBe(false)
    expect(isMvomsRowAdministered(f.mvomsVORHorizontal)).toBe(false)
    expect(isMvomsRowAdministered(f.mvomsVMS)).toBe(false)
    expect(isGAD7Administered(f)).toBe(false)
    expect(isPHQ2Administered(f)).toBe(false)
    expect(isSleepAdministered(f)).toBe(false)
  })

  it('returns null (never a score) from every gated total', () => {
    expect(calculateGAD7(f)).toBeNull()
    expect(calculatePHQ2(f)).toBeNull()
    expect(calculateSleepScore(f)).toBeNull()
    expect(calculateMBESS(f)).toBeNull()
    expect(calculateMBESSFoam(f)).toBeNull()
    expect(calculateConcentration(f)).toBeNull()
    expect(calculateMonthsPoint(f)).toBeNull()
    expect(calculateComplexTandemForward(f)).toBeNull()
    expect(calculateComplexTandemBackward(f)).toBeNull()
    expect(calculateComplexTandemTotal(f)).toBeNull()
    expect(calculateDualTaskAccuracy(f)).toBe('')
    expect(calculateTandemGaitAverage(f)).toBe('')
    expect(calculateTandemGaitFastest(f)).toBe('')
  })

  it('leaves orthostatic symptom answers unanswered rather than "No"', () => {
    expect(f.orthostaticsSupineSymptoms).toBeNull()
    expect(f.orthostaticsStandingSymptoms).toBeNull()
  })

  it('leaves every scored numeric field null, not 0', () => {
    expect(f.digitsBackward).toBeNull()
    expect(f.monthsReverseErrors).toBeNull()
    expect(f.mBessDoubleErrors).toBeNull()
    expect(f.mBessTandemErrors).toBeNull()
    expect(f.mBessSingleErrors).toBeNull()
    expect(f.complexTandemForwardEyesOpen).toBeNull()
    expect(f.dualTaskTrialsAttempted).toBeNull()
    expect(f.mvomsBaseline.headache).toBeNull()
    expect(f.mvomsVMS.dizziness).toBeNull()
    expect(f.gad7_1).toBeNull()
    expect(f.phq2_1).toBeNull()
    expect(f.sleep1).toBeNull()
  })
})

describe('setup-only selections are not evidence of administration', () => {
  it('picking a word list does not assert immediate memory 0/30', () => {
    const f = blank()
    f.wordListUsed = 'A'
    expect(isImmediateMemoryAdministered(f)).toBe(false)
    expect(calculateImmediateMemory(f)).toBe(0) // raw sum stays 0; the GATE suppresses it
  })

  it('picking a digit list does not assert digits 0/4', () => {
    const f = blank()
    f.digitListUsed = 'B'
    expect(isDigitsAdministered(f)).toBe(false)
    expect(calculateConcentration(f)).toBeNull()
  })

  it('choosing a foot does not assert a perfect mBESS of 0/30', () => {
    const f = blank()
    f.footTested = 'Left'
    expect(isBalanceAdministered(f)).toBe(false)
    expect(calculateMBESS(f)).toBeNull()
  })

  it('picking a dual-task cognitive task does not assert 0 trials', () => {
    const f = blank()
    f.dualTaskCognitiveTask = 'Months'
    expect(isDualTaskAdministered(f)).toBe(false)
  })
})

describe('symptom scale arithmetic (23 named + other, each 0-6)', () => {
  it('counts and sums a maximal presentation', () => {
    const f = blank()
    for (const key of NAMED_SYMPTOMS) f.symptoms[key].consult1 = 6
    expect(calculateSymptomNumber(f.symptoms, 'consult1')).toBe(23)
    expect(calculateSymptomSeverity(f.symptoms, 'consult1')).toBe(23 * 6)
    expect(calculateSymptomSeverity(f.symptoms, 'consult1')).toBe(138)

    f.symptoms.other.name = 'photophobia at night'
    f.symptoms.other.consult1 = 6
    expect(calculateSymptomNumber(f.symptoms, 'consult1')).toBe(24)
    expect(calculateSymptomSeverity(f.symptoms, 'consult1')).toBe(144)
  })

  it('counts symptoms present, not ratings given', () => {
    const f = blank()
    f.symptoms.headaches.dayInjured = 6
    f.symptoms.dizziness.dayInjured = 1
    f.symptoms.neckPain.dayInjured = 0
    expect(calculateSymptomNumber(f.symptoms, 'dayInjured')).toBe(2)
    expect(calculateSymptomSeverity(f.symptoms, 'dayInjured')).toBe(7)
  })

  it('keeps the five date columns independent', () => {
    const f = blank()
    f.symptoms.headaches.dayInjured = 5
    expect(isSymptomColumnAdministered(f, 'dayInjured')).toBe(true)
    // Nothing was recorded at consults 1-3: they must NOT read "0 symptoms".
    expect(isSymptomColumnAdministered(f, 'consult1')).toBe(false)
    expect(isSymptomColumnAdministered(f, 'consult2')).toBe(false)
    expect(isSymptomColumnAdministered(f, 'consult3')).toBe(false)
  })

  it('accepts a dated consult with every symptom resolved as a real zero', () => {
    const f = blank()
    f.symptomDates.consult2 = '2026-08-01'
    expect(isSymptomColumnAdministered(f, 'consult2')).toBe(true)
    expect(calculateSymptomNumber(f.symptoms, 'consult2')).toBe(0)
    expect(calculateSymptomSeverity(f.symptoms, 'consult2')).toBe(0)
  })
})

describe('immediate memory (3 trials x 10 words = 30)', () => {
  it('sums the three trials', () => {
    const f = blank()
    f.immediateMemoryTrial1 = Array(10).fill(true)
    f.immediateMemoryTrial2 = Array(10).fill(true)
    f.immediateMemoryTrial3 = Array(10).fill(true)
    expect(calculateImmediateMemory(f)).toBe(30)
    expect(isImmediateMemoryAdministered(f)).toBe(true)
  })

  it('scores a partial administration honestly', () => {
    const f = blank()
    f.immediateMemoryTrial1 = [true, true, true, false, false, false, false, false, false, false]
    f.immediateMemoryTrial2 = [true, true, true, true, true, false, false, false, false, false]
    f.immediateMemoryTrial3 = Array(10).fill(false)
    f.immediateMemoryTimeCompleted = '10:42'
    expect(calculateImmediateMemory(f)).toBe(8)
    expect(isImmediateMemoryAdministered(f)).toBe(true)
  })

  it('lets a genuine 0/30 be recorded once a completion time exists', () => {
    const f = blank()
    f.immediateMemoryTimeCompleted = '09:15'
    expect(isImmediateMemoryAdministered(f)).toBe(true)
    expect(calculateImmediateMemory(f)).toBe(0)
  })
})

describe('concentration = digits backwards (0-4) + months in reverse (0-1)', () => {
  it('awards the months point for an error-free recitation under 30 s', () => {
    const f = blank()
    f.digitsBackward = 4
    f.monthsReverseTime = '21.5'
    f.monthsReverseErrors = 0
    expect(calculateMonthsPoint(f)).toBe(1)
    expect(calculateConcentration(f)).toBe(5)
  })

  it('withholds the months point at 30 s or with any error', () => {
    const slow = blank()
    slow.digitsBackward = 3
    slow.monthsReverseTime = '30'
    slow.monthsReverseErrors = 0
    expect(calculateMonthsPoint(slow)).toBe(0)
    expect(calculateConcentration(slow)).toBe(3)

    const errored = blank()
    errored.digitsBackward = 2
    errored.monthsReverseTime = '18'
    errored.monthsReverseErrors = 1
    expect(calculateMonthsPoint(errored)).toBe(0)
    expect(calculateConcentration(errored)).toBe(2)
  })

  it('records a genuine digits score of 0', () => {
    const f = blank()
    f.digitsBackward = 0
    f.monthsReverseTime = '45'
    f.monthsReverseErrors = 3
    expect(isDigitsAdministered(f)).toBe(true)
    expect(calculateConcentration(f)).toBe(0)
  })

  it('refuses a /5 when only one half was administered', () => {
    const digitsOnly = blank()
    digitsOnly.digitsBackward = 4
    expect(calculateConcentration(digitsOnly)).toBeNull()

    const monthsOnly = blank()
    monthsOnly.monthsReverseTime = '22'
    monthsOnly.monthsReverseErrors = 0
    expect(calculateConcentration(monthsOnly)).toBeNull()

    const halfMonths = blank()
    halfMonths.digitsBackward = 4
    halfMonths.monthsReverseTime = '22' // error count never recorded
    expect(isMonthsAdministered(halfMonths)).toBe(false)
    expect(calculateConcentration(halfMonths)).toBeNull()
  })
})

describe('delayed recall (/10)', () => {
  it('counts recalled words', () => {
    const f = blank()
    f.delayedRecall = [true, true, true, true, true, false, false, false, false, false]
    expect(calculateDelayedRecall(f)).toBe(5)
    expect(isDelayedRecallAdministered(f)).toBe(true)
  })

  it('treats the recall interval as evidence the subtest ran', () => {
    const f = blank()
    f.delayedRecallMinutesSinceImmediate = '7'
    expect(isDelayedRecallAdministered(f)).toBe(true)
    expect(calculateDelayedRecall(f)).toBe(0)
  })
})

describe('mBESS (3 stances, 10 errors each = 30)', () => {
  it('sums all three stances', () => {
    const f = blank()
    f.mBessDoubleErrors = 10
    f.mBessTandemErrors = 10
    f.mBessSingleErrors = 10
    expect(calculateMBESS(f)).toBe(30)
  })

  it('records a genuinely error-free balance test as 0, not as "not done"', () => {
    const f = blank()
    f.mBessDoubleErrors = 0
    f.mBessTandemErrors = 0
    f.mBessSingleErrors = 0
    expect(isBalanceAdministered(f)).toBe(true)
    expect(calculateMBESS(f)).toBe(0)
  })

  it('refuses a /30 total while a stance is missing', () => {
    const f = blank()
    f.mBessDoubleErrors = 2
    f.mBessTandemErrors = 4
    expect(isBalanceAdministered(f)).toBe(false)
    expect(calculateMBESS(f)).toBeNull()
  })

  it('totals the optional foam column only when complete', () => {
    const f = blank()
    f.mBessFoamDoubleErrors = 1
    f.mBessFoamTandemErrors = 5
    expect(calculateMBESSFoam(f)).toBeNull()
    f.mBessFoamSingleErrors = 9
    expect(calculateMBESSFoam(f)).toBe(15)
  })
})

describe('timed tandem gait', () => {
  it('averages three trials and reports the fastest', () => {
    const f = blank()
    f.tandemGaitTrial1 = '14.2'
    f.tandemGaitTrial2 = '13.0'
    f.tandemGaitTrial3 = '12.4'
    expect(calculateTandemGaitAverage(f)).toBe('13.20')
    expect(calculateTandemGaitFastest(f)).toBe('12.40')
  })

  it('does not pass a 1- or 2-trial mean off as an "Average 3 Trials"', () => {
    const f = blank()
    f.tandemGaitTrial1 = '14.2'
    expect(calculateTandemGaitAverage(f)).toBe('')
    expect(calculateTandemGaitFastest(f)).toBe('14.20')
    f.tandemGaitTrial2 = '13.0'
    expect(calculateTandemGaitAverage(f)).toBe('')
  })
})

describe('complex tandem gait and dual task', () => {
  it('totals forward + backward only when all four counts exist', () => {
    const f = blank()
    f.complexTandemForwardEyesOpen = 1
    f.complexTandemForwardEyesClosed = 3
    expect(calculateComplexTandemForward(f)).toBe(4)
    expect(calculateComplexTandemBackward(f)).toBeNull()
    expect(calculateComplexTandemTotal(f)).toBeNull()

    f.complexTandemBackwardEyesOpen = 2
    f.complexTandemBackwardEyesClosed = 5
    expect(calculateComplexTandemBackward(f)).toBe(7)
    expect(calculateComplexTandemTotal(f)).toBe(11)
    expect(isComplexTandemAdministered(f)).toBe(true)
  })

  it('records a flawless complex tandem gait as 0 points', () => {
    const f = blank()
    f.complexTandemForwardEyesOpen = 0
    f.complexTandemForwardEyesClosed = 0
    f.complexTandemBackwardEyesOpen = 0
    f.complexTandemBackwardEyesClosed = 0
    expect(isComplexTandemAdministered(f)).toBe(true)
    expect(calculateComplexTandemTotal(f)).toBe(0)
  })

  it('computes dual-task accuracy only from real trial counts', () => {
    const f = blank()
    f.dualTaskTrialsAttempted = 10
    f.dualTaskTrialsCorrect = 8
    expect(calculateDualTaskAccuracy(f)).toBe('0.80')

    const zeroAttempts = blank()
    zeroAttempts.dualTaskTrialsAttempted = 0
    zeroAttempts.dualTaskTrialsCorrect = 0
    expect(calculateDualTaskAccuracy(zeroAttempts)).toBe('')

    const halfEntered = blank()
    halfEntered.dualTaskTrialsAttempted = 5
    expect(calculateDualTaskAccuracy(halfEntered)).toBe('')
  })
})

describe('mVOMS provocation', () => {
  it('never turns an unrated row into "no provocation"', () => {
    const f = blank()
    expect(isMvomsRowAdministered(f.mvomsVORHorizontal)).toBe(false)
  })

  it('accepts a rated row, including an all-zero (reassuring) one', () => {
    const f = blank()
    f.mvomsVORHorizontal.headache = 0
    f.mvomsVORHorizontal.dizziness = 0
    f.mvomsVORHorizontal.nausea = 0
    f.mvomsVORHorizontal.fogginess = 0
    expect(isMvomsRowAdministered(f.mvomsVORHorizontal)).toBe(true)
  })

  it('lets the explicit Not Tested flag win over any stray rating', () => {
    const f = blank()
    f.mvomsVMS.notTested = true
    f.mvomsVMS.headache = 4
    expect(isMvomsRowAdministered(f.mvomsVMS)).toBe(false)
  })

  it('gates the baseline row on its own ratings', () => {
    const f = blank()
    f.mvomsBaseline.dizziness = 2
    expect(isMvomsBaselineAdministered(f)).toBe(true)
  })
})

describe('mental-health and sleep screens', () => {
  it('scores GAD-7 out of 21 with the published severity bands', () => {
    const f = blank()
    f.gad7_1 = 3; f.gad7_2 = 3; f.gad7_3 = 3; f.gad7_4 = 3
    f.gad7_5 = 3; f.gad7_6 = 3; f.gad7_7 = 3
    expect(calculateGAD7(f)).toBe(21)
    expect(getGAD7Severity(21)).toBe('Severe anxiety')
    expect(getGAD7Severity(4)).toBe('Minimal anxiety')
    expect(getGAD7Severity(5)).toBe('Mild anxiety')
    expect(getGAD7Severity(9)).toBe('Mild anxiety')
    expect(getGAD7Severity(10)).toBe('Moderate anxiety')
    expect(getGAD7Severity(14)).toBe('Moderate anxiety')
    expect(getGAD7Severity(15)).toBe('Severe anxiety')
  })

  it('never reports "minimal anxiety" for a screen nobody administered', () => {
    const untouched = blank()
    expect(isGAD7Administered(untouched)).toBe(false)
    expect(calculateGAD7(untouched)).toBeNull()

    const flagged = blank()
    flagged.gad7NotDone = true
    flagged.gad7_1 = 3
    expect(isGAD7Administered(flagged)).toBe(false)
    expect(calculateGAD7(flagged)).toBeNull()
  })

  it('refuses a /21 while any item is unanswered', () => {
    const f = blank()
    f.gad7_1 = 0; f.gad7_2 = 0; f.gad7_3 = 0
    f.gad7_4 = 0; f.gad7_5 = 0; f.gad7_6 = 0
    expect(calculateGAD7(f)).toBeNull()
    // All seven answered "not at all" IS a valid screen: score 0, minimal.
    f.gad7_7 = 0
    expect(calculateGAD7(f)).toBe(0)
    expect(getGAD7Severity(0)).toBe('Minimal anxiety')
  })

  it('refuses a PHQ-2 or sleep score while an item is unanswered', () => {
    const phq = blank()
    phq.phq2_1 = 3
    expect(calculatePHQ2(phq)).toBeNull()
    phq.phq2_2 = 0
    expect(calculatePHQ2(phq)).toBe(3)

    const sleep = blank()
    sleep.sleep1 = 2; sleep.sleep2 = 1; sleep.sleep3 = 0; sleep.sleep4 = 0
    expect(calculateSleepScore(sleep)).toBeNull()
    sleep.sleep5 = 0
    expect(calculateSleepScore(sleep)).toBe(3)
  })

  it('scores PHQ-2 out of 6', () => {
    const f = blank()
    f.phq2_1 = 3
    f.phq2_2 = 3
    expect(calculatePHQ2(f)).toBe(6)
    expect(isPHQ2Administered(f)).toBe(true)
  })

  it('scores the sleep screen out of 17 with its severity bands', () => {
    const f = blank()
    f.sleep1 = 4; f.sleep2 = 4; f.sleep3 = 3; f.sleep4 = 3; f.sleep5 = 3
    expect(calculateSleepScore(f)).toBe(17)
    expect(getSleepSeverity(17)).toBe('Severe')
    expect(getSleepSeverity(4)).toBe('Normal')
    expect(getSleepSeverity(5)).toBe('Mild')
    expect(getSleepSeverity(7)).toBe('Mild')
    expect(getSleepSeverity(8)).toBe('Moderate')
    expect(getSleepSeverity(10)).toBe('Moderate')
    expect(getSleepSeverity(11)).toBe('Severe')
    expect(isSleepAdministered(f)).toBe(true)
  })

  it('never reports "Normal" sleep for a screen nobody administered', () => {
    const f = blank()
    expect(isSleepAdministered(f)).toBe(false)
  })
})
