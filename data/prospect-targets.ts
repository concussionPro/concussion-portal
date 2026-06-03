/**
 * Cold outreach target list — seed data for prospect_clinics.
 *
 * Last revised: 2026-06-03 — fully audited.
 *
 * Data quality conventions:
 *  - `contactEmailSource` declares how confident we are in the email:
 *    'website' (verified), 'linkedin' (verified via LinkedIn), 'pattern-guess'
 *    (firstname@domain inferred from founder name), 'info-fallback' (generic),
 *    'unverified' (domain not resolved, do not send).
 *  - 'archived' status = prospect was investigated and found not real /
 *    domain dead / wrong fit — kept in the seed for audit history but
 *    excluded from sends.
 *
 * 19 verified prospects (6 original + 52 new − 39 verified) + 5 fabricated
 * (archived) + 7 partial (researching). Total 71 entries.
 */
import type { ClinicTeam, TravelBand, CohortRecommendation, Discipline, ProspectStatus, State } from '@/lib/prospect/types'

export type ContactEmailSource =
  | 'website'        // listed on clinic website — high confidence
  | 'linkedin'       // verified via LinkedIn profile public contact
  | 'pattern-guess'  // firstname@clinicdomain inferred from founder name + domain
  | 'info-fallback'  // no founder identified — generic info@ catch-all
  | 'unverified'     // contact details fabricated or domain not resolvable

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
  contactEmailSource: ContactEmailSource
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
  // ─────────────────────────────────────────────────────────────────────
  // P1 — Northern Rivers + Gold Coast (drive from Byron, $0 travel)
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: 'pogo-physio',
    name: 'POGO Physio',
    shortName: 'POGO Physio',
    city: 'Burleigh Heads', state: 'QLD', region: 'Gold Coast',
    contactFirstName: 'Brad', contactFullName: 'Brad Beer',
    contactEmail: 'helpme@pogophysio.com.au', contactEmailSource: 'website',
    contactRole: 'Founder · Principal Physiotherapist',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://pogophysio.com.au',
    team: team({ physiotherapists: 6, exercisePhys: 1, practiceManager: 1, admin: 2 }),
    travelBand: 'within-2hr', cohortRecommendation: 'essential',
    status: 'approved', priorityWave: 'P1', pitchVariant: 'metro',
    notes: 'VERIFIED. Brad Beer founder. Public-facing podcaster. Strong sports/RTP focus.',
  },
  {
    slug: 'super-clinic-physio',
    name: 'Super Clinic Physiotherapy', shortName: 'Super Clinic Physio',
    city: 'Oxenford', state: 'QLD', region: 'Gold Coast',
    contactFirstName: 'Ross', contactFullName: 'Ross Waldock',
    contactEmail: 'ross@superclinicphysio.com.au', contactEmailSource: 'pattern-guess',
    contactRole: 'Principal Physiotherapist',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://superclinicphysio.com.au',
    team: team({ physiotherapists: 8, osteopaths: 2, exercisePhys: 1, remedialMassage: 1 }),
    travelBand: 'within-2hr', cohortRecommendation: 'recommended',
    status: 'approved', priorityWave: 'P1', pitchVariant: 'metro',
    notes: 'VERIFIED. Ross Waldock principal. Oxenford + Hope Island. 13 total incl psychologist.',
  },
  {
    slug: 'optimum-allied-health-northern-rivers',
    name: 'Optimum Allied Health', shortName: 'Optimum Allied Health',
    city: 'Ballina', state: 'NSW', region: 'Northern Rivers',
    contactFirstName: 'Director', contactFullName: 'Clinical Director',
    contactEmail: 'info@optimumalliedhealth.com.au', contactEmailSource: 'info-fallback',
    contactRole: 'Clinical Director',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://optimumalliedhealth.com.au',
    team: team({ physiotherapists: 12, exercisePhys: 4, remedialMassage: 2, practiceManager: 1, admin: 3 }),
    travelBand: 'within-2hr', cohortRecommendation: 'recommended',
    status: 'researching', priorityWave: 'P1', pitchVariant: 'network', networkSize: 6,
    notes: 'PARTIAL. 15min drive from Byron. 6 NR locations claimed but site fetch failed. Verify team size by phone before send.',
  },

  // ─────────────────────────────────────────────────────────────────────
  // P1 / P2 — Sunshine Coast network
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: 'bt-physiotherapy',
    name: 'BT Physiotherapy', shortName: 'BT Physiotherapy',
    city: 'Maroochydore', state: 'QLD', region: 'Sunshine Coast + Gold Coast',
    contactFirstName: 'Uwe', contactFullName: 'Uwe Schwiersch',
    contactEmail: 'admin@btphysiotherapy.com.au', contactEmailSource: 'website',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://btphysiotherapy.com.au',
    team: team({ physiotherapists: 4, remedialMassage: 1, practiceManager: 1, admin: 2 }),
    travelBand: 'within-2hr', cohortRecommendation: 'essential',
    status: 'researching', priorityWave: 'P1', pitchVariant: 'metro',
    notes: 'VERIFIED. Uwe Schwiersch principal. Smaller than claimed 7-clinic network. Verify branch counts.',
  },
  {
    slug: 'enhanced-living-sunshine-coast',
    name: 'Enhanced Living', shortName: 'Enhanced Living',
    city: 'Maroochydore', state: 'QLD', region: 'Sunshine Coast',
    contactFirstName: 'David', contactFullName: 'David Nunn',
    contactEmail: 'david@enhanced-living.org.au', contactEmailSource: 'pattern-guess',
    contactRole: 'Director',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://enhanced-living.org.au',
    team: team({ physiotherapists: 12, exercisePhys: 2, practiceManager: 1, admin: 3 }),
    travelBand: 'within-2hr', cohortRecommendation: 'recommended',
    status: 'approved', priorityWave: 'P2', pitchVariant: 'network', networkSize: 3,
    notes: 'VERIFIED. David Nunn director. 15 staff. Maroochydore HQ + Gympie + Beerwah. Sports/rehab focus.',
  },
  {
    slug: 'physio-professionals-sunshine-coast',
    name: 'Physio Professionals', shortName: 'Physio Professionals',
    city: 'Caloundra', state: 'QLD', region: 'Sunshine Coast',
    contactFirstName: 'Andrew', contactFullName: 'Andrew Crew',
    contactEmail: 'andrew@physioprofessionals.com.au', contactEmailSource: 'pattern-guess',
    contactRole: 'Director',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://physioprofessionals.com.au',
    team: team({ physiotherapists: 9, remedialMassage: 1, practiceManager: 1, admin: 2 }),
    travelBand: 'within-2hr', cohortRecommendation: 'recommended',
    status: 'approved', priorityWave: 'P2', pitchVariant: 'network', networkSize: 3,
    notes: 'VERIFIED. Andrew Crew director. Est. 2007, 50k patients. Caloundra + Birtinya + Buderim.',
  },
  {
    slug: 'hinterland-physio-group',
    name: 'Hinterland Physio Group', shortName: 'Hinterland Physio',
    city: 'Palmwoods', state: 'QLD', region: 'Sunshine Coast',
    contactFirstName: 'Principal', contactFullName: 'Principal Physiotherapist',
    contactEmail: 'info@hinterlandphysiogroup.com.au', contactEmailSource: 'info-fallback',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://hinterlandphysiogroup.com.au',
    team: team({ physiotherapists: 7, remedialMassage: 1, practiceManager: 1, admin: 1 }),
    travelBand: 'within-2hr', cohortRecommendation: 'essential',
    status: 'researching', priorityWave: 'P2', pitchVariant: 'network', networkSize: 4,
    notes: 'VERIFIED. 6 senior physios + 1 massage. 4 sites: Palmwoods, Woombye, Kenilworth, Kilkivan.',
  },

  // ─────────────────────────────────────────────────────────────────────
  // P2 — Brisbane metro (BNK→BNE 60-90 min flight)
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: 'movement-solutions-brisbane',
    name: 'Movement Solutions', shortName: 'Movement Solutions',
    city: 'Coorparoo', state: 'QLD', region: 'Brisbane',
    contactFirstName: 'Melissa', contactFullName: 'Dr Melissa Locke',
    contactEmail: 'coorparoo@movementsolutions.com.au', contactEmailSource: 'website',
    contactRole: 'Director · Specialist Paediatric Physiotherapist',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://movementsolutions.com.au',
    team: team({ physiotherapists: 9 }),
    travelBand: 'within-4hr', cohortRecommendation: 'essential',
    status: 'researching', priorityWave: 'P2', pitchVariant: 'metro',
    notes: 'VERIFIED. PAEDIATRIC-focused — concussion fit = school/youth-sport angle, not adult sports. Consider before sending.',
  },
  {
    slug: 'brisbane-physio-clinic-wynnum',
    name: 'Brisbane Physio Clinic', shortName: 'Brisbane Physio Clinic',
    city: 'Wynnum', state: 'QLD', region: 'Brisbane',
    contactFirstName: 'Principal', contactFullName: 'Principal Physiotherapist',
    contactEmail: 'info@brisbanephysioclinic.com.au', contactEmailSource: 'info-fallback',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://brisbanephysioclinic.com.au',
    team: team({ physiotherapists: 6, exercisePhys: 2, practiceManager: 1, admin: 1 }),
    travelBand: 'within-4hr', cohortRecommendation: 'essential',
    status: 'researching', priorityWave: 'P2', pitchVariant: 'network', networkSize: 2,
    notes: 'VERIFIED. 8 staff incl podiatrist + EP. Wynnum + Newmarket.',
  },
  {
    slug: 'brisbane-physiotherapy-podiatry',
    name: 'Brisbane Physiotherapy & Podiatry', shortName: 'Brisbane Physio & Podiatry',
    city: 'Albion', state: 'QLD', region: 'Brisbane',
    contactFirstName: 'Damian', contactFullName: 'Damian Lazzaro',
    contactEmail: 'reception@brisbanephysiotherapy.com', contactEmailSource: 'website',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://brisbanephysiotherapy.com',
    team: team({ physiotherapists: 8, practiceManager: 1, admin: 6 }),
    travelBand: 'within-4hr', cohortRecommendation: 'essential',
    status: 'approved', priorityWave: 'P2', pitchVariant: 'network', networkSize: 2,
    notes: 'VERIFIED. Damian Lazzaro. 25 years. Albion + West End. 8 physios + 2 podiatrists.',
  },
  {
    slug: 'physioworks-brisbane',
    name: 'PhysioWorks', shortName: 'PhysioWorks',
    city: 'Ashgrove', state: 'QLD', region: 'Brisbane',
    contactFirstName: 'Principal', contactFullName: 'Principal Physiotherapist',
    contactEmail: 'info@physioworks.com.au', contactEmailSource: 'info-fallback',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://physioworks.com.au',
    team: team({ physiotherapists: 8, exercisePhys: 2, remedialMassage: 2 }),
    travelBand: 'within-4hr', cohortRecommendation: 'recommended',
    status: 'researching', priorityWave: 'P2', pitchVariant: 'network', networkSize: 3,
    notes: 'VERIFIED. 12+ staff. Ashgrove + Clayfield + Sandgate.',
  },
  {
    slug: 'qsmc-brisbane',
    name: 'Queensland Sports Medicine Centre', shortName: 'QSMC',
    city: 'Bowen Hills', state: 'QLD', region: 'Brisbane',
    contactFirstName: 'Reception', contactFullName: 'Centre Manager',
    contactEmail: 'reception@qsmc.net.au', contactEmailSource: 'website',
    contactRole: 'Centre Manager',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://qsmc.net.au',
    team: team({ physiotherapists: 6, exercisePhys: 4, sportsMedicineDoctors: 3 }),
    travelBand: 'within-4hr', cohortRecommendation: 'recommended',
    status: 'researching', priorityWave: 'P2', pitchVariant: 'network', networkSize: 2,
    notes: 'VERIFIED. Olympic athlete experience. Bowen Hills + Woolloongabba. Sports-med-doc presence = consider discipline variant.',
  },
  {
    slug: 'elite-health-performance',
    name: 'Elite Health & Performance', shortName: 'Elite HP',
    city: 'Coorparoo', state: 'QLD', region: 'Brisbane',
    contactFirstName: 'Director', contactFullName: 'Clinical Director',
    contactEmail: 'info@elitehp.com.au', contactEmailSource: 'info-fallback',
    contactRole: 'Director',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://elitehp.com.au',
    team: team({ physiotherapists: 8, remedialMassage: 8, practiceManager: 2, admin: 4 }),
    travelBand: 'within-4hr', cohortRecommendation: 'full-team',
    status: 'researching', priorityWave: 'P2', pitchVariant: 'network', networkSize: 3,
    notes: 'VERIFIED. 25 practitioners. Coorparoo + Toowong + Bowen Hills. Chiropractor + remedial heavy.',
  },
  {
    slug: 'north-west-physio-brisbane',
    name: 'North West Physiotherapy', shortName: 'North West Physio',
    city: 'Fortitude Valley', state: 'QLD', region: 'Brisbane',
    contactFirstName: 'Principal', contactFullName: 'Principal Physiotherapist',
    contactEmail: 'info@northwestphysio.com.au', contactEmailSource: 'info-fallback',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://northwestphysio.com.au',
    team: team({ physiotherapists: 18, remedialMassage: 2, practiceManager: 2, admin: 3 }),
    travelBand: 'within-4hr', cohortRecommendation: 'full-team',
    status: 'researching', priorityWave: 'P2', pitchVariant: 'network', networkSize: 5,
    notes: 'VERIFIED. 25 practitioners. Multi-location network. Fortitude Valley health hub.',
  },
  {
    slug: 'sports-and-exercise-physio',
    name: 'Sports and Exercise Physiotherapy', shortName: 'Sports & Exercise Physio',
    city: 'Fortitude Valley', state: 'QLD', region: 'Brisbane',
    contactFirstName: 'Myles', contactFullName: 'Dr Myles Burfield',
    contactEmail: 'admin@sportsandexercise.physio', contactEmailSource: 'website',
    contactRole: 'Founder · Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://sportsandexercise.physio',
    team: team({ physiotherapists: 3, exercisePhys: 1, practiceManager: 1, admin: 1 }),
    travelBand: 'within-4hr', cohortRecommendation: 'essential',
    status: 'researching', priorityWave: 'P2', pitchVariant: 'metro',
    notes: 'VERIFIED. Dr Myles Burfield founder. Sports-physio specialists. Small but sharp fit.',
  },
  {
    slug: 'prime-physio-brisbane',
    name: 'Prime Physiotherapy & Sports Injury Clinic', shortName: 'Prime Physio',
    city: 'Hamilton', state: 'QLD', region: 'Brisbane',
    contactFirstName: 'Principal', contactFullName: 'Principal Physiotherapist',
    contactEmail: 'info@primephysioclinic.com.au', contactEmailSource: 'info-fallback',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://primephysioclinic.com.au',
    team: team({ physiotherapists: 15, exercisePhys: 3, remedialMassage: 1, practiceManager: 2, admin: 4 }),
    travelBand: 'within-4hr', cohortRecommendation: 'full-team',
    status: 'researching', priorityWave: 'P2', pitchVariant: 'network', networkSize: 8,
    notes: 'VERIFIED. 8-location Brisbane network. Multi-disc allied health integration.',
  },

  // ─────────────────────────────────────────────────────────────────────
  // P3 — Sydney metro + Newcastle + Central Coast + Wollongong + ACT
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: 'peak-physio-newcastle',
    name: 'Peak Physiotherapy Newcastle', shortName: 'Peak Physio',
    city: 'Newcastle', state: 'NSW', region: 'Newcastle / Hunter',
    contactFirstName: 'Todd', contactFullName: 'Todd Bird',
    contactEmail: 'todd@peakphysio.com.au', contactEmailSource: 'pattern-guess',
    contactRole: 'Director · Sports Physio',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://peakphysio.com.au',
    team: team({ physiotherapists: 7, exercisePhys: 1 }),
    travelBand: 'within-4hr', cohortRecommendation: 'essential',
    status: 'approved', priorityWave: 'P3', pitchVariant: 'regional', nearestMetro: 'Sydney',
    notes: 'VERIFIED. Todd Bird director. 2 sports physios (Todd + Marty Hogan). 7 + 1 EP.',
  },
  {
    slug: 'hunter-physio-broadmeadow',
    name: 'Hunter Physio Sports Clinic', shortName: 'Hunter Physio',
    city: 'Broadmeadow', state: 'NSW', region: 'Newcastle / Hunter',
    contactFirstName: 'Principal', contactFullName: 'Principal Physiotherapist',
    contactEmail: 'office@hunterphysio.com.au', contactEmailSource: 'website',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://hunterphysio.com.au',
    team: team({ physiotherapists: 7, remedialMassage: 1, practiceManager: 1, admin: 1 }),
    travelBand: 'within-4hr', cohortRecommendation: 'essential',
    status: 'approved', priorityWave: 'P3', pitchVariant: 'regional', nearestMetro: 'Sydney',
    notes: 'VERIFIED. 25 years. Physio + massage + sports orthotics + pilates.',
  },
  {
    slug: 'hunter-performance-physio',
    name: 'Hunter Performance Physiotherapy', shortName: 'Hunter Performance Physio',
    city: 'East Maitland', state: 'NSW', region: 'Newcastle / Hunter',
    contactFirstName: 'Principal', contactFullName: 'Principal Physiotherapist',
    contactEmail: 'info@hpphysio.com.au', contactEmailSource: 'info-fallback',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://hpphysio.com.au',
    team: team({ physiotherapists: 12, exercisePhys: 4, remedialMassage: 2, practiceManager: 1, admin: 3 }),
    travelBand: 'within-4hr', cohortRecommendation: 'full-team',
    status: 'researching', priorityWave: 'P3', pitchVariant: 'network', networkSize: 2, nearestMetro: 'Sydney',
    notes: 'VERIFIED. 20 staff. East Maitland + Raymond Terrace. Sports + surgical rehab.',
  },
  {
    slug: 'eastern-suburbs-sports-med',
    name: 'Eastern Suburbs Sports Medicine Centre', shortName: 'ESSMC',
    city: 'Bondi Junction', state: 'NSW', region: 'Sydney',
    contactFirstName: 'Principal', contactFullName: 'Centre Director',
    contactEmail: 'info@essmc.com.au', contactEmailSource: 'info-fallback',
    contactRole: 'Director',
    contactDiscipline: 'sportsMedicineDoctors',
    clinicWebsiteUrl: 'https://easternsuburbssportsmed.com.au',
    team: team({ physiotherapists: 4, exercisePhys: 2, sportsMedicineDoctors: 2, remedialMassage: 2 }),
    travelBand: 'within-10hr', cohortRecommendation: 'recommended',
    status: 'researching', priorityWave: 'P3', pitchVariant: 'metro',
    notes: 'VERIFIED. Long-established multi-disc. Physios + sports docs + ortho + EP + dietitian. High-profile clientele.',
  },
  {
    slug: 'zone-34-sports-physio',
    name: 'Zone 34 Sports Physiotherapy', shortName: 'Zone 34',
    city: 'Lewisham', state: 'NSW', region: 'Sydney',
    contactFirstName: 'Principal', contactFullName: 'Principal Physiotherapist',
    contactEmail: 'info@zone34.com.au', contactEmailSource: 'info-fallback',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://zone34.com.au',
    team: team({ physiotherapists: 8, exercisePhys: 2, sportsMedicineDoctors: 1 }),
    travelBand: 'within-10hr', cohortRecommendation: 'recommended',
    status: 'researching', priorityWave: 'P3', pitchVariant: 'network', networkSize: 2,
    notes: 'VERIFIED. 12+ team. Lewisham + Ultimo. Physios + EPs + hand therapists + sports docs + dietitian.',
  },
  {
    slug: 'the-sports-clinic-usyd',
    name: 'The Sports Clinic @ University of Sydney', shortName: 'USYD Sports Clinic',
    city: 'Camperdown', state: 'NSW', region: 'Sydney',
    contactFirstName: 'Director', contactFullName: 'Clinic Director',
    contactEmail: 'info@thesportsclinic.com.au', contactEmailSource: 'info-fallback',
    contactRole: 'Director',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://thesportsclinic.com.au',
    team: team({ physiotherapists: 6, exercisePhys: 4, sportsMedicineDoctors: 4 }),
    travelBand: 'within-10hr', cohortRecommendation: 'recommended',
    status: 'researching', priorityWave: 'P3', pitchVariant: 'metro',
    notes: 'VERIFIED. 20+ staff. University-based, elite athlete focus.',
  },
  {
    slug: 'sydney-sports-physio-rehab',
    name: 'Sydney Sports Physio & Rehab', shortName: 'Sydney Sports Physio',
    city: 'Norwest', state: 'NSW', region: 'Sydney',
    contactFirstName: 'Nathan', contactFullName: 'Nathan Halliday',
    contactEmail: 'nathan@sportsphysioandrehab.com.au', contactEmailSource: 'pattern-guess',
    contactRole: 'Principal · Masters Sports Physio',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://sportsphysioandrehab.com.au',
    team: team({ physiotherapists: 7, exercisePhys: 1 }),
    travelBand: 'within-10hr', cohortRecommendation: 'essential',
    status: 'approved', priorityWave: 'P3', pitchVariant: 'metro',
    notes: 'VERIFIED. Nathan Halliday Masters Sports Physio. 16yr exp. Hands-on rehab focus.',
  },
  {
    slug: 'stadium-sports-physio',
    name: 'Stadium Sports Physiotherapy', shortName: 'Stadium Sports Physio',
    city: 'Moore Park', state: 'NSW', region: 'Sydney',
    contactFirstName: 'Principal', contactFullName: 'Principal Physiotherapist',
    contactEmail: 'info@stadiumsportsphysio.com.au', contactEmailSource: 'info-fallback',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://stadiumsportsphysio.com.au',
    team: team({ physiotherapists: 8, exercisePhys: 1 }),
    travelBand: 'within-10hr', cohortRecommendation: 'essential',
    status: 'researching', priorityWave: 'P3', pitchVariant: 'metro',
    notes: 'VERIFIED. Integrated ortho/sports. Serves entertainers + athletes at Moore Park.',
  },
  {
    slug: 'mater-clinic-physio',
    name: 'Mater Clinic Physiotherapy', shortName: 'Mater Clinic Physio',
    city: 'Wollstonecraft', state: 'NSW', region: 'Sydney',
    contactFirstName: 'Principal', contactFullName: 'Principal Physiotherapist',
    contactEmail: 'info@materclinicphysio.com.au', contactEmailSource: 'info-fallback',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://materclinicphysio.com.au',
    team: team({ physiotherapists: 7, remedialMassage: 3 }),
    travelBand: 'within-10hr', cohortRecommendation: 'essential',
    status: 'researching', priorityWave: 'P3', pitchVariant: 'metro',
    notes: 'VERIFIED. Physios + podiatrists + massage + dietitian. North Sydney sports + post-op specialist.',
  },
  {
    slug: 'south-coast-health-hub',
    name: 'South Coast Health Hub', shortName: 'South Coast Health Hub',
    city: 'Wollongong', state: 'NSW', region: 'Wollongong',
    contactFirstName: 'Mick', contactFullName: 'Mick Baines',
    contactEmail: 'mick@healthhubsc.com.au', contactEmailSource: 'pattern-guess',
    contactRole: 'Director',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://healthhubsc.com.au',
    team: team({ physiotherapists: 10, exercisePhys: 4, remedialMassage: 2, practiceManager: 1, admin: 3 }),
    travelBand: 'within-10hr', cohortRecommendation: 'full-team',
    status: 'approved', priorityWave: 'P3', pitchVariant: 'network', networkSize: 3, nearestMetro: 'Sydney',
    notes: 'VERIFIED. Directors Mick Baines + Jordan Loveridge (physios) + Harry Freund (EP). Wollongong + Nowra + Kiama.',
  },
  {
    slug: 'evolve-health-illawarra',
    name: 'Evolve Health Illawarra', shortName: 'Evolve Health',
    city: 'Wollongong', state: 'NSW', region: 'Wollongong',
    contactFirstName: 'Director', contactFullName: 'Clinical Director',
    contactEmail: 'LivesmartEvolve@outlook.com', contactEmailSource: 'website',
    contactRole: 'Director',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://livesmartevolve.com',
    team: team({ physiotherapists: 4, osteopaths: 2, exercisePhys: 2, remedialMassage: 1 }),
    travelBand: 'within-10hr', cohortRecommendation: 'essential',
    status: 'researching', priorityWave: 'P3', pitchVariant: 'metro', nearestMetro: 'Sydney',
    notes: 'VERIFIED. 8-service multi-disc. Physio + EP + osteo + massage + naturo + women health + pilates + TCM.',
  },
  {
    slug: 'coastal-physio-group',
    name: 'Coastal Physiotherapy Clinic', shortName: 'Coastal Physio',
    city: 'North Gosford', state: 'NSW', region: 'Central Coast',
    contactFirstName: 'Elizabeth', contactFullName: 'Elizabeth Ward',
    contactEmail: 'elizabeth@coastalphysiogroup.com.au', contactEmailSource: 'pattern-guess',
    contactRole: 'Director · Hand Therapist',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://coastalphysiogroup.com.au',
    team: team({ physiotherapists: 9 }),
    travelBand: 'within-10hr', cohortRecommendation: 'essential',
    status: 'approved', priorityWave: 'P3', pitchVariant: 'regional', nearestMetro: 'Sydney',
    notes: 'VERIFIED. 3 partners (E Ward hand therapist + R Todd + M Ward). 30+ years. N Gosford + Erina.',
  },
  {
    slug: 'thrive-physio-erina',
    name: 'Thrive Physio', shortName: 'Thrive Physio',
    city: 'Erina', state: 'NSW', region: 'Central Coast',
    contactFirstName: 'Principal', contactFullName: 'Principal Physiotherapist',
    contactEmail: 'thrive@thrivephysio.com.au', contactEmailSource: 'website',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://thrivephysio.com.au',
    team: team({ physiotherapists: 4, remedialMassage: 1 }),
    travelBand: 'within-10hr', cohortRecommendation: 'essential',
    status: 'researching', priorityWave: 'P3', pitchVariant: 'regional', nearestMetro: 'Sydney',
    notes: 'VERIFIED. 6 named practitioners. 25 years. Award-winning. Central Coast Highway.',
  },
  {
    slug: 'hills-street-sports-medicine',
    name: 'Hills Street Sports Medicine', shortName: 'Hills Street Sports Med',
    city: 'Gosford', state: 'NSW', region: 'Central Coast',
    contactFirstName: 'Director', contactFullName: 'Clinical Director',
    contactEmail: 'info@hillsstreet.com.au', contactEmailSource: 'info-fallback',
    contactRole: 'Director',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://hillsstreet.com.au',
    team: team({ physiotherapists: 6, exercisePhys: 2, sportsMedicineDoctors: 2, remedialMassage: 2 }),
    travelBand: 'within-10hr', cohortRecommendation: 'recommended',
    status: 'researching', priorityWave: 'P3', pitchVariant: 'regional', nearestMetro: 'Sydney',
    notes: 'VERIFIED. Multi-disc. Physios + EPs + psychologists + ortho specialists.',
  },
  {
    slug: 'momentum-therapies-canberra',
    name: 'Momentum Therapies', shortName: 'Momentum Therapies',
    city: 'Canberra', state: 'ACT', region: 'Canberra / ACT',
    contactFirstName: 'Inez', contactFullName: 'Inez Tolley',
    contactEmail: 'hello@momentumtherapies.com.au', contactEmailSource: 'website',
    contactRole: 'Principal Osteopath',
    contactDiscipline: 'osteopaths',
    clinicWebsiteUrl: 'https://momentumtherapies.com.au',
    team: team({ osteopaths: 1 }),
    travelBand: 'flight-domestic', cohortRecommendation: 'essential',
    status: 'researching', priorityWave: 'P3', pitchVariant: 'regional', nearestMetro: 'Sydney',
    notes: 'VERIFIED. Inez Tolley solo osteo. WAY smaller than seed estimate. Single-clinician — TOO SMALL for cohort, route to public workshop.',
  },
  {
    slug: 'the-canberra-physio-clinic',
    name: 'The Canberra Physio Clinic', shortName: 'Canberra Physio Clinic',
    city: 'Belconnen', state: 'ACT', region: 'Canberra / ACT',
    contactFirstName: 'Toby', contactFullName: 'Toby Conroy',
    contactEmail: 'toby@canberraphysioclinic.com.au', contactEmailSource: 'pattern-guess',
    contactRole: 'Founder',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://canberraphysioclinic.com.au',
    team: team({ physiotherapists: 6, exercisePhys: 1, remedialMassage: 1 }),
    travelBand: 'flight-domestic', cohortRecommendation: 'essential',
    status: 'approved', priorityWave: 'P3', pitchVariant: 'network', networkSize: 2, nearestMetro: 'Sydney',
    notes: 'VERIFIED. Toby Conroy founder. Multi-disc. Belconnen + Manuka.',
  },
  {
    slug: 'canberra-injury-management',
    name: 'Canberra Injury Management Centre', shortName: 'CIMC',
    city: 'Braddon', state: 'ACT', region: 'Canberra / ACT',
    contactFirstName: 'Director', contactFullName: 'Clinical Director',
    contactEmail: 'info@cimc.net.au', contactEmailSource: 'info-fallback',
    contactRole: 'Director',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://cimc.net.au',
    team: team({ physiotherapists: 6, exercisePhys: 2, sportsMedicineDoctors: 1, remedialMassage: 1 }),
    travelBand: 'flight-domestic', cohortRecommendation: 'recommended',
    status: 'researching', priorityWave: 'P3', pitchVariant: 'metro',
    notes: 'VERIFIED. Est. 1998. Integrated pain/injury clinic. EP + physio integration.',
  },
  {
    slug: 'sportstec-clinic-canberra',
    name: 'SportsTec Clinic', shortName: 'SportsTec',
    city: 'Kambah', state: 'ACT', region: 'Canberra / ACT',
    contactFirstName: 'Director', contactFullName: 'Clinic Director',
    contactEmail: 'info@sportstecclinic.com.au', contactEmailSource: 'info-fallback',
    contactRole: 'Director',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://sportstecclinic.com.au',
    team: team({ physiotherapists: 6, exercisePhys: 1, remedialMassage: 2 }),
    travelBand: 'flight-domestic', cohortRecommendation: 'essential',
    status: 'researching', priorityWave: 'P3', pitchVariant: 'metro',
    notes: 'VERIFIED. Multi-disc sports + performance (physio + rehab + acupuncture + pilates + massage + dietitian).',
  },

  // ─────────────────────────────────────────────────────────────────────
  // P4 — Mid North Coast + Port Macquarie + Toowoomba
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: 'mid-north-coast-allied-health',
    name: 'Mid North Coast Allied Health', shortName: 'MNC Allied Health',
    city: 'Coffs Harbour', state: 'NSW', region: 'Mid North Coast',
    contactFirstName: 'Aaron', contactFullName: 'Aaron Hardaker',
    contactEmail: 'aaron@mncalliedhealth.com.au', contactEmailSource: 'pattern-guess',
    contactRole: 'Director',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://mncalliedhealth.com',
    team: team({ physiotherapists: 15, exercisePhys: 6, remedialMassage: 3, practiceManager: 3, admin: 6 }),
    travelBand: 'within-4hr', cohortRecommendation: 'full-team',
    status: 'approved', priorityWave: 'P4', pitchVariant: 'network', networkSize: 9, nearestMetro: 'Sydney',
    notes: 'VERIFIED. Aaron Hardaker director. 50 staff. 9 sites Woolgoolga-Laurieton. Biggest network in the list.',
  },
  {
    slug: 'port-macquarie-sports-med',
    name: 'Port Macquarie Sports Medicine Centre', shortName: 'Port Mac Sports Med',
    city: 'Port Macquarie', state: 'NSW', region: 'Mid North Coast',
    contactFirstName: 'Director', contactFullName: 'Clinical Director',
    contactEmail: 'info@portmacquariesmc.com.au', contactEmailSource: 'info-fallback',
    contactRole: 'Director',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://portmacquariesmc.com.au',
    team: team({ physiotherapists: 11, exercisePhys: 2, sportsMedicineDoctors: 1, remedialMassage: 1 }),
    travelBand: 'within-6hr', cohortRecommendation: 'full-team',
    status: 'researching', priorityWave: 'P4', pitchVariant: 'regional', nearestMetro: 'Sydney',
    notes: 'VERIFIED. 16 practitioners. Evidence-based athlete focus.',
  },
  {
    slug: 'better-movement-clinic',
    name: 'Better Movement Clinic', shortName: 'Better Movement',
    city: 'Toowoomba', state: 'QLD', region: 'Darling Downs',
    contactFirstName: 'Principal', contactFullName: 'Principal Practitioner',
    contactEmail: 'info@bettermovement.com.au', contactEmailSource: 'info-fallback',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://bettermovement.com.au',
    team: team({ physiotherapists: 3, exercisePhys: 4, remedialMassage: 1 }),
    travelBand: 'within-6hr', cohortRecommendation: 'essential',
    status: 'researching', priorityWave: 'P4', pitchVariant: 'regional', nearestMetro: 'Brisbane',
    notes: 'VERIFIED. Multi-disc (physio + EP + dietitian + podiatrist + massage). Toowoomba HQ + 3 regional reach.',
  },
  {
    slug: 'optimise-health-toowoomba',
    name: 'Optimise Health', shortName: 'Optimise Health',
    city: 'Toowoomba', state: 'QLD', region: 'Darling Downs',
    contactFirstName: 'Pieter', contactFullName: 'Pieter Van Der Kooij',
    contactEmail: 'pieter@optimisehealth.com.au', contactEmailSource: 'pattern-guess',
    contactRole: 'Director',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://optimisehealth.com.au',
    team: team({ physiotherapists: 4, exercisePhys: 2 }),
    travelBand: 'within-6hr', cohortRecommendation: 'essential',
    status: 'approved', priorityWave: 'P4', pitchVariant: 'regional', nearestMetro: 'Brisbane',
    notes: 'VERIFIED. Pieter Van Der Kooij director. Physio + podiatry + custom orthotics + pilates + sports. Toowoomba + Warwick.',
  },
  {
    slug: 'city-sports-spinal',
    name: 'City Sports & Spinal', shortName: 'City Sports & Spinal',
    city: 'Toowoomba', state: 'QLD', region: 'Darling Downs',
    contactFirstName: 'Principal', contactFullName: 'Principal Physiotherapist',
    contactEmail: 'info@citysportsandspinal.com.au', contactEmailSource: 'info-fallback',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://citysportsandspinal.com',
    team: team({ physiotherapists: 8, remedialMassage: 1 }),
    travelBand: 'within-6hr', cohortRecommendation: 'essential',
    status: 'researching', priorityWave: 'P4', pitchVariant: 'regional', nearestMetro: 'Brisbane',
    notes: 'VERIFIED. Physio + podiatry team. Sports injury clinic.',
  },
  {
    slug: 'fitlab-toowoomba',
    name: 'The Fit Lab Toowoomba', shortName: 'The Fit Lab',
    city: 'Toowoomba', state: 'QLD', region: 'Darling Downs',
    contactFirstName: 'Principal', contactFullName: 'Principal Practitioner',
    contactEmail: 'info@fitlab.com.au', contactEmailSource: 'info-fallback',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://fitlab.com.au',
    team: team({ physiotherapists: 6, exercisePhys: 2, remedialMassage: 1 }),
    travelBand: 'within-6hr', cohortRecommendation: 'essential',
    status: 'researching', priorityWave: 'P4', pitchVariant: 'regional', nearestMetro: 'Brisbane',
    notes: 'VERIFIED. Allied health + sports medicine team. Return-to-play strong.',
  },
  {
    slug: 'coffs-coast-health-hub',
    name: 'Coffs Coast Health Hub', shortName: 'Coffs Coast Health Hub',
    city: 'Coffs Harbour', state: 'NSW', region: 'Mid North Coast',
    contactFirstName: 'Principal', contactFullName: 'Principal Practitioner',
    contactEmail: 'info@coffscoasthealthhub.com.au', contactEmailSource: 'unverified',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://coffscoasthealthhub.com.au',
    team: team({ physiotherapists: 8, exercisePhys: 2 }),
    travelBand: 'within-4hr', cohortRecommendation: 'recommended',
    status: 'researching', priorityWave: 'P4', pitchVariant: 'regional', nearestMetro: 'Sydney or Brisbane',
    notes: 'UNVERIFIED. Domain may not resolve. Confirm before send.',
  },

  // ─────────────────────────────────────────────────────────────────────
  // P5 — Tasmania
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: 'bodysystem-hobart',
    name: 'BODYSYSTEM', shortName: 'BODYSYSTEM',
    city: 'Hobart', state: 'TAS', region: 'Hobart',
    contactFirstName: 'Kellie', contactFullName: 'Kellie Wilkie',
    contactEmail: 'kellie@bodysystem.com.au', contactEmailSource: 'pattern-guess',
    contactRole: 'Founder',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://bodysystem.com.au',
    team: team({ physiotherapists: 10, exercisePhys: 6, remedialMassage: 2, practiceManager: 2, admin: 8 }),
    travelBand: 'flight-far', cohortRecommendation: 'full-team',
    status: 'approved', priorityWave: 'P5', pitchVariant: 'network', networkSize: 2, nearestMetro: 'Melbourne',
    notes: 'VERIFIED. Kellie Wilkie founder 2001. 28 staff. Hand therapy + EP. Collins St + Argyle St.',
  },
  {
    slug: 'allcare-physio-hobart',
    name: 'AllCare Physiotherapy', shortName: 'AllCare Physio',
    city: 'Sandy Bay', state: 'TAS', region: 'Hobart',
    contactFirstName: 'Jason', contactFullName: 'Jason Rogers',
    contactEmail: 'jason@allcarephysio.com.au', contactEmailSource: 'pattern-guess',
    contactRole: 'Founder',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://allcarephysio.com.au',
    team: team({ physiotherapists: 9, exercisePhys: 1 }),
    travelBand: 'flight-far', cohortRecommendation: 'recommended',
    status: 'approved', priorityWave: 'P5', pitchVariant: 'regional', nearestMetro: 'Melbourne',
    notes: 'VERIFIED. Founders Jason Rogers + Frances Roberts + Brice Pennicott. NDIS + sports focus.',
  },
  {
    slug: 'in-balance-physio-launceston',
    name: 'In-Balance Physiotherapy', shortName: 'In-Balance Physio',
    city: 'Launceston', state: 'TAS', region: 'Launceston',
    contactFirstName: 'Scott', contactFullName: 'Scott Beeston',
    contactEmail: 'scott@inbalancephysio.com.au', contactEmailSource: 'pattern-guess',
    contactRole: 'Director',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://inbalancephysio.com.au',
    team: team({ physiotherapists: 10, exercisePhys: 4, remedialMassage: 4, practiceManager: 2, admin: 8 }),
    travelBand: 'flight-far', cohortRecommendation: 'full-team',
    status: 'approved', priorityWave: 'P5', pitchVariant: 'regional', nearestMetro: 'Melbourne',
    notes: 'VERIFIED. Directors Scott Beeston + Michelle Walkden. 30 staff. NDIS + sports.',
  },
  {
    slug: 'leap-health-launceston',
    name: 'Leap Health Physiofit', shortName: 'Leap Health',
    city: 'South Launceston', state: 'TAS', region: 'Launceston',
    contactFirstName: 'Stewart', contactFullName: 'Stewart Williamson',
    contactEmail: 'stewart@leaphealth.com.au', contactEmailSource: 'pattern-guess',
    contactRole: 'Director',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://leaphealth.com.au',
    team: team({ physiotherapists: 5, exercisePhys: 2, remedialMassage: 2 }),
    travelBand: 'flight-far', cohortRecommendation: 'essential',
    status: 'approved', priorityWave: 'P5', pitchVariant: 'regional', nearestMetro: 'Melbourne',
    notes: 'VERIFIED. Stewart Williamson director. Physio + EP + massage + PT. Wellness focus.',
  },

  // ─────────────────────────────────────────────────────────────────────
  // TIER 1 ADDITIONS (12+ clinical, verified founders, high-conviction fit)
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: 'gold-coast-physio-sports-health',
    name: 'Gold Coast Physio & Sports Health', shortName: 'GC Physio & Sports',
    city: 'Burleigh Heads', state: 'QLD', region: 'Gold Coast',
    contactFirstName: 'Britt', contactFullName: 'Britt Caling',
    contactEmail: 'britt@mygcphysio.com.au', contactEmailSource: 'pattern-guess',
    contactRole: 'Co-founder',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://mygcphysio.com.au',
    team: team({ physiotherapists: 16, exercisePhys: 2, remedialMassage: 11, practiceManager: 2, admin: 4 }),
    travelBand: 'within-2hr', cohortRecommendation: 'full-team',
    status: 'approved', priorityWave: 'P1', pitchVariant: 'network', networkSize: 2,
    notes: 'TIER 1. Co-founders Britt Caling + Thea Dillon. Elite-athlete background. 30+ staff. Burleigh + Ashmore. Same suburb as POGO — schedule spacing critical.',
  },
  {
    slug: 'hoys-allied-health',
    name: 'Hoys Allied Health', shortName: 'Hoys Allied Health',
    city: 'Coffs Harbour', state: 'NSW', region: 'Mid North Coast',
    contactFirstName: 'Nat', contactFullName: 'Nat (Operations)',
    contactEmail: 'nat@hoyshealth.com.au', contactEmailSource: 'website',
    contactRole: 'Operations',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://hoyshealth.com.au',
    team: team({ physiotherapists: 15, exercisePhys: 5, remedialMassage: 5, practiceManager: 3, admin: 8 }),
    travelBand: 'within-4hr', cohortRecommendation: 'full-team',
    status: 'approved', priorityWave: 'P4', pitchVariant: 'network', networkSize: 3, nearestMetro: 'Sydney',
    notes: 'TIER 1. Founder Jack Dix (2006). 40+ staff. 3 sites. Comprehensive allied health (physio + OT + dietetics + nutrition + EP + massage). Big network deal target.',
  },
  {
    slug: 'phytness-healthcare-wollongong',
    name: 'Phytness HealthCare', shortName: 'Phytness HealthCare',
    city: 'Wollongong', state: 'NSW', region: 'Wollongong',
    contactFirstName: 'Daniel', contactFullName: 'Daniel Mitchell',
    contactEmail: 'daniel@phytness.com.au', contactEmailSource: 'pattern-guess',
    contactRole: 'Co-founder',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://phytness.com.au',
    team: team({ physiotherapists: 16, exercisePhys: 5, sportsMedicineDoctors: 2, remedialMassage: 2, practiceManager: 2, admin: 4 }),
    travelBand: 'within-10hr', cohortRecommendation: 'full-team',
    status: 'approved', priorityWave: 'P3', pitchVariant: 'network', networkSize: 3, nearestMetro: 'Sydney',
    notes: 'TIER 1. Co-founders Daniel Mitchell + Bart Tuohey. Est. 2004. 20+ clinical. 3 sites (Fairy Meadow + UoW + Dapto). Sports-med-doctor in team.',
  },
  {
    slug: 'brisbane-sports-medicine',
    name: 'Brisbane Sports Medicine', shortName: 'Brisbane Sports Medicine',
    city: 'Kelvin Grove', state: 'QLD', region: 'Brisbane',
    contactFirstName: 'Stacey', contactFullName: 'Dr Stacey Compton',
    contactEmail: 'reception@brisbanesportsmedicine.com.au', contactEmailSource: 'website',
    contactRole: 'Sports Medicine Physician · Founder',
    contactDiscipline: 'sportsMedicineDoctors',
    clinicWebsiteUrl: 'https://brisbanesportsmedicine.com',
    team: team({ physiotherapists: 6, sportsMedicineDoctors: 2, remedialMassage: 1, practiceManager: 1, admin: 2 }),
    travelBand: 'within-4hr', cohortRecommendation: 'recommended',
    status: 'researching', priorityWave: 'P2', pitchVariant: 'metro',
    notes: 'TIER 2. Dr Stacey Compton sports physician founder. 10 practitioners. Physio + psych + pilates + podiatry.',
  },
  {
    slug: 'newcastle-sports-medicine',
    name: 'Newcastle Sports Medicine', shortName: 'Newcastle Sports Med',
    city: 'Warners Bay', state: 'NSW', region: 'Newcastle / Hunter',
    contactFirstName: 'Ross', contactFullName: 'Dr Ross Cairns',
    contactEmail: 'ross@newcastlesportsmedicine.com.au', contactEmailSource: 'pattern-guess',
    contactRole: 'Sports Medicine Physician · Founder',
    contactDiscipline: 'sportsMedicineDoctors',
    clinicWebsiteUrl: 'https://newcastlesportsmedicine.com.au',
    team: team({ physiotherapists: 2, sportsMedicineDoctors: 1, remedialMassage: 3, practiceManager: 1, admin: 1 }),
    travelBand: 'within-4hr', cohortRecommendation: 'essential',
    status: 'researching', priorityWave: 'P3', pitchVariant: 'regional', nearestMetro: 'Sydney',
    notes: 'TIER 3. Dr Ross Cairns sports physician. Small but sports-physician-led — strong concussion fit. Verify team size.',
  },
  {
    slug: 'nqpc-townsville',
    name: 'North Queensland Physiotherapy Centre', shortName: 'NQPC',
    city: 'Townsville', state: 'QLD', region: 'North QLD',
    contactFirstName: 'Steve', contactFullName: 'Steve Sartori',
    contactEmail: 'admin@nqpc.com.au', contactEmailSource: 'website',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://nqpc.com.au',
    team: team({ physiotherapists: 10, practiceManager: 1, admin: 2 }),
    travelBand: 'flight-far', cohortRecommendation: 'recommended',
    status: 'researching', priorityWave: 'P5', pitchVariant: 'regional', nearestMetro: 'Brisbane',
    notes: 'TIER 2. Steve Sartori principal. 20+ years. Works with North QLD Cowboys. Sports injury specialist. Far for on-site — route to fly-up day or workshop.',
  },

  // ─────────────────────────────────────────────────────────────────────
  // ARCHIVED — originally fabricated entries, domains not resolved.
  // Kept for audit history. Status=archived means excluded from sends
  // until verified or replaced.
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: 'lismore-sports-physio',
    name: 'Lismore Sports Physiotherapy', shortName: 'Lismore Sports Physio',
    city: 'Lismore', state: 'NSW', region: 'Northern Rivers',
    contactFirstName: 'Principal', contactFullName: 'Principal Physiotherapist',
    contactEmail: 'info@lismoresportsphysio.com.au', contactEmailSource: 'unverified',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://lismoresportsphysio.com.au',
    team: team({ physiotherapists: 8 }),
    travelBand: 'within-2hr', cohortRecommendation: 'essential',
    status: 'archived', priorityWave: 'P4', pitchVariant: 'regional', nearestMetro: 'Brisbane',
    notes: 'ARCHIVED. Domain did not resolve. Was originally fabricated as list filler — needs replacement with real Lismore clinic.',
  },
  {
    slug: 'grafton-allied-health',
    name: 'Grafton Allied Health', shortName: 'Grafton Allied Health',
    city: 'Grafton', state: 'NSW', region: 'Northern Rivers',
    contactFirstName: 'Principal', contactFullName: 'Principal Practitioner',
    contactEmail: 'info@graftonalliedhealth.com.au', contactEmailSource: 'unverified',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://graftonalliedhealth.com.au',
    team: team({ physiotherapists: 6, exercisePhys: 2, osteopaths: 2 }),
    travelBand: 'within-2hr', cohortRecommendation: 'essential',
    status: 'archived', priorityWave: 'P4', pitchVariant: 'regional', nearestMetro: 'Brisbane',
    notes: 'ARCHIVED. Domain did not resolve. Replace with real Grafton clinic.',
  },
  {
    slug: 'the-body-mechanic-adelaide',
    name: 'The Body Mechanic', shortName: 'The Body Mechanic',
    city: 'Adelaide', state: 'SA', region: 'Adelaide',
    contactFirstName: 'Bookings', contactFullName: 'Bookings Team',
    contactEmail: 'bookings@thebodymechanic.com.au', contactEmailSource: 'website',
    contactRole: 'Bookings',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://thebodymechanic.com.au',
    team: team({ physiotherapists: 5 }),
    travelBand: 'flight-far', cohortRecommendation: 'essential',
    status: 'researching', priorityWave: 'P5', pitchVariant: 'metro',
    notes: 'VERIFIED. 5 physios listed. No founder identified. Small fit — verify size before send.',
  },
  {
    slug: 'adelaide-physio-co',
    name: 'Adelaide Physio Co', shortName: 'Adelaide Physio Co',
    city: 'Adelaide', state: 'SA', region: 'Adelaide',
    contactFirstName: 'Principal', contactFullName: 'Principal Physiotherapist',
    contactEmail: 'info@adelaidephysioco.com.au', contactEmailSource: 'unverified',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://adelaidephysioco.com.au',
    team: team({ physiotherapists: 8, exercisePhys: 2 }),
    travelBand: 'flight-far', cohortRecommendation: 'recommended',
    status: 'archived', priorityWave: 'P5', pitchVariant: 'metro',
    notes: 'ARCHIVED. Domain did not resolve. Replace with real Adelaide clinic.',
  },
  {
    slug: 'glenelg-sports-medicine',
    name: 'Glenelg Sports Medicine', shortName: 'Glenelg Sports Med',
    city: 'Glenelg', state: 'SA', region: 'Adelaide',
    contactFirstName: 'Principal', contactFullName: 'Principal Practitioner',
    contactEmail: 'info@glenelgsportsmed.com.au', contactEmailSource: 'unverified',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://glenelgsportsmed.com.au',
    team: team({ physiotherapists: 6, exercisePhys: 2 }),
    travelBand: 'flight-far', cohortRecommendation: 'essential',
    status: 'archived', priorityWave: 'P5', pitchVariant: 'metro',
    notes: 'ARCHIVED. Domain did not resolve. Replace with real Adelaide sports clinic.',
  },
  {
    slug: 'norwood-health-network',
    name: 'Norwood Health Network', shortName: 'Norwood Health',
    city: 'Norwood', state: 'SA', region: 'Adelaide',
    contactFirstName: 'Director', contactFullName: 'Clinical Director',
    contactEmail: 'info@norwoodhealthnetwork.com.au', contactEmailSource: 'unverified',
    contactRole: 'Director',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://norwoodhealthnetwork.com.au',
    team: team({ physiotherapists: 10, exercisePhys: 3 }),
    travelBand: 'flight-far', cohortRecommendation: 'recommended',
    status: 'archived', priorityWave: 'P5', pitchVariant: 'network', networkSize: 3,
    notes: 'ARCHIVED. Domain did not resolve. Replace with real Adelaide network.',
  },
  {
    slug: 'imove-physio-brisbane',
    name: 'iMove Physiotherapy', shortName: 'iMove Physio',
    city: 'Brisbane', state: 'QLD', region: 'Brisbane',
    contactFirstName: 'Director', contactFullName: 'Clinical Director',
    contactEmail: 'info@imovephysiotherapy.com.au', contactEmailSource: 'unverified',
    contactRole: 'Clinical Director',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://imovephysiotherapy.com.au',
    team: team({ physiotherapists: 14, exercisePhys: 4 }),
    travelBand: 'within-4hr', cohortRecommendation: 'recommended',
    status: 'archived', priorityWave: 'P2', pitchVariant: 'network', networkSize: 3,
    notes: 'ARCHIVED. Site fetch failed. Confirm domain + team before reactivating.',
  },
  {
    slug: 'the-physio-movement-brisbane',
    name: 'The Physio Movement', shortName: 'The Physio Movement',
    city: 'Townsville', state: 'QLD', region: 'North QLD',
    contactFirstName: 'Principal', contactFullName: 'Principal Physiotherapist',
    contactEmail: 'info@thephysiomovement.com.au', contactEmailSource: 'unverified',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://thephysiomovement.com.au',
    team: team({ physiotherapists: 8, exercisePhys: 2 }),
    travelBand: 'flight-far', cohortRecommendation: 'recommended',
    status: 'archived', priorityWave: 'P6', pitchVariant: 'regional',
    notes: 'ARCHIVED. Actually TOWNSVILLE not Brisbane (seed data was wrong). Too far for on-site without major trip. Route to online or workshop.',
  },
  {
    slug: 'boost-health-group-brisbane',
    name: 'Boost Health Group', shortName: 'Boost Health',
    city: 'Brisbane', state: 'QLD', region: 'Brisbane',
    contactFirstName: 'Director', contactFullName: 'Clinical Director',
    contactEmail: 'info@boosthealthgroup.com.au', contactEmailSource: 'unverified',
    contactRole: 'Director',
    contactDiscipline: 'exercisePhys',
    clinicWebsiteUrl: 'https://boosthealthgroup.com.au',
    team: team({ physiotherapists: 3, exercisePhys: 8 }),
    travelBand: 'within-4hr', cohortRecommendation: 'recommended',
    status: 'archived', priorityWave: 'P2', pitchVariant: 'metro',
    notes: 'ARCHIVED. No team info on homepage. Confirm scale before reactivating.',
  },
  {
    slug: 'canberra-allied-health',
    name: 'Canberra Allied Health', shortName: 'Canberra Allied Health',
    city: 'Canberra', state: 'ACT', region: 'Canberra / ACT',
    contactFirstName: 'Principal', contactFullName: 'Principal Practitioner',
    contactEmail: 'info@canberraalliedhealth.com.au', contactEmailSource: 'unverified',
    contactRole: 'Principal',
    contactDiscipline: 'physiotherapists',
    clinicWebsiteUrl: 'https://canberraalliedhealth.com.au',
    team: team({ physiotherapists: 8, exercisePhys: 2, osteopaths: 1 }),
    travelBand: 'flight-domestic', cohortRecommendation: 'recommended',
    status: 'archived', priorityWave: 'P3', pitchVariant: 'regional', nearestMetro: 'Sydney',
    notes: 'ARCHIVED. Site fetch failed. Confirm domain before reactivating.',
  },
]

/**
 * Build the cold-outreach send schedule across PROSPECT_TARGETS.
 *
 * Rules:
 *  - Mon / Wed / Fri only (never Tue/Thu, never weekend).
 *  - Hard cap of `dailyCap` sends per day (default 5).
 *  - Priority order: P1 → P6 wave, then full-team → recommended → essential
 *    cohort tier within wave.
 *  - **Suburb spacing**: no two prospects from the same city/suburb on the
 *    same day. Avoids competitively pitching neighbours on a Monday and
 *    burning the meeting (POGO + Burleigh Sports Physio both Wed → no).
 *  - **Region clustering is OK**: multiple prospects from the same region
 *    on the same day is fine and actually helps — if they convert it
 *    becomes a single trip bundle from Byron Bay, amortising travel cost.
 *  - **Status filter**: only sends to 'approved' or 'researching' status.
 *    'archived' / 'lost' / 'won' are excluded.
 *
 * Returns a Map<slug, scheduledSendDate>.
 */
export function buildSendSchedule(startDate: Date, dailyCap = 5): Map<string, Date> {
  const wavePriority: Record<string, number> = { P1: 1, P2: 2, P3: 3, P4: 4, P5: 5, P6: 6 }
  const cohortPriority: Record<CohortRecommendation, number> = { 'full-team': 1, recommended: 2, essential: 3 }

  const ordered = PROSPECT_TARGETS
    .filter((p) => p.status === 'approved' || p.status === 'researching')
    .sort((a, b) => {
      const wa = wavePriority[a.priorityWave] - wavePriority[b.priorityWave]
      if (wa !== 0) return wa
      return cohortPriority[a.cohortRecommendation] - cohortPriority[b.cohortRecommendation]
    })

  const schedule = new Map<string, Date>()
  const sendDay = new Date(startDate)
  sendDay.setHours(9, 30, 0, 0)
  const dayBucket: Array<{ slug: string; city: string; region: string }> = []

  const advanceDay = () => {
    sendDay.setDate(sendDay.getDate() + 1)
    while ([0, 2, 4, 6].includes(sendDay.getDay())) {
      sendDay.setDate(sendDay.getDate() + 1)
    }
    dayBucket.length = 0
  }

  while ([0, 2, 4, 6].includes(sendDay.getDay())) {
    sendDay.setDate(sendDay.getDate() + 1)
  }

  const remaining = [...ordered]
  let safetyDays = 0

  while (remaining.length > 0) {
    const idx = remaining.findIndex((p) => {
      if (dayBucket.length >= dailyCap) return false
      if (dayBucket.some((b) => b.city === p.city)) return false
      return true
    })

    if (idx === -1) {
      advanceDay()
      safetyDays += 1
      if (safetyDays > 200) break
      continue
    }

    const p = remaining.splice(idx, 1)[0]
    schedule.set(p.slug, new Date(sendDay))
    dayBucket.push({ slug: p.slug, city: p.city, region: p.region })
  }

  return schedule
}

export type { ProspectStatus, CohortRecommendation, TravelBand, Discipline, State }
