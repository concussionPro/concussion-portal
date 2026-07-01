'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check, ArrowRight, Loader2 } from 'lucide-react'
import { trackInterestRegistration } from '@/lib/analytics'

export type LocationCardProps = {
  city: string
  /** register-interest city slug — must be in the API's VALID_CITIES */
  citySlug: 'sydney' | 'melbourne' | 'byron-bay'
  img: string
  status: string
  dotClass: string
  statusTextClass: string
  caption: string
}

/**
 * Homepage workshop-location card: editorial city shot with a status pill,
 * and an inline email capture directly beneath the image that registers
 * interest for THAT city (posts to /api/register-interest). Email-only for
 * low friction — a display name is derived from the address so the admin
 * interest list still has a label.
 */
export function LocationInterestCard({ city, citySlug, img, status, dotClass, statusTextClass, caption }: LocationCardProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    const clean = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError('Enter a valid email.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const derivedName = clean.split('@')[0].slice(0, 60) || 'Interested'
      const res = await fetch('/api/register-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean, name: derivedName, city: citySlug, source: 'pricing_page' }),
      })
      const data = await res.json()
      if (data.success) {
        trackInterestRegistration(citySlug, clean)
        setMessage(data.message || `You're on the ${city} list — we'll email you when the date is confirmed.`)
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

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-[0_6px_24px_-8px_rgba(15,23,42,0.12)] transition-shadow hover:shadow-[0_14px_40px_-8px_rgba(15,23,42,0.22)]">
      <div className="relative aspect-[4/3] bg-slate-900">
        <Image
          src={img}
          alt={`${city} — Concussion Clinical Mastery workshop location`}
          fill
          sizes="(min-width: 640px) 300px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent" aria-hidden="true" />
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur px-2.5 py-1 rounded-full shadow-sm">
          <span className={`inline-flex h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden="true" />
          <span className={`text-[10px] font-bold uppercase tracking-wide ${statusTextClass}`}>{status}</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="text-white text-xl md:text-2xl font-bold tracking-tight leading-none [text-shadow:0_1px_8px_rgba(0,0,0,0.45)]">
            {city}
          </h3>
        </div>
      </div>

      <div className="p-4">
        {done ? (
          <div className="flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[13px] text-emerald-900 leading-snug">{message}</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-2">
            <p className="text-[12px] text-slate-600 leading-snug">{caption}</p>
            <div className="flex gap-2">
              <label htmlFor={`loc-email-${citySlug}`} className="sr-only">Email for {city} workshop updates</label>
              <input
                id={`loc-email-${citySlug}`}
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError('') }}
                placeholder="Your email"
                className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
              />
              <button
                type="submit"
                disabled={loading}
                aria-label={`Notify me about the ${city} workshop`}
                className="inline-flex items-center justify-center gap-1 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0b6165] disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <>Notify me <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" /></>}
              </button>
            </div>
            {error && <p className="text-[12px] text-red-600 leading-snug">{error}</p>}
          </form>
        )}
      </div>
    </div>
  )
}
