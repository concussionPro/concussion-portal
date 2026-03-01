'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, Clock, MapPin, Zap, ArrowRight, Calendar, Sparkles, ShieldCheck, Loader2, AlertCircle, BookOpen, Award } from 'lucide-react'
import { CONFIG } from '@/lib/config'

function PricingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const canceled = searchParams.get('canceled')
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async (courseType: 'online-only' | 'full-course') => {
    if (courseType === 'full-course' && !selectedLocation) {
      setError('Please select a workshop location before enrolling.')
      return
    }

    setLoading(courseType)
    setError(null)

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseType,
          location: courseType === 'full-course' ? selectedLocation : undefined,
        }),
      })

      const data = await res.json()

      if (data.success && data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
        setLoading(null)
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
      setLoading(null)
    }
  }

  const locations = [
    { value: 'melbourne', label: 'Melbourne', date: CONFIG.LOCATIONS.MELBOURNE.date, spots: CONFIG.LOCATIONS.MELBOURNE.spotsRemaining },
    { value: 'sydney', label: 'Sydney', date: CONFIG.LOCATIONS.SYDNEY.date, spots: CONFIG.LOCATIONS.SYDNEY.spotsRemaining },
    { value: 'byron-bay', label: 'Byron Bay', date: CONFIG.LOCATIONS.BYRON_BAY.date, spots: CONFIG.LOCATIONS.BYRON_BAY.spotsRemaining },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="glass border-b border-border/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-xl font-bold"
          >
            Concussion<span className="text-gradient">Pro</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/preview')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Free Preview
            </button>
            <button
              onClick={() => router.push('/login')}
              className="text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        {/* Canceled notice */}
        {canceled && (
          <div className="max-w-2xl mx-auto mb-8 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Checkout was canceled. No charge was made. You can try again whenever you&apos;re ready.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-accent">AHPRA Aligned · 14 CPD Hours</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Invest in Your Clinical{' '}
            <span className="text-gradient">Confidence</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Australia&apos;s most comprehensive concussion management training. Start online at your own pace, or commit to the full certification with hands-on workshop.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
          {/* Online Only */}
          <div className="glass rounded-2xl p-6 md:p-8 border border-border/30 flex flex-col">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                Start Under $500
              </span>
            </div>
            <h2 className="text-2xl font-bold mt-3 mb-2">Online Course</h2>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Complete the online section in your own time. Upgrade to add a hands-on workshop later — just pay the difference.
            </p>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-black">$497</span>
                <span className="text-muted-foreground text-sm">AUD</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">One-time payment · Lifetime access</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {[
                '8 online modules (8 CPD hours)',
                'Complete at your own pace — no deadlines',
                'Lifetime access to all modules',
                'Clinical Toolkit & downloadable resources',
                'Reference Repository (145+ articles)',
                'Digital certificate upon completion',
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" strokeWidth={3} />
                  <span className="text-foreground/80">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCheckout('online-only')}
              disabled={loading !== null}
              className="w-full py-4 px-6 rounded-xl text-center font-bold transition-all bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading === 'online-only' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Clock className="w-5 h-5" />
                  Start for $497
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-xs text-purple-900 font-medium flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                Upgrade later: add workshop for $693 = $1,190 total
              </p>
            </div>
          </div>

          {/* Full Course */}
          <div className="glass rounded-2xl p-6 md:p-8 border-2 border-accent/40 flex flex-col relative">
            {/* Popular badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-5 py-1.5 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
                Early Bird — Save $210
              </div>
            </div>

            <div className="flex items-center gap-3 mb-2 mt-2">
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <Award className="w-5 h-5 text-teal-600" />
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                Most Popular
              </span>
            </div>
            <h2 className="text-2xl font-bold mt-3 mb-2">Complete Course</h2>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Full training: 8 online modules plus a full-day hands-on workshop. Everything you need for clinical confidence.
            </p>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xl text-muted-foreground line-through font-semibold">$1,400</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Save $210</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-black">$1,190</span>
                <span className="text-muted-foreground text-sm">AUD</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">One-time payment · 14 AHPRA CPD hours</p>
            </div>

            <ul className="space-y-3 mb-6 flex-1">
              {[
                '8 online modules (8 CPD hours)',
                'Full-day in-person workshop (6 CPD hours)',
                'Hands-on SCAT6, VOMS, BESS training',
                'Clinical Toolkit & all resources',
                'Reference Repository (145+ articles)',
                'Choose Melbourne, Sydney, or Byron Bay',
                'Flexible workshop date selection',
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" strokeWidth={3} />
                  <span className="text-foreground/80">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Location Selector */}
            <div className="mb-4">
              <label className="text-sm font-semibold mb-2 block text-foreground/80">
                <MapPin className="w-4 h-4 inline mr-1.5 text-accent" />
                Select Workshop Location
              </label>
              <div className="grid gap-2">
                {locations.map((loc) => (
                  <button
                    key={loc.value}
                    onClick={() => { setSelectedLocation(loc.value); setError(null) }}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all text-left ${
                      selectedLocation === loc.value
                        ? 'border-accent bg-accent/5 ring-2 ring-accent/20'
                        : 'border-border/40 hover:border-border/60 bg-white/50'
                    }`}
                  >
                    <div>
                      <span className="font-semibold">{loc.label}</span>
                      <span className="text-muted-foreground ml-2">· {loc.date}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{loc.spots} spots left</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleCheckout('full-course')}
              disabled={loading !== null}
              className="w-full py-4 px-6 rounded-xl text-center font-bold transition-all bg-gradient-to-r from-[#5b9aa6] to-[#6b9da8] text-white hover:from-[#5898a0] hover:to-[#5b8d96] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading === 'full-course' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Enroll in Complete Course
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-900 font-medium">
                Early bird pricing ends soon. Lock in $1,190 before it goes to $1,400.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="mt-12 md:mt-16 text-center">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              <span>Secure Stripe Checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-teal-600" strokeWidth={2.5} />
              <span>AHPRA Aligned</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-teal-600" strokeWidth={2.5} />
              <span>Lifetime Access</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-teal-600" strokeWidth={2.5} />
              <span>Certificate Included</span>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mt-16 md:mt-20">
          <h2 className="text-2xl font-bold text-center mb-8">Common Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Can I upgrade from online-only to the full course later?',
                a: 'Yes. Start with the online course for $497, then upgrade to the full course by paying the difference ($693). Contact us to arrange this.',
              },
              {
                q: 'When do I get access to the online modules?',
                a: 'Immediately after purchase. You\'ll receive a login link via email within minutes.',
              },
              {
                q: 'Can I change my workshop date or location?',
                a: 'Yes — you have full flexibility to attend any workshop date in Melbourne, Sydney, or Byron Bay. Email us to reschedule at no extra charge (subject to availability).',
              },
              {
                q: 'Is the purchase refundable?',
                a: 'Contact us at zac@concussion-education-australia.com to discuss any concerns. We want you to be confident in your investment.',
              },
            ].map((item, i) => (
              <div key={i} className="glass rounded-xl p-5">
                <h3 className="font-semibold text-sm mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    }>
      <PricingContent />
    </Suspense>
  )
}
