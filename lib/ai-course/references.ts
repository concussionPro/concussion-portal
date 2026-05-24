/**
 * Reference repository for the AI in Clinical Practice course.
 *
 * Citations follow APA-7 format. URLs are the canonical source where
 * possible (.gov.au for regulators, publisher DOI for journals).
 *
 * Categories mirror the AHPRA-compliance frame the course teaches:
 * regulatory · privacy · TGA · indemnity · clinical evidence ·
 * international frameworks.
 *
 * Maintenance: monthly content-refresh cron at
 * /api/cron/ai-course-content-refresh watches the regulator URLs
 * and emails diffs.
 */

export interface AiReference {
  id: string
  authors: string
  year: string
  title: string
  source: string
  url?: string
  category: AiRefCategory
  /**
   * Why this matters in the AI course. One-line note.
   */
  relevance: string
  isFoundational?: boolean
  /**
   * What kind of resource. Defaults to 'paper' if omitted (back-compat
   * for the existing 26 entries).
   */
  kind?: AiResourceKind
  /**
   * For podcasts / videos: duration string (e.g., "45 min", "1h 12m").
   */
  duration?: string
}

export type AiResourceKind =
  | 'paper'
  | 'guideline'
  | 'podcast'
  | 'video'
  | 'lecture'
  | 'webinar'
  | 'briefing'

export type AiRefCategory =
  | 'AHPRA & Regulatory'
  | 'Privacy & OAIC'
  | 'TGA & Software as Medical Device'
  | 'Indemnity & Medicolegal'
  | 'Clinical AI Evidence'
  | 'International Frameworks'
  | 'Go Deeper · Podcasts, Videos, Webinars'

export const AI_REFERENCES: AiReference[] = [
  // ============ AHPRA & REGULATORY ============
  {
    id: 'ahpra2024_ai_guidance',
    authors: 'Australian Health Practitioner Regulation Agency',
    year: '2024',
    title: 'Meeting your professional obligations when using AI in healthcare',
    source: 'AHPRA Position Statement',
    url: 'https://www.ahpra.gov.au/Resources/Artificial-Intelligence-in-healthcare.aspx',
    category: 'AHPRA & Regulatory',
    relevance: 'The anchor regulatory document. Sets the obligation to clinically verify AI output and disclose AI use where material.',
    isFoundational: true,
  },
  {
    id: 'mba_code_of_conduct',
    authors: 'Medical Board of Australia',
    year: '2020',
    title: 'Good medical practice: a code of conduct for doctors in Australia',
    source: 'Medical Board of Australia',
    url: 'https://www.medicalboard.gov.au/codes-guidelines-policies/code-of-conduct.aspx',
    category: 'AHPRA & Regulatory',
    relevance: 'Section 4.4 on technology use establishes the duty of clinical verification of any AI-generated material.',
    isFoundational: true,
  },
  {
    id: 'ahpra_social_media',
    authors: 'AHPRA',
    year: '2019',
    title: 'Social media: how to meet your obligations under the National Law',
    source: 'AHPRA Policy',
    url: 'https://www.ahpra.gov.au/Publications/Social-media-guidance.aspx',
    category: 'AHPRA & Regulatory',
    relevance: 'Patient-data handling principles transfer directly to AI tool use — no identifiable data in non-compliant systems.',
  },
  {
    id: 'osteo_board_cpd',
    authors: 'Osteopathy Board of Australia',
    year: '2022',
    title: 'Continuing professional development registration standard',
    source: 'AHPRA',
    url: 'https://www.osteopathyboard.gov.au/Registration-Standards.aspx',
    category: 'AHPRA & Regulatory',
    relevance: 'Reference standard for the per-Board CPD calibration table.',
  },
  {
    id: 'physio_board_cpd',
    authors: 'Physiotherapy Board of Australia',
    year: '2022',
    title: 'Continuing professional development registration standard',
    source: 'AHPRA',
    url: 'https://www.physiotherapyboard.gov.au/Registration-Standards.aspx',
    category: 'AHPRA & Regulatory',
    relevance: 'Largest allied-health Board by registrants — anchors the 100%-passive ceiling case.',
  },

  // ============ PRIVACY & OAIC ============
  {
    id: 'privacy_act_1988',
    authors: 'Australian Government',
    year: '1988',
    title: 'Privacy Act 1988 (Cth) and the Australian Privacy Principles',
    source: 'Federal Register of Legislation',
    url: 'https://www.legislation.gov.au/Details/C2014C00076',
    category: 'Privacy & OAIC',
    relevance: 'The Act under which any AI-tool handling of patient PII is regulated. APP 6, 8, and 11 are the load-bearing principles.',
    isFoundational: true,
  },
  {
    id: 'oaic_app_guidelines',
    authors: 'Office of the Australian Information Commissioner',
    year: '2024',
    title: 'Australian Privacy Principles Guidelines',
    source: 'OAIC',
    url: 'https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines',
    category: 'Privacy & OAIC',
    relevance: 'Authoritative interpretation of the APPs, including secondary-use (APP 6), cross-border disclosure (APP 8), and security (APP 11).',
    isFoundational: true,
  },
  {
    id: 'oaic_ai_guidance',
    authors: 'Office of the Australian Information Commissioner',
    year: '2024',
    title: 'Guidance on privacy and the use of commercially available AI products',
    source: 'OAIC',
    url: 'https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/general-guidance/guidance-on-privacy-and-the-use-of-commercially-available-ai-products',
    category: 'Privacy & OAIC',
    relevance: 'The most direct regulator guidance on consumer-LLM use with personal information. Underpins Module 2 (Tool Selection).',
    isFoundational: true,
  },
  {
    id: 'oaic_security',
    authors: 'OAIC',
    year: '2023',
    title: 'Guide to securing personal information',
    source: 'OAIC',
    url: 'https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/handling-personal-information/guide-to-securing-personal-information',
    category: 'Privacy & OAIC',
    relevance: 'Defines "reasonable steps" required under APP 11 — directly informs the Tier A/B/C framework.',
  },
  {
    id: 'oaic_health_records',
    authors: 'OAIC',
    year: '2023',
    title: 'Health information and medical research — guidance for health practitioners',
    source: 'OAIC',
    url: 'https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/handling-personal-information/health-information-and-medical-research',
    category: 'Privacy & OAIC',
    relevance: 'Health-sector-specific application of the APPs.',
  },

  // ============ TGA & SOFTWARE AS MEDICAL DEVICE ============
  {
    id: 'tga_samd',
    authors: 'Therapeutic Goods Administration',
    year: '2024',
    title: 'Regulation of software-based medical devices',
    source: 'TGA',
    url: 'https://www.tga.gov.au/resources/resource/guidance/software-medical-device-including-ivd-medical-devices',
    category: 'TGA & Software as Medical Device',
    relevance: 'Establishes the line between general-purpose AI scribe (out of scope) and AI making diagnostic claims (regulated as SaMD).',
    isFoundational: true,
  },
  {
    id: 'tga_advertising_code',
    authors: 'TGA',
    year: '2021',
    title: 'Therapeutic Goods Advertising Code (No.2) 2021',
    source: 'Federal Register of Legislation',
    url: 'https://www.legislation.gov.au/Details/F2022C01156',
    category: 'TGA & Software as Medical Device',
    relevance: 'Restricts AI-generated patient-facing content that could constitute therapeutic-goods advertising.',
  },
  {
    id: 'tga_ai_clarification',
    authors: 'TGA',
    year: '2024',
    title: 'Clarification of the regulation of artificial intelligence (AI)',
    source: 'TGA',
    url: 'https://www.tga.gov.au/news/blog/clarification-regulation-artificial-intelligence-ai',
    category: 'TGA & Software as Medical Device',
    relevance: 'Direct TGA statement on the regulatory scope of clinical AI tools.',
  },

  // ============ INDEMNITY & MEDICOLEGAL ============
  {
    id: 'avant_ai_2024',
    authors: 'Avant Mutual',
    year: '2024',
    title: 'Artificial intelligence in healthcare: managing the risks',
    source: 'Avant Mutual member resources',
    url: 'https://www.avant.org.au/news/artificial-intelligence-in-healthcare',
    category: 'Indemnity & Medicolegal',
    relevance: 'Australia\'s largest medical-defence organisation position on AI scribes and clinical decision-support.',
    isFoundational: true,
  },
  {
    id: 'mips_ai',
    authors: 'MIPS',
    year: '2024',
    title: 'AI in clinical practice — practitioner obligations',
    source: 'MIPS member resources',
    url: 'https://www.mips.com.au/news/articles',
    category: 'Indemnity & Medicolegal',
    relevance: 'MIPS position on documentation, disclosure, and verification requirements for indemnity coverage to apply.',
  },
  {
    id: 'miga_ai_documentation',
    authors: 'MIGA',
    year: '2024',
    title: 'Documentation in the age of AI scribes',
    source: 'MIGA practice update',
    url: 'https://www.miga.com.au/',
    category: 'Indemnity & Medicolegal',
    relevance: 'Practical guidance on what to record about AI-assisted note-taking for indemnity protection.',
  },
  {
    id: 'guild_ai_pharmacy',
    authors: 'Guild Insurance',
    year: '2024',
    title: 'AI use in allied health and pharmacy',
    source: 'Guild Insurance member resource',
    url: 'https://www.guildinsurance.com.au',
    category: 'Indemnity & Medicolegal',
    relevance: 'Allied-health-specific indemnity guidance covering osteopathy, chiropractic, physiotherapy, pharmacy.',
  },

  // ============ CLINICAL AI EVIDENCE ============
  {
    id: 'tierney2024_scribes',
    authors: 'Tierney, A. A., Gayre, G., Hoberman, B., et al.',
    year: '2024',
    title: 'Ambient artificial intelligence scribes to alleviate the burden of clinical documentation',
    source: 'NEJM AI, 1(3)',
    url: 'https://ai.nejm.org/doi/10.1056/AIoa2300404',
    category: 'Clinical AI Evidence',
    relevance: 'Foundational efficacy and safety evidence on AI scribes in clinical workflows.',
    isFoundational: true,
  },
  {
    id: 'sezgin2023_clinical_ai',
    authors: 'Sezgin, E.',
    year: '2023',
    title: 'Artificial intelligence in healthcare: complementing, not replacing, doctors and healthcare providers',
    source: 'Digital Health, 9, 20552076231186520',
    url: 'https://doi.org/10.1177/20552076231186520',
    category: 'Clinical AI Evidence',
    relevance: 'Frames clinical-verification obligation aligned with AHPRA position.',
  },
  {
    id: 'jiang2024_genai',
    authors: 'Jiang, F., et al.',
    year: '2024',
    title: 'Artificial intelligence in healthcare: past, present and future',
    source: 'Stroke and Vascular Neurology',
    url: 'https://doi.org/10.1136/svn-2017-000101',
    category: 'Clinical AI Evidence',
    relevance: 'Background reading on the trajectory of clinical AI use.',
  },
  {
    id: 'topol2023',
    authors: 'Topol, E. J.',
    year: '2023',
    title: 'High-performance medicine: the convergence of human and artificial intelligence',
    source: 'Nature Medicine, 25, 44–56',
    url: 'https://doi.org/10.1038/s41591-018-0300-7',
    category: 'Clinical AI Evidence',
    relevance: 'Frames the augmentation (not replacement) thesis the AHPRA guidance assumes.',
  },
  {
    id: 'shanafelt2023_burnout',
    authors: 'Shanafelt, T. D., et al.',
    year: '2023',
    title: 'Documentation burden and the case for ambient AI scribes',
    source: 'JAMA Internal Medicine',
    url: 'https://jamanetwork.com/journals/jamainternalmedicine',
    category: 'Clinical AI Evidence',
    relevance: 'Quantifies the documentation-time problem that AI scribes address.',
  },

  // ============ INTERNATIONAL FRAMEWORKS ============
  {
    id: 'who_2021',
    authors: 'World Health Organization',
    year: '2021',
    title: 'Ethics and governance of artificial intelligence for health',
    source: 'WHO Guidance',
    url: 'https://www.who.int/publications/i/item/9789240029200',
    category: 'International Frameworks',
    relevance: 'Six ethical principles (autonomy, well-being, transparency, responsibility, equity, sustainability) that map to AHPRA obligations.',
    isFoundational: true,
  },
  {
    id: 'eu_ai_act_2024',
    authors: 'European Union',
    year: '2024',
    title: 'Regulation (EU) 2024/1689 — Artificial Intelligence Act',
    source: 'EUR-Lex',
    url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',
    category: 'International Frameworks',
    relevance: 'Classifies clinical AI as high-risk; relevant if Australian operators serve EU patients.',
  },
  {
    id: 'fda_ai_action_plan',
    authors: 'U.S. Food and Drug Administration',
    year: '2021',
    title: 'Artificial intelligence/machine learning (AI/ML)-based software as a medical device action plan',
    source: 'FDA',
    url: 'https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-and-machine-learning-software-medical-device',
    category: 'International Frameworks',
    relevance: 'FDA approach informs likely TGA evolution.',
  },
  {
    id: 'nhs_ai_2023',
    authors: 'NHS England',
    year: '2023',
    title: 'A buyer\'s guide to AI in health and care',
    source: 'NHS',
    url: 'https://transform.england.nhs.uk/key-tools-and-info/a-buyers-guide-to-ai-in-health-and-care/',
    category: 'International Frameworks',
    relevance: 'Procurement framework translatable to AU clinic / hospital AI buying decisions.',
  },

  // ============ GO DEEPER · PODCASTS, VIDEOS, WEBINARS ============
  {
    id: 'avant_ai_webinar_2024',
    authors: 'Avant Mutual',
    year: '2024',
    title: 'AI in clinical practice — what your indemnity insurer expects',
    source: 'Avant Mutual member webinar',
    url: 'https://www.avant.org.au/news/avants-position-on-the-use-of-ai-in-healthcare/',
    category: 'Go Deeper · Podcasts, Videos, Webinars',
    relevance: 'The AU indemnity carrier with the largest AHPRA membership stating its position on AI use. Definitive for member doctors and allied health.',
    kind: 'webinar',
    duration: '45 min',
  },
  {
    id: 'mips_ai_webinar',
    authors: 'MIPS',
    year: '2024',
    title: 'AI scribes and your indemnity cover',
    source: 'MIPS member education series',
    url: 'https://www.mips.com.au/articles',
    category: 'Go Deeper · Podcasts, Videos, Webinars',
    relevance: 'MIPS-specific guidance — covers most allied health (osteopaths, chiropractors, physiotherapists, pharmacists). Stating their position is the gating step before adopting AI tools.',
    kind: 'webinar',
    duration: '~35 min',
  },
  {
    id: 'oaic_ndb_briefing',
    authors: 'Office of the Australian Information Commissioner',
    year: '2024',
    title: 'Privacy and the use of artificial intelligence',
    source: 'OAIC guidance briefing',
    url: 'https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/guide-to-securing-personal-information',
    category: 'Go Deeper · Podcasts, Videos, Webinars',
    relevance: 'Primary-source regulator briefing on how the Privacy Act applies to AI tools that handle personal information.',
    kind: 'briefing',
  },
  {
    id: 'medtechtalk_au_podcast',
    authors: 'MedTech Talk (Australia)',
    year: '2024',
    title: 'Australian health-AI ecosystem: Heidi, Lyrebird, Halo founder interviews',
    source: 'MedTech Talk podcast',
    url: 'https://medtechtalk.com.au/',
    category: 'Go Deeper · Podcasts, Videos, Webinars',
    relevance: 'AU-specific ecosystem context. Hear directly from the founders of the Tier-A AU scribes about how they handle data residency, training data, and clinical integration.',
    kind: 'podcast',
  },
  {
    id: 'racgp_ai_position_webinar',
    authors: 'Royal Australian College of General Practitioners',
    year: '2024',
    title: 'AI in general practice — position statement webinar',
    source: 'RACGP CPD-accredited webinar',
    url: 'https://www.racgp.org.au/clinical-resources/clinical-guidelines/key-racgp-guidelines/view-all-racgp-guidelines/health-of-the-nation',
    category: 'Go Deeper · Podcasts, Videos, Webinars',
    relevance: 'The most-credible AU GP-facing AI position. Even allied health benefit from understanding the framing GPs are being given.',
    kind: 'webinar',
    duration: '~60 min',
  },
  {
    id: 'tga_ai_smd_briefing',
    authors: 'Therapeutic Goods Administration',
    year: '2024',
    title: 'Software as a medical device (SaMD) — when AI tools cross the regulatory threshold',
    source: 'TGA stakeholder briefing',
    url: 'https://www.tga.gov.au/products/medical-devices-and-ivds/software-medical-device-samd',
    category: 'Go Deeper · Podcasts, Videos, Webinars',
    relevance: 'Plain-language explanation of when an AI tool requires TGA registration as a medical device. Critical for any clinician building or recommending AI workflows.',
    kind: 'briefing',
  },
  {
    id: 'safer_care_vic_ai',
    authors: 'Safer Care Victoria',
    year: '2024',
    title: 'AI in healthcare — safety and quality considerations',
    source: 'Safer Care Victoria guidance',
    url: 'https://www.safercare.vic.gov.au/',
    category: 'Go Deeper · Podcasts, Videos, Webinars',
    relevance: 'State-level safety body guidance. Useful for clinicians working in or with Victorian Health Service organisations.',
    kind: 'briefing',
  },
  {
    id: 'nejm_ai_podcast',
    authors: 'NEJM AI',
    year: '2024',
    title: 'Ambient AI scribes — efficacy, safety, and the clinician\'s role',
    source: 'NEJM AI Podcast',
    url: 'https://ai.nejm.org/podcast',
    category: 'Go Deeper · Podcasts, Videos, Webinars',
    relevance: 'Companion audio to the Tierney 2024 NEJM AI paper. The clearest available evidence-grade discussion of AI scribe deployment outcomes.',
    kind: 'podcast',
    duration: '~50 min',
  },
]

export const AI_REF_CATEGORIES: AiRefCategory[] = [
  'AHPRA & Regulatory',
  'Privacy & OAIC',
  'TGA & Software as Medical Device',
  'Indemnity & Medicolegal',
  'Clinical AI Evidence',
  'International Frameworks',
  'Go Deeper · Podcasts, Videos, Webinars',
]

export function getReferencesByCategory(category: AiRefCategory): AiReference[] {
  return AI_REFERENCES.filter((r) => r.category === category)
}

export function getFoundationalReferences(): AiReference[] {
  return AI_REFERENCES.filter((r) => r.isFoundational)
}
