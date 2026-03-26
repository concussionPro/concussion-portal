// Analytics tracking library for user behavior monitoring

export interface AnalyticsEvent {
  id: string
  userId: string | null
  email: string | null
  timestamp: number
  eventType: string
  eventData: Record<string, any>
  sessionId: string
  userAgent: string
  referrer: string
  path: string
}

// Event types
export const ANALYTICS_EVENTS = {
  // Navigation
  PAGE_VIEW: 'page_view',

  // Auth events
  LOGIN_ATTEMPT: 'login_attempt',
  LOGIN_SUCCESS: 'login_success',
  LOGOUT: 'logout',

  // Shop/Conversion events
  SHOP_CLICK: 'shop_click',
  ENROLL_BUTTON_CLICK: 'enroll_button_click',
  PRICING_VIEW: 'pricing_view',

  // Content engagement
  MODULE_START: 'module_start',
  MODULE_COMPLETE: 'module_complete',
  QUIZ_START: 'quiz_start',
  QUIZ_SUBMIT: 'quiz_submit',

  // Resource downloads
  TOOLKIT_DOWNLOAD: 'toolkit_download',
  REFERENCE_VIEW: 'reference_view',

  // Navigation
  SIDEBAR_CLICK: 'sidebar_click',
  TAB_SWITCH: 'tab_switch',

  // Search
  SEARCH_QUERY: 'search_query',

  // Preseason
  PRESEASON_CLINIC_REGISTER: 'preseason_clinic_register',
  PRESEASON_BASELINE_SUBMIT: 'preseason_baseline_submit',

  // Errors
  ERROR: 'error',
} as const

// ---------------------------------------------------------------------------
// Visit tracking — persists across sessions via localStorage
// ---------------------------------------------------------------------------

function getVisitNumber(): number {
  try {
    const raw = localStorage.getItem('analytics_visit_number')
    const current = raw ? parseInt(raw, 10) : 0
    // Increment on new session (sessionStorage key absent = new session)
    if (!sessionStorage.getItem('analytics_session_id')) {
      const next = current + 1
      localStorage.setItem('analytics_visit_number', String(next))
      return next
    }
    return current || 1
  } catch {
    return 1
  }
}

function getFirstReferrer(): string | null {
  try {
    const existing = localStorage.getItem('analytics_first_referrer')
    if (existing) return existing
    const ref = document.referrer || null
    if (ref) localStorage.setItem('analytics_first_referrer', ref)
    return ref
  } catch {
    return null
  }
}

function getUtmParams(): Record<string, string> {
  try {
    const params = new URLSearchParams(window.location.search)
    const utms: Record<string, string> = {}
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid']) {
      const val = params.get(key)
      if (val) utms[key] = val
    }
    // Persist first-touch UTMs
    if (Object.keys(utms).length > 0 && !localStorage.getItem('analytics_first_utm')) {
      localStorage.setItem('analytics_first_utm', JSON.stringify(utms))
    }
    return utms
  } catch {
    return {}
  }
}

function getFirstUtm(): Record<string, string> {
  try {
    const raw = localStorage.getItem('analytics_first_utm')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

// Client-side analytics tracking
export async function trackEvent(
  eventType: string,
  eventData: Record<string, any> = {}
): Promise<void> {
  try {
    // Get or create session ID
    let sessionId = sessionStorage.getItem('analytics_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('analytics_session_id', sessionId)
    }

    const visitNumber = getVisitNumber()
    const firstReferrer = getFirstReferrer()
    const utmParams = getUtmParams()
    const firstUtm = getFirstUtm()

    const event = {
      eventType,
      eventData: {
        ...eventData,
        visitNumber,
        ...(firstReferrer ? { firstReferrer } : {}),
        ...(Object.keys(utmParams).length > 0 ? { utm: utmParams } : {}),
        ...(Object.keys(firstUtm).length > 0 ? { firstUtm } : {}),
      },
      sessionId,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      path: window.location.pathname,
      search: window.location.search || null,
    }

    // Send to analytics API
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
      credentials: 'include',
    })
  } catch (error) {
    // Silent fail - don't disrupt user experience
    console.error('Analytics tracking failed:', error)
  }
}

// Page view tracker (call on route change)
export function trackPageView(path: string, additionalData: Record<string, any> = {}) {
  trackEvent(ANALYTICS_EVENTS.PAGE_VIEW, {
    path,
    ...additionalData,
  })
}

// Shop/conversion tracking — also fires Google Ads conversion
export function trackShopClick(source: string, additionalData: Record<string, any> = {}) {
  trackEvent(ANALYTICS_EVENTS.SHOP_CLICK, {
    source,
    timestamp: new Date().toISOString(),
    ...additionalData,
  })

  // NOTE: Do NOT fire Google Ads conversion here — this is just a click, not a purchase.
  // The real conversion fires in trackPurchaseConversion() on the success page.
  // Firing here corrupts Smart Bidding data by counting clicks as conversions.
}

// ── Google Ads conversion helpers ─────────────────────────────────────────────

const GA_CONVERSION_ID = 'AW-17984048021'

// Google Ads conversion labels — safe to hardcode (public, baked into client JS)
const CONVERSION_LABELS = {
  PURCHASE: 'xgAlCJmUyIccEJWXu_9C',
  ENROL_CLICK: 'vHoXCNKd6Y8cEJWXu_9C',   // Paid enrol button clicks (Add to cart)
  FREE_SIGNUP: 'TVzUCLHT0IccEJWXu_9C',    // Free course signups (Sign-up)
  FREE_COMPLETE: 'fcoOCLTT0IccEJWXu_9C',
  INTEREST: '74x1CLfT0IccEJWXu_9C',
}

/** SHA-256 hash a string (for enhanced conversions — Google requires hashed PII) */
async function sha256(str: string): Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str.trim().toLowerCase()))
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Wait for gtag to be loaded (afterInteractive script may not be ready immediately).
 * Polls every 100ms up to timeoutMs. Without this, conversions are silently dropped
 * when the API fetch resolves before gtag.js finishes loading.
 */
async function waitForGtag(timeoutMs = 5000): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (window.gtag) return true
  return new Promise(resolve => {
    const start = Date.now()
    const check = () => {
      if (window.gtag) return resolve(true)
      if (Date.now() - start > timeoutMs) return resolve(false)
      setTimeout(check, 100)
    }
    check()
  })
}

/**
 * Track a lead conversion (free course signup, form download, interest registration)
 * Assign a value so Google's smart bidding can optimise for high-value leads.
 */
export async function trackLeadConversion(label: string, value: number, email?: string) {
  try {
    const ready = await waitForGtag()
    if (!ready) {
      console.warn('[ads] gtag not ready — conversion dropped:', label)
      return
    }
    const params: Record<string, unknown> = {
      send_to: `${GA_CONVERSION_ID}/${label}`,
      value,
      currency: 'AUD',
    }
    // Enhanced conversions — send SHA-256 hashed email for better attribution
    // Wrapped in try-catch so a hashing failure doesn't kill the conversion
    if (email) {
      try {
        params.user_data = { sha256_email_address: await sha256(email) }
      } catch {
        // crypto.subtle unavailable (HTTP or old browser) — fire conversion without enhanced data
      }
    }
    window.gtag!('event', 'conversion', params)
    console.log('[ads] conversion fired:', label, value)
  } catch (err) {
    console.error('[ads] conversion error:', err)
  }
}

/**
 * Track interest registration as a lead
 */
export function trackInterestRegistration(city: string, email: string) {
  trackLeadConversion(CONVERSION_LABELS.INTEREST, 15, email)
  trackEvent('interest_registration', { city })
}

/**
 * Track free course completion (higher value than signup)
 */
export function trackFreeCourseCompletion(email: string) {
  trackLeadConversion(CONVERSION_LABELS.FREE_COMPLETE, 40, email)
  trackEvent('free_course_complete', {})
}

/**
 * Track purchase conversion with enhanced conversion data
 */
export async function trackPurchaseConversion(value: number, transactionId: string, email?: string) {
  try {
    const ready = await waitForGtag()
    if (!ready) {
      console.warn('[ads] gtag not ready — purchase conversion dropped')
      return
    }
    const params: Record<string, unknown> = {
      send_to: `${GA_CONVERSION_ID}/${CONVERSION_LABELS.PURCHASE}`,
      value,
      currency: 'AUD',
      transaction_id: transactionId,
    }
    if (email) {
      try {
        params.user_data = { sha256_email_address: await sha256(email) }
      } catch {
        // crypto.subtle unavailable — fire conversion without enhanced data
      }
    }
    window.gtag!('event', 'conversion', params)
    console.log('[ads] purchase conversion fired:', value, transactionId)
  } catch (err) {
    console.error('[ads] purchase conversion error:', err)
  }
}

// Type declaration for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

// Module progress tracking
export function trackModuleProgress(
  moduleId: string,
  action: 'start' | 'complete',
  additionalData: Record<string, any> = {}
) {
  const eventType = action === 'start' ? ANALYTICS_EVENTS.MODULE_START : ANALYTICS_EVENTS.MODULE_COMPLETE
  trackEvent(eventType, {
    moduleId,
    action,
    ...additionalData,
  })
}

// Download tracking
export function trackDownload(
  fileName: string,
  category: string,
  additionalData: Record<string, any> = {}
) {
  trackEvent(ANALYTICS_EVENTS.TOOLKIT_DOWNLOAD, {
    fileName,
    category,
    timestamp: new Date().toISOString(),
    ...additionalData,
  })
}

// Search tracking
export function trackSearch(query: string, results: number) {
  trackEvent(ANALYTICS_EVENTS.SEARCH_QUERY, {
    query,
    results,
    timestamp: new Date().toISOString(),
  })
}

// Error tracking
export function trackError(
  errorType: string,
  errorMessage: string,
  additionalData: Record<string, any> = {}
) {
  trackEvent(ANALYTICS_EVENTS.ERROR, {
    errorType,
    errorMessage,
    stack: new Error().stack,
    ...additionalData,
  })
}
