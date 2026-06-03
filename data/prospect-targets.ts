/**
 * Cold outreach target list — initial seed data for prospect_clinics.
 *
 * Mirrors OUTREACH_TARGET_LIST.md (last revised 2026-06-03).
 *
 * Team counts are best-estimate from public clinic pages — verify and
 * correct via /api/admin/prospect-create before flipping status to
 * 'approved'. Contact emails are placeholders (info@) for prospects
 * without a verified founder email; fill in the verified email manually.
 *
 * Status conventions:
 *  - 'researching' — needs team-size + contact-email verification before send
 *  - 'approved'    — ready to send T1 (gated by template signoff)
 */
import type { ClinicTeam, TravelBand, CohortRecommendation, Discipline, ProspectStatus, State } from '@/lib/prospect/types'

export interface ProspectSeed {
  slug: string
  name: string
  shortName: string
  city: string
  state: State
  region: string
  contactFirstName: string
  contactFullName: string
  contactEmail: string
  contactRole: string
  contactDiscipline: Discipline
  clinicWebsiteUrl: string
  team: ClinicTeam
  travelBand: TravelBand
  cohortRecommendation: CohortRecommendation
  status: ProspectStatus
  priorityWave: 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6'
  pitchVariant: 'metro' | 'regional' | 'network'
  networkSize?: number
  nearestMetro?: string
  notes?: string
}

const team = (over: Partial<ClinicTeam>): ClinicTeam => ({
  osteopaths: 0,
  physiotherapists: 0,
  generalPractitioners: 0,
  sportsMedicineDoctors: 0,
  exercisePhys: 0,
  myotherapists: 0,
  remedialMassage: 0,
  practiceManager: 1,
  admin: 1,
  ...over,
})

export const PROSPECT_TARGETS: ProspectSeed[] = [
  // ── P1 ── Highest priority, low CAC ──────────────────────────────────
  {
    slug: 'optimum-allied-health-northern-rivers',
    name: 'Optimum Allied Health',
    shortName: 'Optimum Allied Health',
    city: 'Ballina',
    state: 'NSW',
    region: 'Northern Rivers',
    contactFirstName: 'Director',
    contactFullName: 'Clinical Director',
    contactEmail: 'info@optimumalliedhealth.com.au',
    contactRole: 'Clinical Director',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://optimumalliedhealth.com.au',
    team: team({ physiotherapists: 18, exercisePhys: 6, remedialMassage: 4, practiceManager: 2, admin: 4 }),
    travelBand: 'within-2hr',
    cohortRecommendation: 'full-team',
    status: 'researching',
    priorityWave: 'P1',
    pitchVariant: 'network',
    networkSize: 6,
    notes: '15 min drive from Byron. 6 NR locations. Network deal target.',
  },
  {
    slug: 'bt-physiotherapy',
    name: 'BT Physiotherapy',
    shortName: 'BT Physiotherapy',
    city: 'Maroochydore',
    state: 'QLD',
    region: 'Sunshine Coast + Gold Coast',
    contactFirstName: 'Clinical',
    contactFullName: 'Clinical Operations Lead',
    contactEmail: 'admin@btphysiotherapy.com.au',
    contactRole: 'Network Director',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://btphysiotherapy.com.au',
    team: team({ physiotherapists: 22, exercisePhys: 6, practiceManager: 2, admin: 4 }),
    travelBand: 'within-2hr',
    cohortRecommendation: 'recommended',
    status: 'researching',
    priorityWave: 'P1',
    pitchVariant: 'network',
    networkSize: 7,
    notes: '7 clinics SC/GC. OOL drive 90 min. Network deal.',
  },
  {
    slug: 'super-clinic-physio',
    name: 'Super Clinic Physiotherapy',
    shortName: 'Super Clinic Physio',
    city: 'Oxenford',
    state: 'QLD',
    region: 'Gold Coast',
    contactFirstName: 'Principal',
    contactFullName: 'Principal Physiotherapist',
    contactEmail: 'info@superclinicphysio.com.au',
    contactRole: 'Principal Physiotherapist',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://superclinicphysio.com.au',
    team: team({ physiotherapists: 8, exercisePhys: 2 }),
    travelBand: 'within-2hr',
    cohortRecommendation: 'recommended',
    status: 'researching',
    priorityWave: 'P1',
    pitchVariant: 'metro',
    notes: 'Oxenford + Hope Island. Two-location group.',
  },
  {
    slug: 'peak-physio-newcastle',
    name: 'Peak Physiotherapy Newcastle',
    shortName: 'Peak Physio',
    city: 'Newcastle',
    state: 'NSW',
    region: 'Newcastle / Hunter',
    contactFirstName: 'Principal',
    contactFullName: 'Principal Physiotherapist',
    contactEmail: 'info@peakphysio.com.au',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://peakphysio.com.au',
    team: team({ physiotherapists: 10, exercisePhys: 2 }),
    travelBand: 'within-4hr',
    cohortRecommendation: 'recommended',
    status: 'researching',
    priorityWave: 'P1',
    pitchVariant: 'regional',
    nearestMetro: 'Sydney',
    notes: 'Does concussion work but no SCAT6/VOMS/BESS team training. Capability gap close.',
  },
  {
    slug: 'pogo-physio',
    name: 'POGO Physio',
    shortName: 'POGO Physio',
    city: 'Burleigh Heads',
    state: 'QLD',
    region: 'Gold Coast',
    contactFirstName: 'Brad',
    contactFullName: 'Brad Beer',
    contactEmail: 'brad@pogophysio.com.au',
    contactRole: 'Founder & Principal Physiotherapist',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://pogophysio.com.au',
    team: team({ physiotherapists: 12, exercisePhys: 2, practiceManager: 1, admin: 2 }),
    travelBand: 'within-2hr',
    cohortRecommendation: 'recommended',
    status: 'approved',
    priorityWave: 'P1',
    pitchVariant: 'metro',
    notes: 'Brad Beer — podcaster, public-facing. Even decline = podcast invite back-up.',
  },

  // ── P2 ── Brisbane metro (BNK→BNE 60-90 min, A$80 each way) ──────────
  {
    slug: 'imove-physio-brisbane',
    name: 'iMove Physiotherapy',
    shortName: 'iMove Physio',
    city: 'Brisbane',
    state: 'QLD',
    region: 'Brisbane',
    contactFirstName: 'Director',
    contactFullName: 'Clinical Director',
    contactEmail: 'info@imovephysiotherapy.com.au',
    contactRole: 'Clinical Director',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://imovephysiotherapy.com.au',
    team: team({ physiotherapists: 14, exercisePhys: 4 }),
    travelBand: 'within-4hr',
    cohortRecommendation: 'recommended',
    status: 'researching',
    priorityWave: 'P2',
    pitchVariant: 'network',
    networkSize: 3,
    notes: 'Brisbane northside multi-site, sports-leaning.',
  },
  {
    slug: 'movement-solutions-brisbane',
    name: 'Movement Solutions',
    shortName: 'Movement Solutions',
    city: 'Brisbane',
    state: 'QLD',
    region: 'Brisbane',
    contactFirstName: 'Principal',
    contactFullName: 'Principal Physiotherapist',
    contactEmail: 'info@movementsolutions.com.au',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://movementsolutions.com.au',
    team: team({ physiotherapists: 9, exercisePhys: 3 }),
    travelBand: 'within-4hr',
    cohortRecommendation: 'recommended',
    status: 'researching',
    priorityWave: 'P2',
    pitchVariant: 'metro',
    notes: 'Multi-disc, return-to-play strong.',
  },
  {
    slug: 'the-physio-movement-brisbane',
    name: 'The Physio Movement',
    shortName: 'The Physio Movement',
    city: 'Brisbane',
    state: 'QLD',
    region: 'Brisbane',
    contactFirstName: 'Principal',
    contactFullName: 'Principal Physiotherapist',
    contactEmail: 'info@thephysiomovement.com.au',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://thephysiomovement.com.au',
    team: team({ physiotherapists: 8, exercisePhys: 2 }),
    travelBand: 'within-4hr',
    cohortRecommendation: 'recommended',
    status: 'researching',
    priorityWave: 'P2',
    pitchVariant: 'metro',
    notes: 'Brisbane south, mid-size sports clinic.',
  },
  {
    slug: 'boost-health-group-brisbane',
    name: 'Boost Health Group',
    shortName: 'Boost Health',
    city: 'Brisbane',
    state: 'QLD',
    region: 'Brisbane',
    contactFirstName: 'Director',
    contactFullName: 'Clinical Director',
    contactEmail: 'info@boosthealthgroup.com.au',
    contactRole: 'Director',
    contactDiscipline: 'exercisePhys',
    clinicWebsiteUrl: 'https://boosthealthgroup.com.au',
    team: team({ physiotherapists: 3, exercisePhys: 8 }),
    travelBand: 'within-4hr',
    cohortRecommendation: 'recommended',
    status: 'researching',
    priorityWave: 'P2',
    pitchVariant: 'metro',
    notes: 'EP-heavy, sports-rehab niche.',
  },

  // ── P3 ── Canberra (BNK→CBR via SYD, half-day each way) ──────────────
  {
    slug: 'momentum-therapy-canberra',
    name: 'Momentum Therapy',
    shortName: 'Momentum Therapy',
    city: 'Canberra',
    state: 'ACT',
    region: 'Canberra / ACT',
    contactFirstName: 'Director',
    contactFullName: 'Clinical Director',
    contactEmail: 'info@momentumtherapy.com.au',
    contactRole: 'Clinical Director',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://momentumtherapy.com.au',
    team: team({ physiotherapists: 12, exercisePhys: 4, osteopaths: 2 }),
    travelBand: 'flight-domestic',
    cohortRecommendation: 'recommended',
    status: 'researching',
    priorityWave: 'P3',
    pitchVariant: 'network',
    networkSize: 4,
    nearestMetro: 'Sydney',
    notes: 'Multi-disc, multi-location ACT/NSW. No concussion program yet.',
  },
  {
    slug: 'canberra-allied-health',
    name: 'Canberra Allied Health',
    shortName: 'Canberra Allied Health',
    city: 'Canberra',
    state: 'ACT',
    region: 'Canberra / ACT',
    contactFirstName: 'Principal',
    contactFullName: 'Principal Practitioner',
    contactEmail: 'info@canberraalliedhealth.com.au',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://canberraalliedhealth.com.au',
    team: team({ physiotherapists: 8, exercisePhys: 2, osteopaths: 1 }),
    travelBand: 'flight-domestic',
    cohortRecommendation: 'recommended',
    status: 'researching',
    priorityWave: 'P3',
    pitchVariant: 'regional',
    nearestMetro: 'Sydney',
    notes: 'Internal champion — clinician with vestibular/neurological interest. VOMS open door.',
  },

  // ── P4 ── Regional NSW (drive or 1hr flight) ─────────────────────────
  {
    slug: 'coffs-coast-health-hub',
    name: 'Coffs Coast Health Hub',
    shortName: 'Coffs Coast Health Hub',
    city: 'Coffs Harbour',
    state: 'NSW',
    region: 'Mid North Coast',
    contactFirstName: 'Principal',
    contactFullName: 'Principal Practitioner',
    contactEmail: 'info@coffscoasthealthhub.com.au',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://coffscoasthealthhub.com.au',
    team: team({ physiotherapists: 8, exercisePhys: 2 }),
    travelBand: 'within-4hr',
    cohortRecommendation: 'recommended',
    status: 'researching',
    priorityWave: 'P4',
    pitchVariant: 'regional',
    nearestMetro: 'Sydney or Brisbane',
    notes: 'Multi-disc, underserved.',
  },
  {
    slug: 'lismore-sports-physio',
    name: 'Lismore Sports Physiotherapy',
    shortName: 'Lismore Sports Physio',
    city: 'Lismore',
    state: 'NSW',
    region: 'Northern Rivers',
    contactFirstName: 'Principal',
    contactFullName: 'Principal Physiotherapist',
    contactEmail: 'info@lismoresportsphysio.com.au',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://lismoresportsphysio.com.au',
    team: team({ physiotherapists: 8, exercisePhys: 2 }),
    travelBand: 'within-2hr',
    cohortRecommendation: 'recommended',
    status: 'researching',
    priorityWave: 'P4',
    pitchVariant: 'regional',
    nearestMetro: 'Brisbane',
    notes: 'Underserved regional, mid-size. 45 min drive.',
  },
  {
    slug: 'grafton-allied-health',
    name: 'Grafton Allied Health',
    shortName: 'Grafton Allied Health',
    city: 'Grafton',
    state: 'NSW',
    region: 'Northern Rivers',
    contactFirstName: 'Principal',
    contactFullName: 'Principal Practitioner',
    contactEmail: 'info@graftonalliedhealth.com.au',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://graftonalliedhealth.com.au',
    team: team({ physiotherapists: 6, exercisePhys: 2, osteopaths: 2 }),
    travelBand: 'within-2hr',
    cohortRecommendation: 'essential',
    status: 'researching',
    priorityWave: 'P4',
    pitchVariant: 'regional',
    nearestMetro: 'Brisbane',
    notes: 'Underserved. 1.5hr drive.',
  },

  // ── P5 ── South Australia (BNK→ADL via SYD, A$220 + overnight) ───────
  {
    slug: 'the-body-mechanic-adelaide',
    name: 'The Body Mechanic',
    shortName: 'The Body Mechanic',
    city: 'Adelaide',
    state: 'SA',
    region: 'Adelaide',
    contactFirstName: 'Director',
    contactFullName: 'Clinical Director',
    contactEmail: 'info@thebodymechanic.com.au',
    contactRole: 'Director',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://thebodymechanic.com.au',
    team: team({ physiotherapists: 9, exercisePhys: 3, remedialMassage: 2 }),
    travelBand: 'flight-far',
    cohortRecommendation: 'recommended',
    status: 'researching',
    priorityWave: 'P5',
    pitchVariant: 'network',
    networkSize: 3,
    notes: 'Adelaide CBD + 2 sites. Group as Adelaide block visit.',
  },
  {
    slug: 'adelaide-physio-co',
    name: 'Adelaide Physio Co',
    shortName: 'Adelaide Physio Co',
    city: 'Adelaide',
    state: 'SA',
    region: 'Adelaide',
    contactFirstName: 'Principal',
    contactFullName: 'Principal Physiotherapist',
    contactEmail: 'info@adelaidephysioco.com.au',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://adelaidephysioco.com.au',
    team: team({ physiotherapists: 8, exercisePhys: 2 }),
    travelBand: 'flight-far',
    cohortRecommendation: 'recommended',
    status: 'researching',
    priorityWave: 'P5',
    pitchVariant: 'metro',
    notes: 'Mid-size, return-to-play.',
  },
  {
    slug: 'glenelg-sports-medicine',
    name: 'Glenelg Sports Medicine',
    shortName: 'Glenelg Sports Med',
    city: 'Glenelg',
    state: 'SA',
    region: 'Adelaide',
    contactFirstName: 'Principal',
    contactFullName: 'Principal Practitioner',
    contactEmail: 'info@glenelgsportsmed.com.au',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://glenelgsportsmed.com.au',
    team: team({ physiotherapists: 6, exercisePhys: 2 }),
    travelBand: 'flight-far',
    cohortRecommendation: 'essential',
    status: 'researching',
    priorityWave: 'P5',
    pitchVariant: 'metro',
    notes: 'Verify size before send.',
  },
  {
    slug: 'norwood-health-network',
    name: 'Norwood Health Network',
    shortName: 'Norwood Health',
    city: 'Norwood',
    state: 'SA',
    region: 'Adelaide',
    contactFirstName: 'Director',
    contactFullName: 'Clinical Director',
    contactEmail: 'info@norwoodhealthnetwork.com.au',
    contactRole: 'Director',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://norwoodhealthnetwork.com.au',
    team: team({ physiotherapists: 10, exercisePhys: 3 }),
    travelBand: 'flight-far',
    cohortRecommendation: 'recommended',
    status: 'researching',
    priorityWave: 'P5',
    pitchVariant: 'network',
    networkSize: 3,
    notes: 'Multi-location.',
  },
]

/**
 * Generate a send schedule starting from a given date. Spreads 5-8 sends per
 * business day, Mon-Wed-Fri (avoid Tue/Thu inbox clutter, never weekend),
 * priority by wave (P1 first), then by network/regional value (full-team > recommended > essential).
 */
export function buildSendSchedule(startDate: Date, dailyCap = 5): Map<string, Date> {
  const wavePriority: Record<string, number> = { P1: 1, P2: 2, P3: 3, P4: 4, P5: 5, P6: 6 }
  const cohortPriority: Record<CohortRecommendation, number> = { 'full-team': 1, recommended: 2, essential: 3 }

  const ordered = [...PROSPECT_TARGETS].sort((a, b) => {
    const wa = wavePriority[a.priorityWave] - wavePriority[b.priorityWave]
    if (wa !== 0) return wa
    return cohortPriority[a.cohortRecommendation] - cohortPriority[b.cohortRecommendation]
  })

  const schedule = new Map<string, Date>()
  const sendDay = new Date(startDate)
  sendDay.setHours(9, 30, 0, 0) // 9:30am AEST send slot
  let sentToday = 0

  for (const p of ordered) {
    // Skip Sat/Sun + skip Tue/Thu (Mon/Wed/Fri only)
    while ([0, 2, 4, 6].includes(sendDay.getDay())) {
      sendDay.setDate(sendDay.getDate() + 1)
      sentToday = 0
    }
    if (sentToday >= dailyCap) {
      sendDay.setDate(sendDay.getDate() + 1)
      sentToday = 0
      while ([0, 2, 4, 6].includes(sendDay.getDay())) {
        sendDay.setDate(sendDay.getDate() + 1)
      }
    }
    schedule.set(p.slug, new Date(sendDay))
    sentToday += 1
  }

  return schedule
}
