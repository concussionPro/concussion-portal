'use client'

import { PROTOCOL_DOI, PROTOCOL_DOI_URL } from '@/lib/protocol-reference'
import { useState, useEffect, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight, Check, ShieldCheck, HeartPulse, Activity, ClipboardList,
  Award, Quote, FileText, ChevronDown, ChevronUp, Building2, BookOpen,
} from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import EpLeadCapture from '@/components/crm/EpLeadCapture'
import { SstWatchVisual, InstrumentKeyframes } from '@/components/clinical/InstrumentVisuals'
import { CONFIG } from '@/lib/config'
import { buildIntlFaqs, PLATFORM_MONTHLY_AUD } from '@/components/crm/intl-faqs'
import { CRM_REFERENCE_COUNT } from '@/data/reference-count'
import CourseShowcase from '@/components/ccm/CourseShowcase'

/**
 * CRM (Concussion Rehab Mastery) — INTERNATIONAL landing.
 *
 * A section-for-section COPY of the AU CRM landing (CrmPricingContent) — same
 * hero, standards banner, live training photo, employer callout, value intro,
 * pricing card design, trust row, instruments, tools grid, microcopy,
 * instructor, FAQ, bottom capture, sticky CTA — with only the facts swapped:
 *   - 8 CPD hours ONLY (no in-person day sold overseas — never "14")
 *   - geo-derived local price from the server page (lib/international-pricing.ts
 *     — display always matches the checkout charge)
 *   - founding-cohort interest capture, no live checkout (market review)
 *
 * HONESTY GUARDRAILS: ACSM CECs are PENDING; ESSA is GRANTED (2026-07-24) — never claim
 * credits/accreditation not held; never imply ACSM endorses CRM (citing ACSM's
 * public position is fair use). The mTBI manuscript is under review, never
 * "published". No EP authored the course.
 */

export interface IntlPriceView {
  display: string // e.g. "£275"
  code: string // e.g. "GBP"
}

/**
 * Audience copy overrides — every field defaults to the EP/international
 * strings below, so existing call sites render unchanged (the EpLeadCapture
 * copy-override pattern). /cata passes the athletic-therapist set; a future
 * body-scoped page passes its own. Structure and design never change per
 * audience — only the words (owner: "IT IS THE SAME AS CRM BUT FOR THE
 * CANADIAN MARKET AND AT'S").
 */
export interface IntlAudienceCopy {
  badgeText?: string
  heroTitle?: ReactNode
  heroBlurb?: string
  strapText?: string
  /** Hero stat tile for CPD/CEU value, e.g. { big: '3.2', small: ' CEUs', label: 'CATA enhanced rate' } */
  cpdTile?: { big: string; small: string; label: string }
  cardChip?: string
  cardCpdChip?: string
  cardTitle?: string
  cardSubtitle?: string
  /** First bullet of the pricing card (the modules line). */
  moduleBullet?: string
  valueIntroBlurb?: string
  scopeStrip?: string
  /** Replaces the "Built to ACSM CEC & ESSA CPD standards" banner wholesale. */
  standardsBand?: ReactNode
  /** Replaces the amber continuing-education honesty block wholesale. */
  ceStatusNote?: ReactNode
  /** The ACSM editorial-quote block is EP-specific; hide for other audiences. */
  showAcsmQuote?: boolean
  certFooterLine?: string
  /** Sub-line of the bottom enrol block ("The EP-scoped course + …"). */
  enrolBlurb?: string
  faqs?: { q: string; a: string }[]
  leadCapture?: {
    location?: string
    kicker?: string
    heading?: string
    blurb?: string
    footnote?: string
    heroBlurb?: string
    emailPlaceholder?: string
  }
  stickyCpdLabel?: string
  /** Render the pricing card IN the hero (replacing the enrol CTA + hero lead
   *  capture, which are redundant next to it — owner 2026-08-15 on /cata:
   *  "these are redundant just show price card"). */
  priceCardInHero?: boolean
}

export default function CrmInternationalContent({
  price,
  live = false,
  hideNav = false,
  audience = {},
}: {
  price: IntlPriceView
  live?: boolean
  hideNav?: boolean
  audience?: IntlAudienceCopy
}) {
  const essaAccredited = CONFIG.FEATURES.ESSA_ACCREDITED
  const essaBadgeLine = essaAccredited
    ? `ESSA-accredited · ${CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hours`
    : 'Designed to ESSA CPD standards · accreditation pending'
  const INTL_FAQS = audience.faqs ?? buildIntlFaqs(essaAccredited)
  const cpdTile = audience.cpdTile ?? { big: '8', small: 'hrs', label: 'Assessed CPD' }
  const showAcsmQuote = audience.showAcsmQuote ?? true
  const certFooterLine = audience.certFooterLine ?? `Built to ACSM CEC standards · ${essaBadgeLine}`
  const priceCardInHero = audience.priceCardInHero ?? false
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set())

  // Live checkout (only when `live`): POST to the geo-priced international
  // checkout route and redirect to the returned Stripe URL. Country + currency
  // are resolved server-side there — the client sends nothing price-bearing.
  const [enrolling, setEnrolling] = useState(false)
  const [enrolError, setEnrolError] = useState<string | null>(null)
  const handleEnrol = async () => {
    if (enrolling) return
    setEnrolling(true)
    setEnrolError(null)
    try {
      const res = await fetch('/api/crm/checkout-international', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        setEnrolError(data?.error || 'Could not start checkout. Please try again.')
        setEnrolling(false)
        return
      }
      window.location.href = data.url
    } catch {
      setEnrolError('Could not start checkout. Please try again.')
      setEnrolling(false)
    }
  }
  const toggleFaq = (i: number) => {
    setOpenFaqs((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  // Sticky mobile CTA — show after scrolling past the pricing card.
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

  // The live-training photo: above the PRICE CARD when the card is in the
  // hero (owner 2026-08-15: 'training image needs to be above the price
  // card'), at its usual below-hero spot otherwise.
  const trainingPhoto = (
    <>
        {/* Live workshop training photo — same as AU, provenance framing */}
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
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] font-bold text-amber-300 mb-1">Clinician-built, clinician-taught</p>
            <h3 className="text-base sm:text-xl font-bold leading-tight">
              The same training program delivered hands-on to clinical teams across Australia.
            </h3>
            <p className="text-[12.5px] sm:text-sm text-white/85 mt-1 leading-snug max-w-2xl">
              Assessment &rarr; measured HR threshold &rarr; in-scope exercise prescription — the
              online course is the same clinical method, taught by the same clinician, self-paced
              from wherever you practise.
            </p>
          </div>
        </div>
    </>
  )

  // The pricing card + trust row, extracted so it can render either in the
  // hero (priceCardInHero) or at its default mid-page position — never both.
  const pricingSection = (
    <>
        {/* Pricing — same card design as AU (single international tier, geo-priced) */}
        <div id="pricing-cards" className="mt-6">
          <div className="max-w-xl mx-auto pt-2">
            <div className="card card-visible rounded-2xl p-5 md:p-6 flex flex-col relative" style={{ borderWidth: '2px', borderColor: 'rgba(13, 115, 119, 0.35)' }}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-50 flex items-center justify-center border border-teal-200/50 flex-shrink-0">
                    <BookOpen className="w-4.5 h-4.5 text-[var(--accent)]" strokeWidth={2} />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-50 text-[var(--accent)] border border-teal-200">
                    {audience.cardChip ?? 'International'}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                    {audience.cardCpdChip ?? '8 CPD hrs'}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="text-2xl font-bold text-[var(--foreground)] tracking-tight">{price.display}</span>
                    <span className="text-[11px] text-[var(--muted-foreground)]">{price.code}</span>
                  </div>
                  <p className="text-[10px] text-[var(--muted-foreground)]">course + first year on the platform</p>
                </div>
              </div>

              <h3 className="text-xl font-bold text-[var(--foreground)] mb-0.5">{audience.cardTitle ?? 'CRM International'}</h3>
              <p className="text-[12px] text-slate-500 mb-2 font-medium">{audience.cardSubtitle ?? 'The EP-scoped course + the clinical platform — certify entirely online'}</p>
              <p className="text-[13px] text-[var(--muted-foreground)] leading-relaxed mb-4">
                8 modules at your own pace, plus the working clinical tools to open a new
                referral-worthy service line — delivered wholly online, wherever you practise.
              </p>

              <ul className="grid grid-cols-1 gap-x-3 gap-y-1.5 mb-5">
                {[
                  audience.moduleBullet ?? '8 EP-scoped modules · 8 CPD hours',
                  'SST Trainer — test → prescription → monitoring',
                  'BCTT calculator + full Clinical Toolkit',
                  'SSTAE templates + phenotype library',
                  'Certificate on 80% pass · lifetime access',
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[12.5px]">
                    <Check className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span className="text-[var(--muted-foreground)]">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Platform: bundled free year 1, then the real monthly rate */}
              <div className="rounded-xl bg-teal-50/60 border border-teal-200 px-4 py-3 mb-4">
                <p className="text-[12.5px] text-slate-700 leading-relaxed">
                  <strong className="text-teal-800">Course is one-time — lifetime access.</strong>{' '}
                  The clinical platform (the SST Trainer) is <strong>included free for your
                  first year</strong>, then <strong>A${PLATFORM_MONTHLY_AUD}/month</strong> to keep it — starts
                  automatically at 12 months, cancel anytime.
                </p>
              </div>

              <div className="mt-auto">
                <button
                  type="button"
                  onClick={handleEnrol}
                  disabled={enrolling}
                  className="btn-primary w-full py-3 px-5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {enrolling ? 'Starting checkout…' : `Enrol — ${price.display}`}
                  {!enrolling && <ArrowRight className="w-4 h-4" />}
                </button>
                {enrolError && (
                  <p className="text-[11px] text-center text-red-600 mt-2">{enrolError}</p>
                )}
                <p className="text-[11px] text-center text-[var(--muted-foreground)] mt-2">
                  Prices shown in your region&rsquo;s currency · secure checkout · 7-day money-back guarantee
                </p>
              </div>
            </div>
          </div>

          {/* Trust Signals — same as AU */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-[var(--muted-foreground)]">
            {['7-Day Guarantee', 'Lifetime Access', 'Clinical Tools Included', 'Certificate Included', 'Independently Reviewed'].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[var(--accent)]" strokeWidth={2.5} />
                {item}
              </div>
            ))}
          </div>
        </div>
    </>
  )

  return (
    <div className="min-h-screen bg-background">
      {!hideNav && <SiteNav />}
      <InstrumentKeyframes />

      <div className="max-w-6xl mx-auto px-6 pb-12 md:pb-20 pt-[120px]">

        {/* Page Header — same as AU */}
        <div className="text-center mb-8">
          <div className="badge mb-5 inline-flex">
            <Award className="w-3.5 h-3.5 mr-1.5" />
            {audience.badgeText ?? 'International · For Exercise Physiologists & Clinical Exercise Physiologists'}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            {audience.heroTitle ?? (
              <>
                Concussion rehab is <span className="text-gradient">exercise medicine</span>.
                <br className="hidden sm:block" /> Which makes it yours.
              </>
            )}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {audience.heroBlurb ??
              'Sub-symptom-threshold aerobic exercise is now the first-line, guideline-endorsed treatment for concussion — a graded aerobic prescription, squarely in the EP scope. This is the course that makes you the clinician who delivers it, with the working tools to start Monday.'}
          </p>

          {/* Skill chips — same as AU */}
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

          {/* Punch stat bento — same tiles, internationalised: 8 hrs, never 14 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 max-w-4xl mx-auto mt-7">
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-white border-l-4 border-amber-500 p-3 sm:p-4 text-left">
              <p className="text-2xl sm:text-3xl font-bold text-amber-700 leading-none">{cpdTile.big}<span className="text-base font-semibold">{cpdTile.small}</span></p>
              <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-600 mt-1">{cpdTile.label}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-teal-50 to-white border-l-4 border-teal-500 p-3 sm:p-4 text-left">
              <p className="text-2xl sm:text-3xl font-bold text-teal-700 leading-none">8</p>
              <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-600 mt-1">Online modules</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-rose-50 to-white border-l-4 border-rose-500 p-3 sm:p-4 text-left">
              {/* CRM_REFERENCE_COUNT, never a literal and never the CCM number.
                  This tile shipped REFERENCE_COUNT (144) — the size of the CCM
                  Reference Repository — on a page selling Concussion Rehab
                  Mastery, whose own evidence base is CRM_REFERENCE_COUNT
                  distinct works. The comment that used to sit here told editors
                  "136" was a stale variant to kill; on this page 136 was the
                  CRM's own citation total, so that instruction entrenched a
                  ~2.3x overstatement on an international selling surface. */}
              <p className="text-2xl sm:text-3xl font-bold text-rose-700 leading-none">{CRM_REFERENCE_COUNT}</p>
              <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-600 mt-1">References</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-white border-l-4 border-indigo-500 p-3 sm:p-4 text-left">
              <p className="text-2xl sm:text-3xl font-bold text-indigo-700 leading-none">∞</p>
              <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-600 mt-1">Lifetime access</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-white border-l-4 border-emerald-500 p-3 sm:p-4 text-left col-span-2 lg:col-span-1">
              <p className="text-2xl sm:text-3xl font-bold text-emerald-700 leading-none">7<span className="text-base font-semibold">day</span></p>
              <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-600 mt-1">Money-back</p>
            </div>
          </div>

          {/* One-line strap — same as AU */}
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto mt-5">
            {audience.strapText ??
              'A new, referral-worthy service line — physicians, physios and clinics need someone to deliver measured exercise rehab. 8 CPD hours online, self-paced, delivered entirely from wherever you practise.'}
          </p>

          {priceCardInHero ? (
            <div className="text-left">
              <div className="mt-8">{trainingPhoto}</div>
              {pricingSection}
            </div>
          ) : (
            <>
              {/* Primary hero CTA — same as AU */}
              <div className="mt-5 flex justify-center">
                <a
                  href="#pricing-cards"
                  className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm"
                >
                  See enrolment options — from {price.display}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              <EpLeadCapture
                variant="hero"
                location={audience.leadCapture?.location ?? 'international-hero'}
                kicker={audience.leadCapture?.kicker}
                heading={audience.leadCapture?.heading}
                blurb={audience.leadCapture?.blurb}
                footnote={audience.leadCapture?.footnote}
                heroBlurb={audience.leadCapture?.heroBlurb}
                emailPlaceholder={audience.leadCapture?.emailPlaceholder}
              />
            </>
          )}
        </div>

        {!priceCardInHero && trainingPhoto}

        {/* Standards block — same banner design as AU; pending-honest copy.
            Audience pages replace it wholesale (e.g. /cata's CATA band). */}
        {audience.standardsBand ?? (
        <div className="max-w-3xl mx-auto mb-6 flex items-center justify-center gap-3 sm:gap-4 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/70 to-emerald-50/40 px-5 py-4">
          <ShieldCheck className="w-9 h-9 sm:w-10 sm:h-10 text-accent flex-shrink-0" strokeWidth={1.75} />
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-0.5">
              Independently reviewed
            </p>
            <p className="text-lg sm:text-xl font-bold text-foreground leading-tight">
              Built to ACSM CEC &amp; ESSA CPD standards
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Built to ACSM CEC standards · {essaBadgeLine}
            </p>
          </div>
        </div>
        )}

        {/* Employer-reimbursement callout — same as AU */}
        <div className="max-w-3xl mx-auto mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
          <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Most practitioners pay $0 out of pocket</p>
            <p className="text-xs text-muted-foreground mt-1">Your employer or practice likely covers CPD training costs. Tax invoice with payment · certificate on completion.</p>
          </div>
        </div>

        {/* Value intro — same as AU */}
        <div className="text-center max-w-2xl mx-auto mb-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent mb-3">Built for you</p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 tracking-tight">
            Walk out and deliver it <span className="text-gradient">Monday</span>
          </h2>
          <p className="text-base text-muted-foreground">
            {audience.valueIntroBlurb ??
              'You don’t just learn the protocol — you leave with the instruments to run it. Every enrolment includes the working clinical platform: the Sub-Symptom-Threshold (SST) Trainer app, the BCTT calculator (heart-rate threshold → prescription) and the full Clinical Toolkit — all built around the exercise-physiology scope of practice.'}
          </p>
        </div>

        {!priceCardInHero && pricingSection}

        {/* Course showcase — see inside the online course (owner 2026-08-15). */}
        <div className="max-w-xl mx-auto mt-10 mb-2">
          <CourseShowcase />
        </div>

        {/* SST instrument visual — the platform proof (CRM = rehab-only, no baseline) */}
        <div className="max-w-xl mx-auto mt-10 mb-2">
          <div className="flex flex-col overflow-hidden rounded-2xl bg-[#16243f] shadow-[0_18px_40px_-18px_rgba(22,36,63,0.55)]">
            <SstWatchVisual />
            <div className="p-5">
              <h3 className="m-0 text-lg font-extrabold tracking-tight text-white">SST Trainer</h3>
              <p className="m-0 mt-1 text-[13px] leading-relaxed text-slate-300/90">
                A graded test measures each patient&rsquo;s symptom threshold; they train just
                under it — live heart rate, verified progression, every session on your dashboard.
              </p>
              <Link href="/sst-trainer?clinic=DEMO00" className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-bold text-teal-300 hover:text-teal-200">
                See the patient app <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Tools included — same glass grid as AU */}
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
              { icon: HeartPulse, title: 'Sub-Symptom-Threshold (SST) Trainer', desc: 'The patient app: threshold test → in-band heart-rate training on the wearable they already own → guided progression. Clinician-set and overseen by you.' },
              { icon: Activity, title: 'BCTT Calculator → Prescription', desc: 'Enter the Buffalo test stages; get the heart-rate threshold (HRt) and the 80–90% training band with the plain-language prescription.' },
              { icon: ClipboardList, title: 'Clinical Toolkit + Reporting Templates', desc: 'SSTAE templates, the phenotype library, and referrer-ready progress and outcome reporting — the paperwork done.' },
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

        {/* Microcopy strip — same as AU */}
        <div className="max-w-3xl mx-auto mt-4 mb-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-600" /> Working clinical tools, not static PDFs
          </span>
          <span className="hidden sm:inline text-slate-300">·</span>
          <span className="inline-flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-blue-600" /> {audience.scopeStrip ?? 'Built to the EP scope of practice'}
          </span>
          <span className="hidden sm:inline text-slate-300">·</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600" /> 7-day money-back guarantee
          </span>
        </div>

        {/* ACSM's own call — fair use of a public position, NOT endorsement.
            EP-specific; audience pages for other professions hide it. */}
        {showAcsmQuote && (
        <div className="max-w-3xl mx-auto mb-8 glass rounded-2xl p-6 md:p-8">
          <Quote className="w-6 h-6 text-accent mb-3" strokeWidth={2} />
          <p className="text-[15px] md:text-[16px] leading-relaxed text-foreground font-medium">
            The ACSM&rsquo;s own editorial voice has named building FITT-based exercise
            prescriptions for concussion recovery as essential future work, and told clinicians
            it is critical to stay current as the guidelines evolve — while no ACSM-CEC
            concussion course exists to teach it.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground mt-3">
            CRM is that training: FITT operationalised for concussion — frequency, intensity set
            by the measured HR threshold, time, and type, progressed against symptom response.
          </p>
          <p className="text-[11px] text-muted-foreground/70 mt-4">
            Reference: ACSM Hot Topic, <em>Exercise &amp; Rest in Concussion Recovery</em> (Apr
            2025). Cited as a published position; CRM is not endorsed by or affiliated with ACSM.
          </p>
        </div>
        )}

        {/* Published protocol — the citable method behind the course */}
        <div className="max-w-3xl mx-auto mb-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <FileText className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-[13.5px] text-muted-foreground leading-relaxed">
            <strong className="text-foreground">The method is published and citable.</strong>{' '}
            <em>A Standardised Clinical Protocol for Sub-Symptom-Threshold Aerobic Exercise
            Rehabilitation after Concussion (mTBI)</em> — Lewis Z. (2026), Zenodo, CC-BY-4.0,{' '}
            <a href={PROTOCOL_DOI_URL} target="_blank" rel="noopener noreferrer" className="text-accent font-semibold hover:underline">
              {PROTOCOL_DOI}
            </a>
            . The SST Trainer is the tool that delivers it — graded test, measured HR threshold,
            sub-threshold prescription, monitored progression.
          </p>
        </div>

        {/* Accreditation honesty — mirrors the ESSA-pending discipline.
            Audience pages replace it with their own body's status wholesale. */}
        {audience.ceStatusNote ?? (
        <div className="max-w-3xl mx-auto mb-8 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-5 py-4">
          <ShieldCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-[13.5px] text-amber-900 leading-relaxed">
            <strong>Continuing-education status:</strong> the course is built to ACSM CEC standards,
            but CEA holds <strong>no ACSM Approved-Provider status</strong> and is not currently
            pursuing one — no ACSM CECs are offered. The course is{' '}
            {essaAccredited ? <strong>ESSA-accredited</strong> : 'built to ESSA CPD standards (accreditation pending)'},
            content independently reviewed by two reviewers appointed by ESSA through its
            professional development endorsement process. We don&rsquo;t claim credits or
            accreditation we don&rsquo;t hold — this page updates the day any new one is confirmed.
          </p>
        </div>
        )}

        {/* Meet Your Instructor — same as AU */}
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
              <p className="text-sm text-accent font-medium mb-1">Registered Osteopath (AHPRA) · Concussion Researcher</p>
              <p className="text-xs text-muted-foreground mb-3">B.Clin.Sci, M.Ost.Med</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Concussion rehab is, by its nature, an exercise-physiology problem — a functional,
                energy-starved, autonomically-dysregulated injury that responds to precisely-dosed
                exertion. Zac has over a decade of clinical experience in neurological health and
                concussion management, including work with national and professional ice hockey
                across New Zealand and Canada, and is a co-author of concussion research currently
                under external review (Lewis &amp; Baker). The course is grounded in the
                Leddy / Buffalo evidence base and the Amsterdam consensus, translated specifically
                for the exercise-physiology scope of practice.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ — same as AU */}
        <div id="faq" className="max-w-2xl mx-auto mt-16 md:mt-20">
          <h2 className="text-2xl font-bold text-center mb-8 text-foreground">Common Questions</h2>
          <div className="space-y-3">
            {INTL_FAQS.map((item, i) => (
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

          <div className="text-center mt-10">
            {live ? (
              <button
                type="button"
                onClick={handleEnrol}
                disabled={enrolling}
                className="btn-primary px-10 py-4 rounded-xl text-base font-bold inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {enrolling ? 'Starting checkout…' : `Enrol — ${price.display}`}
                {!enrolling && <ArrowRight className="w-5 h-5" />}
              </button>
            ) : (
              <a
                href="#founding"
                className="btn-primary px-10 py-4 rounded-xl text-base font-bold inline-flex items-center gap-2"
              >
                Register your interest
                <ArrowRight className="w-5 h-5" />
              </a>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              {certFooterLine}
            </p>
          </div>
        </div>

        {/* Bottom enrol block. The `#founding` id is a legacy anchor target kept
            so existing links still land here — the founding-cohort MODEL is
            retired and must not come back (see lib/config.ts). */}
        <div id="founding" className="max-w-2xl mx-auto mt-16 scroll-mt-24">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-extrabold tracking-tight mb-2 text-foreground">
              Enrol in Concussion Rehab Mastery
            </h2>
            <p className="text-[15px] text-muted-foreground max-w-xl mx-auto">
              {audience.enrolBlurb ?? 'The EP-scoped course + the working clinical platform, delivered wholly online.'}
              {' '}Your first year on the platform is included; secure checkout in your region&rsquo;s
              currency, 7-day money-back guarantee.
            </p>
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={handleEnrol}
              disabled={enrolling}
              className="btn-primary px-10 py-4 rounded-xl text-base font-bold inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {enrolling ? 'Starting checkout…' : `Enrol — ${price.display}`}
              {!enrolling && <ArrowRight className="w-5 h-5" />}
            </button>
            {enrolError && (
              <p className="text-[12px] text-red-600 mt-3">{enrolError}</p>
            )}
            <p className="text-[11px] text-muted-foreground mt-3">
              {price.display} {price.code} one-time · lifetime course + first year of the platform free · then A${PLATFORM_MONTHLY_AUD}/mo to keep the platform
            </p>
          </div>
        </div>

      </div>

      {/* Sticky mobile CTA — same as AU */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
          showStickyCta ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="backdrop-blur-lg bg-background/90 border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-foreground">
            {price.display} · {audience.stickyCpdLabel ?? '8 CPD'}
          </span>
          {live ? (
            <button
              type="button"
              onClick={handleEnrol}
              disabled={enrolling}
              className="btn-primary px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {enrolling ? 'Starting…' : 'Enrol'}
              {!enrolling && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <a
              href="#founding"
              className="btn-primary px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 flex-shrink-0"
            >
              Register
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
