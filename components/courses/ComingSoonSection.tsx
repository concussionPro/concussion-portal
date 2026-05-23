'use client'

import { useState } from 'react'
import { Check, Loader2, Lock, Clock } from 'lucide-react'
import type { CourseCatalogueEntry } from '@/lib/ai-course/provider-catalogue'

interface ComingSoonSectionProps {
  courses: CourseCatalogueEntry[]
  initialCounts: Record<string, number>
}

export function ComingSoonSection({ courses, initialCounts }: ComingSoonSectionProps) {
  if (courses.length === 0) return null

  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Coming soon</h2>
        <p className="text-xs text-muted-foreground">
          Join the waitlist for 15% off launch week
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {courses.map((c) => (
          <ComingSoonCard key={c.id} course={c} initialCount={initialCounts[c.id] || 0} />
        ))}
      </div>
    </section>
  )
}

function ComingSoonCard({
  course,
  initialCount,
}: {
  course: CourseCatalogueEntry
  initialCount: number
}) {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signupCount, setSignupCount] = useState(initialCount)
  const [alreadySignedUp, setAlreadySignedUp] = useState(false)

  const discountPct = course.earlyBirdDiscountPct || 15
  const earlyPrice = course.earlyBirdPriceAUD
  const fullPrice = course.priceAUD

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email to claim your discount.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/courses/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          courseSlug: course.id,
          source: 'coming-soon-card',
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data?.error || 'Could not save signup — try again.')
        setSubmitting(false)
        return
      }
      setAlreadySignedUp(!!data.alreadySignedUp)
      if (!data.alreadySignedUp) setSignupCount((n) => n + 1)
      setSubmitted(true)
    } catch {
      setError('Network error — try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card rounded-xl p-5 flex flex-col bg-slate-50/50 border-slate-200 opacity-95">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1">
          <Lock className="w-3 h-3" /> Not yet released
        </span>
        {course.launchTarget && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> {course.launchTarget}
          </span>
        )}
      </div>
      <h3 className="text-lg font-bold text-foreground/80 mb-1">{course.title}</h3>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed flex-1">
        {course.description}
      </p>
      <div className="flex items-center justify-between text-xs mb-3">
        <span className="text-muted-foreground">
          <strong className="text-foreground/80">{course.cpdHours} CPD hours</strong>
        </span>
        {fullPrice !== null && earlyPrice != null && (
          <span className="text-muted-foreground">
            <span className="line-through">AUD ${fullPrice}</span>{' '}
            <strong className="text-emerald-700">AUD ${earlyPrice}</strong>{' '}
            <span className="text-emerald-700 font-semibold">({discountPct}% off)</span>
          </span>
        )}
      </div>

      {submitted ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
            <Check className="w-4 h-4" />
            {alreadySignedUp ? "You're already on the list." : "You're on the list."}
          </p>
          <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
            We&rsquo;ll email your {discountPct}% discount code the day this course launches. No spam, unsubscribe anytime.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@clinic.com.au"
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-foreground text-white text-sm font-semibold hover:bg-foreground/90 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {submitting ? 'Saving' : 'Notify me'}
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-2 py-1.5">
              {error}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground">
            {signupCount > 0
              ? `${signupCount} ${signupCount === 1 ? 'clinician' : 'clinicians'} already on the waitlist`
              : 'Be first on the list — discount code emailed at launch.'}
          </p>
        </form>
      )}
    </div>
  )
}
