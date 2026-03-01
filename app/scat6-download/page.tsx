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
  Download,
  FileText,
  CheckCircle2,
  Zap,
  BookOpen,
  ChevronRight,
  Users,
} from 'lucide-react'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export default function SCAT6DownloadPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validateEmail = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)

  const triggerDownload = () => {
    const a = document.createElement('a')
    a.href = '/docs/SCAT6_Fillable.pdf'
    a.download = 'SCAT6_Fillable.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

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
            event_category: 'download',
            event_label: 'scat6_form',
          })
        }
        // Trigger browser download immediately
        triggerDownload()
        setSuccess(true)
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-teal-50/40" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-teal-100/40 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-blue-100/30 to-transparent blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-20 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
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

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20">
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-start">

          {/* ── Left column: hero copy (3 cols) ── */}
          <div className="lg:col-span-3">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 px-4 py-1.5 rounded-full mb-6">
              <Download className="w-3.5 h-3.5 text-[#5b9aa6]" />
              <span className="text-xs font-bold text-[#5b9aa6] uppercase tracking-wide">
                Free PDF · Fillable · Instant Download
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4 leading-tight">
              Free SCAT6 Form —{' '}
              <span className="bg-gradient-to-r from-[#5b9aa6] to-[#6b9da8] bg-clip-text text-transparent">
                Fillable PDF Download
              </span>
            </h1>

            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              The official SCAT6 assessment tool, ready to use in your clinic. Enter your details for instant download.
            </p>

            {/* Feature list */}
            <div className="space-y-3 mb-8">
              {[
                'Complete SCAT6 form — all domains included',
                'Fillable PDF — type directly, or print and write',
                'Auto-scoring reference guide included',
                'Correct field layout for AHPRA documentation',
                'Print as many copies as you need — no restrictions',
              ].map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#5b9aa6] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <p className="text-sm text-slate-700 leading-snug">{point}</p>
                </div>
              ))}
            </div>

            {/* Trust signals row */}
            <div className="flex flex-wrap gap-3 mb-10">
              {[
                { icon: Users, label: 'Used by 200+ clinicians' },
                { icon: FileText, label: 'Fillable PDF' },
                { icon: Check, label: 'Auto-scoring' },
                { icon: Shield, label: 'Free' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 bg-white/80 border border-slate-200 px-3 py-2 rounded-full text-xs font-medium text-slate-700 shadow-sm"
                >
                  <Icon className="w-3.5 h-3.5 text-[#5b9aa6]" />
                  {label}
                </div>
              ))}
            </div>

            {/* PDF preview card */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-lg shadow-slate-200/40 flex items-center gap-5">
              <div className="w-14 h-16 bg-gradient-to-br from-[#5b9aa6]/10 to-[#5b9aa6]/5 rounded-lg border border-[#5b9aa6]/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-7 h-7 text-[#5b9aa6]" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">SCAT6_Fillable.pdf</p>
                <p className="text-xs text-slate-500 mt-0.5">Official Sport Concussion Assessment Tool · Version 6</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full font-medium">PDF</span>
                  <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-medium">Fillable</span>
                  <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-medium">Free</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right column: form (2 cols) ── */}
          <div className="lg:col-span-2 lg:sticky lg:top-8">
            {success ? (
              /* Success state */
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-emerald-200 p-7 shadow-xl shadow-emerald-100/50">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <Download className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1.5">
                    Downloading now
                  </h2>
                  <p className="text-sm text-slate-500">
                    Your SCAT6 form is downloading. We've also created a free account for you — check your email for access.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-200/60 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-[#5b9aa6] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-700">
                      Account confirmation sent to <strong>{email}</strong>
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#5b9aa6] flex-shrink-0 mt-0.5" strokeWidth={3} />
                    <p className="text-xs text-slate-700">
                      Your download should start automatically. If it didn't,{' '}
                      <button
                        onClick={triggerDownload}
                        className="text-[#5b9aa6] hover:underline font-semibold"
                      >
                        click here
                      </button>
                      .
                    </p>
                  </div>
                </div>

                {/* Upsell to mastery course */}
                <div className="bg-gradient-to-br from-teal-50 to-blue-50/50 rounded-xl border border-teal-200/60 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#5b9aa6]/10 border border-[#5b9aa6]/20 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-[#5b9aa6]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 mb-0.5">
                        Want to master SCAT6 administration?
                      </p>
                      <p className="text-xs text-slate-600 mb-3 leading-snug">
                        Try our free 2-hour course — 2 AHPRA CPD hours, instant access, no credit card.
                      </p>
                      <a
                        href="/scat-mastery"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5b9aa6] hover:text-[#4a8a96] transition-colors"
                      >
                        Get the free course
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Download form */
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-7 shadow-xl shadow-slate-200/40">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5b9aa6]/10 to-[#6b9da8]/10 flex items-center justify-center mx-auto mb-4 border border-[#5b9aa6]/20">
                    <Download className="w-6 h-6 text-[#5b9aa6]" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mb-1">
                    Get your free download
                  </h2>
                  <p className="text-xs text-slate-500">
                    Instant access · No credit card required
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="dl-name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      First name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="dl-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your first name"
                        className="w-full bg-white/80 pl-10 pr-4 py-3 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b9aa6]/40 focus:border-[#5b9aa6]/50 transition-all border border-slate-200 shadow-sm text-sm"
                        disabled={isLoading}
                        autoComplete="given-name"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="dl-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="dl-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@clinic.com.au"
                        className="w-full bg-white/80 pl-10 pr-4 py-3 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b9aa6]/40 focus:border-[#5b9aa6]/50 transition-all border border-slate-200 shadow-sm text-sm"
                        disabled={isLoading}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#5b9aa6] to-[#6b9da8] text-white hover:from-[#4a8a96] hover:to-[#5a8d98] transition-all shadow-lg shadow-teal-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Preparing download...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download free PDF
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      No spam
                    </div>
                    <div className="w-px h-3 bg-slate-200" />
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Instant download
                    </div>
                    <div className="w-px h-3 bg-slate-200" />
                    <div className="flex items-center gap-1">
                      <Check className="w-3 h-3" strokeWidth={3} />
                      Free forever
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upsell promo box (visible before submit) */}
            {!success && (
              <div className="mt-4 bg-gradient-to-br from-teal-50 to-blue-50/50 rounded-xl border border-teal-200/60 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#5b9aa6]/10 border border-[#5b9aa6]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4 text-[#5b9aa6]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-0.5">
                      Want to master SCAT6 administration?
                    </p>
                    <p className="text-xs text-slate-600 mb-2 leading-snug">
                      Try our free 2-hour course — 2 AHPRA CPD hours, instant access.
                    </p>
                    <a
                      href="/scat-mastery"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#5b9aa6] hover:text-[#4a8a96] transition-colors"
                    >
                      Explore the free course
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
