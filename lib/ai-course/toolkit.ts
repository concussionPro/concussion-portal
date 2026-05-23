/**
 * Clinical Toolkit data for the AI in Clinical Practice course.
 *
 * Downloadable templates, decision trees, consent forms, audit
 * checklists, vendor selection grids. Practical artefacts a clinician
 * can adapt and ship into their practice the same day.
 *
 * Each item is either:
 *   - inline content rendered on the toolkit page, or
 *   - linked to a deeper page in the course (hub, modules)
 * No `download:` field — clinicians can copy and adapt directly from
 * the rendered text. Avoids brittle PDF generation and ensures content
 * stays current with the content-refresh cron.
 */

import {
  ShieldCheck,
  ClipboardCheck,
  Scale,
  FileSearch,
  Workflow,
  AlertTriangle,
  UserCheck,
  Lock,
} from 'lucide-react'

export interface ToolkitItem {
  id: string
  title: string
  category: ToolkitCategory
  oneLiner: string
  contents: string[]
  icon: React.ComponentType<{ className?: string }>
  /** Module slug that teaches the source material for this artefact */
  taughtIn?: string
}

export type ToolkitCategory =
  | 'Consent & Disclosure'
  | 'De-identification & Privacy'
  | 'Tool Selection'
  | 'Documentation & Audit'
  | 'Incident Response'

export const TOOLKIT_ITEMS: ToolkitItem[] = [
  // ============ CONSENT & DISCLOSURE ============
  {
    id: 'consent-ai-scribe',
    title: 'AI scribe consent template',
    category: 'Consent & Disclosure',
    oneLiner: 'Verbal-consent script + written variant for AI scribe use in consultations.',
    icon: UserCheck,
    taughtIn: 'patient-comms',
    contents: [
      'Verbal opener: "I use an AI assistant to help with my notes during our consultation. It listens, helps me document, and I review everything before it goes in your record. Your information stays in Australia and is handled under the Privacy Act. Are you OK with that?"',
      'If patient declines: "No problem — I\'ll write notes by hand for our session today."',
      'Written variant (clinic intake form): "[Clinic name] uses AI-assisted documentation. Audio of your consultation is processed by an Australian-hosted AI tool to produce a draft note that your clinician reviews and signs. Recordings are deleted after note generation. You can opt out at any visit."',
      'Documentation requirement: note in the file that consent was sought and given (or declined). Phrase used by Avant: "AI scribe consent obtained" + date.',
    ],
  },
  {
    id: 'consent-disclosure-script',
    title: 'AI-generated content disclosure script',
    category: 'Consent & Disclosure',
    oneLiner: 'When and how to disclose AI involvement in patient-facing material (referrals, education sheets, certificates).',
    icon: UserCheck,
    contents: [
      'Material disclosure: any AI-generated patient-facing content (info sheets, exercise programs, return-to-work letters) gets a single line: "Drafted with AI assistance; reviewed and approved by [clinician name]."',
      'Immaterial cases (no disclosure needed): clinical notes (internal record), short templated responses (e.g. appointment confirmation), AI-assisted spell-check.',
      'Test for materiality: would the patient reasonably want to know the AI was involved in producing this specific piece of content? If yes — disclose.',
    ],
  },

  // ============ DE-IDENTIFICATION & PRIVACY ============
  {
    id: 'deid-checklist',
    title: 'De-identification checklist (Tier C use)',
    category: 'De-identification & Privacy',
    oneLiner: 'What to strip before any consumer-LLM (ChatGPT, Claude, Gemini) prompt.',
    icon: Lock,
    taughtIn: 'tool-selection',
    contents: [
      'Name (patient + family)',
      'Date of birth (use approximate age range instead — "60s")',
      'Address, postcode (use region only — "Northern Sydney")',
      'Phone, email, IHI, Medicare, private health number',
      'Workplace (use generic — "construction worker")',
      'Specific dates of incidents (use relative — "8 weeks ago")',
      'Unique identifying conditions (use generic — "ex-AFL player at retirement" → "former professional team-sport athlete in their 30s")',
      'After de-identification, ask: could a colleague at the same clinic recognise this patient from the prompt alone? If yes — keep stripping.',
    ],
  },
  {
    id: 'apii-decision-tree',
    title: 'APP 8 cross-border decision tree',
    category: 'De-identification & Privacy',
    oneLiner: 'Is the AI tool storing or processing data outside Australia? Decision flow.',
    icon: Workflow,
    taughtIn: 'tool-selection',
    contents: [
      'Step 1: Does the vendor publish where data is stored (region / data residency)? If no — assume international, treat as cross-border disclosure.',
      'Step 2: If AU residency confirmed AND vendor has signed a Data Processing Agreement — proceed (Tier A).',
      'Step 3: If region is configurable (e.g. Azure OpenAI Sydney) AND you have written confirmation of region + DPA — proceed (Tier B).',
      'Step 4: If non-AU (e.g. ChatGPT default) — only de-identified prompts (Tier C). APP 8 disclosure required if any PII slips through.',
      'Step 5: Document the decision once per tool in your AI register. Repeat annually or on vendor change.',
    ],
  },

  // ============ TOOL SELECTION ============
  {
    id: 'tier-abc-framework',
    title: 'Tier A / B / C framework',
    category: 'Tool Selection',
    oneLiner: 'Decision framework for picking an LLM based on whether the prompt contains PII.',
    icon: Scale,
    taughtIn: 'tool-selection',
    contents: [
      'Tier A — Healthcare-purpose-built, AU residency, DPA signed. Safe for identifiable patient data. Examples: Heidi (CEA-recommended scribe), Lyrebird, Halo, Dragon Copilot for Healthcare.',
      'Tier B — Enterprise general LLM with AU region configured + DPA. Safe for PII when configured correctly. Examples: Azure OpenAI Sydney region, AWS Bedrock Sydney, Vertex AI Sydney.',
      'Tier C — Consumer LLM, no AU residency, no DPA. NEVER paste identifiable patient data. De-identified prompts only. Examples: ChatGPT, Claude (consumer), Gemini, Perplexity.',
      'Default question for every task: does this prompt contain identifiable patient data? If yes → Tier A or B. If no (truly de-identified) → Tier C acceptable.',
    ],
  },
  {
    id: 'vendor-evaluation',
    title: 'AI tool vendor evaluation checklist',
    category: 'Tool Selection',
    oneLiner: '12-point vendor due-diligence checklist for adding a new AI tool to your practice.',
    icon: FileSearch,
    contents: [
      'Australian entity (ABN searchable) OR Australian subsidiary with local liability.',
      'AU-region data storage (region documented, not just "available on request").',
      'Data Processing Agreement signed and on file.',
      'TGA classification confirmed — diagnostic-claims tools must be TGA-registered.',
      'AHPRA-clinician-friendly language in the EULA — no "AI for diagnosis" claims that move it into SaMD territory.',
      'Audit log capability — clinician can export a record of which prompts were sent.',
      'Encryption at rest and in transit (TLS 1.3+).',
      'Breach notification SLA (within 72 hours, in line with mandatory notifiable data breach rules).',
      'Retention policy — recordings deleted after note generation; raw prompts not retained beyond service window.',
      'Subprocessor list — who else gets to touch the data (OpenAI, Anthropic, etc.)?',
      'Indemnity insurer awareness — confirmed Avant / MIPS / MIGA / Guild accept this tool.',
      'Trial period — minimum 30 days free with full data deletion on cancellation.',
    ],
  },

  // ============ DOCUMENTATION & AUDIT ============
  {
    id: 'audit-ready-note',
    title: 'AHPRA-audit-ready clinical note template',
    category: 'Documentation & Audit',
    oneLiner: 'SOAP note format with AI scribe assistance — what survives an AHPRA notification.',
    icon: ClipboardCheck,
    taughtIn: 'documentation-workflows',
    contents: [
      'Subjective: AI-drafted, clinician-verified. Free-text.',
      'Objective: AI-drafted, clinician-verified. Examination findings, vitals, scores.',
      'Assessment: Clinician-authored. NEVER AI-only — diagnostic reasoning is the clinician\'s responsibility.',
      'Plan: AI-drafted (treatment plan options), clinician-finalised. Patient-specific tailoring required.',
      'Standard footer: "AI scribe consent obtained. Note drafted with [vendor name] AI assistance and reviewed by [clinician name, AHPRA reg #] before signing."',
      'Audit-survival test: if AHPRA asked you to produce this note in 6 months, would the clinical reasoning be clear from the record alone? If no — add to Assessment.',
    ],
  },
  {
    id: 'ai-register',
    title: 'AI tool register (practice-wide)',
    category: 'Documentation & Audit',
    oneLiner: 'Single-source-of-truth document of every AI tool your practice uses, with tier classification + DPA status.',
    icon: ClipboardCheck,
    contents: [
      'Columns: Tool name · Vendor · Tier (A/B/C) · AU residency? · DPA signed (Y/N + date) · Date added · Reviewed (date) · Approved by · Notes.',
      'Update on: new tool added, vendor change of terms, annual audit.',
      'Storage: clinic shared drive (encrypted), accessible to all clinicians + practice manager.',
      'Worth maintaining even for solo practitioners — proves to indemnity insurer / AHPRA that you tracked your AI use systematically.',
    ],
  },

  // ============ INCIDENT RESPONSE ============
  {
    id: 'ai-incident-response',
    title: 'AI-related incident response plan',
    category: 'Incident Response',
    oneLiner: 'What to do when AI gets it wrong — clinical error pathway.',
    icon: AlertTriangle,
    contents: [
      'Step 1 (within 24 hours): Identify the error. Document what the AI produced vs what was clinically correct. Preserve the AI output (screenshot or log).',
      'Step 2: Assess clinical harm. If patient is at risk, take immediate clinical action — same standard as any clinical error.',
      'Step 3: Disclosure obligation — under Open Disclosure standards, material harm requires disclosure to the patient. AI involvement is part of that disclosure.',
      'Step 4: Notify indemnity insurer (Avant / MIPS / MIGA / Guild). They typically require notification within 30 days of becoming aware of any error that might lead to a claim.',
      'Step 5: AHPRA notification — only if the error meets the threshold for mandatory notification (impaired ability to practise, etc.). Most AI errors will not — but document the decision.',
      'Step 6: Privacy breach notification (NDB scheme) — only if there was unauthorised access or disclosure of PII. AI producing wrong content is not a privacy breach unless it disclosed someone else\'s data.',
      'Step 7: Vendor notification — most vendor agreements require timely notification of clinical incidents involving their tool.',
    ],
  },
  {
    id: 'data-breach-flow',
    title: 'AI-related data breach flowchart',
    category: 'Incident Response',
    oneLiner: 'Mandatory notifiable data breach (NDB) decision flow when an AI tool leaks PII.',
    icon: ShieldCheck,
    contents: [
      'Was identifiable patient information exposed to a party who shouldn\'t have seen it? (Could be a vendor breach, your own misconfiguration, or accidental cross-account contamination.)',
      'If yes → quantify scope: how many patients, what data fields, when did the exposure start/end.',
      'Likely to result in serious harm? (Identity theft, embarrassment, discrimination, physical risk.) If yes → mandatory NDB notification within 30 days.',
      'NDB notification recipients: affected individuals + OAIC.',
      'Co-notify: indemnity insurer, vendor (if not the source they need to know), practice partners.',
      'Document the chronology — what you knew, when, and what you did about it. The OAIC reviews this.',
    ],
  },
]

export const TOOLKIT_CATEGORIES: ToolkitCategory[] = [
  'Consent & Disclosure',
  'De-identification & Privacy',
  'Tool Selection',
  'Documentation & Audit',
  'Incident Response',
]
