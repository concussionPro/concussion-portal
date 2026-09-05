'use client'

import { useState } from 'react'
import { Loader2, Check, MapPin, Users } from 'lucide-react'
import { trackInterestRegistration } from '@/lib/analytics'
import { CONFIG } from '@/lib/config'
import { SecureSeatCheckout } from '@/components/SecureSeatCheckout'

type CitySlug = 'sydney' | 'adelaide' | 'wa'
type Selection = CitySlug | 'team'

const CITIES: { slug: CitySlug; label: string }[] = [
  { slug: 'sydney', label: 'Sydney' },
  { slug: 'adelaide', label: 'Adelaide' },
  { slug: 'wa', label: 'Perth / WA' },
]

export function OtherCityInterest() {
  const [selection, setSelection] = useState<Selection>('sydney')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [clinicianCount, setClinicianCount] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const isTeam = selection === 'team'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      if (isTeam) {
        const res = await fetch('/api/lead-magnet/team-training-inquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            name,
            teamSize: clinicianCount.trim() || undefined,
            notes: 'Inquired via /pricing page team-training pill — wants a follow-up call.',
          }),
        })
        const data = await res.json()
        if (data.success) {
          setMessage("Got it. Zac will be in touch personally within 1-2 business days to discuss your team's training. You'll also get a confirmation email.")
          setDone(true)
        } else {
          setError(data.error || 'Something went wrong.')
        }
      } else {
        const res = await fetch('/api/register-interest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // /api/register-interest defines an 'other_city' source for exactly
          // this form and defaults anything unrecognised to 'pricing_page'.
          // Omitting it filed every registration from here under the pricing
          // page, so the source column could never separate the two.
          body: JSON.stringify({ email, name, city: selection, source: 'other_city' }),
        })
        const data = await res.json()
        if (data.success) {
          trackInterestRegistration(selection, email)
          setMessage(data.message)
          setDone(true)
        } else {
          setError(data.error || 'Something went wrong.')
        }
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const cityLabel = CITIES.find((c) => c.slug === selection)?.label ?? 'your city'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-[0_6px_24px_-8px_rgba(15,23,42,0.08)]">
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
          {isTeam ? 'Training a whole team?' : 'Not in Melbourne?'}
        </p>
      </div>
      <p className="text-sm font-semibold text-slate-900 leading-snug mb-0.5">
        {isTeam ? 'Inquire about in-house team training' : 'Secure your seat for your city'}
      </p>
      <p className="text-[12px] text-slate-600 leading-snug mb-3">
        {isTeam
          ? 'In-house training for clinics, sports orgs, and hospital networks. Pricing scoped privately on a short call.'
          : `Put A$${CONFIG.COURSE.PRICE_SECURE_SEAT} down for ${cityLabel} — counts toward the cohort gate. Free notify-me stays secondary below.`}
      </p>

      {!isTeam && (
        <div className="mb-3">
          <SecureSeatCheckout
            defaultCity={selection as 'sydney' | 'adelaide' | 'wa'}
            lockCity
            variant="button"
            source="other_city_interest"
          />
          <p className="mt-2 text-[11px] text-slate-500 text-center">Or free notify-me (does not count toward the seat gate):</p>
        </div>
      )}

      {done ? (
        <div className="flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[13px] text-emerald-900 leading-snug">{message}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-2.5">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Workshop city or team training">
            {CITIES.map((c) => (
              <button
                key={c.slug}
                type="button"
                role="radio"
                aria-checked={selection === c.slug}
                onClick={() => setSelection(c.slug)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-colors ${
                  selection === c.slug
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                {c.label}
              </button>
            ))}
            <button
              type="button"
              role="radio"
              aria-checked={isTeam}
              onClick={() => setSelection('team')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-colors ${
                isTeam
                  ? 'bg-teal-700 text-white border-teal-700'
                  : 'bg-white text-teal-700 border-teal-300 hover:border-teal-500'
              }`}
            >
              <Users className="w-3 h-3" />
              Team training
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@clinic.com.au"
              autoComplete="email"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            />
          </div>

          {isTeam && (
            <input
              type="number"
              min={1}
              max={200}
              required
              value={clinicianCount}
              onChange={(e) => setClinicianCount(e.target.value)}
              placeholder="How many clinicians? (min 8 for on-site)"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full inline-flex items-center justify-center gap-1.5 rounded-lg disabled:opacity-60 text-white text-sm font-semibold py-2 transition-colors ${
              isTeam ? 'bg-teal-700 hover:bg-teal-800' : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isTeam ? (
              <>Send team training inquiry</>
            ) : (
              <>Notify me about {cityLabel}</>
            )}
          </button>

          {error && (
            <p className="text-[12px] text-red-600 leading-snug">{error}</p>
          )}

          {isTeam ? (
            <p className="text-[10px] text-slate-400 leading-snug">
              Zac responds personally within 1-2 business days. No automated sales sequence. <a href="/team-training" className="underline hover:text-slate-600">More detail →</a>
            </p>
          ) : (
            <p className="text-[10px] text-slate-400 leading-snug">
              One email when the date is confirmed. No spam, unsubscribe any time.
            </p>
          )}
        </form>
      )}
    </div>
  )
}
