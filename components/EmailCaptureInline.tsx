'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle, Mail, ArrowRight } from 'lucide-react'

export function EmailCaptureInline() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [needsEmailLogin, setNeedsEmailLogin] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/signup-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // requiresEmailLogin = the address already owns something, so
        // /api/signup-free emailed a login link INSTEAD of setting a session
        // (anti-takeover, lib/account-escalation.ts). Everyone else is signed
        // in right now by the cookie the route just set — so they should be
        // sent straight into the course, not to their inbox.
        setNeedsEmailLogin(!!data.requiresEmailLogin)
        setSuccess(true)
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
        {needsEmailLogin ? (
          <>
            <p className="text-base font-semibold text-emerald-900 mb-1">
              You already have an account
            </p>
            <p className="text-sm text-emerald-700">
              We&apos;ve emailed a login link to <strong>{email}</strong> — open it and
              you&apos;ll be signed straight in.
            </p>
          </>
        ) : (
          <>
            {/* The route has already set a 1-year session cookie, so this
                visitor is logged in RIGHT NOW. The previous copy — "check your
                email for your login link" — sent a converted lead away from a
                page they were already through, into an inbox, with no link
                anywhere on the card. That is the activation gap the free-course
                funnel already suffers from (roughly half of signups never open
                Module 1). Give them the module instead. */}
            <p className="text-base font-semibold text-emerald-900 mb-1">
              You&apos;re in — and signed in.
            </p>
            <p className="text-sm text-emerald-700 mb-4">
              Your free SCAT6 Mastery course is unlocked. We&apos;ve also emailed a login link
              so you can pick it up on any device.
            </p>
            <Link
              href="/modules/101"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
            >
              Start Module 1 now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50/80 to-blue-50/80 p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
          <Mail className="w-5 h-5 text-teal-700" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">
            Get the forms + free SCAT6 Mastery course
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Enter your email for instant access to the free course — no card required.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
        <label htmlFor="email-capture-inline" className="sr-only">Email address</label>
        <input
          id="email-capture-inline"
          type="email"
          required
          placeholder="you@clinic.com.au"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Get Free Course'
          )}
        </button>
      </form>

      {error && (
        <p className="text-xs text-red-600 mt-2">{error}</p>
      )}
    </div>
  )
}
