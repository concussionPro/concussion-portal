'use client'

import { useRouter } from 'next/navigation'
import { Award, ArrowRight, Brain, Zap, Target, Shield, Sparkles, Menu, X, Star, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { OrganizationSchema, CourseSchema } from '@/components/SchemaMarkup'
import CountdownTimer from '@/components/CountdownTimer'
import SpotsRemaining from '@/components/SpotsRemaining'
import { PricingOptions } from '@/components/PricingOptions'
import { useState } from 'react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { trackShopClick } from '@/lib/analytics'

export default function HomePage() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  useAnalytics() // Track page views

  return (
    <>
      {/* Schema Markup for SEO */}
      <OrganizationSchema />
      <CourseSchema />

      {/* Animated mesh gradient background */}
      <div className="mesh-gradient" aria-hidden="true" />
      <div className="noise-overlay" aria-hidden="true" />

      {/* Floating orbs */}
      <div className="floating-orb floating-orb-1" aria-hidden="true" />
      <div className="floating-orb floating-orb-2" aria-hidden="true" />
      <div className="floating-orb floating-orb-3" aria-hidden="true" />

      <div className="min-h-screen relative">
        {/* Nav - floating glass with mobile menu */}
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 glass rounded-full px-6 py-3 w-[95%] max-w-5xl" role="navigation" aria-label="Main navigation">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex flex-col focus:outline-none focus:ring-2 focus:ring-accent rounded"
              aria-label="ConcussionPro home"
            >
              <div className="text-lg font-bold tracking-tight">
                Concussion<span className="text-gradient">Pro</span>
              </div>
              <div className="text-xs text-slate-500 tracking-wide">
                Concussion Education Australia
              </div>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => router.push('/scat-forms')}
                className="text-sm text-accent hover:text-accent/80 transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-accent rounded px-2 py-1"
                aria-label="Free SCAT forms"
              >
                SCAT Forms
              </button>
              <button
                onClick={() => router.push('/preview')}
                className="text-sm text-slate-600 hover:text-slate-800 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-accent rounded px-2 py-1"
                aria-label="Preview course content"
              >
                Preview
              </button>
              <button
                onClick={() => router.push('/login')}
                className="text-sm text-slate-600 hover:text-slate-800 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-accent rounded px-2 py-1"
                aria-label="Login to your account"
              >
                Login
              </button>
              <a
                href={CONFIG.SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackShopClick('nav-desktop')}
                className="btn-primary px-6 py-2 rounded-full text-sm inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-accent"
                aria-label="Enroll in course"
              >
                Enroll
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 focus:outline-none focus:ring-2 focus:ring-accent rounded"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-700" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6 text-slate-700" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-slate-200 space-y-3">
              <button
                onClick={() => {
                  router.push('/scat-forms')
                  setMobileMenuOpen(false)
                }}
                className="block w-full text-left text-sm text-accent hover:text-accent/80 transition-colors py-2 focus:outline-none focus:ring-2 focus:ring-accent rounded px-2 font-semibold"
              >
                SCAT Forms (Free)
              </button>
              <button
                onClick={() => {
                  router.push('/preview')
                  setMobileMenuOpen(false)
                }}
                className="block w-full text-left text-sm text-slate-700 hover:text-accent transition-colors py-2 focus:outline-none focus:ring-2 focus:ring-accent rounded px-2"
              >
                Preview Course
              </button>
              <button
                onClick={() => {
                  router.push('/login')
                  setMobileMenuOpen(false)
                }}
                className="block w-full text-left text-sm text-slate-700 hover:text-accent transition-colors py-2 focus:outline-none focus:ring-2 focus:ring-accent rounded px-2"
              >
                Login
              </button>
              <a
                href={CONFIG.SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full btn-primary px-6 py-3 rounded-xl text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-accent"
                onClick={() => setMobileMenuOpen(false)}
              >
                Enroll Now
              </a>
            </div>
          )}
        </nav>

        {/* HERO - Compact */}
        <section className="section-padding pt-32 md:pt-40 pb-12 relative z-10">
          <div className="container-lg px-6 md:px-8 text-center">
            <div className="animate-fade-in max-w-4xl mx-auto">
              {/* Glowing badge */}
              <div className="badge mb-5 animate-pulse-glow relative z-10">
                <Award className="w-4 h-4 mr-2" aria-hidden="true" />
                {CONFIG.COURSE.TOTAL_CPD_HOURS} AHPRA CPD Hours · AHPRA Accredited Training
              </div>

              {/* Compact animated gradient headline */}
              <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight leading-[1.15]">
                Stop second-guessing concussion cases.
                <br />
                <span className="text-gradient text-4xl md:text-6xl">
                  Master clinical confidence.
                </span>
              </h1>

              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-2 leading-relaxed">
                Complete training program: {CONFIG.COURSE.TOTAL_MODULES} online modules + full-day hands-on workshop.
              </p>

              <p className="text-sm text-slate-600 max-w-2xl mx-auto mb-6">
                One price includes both online learning and in-person practical training at your chosen location.
              </p>

              {/* Primary CTAs - Focus on Course */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
                <button
                  onClick={() => router.push('/preview')}
                  className="btn-primary px-10 py-4 rounded-xl text-base font-bold flex items-center gap-2 w-full sm:w-auto shadow-2xl focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                  aria-label="Preview course content"
                >
                  <Sparkles className="w-5 h-5" aria-hidden="true" />
                  Preview Course
                </button>
                <a
                  href={CONFIG.SHOP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackShopClick('hero-cta')}
                  className="btn-primary px-10 py-4 rounded-xl text-base font-bold flex items-center gap-2 w-full sm:w-auto shadow-2xl focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                  aria-label="Enroll in course"
                >
                  Enroll Now
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </a>
              </div>

              {/* Secondary link to SCAT Forms */}
              <div className="text-center mb-4">
                <button
                  onClick={() => router.push('/scat-forms')}
                  className="text-sm text-slate-600 hover:text-accent transition-colors font-medium underline focus:outline-none focus:ring-2 focus:ring-accent rounded px-2 py-1"
                  aria-label="Access free SCAT6 and SCOAT6 forms"
                >
                  Or access free SCAT6/SCOAT6 forms
                </button>
              </div>

              {/* Stats - glowing cards with breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
                {[
                  { value: '8', label: 'Online Modules', sublabel: '8 CPD hrs' },
                  { value: '1 Day', label: 'In-Person', sublabel: '6 CPD hrs' },
                  { value: CONFIG.COURSE.TOTAL_CPD_HOURS.toString(), label: 'Total CPD', sublabel: 'AHPRA Accredited', highlight: true },
                  { value: '3', label: 'Locations', sublabel: 'Melb/Syd/Byron' },
                ].map((stat, i) => (
                  <div
                    key={stat.label}
                    className={`glass rounded-xl p-4 ${stat.highlight ? 'border-2 border-accent/30' : ''}`}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className={`text-2xl md:text-3xl font-bold mb-1 ${stat.highlight ? 'text-accent' : 'text-gradient'}`}>
                      {stat.value}
                    </div>
                    <div className="text-xs text-foreground font-semibold mb-0.5">{stat.label}</div>
                    <div className="text-xs text-muted-foreground">{stat.sublabel}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trust Markers Bar */}
        <section className="py-8 bg-gradient-to-r from-blue-50 via-slate-50 to-teal-50 border-y border-slate-200">
          <div className="container-lg px-6 md:px-8">
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {/* AHPRA Accredited */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5b9aa6] to-[#6b9da8] flex items-center justify-center shadow-md">
                  <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">AHPRA Accredited</div>
                  <div className="text-xs text-slate-600">14 CPD Hours</div>
                </div>
              </div>

              {/* Professional Development */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                  <Award className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Certificate of Completion</div>
                  <div className="text-xs text-slate-600">Digital & PDF</div>
                </div>
              </div>

              {/* Lifetime Access */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                  <Clock className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Lifetime Access</div>
                  <div className="text-xs text-slate-600">All Future Updates</div>
                </div>
              </div>

              {/* Expert Support */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Expert Developed</div>
                  <div className="text-xs text-slate-600">15+ Years Experience</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Options - Strategic Placement */}
        <section className="section-padding relative bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="container-lg px-6 md:px-8 relative z-10">
            <PricingOptions variant="full" />
          </div>
        </section>

        {/* What's Included - Two-Part Training */}
        <section className="section-padding relative">
          <div className="container-lg px-6 md:px-8 relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-4xl font-bold mb-3 tracking-tight">
                Complete Training <span className="text-gradient">Package</span>
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                One enrollment includes both online learning and hands-on practical training
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
              {/* Online Component */}
              <div className="glass rounded-2xl p-6 border-2 border-accent/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Online Modules</h3>
                    <p className="text-sm text-accent font-semibold">8 CPD Hours</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">✓</span>
                    <span>8 comprehensive modules with interactive quizzes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">✓</span>
                    <span>Evidence-based protocols and clinical frameworks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">✓</span>
                    <span>Lifetime access to course materials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">✓</span>
                    <span>Downloadable resources and flowcharts</span>
                  </li>
                </ul>
              </div>

              {/* In-Person Component */}
              <div className="glass rounded-2xl p-6 border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Full-Day Practical</h3>
                    <p className="text-sm text-accent font-semibold">6 CPD Hours</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">✓</span>
                    <span>Hands-on SCAT6, VOMS & BESS protocols</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">✓</span>
                    <span>Small group practice with live feedback</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">✓</span>
                    <span>Real-world case studies and clinical scenarios</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">✓</span>
                    <span>Choose your location: Melbourne, Sydney, or Byron Bay ·
                      <button
                        onClick={() => router.push('/in-person')}
                        className="text-accent hover:underline font-semibold ml-1"
                      >
                        View agenda
                      </button>
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Value props - card grid with 3D effect */}
        <section className="section-padding relative">
          <div className="container-lg px-6 md:px-8 relative z-10">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-4xl font-bold mb-3 tracking-tight">
                What 40-50% of clinicians <span className="text-gradient">miss</span>
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Convergence insufficiency, vestibular dysfunction, cervicogenic factors. Learn to identify them all.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-3 max-w-5xl mx-auto">
              {[
                {
                  icon: Brain,
                  title: 'SCAT6 & VOMS',
                  description: 'Hands-on protocols. Identify findings others miss.',
                  color: 'from-blue-500 to-cyan-500',
                },
                {
                  icon: Target,
                  title: 'Clinical Frameworks',
                  description: 'Return-to-play, work, school. Legal protection.',
                  color: 'from-cyan-500 to-teal-500',
                },
                {
                  icon: Shield,
                  title: 'Risk Management',
                  description: 'Red flags, differential diagnosis, AHPRA docs.',
                  color: 'from-teal-500 to-emerald-500',
                },
              ].map((item, i) => (
                <div
                  key={item.title}
                  className="glass rounded-xl p-5 group hover:scale-105 transition-transform"
                >
                  <div className={`w-12 h-12 rounded-lg mb-4 bg-gradient-to-br ${item.color} flex items-center justify-center`} aria-hidden="true">
                    <item.icon className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-bold mb-2 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ - Conversion-Focused Only */}
        <section className="section-padding relative">
          <div className="container-md px-6 md:px-8 relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
                Common Questions
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {[
                {
                  q: 'When do I get access to the online modules?',
                  a: 'Immediately after enrollment. Complete them at your own pace before your chosen in-person workshop date.',
                },
                {
                  q: 'Can I change my workshop date or location?',
                  a: 'Yes - you have full flexibility to attend any workshop date in Melbourne, Sydney, or Byron Bay. You can reschedule to a different date at no charge (subject to availability).',
                },
                {
                  q: 'Do I need to complete the online modules before the workshop?',
                  a: 'Yes - the practical workshop builds on concepts from the online modules. We recommend completing all 8 modules before your workshop date.',
                },
                {
                  q: 'What\'s included in the $1,190 enrollment?',
                  a: 'Everything: 8 online modules (lifetime access), full-day practical workshop at your chosen location, all materials and workbook, and your 14 AHPRA CPD certificate upon completion.',
                },
              ].map((faq, i) => (
                <details key={i} className="glass rounded-xl p-6 group">
                  <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                    <span>{faq.q}</span>
                    <span className="text-accent text-xl group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              More questions? Email <a href={`mailto:${CONFIG.CONTACT_EMAIL}`} className="text-accent hover:underline font-semibold">{CONFIG.CONTACT_EMAIL}</a>
            </p>
          </div>
        </section>

        {/* Final CTA - Focus on Course Value */}
        <section className="section-padding pb-16 relative">
          <div className="container-md px-6 md:px-8 text-center relative z-10">
            <div className="glass rounded-2xl p-8 md:p-10 relative overflow-hidden bg-gradient-to-br from-blue-600/5 to-teal-600/5">
              <div className="relative z-10">
                <h2 className="text-2xl md:text-4xl font-bold mb-4 tracking-tight">
                  Ready to master evidence-based <span className="text-gradient">concussion management?</span>
                </h2>
                <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-xl mx-auto leading-relaxed">
                  Training available in {CONFIG.LOCATIONS.MELBOURNE.city}, {CONFIG.LOCATIONS.SYDNEY.city}, and {CONFIG.LOCATIONS.BYRON_BAY.city}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
                  <button
                    onClick={() => router.push('/preview')}
                    className="btn-primary px-10 py-4 rounded-xl text-base font-bold flex items-center gap-2 w-full sm:w-auto shadow-2xl focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                  >
                    <Sparkles className="w-5 h-5" aria-hidden="true" />
                    View Course Details
                  </button>
                  <a
                    href={CONFIG.SHOP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary px-10 py-4 rounded-xl text-base font-bold flex items-center gap-2 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                    aria-label="Enroll in course"
                  >
                    Enroll Now
                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  </a>
                </div>
                <p className="text-xs text-muted-foreground">
                  {CONFIG.COURSE.TOTAL_CPD_HOURS} AHPRA CPD Hours · Lifetime access · Online + practical training
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 px-6 border-t border-border/30 relative z-10" role="contentinfo">
          <div className="container-xl text-center">
            <p className="text-xs text-muted-foreground">
              © 2026 Concussion Education Australia · {CONFIG.CONTACT_EMAIL}
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
