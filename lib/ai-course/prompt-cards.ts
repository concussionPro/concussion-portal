/**
 * Interactive prompt cards for the AI in Clinical Practice course.
 *
 * Each entry maps a marker slug (used in module markdown as
 * `[PROMPT-CARD: <slug>]`) to a structured prompt template the
 * PromptCard component can render with fillable fields, live preview,
 * copy-to-clipboard, and a reviewable checklist.
 *
 * Placeholder syntax in promptTemplate: `{{field_key}}` where field_key
 * matches one of the `fields[].key` entries.
 */

export interface PromptCardField {
  key: string
  label: string
  placeholder: string
  multiline?: boolean
}

export interface PromptCardData {
  slug: string
  title: string
  audience?: string
  fields: PromptCardField[]
  promptTemplate: string
  checklist: string[]
  notes?: string
}

export const PROMPT_CARDS: Record<string, PromptCardData> = {
  'return-to-sport-letter': {
    slug: 'return-to-sport-letter',
    title: 'Return-to-sport clearance letter',
    audience: 'For coaches, schools, sporting bodies, and insurers.',
    fields: [
      { key: 'age', label: 'Patient age', placeholder: '17' },
      { key: 'level', label: 'Level of play', placeholder: 'amateur' },
      { key: 'sport', label: 'Sport', placeholder: 'rugby union' },
      { key: 'weeks_post', label: 'Weeks post-concussion', placeholder: '4' },
      { key: 'framework', label: 'Return-to-play framework used', placeholder: 'AFL / World Rugby graded protocol' },
      { key: 'stages_completed', label: 'Stages completed', placeholder: '1–5' },
      { key: 'recommend_stage', label: 'Recommend return at stage', placeholder: '6 — full return to contact' },
      { key: 'club_name', label: 'Addressee / club', placeholder: 'Eastside Rugby Club' },
    ],
    promptTemplate: `[De-id preamble: Draft a clinical letter. The patient details below are de-identified — no name, no DOB, no contact details. The clinician (me) is the responsible signatory and will edit before sending.]

Draft a return-to-sport clearance letter for a {{age}}-year-old {{level}} {{sport}} player, {{weeks_post}} weeks post-concussion, having completed a graded return-to-play protocol ({{framework}}). Symptom-free at rest and on exertion. Successfully completed Stages {{stages_completed}}. Recommend full return at Stage {{recommend_stage}}.

Address to the head coach at {{club_name}}.

Include the single line: "This clearance applies to the activity described and assumes no new symptoms develop."

Add the AI-attestation line from Module 4: "This letter was drafted with AI assistance and reviewed and approved by the signing clinician."`,
    checklist: [
      'Stage progression matches your clinical notes.',
      'The letter does not over-claim ("fully recovered" is risky language).',
      'AI-attestation line included.',
      'No identifying details beyond what the clearance requires.',
      'Date of clearance and clinician signature added before sending.',
    ],
    notes: 'Use Tier A or Tier B tool only — letter contains identifiable clinical context.',
  },
}

export function findPromptCard(slug: string): PromptCardData | undefined {
  return PROMPT_CARDS[slug]
}
