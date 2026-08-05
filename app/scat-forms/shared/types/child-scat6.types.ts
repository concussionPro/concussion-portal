// Child SCAT6 form data structure
// For children aged 8-12 years
//
// GROUND TRUTH: public/docs/Child_SCAT6_Flat.pdf (Davis GA et al, BJSM 2023;57:636-647).
// Every item list and printed maximum below was read off that document, NOT
// inferred from the adult SCAT6. The two instruments differ:
//   - 21 child-report symptoms rated 0-3 (adult: 22 items rated 0-6)
//   - 21 parent-report symptoms rated 0-3, WORDED DIFFERENTLY to the child items
//   - NO orientation subtest at all (the adult SCAT6 has 5 items / 5 points)
//   - Concentration = Digits Backward (of 5) + Days in reverse (of 1) = of 6
//     (adult: digits of 4 + MONTHS in reverse of 1 = of 5)
//   - Cognitive total = Immediate Memory 30 + Concentration 6 + Delayed Recall 10 = of 46
//   - Child overall rating 0-10 (10 = normal); parent overall rating 0-100% (100% = normal)
//
// NULLABLE NUMBERS: every scored field where 0 is a real clinical finding is
// `number | null` and defaults to null. `null` means "not administered / not
// recorded" and prints blank or a dash; 0 means the clinician recorded a zero.
// Collapsing the two is how an untouched form ends up asserting "0 errors of
// 30" (perfect balance) or "0 of 21 symptoms" (an asymptomatic child).

/** Symptom item keys, in the order the items are PRINTED on the Child SCAT6. */
export const CHILD_SCAT6_SYMPTOM_KEYS = [
  'headaches',
  'dizzy',
  'roomSpinning',
  'goingToFaint',
  'thingsBlurry',
  'seeDouble',
  'sickToStomach',
  'tiredALot',
  'tiredEasily',
  'troublePayingAttention',
  'distractedEasily',
  'hardTimeConcentrating',
  'problemsRemembering',
  'problemsFollowingDirections',
  'daydreams',
  'getsConfused',
  'forgetful',
  'problemsFinishingThings',
  'problemSolving',
  'problemsLearning',
  'neckHurts',
] as const

export type ChildSCAT6SymptomKey = (typeof CHILD_SCAT6_SYMPTOM_KEYS)[number]

/**
 * The Child SCAT6 prints its three immediate-memory word lists in a DIFFERENT
 * order to the adult SCAT6 that `shared/constants/wordLists.ts` encodes:
 * child List A is adult List B, child List B is adult List C, child List C is
 * adult List A. Showing the clinician the adult list for the selected letter
 * means the words read to the child are not the words printed (and ticked) on
 * the exported form.
 */
export const CHILD_SCAT6_WORD_LIST_SOURCE: Record<'A' | 'B' | 'C', 'A' | 'B' | 'C'> = {
  A: 'B',
  B: 'C',
  C: 'A',
}

/** One 0-3 rating per item; null = the item was not rated. */
export type ChildSCAT6SymptomScores = Record<ChildSCAT6SymptomKey, number | null>

export const CHILD_SCAT6_SYMPTOM_COUNT = CHILD_SCAT6_SYMPTOM_KEYS.length // 21
export const CHILD_SCAT6_SYMPTOM_MAX_SEVERITY = CHILD_SCAT6_SYMPTOM_COUNT * 3 // 63

export interface ChildSCAT6FormData {
  // Demographics
  athleteName: string
  idNumber: string
  dateOfBirth: string
  dateOfExamination: string
  dateOfInjury: string
  timeOfInjury: string
  sex: 'Male' | 'Female' | 'Prefer Not To Say' | ''
  dominantHand: 'Left' | 'Right' | 'Ambidextrous' | ''
  sportTeamSchool: string
  currentYear: string
  firstLanguage: string
  preferredLanguage: string
  examiner: string

  // Concussion History
  previousConcussions: string
  mostRecentConcussion: string
  primarySymptoms: string
  recoveryTime: string

  // Child Background ("Has the child ever been...") — null = not asked
  hospitalizedForHeadInjury: boolean | null
  headacheDisorder: boolean | null
  learningDisability: boolean | null
  adhd: boolean | null
  psychologicalDisorder: boolean | null
  athleteBackgroundNotes: string
  currentMedications: string

  // Child Symptom Report (21 items, 0-3 scale)
  // 0 = "Not at all/never", 1 = "A little/rarely", 2 = "Somewhat/sometimes", 3 = "A lot/often"
  childSymptoms: ChildSCAT6SymptomScores
  /** "On a scale of 0 to 10 (where 10 is normal), how do you feel now?" */
  childOverallRating: number | null
  childSymptomsWorseWithPhysical: boolean | null
  childSymptomsWorseWithMental: boolean | null

  // Parent Report (same 21 items, 0-3 scale, parent wording)
  parentSymptoms: ChildSCAT6SymptomScores
  /** "On a scale of 0 to 100% (where 100% is normal), how would you rate the child now?" */
  parentOverallPercent: number | null
  parentSymptomsWorseWithPhysical: boolean | null
  parentSymptomsWorseWithMental: boolean | null

  // Immediate Memory (3 trials of 10 words, List A/B/C)
  wordListUsed: 'A' | 'B' | 'C' | ''
  immediateMemoryTrial1: boolean[] // 10 words
  immediateMemoryTrial2: boolean[] // 10 words
  immediateMemoryTrial3: boolean[] // 10 words
  immediateMemoryTimeCompleted: string

  // Concentration — Digits Backwards (5 levels: 2,3,4,5,6 digits → score of 5)
  digitListUsed: 'A' | 'B' | 'C' | ''
  digitsBackward: number | null // 0-5

  // Concentration — DAYS of the week in reverse (Child SCAT6 does NOT use months)
  daysReverseTime: string
  daysReverseErrors: number | null

  // Balance - mBESS (3 stances, 10 errors each)
  footTested: 'Left' | 'Right' | ''
  testingSurface: string
  footwear: string
  mBessDoubleErrors: number | null
  mBessTandemErrors: number | null
  mBessSingleErrors: number | null
  mBessFoamDoubleErrors: number | null
  mBessFoamTandemErrors: number | null
  mBessFoamSingleErrors: number | null

  // Tandem Gait
  tandemGaitTrial1: string
  tandemGaitTrial2: string
  tandemGaitTrial3: string

  // Complex Tandem Gait (child-specific: forward/backward, error POINTS)
  complexTandemForwardEyesOpen: number | null
  complexTandemForwardEyesClosed: number | null
  complexTandemBackwardEyesOpen: number | null
  complexTandemBackwardEyesClosed: number | null

  // Dual Task Gait
  dualTaskPracticeErrors: number | null
  dualTaskPracticeTime: string
  dualTask1Errors: number | null
  dualTask1Time: string
  dualTask2Errors: number | null
  dualTask2Time: string
  dualTask3Errors: number | null
  dualTask3Time: string
  dualTaskAlternateStartingInteger: string

  // "Were any single- or dual-task timed tandem gait trials not completed?"
  trialsNotCompleted: boolean | null
  trialsNotCompletedReason: string

  // Delayed Recall (same 10 words after 5+ minutes)
  delayedRecallStartTime: string
  delayedRecall: boolean[] // 10 words

  // Decision / Disposition
  concussionDiagnosed: 'Yes' | 'No' | 'Deferred' | ''

  // HCP Attestation
  hcpName: string
  hcpSignature: string
  hcpTitle: string
  hcpRegistration: string
  hcpDate: string

  // Clinical Notes
  additionalClinicalNotes: string
}

/** All 21 items unrated. */
export const getDefaultChildSCAT6Symptoms = (): ChildSCAT6SymptomScores =>
  CHILD_SCAT6_SYMPTOM_KEYS.reduce((acc, key) => {
    acc[key] = null
    return acc
  }, {} as ChildSCAT6SymptomScores)

// Initialize with default values
export const getDefaultChildSCAT6FormData = (): ChildSCAT6FormData => ({
  athleteName: '',
  idNumber: '',
  dateOfBirth: '',
  dateOfExamination: '',
  dateOfInjury: '',
  timeOfInjury: '',
  sex: '',
  dominantHand: '',
  sportTeamSchool: '',
  currentYear: '',
  firstLanguage: '',
  preferredLanguage: '',
  examiner: '',

  previousConcussions: '',
  mostRecentConcussion: '',
  primarySymptoms: '',
  recoveryTime: '',

  hospitalizedForHeadInjury: null,
  headacheDisorder: null,
  learningDisability: null,
  adhd: null,
  psychologicalDisorder: null,
  athleteBackgroundNotes: '',
  currentMedications: '',

  childSymptoms: getDefaultChildSCAT6Symptoms(),
  childOverallRating: null,
  childSymptomsWorseWithPhysical: null,
  childSymptomsWorseWithMental: null,

  parentSymptoms: getDefaultChildSCAT6Symptoms(),
  parentOverallPercent: null,
  parentSymptomsWorseWithPhysical: null,
  parentSymptomsWorseWithMental: null,

  wordListUsed: '',
  immediateMemoryTrial1: Array(10).fill(false),
  immediateMemoryTrial2: Array(10).fill(false),
  immediateMemoryTrial3: Array(10).fill(false),
  immediateMemoryTimeCompleted: '',

  digitListUsed: '',
  digitsBackward: null,

  daysReverseTime: '',
  daysReverseErrors: null,

  footTested: '',
  testingSurface: '',
  footwear: '',
  mBessDoubleErrors: null,
  mBessTandemErrors: null,
  mBessSingleErrors: null,
  mBessFoamDoubleErrors: null,
  mBessFoamTandemErrors: null,
  mBessFoamSingleErrors: null,

  tandemGaitTrial1: '',
  tandemGaitTrial2: '',
  tandemGaitTrial3: '',

  complexTandemForwardEyesOpen: null,
  complexTandemForwardEyesClosed: null,
  complexTandemBackwardEyesOpen: null,
  complexTandemBackwardEyesClosed: null,

  dualTaskPracticeErrors: null,
  dualTaskPracticeTime: '',
  dualTask1Errors: null,
  dualTask1Time: '',
  dualTask2Errors: null,
  dualTask2Time: '',
  dualTask3Errors: null,
  dualTask3Time: '',
  dualTaskAlternateStartingInteger: '',

  trialsNotCompleted: null,
  trialsNotCompletedReason: '',

  delayedRecallStartTime: '',
  delayedRecall: Array(10).fill(false),

  concussionDiagnosed: '',

  hcpName: '',
  hcpSignature: '',
  hcpTitle: '',
  hcpRegistration: '',
  hcpDate: '',

  additionalClinicalNotes: '',
})

/**
 * Merge an untrusted saved draft into the current shape.
 *
 * Drafts are localStorage JSON written by older builds of this form, whose
 * symptom keys were the ADULT SCAT6 item names and whose "not recorded" values
 * were 0/false rather than null. Restoring one of those verbatim would
 * silently re-introduce fabricated zeros, so anything that is not recognisably
 * of the current shape is dropped back to its default.
 */
export const normalizeChildSCAT6Draft = (raw: unknown): ChildSCAT6FormData => {
  const base = getDefaultChildSCAT6FormData()
  if (!raw || typeof raw !== 'object') return base
  const draft = raw as Record<string, unknown>

  const out = { ...base }
  for (const key of Object.keys(base) as (keyof ChildSCAT6FormData)[]) {
    const value = draft[key]
    if (value === undefined) continue
    if (key === 'childSymptoms' || key === 'parentSymptoms') continue
    const expected = base[key]
    if (Array.isArray(expected)) {
      if (Array.isArray(value) && value.length === expected.length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(out as any)[key] = value
      }
      continue
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(out as any)[key] = value
  }

  for (const scale of ['childSymptoms', 'parentSymptoms'] as const) {
    const saved = draft[scale]
    if (!saved || typeof saved !== 'object') continue
    const savedScores = saved as Record<string, unknown>
    const merged = getDefaultChildSCAT6Symptoms()
    for (const key of CHILD_SCAT6_SYMPTOM_KEYS) {
      const v = savedScores[key]
      if (typeof v === 'number' && v >= 0 && v <= 3) merged[key] = v
    }
    out[scale] = merged
  }

  return out
}
