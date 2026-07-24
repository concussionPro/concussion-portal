'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Check, Star, ShieldCheck, BookOpen, BedDouble, MapPin, GraduationCap, HeartPulse, ExternalLink } from 'lucide-react'
import { CONFIG, afterpayInstalment } from '@/lib/config'
import { CourseSchema } from '@/components/SchemaMarkup'
import { SiteNav } from '@/components/SiteNav'
import CcmPricingContent from '@/components/pricing/CcmPricingContent'
import CrmPricingContent from '@/components/crm/CrmPricingContent'
import { OtherCityInterest } from '@/components/OtherCityInterest'
import { LocationInterestCard } from '@/components/LocationInterestCard'
import { SstWatchVisual, BaselineLaptopVisual, InstrumentKeyframes } from '@/components/clinical/InstrumentVisuals'
import { trackShopClick } from '@/lib/analytics'

// TRUTH GATE: ESSA endorsement is PENDING. Until the certificate lands, the CRM
// stream must not show the ESSA logo or an "Endorsed by" claim on the home page
// — the most public surface we have. Same discipline as /cpd, CourseStreams,
// CrmPricingContent and the CRM checkout route: flip CONFIG.FEATURES.ESSA_ACCREDITED
// on real approval and this section upgrades itself.
const ESSA_APPROVED = CONFIG.FEATURES.ESSA_ACCREDITED

const HOME_STREAMS: Array<{
  id: 'ccm' | 'crm'; code: string; name: string; audience: string; icon: typeof GraduationCap
  href: string; endorseImg: string; endorseOrg: string; endorseSub: string
  /** External link to the endorsing body's listing — makes the badge clickable. */
  endorseHref?: string
  /** True while the endorsing body has not confirmed — renders "pending", no logo. */
  endorsePending?: boolean
  tagline: string
  modules: { n: string; title: string; sub: string }[]
}> = [
  {
    id: 'ccm', code: 'CCM', name: 'Concussion Clinical Mastery',
    audience: 'Physiotherapists & allied health', icon: GraduationCap, href: '/pricing',
    endorseImg: '/osteopathy-australia-endorsed.png',
    endorseOrg: 'Osteopathy Australia',
    endorseHref: 'https://osteopathy.org.au/Web/Web/cpd/endorsed-courses.aspx?hkey=3c85c306-c65a-4a5d-90f1-782a78dedd86',
    endorseSub: `AHPRA-aligned · 8 CPD hrs online, ${CONFIG.COURSE.TOTAL_CPD_POINTS} with the workshop`,
    tagline: 'Assess, diagnose and manage concussion — SCAT6, VOMS & BESS, return-to-play and phenotype rehab.',
    modules: [
      { n: '01', title: 'What is a Concussion?', sub: 'The science & mechanisms' },
      { n: '02', title: 'Diagnosis & Initial Assessment', sub: 'Theory & clinical tools' },
      { n: '03', title: 'Practical Assessment & Acute Management', sub: 'Clinical reasoning & acute protocols' },
      { n: '04', title: 'Persistent Symptoms & Long-Term Management', sub: 'PPCS & CTE' },
      { n: '05', title: 'Multidisciplinary Management', sub: 'The care team' },
      { n: '06', title: 'Return to Play, Work & School', sub: 'Graduated protocols' },
      { n: '07', title: 'Rehabilitation by Phenotype', sub: 'Targeted pathways' },
      { n: '08', title: 'Legal, Ethical & Documentation', sub: 'Defensible practice' },
    ],
  },
  {
    id: 'crm', code: 'CRM', name: 'Concussion Rehab Mastery',
    audience: 'Exercise physiologists', icon: HeartPulse, href: '/concussion-rehab-mastery',
    endorseImg: '/essa-endorsed.png',
    endorseOrg: 'Exercise & Sports Science Australia',
    endorsePending: !ESSA_APPROVED,
    endorseSub: ESSA_APPROVED
      ? `8 ESSA CPD points online · up to 16 CPD hours`
      : `Built to ESSA CPD standards · 8 hrs online, up to 16 with the workshop`,
    tagline: 'Prescribe the exercise rehab that moves recovery — measured-threshold aerobic training, in EP scope.',
    modules: [
      { n: '01', title: 'Concussion for the Exercise Physiologist', sub: 'The EP lens' },
      { n: '02', title: 'Recognition, Red Flags & Scope', sub: 'Where your lane starts & stops' },
      { n: '03', title: 'Assessment That Is the Treatment', sub: 'The BCTT & HRt' },
      { n: '04', title: 'Sub-Symptom-Threshold Aerobic Rehab', sub: 'The measured dose' },
      { n: '05', title: 'Phenotype-Specific Exercise Rehab', sub: 'Targeted reconditioning' },
      { n: '06', title: 'Graded Return to Activity & Sport', sub: 'Progression to performance' },
      { n: '07', title: 'Persistent Symptoms & the Complex Case', sub: 'When recovery stalls' },
      { n: '08', title: 'Documentation, Communication & Referral', sub: 'Funder-ready reporting' },
    ],
  },
]

export default function HomeClient() {
  const [stream, setStream] = useState<'ccm' | 'crm'>('ccm')

  // CRM (EP / ESSA stream) is NOT live until ESSA endorsement is actually
  // granted. Until then the homepage presents CCM as the single course — no CRM
  // tab, no "two streams" framing, no ESSA badge. Flip CONFIG.FEATURES.
  // ESSA_ACCREDITED when the certificate lands and CRM re-appears everywhere.
  const showCrm = ESSA_APPROVED
  const visibleStreams = showCrm ? HOME_STREAMS : HOME_STREAMS.filter((s) => s.id === 'ccm')

  return (
    <>
      {/* Organization schema intentionally NOT emitted here — the root layout
          already renders the canonical org schema; duplicating it on the
          homepage confuses crawlers. */}
      <CourseSchema />

      <div className="min-h-screen bg-[#e7ecee] relative">

        {/* ── Ambient gradient wash behind hero ──────────── */}
        <div className="absolute inset-0 hero-gradient pointer-events-none" aria-hidden="true" />
        <div className="ambient-glow -top-[200px] left-1/2 -translate-x-1/2" aria-hidden="true" />

        {/* ── Nav ──────────────────────────────────────────── */}
        <SiteNav />




        {/* ── Course stream tabs — sit above the title; clicking swaps the whole
            course landing (same pricing-page design) between CCM and CRM. ── */}
        <section className="relative z-10 pt-[100px] md:pt-[116px] px-5 md:px-8">
          <div className="max-w-3xl mx-auto">
            {showCrm && (
              <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)] mb-4">
                Two CPD streams — choose yours
              </p>
            )}
            <div role="tablist" aria-label="Choose your course stream" className={showCrm ? 'grid grid-cols-2 gap-3' : 'max-w-md mx-auto'}>
              {visibleStreams.map((s) => {
                const active = s.id === stream
                const Icon = s.icon
                return (
                  <div key={s.id} className="flex flex-col gap-2.5">
                    {/* Compact tab — the clickable stream selector */}
                    <button
                      role="tab"
                      aria-selected={active}
                      onClick={() => setStream(s.id)}
                      className={`flex items-center gap-3 rounded-2xl px-5 py-4 text-left border-2 transition-all ${
                        active
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-lg shadow-[rgba(13,115,119,0.25)]'
                          : 'bg-white border-[rgba(13,115,119,0.15)] text-[var(--foreground)] hover:border-[rgba(13,115,119,0.4)] hover:shadow-md'
                      }`}
                    >
                      <span className={`flex-none w-11 h-11 rounded-xl grid place-items-center ${active ? 'bg-white/15' : 'bg-[rgba(13,115,119,0.08)]'}`}>
                        <Icon className={`w-6 h-6 ${active ? 'text-white' : 'text-[var(--accent)]'}`} strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-[10px] font-bold tracking-[0.14em] ${active ? 'text-white/70' : 'text-[var(--accent)]'}`}>{s.code}</span>
                        <span className="block text-[15px] font-bold leading-tight">{s.name}</span>
                        <span className={`block text-[12px] leading-tight mt-0.5 ${active ? 'text-white/85' : 'text-[var(--muted-foreground)]'}`}>{s.audience}</span>
                      </span>
                    </button>

                    {/* Endorsement sits BELOW the tab (not nested inside it) — the
                        #1 trust signal, but light. OA under CCM, ESSA under CRM.
                        Only rendered here on the home page; the in-content badge is
                        hidden when embedded so it never repeats. */}
                    {(() => {
                      // ESSA supplies a full horizontal lockup (its logo + "Accredited by
                      // Exercise & Sports Science Australia" baked in) — render it ALONE at
                      // its natural 5.5:1 ratio, correctly sized (no duplicate text, no
                      // squish, no blur). OA is a compact square badge → logo + label.
                      const isLockup = !s.endorsePending && s.endorseImg === '/essa-endorsed.png'
                      const inner = isLockup ? (
                        <Image src={s.endorseImg} alt={`Accredited by ${s.endorseOrg}`} width={352} height={64} className="h-[52px] sm:h-[62px] w-auto" />
                      ) : (
                        <>
                          {!s.endorsePending && (
                            <Image src={s.endorseImg} alt={`Endorsed by ${s.endorseOrg}`} width={72} height={64} className="h-[52px] w-auto flex-none" />
                          )}
                          <span className="min-w-0 text-left">
                            <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                              {s.endorsePending ? 'Endorsement pending' : 'Endorsed by'}
                            </span>
                            <span className="flex items-center gap-1 text-[14.5px] font-bold text-[var(--foreground)] leading-tight">
                              {s.endorseOrg}
                              {s.endorseHref && !s.endorsePending && (
                                <ExternalLink className="w-3.5 h-3.5 opacity-50 flex-none" strokeWidth={2.2} />
                              )}
                            </span>
                          </span>
                        </>
                      )
                      // Prominent, bordered badge. Clickable when the body publishes a listing.
                      const cls = `flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${s.endorsePending ? 'border-dashed border-[var(--border)] bg-transparent' : 'border-[var(--border)] bg-white/70 shadow-sm'}`
                      return s.endorseHref && !s.endorsePending ? (
                        <a href={s.endorseHref} target="_blank" rel="noopener noreferrer" className={`${cls} hover:border-[var(--accent)] hover:bg-white cursor-pointer`}>
                          {inner}
                        </a>
                      ) : (
                        <span className={cls}>{inner}</span>
                      )
                    })()}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Active stream landing — the full pricing-page design, swapped by tab.
            hideNav so the homepage owns the single SiteNav; noPadTop trims the
            landing's own top offset since the tabs already provide it. */}
        <div className="relative z-10">
          {!showCrm || stream === 'ccm' ? <CcmPricingContent hideNav /> : <CrmPricingContent hideNav />}
        </div>

        {/* ── Workshop locations ───────────────────────────── */}
        <section id="locations" className="section-padding relative z-10">
          <div className="max-w-[960px] mx-auto">
            <div className="text-center mb-8 md:mb-10">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                Hands-on workshops across Australia
              </span>
              <h2 className="text-2xl md:text-[2rem] font-bold tracking-tight text-[var(--foreground)] mb-3">
                Where the <span className="text-gradient">practical day</span> runs
              </h2>
              <p className="text-sm md:text-base text-[var(--muted-foreground)] max-w-lg mx-auto">
                The in-person day — VOMS, BESS, vestibular &amp; cervical assessment on real cases — runs in major cities as demand opens. Register and you&apos;ll be first to know when your city&apos;s date is confirmed.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                { city: 'Melbourne', citySlug: 'melbourne', img: '/locations/melbourne.webp', status: 'Delivered · Jun 2026', dotClass: 'bg-slate-400', statusTextClass: 'text-slate-600', caption: 'Register for the next Melbourne round' },
                { city: 'Sydney', citySlug: 'sydney', img: '/locations/sydney.jpg', status: 'Registering interest', dotClass: 'bg-orange-500 animate-pulse', statusTextClass: 'text-orange-700', caption: "Be first to know when Sydney's date is confirmed" },
                { city: 'Byron Bay', citySlug: 'byron-bay', img: '/locations/byron-bay.jpg', status: 'Registering interest', dotClass: 'bg-orange-500 animate-pulse', statusTextClass: 'text-orange-700', caption: "Be first to know when Byron Bay's date is confirmed" },
              ] as const).map((loc) => (
                <LocationInterestCard key={loc.city} {...loc} />
              ))}
            </div>
            <p className="mt-5 text-center text-sm text-[var(--muted-foreground)]">
              Somewhere else? The Complete Course is buyable any time — you nominate your city at
              checkout, and the date launches once your city hits its threshold.
            </p>

            {/* Register interest — moved out of the hero (owner 2026-07-10: locations
                + authority belong high; the hero stays slim) */}
            <div className="mt-6 max-w-[480px] mx-auto">
              <OtherCityInterest />
            </div>
          </div>
        </section>

        {/* ── Clinical instruments — founding-period access with enrolment.
            Clinical Testing becomes a paid monthly subscription (owner,
            2026-07-05) — never promise 'included forever'. ── */}
        <section className="section-padding relative z-10">
          <InstrumentKeyframes />
          <div className="max-w-[960px] mx-auto">
            <div className="text-center mb-8 md:mb-10">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
                Yours with enrolment through the founding period
              </span>
              <h2 className="text-2xl md:text-[2rem] font-bold tracking-tight text-[var(--foreground)] mb-3">
                Two clinical instruments, <span className="text-gradient">not just modules</span>
              </h2>
              <p className="text-sm md:text-base text-[var(--muted-foreground)] max-w-xl mx-auto">
                Enrol during the founding period and your clinic code activates both instruments: prescribe
                measured-threshold exercise rehab from your patients&apos; own watches, and run
                self-administered SCAT6 baselines for whole clubs.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="flex flex-col overflow-hidden rounded-2xl bg-[#16243f] shadow-[0_18px_40px_-18px_rgba(22,36,63,0.55)]">
                <SstWatchVisual />
                <div className="p-5">
                  <h3 className="m-0 text-lg font-extrabold tracking-tight text-white">SST Trainer</h3>
                  <p className="m-0 mt-1 text-[13px] leading-relaxed text-slate-300/90">
                    A graded test measures each patient&apos;s symptom threshold; they train just under
                    it — live heart rate, verified progression, every session on your dashboard.
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
        </section>



        {/* ── Stats bento grid ────────────────────────────── */}
        <section className="px-5 md:px-8 pb-16 md:pb-20 relative z-10">
          <div className="max-w-[860px] mx-auto">
            <div className="rounded-2xl bg-white border border-[rgba(13,115,119,0.11)] shadow-[0_1px_2px_rgba(10,15,20,0.04),0_14px_36px_-6px_rgba(13,115,119,0.14)] px-5 py-6 md:px-8 md:py-7 animate-fade-in-delay-1">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 divide-[rgba(13,115,119,0.08)] md:divide-x">
                {[
                  { value: 'Up to 14', label: 'AHPRA CPD Hours', sub: '8 online + 6 workshop' },
                  { value: '8', label: 'Online Modules', sub: 'Interactive quizzes' },
                  { value: '140+', label: 'References', sub: 'Evidence-based' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center md:px-3">
                    <div className="text-2xl md:text-[2rem] font-bold tracking-tight text-[var(--accent)] mb-1 tabular-nums">
                      {stat.value}
                    </div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground)] mb-0.5">
                      {stat.label}
                    </div>
                    <div className="text-[11px] text-[var(--muted-foreground)] opacity-70">
                      {stat.sub}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-center md:px-3">
                  <Image
                    src="/osteopathy-australia-endorsed.png"
                    alt="Osteopathy Australia Endorsed Course"
                    width={108} height={96}
                    className="h-20 md:h-24 w-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>




        {/* ── Free SCAT Training ───────────────────────────── */}
        <section className="section-padding relative z-10">
          <div className="max-w-[760px] mx-auto">
            <div className="card-accent rounded-2xl p-6 md:p-8 animate-fade-in-delay-2">
              <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
                <div className="flex-1">
                  <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
                    100% Free · No Credit Card
                  </span>
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--foreground)] mb-2">
                    Start with Free SCAT6 Mastery
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-3">
                    Master SCAT6 &amp; SCOAT6 in ~1 hour. Red flags, documentation, step-by-step protocols. Free, no credit card required.
                  </p>
                  <div className="inline-flex items-center gap-2 mb-4 rounded-lg bg-white/70 border border-[rgba(13,115,119,0.25)] px-3 py-2">
                    <Check className="w-4 h-4 text-[var(--accent)] shrink-0" strokeWidth={2.5} />
                    <span className="text-[13px] font-semibold text-[var(--foreground)]">
                      Finish it and get <span className="text-[var(--accent)]">$50 off</span> the full online course
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <Link
                      href="/scat-mastery"
                      className="btn-primary px-5 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2"
                    >
                      Get Free Course
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href="/scat-forms"
                      className="btn-secondary px-5 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2"
                    >
                      Free SCAT Forms
                    </Link>
                  </div>
                </div>
                <div className="hidden md:flex flex-col gap-2.5 shrink-0 w-[200px]">
                  {[
                    'SCAT6 & SCOAT6 deep-dive',
                    'Red flag identification',
                    'Medicolegal documentation',
                    'Free — no credit card',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2.5 text-[13px] text-[var(--foreground)]">
                      <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" strokeWidth={2.5} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* ── What clinicians miss ─────────────────────────── */}
        <section className="section-padding relative z-10">
          <div className="max-w-[860px] mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-[2rem] font-bold tracking-tight text-[var(--foreground)] mb-3">
                What most CPD courses <span className="text-gradient">don&apos;t teach</span>
              </h2>
              <p className="text-sm md:text-base text-[var(--muted-foreground)] max-w-md mx-auto">
                VOMS, BESS scoring, convergence insufficiency, vestibular dysfunction — the assessments that separate confident clinicians from uncertain ones.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Online */}
              <div className="card rounded-2xl p-5 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#0b6165] flex items-center justify-center shadow-sm">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" stroke="white" strokeWidth="1.5"/>
                      <path d="M8 21h8M12 17v4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[var(--foreground)]">Online Modules</h3>
                    <p className="text-xs text-[var(--accent)] font-medium">8 CPD Hours</p>
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {[
                    '8 comprehensive modules with interactive quizzes',
                    'Evidence-based protocols and clinical frameworks',
                    'Lifetime access — content updated and added to regularly',
                    'Downloadable resources and flowcharts',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[13px] text-[var(--muted-foreground)]">
                      <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 mt-0.5" strokeWidth={2.5} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* In-Person */}
              <div className="card rounded-2xl p-5 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#0b6165] flex items-center justify-center shadow-sm">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="9" cy="7" r="3" stroke="white" strokeWidth="1.5"/>
                      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.85" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[var(--foreground)]">Full-Day Practical</h3>
                    <p className="text-xs text-[var(--accent)] font-medium">6 CPD Hours</p>
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {[
                    'Hands-on SCAT6, VOMS & BESS protocols',
                    'Small group practice with live feedback',
                    'Real-world case studies and clinical scenarios',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[13px] text-[var(--muted-foreground)]">
                      <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 mt-0.5" strokeWidth={2.5} />
                      {item}
                    </li>
                  ))}
                  <li className="flex items-start gap-2.5 text-[13px] text-[var(--muted-foreground)]">
                    <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span>
                      Flexible workshop locations ·{' '}
                      <Link
                        href="/in-person"
                        className="text-[var(--accent)] font-medium hover:underline"
                      >
                        View agenda
                      </Link>
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>


        {/* ── Why now ──────────────────────────────────────── */}
        <section className="section-padding relative z-10">
          <div className="max-w-[640px] mx-auto">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--foreground)] mb-2">
              Why clinicians are upskilling now
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-5">
              Recent policy changes are raising the bar for concussion competency across Australian sport.
            </p>
            <div className="space-y-3">
              {[
                {
                  title: 'AIS Position Statement 2024',
                  desc: 'Physiotherapists formally recognised as first-line concussion care providers. 30+ NSOs adopted.',
                  href: '/blog/ais-concussion-brain-health-position-statement-2024',
                },
                {
                  title: '21-day mandatory stand-down',
                  desc: 'Youth and community sport now requires structured return-to-play protocols and medical clearance.',
                  href: '/blog/21-day-concussion-stand-down-youth-sport-australia',
                },
                {
                  title: 'NSW combat sports legislation',
                  desc: 'First Australian jurisdiction to mandate concussion training — a signal of where regulation is heading.',
                  href: '/blog/nsw-mandatory-concussion-training-combat-sports',
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-start gap-3 p-4 rounded-xl card hover:shadow-sm transition-all"
                >
                  <span className="text-[var(--accent)] mt-0.5 text-base font-bold leading-none">→</span>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">{item.title}</p>
                    <p className="text-[12px] text-[var(--muted-foreground)] mt-0.5">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Divider ──────────────────────────────────────── */}
        <div className="max-w-[640px] mx-auto px-5 md:px-8">
          <div className="divider" />
        </div>


        {/* ── Testimonials ─────────────────────────────────── */}
        <section className="section-padding relative z-10">
          <div className="max-w-[640px] mx-auto">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--foreground)] mb-6">
              What clinicians say
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  quote: "Before this training, our approach to concussion cases was uncertain. Now, my team has the confidence and proven skills to diagnose and manage them with clarity and accuracy.",
                  name: 'Andy',
                  role: 'Clinic Owner, NSW',
                },
                {
                  quote: "An outstanding blend of evidence-based knowledge and practical skills. The clinically relevant testing covered is directly applicable to concussion diagnosis and management in real-world settings.",
                  name: 'Dean',
                  role: 'University Clinical Educator, QLD',
                },
                {
                  quote: "Relevant, applicable and easy to absorb. A must for any clinician managing concussion.",
                  name: 'Sarah',
                  role: 'Physiotherapist',
                },
                {
                  quote: "Practical, well-structured, and backed by the latest evidence. Exactly what clinicians need.",
                  name: 'A Physio',
                  role: 'Physiotherapist, VIC',
                },
              ].map((t) => (
                <div key={t.name} className="card rounded-2xl p-5 md:p-6">
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-[13px] md:text-sm text-[var(--muted-foreground)] leading-relaxed mb-4">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-[#0b6165] flex items-center justify-center text-xs font-semibold text-white shadow-sm">
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[var(--foreground)]">{t.name}</div>
                      <div className="text-[11px] text-[var(--muted-foreground)]">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ── Final CTA ────────────────────────────────────── */}
        <section className="px-5 md:px-8 pb-16 md:pb-24 relative z-10">
          <div className="max-w-[640px] mx-auto text-center">
            <div className="bg-gradient-to-br from-[var(--foreground)] to-[#1a2332] rounded-2xl p-8 md:p-12 relative overflow-hidden">
              {/* Subtle glow inside dark CTA */}
              <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-[var(--accent)] opacity-[0.06] blur-[80px] pointer-events-none" aria-hidden="true" />

              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-3 relative z-10">
                Ready to master evidence-based concussion management?
              </h2>
              <p className="text-sm text-white/60 mb-6 max-w-md mx-auto relative z-10">
                Up to {CONFIG.COURSE.TOTAL_CPD_POINTS} AHPRA CPD hours · Lifetime access · From ${CONFIG.COURSE.PRICE_ONLINE}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
                <Link
                  href={CONFIG.SHOP_URL}
                  onClick={() => trackShopClick('footer-cta')}
                  className="bg-white text-[var(--foreground)] px-7 py-3.5 rounded-xl text-[15px] font-semibold inline-flex items-center gap-2 hover:bg-white/90 transition-colors shadow-lg"
                >
                  View Plans & Enrol
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/preview"
                  className="text-white/70 px-7 py-3.5 rounded-xl text-[15px] font-semibold inline-flex items-center gap-2 hover:text-white transition-colors border border-white/20 hover:border-white/40"
                >
                  Preview Course
                </Link>
              </div>
            </div>
          </div>
        </section>


        {/* Footer is rendered by FooterWrapper in root layout */}
      </div>
    </>
  )
}
