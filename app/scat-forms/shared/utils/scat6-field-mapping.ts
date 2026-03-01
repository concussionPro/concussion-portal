// SCAT6 PDF field name mapping - CORRECTED
// Verified by self-labeling the SCAT6_Fillable.pdf template
// Maps our form field names to the ACTUAL PDF form field names

export const SCAT6_FIELD_MAP = {
  // ==================== PAGE 2: DEMOGRAPHICS ====================
  athleteName: 'Text1',
  idNumber: 'Text2',
  dateOfBirth: 'Text3',
  dateOfExamination: 'Text4',
  dateOfInjury: 'Text5',
  timeOfInjury: 'Text4a',          // Was incorrectly Text6
  // Sex: Radio buttons 'Sex' (Male/Female/Prefer Not To Say) or 'Sex_V2'
  sportTeamSchool: 'Text8b',       // Was incorrectly Text7
  currentYear: 'Text7',            // Was incorrectly Text8
  yearsEducation: 'Text8',         // Was incorrectly Text9
  firstLanguage: 'Text9',          // Was incorrectly Text10
  preferredLanguage: 'Text10',     // Was incorrectly Text11
  examiner: 'Text11a',             // Was incorrectly Text12
  dominantHand: 'Text6',           // Text6 is the Other box, used for dominant hand text

  // ==================== PAGE 2: CONCUSSION HISTORY ====================
  previousConcussions: 'Text11',   // Was incorrectly Text14
  mostRecentConcussion: 'Text12',  // Was incorrectly Text15
  primarySymptoms: 'Text13',       // Was incorrectly Text16
  recoveryTime: 'Text14',          // Was incorrectly Text17

  // ==================== PAGE 3: NEURO SCREEN ====================
  timeOfAssessment: 'Text15',
  dateOfAssessment: 'Text16',
  maddocksScore: 'Text17',
  gcsCol1: 'Text18',
  gcsCol2: 'Text19',
  gcsCol3: 'Text20',

  // ==================== PAGE 4: ATHLETE BACKGROUND ====================
  hospitalizedForHeadInjury: 'Check Box1',
  headacheDisorder: 'Check Box2',
  learningDisability: 'Check Box3',
  adhd: 'Check Box4',
  psychologicalDisorder: 'Check Box5',
  athleteBackgroundNotes: 'Text21', // Was incorrectly Text18
  currentMedications: 'Text22',    // Was incorrectly Text19

  // ==================== PAGE 4: SYMPTOMS ====================
  symptoms: {
    headaches: 's1',
    pressureInHead: 's2',
    neckPain: 's3',
    nauseaVomiting: 's4',
    dizziness: 's5',
    blurredVision: 's6',
    balanceProblems: 's7',
    sensitivityLight: 's8',
    sensitivityNoise: 's9',
    feelingSlowedDown: 's10',
    feelingInFog: 's11',
    dontFeelRight: 's12',
    difficultyConcentrating: 's13',
    difficultyRemembering: 's14',
    fatigueOrLowEnergy: 's15',
    confusion: 's16',
    drowsiness: 's17',
    moreEmotional: 's18',
    irritability: 's19',
    sadness: 's20',
    nervousAnxious: 's21',
    troubleFallingAsleep: 's22',
  },
  percentOfNormal: 'Text26',
  whyNotHundredPercent: 'Text25',

  // ==================== PAGE 5: ORIENTATION ====================
  orientationMonth: 'ori1',   // Radio: /1 = correct, /0 = incorrect
  orientationDate: 'ori2',
  orientationDayOfWeek: 'ori3',
  orientationYear: 'ori4',
  orientationTime: 'ori5',

  // ==================== PAGE 5: IMMEDIATE MEMORY ====================
  immediateMemoryTrial1: ['Tri1a', 'Tri1b', 'Tri1c', 'Tri1d', 'Tri1e', 'Tri1f', 'Tri1g', 'Tri1h', 'Tri1i', 'Tri1j'],
  immediateMemoryTrial2: ['Tri2a', 'Tri2b', 'Tri2c', 'Tri2d', 'Tri2e', 'Tri2f', 'Tri2g', 'Tri2h', 'Tri2i', 'Tri2j'],
  immediateMemoryTrial3: ['Tri3a', 'Tri3b', 'Tri3c', 'Tri3d', 'Tri3e', 'Tri3f', 'Tri3g', 'Tri3h', 'Tri3i', 'Tri3j'],
  immediateMemoryTimeCompleted: 'Text33', // Was incorrectly Text11a
  wordListUsed: ['A', 'B', 'C'],

  // ==================== PAGE 6: CONCENTRATION ====================
  digitListUsed: ['A_2', 'B_2', 'C_2'],
  digitsBackward: 'Text34',              // Was incorrectly Text20
  monthsReverseTime: 'Text35',           // Was incorrectly Text21
  monthsReverseErrors: 'Text35aa',       // Was incorrectly Text22

  // ==================== PAGE 6-7: BALANCE - mBESS ====================
  // Foot tested: 'Foot' radio (/0 = Left, /1 = Right)
  testingSurface: 'Text40',              // Was Text37 (rich text)
  footwear: 'Text41',
  mBessDoubleErrors: 'Text38',           // Was Text37
  mBessTandemErrors: 'Text39',           // Was Text38
  mBessSingleErrors: 'Text46',           // Was Text39

  // Foam (optional)
  mBessFoamDoubleErrors: 'Text43',
  mBessFoamTandemErrors: 'Text44',
  mBessFoamSingleErrors: 'Text43C',

  // ==================== PAGE 7: TANDEM GAIT ====================
  tandemGaitTrial1: 'Text47',            // Was Text43
  tandemGaitTrial2: 'Text48',            // Was Text44
  tandemGaitTrial3: 'Text49',            // Was Text43C

  // ==================== PAGE 8: DELAYED RECALL ====================
  delayedRecall: ['DEL3', 'DEL4', 'DEL5', 'DEL6', 'DEL4A', 'DEL8'],
  delayedRecallStartTime: 'Text80',      // Was Text27

  // ==================== PAGE 8: DIFFERENT FROM USUAL ====================
  differentFromUsual: 'TTL12',           // Radio: /Yes_2, /No_2, /Not applicable
  differentFromUsualDescription: 'Text87', // RICH TEXT - wont fill

  // ==================== PAGE 9: DECISION TABLE ====================
  decision: {
    date: ['100', '101', '102'],
    symptomNumber: ['100d', '101e', '102f'],
    symptomSeverity: ['100g', '101h', '102i'],
    orientation: ['100j', '101k', '102l'],
    immediateMemory: ['100m', '101n', '102o'],
    concentration: ['100p', '101q', '102r'],
    mBessTotal: ['100s', '101s', '102t'],
    tandemGaitFastest: ['100u', '101v', '102w'],
    dualTaskFastest: ['100x', '101y', '102z'],
  },

  // ==================== PAGE 9: DISPOSITION ====================
  concussionDiagnosed: 'Concussion diagnosed', // Radio: /Yes_3, /No_3, /Deferred

  // ==================== PAGE 9: HCP ATTESTATION ====================
  hcpName: 'Text91',                     // Was Text88
  hcpTitle: 'Text92',                    // Was Text89
  hcpRegistration: 'Text93',             // Was Text90
  hcpDate: 'Text94a',                    // Was Text91

  // ==================== PAGE 9: CLINICAL NOTES ====================
  additionalClinicalNotes: 'Text94',     // Was Text93
}
