'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { X, ArrowRight, Shield, Award, Calendar } from 'lucide-react'
import { trackEvent, trackLeadConversion } from '@/lib/analytics'

/**
 * Exit-intent popup — captures email by offering free SCAT6 Mastery course.
 *
 * Triggers when mouse moves toward top of viewport (desktop) or after
 * 90 seconds of inactivity (mobile fallback).
 *
 * Only shows on public marketing pages, once per session.
 * Excluded from: dashboard, login, admin, checkout, course pages.
 */

// Keep in sync (in intent) with StickyCTA EXCLUDED_PATHS: never interrupt
// buyer-intent pages (/pricing, /in-person, /courses) with a free-course
// downsell, and never re-pitch the lead magnet on its own pages.
const EXCLUDED_PREFIXES = [
  '/dashboard', '/login', '/admin', '/checkout', '/pricing',
  '/courses', '/course', '/in-person', '/learning', '/settings', '/scat-mastery',
  '/scat6-download', '/scat-course', '/preseason/b',
]

export function ExitIntentPopup() {
  const pathname = usePathname()
  const [show, setShow] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const isExcluded = EXCLUDED_PREFIXES.some(p => pathname.startsWith(p))
  // On prospect-demo surfaces (/p/* and /proposals/*) the SCAT-capture form
  // is wrong — these visitors have already received cold outreach. Show a
  // book-a-call variant instead. General portal browsers keep the SCAT
  // capture which is the right offer for a top-of-funnel anonymous visitor.
  const isProspectDemo = pathname.startsWith('/p/') || pathname.startsWith('/proposals/')

  const triggerPopup = useCallback(() => {
    if (isExcluded) return
    // Only show once per session
    if (sessionStorage.getItem('exit_popup_shown')) return
    sessionStorage.setItem('exit_popup_shown', '1')
    setShow(true)
  }, [isExcluded])

  // ESC key handler to close popup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShow(false)
    }
    if (show) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [show])

  useEffect(() => {
    if (isExcluded) return

    // Already shown or dismissed
    if (sessionStorage.getItem('exit_popup_shown')) return

    // Desktop: mouse leaves viewport toward top
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5 && e.movementY < 0) {
        triggerPopup()
      }
    }

    // Mobile fallback: 45s idle timer
    let idleTimer: ReturnType<typeof setTimeout>
    const resetIdle = () => {
      clearTimeout(idleTimer)
      idleTimer = setTimeout(triggerPopup, 90000)
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('scroll', resetIdle, { passive: true })
    window.addEventListener('touchstart', resetIdle, { passive: true })
    resetIdle()

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('scroll', resetIdle)
      window.removeEventListener('touchstart', resetIdle)
      clearTimeout(idleTimer)
    }
  }, [isExcluded, triggerPopup])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !name.trim()) {
      setError('Please enter both your name and email.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/signup-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setSubmitted(true)
        // Track Google Ads lead conversion with proper label
        trackLeadConversion('TVzUCLHT0IccEJWXu_9C', 25, email.trim())
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }

    setSubmitting(false)
  }

  if (!show || isExcluded) return null

  // Prospect-demo variant — surface "book a call" instead of the SCAT capture
  if (isProspectDemo) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Book a call before you go">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShow(false)}
        />
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <button
            onClick={() => setShow(false)}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
          <div className="h-1 bg-gradient-to-r from-[#0d9488] to-[#0ea5e9]" />
          <div className="p-6 md:p-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0d9488] to-[#0ea5e9] flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Before you go — quick chat?
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              15 minutes to walk through how the program fits your team — no slides,
              no pitch. I&apos;ll come back same-day if you can&apos;t pick a slot now.
            </p>
            <div className="space-y-2">
              <a
                href="https://cal.com/zac-lewis-so8zjs/30min"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('exit_popup_book_cal', { path: pathname })}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0d9488] text-white rounded-xl text-sm font-bold hover:bg-[#0f766e] transition-colors"
              >
                Pick a time on cal.com <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="mailto:zac@concussion-education-australia.com?subject=Concussion%20training%20-%20quick%20question"
                onClick={() => trackEvent('exit_popup_email', { path: pathname })}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-[#0d9488] border border-[#0d9488]/30 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Or just email me directly
              </a>
            </div>
            <p className="text-[11px] text-gray-500 text-center mt-4">
              Zac Lewis · founder · replies personally
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Free SCAT6 training offer">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShow(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={() => setShow(false)}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-[#0d9488] to-[#0ea5e9]" />

        <div className="p-6 md:p-8">
          {submitted ? (
            /* Success state — redirect to course (user is already logged in via session cookie) */
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <Award className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">You&apos;re in!</h3>
              <p className="text-sm text-gray-600 mb-4">
                Your course is ready. We also sent a login link to your email for future access.
              </p>
              <a
                href="/scat-course"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0d9488] text-white rounded-lg text-sm font-semibold hover:bg-[#0f766e] transition-colors"
              >
                Start Course Now <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          ) : (
            /* Form state */
            <>
              <div className="text-center mb-5">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Before you go — free SCAT6 training
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Get instant access to our ~1-hour SCAT6 Mastery course with
                  fillable SCAT6 &amp; SCOAT6 forms — completely free.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Your name"
                  aria-label="Your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d9488] transition-colors"
                  required
                />
                <input
                  type="email"
                  placeholder="Your email"
                  aria-label="Your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d9488] transition-colors"
                  required
                />
                {error && (
                  <p className="text-xs text-red-600 font-medium">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0d9488] text-white rounded-xl text-sm font-semibold hover:bg-[#0f766e] transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Get Free Course'}
                  {!submitting && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>

              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" /> No spam
                </span>
                <span>Unsubscribe anytime</span>
              </div>

              <button
                onClick={() => setShow(false)}
                className="block w-full text-center text-xs text-slate-500 hover:text-slate-700 mt-3 transition-colors"
              >
                No thanks
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
