'use client'

import { useState } from 'react'
import { Loader2, Check, ArrowRight } from 'lucide-react'

export function PpcsWaitlistForm() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [alreadyOnList, setAlreadyOnList] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/lead-magnet/ppcs-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), name: name.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data?.error || 'Signup failed. Try again.')
        setSubmitting(false)
        return
      }
      // The route already tells us whether this request created the signup.
      // A repeat submission sends NO email (route line ~66) but still answers
      // {success:true}, so the old unconditional "Confirmation email is on its
      // way" was false for anyone re-checking they were on the list.
      setAlreadyOnList(data.isNewSignup === false)
      setSubmitted(true)
    } catch {
      setError('Network error. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm font-semibold text-emerald-900 flex items-center gap-1.5 mb-1">
          <Check className="w-4 h-4" /> You&apos;re on the list
        </p>
        <p className="text-xs text-emerald-800 leading-relaxed">
          {alreadyOnList ? (
            <>
              <strong>{email}</strong> was already on the list — nothing more to do. The next
              email arrives on launch day with your 50%-off code. No spam between now and then.
            </>
          ) : (
            <>
              Confirmation email is on its way to <strong>{email}</strong>. Next email arrives on
              launch day with your 50%-off code. No spam between now and then.
            </>
          )}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="First name (optional)"
        autoComplete="given-name"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
      />
      <input
        type="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@clinic.com.au"
        required
        autoComplete="email"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
      />
      <button
        type="submit"
        disabled={submitting}
        className="w-full px-4 py-2.5 rounded-lg bg-purple-700 text-white text-sm font-semibold hover:bg-purple-800 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Notify me + 50% off launch <ArrowRight className="w-4 h-4" /></>}
      </button>
      {error && (
        <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">{error}</p>
      )}
    </form>
  )
}
