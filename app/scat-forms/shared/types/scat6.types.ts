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
  // `null` = never asked. These print as Yes/No on the exported record, so a
  // `false` default would assert a negative medical history the athlete was
  // never asked about (no head-injury admission, no ADHD, no depression).
  hospitalizedForHeadInjury: boolean | null
  headacheDisorder: boolean | null
  learningDisability: boolean | null
  adhd: boolean | null
  psychologicalDisorder: boolean | null
  athleteBackgroundNotes: string
  currentMedications: string

  // Symptoms (22 items rated 0-6). `null` = not rated; 0 = rated "none".
  symptoms: {
    headaches: number | null
    pressureInHead: number | null
    neckPain: number | null
    nauseaVomiting: number | null
    dizziness: number | null
    blurredVision: number | null
    balanceProblems: number | null
    sensitivityLight: number | null
    sensitivityNoise: number | null
    feelingSlowedDown: number | null
    feelingInFog: number | null
    dontFeelRight: number | null
    difficultyConcentrating: number | null
    difficultyRemembering: number | null
    fatigueOrLowEnergy: number | null
    confusion: number | null
    drowsiness: number | null
    moreEmotional: number | null
    irritability: number | null
    sadness: number | null
    nervousAnxious: number | null
    troubleFallingAsleep: number | null
  }
  percentOfNormal: string
  whyNotHundredPercent: string
  symptomsWorseWithPhysical: boolean | null
  symptomsWorseWithMental: boolean | null

  // Cognitive Screening - Orientation (5 items, 1 point each)
  // `null` = not asked, `false` = asked and answered incorrectly. Without the
  // null state a genuine 0/5 (profound disorientation) is indistinguishable
  // from an untouched form, so neither can be reported honestly.
  orientationMonth: boolean | null
  orientationDate: boolean | null
  orientationDayOfWeek: boolean | null
  orientationYear: boolean | null
  orientationTime: boolean | null

  // Immediate Memory (3 trials of 10 words, List A/B/C)
  wordListUsed: 'A' | 'B' | 'C' | ''
  immediateMemoryTrial1: boolean[] // 10 words
  immediateMemoryTrial2: boolean[] // 10 words
  immediateMemoryTrial3: boolean[] // 10 words
  immediateMemoryTimeCompleted: string

  // Concentration - Digits Backwards
  digitListUsed: 'A' | 'B' | 'C' | ''
  digitsBackward: number | null // 0-4 score, null = not administered

  // Concentration - Months in Reverse
  monthsReverseTime: string
  monthsReverseErrors: number | null

  // Balance - mBESS (3 stances, 10 errors each)
  footTested: 'Left' | 'Right' | ''
  testingSurface: string
  footwear: string
  // null = stance not performed. 0 errors of 10 is a PERFECT result and must
  // never be asserted by default.
  mBessDoubleErrors: number | null
  mBessTandemErrors: number | null
  mBessSingleErrors: number | null
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
    symptomNumber1: number | null
    symptomSeverity1: number | null
    orientation1: number | null
    immediateMemory1: number | null
    concentration1: number | null
    delayedRecall1: number | null
    cognitiveTotal1: number | null
    mBessTotal1: number | null
    tandemGaitFastest1: string
    dualTaskFastest1: string

    date2: string
    neurologicalExam2: 'Normal' | 'Abnormal' | ''
    symptomNumber2: number | null
    symptomSeverity2: number | null
    orientation2: number | null
    immediateMemory2: number | null
    concentration2: number | null
    delayedRecall2: number | null
    cognitiveTotal2: number | null
    mBessTotal2: number | null
    tandemGaitFastest2: string
    dualTaskFastest2: string

    date3: string
    neurologicalExam3: 'Normal' | 'Abnormal' | ''
    symptomNumber3: number | null
    symptomSeverity3: number | null
    orientation3: number | null
    immediateMemory3: number | null
    concentration3: number | null
    delayedRecall3: number | null
    cognitiveTotal3: number | null
    mBessTotal3: number | null
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

  hospitalizedForHeadInjury: null,
  headacheDisorder: null,
  learningDisability: null,
  adhd: null,
  psychologicalDisorder: null,
  athleteBackgroundNotes: '',
  currentMedications: '',

  symptoms: {
    headaches: null,
    pressureInHead: null,
    neckPain: null,
    nauseaVomiting: null,
    dizziness: null,
    blurredVision: null,
    balanceProblems: null,
    sensitivityLight: null,
    sensitivityNoise: null,
    feelingSlowedDown: null,
    feelingInFog: null,
    dontFeelRight: null,
    difficultyConcentrating: null,
    difficultyRemembering: null,
    fatigueOrLowEnergy: null,
    confusion: null,
    drowsiness: null,
    moreEmotional: null,
    irritability: null,
    sadness: null,
    nervousAnxious: null,
    troubleFallingAsleep: null,
  },
  percentOfNormal: '',
  whyNotHundredPercent: '',
  symptomsWorseWithPhysical: null,
  symptomsWorseWithMental: null,

  orientationMonth: null,
  orientationDate: null,
  orientationDayOfWeek: null,
  orientationYear: null,
  orientationTime: null,

  wordListUsed: '',
  immediateMemoryTrial1: Array(10).fill(false),
  immediateMemoryTrial2: Array(10).fill(false),
  immediateMemoryTrial3: Array(10).fill(false),
  immediateMemoryTimeCompleted: '',

  digitListUsed: '',
  digitsBackward: null,

  monthsReverseTime: '',
  monthsReverseErrors: null,

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
    symptomNumber1: null,
    symptomSeverity1: null,
    orientation1: null,
    immediateMemory1: null,
    concentration1: null,
    delayedRecall1: null,
    cognitiveTotal1: null,
    mBessTotal1: null,
    tandemGaitFastest1: '',
    dualTaskFastest1: '',

    date2: '',
    neurologicalExam2: '',
    symptomNumber2: null,
    symptomSeverity2: null,
    orientation2: null,
    immediateMemory2: null,
    concentration2: null,
    delayedRecall2: null,
    cognitiveTotal2: null,
    mBessTotal2: null,
    tandemGaitFastest2: '',
    dualTaskFastest2: '',

    date3: '',
    neurologicalExam3: '',
    symptomNumber3: null,
    symptomSeverity3: null,
    orientation3: null,
    immediateMemory3: null,
    concentration3: null,
    delayedRecall3: null,
    cognitiveTotal3: null,
    mBessTotal3: null,
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
