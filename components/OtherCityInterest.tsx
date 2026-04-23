'use client'

import { useState } from 'react'
import { Loader2, Check, MapPin } from 'lucide-react'

type CitySlug = 'sydney' | 'byron-bay' | 'adelaide' | 'wa'

const CITIES: { slug: CitySlug; label: string }[] = [
  { slug: 'sydney', label: 'Sydney' },
  { slug: 'byron-bay', label: 'Byron Bay' },
  { slug: 'adelaide', label: 'Adelaide' },
  { slug: 'wa', label: 'Perth / WA' },
]

export function OtherCityInterest() {
  const [city, setCity] = useState<CitySlug>('sydney')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/register-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, city }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage(data.message)
        setDone(true)
      } else {
        setError(data.error || 'Something went wrong.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const cityLabel = CITIES.find((c) => c.slug === city)?.label ?? 'your city'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-[0_6px_24px_-8px_rgba(15,23,42,0.08)]">
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
          Not in Melbourne?
        </p>
      </div>
      <p className="text-sm font-semibold text-slate-900 leading-snug mb-0.5">
        Register interest for your city
      </p>
      <p className="text-[12px] text-slate-600 leading-snug mb-3">
        Once {cityLabel} hits 8 registrations we lock in a date — you&apos;ll be the first to know.
      </p>

      {done ? (
        <div className="flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[13px] text-emerald-900 leading-snug">{message}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-2.5">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Workshop city">
            {CITIES.map((c) => (
              <button
                key={c.slug}
                type="button"
                role="radio"
                aria-checked={city === c.slug}
                onClick={() => setCity(c.slug)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-colors ${
                  city === c.slug
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                {c.label}
              </button>
            ))}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold py-2 transition-colors"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>Notify me about {cityLabel}</>
            )}
          </button>

          {error && (
            <p className="text-[12px] text-red-600 leading-snug">{error}</p>
          )}

          <p className="text-[10px] text-slate-400 leading-snug">
            One email when the date is confirmed. No spam, unsubscribe any time.
          </p>
        </form>
      )}
    </div>
  )
}
