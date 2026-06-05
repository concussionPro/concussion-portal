'use client'

import { useState } from 'react'
import { ArrowUpRight, Bell, CheckCircle2 } from 'lucide-react'

const VALID_CITIES = ['sydney', 'melbourne', 'byron-bay', 'adelaide', 'wa'] as const
type ValidCity = (typeof VALID_CITIES)[number]

const CITY_LABELS: Record<ValidCity, string> = {
  sydney: 'Sydney',
  melbourne: 'Melbourne',
  'byron-bay': 'Byron Bay',
  adelaide: 'Adelaide',
  wa: 'Western Australia (Perth)',
}

// Default the city dropdown by state (the workshop tour cities are
// the only valid ones — anyone in QLD/NT/TAS picks the nearest).
function defaultCityForState(state: string): ValidCity {
  const s = state?.toUpperCase() ?? ''
  if (s === 'NSW') return 'sydney'
  if (s === 'VIC') return 'melbourne'
  if (s === 'SA') return 'adelaide'
  if (s === 'WA') return 'wa'
  return 'byron-bay'
}

export function IndividualInterestCard({
  clinicShortName,
  clinicState,
}: {
  clinicShortName: string
  clinicState: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState<ValidCity>(defaultCityForState(clinicState))
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setStatus('error')
      setMessage('Name and email are required.')
      return
    }
    setStatus('submitting')
    setMessage(null)
    try {
      const res = await fetch('/api/register-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          city,
          source: 'prospect_portal',
          clinicShortName,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(data?.error ?? 'Something went wrong. Please try again.')
        return
      }
      setStatus('success')
      setMessage(data?.message ?? "You're on the list — we'll be in touch.")
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white p-5 sm:p-6 mt-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-emerald-700 mb-1">
              You&apos;re on the list
            </p>
            <h4 className="text-base font-bold text-foreground mb-1">
              We&apos;ll notify you when {CITY_LABELS[city]} training is locked in.
            </h4>
            <p className="text-[13px] text-muted-foreground leading-relaxed">{message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border-2 border-accent/15 bg-white p-5 sm:p-6 mt-3">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start gap-3 text-left group"
        aria-expanded={expanded}
      >
        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/15 transition-colors">
          <Bell className="w-4 h-4 text-accent" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-1">
            Not the decision-maker?
          </p>
          <h4 className="text-base sm:text-lg font-bold text-foreground leading-tight">
            Get notified when concussion training comes to your city
          </h4>
          <p className="text-[13px] text-muted-foreground leading-relaxed mt-1">
            Individual signup · workshop tour dates, online-course launch updates,
            new concussion-adjacent modules.
          </p>
        </div>
        <div className="shrink-0 text-xs font-semibold text-accent flex items-center gap-1 mt-1">
          {expanded ? 'Close' : 'Sign up'}
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </button>

      {expanded && (
        <form onSubmit={submit} className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Your name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="First Last"
              className="w-full px-3 py-2 rounded-lg border border-accent/20 bg-white text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@clinic.com.au"
              className="w-full px-3 py-2 rounded-lg border border-accent/20 bg-white text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Nearest workshop city
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value as ValidCity)}
              className="w-full px-3 py-2 rounded-lg border border-accent/20 bg-white text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
            >
              {VALID_CITIES.map((c) => (
                <option key={c} value={c}>
                  {CITY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          {status === 'error' && message && (
            <p className="sm:col-span-2 text-[12px] text-rose-600 font-medium">{message}</p>
          )}
          <div className="sm:col-span-2 flex items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-muted-foreground">
              One-click unsubscribe on every email.
            </p>
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-bold shadow-sm hover:shadow-md transition-shadow disabled:opacity-60"
            >
              {status === 'submitting' ? 'Adding…' : 'Notify me'}
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
