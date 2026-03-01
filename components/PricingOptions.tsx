'use client'

import { useState } from 'react'
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

// ─── Types ───────────────────────────────────────────────────────────────────

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

export interface PricingOptionsProps {
  variant?: 'full' | 'compact'
}

// ─── Location data ────────────────────────────────────────────────────────────

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

// ─── Inline Interest Form ─────────────────────────────────────────────────────

function InterestForm({
  city,
  cityLabel,
  compact = false,
}: {
  city: string
  cityLabel: string
  compact?: boolean
}) {
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
        setForm(f => ({
          ...f,
          loading: false,
          success: data.message || "You're on the list!",
        }))
      } else {
        setForm(f => ({
          ...f,
          loading: false,
          error: data.error || 'Something went wrong. Please try again.',
        }))
      }
    } catch {
      setForm(f => ({ ...f, loading: false, error: 'Network error. Please try again.' }))
    }
  }

  if (form.success) {
    return (
      <div className="mt-2 p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-teal-900">You&apos;re on the list!</p>
          <p className="text-xs text-teal-700 mt-0.5">{form.success}</p>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`mt-2 p-3 bg-slate-50 border border-border/40 rounded-xl space-y-2.5 ${compact ? 'text-xs' : 'text-sm'}`}
    >
      <p className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wide">
        Register Interest — {cityLabel}
      </p>

      {form.error && (
        <div className="flex items-start gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          {form.error}
        </div>
      )}

      <div className="relative">
        <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Your name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
          minLength={2}
          className="w-full pl-7 pr-2.5 py-2 text-xs rounded-lg border border-border/60 bg-white focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 placeholder:text-muted-foreground/60"
        />
      </div>

      <div className="relative">
        <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
        <input
          type="email"
          placeholder="Your email address"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          required
          className="w-full pl-7 pr-2.5 py-2 text-xs rounded-lg border border-border/60 bg-white focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 placeholder:text-muted-foreground/60"
        />
      </div>

      <button
        type="submit"
        disabled={form.loading}
        className="btn-primary w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {form.loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <>
            <Mail className="w-3.5 h-3.5" />
            Notify Me When Confirmed
          </>
        )}
      </button>
    </form>
  )
}

// ─── Location Row ─────────────────────────────────────────────────────────────

function LocationRow({
  loc,
  isSelected,
  showInterestForm,
  onSelect,
  compact,
}: {
  loc: LocationOption
  isSelected: boolean
  showInterestForm: boolean
  onSelect: (value: string) => void
  compact: boolean
}) {
  const isConfirmed = loc.status === 'confirmed'

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(loc.value)}
        aria-pressed={isSelected}
        className={`w-full flex items-center justify-between rounded-xl border text-sm transition-all text-left ${
          compact ? 'px-3 py-2' : 'px-4 py-3'
        } ${
          isSelected && isConfirmed
            ? 'border-accent bg-accent/5 ring-2 ring-accent/20'
            : isSelected && !isConfirmed
            ? 'border-accent/40 bg-accent/5 ring-1 ring-accent/15'
            : 'border-border/40 hover:border-border/60 bg-white/50'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={`font-semibold text-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
            {loc.label}
          </span>
          {isConfirmed ? (
            <span className="text-muted-foreground text-xs shrink-0">· {loc.date}</span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold uppercase tracking-wide shrink-0">
              Coming Soon
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          {isConfirmed && loc.spots > 0 && (
            <span className="text-xs text-muted-foreground">{loc.spots} left</span>
          )}
          {!isConfirmed && (
            showInterestForm
              ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
              : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      {!isConfirmed && showInterestForm && (
        <InterestForm city={loc.value} cityLabel={loc.label} compact={compact} />
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PricingOptions({ variant = 'full' }: PricingOptionsProps) {
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [openTbaCity, setOpenTbaCity] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isCompact = variant === 'compact'

  const handleLocationSelect = (value: string) => {
    const loc = LOCATIONS.find(l => l.value === value)
    if (!loc) return

    if (loc.status === 'confirmed') {
      setSelectedLocation(value)
      setOpenTbaCity(null)
      setError(null)
    } else {
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

  // COMPACT VARIANT
  if (isCompact) {
    return (
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">
            <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Online Course - Compact */}
          <div className="glass rounded-xl border border-border/30 p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground">Online Course</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                Under $500
              </span>
            </div>

            <div className="mb-4">
              <div className="text-2xl font-black text-foreground">$497</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">One-time · Lifetime access · 8 CPD hrs</p>
            </div>

            <ul className="space-y-1.5 mb-4 flex-1">
              {[
                '8 online modules (8 CPD hours)',
                'Own pace — no deadlines',
                'Clinical Toolkit & resources',
                'Digital certificate',
                'Upgrade to full course later',
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <Check className="w-3 h-3 text-purple-600 flex-shrink-0 mt-0.5" strokeWidth={3} />
                  <span className="text-foreground/75">{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCheckout('online-only')}
              disabled={loading !== null}
              className="w-full py-2.5 px-4 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'online-only' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  Start for $497
                </>
              )}
            </button>
          </div>

          {/* Complete Course - Compact */}
          <div className="glass rounded-xl border-2 border-accent/40 p-5 flex flex-col relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-amber-500 text-white px-3 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap">
                Save $210
              </span>
            </div>

            <div className="flex items-center justify-between mb-3 mt-1">
              <h3 className="text-sm font-bold text-foreground">Complete Course</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                Early Bird
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm text-muted-foreground line-through">$1,400</span>
              </div>
              <div className="text-2xl font-black text-foreground">$1,190</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">One-time · 14 AHPRA CPD hours</p>
            </div>

            <ul className="space-y-1.5 mb-4 flex-1">
              {[
                '8 online modules (8 CPD hours)',
                'Full-day workshop (6 CPD hours)',
                'Hands-on SCAT6, VOMS, BESS',
                'Clinical Toolkit & resources',
                'Certificate included',
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <Check className="w-3 h-3 text-teal-600 flex-shrink-0 mt-0.5" strokeWidth={3} />
                  <span className="text-foreground/75">{f}</span>
                </li>
              ))}
            </ul>

            {/* Compact location selector */}
            <div className="mb-3 space-y-1.5">
              {LOCATIONS.map(loc => (
                <LocationRow
                  key={loc.value}
                  loc={loc}
                  isSelected={selectedLocation === loc.value || openTbaCity === loc.value}
                  showInterestForm={openTbaCity === loc.value}
                  onSelect={handleLocationSelect}
                  compact={true}
                />
              ))}
            </div>

            <button
              onClick={() => handleCheckout('full-course')}
              disabled={!canEnroll || loading !== null}
              className="btn-primary w-full py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading === 'full-course' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : canEnroll ? (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  Enroll — {selectedLocationObj?.label}
                </>
              ) : (
                'Select a Location to Enroll'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // FULL VARIANT
  return (
    <div className="max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-4 border border-accent/20">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-accent">Choose Your Path</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Flexible Enrollment Options
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Start learning today or commit to the full certification with hands-on workshop.
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
      <div className="grid md:grid-cols-2 gap-6 md:gap-8">

        {/* Online Course - Full */}
        <div className="glass rounded-2xl p-6 md:p-8 border border-border/30 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
              Start Under $500
            </span>
          </div>

          <h3 className="text-2xl font-bold mt-3 mb-2 text-foreground">Online Course</h3>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Complete the online section in your own time. Upgrade to add a hands-on workshop later — just pay the difference.
          </p>

          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-foreground">$497</span>
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

        {/* Complete Course - Full */}
        <div className="glass rounded-2xl p-6 md:p-8 border-2 border-accent/40 flex flex-col relative">
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

          <h3 className="text-2xl font-bold mt-3 mb-2 text-foreground">Complete Course</h3>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Full training: 8 online modules plus a full-day hands-on workshop. Everything you need for clinical confidence.
          </p>

          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xl text-muted-foreground line-through font-semibold">$1,400</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Save $210</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-foreground">$1,190</span>
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
                  compact={false}
                />
              ))}
            </div>

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
      <div className="mt-12 text-center">
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
    </div>
  )
}
