'use client'

import { useState } from 'react'
import {
  Brain,
  Mail,
  User,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  Shield,
  Award,
  Clock,
  Zap,
  BookOpen,
  CheckCircle2,
  Star,
  ChevronRight,
} from 'lucide-react'
import { CONFIG } from '@/lib/config'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export default function SCATMasteryPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [successData, setSuccessData] = useState<{ loginLink?: string } | null>(null)

  const validateEmail = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please enter your first name.')
      return
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/signup-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() }),
      })

      const data = await res.json()

      if (data.success) {
        // Fire gtag conversion
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'generate_lead', {
            event_category: 'signup',
            event_label: 'scat_mastery',
          })
        }
        setSuccessData(data)
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const learningPoints = [
    'Administer the full SCAT6 with clinical precision — every domain, step by step',
    'Score and interpret SCOAT6 findings for safe return-to-sport decisions',
    'Apply BESS, tandem gait, and dual-task balance testing with confidence',
    'Identify red-flag symptoms that require emergency referral',
    'Document assessments to AHPRA standards and satisfy CPD requirements',
  ]

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Ambient gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-teal-50/40" />
      <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-gradient-to-bl from-teal-100/50 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-100/30 to-transparent blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-20 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5b9aa6] to-[#6b9da8] flex items-center justify-center shadow-md shadow-teal-200/50">
              <Brain className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              Concussion<span className="text-[#5b9aa6]">Pro</span>
            </span>
          </a>
          <a
            href="/login"
            className="text-sm font-semibold text-[#5b9aa6] hover:text-[#4a8a96] transition-colors"
          >
            Login
          </a>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">

          {/* ── Left column: copy ── */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 px-4 py-1.5 rounded-full mb-6">
              <Zap className="w-3.5 h-3.5 text-[#5b9aa6]" />
              <span className="text-xs font-bold text-[#5b9aa6] uppercase tracking-wide">
                Free · 2 AHPRA CPD Hours · No Credit Card
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-5 leading-tight">
              Master SCAT6 Assessment —{' '}
              <span className="bg-gradient-to-r from-[#5b9aa6] to-[#6b9da8] bg-clip-text text-transparent">
                Free 2-Hour Course
              </span>
            </h1>

            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              The complete guide to administering, scoring, and interpreting the SCAT6 and SCOAT6. Built for physiotherapists, osteopaths, and sports medicine clinicians. Free, online, and instantly accessible.
            </p>

            {/* Trust pills */}
            <div className="flex flex-wrap gap-3 mb-10">
              {[
                { icon: Clock, label: '2 CPD Hours' },
                { icon: Shield, label: 'AHPRA Aligned' },
                { icon: Award, label: 'Instant Access' },
                { icon: Star, label: 'No Credit Card' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 bg-white/80 border border-slate-200 px-3.5 py-2 rounded-full text-sm font-medium text-slate-700 shadow-sm"
                >
                  <Icon className="w-4 h-4 text-[#5b9aa6]" />
                  {label}
                </div>
              ))}
            </div>

            {/* What you'll learn */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-6 shadow-lg shadow-slate-200/40">
              <div className="flex items-center gap-2 mb-5">
                <BookOpen className="w-5 h-5 text-[#5b9aa6]" />
                <h2 className="font-bold text-slate-900">What you'll learn</h2>
              </div>
              <ul className="space-y-3.5">
                {learningPoints.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-slate-700 leading-snug">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#5b9aa6] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social proof strip */}
            <div className="mt-8 flex items-center gap-4 text-sm text-slate-500">
              <div className="flex -space-x-2">
                {['PT', 'OT', 'SP', 'GP'].map((initials) => (
                  <div
                    key={initials}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5b9aa6]/20 to-[#6b9da8]/20 border-2 border-white flex items-center justify-center text-xs font-bold text-[#5b9aa6]"
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <span>
                Join clinicians already enrolled in ConcussionPro
              </span>
            </div>
          </div>

          {/* ── Right column: form ── */}
          <div className="lg:sticky lg:top-8">
            {successData ? (
              /* Success state */
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-emerald-200 p-8 shadow-xl shadow-emerald-100/50">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                    <Check className="w-8 h-8 text-emerald-600" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
                    You're in! 🎉
                  </h2>
                  <p className="text-slate-500 text-sm mb-6">
                    Check your email for instant access to the SCAT6 Mastery Course.
                  </p>

                  <div className="bg-slate-50 rounded-xl p-5 mb-6 border border-slate-200/60 text-left space-y-3">
                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-[#5b9aa6] flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        A login link has been sent to <strong>{email}</strong>. Check your inbox (and spam folder).
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-[#5b9aa6] flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Link expires in 15 minutes.
                      </p>
                    </div>
                  </div>

                  {successData.loginLink && (
                    <a
                      href={successData.loginLink}
                      className="w-full py-3.5 rounded-xl text-base font-semibold inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#5b9aa6] to-[#6b9da8] text-white hover:from-[#4a8a96] hover:to-[#5a8d98] transition-all shadow-lg shadow-teal-200/50 mb-4"
                    >
                      Access Course Now
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  )}

                  <a
                    href="/scat-course"
                    className="w-full py-3.5 rounded-xl text-base font-semibold inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all border border-slate-200"
                  >
                    Go to course
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ) : (
              /* Sign-up form */
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-8 shadow-xl shadow-slate-200/40">
                <div className="text-center mb-7">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5b9aa6]/10 to-[#6b9da8]/10 flex items-center justify-center mx-auto mb-4 border border-[#5b9aa6]/20">
                    <Brain className="w-7 h-7 text-[#5b9aa6]" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1.5">
                    Get free instant access
                  </h2>
                  <p className="text-sm text-slate-500">
                    No credit card · Immediate · 2 CPD hours
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-5">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name field */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      First name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your first name"
                        className="w-full bg-white/80 pl-10 pr-4 py-3.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b9aa6]/40 focus:border-[#5b9aa6]/50 transition-all border border-slate-200 shadow-sm"
                        disabled={isLoading}
                        autoComplete="given-name"
                      />
                    </div>
                  </div>

                  {/* Email field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@clinic.com.au"
                        className="w-full bg-white/80 pl-10 pr-4 py-3.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b9aa6]/40 focus:border-[#5b9aa6]/50 transition-all border border-slate-200 shadow-sm"
                        disabled={isLoading}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-[#5b9aa6] to-[#6b9da8] text-white hover:from-[#4a8a96] hover:to-[#5a8d98] transition-all shadow-lg shadow-teal-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating your account...
                      </>
                    ) : (
                      <>
                        Start free course
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Micro-trust */}
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      No spam, ever
                    </div>
                    <div className="w-px h-3 bg-slate-200" />
                    <div className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      Unsubscribe anytime
                    </div>
                  </div>
                </div>

                {/* Login link */}
                <p className="text-center text-sm text-slate-500 mt-4">
                  Already have an account?{' '}
                  <a href="/login" className="text-[#5b9aa6] font-semibold hover:text-[#4a8a96] transition-colors">
                    Login
                  </a>
                </p>
              </div>
            )}

            {/* Below-form reassurance */}
            {!successData && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/50 p-3.5 text-center">
                  <p className="text-xl font-black text-slate-900">Free</p>
                  <p className="text-xs text-slate-500 mt-0.5">No cost, ever</p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/50 p-3.5 text-center">
                  <p className="text-xl font-black text-slate-900">2 CPD</p>
                  <p className="text-xs text-slate-500 mt-0.5">AHPRA hours</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom CTA strip ── */}
        <div className="mt-20 md:mt-24 border-t border-slate-200/60 pt-12 text-center">
          <p className="text-sm text-slate-500 mb-2">
            Ready for the full 14 CPD hour certification?
          </p>
          <a
            href={CONFIG.SHOP_URL}
            className="inline-flex items-center gap-2 text-[#5b9aa6] font-semibold text-sm hover:text-[#4a8a96] transition-colors"
          >
            View the complete ConcussionPro course
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  )
}
