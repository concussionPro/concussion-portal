import type { ClinicTeam, TravelBand, PricingBreakdown, Discipline } from './types'
import { CONFIG } from '@/lib/config'

/**
 * Clinic size bucket — used by:
 *  - Admin dashboard to segment outreach pipeline
 *  - Hub Pack pricing (extra-seat math beyond the 5 included)
 *  - ICP qualification (very large clinics typically route to the on-site
 *    cohort offer instead, which has its own pricing engine via computePricing)
 *
 * Buckets are based on CLINICAL headcount (excludes admin + practice manager).
 * Cutoffs match Zac's stated criteria: "do not allow very large clinics
 * access without extra charge for 5+ clinicians".
 */
/**
 * Per Zac's strategy 2026-06-05:
 *   ≤5 clinical → Hub Pack ($1,497, up to 5 online + admin/docs, optional
 *                $497/seat workshop upgrade)
 *   6-7 clinical → on-site cohort (min 8 needed; suggest invite outside
 *                  practitioners to make up numbers — 'inviting' bucket)
 *   8-20 clinical → on-site cohort (economic at this size)
 *   21+ clinical → enterprise on-site (different framing — full team /
 *                  multi-day capacity)
 */
export type ClinicSizeBucket = 'small' | 'inviting' | 'large' | 'enterprise'

export function clinicSizeBucket(team: ClinicTeam): ClinicSizeBucket {
  const c = clinicalCount(team)
  if (c >= 21) return 'enterprise'
  if (c >= 8) return 'large'
  if (c >= 6) return 'inviting'
  return 'small'
}

/**
 * Compute the Hub Pack total for a given clinic. Base $1,500 covers up to
 * 5 clinicians; each clinician beyond 5 adds $250 (PRICE_CLINIC_HUB_EXTRA_SEAT).
 *
 * Enterprise (21+) is INCLUDED in the formula — but in practice large
 * enterprise clinics typically convert better via the on-site cohort offer
 * (Tier 1 + Tier 2 in computePricing). The Hub Pack formula stays valid;
 * the choice of offer is a sales decision based on stated budget.
 */
export interface HubPackPricing {
  bucket: ClinicSizeBucket
  clinicalCount: number
  seatsIncluded: number
  extraSeats: number
  basePrice: number
  extraSeatsPrice: number
  totalBase: number
  recommendedOffer: 'hub-pack' | 'on-site-cohort'
}

export function hubPackPriceFor(team: ClinicTeam): HubPackPricing {
  const c = clinicalCount(team)
  const bucket = clinicSizeBucket(team)
  const seatsIncluded = CONFIG.COURSE.CLINIC_HUB_SEATS_INCLUDED
  const extraSeats = Math.max(0, c - seatsIncluded)
  const basePrice = CONFIG.COURSE.PRICE_CLINIC_HUB_PACK
  const extraSeatsPrice = extraSeats * CONFIG.COURSE.PRICE_CLINIC_HUB_EXTRA_SEAT
  // Per Zac 2026-06-05: only 'small' (≤5 clinical) gets the Hub Pack pitch.
  // Anything above (inviting/large/enterprise) gets on-site cohort. The
  // extra-online-seat math stays available for sales calls but isn't the
  // cold-pitch path anymore.
  const recommendedOffer: 'hub-pack' | 'on-site-cohort' =
    bucket === 'small' ? 'hub-pack' : 'on-site-cohort'
  return {
    bucket,
    clinicalCount: c,
    seatsIncluded,
    extraSeats,
    basePrice,
    extraSeatsPrice,
    totalBase: basePrice + extraSeatsPrice,
    recommendedOffer,
  }
}

/**
 * Per-discipline one-time seat price for Tier 1 (online clinic license).
 * Mirrors the per-seat table in SCOPE_COLD_OUTREACH_PORTAL.md §"Two-tier offering".
 */
const SEAT_PRICE: Record<Discipline, number> = {
  osteopaths: 397,
  physiotherapists: 397,
  generalPractitioners: 397,
  sportsMedicineDoctors: 397,
  exercisePhys: 347,
  myotherapists: 197,
  remedialMassage: 197,
  practiceManager: 197,
  admin: 97,
}

const TRAVEL_SURCHARGE: Record<TravelBand, number> = {
  'within-2hr': 0,
  'within-4hr': 300,
  'within-6hr': 600,
  'within-10hr': 1000,
  'flight-domestic': 1500,
  'flight-far': 2500,
}

const TIER2_BASE = 7500
const PUBLIC_RETAIL_RATE = 1400

/**
 * Resolve the per-discipline cohort tier price (Essential 8 / Recommended 10 /
 * Full team 12). Per-clinician rate scales down with cohort size.
 */
const COHORT_TIERS = [
  { name: 'Essential' as const, clinicians: 8, perClinician: 1000, total: 8000, badge: 'Minimum', recommended: false },
  { name: 'Recommended' as const, clinicians: 10, perClinician: 950, total: 9500, badge: 'Most clinics your size', recommended: true },
  { name: 'Full team' as const, clinicians: 12, perClinician: 900, total: 10800, badge: 'Best value', recommended: false },
]

export function travelSurchargeFor(band: TravelBand): number {
  return TRAVEL_SURCHARGE[band]
}

export function computePricing(team: ClinicTeam, band: TravelBand): PricingBreakdown {
  const totalSeats = teamTotal(team)

  // Per-discipline seat breakdown
  const tier1SeatBreakdown = (Object.keys(team) as Discipline[])
    .filter((d) => team[d] > 0)
    .map((discipline) => ({
      discipline,
      count: team[discipline],
      perSeat: SEAT_PRICE[discipline],
      subtotal: team[discipline] * SEAT_PRICE[discipline],
    }))

  const tier1SubtotalBeforeDiscount = tier1SeatBreakdown.reduce((acc, row) => acc + row.subtotal, 0)

  // Volume discount tiers
  const tier1VolumeDiscountPct =
    totalSeats >= 30 ? 30 :
    totalSeats >= 16 ? 20 :
    totalSeats >= 8 ? 10 : 0
  const tier1VolumeDiscountAud = Math.round((tier1SubtotalBeforeDiscount * tier1VolumeDiscountPct) / 100)
  const tier1Total = tier1SubtotalBeforeDiscount - tier1VolumeDiscountAud

  const tier2Travel = TRAVEL_SURCHARGE[band]
  const tier2Total = TIER2_BASE + tier2Travel
  const combinedTotal = tier1Total + tier2Total

  return {
    tier1Total,
    tier1SeatBreakdown,
    tier1SubtotalBeforeDiscount,
    tier1VolumeDiscountPct,
    tier1VolumeDiscountAud,
    tier2OnsiteBase: TIER2_BASE,
    tier2Travel,
    tier2Total,
    combinedTotal,
    cohortTiers: COHORT_TIERS,
    publicRetailRate: PUBLIC_RETAIL_RATE,
  }
}

/**
 * Total clinical + admin headcount across all disciplines.
 */
export function teamTotal(team: ClinicTeam): number {
  return (Object.keys(team) as Discipline[]).reduce((acc, d) => acc + team[d], 0)
}

/**
 * Clinical-only headcount (excludes practice manager + admin).
 */
export function clinicalCount(team: ClinicTeam): number {
  return (
    team.osteopaths +
    team.physiotherapists +
    team.generalPractitioners +
    team.sportsMedicineDoctors +
    team.exercisePhys +
    team.myotherapists +
    team.remedialMassage
  )
}

/**
 * Returns the team's discipline "centre of gravity" — used to decide which
 * cold-email opening-line variant to use. Returns the discipline with the
 * highest count; ties broken by the order: osteo > physio > GP > sports med
 * > EP > myo > RMT > PM > admin (clinical-first).
 */
export function dominantDiscipline(team: ClinicTeam): Discipline {
  const order: Discipline[] = [
    'osteopaths',
    'physiotherapists',
    'generalPractitioners',
    'sportsMedicineDoctors',
    'exercisePhys',
    'myotherapists',
    'remedialMassage',
    'practiceManager',
    'admin',
  ]
  let best: Discipline = 'osteopaths'
  let bestCount = -1
  for (const d of order) {
    if (team[d] > bestCount) {
      best = d
      bestCount = team[d]
    }
  }
  return best
}

/**
 * Build the "9 osteos · 3 EPs · 4 myo/RMT · 3 admin" string used in cold
 * email bodies.
 */
export function teamBreakdownString(team: ClinicTeam): string {
  const parts: string[] = []
  if (team.osteopaths) parts.push(`${team.osteopaths} osteo${team.osteopaths > 1 ? 's' : ''}`)
  if (team.physiotherapists) parts.push(`${team.physiotherapists} physio${team.physiotherapists > 1 ? 's' : ''}`)
  if (team.generalPractitioners) parts.push(`${team.generalPractitioners} GP${team.generalPractitioners > 1 ? 's' : ''}`)
  if (team.sportsMedicineDoctors) parts.push(`${team.sportsMedicineDoctors} sports med`)
  if (team.exercisePhys) parts.push(`${team.exercisePhys} EP${team.exercisePhys > 1 ? 's' : ''}`)
  const myoRmt = team.myotherapists + team.remedialMassage
  if (myoRmt) parts.push(`${myoRmt} myo/RMT`)
  const adminTotal = team.practiceManager + team.admin
  if (adminTotal) parts.push(`${adminTotal} admin`)
  return parts.join(' · ')
}
