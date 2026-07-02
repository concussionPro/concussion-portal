'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { setIdentity, trackEvent } from '@/lib/analytics'

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

    // Verify token. MUST be a POST — the API's GET path validates without
    // consuming (email security scanners prefetch bare GETs and were
    // burning one-time tokens before the user clicked). Only the POST
    // consumes the token and sets the session cookie.
    fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`, { method: 'POST' })
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
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'login', {
            method: 'magic_link',
            access_level: data.user.accessLevel,
          })
        }

        // Session cookie is set automatically by the server
        // Short delay to allow gtag to fire before redirect
        setTimeout(() => {
          const urlRedirect = searchParams.get('redirect')
          const savedRedirect = localStorage.getItem('login_redirect')
          localStorage.removeItem('login_redirect')

          const isValidRedirect = (path: string) => {
            return path.startsWith('/') && !path.startsWith('//') && !path.includes('\\') && !path.includes('\n')
          }

          // Hard navigation, not router.push — App Router's RSC navigation
          // can race with the Set-Cookie commit, leaving middleware seeing
          // no session and bouncing back to /login. Full browser nav avoids
          // the race entirely.
          //
          // Priority: ?redirect= URL param (admin-generated direct links) >
          // localStorage (set by /login when user came from a gated page) >
          // accessLevel default. URL param wins so admins can point a
          // specific user at a specific page via a baked one-click URL.
          // Preview users may deep-link ONLY into module content (/modules/*
          // — the Day-0 welcome CTA lands them IN Module 1); every other
          // redirect stays blocked for preview.
          const previewAllowed = (path: string) => path.startsWith('/modules/')
          const isPreview = data.user.accessLevel === 'preview'
          let target = '/dashboard'
          if (urlRedirect && isValidRedirect(urlRedirect) && (!isPreview || previewAllowed(urlRedirect))) {
            target = urlRedirect
          } else if (savedRedirect && isValidRedirect(savedRedirect) && (!isPreview || previewAllowed(savedRedirect))) {
            target = savedRedirect
          } else if (isPreview) {
            target = '/modules/101'
          }
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

export default function VerifyMagicLink() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-[#5b9aa6] animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
