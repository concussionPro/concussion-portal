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

  // Auth guard. ANONYMOUS visitors are NOT bounced to /login any more —
  // measured 2026-08-16: 5 of 6 blast upgrade-clickers arrived logged out,
  // hit the login wall, and exited without seeing a single word of value.
  // They now see the explanatory state below; owners use its login link.
  useEffect(() => {
    if (isLoading) return
    if (!user) return
    // Bounced for BOTH real Complete buyers (already hold the day) and Clinic
    // Hub Pack seats — deliberately. This page sells the SOLO online→Complete
    // difference (upgradePriceFor). A hub seat's practical day is the clinic
    // add-on at CONFIG.COURSE.PRICE_CLINIC_WORKSHOP_UPGRADE per clinician, a
    // different product with no self-serve checkout; their route to it is the
    // dashboard/sidebar add-on card, not this checkout.
    if (user.accessLevel === 'full-course' && !user.isDemo) {
      router.replace('/dashboard')
      return
    }
    // preview users are NOT redirected any more — the Q4 blast's upgrade
    // link put real clickers here (5 in the first 2h, all silently bounced
    // to /pricing, owner: "the upgrade click just routes to /pricing").
    // They see an explanatory state with both real next steps instead.
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
        return
      }
      // 200 with no url (Stripe session created but url missing / shape drift).
      // Without this branch checkoutLoading stayed true forever: the button
      // showed "Redirecting to checkout..." and spun for the rest of the
      // session with no error and no way back — the user's only signal that
      // their upgrade had failed was that nothing happened.
      setError('Checkout could not be started. Please try again, or email zac@concussion-education-australia.com.')
      setCheckoutLoading(false)
    } catch {
      setError('Something went wrong. Please try again.')
      setCheckoutLoading(false)
    }
  }

  // Preview (free) AND anonymous visitors get the explanatory state — the
  // blast measured both cohorts dying here (silent bounce / login wall).
  if ((!isLoading && !user) || (user && user.accessLevel === 'preview')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-xl w-full rounded-2xl border-2 border-teal-200 bg-teal-50/50 p-7 text-center">
          <p className="text-lg font-bold text-foreground mb-2">The A${upgradePriceFor('melbourne')} upgrade is for CCM Online owners</p>
          <p className="text-sm text-muted-foreground mb-5">
            It covers the Online → Complete difference (practical day included). You&rsquo;re not on
            Online yet — start there, or take a confirmed Melbourne seat that already includes it:
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/pricing#pricing-cards" className="btn-primary px-5 py-3 rounded-xl text-sm font-semibold">
              Start Online — upgrade later
            </Link>
            <Link href="/melbourne-nov7" className="px-5 py-3 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-foreground hover:bg-slate-50">
              Melbourne Nov 7 — Complete seat
            </Link>
          </div>
          {!user && (
            <p className="mt-4 text-[13px] text-muted-foreground">
              Already own the online course?{' '}
              <Link href="/login?redirect=/upgrade" className="text-teal-700 font-semibold underline">
                Log in to upgrade for the difference
              </Link>
            </p>
          )}
        </div>
      </div>
    )
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    )
  }

  // Demo / full-course / other non-online tiers: explain instead of infinite
  // spinner or a silent /dashboard bounce (P1 2026-09-05).
  if (user.accessLevel !== 'online-only') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-xl w-full rounded-2xl border border-slate-200 bg-white p-7 text-center">
          <p className="text-lg font-bold text-foreground mb-2">
            {user.isDemo ? 'Demo preview — upgrade checkout is for Online owners' : 'Upgrade is for Online course owners'}
          </p>
          <p className="text-sm text-muted-foreground mb-5">
            {user.isDemo
              ? 'Demo sessions are read-only. Enrol in Online, then return here to pay the Complete difference and pick a city for the practical day.'
              : 'You already have Complete access (or a seat that does not use this self-serve upgrade). Head back to your dashboard for next steps.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/dashboard" className="btn-primary px-5 py-3 rounded-xl text-sm font-semibold">
              Back to dashboard
            </Link>
            <Link href="/pricing#pricing-cards" className="px-5 py-3 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-foreground hover:bg-slate-50">
              View pricing
            </Link>
          </div>
        </div>
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
            You&apos;ve completed the theory. Now master the practical skills with expert-supervised
            training — one shared room for every discipline: train alongside physios, osteos and
            exercise professionals for full multidisciplinary integration.
          </p>
        </div>

        {/* Value proposition */}
        <div className="glass rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="font-bold text-lg mb-4">What the workshop adds</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { title: 'Hands-on practice', desc: 'SCAT6, VOMS, and BESS assessment under supervision' },
              { title: 'Expert feedback', desc: 'Real-time correction from experienced clinicians' },
              { title: `${CONFIG.COURSE.IN_PERSON_CPD_POINTS} more CPD hours`, desc: `${CONFIG.COURSE.TOTAL_CPD_POINTS} total with online + workshop` },
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
              Adds the full-day workshop ({CONFIG.COURSE.IN_PERSON_CPD_POINTS} CPD hours) to your online course
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
