'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Check, Star, ShieldCheck, BookOpen, BedDouble, MapPin, GraduationCap, HeartPulse, ExternalLink } from 'lucide-react'
import { CONFIG, afterpayInstalment } from '@/lib/config'
import { CourseSchema } from '@/components/SchemaMarkup'
import { SiteNav } from '@/components/SiteNav'
import { OtherCityInterest } from '@/components/OtherCityInterest'
import { LocationInterestCard } from '@/components/LocationInterestCard'
import { SstWatchVisual, BaselineLaptopVisual, InstrumentKeyframes } from '@/components/clinical/InstrumentVisuals'
import { trackShopClick } from '@/lib/analytics'
import { REFERENCE_COUNT } from '@/data/reference-count'

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
    // OFFICIAL "ESSA Accredited PD" lockup from ESSA's marketing pack
    // (letter 27 Jul 2026 — usage licensed for accredited PDOs; ESSA rebrand,
    // navy variant for light backgrounds; white variant also in /public).
    endorseImg: '/essa-accredited-pd.png',
    endorseOrg: 'Exercise & Sports Science Australia',
    // ESSA's external-PD listings page — where a verifying EP finds the PDO.
    endorseHref: 'https://www.essa.org.au/Web/PD/PD-opportunities/external-pd.aspx',
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
  // Wall-clock read ONCE per mount (lazy initialiser), not on every render —
  // calling Date.now() during render is impure and makes the output depend on
  // when React happens to re-render. A workshop date can't cross "now" mid-visit.
  const [renderedAt] = useState(() => Date.now())

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

      {/* overflow-x-clip: .ambient-glow is a fixed 600px circle centred with
          left-1/2/-translate-x-1/2. At 375px that spans -112px..488px, which
          made the DOCUMENT 488px wide and pushed the fixed nav's mobile menu
          button off-screen (measured left=423 in a 375px viewport) — the
          hamburger was unreachable and the header showed only the logo.
          Clip (not hidden) so position:sticky children still work. */}
      <div className="min-h-screen bg-[#e7ecee] relative overflow-x-clip">

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
            {/* role="group", NOT "tablist" (fixed 2026-08-06). These stopped
                being tabs on 2026-08-04 when each pill became a Link into
                /courses?stream=… — but the container kept role="tablist" with
                zero role="tab" children and no aria-selected, so a screen
                reader announced "Choose your course stream, tab list" and then
                found nothing tabbable inside it. */}
            <div role="group" aria-label="Choose your course stream" className={showCrm ? 'grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3' : 'max-w-md mx-auto'}>
              {visibleStreams.map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.id} className="flex flex-col">
                    {/* WIDE pill tab (2026-07-28, Zac: the /courses/streams
                        pills beat the "short fat" joined cards) — generous
                        radius, roomy padding; the body stamps live in ONE
                        strip UNDER the pair, not glued to each card. */}
                    {/* ROUTER card (2026-08-04, owner: "home page and /courses
                        are identical — what is the point"): the homepage no
                        longer renders the full landing bodies; each pill now
                        routes into /courses with its tab preselected. */}
                    <Link
                      href={`/courses?stream=${s.id}`}
                      className="w-full flex h-[108px] items-center gap-4 rounded-[26px] px-6 text-left transition-all bg-white text-[var(--foreground)] border border-[rgba(13,115,119,0.14)] shadow-sm hover:shadow-md hover:border-[var(--accent)]"
                    >
                      <span className="flex-none w-12 h-12 rounded-full grid place-items-center bg-[rgba(13,115,119,0.08)]">
                        <Icon className="w-6 h-6 text-[var(--accent)]" strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold tracking-[0.14em] text-[var(--accent)]">{s.code}</span>
                        <span className="block text-[16px] font-bold leading-tight">{s.name}</span>
                        <span className="block text-[12.5px] leading-tight mt-0.5 text-[var(--muted-foreground)]">{s.audience}</span>
                      </span>
                      <ArrowRight className="w-4 h-4 flex-none text-[var(--accent)]" />
                    </Link>

                    {/* #1 TRUST SIGNAL — stamp in the SAME grid cell as its
                        tab: OA under CCM, ESSA under CRM, alignment structural. */}
                    {s.endorseHref && !s.endorsePending && (
                      <a href={s.endorseHref} target="_blank" rel="noopener noreferrer"
                        className="mt-3 mx-5 flex h-[88px] items-center justify-center gap-3.5 rounded-2xl border border-[rgba(13,115,119,0.14)] bg-white px-4 shadow-sm hover:shadow-md hover:border-[var(--accent)] transition-all">
                        <Image src={s.endorseImg} alt={`${s.endorseImg === '/essa-accredited-pd.png' ? 'Accredited by' : 'Endorsed by'} ${s.endorseOrg}`} width={268} height={100} className={`${s.endorseImg === '/essa-accredited-pd.png' ? 'h-10' : 'h-16'} w-auto flex-none`} />
                        <span className="min-w-0 text-[13px] leading-snug text-[var(--muted-foreground)]">
                          {s.endorseImg === '/essa-accredited-pd.png' ? 'Accredited by' : 'Endorsed by'}
                          <span className="block text-[15px] font-bold text-[var(--foreground)]">
                            {s.endorseOrg}
                            <ExternalLink className="inline-block w-3.5 h-3.5 ml-1.5 -mt-0.5 opacity-50" strokeWidth={2.2} />
                          </span>
                        </span>
                      </a>
                    )}
                  </div>
                )
              })}
            </div>

            {/* The streams are separate ONLINE — the practical day is SHARED.
                Said explicitly (Zac 2026-07-27): the relationship between the
                two cards is deliberate, and the multidisciplinary room is a
                selling point for both. */}
            {showCrm && (
              <p className="mt-6 text-center text-[12.5px] leading-relaxed text-[var(--muted-foreground)]">
                <span className="font-semibold text-[var(--foreground)]">Separate online streams — one shared practical day.</span>{' '}
                Osteos, physios and exercise physiologists train the hands-on day together, on real cases — the same
                multidisciplinary team a concussion patient actually moves through.
              </p>
            )}
          </div>
        </section>


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
              <p className="text-base md:text-lg font-bold text-[var(--foreground)] mb-2">
                Melbourne — {CONFIG.LOCATIONS.MELBOURNE.date} — enrolling now
              </p>
              <p className="text-sm md:text-base text-[var(--muted-foreground)] max-w-lg mx-auto">
                Sydney and Byron Bay Q4 dates are announced soon — register interest below and
                you&apos;re first to know when your city&apos;s date is confirmed.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Status + caption are DERIVED from CONFIG.LOCATIONS, never
                  hardcoded (date-bearing-copy rule): a hardcoded
                  "Delivered · Jun 2026" silently becomes a lie the moment the
                  city's status or date changes in config. Cities listed here are
                  the ones with hero imagery; anywhere else is covered by the
                  nomination line + OtherCityInterest below. */}
              {([
                { citySlug: 'melbourne', img: '/locations/melbourne.webp' },
                { citySlug: 'sydney', img: '/locations/sydney.jpg' },
                { citySlug: 'byron-bay', img: '/locations/byron-bay.jpg' },
              ] as const).map(({ citySlug, img }) => {
                const loc = Object.values(CONFIG.LOCATIONS).find((l) => l.slug === citySlug)!
                const isLive =
                  loc.status === 'confirmed' && !!loc.dateObj && loc.dateObj.getTime() > renderedAt
                const delivered = loc.status === 'completed' || (loc.hasRunWorkshop && !isLive)
                return (
                  <LocationInterestCard
                    key={citySlug}
                    city={loc.city}
                    citySlug={citySlug}
                    img={img}
                    status={isLive ? loc.date : delivered ? 'Delivered · next round open' : 'Registering interest'}
                    dotClass={isLive ? 'bg-emerald-500' : delivered ? 'bg-slate-400' : 'bg-orange-500 animate-pulse'}
                    statusTextClass={isLive ? 'text-emerald-700' : delivered ? 'text-slate-600' : 'text-orange-700'}
                    caption={
                      isLive
                        ? `Secure your ${loc.city} seat`
                        : delivered
                          ? `Register for the next ${loc.city} round`
                          : `Be first to know when ${loc.city}'s date is confirmed`
                    }
                  />
                )
              })}
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

        {/* ── Clinical instruments — included with CCM/CRM enrolment.
            Clinical Testing becomes a paid monthly subscription (owner,
            2026-07-05) — never promise 'included forever'. ── */}
        <section className="section-padding relative z-10">
          <InstrumentKeyframes />
          <div className="max-w-[960px] mx-auto">
            <div className="text-center mb-8 md:mb-10">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
                Included with your enrolment
              </span>
              <h2 className="text-2xl md:text-[2rem] font-bold tracking-tight text-[var(--foreground)] mb-3">
                Two clinical instruments, <span className="text-gradient">not just modules</span>
              </h2>
              <p className="text-sm md:text-base text-[var(--muted-foreground)] max-w-xl mx-auto">
                Enrol and your clinic code activates both instruments: prescribe
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
                  {/* ?landing=1 — this is a MARKETING link. Plain /sst-trainer resumes the
                      app for anyone with persisted state, so a returning clinician
                      clicking "see the patient app" from the homepage was dropped
                      straight into the tool instead of the page explaining it. */}
                  <Link href="/sst-trainer?landing=1" className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-bold text-teal-300 hover:text-teal-200">
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
                  {
                    value: `Up to ${CONFIG.COURSE.TOTAL_CPD_POINTS}`,
                    label: 'AHPRA-aligned CPD Hours',
                    sub: `${CONFIG.COURSE.ONLINE_CPD_POINTS} online + ${CONFIG.COURSE.IN_PERSON_CPD_POINTS} workshop`,
                  },
                  { value: `${CONFIG.COURSE.TOTAL_MODULES}`, label: 'Online Modules', sub: 'Interactive quizzes' },
                  { value: String(REFERENCE_COUNT), label: 'References', sub: 'Evidence-based' },
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
                      Finish it and get <span className="text-[var(--accent)]">${CONFIG.COURSE.SCAT_DISCOUNT_AUD} off</span> the full online course
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
                  {/* Second free course (module 104) — built + live at
                      /concussion-update but never surfaced publicly until
                      2026-08-04; homepage showed SCAT6 only. */}
                  <div className="mt-3 pt-3 border-t border-[rgba(13,115,119,0.15)]">
                    <Link href="/concussion-update" className="group inline-flex items-start gap-2 text-left">
                      <ArrowRight className="w-3.5 h-3.5 mt-[3px] text-[var(--accent)] shrink-0 transition-transform group-hover:translate-x-0.5" />
                      <span className="text-[13px] leading-snug text-[var(--foreground)]">
                        <span className="font-semibold">Also free: Concussion Care Has Changed</span>
                        <span className="text-[var(--muted-foreground)]"> — the ~1-hour update on the new first-line treatment every clinician needs.</span>
                      </span>
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
                    <p className="text-xs text-[var(--accent)] font-medium">{CONFIG.COURSE.IN_PERSON_CPD_POINTS} CPD Hours</p>
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
                  title: '21-day minimum stand-down',
                  desc: 'AIS/SMA guidance sets a minimum stand-down for youth and community sport, with structured return-to-play and medical clearance. Adopted by 30+ national sporting organisations.',
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


        {/* ── Who teaches it ───────────────────────────────
            The homepage named the instructor NOWHERE, and the only bio link on
            the whole portal sat in the footer pointing OFF-SITE to Squarespace.
            /about/zac-lewis — a full page with Person schema and AHPRA
            registration — took 2 sessions in 90 days against 182 on /pricing.

            It sits immediately before the testimonials on purpose: who taught
            it, then what people said about it. A solo-instructor clinical CPD
            product at $497–$1,190 is bought on the instructor, and this is a
            YMYL surface where E-E-A-T wants the credential visible rather than
            one click into the footer. */}
        <section className="section-padding relative z-10">
          <div className="max-w-[640px] mx-auto">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--foreground)] mb-6">
              Who teaches it
            </h2>
            <Link
              href="/about/zac-lewis"
              className="card rounded-2xl p-5 md:p-6 flex items-start gap-4 no-underline transition-shadow hover:shadow-md"
            >
              <Image
                src="/zac-lewis-headshot.jpg"
                alt="Zac Lewis"
                width={72}
                height={72}
                className="w-[72px] h-[72px] rounded-full object-cover flex-shrink-0 shadow-sm"
              />
              <div className="min-w-0">
                <div className="text-[15px] font-bold text-[var(--foreground)]">Zac Lewis</div>
                <div className="text-[12px] text-[var(--muted-foreground)] mb-1">
                  Founder &amp; Lead Educator &middot; B.Clin.Sci., M.Ost.Med
                </div>
                <div className="text-[11px] font-semibold text-[var(--accent)] mb-2">
                  AHPRA-registered Osteopath
                </div>
                <p className="text-[13px] text-[var(--muted-foreground)] leading-relaxed m-0">
                  Practising in concussion assessment and rehabilitation, and the clinician who
                  writes and delivers every module. CCM is endorsed by Osteopathy Australia.
                </p>
                <span className="inline-block mt-2.5 text-[12px] font-bold text-[var(--accent)]">
                  Full background and credentials &rarr;
                </span>
              </div>
            </Link>
          </div>
        </section>


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
                Up to {CONFIG.COURSE.TOTAL_CPD_POINTS} AHPRA-aligned CPD hours · Lifetime access · From ${CONFIG.COURSE.PRICE_ONLINE}
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
