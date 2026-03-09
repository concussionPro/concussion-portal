// Child SCAT6 form data structure
// For children aged 5-12 years
// Key differences from adult SCAT6:
// - 21 child-report symptoms rated 0-3 (not 0-6)
// - 21 parent-report symptoms rated 0-3
// - Overall "how do you feel" rating 0-10
// - Parent overall rating 0-10

export interface ChildSCAT6FormData {
  // Demographics
  athleteName: string
  idNumber: string
  dateOfBirth: string
  dateOfExamination: string
  dateOfInjury: string
  timeOfInjury: string
  sex: 'Male' | 'Female' | 'Prefer Not To Say' | 'Other' | ''
  dominantHand: 'Left' | 'Right' | 'Ambidextrous' | ''
  sportTeamSchool: string
  currentYear: string
  yearsEducation: string
  firstLanguage: string
  preferredLanguage: string
  examiner: string

  // Concussion History
  previousConcussions: string
  mostRecentConcussion: string
  primarySymptoms: string
  recoveryTime: string

  // Athlete Background
  hospitalizedForHeadInjury: boolean
  headacheDisorder: boolean
  learningDisability: boolean
  adhd: boolean
  psychologicalDisorder: boolean
  athleteBackgroundNotes: string
  currentMedications: string

  // Child Symptom Report (21 items, 0-3 scale)
  // 0 = "Not at all", 1 = "A little bit", 2 = "Somewhat", 3 = "A lot"
  childSymptoms: {
    headache: number
    pressureInHead: number
    neckPain: number
    feelingSickOrNausea: number
    dizziness: number
    blurredVision: number
    balanceProblems: number
    sensitivityLight: number
    sensitivityNoise: number
    feelingSlowedDown: number
    feelingInFog: number
    dontFeelRight: number
    difficultyConcentrating: number
    difficultyRemembering: number
    tiredOrLowEnergy: number
    confused: number
    drowsy: number
    moreEmotional: number
    irritable: number
    sad: number
    nervousOrAnxious: number
  }
  childOverallRating: number // 0-10 scale "How do you feel?"

  // Parent Report (21 items, 0-3 scale)
  parentSymptoms: {
    headache: number
    pressureInHead: number
    neckPain: number
    sickOrNausea: number
    dizziness: number
    blurredVision: number
    balanceProblems: number
    sensitivityLight: number
    sensitivityNoise: number
    feelingSlowedDown: number
    feelingInFog: number
    doesntFeelRight: number
    difficultyConcentrating: number
    difficultyRemembering: number
    tiredOrLowEnergy: number
    confused: number
    drowsy: number
    moreEmotional: number
    irritable: number
    sad: number
    nervousOrAnxious: number
  }
  parentOverallRating: number // 0-10 scale

  // Worse with physical/mental
  symptomsWorseWithPhysical: boolean | null
  symptomsWorseWithMental: boolean | null

  // Cognitive Screening - Orientation (5 items, 1 point each)
  orientationMonth: boolean
  orientationDate: boolean
  orientationDayOfWeek: boolean
  orientationYear: boolean
  orientationTime: boolean

  // Immediate Memory (3 trials of 10 words, List A/B/C)
  wordListUsed: 'A' | 'B' | 'C' | ''
  immediateMemoryTrial1: boolean[] // 10 words
  immediateMemoryTrial2: boolean[] // 10 words
  immediateMemoryTrial3: boolean[] // 10 words
  immediateMemoryTimeCompleted: string

  // Concentration - Digits Backwards
  digitListUsed: 'A' | 'B' | 'C' | ''
  digitsBackward: number // 0-4 score

  // Concentration - Months in Reverse
  monthsReverseTime: string
  monthsReverseErrors: number

  // Balance - mBESS (3 stances, 10 errors each)
  footTested: 'Left' | 'Right' | ''
  testingSurface: string
  footwear: string
  mBessDoubleErrors: number
  mBessTandemErrors: number
  mBessSingleErrors: number
  mBessFoamDoubleErrors: number | null
  mBessFoamTandemErrors: number | null
  mBessFoamSingleErrors: number | null

  // Tandem Gait
  tandemGaitTrial1: string
  tandemGaitTrial2: string
  tandemGaitTrial3: string

  // Complex Tandem Gait (child-specific: forward/backward)
  complexTandemForwardEyesOpen: number
  complexTandemForwardEyesClosed: number
  complexTandemBackwardEyesOpen: number
  complexTandemBackwardEyesClosed: number

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

  // Trials not completed
  trialsNotCompleted: boolean
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
  yearsEducation: '',
  firstLanguage: '',
  preferredLanguage: '',
  examiner: '',

  previousConcussions: '',
  mostRecentConcussion: '',
  primarySymptoms: '',
  recoveryTime: '',

  hospitalizedForHeadInjury: false,
  headacheDisorder: false,
  learningDisability: false,
  adhd: false,
  psychologicalDisorder: false,
  athleteBackgroundNotes: '',
  currentMedications: '',

  childSymptoms: {
    headache: 0,
    pressureInHead: 0,
    neckPain: 0,
    feelingSickOrNausea: 0,
    dizziness: 0,
    blurredVision: 0,
    balanceProblems: 0,
    sensitivityLight: 0,
    sensitivityNoise: 0,
    feelingSlowedDown: 0,
    feelingInFog: 0,
    dontFeelRight: 0,
    difficultyConcentrating: 0,
    difficultyRemembering: 0,
    tiredOrLowEnergy: 0,
    confused: 0,
    drowsy: 0,
    moreEmotional: 0,
    irritable: 0,
    sad: 0,
    nervousOrAnxious: 0,
  },
  childOverallRating: 0,

  parentSymptoms: {
    headache: 0,
    pressureInHead: 0,
    neckPain: 0,
    sickOrNausea: 0,
    dizziness: 0,
    blurredVision: 0,
    balanceProblems: 0,
    sensitivityLight: 0,
    sensitivityNoise: 0,
    feelingSlowedDown: 0,
    feelingInFog: 0,
    doesntFeelRight: 0,
    difficultyConcentrating: 0,
    difficultyRemembering: 0,
    tiredOrLowEnergy: 0,
    confused: 0,
    drowsy: 0,
    moreEmotional: 0,
    irritable: 0,
    sad: 0,
    nervousOrAnxious: 0,
  },
  parentOverallRating: 0,

  symptomsWorseWithPhysical: null,
  symptomsWorseWithMental: null,

  orientationMonth: false,
  orientationDate: false,
  orientationDayOfWeek: false,
  orientationYear: false,
  orientationTime: false,

  wordListUsed: '',
  immediateMemoryTrial1: Array(10).fill(false),
  immediateMemoryTrial2: Array(10).fill(false),
  immediateMemoryTrial3: Array(10).fill(false),
  immediateMemoryTimeCompleted: '',

  digitListUsed: '',
  digitsBackward: 0,

  monthsReverseTime: '',
  monthsReverseErrors: 0,

  footTested: '',
  testingSurface: '',
  footwear: '',
  mBessDoubleErrors: 0,
  mBessTandemErrors: 0,
  mBessSingleErrors: 0,
  mBessFoamDoubleErrors: null,
  mBessFoamTandemErrors: null,
  mBessFoamSingleErrors: null,

  tandemGaitTrial1: '',
  tandemGaitTrial2: '',
  tandemGaitTrial3: '',

  complexTandemForwardEyesOpen: 0,
  complexTandemForwardEyesClosed: 0,
  complexTandemBackwardEyesOpen: 0,
  complexTandemBackwardEyesClosed: 0,

  dualTaskPracticeErrors: null,
  dualTaskPracticeTime: '',
  dualTask1Errors: null,
  dualTask1Time: '',
  dualTask2Errors: null,
  dualTask2Time: '',
  dualTask3Errors: null,
  dualTask3Time: '',
  dualTaskAlternateStartingInteger: '',

  trialsNotCompleted: false,
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
