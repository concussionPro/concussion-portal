/**
 * Tool comparison matrix for the AI Practice Hub. Hand-curated, refreshed
 * quarterly (the monthly cron pipeline at /api/cron/ai-course-content-refresh
 * watches the source URLs and emails Zac a digest of changes).
 *
 * Tiers per Module 2:
 *   A = healthcare-purpose-built, Australian residency, appropriate data agreement
 *   B = enterprise general LLM, Australian residency available, BAA-equivalent
 *   C = consumer-grade — never with identifiable PII
 *
 * Last verified: 2026-05-22 — update via lib/ai-course/tools-matrix.ts.
 */

export interface ToolEntry {
  name: string
  tier: 'A' | 'B' | 'C'
  vendor: string
  auResidency: boolean | 'configurable'
  pricingFromAUD: number | null
  pricingNote: string
  primaryUse: string
  notes: string
  url: string
  ceaRecommended?: boolean
}

export const TOOLS: ToolEntry[] = [
  {
    name: 'Heidi Health',
    tier: 'A',
    vendor: 'Heidi Pty Ltd',
    auResidency: true,
    pricingFromAUD: 50,
    pricingNote: '~A$50-100/clinician/mo at standard tiers',
    primaryUse: 'AI scribe — voice-to-note in consult',
    notes: 'CEA-recommended Australian AI scribe. Healthcare-purpose-built, AU residency, most-used AI scribe in AU primary care 2026. Reference implementation used throughout this course.',
    url: 'https://www.heidihealth.com',
    ceaRecommended: true,
  },
  {
    name: 'Lyrebird Health',
    tier: 'A',
    vendor: 'Lyrebird Health Pty Ltd',
    auResidency: true,
    pricingFromAUD: 60,
    pricingNote: 'Per-clinician monthly tiers',
    primaryUse: 'AI scribe + clinical documentation',
    notes: 'Australian. Strong allied-health adoption.',
    url: 'https://www.lyrebirdhealth.com',
  },
  {
    name: 'Halo Health',
    tier: 'A',
    vendor: 'Halo Health',
    auResidency: true,
    pricingFromAUD: null,
    pricingNote: 'Enterprise / clinic pricing — request quote',
    primaryUse: 'Clinical software with embedded AI assistants',
    notes: 'Australian. Targets clinic-wide deployment.',
    url: 'https://www.halohealth.com.au',
  },
  {
    name: 'Microsoft Dragon Copilot for Healthcare',
    tier: 'A',
    vendor: 'Microsoft Australia',
    auResidency: true,
    pricingFromAUD: null,
    pricingNote: 'Enterprise licensing',
    primaryUse: 'Voice-to-note, decision support',
    notes: 'Dragon Medical heritage. Strong enterprise/hospital adoption. Microsoft data-processing addendum required.',
    url: 'https://www.microsoft.com/en-au/health',
  },
  {
    name: 'Azure OpenAI (Sydney region)',
    tier: 'B',
    vendor: 'Microsoft Azure',
    auResidency: 'configurable',
    pricingFromAUD: null,
    pricingNote: 'Consumption-based — pay per token. Configure region: Australia East.',
    primaryUse: 'Custom integrations, drafting, summarisation',
    notes: 'Requires explicit region configuration to enforce AU residency. Microsoft Data Processing Addendum applies.',
    url: 'https://azure.microsoft.com/en-au/products/ai-services/openai-service',
  },
  {
    name: 'AWS Bedrock (Sydney region)',
    tier: 'B',
    vendor: 'Amazon Web Services',
    auResidency: 'configurable',
    pricingFromAUD: null,
    pricingNote: 'Consumption-based — pay per token. Configure region: ap-southeast-2 (Sydney).',
    primaryUse: 'Hosting Claude, Llama, Titan in AU',
    notes: 'Anthropic Claude available via Bedrock with AU residency. AWS Data Processing Addendum required.',
    url: 'https://aws.amazon.com/bedrock',
  },
  {
    name: 'Google Vertex AI (Sydney region)',
    tier: 'B',
    vendor: 'Google Cloud',
    auResidency: 'configurable',
    pricingFromAUD: null,
    pricingNote: 'Consumption-based — pay per token. Configure region: australia-southeast1.',
    primaryUse: 'Hosting Gemini in AU',
    notes: 'Requires Vertex AI configuration; consumer Gemini app does not provide AU residency.',
    url: 'https://cloud.google.com/vertex-ai',
  },
  {
    name: 'ChatGPT (Plus / Team / Enterprise)',
    tier: 'C',
    vendor: 'OpenAI',
    auResidency: false,
    pricingFromAUD: 30,
    pricingNote: 'US$20/mo Plus, US$30/user/mo Team, Enterprise custom',
    primaryUse: 'Generic drafting — de-identified prompts only',
    notes: 'No AU data residency on consumer/Plus/Team. Enterprise has more data controls but verify with OpenAI before storing PII. Default: Tier C — de-identification mandatory.',
    url: 'https://chat.openai.com',
  },
  {
    name: 'Claude (Pro / Team)',
    tier: 'C',
    vendor: 'Anthropic',
    auResidency: false,
    pricingFromAUD: 30,
    pricingNote: 'US$20/mo Pro, US$25/user/mo Team',
    primaryUse: 'Generic drafting — de-identified prompts only',
    notes: 'Consumer claude.ai has no AU residency. For PII use Claude via AWS Bedrock Sydney (Tier B).',
    url: 'https://claude.ai',
  },
  {
    name: 'Gemini (consumer)',
    tier: 'C',
    vendor: 'Google',
    auResidency: false,
    pricingFromAUD: 0,
    pricingNote: 'Free tier available; Gemini Advanced US$20/mo',
    primaryUse: 'Generic drafting — de-identified prompts only',
    notes: 'Consumer app has no AU residency. For PII use Vertex AI Sydney (Tier B).',
    url: 'https://gemini.google.com',
  },
]
