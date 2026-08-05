// Complete SCOAT6 form data structure matching the PDF
// Sport Concussion Office Assessment Tool - For office-based assessment (3-30 days post-injury)

export interface SCOAT6FormData {
  // Page 1: Demographics
  athleteName: string
  idNumber: string
  dateOfBirth: string
  age: string
  sex: 'Male' | 'Female' | 'Prefer Not To Say' | 'Other' | ''
  dominantHand: 'Left' | 'Right' | 'Ambidextrous' | ''
  sportTeamSchool: string
  yearsEducation: string
  firstLanguage: string
  preferredLanguage: string
  dateOfExamination: string
  clinician: string

  // Page 2: Current Injury
  removalFromPlay: 'Immediate' | 'Walked off' | 'Continued to play' | 'Assisted off' | 'Stretchered off' | ''
  continuedToPlayMinutes: string
  dateOfInjury: string
  injuryDescription: string
  dateSymptomsFirstAppeared: string
  dateSymptomsFirstReported: string

  // History of Head Injuries (3 rows)
  headInjuries: Array<{
    date: string
    description: string
    management: string
  }>

  // History of Disorders
  disorders: {
    migraine: { checked: boolean; yearDiagnosed: string; management: string }
    chronicHeadache: { checked: boolean; yearDiagnosed: string; management: string }
    depression: { checked: boolean; yearDiagnosed: string; management: string }
    anxiety: { checked: boolean; yearDiagnosed: string; management: string }
    syncope: { checked: boolean; yearDiagnosed: string; management: string }
    epilepsy: { checked: boolean; yearDiagnosed: string; management: string }
    adhd: { checked: boolean; yearDiagnosed: string; management: string }
    learningDisorder: { checked: boolean; yearDiagnosed: string; management: string }
    other: { checked: boolean; name: string; yearDiagnosed: string; management: string }
  }

  // Page 3: Medications
  medications: Array<{
    item: string
    dose: string
    frequency: string
    reasonTaken: string
  }>

  // Family History
  familyHistory: Array<{
    familyMember: string
    depression: boolean
    anxiety: boolean
    adhd: boolean
    learningDisorder: boolean
    migraine: boolean
    other: string
    management: string
  }>
  familyHistoryNotes: string

  // Pages 4-5: Symptoms (24 symptoms with 5 date columns)
  symptoms: {
    headaches: { preInjury: number; dayInjured: number; consult1: number; consult2: number; consult3: number }
    pressureInHead: { preInjury: number; dayInjured: number; consult1: number; consult2: number; consult3: number }
    neckPain: { preInjury: number; dayInjured: number; consult1: number; consult2: number; consult3: number }
    nauseaVomiting: { preInjury: number; dayInjured: number; consult1: number; consult2: number; consult3: number }
    dizziness: { preInjury: number; dayInjured: number; consult1: number; consult2: number; consult3: number }
    blurredVision: { preInjury: number; dayInjured: number; consult1: number; consult2: number; consult3: number }
    balanceProblems: { preInjury: number; dayInjured: number; consult1: number; consult2: number; consult3: number }
    sensitivityLight: { preInjury: number; dayInjured: number; consult1: number; consult2: number; consult3: number }
    sensitivityNoise: { preInjury: number; dayInjured: number; consult1: number; consult2: number; consult3: number }
    feelingSlowedDown: { preInjury: number; dayInjured: number; consult1: number; consult2: number; consult3: number }
    feelingInFog: { preInjury: number; dayInjured: number; consult1: number; consult2: number; consult3: number }
    difficultyConcentrating: { preInjury: number; dayInjured: number; consult1: number; consult2: number; consult3: number }
    difficultyRemembering: { preInjury: number; dayInjured: number; consult1: number; consult2: number; consult3: number }
    fatigueOrLowEnergy: { preInjury: number; dayInjured: number; consult1: number; consult2: number; consult3: number }
    confusion: { preInjury: number; dayInjured: number; consult1: number; consult2: number; consult3: number }
    drowsiness: { preInjury: number; dayInjured: number; consult1: number; consult2: number; consult3: number }
    moreEmotional: { preInjury: number; dayInjured: number; consult1: number; consult2: number; consult3: number }
    irritability: { preInjury: number; dayInjured: number; consult1: number; consult2: number; consult3: number }
    sadness: { preInjury: number; dayInjured: number; consult1: number; consult2: number; consult3: number }
    nervousAnxious: { preInjury: number; dayInjured: number; consult1: number; consult2: number; consult3: number }
    sleepDisturbance: { preInjury: number; dayInjured: number; consult1: number; consult2: number; consult3: number }
    abnormalHeartRate: { preInjury: number; dayInjured: number; consult1: number; consult2: number; consult3: number }
    excessiveSweating: { preInjury: number; dayInjured: number; consult1: number; consult2: number; consult3: number }
    other: { name: string; preInjury: number; dayInjured: number; consult1: number; consult2: number; consult3: number }
  }
  symptomDates: {
    dayInjured: string
    consult1: string
    consult2: string
    consult3: string
  }
  symptomsWorseWithPhysical: boolean | null
  symptomsWorseWithMental: boolean | null
  percentOfNormal: string

  // Pages 5-6: Cognitive Tests
  wordListUsed: 'A' | 'B' | 'C' | ''
  immediateMemoryTrial1: boolean[] // 10 words
  immediateMemoryTrial2: boolean[] // 10 words
  immediateMemoryTrial3: boolean[] // 10 words
  immediateMemoryTimeCompleted: string

  // Alternate 15-word list
  alternate15WordTotal: number | null

  digitListUsed: 'A' | 'B' | 'C' | ''
  /** 0-4. `null` = not administered — a scored 0 is a real (severe) finding. */
  digitsBackward: number | null

  monthsReverseTime: string
  /** `null` = not administered; 0 = a genuine error-free recitation. */
  monthsReverseErrors: number | null

  // Pages 7-8: Examination
  // Orthostatic Vital Signs
  orthostaticsSupineBP: string
  orthostaticsSupineHR: string
  /** `null` = not asked. `false` is the clinical assertion "no orthostatic symptoms". */
  orthostaticsSupineSymptoms: boolean | null
  orthostaticsSupineSymptomsDescription: string
  orthostaticsStandingBP: string
  orthostaticsStandingHR: string
  orthostaticsStandingSymptoms: boolean | null
  orthostaticsStandingSymptomsDescription: string
  orthostaticsSupineResult: 'Normal' | 'Abnormal' | ''
  orthostaticsStandingResult: 'Normal' | 'Abnormal' | ''

  // Cervical Spine Assessment
  cervicalMuscleSpasm: 'Normal' | 'Abnormal' | ''
  cervicalMidlineTenderness: 'Normal' | 'Abnormal' | ''
  cervicalParavertebralTenderness: 'Normal' | 'Abnormal' | ''
  cervicalFlexion: 'Normal' | 'Abnormal' | ''
  cervicalExtension: 'Normal' | 'Abnormal' | ''
  cervicalRightLateralFlexion: 'Normal' | 'Abnormal' | ''
  cervicalLeftLateralFlexion: 'Normal' | 'Abnormal' | ''
  cervicalRightRotation: 'Normal' | 'Abnormal' | ''
  cervicalLeftRotation: 'Normal' | 'Abnormal' | ''

  // Neurological Examination
  cranialNerves: 'Normal' | 'Abnormal' | 'Not tested' | ''
  cranialNervesNotes: string
  limbTone: 'Normal' | 'Abnormal' | 'Not tested' | ''
  strength: 'Normal' | 'Abnormal' | 'Not tested' | ''
  deepTendonReflexes: 'Normal' | 'Abnormal' | 'Not tested' | ''
  sensation: 'Normal' | 'Abnormal' | 'Not tested' | ''
  cerebellarFunction: 'Normal' | 'Abnormal' | 'Not tested' | ''
  neurologicalComments: string

  // Balance - mBESS
  footTested: 'Left' | 'Right' | ''
  /** Errors per stance, 0-10. `null` = stance not performed — 0 errors is a
   *  PERFECT balance result and must never be manufactured by a default. */
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
  tandemGaitAbnormal: boolean

  // Page 9: Complex & Dual Task Gait
  // `null` = not performed; 0 points = a genuine flawless performance.
  complexTandemForwardEyesOpen: number | null
  complexTandemForwardEyesClosed: number | null
  complexTandemBackwardEyesOpen: number | null
  complexTandemBackwardEyesClosed: number | null

  dualTaskCognitiveTask: 'Words' | 'Serial 7s' | 'Months' | ''
  dualTaskTrialsAttempted: number | null
  dualTaskTrialsCorrect: number | null
  dualTaskAverageTime: string
  dualTaskComments: string

  // Page 10: mVOMS
  // Provocation ratings 0-10. `null` = not rated; 0 = "no provocation", which is
  // a real (reassuring) finding and must be entered, never defaulted.
  mvomsBaseline: {
    headache: number | null
    dizziness: number | null
    nausea: number | null
    fogginess: number | null
  }
  mvomsSmoothPursuits: {
    notTested: boolean
    headache: number | null
    dizziness: number | null
    nausea: number | null
    fogginess: number | null
    comments: string
  }
  mvomsSaccadesHorizontal: {
    notTested: boolean
    headache: number | null
    dizziness: number | null
    nausea: number | null
    fogginess: number | null
    comments: string
  }
  mvomsVORHorizontal: {
    notTested: boolean
    headache: number | null
    dizziness: number | null
    nausea: number | null
    fogginess: number | null
    comments: string
  }
  mvomsVMS: {
    notTested: boolean
    headache: number | null
    dizziness: number | null
    nausea: number | null
    fogginess: number | null
    comments: string
  }

  // GAD-7 Anxiety Screen
  // `null` = unanswered. 0 is the patient's answer "not at all", which sums to
  // a real screen result ("minimal anxiety") and must never be a default.
  gad7NotDone: boolean
  gad7_1: number | null // 0-3
  gad7_2: number | null
  gad7_3: number | null
  gad7_4: number | null
  gad7_5: number | null
  gad7_6: number | null
  gad7_7: number | null

  // PHQ-2 Depression Screen
  phq2NotDone: boolean
  phq2_1: number | null // 0-3
  phq2_2: number | null

  // Page 11: Sleep Screen
  sleepNotDone: boolean
  sleep1: number | null // Hours of sleep (0-4)
  sleep2: number | null // Satisfaction (0-4)
  sleep3: number | null // Time to fall asleep (0-3)
  sleep4: number | null // Trouble staying asleep (0-3)
  sleep5: number | null // Medicine to sleep (0-3)

  // Page 12: Delayed Recall
  delayedRecallStartTime: string
  delayedRecall: boolean[] // 10 words
  delayedRecallMinutesSinceImmediate: string

  // Computerized Tests
  computerizedTestNotDone: boolean
  computerizedTestBattery: string
  computerizedTestBaselineDate: string
  computerizedTestPostInjuryRest: string
  computerizedTestPostInjuryExercise: string

  // Graded Aerobic Exercise
  aerobicExerciseNotDone: boolean
  aerobicExerciseProtocol: string

  // Pages 12-13: Overall Assessment & Management
  overallAssessmentSummary: string

  // Imaging
  imagingRequested: boolean
  imagingType: string
  imagingReason: string
  imagingFindings: string

  // Return recommendations
  returnToClass: string
  returnToWork: string
  returnToDriving: string
  returnToSport: string

  // Referrals
  referrals: {
    athleticTrainer: { checked: boolean; name: string }
    exercisePhysiologist: { checked: boolean; name: string }
    neurologist: { checked: boolean; name: string }
    neuropsychologist: { checked: boolean; name: string }
    neurosurgeon: { checked: boolean; name: string }
    ophthalmologist: { checked: boolean; name: string }
    optometrist: { checked: boolean; name: string }
    paediatrician: { checked: boolean; name: string }
    physiatrist: { checked: boolean; name: string }
    physiotherapist: { checked: boolean; name: string }
    psychologist: { checked: boolean; name: string }
    psychiatrist: { checked: boolean; name: string }
    sportMedicine: { checked: boolean; name: string }
    other: { checked: boolean; name: string }
  }
  pharmacotherapyPrescribed: string
  dateOfReview: string
  dateOfFollowUp: string

  // Page 14: Additional Notes
  additionalClinicalNotes: string

  // HCP Information
  hcpName: string
  hcpTitle: string
  hcpRegistration: string
  hcpDate: string
  hcpSignature: string
}

// Initialize with default values
export const getDefaultSCOAT6FormData = (): SCOAT6FormData => ({
  // Demographics
  athleteName: '',
  idNumber: '',
  dateOfBirth: '',
  age: '',
  sex: '',
  dominantHand: '',
  sportTeamSchool: '',
  yearsEducation: '',
  firstLanguage: '',
  preferredLanguage: '',
  dateOfExamination: '',
  clinician: '',

  // Current Injury
  removalFromPlay: '',
  continuedToPlayMinutes: '',
  dateOfInjury: '',
  injuryDescription: '',
  dateSymptomsFirstAppeared: '',
  dateSymptomsFirstReported: '',

  // Head Injuries History
  headInjuries: Array(3).fill(null).map(() => ({
    date: '',
    description: '',
    management: '',
  })),

  // Disorders History
  disorders: {
    migraine: { checked: false, yearDiagnosed: '', management: '' },
    chronicHeadache: { checked: false, yearDiagnosed: '', management: '' },
    depression: { checked: false, yearDiagnosed: '', management: '' },
    anxiety: { checked: false, yearDiagnosed: '', management: '' },
    syncope: { checked: false, yearDiagnosed: '', management: '' },
    epilepsy: { checked: false, yearDiagnosed: '', management: '' },
    adhd: { checked: false, yearDiagnosed: '', management: '' },
    learningDisorder: { checked: false, yearDiagnosed: '', management: '' },
    other: { checked: false, name: '', yearDiagnosed: '', management: '' },
  },

  // Medications
  medications: Array(5).fill(null).map(() => ({
    item: '',
    dose: '',
    frequency: '',
    reasonTaken: '',
  })),

  // Family History
  familyHistory: Array(3).fill(null).map(() => ({
    familyMember: '',
    depression: false,
    anxiety: false,
    adhd: false,
    learningDisorder: false,
    migraine: false,
    other: '',
    management: '',
  })),
  familyHistoryNotes: '',

  // Symptoms with 5 columns
  symptoms: {
    headaches: { preInjury: 0, dayInjured: 0, consult1: 0, consult2: 0, consult3: 0 },
    pressureInHead: { preInjury: 0, dayInjured: 0, consult1: 0, consult2: 0, consult3: 0 },
    neckPain: { preInjury: 0, dayInjured: 0, consult1: 0, consult2: 0, consult3: 0 },
    nauseaVomiting: { preInjury: 0, dayInjured: 0, consult1: 0, consult2: 0, consult3: 0 },
    dizziness: { preInjury: 0, dayInjured: 0, consult1: 0, consult2: 0, consult3: 0 },
    blurredVision: { preInjury: 0, dayInjured: 0, consult1: 0, consult2: 0, consult3: 0 },
    balanceProblems: { preInjury: 0, dayInjured: 0, consult1: 0, consult2: 0, consult3: 0 },
    sensitivityLight: { preInjury: 0, dayInjured: 0, consult1: 0, consult2: 0, consult3: 0 },
    sensitivityNoise: { preInjury: 0, dayInjured: 0, consult1: 0, consult2: 0, consult3: 0 },
    feelingSlowedDown: { preInjury: 0, dayInjured: 0, consult1: 0, consult2: 0, consult3: 0 },
    feelingInFog: { preInjury: 0, dayInjured: 0, consult1: 0, consult2: 0, consult3: 0 },
    difficultyConcentrating: { preInjury: 0, dayInjured: 0, consult1: 0, consult2: 0, consult3: 0 },
    difficultyRemembering: { preInjury: 0, dayInjured: 0, consult1: 0, consult2: 0, consult3: 0 },
    fatigueOrLowEnergy: { preInjury: 0, dayInjured: 0, consult1: 0, consult2: 0, consult3: 0 },
    confusion: { preInjury: 0, dayInjured: 0, consult1: 0, consult2: 0, consult3: 0 },
    drowsiness: { preInjury: 0, dayInjured: 0, consult1: 0, consult2: 0, consult3: 0 },
    moreEmotional: { preInjury: 0, dayInjured: 0, consult1: 0, consult2: 0, consult3: 0 },
    irritability: { preInjury: 0, dayInjured: 0, consult1: 0, consult2: 0, consult3: 0 },
    sadness: { preInjury: 0, dayInjured: 0, consult1: 0, consult2: 0, consult3: 0 },
    nervousAnxious: { preInjury: 0, dayInjured: 0, consult1: 0, consult2: 0, consult3: 0 },
    sleepDisturbance: { preInjury: 0, dayInjured: 0, consult1: 0, consult2: 0, consult3: 0 },
    abnormalHeartRate: { preInjury: 0, dayInjured: 0, consult1: 0, consult2: 0, consult3: 0 },
    excessiveSweating: { preInjury: 0, dayInjured: 0, consult1: 0, consult2: 0, consult3: 0 },
    other: { name: '', preInjury: 0, dayInjured: 0, consult1: 0, consult2: 0, consult3: 0 },
  },
  symptomDates: {
    dayInjured: '',
    consult1: '',
    consult2: '',
    consult3: '',
  },
  symptomsWorseWithPhysical: null,
  symptomsWorseWithMental: null,
  percentOfNormal: '',

  // Cognitive Tests
  wordListUsed: '',
  immediateMemoryTrial1: Array(10).fill(false),
  immediateMemoryTrial2: Array(10).fill(false),
  immediateMemoryTrial3: Array(10).fill(false),
  immediateMemoryTimeCompleted: '',
  alternate15WordTotal: null,

  digitListUsed: '',
  digitsBackward: null,

  monthsReverseTime: '',
  monthsReverseErrors: null,

  // Examination
  orthostaticsSupineBP: '',
  orthostaticsSupineHR: '',
  orthostaticsSupineSymptoms: null,
  orthostaticsSupineSymptomsDescription: '',
  orthostaticsStandingBP: '',
  orthostaticsStandingHR: '',
  orthostaticsStandingSymptoms: null,
  orthostaticsStandingSymptomsDescription: '',
  orthostaticsSupineResult: '',
  orthostaticsStandingResult: '',

  cervicalMuscleSpasm: '',
  cervicalMidlineTenderness: '',
  cervicalParavertebralTenderness: '',
  cervicalFlexion: '',
  cervicalExtension: '',
  cervicalRightLateralFlexion: '',
  cervicalLeftLateralFlexion: '',
  cervicalRightRotation: '',
  cervicalLeftRotation: '',

  cranialNerves: '',
  cranialNervesNotes: '',
  limbTone: '',
  strength: '',
  deepTendonReflexes: '',
  sensation: '',
  cerebellarFunction: '',
  neurologicalComments: '',

  footTested: '',
  mBessDoubleErrors: null,
  mBessTandemErrors: null,
  mBessSingleErrors: null,
  mBessFoamDoubleErrors: null,
  mBessFoamTandemErrors: null,
  mBessFoamSingleErrors: null,

  tandemGaitTrial1: '',
  tandemGaitTrial2: '',
  tandemGaitTrial3: '',
  tandemGaitAbnormal: false,

  // Complex & Dual Task
  complexTandemForwardEyesOpen: null,
  complexTandemForwardEyesClosed: null,
  complexTandemBackwardEyesOpen: null,
  complexTandemBackwardEyesClosed: null,

  dualTaskCognitiveTask: '',
  dualTaskTrialsAttempted: null,
  dualTaskTrialsCorrect: null,
  dualTaskAverageTime: '',
  dualTaskComments: '',

  // mVOMS
  mvomsBaseline: {
    headache: null,
    dizziness: null,
    nausea: null,
    fogginess: null,
  },
  mvomsSmoothPursuits: {
    notTested: false,
    headache: null,
    dizziness: null,
    nausea: null,
    fogginess: null,
    comments: '',
  },
  mvomsSaccadesHorizontal: {
    notTested: false,
    headache: null,
    dizziness: null,
    nausea: null,
    fogginess: null,
    comments: '',
  },
  mvomsVORHorizontal: {
    notTested: false,
    headache: null,
    dizziness: null,
    nausea: null,
    fogginess: null,
    comments: '',
  },
  mvomsVMS: {
    notTested: false,
    headache: null,
    dizziness: null,
    nausea: null,
    fogginess: null,
    comments: '',
  },

  // Mental Health Screens
  gad7NotDone: false,
  gad7_1: null,
  gad7_2: null,
  gad7_3: null,
  gad7_4: null,
  gad7_5: null,
  gad7_6: null,
  gad7_7: null,

  phq2NotDone: false,
  phq2_1: null,
  phq2_2: null,

  sleepNotDone: false,
  sleep1: null,
  sleep2: null,
  sleep3: null,
  sleep4: null,
  sleep5: null,

  // Delayed Recall
  delayedRecallStartTime: '',
  delayedRecall: Array(10).fill(false),
  delayedRecallMinutesSinceImmediate: '',

  // Computerized Tests
  computerizedTestNotDone: false,
  computerizedTestBattery: '',
  computerizedTestBaselineDate: '',
  computerizedTestPostInjuryRest: '',
  computerizedTestPostInjuryExercise: '',

  // Aerobic Exercise
  aerobicExerciseNotDone: false,
  aerobicExerciseProtocol: '',

  // Overall Assessment & Management
  overallAssessmentSummary: '',

  imagingRequested: false,
  imagingType: '',
  imagingReason: '',
  imagingFindings: '',

  returnToClass: '',
  returnToWork: '',
  returnToDriving: '',
  returnToSport: '',

  // Referrals
  referrals: {
    athleticTrainer: { checked: false, name: '' },
    exercisePhysiologist: { checked: false, name: '' },
    neurologist: { checked: false, name: '' },
    neuropsychologist: { checked: false, name: '' },
    neurosurgeon: { checked: false, name: '' },
    ophthalmologist: { checked: false, name: '' },
    optometrist: { checked: false, name: '' },
    paediatrician: { checked: false, name: '' },
    physiatrist: { checked: false, name: '' },
    physiotherapist: { checked: false, name: '' },
    psychologist: { checked: false, name: '' },
    psychiatrist: { checked: false, name: '' },
    sportMedicine: { checked: false, name: '' },
    other: { checked: false, name: '' },
  },
  pharmacotherapyPrescribed: '',
  dateOfReview: '',
  dateOfFollowUp: '',

  // Additional Notes
  additionalClinicalNotes: '',

  // HCP
  hcpName: '',
  hcpTitle: '',
  hcpRegistration: '',
  hcpDate: '',
  hcpSignature: '',
})

/** Value-union helpers so form handlers can narrow without `as any`.
 *  Derived from the shapes above — they can never drift from the schema. */
export type Scoat6Sex = SCOAT6FormData['sex']
export type Scoat6DominantHand = SCOAT6FormData['dominantHand']
export type Scoat6NormalAbnormal = SCOAT6FormData['orthostaticsSupineResult']
/** The per-disorder record (migraine, anxiety, …). `other` additionally has `name`. */
export type Scoat6DisorderEntry = SCOAT6FormData['disorders']['migraine']
/** One symptom's 5 rating columns. */
export type Scoat6SymptomRow = SCOAT6FormData['symptoms']['headaches']
export type Scoat6SymptomColumn = keyof Scoat6SymptomRow
/** One mVOMS row (saccades / VOR / VMS …). */
export type Scoat6MvomsRow = SCOAT6FormData['mvomsSaccadesHorizontal']
/** Fields whose value is the Normal/Abnormal/Not-tested triad. */
export type Scoat6ExamResult = SCOAT6FormData['cranialNerves']
