import { describe, it, expect } from 'vitest'
import {
  getDefaultChildSCAT6FormData,
  getDefaultChildSCAT6Symptoms,
  normalizeChildSCAT6Draft,
  CHILD_SCAT6_SYMPTOM_KEYS,
  CHILD_SCAT6_WORD_LIST_SOURCE,
  type ChildSCAT6FormData,
  type ChildSCAT6SymptomScores,
} from '@/app/scat-forms/shared/types/child-scat6.types'
import {
  CHILD_SCAT6_MAX,
  calculateSymptomNumber,
  calculateSymptomSeverity,
  countSymptomsRated,
  isSymptomScaleComplete,
  calculateImmediateMemory,
  calculateDaysReverse,
  calculateConcentration,
  calculateDelayedRecall,
  calculateTotalCognitive,
  calculateMBESS,
  calculateMBESSFoam,
  calculateTandemGaitAverage,
  calculateTandemGaitFastest,
  calculateComplexTandemForward,
  calculateComplexTandemTotal,
  calculateDualTaskFastest,
  getAllCalculatedScores,
} from '@/app/scat-forms/shared/utils/child-scat6-calculations'
import { WORD_LISTS } from '@/app/scat-forms/shared/constants/wordLists'

/**
 * Child SCAT6 clinical-integrity tests.
 *
 * Ground truth: public/docs/Child_SCAT6_Flat.pdf (Davis GA et al, BJSM
 * 2023;57:637-648). The Step 6 decision table prints these maximums:
 *   Symptom number of 21 (child + parent), Symptom severity of 63,
 *   Immediate Memory of 30, Concentration of 6, Delayed Recall of 10,
 *   Cognitive Total of 46, mBESS Total Errors of 30.
 * There is NO orientation subtest on the Child SCAT6, and concentration is
 * Digits Backward (of 5) + DAYS of the week in reverse (of 1) — not months.
 *
 * The defect class under test: an untouched or partly completed form must not
 * produce a clinical value the clinician never entered.
 */

const form = (overrides: Partial<ChildSCAT6FormData> = {}): ChildSCAT6FormData => ({
  ...getDefaultChildSCAT6FormData(),
  ...overrides,
})

const rate = (values: Partial<Record<string, number>>): ChildSCAT6SymptomScores => {
  const scores = getDefaultChildSCAT6Symptoms()
  for (const [key, value] of Object.entries(values)) {
    scores[key as keyof ChildSCAT6SymptomScores] = value ?? null
  }
  return scores
}

const allRated = (value: number): ChildSCAT6SymptomScores => {
  const scores = getDefaultChildSCAT6Symptoms()
  for (const key of CHILD_SCAT6_SYMPTOM_KEYS) scores[key] = value
  return scores
}

describe('instrument shape', () => {
  it('has 21 symptom items rated 0-3, max severity 63', () => {
    expect(CHILD_SCAT6_SYMPTOM_KEYS).toHaveLength(21)
    expect(CHILD_SCAT6_MAX.symptomNumber).toBe(21)
    expect(CHILD_SCAT6_MAX.symptomSeverity).toBe(63)
    expect(calculateSymptomSeverity(allRated(3))).toBe(63)
    expect(calculateSymptomNumber(allRated(3))).toBe(21)
  })

  it('prints the Child SCAT6 maximums, not the adult SCAT6 ones', () => {
    expect(CHILD_SCAT6_MAX.digitsBackward).toBe(5) // adult SCAT6 is 4
    expect(CHILD_SCAT6_MAX.concentration).toBe(6)  // adult SCAT6 is 5
    expect(CHILD_SCAT6_MAX.immediateMemory).toBe(30)
    expect(CHILD_SCAT6_MAX.delayedRecall).toBe(10)
    expect(CHILD_SCAT6_MAX.cognitiveTotal).toBe(46) // 30 + 6 + 10, no orientation
    expect(CHILD_SCAT6_MAX.mBessTotal).toBe(30)
    expect(CHILD_SCAT6_MAX.mBessPerStance).toBe(10)
  })

  it('cognitive total maximum is the sum of its three subtests', () => {
    expect(
      CHILD_SCAT6_MAX.immediateMemory + CHILD_SCAT6_MAX.concentration + CHILD_SCAT6_MAX.delayedRecall
    ).toBe(CHILD_SCAT6_MAX.cognitiveTotal)
  })

  it('concentration maximum is digits + days', () => {
    expect(CHILD_SCAT6_MAX.digitsBackward + CHILD_SCAT6_MAX.daysReverse).toBe(
      CHILD_SCAT6_MAX.concentration
    )
  })

  it('maps child word lists onto the correctly worded shared list', () => {
    // Child SCAT6 List A is printed as Finger/Penny/... which the shared
    // (adult SCAT6) constants call List B.
    expect(WORD_LISTS[CHILD_SCAT6_WORD_LIST_SOURCE.A][0]).toBe('Finger')
    expect(WORD_LISTS[CHILD_SCAT6_WORD_LIST_SOURCE.B][0]).toBe('Baby')
    expect(WORD_LISTS[CHILD_SCAT6_WORD_LIST_SOURCE.C][0]).toBe('Jacket')
  })
})

describe('an untouched form scores nothing', () => {
  const blank = form()

  it('reports null (not 0) for every scored section', () => {
    const scores = getAllCalculatedScores(blank)
    expect(scores.childSymptomNumber).toBeNull()
    expect(scores.childSymptomSeverity).toBeNull()
    expect(scores.parentSymptomNumber).toBeNull()
    expect(scores.parentSymptomSeverity).toBeNull()
    expect(scores.immediateMemory).toBeNull()
    expect(scores.daysReverse).toBeNull()
    expect(scores.concentration).toBeNull()
    expect(scores.delayedRecall).toBeNull()
    expect(scores.totalCognitive).toBeNull()
    expect(scores.mBessTotal).toBeNull()
    expect(scores.mBessFoamTotal).toBeNull()
    expect(scores.complexTandemForward).toBeNull()
    expect(scores.complexTandemTotal).toBeNull()
  })

  it('never asserts a perfect balance result', () => {
    // "0 errors of 30" is a flawless mBESS. It must be impossible to produce
    // one without the clinician scoring all three stances.
    expect(calculateMBESS(blank)).toBeNull()
    expect(calculateMBESS(form({ mBessDoubleErrors: 0, mBessTandemErrors: 0 }))).toBeNull()
    expect(
      calculateMBESS(form({ mBessDoubleErrors: 0, mBessTandemErrors: 0, mBessSingleErrors: 0 }))
    ).toBe(0)
  })

  it('never asserts an asymptomatic child', () => {
    expect(calculateSymptomNumber(blank.childSymptoms)).toBeNull()
    expect(calculateSymptomNumber(blank.parentSymptoms)).toBeNull()
  })

  it('leaves the overall ratings unrecorded (0/10 and 0% are the WORST answers)', () => {
    expect(blank.childOverallRating).toBeNull()
    expect(blank.parentOverallPercent).toBeNull()
  })

  it('produces no timing values', () => {
    expect(calculateTandemGaitAverage(blank)).toBe('')
    expect(calculateTandemGaitFastest(blank)).toBe('')
    expect(calculateDualTaskFastest(blank)).toBe('')
  })
})

describe('genuine zeros are preserved', () => {
  it('scores a rated-zero symptom scale as 0, not as not-administered', () => {
    const scores = allRated(0)
    expect(isSymptomScaleComplete(scores)).toBe(true)
    expect(calculateSymptomNumber(scores)).toBe(0)
    expect(calculateSymptomSeverity(scores)).toBe(0)
  })

  it('scores an administered but failed subtest as 0', () => {
    const failed = form({
      wordListUsed: 'A',
      immediateMemoryTimeCompleted: '10:30',
      digitsBackward: 0,
      daysReverseErrors: 3,
      daysReverseTime: '45',
      delayedRecallStartTime: '10:40',
    })
    expect(calculateImmediateMemory(failed)).toBe(0)
    expect(calculateDaysReverse(failed)).toBe(0)
    expect(calculateConcentration(failed)).toBe(0)
    expect(calculateDelayedRecall(failed)).toBe(0)
    expect(calculateTotalCognitive(failed)).toBe(0)
  })
})

describe('symptom scales', () => {
  it('counts endorsed items and sums severity over rated items only', () => {
    const scores = rate({ headaches: 3, dizzy: 0, neckHurts: 2 })
    expect(countSymptomsRated(scores)).toBe(3)
    expect(isSymptomScaleComplete(scores)).toBe(false)
    expect(calculateSymptomNumber(scores)).toBe(2) // headaches + neckHurts
    expect(calculateSymptomSeverity(scores)).toBe(5)
  })

  it('is only complete when all 21 items are rated', () => {
    const scores = allRated(1)
    scores.neckHurts = null
    expect(countSymptomsRated(scores)).toBe(20)
    expect(isSymptomScaleComplete(scores)).toBe(false)
    scores.neckHurts = 1
    expect(isSymptomScaleComplete(scores)).toBe(true)
    expect(calculateSymptomSeverity(scores)).toBe(21)
  })
})

describe('concentration = digits (of 5) + days in reverse (of 1)', () => {
  it('awards the days point only for no errors under 30 seconds', () => {
    expect(calculateDaysReverse(form({ daysReverseErrors: 0, daysReverseTime: '18.4' }))).toBe(1)
    expect(calculateDaysReverse(form({ daysReverseErrors: 0, daysReverseTime: '31' }))).toBe(0)
    expect(calculateDaysReverse(form({ daysReverseErrors: 1, daysReverseTime: '12' }))).toBe(0)
    // errors recorded but no time: the under-30-seconds half is unverified
    expect(calculateDaysReverse(form({ daysReverseErrors: 0 }))).toBe(0)
    expect(calculateDaysReverse(form({ daysReverseTime: '12' }))).toBeNull()
  })

  it('reaches the printed maximum of 6', () => {
    const perfect = form({ digitsBackward: 5, daysReverseErrors: 0, daysReverseTime: '15' })
    expect(calculateConcentration(perfect)).toBe(6)
    expect(calculateConcentration(perfect)).toBeLessThanOrEqual(CHILD_SCAT6_MAX.concentration)
  })

  it('reports nothing when only one half was administered', () => {
    // Half a concentration score printed against "of 6" reads as impairment.
    expect(calculateConcentration(form({ digitsBackward: 4 }))).toBeNull()
    expect(
      calculateConcentration(form({ daysReverseErrors: 0, daysReverseTime: '15' }))
    ).toBeNull()
  })
})

describe('immediate memory and delayed recall', () => {
  const ticks = (n: number) => Array.from({ length: 10 }, (_, i) => i < n)

  it('sums three trials of ten words to a maximum of 30', () => {
    const f = form({
      wordListUsed: 'A',
      immediateMemoryTrial1: ticks(10),
      immediateMemoryTrial2: ticks(10),
      immediateMemoryTrial3: ticks(10),
    })
    expect(calculateImmediateMemory(f)).toBe(30)
    expect(f.immediateMemoryTrial1).toHaveLength(10)
  })

  it('sums partial trials correctly', () => {
    const f = form({
      wordListUsed: 'B',
      immediateMemoryTrial1: ticks(4),
      immediateMemoryTrial2: ticks(7),
      immediateMemoryTrial3: ticks(9),
    })
    expect(calculateImmediateMemory(f)).toBe(20)
  })

  it('treats a chosen word list as evidence the subtest was run', () => {
    expect(calculateImmediateMemory(form({ wordListUsed: 'A' }))).toBe(0)
    expect(calculateImmediateMemory(form())).toBeNull()
  })

  it('scores delayed recall out of 10 and only when it was given', () => {
    expect(calculateDelayedRecall(form({ delayedRecall: ticks(7) }))).toBe(7)
    expect(calculateDelayedRecall(form({ delayedRecallStartTime: '10:45' }))).toBe(0)
    expect(calculateDelayedRecall(form())).toBeNull()
  })
})

describe('cognitive total of 46', () => {
  const complete = form({
    wordListUsed: 'A',
    immediateMemoryTrial1: Array(10).fill(true),
    immediateMemoryTrial2: Array(10).fill(true),
    immediateMemoryTrial3: Array(10).fill(true),
    digitsBackward: 5,
    daysReverseErrors: 0,
    daysReverseTime: '14',
    delayedRecallStartTime: '10:50',
    delayedRecall: Array(10).fill(true),
  })

  it('totals a perfect assessment to exactly the printed maximum', () => {
    expect(calculateTotalCognitive(complete)).toBe(CHILD_SCAT6_MAX.cognitiveTotal)
    expect(calculateTotalCognitive(complete)).toBe(30 + 6 + 10)
  })

  it('refuses to total when a contributing subtest was skipped', () => {
    // Summing two of three subtests against a printed "of 46" reads as
    // impairment the child does not have.
    expect(calculateTotalCognitive(form({ ...complete, digitsBackward: null }))).toBeNull()
    expect(calculateTotalCognitive(form({ ...complete, delayedRecallStartTime: '', delayedRecall: Array(10).fill(false) }))).toBeNull()
    expect(calculateTotalCognitive(form({
      ...complete,
      wordListUsed: '',
      immediateMemoryTimeCompleted: '',
      immediateMemoryTrial1: Array(10).fill(false),
      immediateMemoryTrial2: Array(10).fill(false),
      immediateMemoryTrial3: Array(10).fill(false),
    }))).toBeNull()
  })
})

describe('balance and gait', () => {
  it('caps at 10 errors per stance and 30 in total', () => {
    const worst = form({ mBessDoubleErrors: 10, mBessTandemErrors: 10, mBessSingleErrors: 10 })
    expect(calculateMBESS(worst)).toBe(CHILD_SCAT6_MAX.mBessTotal)
  })

  it('sums the three firm-surface stances', () => {
    expect(calculateMBESS(form({ mBessDoubleErrors: 1, mBessTandemErrors: 4, mBessSingleErrors: 6 }))).toBe(11)
  })

  it('keeps the optional foam total independent of the firm surface', () => {
    const f = form({
      mBessDoubleErrors: 0,
      mBessTandemErrors: 0,
      mBessSingleErrors: 2,
      mBessFoamDoubleErrors: 1,
      mBessFoamTandemErrors: 3,
    })
    expect(calculateMBESS(f)).toBe(2)
    expect(calculateMBESSFoam(f)).toBeNull()
    expect(calculateMBESSFoam(form({ ...f, mBessFoamSingleErrors: 5 }))).toBe(9)
  })

  it('averages tandem gait only when all three trials were timed', () => {
    expect(calculateTandemGaitAverage(form({ tandemGaitTrial1: '12', tandemGaitTrial2: '11' }))).toBe('')
    expect(
      calculateTandemGaitAverage(form({ tandemGaitTrial1: '12', tandemGaitTrial2: '11', tandemGaitTrial3: '10' }))
    ).toBe('11.00')
  })

  it('reports the fastest completed trial', () => {
    expect(
      calculateTandemGaitFastest(form({ tandemGaitTrial1: '12.5', tandemGaitTrial2: '9.25' }))
    ).toBe('9.25')
    expect(
      calculateDualTaskFastest(form({ dualTask1Time: '19', dualTask2Time: '17.5', dualTask3Time: '21' }))
    ).toBe('17.50')
  })

  it('totals complex tandem gait points only when both directions were scored', () => {
    const forwardOnly = form({
      complexTandemForwardEyesOpen: 1,
      complexTandemForwardEyesClosed: 2,
    })
    expect(calculateComplexTandemForward(forwardOnly)).toBe(3)
    expect(calculateComplexTandemTotal(forwardOnly)).toBeNull()
    expect(
      calculateComplexTandemTotal(
        form({ ...forwardOnly, complexTandemBackwardEyesOpen: 0, complexTandemBackwardEyesClosed: 4 })
      )
    ).toBe(7)
  })
})

describe('draft normalisation', () => {
  it('drops an old adult-keyed symptom draft rather than importing its zeros', () => {
    const legacyDraft = {
      athleteName: 'Test Child',
      childSymptoms: {
        headache: 0, pressureInHead: 0, neckPain: 0, feelingSickOrNausea: 0, dizziness: 0,
        blurredVision: 0, balanceProblems: 0, sensitivityLight: 0, sensitivityNoise: 0,
        feelingSlowedDown: 0, feelingInFog: 0, dontFeelRight: 0, difficultyConcentrating: 0,
        difficultyRemembering: 0, tiredOrLowEnergy: 0, confused: 0, drowsy: 0,
        moreEmotional: 0, irritable: 0, sad: 0, nervousOrAnxious: 0,
      },
      mBessDoubleErrors: 0,
      orientationMonth: false,
    }
    const restored = normalizeChildSCAT6Draft(legacyDraft)
    expect(restored.athleteName).toBe('Test Child')
    expect(calculateSymptomNumber(restored.childSymptoms)).toBeNull()
    expect(countSymptomsRated(restored.childSymptoms)).toBe(0)
    // A legacy 0 for a stance is indistinguishable from "not scored", but it
    // arrives as a number, so it is kept as an explicit 0 — the whole point is
    // that the CURRENT form can no longer create one by accident.
    expect(restored.mBessDoubleErrors).toBe(0)
    expect('orientationMonth' in restored).toBe(false)
  })

  it('keeps real ratings from a current-shape draft', () => {
    const draft = { childSymptoms: { headaches: 3, neckHurts: 1 } }
    const restored = normalizeChildSCAT6Draft(draft)
    expect(restored.childSymptoms.headaches).toBe(3)
    expect(restored.childSymptoms.neckHurts).toBe(1)
    expect(restored.childSymptoms.dizzy).toBeNull()
    expect(calculateSymptomSeverity(restored.childSymptoms)).toBe(4)
  })

  it('rejects junk', () => {
    expect(normalizeChildSCAT6Draft(null).athleteName).toBe('')
    expect(normalizeChildSCAT6Draft('nope').athleteName).toBe('')
    expect(normalizeChildSCAT6Draft({ immediateMemoryTrial1: [true] }).immediateMemoryTrial1).toHaveLength(10)
  })
})
