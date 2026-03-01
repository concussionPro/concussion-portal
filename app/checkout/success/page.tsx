'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, Mail, BookOpen, ArrowRight, Loader2, AlertTriangle } from 'lucide-react'

interface SessionData {
  customerName: string
  customerEmail: string
  courseType: string
  location: string
  amountPaid: number
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [conversionFired, setConversionFired] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      setError(true)
      return
    }

    // Fetch session details
    fetch(`/api/checkout-session?session_id=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSessionData(data.session)

          // Fire Google Ads conversion (only once)
          if (!conversionFired && typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'conversion', {
              send_to: 'AW-17984048021/checkout_complete',
              value: data.session.amountPaid,
              currency: 'AUD',
              transaction_id: sessionId,
            })
            setConversionFired(true)
            console.log('📊 Google Ads conversion fired:', data.session.amountPaid, 'AUD')
          }
        } else {
          setError(true)
        }
      })
      .catch(() => {
        // Even if API fails, the purchase was still successful (Stripe confirmed)
        // Fire a generic conversion
        if (!conversionFired && typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'conversion', {
            send_to: 'AW-17984048021/checkout_complete',
            currency: 'AUD',
          })
          setConversionFired(true)
        }
      })
      .finally(() => setLoading(false))
  }, [sessionId, conversionFired])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Confirming your purchase...</p>
        </div>
      </div>
    )
  }

  if (error && !sessionId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Session Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This page requires a valid checkout session. If you just completed a purchase, check your email for a login link.
          </p>
          <button
            onClick={() => router.push('/')}
            className="btn-primary px-8 py-3 rounded-xl font-semibold"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }

  const courseName = sessionData?.courseType === 'full-course'
    ? `Complete Course${sessionData?.location ? ` — ${formatLocation(sessionData.location)}` : ''}`
    : 'Online Course'

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Nav */}
      <nav className="glass border-b border-border/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => router.push('/')}
            className="text-xl font-bold"
          >
            Concussion<span className="text-gradient">Pro</span>
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16 md:py-24">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Welcome to ConcussionPro
          </h1>
          {sessionData?.customerName && (
            <p className="text-lg text-muted-foreground">
              Thank you, {sessionData.customerName.split(' ')[0]}. Your enrollment is confirmed.
            </p>
          )}
        </div>

        {/* Order Summary Card */}
        <div className="glass rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="font-bold text-lg mb-4">Enrollment Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border/30">
              <span className="text-muted-foreground">Course</span>
              <span className="font-semibold">{courseName}</span>
            </div>
            {sessionData?.amountPaid && (
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-semibold">${sessionData.amountPaid.toLocaleString()} AUD</span>
              </div>
            )}
            {sessionData?.customerEmail && (
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-muted-foreground">Email</span>
                <span className="font-semibold">{sessionData.customerEmail}</span>
              </div>
            )}
            {sessionData?.courseType === 'full-course' && sessionData?.location && (
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-muted-foreground">Workshop Location</span>
                <span className="font-semibold">{formatLocation(sessionData.location)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="space-y-4 mb-10">
          <h2 className="font-bold text-lg">What Happens Next</h2>

          <div className="flex items-start gap-4 glass rounded-xl p-5">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Check Your Email</h3>
              <p className="text-sm text-muted-foreground">
                We&apos;ve sent a secure login link to <strong>{sessionData?.customerEmail || 'your email'}</strong>. Click it to access your course immediately. Check your spam folder if you don&apos;t see it within a few minutes.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 glass rounded-xl p-5">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Start Learning</h3>
              <p className="text-sm text-muted-foreground">
                {sessionData?.courseType === 'full-course'
                  ? 'Begin your 8 online modules right away. Complete them at your own pace before your in-person workshop date.'
                  : 'Dive into all 8 online modules at your own pace. You have lifetime access — no deadlines or time limits.'}
              </p>
            </div>
          </div>

          {sessionData?.courseType === 'full-course' && (
            <div className="flex items-start gap-4 glass rounded-xl p-5">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-amber-600 text-lg">📋</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Workshop Details</h3>
                <p className="text-sm text-muted-foreground">
                  You&apos;ll receive a separate email with your {formatLocation(sessionData?.location || '')} workshop details, including venue address, schedule, and what to bring. Contact us at{' '}
                  <a href="mailto:zac@concussion-education-australia.com" className="text-accent hover:underline">
                    zac@concussion-education-australia.com
                  </a>
                  {' '}to change your workshop date.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push('/login')}
            className="flex-1 btn-primary px-8 py-4 rounded-xl font-bold text-center flex items-center justify-center gap-2"
          >
            Go to Login
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 px-8 py-4 rounded-xl font-semibold text-center border border-border/50 text-muted-foreground hover:bg-surface/50 transition-colors"
          >
            Back to Homepage
          </button>
        </div>

        {/* Support */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Questions? Contact{' '}
          <a href="mailto:zac@concussion-education-australia.com" className="text-accent hover:underline">
            zac@concussion-education-australia.com
          </a>
        </p>
      </div>
    </div>
  )
}

function formatLocation(slug: string): string {
  const map: Record<string, string> = {
    'sydney': 'Sydney',
    'melbourne': 'Melbourne',
    'byron-bay': 'Byron Bay',
  }
  return map[slug] || slug || ''
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
