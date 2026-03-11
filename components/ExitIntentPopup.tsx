'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { X, ArrowRight, Shield, Award } from 'lucide-react'

/**
 * Exit-intent popup — captures email by offering free SCAT Mastery course.
 *
 * Triggers when mouse moves toward top of viewport (desktop) or after
 * 45 seconds of inactivity (mobile fallback).
 *
 * Only shows on public marketing pages, once per session.
 * Excluded from: dashboard, login, admin, checkout, course pages.
 */

const EXCLUDED_PREFIXES = [
  '/dashboard', '/login', '/admin', '/checkout',
  '/courses', '/course', '/learning', '/settings', '/scat-mastery',
  '/pricing',
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

  const triggerPopup = useCallback(() => {
    if (isExcluded) return
    // Only show once per session
    if (sessionStorage.getItem('exit_popup_shown')) return
    sessionStorage.setItem('exit_popup_shown', '1')
    setShow(true)
  }, [isExcluded])

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
      idleTimer = setTimeout(triggerPopup, 45000)
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
    if (!email.trim() || !name.trim()) return

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
        // Track conversion
        if (typeof window !== 'undefined' && (window as any).gtag) {
          ;(window as any).gtag('event', 'generate_lead', {
            event_category: 'exit_intent',
            event_label: 'scat_mastery_popup',
          })
        }
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }

    setSubmitting(false)
  }

  if (!show || isExcluded) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
            /* Success state */
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <Award className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">You&apos;re in!</h3>
              <p className="text-sm text-gray-600 mb-4">
                Check your email for a login link to start the free SCAT Mastery course.
              </p>
              <button
                onClick={() => setShow(false)}
                className="px-6 py-2.5 bg-[#0d9488] text-white rounded-lg text-sm font-semibold hover:bg-[#0f766e] transition-colors"
              >
                Got it
              </button>
            </div>
          ) : (
            /* Form state */
            <>
              <div className="text-center mb-5">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Before you go — free SCAT6 training
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Get instant access to our 2-hour SCAT Mastery course with
                  fillable SCAT6 &amp; SCOAT6 forms. Earn 2 AHPRA CPD points — completely free.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0d9488] transition-colors"
                  required
                />
                <input
                  type="email"
                  placeholder="Your email"
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

              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" /> No spam
                </span>
                <span>Unsubscribe anytime</span>
              </div>

              <button
                onClick={() => setShow(false)}
                className="block w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-3"
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
