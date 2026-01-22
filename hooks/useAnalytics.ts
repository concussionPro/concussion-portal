// Client-side analytics tracking hook
import { useEffect, useCallback } from 'react'
import { getCurrentUser } from '@/lib/auth'

interface TrackEventOptions {
  eventType:
    | 'page_view'
    | 'button_click'
    | 'cart_visit'
    | 'enroll_click'
    | 'preview_click'
    | 'module_view'
    | 'quiz_start'
    | 'quiz_complete'
    | 'download'
    | 'video_play'
    | 'video_complete'
    | 'login'
    | 'logout'
    | 'signup'
  eventData?: Record<string, any>
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''

  let sessionId = sessionStorage.getItem('analyticsSessionId')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    sessionStorage.setItem('analyticsSessionId', sessionId)
  }
  return sessionId
}

export function useAnalytics() {
  const trackEvent = useCallback(async ({ eventType, eventData = {} }: TrackEventOptions) => {
    try {
      const user = getCurrentUser()
      const sessionId = getSessionId()

      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          eventData,
          sessionId,
          userId: user?.id || null,
          email: user?.email || null,
        }),
      })
    } catch (error) {
      // Silently fail - don't disrupt user experience
      console.error('Analytics tracking failed:', error)
    }
  }, [])

  // Track page views automatically
  useEffect(() => {
    if (typeof window === 'undefined') return

    trackEvent({
      eventType: 'page_view',
      eventData: {
        page: window.location.pathname,
        referrer: document.referrer,
      },
    })
  }, [trackEvent])

  return { trackEvent }
}

// Helper function to track button clicks
export function trackButtonClick(buttonLabel: string, buttonLocation: string) {
  const user = getCurrentUser()
  const sessionId = getSessionId()

  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType: 'button_click',
      eventData: {
        buttonLabel,
        buttonLocation,
        page: window.location.pathname,
      },
      sessionId,
      userId: user?.id || null,
      email: user?.email || null,
    }),
  }).catch(err => console.error('Analytics failed:', err))
}

// Helper function to track cart visits
export function trackCartVisit() {
  const user = getCurrentUser()
  const sessionId = getSessionId()

  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType: 'cart_visit',
      eventData: {
        page: window.location.pathname,
      },
      sessionId,
      userId: user?.id || null,
      email: user?.email || null,
    }),
  }).catch(err => console.error('Analytics failed:', err))
}

// Helper function to track enrollment clicks
export function trackEnrollClick(source: string, pricing?: string) {
  const user = getCurrentUser()
  const sessionId = getSessionId()

  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType: 'enroll_click',
      eventData: {
        source,
        pricing,
        page: window.location.pathname,
      },
      sessionId,
      userId: user?.id || null,
      email: user?.email || null,
    }),
  }).catch(err => console.error('Analytics failed:', err))
}
