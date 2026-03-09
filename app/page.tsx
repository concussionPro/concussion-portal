'use client'

import Link from 'next/link'
import { ArrowRight, Check, Star } from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { OrganizationSchema, CourseSchema } from '@/components/SchemaMarkup'
import { PricingOptions } from '@/components/PricingOptions'
import { SiteNav } from '@/components/SiteNav'
import { useAnalytics } from '@/hooks/useAnalytics'
import { trackShopClick } from '@/lib/analytics'

export default function HomePage() {

  useAnalytics()

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
              {CONFIG.COURSE.TOTAL_MODULES} evidence-based modules + full-day practical workshop. {CONFIG.COURSE.TOTAL_CPD_POINTS} AHPRA CPD points. The training Australian clinicians actually need.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <Link
                href="/pricing"
                className="btn-primary px-7 py-3.5 rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2"
              >
                See Pricing Options
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/preview"
                className="btn-secondary px-7 py-3.5 rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2"
              >
                Preview Course
              </Link>
            </div>

            <p className="text-[13px] text-[var(--muted-foreground)]">
              Or start with{' '}
              <Link
                href="/scat-mastery"
                className="text-[var(--accent)] font-medium hover:underline"
              >
                free SCAT6 training
              </Link>
              {' '}·{' '}
              <Link
                href="/scat-forms"
                className="text-[var(--accent)] font-medium hover:underline"
              >
                free SCAT forms
              </Link>
            </p>

            {/* Social proof strip */}
            {CONFIG.FEATURES.SHOW_SOCIAL_PROOF && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-8 pt-6 border-t border-[rgba(13,115,119,0.08)]">
                <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5">
                  <span className="font-semibold text-[var(--foreground)]">{CONFIG.SOCIAL_PROOF.SCAT_FORM_DOWNLOADS}+</span> SCAT6 forms downloaded by Australian clinicians
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">·</span>
                <span className="text-xs text-[var(--muted-foreground)]">Endorsed by <span className="font-semibold text-[var(--foreground)]">Osteopathy Australia</span></span>
              </div>
            )}
          </div>
        </section>


        {/* ── Stats bento grid ────────────────────────────── */}
        <section className="px-5 md:px-8 pb-16 md:pb-20 relative z-10">
          <div className="max-w-[760px] mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in-delay-1">
              {[
                { value: CONFIG.COURSE.TOTAL_CPD_POINTS.toString(), label: 'AHPRA CPD Points', sub: 'Aligned' },
                { value: '8', label: 'Online Modules', sub: '8 CPD points' },
                { value: '1 Day', label: 'Practical Workshop', sub: '6 CPD points' },
                { value: Object.values(CONFIG.LOCATIONS).filter(l => l.status === 'confirmed').length.toString(), label: 'Locations', sub: Object.values(CONFIG.LOCATIONS).filter(l => l.status === 'confirmed').map(l => l.city).join(' + ') || 'Coming soon' },
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
                    Master SCAT6 &amp; SCOAT6 in 2 hours. Red flags, documentation, step-by-step protocols. 2 AHPRA CPD points + certificate.
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
                    '2 CPD points + certificate',
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
                What many clinicians <span className="text-gradient">overlook</span>
              </h2>
              <p className="text-sm md:text-base text-[var(--muted-foreground)] max-w-md mx-auto">
                Convergence insufficiency, vestibular dysfunction, cervicogenic factors. Learn to identify them all.
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
                    'Lifetime access to course materials',
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


        {/* ── Divider ──────────────────────────────────────── */}
        <div className="max-w-[860px] mx-auto px-5 md:px-8">
          <div className="divider" />
        </div>


        {/* ── Pricing ──────────────────────────────────────── */}
        <section className="section-padding relative z-10">
          <div className="max-w-[860px] mx-auto">
            <PricingOptions variant="full" />
          </div>
        </section>


        {/* ── Divider ──────────────────────────────────────── */}
        <div className="max-w-[860px] mx-auto px-5 md:px-8">
          <div className="divider" />
        </div>


        {/* ── FAQ ──────────────────────────────────────────── */}
        <section className="section-padding relative z-10">
          <div className="max-w-[640px] mx-auto">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--foreground)] mb-6">
              Common Questions
            </h2>

            <div className="space-y-2.5">
              {[
                {
                  q: 'When do I get access to the online modules?',
                  a: 'Immediately after enrollment. Complete them at your own pace before your chosen in-person workshop date.',
                },
                {
                  q: 'Can I change my workshop date or location?',
                  a: 'Yes — you have full flexibility to attend any available workshop date. Reschedule at no charge, subject to availability.',
                },
                {
                  q: 'Do I need to complete modules before the workshop?',
                  a: 'Yes — the practical workshop builds on concepts from the online modules. We recommend completing all 8 modules before your workshop date.',
                },
                {
                  q: `What's included in the $${new Date() < CONFIG.EARLY_BIRD_DEADLINE ? CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString() : CONFIG.COURSE.PRICE_REGULAR.toLocaleString()} enrollment?`,
                  a: 'Everything: 8 online modules (lifetime access), full-day practical workshop at your chosen location, all materials and workbook, and your 14 AHPRA-aligned CPD points certificate upon completion.',
                },
              ].map((faq, i) => (
                <details key={i} className="card rounded-xl group">
                  <summary className="text-sm font-semibold text-[var(--foreground)] cursor-pointer list-none flex items-center justify-between gap-4 select-none px-5 py-4">
                    {faq.q}
                    <span className="text-[var(--accent)] text-lg shrink-0 group-open:rotate-45 transition-transform duration-200">+</span>
                  </summary>
                  <p className="text-[13px] text-[var(--muted-foreground)] px-5 pb-4 -mt-1 leading-relaxed pr-10">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>

            <p className="text-[13px] text-[var(--muted-foreground)] mt-6">
              More questions? Email{' '}
              <a href={`mailto:${CONFIG.CONTACT_EMAIL}`} className="text-[var(--accent)] font-medium hover:underline">
                {CONFIG.CONTACT_EMAIL}
              </a>
            </p>
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

            <div className="grid gap-4">
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
                {CONFIG.COURSE.TOTAL_CPD_POINTS} AHPRA CPD points · Lifetime access
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
                <a
                  href={CONFIG.SHOP_URL}
                  onClick={() => trackShopClick('footer-cta')}
                  className="bg-white text-[var(--foreground)] px-7 py-3.5 rounded-xl text-[15px] font-semibold inline-flex items-center gap-2 hover:bg-white/90 transition-colors shadow-lg"
                >
                  Enroll Now
                  <ArrowRight className="w-4 h-4" />
                </a>
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
