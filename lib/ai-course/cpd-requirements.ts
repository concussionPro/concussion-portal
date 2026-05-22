/**
 * Per-profession AHPRA CPD requirements — canonical data.
 *
 * Verified 2026-05-22 against each Board's published registration
 * standard. Full sourcing in docs/ahpra-cpd-requirements.md.
 *
 * Used by:
 * - CPD record dashboard (per-profession requirements view)
 * - Passive-CPD demo (per-profession honest ceiling)
 * - Pitch artefacts (calibrated claims per audience)
 *
 * Re-verify quarterly via /api/cron/ai-course-content-refresh.
 */

export interface CpdCategory {
  name: string
  type: 'formal' | 'self-directed' | 'interactive' | 'practice-based' | 'mixed'
  minHours?: number
  examples: string
  passiveActivityRecognised: 'yes' | 'partial' | 'no'
}

export interface AhpraBoard {
  slug: string
  name: string
  profession: string
  annualHours: number | null
  cycleYears?: number
  cycleHours?: number
  categories: CpdCategory[]
  selfDirectedAllowance: 'unrestricted' | 'capped' | 'minimum-interactive-required'
  passiveCeilingPercent: number
  hardMinNonPassiveHours: number
  recordingRequirements: string
  standardUrl: string
  auditNotes?: string
}

export interface CpdHome {
  slug: string
  name: string
  forProfession: string
  cycleYears: number
  totalCycleHours: number
  categories: CpdCategory[]
  url: string
}

export const CPD_HOMES: CpdHome[] = [
  {
    slug: 'racgp',
    name: 'RACGP CPD Program',
    forProfession: 'GP (RACGP CPD Home)',
    cycleYears: 1,
    totalCycleHours: 50,
    categories: [
      { name: 'Educational Activities (EA)', type: 'formal', minHours: 12.5, examples: 'Reading, lectures, conferences, podcasts, structured online modules.', passiveActivityRecognised: 'yes' },
      { name: 'Reviewing Performance (RP)', type: 'practice-based', minHours: 5, examples: 'Case review, peer review, supervision, case-based discussion.', passiveActivityRecognised: 'partial' },
      { name: 'Measuring Outcomes (MO)', type: 'practice-based', minHours: 5, examples: 'Clinical audit, patient outcome measurement, practice improvement.', passiveActivityRecognised: 'no' },
      { name: 'Free choice', type: 'mixed', minHours: 12.5, examples: '12.5 hrs across any of the three categories above.', passiveActivityRecognised: 'yes' },
    ],
    url: 'https://www.racgp.org.au/education/professional-development/cpd',
  },
  {
    slug: 'acrrm',
    name: 'ACRRM CPD Program',
    forProfession: 'Rural GP (ACRRM CPD Home)',
    cycleYears: 1,
    totalCycleHours: 50,
    categories: [
      { name: 'Educational Activities', type: 'formal', minHours: 12.5, examples: 'Reading, courses, lectures, workshops, conferences.', passiveActivityRecognised: 'yes' },
      { name: 'Performance Review', type: 'practice-based', minHours: 5, examples: 'Case-based discussion, peer review, supervision.', passiveActivityRecognised: 'partial' },
      { name: 'Outcome Measurement', type: 'practice-based', minHours: 5, examples: 'Clinical audit, outcome measurement, QI.', passiveActivityRecognised: 'no' },
      { name: 'Free choice', type: 'mixed', minHours: 12.5, examples: '12.5 hrs flex across the three.', passiveActivityRecognised: 'yes' },
    ],
    url: 'https://www.acrrm.org.au/training-and-cpd/cpd-program',
  },
]

export const AHPRA_BOARDS: AhpraBoard[] = [
  {
    slug: 'medical',
    name: 'Medical Board of Australia',
    profession: 'Medical Practitioner',
    annualHours: 50,
    categories: [
      { name: 'Educational Activities', type: 'formal', minHours: 12.5, examples: 'Reading, lectures, conferences, podcasts. Passive activity recognised.', passiveActivityRecognised: 'yes' },
      { name: 'Reviewing Performance + Measuring Outcomes', type: 'practice-based', minHours: 25, examples: 'Min 5 hrs each in RP and MO. Requires feedback/data on own practice.', passiveActivityRecognised: 'partial' },
      { name: 'Free choice', type: 'mixed', minHours: 12.5, examples: 'Distributed across the three above.', passiveActivityRecognised: 'yes' },
    ],
    selfDirectedAllowance: 'minimum-interactive-required',
    passiveCeilingPercent: 50,
    hardMinNonPassiveHours: 25,
    recordingRequirements: 'CPD Home (RACGP, ACRRM, or specialist college) tracks activity. PDP + reflection required for RP/MO. Retain evidence 3+ years.',
    standardUrl: 'https://www.medicalboard.gov.au/Codes-Guidelines-Policies/FAQ/FAQ-general-registration-CPD.aspx',
    auditNotes: 'AMC audits CPD Homes; Homes audit individual members. ~5% of cohort annually.',
  },
  {
    slug: 'nursing-midwifery',
    name: 'Nursing and Midwifery Board',
    profession: 'Nurse / Midwife',
    annualHours: 20,
    categories: [
      { name: 'CPD activities', type: 'mixed', examples: 'No mandated categories. Any activity relevant to context of practice. Reading, online modules, mentoring, work-based learning all count.', passiveActivityRecognised: 'yes' },
    ],
    selfDirectedAllowance: 'unrestricted',
    passiveCeilingPercent: 100,
    hardMinNonPassiveHours: 0,
    recordingRequirements: 'Written documentation of all 20 hrs. Reflection encouraged. Retain 5 years.',
    standardUrl: 'https://www.nursingmidwiferyboard.gov.au/Codes-Guidelines-Statements/FAQ/CPD-FAQ-for-nurses-and-midwives.aspx',
    auditNotes: '~5% of registrants annually. Evidence within 28 days.',
  },
  {
    slug: 'physiotherapy',
    name: 'Physiotherapy Board',
    profession: 'Physiotherapist',
    annualHours: 20,
    categories: [
      { name: 'CPD activities', type: 'mixed', examples: 'No prescribed categories. Board expects a mix. Reading, online modules, peer discussion, structured learning all count.', passiveActivityRecognised: 'yes' },
    ],
    selfDirectedAllowance: 'unrestricted',
    passiveCeilingPercent: 100,
    hardMinNonPassiveHours: 0,
    recordingRequirements: 'CPD portfolio retained 5 years.',
    standardUrl: 'https://www.physiotherapyboard.gov.au/Codes-Guidelines/CPD-guidelines.aspx',
    auditNotes: 'Random audit at renewal.',
  },
  {
    slug: 'osteopathy',
    name: 'Osteopathy Board',
    profession: 'Osteopath',
    annualHours: 25,
    categories: [
      { name: 'Mandatory topics', type: 'formal', minHours: 4, examples: 'Topics specified annually by the Board.', passiveActivityRecognised: 'partial' },
      { name: 'Open choice', type: 'mixed', examples: 'Up to 21 hrs of free choice. Reading, research, case-based learning, courses all count.', passiveActivityRecognised: 'yes' },
    ],
    selfDirectedAllowance: 'unrestricted',
    passiveCeilingPercent: 84,
    hardMinNonPassiveHours: 4,
    recordingRequirements: 'CPD logbook with hours and outcomes per activity.',
    standardUrl: 'https://www.osteopathyboard.gov.au/Registration-Standards.aspx',
    auditNotes: 'Random audit annually. First-aid cert is separate from the 25-hr requirement.',
  },
  {
    slug: 'chiropractic',
    name: 'Chiropractic Board',
    profession: 'Chiropractor',
    annualHours: 25,
    categories: [
      { name: 'Mandatory topics', type: 'formal', minHours: 4, examples: 'Topics specified annually by the Board.', passiveActivityRecognised: 'partial' },
      { name: 'Open choice', type: 'mixed', examples: 'Up to 21 hrs free choice. Must improve patient outcomes; must be evidence-based.', passiveActivityRecognised: 'yes' },
    ],
    selfDirectedAllowance: 'unrestricted',
    passiveCeilingPercent: 84,
    hardMinNonPassiveHours: 4,
    recordingRequirements: 'CPD records retained 5 years.',
    standardUrl: 'https://www.chiropracticboard.gov.au/Registration-Standards.aspx',
  },
  {
    slug: 'psychology',
    name: 'Psychology Board',
    profession: 'Psychologist',
    annualHours: 30,
    categories: [
      { name: 'Peer consultation (interactive)', type: 'interactive', minHours: 10, examples: 'Structured peer consultation, supervision. Hard minimum 10 hrs.', passiveActivityRecognised: 'no' },
      { name: 'General CPD', type: 'mixed', examples: 'Up to 20 hrs across reading, courses, case research.', passiveActivityRecognised: 'yes' },
    ],
    selfDirectedAllowance: 'minimum-interactive-required',
    passiveCeilingPercent: 67,
    hardMinNonPassiveHours: 10,
    recordingRequirements: 'CPD log with reflection on each activity.',
    standardUrl: 'https://www.psychologyboard.gov.au/Standards-and-Guidelines/Registration-Standards.aspx',
    auditNotes: '~10% of registrants annually — highest audit rate of all Boards.',
  },
  {
    slug: 'dental',
    name: 'Dental Board',
    profession: 'Dental Practitioner',
    annualHours: 20,
    cycleYears: 3,
    cycleHours: 60,
    categories: [
      { name: 'Clinical / scientific', type: 'mixed', minHours: 48, examples: '≥80% of the 60-hr cycle must be clinical or scientific.', passiveActivityRecognised: 'partial' },
      { name: 'Non-scientific', type: 'mixed', examples: '≤20% (12 hrs across the cycle) can be non-clinical: ethics, practice management.', passiveActivityRecognised: 'yes' },
    ],
    selfDirectedAllowance: 'capped',
    passiveCeilingPercent: 65,
    hardMinNonPassiveHours: 21,
    recordingRequirements: 'CPD record per activity. CPR currency required separately.',
    standardUrl: 'https://www.dentalboard.gov.au/Registration-Standards.aspx',
  },
  {
    slug: 'pharmacy',
    name: 'Pharmacy Board',
    profession: 'Pharmacist',
    annualHours: 40,
    categories: [
      { name: 'Group 1 — Information/knowledge', type: 'self-directed', examples: 'Reading, lectures, podcasts. 1 credit per hour. Capped at 50% of total.', passiveActivityRecognised: 'yes' },
      { name: 'Group 2 — Knowledge + assessment', type: 'mixed', examples: 'Structured learning with assessment. 2 credits per hour.', passiveActivityRecognised: 'partial' },
      { name: 'Group 3 — Practice improvement', type: 'practice-based', examples: 'QI projects with measured outcomes. 3 credits per hour.', passiveActivityRecognised: 'no' },
    ],
    selfDirectedAllowance: 'capped',
    passiveCeilingPercent: 50,
    hardMinNonPassiveHours: 20,
    recordingRequirements: 'Plan + record + reflection per activity. Groups 2 and 3 require application of learning.',
    standardUrl: 'https://www.pharmacyboard.gov.au/Registration-Standards.aspx',
    auditNotes: 'Pharmacy uses CPD CREDITS not hours. 40 credits ≈ 20-40 hours depending on mix.',
  },
  {
    slug: 'optometry',
    name: 'Optometry Board',
    profession: 'Optometrist',
    annualHours: 30,
    categories: [
      { name: 'Interactive', type: 'interactive', minHours: 5, examples: 'Live or interactive activities. 2 of 5 must be therapeutic if endorsed.', passiveActivityRecognised: 'no' },
      { name: 'General CPD', type: 'mixed', examples: 'Reading, research, case-based learning, online modules.', passiveActivityRecognised: 'yes' },
    ],
    selfDirectedAllowance: 'minimum-interactive-required',
    passiveCeilingPercent: 83,
    hardMinNonPassiveHours: 5,
    recordingRequirements: 'Portfolio + Learning Plan. Therapeutic-endorsed need 10 hrs therapeutic content.',
    standardUrl: 'https://www.optometryboard.gov.au/Registration-Standards.aspx',
    auditNotes: 'Non-therapeutic endorsed = 20 hrs/yr requirement.',
  },
  {
    slug: 'podiatry',
    name: 'Podiatry Board',
    profession: 'Podiatrist',
    annualHours: 20,
    categories: [
      { name: 'Interactive', type: 'interactive', minHours: 5, examples: 'Live, peer-led or interactive activities.', passiveActivityRecognised: 'no' },
      { name: 'General CPD', type: 'mixed', examples: 'Reading, research, online modules, case discussion.', passiveActivityRecognised: 'yes' },
    ],
    selfDirectedAllowance: 'minimum-interactive-required',
    passiveCeilingPercent: 75,
    hardMinNonPassiveHours: 5,
    recordingRequirements: 'CPD log with hours and outcomes per activity.',
    standardUrl: 'https://www.podiatryboard.gov.au/Registration-Standards.aspx',
    auditNotes: 'Scheduled medicines endorsement adds 10 hrs. Surgeons add 20 hrs.',
  },
  {
    slug: 'occupational-therapy',
    name: 'Occupational Therapy Board',
    profession: 'Occupational Therapist',
    annualHours: 20,
    categories: [
      { name: 'Interactive', type: 'interactive', minHours: 5, examples: 'Peer learning, structured group activity, supervision.', passiveActivityRecognised: 'no' },
      { name: 'Portfolio CPD', type: 'mixed', examples: 'Self-directed learning with goals documented. Reading, online modules, case research.', passiveActivityRecognised: 'yes' },
    ],
    selfDirectedAllowance: 'minimum-interactive-required',
    passiveCeilingPercent: 75,
    hardMinNonPassiveHours: 5,
    recordingRequirements: 'Portfolio with learning goals and outcomes per activity.',
    standardUrl: 'https://www.occupationaltherapyboard.gov.au/Registration-Standards.aspx',
  },
  {
    slug: 'paramedicine',
    name: 'Paramedicine Board',
    profession: 'Paramedic',
    annualHours: 30,
    categories: [
      { name: 'Interactive', type: 'interactive', minHours: 8, examples: 'Live, peer-led or interactive activities.', passiveActivityRecognised: 'no' },
      { name: 'General CPD', type: 'mixed', examples: 'Reading, online modules, case research.', passiveActivityRecognised: 'yes' },
    ],
    selfDirectedAllowance: 'minimum-interactive-required',
    passiveCeilingPercent: 73,
    hardMinNonPassiveHours: 8,
    recordingRequirements: 'CPD log with reflection on each activity.',
    standardUrl: 'https://www.paramedicineboard.gov.au/Registration-Standards.aspx',
    auditNotes: 'Annual random audit.',
  },
  {
    slug: 'medical-radiation',
    name: 'Medical Radiation Practice Board',
    profession: 'Medical Radiation Practitioner',
    annualHours: 10,
    cycleYears: 3,
    cycleHours: 60,
    categories: [
      { name: 'Substantive CPD', type: 'mixed', minHours: 35, examples: '≥35 hrs over 3-yr cycle must be substantive (directly clinically relevant).', passiveActivityRecognised: 'partial' },
      { name: 'General CPD', type: 'mixed', examples: 'Up to 25 hrs broader practitioner development.', passiveActivityRecognised: 'yes' },
    ],
    selfDirectedAllowance: 'capped',
    passiveCeilingPercent: 60,
    hardMinNonPassiveHours: 0,
    recordingRequirements: 'CPD log retained for at least one cycle (3 years).',
    standardUrl: 'https://www.medicalradiationpracticeboard.gov.au/Registration-Standards.aspx',
  },
  {
    slug: 'chinese-medicine',
    name: 'Chinese Medicine Board',
    profession: 'Chinese Medicine Practitioner',
    annualHours: 20,
    categories: [
      { name: 'Interactive', type: 'interactive', minHours: 5, examples: 'Live or webinar-based activities.', passiveActivityRecognised: 'no' },
      { name: 'Ethics / regulatory', type: 'formal', minHours: 4, examples: 'Professional ethics and regulatory content.', passiveActivityRecognised: 'partial' },
      { name: 'General CPD', type: 'mixed', examples: 'Reading, research, case-based learning. ~11 hrs.', passiveActivityRecognised: 'yes' },
    ],
    selfDirectedAllowance: 'minimum-interactive-required',
    passiveCeilingPercent: 55,
    hardMinNonPassiveHours: 9,
    recordingRequirements: 'Portfolio retained 5 years.',
    standardUrl: 'https://www.chinesemedicineboard.gov.au/Registration-Standards.aspx',
    auditNotes: 'Scheduled herbs endorsement adds 2 hrs.',
  },
  {
    slug: 'atsi-health',
    name: 'Aboriginal and Torres Strait Islander Health Practice Board',
    profession: 'ATSI Health Practitioner',
    annualHours: 20,
    categories: [
      { name: 'Interactive', type: 'interactive', minHours: 5, examples: 'Live or peer-led activities.', passiveActivityRecognised: 'no' },
      { name: 'General CPD', type: 'mixed', examples: 'Culturally-relevant learning, formal training, reading.', passiveActivityRecognised: 'yes' },
    ],
    selfDirectedAllowance: 'minimum-interactive-required',
    passiveCeilingPercent: 75,
    hardMinNonPassiveHours: 5,
    recordingRequirements: 'CPD log with reflection.',
    standardUrl: 'https://www.atsihealthpracticeboard.gov.au/Registration-Standards.aspx',
  },
]

export function findBoard(slug: string): AhpraBoard | undefined {
  return AHPRA_BOARDS.find((b) => b.slug === slug)
}

export function findCpdHome(slug: string): CpdHome | undefined {
  return CPD_HOMES.find((h) => h.slug === slug)
}

export interface PassiveCeiling {
  board: AhpraBoard
  annualHours: number
  passiveHours: number
  passivePercent: number
  formalHours: number
}

/**
 * Realistic passive-CPD ceiling for a given profession. Calibrated per
 * Board's specific interactive / formal / outcome-measurement minimums.
 * Conservative — use these numbers in pitch artefacts, not the GP-centric
 * 60-80% headline.
 */
export function passiveCeiling(boardSlug: string): PassiveCeiling | null {
  const board = findBoard(boardSlug)
  if (!board) return null
  const annual = board.annualHours ?? (board.cycleHours && board.cycleYears ? board.cycleHours / board.cycleYears : 0)
  const passiveHours = Math.round((annual * board.passiveCeilingPercent) / 100)
  return {
    board,
    annualHours: annual,
    passiveHours,
    passivePercent: board.passiveCeilingPercent,
    formalHours: annual - passiveHours,
  }
}
