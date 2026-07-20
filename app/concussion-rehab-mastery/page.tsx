import type { Metadata } from 'next'
import { requireAiCourseAccess } from '@/components/ai-course/CourseGate'
import CrmPricingContent from '@/components/crm/CrmPricingContent'
import { CONFIG } from '@/lib/config'

// ─────────────────────────────────────────────────────────────────────────────
// Concussion Rehab Mastery — PUBLIC sales/landing page (EP-scoped stream).
//
// Structure mirrors the CCM /pricing page (Zac: "the pricing page is a good
// structure ... for each individual stream") — hero + stat bento → trust block
// → workshop photo → two-tier pricing cards → compare table → testimonials →
// instructor → FAQ. The page is a gated server shell; CrmPricingContent holds
// the client UI.
//
// IMPORTANT: built ahead of launch. Unlisted + unindexed + gated until ESSA
// approval — but ALL THREE shutters are driven by CONFIG.FEATURES.ESSA_ACCREDITED
// so approval day is one flag flip, not a hunt for hand-edits. This is the page
// the EP nurture sequence links to; if the gate outlived the flag, every lead
// would land on /login the day the emails start claiming accreditation.
// ─────────────────────────────────────────────────────────────────────────────

const LIVE = CONFIG.FEATURES.ESSA_ACCREDITED

export const metadata: Metadata = {
  title: 'Concussion Rehab Mastery — Built for Exercise Physiologists',
  description: LIVE
    ? 'The only concussion-rehabilitation course scoped for Accredited Exercise Physiologists and Exercise Scientists. 8 online modules · 8 ESSA CPD points · the clinical tools to deliver it.'
    : 'The only concussion-rehabilitation course scoped for Accredited Exercise Physiologists and Exercise Scientists. 8 online modules · 8 CPD hours · the clinical tools to deliver it · designed to ESSA CPD standards (accreditation pending).',
  robots: LIVE ? 'index, follow' : 'noindex, nofollow',
}

export default async function ConcussionRehabMasteryPage() {
  // Pre-launch gate: admin / demo-key / enrolled only. Opens on ESSA approval.
  if (!LIVE) await requireAiCourseAccess('/login')

  return <CrmPricingContent />
}
