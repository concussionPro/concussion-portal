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
  VIDEO_PLAY: 'video_play',
  VIDEO_COMPLETE: 'video_complete',
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

  // Errors
  ERROR: 'error',
} as const

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

    const event = {
      eventType,
      eventData,
      sessionId,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      path: window.location.pathname,
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

// Shop/conversion tracking
export function trackShopClick(source: string, additionalData: Record<string, any> = {}) {
  trackEvent(ANALYTICS_EVENTS.SHOP_CLICK, {
    source,
    timestamp: new Date().toISOString(),
    ...additionalData,
  })
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
