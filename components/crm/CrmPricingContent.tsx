'use client'

import { useState, useEffect } from 'react'
import { CONFIG } from '@/lib/config'
import Image from 'next/image'
import {
  Check,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Building2,
  ShieldCheck,
  BookOpen,
  Award,
  Activity,
  ClipboardList,
  LineChart,
  HeartPulse,
} from 'lucide-react'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import CrmWorkshopInterest from '@/components/CrmWorkshopInterest'
import EpLeadCapture from '@/components/crm/EpLeadCapture'
import CrmCheckoutButton from '@/components/crm/CrmCheckoutButton'
import { PaymentMethodsStrip } from '@/components/PaymentMethodsStrip'
import { SstWatchVisual, BaselineLaptopVisual, InstrumentKeyframes } from '@/components/clinical/InstrumentVisuals'
import { createFAQSchema } from '@/lib/schema-markup'

// ─────────────────────────────────────────────────────────────────────────────
// Concussion Rehab Mastery — pricing/landing content.
//
// This is a direct structural copy of app/pricing/page.tsx (the CCM pricing
// page) adapted for the EP-scoped course: same hero → stat bento → trust block
// → workshop photo → two-tier pricing cards → compare table → testimonials →
// instructor → FAQ. Differences from CCM:
//   • Stripe checkout LIVE since ESSA approval 2026-07-24 (CrmCheckoutButton);
//     EpLeadCapture remains the not-ready-to-buy path.
//   • Two tiers (Online $497 / Complete $1,400) — the practical day is the SAME
//     shared workshop every clinician attends; CRM online is the only EP-only
//     difference.
//   • ESSA framing (accreditation pending) instead of the OA endorsement.
//   • "Rehab" gets the gradient to mark it a new stream.
// Rendered behind the gate by the server page (noindex, admin/demo only).
// ─────────────────────────────────────────────────────────────────────────────

// Interest mailto — CrmCheckoutButton's fallback if checkout can't start.
const INTEREST_HREF =
  'mailto:zac@concussion-education-australia.com?subject=Concussion%20Rehab%20Mastery%20%E2%80%94%20Register%20my%20interest&body=Hi%20Zac%2C%20I%27d%20like%20to%20register%20my%20interest%20in%20Concussion%20Rehab%20Mastery.%0A%0AName%3A%0AProfession%20(AEP%20%2F%20AES)%3A%0AESSA%20number%20(optional)%3A%0APreferred%20option%20(Online%20%2F%20Complete)%3A%0A'

interface FaqItem {
  q: string
  a: string
}

const buildFaqs = (accredited: boolean): FaqItem[] => [
  {
    q: 'Is it ESSA accredited?',
    a: accredited
      ? 'Yes — the course is ESSA-accredited. The online modules carry 8 ESSA CPD points, and the complete package (with the practical day) totals 16 CPD hours.'
      : 'ESSA CPD accreditation is pending — the course is in application and has been designed to ESSA CPD standards. We don’t claim accreditation we don’t yet hold; this page updates the moment it’s confirmed.',
  },
  {
    q: 'How many CPD points is it worth?',
    a: accredited
      ? 'The online modules are 8 CPD hours, mapped to 8 ESSA CPD points. The complete package adds the full-day practical for 16 CPD hours total — most of a member’s annual Further-Education requirement in one course.'
      : 'The online modules are 8 CPD hours and the complete package totals 16 CPD hours. ESSA CPD-point mapping is pending accreditation — we’ll confirm the point value here once it’s granted.',
  },
  {
    q: 'Do I get the clinical tools, or just the lessons?',
    a: 'Both. Enrolment includes the working instruments you deliver concussion rehab with — the live Baseline & Serial Testing tool, the BCTT calculator with HRt → prescription, the full Clinical Toolkit (SSTAE templates, phenotype library) and the NDIS / WorkCover / GP document pack. You get the knowledge and the instruments to apply it from day one.',
  },
  {
    q: 'Do I need the in-person practical day?',
    a: 'The online course is complete and standalone — you finish at your own pace and sit the assessment entirely online. The complete package adds the same full-day practical workshop every clinician takes (supervised SCAT6, VOMS, BESS and cervicogenic assessment), in the same room as osteopaths, physiotherapists and GPs, with an OSCE competency check. There’s no fixed EP date yet — register your interest and we’ll place you in the next workshop in your region.',
  },
  {
    q: 'Is concussion rehab within my scope?',
    a: 'Yes. AEPs implement graded exertion and exercise prescription — exactly what evidence-based concussion rehab now requires. You implement and progress the rehabilitation; you do not diagnose or grant clearance. The course is built specifically around that scope of practice.',
  },
  {
    q: 'Can my employer pay for this?',
    a: 'Yes — most practices and employers cover CPD training costs. You receive a tax invoice and CPD certificate on completion that your employer can use for reimbursement. Many practitioners pay nothing out of pocket.',
  },
]

export default function CrmPricingContent({ hideNav }: { hideNav?: boolean }) {
  // ESSA accreditation is a FEATURE FLAG (currently false). Every ESSA claim on
  // this page branches on it so the copy reads correctly in BOTH states:
  //   flag FALSE → "built to ESSA CPD standards (accreditation pending)"
  //   flag TRUE  → "ESSA-accredited · 8 ESSA CPD points"
  // Never say "accredited" while the flag is false. Flip CONFIG.FEATURES
  // .ESSA_ACCREDITED to true on real approval and this page updates itself.
  const accredited = CONFIG.FEATURES.ESSA_ACCREDITED
  const essaLabel = accredited
    ? 'ESSA-accredited'
    : 'built to ESSA CPD standards (accreditation pending)'
  const essaBadgeLine = accredited
    ? 'ESSA-accredited · 8 ESSA CPD points'
    : 'Designed to ESSA CPD standards · accreditation pending'
  const essaTrustChip = accredited ? 'ESSA-Accredited' : 'Designed to ESSA Standards'

  const FAQS = buildFaqs(accredited)

  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set())
  const toggleFaq = (i: number) => {
    setOpenFaqs((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  // Sticky mobile CTA — show after scrolling past the pricing cards.
  const [showStickyCta, setShowStickyCta] = useState(false)
  useEffect(() => {
    const target = document.getElementById('pricing-cards')
    if (!target) return
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyCta(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* FAQPage schema, mirroring the VISIBLE accordion below 1:1 (Google
          requires exact parity, and the answers are already flag-aware so the
          schema can never claim an accreditation the page doesn't).
          Research-driven: Q&A/answer-first is the format LLM retrievers cite
          most, and this — the ESSA stream's own sales page — had none. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            createFAQSchema(FAQS.map((f) => ({ question: f.q, answer: f.a }))),
          ),
        }}
      />
      {!hideNav && <SiteNav />}

      {/* When embedded (hideNav — e.g. under the homepage stream tabs) the page
          nav + tabs already provide the top offset, so drop the fixed-nav pad. */}
      <div className={`max-w-6xl mx-auto px-6 pb-12 md:pb-20 ${hideNav ? 'pt-6' : 'pt-[120px]'}`}>

        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="badge mb-5 inline-flex">
            <Award className="w-3.5 h-3.5 mr-1.5" />
            For Accredited Exercise Physiologists &amp; Exercise Scientists
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Concussion rehab is <span className="text-gradient">exercise medicine</span>.
            <br className="hidden sm:block" /> Which makes it yours.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sub-symptom-threshold aerobic exercise is now the first-line, guideline-endorsed
            treatment for concussion — a graded aerobic prescription, squarely in the EP scope.
            This is the course that makes you the clinician who delivers it, with the working
            tools to start Monday.
          </p>

          {/* Skill chips — the EP's actual clinical capabilities, scannable */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-3xl mx-auto mt-4">
            {[
              'BCTT & HRt',
              'Sub-threshold Rx',
              'Graded return-to-activity',
              'Phenotype reconditioning',
              'Symptom-titrated dosing',
              'Red-flag triage',
            ].map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/8 border border-accent/15 text-[11.5px] sm:text-xs font-semibold text-accent whitespace-nowrap"
              >
                <Check className="w-3 h-3 flex-shrink-0" strokeWidth={3} />
                {skill}
              </span>
            ))}
          </div>

          {/* Punch stat bento */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 max-w-4xl mx-auto mt-7">
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-white border-l-4 border-amber-500 p-3 sm:p-4 text-left">
              <p className="text-2xl sm:text-3xl font-bold text-amber-700 leading-none">16<span className="text-base font-semibold">hrs</span></p>
              <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-600 mt-1">CPD with day</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-teal-50 to-white border-l-4 border-teal-500 p-3 sm:p-4 text-left">
              <p className="text-2xl sm:text-3xl font-bold text-teal-700 leading-none">8</p>
              <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-600 mt-1">Online modules</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-rose-50 to-white border-l-4 border-rose-500 p-3 sm:p-4 text-left">
              <p className="text-2xl sm:text-3xl font-bold text-rose-700 leading-none">1<span className="text-base font-semibold">day</span></p>
              <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-600 mt-1">Hands-on practical</p>
            </div>
            {/* SST tile — the platform IS the differentiator; it was absent from
                the hero entirely (Zac 2026-07-27: "sst trainer is buried").
                Replaced the ∞/lifetime tile — lifetime access still appears in
                the pricing-card bullets. */}
            <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-white border-l-4 border-indigo-500 p-3 sm:p-4 text-left">
              <p className="text-2xl sm:text-3xl font-bold text-indigo-700 leading-none">SST</p>
              <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-600 mt-1">Trainer app incl.</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-white border-l-4 border-emerald-500 p-3 sm:p-4 text-left col-span-2 lg:col-span-1">
              <p className="text-2xl sm:text-3xl font-bold text-emerald-700 leading-none">7<span className="text-base font-semibold">day</span></p>
              <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-600 mt-1">Money-back</p>
            </div>
          </div>

          {/* Evidence strip — claim, proof, tool in one line ABOVE the ~50%
              scroll stall (2026-08-03: ESSA traffic read the first-line claim
              in the hero but the receipts sat at the bottom of the page). */}
          <div className="max-w-3xl mx-auto mt-5 rounded-xl border border-teal-200 bg-teal-50/50 px-4 py-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[12.5px]">
            <span className="font-semibold text-foreground">First-line treatment per the Amsterdam 2023 consensus</span>
            <a href="https://doi.org/10.5281/zenodo.21482634" target="_blank" rel="noopener noreferrer" className="font-semibold text-accent hover:underline">
              Published protocol — DOI 10.5281/zenodo.21482634
            </a>
            <span className="text-muted-foreground">Delivered &amp; documented by SST Trainer — included</span>
          </div>

          {/* One-line "why EPs" strap under the stats */}
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto mt-5">
            A new, referral-worthy service line — GPs, physios and clinics need someone to deliver
            measured exercise rehab. {accredited
              ? '8 CPD points is roughly half your annual ESSA Further-Education requirement, done online and self-paced.'
              : '8 CPD hours online, self-paced — ESSA CPD-point mapping pending accreditation.'}
          </p>

          {/* Primary hero CTA */}
          <div className="mt-5 flex justify-center">
            <a
              href="#pricing-cards"
              className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm"
            >
              See enrolment options
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Email capture — the not-ready-to-buy majority. Secondary to the
              enrol CTA above; the same magnet repeats near the page bottom. */}
          <EpLeadCapture variant="hero" location="hero" nextHref="#pricing-cards" nextLabel="See the course & pricing" />

          {/* Practical-day cities — surfaced at the TOP (owner 2026-07-27:
              "locations are buried… too much scroll"). Cities derive from
              CONFIG.LOCATIONS; no dates are named here, so the date-copy rule
              is satisfied while the geography is instantly visible. */}
          <p className="mt-4 text-[13px] text-muted-foreground">
            <span className="font-semibold text-foreground">Practical-day cities:</span>{' '}
            {Object.values(CONFIG.LOCATIONS).map((l) => l.city).join(' · ')} —{' '}
            <a href="#pricing-cards" className="font-semibold text-accent underline">nominate yours at enrolment</a>
          </p>
        </div>

        {/* Value intro + instruments — MOVED directly under the hero (2026-07-27,
            Zac: "sst trainer is buried. it is a huge part of their training").
            The platform is the practical-relevance proof, and clinician research
            says practical relevance is the #1 conversion driver — it cannot sit
            five screens down. */}
        {/* Value intro — the tools + training emphasis Zac wants front-and-centre */}
        <div className="text-center max-w-2xl mx-auto mb-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent mb-3">Built for you</p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 tracking-tight">
            Walk out and deliver it <span className="text-gradient">Monday</span>
          </h2>
          <p className="text-base text-muted-foreground">
            You don&rsquo;t just learn the protocol — you leave with the instruments to run it.
            Every enrolment includes the working clinical platform: the Preseason Baseline &amp;
            Serial Testing tool, the Sub-Symptom-Threshold (SST) Trainer app, the BCTT calculator
            (heart-rate threshold &rarr; prescription) and the full Clinical Toolkit with the
            NDIS / WorkCover / GP document pack — all built around the exercise-physiology scope
            of practice.
          </p>
        </div>

        {/* ── SST + Baseline instrument visuals — the platform proof. Hidden when
            embedded (hideNav): the homepage renders its own instruments section
            below the stream tabs, so it must not repeat here. ── */}
        {!hideNav && (
          <div className="max-w-4xl mx-auto mt-8 mb-2">
            <InstrumentKeyframes />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="flex flex-col overflow-hidden rounded-2xl bg-[#16243f] shadow-[0_18px_40px_-18px_rgba(22,36,63,0.55)]">
                <SstWatchVisual />
                <div className="p-5">
                  <h3 className="m-0 text-lg font-extrabold tracking-tight text-white">SST Trainer</h3>
                  <p className="m-0 mt-1 text-[13px] leading-relaxed text-slate-300/90">
                    A graded test measures each patient&rsquo;s symptom threshold; they train just
                    under it — live heart rate, verified progression, every session on your dashboard.
                  </p>
                  <Link href="/sst-trainer" className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-bold text-teal-300 hover:text-teal-200">
                    See the patient app <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
              <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_-24px_rgba(100,116,139,0.45)]">
                <BaselineLaptopVisual />
                <div className="p-5">
                  <h3 className="m-0 text-lg font-extrabold tracking-tight text-[#16243f]">Pre-Season Baseline Testing</h3>
                  <p className="m-0 mt-1 text-[13px] leading-relaxed text-slate-500">
                    One link per club: athletes self-complete the SCAT6 baseline in ~5 minutes and a
                    PDF report lands in your inbox — on file for the day it matters.
                  </p>
                  <Link href="/preseason" className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-bold text-[#b45309] hover:text-[#92400e]">
                    See how clubs use it <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ESSA standards block — the EP trust signal. Hidden when embedded
            (hideNav) — the homepage renders the ESSA endorsement under the stream
            tab, so it must not repeat here. */}
        {!hideNav && (
        <div className="max-w-3xl mx-auto mb-6 flex items-center justify-center gap-3 sm:gap-4 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/70 to-emerald-50/40 px-5 py-4">
          <ShieldCheck className="w-9 h-9 sm:w-10 sm:h-10 text-accent flex-shrink-0" strokeWidth={1.75} />
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-0.5">
              {accredited ? 'Accredited' : 'Designed to'}
            </p>
            <p className="text-lg sm:text-xl font-bold text-foreground leading-tight">
              {accredited ? 'ESSA CPD accredited' : 'ESSA CPD standards'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {accredited
                ? `8 ESSA CPD points online · 16 with the practical day · Accreditation No. ${CONFIG.ESSA_ACCREDITATION.NUMBER}`
                : 'Accreditation pending · ESSA Code & NASRHP aligned · up to 16 CPD hours'}
            </p>
            {accredited && (
              // ESSA's MANDATED statement, verbatim per the accreditation
              // letter — the wording is theirs, not ours to paraphrase.
              <p className="text-[11px] text-muted-foreground/80 mt-1.5 italic leading-snug">
                &ldquo;{CONFIG.ESSA_ACCREDITATION.statement(CONFIG.ESSA_ACCREDITATION.ONLINE_POINTS)}&rdquo; (Online)
              </p>
            )}
          </div>
        </div>
        )}

        {/* Live workshop training photo — visual proof of the in-person day */}
        <div className="max-w-4xl mx-auto mb-6 rounded-2xl overflow-hidden relative shadow-lg">
          <Image
            src="/workshop-training.jpg"
            alt="Zac Lewis training a team of clinicians — hands-on concussion examination practice"
            width={1200}
            height={675}
            className="w-full h-[220px] sm:h-[280px] md:h-[340px] object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-white">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] font-bold text-amber-300 mb-1">The practical day</p>
            <h3 className="text-base sm:text-xl font-bold leading-tight">
              Assess &rarr; prescribe, supervised &mdash; the same full-day workshop every clinician takes.
            </h3>
            <p className="text-[12.5px] sm:text-sm text-white/85 mt-1 leading-snug max-w-2xl">
              SCAT6, VOMS, BESS and cervicogenic assessment on real subjects with expert feedback, then turning each screen into an in-scope exercise prescription. OSCE-assessed competency.
            </p>
          </div>
        </div>

        {/* Employer-reimbursement callout */}
        <div className="max-w-3xl mx-auto mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
          <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Most practitioners pay $0 out of pocket</p>
            <p className="text-xs text-muted-foreground mt-1">Your employer or practice likely covers CPD training costs. Tax invoice + CPD certificate emailed on completion.</p>
          </div>
        </div>

        {/* Pricing Cards — two tiers, copied from the CCM bento card design */}
        <div id="pricing-cards" className="mt-6">
          <div className="grid md:grid-cols-2 gap-5 pt-2 max-w-4xl mx-auto items-stretch">

            {/* ── Online tier ───────────────────────────────────────────── */}
            <div
              className="card card-visible rounded-2xl p-5 md:p-6 flex flex-col relative"
              style={{ borderWidth: '1.5px', borderColor: 'rgba(13, 115, 119, 0.15)' }}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-50 flex items-center justify-center border border-teal-200/50 flex-shrink-0">
                    <BookOpen className="w-4.5 h-4.5 text-[var(--accent)]" strokeWidth={2} />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-50 text-[var(--accent)] border border-teal-200">
                    Online tier
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="text-2xl font-bold text-[var(--foreground)] tracking-tight">${CONFIG.COURSE.PRICE_ONLINE}</span>
                    <span className="text-[11px] text-[var(--muted-foreground)]">AUD</span>
                  </div>
                  <p className="text-[10px] text-[var(--muted-foreground)]">one-time</p>
                </div>
              </div>

              <h3 className="text-xl font-bold text-[var(--foreground)] mb-0.5">CRM Online</h3>
              <p className="text-[12px] text-slate-500 mb-2 font-medium">The EP-scoped course — certify entirely online</p>
              <p className="text-[13px] text-[var(--muted-foreground)] leading-relaxed mb-4">
                8 modules at your own pace, plus the working clinical tools to open a new
                referral-worthy service line. Add the hands-on practical day anytime to upgrade.
              </p>

              <ul className="grid grid-cols-1 gap-x-3 gap-y-1.5 mb-5">
                {[
                  '8 EP-scoped modules · 8 CPD hours',
                  'SST Trainer app — your patients train to their prescribed HR band',
                  'Live Baseline & Serial Testing tool',
                  'BCTT calculator + full Clinical Toolkit',
                  'NDIS / WorkCover / GP document pack',
                  'Certificate on 80% pass · lifetime access',
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[12.5px]">
                    <Check className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span className="text-[var(--muted-foreground)]">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <CrmCheckoutButton
                  tier="online"
                  accredited={accredited}
                  interestHref={INTEREST_HREF}
                  label={accredited ? 'Enrol — CRM Online' : 'Register for online'}
                  className="w-full py-3 px-5 rounded-xl border border-slate-300 bg-white text-foreground font-semibold text-sm hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-2"
                />
                <PaymentMethodsStrip price={CONFIG.COURSE.PRICE_ONLINE} />
              </div>
            </div>

            {/* ── Complete tier — recommended ──────────────────────────── */}
            <div className="card card-visible rounded-2xl p-5 md:p-6 flex flex-col relative" style={{ borderWidth: '2px', borderColor: 'rgba(13, 115, 119, 0.35)' }}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center border border-orange-200/50 flex-shrink-0">
                    <Award className="w-4.5 h-4.5 text-orange-500" strokeWidth={2} />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-50 text-[var(--accent)] border border-teal-200">
                    Recommended
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                    16 CPD
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-baseline gap-1 justify-end">
                    {/* "from": the charge is workshopPriceFor(city) — $1,190 early-bird,
                        full price only in the final window before a scheduled date. */}
                    <span className="text-[11px] text-[var(--muted-foreground)]">from</span>
                    <span className="text-2xl font-bold text-[var(--foreground)] tracking-tight">${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()}</span>
                    <span className="text-[11px] text-[var(--muted-foreground)]">AUD</span>
                  </div>
                  <p className="text-[10px] text-[var(--muted-foreground)]">one-time</p>
                </div>
              </div>

              <h3 className="text-xl font-bold text-[var(--foreground)] mb-0.5">CRM Complete</h3>
              <p className="text-[12px] text-slate-500 mb-2 font-medium">Online modules + the full-day hands-on practical</p>
              <p className="text-[13px] text-[var(--muted-foreground)] leading-relaxed mb-4">
                Everything in Online — the course and all the tools — plus a supervised practical day. 16 CPD hours{accredited ? ' covers most of your annual ESSA requirement.' : ' in total (ESSA accreditation pending).'}
              </p>

              <ul className="grid grid-cols-1 gap-x-3 gap-y-1.5 mb-5">
                {[
                  'Everything in Online — course + all tools',
                  'Full-day hands-on practical workshop',
                  'Train alongside osteo / physio / GP — the team handover',
                  'Supervised SCAT6 / VOMS / BESS / cervical',
                  'Expert real-time feedback as you go',
                  'OSCE-assessed hands-on competency',
                  '16 CPD hours total',
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[12.5px]">
                    <Check className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span className={`text-[var(--foreground)] ${i === 0 ? 'font-semibold' : ''}`}>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <p className="text-[10px] text-[var(--muted-foreground)] mb-2">
                  ${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()} early-bird — standard ${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()} applies only in the final {CONFIG.WORKSHOP.EARLY_BIRD_DAYS_BEFORE} days before a confirmed workshop date.
                </p>
                <CrmCheckoutButton
                  tier="complete"
                  accredited={accredited}
                  interestHref={INTEREST_HREF}
                  label={accredited ? 'Enrol — CRM Complete' : 'Register for the complete package'}
                  className="btn-primary w-full py-3 px-5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm"
                />
                <PaymentMethodsStrip price={CONFIG.COURSE.PRICE_EARLY_BIRD} />
              </div>
            </div>
          </div>

          {/* Upgrade path — an existing online buyer adds the SHARED practical
              day. Interest-capture until ESSA; a live upgrade checkout after. */}
          <div className="mt-5 text-center">
            <div className="inline-block">
              <p className="text-[12.5px] text-[var(--muted-foreground)] mb-2">
                Already enrolled in CRM Online? Add the shared practical day.
              </p>
              <CrmCheckoutButton
                tier="upgrade"
                accredited={accredited}
                interestHref={INTEREST_HREF}
                label={accredited ? 'Add the practical day' : 'Register interest in the practical day'}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl border border-slate-300 bg-white text-foreground font-semibold text-[13px] hover:bg-slate-50 transition-colors"
              />
            </div>
          </div>

          {/* Quick signup — directly under the payment cards (owner
              2026-07-27): the not-ready-to-decide majority gets a one-field
              path that keeps them, instead of scrolling away. */}
          <div className="mt-6">
            <EpLeadCapture variant="hero" location="under-pricing" nextHref="#pricing-cards" nextLabel="Back to the enrolment options" />
          </div>

          {/* Trust Signals */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-[var(--muted-foreground)]">
            {['7-Day Guarantee', 'Lifetime Access', 'Clinical Tools Included', 'Certificate Included', essaTrustChip].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[var(--accent)]" strokeWidth={2.5} />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Compare Plans */}
        <div className="mt-10 max-w-3xl mx-auto">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 text-center">Compare options</p>
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="min-w-[600px] w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Feature</th>
                    <th className="text-center py-3 px-4 font-semibold text-[#5b9aa6] bg-[rgba(13,115,119,0.04)]">Online</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Complete</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    ['8 EP-scoped online modules', true, true],
                    ['SST Trainer app (patient HR-threshold training)', true, true],
                    ['Live Baseline & Serial Testing tool', true, true],
                    ['BCTT calculator + Clinical Toolkit', true, true],
                    ['NDIS / WorkCover / GP document pack', true, true],
                    ['CPD certificate (online)', '8 pts', '8 pts'],
                    ['Lifetime access', true, true],
                    ['Full-day hands-on practical', false, true],
                    ['Supervised SCAT6 / VOMS / BESS / cervical', false, true],
                    ['Expert 1:1 feedback', false, true],
                    ['OSCE competency assessment', false, true],
                    ['Total CPD hours', '8', '16'],
                  ] as [string, boolean | string, boolean | string][]).map(([feature, online, complete], i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="py-3 px-4 text-slate-700">{feature}</td>
                      <td className={`py-3 px-4 text-center font-medium ${i % 2 === 0 ? 'bg-[rgba(13,115,119,0.03)]' : 'bg-[rgba(13,115,119,0.06)]'}`}>
                        {online === true ? '✓' : online === false ? '—' : online}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {complete === true ? '✓' : complete === false ? '—' : complete}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Tools included — the real differentiator: EPs get the working instruments, not just lessons */}
        <div className="max-w-4xl mx-auto mt-10 mb-2">
          <div className="text-center mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent mb-2">Included with every enrolment</p>
            <h3 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">The clinical platform, not just the lessons</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
              You leave with the working tools CEA&rsquo;s clinics run on — ready to use with patients from day one.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: LineChart, title: 'Preseason Baseline & Serial Testing', desc: 'Capture the patient’s healthy baseline (symptoms, cognition, oculomotor), then auto-build the serial-comparison report — recovery measured against their own normal, not a generic zero.' },
              { icon: HeartPulse, title: 'Sub-Symptom-Threshold (SST) Trainer', desc: 'The patient app: threshold test → in-band heart-rate training on the wearable they already own → guided progression. Clinician-set and overseen by you.' },
              { icon: Activity, title: 'BCTT Calculator → Prescription', desc: 'Enter the Buffalo test stages; get the heart-rate threshold (HRt) and the 80–90% training band with the plain-language prescription.' },
              { icon: ClipboardList, title: 'Clinical Toolkit + Document Pack', desc: 'SSTAE templates, the phenotype library, and NDIS / WorkCover / GP report templates — the paperwork done.' },
            ].map((tool) => (
              <div key={tool.title} className="glass rounded-2xl p-5 flex gap-4">
                <div className="icon-container w-11 h-11 flex-shrink-0">
                  <tool.icon className="w-5 h-5 text-accent" strokeWidth={1.75} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-1">{tool.title}</h4>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{tool.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Microcopy strip */}
        <div className="max-w-3xl mx-auto mt-4 mb-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-600" /> Working clinical tools, not static PDFs
          </span>
          <span className="hidden sm:inline text-slate-300">·</span>
          <span className="inline-flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-blue-600" /> Built to the EP scope of practice
          </span>
          <span className="hidden sm:inline text-slate-300">·</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600" /> 7-day money-back guarantee
          </span>
        </div>

        {/* Practical-day interest capture */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="glass rounded-2xl p-6 md:p-8">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">Train with the whole care team</h3>
              <p className="text-sm text-muted-foreground">
                The hands-on day is the same multidisciplinary workshop osteopaths, physiotherapists and GPs
                attend — and that&rsquo;s the advantage. You practise the assessments alongside the very
                disciplines you refer to and receive from, learn exactly where the EP&rsquo;s lane starts and
                stops, and build the referral relationships that make concussion care actually work — leaving
                with a feel for how the whole team manages a case, not just your part of it. There&rsquo;s no
                fixed EP date yet; register your interest and we&rsquo;ll place you in the next workshop in your region.
              </p>
            </div>
            <CrmWorkshopInterest />
          </div>
        </div>

        {/* Meet Your Instructor */}
        <div className="max-w-3xl mx-auto mb-8">
          <h3 className="text-xl font-bold text-center text-foreground mb-6">Who built it</h3>
          <div className="glass rounded-xl p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Image
              src="/zac-lewis-headshot.jpg"
              alt="Zac Lewis — Osteopath, Concussion Researcher"
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover flex-shrink-0 border-2 border-accent/20"
            />
            <div>
              <h4 className="text-lg font-bold text-foreground mb-0.5">Zac Lewis</h4>
              <p className="text-sm text-accent font-medium mb-1">Registered Osteopath · Founder</p>
              <p className="text-xs text-muted-foreground mb-3">B.Clin.Sci, M.Ost.Med</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Concussion rehab is, by its nature, an exercise-physiology problem — a functional,
                energy-starved, autonomically-dysregulated injury that responds to precisely-dosed exertion.
                Zac has over a decade of clinical experience in neurological health and concussion management,
                including work with national and professional ice hockey across New Zealand and Canada, and is
                a co-author of concussion research currently under external review (Lewis &amp; Baker). The course is grounded in the
                Leddy / Buffalo evidence base and the Amsterdam 2023 consensus, translated specifically for the
                exercise-physiology scope of practice.
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <span className="text-[11px] font-medium text-muted-foreground">Member, Sports Medicine Australia</span>
                <Image src="/sma-member-2026.png" alt="Sports Medicine Australia — Member 2026" width={225} height={99} className="h-8 w-auto opacity-90" />
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div id="faq" className="max-w-2xl mx-auto mt-16 md:mt-20">
          <h2 className="text-2xl font-bold text-center mb-8 text-foreground">Common Questions</h2>
          <div className="space-y-3">
            {FAQS.map((item, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left gap-3"
                  aria-expanded={openFaqs.has(i)}
                >
                  <span className="font-semibold text-sm text-foreground">{item.q}</span>
                  {openFaqs.has(i) ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {openFaqs.has(i) && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* The page's LAST and largest CTA. While ESSA was pending, a mailto
              asking the reader to hand-type name / profession / ESSA number was
              the only thing on offer. ESSA is accredited now
              (CONFIG.FEATURES.ESSA_ACCREDITED) and checkout is live, so leaving
              it as a mailto sent a decided buyer into their mail client at the
              bottom of the page instead of to the enrolment options — and did
              it with a "register your interest" label, which understates what
              they can actually do. Falls back to the mailto automatically if
              accreditation ever lapses, matching CrmCheckoutButton. */}
          <div className="text-center mt-10">
            <a
              href={accredited ? '#pricing-cards' : INTEREST_HREF}
              className="btn-primary px-10 py-4 rounded-xl text-base font-bold inline-flex items-center gap-2"
            >
              {accredited ? 'See enrolment options' : 'Register your interest'}
              <ArrowRight className="w-5 h-5" />
            </a>
            <p className="text-xs text-muted-foreground mt-4">
              {accredited
                ? 'ESSA-accredited · 8 ESSA CPD points online · up to 16 CPD hours'
                : 'ESSA CPD accreditation pending · designed to ESSA CPD standards'}
            </p>
          </div>
        </div>

        {/* Bottom email capture — one more chance to keep the not-ready-to-buy
            majority (this is the ESSA-newsletter cohort's primary conversion). */}
        <div className="max-w-2xl mx-auto mt-16">
          <EpLeadCapture variant="full" location="footer" nextHref="#pricing-cards" nextLabel="See the course & pricing" />
        </div>

      </div>

      {/* Sticky mobile CTA */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
          showStickyCta ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="backdrop-blur-lg bg-background/90 border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-foreground">
            From ${CONFIG.COURSE.PRICE_ONLINE} · {CONFIG.COURSE.ONLINE_CPD_POINTS} CPD
          </span>
          <a
            href="#pricing-cards"
            className="btn-primary px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 flex-shrink-0"
          >
            View Options
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}
