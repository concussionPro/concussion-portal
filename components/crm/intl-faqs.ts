import { CONFIG, SST_INCLUDED_TIER, sstTierAllowance } from '@/lib/config'

/**
 * Shared FAQ copy for the international CRM landing surfaces.
 *
 * Lives OUTSIDE the 'use client' component so server pages (/cata) can call it
 * too — audience pages reuse the platform-cost / refund / course-or-platform
 * answers so that copy keeps tracking CONFIG (the platform monthly rate must
 * never fork from what the card is actually charged at the 12-month mark).
 */

/** What the bundled platform costs once the included first year ends. */
export const PLATFORM_MONTHLY_AUD = SST_INCLUDED_TIER.monthlyAud

// ESSA accreditation is gated on CONFIG.FEATURES.ESSA_ACCREDITED, same
// discipline as CrmPricingContent's buildFaqs — the FAQ text is a function of
// the flag rather than a hardcoded claim.
export const buildIntlFaqs = (essaAccredited: boolean): { q: string; a: string }[] => [
  {
    q: 'Is this a course or a platform?',
    a: 'Both — always sold as one. Enrolment includes the working instruments you deliver concussion rehab with: the SST Trainer app (graded test → HR-threshold prescription → monitored home sessions), the BCTT calculator and the full Clinical Toolkit. The platform is never available without the training — running HR-threshold prescriptions on brain-injured patients without concussion education isn’t safe.',
  },
  {
    q: 'What accreditation does it carry?',
    a: `The course is built to ACSM CEC standards, but CEA holds no ACSM Approved-Provider status and is not currently pursuing one — so no ACSM CECs are offered. The course is ${essaAccredited ? `ESSA-accredited — ${CONFIG.COURSE.ONLINE_CPD_POINTS} ESSA CPD points for the online course` : 'built to ESSA CPD standards (accreditation pending)'} — independently reviewed by two ESSA-appointed reviewers. We don’t claim credits or accreditation we don’t yet hold; your certificate states ${CONFIG.COURSE.ONLINE_CPD_POINTS} hours of assessed learning, and each accreditation is added the day it’s confirmed.`,
  },
  {
    q: 'Is there an ongoing cost?',
    a: `The course is a one-time purchase — lifetime access. The clinical platform (the SST Trainer) is included free for your first year. After that, keeping the platform is A$${PLATFORM_MONTHLY_AUD}/month (the Starter rate — ${sstTierAllowance(SST_INCLUDED_TIER).toLowerCase()}, unlimited clinicians); it starts automatically at the 12-month mark and you can cancel anytime.`,
  },
  {
    q: 'What’s the refund policy?',
    a: 'A 7-day full refund applies if you’ve accessed less than 25% of the modules. Refunds process in 5–10 business days to the original payment method. Full terms are published at /terms.',
  },
]
