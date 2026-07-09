'use client'

import { useEffect } from 'react'

/**
 * Screen wake lock for exertion screens (training session + graded test): keep
 * the display alive while a patient is on the bike/treadmill; graceful no-op
 * where unsupported. Re-acquires on visibility return (iOS releases the
 * sentinel whenever the tab backgrounds). Extracted from TrainingSession so
 * GuidedTest shares the identical, tested pattern.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    let sentinel: WakeLockSentinel | null = null
    let cancelled = false
    const acquire = async () => {
      try {
        const wl = (navigator as Navigator & { wakeLock?: WakeLock }).wakeLock
        if (!wl) return
        const s = await wl.request('screen')
        if (cancelled) void s.release().catch(() => {})
        else sentinel = s
      } catch {
        /* unsupported / denied — the screen may sleep, everything still works */
      }
    }
    void acquire()
    const onVis = () => {
      if (document.visibilityState === 'visible') void acquire()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVis)
      try {
        void sentinel?.release().catch(() => {})
      } catch {
        /* already released */
      }
    }
  }, [active])
}
