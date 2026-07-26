'use client'

import { useEffect } from 'react'

/**
 * Registers the shared service worker (public/sw.js) from the LEARNING
 * surfaces, so modules a clinician has already opened stay readable offline —
 * on a commute, between patients, on hospital wifi.
 *
 * Same worker the SST Trainer registers (root scope, one registration for the
 * origin). It is network-first for both surfaces and passthrough for everything
 * else, so a stale clinical module can never be served to someone who is
 * online, and this cannot interfere with checkout, the API, or the admin.
 *
 * Renders nothing.
 */
export function CoursePwaRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    // Inside the Capacitor native shell the SW is deliberately inert (it flips
    // to passthrough on ?source=app) — registering there is harmless but
    // pointless, so skip it.
    if (new URLSearchParams(window.location.search).get('source') === 'app') return
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      /* unsupported / blocked (private mode, insecure origin) — offline is a
         progressive enhancement, never a requirement */
    })
  }, [])
  return null
}
