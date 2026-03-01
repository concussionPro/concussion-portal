'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Check,
  Clock,
  MapPin,
  Zap,
  ArrowRight,
  Calendar,
  Sparkles,
  ShieldCheck,
  Loader2,
  AlertCircle,
  BookOpen,
  Award,
  Mail,
  User,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { CONFIG } from '@/lib/config'

// ─── Types ──────────────────────────────────────────────────────────────────

type LocationStatus = 'confirmed' | 'tba'

interface LocationOption {
  value: string
  label: string
  date: string
  spots: number
  status: LocationStatus
}

interface InterestFormState {
  name: string
  email: string
  loading: boolean
  error: string | null
  success: string | null
}

// ─── Location data derived from CONFIG ──────────────────────────────────────

const LOCATIONS: LocationOption[] = [
  {
    value: CONFIG.LOCATIONS.SYDNEY.slug,
    label: CONFIG.LOCATIONS.SYDNEY.city,
    date: CONFIG.LOCATIONS.SYDNEY.date,
    spots: CONFIG.LOCATIONS.SYDNEY.spotsRemaining,
    status: CONFIG.LOCATIONS.SYDNEY.status,
  },
  {
    value: CONFIG.LOCATIONS.BYRON_BAY.slug,
    label: CONFIG.LOCATIONS.BYRON_BAY.city,
    date: CONFIG.LOCATIONS.BYRON_BAY.date,
    spots: CONFIG.LOCATIONS.BYRON_BAY.spotsRemaining,
    status: CONFIG.LOCATIONS.BYRON_BAY.status,
  },
  {
    value: CONFIG.LOCATIONS.MELBOURNE.slug,
    label: CONFIG.LOCATIONS.MELBOURNE.city,
    date: CONFIG.LOCATIONS.MELBOURNE.date,
    spots: CONFIG.LOCATIONS.MELBOURNE.spotsRemaining,
    status: CONFIG.LOCATIONS.MELBOURNE.status,
  },
]

// ─── Interest Form (inline, per TBA location) ────────────────────────────────

function InterestForm({ city, cityLabel }: { city: string; cityLabel: string }) {
  const [form, setForm] = useState<InterestFormState>({
    name: '',
    email: '',
    loading: false,
    error: null,
    success: null,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setForm(f => ({ ...f, loading: true, error: null }))

    try {
      const res = await fetch('/api/register-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), name: form.name.trim(), city }),
      })
      const data = await res.json()

      if (data.success) {
        setForm(f => ({ ...f, loading: false, success: data.message || "You're on the list!" }))
      } else {
        setForm(f => ({ ...f, loading: false, error: data.error || 'Something went wrong. Please try again.' }))
      }
    } catch {
      setForm(f => ({ ...f, loading: false, error: 'Network error. Please try again.' }))
    }
  }

  // Success state
  if (form.success) {
    return (
      <div className="mt-3 p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-teal-900">You&apos;re on the list!</p>
          <p className="text-xs text-teal-700 mt-0.5">{form.success}</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 p-4 bg-slate-50 border border-border/40 rounded-xl space-y-3">
      <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">
        Register Interest — {cityLabel}
      </p>

      {form.error && (
        <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          {form.error}
        </div>
      )}

      <div className="relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Your name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
          minLength={2}
          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border/60 bg-white focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 placeholder:text-muted-foreground/60"
        />
      </div>

      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="email"
          placeholder="Your email address"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          required
          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border/60 bg-white focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 placeholder:text-muted-foreground/60"
        />
      </div>

      <button
        type="submit"
        disabled={form.loading}
        className="btn-primary w-full py-2.5 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {form.loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Mail className="w-4 h-4" />
            Notify Me When Confirmed
          </>
        )}
      </button>
    </form>
  )
}

// ─── Location Row (inside Complete Course card) ──────────────────────────────

function LocationRow({
  loc,
  isSelected,
  showInterestForm,
  onSelect,
}: {
  loc: LocationOption
  isSelected: boolean
  showInterestForm: boolean
  onSelect: (value: string) => void
}) {
  const isConfirmed = loc.status === 'confirmed'

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(loc.value)}
        aria-pressed={isSelected}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all text-left ${
          isSelected && isConfirmed
            ? 'border-accent bg-accent/5 ring-2 ring-accent/20'
            : isSelected && !isConfirmed
            ? 'border-accent/40 bg-accent/5 ring-1 ring-accent/15'
            : 'border-border/40 hover:border-border/60 bg-white/50'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-foreground">{loc.label}</span>
          {isConfirmed ? (
            <span className="text-muted-foreground text-xs shrink-0">· {loc.date}</span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold uppercase tracking-wide shrink-0">
              Coming Soon
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          {isConfirmed && (
            <span className="text-xs text-muted-foreground">{loc.spots} spots left</span>
          )}
          {!isConfirmed && (
            <span className="text-muted-foreground">
              {showInterestForm ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
          )}
        </div>
      </button>

      {/* Inline interest form for TBA locations */}
      {!isConfirmed && showInterestForm && (
        <InterestForm city={loc.value} cityLabel={loc.label} />
      )}
    </div>
  )
}

// ─── Main Pricing Content ────────────────────────────────────────────────────

function PricingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const canceled = searchParams.get('canceled')

  // Confirmed location selection (for checkout)
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  // Which TBA location has its interest form open
  const [openTbaCity, setOpenTbaCity] = useState<string | null>(null)
  // Checkout loading state
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // FAQ accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleLocationSelect = (value: string) => {
    const loc = LOCATIONS.find(l => l.value === value)
    if (!loc) return

    if (loc.status === 'confirmed') {
      setSelectedLocation(value)
      setOpenTbaCity(null)
      setError(null)
    } else {
      // TBA — toggle interest form, don't set as selected for checkout
      setOpenTbaCity(prev => (prev === value ? null : value))
      setSelectedLocation('')
    }
  }

  const handleCheckout = async (courseType: 'online-only' | 'full-course') => {
    if (courseType === 'full-course') {
      const loc = LOCATIONS.find(l => l.value === selectedLocation)
      if (!selectedLocation || !loc || loc.status !== 'confirmed') {
        setError('Please select a confirmed workshop location to enroll.')
        return
      }
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

  const selectedLocationObj = LOCATIONS.find(l => l.value === selectedLocation)
  const canEnroll = !!selectedLocationObj && selectedLocationObj.status === 'confirmed'

  const faqs = [
    {
      q: 'Can I upgrade from online-only to the full course later?',
      a: 'Yes. Start with the online course for $497, then upgrade to the full course by paying the difference ($693). Contact us to arrange this.',
    },
    {
      q: 'When do I get access to the online modules?',
      a: "Immediately after purchase. You'll receive a login link via email within minutes.",
    },
    {
      q: 'Can I change my workshop date or location?',
      a: 'Yes — you have full flexibility to attend any workshop date in Melbourne, Sydney, or Byron Bay. Email us to reschedule at no extra charge (subject to availability).',
    },
    {
      q: 'Is the purchase refundable?',
      a: 'Contact us at zac@concussion-education-australia.com to discuss any concerns. We want you to be confident in your investment.',
    },
    {
      q: "What happens if I register interest for a TBA location?",
      a: "You'll be emailed as soon as the date and venue are confirmed — typically 4–6 weeks before the event. You'll also get early access to book before spots open publicly.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="glass border-b border-border/30 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-xl font-bold tracking-tight"
          >
            Concussion<span className="text-gradient">Pro</span>
          </button>
          <div className="flex items-center gap-4">
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
              Checkout was canceled — no charge was made. You can try again whenever you&apos;re ready.
            </p>
          </div>
        )}

        {/* Page Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-5 border border-accent/20">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-accent">
              AHPRA Aligned · 14 CPD Hours · Endorsed by Osteopathy Australia
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-5">
            Invest in Your Clinical{' '}
            <span className="text-gradient">Confidence</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Australia&apos;s most comprehensive concussion management training. Start online at your own pace,
            or commit to the full certification with hands-on workshop.
          </p>
        </div>

        {/* Global error */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">

          {/* Online Course Card */}
          <div className="glass rounded-2xl p-6 md:p-8 border border-border/30 flex flex-col">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                Start Under $500
              </span>
            </div>

            <h2 className="text-2xl font-bold mt-3 mb-2 text-foreground">Online Course</h2>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Complete the 8 online modules in your own time. Upgrade to add a hands-on workshop later — just pay the difference.
            </p>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-black text-foreground">$497</span>
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
                'Upgrade to full course for $693 later',
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
              className="w-full py-4 px-6 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                Upgrade path: add workshop for $693 = $1,190 total
              </p>
            </div>
          </div>

          {/* Complete Course Card */}
          <div className="glass rounded-2xl p-6 md:p-8 border-2 border-accent/40 flex flex-col relative">
            {/* Early bird badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-5 py-1.5 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
                Early Bird — Save $210
              </div>
            </div>

            <div className="flex items-center gap-3 mb-2 mt-2">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-teal-600" />
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                Most Popular
              </span>
            </div>

            <h2 className="text-2xl font-bold mt-3 mb-2 text-foreground">Complete Course</h2>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Full training: 8 online modules plus a full-day hands-on workshop. Everything you need for clinical confidence.
            </p>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xl text-muted-foreground line-through font-semibold">$1,400</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Save $210</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-black text-foreground">$1,190</span>
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
                'Choose your preferred location',
                'Flexible workshop date selection',
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" strokeWidth={3} />
                  <span className="text-foreground/80">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Location Selector */}
            <div className="mb-5">
              <label className="text-sm font-semibold mb-2.5 flex items-center gap-1.5 text-foreground/80">
                <MapPin className="w-4 h-4 text-accent" />
                Select Workshop Location
              </label>
              <div className="space-y-2">
                {LOCATIONS.map(loc => (
                  <LocationRow
                    key={loc.value}
                    loc={loc}
                    isSelected={selectedLocation === loc.value || openTbaCity === loc.value}
                    showInterestForm={openTbaCity === loc.value}
                    onSelect={handleLocationSelect}
                  />
                ))}
              </div>

              {/* Helper text when a TBA location is open */}
              {openTbaCity && !canEnroll && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Select Sydney or Byron Bay to enroll now, or register your interest above for Melbourne.
                </p>
              )}
            </div>

            {/* Enroll Button */}
            <button
              onClick={() => handleCheckout('full-course')}
              disabled={!canEnroll || loading !== null}
              className="btn-primary w-full py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading === 'full-course' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  {canEnroll
                    ? `Enroll — ${selectedLocationObj?.label}, ${selectedLocationObj?.date}`
                    : 'Select a Location to Enroll'}
                  {canEnroll && <ArrowRight className="w-5 h-5" />}
                </>
              )}
            </button>

            {!canEnroll && !openTbaCity && (
              <p className="mt-2 text-xs text-center text-muted-foreground">
                Select a confirmed location above to activate enrollment
              </p>
            )}

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-900 font-medium">
                Early bird pricing ends soon — lock in $1,190 before it goes back to $1,400.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="mt-12 md:mt-16">
          <div className="glass rounded-2xl px-8 py-6 max-w-3xl mx-auto">
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
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-teal-600" strokeWidth={2.5} />
                <span>Endorsed by Osteopathy Australia</span>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mt-16 md:mt-20">
          <h2 className="text-2xl font-bold text-center mb-8 text-foreground">Common Questions</h2>
          <div className="space-y-3">
            {faqs.map((item, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left gap-3"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-semibold text-sm text-foreground">{item.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Page Export ─────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  )
}
