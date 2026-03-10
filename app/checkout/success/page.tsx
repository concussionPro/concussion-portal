'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, Mail, BookOpen, ArrowRight, Loader2, AlertTriangle } from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { trackPurchaseConversion } from '@/lib/analytics'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

interface SessionData {
  customerName: string
  customerEmail?: string
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
  const conversionFiredRef = useRef(false)

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

          // Fire Google Ads conversion with enhanced data (only once)
          if (!conversionFiredRef.current) {
            trackPurchaseConversion(
              data.session.amountPaid,
              sessionId!,
              data.session.customerEmail
            )
            conversionFiredRef.current = true
          }
        } else {
          setError(true)
        }
      })
      .catch(() => {
        // Even if API fails, the purchase was still successful (Stripe confirmed)
        if (!conversionFiredRef.current) {
          trackPurchaseConversion(0, sessionId || '', undefined)
          conversionFiredRef.current = true
        }
      })
      .finally(() => setLoading(false))
  }, [sessionId])

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
            Enrollment confirmed{sessionData?.customerName ? `, ${sessionData.customerName.split(' ')[0]}` : ''}.
          </h1>
          <p className="text-lg text-muted-foreground">
            {sessionData?.courseType === 'full-course'
              ? 'Your concussion management training starts now.'
              : 'You now have lifetime access to all 8 modules.'}
          </p>
        </div>

        {/* Early bird savings callout */}
        {sessionData?.amountPaid && sessionData.amountPaid < CONFIG.COURSE.PRICE_REGULAR && sessionData.courseType === 'full-course' && (
          <div className="text-center mb-8 py-3 px-5 rounded-xl bg-emerald-50 border border-emerald-200">
            <p className="text-sm font-semibold text-emerald-800">
              Early bird pricing — you saved ${(CONFIG.COURSE.PRICE_REGULAR - sessionData.amountPaid).toLocaleString()} AUD
            </p>
          </div>
        )}

        {/* Workshop countdown for full-course */}
        {sessionData?.courseType === 'full-course' && sessionData?.location && (() => {
          const location = Object.values(CONFIG.LOCATIONS).find(loc => loc.slug === sessionData.location)
          if (!location?.dateObj) return null
          const daysUntil = Math.ceil((location.dateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          if (daysUntil <= 0) return null
          return (
            <div className="glass rounded-2xl p-6 md:p-8 mb-6 text-center border border-accent/20">
              <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">Your Workshop</p>
              <p className="text-2xl font-bold mb-1">{location.city} — {location.date}</p>
              <p className="text-muted-foreground">
                <span className="text-xl font-bold text-accent">{daysUntil}</span> days away — complete your online modules before then
              </p>
            </div>
          )
        })()}

        {/* What you get — not a receipt, a value reminder */}
        <div className="glass rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="font-bold text-lg mb-4">What you now have access to</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5">
              <BookOpen className="w-5 h-5 text-accent flex-shrink-0" />
              <span className="text-sm font-medium">8 clinical modules</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5">
              <span className="text-sm font-medium flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                {sessionData?.courseType === 'full-course' ? '14' : '8'} CPD points
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5">
              <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
              <span className="text-sm font-medium">Clinical toolkit</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5">
              <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
              <span className="text-sm font-medium">130+ references</span>
            </div>
            {sessionData?.courseType === 'full-course' && (
              <>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5">
                  <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                  <span className="text-sm font-medium">Full-day workshop</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5">
                  <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                  <span className="text-sm font-medium">Lifetime access</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="space-y-4 mb-10">
          <h2 className="font-bold text-lg">Next steps</h2>

          <div className="flex items-start gap-4 glass rounded-xl p-5">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <span className="text-accent font-bold">1</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Check your inbox</h3>
              <p className="text-sm text-muted-foreground">
                We&apos;ve sent a login link to <strong>{sessionData?.customerEmail || 'your email'}</strong>. Click it to access your course — no password needed.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 glass rounded-xl p-5">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <span className="text-accent font-bold">2</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Start Module 1</h3>
              <p className="text-sm text-muted-foreground">
                Begin with &ldquo;What is a Concussion?&rdquo; — covers concussion pathophysiology and the neurometabolic cascade. About 45 minutes.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 glass rounded-xl p-5">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <span className="text-accent font-bold">3</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Download the clinical toolkit</h3>
              <p className="text-sm text-muted-foreground">
                Referral templates, return-to-play protocols, and clearance letters — ready to use in practice.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push('/login')}
            className="flex-1 btn-primary px-8 py-4 rounded-xl font-bold text-center flex items-center justify-center gap-2"
          >
            Open Your Course
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Personal touch */}
        <div className="mt-10 glass rounded-xl p-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">From Zac:</strong> If you have questions as you work through the modules, reply to any email from us. I read every message.
          </p>
        </div>
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
