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

  const payload = {
    eventType,
    eventData,
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

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

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

function AnalyticsTracker(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    const search = searchParams.toString() ? `?${searchParams.toString()}` : null;
    const currentPath = pathname + (search ?? '');

    // Avoid double-firing on mount if pathname hasn't changed
    if (previousPathRef.current === currentPath) return;
    previousPathRef.current = currentPath;

    sendEvent('pageview', {}, pathname, search);
  }, [pathname, searchParams]);

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
  const searchParams = useSearchParams();

  const trackEvent = useCallback(
    (eventType: string, eventData: Record<string, unknown> = {}): void => {
      const search = searchParams.toString()
        ? `?${searchParams.toString()}`
        : null;
      sendEvent(eventType, eventData, pathname, search);
    },
    [pathname, searchParams]
  );

  // ---- Convenience helpers ------------------------------------------------

  const trackEnrolClick = useCallback(
    (courseId: string, courseName: string): void => {
      trackEvent('enrol_click', { courseId, courseName });

      // Google Ads conversion
      trackGtagConversion(
        process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? '',
        process.env.NEXT_PUBLIC_ENROL_CONVERSION_LABEL ?? '',
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
