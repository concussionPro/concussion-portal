/**
 * Mid-module knowledge checks — one or two short questions per section to
 * reinforce key concepts as the learner moves through. Keyed by module
 * slug then section slug (derived from the H2 heading via slugify).
 *
 * Distinct from the final certification quiz in quiz.ts. These are
 * optional engagement / retention boosters that mirror the concussion
 * course's interactive structure.
 *
 * If a module slug or section slug isn't listed here, no quiz check
 * renders for that section.
 */

import type { SectionQuizCheck } from './module-sections'

export const SECTION_QUIZZES: Record<string, Record<string, SectionQuizCheck>> = {
  'module-1-compliance': {
    'ahpras-2025-ai-guidance-for-registered-health-practitioners': {
      question: 'AHPRA\'s 2025 AI guidance applies to which registered health practitioners?',
      options: [
        'Only medical practitioners',
        'All registered health practitioners across the National Boards',
        'Only those with explicit AI tool training',
        'Only practitioners in public health settings',
      ],
      correctIndex: 1,
      rationale: 'AHPRA\'s guidance applies uniformly across all 15 National Boards — medical, nursing, physiotherapy, osteopathy, psychology, Chinese medicine, and the rest. Use of AI tools does not change the underlying professional obligations.',
    },
    'australian-privacy-principles': {
      question: 'You send a de-identified case summary to a US-hosted LLM. Which APP is most directly engaged?',
      options: [
        'APP 5 — notification of collection',
        'APP 6 — use or disclosure',
        'APP 8 — cross-border disclosure',
        'APP 13 — correction',
      ],
      correctIndex: 2,
      rationale: 'APP 8 governs disclosure to overseas recipients. Even de-identified data crossing the border engages APP 8 if there is any residual re-identification risk; the safer interpretation is that APP 8 is engaged any time a US-hosted LLM processes Australian health-context content.',
    },
    'tga-therapeutic-goods-advertising-code': {
      question: 'Which of these patient-facing AI-generated claims is most likely to breach the TGA Advertising Code?',
      options: [
        '"Magnesium contributes to muscle function"',
        '"This supplement prevents migraines"',
        '"Speak to your practitioner before starting any supplement"',
        '"Available in 500mg capsules"',
      ],
      correctIndex: 1,
      rationale: 'Prevention/treatment/cure claims are the high-risk category. Factual composition statements and educational role descriptions are generally safe; specific therapeutic claims require TGA-registered indications.',
    },
  },

  'module-2-tools': {
    'the-three-tiers': {
      question: 'Which tool tier is appropriate for processing a discharge summary that includes the patient\'s name and full diagnosis?',
      options: [
        'Tier C consumer LLM with a long disclaimer',
        'Tier B (enterprise LLM with AU residency) or Tier A (healthcare-purpose-built) only',
        'Any tier, as long as the conversation is deleted afterwards',
        'It depends entirely on patient consent — any tier is fine with consent',
      ],
      correctIndex: 1,
      rationale: 'Identifiable health data requires Tier A or Tier B tools — both have appropriate data agreements and (for Tier B) AU residency configured. Consent does not transform a consumer tool into a clinical-grade one.',
    },
    'data-residency': {
      question: 'A tool says "uses OpenAI." What additional information do you need to determine its tier?',
      options: [
        'Nothing — OpenAI is fine for healthcare',
        'Whether OpenAI runs in Australia for that tool\'s requests, and whether a data processing agreement is in place',
        'The price per month',
        'The clinician\'s personal preference',
      ],
      correctIndex: 1,
      rationale: 'OpenAI itself doesn\'t determine the tier — how the tool routes data does. The same model can be Tier C (consumer ChatGPT) or Tier B (Azure OpenAI Sydney with DPA).',
    },
  },

  'module-3-documentation': {
    'ai-scribes-in-consult': {
      question: 'What is the minimum patient consent standard before using an AI scribe in a consultation?',
      options: [
        'Verbal acknowledgement is sufficient — no documentation needed',
        'A signed privacy waiver covering all future tools',
        'Informed consent, recorded in the clinical note',
        'No consent is needed if the tool has AU residency',
      ],
      correctIndex: 2,
      rationale: 'Informed consent (the patient knows what the tool does, what data it captures, where it goes) recorded in the clinical record is the appropriate standard. Verbal-only is risky from an audit perspective.',
    },
    'review-and-sign-workflow': {
      question: 'AHPRA expects a clinician\'s documentation to reflect AI use. Which notation is most defensible?',
      options: [
        '"Note written by AI"',
        '"Drafted with AI assistance, reviewed and verified by [clinician name, AHPRA reg]"',
        'No notation is required if you reviewed the output',
        '"AI was involved somewhere"',
      ],
      correctIndex: 1,
      rationale: 'The defensible notation states (a) AI was used, (b) the clinician reviewed and verified the output, (c) which clinician. This supports later audit and matches the AHPRA documentation expectation.',
    },
  },

  'module-4-patient-comms': {},
  'module-5-physio': {},
  'module-5-naturopath': {},
  'module-5-gp': {},
  'module-5-osteopath': {},
  'module-6-hub-and-certification': {},
}
