'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { DEMO_EVENTS, getDemoOrgFromCookie, trackDemoEvent } from '@/lib/analytics-demo'

/**
 * Mounted via the courses (and any other) layout to fire demo-attributed
 * analytics events as the partner browses. Sends:
 *   - demo_landed on first mount (once per session)
 *   - demo_pageview on every route change
 *   - dwell time on previous path when route changes
 *
 * Only fires when demo_org cookie is present. Silent no-op for admin
 * and real-user sessions.
 */
export function DemoTrackingProvider() {
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)
  const lastEnter = useRef<number>(0)
  const landedFiredThisSession = useRef<boolean>(false)

  useEffect(() => {
    const org = getDemoOrgFromCookie()
    if (!org) return

    // First-mount landed event — once per browser session
    if (!landedFiredThisSession.current) {
      const flag = sessionStorage.getItem('demo_landed_fired')
      if (!flag) {
        trackDemoEvent(DEMO_EVENTS.LANDED, {
          landingPath: pathname,
          referrer: typeof document !== 'undefined' ? document.referrer : '',
        }).catch(() => {})
        sessionStorage.setItem('demo_landed_fired', '1')
      }
      landedFiredThisSession.current = true
    }

    // Pageview event for every route change. Also computes dwell time
    // on the previous page if there was one.
    const now = Date.now()
    if (lastPath.current && lastPath.current !== pathname) {
      const dwellMs = now - lastEnter.current
      trackDemoEvent(DEMO_EVENTS.PAGEVIEW, {
        path: pathname,
        previousPath: lastPath.current,
        previousDwellMs: dwellMs,
      }).catch(() => {})
    } else if (!lastPath.current) {
      // First navigation tracked
      trackDemoEvent(DEMO_EVENTS.PAGEVIEW, { path: pathname }).catch(() => {})
    }
    lastPath.current = pathname
    lastEnter.current = now
  }, [pathname])

  return null
}
