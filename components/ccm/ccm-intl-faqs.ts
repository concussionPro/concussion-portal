import { CONFIG, SST_INCLUDED_TIER, sstTierAllowance } from '@/lib/config'

/** What the bundled platform costs once the included first year ends. */
const PLATFORM_MONTHLY_AUD = SST_INCLUDED_TIER.monthlyAud
const STARTER_TIER = SST_INCLUDED_TIER

/**
 * Shared FAQ copy for the international CCM surfaces. Lives OUTSIDE the
 * 'use client' component so server pages (/cata) can reuse entries — reading a
 * data export from a client module in a server component crashes to the error
 * boundary (same class as the CRM buildIntlFaqs incident, caught by screenshot
 * both times).
 */
export const CCM_INTL_FAQS: { q: string; a: string }[] = [
  {
    q: 'Who is this course for?',
    a: 'Physiotherapists, osteopaths and chiropractors — the clinicians who screen, assess and manage concussion (sports, MSK and first-contact practitioners especially). It covers the full pathway you work in: recognition, SCAT6/VOMS/BESS assessment, graded return-to-play and phenotype-based rehabilitation. Exercise physiologists who deliver rehab-only should take Concussion Rehab Mastery instead.',
  },
  {
    q: 'Does it cover diagnosis — is that in my scope?',
    a: 'The course teaches concussion assessment and management within physiotherapy/allied-health scope: screening, sideline recognition, clinical assessment, graded return-to-play and rehabilitation. Formal diagnosis and return-to-play clearance where red flags are present remain with the treating medical practitioner — the course teaches exactly when and how to refer.',
  },
  {
    q: 'What accreditation does it carry?',
    a: 'Concussion Clinical Mastery is endorsed by Osteopathy Australia. Your certificate states 8 hours of assessed CPD. UK and other overseas CPD is self-directed/self-recorded — the 8 assessed hours count toward your annual requirement.',
  },
  {
    q: 'Is there an ongoing cost?',
    a: 'The course is a one-time purchase — lifetime access. The clinical platform (SST Trainer + SCAT6 baseline testing) is included free for your first year. After that, keeping the platform is A$' + PLATFORM_MONTHLY_AUD + '/month (' + sstTierAllowance(STARTER_TIER).toLowerCase() + '; clinicians are unlimited on every tier); it starts automatically at the 12-month mark and you can cancel anytime.',
  },
  {
    q: 'What’s the refund policy?',
    a: 'A 7-day full refund applies if you’ve accessed less than 25% of the modules. Refunds process in 5–10 business days to the original payment method. Full terms are published at /terms.',
  },
]
