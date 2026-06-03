/**
 * Cold outreach engine — typed shapes for ProspectClinic, team mix,
 * local outreach targets, and email templates. The DB schema in
 * lib/prospect/schema.sql is the canonical source for column types;
 * these TS types mirror it for application code.
 */

export type State = 'NSW' | 'QLD' | 'VIC' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT'

export type ProspectStatus =
  | 'researching'
  | 'approved'
  | 'sent'
  | 'opened'
  | 'engaged'
  | 'replied'
  | 'won'
  | 'lost'
  | 'archived'

export type TravelBand =
  | 'within-2hr'        // A$0
  | 'within-4hr'        // A$300
  | 'within-6hr'        // A$600
  | 'within-10hr'       // A$1,000
  | 'flight-domestic'   // A$1,500
  | 'flight-far'        // A$2,500

export type ResearchSource = 'manual' | 'llm-extracted' | 'imported'

export type CohortRecommendation = 'essential' | 'recommended' | 'full-team'

/**
 * Per-discipline clinician counts. The pricing engine + content emphasis
 * are both derived from these numbers. Add new disciplines here as the
 * Hub Program scope expands.
 */
export interface ClinicTeam {
  osteopaths: number
  physiotherapists: number
  generalPractitioners: number
  sportsMedicineDoctors: number
  exercisePhys: number
  myotherapists: number
  remedialMassage: number
  practiceManager: number
  admin: number
}

export type Discipline = keyof ClinicTeam

export interface LocalTarget {
  type:
    | 'school'
    | 'sports-club'
    | 'gp-practice'
    | 'surf-life-saving'
    | 'triathlon'
    | 'cycling'
    | 'other'
  name: string
  url?: string
  priority: 1 | 2 | 3
  notes?: string
}

export interface ProspectClinic {
  id: number
  slug: string
  accessKey: string
  name: string
  shortName: string
  city: string
  state: State
  region: string
  contactFirstName: string
  contactFullName: string
  contactEmail: string
  contactRole?: string
  /** Discipline of the primary contact — drives T1 opening-line variant. */
  contactDiscipline: Discipline
  clinicWebsiteUrl: string
  team: ClinicTeam
  localTargets: LocalTarget[]
  travelBand: TravelBand
  travelSurcharge: number
  cohortRecommendation: CohortRecommendation
  status: ProspectStatus
  researchSource: ResearchSource
  validUntil: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
  /** P1 / P2 / etc — used in UTM campaign tagging. */
  priorityWave?: string
}

export type EmailTemplateSlug = 'initial' | 'followup' | 'final'

export interface EmailTemplate {
  slug: EmailTemplateSlug
  subjectTemplate: string
  bodyTemplate: string
  /** Discipline-aware opening block (HTML — lead + bullet points). */
  openingVariants: Record<Discipline, string>
  signedOffAt: Date | null
  signedOffBy: string | null
}

export interface OutreachLogEntry {
  id: number
  clinicId: number
  templateSlug: EmailTemplateSlug | 'custom'
  emailSubject: string
  emailBody: string
  sentAt: Date
  resendEmailId: string | null
  openedCount: number
  clickedCount: number
  repliedAt: Date | null
  replyText: string | null
  replySentiment: 'positive' | 'neutral' | 'negative' | 'blocker' | null
}

export interface PricingBreakdown {
  tier1Total: number          // online clinic license, one-time, AUD
  tier1SeatBreakdown: Array<{
    discipline: Discipline
    count: number
    perSeat: number
    subtotal: number
  }>
  tier1SubtotalBeforeDiscount: number
  tier1VolumeDiscountPct: number
  tier1VolumeDiscountAud: number
  tier2OnsiteBase: number     // 7500
  tier2Travel: number         // from band
  tier2Total: number          // base + travel
  combinedTotal: number
  /** Three cohort tiers per the on-site PDF — used on the landing. */
  cohortTiers: Array<{
    name: 'Essential' | 'Recommended' | 'Full team'
    clinicians: number
    perClinician: number
    total: number
    badge: string
    recommended: boolean
  }>
  publicRetailRate: number    // 1400, individual CCM Complete
}
