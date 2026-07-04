'use client'

import { useEffect, useState } from 'react'
import PlatformApp from '@/app/platform/app/page'
import SstLanding from '@/components/platform/SstLanding'
import { STORE_KEY } from '@/lib/sst-trainer/store'

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    let hasState = false
    try {
      hasState = !!window.localStorage.getItem(STORE_KEY)
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
  if (view === 'app') return <PlatformApp />
  return (
    <SstLanding
      onStart={() => {
        // push ?start=1 so a reload stays in the app, then swap in place
        const url = new URL(window.location.href)
        url.searchParams.set('start', '1')
        window.history.replaceState(null, '', url.toString())
        setView('app')
      }}
    />
  )
}
