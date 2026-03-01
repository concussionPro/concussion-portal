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
  useAnalytics()

  return (
    <>
      <OrganizationSchema />
      <CourseSchema />
      <div className="mesh-gradient" aria-hidden="true" />
      <div className="noise-overlay" aria-hidden="true" />
      <div className="floating-orb floating-orb-1" aria-hidden="true" />
      <div className="floating-orb floating-orb-2" aria-hidden="true" />
      <div className="floating-orb floating-orb-3" aria-hidden="true" />
      <div className="min-h-screen relative">
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 glass rounded-full px-6 py-3 w-[95%] max-w-5xl" role="navigation" aria-label="Main navigation">
          <div className="flex items-center justify-between">
            <button onClick={() => router.push('/')} className="flex flex-col focus:outline-none focus:ring-2 focus:ring-accent rounded" aria-label="ConcussionPro home">
              <div className="text-lg font-bold tracking-tight">Concussion<span className="text-gradient">Pro</span></div>
              <div className="text-xs text-slate-500 tracking-wide">Concussion Education Australia</div>
            </button>
            <div className="hidden md:flex items-center gap-3">
              <button onClick={() => router.push('/scat-mastery')} className="text-sm text-teal-600 hover:text-teal-700 transition-colors font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 rounded px-2 py-1">Free Training</button>
              <button onClick={() => router.push('/scat-forms')} className="text-sm text-accent hover:text-accent/80 transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-accent rounded px-2 py-1">SCAT Forms</button>
              <button onClick={() => router.push('/preview')} className="text-sm text-slate-600 hover:text-slate-800 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-accent rounded px-2 py-1">Preview</button>
              <button onClick={() => router.push('/login')} className="text-sm text-slate-600 hover:text-slate-800 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-accent rounded px-2 py-1">Login</button>
              <a href={CONFIG.SHOP_URL} onClick={() => trackShopClick('nav-desktop')} className="btn-primary px-6 py-2 rounded-full text-sm inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-accent">Enroll<ArrowRight className="w-4 h-4" aria-hidden="true" /></a>
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 focus:outline-none focus:ring-2 focus:ring-accent rounded" aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenuOpen}>
              {mobileMenuOpen ? <X className="w-6 h-6 text-slate-700" /> : <Menu className="w-6 h-6 text-slate-700" />}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-slate-200 space-y-3">
              <button onClick={() => { router.push('/scat-mastery'); setMobileMenuOpen(false) }} className="block w-full text-left text-sm text-teal-600 py-2 px-2 font-bold">Free SCAT Training</button>
              <button onClick={() => { router.push('/scat-forms'); setMobileMenuOpen(false) }} className="block w-full text-left text-sm text-accent py-2 px-2 font-semibold">SCAT Forms (Free)</button>
              <button onClick={() => { router.push('/preview'); setMobileMenuOpen(false) }} className="block w-full text-left text-sm text-slate-700 py-2 px-2">Preview Course</button>
              <button onClick={() => { router.push('/login'); setMobileMenuOpen(false) }} className="block w-full text-left text-sm text-slate-700 py-2 px-2">Login</button>
              <a href={CONFIG.SHOP_URL} className="block w-full btn-primary px-6 py-3 rounded-xl text-sm text-center font-bold" onClick={() => setMobileMenuOpen(false)}>Enroll Now</a>
            </div>
          )}
        </nav>
        <section className="section-padding pt-72 md:pt-80 pb-8 relative z-10">
          <div className="container-lg px-6 md:px-8 text-center">
            <div className="animate-fade-in max-w-4xl mx-auto">
              <div className="badge mb-5 animate-pulse-glow mt-8"><Award className="w-4 h-4 mr-2" aria-hidden="true" />{CONFIG.COURSE.CPD_BADGE_TEXT}</div>
              <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight leading-[1.15]">Stop second-guessing concussion cases.<br /><span className="text-gradient text-4xl md:text-6xl">Master clinical confidence.</span></h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-2 leading-relaxed">Complete training program: {CONFIG.COURSE.TOTAL_MODULES} online modules + full-day hands-on workshop.</p>
              <p className="text-sm text-slate-600 max-w-2xl mx-auto mb-8">One price includes both online learning and in-person practical training at your chosen location.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
                <button onClick={() => router.push('/preview')} className="btn-primary px-10 py-4 rounded-xl text-base font-bold flex items-center gap-2 w-full sm:w-auto shadow-2xl"><Sparkles className="w-5 h-5" aria-hidden="true" />Preview Course</button>
                <a href={CONFIG.SHOP_URL} onClick={() => trackShopClick('hero-cta')} className="btn-primary px-10 py-4 rounded-xl text-base font-bold flex items-center gap-2 w-full sm:w-auto shadow-2xl">Enroll Now<ArrowRight className="w-5 h-5" aria-hidden="true" /></a>
              </div>
              <div className="text-center mb-8">
                <button onClick={() => router.push('/scat-forms')} className="text-sm text-slate-600 hover:text-accent transition-colors font-medium underline px-2 py-1">Or access free SCAT6/SCOAT6 forms</button>
              </div>
            </div>
            <div className="home-bento max-w-4xl mx-auto">
              <div className="home-bento-wide glass-color glass-teal inner-glow inner-glow-teal p-6 flex flex-col justify-between min-h-[160px]">
                <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-lg bg-white/30 backdrop-blur-sm flex items-center justify-center"><GraduationCap className="w-4 h-4 text-teal-700" /></div><span className="text-xs font-semibold text-teal-700/80 uppercase tracking-wider">Total CPD Hours</span></div>
                <div className="relative z-10"><div className="text-5xl md:text-6xl font-bold text-teal-800/90 tracking-tight leading-none mb-1">{CONFIG.COURSE.TOTAL_CPD_HOURS}</div><div className="text-sm font-medium text-teal-700/70">AHPRA Accredited</div></div>
              </div>
              <div className="glass-color glass-rose inner-glow inner-glow-rose p-5 flex flex-col justify-between min-h-[160px]">
                <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-lg bg-white/30 backdrop-blur-sm flex items-center justify-center"><BookOpen className="w-4 h-4 text-rose-700" /></div><span className="text-xs font-semibold text-rose-700/80 uppercase tracking-wider">Online</span></div>
                <div className="relative z-10"><div className="text-4xl md:text-5xl font-bold text-rose-800/90 tracking-tight leading-none mb-1">8</div><div className="text-sm font-medium text-rose-700/70">Modules · 8 CPD hrs</div></div>
              </div>
              <div className="glass-color glass-cobalt inner-glow inner-glow-cobalt p-5 flex flex-col justify-between min-h-[160px]">
                <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-lg bg-white/30 backdrop-blur-sm flex items-center justify-center"><Users className="w-4 h-4 text-blue-700" /></div><span className="text-xs font-semibold text-blue-700/80 uppercase tracking-wider">Practical</span></div>
                <div className="relative z-10"><div className="text-4xl md:text-5xl font-bold text-blue-800/90 tracking-tight leading-none mb-1">1 Day</div><div className="text-sm font-medium text-blue-700/70">In-Person · 6 CPD hrs</div></div>
              </div>
              <div className="glass-color glass-amber inner-glow inner-glow-amber p-5 flex flex-col justify-between min-h-[160px]">
                <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-lg bg-white/30 backdrop-blur-sm flex items-center justify-center"><MapPin className="w-4 h-4 text-amber-700" /></div><span className="text-xs font-semibold text-amber-700/80 uppercase tracking-wider">Locations</span></div>
                <div className="relative z-10"><div className="text-4xl md:text-5xl font-bold text-amber-800/90 tracking-tight leading-none mb-1">3</div><div className="text-sm font-medium text-amber-700/70">Melb / Syd / Byron</div></div>
              </div>
              <div className="glass-color glass-emerald p-5 flex flex-col justify-between min-h-[160px]">
                <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-lg bg-white/30 backdrop-blur-sm flex items-center justify-center"><FileCheck className="w-4 h-4 text-emerald-700" /></div><span className="text-xs font-semibold text-emerald-700/80 uppercase tracking-wider">Certificate</span></div>
                <div className="relative z-10"><div className="text-2xl font-bold text-emerald-800/90 tracking-tight leading-tight mb-1">Digital &amp; PDF</div><div className="text-sm font-medium text-emerald-700/70">Completion Certificate</div></div>
              </div>
            </div>
          </div>
        </section>
        <section className="section-padding relative">
          <div className="container-lg px-6 md:px-8 relative z-10">
            <PricingOptions variant="full" />
          </div>
        </section>
      </div>
    </>
  )
}
