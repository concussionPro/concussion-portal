'use client'

import { useRouter } from 'next/navigation'
import { Award, ArrowRight, Brain, Zap, Target, Shield, Sparkles, Menu, X, Star, Clock, AlertTriangle, CheckCircle2, BookOpen, Users, MapPin, GraduationCap, FileCheck, TrendingUp } from 'lucide-react'
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
                onClick={() => router.push('/scat-mastery')}
                className="text-sm text-teal-600 hover:text-teal-700 transition-colors font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 rounded px-2 py-1"
                aria-label="Free SCAT training"
              >
                Free Training
              </button>
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
                  router.push('/scat-mastery')
                  setMobileMenuOpen(false)
                }}
                className="block w-full text-left text-sm text-teal-600 hover:text-teal-700 transition-colors py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded px-2 font-bold"
              >
                Free SCAT Training
              </button>
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
                className="block w-full btn-primary px-6 py-3 rounded-xl text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-accent"
                onClick={() => setMobileMenuOpen(false)}
              >
                Enroll Now
              </a>
            </div>
          )}
        </nav>

        {/* HERO - Premium with bento stat cards */}
        <section className="section-padding pt-72 md:pt-80 pb-8 relative z-10">
          <div className="container-lg px-6 md:px-8 text-center">
            <div className="animate-fade-in max-w-4xl mx-auto">
              {/* Glowing badge */}
              <div className="badge mb-5 animate-pulse-glow mt-8">
                <Award className="w-4 h-4 mr-2" aria-hidden="true" />
                {CONFIG.COURSE.CPD_BADGE_TEXT}
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

              <p className="text-sm text-slate-600 max-w-2xl mx-auto mb-8">
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
                  onClick={() => trackShopClick('hero-cta')}
                  className="btn-primary px-10 py-4 rounded-xl text-base font-bold flex items-center gap-2 w-full sm:w-auto shadow-2xl focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                  aria-label="Enroll in course"
                >
                  Enroll Now
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </a>
              </div>

              {/* Secondary link to SCAT Forms */}
              <div className="text-center mb-8">
                <button
                  onClick={() => router.push('/scat-forms')}
                  className="text-sm text-slate-600 hover:text-accent transition-colors font-medium underline focus:outline-none focus:ring-2 focus:ring-accent rounded px-2 py-1"
                  aria-label="Access free SCAT6 and SCOAT6 forms"
                >
                  Or access free SCAT6/SCOAT6 forms
                </button>
              </div>
            </div>

            {/* BENTO STAT GRID - colored gradient cards, mixed sizes */}
            <div className="home-bento max-w-4xl mx-auto">
              {/* Wide teal card - Total CPD (hero stat) */}
              <div className="home-bento-wide glass-color glass-teal inner-glow inner-glow-teal p-6 flex flex-col justify-between min-h-[160px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white/30 backdrop-blur-sm flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-teal-700" />
                  </div>
                  <span className="text-xs font-semibold text-teal-700/80 uppercase tracking-wider">Total CPD Hours</span>
                </div>
                <div className="relative z-10">
                  <div className="text-5xl md:text-6xl font-bold text-teal-800/90 tracking-tight leading-none mb-1">
                    {CONFIG.COURSE.TOTAL_CPD_HOURS}
                  </div>
                  <div className="text-sm font-medium text-teal-700/70">AHPRA Accredited</div>
                </div>
              </div>

              {/* Rose card - Online Modules */}
              <div className="glass-color glass-rose inner-glow inner-glow-rose p-5 flex flex-col justify-between min-h-[160px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white/30 backdrop-blur-sm flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-rose-700" />
                  </div>
                  <span className="text-xs font-semibold text-rose-700/80 uppercase tracking-wider">Online</span>
                </div>
                <div className="relative z-10">
                  <div className="text-4xl md:text-5xl font-bold text-rose-800/90 tracking-tight leading-none mb-1">8</div>
                  <div className="text-sm font-medium text-rose-700/70">Modules · 8 CPD hrs</div>
                </div>
              </div>

              {/* Cobalt card - In-Person */}
              <div className="glass-color glass-cobalt inner-glow inner-glow-cobalt p-5 flex flex-col justify-between min-h-[160px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white/30 backdrop-blur-sm flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-700" />
                  </div>
                  <span className="text-xs font-semibold text-blue-700/80 uppercase tracking-wider">Practical</span>
                </div>
                <div className="relative z-10">
                  <div className="text-4xl md:text-5xl font-bold text-blue-800/90 tracking-tight leading-none mb-1">1 Day</div>
                  <div className="text-sm font-medium text-blue-700/70">In-Person · 6 CPD hrs</div>
                </div>
              </div>

              {/* Amber card - Locations */}
              <div className="glass-color glass-amber inner-glow inner-glow-amber p-5 flex flex-col justify-between min-h-[160px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white/30 backdrop-blur-sm flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-amber-700" />
                  </div>
                  <span className="text-xs font-semibold text-amber-700/80 uppercase tracking-wider">Locations</span>
                </div>
                <div className="relative z-10">
                  <div className="text-4xl md:text-5xl font-bold text-amber-800/90 tracking-tight leading-none mb-1">3</div>
                  <div className="text-sm font-medium text-amber-700/70">Melb / Syd / Byron</div>
                </div>
              </div>

              {/* Emerald card - Certificate */}
              <div className="glass-color glass-emerald p-5 flex flex-col justify-between min-h-[160px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white/30 backdrop-blur-sm flex items-center justify-center">
                    <FileCheck className="w-4 h-4 text-emerald-700" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-700/80 uppercase tracking-wider">Certificate</span>
                </div>
                <div className="relative z-10">
                  <div className="text-2xl font-bold text-emerald-800/90 tracking-tight leading-tight mb-1">Digital &amp; PDF</div>
                  <div className="text-sm font-medium text-emerald-700/70">Completion Certificate</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FREE SCAT Mastery Banner - Lead Magnet */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/90 via-blue-500/85 to-emerald-500/90"></div>
          <div className="absolute inset-0 backdrop-blur-sm"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22><filter id=%22noise%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 /><feColorMatrix type=%22saturate%22 values=%220%22/></filter><rect width=%22300%22 height=%22300%22 filter=%22url(%23noise)%22 opacity=%220.05%22/></svg>')] opacity-30"></div>
          <div className="container-lg px-6 md:px-8 relative z-10">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
              {/* Left: Text content */}
              <div className="flex-1 text-center md:text-left">
                <div className="inline-block bg-white/15 backdrop-blur-md px-4 py-2 rounded-full text-sm font-semibold mb-4 text-white border border-white/20">
                  100% FREE - No Credit Card Required
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                  Start with FREE SCAT6/SCOAT6 Mastery
                </h2>
                <p className="text-base md:text-lg mb-6 text-white/85 max-w-xl leading-relaxed">
                  Master SCAT6 &amp; SCOAT6 in 2 hours. Step-by-step training on every section, red flags, and medicolegal documentation. <strong className="text-white">2 AHPRA CPD hours + certificate.</strong>
                </p>
                <div className="flex flex-col sm:flex-row items-center md:items-start gap-3">
                  <button
                    onClick={() => router.push('/scat-mastery')}
                    className="bg-white text-teal-700 px-8 py-4 rounded-xl text-base font-bold hover:bg-teal-50 transition-all shadow-2xl flex items-center gap-2 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                    aria-label="Start free SCAT Mastery course"
                  >
                    Get Free Course
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => router.push('/scat-forms')}
                    className="bg-white/10 backdrop-blur-md text-white border border-white/30 px-8 py-4 rounded-xl text-base font-bold hover:bg-white/20 transition-all flex items-center gap-2 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                    aria-label="Access free SCAT forms"
                  >
                    Free SCAT Forms
                  </button>
                </div>
              </div>
              {/* Right: Glass feature card */}
              <div className="w-full md:w-80 shrink-0">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
                  <div className="space-y-4">
                    {[
                      { icon: BookOpen, text: 'SCAT6 & SCOAT6 deep-dive' },
                      { icon: FileCheck, text: 'Red flag identification' },
                      { icon: Shield, text: 'Medicolegal documentation' },
                      { icon: GraduationCap, text: '2 CPD hours + certificate' },
                    ].map((item) => (
                      <div key={item.text} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                          <item.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-white/90">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Markers - Bento colored cards */}
        <section className="py-10 relative z-10">
          <div className="container-lg px-6 md:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* AHPRA */}
              <div className="glass-color glass-teal p-5 text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg mx-auto mb-3">
                  <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="text-sm font-bold text-slate-900">AHPRA Accredited</div>
                <div className="text-xs text-slate-600 mt-0.5">{CONFIG.COURSE.TOTAL_CPD_HOURS} CPD Hours</div>
              </div>

              {/* Certificate */}
              <div className="glass-color glass-amber p-5 text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg mx-auto mb-3">
                  <Award className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="text-sm font-bold text-slate-900">Certificate</div>
                <div className="text-xs text-slate-600 mt-0.5">Digital &amp; PDF</div>
              </div>

              {/* Lifetime */}
              <div className="glass-color glass-emerald p-5 text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg mx-auto mb-3">
                  <Clock className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="text-sm font-bold text-slate-900">Lifetime Access</div>
                <div className="text-xs text-slate-600 mt-0.5">All Future Updates</div>
              </div>

              {/* Expert */}
              <div className="glass-color glass-cobalt p-5 text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="text-sm font-bold text-slate-900">Expert Developed</div>
                <div className="text-xs text-slate-600 mt-0.5">15+ Years Experience</div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Options - Strategic Placement */}
        <section className="section-padding relative">
          <div className="container-lg px-6 md:px-8 relative z-10">
            <PricingOptions variant="full" />
          </div>
        </section>

        {/* What's Included - Two-Part Training with colored cards */}
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

            <div className="grid md:grid-cols-2 gap-4 max-w-5xl mx-auto mb-12">
              {/* Online Component - cobalt tinted glass */}
              <div className="glass-color glass-cobalt p-6 relative">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <Brain className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Online Modules</h3>
                    <p className="text-sm text-blue-700 font-semibold">8 CPD Hours</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-slate-700">
                  {[
                    '8 comprehensive modules with interactive quizzes',
                    'Evidence-based protocols and clinical frameworks',
                    'Lifetime access to course materials',
                    'Downloadable resources and flowcharts',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-blue-700" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* In-Person Component - emerald tinted glass */}
              <div className="glass-color glass-emerald p-6 relative">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg">
                    <Target className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Full-Day Practical</h3>
                    <p className="text-sm text-emerald-700 font-semibold">6 CPD Hours</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-slate-700">
                  {[
                    'Hands-on SCAT6, VOMS & BESS protocols',
                    'Small group practice with live feedback',
                    'Real-world case studies and clinical scenarios',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    </span>
                    <span>
                      Choose your location: Melbourne, Sydney, or Byron Bay ·
                      <button
                        onClick={() => router.push('/in-person')}
                        className="text-emerald-700 hover:underline font-semibold ml-1"
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

        {/* Value props - colored glass bento cards */}
        <section className="section-padding relative">
          <div className="container-lg px-6 md:px-8 relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-4xl font-bold mb-3 tracking-tight">
                What 40-50% of clinicians <span className="text-gradient">miss</span>
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Convergence insufficiency, vestibular dysfunction, cervicogenic factors. Learn to identify them all.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {[
                {
                  icon: Brain,
                  title: 'SCAT6 & VOMS',
                  description: 'Hands-on protocols. Identify findings others miss.',
                  color: 'glass-cobalt',
                  iconBg: 'from-blue-500 to-cyan-500',
                },
                {
                  icon: Target,
                  title: 'Clinical Frameworks',
                  description: 'Return-to-play, work, school. Legal protection.',
                  color: 'glass-teal',
                  iconBg: 'from-cyan-500 to-teal-500',
                },
                {
                  icon: Shield,
                  title: 'Risk Management',
                  description: 'Red flags, differential diagnosis, AHPRA docs.',
                  color: 'glass-emerald',
                  iconBg: 'from-teal-500 to-emerald-500',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className={`glass-color ${item.color} p-6 group`}
                >
                  <div className={`w-12 h-12 rounded-xl mb-4 bg-gradient-to-br ${item.iconBg} flex items-center justify-center shadow-lg`} aria-hidden="true">
                    <item.icon className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-bold mb-2 tracking-tight text-slate-900">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
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

            <div className="max-w-3xl mx-auto space-y-3">
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
                  q: "What's included in the $1,190 enrollment?",
                  a: 'Everything: 8 online modules (lifetime access), full-day practical workshop at your chosen location, all materials and workbook, and your 14 AHPRA CPD certificate upon completion.',
                },
              ].map((faq, i) => (
                <details key={i} className="glass-color glass-teal p-5 group cursor-pointer">
                  <summary className="font-semibold list-none flex items-center justify-between text-slate-900">
                    <span>{faq.q}</span>
                    <span className="text-accent text-xl group-open:rotate-45 transition-transform ml-4 shrink-0">+</span>
                  </summary>
                  <p className="text-sm text-slate-600 mt-3 leading-relaxed">
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

        {/* Testimonials - colored glass cards */}
        <section className="section-padding relative">
          <div className="container-md px-6 md:px-8 relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
                What clinicians are <span className="text-gradient">saying</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              <div className="glass-color glass-rose p-6">
                <div className="flex gap-1 mb-3" aria-label="5 star rating">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed mb-4">
                  &ldquo;Before this training, our approach to concussion cases was uncertain. Now, my team has the confidence and proven skills to diagnose and manage them with clarity and accuracy.&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">A</div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Andy</div>
                    <div className="text-xs text-slate-600">Clinic Owner, NSW</div>
                  </div>
                </div>
              </div>
              <div className="glass-color glass-cobalt p-6">
                <div className="flex gap-1 mb-3" aria-label="5 star rating">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed mb-4">
                  &ldquo;An outstanding blend of evidence-based knowledge and practical skills. The clinically relevant testing covered is directly applicable to concussion diagnosis and management in real-world settings.&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">D</div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Dean</div>
                    <div className="text-xs text-slate-600">University Clinical Educator, QLD</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA - premium glass with gradient wash */}
        <section className="section-padding pb-16 relative">
          <div className="container-md px-6 md:px-8 text-center relative z-10">
            <div className="glass-color glass-teal rounded-2xl p-8 md:p-12 relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-2xl md:text-4xl font-bold mb-4 tracking-tight text-slate-900">
                  Ready to master evidence-based <span className="text-gradient">concussion management?</span>
                </h2>
                <p className="text-sm md:text-base text-slate-600 mb-6 max-w-xl mx-auto leading-relaxed">
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
                    className="btn-secondary px-10 py-4 rounded-xl text-base font-bold flex items-center gap-2 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                    aria-label="Enroll in course"
                  >
                    Enroll Now
                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  </a>
                </div>
                <p className="text-xs text-slate-500">
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
