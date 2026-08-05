'use client'

import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import Link from 'next/link'
import { CONFIG } from '@/lib/config'
import { SiteNav } from '@/components/SiteNav'
import { BreadcrumbSchema } from '@/components/SchemaMarkup'
import { createCourseSchema } from '@/lib/schema-markup'


const FREE_SIGNUP_CONVERSION = 'AW-17984048021/TVzUCLHT0IccEJWXu_9C'

// Flagship-course structured data for the upgrade CTA on this page.
// The credential MUST match the price it is published alongside: this node is
// priced at PRICE_EARLY_BIRD, which buys the Complete Course (online + the
// in-person practical day) = TOTAL_CPD_POINTS. It previously carried
// ONLINE_CPD_POINTS against that price, publishing "8 CPD hours for A$1,190"
// to Google and the AI answer engines — half of what the money actually buys,
// and contradicting the identical node on /course.
const courseSchema = createCourseSchema({
  name: 'Concussion Clinical Mastery',
  description:
    `Complete concussion assessment and management training for Australian healthcare professionals — SCAT6, SCOAT6, VOMS, BESS, and return-to-play protocols. ${CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hours online, up to ${CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours with the optional in-person practical day. Endorsed by Osteopathy Australia; hours count toward AHPRA registration CPD requirements.`,
  cpdHours: CONFIG.COURSE.TOTAL_CPD_POINTS,
  priceAUD: CONFIG.COURSE.PRICE_EARLY_BIRD,
  recognizedBy: { name: 'Osteopathy Australia', url: 'https://osteopathy.org.au' },
})

// Second Course node: the FREE course this page actually signs users up for.
// Hand-rolled (not createCourseSchema) because that helper asserts paid-course
// facts — CPD-hour credential and isAccessibleForFree: false — that are wrong
// here. The free course awards a certificate of completion, not CPD hours.
const freeCourseSchema = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'SCAT6 & SCOAT6 Mastery (Free Course)',
  description:
    'Free ~1-hour online course for healthcare professionals on administering, scoring and interpreting the SCAT6 and SCOAT6 concussion assessment tools, including red-flag recognition and documentation. Certificate on completion. No credit card required.',
  inLanguage: 'en-AU',
  provider: {
    '@type': 'Organization',
    name: 'Concussion Education Australia',
    url: 'https://concussion-education-australia.com',
  },
  isAccessibleForFree: true,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'AUD',
    availability: 'https://schema.org/InStock',
    url: `${CONFIG.SEO.SITE_URL}/scat-mastery`,
  },
  hasCourseInstance: [
    {
      '@type': 'CourseInstance',
      courseMode: 'online',
      inLanguage: 'en-AU',
    },
  ],
  educationalCredentialAwarded: {
    '@type': 'EducationalOccupationalCredential',
    name: 'Certificate of Completion',
    credentialCategory: 'Certificate',
  },
  about: { '@type': 'MedicalCondition', name: 'Sport-Related Concussion' },
  educationalLevel: 'Professional Development',
  audience: {
    '@type': 'EducationalAudience',
    audienceType: 'Healthcare Professionals',
    educationalRole: ['Medical Doctor', 'Physiotherapist', 'Osteopath', 'Sports Trainer'],
  },
  teaches: [
    'SCAT-6 Assessment Protocol',
    'SCOAT-6 Office Assessment',
    'Concussion Red Flags Recognition',
    'Concussion Assessment Documentation',
  ],
  timeRequired: 'PT1H',
}

/**
 * Fire the free-signup Google Ads conversion exactly once, navigating from
 * gtag's event_callback so the hit is dispatched before the page unloads.
 * A 2s safety timeout still navigates if gtag.js never executes the queued
 * event (ad blocker / slow mobile). Mirrors lib/analytics trackLeadConversion
 * (value + enhanced-conversion hashed email) but adds the navigation callback
 * that helper doesn't support.
 */
async function fireSignupConversionThenNavigate(email: string, destination: string) {
  let navigated = false
  const navigate = () => {
    if (navigated) return
    navigated = true
    window.location.href = destination
  }
  const safetyTimer = setTimeout(navigate, 2000)

  if (typeof window.gtag !== 'function') return // safety timer handles navigation

  const params: Record<string, unknown> = {
    send_to: FREE_SIGNUP_CONVERSION,
    value: 25,
    currency: 'AUD',
    event_callback: () => {
      clearTimeout(safetyTimer)
      navigate()
    },
    event_timeout: 2000,
  }
  // Enhanced conversions — SHA-256 hashed email for better attribution
  try {
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email))
    params.user_data = {
      sha256_email_address: Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
    }
  } catch {
    // crypto.subtle unavailable (HTTP or old browser) — fire without enhanced data
  }
  window.gtag('event', 'conversion', params)
}

export default function SCATMasteryPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [successData, setSuccessData] = useState<{ message?: string } | null>(null)
  // Read ?prospect={slug} from URL on landing — captures B2B cold-outreach
  // attribution. Persisted to sessionStorage so it survives if the user
  // navigates around the page before submitting the form.
  const [prospectSlug, setProspectSlug] = useState<string>('')
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const slug = params.get('prospect')
    if (slug) {
      const clean = slug.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 80)
      if (clean) {
        setProspectSlug(clean)
        try { sessionStorage.setItem('prospect_slug', clean) } catch { /* silent */ }
      }
    } else {
      try {
        const stored = sessionStorage.getItem('prospect_slug')
        if (stored) setProspectSlug(stored)
      } catch { /* silent */ }
    }
  }, [])

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
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), prospectSlug: prospectSlug || undefined }),
      })

      const data = await res.json()

      // Existing account that OWNS something: the API deliberately sets NO
      // session cookie and emails a login link instead (anti-takeover — see
      // lib/account-escalation.ts). Navigating on would land them on gated
      // content with no session, so say what actually happened.
      if (data.requiresEmailLogin) {
        setError(
          "You already have an account \u2014 we've emailed you a login link. Open it and you'll be signed straight in.",
        )
        return
      }

      if (data.success) {
        // Show success state (cookie already set by API), fire the gtag lead
        // conversion, then navigate from gtag's event_callback so the hit is
        // dispatched before the page unloads. A 2s safety timeout still
        // navigates if gtag.js never loads (ad blocker / slow mobile) —
        // previously a blind 1.5s setTimeout could navigate before gtag had
        // even loaded, silently dropping the conversion.
        setSuccessData(data)
        await fireSignupConversionThenNavigate(email.trim().toLowerCase(), '/modules/101')
        return
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
    'Document assessments to AHPRA standards',
  ]

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'Free SCAT6 Mastery Course', url: '/scat-mastery' },
      ]} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(freeCourseSchema) }}
      />
      {/* Ambient gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-teal-50/40" />
      <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-gradient-to-bl from-teal-100/50 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-100/30 to-transparent blur-3xl pointer-events-none" />

      <SiteNav />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-[120px] pb-12 md:pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">

          {/* ── Left column: copy ── */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 px-4 py-1.5 rounded-full mb-6">
              <Zap className="w-3.5 h-3.5 text-[#5b9aa6]" />
              <span className="text-xs font-bold text-[#5b9aa6] uppercase tracking-wide">
                Free · ~1 Hour · No Credit Card
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-5 leading-tight">
              Master SCAT6 Assessment —{' '}
              <span className="bg-gradient-to-r from-[#5b9aa6] to-[#6b9da8] bg-clip-text text-transparent">
                Free ~1 Hour Course
              </span>
            </h1>

            <p className="text-lg text-slate-600 mb-4 leading-relaxed">
              The complete guide to administering, scoring, and interpreting the SCAT6 and SCOAT6. Built for physiotherapists, osteopaths, chiropractors, and all AHPRA-registered clinicians. Free, online, and instantly accessible.
            </p>
            <div className="inline-flex items-center gap-2 mb-8 rounded-lg bg-[#5b9aa6]/10 border border-[#5b9aa6]/25 px-4 py-2.5">
              <span className="text-sm font-semibold text-slate-800">
                Finish it and get <span className="text-[#5b9aa6] font-bold">${CONFIG.COURSE.SCAT_DISCOUNT_AUD} off</span> the full online course
              </span>
            </div>

            {/* Trust pills */}
            <div className="flex flex-wrap gap-3 mb-10">
              {[
                { icon: Clock, label: '~1 Hour' },
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
                <h2 className="font-bold text-slate-900">What you&apos;ll learn</h2>
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

            {/* Social proof */}
            <div className="mt-8 space-y-4">
              <div className="bg-white/70 backdrop-blur-xl rounded-xl border border-slate-200/60 p-4">
                <div className="flex gap-0.5 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 italic mb-2">
                  &ldquo;A must for any health professional managing concussion. Relevant, applicable and easy to absorb.&rdquo;
                </p>
                <p className="text-xs text-slate-500 font-semibold">— Sarah, Physiotherapist</p>
              </div>
              <p className="text-sm text-slate-500">
                AHPRA aligned · Concussion Clinical Mastery is endorsed by Osteopathy Australia
              </p>
            </div>
          </div>

          {/* ── Right column: form ── */}
          <div className="lg:sticky lg:top-8">
            {successData ? (
              /* Success state — brief confirmation before redirect to course */
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-emerald-200 p-8 shadow-xl shadow-emerald-100/50">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                    <Check className="w-8 h-8 text-emerald-600" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
                    You&apos;re in!
                  </h2>
                  <p className="text-slate-500 text-sm mb-4">
                    Taking you to your course now...
                  </p>
                  <Loader2 className="w-6 h-6 text-[#5b9aa6] animate-spin mx-auto" />
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
                    No credit card · Immediate · ~1 hour
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
                  <Link href="/login" className="text-[#5b9aa6] font-semibold hover:text-[#4a8a96] transition-colors">
                    Login
                  </Link>
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
                  <p className="text-xl font-black text-slate-900">~1 hr</p>
                  <p className="text-xs text-slate-500 mt-0.5">To complete</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── The OTHER free course — CCHC, equal billing right under the hero
            (owner 2026-08-04: revert the /free-training hub; CCHC lives HERE) ── */}
        <div className="mt-14 md:mt-16">
          <div className="rounded-2xl border border-teal-300/40 bg-gradient-to-br from-[#0d5c63] via-[#0f766e] to-[#155e75] p-7 md:p-8 shadow-lg shadow-teal-900/20">
            <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
              <div className="flex-1 min-w-0">
                <p className="inline-flex items-center rounded-full bg-amber-300/95 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-950 mb-3">
                  Also free · second course
                </p>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  Concussion Care Has Changed
                </h2>
                <p className="mt-1.5 text-sm text-teal-50/90 leading-relaxed max-w-2xl">
                  Rest is out — measured sub-symptom-threshold exercise is now first-line treatment.
                  The ~1-hour update on the paradigm shift, the evidence behind it, and what modern
                  management involves. Free, no credit card.
                </p>
              </div>
              <div className="shrink-0">
                <Link
                  href="/concussion-update"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#0f766e] hover:bg-teal-50 transition-colors"
                >
                  Start the free update
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Upgrade CTA Card ── */}
        <div className="mt-20 md:mt-24">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-[#5b9aa6]/20 p-8 md:p-10 shadow-lg shadow-teal-100/30">
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mb-2">
                Want more than SCAT6? Get up to {CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours (
                {CONFIG.COURSE.ONLINE_CPD_POINTS} online + optional in-person day).
              </h2>
              <p className="text-sm text-slate-500">
                The complete course covers everything the free training doesn&apos;t.
              </p>
            </div>

            <ul className="space-y-3 max-w-md mx-auto mb-8">
              {[
                'VOMS (Vestibular/Ocular Motor Screening) — the assessment most clinicians should be using',
                'BESS balance testing with hands-on scoring practice',
                'Return-to-play & return-to-learn protocols for clubs and schools',
                'Full-day practical workshop with expert feedback',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-4.5 h-4.5 text-[#5b9aa6] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="text-center">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-[#5b9aa6] to-[#6b9da8] text-white hover:from-[#4a8a96] hover:to-[#5a8d98] transition-all shadow-lg shadow-teal-200/50"
              >
                See Complete Course
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-xs text-slate-400 mt-3">
                7-day satisfaction guarantee
              </p>
            </div>
          </div>
        </div>

        {/* ── Regulatory context — blog links ── */}
        <div className="mt-12 max-w-2xl mx-auto">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Further reading</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              { title: 'AIS Position Statement 2024', href: '/blog/ais-concussion-brain-health-position-statement-2024' },
              { title: '21-Day Stand-Down Rule Explained', href: '/blog/21-day-concussion-stand-down-youth-sport-australia' },
              { title: 'AHPRA CPD Requirements Guide', href: '/blog/ahpra-cpd-requirements-concussion-education' },
              { title: 'NSW Combat Sports Legislation', href: '/blog/nsw-mandatory-concussion-training-combat-sports' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-2 p-3 rounded-lg bg-white/60 border border-slate-200/50 hover:border-[#5b9aa6]/30 transition-colors"
              >
                <span className="text-[#5b9aa6] text-sm">→</span>
                <span className="text-xs font-medium text-slate-600 group-hover:text-[#5b9aa6] transition-colors">{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
