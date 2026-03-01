'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Clock, Calendar, Sparkles, ArrowRight, Zap, MapPin, Loader2 } from 'lucide-react'
import { CONFIG } from '@/lib/config'

interface PricingOptionsProps {
  variant?: 'full' | 'compact'
}

export function PricingOptions({ variant = 'full' }: PricingOptionsProps) {
  const router = useRouter()
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const locations = [
    { value: 'melbourne', label: 'Melbourne', date: CONFIG.LOCATIONS.MELBOURNE.date },
    { value: 'sydney', label: 'Sydney', date: CONFIG.LOCATIONS.SYDNEY.date },
    { value: 'byron-bay', label: 'Byron Bay', date: CONFIG.LOCATIONS.BYRON_BAY.date },
  ]

  const handleCheckout = async (courseType: 'online-only' | 'full-course') => {
    if (courseType === 'full-course' && !selectedLocation) {
      setError('Please select a workshop location.')
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
      setError('Network error. Please try again.')
      setLoading(null)
    }
  }

  const options = [
    {
      id: 'online-only' as const,
      name: 'Online Only',
      price: 497,
      priceLabel: '$497',
      badge: 'Start Under $500',
      badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
      description: "Can't commit to a course date? Complete the online section in your own time, then just pay the difference to join a workshop later.",
      features: [
        '8 online modules (8 CPD hours)',
        'Complete at your own pace — no deadlines',
        'Lifetime access to all modules',
        'Clinical Toolkit & downloadable resources',
        'Reference Repository (145+ articles)',
        'Digital certificate upon completion',
        'Upgrade to full course for $693',
      ],
      cta: 'Start for $497',
      highlight: false,
      disclaimer: 'Upgrade later for $693 · Total: $1,190 early bird price',
    },
    {
      id: 'full-course' as const,
      name: 'Complete Course',
      price: 1190,
      priceLabel: '$1,190',
      originalPrice: '$1,400',
      badge: 'Early Bird',
      badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
      description: 'Full training: online modules + hands-on workshop',
      features: [
        '8 online modules (8 CPD hours)',
        'Full-day in-person workshop (6 CPD hours)',
        'Hands-on SCAT6, VOMS, BESS training',
        'Clinical Toolkit resources',
        'Reference Repository (145+ articles)',
        'Choose Melbourne, Sydney, or Byron Bay',
        'Flexible workshop date selection',
      ],
      cta: 'Enroll in Full Course',
      highlight: true,
      disclaimer: '14 total AHPRA CPD hours · Early bird pricing',
    },
  ]

  if (variant === 'compact') {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        {error && (
          <div className="col-span-full bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {options.map((option) => (
          <div
            key={option.id}
            className={`rounded-2xl border-2 p-6 transition-all hover:shadow-xl ${
              option.highlight
                ? 'border-[#5b9aa6] bg-gradient-to-br from-blue-50 to-teal-50'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{option.name}</h3>
                <p className="text-sm text-slate-600 mt-1">{option.description}</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${option.badgeColor}`}>
                {option.badge}
              </span>
            </div>

            <div className="mb-4">
              {option.originalPrice && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg text-slate-400 line-through font-semibold">{option.originalPrice}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Save $210</span>
                </div>
              )}
              <div className="text-3xl font-black text-slate-900">{option.priceLabel}</div>
              <p className="text-xs text-slate-500 mt-1">{option.disclaimer}</p>
            </div>

            {/* Location selector for full course compact */}
            {option.id === 'full-course' && (
              <div className="mb-4 space-y-2">
                {locations.map((loc) => (
                  <button
                    key={loc.value}
                    onClick={() => { setSelectedLocation(loc.value); setError(null) }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all text-left ${
                      selectedLocation === loc.value
                        ? 'border-[#5b9aa6] bg-teal-50 ring-1 ring-[#5b9aa6]/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-semibold">{loc.label}</span>
                    <span className="text-slate-500">{loc.date}</span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => handleCheckout(option.id)}
              disabled={loading !== null}
              className={`flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl text-center font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                option.highlight
                  ? 'bg-gradient-to-r from-[#5b9aa6] to-[#6b9da8] text-white hover:from-[#5898a0] hover:to-[#5b8d96] shadow-lg'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {loading === option.id ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                option.cta
              )}
            </button>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
          <Sparkles className="w-4 h-4" />
          Choose Your Path
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Flexible Enrollment Options
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Start learning today or commit to the full certification. Either way, you&apos;re covered by our quality guarantee.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-2xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 text-center">
          {error}
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8">
        {options.map((option) => (
          <div
            key={option.id}
            className={`rounded-3xl border-2 p-8 md:p-10 transition-all hover:shadow-2xl relative ${
              option.highlight
                ? 'border-[#5b9aa6] bg-gradient-to-br from-blue-50 via-teal-50 to-white scale-105'
                : 'border-slate-200 bg-white'
            }`}
          >
            {/* Popular Badge */}
            {option.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-2 rounded-full text-sm font-black shadow-lg whitespace-nowrap">
                  Early Bird — Save $210
                </div>
              </div>
            )}

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-2xl font-bold text-slate-900">{option.name}</h3>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${option.badgeColor}`}>
                  {option.badge}
                </span>
              </div>
              <p className="text-slate-600">{option.description}</p>
            </div>

            {/* Price */}
            <div className="mb-6">
              {option.originalPrice && (
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl text-slate-400 line-through font-bold">{option.originalPrice}</span>
                  <span className="text-sm font-black px-3 py-1 rounded-full bg-amber-100 text-amber-700">Save $210</span>
                </div>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-slate-900">{option.priceLabel}</span>
                <span className="text-slate-500 text-sm">AUD</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">{option.disclaimer}</p>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-6">
              {option.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                    option.highlight ? 'bg-teal-100' : 'bg-slate-100'
                  }`}>
                    <Check className={`w-3 h-3 ${option.highlight ? 'text-teal-600' : 'text-slate-600'}`} strokeWidth={3} />
                  </div>
                  <span className="text-sm text-slate-700 leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Location Selector for Full Course */}
            {option.id === 'full-course' && (
              <div className="mb-6">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  <MapPin className="w-4 h-4 inline mr-1 text-[#5b9aa6]" />
                  Select Workshop Location
                </label>
                <div className="grid gap-2">
                  {locations.map((loc) => (
                    <button
                      key={loc.value}
                      onClick={() => { setSelectedLocation(loc.value); setError(null) }}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all text-left ${
                        selectedLocation === loc.value
                          ? 'border-[#5b9aa6] bg-teal-50/50 ring-2 ring-[#5b9aa6]/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="font-semibold text-slate-900">{loc.label}</span>
                      <span className="text-slate-500 text-xs">{loc.date}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={() => handleCheckout(option.id)}
              disabled={loading !== null}
              className={`flex items-center justify-center gap-2 w-full py-4 px-6 rounded-xl text-center font-bold transition-all group disabled:opacity-50 disabled:cursor-not-allowed ${
                option.highlight
                  ? 'bg-gradient-to-r from-[#5b9aa6] to-[#6b9da8] text-white hover:from-[#5898a0] hover:to-[#5b8d96] shadow-lg hover:shadow-xl'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {loading === option.id ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {option.id === 'online-only' ? <Clock className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                  {option.cta}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Additional Info */}
            {option.id === 'online-only' && (
              <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-xs text-purple-900 font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Upgrade Path: Add workshop for $693 = $1,190 total
                </p>
              </div>
            )}
            {option.id === 'full-course' && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-900 font-semibold">
                  Early bird pricing ends soon — lock in $1,190 before it goes to $1,400
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Trust Signals */}
      <div className="mt-12 text-center">
        <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-600">
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
            <span>Secure Stripe Checkout</span>
          </div>
        </div>
      </div>
    </div>
  )
}
