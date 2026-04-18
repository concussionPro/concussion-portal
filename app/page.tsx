'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Check, Star, ShieldCheck } from 'lucide-react'
import { CONFIG, afterpayInstalment } from '@/lib/config'
import { OrganizationSchema, CourseSchema, BreadcrumbSchema } from '@/components/SchemaMarkup'
import { SiteNav } from '@/components/SiteNav'
import { trackShopClick } from '@/lib/analytics'

export default function HomePage() {

  return (
    <>
      <OrganizationSchema />
      <CourseSchema />

      <div className="min-h-screen bg-[var(--background)] relative">

        {/* ── Ambient gradient wash behind hero ──────────── */}
        <div className="absolute inset-0 hero-gradient pointer-events-none" aria-hidden="true" />
        <div className="ambient-glow -top-[200px] left-1/2 -translate-x-1/2" aria-hidden="true" />

        {/* ── Nav ──────────────────────────────────────────── */}
        <SiteNav />


        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="pt-[140px] md:pt-[180px] pb-12 md:pb-16 px-5 md:px-8 relative z-10">
          <div className="max-w-[720px] mx-auto animate-fade-in">

            {/* Badge */}
            <div className="badge mb-6">
              {CONFIG.COURSE.CPD_BADGE_TEXT}
            </div>

            {/* Headline */}
            <h1 className="text-[2.25rem] md:text-[3.25rem] leading-[1.1] font-bold tracking-[-0.03em] text-[var(--foreground)] mb-5">
              Stop guessing.{' '}
              <span className="text-gradient">
                Master concussion management.
              </span>
            </h1>

            {/* Subhead */}
            <p className="text-base md:text-lg text-[var(--muted-foreground)] leading-relaxed mb-8 max-w-[560px]">
              Australia&apos;s most comprehensive concussion CPD. {CONFIG.COURSE.TOTAL_MODULES} online modules + hands-on SCAT6, VOMS &amp; BESS training. Up to {CONFIG.COURSE.TOTAL_CPD_POINTS} CPD points.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
              <Link
                href="/scat-mastery"
                className="btn-primary px-8 py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                Start Free SCAT6 Course
                <ArrowRight className="w-4.5 h-4.5" />
              </Link>
              <Link
                href="/pricing"
                className="px-6 py-3 rounded-xl text-sm font-semibold text-[var(--foreground)] bg-white/80 border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                Compare Pricing
              </Link>
              <Link
                href="/preview"
                className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
              >
                Preview course content
              </Link>
            </div>

            <p className="text-sm text-muted-foreground mt-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              7-day money-back guarantee — try risk-free
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              From ${CONFIG.COURSE.PRICE_ONLINE} (or 4 x ${afterpayInstalment(CONFIG.COURSE.PRICE_ONLINE)} with Afterpay)
            </p>
            {new Date() < new Date(CONFIG.WORKSHOP.EARLY_BIRD_DEADLINE + 'T23:59:59') && (
              <p className="text-sm text-slate-500 mt-1">
                Early bird pricing available — ends {new Date(CONFIG.WORKSHOP.EARLY_BIRD_DEADLINE + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}

            {CONFIG.LOCATIONS.MELBOURNE.status === 'confirmed' && (
              <Link
                href="/courses/melbourne"
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm hover:bg-orange-100 transition-colors"
              >
                <span className="inline-flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" aria-hidden="true" />
                <span className="font-semibold text-orange-900">Melbourne workshop confirmed — {CONFIG.LOCATIONS.MELBOURNE.date}</span>
                <span className="text-orange-800">Melbourne CBD · catering included</span>
                <ArrowRight className="w-4 h-4 text-orange-700" aria-hidden="true" />
              </Link>
            )}

            <p className="text-[13px] text-[var(--muted-foreground)] mt-3">
              <Link
                href="/scat-forms"
                className="text-[var(--accent)] font-medium hover:underline"
              >
                Free SCAT forms
              </Link>
            </p>

            {/* Social proof strip */}
            {CONFIG.FEATURES.SHOW_SOCIAL_PROOF && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-8 pt-6 border-t border-[rgba(13,115,119,0.08)]">
                <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5">
                  <span className="font-semibold text-[var(--foreground)]">{CONFIG.SOCIAL_PROOF.SCAT_FORM_DOWNLOADS}+</span> SCAT6 forms downloaded by Australian clinicians
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">·</span>
                <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5">
                  <Image src="/osteopathy-australia-endorsed.png" alt="" width={22} height={20} className="h-5 w-auto" aria-hidden="true" />
                  <span>Endorsed by <span className="font-semibold text-[var(--foreground)]">Osteopathy Australia</span></span>
                </span>
              </div>
            )}
          </div>
        </section>


        {/* ── Stats bento grid ────────────────────────────── */}
        <section className="px-5 md:px-8 pb-16 md:pb-20 relative z-10">
          <div className="max-w-[760px] mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in-delay-1">
              {[
                { value: 'Up to 14', label: 'AHPRA CPD Points', sub: '8 online + 6 workshop' },
                { value: '8', label: 'Online Modules', sub: 'Interactive quizzes' },
                { value: '140+', label: 'References', sub: 'Evidence-based' },
              ].map((stat) => (
                <div key={stat.label} className="stat-tile text-center">
                  <div className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--accent)] mb-1">
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
              <div className="stat-tile flex items-center justify-center p-3">
                <Image
                  src="/osteopathy-australia-endorsed.png"
                  alt="Osteopathy Australia Endorsed Course"
                  width={108} height={96}
                  className="h-20 md:h-24 w-auto"
                />
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
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-4">
                    Master SCAT6 &amp; SCOAT6 in ~1 hour. Red flags, documentation, step-by-step protocols. Free, no credit card required.
                  </p>
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
                    <p className="text-xs text-[var(--accent)] font-medium">8 CPD Points</p>
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
                    <p className="text-xs text-[var(--accent)] font-medium">6 CPD Points</p>
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
                Up to {CONFIG.COURSE.TOTAL_CPD_POINTS} AHPRA CPD points · Lifetime access · From ${CONFIG.COURSE.PRICE_ONLINE} · Early bird pricing available
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
