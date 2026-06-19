/**
 * Sub-Symptom-Threshold Trainer — symptom + red-flag vocabularies.
 *
 * CONCUSSION_SYMPTOMS is the standard post-concussion symptom set (the SCAT /
 * PCSS 22-item inventory). The user preselects the symptoms they actually get
 * so the per-minute test only asks about those.
 *
 * RED_FLAGS are emergency / contraindication signs surfaced on the readiness
 * screen and as the "red flag — stop" path mid-test. Any of these means STOP
 * and seek urgent medical review — they are NOT part of the graded scoring.
 */

export interface ConcussionSymptom {
  id: string
  label: string
  /** reserved — none of the 22 PCSS items are red flags themselves */
  redFlag?: boolean
}

/** Standard 22-item post-concussion symptom inventory (SCAT6 / PCSS). */
export const CONCUSSION_SYMPTOMS: ConcussionSymptom[] = [
  { id: 'headache', label: 'Headache' },
  { id: 'pressure-in-head', label: 'Pressure in head' },
  { id: 'neck-pain', label: 'Neck pain' },
  { id: 'nausea', label: 'Nausea or vomiting' },
  { id: 'dizziness', label: 'Dizziness' },
  { id: 'blurred-vision', label: 'Blurred vision' },
  { id: 'balance-problems', label: 'Balance problems' },
  { id: 'light-sensitivity', label: 'Sensitivity to light' },
  { id: 'noise-sensitivity', label: 'Sensitivity to noise' },
  { id: 'feeling-slowed-down', label: 'Feeling slowed down' },
  { id: 'feeling-in-a-fog', label: "Feeling like 'in a fog'" },
  { id: 'dont-feel-right', label: "Don't feel right" },
  { id: 'difficulty-concentrating', label: 'Difficulty concentrating' },
  { id: 'difficulty-remembering', label: 'Difficulty remembering' },
  { id: 'fatigue', label: 'Fatigue or low energy' },
  { id: 'confusion', label: 'Confusion' },
  { id: 'drowsiness', label: 'Drowsiness' },
  { id: 'more-emotional', label: 'More emotional' },
  { id: 'irritability', label: 'Irritability' },
  { id: 'sadness', label: 'Sadness' },
  { id: 'nervous-anxious', label: 'Nervous or anxious' },
  { id: 'trouble-falling-asleep', label: 'Trouble falling asleep' },
]

export interface RedFlag {
  id: string
  label: string
}

/**
 * Emergency red flags (SCAT6 emergency-referral list). Any tick on the
 * readiness screen blocks the test and routes to "seek medical review".
 */
export const RED_FLAGS: RedFlag[] = [
  { id: 'worsening-headache', label: 'Severe or worsening headache' },
  { id: 'repeated-vomiting', label: 'Repeated vomiting' },
  { id: 'seizure', label: 'Seizure or convulsion' },
  { id: 'weakness-numbness', label: 'Weakness, numbness or tingling in arms or legs' },
  { id: 'slurred-speech', label: 'Slurred speech' },
  { id: 'increasing-confusion', label: 'Increasing confusion or drowsiness' },
  { id: 'loss-of-consciousness', label: 'Loss of consciousness' },
]
