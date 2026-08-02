/**
 * CPD jurisdiction packs — the requirement data the rules engine runs on.
 *
 * TS literals (house style — see lib/competency-evidence.ts), versioned by
 * `version` + `verifiedBy`; a requirement change is a NEW pack version, never
 * an edit-in-place of history the user relied on. Every requirement line
 * carries the source URL it was verified against. Unknown = omitted, never
 * guessed. Packs not yet fact-checked by Zac ship with `beta: true` (UI chip).
 *
 * NOTE (AHPRA rewrite): the 14-board joint CPD standard review closed
 * consultation 17 Jul 2026 (drafts: 20 hrs/yr incl. 5 interactive). When the
 * revised standards commence, add new pack versions — do not edit these.
 */

export type CpdUnit = 'hours' | 'points'

export interface RequirementLine {
  id: string
  label: string
  /** Minimum required in `unit` for the period. */
  min: number
  /** 'cycle' = whole cycle window; 'year' = each registration year within it. */
  per: 'cycle' | 'year'
  /** Activities count toward this line only when tagged with this category.
   *  null = the total line (all activities count). */
  category: string | null
  sourceUrl: string
}

/** Non-hour obligations (plans, peer review, reflective statements) shown as
 *  a checklist — satisfied by a tagged activity of any duration. */
export interface ArtifactRequirement {
  id: string
  label: string
  cadence: 'year' | 'cycle'
  category: string
  sourceUrl: string
}

export interface CategoryDef {
  id: string
  label: string
}

export interface CpdCycle {
  /** fixed = anchored window of `years` length; rolling = trailing `years`
   *  window ending today (NZ physio). For rolling, the anchor still defines
   *  the renewal date used for the countdown (e.g. NZ APC year end 31 Mar). */
  windowType: 'fixed' | 'rolling'
  years: 1 | 2 | 3
  /** Window/renewal anchor: the month/day the cycle STARTS (1-indexed). */
  anchorMonth: number
  anchorDay: number
  /** For multi-year fixed cycles: a known cycle-start year to phase the
   *  window (e.g. OCNZ cycles start on odd years: 2025-04-01). */
  phaseYear?: number
}

export interface CpdPack {
  id: string
  body: string
  region: 'AU' | 'NZ'
  profession: string
  unit: CpdUnit
  cycle: CpdCycle
  categories: CategoryDef[]
  lines: RequirementLine[]
  artifacts: ArtifactRequirement[]
  /** Displayed obligations we do NOT count (e.g. first aid currency). */
  notes: string[]
  version: string
  verifiedBy: string
  beta?: boolean
}

const AHPRA_YEAR = { anchorMonth: 12, anchorDay: 1 } // registration year 1 Dec – 30 Nov

export const CPD_PACKS: CpdPack[] = [
  {
    id: 'au-osteo',
    body: 'Osteopathy Board of Australia (Ahpra)',
    region: 'AU',
    profession: 'Osteopath',
    unit: 'hours',
    cycle: { windowType: 'fixed', years: 1, ...AHPRA_YEAR },
    categories: [{ id: 'mandated-topics', label: 'Mandated topics (Board list)' }],
    lines: [
      {
        id: 'total',
        label: 'Total CPD',
        min: 25,
        per: 'cycle',
        category: null,
        sourceUrl: 'https://www.osteopathyboard.gov.au/Registration-Standards.aspx',
      },
      {
        id: 'mandated',
        label: 'Mandated topics',
        min: 4,
        per: 'cycle',
        category: 'mandated-topics',
        sourceUrl: 'https://www.osteopathyboard.gov.au/Registration-Standards.aspx',
      },
    ],
    artifacts: [],
    notes: [
      'Current Senior First Aid must be held (3-yearly) — not countable toward the 25 hours.',
      'Keep your portfolio 5 years; if audited you have 28 days to produce evidence.',
    ],
    version: '2026-08.1',
    verifiedBy: 'regulatory-research 2026-08-02 (standard effective 1 Dec 2015)',
  },
  {
    id: 'au-physio',
    body: 'Physiotherapy Board of Australia (Ahpra)',
    region: 'AU',
    profession: 'Physiotherapist',
    unit: 'hours',
    cycle: { windowType: 'fixed', years: 1, ...AHPRA_YEAR },
    categories: [],
    lines: [
      {
        id: 'total',
        label: 'Total CPD',
        min: 20,
        per: 'cycle',
        category: null,
        sourceUrl: 'https://www.physiotherapyboard.gov.au/Codes-Guidelines/CPD-guidelines.aspx',
      },
    ],
    artifacts: [
      {
        id: 'reflection',
        label: 'Record of learning aims + reflection on impact on practice',
        cadence: 'year',
        category: 'reflection',
        sourceUrl: 'https://www.physiotherapyboard.gov.au/Codes-Guidelines/CPD-guidelines.aspx',
      },
    ],
    notes: ['Portfolio retained 5 years; any format accepted.'],
    version: '2026-08.1',
    verifiedBy: 'regulatory-research 2026-08-02 (standard effective 1 Dec 2015)',
  },
  {
    id: 'au-chiro',
    body: 'Chiropractic Board of Australia (Ahpra)',
    region: 'AU',
    profession: 'Chiropractor',
    unit: 'hours',
    cycle: { windowType: 'fixed', years: 1, ...AHPRA_YEAR },
    categories: [],
    lines: [
      {
        id: 'total',
        label: 'Total CPD',
        min: 20,
        per: 'cycle',
        category: null,
        sourceUrl: 'https://www.chiropracticboard.gov.au/Registration-standards.aspx',
      },
    ],
    artifacts: [],
    notes: [
      'CPR-level first aid annually — not countable toward the 20 hours.',
      'Content must draw on the best available evidence (Board standard).',
    ],
    version: '2026-08.1',
    verifiedBy: 'regulatory-research 2026-08-02 (standard effective 1 Dec 2019)',
  },
  {
    id: 'au-psych',
    body: 'Psychology Board of Australia (Ahpra)',
    region: 'AU',
    profession: 'Psychologist',
    unit: 'hours',
    cycle: { windowType: 'fixed', years: 1, ...AHPRA_YEAR },
    categories: [{ id: 'peer-consultation', label: 'Peer consultation' }],
    lines: [
      {
        id: 'total',
        label: 'Total CPD',
        min: 30,
        per: 'cycle',
        category: null,
        sourceUrl:
          'https://www.psychologyboard.gov.au/Standards-and-Guidelines/Registration-Standards.aspx',
      },
      {
        id: 'peer',
        label: 'Peer consultation',
        min: 10,
        per: 'cycle',
        category: 'peer-consultation',
        sourceUrl:
          'https://www.psychologyboard.gov.au/Standards-and-Guidelines/Registration-Standards.aspx',
      },
    ],
    artifacts: [
      {
        id: 'learning-plan',
        label: 'Annual learning plan from a skills self-assessment',
        cadence: 'year',
        category: 'learning-plan',
        sourceUrl:
          'https://www.psychologyboard.gov.au/Standards-and-Guidelines/Registration-Standards.aspx',
      },
    ],
    notes: ['Written reflection per activity; portfolio retained 5 years; 28 days if audited.'],
    version: '2026-08.1',
    verifiedBy: 'regulatory-research 2026-08-02 (standard effective 1 Dec 2015)',
  },
  {
    id: 'au-essa',
    body: 'Exercise & Sports Science Australia (ESSA)',
    region: 'AU',
    profession: 'Accredited Exercise Physiologist / Scientist',
    unit: 'points',
    cycle: { windowType: 'fixed', years: 1, anchorMonth: 1, anchorDay: 1 }, // calendar year
    categories: [{ id: 'further-education', label: 'Further Education (assessed formal learning)' }],
    lines: [
      {
        id: 'total',
        label: 'Total CPD points',
        min: 20,
        per: 'cycle',
        category: null,
        sourceUrl:
          'https://www.essa.org.au/Public/PROFESSIONAL_DEVELOPMENT/CPD_FAQs.aspx',
      },
      {
        id: 'further-ed',
        label: 'Further Education points',
        min: 15,
        per: 'cycle',
        category: 'further-education',
        sourceUrl:
          'https://www.essa.org.au/Public/PROFESSIONAL_DEVELOPMENT/CPD_FAQs.aspx',
      },
    ],
    artifacts: [],
    notes: ['Self-education capped at 5 points; non-compliance can suspend accreditation.'],
    version: '2026-08.1',
    verifiedBy: 'regulatory-research 2026-08-02 (ESSA CPD Standard 2022-23)',
  },
  {
    id: 'nz-physio',
    body: 'Physiotherapy Board of New Zealand',
    region: 'NZ',
    profession: 'Physiotherapist',
    unit: 'hours',
    // 100 hrs over a ROLLING 3-year window; the APC year (1 Apr – 31 Mar)
    // anchors the renewal countdown and the annual artifact cadence.
    cycle: { windowType: 'rolling', years: 3, anchorMonth: 4, anchorDay: 1 },
    categories: [],
    lines: [
      {
        id: 'total',
        label: 'CPD hours (rolling 3 years)',
        min: 100,
        per: 'cycle',
        category: null,
        sourceUrl:
          'https://physioboard.org.nz/i-am-registered/your-practising-status/recertification-audit',
      },
    ],
    artifacts: [
      {
        id: 'pdp',
        label: 'Professional Development Plan (Board template, peer-signed)',
        cadence: 'year',
        category: 'pdp',
        sourceUrl:
          'https://physioboard.org.nz/i-am-registered/your-practising-status/recertification-audit',
      },
      {
        id: 'peer-review',
        label: 'Annual peer review',
        cadence: 'year',
        category: 'peer-review',
        sourceUrl:
          'https://physioboard.org.nz/i-am-registered/your-practising-status/recertification-audit',
      },
      {
        id: 'reflective-1',
        label: 'Reflective statement 1 (Māori culture — mandatory topic)',
        cadence: 'year',
        category: 'reflective-cultural',
        sourceUrl:
          'https://physioboard.org.nz/i-am-registered/your-practising-status/recertification-audit',
      },
      {
        id: 'reflective-2',
        label: 'Reflective statement 2',
        cadence: 'year',
        category: 'reflective',
        sourceUrl:
          'https://physioboard.org.nz/i-am-registered/your-practising-status/recertification-audit',
      },
      {
        id: 'reflective-3',
        label: 'Reflective statement 3',
        cadence: 'year',
        category: 'reflective',
        sourceUrl:
          'https://physioboard.org.nz/i-am-registered/your-practising-status/recertification-audit',
      },
    ],
    notes: ['~5% of APC holders audited each July — evidence assessed by independent evaluators.'],
    version: '2026-08.1',
    verifiedBy: 'regulatory-research 2026-08-02 (framework approved Feb 2020)',
  },
  {
    id: 'nz-osteo',
    body: 'Osteopathic Council of New Zealand (OCNZ)',
    region: 'NZ',
    profession: 'Osteopath',
    unit: 'hours',
    // 50 pts (1 pt = 1 hr) per fixed 2-year cycle; current cycle began
    // 1 Apr 2025. Minimum 10 hrs in each year of the cycle.
    cycle: { windowType: 'fixed', years: 2, anchorMonth: 4, anchorDay: 1, phaseYear: 2025 },
    categories: [],
    lines: [
      {
        id: 'total',
        label: 'CPD hours (2-year cycle)',
        min: 50,
        per: 'cycle',
        category: null,
        sourceUrl:
          'https://ocnz.imiscloud.com/common/Uploaded%20files/1.%20CCP%201%20April%202021.pdf',
      },
      {
        id: 'annual-min',
        label: 'Minimum per year',
        min: 10,
        per: 'year',
        category: null,
        sourceUrl:
          'https://ocnz.imiscloud.com/common/Uploaded%20files/1.%20CCP%201%20April%202021.pdf',
      },
    ],
    artifacts: [],
    notes: ['Documented cycle: assess needs → plan → learn → reflect → implement → review.'],
    version: '2026-08.1',
    verifiedBy: 'regulatory-research 2026-08-02 (CCP effective 1 Apr 2021)',
  },
]

export function getPack(id: string): CpdPack | null {
  return CPD_PACKS.find((p) => p.id === id) ?? null
}
