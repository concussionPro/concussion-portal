// SCAT6 PDF field name mapping
// Maps our form field names to the actual PDF field names

export const SCAT6_FIELD_MAP = {
  // Demographics (page 1)
  athleteName: 'Text1',
  idNumber: 'Text2',
  dateOfBirth: 'Text3',
  dateOfExamination: 'Text4',
  dateOfInjury: 'Text5',
  timeOfInjury: 'Text6',
  // Sex: Radio buttons 'Sex' or 'Sex_V2'
  sportTeamSchool: 'Text7',
  currentYear: 'Text8',
  yearsEducation: 'Text9',
  firstLanguage: 'Text10',
  preferredLanguage: 'Text11',
  examiner: 'Text12',
  dominantHand: 'Text13', // May be radio button 'Radio1'

  // Concussion History
  previousConcussions: 'Text14',
  mostRecentConcussion: 'Text15',
  primarySymptoms: 'Text16',
  recoveryTime: 'Text17',

  // Athlete Background - checkboxes
  hospitalizedForHeadInjury: 'Check Box1',
  headacheDisorder: 'Check Box2',
  learningDisability: 'Check Box3',
  adhd: 'Check Box4',
  psychologicalDisorder: 'Check Box5',
  athleteBackgroundNotes: 'Text18',
  currentMedications: 'Text19',

  // Symptoms (22 items) - Radio buttons s1-s22 (0-6 scale)
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

  // Orientation (5 checkboxes)
  orientationMonth: 'ori1',
  orientationDate: 'ori2',
  orientationDayOfWeek: 'ori3',
  orientationYear: 'ori4',
  orientationTime: 'ori5',

  // Immediate Memory - Trial 1 (10 words)
  immediateMemoryTrial1: ['Tri1a', 'Tri1b', 'Tri1c', 'Tri1d', 'Tri1e', 'Tri1f', 'Tri1g', 'Tri1h', 'Tri1i', 'Tri1j'],
  // Immediate Memory - Trial 2 (10 words)
  immediateMemoryTrial2: ['Tri2a', 'Tri2b', 'Tri2c', 'Tri2d', 'Tri2e', 'Tri2f', 'Tri2g', 'Tri2h', 'Tri2i', 'Tri2j'],
  // Immediate Memory - Trial 3 (10 words)
  immediateMemoryTrial3: ['Tri3a', 'Tri3b', 'Tri3c', 'Tri3d', 'Tri3e', 'Tri3f', 'Tri3g', 'Tri3h', 'Tri3i', 'Tri3j'],

  // Word list used (A/B/C) - buttons
  wordListUsed: ['A', 'B', 'C'], // Radio buttons A, B, C

  // Concentration - Digits backward
  digitListUsed: ['A_2', 'B_2', 'C_2'], // Radio buttons for digit list

  // Balance - mBESS
  mBessDoubleErrors: 'Text37',
  mBessTandemErrors: 'Text38',
  mBessSingleErrors: 'Text39',
  testingSurface: 'Text40',
  footwear: 'Text41',
  // Foot tested: 'Foot' radio button

  // Tandem Gait
  tandemGaitTrial1: 'Text42',
  tandemGaitTrial2: 'Text43',
  tandemGaitTrial3: 'Text44',

  // Delayed Recall (10 words)
  delayedRecall: ['DEL3', 'DEL4', 'DEL5', 'DEL6', 'DEL7', 'DEL4A', 'DEL8', 'DEL9'], // Need to find all 10

  // Different from usual
  differentFromUsualDescription: 'Text87',
}
