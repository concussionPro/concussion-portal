import type { Metadata } from 'next'
import { requireAiCourseAccess } from '@/components/ai-course/CourseGate'
import CrmPricingContent from '@/components/crm/CrmPricingContent'
import { CONFIG } from '@/lib/config'
import { createCourseSchema } from '@/lib/schema-markup'

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

/**
 * Course structured data for the EP stream. CCM publishes a Course node from
 * four surfaces; CRM published none, so the ESSA-accredited course was absent
 * from Google Course rich results and from the AI answer engines that quote
 * this schema — a pure-plumbing parity gap, not a content one.
 *
 * The credential names ESSA, NOT Osteopathy Australia: OA endorses CCM only.
 * The whole node is gated on ESSA_ACCREDITED so it can never publish an
 * accreditation claim before approval, matching the metadata above.
 */
const crmCourseSchema = createCourseSchema({
  name: 'Concussion Rehab Mastery',
  description:
    `Concussion-rehabilitation training scoped for Accredited Exercise Physiologists and Exercise Scientists — graded exertional testing and prescription, symptom-limited progression, return-to-sport and return-to-work decision-making, and the documentation rehab funders require. ${CONFIG.COURSE.ONLINE_CPD_POINTS} online modules plus an optional in-person practical day (${CONFIG.COURSE.CRM_TOTAL_CPD_POINTS} ESSA CPD points in total).`,
  cpdHours: CONFIG.COURSE.CRM_TOTAL_CPD_POINTS,
  credentialName: `${CONFIG.COURSE.CRM_TOTAL_CPD_POINTS} ESSA CPD Points (accreditation No. ${CONFIG.ESSA_ACCREDITATION.NUMBER})`,
  recognizedBy: {
    name: 'Exercise & Sports Science Australia (ESSA)',
    url: 'https://www.essa.org.au',
  },
  audienceRoles: ['Accredited Exercise Physiologist', 'Exercise Scientist'],
  teaches: [
    'Graded Exertional Testing',
    'Symptom-Limited Exercise Prescription',
    'Sub-Symptom Threshold Progression',
    'Return-to-Sport Decision Making',
    'Return-to-Work and Return-to-Learn Planning',
    'Concussion Rehabilitation Documentation',
  ],
  priceAUD: CONFIG.COURSE.PRICE_ONLINE,
  offerUrl: `${CONFIG.SEO.SITE_URL}/concussion-rehab-mastery`,
})

export default async function ConcussionRehabMasteryPage() {
  // Pre-launch gate: admin / demo-key / enrolled only. Opens on ESSA approval.
  if (!LIVE) await requireAiCourseAccess('/login')

  return (
    <>
      {LIVE && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(crmCourseSchema) }}
        />
      )}
      <CrmPricingContent />
    </>
  )
}
