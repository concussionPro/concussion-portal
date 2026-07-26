/**
 * THE COMPETENCY GAP — verified, citable evidence.
 *
 * This is the evidence base for the commercial argument CEA actually makes to
 * scheme buyers (ACC Concussion Services suppliers, Guild, clinic groups):
 *
 *   1. The first-line treatment for concussion is sub-symptom-threshold aerobic
 *      exercise — and the published surveys show most rehabilitation clinicians
 *      DO NOT prescribe it.
 *   2. Return-to-play decision confidence is the weakest self-reported skill in
 *      the profession, even among clinicians who have had concussion training.
 *   3. Therefore a supplier cannot evidence competency by asserting it. They
 *      need a documented training layer (the courses) and objective, measured
 *      data behind the decision (the SST Trainer's measured HRt trajectory).
 *
 * EVERY FIGURE HERE WAS READ FROM THE PRIMARY SOURCE, not from a summary.
 * That verification mattered: a secondary source attributed Yorke's vestibular
 * figures to Dobney & Gagnon, and mis-stated Dobney's aerobic-exercise finding
 * as "one third discharged patients" when the paper says just over one third
 * PRESCRIBED aerobic exercise. The corrected figures are below.
 *
 * RULES FOR USING THIS MODULE (AHPRA/TGA advertising + ACL):
 *  - Never round a figure to make it sound worse. The real numbers are strong.
 *  - Never imply these clinicians are negligent — the papers describe a
 *    profession whose training predates the evidence, which is a market, not an
 *    accusation. `framing` on each item is the safe phrasing.
 *  - Always render the citation alongside the claim.
 */

export interface CompetencyFinding {
  /** The claim, stated plainly. */
  stat: string
  /** What it means for the buyer — never an accusation about clinicians. */
  framing: string
  /** Which CEA product answers it. */
  answeredBy: 'education' | 'tooling' | 'both'
  citation: {
    authors: string
    year: number
    title: string
    journal: string
    detail: string
    doi: string
    url: string
  }
}

/** Verified 2026-07-26 by reading each paper directly. */
export const COMPETENCY_FINDINGS: CompetencyFinding[] = [
  {
    stat: 'Just over one third of rehabilitation clinicians prescribed aerobic exercise for youth slow to recover from concussion (36% and 35% across two clinical vignettes, n = 555).',
    framing:
      'Sub-symptom-threshold aerobic exercise is first-line treatment, but it did not appear among the top five treatments clinicians reported using — those were education, sleep recommendations, goal setting, energy management and manual therapy. The authors conclude that few clinicians used aerobic exercise as part of their concussion management strategy.',
    answeredBy: 'both',
    citation: {
      authors: 'Dobney DM, Gagnon I',
      year: 2021,
      title:
        'Concussion Management Practices for Youth Who Are Slow to Recover: A Survey of Canadian Rehabilitation Clinicians',
      journal: 'Physiotherapy Canada',
      detail: '73(1): 90–99',
      doi: '10.3138/ptc-2019-0048',
      url: 'https://doi.org/10.3138/ptc-2019-0048',
    },
  },
  {
    stat: 'Clinicians with a high concussion caseload (75–100%) were significantly more likely to prescribe aerobic exercise.',
    framing:
      'Exposure, not seniority, predicts current practice — which is exactly what a structured training layer substitutes for in a team that does not see concussion every day.',
    answeredBy: 'education',
    citation: {
      authors: 'Dobney DM, Gagnon I',
      year: 2021,
      title:
        'Concussion Management Practices for Youth Who Are Slow to Recover: A Survey of Canadian Rehabilitation Clinicians',
      journal: 'Physiotherapy Canada',
      detail: '73(1): 90–99',
      doi: '10.3138/ptc-2019-0048',
      url: 'https://doi.org/10.3138/ptc-2019-0048',
    },
  },
  {
    stat: 'In a survey of 1,272 physical therapists — 70% of whom had prior concussion training — respondents demonstrated less confidence when making return-to-play decisions than on any other concussion task.',
    framing:
      'Return-to-play is the decision that carries the medico-legal weight, and it is the one clinicians report least confidence in. Confidence follows from a measurement you can point to, not from a symptom report.',
    answeredBy: 'both',
    citation: {
      authors: 'Yorke AM, Littleton S, Alsalaheen BA',
      year: 2016,
      title:
        'Concussion Attitudes and Beliefs, Knowledge, and Clinical Practice: Survey of Physical Therapists',
      journal: 'Physical Therapy',
      detail: '96(7): 1018–1028',
      doi: '10.2522/ptj.20140598',
      url: 'https://doi.org/10.2522/ptj.20140598',
    },
  },
  {
    stat: 'In the same survey, approximately half of respondents identified a need for vestibular therapy when it was clinically indicated, and 43% opted to refer to a physician.',
    framing:
      'Clinicians reliably recognised when a physician referral was needed, but judgement was inconsistent on when to bring in vestibular or manual therapy — a phenotype-recognition gap, not a diligence gap.',
    answeredBy: 'education',
    citation: {
      authors: 'Yorke AM, Littleton S, Alsalaheen BA',
      year: 2016,
      title:
        'Concussion Attitudes and Beliefs, Knowledge, and Clinical Practice: Survey of Physical Therapists',
      journal: 'Physical Therapy',
      detail: '96(7): 1018–1028',
      doi: '10.2522/ptj.20140598',
      url: 'https://doi.org/10.2522/ptj.20140598',
    },
  },
]

/** One-line summary for a hero or a pitch deck. Keep it verifiable. */
export const COMPETENCY_HEADLINE =
  'Around two thirds of rehabilitation clinicians do not prescribe the first-line treatment for concussion, and return-to-play is the decision they report least confidence in.'

/** Distinct citations, for a references block. */
export function competencyCitations(): CompetencyFinding['citation'][] {
  const seen = new Set<string>()
  const out: CompetencyFinding['citation'][] = []
  for (const f of COMPETENCY_FINDINGS) {
    if (seen.has(f.citation.doi)) continue
    seen.add(f.citation.doi)
    out.push(f.citation)
  }
  return out
}

/** Formatted reference string, e.g. for a supplier pack or a footnote. */
export function formatCitation(c: CompetencyFinding['citation']): string {
  return `${c.authors} (${c.year}). ${c.title}. ${c.journal}, ${c.detail}. doi:${c.doi}`
}
