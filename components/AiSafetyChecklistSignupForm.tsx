'use client'

import { useState } from 'react'
import { Loader2, Check, ArrowRight } from 'lucide-react'

export function AiSafetyChecklistSignupForm() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
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
      const res = await fetch('/api/lead-magnet/ai-safety-checklist', {
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
          <Check className="w-4 h-4" /> Check your inbox
        </p>
        {/* The route skips the send entirely for a suppressed address and still
            answers {success:true}, so a flat "should arrive within 60 seconds"
            is a promise this component cannot keep. Keep the expectation, add
            a fallback that always works. */}
        <p className="text-xs text-emerald-800 leading-relaxed">
          The checklist is on its way to <strong>{email}</strong> — usually within a minute. If
          it doesn&apos;t turn up, check your Promotions tab or spam folder, or reply to
          zac@concussion-education-australia.com and I&apos;ll send it straight over.
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
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
      />
      <input
        type="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@clinic.com.au"
        required
        autoComplete="email"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
      />
      <button
        type="submit"
        disabled={submitting}
        className="w-full px-4 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Get the checklist <ArrowRight className="w-4 h-4" /></>}
      </button>
      {error && (
        <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">{error}</p>
      )}
    </form>
  )
}
