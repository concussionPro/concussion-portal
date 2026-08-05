'use client'

import { useEffect, useState } from 'react'
import PlatformApp from '@/app/platform/app/page'
import SstLanding from '@/components/platform/SstLanding'
import { STORE_KEY } from '@/lib/sst-trainer/store'
import { trackEvent } from '@/lib/analytics'

/**
 * /sst-trainer entry: the preseason-style animated landing for NEW visitors,
 * the real app for everyone already in a flow. The app must never hide behind
 * marketing for the people who use it daily, so straight-to-app when:
 *   - ?clinic=CODE (patient QR deep link)
 *   - ?start=1 (landing CTA)
 *   - persisted state exists (returning patient / installed PWA)
 *   - running inside the native shell / standalone PWA display mode
 * Decided client-side (localStorage), so render nothing until decided —
 * a blank beat beats a flash of marketing for a returning patient.
 */
export default function SstEntry() {
  const [view, setView] = useState<'deciding' | 'landing' | 'app'>('deciding')
  const [trialFull, setTrialFull] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    let hasState = false
    try {
      hasState = !!window.localStorage.getItem(STORE_KEY)
      // Set by clinic-sync on a 402 (clinic's free trial at capacity, this
      // patient not yet admitted); cleared on the next successful sync. The
      // flag was write-only — the patient trained on silently while every
      // event queued (2026-08-05 sweep #8). Tell them.
      setTrialFull(!!window.localStorage.getItem('sst:trial-full'))
    } catch {
      /* storage blocked → treat as new visitor */
    }
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      !!(window as unknown as { Capacitor?: unknown }).Capacitor
    setView(
      params.has('clinic') || params.has('start') || hasState || standalone ? 'app' : 'landing',
    )
  }, [])

  if (view === 'deciding') return null
  // publicSurface: patients enter with their clinic's code — the full
  // self-guided version lives only on the gated /platform/app surface.
  if (view === 'app') {
    return (
      <>
        {trialFull && (
          <div
            role="status"
            style={{ background: '#7c2d12', color: '#fff7ed', padding: '10px 16px', fontSize: 13.5, lineHeight: 1.45, textAlign: 'center' }}
          >
            Your clinic&rsquo;s SST plan is at capacity, so your sessions aren&rsquo;t reaching your
            clinician yet — they&rsquo;re saved on this device and will send automatically once your
            clinic opens a spot. Mention it at your next appointment.
          </div>
        )}
        <PlatformApp publicSurface />
      </>
    )
  }
  return (
    <SstLanding
      onStart={() => {
        // The landing→app transition is a replaceState + local state swap, so
        // it fires no page_view and, until now, no event at all. /sst-trainer
        // is the #2 landing path on the site and every one of those sessions
        // therefore read as a single-page bounce even when the visitor went
        // straight into the app. Record the step.
        void trackEvent('sst_landing_start', {})
        // push ?start=1 so a reload stays in the app, then swap in place
        const url = new URL(window.location.href)
        url.searchParams.set('start', '1')
        window.history.replaceState(null, '', url.toString())
        setView('app')
      }}
    />
  )
}
