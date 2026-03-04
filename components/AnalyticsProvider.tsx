'use client'

/**
 * components/AnalyticsProvider.tsx
 *
 * Dual-track analytics provider:
 *   1. Umami Cloud — auto-tracks pageviews via the <script> tag in layout.tsx.
 *      Custom events are sent via window.umami.track().
 *   2. Vercel Blob / custom endpoint — belt-and-suspenders via /api/analytics/track.
 *
 * Usage (in layout.tsx):
 *   import { AnalyticsProvider } from '@/components/AnalyticsProvider'
 *   <AnalyticsProvider>{children}</AnalyticsProvider>
 *
 * Usage (in any component):
 *   import { trackCustomEvent } from '@/components/AnalyticsProvider'
 *   trackCustomEvent('enroll_click', { courseId: 'concussion-101', price: 99 })
 *
 * Umami script tag (add to app/layout.tsx <head>):
 *   <Script
 *     src="https://cloud.umami.is/script.js"
 *     data-website-id="78007a9523265d8a53b15efc8457b60c2f3394d2d5ad0259a38761afb69a02d3"
 *     strategy="afterInteractive"
 *   />
 */

import { useEffect, Suspense, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// ── Type augmentation for window.umami ────────────────────────────────────────
declare global {
  interface Window {
    umami?: {
      /**
       * Track a custom event.
       * @param event  Event name string OR an event object { name, data }
       * @param data   Optional properties bag
       */
      track: (
        event: string | { name: string; data?: Record<string, unknown> },
        data?: Record<string, unknown>
      ) => void
    }
  }
}

// ── Session ID helper ─────────────────────────────────────────────────────────
function getOrCreateSessionId(): string {
  try {
    let id = sessionStorage.getItem('analytics_session_id')
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      sessionStorage.setItem('analytics_session_id', id)
    }
    return id
  } catch {
    // sessionStorage may be blocked in certain browser contexts
    return `session_${Date.now()}_ephemeral`
  }
}

// ── Core tracking function ────────────────────────────────────────────────────
/**
 * Send a custom event to both Umami AND the /api/analytics/track endpoint.
 *
 * @param eventName  Short, snake_case event name (e.g. "enroll_click")
 * @param data       Optional structured data bag (keep keys short, avoid PII)
 *
 * Examples:
 *   trackCustomEvent('enroll_click', { courseId: 'concussion-101', price: 99 })
 *   trackCustomEvent('shop_click', { itemId: 'scat6-kit' })
 *   trackCustomEvent('pricing_view')
 *   trackCustomEvent('checkout_start', { plan: 'annual' })
 *   trackCustomEvent('google_ads_conversion', { value: 99, currency: 'AUD' })
 */
export function trackCustomEvent(
  eventName: string,
  data?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return

  // ── 1. Umami tracking ───────────────────────────────────────────────────────
  try {
    if (window.umami?.track) {
      window.umami.track(eventName, data)
    }
  } catch (err) {
    // Umami may not be loaded yet (e.g. ad blocker, slow network)
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Analytics] Umami not available:', err)
    }
  }

  // ── 2. Custom endpoint (belt-and-suspenders) ──────────────────────────────
  try {
    const sessionId = getOrCreateSessionId()

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: eventName,
        eventData: data ?? {},
        sessionId,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        referrer: document.referrer || null,
        path: window.location.pathname,
        search: window.location.search || null,
      }),
      credentials: 'include',
      // keepalive allows the request to outlive the page (e.g. navigation clicks)
      keepalive: true,
    }).catch(() => {
      // Silently swallow — never let analytics errors affect UX
    })
  } catch {
    // Silent fail — analytics should never break the app
  }
}

/**
 * Convenience: track a Google Ads conversion event.
 * Sends to Umami + custom endpoint. Also fires gtag if present.
 */
export function trackConversion(params: {
  value?: number
  currency?: string
  transactionId?: string
  courseId?: string
}): void {
  const { value, currency = 'AUD', transactionId, courseId } = params

  // Umami + custom endpoint
  trackCustomEvent('google_ads_conversion', {
    value,
    currency,
    transactionId,
    courseId,
  })

  // Also fire Google Ads gtag if present (belt-and-suspenders for Google Ads)
  try {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', 'conversion', {
        send_to: process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID,
        value,
        currency,
        transaction_id: transactionId,
      })
    }
  } catch {
    // Silent fail
  }
}

// ── Page-view tracker component ─────────────────────────────────────────────
// Note: Umami auto-tracks pageviews via its script tag.
// This component only fires custom navigation events for our custom endpoint.
function AnalyticsTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const trackPageview = useCallback(() => {
    try {
      const sessionId = getOrCreateSessionId()
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')

      // Only send to our custom endpoint — Umami handles its own pageview tracking
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'pageview',
          eventData: { url },
          sessionId,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          referrer: document.referrer || null,
          path: pathname,
          search: searchParams?.toString() || null,
        }),
        credentials: 'include',
        keepalive: true,
      }).catch(() => {})
    } catch {
      // Silent fail
    }
  }, [pathname, searchParams])

  useEffect(() => {
    trackPageview()
  }, [trackPageview])

  return null
}

// ── Provider ───────────────────────────────────────────────────────────────
/**
 * Wrap your root layout with this provider.
 *
 * ```tsx
 * // app/layout.tsx
 * import { AnalyticsProvider } from '@/components/AnalyticsProvider'
 * import Script from 'next/script'
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <head>
 *         <Script
 *           src="https://cloud.umami.is/script.js"
 *           data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
 *           strategy="afterInteractive"
 *         />
 *       </head>
 *       <body>
 *         <AnalyticsProvider>{children}</AnalyticsProvider>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export function AnalyticsProvider({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <>
      {/*
        Wrap in Suspense because useSearchParams() requires it in Next.js App Router.
        fallback={null} means no loading state — analytics is invisible to users.
      */}
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
      {children}
    </>
  )
}

// ── Pre-built event helpers for common portal actions ───────────────────────
// Import these anywhere in the portal for consistent event naming.

/** User clicked an enrol/purchase CTA */
export const trackEnrolClick = (courseId: string, price?: number) =>
  trackCustomEvent('enrol_click', { courseId, price })

/** User viewed the pricing page */
export const trackPricingView = (source?: string) =>
  trackCustomEvent('pricing_view', { source })

/** User started checkout */
export const trackCheckoutStart = (courseId: string, price: number) =>
  trackCustomEvent('checkout_start', { courseId, price })

/** User completed purchase */
export const trackPurchaseComplete = (courseId: string, price: number, transactionId?: string) => {
  trackCustomEvent('purchase_complete', { courseId, price, transactionId })
  trackConversion({ value: price, courseId, transactionId })
}

/** User clicked a shop / equipment link */
export const trackShopClick = (itemId: string, itemName?: string) =>
  trackCustomEvent('shop_click', { itemId, itemName })

/** User downloaded a resource (SCAT6 etc.) */
export const trackDownload = (resourceId: string, resourceName?: string) =>
  trackCustomEvent('download', { resourceId, resourceName })

/** User completed a module / quiz */
export const trackModuleComplete = (moduleId: string, score?: number) =>
  trackCustomEvent('module_complete', { moduleId, score })

/** User submitted a contact / enquiry form */
export const trackFormSubmit = (formId: string) =>
  trackCustomEvent('form_submit', { formId })
