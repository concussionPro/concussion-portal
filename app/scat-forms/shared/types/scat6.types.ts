// Complete SCAT6 form data structure matching the PDF

export interface SCAT6FormData {
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

  // Symptoms (22 items rated 0-6)
  symptoms: {
    headaches: number
    pressureInHead: number
    neckPain: number
    nauseaVomiting: number
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
    fatigueOrLowEnergy: number
    confusion: number
    drowsiness: number
    moreEmotional: number
    irritability: number
    sadness: number
    nervousAnxious: number
    troubleFallingAsleep: number
  }
  percentOfNormal: string
  whyNotHundredPercent: string
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
  // Optional foam
  mBessFoamDoubleErrors: number | null
  mBessFoamTandemErrors: number | null
  mBessFoamSingleErrors: number | null

  // Tandem Gait
  tandemGaitTrial1: string
  tandemGaitTrial2: string
  tandemGaitTrial3: string

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

  // Any trials not completed
  trialsNotCompleted: boolean
  trialsNotCompletedReason: string

  // Delayed Recall (same 10 words after 5+ minutes)
  delayedRecallStartTime: string
  delayedRecall: boolean[] // 10 words

  // Different from usual self
  differentFromUsual: boolean | null
  differentFromUsualDescription: string

  // Decision tracking dates (3 columns)
  decisionDates: {
    date1: string
    neurologicalExam1: 'Normal' | 'Abnormal' | ''
    symptomNumber1: number
    symptomSeverity1: number
    orientation1: number
    immediateMemory1: number
    concentration1: number
    delayedRecall1: number
    cognitiveTotal1: number
    mBessTotal1: number
    tandemGaitFastest1: string
    dualTaskFastest1: string

    date2: string
    neurologicalExam2: 'Normal' | 'Abnormal' | ''
    symptomNumber2: number
    symptomSeverity2: number
    orientation2: number
    immediateMemory2: number
    concentration2: number
    delayedRecall2: number
    cognitiveTotal2: number
    mBessTotal2: number
    tandemGaitFastest2: string
    dualTaskFastest2: string

    date3: string
    neurologicalExam3: 'Normal' | 'Abnormal' | ''
    symptomNumber3: number
    symptomSeverity3: number
    orientation3: number
    immediateMemory3: number
    concentration3: number
    delayedRecall3: number
    cognitiveTotal3: number
    mBessTotal3: number
    tandemGaitFastest3: string
    dualTaskFastest3: string
  }

  // Disposition
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
export const getDefaultSCAT6FormData = (): SCAT6FormData => ({
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

  symptoms: {
    headaches: 0,
    pressureInHead: 0,
    neckPain: 0,
    nauseaVomiting: 0,
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
    fatigueOrLowEnergy: 0,
    confusion: 0,
    drowsiness: 0,
    moreEmotional: 0,
    irritability: 0,
    sadness: 0,
    nervousAnxious: 0,
    troubleFallingAsleep: 0,
  },
  percentOfNormal: '',
  whyNotHundredPercent: '',
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

  differentFromUsual: null,
  differentFromUsualDescription: '',

  decisionDates: {
    date1: '',
    neurologicalExam1: '',
    symptomNumber1: 0,
    symptomSeverity1: 0,
    orientation1: 0,
    immediateMemory1: 0,
    concentration1: 0,
    delayedRecall1: 0,
    cognitiveTotal1: 0,
    mBessTotal1: 0,
    tandemGaitFastest1: '',
    dualTaskFastest1: '',

    date2: '',
    neurologicalExam2: '',
    symptomNumber2: 0,
    symptomSeverity2: 0,
    orientation2: 0,
    immediateMemory2: 0,
    concentration2: 0,
    delayedRecall2: 0,
    cognitiveTotal2: 0,
    mBessTotal2: 0,
    tandemGaitFastest2: '',
    dualTaskFastest2: '',

    date3: '',
    neurologicalExam3: '',
    symptomNumber3: 0,
    symptomSeverity3: 0,
    orientation3: 0,
    immediateMemory3: 0,
    concentration3: 0,
    delayedRecall3: 0,
    cognitiveTotal3: 0,
    mBessTotal3: 0,
    tandemGaitFastest3: '',
    dualTaskFastest3: '',
  },

  concussionDiagnosed: '',

  hcpName: '',
  hcpSignature: '',
  hcpTitle: '',
  hcpRegistration: '',
  hcpDate: '',

  additionalClinicalNotes: '',
})
