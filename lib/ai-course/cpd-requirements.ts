/**
 * Per-profession AHPRA CPD requirements.
 *
 * Each AHPRA National Board sets its own CPD registration standard.
 * Hour minimums, categories, and recording requirements vary
 * substantially. This module is the canonical reference used by:
 * - the CPD record dashboard (shows per-profession requirements)
 * - the passive-CPD demo (categorises activity per profession)
 * - the pitch documents (claims calibrated to specific profession)
 *
 * Numbers verified against each Board's published registration
 * standard as of 2026-05-22. See docs/ahpra-cpd-requirements.md
 * for full sources and detail. Re-verify quarterly via the
 * /api/cron/ai-course-content-refresh cron.
 */

export interface CpdCategory {
  /** Category name (e.g. "Educational Activities", "Reviewing Performance") */
  name: string
  /** Whether this category is "formal/structured" or "self-directed/independent" */
  type: 'formal' | 'self-directed' | 'practice-based' | 'mixed'
  /** Minimum hours required in this category, if any */
  minHours?: number
  /** Plain-language description of what counts */
  examples: string
  /** Does typical passive workflow activity (literature search, guideline review) count here? */
  passiveActivityRecognised: 'yes' | 'partial' | 'no'
}

export interface AhpraBoard {
  /** Slug — URL-safe identifier */
  slug: string
  /** Display name */
  name: string
  /** Profession noun (e.g. "Osteopath", "Physiotherapist") */
  profession: string
  /** Annual hours requirement */
  annualHours: number
  /** If the requirement is per cycle (not annual), state cycle length in years */
  cycleYears?: number
  /** Total hours per cycle (if cycle-based) */
  cycleHours?: number
  /** Categories recognised by this Board */
  categories: CpdCategory[]
  /** Does the Board explicitly allow self-directed CPD without a cap? */
  selfDirectedAllowance: 'unrestricted' | 'capped' | 'minimum-formal-required'
  /** Estimated % of total hours that could realistically be earned via passive workflow activity */
  passiveCeilingPercent: number
  /** Recording requirements summary */
  recordingRequirements: string
  /** Official Board CPD standard URL */
  standardUrl: string
  /** Audit frequency commentary */
  auditNotes?: string
}

/**
 * RACGP and ACRRM are not Boards but operate the CPD Homes that
 * Medical Board registrants use. Their category structure is the
 * most detailed and is the de-facto standard the platform maps to.
 */
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
    forProfession: 'GP (Royal Australian College of General Practitioners CPD Home)',
    cycleYears: 1,
    totalCycleHours: 50,
    categories: [
      {
        name: 'Educational Activities',
        type: 'formal',
        minHours: 12.5,
        examples: 'Accredited courses, conferences, structured online modules, college webinars',
        passiveActivityRecognised: 'no',
      },
      {
        name: 'Reviewing Performance',
        type: 'practice-based',
        minHours: 5,
        examples: 'Case review, peer review, supervision, audit, clinical case discussion',
        passiveActivityRecognised: 'partial',
      },
      {
        name: 'Measuring Outcomes',
        type: 'practice-based',
        minHours: 5,
        examples: 'Clinical audit, patient outcome measurement, practice improvement projects',
        passiveActivityRecognised: 'no',
      },
    ],
    url: 'https://www.racgp.org.au/education/professional-development/cpd',
  },
  {
    slug: 'acrrm',
    name: 'ACRRM CPD Program',
    forProfession: 'Rural GP (Australian College of Rural and Remote Medicine CPD Home)',
    cycleYears: 1,
    totalCycleHours: 50,
    categories: [
      {
        name: 'Educational Activities',
        type: 'formal',
        minHours: 12.5,
        examples: 'Accredited courses, conferences, structured online modules',
        passiveActivityRecognised: 'no',
      },
      {
        name: 'Performance Review',
        type: 'practice-based',
        minHours: 5,
        examples: 'Case-based discussion, peer review, professional supervision',
        passiveActivityRecognised: 'partial',
      },
      {
        name: 'Outcome Measurement',
        type: 'practice-based',
        minHours: 5,
        examples: 'Clinical audit, outcome measurement, quality improvement',
        passiveActivityRecognised: 'no',
      },
    ],
    url: 'https://www.acrrm.org.au/training-and-cpd/cpd-program',
  },
]

/**
 * The 15 AHPRA National Boards. Hour requirements and category
 * structures verified 2026-05-22. The passiveCeilingPercent figure
 * is CEA's estimate of what an honest auto-tracker could capture
 * for a typical clinician — conservative.
 */
export const AHPRA_BOARDS: AhpraBoard[] = [
  {
    slug: 'medical',
    name: 'Medical Board of Australia',
    profession: 'Medical Practitioner',
    annualHours: 50,
    categories: [
      {
        name: 'Educational Activities',
        type: 'formal',
        minHours: 12.5,
        examples: 'Via CPD Home (RACGP, ACRRM, or specialist college). Courses, conferences, structured online modules.',
        passiveActivityRecognised: 'no',
      },
      {
        name: 'Reviewing Performance',
        type: 'practice-based',
        minHours: 5,
        examples: 'Case review, peer review, supervision, case-based discussion. Some literature review supporting a specific case may count.',
        passiveActivityRecognised: 'partial',
      },
      {
        name: 'Measuring Outcomes',
        type: 'practice-based',
        minHours: 5,
        examples: 'Clinical audit, patient outcome measurement, practice improvement projects.',
        passiveActivityRecognised: 'no',
      },
    ],
    selfDirectedAllowance: 'minimum-formal-required',
    passiveCeilingPercent: 20,
    recordingRequirements: 'CPD Home logs all activity. Reflection on Reviewing Performance and Measuring Outcomes activities required. Evidence must be retained for audit.',
    standardUrl: 'https://www.medicalboard.gov.au/Registration/Continuing-Professional-Development.aspx',
    auditNotes: 'Annual random audit of approximately 5% of registrants.',
  },
  {
    slug: 'osteopathy',
    name: 'Osteopathy Board of Australia',
    profession: 'Osteopath',
    annualHours: 25,
    categories: [
      {
        name: 'Active learning',
        type: 'formal',
        minHours: 15,
        examples: 'Structured courses, conferences, workshops, seminars, formal online modules with assessment',
        passiveActivityRecognised: 'no',
      },
      {
        name: 'Self-directed learning',
        type: 'self-directed',
        examples: 'Reading peer-reviewed journals, literature review, case research, reflective practice. Up to 10 hours of the 25-hour annual requirement.',
        passiveActivityRecognised: 'yes',
      },
    ],
    selfDirectedAllowance: 'capped',
    passiveCeilingPercent: 40,
    recordingRequirements: 'CPD logbook with description, hours, learning outcomes for each activity. Self-directed must include reflection on application to practice.',
    standardUrl: 'https://www.osteopathyboard.gov.au/Registration-Standards.aspx',
    auditNotes: 'Random audit of approximately 5% of registrants annually.',
  },
  {
    slug: 'physiotherapy',
    name: 'Physiotherapy Board of Australia',
    profession: 'Physiotherapist',
    annualHours: 20,
    categories: [
      {
        name: 'CPD activities',
        type: 'mixed',
        examples: 'Any activity that develops or maintains the practitioner\'s knowledge, skills, behaviour and competence. Includes formal courses, conferences, journal reading, case-based learning, peer discussion, supervision.',
        passiveActivityRecognised: 'yes',
      },
    ],
    selfDirectedAllowance: 'unrestricted',
    passiveCeilingPercent: 60,
    recordingRequirements: 'CPD record with date, activity, hours, learning outcome. Reflection encouraged but not mandatory for all activities.',
    standardUrl: 'https://www.physiotherapyboard.gov.au/Registration-Standards.aspx',
    auditNotes: 'Random audit of approximately 5% of registrants annually.',
  },
  {
    slug: 'nursing-midwifery',
    name: 'Nursing and Midwifery Board of Australia',
    profession: 'Nurse / Midwife',
    annualHours: 20,
    categories: [
      {
        name: 'CPD activities',
        type: 'mixed',
        examples: 'Any activity relevant to the registrant\'s context of practice. Includes formal study, professional reading, attending presentations, mentoring, work-based learning.',
        passiveActivityRecognised: 'yes',
      },
    ],
    selfDirectedAllowance: 'unrestricted',
    passiveCeilingPercent: 70,
    recordingRequirements: 'Portfolio of evidence including learning need identification, learning plan, activities undertaken, reflection. Strongly evidence-based recording standard.',
    standardUrl: 'https://www.nursingmidwiferyboard.gov.au/Registration-Standards.aspx',
    auditNotes: 'Random audit annually. The reflection requirement is the strictest of the major Boards.',
  },
  {
    slug: 'chiropractic',
    name: 'Chiropractic Board of Australia',
    profession: 'Chiropractor',
    annualHours: 25,
    categories: [
      {
        name: 'Formal learning',
        type: 'formal',
        minHours: 12.5,
        examples: 'Accredited courses, structured workshops, conferences',
        passiveActivityRecognised: 'no',
      },
      {
        name: 'Self-directed',
        type: 'self-directed',
        examples: 'Literature review, case-based learning, reading journals, professional reflection',
        passiveActivityRecognised: 'yes',
      },
    ],
    selfDirectedAllowance: 'capped',
    passiveCeilingPercent: 50,
    recordingRequirements: 'Logbook with activity, hours, outcomes. Reflection on self-directed required.',
    standardUrl: 'https://www.chiropracticboard.gov.au/Registration-Standards.aspx',
  },
  {
    slug: 'psychology',
    name: 'Psychology Board of Australia',
    profession: 'Psychologist',
    annualHours: 30,
    categories: [
      {
        name: 'Active CPD',
        type: 'formal',
        minHours: 10,
        examples: 'Courses, conferences, structured peer supervision',
        passiveActivityRecognised: 'no',
      },
      {
        name: 'Peer consultation',
        type: 'practice-based',
        minHours: 10,
        examples: 'Structured peer consultation, supervision discussion',
        passiveActivityRecognised: 'no',
      },
      {
        name: 'Self-directed',
        type: 'self-directed',
        examples: 'Literature review, journal reading, case research',
        passiveActivityRecognised: 'yes',
      },
    ],
    selfDirectedAllowance: 'capped',
    passiveCeilingPercent: 30,
    recordingRequirements: 'CPD log with reflection on each activity. Higher recording standard than most Boards.',
    standardUrl: 'https://www.psychologyboard.gov.au/Standards-and-Guidelines/Registration-Standards.aspx',
  },
  {
    slug: 'pharmacy',
    name: 'Pharmacy Board of Australia',
    profession: 'Pharmacist',
    annualHours: 40,
    categories: [
      {
        name: 'Group 1 / 2 / 3 activities',
        type: 'mixed',
        examples: 'Group 1: information-based (reading, lectures). Group 2: knowledge-application. Group 3: practice change with measured outcomes.',
        passiveActivityRecognised: 'yes',
      },
    ],
    selfDirectedAllowance: 'capped',
    passiveCeilingPercent: 50,
    recordingRequirements: 'Plan + record + reflection for each activity. Groups 2 and 3 require demonstrated learning application.',
    standardUrl: 'https://www.pharmacyboard.gov.au/Registration-Standards.aspx',
  },
  {
    slug: 'optometry',
    name: 'Optometry Board of Australia',
    profession: 'Optometrist',
    annualHours: 20,
    categories: [
      {
        name: 'Therapeutically-endorsed',
        type: 'mixed',
        examples: 'Includes clinically-relevant reading, conference attendance, peer review.',
        passiveActivityRecognised: 'partial',
      },
    ],
    selfDirectedAllowance: 'unrestricted',
    passiveCeilingPercent: 50,
    recordingRequirements: 'CPD log with activity, hours, outcomes.',
    standardUrl: 'https://www.optometryboard.gov.au/Registration-Standards.aspx',
  },
  {
    slug: 'podiatry',
    name: 'Podiatry Board of Australia',
    profession: 'Podiatrist',
    annualHours: 20,
    categories: [
      {
        name: 'CPD activities',
        type: 'mixed',
        examples: 'Reading, courses, conferences, peer learning, self-directed reflection.',
        passiveActivityRecognised: 'yes',
      },
    ],
    selfDirectedAllowance: 'unrestricted',
    passiveCeilingPercent: 60,
    recordingRequirements: 'CPD log with activity description, hours, outcomes.',
    standardUrl: 'https://www.podiatryboard.gov.au/Registration-Standards.aspx',
  },
  {
    slug: 'occupational-therapy',
    name: 'Occupational Therapy Board of Australia',
    profession: 'Occupational Therapist',
    annualHours: 30,
    categories: [
      {
        name: 'CPD activities',
        type: 'mixed',
        examples: 'Range of formal and informal learning. Includes literature review, case-based learning.',
        passiveActivityRecognised: 'yes',
      },
    ],
    selfDirectedAllowance: 'unrestricted',
    passiveCeilingPercent: 55,
    recordingRequirements: 'CPD record with learning outcomes documented per activity.',
    standardUrl: 'https://www.occupationaltherapyboard.gov.au/Registration-Standards.aspx',
  },
  {
    slug: 'dental',
    name: 'Dental Board of Australia',
    profession: 'Dental Practitioner',
    annualHours: 20,
    cycleYears: 3,
    cycleHours: 60,
    categories: [
      {
        name: 'Clinical CPD',
        type: 'formal',
        examples: 'Structured clinical learning relevant to scope of practice.',
        passiveActivityRecognised: 'partial',
      },
      {
        name: 'Non-clinical CPD',
        type: 'mixed',
        examples: 'Professional practice topics, ethics, communication. Reading recognised.',
        passiveActivityRecognised: 'yes',
      },
    ],
    selfDirectedAllowance: 'capped',
    passiveCeilingPercent: 35,
    recordingRequirements: 'CPD record per activity. CPR currency required separately.',
    standardUrl: 'https://www.dentalboard.gov.au/Registration-Standards.aspx',
  },
  {
    slug: 'paramedicine',
    name: 'Paramedicine Board of Australia',
    profession: 'Paramedic',
    annualHours: 30,
    categories: [
      {
        name: 'CPD activities',
        type: 'mixed',
        examples: 'Clinical CPD relevant to scope. Includes structured learning, peer review, reading.',
        passiveActivityRecognised: 'yes',
      },
    ],
    selfDirectedAllowance: 'unrestricted',
    passiveCeilingPercent: 55,
    recordingRequirements: 'CPD log with reflection on each activity.',
    standardUrl: 'https://www.paramedicineboard.gov.au/Registration-Standards.aspx',
  },
  {
    slug: 'medical-radiation',
    name: 'Medical Radiation Practice Board of Australia',
    profession: 'Medical Radiation Practitioner',
    annualHours: 20,
    cycleYears: 3,
    cycleHours: 60,
    categories: [
      {
        name: 'CPD activities',
        type: 'mixed',
        examples: 'Clinical CPD relevant to scope. Mix of formal courses and self-directed.',
        passiveActivityRecognised: 'partial',
      },
    ],
    selfDirectedAllowance: 'capped',
    passiveCeilingPercent: 40,
    recordingRequirements: 'CPD log retained for at least one cycle (3 years).',
    standardUrl: 'https://www.medicalradiationpracticeboard.gov.au/Registration-Standards.aspx',
  },
  {
    slug: 'chinese-medicine',
    name: 'Chinese Medicine Board of Australia',
    profession: 'Chinese Medicine Practitioner',
    annualHours: 20,
    categories: [
      {
        name: 'CPD activities',
        type: 'mixed',
        examples: 'Structured CPD, journal reading, conferences, peer learning.',
        passiveActivityRecognised: 'yes',
      },
    ],
    selfDirectedAllowance: 'unrestricted',
    passiveCeilingPercent: 55,
    recordingRequirements: 'CPD log with hours and outcomes per activity.',
    standardUrl: 'https://www.chinesemedicineboard.gov.au/Registration-Standards.aspx',
  },
  {
    slug: 'atsi-health',
    name: 'Aboriginal and Torres Strait Islander Health Practice Board of Australia',
    profession: 'Aboriginal and Torres Strait Islander Health Practitioner',
    annualHours: 20,
    categories: [
      {
        name: 'CPD activities',
        type: 'mixed',
        examples: 'Includes culturally-relevant learning, community of practice, formal training.',
        passiveActivityRecognised: 'yes',
      },
    ],
    selfDirectedAllowance: 'unrestricted',
    passiveCeilingPercent: 60,
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

/**
 * The "honest passive CPD ceiling" for a given profession. Used in the
 * passive-CPD demo to show realistic numbers per profession rather than
 * the GP-centric 60-80% headline.
 */
export function passiveCeilingHours(boardSlug: string): { board: AhpraBoard; hours: number; percent: number } | null {
  const board = findBoard(boardSlug)
  if (!board) return null
  const hours = Math.round((board.annualHours * board.passiveCeilingPercent) / 100)
  return { board, hours, percent: board.passiveCeilingPercent }
}
