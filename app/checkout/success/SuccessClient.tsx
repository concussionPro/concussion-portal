'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, BookOpen, ArrowRight, Loader2, AlertTriangle, Award } from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { trackPurchaseConversion, trackEvent } from '@/lib/analytics'

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
  currency?: string
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)
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

          // Fire conversions (only once)
          if (!conversionFiredRef.current) {
            // Internal analytics event — visible in our dashboard
            trackEvent('purchase', {
              courseType: data.session.courseType,
              amount: data.session.amountPaid,
              currency: data.session.currency || 'AUD',
              location: data.session.location || null,
            })
            // Google Ads conversion with enhanced data
            trackPurchaseConversion(
              data.session.amountPaid,
              sessionId!,
              data.session.customerEmail,
              data.session.currency
            )
            conversionFiredRef.current = true
          }
        } else {
          setError(true)
        }
      })
      .catch(() => {
        // Don't fire conversion pixel without verified payment data — prevents fake conversions
        setError(true)
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

  if (error || (!loading && !sessionData)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{sessionId ? 'Unable to Load Details' : 'Session Not Found'}</h1>
          <p className="text-muted-foreground mb-6">
            {sessionId
              ? 'We couldn\'t load your checkout details, but your payment was processed. Check your email for a login link to access your course.'
              : 'This page requires a valid checkout session. If you just completed a purchase, check your email for a login link.'}
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="btn-primary px-8 py-3 rounded-xl font-semibold"
            >
              Go to Login
            </Link>
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isFullCourseType = sessionData?.courseType === 'full-course' || sessionData?.courseType === 'workshop-upgrade'

  const courseName = isFullCourseType
    ? `Complete Course${sessionData?.location ? ` — ${formatLocation(sessionData.location)}` : ''}`
    : 'Online Course'

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Nav */}
      <nav className="glass border-b border-border/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/" className="text-xl font-bold">
            Concussion<span className="text-gradient">Pro</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16 md:py-24">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Enrolment confirmed{sessionData?.customerName ? `, ${sessionData.customerName.split(' ')[0]}` : ''}.
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            {isFullCourseType
              ? 'Your concussion management training starts now.'
              : 'You now have lifetime access to all 8 modules.'}
          </p>
          <Link
            href={sessionData?.courseType === 'workshop-upgrade' ? '/dashboard' : '/modules/1'}
            className="btn-primary px-8 py-4 rounded-xl font-bold inline-flex items-center gap-2"
          >
            {sessionData?.courseType === 'workshop-upgrade' ? 'Go to Dashboard' : 'Start Module 1'}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Early bird savings callout */}
        {sessionData?.amountPaid && sessionData.amountPaid < CONFIG.COURSE.PRICE_REGULAR && isFullCourseType && (!sessionData?.currency || sessionData.currency === 'AUD') && (
          <div className="text-center mb-8 py-3 px-5 rounded-xl bg-emerald-50 border border-emerald-200">
            <p className="text-sm font-semibold text-emerald-800">
              Early bird pricing — you saved ${(CONFIG.COURSE.PRICE_REGULAR - sessionData.amountPaid).toLocaleString()} AUD
            </p>
          </div>
        )}

        {/* Workshop info for full-course and workshop-upgrade */}
        {isFullCourseType && sessionData?.location && (() => {
          const location = Object.values(CONFIG.LOCATIONS).find(loc => loc.slug === sessionData.location)
          if (!location) return null

          // Confirmed city with date — show countdown
          if (location.dateObj) {
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
          }

          // Collecting city — show reservation messaging
          return (
            <div className="glass rounded-2xl p-6 md:p-8 mb-6 text-center border border-accent/20">
              <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">Your Workshop — {location.city}</p>
              <p className="text-lg font-bold mb-2">Your spot is reserved</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We confirm dates once {CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD} registrants are locked in per city. You&apos;ll be notified at least {CONFIG.WORKSHOP.LEAD_TIME_WEEKS} weeks before your workshop.
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
              <span className="text-sm font-medium">{CONFIG.COURSE.TOTAL_MODULES} clinical modules</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5">
              <span className="text-sm font-medium flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                {isFullCourseType ? CONFIG.COURSE.TOTAL_CPD_POINTS : CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hours
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5">
              <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
              <span className="text-sm font-medium">Clinical toolkit</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5">
              <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
              <span className="text-sm font-medium">140+ references</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5">
              <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
              <span className="text-sm font-medium">Lifetime access</span>
            </div>
            {isFullCourseType && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="text-sm font-medium">Full-day workshop</span>
              </div>
            )}
          </div>
        </div>

        {/* Refund guarantee — reduces post-purchase anxiety */}
        <div className="glass rounded-xl p-4 mb-8 border border-emerald-200/50 bg-emerald-50/30">
          <p className="text-sm text-muted-foreground">
            <strong className="text-emerald-700">7-day satisfaction guarantee.</strong> If the course isn&apos;t right for you, email us within 7 days for a full refund — no questions asked.
          </p>
        </div>

        {/* Clinical outcomes reminder */}
        <div className="glass rounded-2xl p-6 md:p-8 mb-8 border border-accent/10">
          <h2 className="font-bold text-lg mb-3">By completing this course, you&apos;ll be able to</h2>
          <ul className="space-y-2.5">
            {[
              'Administer and interpret SCAT6, VOMS, and BESS assessments accurately',
              'Identify concussion phenotypes and prescribe targeted rehabilitation',
              'Make confident, evidence-based return-to-play decisions',
              ...(isFullCourseType
                ? ['Apply hands-on assessment skills practised under expert supervision']
                : []),
              'Use the clinical toolkit in your practice from day one',
            ].map((outcome, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{outcome}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Next Steps */}
        <div className="space-y-4 mb-10">
          <h2 className="font-bold text-lg">Next steps</h2>

          <div className="flex items-start gap-4 glass rounded-xl p-5">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <span className="text-accent font-bold">1</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Start Module 1</h3>
              <p className="text-sm text-muted-foreground">
                Begin with &ldquo;What is a Concussion?&rdquo; — covers concussion pathophysiology and the neurometabolic cascade. About 75 minutes.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 glass rounded-xl p-5">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <span className="text-accent font-bold">2</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Download the clinical toolkit</h3>
              <p className="text-sm text-muted-foreground">
                Referral templates, return-to-play protocols, and clearance letters — ready to use in practice.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 glass rounded-xl p-5">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <span className="text-accent font-bold">3</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">We&apos;ve also emailed you a login link</h3>
              <p className="text-sm text-muted-foreground">
                Sent to <strong>{sessionData?.customerEmail || 'your email'}</strong>. Use it to log in from any device — no password needed.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={sessionData?.courseType === 'workshop-upgrade' ? '/dashboard' : '/modules/1'}
            className="flex-1 btn-primary px-8 py-4 rounded-xl font-bold text-center flex items-center justify-center gap-2"
          >
            {sessionData?.courseType === 'workshop-upgrade' ? 'Go to Dashboard' : 'Start Module 1'}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Workshop upsell for online-only buyers */}
        {sessionData?.courseType === 'online-only' && (() => {
          const isEarlyBird = new Date() < new Date(CONFIG.WORKSHOP.EARLY_BIRD_DEADLINE + 'T23:59:59')
          const upgradePrice = isEarlyBird
            ? CONFIG.COURSE.PRICE_EARLY_BIRD - CONFIG.COURSE.PRICE_ONLINE
            : CONFIG.COURSE.PRICE_REGULAR - CONFIG.COURSE.PRICE_ONLINE
          return (
            <div className="mt-8 glass rounded-2xl p-6 border-2 border-orange-200/60">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Add the hands-on workshop</h3>
                  <p className="text-sm text-muted-foreground">Upgrade to the Complete Course for {CONFIG.COURSE.TOTAL_CPD_POINTS} total CPD hours</p>
                </div>
              </div>
              <ul className="space-y-1.5 mb-4 ml-[52px]">
                {[
                  'Full-day practical workshop (SCAT6, VOMS, BESS)',
                  'Supervised assessment practice with expert feedback',
                  `6 additional CPD hours (${CONFIG.COURSE.TOTAL_CPD_POINTS} total)`,
                  'Small group — max 12 participants',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="ml-[52px]">
                <Link
                  href="/upgrade"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                >
                  Upgrade from ${upgradePrice} more
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {isEarlyBird && (
                  <p className="text-xs text-[var(--accent)] font-medium mt-2">
                    Registered-list pricing locked in — no deadline
                  </p>
                )}
              </div>
            </div>
          )
        })()}

        {/* Referral ask */}
        <div className="mt-8 glass rounded-xl p-5 text-center">
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            <strong className="text-foreground">Know a colleague who&apos;d benefit?</strong> Share the free SCAT6 Mastery course with them — completely free.
          </p>
          <button
            onClick={() => {
              const url = 'https://portal.concussion-education-australia.com/scat-mastery'
              const text = 'Free SCAT6 Mastery course — worth a look:'
              if (navigator.share) {
                navigator.share({ title: 'Free SCAT6 Training', text, url })
              } else {
                navigator.clipboard.writeText(`${text} ${url}`)
                setCopied(true)
                setTimeout(() => setCopied(false), 3000)
              }
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border border-accent/20 text-accent hover:bg-accent/5 transition-colors"
          >
            Share with a colleague
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          {copied && (
            <p className="text-sm text-emerald-600 font-medium mt-2" role="status" aria-live="polite">
              Link copied to clipboard
            </p>
          )}
        </div>

        {/* Personal touch */}
        <div className="mt-6 glass rounded-xl p-5">
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

export default function SuccessClient() {
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
