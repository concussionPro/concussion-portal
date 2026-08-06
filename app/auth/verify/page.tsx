'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { setIdentity, trackEvent } from '@/lib/analytics'
import { isSafeRelativePath } from '@/lib/safe-redirect'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your login link...')
  const hasVerified = useRef(false)

  useEffect(() => {
    if (hasVerified.current) return
    hasVerified.current = true

    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      setMessage('Invalid link - no token provided')
      return
    }

    // Where the user was headed: the ?redirect= URL param (admin-generated
    // direct links, lead-magnet deep links) wins over the localStorage stash
    // set by /login when the visitor was bounced off a gated page.
    //
    // It is sent WITH the verify call so the SERVER resolves the landing
    // target. This page previously re-implemented the rule and allowed only
    // /modules/* for preview tier — which dumped preview-tier PAYING
    // customers (CRM owners, SST clinics) and every lead-magnet recipient on
    // /modules/101.
    const urlRedirect = searchParams.get('redirect')
    const savedRedirect = typeof window !== 'undefined' ? localStorage.getItem('login_redirect') : null
    if (typeof window !== 'undefined') localStorage.removeItem('login_redirect')
    const requestedRedirect = urlRedirect || savedRedirect
    const verifyUrl = `/api/auth/verify?token=${encodeURIComponent(token)}` +
      (isSafeRelativePath(requestedRedirect) ? `&redirect=${encodeURIComponent(requestedRedirect)}` : '')

    // Verify token. MUST be a POST — the API's GET path validates without
    // consuming (email security scanners prefetch bare GETs and were
    // burning one-time tokens before the user clicked). Only the POST
    // consumes the token and sets the session cookie.
    fetch(verifyUrl, { method: 'POST' })
      .then(async (res) => {
        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Verification failed')
        }
        return res.json()
      })
      .then((data) => {
        setStatus('success')
        setMessage('Login successful! You\'ll stay logged in. Redirecting...')

        // Stitch identity — every subsequent analytics event from this
        // browser will carry user_email so the funnel can show
        // "Jane logged in → viewed /pricing → bought" without server-side
        // cookie→email JOINs.
        if (data.user?.email) {
          setIdentity(data.user.email)
          trackEvent('identity_set', { source: 'magic-link', accessLevel: data.user.accessLevel })
        }

        // Fire gtag page_view and login event before redirecting
        // This fixes 0s sessions and 100% bounce on magic link verify
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'login', {
            method: 'magic_link',
            access_level: data.user.accessLevel,
          })
        }

        // Session cookie is set automatically by the server
        // Short delay to allow gtag to fire before redirect
        setTimeout(() => {
          // Hard navigation, not router.push — App Router's RSC navigation
          // can race with the Set-Cookie commit, leaving middleware seeing
          // no session and bouncing back to /login. Full browser nav avoids
          // the race entirely.
          //
          // The target comes from the API (resolveLandingTarget): it holds
          // the entitlement allowlist — CRM owners → their course, SST
          // clinics → /clinical-testing, free/lead-magnet surfaces for
          // preview. Never re-derive it here; the two used to disagree.
          const target = isSafeRelativePath(data.redirectTo) ? data.redirectTo : '/dashboard'
          window.location.href = target
        }, 500)
      })
      .catch((error) => {
        setStatus('error')
        setMessage(error.message || 'Link expired or invalid')
      })
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-[#5b9aa6] mx-auto mb-4 animate-spin" />
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Verifying...</h1>
              <p className="text-slate-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back!</h1>
              <p className="text-slate-600">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification Failed</h1>
              <p className="text-slate-600 mb-6">{message}</p>
              <div className="space-y-3">
                <p className="text-sm text-slate-500">Common issues:</p>
                <ul className="text-sm text-left text-slate-600 space-y-1">
                  <li>• Link has expired (links last 24 hours)</li>
                  <li>• Link has already been used</li>
                  <li>• Link is invalid or corrupted</li>
                </ul>
                <button
                  onClick={() => router.push('/login')}
                  className="mt-6 w-full px-6 py-3 bg-[#5b9aa6] text-white rounded-lg font-semibold hover:bg-[#5898a0] transition-colors"
                >
                  Request a New Login Link
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="mt-3 w-full px-6 py-3 text-slate-600 rounded-lg font-medium hover:text-slate-900 transition-colors"
                >
                  Go to Homepage
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// The Suspense fallback IS the first paint of this route — useSearchParams
// forces the content below out of the server render entirely, so a magic-link
// click (65 sessions/90d) landed on a bare spinner with 0 words of text until
// hydration finished. Say what is happening.
export default function VerifyMagicLink() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <Loader2 className="w-16 h-16 text-[#5b9aa6] mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Verifying...</h1>
            <p className="text-slate-600">Verifying your login link...</p>
          </div>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
