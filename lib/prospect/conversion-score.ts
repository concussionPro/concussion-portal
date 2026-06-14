/**
 * Conversion-probability score (Zac 2026-06-14).
 *
 * One composite 0-100 score per clinic, blending the signals that actually
 * predict a sale, so the send queue fires the best targets first:
 *
 *  1. Reachable email (Hunter-clean)   — can't convert who you can't reach (gate)
 *  2. Regional accessibility           — regional clinicians convert (Zac's data);
 *                                         drive > fly-regional > metro (saturated)
 *  3. Tier value                       — on-site (≥6) is the high-value product AND
 *                                         the best regional fit
 *  4. Prior engagement                 — already read their pitch = warmer
 *  5. Data quality                     — known city + real contact = a real lead
 *
 * Pure. The caller supplies the already-derived inputs.
 */
import { regionalPriority } from './regional-priority'

export interface ConversionInputs {
  city?: string | null
  state?: string | null
  region?: string | null
  clinicalCount: number
  /** Hunter verification score (0-100) — <80 or null = unreachable. */
  verificationScore?: number | null
  hunterRole?: boolean
  hunterAcceptAll?: boolean
  /** Real portal dwell (ms) on their pitch — scanner-proof engagement. */
  maxDwellMs?: number
  /** Distinct real portal sessions. */
  sessions?: number
  contactFirstName?: string | null
}

export interface ConversionScore {
  score: number          // 0-100
  reachable: boolean     // passed the Hunter gate
  band: 'A' | 'B' | 'C' | 'D'
  parts: { regional: number; tier: number; engagement: number; quality: number }
}

export function conversionScore(c: ConversionInputs): ConversionScore {
  // ── Gate: reachable email. Unreachable → score 0, can't be queued. ──
  const reachable =
    (c.verificationScore ?? 0) >= 80 &&
    !c.hunterRole &&
    !c.hunterAcceptAll
  if (!reachable) {
    return { score: 0, reachable: false, band: 'D', parts: { regional: 0, tier: 0, engagement: 0, quality: 0 } }
  }

  // Regional accessibility (0-45) — the conversion-weighted signal.
  const rp = regionalPriority(c.city, c.state, c.region)
  const regional = Math.round((rp.score / 100) * 45)

  // Tier value (0-25) — on-site is the high-value product + best regional fit.
  const tier = c.clinicalCount >= 6 ? 25 : c.clinicalCount >= 2 ? 14 : 6

  // Prior engagement (0-20) — read their pitch already = warmer lead.
  const dwellS = Math.round((c.maxDwellMs ?? 0) / 1000)
  let engagement = 0
  if ((c.sessions ?? 1) >= 2) engagement = 20         // returned — hottest
  else if (dwellS >= 30) engagement = 16
  else if (dwellS >= 10) engagement = 11
  else if (dwellS > 0) engagement = 6

  // Data quality (0-10) — a real, locatable lead beats an unknown blob.
  const hasCity = !!c.city && !/unknown/i.test(c.city)
  const hasName = !!c.contactFirstName && c.contactFirstName.length > 1 && !/unknown|there/i.test(c.contactFirstName)
  const quality = (hasCity ? 6 : 0) + (hasName ? 4 : 0)

  const score = Math.min(100, regional + tier + engagement + quality)
  const band: ConversionScore['band'] = score >= 70 ? 'A' : score >= 50 ? 'B' : score >= 30 ? 'C' : 'D'
  return { score, reachable: true, band, parts: { regional, tier, engagement, quality } }
}
