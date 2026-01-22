'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackEvent, trackPageView, ANALYTICS_EVENTS } from '@/lib/analytics'

// React hook for analytics tracking
export function useAnalytics() {
  const pathname = usePathname()

  // Track page views on route change
  useEffect(() => {
    trackPageView(pathname)
  }, [pathname])

  return {
    trackEvent,
    trackPageView,
    ANALYTICS_EVENTS,
  }
}

// Hook to track component mount
export function useTrackMount(eventType: string, eventData: Record<string, any> = {}) {
  useEffect(() => {
    trackEvent(eventType, eventData)
  }, [])
}
