import type { ClinicTeam, TravelBand, PricingBreakdown, Discipline } from './types'
import { CONFIG, workshopPriceFor } from '@/lib/config'

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
  // Per Zac 2026-06-18: on-site requires a MINIMUM of 8 clinicians. Only
  // 'large' (8–20) and 'enterprise' (21+) get the on-site-cohort cold pitch.
  // 'small' (≤5) AND 'inviting' (6–7) get the Hub Pack — a 6–7 clinic can be
  // invited to top up to 8 on a sales call, but the COLD pitch is never on-site
  // below 8 (it can't run, and quoting it is the over-pitch we're killing).
  const recommendedOffer: 'hub-pack' | 'on-site-cohort' =
    bucket === 'large' || bucket === 'enterprise' ? 'on-site-cohort' : 'hub-pack'
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
  chiropractors: 397,
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

// On-site day base fee. Matches the Essential (8-clinician) cohort minimum
// below so "on-site from A$8,000" is one consistent number everywhere
// (reconciled 2026-07-08 — the old $7,500 teaser contradicted the $8,000 tier).
const TIER2_BASE = 8000
// The individual Complete Course rate a clinician would ACTUALLY pay today —
// every "save A$x/clinician" line on the prospect portal is anchored to it.
// Hardcoding 1400 anchored the saving to the sticker price while checkout
// charges the early-bird rate, i.e. a saving quoted against a price nobody is
// being charged (ACL: a comparison price must be a genuine current price).
const PUBLIC_RETAIL_RATE = workshopPriceFor(null)

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
  // Defensive ?? 0 reads: older JSONB rows predate the chiropractors field, so
  // a raw team.chiropractors would be undefined → NaN and poison every tier.
  return (
    (team.osteopaths ?? 0) +
    (team.physiotherapists ?? 0) +
    (team.chiropractors ?? 0) +
    (team.generalPractitioners ?? 0) +
    (team.sportsMedicineDoctors ?? 0) +
    (team.exercisePhys ?? 0) +
    (team.myotherapists ?? 0) +
    (team.remedialMassage ?? 0)
  )
}

/**
 * Deal-type tier — which cold-outreach pitch a clinic gets, by CLINICAL
 * headcount. This is the canonical TS-side mirror of the size-tier CASE
 * expression in the lib/prospect/process-scheduled.ts ORDER BY (and the
 * prospect-fire-now candidate query) — keep all three in lockstep.
 *
 *   on-site    : clinical >= 8  — on-site training pitch (min 8 to run; Zac 2026-06-18)
 *   hub-pack   : clinical 2-7   — Hub Pack pitch
 *   individual : clinical <= 1  — individual course pitch
 */
export type DealType = 'on-site' | 'hub-pack' | 'individual'

export function dealTypeForClinicalCount(clinical: number): DealType {
  if (clinical >= 8) return 'on-site'   // Zac 2026-06-18: on-site needs a min of 8
  if (clinical >= 2) return 'hub-pack'
  return 'individual'
}

export function dealTypeFor(team: ClinicTeam): DealType {
  return dealTypeForClinicalCount(clinicalCount(team))
}

/**
 * A clinic's team is "verified" only when the website enricher actually read a
 * team page (notes tag [team-enriched=...]) or a human corrected it
 * ([team-corrected=...]). Unverified ⇒ the team JSONB is the Apollo import
 * placeholder, so we must NOT quote a specific headcount, discipline, tier or
 * team-derived price off it — fall back to the generic Hub Pack pitch.
 * (Zac 2026-06-18: "don't quote clinicians targets do not have.")
 */
export function isTeamVerified(notes?: string | null): boolean {
  return /\bteam-(enriched|corrected)\b/.test(notes ?? '')
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
    // 'chiropractors' was MISSING from this list (2026-08-06 audit). The loop
    // only ever inspects disciplines named here, so a chiro-dominant clinic
    // could never win — `best` stayed at its 'osteopaths' seed and the cold
    // email opened "Most osteos in <city> aren't set up for it yet" to a
    // chiropractic practice.
    'chiropractors',
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
