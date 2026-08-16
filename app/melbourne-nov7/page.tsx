'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Loader2, MapPin, Users, Utensils } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { CONFIG, upgradePriceFor } from '@/lib/config'
import { trackEvent } from '@/lib/analytics'

/**
 * /melbourne-nov7 — PRE-RELEASE landing for the Round-4 Melbourne practical
 * day (Sat 7 Nov 2026, Rydges Exhibition St). The date is NOT public on the
 * site (owner pulled it until the venue is contracted); this page exists so
 * the warm-list blast's "Take a Melbourne seat" lands on the actual date card
 * and a DIRECT checkout, not generic /pricing (owner 2026-08-16). noindex via
 * layout; linked only from the blast.
 *
 * Date/venue copy is deliberately LOCAL here, not CONFIG (config drives the
 * public site; this page is the pre-release exception and dies at launch).
 */

const DATE_LABEL = 'Saturday 7 November 2026'
const VENUE = 'Rydges Melbourne — Exhibition Street, CBD'

export default function MelbourneNov7Page() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Live round-scoped seat count (same /api/city-progress the cards use).
  // The pre-release path has no hard cap at checkout (Melbourne isn't
  // status='confirmed'), so the HONESTY control at volume is here: show real
  // seats remaining and flip to a next-round state when the room is full —
  // extra buyers legally roll to the next round (nomination model), but
  // nobody is sold a "Nov 7 seat" the page knows is gone.
  const [seatsLeft, setSeatsLeft] = useState<number | null>(null)
  useEffect(() => {
    fetch('/api/city-progress')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const mel = d?.cities?.find?.((c: { slug: string }) => c.slug === 'melbourne')
        if (mel && typeof mel.enrolled === 'number') {
          setSeatsLeft(Math.max(0, CONFIG.WORKSHOP.CAPACITY_PER_COURSE - mel.enrolled))
        }
      })
      .catch(() => null)
  }, [])
  const soldOut = seatsLeft === 0

  const enrol = async () => {
    if (loading) return
    setLoading(true)
    setError(null)
    trackEvent('checkout_start', { courseType: 'full-course', location: 'melbourne', source: 'melbourne-nov7' })
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseType: 'full-course',
          location: 'melbourne',
          utm: { source: 'email', medium: 'email', campaign: 'quarterly_blast_v1' },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        setError(data?.error || 'Could not start checkout — please try again.')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Network error — please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="max-w-2xl mx-auto px-6 pt-[120px] pb-20">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent text-center mb-3">
          Pre-release — announced to the list before it goes public
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-8">
          Melbourne hands-on day
        </h1>

        {/* The date card */}
        <div className="card card-visible rounded-2xl p-6 md:p-7" style={{ borderWidth: '2px', borderColor: 'rgba(13, 115, 119, 0.35)' }}>
          <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
            <div>
              <p className="text-xl font-bold text-foreground">{DATE_LABEL}</p>
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-accent" /> {VENUE}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-[11px] text-muted-foreground line-through">${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}</span>
                <span className="text-2xl font-bold text-foreground tracking-tight">${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()}</span>
                <span className="text-[11px] text-muted-foreground">AUD</span>
              </div>
              <p className="text-[10px] text-muted-foreground">early-bird · complete course</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-muted-foreground mb-4">
            <span className="inline-flex items-center gap-1.5"><Users className="w-4 h-4 text-accent" /> {seatsLeft !== null && seatsLeft < CONFIG.WORKSHOP.CAPACITY_PER_COURSE ? `${seatsLeft} of ${CONFIG.WORKSHOP.CAPACITY_PER_COURSE} places left` : `${CONFIG.WORKSHOP.CAPACITY_PER_COURSE} places max`} · mixed cohort</span>
            <span className="inline-flex items-center gap-1.5"><Utensils className="w-4 h-4 text-accent" /> Catered</span>
          </div>

          <ul className="space-y-1.5 mb-5">
            {[
              'Supervised practice on real subjects — SCAT6, VOMS, BESS, cervical assessment',
              'Graded exertional testing through to the exercise prescription',
              `All ${CONFIG.COURSE.TOTAL_MODULES} online modules + clinical toolkit included — ${CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours total`,
              'Physios, osteos and exercise professionals in one room',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-[13.5px] text-slate-700">
                <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                {f}
              </li>
            ))}
          </ul>

          {soldOut && (
            <p className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[13px] text-amber-900">
              This room is full. Enrolling now secures your seat at the next Melbourne round —
              your early-bird rate is locked and your payment carries in full.
            </p>
          )}
          <button
            type="button"
            onClick={enrol}
            disabled={loading}
            className="btn-primary w-full py-3.5 px-5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{soldOut ? 'Secure the next Melbourne round' : 'Take a Melbourne seat'} — ${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()} <ArrowRight className="w-4 h-4" /></>}
          </button>
          {error && <p className="text-xs text-red-600 mt-2 text-center">{error}</p>}
          <p className="text-[11px] text-muted-foreground mt-2 text-center">
            Secure Stripe checkout · 7-day money-back guarantee · tax invoice with payment
          </p>
        </div>

        {/* Already-online upgrade */}
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-center">
          <p className="text-sm font-bold text-foreground mb-1">Already bought the online course?</p>
          <p className="text-[13px] text-muted-foreground mb-3">
            Upgrade to the hands-on day for the difference — ${upgradePriceFor('melbourne')} — your online payment counts in full.
          </p>
          <Link
            href="/upgrade"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white border border-amber-300 text-sm font-semibold text-foreground hover:bg-amber-50 transition-colors"
          >
            Upgrade for ${upgradePriceFor('melbourne')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <p className="mt-6 text-[12px] text-muted-foreground text-center">
          Can&rsquo;t make Melbourne? Reply to the email and nominate Sydney or Byron Bay — dates
          are set on the numbers.
        </p>
      </main>
    </div>
  )
}
