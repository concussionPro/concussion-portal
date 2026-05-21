/**
 * Sources monitored by the monthly content-refresh cron at
 * /api/cron/ai-course-content-refresh.
 *
 * Each source has a URL + an extractor (a short description of what to
 * watch for) + a relevance-to-course note. The cron fetches each source,
 * snapshots the response (or a content excerpt for HTML), compares against
 * the previous snapshot stored in ai_course_source_snapshots, and emails
 * Zac a digest of what changed.
 *
 * If a change matters, Zac updates the affected module markdown and
 * commits. If it doesn't, he ignores. Either way, the cron keeps the next
 * snapshot current.
 */

export interface ContentSource {
  id: string
  category: 'regulator' | 'insurer' | 'tool-vendor' | 'professional-body'
  name: string
  url: string
  watchFor: string
  affectsModules: string[]
}

export const CONTENT_SOURCES: ContentSource[] = [
  {
    id: 'ahpra-ai-guidance',
    category: 'regulator',
    name: 'AHPRA — AI in healthcare',
    url: 'https://www.ahpra.gov.au/Resources/Artificial-intelligence-in-healthcare.aspx',
    watchFor: 'AHPRA Code of Conduct updates, new guidance documents, FAQ revisions',
    affectsModules: ['module-1-compliance'],
  },
  {
    id: 'oaic-app-guidelines',
    category: 'regulator',
    name: 'OAIC — Australian Privacy Principles guidelines',
    url: 'https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines',
    watchFor: 'APP guideline revisions, particularly APP 6, APP 8, APP 11',
    affectsModules: ['module-1-compliance', 'module-3-documentation'],
  },
  {
    id: 'oaic-ai-guidance',
    category: 'regulator',
    name: 'OAIC — Privacy and AI',
    url: 'https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/general-advice-on-privacy/guidance-on-privacy-and-the-use-of-commercially-available-ai-products',
    watchFor: 'New OAIC guidance on commercial AI products, healthcare-specific notes',
    affectsModules: ['module-1-compliance', 'module-2-tools'],
  },
  {
    id: 'oaic-ndb-scheme',
    category: 'regulator',
    name: 'OAIC — Notifiable Data Breach scheme',
    url: 'https://www.oaic.gov.au/privacy/notifiable-data-breaches',
    watchFor: 'NDB statistics, threshold guidance, recent breach reports involving health data or AI',
    affectsModules: ['module-1-compliance'],
  },
  {
    id: 'tga-advertising-code',
    category: 'regulator',
    name: 'TGA — Therapeutic Goods Advertising Code',
    url: 'https://www.tga.gov.au/resources/resource/guidance/therapeutic-goods-advertising-code',
    watchFor: 'Code revisions, AI-specific guidance, supplement / complementary medicine notes',
    affectsModules: ['module-1-compliance', 'module-4-patient-comms', 'module-5-naturopath'],
  },
  {
    id: 'avant-ai-position',
    category: 'insurer',
    name: 'Avant — AI use in practice',
    url: 'https://www.avant.org.au',
    watchFor: 'Avant published positions, factsheets, or risk advisory bulletins on AI',
    affectsModules: ['module-1-compliance'],
  },
  {
    id: 'mips-ai-position',
    category: 'insurer',
    name: 'MIPS — Member resources',
    url: 'https://www.mips.com.au',
    watchFor: 'MIPS published positions on AI use',
    affectsModules: ['module-1-compliance'],
  },
  {
    id: 'guild-ai-position',
    category: 'insurer',
    name: 'Guild Insurance — Risk HQ',
    url: 'https://www.guildinsurance.com.au/learn/risk-hq',
    watchFor: 'Allied health AI risk advisory, Risk HQ articles',
    affectsModules: ['module-1-compliance'],
  },
  {
    id: 'heidi-changelog',
    category: 'tool-vendor',
    name: 'Heidi Health — product updates',
    url: 'https://www.heidihealth.com',
    watchFor: 'New features, pricing changes, AU residency changes',
    affectsModules: ['module-2-tools'],
  },
  {
    id: 'lyrebird-changelog',
    category: 'tool-vendor',
    name: 'Lyrebird Health — product updates',
    url: 'https://www.lyrebirdhealth.com',
    watchFor: 'New features, pricing changes',
    affectsModules: ['module-2-tools'],
  },
  {
    id: 'racgp-ai',
    category: 'professional-body',
    name: 'RACGP — AI guidance',
    url: 'https://www.racgp.org.au',
    watchFor: 'RACGP published positions and guidance on AI use in general practice',
    affectsModules: ['module-1-compliance', 'module-5-gp'],
  },
  {
    id: 'oa-ai',
    category: 'professional-body',
    name: 'Osteopathy Australia — practice resources',
    url: 'https://osteopathy.org.au',
    watchFor: 'OA-published AI guidance for osteopath members',
    affectsModules: ['module-5-osteopath'],
  },
]
