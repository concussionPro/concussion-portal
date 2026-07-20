import { Metadata } from 'next'

// ─────────────────────────────────────────────────────────────────────────────
// /acsm — ACSM asset A10. This page must be LIVE BEFORE approval so that
// traffic arriving from the ACSM Approved Providers listing is attributable.
// The listing link carries ?utm_source=acsm&utm_medium=listing&utm_campaign=
// provider_listing (see docs/applications/ACSM-SUBMISSION-PACK.md).
//
// HONESTY GATE — non-negotiable, this page is the one ACSM's reviewer will read:
//   • ACSM CECs are NOT held. The application is in progress. Never state a CEC
//     figure until the approval letter specifies one.
//   • Citing ACSM's published position (the Hot Topic) is fair use. Implying
//     ACSM ENDORSES this course is not. Keep those strictly separate.
//   • After approval we are limited to the exact statement wording ACSM issues
//     with the logo — do not pre-empt it here.
// ─────────────────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Concussion Rehab Mastery — for ACSM-EP and ACSM-CEP Professionals',
  description:
    'The consensus made a heart-rate-threshold exercise prescription the first-line treatment for concussion — derived from a graded exercise test. That is your competency. This is the course that turns it into a new patient population, with the tools to deliver it. USD $347. ACSM CEC application in progress.',
  keywords:
    'ACSM CEC concussion, ACSM-EP concussion, ACSM-CEP concussion, clinical exercise physiologist concussion, sub-symptom threshold aerobic exercise, Buffalo concussion treadmill test, FITT concussion prescription',
  openGraph: {
    title: 'Concussion Rehab Mastery — for ACSM-EP and ACSM-CEP Professionals',
    description:
      'You already run the graded exercise test. The consensus just made it the gate to first-line concussion treatment. The EP-scoped course, plus the tools to deliver it.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/acsm',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/acsm',
  },
}

export default function AcsmLayout({ children }: { children: React.ReactNode }) {
  return children
}
