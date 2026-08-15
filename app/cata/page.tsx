import { existsSync } from 'fs'
import { join } from 'path'
import Image from 'next/image'
import { headers } from 'next/headers'
import { ShieldCheck } from 'lucide-react'
import { detectCountry } from '@/lib/geo'
import { intlPriceForCountry } from '@/lib/international-pricing'
import { CONFIG } from '@/lib/config'
import CrmInternationalContent from '@/components/crm/CrmInternationalContent'
import { buildIntlFaqs } from '@/components/crm/intl-faqs'
import { InternationalCourseSchema } from '@/components/international/InternationalCourseSchema'

/**
 * /cata — the CATA Approved Provider landing for Certified Athletic
 * Therapists (see layout.tsx for the approval record and honesty gates).
 *
 * IT IS THE SAME PAGE AS CRM (owner, verbatim): a thin shell over
 * CrmInternationalContent — the international CRM landing /uk and
 * /pricing-international already render — with only the audience copy
 * swapped for ATs and the standards/CE blocks replaced by CATA's. The
 * design, sections and live geo-priced checkout are the shared component's.
 *
 * AT framing: never remedial and never scope-expansion — ATs already own
 * the acute sideline call AND the rehab room; the consensus moved the
 * recovery phase onto skills they already hold.
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

  // The CATA band replaces the shared component's ACSM/ESSA standards banner —
  // same visual design, this body's facts. Badge artwork renders only when the
  // supplied PNG exists on disk (badge rules: official artwork, unaltered).
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
          {cataApproved ? `CATA Approved Provider ${term}` : 'Built to ESSA CPD standards'}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {cataApproved
            ? `${ceus} CEUs for CATA members at the enhanced rate — 0.4 CEUs per contact hour × ${CONFIG.COURSE.ONLINE_CPD_POINTS} contact hours`
            : `${CONFIG.COURSE.ONLINE_CPD_POINTS} hours of assessed online learning`}
        </p>
      </div>
    </div>
  )

  const ceStatusNote = (
    <div className="max-w-3xl mx-auto mb-8 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-5 py-4">
      <ShieldCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" strokeWidth={2} />
      <p className="text-[13.5px] text-amber-900 leading-relaxed">
        <strong>Continuing-education status:</strong>{' '}
        {cataApproved ? (
          <>
            Concussion Education Australia is a <strong>CATA Approved Provider ({term})</strong> —
            the online course carries {ceus} CEUs for CATA members at the enhanced
            Approved-Provider rate of 0.4 CEUs per contact hour.
          </>
        ) : (
          <>CATA Approved-Provider status is not currently held — no CATA CEUs are offered.</>
        )}{' '}
        The course is also accredited by Exercise &amp; Sports Science Australia (ESSA), carrying{' '}
        {CONFIG.COURSE.ONLINE_CPD_POINTS} ESSA CPD points online, following independent review by
        two ESSA-appointed reviewers. We don&rsquo;t claim accreditation we don&rsquo;t hold —
        this page updates the day anything changes.
      </p>
    </div>
  )

  // Platform-cost / refund / course-or-platform answers come from the shared
  // FAQ builder so the copy tracks CONFIG (the platform monthly rate must never
  // fork from what the card is charged). Only the audience-specific Qs are new.
  const sharedFaqs = buildIntlFaqs(CONFIG.FEATURES.ESSA_ACCREDITED)
  const pick = (q: string) => sharedFaqs.filter((f) => f.q === q)
  const faqs = [
    {
      q: 'How many CATA CEUs does it carry?',
      a: cataApproved
        ? `Concussion Education Australia is a CATA Approved Provider (${term}). The online course is ${CONFIG.COURSE.ONLINE_CPD_POINTS} contact hours, carrying ${ceus} CEUs for CATA members at the enhanced Approved-Provider rate of 0.4 CEUs per contact hour. Your certificate states the contact hours for your CEU reporting.`
        : `CATA Approved-Provider status is not currently held. Your certificate states ${CONFIG.COURSE.ONLINE_CPD_POINTS} hours of assessed learning.`,
    },
    {
      q: 'Is concussion rehab within the athletic-therapy scope?',
      a: 'Yes. Athletic therapists already own recognition, removal and reconditioning. What the consensus added is the middle: recovery is now a measured, graded exercise programme — assessment, prescription and progression, on the field-side and clinic skills you already hold. You implement and progress the rehabilitation; you do not diagnose or grant medical clearance.',
    },
    ...pick('Is this a course or a platform?'),
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
        name={'Concussion Rehab Mastery — for Certified Athletic Therapists'}
        description={
          'An 8-module online course teaching athletic therapists to deliver measured heart-rate-threshold concussion rehabilitation: graded exercise testing, sub-symptom-threshold prescription, phenotype-specific rehab and graded return to play.'
        }
        country="CA"
        path="/cata"
        roles={['Athletic Therapist', 'Certified Athletic Therapist']}
      />
      <CrmInternationalContent
        price={{ display: price.display, code: price.code }}
        live
        audience={{
          badgeText: 'Canada · For Certified Athletic Therapists — CAT(C)',
          heroTitle: (
            <>
              You make the sideline call.
              <br className="hidden sm:block" /> The consensus put{' '}
              <span className="text-gradient">the recovery</span> on your bench too.
            </>
          ),
          heroBlurb:
            'Concussion Rehab Mastery completes the loop — from the removal decision you already own to measured, heart-rate-threshold rehabilitation and a defensible return to play — with the working clinical tools to deliver it.',
          strapText: cataApproved
            ? `A new, referral-worthy service line — physicians, physios and teams need someone to deliver measured exercise rehab. ${ceus} CATA CEUs at the enhanced Approved-Provider rate, self-paced, delivered entirely from wherever you practise.`
            : `A new, referral-worthy service line — physicians, physios and teams need someone to deliver measured exercise rehab. ${CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hours online, self-paced, delivered entirely from wherever you practise.`,
          cpdTile: cataApproved
            ? { big: ceus, small: ' CEUs', label: 'CATA enhanced rate' }
            : undefined,
          cardChip: 'Canada',
          cardCpdChip: cataApproved ? `${ceus} CATA CEUs` : '8 CPD hrs',
          cardTitle: 'CRM — Canada',
          cardSubtitle: 'The concussion-rehab course + the clinical platform — certify entirely online',
          moduleBullet: cataApproved
            ? `8 online modules · ${CONFIG.COURSE.ONLINE_CPD_POINTS} contact hours · ${ceus} CATA CEUs`
            : `8 online modules · ${CONFIG.COURSE.ONLINE_CPD_POINTS} contact hours`,
          valueIntroBlurb:
            'You don’t just learn the protocol — you leave with the instruments to run it. Every enrolment includes the working clinical platform: the Sub-Symptom-Threshold (SST) Trainer app, the BCTT calculator (heart-rate threshold → prescription) and the full Clinical Toolkit — measured exercise rehabilitation on the assessment and reconditioning skills athletic therapy already owns.',
          scopeStrip: 'Within the athletic-therapy scope of practice',
          standardsBand,
          ceStatusNote,
          showAcsmQuote: false,
          certFooterLine: cataApproved
            ? `CATA Approved Provider ${term} · ${ceus} CEUs at the enhanced rate · also ESSA-accredited (Australia)`
            : undefined,
          enrolBlurb: 'The concussion-rehab course + the working clinical platform, delivered wholly online.',
          faqs,
          leadCapture: {
            location: 'cata-hero',
            kicker: 'Free for Athletic Therapists',
            heading: 'The AT’s Concussion Rehab Starter',
            blurb:
              'The measured-threshold rehabilitation workflow — graded test → heart-rate threshold → sub-symptom-threshold dose → return to play — mapped to the athletic therapist’s scope. Emailed to you, free.',
            heroBlurb:
              'The AT’s Concussion Rehab Starter — the measured-threshold rehabilitation workflow + scope guide, emailed to you.',
            footnote:
              'One email with the resource, then the occasional update relevant to athletic therapists. No spam. Unsubscribe in one click, anytime.',
            emailPlaceholder: 'you@clinic.ca',
          },
          stickyCpdLabel: cataApproved ? `${ceus} CATA CEUs` : '8 CPD',
        }}
      />
    </>
  )
}
