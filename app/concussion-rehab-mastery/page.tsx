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
  // "The only concussion-rehabilitation course scoped for…" was an
  // unsubstantiated superlative, live in the description meta tag — the exact
  // form docs/brand-voice.md bans ("never 'the only Australian…' or any
  // comparable superlative: it is unsubstantiated and breaches the AHPRA
  // advertising guidelines"). Scoped-for-EPs is the verifiable claim; being
  // alone in the market is not, and CEA has no market survey to support it.
  description: LIVE
    ? `Concussion rehabilitation scoped for Accredited Exercise Physiologists and Exercise Scientists. ${CONFIG.COURSE.TOTAL_MODULES} online modules · ${CONFIG.ESSA_ACCREDITATION.ONLINE_POINTS} ESSA CPD points · the clinical tools to deliver it.`
    : `Concussion rehabilitation scoped for Accredited Exercise Physiologists and Exercise Scientists. ${CONFIG.COURSE.TOTAL_MODULES} online modules · ${CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hours · the clinical tools to deliver it · designed to ESSA CPD standards (accreditation pending).`,
  robots: LIVE ? 'index, follow' : 'noindex, nofollow',
  alternates: { canonical: '/concussion-rehab-mastery' },
  // Without these, app/layout.tsx's CCM-flavoured fallback becomes this page's
  // social preview — which is how a CRM page came to advertise CCM.
  openGraph: {
    title: 'Concussion Rehab Mastery — Built for Exercise Physiologists',
    description: LIVE
      ? `Accredited by ESSA (No. ${CONFIG.ESSA_ACCREDITATION.NUMBER}). Heart-rate-threshold exercise prescription, graded exercise testing and the documentation rehab funders require.`
      : 'Heart-rate-threshold exercise prescription, graded exercise testing and the documentation rehab funders require. Designed to ESSA CPD standards; accreditation pending.',
    url: `${CONFIG.SEO.SITE_URL}/concussion-rehab-mastery`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Concussion Rehab Mastery — Built for Exercise Physiologists',
    description: LIVE
      ? `Accredited by ESSA (No. ${CONFIG.ESSA_ACCREDITATION.NUMBER}) for Accredited Exercise Physiologists and Exercise Scientists.`
      : 'Scoped for Accredited Exercise Physiologists and Exercise Scientists. Designed to ESSA CPD standards; accreditation pending.',
  },
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
    `Concussion-rehabilitation training scoped for Accredited Exercise Physiologists and Exercise Scientists — graded exertional testing and prescription, symptom-limited progression, return-to-sport and return-to-work decision-making, and the documentation rehab funders require. ${CONFIG.COURSE.TOTAL_MODULES} online modules plus an optional in-person practical day (${CONFIG.COURSE.CRM_TOTAL_CPD_POINTS} ESSA CPD points in total).`,
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
