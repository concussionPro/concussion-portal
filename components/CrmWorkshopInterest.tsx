'use client'

import { useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Concussion Rehab Mastery — in-person workshop interest form.
//
// There is no fixed EP cohort date, so this captures interest (not a checkout).
// It posts to the shared /api/register-interest endpoint. That route only
// accepts a fixed set of `city` codes and ignores unknown fields, so we:
//   • map the registrant's state/region onto the nearest valid city code, and
//   • fold profession + ESSA number + true region into the `name` string so
//     the founder's notification email carries the full EP context.
// ─────────────────────────────────────────────────────────────────────────────

type Profession = 'aep' | 'aes' | 'other'

const PROFESSION_LABELS: Record<Profession, string> = {
  aep: 'Accredited Exercise Physiologist',
  aes: 'Accredited Exercise Scientist',
  other: 'Other',
}

// AU state/territory → nearest valid workshop `city` code accepted by the API.
const REGIONS: { value: string; label: string; city: string }[] = [
  { value: 'nsw', label: 'New South Wales', city: 'sydney' },
  { value: 'vic', label: 'Victoria', city: 'melbourne' },
  { value: 'qld', label: 'Queensland', city: 'byron-bay' },
  { value: 'sa', label: 'South Australia', city: 'adelaide' },
  { value: 'wa', label: 'Western Australia', city: 'wa' },
  { value: 'act', label: 'ACT', city: 'sydney' },
  { value: 'tas', label: 'Tasmania', city: 'melbourne' },
  { value: 'nt', label: 'Northern Territory', city: 'adelaide' },
]

export default function CrmWorkshopInterest() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [profession, setProfession] = useState<Profession>('aep')
  const [region, setRegion] = useState('nsw')
  const [essa, setEssa] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const regionMeta = REGIONS.find((r) => r.value === region) ?? REGIONS[0]
      const cleanEssa = essa.trim()
      // Fold EP context into the name the notification email surfaces. The API
      // caps name at 100 chars, so keep the composed string within budget.
      const composedName = [
        name.trim(),
        PROFESSION_LABELS[profession].replace('Accredited Exercise ', 'A'), // AEP / AES
        cleanEssa ? `ESSA ${cleanEssa}` : null,
        regionMeta.label,
        'EP/CRM workshop',
      ]
        .filter(Boolean)
        .join(' · ')
        .slice(0, 100)

      const res = await fetch('/api/register-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: composedName,
          city: regionMeta.city,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(
          "You're registered. We'll place you in the next suitable workshop, and email you the moment an EP-specific cohort forms.",
        )
        setName('')
        setEmail('')
        setProfession('aep')
        setRegion('nsw')
        setEssa('')
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--accent-subtle)] p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-bold text-white">
          ✓
        </div>
        <h3 className="mt-5 text-lg font-semibold tracking-[-0.01em] text-[var(--foreground)]">
          You&rsquo;re on the list.
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--muted-foreground)]">
          {success}
        </p>
      </div>
    )
  }

  const inputClass =
    'w-full rounded-xl border border-[var(--border-strong)] bg-[var(--card-solid)] px-4 py-3 text-sm text-[var(--foreground)] shadow-[var(--shadow-sm)] transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--accent-muted)]'
  const labelClass =
    'mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="crm-name" className={labelClass}>
            Full name
          </label>
          <input
            id="crm-name"
            type="text"
            required
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="crm-email" className={labelClass}>
            Email
          </label>
          <input
            id="crm-email"
            type="email"
            required
            placeholder="you@clinic.com.au"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="crm-profession" className={labelClass}>
            Profession
          </label>
          <select
            id="crm-profession"
            value={profession}
            onChange={(e) => setProfession(e.target.value as Profession)}
            className={inputClass}
          >
            <option value="aep">Accredited Exercise Physiologist (AEP)</option>
            <option value="aes">Accredited Exercise Scientist (AES)</option>
            <option value="other">Other allied health</option>
          </select>
        </div>
        <div>
          <label htmlFor="crm-region" className={labelClass}>
            State / region
          </label>
          <select
            id="crm-region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className={inputClass}
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="crm-essa" className={labelClass}>
            ESSA number <span className="font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <input
            id="crm-essa"
            type="text"
            placeholder="e.g. 1234567"
            value={essa}
            onChange={(e) => setEssa(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {error ? (
        <p className="text-sm font-medium text-red-600">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-full bg-accent px-8 py-4 text-base font-semibold text-white shadow-[var(--shadow-md)] transition-transform hover:-translate-y-0.5 hover:bg-[var(--accent-light)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Registering…' : 'Register my workshop interest'}
      </button>

      <p className="text-center text-xs leading-relaxed text-[var(--muted-foreground)]">
        No fixed date yet. Registering places you in the next suitable workshop and
        flags you the moment an EP-specific cohort forms. The online course stands
        alone — the workshop is optional.
      </p>
    </form>
  )
}
