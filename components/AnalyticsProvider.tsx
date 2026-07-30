'use client';

import { createContext, useContext, useEffect, useRef, useCallback, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// ---------------------------------------------------------------------------
// Session ID helper
// ---------------------------------------------------------------------------

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  const KEY = 'cea_session_id';
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

// ---------------------------------------------------------------------------
// UTM Parameter Tracking
// ---------------------------------------------------------------------------

const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'] as const;
const UTM_STORAGE_KEY = 'cea_utm';

function captureUtmParams(): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const hasTracking = UTM_PARAMS.some(k => params.has(k));
  if (!hasTracking) return;

  const utm: Record<string, string> = {};
  UTM_PARAMS.forEach(k => {
    const v = params.get(k);
    if (v) utm[k] = v;
  });
  sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
}

function getUtmParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AnalyticsContextValue {
  trackEvent: (eventType: string, eventData?: Record<string, unknown>) => void;
  // Convenience helpers
  trackEnrolClick: (courseId: string, courseName: string) => void;
  trackCourseView: (courseId: string, courseName: string) => void;
  trackContactForm: (formType: string) => void;
  trackDownload: (fileName: string, fileType: string) => void;
  trackSearch: (query: string, resultCount: number) => void;
  trackExternalLink: (url: string, linkText: string) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function useAnalytics(): AnalyticsContextValue {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error('useAnalytics must be used within AnalyticsProvider');
  return ctx;
}

// ---------------------------------------------------------------------------
// Core tracking function
// ---------------------------------------------------------------------------

async function sendEvent(
  eventType: string,
  eventData: Record<string, unknown>,
  path: string,
  search: string | null
): Promise<void> {
  if (typeof window === 'undefined') return;

  const sessionId = getOrCreateSessionId();

  const utm = getUtmParams();
  const payload = {
    eventType,
    eventData: { ...eventData, ...(Object.keys(utm).length > 0 ? { utm } : {}) },
    sessionId,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    referrer: document.referrer || null,
    path,
    search: search || null,
  };

  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // Fire-and-forget is fine; suppress errors silently
      keepalive: true,
    });
  } catch {
    // Analytics should never break the user experience
  }
}

// ---------------------------------------------------------------------------
// Google Ads conversion tracking helper
// ---------------------------------------------------------------------------


function trackGtagConversion(
  conversionId: string,
  conversionLabel: string,
  value?: number,
  currency?: string
): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'conversion', {
    send_to: `${conversionId}/${conversionLabel}`,
    ...(value !== undefined ? { value, currency: currency ?? 'AUD' } : {}),
  });
}

// ---------------------------------------------------------------------------
// AnalyticsTracker — tracks pageviews on route change
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Google Ads remarketing — fire audience signals on high-intent pages
// ---------------------------------------------------------------------------

const REMARKETING_PAGES: Record<string, string> = {
  '/pricing': 'pricing_page_viewer',
  '/pricing-international': 'pricing_page_viewer',
  '/preview': 'course_explorer',
  '/scat-mastery': 'free_course_viewer',
  '/course': 'course_page_viewer',
  '/preseason': 'preseason_visitor',
  '/preseason/register': 'preseason_registrant',
  '/checkout/success': 'purchaser',
};

function fireRemarketingEvent(pathname: string): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  // Exact match
  const event = REMARKETING_PAGES[pathname];
  if (event) {
    window.gtag('event', event, {
      send_to: 'AW-17984048021',
      page_path: pathname,
    });
    return;
  }
  // Prefix match for preseason baseline pages
  if (pathname.startsWith('/preseason/b/')) {
    window.gtag('event', 'baseline_test_user', {
      send_to: 'AW-17984048021',
      page_path: pathname,
    });
  }
}

// ---------------------------------------------------------------------------
// Scroll depth tracking — fires at 50% and 90% on key pages
// ---------------------------------------------------------------------------

const SCROLL_TRACKED_PAGES = ['/pricing', '/pricing-international', '/course', '/preview', '/scat-mastery', '/concussion-rehab-mastery', '/uk', '/clinics'];

function useScrollDepthTracking(pathname: string): void {
  const firedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!SCROLL_TRACKED_PAGES.includes(pathname)) return;
    firedRef.current = new Set(); // Reset on page change

    const thresholds = [50, 90];

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const pct = Math.round((window.scrollY / scrollHeight) * 100);

      for (const t of thresholds) {
        if (pct >= t && !firedRef.current.has(t)) {
          firedRef.current.add(t);
          // Fire to internal analytics
          sendEvent('scroll_depth', { depth: t, page: pathname }, pathname, null);
          // Fire to GA4/Google Ads for audience building
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'scroll_depth', {
              percent_scrolled: t,
              page_path: pathname,
            });
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);
}

function AnalyticsTracker(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPathRef = useRef<string | null>(null);

  // Track scroll depth on key conversion pages
  useScrollDepthTracking(pathname);

  useEffect(() => {
    // Capture UTM params from URL on every navigation (persists first seen)
    captureUtmParams();

    const search = searchParams.toString() ? `?${searchParams.toString()}` : null;
    const currentPath = pathname + (search ?? '');

    // Avoid double-firing on mount if pathname hasn't changed
    if (previousPathRef.current === currentPath) return;
    previousPathRef.current = currentPath;

    sendEvent('page_view', {}, pathname, search);

    // Fire Google Ads remarketing audience event for high-intent pages
    fireRemarketingEvent(pathname);
  }, [pathname, searchParams]);

  // Exit beacon (Zac 2026-06-17): fire a `page_exit` event on tab-close / SPA
  // route-change so single-pageview sessions get a REAL duration. Session
  // duration is computed as lastEvent − firstEvent, so a one-pageview visit
  // (the cold-outreach /p/<slug> pattern — read one page for 34s, then leave)
  // measured 0s → the "Avg. Session 1s" mismatch vs the 34s dwell reads.
  // Scanners don't run pagehide/visibilitychange JS, so they never emit this;
  // their sessions stay ~0s, making Avg. Session scanner-resistant. page_exit
  // is NOT a page_view, so pageview/bounce counts are unaffected.
  useEffect(() => {
    const enter = Date.now();
    let fired = false;
    const fireExit = () => {
      if (fired) return;
      const dwellMs = Date.now() - enter;
      if (dwellMs < 1000) return; // ignore instant bounces / scanner pings
      fired = true;
      sendEvent('page_exit', { dwellMs }, pathname, null);
    };
    const onVis = () => { if (document.visibilityState === 'hidden') fireExit(); };
    window.addEventListener('pagehide', fireExit);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pagehide', fireExit);
      document.removeEventListener('visibilitychange', onVis);
      fireExit(); // SPA navigation away from this page counts as an exit
    };
  }, [pathname]);

  return null;
}

// ---------------------------------------------------------------------------
// AnalyticsProvider
// ---------------------------------------------------------------------------

export function AnalyticsProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const pathname = usePathname();
  // NOTE: useSearchParams() intentionally NOT used here.
  // It triggers Suspense, and since this provider wraps the entire app tree,
  // the Suspense fallback={null} in layout.tsx causes the whole page to flash blank.
  // Instead, read window.location.search at call-time for event tracking.

  const trackEvent = useCallback(
    (eventType: string, eventData: Record<string, unknown> = {}): void => {
      const search =
        typeof window !== 'undefined' && window.location.search
          ? window.location.search
          : null;
      sendEvent(eventType, eventData, pathname, search);
    },
    [pathname]
  );

  // ---- Convenience helpers ------------------------------------------------

  const trackEnrolClick = useCallback(
    (courseId: string, courseName: string): void => {
      trackEvent('enrol_click', { courseId, courseName });

      // Google Ads enrol click conversion (ENROL_CLICK label, not FREE_SIGNUP)
      trackGtagConversion(
        'AW-17984048021',
        'vHoXCNKd6Y8cEJWXu_9C',
        undefined,
        undefined
      );
    },
    [trackEvent]
  );

  const trackCourseView = useCallback(
    (courseId: string, courseName: string): void => {
      trackEvent('course_view', { courseId, courseName });
    },
    [trackEvent]
  );

  const trackContactForm = useCallback(
    (formType: string): void => {
      trackEvent('contact_form_submit', { formType });
    },
    [trackEvent]
  );

  const trackDownload = useCallback(
    (fileName: string, fileType: string): void => {
      trackEvent('download', { fileName, fileType });
    },
    [trackEvent]
  );

  const trackSearch = useCallback(
    (query: string, resultCount: number): void => {
      trackEvent('search', { query, resultCount });
    },
    [trackEvent]
  );

  const trackExternalLink = useCallback(
    (url: string, linkText: string): void => {
      trackEvent('external_link_click', { url, linkText });
    },
    [trackEvent]
  );

  const value: AnalyticsContextValue = {
    trackEvent,
    trackEnrolClick,
    trackCourseView,
    trackContactForm,
    trackDownload,
    trackSearch,
    trackExternalLink,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
      {children}
    </AnalyticsContext.Provider>
  );
}
