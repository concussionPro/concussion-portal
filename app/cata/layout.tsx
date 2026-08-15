import { Metadata } from 'next'
import { intlPriceForCountry } from '@/lib/international-pricing'

// USD anchor from the SAME table the page body and the Stripe charge use
// (lib/international-pricing) — the snippet quotes the anchor, never a stale
// literal.
// Metadata is static, so it quotes the CANADIAN price — the page targets
// CATA members and a CA visitor is charged CAD (lib/international-pricing).
const CAD = intlPriceForCountry('CA').display

// ─────────────────────────────────────────────────────────────────────────────
// /cata — the CATA Approved Provider listing landing page (house convention:
// audience pages are named for the BODY — /acsm, /csep, /cep-uk).
//
// CATA approval GRANTED 2026-08-14 (letter from Pete Dewar, Director of
// Operations), term 2025–2027. The member-facing CATA Approved Provider
// Listing links the BARE domain (owner 2026-08-15); middleware geo-routes
// CA visitors here from / and /pricing — the same model as GB → /uk. Channel
// measurement = CA-geo page views on this route.
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
  title: 'Concussion Clinical Mastery — for Certified Athletic Therapists | CATA Approved Provider',
  description:
    `You make the sideline call — this is the course for the whole pathway: SCAT6/VOMS/BESS assessment, acute management, phenotype rehab and graded return to play. CATA Approved Provider; enhanced-rate CEUs for CATA members. ${CAD}.`,
  keywords:
    'CATA CEU concussion, athletic therapist concussion course, CAT(C) continuing education, SCAT6 course Canada, concussion assessment course, concussion rehabilitation course Canada, return to play',
  openGraph: {
    title: 'Concussion Clinical Mastery — for Certified Athletic Therapists',
    description:
      'The full concussion pathway for athletic therapists — assessment to return to play — plus the working clinical tools to deliver it. CATA Approved Provider 2025–2027.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/cata',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/cata',
  },
}

export default function CanadaLayout({ children }: { children: React.ReactNode }) {
  return children
}
