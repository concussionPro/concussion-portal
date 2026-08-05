import { describe, it, expect } from 'vitest'
import {
  getDefaultSCAT6FormData,
  type SCAT6FormData,
} from '@/app/scat-forms/shared/types/scat6.types'
import {
  calculateSymptomNumber,
  calculateSymptomSeverity,
  countSymptomsRated,
  isSymptomsAdministered,
  calculateOrientation,
  isOrientationAdministered,
  calculateImmediateMemory,
  isImmediateMemoryAdministered,
  calculateMonthsScore,
  calculateConcentration,
  calculateDelayedRecall,
  isDelayedRecallAdministered,
  calculateTotalCognitive,
  calculateMBESS,
  calculateMBESSFoam,
  isBalanceAdministered,
  calculateTandemGaitFastest,
  calculateTandemGaitAverage,
  calculateDualTaskFastest,
  delayedRecallIntervalMinutes,
  getAllCalculatedScores,
} from '@/app/scat-forms/shared/utils/scat6-calculations'
import { drawYesNo, anyProvided, notAdministeredMark } from '@/app/scat-forms/shared/utils/pdf-draw-helpers'

/**
 * SCAT6 clinical-record integrity.
 *
 * Instrument reference: Echemendia RJ, et al. Br J Sports Med 2023;57:622-631
 * (the flat form shipped at public/docs/SCAT6_Flat.pdf). Maximums asserted
 * here are the form's own printed denominators:
 *   symptoms 22 / severity 132 / orientation 5 / immediate memory 30 /
 *   digits 4 / months 1 / concentration 5 / delayed recall 10 /
 *   cognitive total 50 / mBESS 10 per stance, 30 total.
 */

const symptomKeys = Object.keys(getDefaultSCAT6FormData().symptoms) as Array<
  keyof SCAT6FormData['symptoms']
>

function ratedSymptoms(value: number): SCAT6FormData['symptoms'] {
  const out = {} as SCAT6FormData['symptoms']
  symptomKeys.forEach(k => {
    out[k] = value
  })
  return out
}

describe('SCAT6 — an untouched form asserts nothing', () => {
  const blank = getDefaultSCAT6FormData()

  it('has 22 symptom items, all unrated', () => {
    expect(symptomKeys).toHaveLength(22)
    expect(countSymptomsRated(blank.symptoms)).toBe(0)
    expect(isSymptomsAdministered(blank.symptoms)).toBe(false)
  })

  it('reports every scored section as not administered', () => {
    expect(isOrientationAdministered(blank)).toBe(false)
    expect(isImmediateMemoryAdministered(blank)).toBe(false)
    expect(isDelayedRecallAdministered(blank)).toBe(false)
    expect(isBalanceAdministered(blank)).toBe(false)
  })

  it('produces NO totals — not zeros', () => {
    expect(calculateMonthsScore(blank)).toBeNull()
    expect(calculateConcentration(blank)).toBeNull()
    expect(calculateTotalCognitive(blank)).toBeNull()
    expect(calculateMBESS(blank)).toBeNull()
    expect(calculateMBESSFoam(blank)).toBeNull()
    expect(calculateTandemGaitFastest(blank)).toBe('')
    expect(calculateTandemGaitAverage(blank)).toBe('')
    expect(calculateDualTaskFastest(blank)).toBe('')
    expect(delayedRecallIntervalMinutes(blank)).toBeNull()
  })

  it('never asserts a negative medical history that was not taken', () => {
    expect(blank.hospitalizedForHeadInjury).toBeNull()
    expect(blank.headacheDisorder).toBeNull()
    expect(blank.learningDisability).toBeNull()
    expect(blank.adhd).toBeNull()
    expect(blank.psychologicalDisorder).toBeNull()

    // drawYesNo is what puts the mark on the paper.
    const marks: unknown[] = []
    const page = { drawCircle: (o: unknown) => marks.push(o), drawText: (o: unknown) => marks.push(o) }
    drawYesNo(page as never, 10, 20, 30, blank.adhd, undefined as never, 9)
    expect(marks).toHaveLength(0)
    drawYesNo(page as never, 10, 20, 30, false, undefined as never, 9)
    expect(marks).toHaveLength(1) // an explicit "No" still prints
  })

  it('leaves no serial-assessment column populated', () => {
    const dd = blank.decisionDates
    expect(dd.symptomNumber1).toBeNull()
    expect(dd.orientation2).toBeNull()
    expect(dd.mBessTotal3).toBeNull()
  })
})

describe('SCAT6 — a genuine zero is still reported', () => {
  it('orientation 0/5 (all five asked, all wrong) is administered and scores 0', () => {
    const fd: SCAT6FormData = {
      ...getDefaultSCAT6FormData(),
      orientationMonth: false,
      orientationDate: false,
      orientationDayOfWeek: false,
      orientationYear: false,
      orientationTime: false,
    }
    expect(isOrientationAdministered(fd)).toBe(true)
    expect(calculateOrientation(fd)).toBe(0)
  })

  it('mBESS 0 errors of 30 is administered and scores 0', () => {
    const fd: SCAT6FormData = {
      ...getDefaultSCAT6FormData(),
      mBessDoubleErrors: 0,
      mBessTandemErrors: 0,
      mBessSingleErrors: 0,
    }
    expect(isBalanceAdministered(fd)).toBe(true)
    expect(calculateMBESS(fd)).toBe(0)
  })

  it('a symptom scale answered entirely "none" scores 0 of 22 and 0 of 132', () => {
    const symptoms = ratedSymptoms(0)
    expect(isSymptomsAdministered(symptoms)).toBe(true)
    expect(calculateSymptomNumber(symptoms)).toBe(0)
    expect(calculateSymptomSeverity(symptoms)).toBe(0)
  })
})

describe('SCAT6 — symptom arithmetic', () => {
  it('maxes at 22 symptoms / severity 132', () => {
    const symptoms = ratedSymptoms(6)
    expect(calculateSymptomNumber(symptoms)).toBe(22)
    expect(calculateSymptomSeverity(symptoms)).toBe(132)
  })

  it('counts only rated items and ignores unrated ones', () => {
    const symptoms = { ...ratedSymptoms(0), headaches: 4, dizziness: 2, neckPain: null }
    expect(countSymptomsRated(symptoms)).toBe(21)
    expect(calculateSymptomNumber(symptoms)).toBe(2)
    expect(calculateSymptomSeverity(symptoms)).toBe(6)
  })
})

describe('SCAT6 — concentration: "1 point if no errors and completion under 30 seconds"', () => {
  const base = getDefaultSCAT6FormData()

  it('awards the point for 0 errors under 30 s', () => {
    const fd = { ...base, monthsReverseErrors: 0, monthsReverseTime: '28.5' }
    expect(calculateMonthsScore(fd)).toBe(1)
  })

  it('withholds the point at 30 s or slower', () => {
    expect(calculateMonthsScore({ ...base, monthsReverseErrors: 0, monthsReverseTime: '30' })).toBe(0)
    expect(calculateMonthsScore({ ...base, monthsReverseErrors: 0, monthsReverseTime: '31' })).toBe(0)
  })

  it('withholds the point when there were errors, regardless of time', () => {
    expect(calculateMonthsScore({ ...base, monthsReverseErrors: 2, monthsReverseTime: '' })).toBe(0)
    expect(calculateMonthsScore({ ...base, monthsReverseErrors: 1, monthsReverseTime: '12' })).toBe(0)
  })

  it('will not decide the point with 0 errors but no recorded time', () => {
    expect(calculateMonthsScore({ ...base, monthsReverseErrors: 0 })).toBeNull()
  })

  it('needs BOTH halves before printing a concentration score of 5', () => {
    expect(calculateConcentration({ ...base, digitsBackward: 4 })).toBeNull()
    expect(calculateConcentration({ ...base, monthsReverseErrors: 0, monthsReverseTime: '20' })).toBeNull()
    expect(
      calculateConcentration({ ...base, digitsBackward: 4, monthsReverseErrors: 0, monthsReverseTime: '20' })
    ).toBe(5)
    expect(
      calculateConcentration({ ...base, digitsBackward: 0, monthsReverseErrors: 3, monthsReverseTime: '45' })
    ).toBe(0)
  })
})

describe('SCAT6 — cognitive total of 50', () => {
  const complete = (): SCAT6FormData => ({
    ...getDefaultSCAT6FormData(),
    orientationMonth: true,
    orientationDate: true,
    orientationDayOfWeek: true,
    orientationYear: true,
    orientationTime: true,
    wordListUsed: 'A',
    immediateMemoryTrial1: Array(10).fill(true),
    immediateMemoryTrial2: Array(10).fill(true),
    immediateMemoryTrial3: Array(10).fill(true),
    digitsBackward: 4,
    monthsReverseErrors: 0,
    monthsReverseTime: '15',
    delayedRecallStartTime: '10:30',
    delayedRecall: Array(10).fill(true),
  })

  it('is 5 + 30 + 5 + 10 = 50 at ceiling', () => {
    const fd = complete()
    expect(calculateOrientation(fd)).toBe(5)
    expect(calculateImmediateMemory(fd)).toBe(30)
    expect(calculateConcentration(fd)).toBe(5)
    expect(calculateDelayedRecall(fd)).toBe(10)
    expect(calculateTotalCognitive(fd)).toBe(50)
  })

  it('sums a mixed but complete assessment', () => {
    const fd = complete()
    fd.orientationTime = false // 4/5
    fd.immediateMemoryTrial3 = [true, true, true, true, true, false, false, false, false, false] // 10+10+5
    fd.digitsBackward = 2
    fd.monthsReverseTime = '41' // months 0 -> concentration 2
    fd.delayedRecall = [true, true, true, false, false, false, false, false, false, false] // 3
    expect(calculateOrientation(fd)).toBe(4)
    expect(calculateImmediateMemory(fd)).toBe(25)
    expect(calculateConcentration(fd)).toBe(2)
    expect(calculateDelayedRecall(fd)).toBe(3)
    expect(calculateTotalCognitive(fd)).toBe(34)
  })

  it('refuses a partial total — a skipped subtest never silently lowers the /50', () => {
    const noRecall = complete()
    noRecall.delayedRecallStartTime = ''
    noRecall.delayedRecall = Array(10).fill(false)
    expect(isDelayedRecallAdministered(noRecall)).toBe(false)
    expect(calculateTotalCognitive(noRecall)).toBeNull()

    const noDigits = complete()
    noDigits.digitsBackward = null
    expect(calculateTotalCognitive(noDigits)).toBeNull()

    const noMemory = complete()
    noMemory.wordListUsed = ''
    noMemory.immediateMemoryTrial1 = Array(10).fill(false)
    noMemory.immediateMemoryTrial2 = Array(10).fill(false)
    noMemory.immediateMemoryTrial3 = Array(10).fill(false)
    noMemory.immediateMemoryTimeCompleted = ''
    expect(isImmediateMemoryAdministered(noMemory)).toBe(false)
    expect(calculateTotalCognitive(noMemory)).toBeNull()
  })
})

describe('SCAT6 — mBESS of 30', () => {
  const base = getDefaultSCAT6FormData()

  it('sums the three stances', () => {
    const fd = { ...base, mBessDoubleErrors: 1, mBessTandemErrors: 4, mBessSingleErrors: 7 }
    expect(calculateMBESS(fd)).toBe(12)
  })

  it('reaches the instrument ceiling of 30 at 10 errors per stance', () => {
    const fd = { ...base, mBessDoubleErrors: 10, mBessTandemErrors: 10, mBessSingleErrors: 10 }
    expect(calculateMBESS(fd)).toBe(30)
  })

  it('will not total a partially performed mBESS', () => {
    const fd = { ...base, mBessDoubleErrors: 3, mBessTandemErrors: null, mBessSingleErrors: null }
    expect(isBalanceAdministered(fd)).toBe(false)
    expect(calculateMBESS(fd)).toBeNull()
  })

  it('keeps the optional foam block independent and nullable', () => {
    const fd = { ...base, mBessFoamDoubleErrors: 2, mBessFoamTandemErrors: 3, mBessFoamSingleErrors: 4 }
    expect(calculateMBESSFoam(fd)).toBe(9)
    expect(calculateMBESSFoam({ ...fd, mBessFoamSingleErrors: null })).toBeNull()
  })
})

describe('SCAT6 — timing', () => {
  const base = getDefaultSCAT6FormData()

  it('takes the FASTEST tandem gait trial and averages only completed trials', () => {
    const fd = { ...base, tandemGaitTrial1: '14.2', tandemGaitTrial2: '12.8', tandemGaitTrial3: '' }
    expect(calculateTandemGaitFastest(fd)).toBe('12.80')
    expect(calculateTandemGaitAverage(fd)).toBe('13.50')
  })

  it('measures the delayed-recall interval and flags one taken too early', () => {
    expect(
      delayedRecallIntervalMinutes({
        ...base,
        immediateMemoryTimeCompleted: '10:20',
        delayedRecallStartTime: '10:26',
      })
    ).toBe(6)
    expect(
      delayedRecallIntervalMinutes({
        ...base,
        immediateMemoryTimeCompleted: '10:20',
        delayedRecallStartTime: '10:23',
      })
    ).toBe(3)
    // across midnight, never negative
    expect(
      delayedRecallIntervalMinutes({
        ...base,
        immediateMemoryTimeCompleted: '23:58',
        delayedRecallStartTime: '00:07',
      })
    ).toBe(9)
    // one time missing -> no interval invented
    expect(
      delayedRecallIntervalMinutes({ ...base, delayedRecallStartTime: '10:23' })
    ).toBeNull()
  })
})

describe('SCAT6 — export helpers', () => {
  it('anyProvided treats 0 / false / blank as "not provided"', () => {
    expect(anyProvided(0, false, '', null, undefined)).toBe(false)
    expect(anyProvided(0, false, 'A')).toBe(true)
    expect(anyProvided(0, true)).toBe(true)
  })

  it('falls back to an ASCII dash when the font cannot encode an em dash', () => {
    expect(notAdministeredMark(undefined)).toBe('-')
  })
})

describe('SCAT6 — the summary object handed to the UI', () => {
  it('marks an untouched form as administered-nowhere', () => {
    const s = getAllCalculatedScores(getDefaultSCAT6FormData())
    expect(s.symptomsAdministered).toBe(false)
    expect(s.orientationAdministered).toBe(false)
    expect(s.balanceAdministered).toBe(false)
    expect(s.concentration).toBeNull()
    expect(s.totalCognitive).toBeNull()
    expect(s.mBessTotal).toBeNull()
  })
})
