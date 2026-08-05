'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from '@/contexts/SessionContext'
import { getAttribution } from '@/lib/analytics'
import { CONFIG, isEarlyBirdForLocation, upgradePriceFor } from '@/lib/config'
import { CheckCircle2, ArrowRight, Loader2, MapPin, AlertTriangle } from 'lucide-react'

// Nomination model (2026-07-02): every city is selectable, including
// completed ones — a completed city means "nominate me for the next
// {city} round".
const LOCATIONS = Object.values(CONFIG.LOCATIONS).map(loc => ({
  slug: loc.slug,
  label: loc.city,
  status: loc.status,
  date: loc.date,
}))

function UpgradeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading } = useSession()
  const [selectedLocation, setSelectedLocation] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState('')
  const canceled = searchParams.get('canceled') === 'true'

  // Difference to the current Complete Course price for the chosen city:
  // $693 at the $1,190 early-bird rate (any city without a live scheduled
  // date), $903 only inside the final window of a scheduled round. Server
  // (lib/stripe.ts) charges the same function.
  const upgradePrice = upgradePriceFor(selectedLocation || undefined)
  const upgradeEarlyBird = isEarlyBirdForLocation(selectedLocation || undefined)

  // Auth guard
  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace('/login?redirect=/upgrade')
      return
    }
    if (user.accessLevel === 'full-course') {
      router.replace('/dashboard')
      return
    }
    if (user.accessLevel === 'preview') {
      router.replace('/pricing')
      return
    }
  }, [user, isLoading, router])

  const handleCheckout = async () => {
    if (!selectedLocation || selectedLocation === 'decide-later') {
      setError('Please select a workshop location to proceed with checkout.')
      return
    }
    setError('')
    setCheckoutLoading(true)

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseType: 'workshop-upgrade',
          location: selectedLocation,
          attribution: getAttribution(),
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create checkout. Please try again.')
        setCheckoutLoading(false)
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setCheckoutLoading(false)
    }
  }

  if (isLoading || !user || user.accessLevel !== 'online-only') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="glass border-b border-border/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Concussion Education <span className="text-gradient">Australia</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12 md:py-20">
        {/* Canceled banner */}
        {canceled && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Checkout wasn&apos;t completed</p>
              <p className="text-sm text-amber-700">No worries — your spot is still available. Pick up where you left off below.</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
            <MapPin className="w-4 h-4" />
            Workshop Upgrade
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Add the hands-on workshop
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            You&apos;ve completed the theory. Now master the practical skills with expert-supervised training.
          </p>
        </div>

        {/* Value proposition */}
        <div className="glass rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="font-bold text-lg mb-4">What the workshop adds</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { title: 'Hands-on practice', desc: 'SCAT6, VOMS, and BESS assessment under supervision' },
              { title: 'Expert feedback', desc: 'Real-time correction from experienced clinicians' },
              { title: '8 more CPD hours', desc: `${CONFIG.COURSE.TOTAL_CPD_POINTS} total with online + workshop` },
              { title: 'Small groups', desc: `Max ${CONFIG.WORKSHOP.CAPACITY_PER_COURSE} participants for quality training` },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-accent/5">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location selector */}
        <div className="glass rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="font-bold text-lg mb-2">Choose your workshop location</h2>
          <p className="text-sm text-muted-foreground mb-4">
            We confirm workshop dates as demand opens up in each city — you&apos;ll get at least {CONFIG.WORKSHOP.LEAD_TIME_WEEKS} weeks&apos; notice.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {LOCATIONS.map(loc => (
              <button
                key={loc.slug}
                onClick={() => { setSelectedLocation(loc.slug); setError('') }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedLocation === loc.slug
                    ? 'border-accent bg-accent/5 shadow-md shadow-accent/10'
                    : 'border-border/50 hover:border-accent/30'
                }`}
              >
                <p className="font-bold text-base">{loc.label}</p>
                {loc.status === 'confirmed' && loc.date ? (
                  <p className="text-xs text-accent font-medium mt-1">{loc.date}</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">Date launches as {loc.label} fills</p>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Not sure yet? You can change your workshop location later by contacting us — no lock-in.
          </p>
        </div>

        {/* Price + checkout */}
        <div className="glass rounded-2xl p-6 md:p-8 border-2 border-accent/20">
          <div className="text-center mb-6">
            {upgradeEarlyBird && (
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-sm text-muted-foreground line-through">
                  ${CONFIG.COURSE.PRICE_REGULAR - CONFIG.COURSE.PRICE_ONLINE}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Early bird
                </span>
              </div>
            )}
            <div className="flex items-baseline justify-center gap-2 mb-1">
              <span className="text-4xl font-bold">${upgradePrice}</span>
              <span className="text-muted-foreground">AUD</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Adds the full-day workshop (8 CPD hours) to your online course
            </p>
            {upgradeEarlyBird && (
              <p className="text-xs text-muted-foreground mt-1">
                Standard upgrade price applies only in the final {CONFIG.WORKSHOP.EARLY_BIRD_DAYS_BEFORE} days before a scheduled workshop.
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center mb-4">{error}</p>
          )}

          <button
            onClick={handleCheckout}
            disabled={checkoutLoading || !selectedLocation}
            className="w-full btn-primary px-8 py-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkoutLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Redirecting to checkout...
              </>
            ) : (
              <>
                Upgrade Now
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <p className="text-xs text-muted-foreground text-center mt-3">
            Secure checkout via Stripe. Afterpay &amp; Klarna available.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    }>
      <UpgradeContent />
    </Suspense>
  )
}
