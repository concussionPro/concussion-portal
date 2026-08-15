import { existsSync } from 'fs'
import { join } from 'path'
import Image from 'next/image'
import { headers } from 'next/headers'
import { ShieldCheck } from 'lucide-react'
import { detectCountry } from '@/lib/geo'
import { intlPriceForCountry } from '@/lib/international-pricing'
import { CONFIG } from '@/lib/config'
import CcmInternationalContent from '@/components/ccm/CcmInternationalContent'
import { CCM_INTL_FAQS } from '@/components/ccm/ccm-intl-faqs'
import CourseShowcase from '@/components/ccm/CourseShowcase'
import { InternationalCourseSchema } from '@/components/international/InternationalCourseSchema'

/**
 * /cata — the CATA Approved Provider landing for Certified Athletic
 * Therapists. SELLS CCM (owner 2026-08-15, verified in module data: ATs run
 * sideline SCAT and acute assessment — CCM Modules 2–3 are the assessment
 * stream; CRM is EP-built and routes AROUND assessment scope. "CCM FOR
 * CANADIAN AT'S"). Same mapping as UK physios on /uk.
 *
 * Thin shell over CcmInternationalContent — the component /uk and the intl
 * tabs render — with AT audience copy, the CATA band replacing the OA band,
 * and heroFlow (title → training photo → price card; owner-ordered). The
 * checkout is the live geo-priced `international-online` (grants CCM online).
 */

const BADGE_PATH = '/logos/cata-approved-provider-2025-2027-en.png'

export default async function CataLandingPage() {
  const price = intlPriceForCountry(detectCountry(await headers()))

  const cataApproved = CONFIG.FEATURES.CATA_APPROVED
  const term = CONFIG.FEATURES.CATA_TERM
  // Enhanced Approved-Provider rate: 0.4 CEUs per contact hour — derived,
  // never hardcoded (8 contact hours → 3.2 CEUs).
  const ceus = (CONFIG.COURSE.ONLINE_CPD_POINTS * 0.4).toFixed(1)
  const hasBadge = existsSync(join(process.cwd(), 'public', BADGE_PATH))

  const standardsBand = (
    <div className="max-w-3xl mx-auto mb-6 flex items-center justify-center gap-3 sm:gap-4 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/70 to-emerald-50/40 px-5 py-4">
      {cataApproved && hasBadge ? (
        <Image
          src={BADGE_PATH}
          alt={`CATA Approved Provider ${term}`}
          width={112}
          height={112}
          className="w-16 h-16 sm:w-20 sm:h-20 object-contain flex-shrink-0"
        />
      ) : (
        <ShieldCheck className="w-9 h-9 sm:w-10 sm:h-10 text-accent flex-shrink-0" strokeWidth={1.75} />
      )}
      <div className="text-left">
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-0.5">
          {cataApproved ? 'Approved Provider' : 'Independently reviewed'}
        </p>
        <p className="text-lg sm:text-xl font-bold text-foreground leading-tight">
          {cataApproved ? `CATA Approved Provider ${term}` : 'Endorsed CPD'}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {cataApproved
            ? `${ceus} CEUs for CATA members at the enhanced rate (0.4 × ${CONFIG.COURSE.ONLINE_CPD_POINTS} contact hours) · also endorsed by Osteopathy Australia`
            : `${CONFIG.COURSE.ONLINE_CPD_POINTS} hours of assessed online learning · endorsed by Osteopathy Australia`}
        </p>
      </div>
    </div>
  )

  const scopeNote = (
    <div className="max-w-3xl mx-auto mt-8 mb-8 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-5 py-4">
      <ShieldCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" strokeWidth={2} />
      <p className="text-[13.5px] text-amber-900 leading-relaxed">
        <strong>Within scope.</strong> The course covers concussion assessment and management on the
        skills athletic therapy already holds — sideline recognition, clinical assessment, graded
        return to play and reconditioning. Formal diagnosis and return-to-play clearance where red
        flags are present remain with the treating physician — the course teaches when and how to
        refer.
      </p>
    </div>
  )

  const pick = (q: string) => CCM_INTL_FAQS.filter((f) => f.q === q)
  const faqs = [
    {
      q: 'How many CATA CEUs does it carry?',
      a: cataApproved
        ? `Concussion Education Australia is a CATA Approved Provider (${term}). The online course is ${CONFIG.COURSE.ONLINE_CPD_POINTS} contact hours, carrying ${ceus} CEUs for CATA members at the enhanced Approved-Provider rate of 0.4 CEUs per contact hour. Your certificate states the contact hours for your CEU reporting. The course is also endorsed by Osteopathy Australia.`
        : `CATA Approved-Provider status is not currently held. Your certificate states ${CONFIG.COURSE.ONLINE_CPD_POINTS} hours of assessed learning.`,
    },
    {
      q: 'Is this within the athletic-therapy scope?',
      a: 'Yes — it is built around it. ATs already own sideline recognition, assessment and reconditioning; the course takes the same pathway to guideline standard: SCAT6/VOMS/BESS assessment, acute management, graded return to play and phenotype-based rehabilitation. Formal diagnosis and red-flag clearance stay with the treating physician, and the course teaches exactly when and how to refer.',
    },
    ...pick('Is there an ongoing cost?'),
    {
      q: 'What currency am I charged in?',
      a: `The price shown is the price charged — resolved from your region at checkout (Canadian buyers pay ${intlPriceForCountry('CA').display} CAD). Secure Stripe checkout, 7-day money-back guarantee.`,
    },
    ...pick('What’s the refund policy?'),
  ]

  return (
    <>
      <InternationalCourseSchema
        name={'Concussion Clinical Mastery — for Certified Athletic Therapists'}
        description={
          'An 8-module online course for athletic therapists covering the full concussion pathway: sideline recognition, SCAT6/VOMS/BESS assessment, acute management, phenotype-based rehabilitation including measured sub-symptom-threshold exercise, and graded return to play.'
        }
        country="CA"
        path="/cata"
        roles={['Athletic Therapist', 'Certified Athletic Therapist']}
      />
      <CcmInternationalContent
        price={{ display: price.display, code: price.code }}
        audience={{
          badgeText: 'Canada · For Certified Athletic Therapists — CAT(C)',
          heroBlurb:
            'You make the sideline call, run the assessment and deliver the reconditioning — this is the course that takes the whole pathway to guideline standard, with the working clinical tools to start Monday. Diagnosis and clearance for red flags stay with the physician; you own the rest.',
          endorseTile: cataApproved
            ? { big: ceus, small: ' CEUs', label: 'CATA enhanced rate' }
            : undefined,
          standardsBand,
          heroFlow: true,
          heroMedia: <CourseShowcase />,
          cardChip: 'Canada',
          cardCpdChip: cataApproved ? `${ceus} CATA CEUs` : '8 CPD hrs',
          cardTitle: 'CCM — Canada',
          moduleBullet: cataApproved
            ? `8 clinical modules · ${CONFIG.COURSE.ONLINE_CPD_POINTS} contact hours · ${ceus} CATA CEUs`
            : `8 clinical modules · ${CONFIG.COURSE.ONLINE_CPD_POINTS} contact hours`,
          trustChip: cataApproved ? 'CATA Approved Provider' : 'OA-Endorsed',
          scopeNote,
          faqs,
          certFooterLine: cataApproved
            ? `CATA Approved Provider ${term} · ${ceus} CEUs at the enhanced rate · also endorsed by Osteopathy Australia`
            : undefined,
          stickyCpdLabel: cataApproved ? `${ceus} CATA CEUs` : '8 CPD',
        }}
      />
    </>
  )
}
