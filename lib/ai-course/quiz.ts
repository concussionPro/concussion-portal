/**
 * Certification quiz. 10 questions, multiple choice, randomised order at
 * present time. Pass mark: 8/10. Failure means re-attempt allowed.
 *
 * Questions are intentionally compliance-focused — the certification's
 * value is that the holder demonstrably understands the legal framework.
 * Productivity / prompt-craft is not assessed.
 */

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  rationale: string
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1-pii-tier-c',
    question: 'A patient describes a complex case during a consultation. You want to use a consumer LLM (ChatGPT free, Claude on claude.ai, Gemini) to brainstorm differentials. What must you do first?',
    options: [
      'Paste the consultation note as-is — these tools are private',
      'De-identify all patient-identifiable information before any text touches the tool',
      'Ask the patient verbally — no consent paperwork needed',
      'Use the patient\'s initials only — initials are not identifying',
    ],
    correctIndex: 1,
    rationale: 'Consumer LLMs are Tier C: not appropriate for identifiable patient data regardless of consent. Initials, rare diagnoses, or small-region details can re-identify a person. Strip all PII before pasting.',
  },
  {
    id: 'q2-app-8-cross-border',
    question: 'Which Australian Privacy Principle is most directly engaged when you send patient data to a US-hosted LLM?',
    options: [
      'APP 5 (notification of collection)',
      'APP 8 (cross-border disclosure)',
      'APP 11 (security of personal information)',
      'APP 13 (correction of personal information)',
    ],
    correctIndex: 1,
    rationale: 'APP 8 governs cross-border disclosure of personal information. Sending health data outside Australia without taking reasonable steps to ensure the overseas recipient handles it consistent with the APPs is a breach — even if the data is encrypted in transit.',
  },
  {
    id: 'q3-ndb-trigger',
    question: 'A clinician accidentally pastes a patient\'s full clinical history (with name) into ChatGPT free. Which scheme is most likely engaged?',
    options: [
      'Notifiable Data Breach (NDB) scheme under the Privacy Act 1988',
      'TGA Therapeutic Goods Advertising Code',
      'AHPRA Mandatory Notifications scheme',
      'No scheme applies — the data wasn\'t hacked',
    ],
    correctIndex: 0,
    rationale: 'Disclosure of identifiable health information to a non-Australian-resident commercial party that the patient did not consent to is likely to result in serious harm — meeting the NDB threshold. The clinician\'s organisation must assess within 30 days and notify the OAIC and affected individuals if applicable.',
  },
  {
    id: 'q4-clinician-responsibility',
    question: 'Who carries legal responsibility for a clinical decision documented in an AI-drafted treatment plan?',
    options: [
      'The LLM vendor — they generated the content',
      'The clinician who reviewed and signed the document',
      'Shared liability between clinician and vendor',
      'No one — AI-generated content is not legally binding',
    ],
    correctIndex: 1,
    rationale: 'AHPRA\'s position is unambiguous: the registered health practitioner is responsible for clinical decisions. The LLM is a tool. Signing or delivering an AI-drafted document signifies the clinician has reviewed it and accepts professional responsibility.',
  },
  {
    id: 'q5-ai-scribe-consent',
    question: 'You\'re considering using an AI scribe (voice-to-note) tool with Australian data residency. What is required from the patient?',
    options: [
      'Nothing — clinicians can document however they like',
      'A signed waiver of all privacy rights',
      'Informed consent specifically for the AI tool, recorded in the clinical note',
      'Verbal acknowledgement only, no documentation needed',
    ],
    correctIndex: 2,
    rationale: 'Patients must be informed that an AI tool will record and process their consultation. Informed consent — communicated in plain language and recorded — is the appropriate standard. Verbal-only acknowledgement is risky from a documentation perspective.',
  },
  {
    id: 'q6-documentation-requirement',
    question: 'AHPRA expects the clinical record to reflect AI use in documentation. Which statement is most defensible?',
    options: [
      '"Note written by AI"',
      '"Drafted with AI assistance, reviewed and verified by [Clinician Name, AHPRA reg]"',
      'No notation is needed if you reviewed the output',
      '"AI was used somewhere in this consult"',
    ],
    correctIndex: 1,
    rationale: 'The defensible notation specifies (a) AI was used, (b) the clinician reviewed and verified the output, and (c) which clinician. This satisfies AHPRA documentation expectations and supports later audit.',
  },
  {
    id: 'q7-tga-supplement-claim',
    question: 'A naturopath uses an LLM to draft a supplement information sheet for patients. Which claim crosses into TGA-regulated advertising of therapeutic goods?',
    options: [
      '"This supplement contains 500mg of magnesium glycinate"',
      '"Speak to a qualified practitioner before starting any supplement"',
      '"This supplement treats anxiety and prevents migraines"',
      '"Magnesium plays a role in muscle and nerve function (NIH, 2024)"',
    ],
    correctIndex: 2,
    rationale: 'Claims of "treating" or "preventing" specific conditions are therapeutic claims under the TGA framework. Without TGA approval and registered indications, this language exposes the clinician to advertising-code breach. Educational descriptions of biological roles, factual composition, and recommendations to consult a practitioner are generally safe; therapeutic claims are not.',
  },
  {
    id: 'q8-de-identification-threshold',
    question: 'You strip the patient\'s name and date of birth from a case before pasting into a consumer LLM. Is the data now de-identified per OAIC guidance?',
    options: [
      'Yes — name and DOB are the identifiers',
      'Yes — anything beyond name and DOB is fine',
      'Not necessarily — combinations of remaining details (rare diagnosis, small region, occupation) may still permit re-identification',
      'Only if you also remove their Medicare number',
    ],
    correctIndex: 2,
    rationale: 'OAIC\'s de-identification standard is contextual. A rare condition in a small town, an unusual occupation, or a specific date combined with other quasi-identifiers can re-identify a person even without name/DOB. True de-identification requires assessing what combinations of details could narrow down the individual.',
  },
  {
    id: 'q9-tool-tier-selection',
    question: 'You need to generate a discharge summary that includes the patient\'s name, diagnosis, and specific clinical findings. Which tool tier is appropriate?',
    options: [
      'Tier C (consumer LLM) — convenient and free',
      'Tier B or Tier A only — enterprise AU-residency or healthcare-purpose-built tool with appropriate data agreement',
      'Any tier as long as you delete the conversation afterwards',
      'It depends on the patient\'s consent only',
    ],
    correctIndex: 1,
    rationale: 'Identifiable health data requires Tier A (healthcare-purpose-built, AU residency) or Tier B (enterprise LLM with AU residency + data processing agreement). Tier C (consumer) is never appropriate for identifiable patient data, regardless of consent or post-hoc deletion.',
  },
  {
    id: 'q10-mental-health-pii',
    question: 'Mental health records require which additional consideration compared to general medical records?',
    options: [
      'No additional considerations — they\'re all health records',
      'They\'re less sensitive because patients consent to therapy',
      'Higher sensitivity: re-identification risk + stigma. Tier A tools only, strictest consent, double-verification of AI output',
      'Mental health records are exempt from the Privacy Act',
    ],
    correctIndex: 2,
    rationale: 'Mental health information is among the most sensitive categories of personal information. Re-identification could cause serious harm (employment, custody, insurance). Use only Tier A tools, obtain explicit consent specific to AI use, and double-verify any AI-generated content before it enters the clinical record.',
  },
]

export interface QuizSubmission {
  answers: Array<{ questionId: string; selectedIndex: number }>
}

export interface QuizResult {
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

export const PASS_MARK = 8

export function gradeQuiz(submission: QuizSubmission): QuizResult {
  const feedback: QuizResult['feedback'] = []
  let score = 0
  for (const q of QUIZ_QUESTIONS) {
    const ans = submission.answers.find((a) => a.questionId === q.id)
    const correct = ans?.selectedIndex === q.correctIndex
    if (correct) score++
    feedback.push({
      questionId: q.id,
      correct,
      correctIndex: q.correctIndex,
      rationale: q.rationale,
    })
  }
  return {
    passed: score >= PASS_MARK,
    score,
    total: QUIZ_QUESTIONS.length,
    passMark: PASS_MARK,
    feedback,
  }
}
