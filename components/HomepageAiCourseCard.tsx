'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Loader2, Sparkles, Check, Lock } from 'lucide-react'

/**
 * Homepage card replacing the (never-sold) Reference + Toolkit standalone SKU.
 *
 * Promotes AI in Clinical Practice (launches 17 June 2026) — greyed/locked styling
 * because not yet purchasable. Email-capture inline form POSTs to the existing
 * /api/courses/early-access endpoint with courseSlug='ai-in-clinical-practice'
 * and source='homepage'. Waitlist signups get the launch-week A$99 code emailed
 * on launch day (50% off A$197 anchor).
 */
export function HomepageAiCourseCard() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email to claim your discount.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/courses/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          courseSlug: 'ai-in-clinical-practice',
          source: 'homepage',
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data?.error || 'Could not save signup — try again.')
        setSubmitting(false)
        return
      }
      setSubmitted(true)
    } catch {
      setError('Network error — try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="group relative block rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-br from-white via-amber-50/30 to-orange-50/20 p-5 md:p-6 shadow-[0_6px_24px_-8px_rgba(15,23,42,0.12)]">
      {/* Decorative accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-[var(--accent)]" aria-hidden="true" />

      {/* Decorative corner glow */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-amber-200/40 blur-2xl pointer-events-none" aria-hidden="true" />

      <div className="relative flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-amber-700" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-amber-700">
              Launches 17 June 2026
            </p>
            <p className="text-[11px] text-slate-600 font-medium">New short course</p>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="inline-flex items-baseline gap-0.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-sm">
            <span className="text-[10px] font-semibold text-slate-400 line-through">A$197</span>
            <span className="text-[10px] font-semibold text-emerald-700 ml-1.5">A$</span>
            <span className="text-lg font-bold text-emerald-700 leading-none">99</span>
          </div>
        </div>
      </div>

      <h3 className="relative text-[16px] font-bold text-slate-900 leading-snug mb-1">
        AI in Clinical Practice
      </h3>
      <p className="relative text-[12px] text-slate-600 leading-relaxed mb-3">
        AHPRA AI guidelines, NDIS-audit-safe reports, and Heidi vs Lyrebird vs ChatGPT for clinical notes — for AU allied health. 3 CPD hours · 9 modules · certificate.
      </p>

      {/* Visual: AI course preview screenshot */}
      <div className="relative rounded-lg overflow-hidden border border-amber-200/60 mb-3 h-[110px] bg-white">
        <Image
          src="/ai-course-preview.png"
          alt="AI in Clinical Practice course preview"
          fill
          sizes="(min-width: 1024px) 340px, 100vw"
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/40 pointer-events-none" aria-hidden="true" />
      </div>

      {/* Feature pills */}
      <div className="relative flex flex-wrap gap-1.5 mb-4">
        {['AHPRA AI guidelines', 'NDIS audit-safe', 'Heidi vs Lyrebird', 'Privacy Act + indemnity'].map((pill) => (
          <span
            key={pill}
            className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700"
          >
            {pill}
          </span>
        ))}
      </div>

      {/* Email signup form OR confirmation */}
      {submitted ? (
        <div className="relative rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
          <p className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            You&rsquo;re on the list.
          </p>
          <p className="text-[11px] text-emerald-800 mt-0.5">
            Your launch-week A$99 code emails on 1 June. 50% off the A$197 regular price.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="relative space-y-2">
          <div className="flex gap-2">
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@clinic.com.au"
              required
              autoComplete="email"
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[#0b6165] disabled:opacity-50 flex items-center gap-1 transition-colors"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {submitting ? 'Saving' : 'Notify + save 50%'}
            </button>
          </div>
          {error && (
            <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
              {error}
            </p>
          )}
          <p className="text-[10px] text-slate-500 italic">
            Launch-week A$99 (50% off A$197). Code emailed 1 June. No spam.
          </p>
        </form>
      )}
    </div>
  )
}
