/**
 * Certification quiz — The Vagus Nerve in Clinical Practice.
 *
 * 10 questions, 4 options each, 8/10 pass mark.
 *
 * Question design philosophy:
 *  - Distractors are real clinical pitfalls or common polyvagal-marketing
 *    misunderstandings, not arbitrary wrong answers.
 *  - Rationales cite the underlying evidence and the consequence of the
 *    wrong choice in real practice.
 *  - Coverage maps to all 6 modules — anatomy critique, red flags,
 *    assessment, phenotypes, interventions, certification + ahpra logging.
 */

export interface VagusQuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  rationale: string
  /** Module slug this question is anchored to */
  module: string
}

export interface VagusQuizSubmission {
  answers: Array<{ questionId: string; selectedIndex: number }>
}

export interface VagusQuizResult {
  passed: boolean
  score: number
  total: number
  passMark: number
  feedback: Array<{
    questionId: string
    correct: boolean
    correctIndex: number
    rationale: string
  }>
}

export const VAGUS_QUIZ_PASS_MARK = 8

export const VAGUS_QUIZ_QUESTIONS: VagusQuizQuestion[] = [
  {
    id: 'vq1-afferent-traffic',
    module: 'module-1-anatomy',
    question: 'Approximately what proportion of vagal nerve fibres are afferent (sensory, peripheral → brain)?',
    options: [
      '~20% — the vagus is primarily an efferent "rest" output',
      '~50% — afferent and efferent are roughly balanced',
      '~80% — the vagus is mostly sensory, reporting visceral status upward',
      'The split has not been quantified in primary literature',
    ],
    correctIndex: 2,
    rationale: 'Primary literature (Agostoni 1957; Berthoud & Neuhuber 2000) quantifies the split at approximately 80% afferent / 20% efferent. The wellness-market framing of the vagus as a "parasympathetic output" inverts the actual traffic direction.',
  },
  {
    id: 'vq2-pots-criterion',
    module: 'module-4-phenotypes',
    question: 'Which finding meets the consensus diagnostic criterion for POTS in an adult on active stand test?',
    options: [
      'Resting HR > 100 bpm, no postural change required',
      'HR rises ≥ 30 bpm within 10 minutes of standing, sustained, symptomatic, with no significant BP drop',
      'Systolic BP falls ≥ 20 mmHg within 3 minutes of standing',
      'Any HR rise on standing combined with anxiety symptoms',
    ],
    correctIndex: 1,
    rationale: 'Sheldon et al. 2015 HRS expert consensus defines POTS as HR rise ≥ 30 bpm (≥ 40 in adolescents) sustained within 10 min of standing, with symptoms, and no significant orthostatic hypotension. Resting tachycardia without postural change is more consistent with IST. Systolic ↓ ≥ 20 mmHg is the orthostatic hypotension criterion, distinct from POTS.',
  },
  {
    id: 'vq3-vasovagal-red-flag',
    module: 'module-2-red-flags',
    question: 'A 25-year-old patient presents with one episode of syncope during football training. There is a paternal uncle who died suddenly at age 32. What is your role as an allied-health clinician?',
    options: [
      'Begin a graded reconditioning program — syncope is benign at this age',
      'Reassure the patient and proceed with their original presenting complaint',
      'Stop, do NOT prescribe exercise, and refer urgently for cardiology assessment',
      'Recommend salt and fluid loading as first-line for vasovagal syncope',
    ],
    correctIndex: 2,
    rationale: 'Syncope on exertion + family history of sudden cardiac death under 40 is a red-flag combination for channelopathy, hypertrophic cardiomyopathy, or other structural disease. Exercise prescription before cardiology clearance is unsafe. This is not an autonomic-management presentation; it is a cardiology-emergency triage. (Shen et al. 2017 ACC/AHA/HRS syncope guideline.)',
  },
  {
    id: 'vq4-hrv-claims',
    module: 'module-3-assessment',
    question: 'A patient brings their Apple Watch HRV trend and asks if their "vagal state" is recovering. Which response is most defensible?',
    options: [
      'Yes — increasing HRV directly indicates higher vagal tone and recovery',
      'HRV trends within a person have moderate value for monitoring training load; HRV does not measure a real-time "vagal state" or diagnose autonomic disease',
      'HRV is meaningless and should be ignored entirely',
      'Apple Watch HRV is invalid because it uses photoplethysmography rather than ECG',
    ],
    correctIndex: 1,
    rationale: 'Within-person HRV trends have moderate evidence for monitoring training/recovery load (Shaffer & Ginsberg 2017; Laborde 2017). HRV does not equate to a real-time "vagal state" snapshot, does not diagnose autonomic disease, and does not measure trauma load. Wearable PPG is less precise than chest-strap ECG-derived RR but is not invalid for trend monitoring.',
  },
  {
    id: 'vq5-buffalo',
    module: 'module-5-interventions',
    question: 'A patient is 1 week post-concussion with persistent symptoms. You determine their symptom-threshold HR (SThr-HR) on Buffalo Concussion Treadmill Test is 140 bpm. What is the training HR range you prescribe for sub-symptom-threshold exercise?',
    options: [
      '140 bpm or higher — pushing through symptoms hastens recovery',
      'Approximately 112–126 bpm (80–90% of SThr-HR)',
      '~50% of age-predicted maximum, regardless of SThr-HR',
      'Avoid all aerobic exercise until the patient is symptom-free at rest',
    ],
    correctIndex: 1,
    rationale: 'Buffalo protocol (Leddy et al. 2019 JAMA Pediatrics) prescribes training at 80–90% of the symptom-threshold HR established during BCTT — strictly sub-threshold. Pushing past the threshold worsens symptoms. Total rest is also incorrect — RCT evidence supports early sub-symptom-threshold aerobic activity over strict rest.',
  },
  {
    id: 'vq6-polyvagal-framing',
    module: 'module-1-anatomy',
    question: 'A new patient says a previous therapist diagnosed them with "low vagal tone" and prescribed daily humming exercises. What is the most defensible clinical response?',
    options: [
      'Continue the humming exercises — they are harmless and the patient is engaged',
      '"Low vagal tone" is not a diagnosis — take a thorough autonomic history to identify the actual phenotype underlying their symptoms',
      'Tell the patient the previous therapist was incompetent',
      'Order HRV testing — this will confirm or refute the "low vagal tone" diagnosis',
    ],
    correctIndex: 1,
    rationale: '"Low vagal tone" is a descriptive label, not a clinical diagnosis. The underlying phenotype could be POTS, IST, anxiety-driven somatic activation, post-viral autonomic dysfunction, or none of these. Module 4 walks through the differential. Dismissing the prior clinician is poor professional practice. HRV will not adjudicate the diagnosis. (Grossman 2023 critique.)',
  },
  {
    id: 'vq7-salt-fluid-contraindication',
    module: 'module-5-interventions',
    question: 'You are considering recommending salt and fluid loading for a patient with confirmed POTS. Which factor would make this contraindicated without specialist input first?',
    options: [
      'Patient prefers tap water over bottled water',
      'Patient has a baseline seated BP of 150/95 mmHg',
      'Patient drinks two cups of coffee per day',
      'Patient is taking an SSRI for depression',
    ],
    correctIndex: 1,
    rationale: 'Pre-existing hypertension (seated BP ≥ 140/90) is a relative contraindication to standard salt loading. Other contraindications include CKD, CHF, and pregnancy. The patient needs medical clearance and BP optimisation before salt loading. Caffeine is not contraindicated. SSRIs can affect autonomic symptoms but are not a contraindication to salt/fluid. (Sheldon et al. 2015 HRS; Vernino et al. 2021 NIH.)',
  },
  {
    id: 'vq8-supported-intervention',
    module: 'module-5-interventions',
    question: 'Which vagal-related intervention has the highest level of RCT support in its specific clinical context?',
    options: [
      'Daily ear-massage to "tone" the vagus nerve',
      'Modified Valsalva manoeuvre for emergency termination of SVT (REVERT protocol)',
      'Implanted vagus nerve stimulator (VNS) for chronic fatigue syndrome',
      'Cold-water face immersion for general anxiety reduction',
    ],
    correctIndex: 1,
    rationale: 'The modified Valsalva (REVERT trial, Smith et al. 2015, Lancet) has high-quality RCT support for terminating supraventricular tachycardia in the emergency setting. Ear-massage and cold-water face immersion have only acute physiological effects without RCT support for chronic conditions. Implanted VNS is FDA-approved for epilepsy and treatment-resistant depression — not chronic fatigue syndrome.',
  },
  {
    id: 'vq9-long-covid-overlap',
    module: 'module-4-phenotypes',
    question: 'A patient presents 6 months after a confirmed COVID-19 infection with new-onset orthostatic lightheadedness, palpitations, and exercise intolerance. Active stand test shows HR rise of 38 bpm sustained at 5 minutes with normal BP. What is the most appropriate framing?',
    options: [
      'Long-COVID post-viral POTS phenotype — apply structured POTS management; consider long-COVID-specific multidisciplinary referral',
      'Diagnose anxiety disorder and refer for CBT only',
      'Order extensive imaging to find the underlying inflammation',
      'Wait 6 more months — symptoms typically resolve at 12 months without intervention',
    ],
    correctIndex: 0,
    rationale: 'Meets POTS criteria + post-viral onset = post-viral POTS phenotype. Structured POTS management is first-line (Vernino 2021 NIH; Raj 2022; CSANZ 2024). Long-COVID multidisciplinary clinics offer phenotyping for the broader symptom cluster (Davis et al. 2023 Nature Reviews Microbiology). Watch-and-wait is not appropriate at 6 months with significant impairment.',
  },
  {
    id: 'vq10-cpd-documentation',
    module: 'module-6-hub-certification',
    question: 'On completion of this course, what is the minimum documentation required to defend the 1.25 CPD hours at an AHPRA audit?',
    options: [
      'A screenshot of the certificate is sufficient',
      'Certificate ID + issuance date + course title + CPD hours + a brief reflection on how the learning applies to your practice',
      'A receipt of payment for the course',
      'No documentation needed — AHPRA does not audit self-directed learning hours',
    ],
    correctIndex: 1,
    rationale: 'AHPRA Board CPD audits expect: evidence of completion (certificate + ID), the activity description (course title, hours, provider), and (most boards) a brief reflection on relevance to practice. AHPRA does audit self-directed learning. A payment receipt alone does not demonstrate completion. The reflection element is what differentiates "attended" from "learned" — most boards explicitly require it.',
  },
]

export function gradeVagusQuiz(submission: VagusQuizSubmission): VagusQuizResult {
  const byId = new Map(VAGUS_QUIZ_QUESTIONS.map((q) => [q.id, q]))
  let score = 0
  const feedback = submission.answers.map((a) => {
    const q = byId.get(a.questionId)
    if (!q) {
      return {
        questionId: a.questionId,
        correct: false,
        correctIndex: -1,
        rationale: 'Question not found.',
      }
    }
    const correct = a.selectedIndex === q.correctIndex
    if (correct) score++
    return {
      questionId: q.id,
      correct,
      correctIndex: q.correctIndex,
      rationale: q.rationale,
    }
  })

  return {
    passed: score >= VAGUS_QUIZ_PASS_MARK,
    score,
    total: VAGUS_QUIZ_QUESTIONS.length,
    passMark: VAGUS_QUIZ_PASS_MARK,
    feedback,
  }
}
