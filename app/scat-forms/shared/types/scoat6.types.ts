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
  digitsBackward: number // 0-4

  monthsReverseTime: string
  monthsReverseErrors: number

  // Pages 7-8: Examination
  // Orthostatic Vital Signs
  orthostaticsSupineBP: string
  orthostaticsSupineHR: string
  orthostaticsSupineSymptoms: boolean
  orthostaticsSupineSymptomsDescription: string
  orthostaticsStandingBP: string
  orthostaticsStandingHR: string
  orthostaticsStandingSymptoms: boolean
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
  tandemGaitAbnormal: boolean

  // Page 9: Complex & Dual Task Gait
  complexTandemForwardEyesOpen: number
  complexTandemForwardEyesClosed: number
  complexTandemBackwardEyesOpen: number
  complexTandemBackwardEyesClosed: number

  dualTaskCognitiveTask: 'Words' | 'Serial 7s' | 'Months' | ''
  dualTaskTrialsAttempted: number
  dualTaskTrialsCorrect: number
  dualTaskAverageTime: string
  dualTaskComments: string

  // Page 10: mVOMS
  mvomsBaseline: {
    headache: number
    dizziness: number
    nausea: number
    fogginess: number
  }
  mvomsSmoothPursuits: {
    notTested: boolean
    headache: number
    dizziness: number
    nausea: number
    fogginess: number
    comments: string
  }
  mvomsSaccadesHorizontal: {
    notTested: boolean
    headache: number
    dizziness: number
    nausea: number
    fogginess: number
    comments: string
  }
  mvomsVORHorizontal: {
    notTested: boolean
    headache: number
    dizziness: number
    nausea: number
    fogginess: number
    comments: string
  }
  mvomsVMS: {
    notTested: boolean
    headache: number
    dizziness: number
    nausea: number
    fogginess: number
    comments: string
  }

  // GAD-7 Anxiety Screen
  gad7NotDone: boolean
  gad7_1: number // 0-3
  gad7_2: number
  gad7_3: number
  gad7_4: number
  gad7_5: number
  gad7_6: number
  gad7_7: number

  // PHQ-2 Depression Screen
  phq2NotDone: boolean
  phq2_1: number // 0-3
  phq2_2: number

  // Page 11: Sleep Screen
  sleepNotDone: boolean
  sleep1: number // Hours of sleep (0-4)
  sleep2: number // Satisfaction (0-4)
  sleep3: number // Time to fall asleep (0-3)
  sleep4: number // Trouble staying asleep (0-3)
  sleep5: number // Medicine to sleep (0-3)

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
  digitsBackward: 0,

  monthsReverseTime: '',
  monthsReverseErrors: 0,

  // Examination
  orthostaticsSupineBP: '',
  orthostaticsSupineHR: '',
  orthostaticsSupineSymptoms: false,
  orthostaticsSupineSymptomsDescription: '',
  orthostaticsStandingBP: '',
  orthostaticsStandingHR: '',
  orthostaticsStandingSymptoms: false,
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
  mBessDoubleErrors: 0,
  mBessTandemErrors: 0,
  mBessSingleErrors: 0,
  mBessFoamDoubleErrors: null,
  mBessFoamTandemErrors: null,
  mBessFoamSingleErrors: null,

  tandemGaitTrial1: '',
  tandemGaitTrial2: '',
  tandemGaitTrial3: '',
  tandemGaitAbnormal: false,

  // Complex & Dual Task
  complexTandemForwardEyesOpen: 0,
  complexTandemForwardEyesClosed: 0,
  complexTandemBackwardEyesOpen: 0,
  complexTandemBackwardEyesClosed: 0,

  dualTaskCognitiveTask: '',
  dualTaskTrialsAttempted: 0,
  dualTaskTrialsCorrect: 0,
  dualTaskAverageTime: '',
  dualTaskComments: '',

  // mVOMS
  mvomsBaseline: {
    headache: 0,
    dizziness: 0,
    nausea: 0,
    fogginess: 0,
  },
  mvomsSmoothPursuits: {
    notTested: false,
    headache: 0,
    dizziness: 0,
    nausea: 0,
    fogginess: 0,
    comments: '',
  },
  mvomsSaccadesHorizontal: {
    notTested: false,
    headache: 0,
    dizziness: 0,
    nausea: 0,
    fogginess: 0,
    comments: '',
  },
  mvomsVORHorizontal: {
    notTested: false,
    headache: 0,
    dizziness: 0,
    nausea: 0,
    fogginess: 0,
    comments: '',
  },
  mvomsVMS: {
    notTested: false,
    headache: 0,
    dizziness: 0,
    nausea: 0,
    fogginess: 0,
    comments: '',
  },

  // Mental Health Screens
  gad7NotDone: false,
  gad7_1: 0,
  gad7_2: 0,
  gad7_3: 0,
  gad7_4: 0,
  gad7_5: 0,
  gad7_6: 0,
  gad7_7: 0,

  phq2NotDone: false,
  phq2_1: 0,
  phq2_2: 0,

  sleepNotDone: false,
  sleep1: 0,
  sleep2: 0,
  sleep3: 0,
  sleep4: 0,
  sleep5: 0,

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
