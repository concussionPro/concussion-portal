'use client'

import { useState } from 'react'
import {
  Check,
  ArrowRight,
  MapPin,
  Loader2,
  AlertCircle,
  Mail,
  User,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Award,
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
      <div className="mt-2 p-3 bg-[var(--accent-muted)] border border-[rgba(13,115,119,0.12)] rounded-lg flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-[var(--accent)] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-[var(--foreground)]">You&apos;re on the list!</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{form.success}</p>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`mt-2 p-3 bg-[rgba(13,115,119,0.03)] border border-[rgba(13,115,119,0.08)] rounded-lg space-y-2.5 ${compact ? 'text-xs' : 'text-sm'}`}
    >
      <p className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
        Register Interest — {cityLabel}
      </p>

      {form.error && (
        <div className="flex items-start gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          {form.error}
        </div>
      )}

      <div className="relative">
        <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--muted-foreground)] pointer-events-none" />
        <input
          type="text"
          placeholder="Your name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
          minLength={2}
          className="w-full pl-7 pr-2.5 py-2 text-xs rounded-lg border border-[rgba(13,115,119,0.1)] bg-[rgba(255,255,255,0.8)] backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]/40 placeholder:text-[var(--muted-foreground)]/50"
        />
      </div>

      <div className="relative">
        <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--muted-foreground)] pointer-events-none" />
        <input
          type="email"
          placeholder="Your email address"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          required
          className="w-full pl-7 pr-2.5 py-2 text-xs rounded-lg border border-[rgba(13,115,119,0.1)] bg-[rgba(255,255,255,0.8)] backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]/40 placeholder:text-[var(--muted-foreground)]/50"
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
        className={`w-full flex items-center justify-between rounded-lg border text-sm transition-all text-left ${
          compact ? 'px-3 py-2' : 'px-4 py-3'
        } ${
          isSelected && isConfirmed
            ? 'border-[var(--accent)] bg-[rgba(13,115,119,0.06)] ring-1 ring-[var(--accent)]/20'
            : isSelected && !isConfirmed
            ? 'border-[var(--accent)]/30 bg-[rgba(13,115,119,0.04)]'
            : 'border-[rgba(13,115,119,0.08)] hover:border-[rgba(13,115,119,0.15)] bg-[rgba(255,255,255,0.6)]'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={`font-semibold text-[var(--foreground)] ${compact ? 'text-xs' : 'text-sm'}`}>
            {loc.label}
          </span>
          {isConfirmed ? (
            <span className="text-[var(--muted-foreground)] text-xs shrink-0">· {loc.date}</span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] text-[10px] font-semibold uppercase tracking-wide shrink-0">
              Coming Soon
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          {isConfirmed && loc.spots > 0 && (
            <span className="text-xs text-[var(--muted-foreground)]">{loc.spots} left</span>
          )}
          {!isConfirmed && (
            showInterestForm
              ? <ChevronUp className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
              : <ChevronDown className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
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
  const isEarlyBird = new Date() < CONFIG.EARLY_BIRD_DEADLINE

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
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">
            <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 pt-5">
          {/* Online Course - Compact */}
          <div className="card rounded-xl p-5 flex flex-col">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center border border-orange-200/50">
                <BookOpen className="w-4 h-4 text-orange-500" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                Online Only
              </span>
            </div>

            <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">Online Course</h3>

            <div className="mb-4">
              <div className="text-2xl font-bold text-[var(--foreground)]">$497</div>
              <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">One-time · Lifetime access · 8 CPD pts</p>
            </div>

            <ul className="space-y-1.5 mb-4 flex-1">
              {[
                '8 online modules (8 CPD points)',
                'Own pace — no deadlines',
                'Clinical Toolkit & resources',
                'Digital certificate',
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <Check className="w-3 h-3 text-orange-500 flex-shrink-0 mt-0.5" strokeWidth={3} />
                  <span className="text-[var(--muted-foreground)]">{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCheckout('online-only')}
              disabled={loading !== null}
              className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold bg-[var(--foreground)] text-white hover:bg-[var(--foreground)]/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'online-only' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                'Online Only — $497'
              )}
            </button>
          </div>

          {/* Complete Course - Compact */}
          <div className="card rounded-xl p-5 flex flex-col relative" style={{ borderWidth: '2px', borderColor: 'rgba(13, 115, 119, 0.2)' }}>
            {isEarlyBird && (
              <div className="absolute -top-3.5 right-4">
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-3.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap shadow-md shadow-orange-200/50">
                  Early Bird — Save ${CONFIG.COURSE.SAVINGS}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2.5 mb-3 mt-1">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-100 to-emerald-50 flex items-center justify-center border border-teal-200/50">
                <Award className="w-4 h-4 text-[var(--accent)]" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                Recommended
              </span>
            </div>

            <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">Complete Course</h3>

            <div className="mb-4">
              {isEarlyBird ? (
                <>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm text-[var(--muted-foreground)] line-through">${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">Save ${CONFIG.COURSE.SAVINGS}</span>
                  </div>
                  <div className="text-2xl font-bold text-[var(--foreground)]">${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()}</div>
                </>
              ) : (
                <div className="text-2xl font-bold text-[var(--foreground)]">${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}</div>
              )}
              <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">One-time · 14 AHPRA CPD points</p>
            </div>

            <ul className="space-y-1.5 mb-4 flex-1">
              {[
                '8 online modules (8 CPD points)',
                'Full-day workshop (6 CPD points)',
                'Hands-on SCAT6, VOMS, BESS',
                'Clinical Toolkit & resources',
                'Certificate included',
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <Check className="w-3 h-3 text-[var(--accent)] flex-shrink-0 mt-0.5" strokeWidth={3} />
                  <span className="text-[var(--muted-foreground)]">{f}</span>
                </li>
              ))}
            </ul>

            {/* Why hands-on matters */}
            <div className="mb-4 p-3 rounded-lg bg-[rgba(13,115,119,0.04)] border border-[rgba(13,115,119,0.12)]">
              <p className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wide mb-2">Why hands-on matters</p>
              <ul className="space-y-1.5">
                {[
                  'Practice SCAT6 administration on real subjects with expert feedback',
                  'Master BESS & tandem gait scoring — the sections most clinicians get wrong',
                  'Leave with a clinical toolkit you can use Monday morning',
                ].map((item, i) => (
                  <li key={i} className="text-[11px] text-[var(--muted-foreground)] leading-relaxed flex items-start gap-1.5">
                    <span className="text-[var(--accent)] mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

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
              className="btn-primary w-full py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading === 'full-course' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : canEnroll ? (
                <>
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
    <div className="max-w-[900px] mx-auto">
      {/* Section Header */}
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-[2rem] font-bold text-[var(--foreground)] mb-3 tracking-tight">
          Enrollment Options
        </h2>
        <p className="text-base text-[var(--muted-foreground)] max-w-2xl mx-auto leading-relaxed">
          Australia&apos;s most comprehensive concussion management training — 14 CPD points with hands-on expert workshop. Online-only option also available.
        </p>
      </div>

      {/* Global error */}
      {error && (
        <div className="max-w-2xl mx-auto mb-8 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-6 pt-5">

        {/* Online Course */}
        <div className="card rounded-2xl p-7 md:p-8 flex flex-col">
          {/* Icon + Badge */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center border border-orange-200/50">
              <BookOpen className="w-5 h-5 text-orange-500" strokeWidth={2} />
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
              Online Only
            </span>
          </div>

          <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Online Course</h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-6 leading-relaxed">
            Complete the 8 online modules at your own pace. Theory and clinical frameworks — no hands-on component.
          </p>

          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-[var(--foreground)] tracking-tight">$497</span>
              <span className="text-sm text-[var(--muted-foreground)]">AUD</span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">One-time payment · Lifetime access</p>
          </div>

          <ul className="space-y-3 mb-7 flex-1">
            {[
              '8 online modules (8 CPD points)',
              'Complete at your own pace — no deadlines',
              'Lifetime access to all modules',
              'Clinical Toolkit & downloadable resources',
              'Reference Repository (130+ articles)',
              'Digital certificate',
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <Check className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-[var(--muted-foreground)]">{feature}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => handleCheckout('online-only')}
            disabled={loading !== null}
            className="w-full py-3.5 px-6 rounded-xl font-semibold bg-[var(--foreground)] text-white hover:bg-[var(--foreground)]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading === 'online-only' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Online Only — $497
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[11px] text-[var(--muted-foreground)] mt-3 text-center">
            Online modules only — does not include hands-on workshop
          </p>
        </div>

        {/* Complete Course */}
        <div className="card rounded-2xl p-7 md:p-8 flex flex-col relative" style={{ borderWidth: '2px', borderColor: 'rgba(13, 115, 119, 0.2)' }}>
          {/* Early Bird badge — top right, outside card flow */}
          {isEarlyBird && (
            <div className="absolute -top-4 right-6">
              <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-lg shadow-orange-200/50">
                Early Bird — Save ${CONFIG.COURSE.SAVINGS}
              </div>
            </div>
          )}

          {/* Icon + Badge */}
          <div className="flex items-center gap-3 mb-5 mt-1">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-50 flex items-center justify-center border border-teal-200/50">
              <Award className="w-5 h-5 text-[var(--accent)]" strokeWidth={2} />
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
              Recommended
            </span>
          </div>

          <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Complete Course</h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-6 leading-relaxed">
            Full training: 8 online modules plus a full-day hands-on workshop. Everything you need for clinical confidence.
          </p>

          <div className="mb-6">
            {isEarlyBird ? (
              <>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-base text-[var(--muted-foreground)] line-through">${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                    Save ${CONFIG.COURSE.SAVINGS}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[var(--foreground)] tracking-tight">${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()}</span>
                  <span className="text-sm text-[var(--muted-foreground)]">AUD</span>
                </div>
              </>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[var(--foreground)] tracking-tight">${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}</span>
                <span className="text-sm text-[var(--muted-foreground)]">AUD</span>
              </div>
            )}
            <p className="text-xs text-[var(--muted-foreground)] mt-1">One-time payment · 14 AHPRA CPD points</p>
          </div>

          <ul className="space-y-3 mb-6 flex-1">
            {[
              '8 online modules (8 CPD points)',
              'Full-day in-person workshop (6 CPD points)',
              'Hands-on SCAT6, VOMS, BESS training',
              'Clinical Toolkit & all resources',
              'Reference Repository (130+ articles)',
              'Choose your preferred location',
              'Flexible workshop date selection',
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <Check className="w-4 h-4 text-[var(--accent)] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-[var(--muted-foreground)]">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Why hands-on matters */}
          <div className="mb-6 p-4 rounded-xl bg-[rgba(13,115,119,0.04)] border border-[rgba(13,115,119,0.12)]">
            <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-wide mb-2.5">Why hands-on matters</p>
            <ul className="space-y-2">
              {[
                'Practice SCAT6 administration on real subjects with expert feedback',
                'Master BESS & tandem gait scoring — the sections most clinicians get wrong',
                'Leave with a clinical toolkit you can use Monday morning',
              ].map((item, i) => (
                <li key={i} className="text-sm text-[var(--muted-foreground)] leading-relaxed flex items-start gap-2">
                  <span className="text-[var(--accent)] mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Location Selector */}
          <div className="mb-4">
            <label className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-[var(--foreground)]">
              <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />
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
              <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">
                Select an available location to enroll now, or register your interest for upcoming dates.
              </p>
            )}
          </div>

          {/* Enroll Button */}
          <button
            onClick={() => handleCheckout('full-course')}
            disabled={!canEnroll || loading !== null}
            className="btn-primary w-full py-3.5 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            {loading === 'full-course' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {canEnroll
                  ? `Enroll — ${selectedLocationObj?.label}, ${selectedLocationObj?.date}`
                  : 'Select a Location to Enroll'}
                {canEnroll && <ArrowRight className="w-4 h-4" />}
              </>
            )}
          </button>

          {!canEnroll && !openTbaCity && (
            <p className="mt-2 text-[11px] text-center text-[var(--muted-foreground)]">
              Select a confirmed location above to activate enrollment
            </p>
          )}

          {isEarlyBird && (
            <p className="text-[11px] text-orange-600 font-semibold mt-3 text-center">
              Early bird ends {CONFIG.EARLY_BIRD_DEADLINE.toLocaleDateString('en-AU', { month: 'long', day: 'numeric' })} — after that, ${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}. Lock in ${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()} today.
            </p>
          )}
        </div>
      </div>

      {/* Trust Signals */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-[var(--muted-foreground)]">
        {['Secure Stripe Checkout', 'AHPRA Aligned', 'Lifetime Access', 'Certificate Included'].map(item => (
          <div key={item} className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[var(--accent)]" strokeWidth={2.5} />
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
