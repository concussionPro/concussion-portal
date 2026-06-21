import type { Metadata } from 'next'
import { requireAiCourseAccess } from '@/components/ai-course/CourseGate'
import CrmPricingContent from '@/components/crm/CrmPricingContent'

// ─────────────────────────────────────────────────────────────────────────────
// Concussion Rehab Mastery — PUBLIC sales/landing page (EP-scoped stream).
//
// Structure mirrors the CCM /pricing page (Zac: "the pricing page is a good
// structure ... for each individual stream") — hero + stat bento → trust block
// → workshop photo → two-tier pricing cards → compare table → testimonials →
// instructor → FAQ. The page is a gated server shell; CrmPricingContent holds
// the client UI.
//
// IMPORTANT: built ahead of launch. MUST stay unlisted + unindexed until the
// founder flips it live — hence noindex/nofollow, the access gate, and no link
// from any nav/homepage.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Concussion Rehab Mastery — Built for Exercise Physiologists',
  description:
    'The only concussion-rehabilitation course scoped for Accredited Exercise Physiologists and Exercise Scientists. 8 online modules · 8 CPD hours · the clinical tools to deliver it · designed to ESSA CPD standards (accreditation pending).',
  robots: 'noindex, nofollow',
}

export default async function ConcussionRehabMasteryPage() {
  // GATED PRE-LAUNCH (Zac 2026-06): admin / demo-key / enrolled only — must NOT
  // be publicly reachable until launch. Remove this line to go live.
  await requireAiCourseAccess('/login')

  return <CrmPricingContent />
}
