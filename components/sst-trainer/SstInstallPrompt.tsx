'use client'

import { useEffect, useState } from 'react'

/**
 * In-app install affordance for the SST Trainer PWA.
 *
 * The browser's native install entry is near-invisible (a small address-bar
 * icon on desktop, a buried menu item on Android, and NOTHING on iOS). For a
 * patient app handed out via a QR card, that reads as "just a website". This
 * surfaces an explicit prompt:
 *   - Chrome/Edge/Android → capture `beforeinstallprompt`, show "Install app",
 *     fire the real native prompt on tap.
 *   - iOS Safari (no beforeinstallprompt) → show the Share → Add to Home Screen
 *     instruction.
 * Renders nothing once installed (standalone display-mode) or dismissed.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function SstInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIos, setIsIos] = useState(false)
  // Assume installed until we confirm otherwise, so the banner never flashes for
  // users who already launched from the home screen.
  const [hidden, setHidden] = useState(true)
  const [showIosHelp, setShowIosHelp] = useState(false)

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean }
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
    if (standalone) return // already installed → never show

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIos(ios)
    // iOS can always "Add to Home Screen" manually → show immediately there.
    if (ios) setHidden(false)

    const onBip = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setHidden(false)
    }
    const onInstalled = () => setHidden(true)
    window.addEventListener('beforeinstallprompt', onBip)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (hidden) return null

  const onInstall = async () => {
    if (deferred) {
      await deferred.prompt()
      try {
        await deferred.userChoice
      } catch {
        /* user dismissed */
      }
      setDeferred(null)
      setHidden(true)
      return
    }
    // iOS: no programmatic install — reveal the Share → Add instruction.
    setShowIosHelp((v) => !v)
  }

  return (
    <div className="mb-3 rounded-xl border border-[#5b9aa6]/40 bg-[#16243f] text-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="relative h-7 w-7 flex-none rounded-full border-2 border-[#5b9aa6]">
          <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5b9aa6]" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold leading-tight">Install the SST Trainer app</p>
          <p className="text-[11px] text-white/70 leading-tight">Add it to your home screen — opens full-screen, like a normal app.</p>
        </div>
        <button
          onClick={onInstall}
          className="flex-none rounded-lg bg-[#5b9aa6] px-3.5 py-2 text-[13px] font-bold text-white hover:bg-[#4d868f] transition-colors"
        >
          {isIos && !deferred ? 'How' : 'Install'}
        </button>
        <button
          onClick={() => setHidden(true)}
          aria-label="Dismiss"
          className="flex-none rounded-lg px-2 py-2 text-white/50 hover:text-white"
        >
          ✕
        </button>
      </div>
      {showIosHelp && (
        <p className="mt-2 border-t border-white/15 pt-2 text-[11.5px] text-white/80 leading-relaxed">
          On iPhone/iPad: tap the <strong>Share</strong> button, then{' '}
          <strong>Add to Home Screen</strong>. (Use <strong>Safari</strong> — Chrome on iOS can&rsquo;t install it.)
        </p>
      )}
    </div>
  )
}
