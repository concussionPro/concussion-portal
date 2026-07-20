import { Metadata } from 'next'

// ─────────────────────────────────────────────────────────────────────────────
// /acc — the NZ ACC Concussion Services supplier pitch page.
//
// NOINDEX, NOFOLLOW — deliberate, same posture as the other clinical-suite
// pitch pages (/platform, /sst/*). This is a DIRECT-LINK page: it is sent to a
// named clinical director or contract lead in a specific supplier organisation
// and is meant to survive being forwarded internally. It is not a public
// marketing surface and must not be discoverable, indexed or AI-crawled.
//
// CLAIM DISCIPLINE — non-negotiable (docs/applications/NZ-ACC-SUPPLIER-PACK.md):
//   • ACC884 = Client Summary Report. NOT a treatment plan. ACC32 is the
//     extension request; ACC885 is Did Not Attend. Never blur these — the
//     reader has the forms and will catch it instantly.
//   • SST Trainer COMPILES report content for transcription onto ACC's own
//     current fillable form. It does not auto-file. Never soften that.
//   • NO PMS write-back claim (Cliniko/Gensolve adapter is gated off and has
//     never been validated against a live tenant).
//   • NO price. The licence-vs-margin funding question is unresolved; quoting
//     a number against the wrong assumption burns the buyer.
//   • NO renewal hook. The executed Service Schedule runs to 30 June 2027.
//   • Osteopathy Australia endorsement belongs to CCM. ESSA is PENDING and
//     belongs to the separate EP product. No exercise physiologist authored
//     the courses. The mTBI manuscript is UNDER PEER REVIEW, not published.
// ─────────────────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'ACC884 outcome evidence and documented team competency — for ACC Concussion Services suppliers',
  description:
    'The Service Schedule obliges you to deliver assessment of exercise tolerance and functional capacity, with a mandated team in which no discipline is trained at entry to practice in graded exercise testing. Two components close that: a measured heart-rate-threshold delivery and monitoring tool that compiles ACC884 Client Summary Report content, and certificated per-clinician competency for the contract file.',
  robots: 'noindex, nofollow',
}

export default function AccLayout({ children }: { children: React.ReactNode }) {
  return children
}
