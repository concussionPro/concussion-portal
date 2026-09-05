'use client'

import { useState } from 'react'
import { trackEvent } from '@/lib/analytics'
import { CONFIG } from '@/lib/config'
import { SecureSeatCheckout } from '@/components/SecureSeatCheckout'

/**
 * Public interest capture for a practical-day city.
 *
 * Posts to the EXISTING public /api/register-interest (email, name, city,
 * source) — no new endpoint, no new table. That route already dedupes and is
 * the same one /in-person and the pricing page use.
 *
 * Deliberately NOT /api/ready-to-train: that one requires a session AND
 * ownership of an online course, which is exactly why the pool was empty — a
 * cold visitor who would happily come to a Sydney workshop had no way in.
 */
export default function ReadyToTrainInterest({
  cities,
}: {
  cities: Array<{ slug: string; city: string }>
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'saving') return
    if (!name.trim()) { setState('error'); setMessage('Please enter your name.'); return }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setState('error'); setMessage('Please enter a valid email address.'); return }
    if (!city) { setState('error'); setMessage('Choose the city you would travel to.'); return }

    setState('saving')
    try {
      const res = await fetch('/api/register-interest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), city, source: 'next_early_bird' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setState('error')
        setMessage(typeof data?.error === 'string' ? data.error : 'Could not record that — please try again.')
        return
      }
      void trackEvent('workshop_interest_submit', { city, source: 'ready_to_train' })
      setState('done')
      setMessage(
        typeof data?.message === 'string'
          ? data.message
          : 'Noted — you’ll hear from us the moment that city is scheduled.',
      )
    } catch {
      setState('error')
      setMessage('Network error — please try again.')
    }
  }

  if (state === 'done') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-sm font-semibold text-emerald-900 mb-1">You’re on the list</p>
        <p className="text-sm text-emerald-800">{message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
        <p className="text-sm font-bold text-foreground mb-1">Unlock your seat</p>
        <p className="text-[13px] text-muted-foreground mb-3">
          A${CONFIG.COURSE.PRICE_SECURE_SEAT} refundable deposit — preferred city on checkout.
          Counts toward the {CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD}-seat gate. Free notify does not.
        </p>
        <SecureSeatCheckout
          defaultCity={(city || cities[0]?.slug || 'melbourne') as 'melbourne' | 'sydney' | 'byron-bay' | 'adelaide' | 'wa'}
          variant="button"
          source="ready_to_train"
        />
      </div>
    <form onSubmit={submit} className="rounded-xl border border-border p-5">
      <p className="text-sm font-bold text-foreground mb-1">Prefer a free reminder?</p>
      <p className="text-[13px] text-muted-foreground mb-4">
        Notify me only — secondary. Does not count toward launching a date.
      </p>
      <div className="grid sm:grid-cols-2 gap-2 mb-2">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-[14px]"
        />
        <input
          type="email"
          inputMode="email"
          placeholder="you@clinic.com.au"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-[14px]"
        />
      </div>
      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="w-full mb-3 rounded-lg border border-slate-300 px-3 py-2 text-[14px] bg-white"
      >
        <option value="">Which city would you travel to?</option>
        {cities.map((c) => (
          <option key={c.slug} value={c.slug}>{c.city}</option>
        ))}
      </select>
      {state === 'error' && <p className="text-[12px] text-red-600 mb-2">{message}</p>}
      <button
        type="submit"
        disabled={state === 'saving'}
        className="btn-primary rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
      >
        {state === 'saving' ? 'Saving…' : 'Tell me when it’s scheduled'}
      </button>
    </form>
    </div>
  )
}
