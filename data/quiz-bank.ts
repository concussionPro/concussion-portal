// Large quiz question bank - answers never exposed to client
export interface QuizQuestion {
  id: string
  category: string
  question: string
  options: string[]
  correct: number
  rationale: string
}

// Expanded pool of 18 questions (shows 6 random each time)
export const QUIZ_BANK: QuizQuestion[] = [
  {
    id: 'q1',
    category: 'Vestibular Assessment',
    question: 'A patient has positive VOR (+4 dizziness) but negative smooth pursuit. C1-C2 flexion-rotation test is 28°. What is the PRIMARY phenotype requiring targeted intervention?',
    options: [
      'Vestibular-ocular only',
      'Cervicogenic only',
      'Mixed vestibular-cervicogenic with vestibular dominant',
      'Post-traumatic migraine'
    ],
    correct: 2,
    rationale: 'Requires understanding phenotype overlap and clinical prioritization based on symptom severity. This question tests integration of multiple assessment findings.'
  },
  {
    id: 'q2',
    category: 'Clinical Decision Making',
    question: 'Athlete is symptom-free at rest, completed 6-stage RTS protocol, but NPC is 8cm. Your clearance decision?',
    options: [
      'Clear for full return - protocol complete',
      'Withhold clearance - refer vision therapy first',
      'Clear with restrictions - no contact drills',
      'Repeat BESS testing before deciding'
    ],
    correct: 1,
    rationale: 'Convergence insufficiency (NPC >6cm) is an absolute contraindication to clearance regardless of symptom status. Missing this puts athletes at serious risk.'
  },
  {
    id: 'q3',
    category: 'Differential Diagnosis',
    question: 'Patient reports "dizziness" 3 weeks post-concussion. Which test definitively differentiates cervicogenic from vestibular etiology?',
    options: [
      'Dix-Hallpike maneuver',
      'Head-neck differentiation test (trunk rotation vs head rotation)',
      'BESS testing',
      'Spurling\'s test'
    ],
    correct: 1,
    rationale: 'Symptoms only with trunk rotation (head stationary) = cervical origin. Symptoms with head rotation = vestibular. This precise differential diagnosis is critical for targeted treatment.'
  },
  {
    id: 'q4',
    category: 'Cervical Assessment',
    question: 'Cervical flexion-rotation test shows 26° rotation right, 38° left. What does this indicate?',
    options: [
      'Normal - within expected asymmetry',
      'Right-sided C1-C2 dysfunction - likely cervicogenic headache',
      'Left-sided pathology',
      'Non-specific finding'
    ],
    correct: 1,
    rationale: '>10° asymmetry indicates C1-C2 dysfunction on the restricted side. Strongly correlates with cervicogenic headache. This tests precise interpretation of clinical measurements.'
  },
  {
    id: 'q5',
    category: 'Phenotype Management',
    question: 'Patient has PHQ-9 = 16 (moderate-severe depression) at 6 weeks post-concussion. Evidence-based intervention?',
    options: [
      'Wait for spontaneous recovery',
      'Exercise only',
      'Combination CBT + SSRI if indicated',
      'Strict rest'
    ],
    correct: 2,
    rationale: 'PHQ-9 ≥15 warrants combined CBT and pharmacotherapy. Untreated mood symptoms significantly prolong recovery and increase risk of persistent PCS.'
  },
  {
    id: 'q6',
    category: 'Prognostic Factors',
    question: 'Which factor is the STRONGEST predictor of persistent post-concussive symptoms (>4 weeks)?',
    options: [
      'Loss of consciousness >1 minute',
      'Female sex',
      'Pre-existing migraine disorder (3-5x increased risk)',
      'Mechanism of injury (MVA vs sport)'
    ],
    correct: 2,
    rationale: 'Pre-existing migraine is the strongest predictor (3-5x increased risk of prolonged recovery). Many commonly assumed injury factors are actually weak predictors. This tests evidence-based prognostic understanding.'
  },
  {
    id: 'q7',
    category: 'Acute Management',
    question: 'Within first 24-48 hours post-concussion, which intervention has the strongest evidence for optimal recovery?',
    options: [
      'Complete cognitive and physical rest',
      'Light aerobic exercise at 60-70% max HR within 48h if tolerated',
      'Immediate return to normal activities',
      'Dark room rest for 72 hours'
    ],
    correct: 1,
    rationale: 'Early sub-symptom threshold exercise (within 48h) significantly reduces recovery time compared to strict rest. Strict rest beyond 2-3 days may actually prolong symptoms.'
  },
  {
    id: 'q8',
    category: 'Red Flags',
    question: 'Which combination of symptoms warrants IMMEDIATE emergency referral?',
    options: [
      'Headache + photophobia',
      'Declining consciousness + unequal pupils',
      'Dizziness + nausea',
      'Memory problems + irritability'
    ],
    correct: 1,
    rationale: 'Declining consciousness with unequal pupils suggests intracranial bleed/mass effect requiring emergency neurosurgical evaluation. This is a life-threatening emergency.'
  },
  {
    id: 'q9',
    category: 'VOMS Testing',
    question: 'During VOMS testing, patient reports +6 dizziness with VOR but only +2 with smooth pursuit. What does this indicate?',
    options: [
      'Normal vestibular function',
      'Central vestibular pathology',
      'Peripheral vestibular dysfunction',
      'Cervicogenic dizziness'
    ],
    correct: 2,
    rationale: 'Peripheral vestibular dysfunction typically shows greater impairment during VOR (rapid head movements) compared to smooth pursuit. Central pathology would affect both equally.'
  },
  {
    id: 'q10',
    category: 'Buffalo Concussion Treadmill Test',
    question: 'Patient achieves 85% age-predicted max HR before symptom exacerbation. This indicates:',
    options: [
      'Physiological post-concussion disorder - ready for graduated exercise',
      'Autonomic dysfunction - requires vestibular rehab',
      'Cardiac concern - refer cardiology',
      'Normal recovery - full clearance'
    ],
    correct: 0,
    rationale: 'Reaching >80% max HR suggests physiological recovery. These patients respond well to graduated aerobic exercise programs. <80% indicates autonomic dysfunction requiring different management.'
  },
  {
    id: 'q11',
    category: 'Pediatric Concussion',
    question: 'For pediatric concussion (<18 years), what is the key difference in return-to-learn protocol?',
    options: [
      'No difference from adults',
      'Require complete symptom resolution before ANY cognitive activity',
      'Longer rest period (minimum 14 days)',
      'More gradual return with accommodations, may start before full symptom resolution'
    ],
    correct: 3,
    rationale: 'Pediatric patients benefit from earlier return to learn with accommodations rather than prolonged absence. Complete rest may increase anxiety and prolong recovery.'
  },
  {
    id: 'q12',
    category: 'Ocular Motor Dysfunction',
    question: 'NPC test shows 12cm. Convergence is considered impaired at:',
    options: [
      'Any distance >3cm',
      'Any distance >6cm',
      'Only if >10cm',
      'Only if symptomatic'
    ],
    correct: 1,
    rationale: 'Normal near point of convergence is ≤6cm. Values >6cm indicate convergence insufficiency requiring vision therapy referral. This is a common post-concussion impairment.'
  },
  {
    id: 'q13',
    category: 'Medication Management',
    question: 'Patient has persistent post-concussion headaches at 4 weeks. First-line pharmacological intervention?',
    options: [
      'Opioid analgesics',
      'Amitriptyline or topiramate (migraine prophylaxis)',
      'NSAIDs only',
      'Benzodiazepines'
    ],
    correct: 1,
    rationale: 'Post-concussion headaches often have migraine features. Amitriptyline or topiramate are first-line prophylaxis. Opioids are contraindicated and may worsen recovery.'
  },
  {
    id: 'q14',
    category: 'Cognitive Assessment',
    question: 'ImPACT testing shows decline in visual motor speed but normal verbal memory. This suggests:',
    options: [
      'Malingering',
      'Potential ocular motor dysfunction requiring VOMS testing',
      'Normal post-concussion pattern',
      'Need for neuroimaging'
    ],
    correct: 1,
    rationale: 'Isolated visual motor decline with preserved verbal memory often indicates ocular motor issues (convergence, saccades) rather than global cognitive impairment. VOMS should be performed.'
  },
  {
    id: 'q15',
    category: 'Sleep Management',
    question: 'Post-concussion insomnia at 3 weeks. Evidence-based management approach?',
    options: [
      'Sleep medication immediately',
      'Continue strict rest',
      'CBT-I (Cognitive Behavioral Therapy for Insomnia) + sleep hygiene',
      'Avoid exercise to prevent arousal'
    ],
    correct: 2,
    rationale: 'CBT-I is first-line for post-concussion insomnia. Medications can impair recovery. Regular exercise actually improves sleep quality and recovery.'
  },
  {
    id: 'q16',
    category: 'Multi-Modal Assessment',
    question: 'Athlete passes BESS, has normal SCAT6 cognitive scores, but fails VOMS with +4 symptoms. Clearance decision?',
    options: [
      'Clear for full return - passed balance and cognitive',
      'Withhold clearance - any failed component is disqualifying',
      'Clear with restrictions',
      'Repeat SCAT6 tomorrow'
    ],
    correct: 1,
    rationale: 'Multi-modal assessment requires passing ALL components. Positive VOMS indicates persistent vestibular-ocular dysfunction requiring intervention regardless of other test results.'
  },
  {
    id: 'q17',
    category: 'Cervicogenic Phenotype',
    question: 'Patient reports headache worsened by neck movement. C-spine palpation reproduces symptoms. Most likely diagnosis?',
    options: [
      'Vestibular concussion',
      'Cervicogenic post-concussion phenotype',
      'Post-traumatic migraine',
      'Anxiety-related symptoms'
    ],
    correct: 1,
    rationale: 'Headache provoked by neck movement and palpation strongly suggests cervicogenic phenotype (30-40% of concussions). Requires targeted cervical spine treatment.'
  },
  {
    id: 'q18',
    category: 'Risk Stratification',
    question: 'Which patient has HIGHEST risk of prolonged recovery (>4 weeks)?',
    options: [
      '25yo male athlete, first concussion, LOC 10 seconds',
      '16yo female with history of migraine and anxiety, third concussion',
      '30yo male, MVA mechanism, no LOC',
      '20yo athlete, severe initial symptoms but resolving'
    ],
    correct: 1,
    rationale: 'Female sex + adolescent + pre-existing migraine + anxiety + multiple concussions = highest risk profile. This patient requires intensive early intervention and close monitoring.'
  },
]
