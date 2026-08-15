import { Metadata } from 'next'
import { intlPriceForCountry } from '@/lib/international-pricing'

// USD anchor from the SAME table the page body and the Stripe charge use
// (lib/international-pricing) — the snippet quotes the anchor, never a stale
// literal.
const USD = intlPriceForCountry(null).display

// ─────────────────────────────────────────────────────────────────────────────
// /canada — the CATA Approved Provider listing landing page.
//
// CATA approval GRANTED 2026-08-14 (letter from Pete Dewar, Director of
// Operations), term 2025–2027. The member-facing CATA Approved Provider
// Listing links here; the listing link carries ?src=cata so the channel is
// attributable (same measurement pattern as the Cliniko marketplace listing).
//
// HONESTY GATES:
//   • CEU claims derive from CONFIG (0.4 CEUs/contact hour × ONLINE_CPD_POINTS)
//     — never hardcode the figure.
//   • The CATA badge is supplied artwork: display unaltered, only while the
//     Approved Provider status is current. The page renders the badge only if
//     the official PNG exists at public/logos/cata-approved-provider-2025-2027-en.png;
//     until then a plain text designation shows (never recreate the artwork).
//   • Athletic-therapist scope framing: ATs already hold the acute sideline
//     role; the sell is owning the REHAB arm — never remedial framing.
// ─────────────────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Concussion Rehab Mastery — for Certified Athletic Therapists | CATA Approved Provider',
  description:
    `You make the sideline call — this is the course for owning the recovery: measured heart-rate-threshold concussion rehabilitation, from graded testing to return to play. CATA Approved Provider; enhanced-rate CEUs for CATA members. ${USD}.`,
  keywords:
    'CATA CEU concussion, athletic therapist concussion course, CAT(C) continuing education, concussion rehabilitation course Canada, sub-symptom threshold aerobic exercise, Buffalo concussion treadmill test, return to play',
  openGraph: {
    title: 'Concussion Rehab Mastery — for Certified Athletic Therapists',
    description:
      'The consensus made measured, heart-rate-threshold exercise rehabilitation first-line concussion care. The AT-scoped course, plus the tools to deliver it. CATA Approved Provider 2025–2027.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/canada',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/canada',
  },
}

export default function CanadaLayout({ children }: { children: React.ReactNode }) {
  return children
}
