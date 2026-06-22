'use client'

import { useEffect } from 'react'

/**
 * Registers the SST Trainer service worker (public/sw.js) on the client.
 *
 * The SW is a no-op fetch passthrough — its only purpose is to satisfy the PWA
 * installability criteria so a clinic can install the app to a phone home
 * screen and launch it standalone. Registration is best-effort: it runs only in
 * a secure context where the API exists, and any failure is swallowed (the app
 * works fine un-installed).
 */
export default function SstPwaRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    if (!window.isSecureContext) return // SW needs HTTPS (or localhost)
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      /* installability is a progressive enhancement — ignore failures */
    })
  }, [])
  return null
}
